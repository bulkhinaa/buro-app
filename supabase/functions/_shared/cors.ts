// Shared CORS utility for all Edge Functions
// SEC-4: Restrict origins to known deployments only.
// React Native mobile apps do NOT send an Origin header, so missing Origin is allowed.

const ALLOWED_ORIGINS = [
  'https://bulkhinaa.github.io',
  'http://localhost:8081',
  'http://localhost:19006',
];

/**
 * Build CORS headers for a given request.
 * - If Origin is present and allowed, echo it back.
 * - If Origin is present but NOT allowed, return empty string (browser will block).
 * - If Origin is absent (React Native mobile), allow the request (no CORS enforcement).
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin');

  // No Origin header = mobile app or server-to-server call — allow
  if (!origin) {
    return {
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }

  // Check if origin is in allowlist
  if (ALLOWED_ORIGINS.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };
  }

  // Origin present but not allowed — return restrictive headers
  return {
    'Access-Control-Allow-Origin': '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

/**
 * Handle OPTIONS preflight. Returns a Response if it's a preflight request, or null otherwise.
 */
export function handleCorsPreflightIfNeeded(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const headers = getCorsHeaders(req);
    // If origin is not allowed, return 403
    if (headers['Access-Control-Allow-Origin'] === '') {
      return new Response('Forbidden', { status: 403, headers });
    }
    return new Response('ok', { headers });
  }
  return null;
}
