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
    .select('subscription_tier, subscription_status, pro_trial_started_at, pro_trial_ends_at')
    .eq('id', user.id)
    .single();

  if (!profile) return errorResponse('Profile not found', 'NOT_FOUND', 404);

  const now = new Date();
  const trialEndsAt = profile.pro_trial_ends_at ? new Date(profile.pro_trial_ends_at) : null;
  const proTrialActive = trialEndsAt !== null && trialEndsAt > now;
  const proTrialDaysRemaining = proTrialActive
    ? Math.ceil((trialEndsAt!.getTime() - now.getTime()) / 86400000)
    : null;

  return jsonResponse({
    subscription_tier: profile.subscription_tier ?? 'free',
    pro_trial_active: proTrialActive,
    pro_trial_days_remaining: proTrialDaysRemaining,
    subscription_status: profile.subscription_status ?? null,
  });
});
