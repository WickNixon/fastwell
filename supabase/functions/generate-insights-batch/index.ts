// Edge Function: generate-insights-batch
// Called daily at 6am NZST via pg_cron
// Finds active users with expired/missing insight cache and triggers generate-insights per user

import { corsHeaders, getServiceClient, jsonResponse, errorResponse } from '../_shared/supabase.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const supabase = getServiceClient();

  try {
    const now = new Date().toISOString();

    // Find active users (trialing or active subscription) with expired or no insight cache
    // Limit 50 per batch to avoid timeout
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id')
      .in('subscription_status', ['trialing', 'active'])
      .neq('subscription_tier', 'inactive')
      .limit(50);

    if (error) throw error;
    if (!users || users.length === 0) {
      return jsonResponse({ processed: 0, message: 'No active users found' });
    }

    // For each user, check if their insight cache is expired
    const expiredUsers: string[] = [];

    for (const user of users) {
      const { data: freshInsight } = await supabase
        .from('ai_insights')
        .select('id')
        .eq('user_id', user.id)
        .gt('expires_at', now)
        .limit(1)
        .single();

      if (!freshInsight) expiredUsers.push(user.id);
    }

    if (expiredUsers.length === 0) {
      return jsonResponse({ processed: 0, message: 'All users have fresh insights' });
    }

    // Call generate-insights for each user that needs it
    const results = await Promise.allSettled(
      expiredUsers.map((userId) =>
        fetch(`${SUPABASE_URL}/functions/v1/generate-insights`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({ user_id: userId }),
        })
      )
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return jsonResponse({
      active_users: users.length,
      expired_cache: expiredUsers.length,
      insights_generated: succeeded,
      failed,
    });
  } catch (e) {
    console.error('generate-insights-batch error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
