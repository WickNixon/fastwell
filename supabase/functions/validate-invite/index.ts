import { corsHeaders, errorResponse, getServiceClient, jsonResponse } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const { token } = await req.json();
    if (!token) return errorResponse('Token is required', 'MISSING_TOKEN');

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) return jsonResponse({ valid: false, reason: 'not_found' });

    if (data.is_used) return jsonResponse({ valid: false, reason: 'used' });

    if (new Date(data.expires_at) < new Date()) {
      return jsonResponse({ valid: false, reason: 'expired' });
    }

    return jsonResponse({ valid: true, email: data.email, first_name: data.first_name });
  } catch (e) {
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
