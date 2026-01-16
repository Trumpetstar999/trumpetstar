import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// WordPress OAuth Configuration
const WP_BASE_URL = 'https://www.trumpetstar.com';
const WP_OAUTH_CLIENT_ID = 'WjGtEhetRuRSQOktowbaLUvzKuyrUGgl';
const WP_OAUTH_AUTHORIZE_URL = `${WP_BASE_URL}/wp-json/moserver/authorize`;
const WP_OAUTH_TOKEN_URL = `${WP_BASE_URL}/wp-json/moserver/token`;
const WP_OAUTH_USERINFO_URL = `${WP_BASE_URL}/wp-json/trumpetstar/v1/me`;

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
}

interface WPUserInfo {
  user: {
    email: string;
    displayName: string;
    wpUserId: string;
  };
  products: Array<{
    productId: string;
    status: string;
  }>;
  plan: 'FREE' | 'PLAN_A' | 'PLAN_B';
  upgradeLinks: {
    planA: string;
    planB: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    console.log(`[wp-oauth] Action: ${action}`);

    // Action: Get authorize URL
    if (action === 'authorize') {
      const redirectUri = url.searchParams.get('redirect_uri');
      if (!redirectUri) {
        return new Response(
          JSON.stringify({ error: 'redirect_uri is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const state = crypto.randomUUID();
      const authorizeUrl = new URL(WP_OAUTH_AUTHORIZE_URL);
      authorizeUrl.searchParams.set('response_type', 'code');
      authorizeUrl.searchParams.set('client_id', WP_OAUTH_CLIENT_ID);
      authorizeUrl.searchParams.set('redirect_uri', redirectUri);
      authorizeUrl.searchParams.set('state', state);
      authorizeUrl.searchParams.set('scope', 'openid profile email');

      console.log(`[wp-oauth] Generated authorize URL for redirect_uri: ${redirectUri}`);

      return new Response(
        JSON.stringify({ 
          authorize_url: authorizeUrl.toString(),
          state 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Exchange code for token
    if (action === 'token') {
      const body = await req.json();
      const { code, redirect_uri } = body;

      if (!code || !redirect_uri) {
        return new Response(
          JSON.stringify({ error: 'code and redirect_uri are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const clientSecret = Deno.env.get('WP_OAUTH_CLIENT_SECRET');
      if (!clientSecret) {
        console.error('[wp-oauth] WP_OAUTH_CLIENT_SECRET not configured');
        return new Response(
          JSON.stringify({ error: 'OAuth not configured' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[wp-oauth] Exchanging code for token...`);

      // Exchange code for token
      const tokenResponse = await fetch(WP_OAUTH_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri,
          client_id: WP_OAUTH_CLIENT_ID,
          client_secret: clientSecret,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error(`[wp-oauth] Token exchange failed: ${errorText}`);
        return new Response(
          JSON.stringify({ error: 'Token exchange failed', details: errorText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const tokenData: TokenResponse = await tokenResponse.json();
      console.log(`[wp-oauth] Token exchange successful`);

      // Fetch user info with the access token
      console.log(`[wp-oauth] Fetching user info...`);
      const userInfoResponse = await fetch(WP_OAUTH_USERINFO_URL, {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`,
        },
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error(`[wp-oauth] User info fetch failed: ${errorText}`);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch user info', details: errorText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userInfo: WPUserInfo = await userInfoResponse.json();
      console.log(`[wp-oauth] User info fetched for: ${userInfo.user.email}, plan: ${userInfo.plan}`);

      return new Response(
        JSON.stringify({
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          user: userInfo.user,
          products: userInfo.products,
          plan: userInfo.plan,
          upgradeLinks: userInfo.upgradeLinks,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: Refresh membership status
    if (action === 'refresh') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(
          JSON.stringify({ error: 'Authorization header required' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const wpAccessToken = authHeader.replace('Bearer ', '');

      console.log(`[wp-oauth] Refreshing membership status...`);

      const userInfoResponse = await fetch(WP_OAUTH_USERINFO_URL, {
        headers: {
          'Authorization': `Bearer ${wpAccessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        const errorText = await userInfoResponse.text();
        console.error(`[wp-oauth] Refresh failed: ${errorText}`);
        return new Response(
          JSON.stringify({ error: 'Failed to refresh membership', details: errorText }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const userInfo: WPUserInfo = await userInfoResponse.json();
      console.log(`[wp-oauth] Membership refreshed for: ${userInfo.user.email}, plan: ${userInfo.plan}`);

      return new Response(
        JSON.stringify({
          user: userInfo.user,
          products: userInfo.products,
          plan: userInfo.plan,
          upgradeLinks: userInfo.upgradeLinks,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: authorize, token, or refresh' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[wp-oauth] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
