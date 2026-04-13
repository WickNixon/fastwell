import { corsHeaders, errorResponse, getServiceClient, getUserClient, jsonResponse } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = getUserClient(authHeader);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const supabase = getServiceClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single();

  if (!profile) return errorResponse('Profile not found', 'NOT_FOUND', 404);

  // Active paid subscription — no paywall
  if (profile.subscription_status === 'active' || profile.subscription_status === 'trialing') {
    if (profile.trial_ends_at && new Date(profile.trial_ends_at) > new Date()) {
      return jsonResponse({
        paywall: false,
        subscription_tier: profile.subscription_tier,
        subscription_status: profile.subscription_status,
      });
    }
    if (profile.subscription_status === 'active') {
      return jsonResponse({
        paywall: false,
        subscription_tier: profile.subscription_tier,
        subscription_status: profile.subscription_status,
      });
    }
  }

  // Trial expired or inactive — show paywall
  const [fastingResult, badgesResult, daysResult] = await Promise.all([
    supabase.from('fasting_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).not('ended_at', 'is', null),
    supabase.from('user_badges').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('health_entries').select('entry_date').eq('user_id', user.id).order('entry_date', { ascending: true }).limit(1),
  ]);

  const fastingSessions = fastingResult.count ?? 0;
  const badgesEarned = badgesResult.count ?? 0;
  const firstEntry = daysResult.data?.[0]?.entry_date;
  const daysTracked = firstEntry
    ? Math.floor((Date.now() - new Date(firstEntry).getTime()) / 86400000)
    : 0;

  return jsonResponse({
    paywall: true,
    reason: 'trial_expired',
    fasting_sessions: fastingSessions,
    badges_earned: badgesEarned,
    days_tracked: daysTracked,
  });
});
