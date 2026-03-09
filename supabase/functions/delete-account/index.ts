import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }

  try {
    // Extract user from Authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify the user with their JWT
    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const userId = user.id;

    // Step 1: Anonymize user data (calls the DB function)
    const { error: rpcError } = await supabaseUser.rpc('anonymize_user', {
      p_user_id: userId,
    });

    if (rpcError) {
      console.error('Anonymize error:', rpcError);
      return new Response(
        JSON.stringify({ error: 'Failed to anonymize data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 2: Delete user avatar from Storage (if exists)
    try {
      const { data: files } = await supabaseUser.storage
        .from('avatars')
        .list(userId);
      if (files && files.length > 0) {
        const filePaths = files.map((f: any) => `${userId}/${f.name}`);
        await supabaseUser.storage.from('avatars').remove(filePaths);
      }
    } catch {
      // Storage cleanup is best-effort
    }

    // Step 3: Deactivate the auth user (ban them so they can't log back in)
    const { error: adminError } = await supabaseUser.auth.admin.updateUserById(
      userId,
      { ban_duration: '876000h' }, // ~100 years ban
    );

    if (adminError) {
      console.error('Auth deactivate error:', adminError);
      // Non-critical — data is already anonymized
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('Delete account error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
