import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { notifyBrevo } from "../_shared/brevo-notify.ts";
import { sendWelcomeMail } from "../_shared/welcome-mail.ts";
import { verifyIpnSignature, parseIpnForm, stripIpnCredentials, isManualMembership } from '../_shared/digistore-security.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Event type mapping from Digistore24 to internal types
const EVENT_TYPE_MAP: Record<string, string> = {
  // Purchase events
  'on_payment': 'PURCHASE',
  'on_payment_complete': 'PURCHASE',
  'payment': 'PURCHASE',
  'order_complete': 'PURCHASE',
  // Renewal events
  'on_rebill_resumed': 'RENEWAL',
  'on_rebill': 'RENEWAL',
  'rebilling': 'RENEWAL',
  'rebill_payment': 'RENEWAL',
  // Cancellation events
  'on_rebill_cancelled': 'CANCELLATION',
  'on_refund_request': 'CANCELLATION',
  'subscription_cancelled': 'CANCELLATION',
  'cancel': 'CANCELLATION',
  // Refund events
  'on_refund': 'REFUND',
  'refund': 'REFUND',
  'refund_complete': 'REFUND',
  // Chargeback events
  'on_chargeback': 'CHARGEBACK',
  'chargeback': 'CHARGEBACK',
  // Additional Digistore24 event names
  'on_upgrade': 'PURCHASE',
  'on_upgrade_complete': 'PURCHASE',
  'on_affiliation': 'UNKNOWN',
  'connection_test': 'UNKNOWN',
  'on_payment_missed': 'UNKNOWN',
  'last_paid_day': 'UNKNOWN',
  'payment_denial': 'UNKNOWN',
};

interface NormalizedPayload {
  event_type: string;
  order_id: string;
  subscription_id: string | null;
  product_id: string;
  email: string;
  first_name: string;
  last_name: string;
  language: string;
  purchase_time: string | null;
  period_start: string | null;
  period_end: string | null;
  amount: number | null;
  currency: string;
}

// Parse incoming payload (supports JSON and form-urlencoded)
async function parsePayload(req: Request): Promise<Record<string, any>> {
  const contentType = req.headers.get("content-type") || "";
  
  if (contentType.includes("application/json")) {
    return await req.json();
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    return parseIpnForm(text);
  } else {
    // Try JSON first, then form-urlencoded
    const text = await req.text();
    try {
      return JSON.parse(text);
    } catch {
      return parseIpnForm(text);
    }
  }
}

// Normalize Digistore24 payload to internal format
function normalizePayload(raw: Record<string, any>): NormalizedPayload {
  // Digistore24 uses various field names, handle all possibilities
  const eventName = (
    raw.event || 
    raw.event_type || 
    raw.action || 
    raw.type || 
    ''
  ).toLowerCase();
  
  let eventType = EVENT_TYPE_MAP[eventName] ?? 'UNKNOWN';

  // Unknown/missed/denied payments must never be inferred to be successful purchases.
  
  return {
    event_type: eventType,
    order_id: raw.order_id || raw.orderId || raw.id || '',
    subscription_id: raw.subscription_id || raw.subscriptionId || raw.rebill_id || null,
    product_id: raw.product_id || raw.productId || raw.product || '',
    email: (raw.email || raw.buyer_email || raw.customer_email || '').toLowerCase().trim(),
    first_name: raw.first_name || raw.firstName || raw.buyer_first_name || '',
    last_name: raw.last_name || raw.lastName || raw.buyer_last_name || '',
    language: (raw.language || raw.lang || raw.locale || 'de').substring(0, 2).toLowerCase(),
    purchase_time: raw.purchase_time || raw.order_date || raw.created_at || null,
    period_start: raw.period_start || raw.subscription_start || raw.rebill_start || null,
    period_end: raw.period_end || raw.subscription_end || raw.next_rebill_at || null,
    amount: raw.amount ? parseFloat(raw.amount) : (raw.total ? parseFloat(raw.total) : null),
    currency: raw.currency || 'EUR',
  };
}

