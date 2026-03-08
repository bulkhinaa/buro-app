/**
 * Supabase Edge Function: yandex-auth
 *
 * Handles Yandex OAuth code exchange and creates/authenticates
 * a Supabase user from the Yandex identity.
 *
 * Flow:
 * 1. Client sends Yandex authorization code
 * 2. We exchange it for a Yandex access token
 * 3. We fetch user info from Yandex API
 * 4. We create (or find) the user in Supabase
 * 5. We generate a one-time login OTP
 * 6. Client uses the OTP to establish a Supabase session
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { code, redirect_uri } = await req.json();

    if (!code) {
      return jsonError('Missing authorization code', 400);
    }

    const YANDEX_CLIENT_ID = Deno.env.get('YANDEX_CLIENT_ID')!;
    const YANDEX_CLIENT_SECRET = Deno.env.get('YANDEX_CLIENT_SECRET')!;
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // ── 1. Exchange authorization code for Yandex access token ──
    const tokenRes = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: YANDEX_CLIENT_ID,
        client_secret: YANDEX_CLIENT_SECRET,
        ...(redirect_uri ? { redirect_uri } : {}),
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Yandex token exchange failed:', tokenData);
      const detail = tokenData.error_description || tokenData.error || 'unknown';
      return jsonError(`Failed to exchange authorization code: ${detail}`, 400);
    }

    // ── 2. Fetch user info from Yandex ──
    const userRes = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `OAuth ${tokenData.access_token}` },
    });

    const yandexUser = await userRes.json();

    const email = yandexUser.default_email;
    if (!email) {
      return jsonError('No email found in Yandex profile', 400);
    }

    const displayName =
      yandexUser.display_name ||
      yandexUser.real_name ||
      `${yandexUser.first_name || ''} ${yandexUser.last_name || ''}`.trim();

    const avatarUrl = yandexUser.default_avatar_id
      ? `https://avatars.yandex.net/get-yapic/${yandexUser.default_avatar_id}/islands-200`
      : undefined;

    const phone = yandexUser.default_phone?.number || undefined;

    // ── 3. Create Supabase admin client ──
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 4. Create user if they don't exist (ignore "already exists" errors) ──
    await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm — they verified via Yandex
      user_metadata: {
        full_name: displayName,
        avatar_url: avatarUrl,
        provider: 'yandex',
        yandex_id: String(yandexUser.id),
        phone,
      },
    });
    // If user already exists, createUser fails silently — that's fine.

    // ── 5. Generate one-time login OTP for the user ──
    const { data: linkData, error: linkError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email,
      });

    if (linkError) {
      console.error('generateLink error:', linkError);
      throw linkError;
    }

    // ── 6. Return OTP + user metadata to the client ──
    return new Response(
      JSON.stringify({
        email,
        otp: linkData.properties.email_otp,
        user_metadata: {
          name: displayName,
          phone,
          avatar_url: avatarUrl,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (err: any) {
    console.error('yandex-auth error:', err);
    return jsonError(err.message || 'Internal server error', 500);
  }
});

/** Helper: return a JSON error response */
function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
