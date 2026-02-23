import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const params = new URLSearchParams(text);
    const result: Record<string, any> = {};
    for (const [key, value] of params.entries()) {
      result[key] = value;
    }
    return result;
  } else {
    // Try JSON first, then form-urlencoded
    const text = await req.text();
    try {
      return JSON.parse(text);
    } catch {
      const params = new URLSearchParams(text);
      const result: Record<string, any> = {};
      for (const [key, value] of params.entries()) {
        result[key] = value;
      }
      return result;
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
  
  const eventType = EVENT_TYPE_MAP[eventName] || 'UNKNOWN';
  
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
    raw.event_time || raw.timestamp || Date.now().toString(),
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

// Validate IPN secret
function validateSecret(payload: Record<string, any>, expectedSecret: string): boolean {
  if (!expectedSecret) return true; // No secret configured = skip validation
  
  const providedSecret = 
    payload.sha_sign || 
    payload.passphrase || 
    payload.secret || 
    payload.api_key ||
    payload.ipn_passphrase;
  
  return providedSecret === expectedSecret;
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
    // 1. Find product mapping
    const { data: product, error: productError } = await supabase
      .from('digistore24_products')
      .select('*')
      .eq('digistore_product_id', normalized.product_id)
      .eq('is_active', true)
      .maybeSingle();
    
    if (!product) {
      throw new Error(`unknown_product: ${normalized.product_id}`);
    }
    
    // 2. Find or create user by email
    let userId: string;
    let isNewUser = false;
    let userLocale = normalized.language;
    
    // Check if user exists via auth.users (use admin API)
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email?.toLowerCase() === normalized.email
    );
    
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
        email_confirm: true,
        user_metadata: {
          first_name: normalized.first_name,
          last_name: normalized.last_name,
          display_name: `${normalized.first_name} ${normalized.last_name}`.trim() || normalized.email.split('@')[0],
        },
      });
      
      if (createError) throw createError;
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
    
    await supabase
      .from('digistore24_entitlements')
      .upsert(entitlementData, { 
        onConflict: 'user_id,entitlement_key,source',
        ignoreDuplicates: false 
      });
    
    // 5. Update user_memberships for app-wide plan access
    if (product.plan_key && product.plan_key !== 'FREE') {
      // Get plan rank
      const { data: plan } = await supabase
        .from('plans')
        .select('rank')
        .eq('key', product.plan_key)
        .maybeSingle();
      
      const planRank = plan?.rank || 0;
      
      if (['PURCHASE', 'RENEWAL'].includes(normalized.event_type)) {
        await supabase
          .from('user_memberships')
          .upsert({
            user_id: userId,
            plan_key: product.plan_key,
            plan_rank: planRank,
            active_product_ids: [normalized.product_id],
          }, { onConflict: 'user_id' });
      } else if (['REFUND', 'CHARGEBACK'].includes(normalized.event_type) || 
                 (normalized.event_type === 'CANCELLATION' && product.access_policy === 'IMMEDIATE_REVOKE')) {
        // Downgrade to FREE
        await supabase
          .from('user_memberships')
          .upsert({
            user_id: userId,
            plan_key: 'FREE',
            plan_rank: 0,
            active_product_ids: [],
          }, { onConflict: 'user_id' });
      }
    }
    
    // 6. Send welcome email for new purchases (first-time activation)
    const shouldSendEmail = 
      (normalized.event_type === 'PURCHASE' && !wasActiveEntitlement) || 
      isNewUser;
    
    if (shouldSendEmail) {
      try {
        await sendWelcomeEmail(supabase, {
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

// Send welcome email with magic link
async function sendWelcomeEmail(
  supabase: any,
  params: {
    email: string;
    firstName: string;
    locale: string;
    appBaseUrl: string;
    productName: string;
  }
): Promise<void> {
  const { email, firstName, locale, appBaseUrl, productName } = params;
  
  // Generate magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: `${appBaseUrl}/`,
    },
  });
  
  if (linkError) throw linkError;
  
  const magicLink = linkData.properties.action_link;
  
  // Email templates by locale
  const templates: Record<string, { subject: string; body: string }> = {
    de: {
      subject: `🎺 Dein Zugang zu ${productName} ist freigeschaltet!`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">Hallo ${firstName || 'Trompeter'}! 🎺</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Vielen Dank für deinen Kauf! Dein Zugang zu <strong>${productName}</strong> wurde freigeschaltet.
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Klicke auf den Button unten, um dich direkt einzuloggen:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background: linear-gradient(135deg, #f59e0b, #d97706); 
                      color: white; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      display: inline-block;">
              Jetzt einloggen
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">
            Der Link ist 24 Stunden gültig. Danach kannst du dich jederzeit mit deiner E-Mail-Adresse anmelden.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px;">
            Trumpet Star | Deine Online-Trompetenschule
          </p>
        </div>
      `,
    },
    en: {
      subject: `🎺 Your access to ${productName} is now active!`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">Hello ${firstName || 'Trumpeter'}! 🎺</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Thank you for your purchase! Your access to <strong>${productName}</strong> has been activated.
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Click the button below to log in directly:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background: linear-gradient(135deg, #f59e0b, #d97706); 
                      color: white; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      display: inline-block;">
              Log in now
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">
            This link is valid for 24 hours. After that, you can always sign in with your email address.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px;">
            Trumpet Star | Your Online Trumpet School
          </p>
        </div>
      `,
    },
    es: {
      subject: `🎺 ¡Tu acceso a ${productName} está activado!`,
      body: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #1e293b;">¡Hola ${firstName || 'Trompetista'}! 🎺</h1>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            ¡Gracias por tu compra! Tu acceso a <strong>${productName}</strong> ha sido activado.
          </p>
          <p style="color: #475569; font-size: 16px; line-height: 1.6;">
            Haz clic en el botón de abajo para iniciar sesión directamente:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${magicLink}" 
               style="background: linear-gradient(135deg, #f59e0b, #d97706); 
                      color: white; 
                      padding: 14px 28px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      font-weight: 600;
                      display: inline-block;">
              Iniciar sesión
            </a>
          </div>
          <p style="color: #94a3b8; font-size: 14px;">
            Este enlace es válido por 24 horas. Después, puedes iniciar sesión con tu correo electrónico.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="color: #94a3b8; font-size: 12px;">
            Trumpet Star | Tu Escuela de Trompeta Online
          </p>
        </div>
      `,
    },
  };
  
  const template = templates[locale] || templates.de;
  
  // Use Resend if configured, otherwise log
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  
  if (resendApiKey) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Trumpet Star <noreply@trumpetstar.com>',
        to: [email],
        subject: template.subject,
        html: template.body,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Resend API error: ${errorText}`);
    }
  } else {
    console.log(`[EMAIL WOULD BE SENT] To: ${email}, Subject: ${template.subject}`);
  }
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  // Only accept POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
  
  let rawPayload: Record<string, any>;
  
  try {
    rawPayload = await parsePayload(req);
    console.log("Received IPN payload:", JSON.stringify(rawPayload).substring(0, 500));
  } catch (parseError) {
    console.error("Failed to parse payload:", parseError);
    // Still return 200 to prevent Digistore24 from retrying
    return new Response(JSON.stringify({ status: "ok", message: "parse_error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  
  try {
    // Normalize payload
    const normalized = normalizePayload(rawPayload);
    const idempotencyKey = generateIdempotencyKey(rawPayload, normalized);
    
    // Get settings
    const ipnSecret = await getSetting(supabase, 'ipn_secret', 'DIGISTORE24_IPN_SECRET');
    const appBaseUrl = await getSetting(supabase, 'app_base_url', 'APP_BASE_URL') || 'https://trumpetstar.lovable.app';
    const defaultLocale = await getSetting(supabase, 'default_locale') || 'de';
    
    // Validate secret
    if (ipnSecret && !validateSecret(rawPayload, ipnSecret)) {
      console.warn("Invalid IPN secret provided");
      
      // Log as rejected
      await supabase
        .from('digistore24_ipn_events')
        .insert({
          idempotency_key: idempotencyKey + '_rejected_' + Date.now(),
          event_type: normalized.event_type || 'UNKNOWN',
          order_id: normalized.order_id,
          subscription_id: normalized.subscription_id,
          product_id: normalized.product_id,
          email: normalized.email,
          raw_payload: rawPayload,
          normalized_payload: normalized,
          status: 'rejected',
          error_message: 'Invalid IPN secret',
        });
      
      // Still return 200
      return new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Check idempotency
    const { data: existingEvent } = await supabase
      .from('digistore24_ipn_events')
      .select('id, status')
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();
    
    if (existingEvent) {
      console.log(`Duplicate event detected: ${idempotencyKey}, status: ${existingEvent.status}`);
      return new Response(JSON.stringify({ status: "ok", message: "duplicate" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    // Store event
    const { data: ipnEvent, error: insertError } = await supabase
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
      // Might be duplicate due to race condition
      if (insertError.code === '23505') {
        return new Response(JSON.stringify({ status: "ok", message: "duplicate" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw insertError;
    }
    
    // Process asynchronously (but within edge function timeout)
    // In production, this would ideally be a background job
    // For now, we process inline but return quickly to Digistore
    
    // Process inline before returning
    try {
      await processIpnEvent(supabase, ipnEvent.id, normalized, { appBaseUrl, defaultLocale }, rawPayload);
    } catch (err) {
      console.error('IPN processing failed:', err);
    }
    
    // Return
    return new Response(JSON.stringify({ status: "ok", event_id: ipnEvent.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
    
  } catch (error: any) {
    console.error("IPN handler error:", error);
    
    // Always return 200 to prevent retries that might cause duplicates
    return new Response(JSON.stringify({ status: "ok", error: "internal_error" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