// Generate idempotency key
function generateIdempotencyKey(raw: Record<string, any>, normalized: NormalizedPayload): string {
  // Use Digistore's event ID if available
  if (raw.event_id || raw.eventId) {
    return `ds24_${raw.event_id || raw.eventId}`;
  }
  
  // Otherwise generate from event details
  const parts = [
    normalized.event_type,
    normalized.order_id,
    normalized.subscription_id || 'nosub',
    normalized.product_id,
    raw.sha_sign,
  ];
  
  return `ds24_${parts.join('_')}`;
}

// Get setting from DB or fallback to ENV
async function getSetting(
  supabase: any, 
  key: string, 
  envFallback?: string
): Promise<string | null> {
  const { data } = await supabase
    .from('digistore24_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  
  if (data?.value) return data.value;
  if (envFallback) return Deno.env.get(envFallback) || null;
  return null;
}

// Look up an auth user by exact email. GoTrue ignores unknown filters, so never trust users[0].
async function findUserByEmail(email: string, supabaseUrl: string, serviceKey: string) {
  const target = (email || "").toLowerCase().trim();
  if (!target) return null;
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?filter=${encodeURIComponent(target)}&per_page=200`,
    { headers },
  );
  if (res.ok) {
    const body = await res.json();
    const match = (body?.users ?? []).find((u: any) => (u.email || "").toLowerCase().trim() === target);
    if (match) return match;
  } else {
    console.warn(`[IPN] user filter query failed [${res.status}]`);
  }

  for (let page = 1; page <= 40; page++) {
    const pageRes = await fetch(`${supabaseUrl}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
    if (!pageRes.ok) break;
    const body = await pageRes.json();
    const users = body?.users ?? [];
    const match = users.find((u: any) => (u.email || "").toLowerCase().trim() === target);
    if (match) return match;
    if (users.length < 200) break;
  }
  return null;
}

