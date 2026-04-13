import { corsHeaders, errorResponse, getServiceClient, getUserClient, jsonResponse } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = getUserClient(authHeader);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const supabase = getServiceClient();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return errorResponse('Forbidden', 'FORBIDDEN', 403);

  try {
    const { target, user_id, title, body } = await req.json();
    if (!title || !body) return errorResponse('title and body are required', 'MISSING_FIELDS');

    let targets: { id: string; push_token?: string }[] = [];

    if (target === 'all') {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .neq('subscription_tier', 'inactive');
      targets = data ?? [];
    } else if (target === 'user' && user_id) {
      targets = [{ id: user_id }];
    } else {
      return errorResponse('target must be "all" or "user" with user_id', 'INVALID_TARGET');
    }

    // Log notifications
    const logRows = targets.map((t) => ({
      user_id: t.id,
      sent_by: user.id,
      type: 'coach_nudge',
      title,
      body,
    }));

    if (logRows.length > 0) {
      await supabase.from('notifications_log').insert(logRows);
    }

    // In production, push via Expo Push API
    // Expo tokens would be stored in profiles.push_token
    // For now, log and return count

    return jsonResponse({ sent_to: targets.length, failed: 0 });
  } catch (e) {
    console.error('send-nudge error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
