import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DIGIMEMBER_API_KEY = Deno.env.get('DIGIMEMBER_API_KEY') || '';
const DIGIMEMBER_BASE_URL = 'https://www.trumpetstar.com/wp-json/digimember/v1';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

interface DigiMemberUserProduct {
  product_id: string;
  status: string;
  expiry_date?: string;
}

interface ProductRecord {
  product_id: string;
  name: string;
  type: string | null;
  checkout_url: string | null;
  is_active: boolean;
  app_plan: string | null;
  last_synced_at: string;
}

// deno-lint-ignore no-explicit-any
async function callDigiMemberAPI(endpoint: string, method = 'GET', body?: any): Promise<any> {
  const url = `${DIGIMEMBER_BASE_URL}${endpoint}`;
  
  console.log(`Calling DigiMember API: ${method} ${url}`);
  
  // DigiMember uses X-Digi-Key header for authentication (not Bearer token)
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
async function syncProducts(supabaseClient: any) {
  console.log('Starting product sync...');
  
  try {
    // Fetch all products from DigiMember
    const response = await callDigiMemberAPI('/products');
    
    // Handle various API response formats
    const productList = Array.isArray(response) 
      ? response 
      : (response.data || response.products || []);
    
    let syncedCount = 0;
    
    // deno-lint-ignore no-explicit-any
    for (const product of productList) {
      const productData: Omit<ProductRecord, 'app_plan'> = {
        product_id: String(product.id),
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
    // Try to get user's active products from DigiMember
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
): Promise<'FREE' | 'PLAN_A' | 'PLAN_B'> {
  if (activeProductIds.length === 0) {
    return 'FREE';
  }
  
  // Get product mappings from database
  const { data: products, error } = await supabaseClient
    .from('digimember_products')
    .select('product_id, app_plan')
    .in('product_id', activeProductIds)
    .not('app_plan', 'is', null);
  
  if (error || !products || products.length === 0) {
    console.log('No mapped products found, returning FREE');
    return 'FREE';
  }
  
  // Return highest plan (PLAN_B > PLAN_A > FREE)
  const planPriority: Record<string, number> = { 'PLAN_B': 3, 'PLAN_A': 2, 'FREE': 1 };
  let highestPlan: 'FREE' | 'PLAN_A' | 'PLAN_B' = 'FREE';
  
  // deno-lint-ignore no-explicit-any
  for (const product of products as any[]) {
    const productPlan = product.app_plan as string;
    if (productPlan && (planPriority[productPlan] || 0) > planPriority[highestPlan]) {
      highestPlan = productPlan as 'FREE' | 'PLAN_A' | 'PLAN_B';
    }
  }
  
  console.log(`Determined plan: ${highestPlan}`);
  return highestPlan;
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
      const plan = await determinePlan(activeProductIds, supabaseClient);
      
      // Get upgrade links for products
      const { data: planProducts } = await supabaseClient
        .from('digimember_products')
        .select('app_plan, checkout_url')
        .not('app_plan', 'is', null)
        .eq('is_active', true);
      
      const upgradeLinks: Record<string, string | null> = {
        planA: null,
        planB: null,
      };
      
      if (planProducts) {
        // deno-lint-ignore no-explicit-any
        for (const p of planProducts as any[]) {
          if (p.app_plan === 'PLAN_A' && p.checkout_url) {
            upgradeLinks.planA = p.checkout_url;
          } else if (p.app_plan === 'PLAN_B' && p.checkout_url) {
            upgradeLinks.planB = p.checkout_url;
          }
        }
      }
      
      // Update user_memberships table if userId provided
      if (userId) {
        const { error: upsertError } = await supabaseClient
          .from('user_memberships')
          .upsert({
            user_id: userId,
            current_plan: plan,
            active_product_ids: activeProductIds,
            last_synced_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
        
        if (upsertError) {
          console.error('Error upserting user membership:', upsertError);
        }
      }
      
      return new Response(JSON.stringify({
        success: true,
        plan,
        activeProductIds,
        products,
        upgradeLinks,
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
      
      if (error) {
        throw error;
      }
      
      return new Response(JSON.stringify({
        success: true,
        products,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // Action: Update product mapping
    if (action === 'update-product-mapping') {
      const body = await req.json();
      const { productId, appPlan } = body;
      
      if (!productId) {
        return new Response(JSON.stringify({ error: 'Product ID is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      const { error } = await supabaseClient
        .from('digimember_products')
        .update({ app_plan: appPlan || null })
        .eq('product_id', productId);
      
      if (error) {
        throw error;
      }
      
      return new Response(JSON.stringify({
        success: true,
        message: 'Product mapping updated',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Invalid action. Use: sync-products, check-membership, get-products, update-product-mapping' 
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