// Process the IPN event (main business logic)
async function processIpnEvent(
  supabase: any,
  eventId: string,
  normalized: NormalizedPayload,
  settings: { appBaseUrl: string; defaultLocale: string },
  rawPayload: Record<string, any>
): Promise<void> {
  console.log(`Processing IPN event ${eventId}:`, normalized.event_type);
  
  // Update status to processing
  await supabase
    .from('digistore24_ipn_events')
    .update({ status: 'processing' })
    .eq('id', eventId);
  
  try {
    if (normalized.event_type === 'UNKNOWN') {
      await supabase.from('digistore24_ipn_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('id', eventId);
      return;
    }
    // 1. Find product mapping
    const { data: product, error: productError } = await supabase
      .from('digistore24_products')
      .select('*')
      .eq('digistore_product_id', normalized.product_id)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!product) {
      console.warn(`[IPN] Unknown product ID: ${normalized.product_id} — marking event as processed without plan assignment`);

      // Still keep the buyer as a customer so nobody gets lost
      if (normalized.email) {
        const { data: knownCust } = await supabase
          .from('digistore24_customers')
          .select('id')
          .eq('email', normalized.email)
          .maybeSingle();
        if (!knownCust) {
          await supabase.from('digistore24_customers').insert({
            email: normalized.email,
            first_name: normalized.first_name || null,
            last_name: normalized.last_name || null,
            total_purchases: normalized.event_type === 'PURCHASE' ? 1 : 0,
            total_revenue: normalized.amount || 0,
            first_purchase_at: new Date().toISOString(),
            last_purchase_at: new Date().toISOString(),
          });
        }
      }

      await supabase
        .from('digistore24_ipn_events')
        .update({ 
          status: 'processed',
          processed_at: new Date().toISOString(),
          error_message: `unknown_product: ${normalized.product_id}`,
        })
        .eq('id', eventId);
      return; // Don't throw — return gracefully so DS24 stays happy
    }
    
    // 2. Find or create user by email
    let userId: string;
    let isNewUser = false;
    let userLocale = normalized.language;
    
    // Check if user exists via GoTrue REST API with email filter — O(1) statt O(n)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
    const existingUser = await findUserByEmail(normalized.email, supabaseUrl, supabaseServiceKey);
    
    if (existingUser) {
      userId = existingUser.id;
      // Get user's preferred locale from preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('language')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (prefs?.language) {
        userLocale = prefs.language;
      }
    } else {
      // Create new user (no password - they'll use magic link)
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: normalized.email,
        email_confirm: false,
        user_metadata: {
          first_name: normalized.first_name,
          last_name: normalized.last_name,
          display_name: `${normalized.first_name} ${normalized.last_name}`.trim() || normalized.email.split('@')[0],
        },
      });
      
      if (createError) throw createError;
      if (!newUser?.user) throw new Error('Account creation failed');
      userId = newUser.user.id;
      isNewUser = true;
      
      // Set user locale preference
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          language: userLocale || settings.defaultLocale,
        }, { onConflict: 'user_id' });
    }
    
    // 3. Upsert subscription
    const subscriptionData: Record<string, any> = {
      user_id: userId,
      digistore_order_id: normalized.order_id,
      digistore_subscription_id: normalized.subscription_id,
      digistore_product_id: normalized.product_id,
    };
    
    if (normalized.period_start) {
      subscriptionData.current_period_start = new Date(normalized.period_start).toISOString();
    }
    if (normalized.period_end) {
      subscriptionData.current_period_end = new Date(normalized.period_end).toISOString();
    }
    
    // Set status based on event type
    switch (normalized.event_type) {
      case 'PURCHASE':
      case 'RENEWAL':
        subscriptionData.status = 'active';
        subscriptionData.cancel_at_period_end = false;
        break;
      case 'CANCELLATION':
        if (product.access_policy === 'IMMEDIATE_REVOKE') {
          subscriptionData.status = 'cancelled';
        } else {
          subscriptionData.cancel_at_period_end = true;
        }
        break;
      case 'REFUND':
        subscriptionData.status = 'refunded';
        break;
      case 'CHARGEBACK':
        subscriptionData.status = 'chargeback';
        break;
    }
    
    const { data: subscription, error: subError } = await supabase
      .from('digistore24_subscriptions')
      .upsert(subscriptionData, { 
        onConflict: 'digistore_order_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();
    
    if (subError) throw subError;
    
    // 4. Handle entitlements
    const entitlementKey = product.entitlement_key;
    
    // Check if entitlement was previously active
    const { data: existingEntitlement } = await supabase
      .from('digistore24_entitlements')
      .select('*')
      .eq('user_id', userId)
      .eq('entitlement_key', entitlementKey)
      .eq('source', 'digistore24')
      .maybeSingle();
    
    const wasActiveEntitlement = existingEntitlement?.active === true;
    
    const entitlementData: Record<string, any> = {
      user_id: userId,
      entitlement_key: entitlementKey,
      source: 'digistore24',
      subscription_id: subscription.id,
    };
    
    switch (normalized.event_type) {
      case 'PURCHASE':
      case 'RENEWAL':
        entitlementData.active = true;
        entitlementData.valid_until = normalized.period_end 
          ? new Date(normalized.period_end).toISOString() 
          : null;
        break;
      case 'CANCELLATION':
        if (product.access_policy === 'IMMEDIATE_REVOKE') {
          entitlementData.active = false;
        } else {
          // Keep active until period end
          entitlementData.active = true;
          entitlementData.valid_until = normalized.period_end 
            ? new Date(normalized.period_end).toISOString() 
            : null;
        }
        break;
      case 'REFUND':
      case 'CHARGEBACK':
        // Always revoke on refund/chargeback regardless of policy
        entitlementData.active = false;
        break;
    }
    
    const { error: entitlementError } = await supabase
      .from('digistore24_entitlements')
      .upsert(entitlementData, { 
        onConflict: 'user_id,entitlement_key,source',
        ignoreDuplicates: false 
      });
    
    // Recompute from all active entitlements; preserve manual overrides and other purchases.
    const { error: membershipError } = await supabase.rpc('refresh_digistore_membership', { p_user_id: userId });
    if (membershipError) throw membershipError;

    // 6. Send welcome email for new purchases (first-time activation)
    const shouldSendEmail = 
      (normalized.event_type === 'PURCHASE' && !wasActiveEntitlement) || 
      isNewUser;
    
    if (shouldSendEmail) {
      try {
        await sendWelcomeMail(supabase, {
          email: normalized.email,
          firstName: normalized.first_name,
          locale: userLocale || settings.defaultLocale,
          appBaseUrl: settings.appBaseUrl,
          productName: product.name,
        });
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the whole process for email errors
      }
    }

    // 6b. Push purchase/plan update to App B (fire-and-forget)
    if (['PURCHASE', 'RENEWAL', 'REFUND', 'CHARGEBACK', 'CANCELLATION'].includes(normalized.event_type)) {
      try {
        const pushSyncUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/push-sync`;
        await fetch(pushSyncUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: `PURCHASE_${normalized.event_type}`,
            user_email: normalized.email,
            user_id: userId,
            plan_key: product.plan_key || 'FREE',
            product_id: normalized.product_id,
            product_name: product.name,
            order_id: normalized.order_id,
            amount: normalized.amount,
            currency: normalized.currency,
            period_end: normalized.period_end,
          }),
        });
      } catch (syncErr) {
        console.warn('[Sync] Failed to push purchase to App B:', syncErr);
        // Never fail IPN processing for sync errors
      }
    }
    
    // 7. Upsert into digistore24_customers
    try {
      const customerData: Record<string, any> = {
        email: normalized.email,
        first_name: normalized.first_name || null,
        last_name: normalized.last_name || null,
      };

      const { data: existingCust } = await supabase
        .from('digistore24_customers')
        .select('id, total_purchases, total_revenue')
        .eq('email', normalized.email)
        .maybeSingle();

      if (existingCust) {
        const newPurchases = ['PURCHASE'].includes(normalized.event_type) ? 1 : 0;
        const newRevenue = ['PURCHASE', 'RENEWAL'].includes(normalized.event_type) ? (normalized.amount || 0) : 0;
        await supabase
          .from('digistore24_customers')
          .update({
            ...customerData,
            total_purchases: existingCust.total_purchases + newPurchases,
            total_revenue: parseFloat(String(existingCust.total_revenue)) + newRevenue,
            last_purchase_at: new Date().toISOString(),
          })
          .eq('id', existingCust.id);
      } else {
        await supabase
          .from('digistore24_customers')
          .insert({
            ...customerData,
            total_purchases: ['PURCHASE'].includes(normalized.event_type) ? 1 : 0,
            total_revenue: ['PURCHASE', 'RENEWAL'].includes(normalized.event_type) ? (normalized.amount || 0) : 0,
            first_purchase_at: new Date().toISOString(),
            last_purchase_at: new Date().toISOString(),
          });
      }

      // 7b. Push customer to Brevo (non-blocking)
      if (['PURCHASE', 'RENEWAL'].includes(normalized.event_type)) {
        await notifyBrevo({
          email: normalized.email,
          first_name: normalized.first_name || null,
          language: null,
          segment: 'customer',
          source: 'digistore24',
          is_customer: true,
        });
      }

      // 8. Upsert into digistore24_transactions
      const { data: cust } = await supabase
        .from('digistore24_customers')
        .select('id')
        .eq('email', normalized.email)
        .maybeSingle();

      const txStatus = normalized.event_type === 'REFUND' ? 'refunded' 
        : normalized.event_type === 'CHARGEBACK' ? 'chargeback'
        : normalized.event_type === 'CANCELLATION' ? 'cancelled'
        : 'completed';

      await supabase
        .from('digistore24_transactions')
        .upsert({
          digistore_transaction_id: normalized.order_id + '_' + normalized.event_type,
          customer_id: cust?.id || null,
          product_id: normalized.product_id,
          product_name: product.name,
          amount: normalized.amount,
          currency: normalized.currency,
          status: txStatus,
          pay_date: normalized.purchase_time ? new Date(normalized.purchase_time).toISOString() : new Date().toISOString(),
          refund_date: ['REFUND', 'CHARGEBACK'].includes(normalized.event_type) ? new Date().toISOString() : null,
          raw_data: rawPayload,
        }, { onConflict: 'digistore_transaction_id' });
    } catch (custError) {
      console.error('Error writing to customers/transactions tables:', custError);
      // Don't fail the main flow
    }

    // 9. Upsert lead into CRM for PURCHASE events
    if (['PURCHASE', 'RENEWAL'].includes(normalized.event_type)) {
      try {
        const leadName = [normalized.first_name, normalized.last_name].filter(Boolean).join(' ').trim() || null;
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id, total_purchases')
          .eq('email', normalized.email)
          .maybeSingle();

        if (existingLead) {
          await supabase
            .from('leads')
            .update({
              name: leadName || undefined,
              first_name: normalized.first_name || undefined,
              stage: 'customer',
              last_contact_at: new Date().toISOString(),
              converted_at: existingLead?.converted_at || new Date().toISOString(),
              product_interest: product.name,
              source: 'digistore24',
              lifetime_value: (existingLead as any).lifetime_value
                ? ((existingLead as any).lifetime_value + (normalized.amount || 0))
                : (normalized.amount || 0),
            })
            .eq('id', existingLead.id);
        } else {
          await supabase
            .from('leads')
            .insert({
              email: normalized.email,
              name: leadName,
              first_name: normalized.first_name || null,
              stage: 'customer',
              source: 'digistore24',
              language: normalized.language || 'de',
              product_interest: product.name,
              converted_at: new Date().toISOString(),
              last_contact_at: new Date().toISOString(),
              lifetime_value: normalized.amount || 0,
            });
        }
        console.log(`[leads] Upserted lead for ${normalized.email}`);
      } catch (leadErr) {
        console.error('Error writing to leads table:', leadErr);
      }
    }

    // 10. Create shipment entry for PURCHASE events with address data
    if (normalized.event_type === 'PURCHASE') {
      try {
        // Extract address fields from raw payload
        const street = rawPayload.shipping_street || rawPayload.billing_street || rawPayload.street || rawPayload.address || null;
        const zip = rawPayload.shipping_zip || rawPayload.billing_zip || rawPayload.zip || rawPayload.postal_code || null;
        const city = rawPayload.shipping_city || rawPayload.billing_city || rawPayload.city || null;
        const country = rawPayload.shipping_country || rawPayload.billing_country || rawPayload.country || 'AT';
        const addressFull = rawPayload.shipping_address || rawPayload.billing_address || null;
        const phone = rawPayload.phone || rawPayload.buyer_phone || null;

        const customerName = [normalized.first_name, normalized.last_name].filter(Boolean).join(' ').trim()
          || normalized.email.split('@')[0];

        // Check if shipment already exists for this transaction
        const { data: existingShipment } = await supabase
          .from('digistore24_shipments')
          .select('id')
          .eq('transaction_id', normalized.order_id)
          .maybeSingle();

        if (!existingShipment) {
          await supabase
            .from('digistore24_shipments')
            .insert({
              transaction_id: normalized.order_id,
              order_id: normalized.order_id,
              customer_name: customerName,
              customer_email: normalized.email,
              product_name: product.name,
              product_id: normalized.product_id,
              quantity: 1,
              address_street: street,
              address_zip: zip,
              address_city: city,
              address_country: country,
              address_full: addressFull,
              status: 'pending',
              notes: phone ? `Tel: ${phone}` : null,
              raw_data: rawPayload,
            });
          console.log(`[shipments] Created shipment for order ${normalized.order_id}`);
        }
      } catch (shipErr) {
        console.error('Error writing to shipments table:', shipErr);
      }
    }

    // Mark as processed
    await supabase
      .from('digistore24_ipn_events')
      .update({ 
        status: 'processed',
        processed_at: new Date().toISOString(),
      })
      .eq('id', eventId);
    
    console.log(`Successfully processed IPN event ${eventId}`);
    
  } catch (error: any) {
    console.error(`Error processing IPN event ${eventId}:`, error);
    
    await supabase
      .from('digistore24_ipn_events')
      .update({ 
        status: 'error',
        error_message: error.message || String(error),
      })
      .eq('id', eventId);
    
    throw error;
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Digistore24 sends GET requests as health checks — respond with 200
  if (req.method === "GET") {
    return new Response("ok", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
  }
  
  // Only accept POST for actual IPN events
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
  
  let rawPayload: Record<string, any>;
  
  try {
    rawPayload = await parsePayload(req);
    if (!rawPayload || typeof rawPayload !== "object" || Array.isArray(rawPayload)) throw new Error("Invalid payload");
  } catch (parseError) {
    console.error("Failed to parse payload:", parseError);
    return new Response("ok", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
  }
  
  try {
    // Get settings
    const ipnSecret = await getSetting(supabase, 'ipn_secret', 'DIGISTORE24_IPN_SECRET');
    const appBaseUrl = await getSetting(supabase, 'app_base_url', 'APP_BASE_URL') || 'https://trumpetstar.lovable.app';
    const defaultLocale = await getSetting(supabase, 'default_locale') || 'de';
    
    // Fail closed before any event is stored or processed, including missing configuration.
    if (!await verifyIpnSignature(rawPayload, ipnSecret)) {
      console.warn("Invalid IPN secret provided, payload keys:", Object.keys(rawPayload));
      
      return new Response(JSON.stringify({ error: ipnSecret ? 'Invalid IPN authentication' : 'IPN authentication not configured' }), {
        status: ipnSecret ? 401 : 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!rawPayload || Array.isArray(rawPayload)) throw new Error('Invalid IPN payload');
    const normalized = normalizePayload(rawPayload);
    if (normalized.event_type !== 'UNKNOWN' &&
        (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email) ||
         !/^\d{1,20}$/.test(normalized.product_id) || !normalized.order_id || normalized.order_id.length > 200)) {
      return new Response(JSON.stringify({ error: 'Invalid purchase fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const idempotencyKey = generateIdempotencyKey(rawPayload, normalized);
    rawPayload = stripIpnCredentials(rawPayload);
    
    // Check idempotency
    const { data: existingEvent } = await supabase
      .from('digistore24_ipn_events')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    
    if (existingEvent && existingEvent.status !== "error") {
      console.log(`Duplicate event detected: ${idempotencyKey}, status: ${existingEvent.status}`);
      return new Response("ok", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
    }
    
    // Store event
    const { data: insertedEvent, error: insertError } = existingEvent ? { data: existingEvent, error: null } : await supabase
      .from('digistore24_ipn_events')
      .insert({
        idempotency_key: idempotencyKey,
        event_type: normalized.event_type || 'UNKNOWN',
        order_id: normalized.order_id,
        subscription_id: normalized.subscription_id,
        product_id: normalized.product_id,
        email: normalized.email,
        raw_payload: rawPayload,
        normalized_payload: normalized,
        status: 'received',
      })
      .select()
      .single();
    
    if (insertError) {
      if (insertError.code === '23505') {
        // Race condition duplicate — still OK
        return new Response("ok", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
      }
      throw insertError;
    }
    
    const ipnEvent = insertedEvent;
    if (!ipnEvent) throw new Error("Event persistence failed");
    // Sofort 200 zurückgeben — Digistore24 bekommt Antwort vor Timeout
    const ipnResponse = new Response("ok", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });

    // Verarbeitung im Hintergrund (fire-and-forget) — Deno hält die Funktion am Leben
    const processing = processIpnEvent(
      supabase, ipnEvent.id, normalized, { appBaseUrl, defaultLocale }, rawPayload
    ).then(() => {
      console.log(`IPN event ${ipnEvent.id} processed successfully`);
    }).catch((processingError: any) => {
      console.error('IPN processing error (non-fatal for DS24):', processingError?.message || processingError);
    });

    EdgeRuntime.waitUntil(processing);

    return ipnResponse;
    
  } catch (error: any) {
    console.error("IPN handler error:", error);
    // Always 200 — never let DS24 see a 5xx which triggers deactivation
    return new Response("ok", { status: 200, headers: { ...corsHeaders, "Content-Type": "text/plain" } });
  }
});
