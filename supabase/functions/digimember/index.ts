import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DIGIMEMBER_API_KEY = Deno.env.get('DIGIMEMBER_API_KEY') || '';
const DIGIMEMBER_BASE_URL = 'https://www.trumpetstar.com/wp-json/digimember/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Plan types: FREE (0), BASIC (10), PREMIUM (20)
type PlanKey = 'FREE' | 'BASIC' | 'PREMIUM' | 'NONE';

interface DigiMemberUserProduct {
  product_id: string;
  status: string;
  expiry_date?: string;
}

interface Plan {
  key: string;
  display_name: string;
  rank: number;
}

// deno-lint-ignore no-explicit-any
async function callDigiMemberAPI(endpoint: string, method = 'GET', body?: any): Promise<any> {
  const url = `${DIGIMEMBER_BASE_URL}${endpoint}`;
  
  console.log(`Calling DigiMember API: ${method} ${url}`);
  
  const headers: Record<string, string> = {
    'X-Digi-Key': DIGIMEMBER_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DigiMember API error: ${response.status} - ${errorText}`);
      throw new Error(`DigiMember API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`DigiMember API response:`, JSON.stringify(data).substring(0, 500));
    return data;
  } catch (error) {
    console.error('DigiMember API call failed:', error);
    throw error;
  }
}

// deno-lint-ignore no-explicit-any
async function getPlans(supabaseClient: any): Promise<Plan[]> {
  const { data, error } = await supabaseClient
    .from('plans')
    .select('key, display_name, rank')
    .order('rank');
  
  if (error) {
    console.error('Error fetching plans:', error);
    return [
      { key: 'FREE', display_name: 'Free', rank: 0 },
      { key: 'BASIC', display_name: 'Basic', rank: 10 },
      { key: 'PREMIUM', display_name: 'Premium', rank: 20 },
    ];
  }
  
  return data || [];
}

// deno-lint-ignore no-explicit-any
async function syncProducts(supabaseClient: any) {
  console.log('Starting product sync...');
  
  try {
    const response = await callDigiMemberAPI('/products');
    
    const productList = Array.isArray(response) 
      ? response 
      : (response.data || response.products || []);
    
    let syncedCount = 0;
    const syncedProductIds: string[] = [];
    
    // deno-lint-ignore no-explicit-any
    for (const product of productList) {
      const productId = String(product.id);
      syncedProductIds.push(productId);
      
      const productData = {
        product_id: productId,
        name: product.name || `Product ${product.id}`,
        type: product.type || 'membership',
        checkout_url: product.checkout_url || product.buy_url || null,
        is_active: product.active !== false,
        last_synced_at: new Date().toISOString(),
      };
      
      console.log(`Upserting product: ${productData.product_id} - ${productData.name}`);
      
      const { error } = await supabaseClient
        .from('digimember_products')
        .upsert(productData, { onConflict: 'product_id' });
      
      if (error) {
        console.error(`Error upserting product ${productData.product_id}:`, error);
      } else {
        syncedCount++;
      }
      
      // Ensure product has a mapping entry
      const { error: mappingError } = await supabaseClient
        .from('product_plan_mapping')
        .upsert({
          digimember_product_id: productId,
          plan_key: 'NONE',
          is_enabled: true,
        }, { 
          onConflict: 'digimember_product_id',
          ignoreDuplicates: true 
        });
      
      if (mappingError) {
        console.error(`Error creating mapping for ${productId}:`, mappingError);
      }
    }
    
    // Mark products not in sync as inactive (soft delete)
    if (syncedProductIds.length > 0) {
      const { error: deactivateError } = await supabaseClient
        .from('digimember_products')
        .update({ is_active: false })
        .not('product_id', 'in', `(${syncedProductIds.join(',')})`);
      
      if (deactivateError) {
        console.error('Error deactivating old products:', deactivateError);
      }
    }
    
    return { synced: syncedCount };
  } catch (error) {
    console.error('Product sync failed:', error);
    throw error;
  }
}

