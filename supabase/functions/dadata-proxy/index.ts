/**
 * dadata-proxy — Supabase Edge Function
 *
 * Proxy to DaData address suggestion API.
 * Keeps the DaData API token server-side.
 *
 * SEC-7: Requires authentication — any authenticated user can use.
 */

import { getCorsHeaders, handleCorsPreflightIfNeeded } from '../_shared/cors.ts';
import { verifyAuth, unauthorizedResponse } from '../_shared/auth.ts';

const DADATA_TOKEN = Deno.env.get('DADATA_API_TOKEN')!;
const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address';

Deno.serve(async (req) => {
  // Handle CORS preflight (no auth required)
  const preflightResponse = handleCorsPreflightIfNeeded(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req);

  // SEC-7: Verify authentication — any authenticated user
  const auth = await verifyAuth(req);
  if (auth.error) return unauthorizedResponse(corsHeaders);

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    const body = await req.json();
    const { query, count, from_bound, to_bound } = body;

    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!DADATA_TOKEN) {
      return new Response(
        JSON.stringify({ error: 'DaData token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Forward request to DaData API with server-side token
    const dadataRes = await fetch(DADATA_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Token ${DADATA_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        count: count || 7,
        from_bound: from_bound || { value: 'city' },
        to_bound: to_bound || { value: 'flat' },
      }),
    });

    if (!dadataRes.ok) {
      const errText = await dadataRes.text();
      console.error('DaData API error:', dadataRes.status, errText);
      return new Response(
        JSON.stringify({ error: 'DaData API error', status: dadataRes.status }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const data = await dadataRes.json();

    return new Response(
      JSON.stringify(data),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('DaData proxy error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
