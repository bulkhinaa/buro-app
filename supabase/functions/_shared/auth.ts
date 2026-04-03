/**
 * _shared/auth.ts — JWT authentication module for Edge Functions
 *
 * SEC-7: All Edge Functions must verify the caller's identity.
 * Supports two auth methods:
 *   1. JWT token (from Supabase Auth) — verifies user and fetches role from profiles
 *   2. Internal service secret (INTERNAL_SERVICE_SECRET env var) — for DB triggers / server-to-server calls
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export interface AuthResult {
  user: { id: string; role?: string } | null;
  error: string | null;
}

/**
 * Verify the Authorization header of an incoming request.
 * Returns the authenticated user with their role, or an error message.
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { user: null, error: 'Missing authorization header' };
  }

  const token = authHeader.replace('Bearer ', '');

  // Check if it's an internal service secret (for DB triggers via pg_net)
  const serviceSecret = Deno.env.get('INTERNAL_SERVICE_SECRET');
  if (serviceSecret && token === serviceSecret) {
    return { user: { id: 'service', role: 'service' }, error: null };
  }

  // Verify JWT via Supabase Auth
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: 'Supabase configuration missing' };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { user: null, error: 'Invalid token' };
  }

  // Fetch role from profiles using service role key (bypasses RLS)
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey) {
    return { user: { id: user.id }, error: null };
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile } = await adminClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return { user: { id: user.id, role: profile?.role }, error: null };
}

/**
 * Return a 401 Unauthorized response with CORS headers.
 */
export function unauthorizedResponse(
  corsHeaders: Record<string, string>,
  message = 'Unauthorized',
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