async function getUserMembership(email: string) {
  console.log(`Fetching membership for user: ${email}`);
  
  try {
    const userData = await callDigiMemberAPI(`/user/products?email=${encodeURIComponent(email)}`);
    
    const products: DigiMemberUserProduct[] = userData.products || userData.data || [];
    const activeProductIds = products
      .filter(p => p.status === 'active' || p.status === 'enabled')
      .map(p => String(p.product_id));
    
    console.log(`User ${email} has active products:`, activeProductIds);
    
    return {
      activeProductIds,
      products,
    };
  } catch (error) {
    console.error(`Failed to fetch user membership:`, error);
    return {
      activeProductIds: [] as string[],
      products: [] as DigiMemberUserProduct[],
    };
  }
}

// deno-lint-ignore no-explicit-any
async function determinePlan(
  activeProductIds: string[],
  supabaseClient: any
): Promise<{ planKey: PlanKey; planRank: number }> {
  if (activeProductIds.length === 0) {
    return { planKey: 'FREE', planRank: 0 };
  }
  
  // Get product mappings with plan info
  const { data: mappings, error } = await supabaseClient
    .from('product_plan_mapping')
    .select('digimember_product_id, plan_key')
    .in('digimember_product_id', activeProductIds)
    .eq('is_enabled', true)
    .neq('plan_key', 'NONE');
  
  if (error || !mappings || mappings.length === 0) {
    console.log('No mapped products found, returning FREE');
    return { planKey: 'FREE', planRank: 0 };
  }
  
  // Get plans for rank lookup
  const plans = await getPlans(supabaseClient);
  const planRanks: Record<string, number> = {};
  for (const plan of plans) {
    planRanks[plan.key] = plan.rank;
  }
  
  // Find highest plan
  let highestPlanKey: PlanKey = 'FREE';
  let highestRank = 0;
  
  // deno-lint-ignore no-explicit-any
  for (const mapping of mappings as any[]) {
    const planKey = mapping.plan_key as string;
    const rank = planRanks[planKey] || 0;
    if (rank > highestRank) {
      highestRank = rank;
      highestPlanKey = planKey as PlanKey;
    }
  }
  
  console.log(`Determined plan: ${highestPlanKey} (rank: ${highestRank})`);
  return { planKey: highestPlanKey, planRank: highestRank };
}

