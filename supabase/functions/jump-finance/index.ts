/**
 * Supabase Edge Function: jump-finance
 *
 * Proxy to Jump Finance API for self-employed (samozanyatiy) verification.
 * Actions: create_contractor, check_status, get_contractor.
 *
 * Flow:
 * 1. create_contractor — register master with INN in Jump Finance
 * 2. Master accepts invitation from «Jump.Работа» in «Мой налог» app
 * 3. check_status — poll GET /selfemployer until is_verified === true
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const JUMP_BASE_URL = 'https://api.jump.finance/services/openapi';

// Cached agent_id (fetched once per cold start)
let cachedAgentId: number | null = null;

async function getAgentId(headers: Record<string, string>): Promise<number> {
  if (cachedAgentId) return cachedAgentId;

  const res = await fetch(`${JUMP_BASE_URL}/banks_accounts`, {
    method: 'GET',
    headers,
  });
  const data = await res.json();

  if (!res.ok || !data.items?.length) {
    throw new Error('Failed to fetch agent_id from Jump Finance');
  }

  cachedAgentId = data.items[0].agent.id;
  return cachedAgentId!;
}

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
      const { name, phone, inn } = body;
      if (!name || !phone || !inn) {
        return jsonError('name, phone and inn are required', 400);
      }

      // Validate INN format (12 digits for individuals/self-employed)
      const cleanInn = inn.replace(/\s/g, '');
      if (!/^\d{12}$/.test(cleanInn)) {
        return jsonError('ИНН должен содержать 12 цифр', 400);
      }

      // Split full name into parts (Jump API requires first_name, last_name)
      const parts = name.trim().split(/\s+/);
      const last_name = parts[0] || '';
      const first_name = parts[1] || parts[0] || '';
      const middle_name = parts[2] || '';

      // Normalize phone to +7XXXXXXXXXX format
      let normalPhone = phone.replace(/[\s\-()]/g, '');
      if (normalPhone.startsWith('8') && normalPhone.length === 11) {
        normalPhone = '+7' + normalPhone.slice(1);
      }
      if (!normalPhone.startsWith('+')) {
        normalPhone = '+' + normalPhone;
      }

      // Get agent_id (company ID in Jump Finance)
      const agentId = await getAgentId(jumpHeaders);

      const res = await fetch(`${JUMP_BASE_URL}/contractors`, {
        method: 'POST',
        headers: jumpHeaders,
        body: JSON.stringify({
          first_name,
          last_name,
          middle_name,
          phone: normalPhone,
          inn: cleanInn,
          legal_form_id: 2, // Self-employed (самозанятый)
          agent_id: agentId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error('Jump create_contractor error:', JSON.stringify(data));
        // Parse field-level validation errors
        const fieldErrors = data?.error?.fields;
        if (fieldErrors && Array.isArray(fieldErrors)) {
          const msgs = fieldErrors.map(
            (f: { field: string; messages: string[] }) =>
              `${f.field}: ${f.messages.join(', ')}`,
          );
          return jsonError(msgs.join('; '), res.status);
        }
        const msg = data?.error?.detail || data?.message || 'Failed to create contractor';
        return jsonError(msg, res.status);
      }

      const contractorId = String(data.item?.id || data.id || data.contractor_id);
      return jsonSuccess({ contractor_id: contractorId });
    }

    // ── Check self-employed status ──
    if (action === 'check_status') {
      const { contractor_id } = body;
      if (!contractor_id) {
        return jsonError('contractor_id is required', 400);
      }

      const res = await fetch(
        `${JUMP_BASE_URL}/contractors/${contractor_id}/selfemployer`,
        { method: 'GET', headers: jumpHeaders },
      );

      const data = await res.json();
      if (!res.ok) {
        console.error('Jump check_status error:', JSON.stringify(data));
        const msg = data?.error?.detail || data?.message || 'Failed to check status';
        return jsonError(msg, res.status);
      }

      const item = data.item || data;
      const isVerified = item.is_verified === true;
      const statusMsg = item.messages?.status;

      // Map to app status
      const status = isVerified ? 'approved' : 'pending';
      const reason = statusMsg?.detail || null;

      return jsonSuccess({
        status,
        reason,
        is_verified: isVerified,
        is_can_pay_taxes: item.is_can_pay_taxes || false,
      });
    }

    // ── Get contractor info ──
    if (action === 'get_contractor') {
      const { contractor_id } = body;
      if (!contractor_id) {
        return jsonError('contractor_id is required', 400);
      }

      const res = await fetch(
        `${JUMP_BASE_URL}/contractors/${contractor_id}`,
        { method: 'GET', headers: jumpHeaders },
      );

      const data = await res.json();
      if (!res.ok) {
        console.error('Jump get_contractor error:', JSON.stringify(data));
        const msg = data?.error?.detail || data?.message || 'Failed to get contractor';
        return jsonError(msg, res.status);
      }

      const item = data.item || data;
      return jsonSuccess({
        id: item.id,
        first_name: item.first_name,
        last_name: item.last_name,
        inn: item.inn,
        legal_form: item.legal_form?.title,
        se_status: item.legal_form?.status?.value,
        se_verified: item.legal_form?.status?.is_verified,
        identification: item.identification?.value,
      });
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
