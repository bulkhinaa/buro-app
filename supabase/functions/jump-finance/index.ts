/**
 * Supabase Edge Function: jump-finance
 *
 * Proxy to Jump Finance API for self-employed (samozanyatiy) verification.
 * Actions: create_contractor, start_identification, check_status.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const JUMP_BASE_URL = 'https://api.jump.finance';

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientKey = Deno.env.get('JUMP_FINANCE_CLIENT_KEY');
    if (!clientKey) {
      return jsonError('JUMP_FINANCE_CLIENT_KEY not configured', 500);
    }

    const body = await req.json();
    const { action } = body;

    const jumpHeaders = {
      'Client-Key': clientKey,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    // ── Create contractor ──
    if (action === 'create_contractor') {
      const { name, phone, email } = body;
      if (!name || !phone) {
        return jsonError('name and phone are required', 400);
      }

      const res = await fetch(`${JUMP_BASE_URL}/contractors`, {
        method: 'POST',
        headers: jumpHeaders,
        body: JSON.stringify({
          name,
          phone,
          email: email || '',
          legal_form_id: 2, // Self-employed
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Jump create_contractor error:', data);
        return jsonError(data?.message || 'Failed to create contractor', res.status);
      }

      return jsonSuccess({ contractor_id: String(data.id || data.contractor_id) });
    }

    // ── Start identification ──
    if (action === 'start_identification') {
      const { contractor_id } = body;
      if (!contractor_id) {
        return jsonError('contractor_id is required', 400);
      }

      const res = await fetch(
        `${JUMP_BASE_URL}/contractors/${contractor_id}/force-identify`,
        { method: 'POST', headers: jumpHeaders },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Jump start_identification error:', data);
        return jsonError(data?.message || 'Failed to start identification', res.status);
      }

      return jsonSuccess({ success: true });
    }

    // ── Check status ──
    if (action === 'check_status') {
      const { contractor_id } = body;
      if (!contractor_id) {
        return jsonError('contractor_id is required', 400);
      }

      const res = await fetch(
        `${JUMP_BASE_URL}/contractors/${contractor_id}/identification-request`,
        { method: 'GET', headers: jumpHeaders },
      );

      const data = await res.json();
      if (!res.ok) {
        console.error('Jump check_status error:', data);
        return jsonError(data?.message || 'Failed to check status', res.status);
      }

      // Normalize status from Jump API
      const status = data.status === 'completed' || data.status === 'approved'
        ? 'approved'
        : data.status === 'rejected' || data.status === 'declined'
          ? 'rejected'
          : 'pending';

      return jsonSuccess({ status, reason: data.reason || null });
    }

    return jsonError(`Unknown action: ${action}`, 400);
  } catch (err: any) {
    console.error('jump-finance error:', err);
    return jsonError(err.message || 'Internal server error', 500);
  }
});

function jsonSuccess(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