// deno-lint-ignore no-explicit-any
async function getUpgradeLinks(supabaseClient: any): Promise<Record<string, string | null>> {
  const { data: mappings } = await supabaseClient
    .from('product_plan_mapping')
    .select('plan_key, checkout_url')
    .eq('is_enabled', true)
    .neq('plan_key', 'NONE')
    .not('checkout_url', 'is', null);
  
  const links: Record<string, string | null> = {
    BASIC: null,
    PREMIUM: null,
  };
  
  if (mappings) {
    // deno-lint-ignore no-explicit-any
    for (const m of mappings as any[]) {
      if (m.plan_key === 'BASIC' && m.checkout_url && !links.BASIC) {
        links.BASIC = m.checkout_url;
      } else if (m.plan_key === 'PREMIUM' && m.checkout_url && !links.PREMIUM) {
        links.PREMIUM = m.checkout_url;
      }
    }
  }
  
  return links;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log(`DigiMember function called with action: ${action}`);
    
    // Action: Sync all products
    if (action === 'sync-products') {
      const result = await syncProducts(supabaseClient);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Synced ${result.synced} products`,
        ...result,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Action: Check user membership
    if (action === 'check-membership') {
      const body = await req.json();
      const { email, userId } = body;
      
      if (!email) {
        return new Response(JSON.stringify({ error: 'Email is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { activeProductIds, products } = await getUserMembership(email);
      const { planKey, planRank } = await determinePlan(activeProductIds, supabaseClient);
      const upgradeLinks = await getUpgradeLinks(supabaseClient);
      const plans = await getPlans(supabaseClient);
      
      // Update user_membership_cache if userId provided
      if (userId) {
        const { error: cacheError } = await supabaseClient
          .from('user_membership_cache')
          .upsert({
            user_id: userId,
            plan_key: planKey,
            plan_rank: planRank,
            active_product_ids: activeProductIds,
            last_checked_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        
        if (cacheError) {
          console.error('Error upserting membership cache:', cacheError);
        }
        
        // Also update legacy user_memberships table
        const { error: upsertError } = await supabaseClient
          .from('user_memberships')
          .upsert({
            user_id: userId,
            current_plan: planKey,
            plan_key: planKey,
            plan_rank: planRank,
            active_product_ids: activeProductIds,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        
        if (upsertError) {
          console.error('Error upserting user membership:', upsertError);
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        planKey,
        planRank,
        // Legacy support
        plan: planKey,
        activeProductIds,
        products,
        upgradeLinks,
        plans,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Action: Get all products (for admin)
    if (action === 'get-products') {
      const { data: products, error } = await supabaseClient
        .from('digimember_products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Get mappings
      const { data: mappings } = await supabaseClient
        .from('product_plan_mapping')
        .select('*');
      
      // Get plans
      const plans = await getPlans(supabaseClient);
      
      // Merge data
      // deno-lint-ignore no-explicit-any
      const enrichedProducts = (products || []).map((p: any) => {
        // deno-lint-ignore no-explicit-any
        const mapping = (mappings || []).find((m: any) => m.digimember_product_id === p.product_id);
        return {
          ...p,
          plan_key: mapping?.plan_key || 'NONE',
          checkout_url: mapping?.checkout_url || p.checkout_url,
          is_enabled: mapping?.is_enabled ?? true,
        };
      });
      
      return new Response(JSON.stringify({
        success: true,
        products: enrichedProducts,
        plans,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Action: Update product mapping
    if (action === 'update-product-mapping') {
      const body = await req.json();
      const { productId, planKey, checkoutUrl, isEnabled } = body;
      
      if (!productId) {
        return new Response(JSON.stringify({ error: 'Product ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const updateData: Record<string, unknown> = {
        digimember_product_id: productId,
        updated_at: new Date().toISOString(),
      };
      
      if (planKey !== undefined) updateData.plan_key = planKey || 'NONE';
      if (checkoutUrl !== undefined) updateData.checkout_url = checkoutUrl;
      if (isEnabled !== undefined) updateData.is_enabled = isEnabled;
      
      const { error } = await supabaseClient
        .from('product_plan_mapping')
        .upsert(updateData, { onConflict: 'digimember_product_id' });
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Product mapping updated',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Action: Get plans
    if (action === 'get-plans') {
      const plans = await getPlans(supabaseClient);
      
      return new Response(JSON.stringify({
        success: true,
        plans,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Action: Get plan stats (admin dashboard)
    if (action === 'get-plan-stats') {
      const { data: stats, error } = await supabaseClient
        .from('admin_plan_stats')
        .select('*');
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        success: true,
        stats,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Action: Debug user membership (admin)
    if (action === 'debug-membership') {
      const body = await req.json();
      const { userId, email } = body;
      
      let membershipData = null;
      let cacheData = null;
      
      if (userId) {
        const { data } = await supabaseClient
          .from('user_membership_cache')
          .select('*')
          .eq('user_id', userId)
          .single();
        cacheData = data;
      }
      
      if (email) {
        const { activeProductIds, products } = await getUserMembership(email);
        const { planKey, planRank } = await determinePlan(activeProductIds, supabaseClient);
        membershipData = { activeProductIds, products, planKey, planRank };
      }
      
      return new Response(JSON.stringify({
        success: true,
        cache: cacheData,
        live: membershipData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Invalid action. Use: sync-products, check-membership, get-products, update-product-mapping, get-plans, get-plan-stats, debug-membership' 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('DigiMember function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
