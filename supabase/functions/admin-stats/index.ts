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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalUsers,
    memberTier,
    subscriberTier,
    inactive,
    pendingInvites,
    totalBadges,
    mostEarnedBadge,
    active7,
    active30,
  ] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'member'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'subscriber'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('subscription_tier', 'inactive'),
    supabase.from('invite_tokens').select('id', { count: 'exact', head: true }).eq('is_used', false).gt('expires_at', new Date().toISOString()),
    supabase.from('user_badges').select('id', { count: 'exact', head: true }),
    supabase.from('user_badges').select('badge_key').limit(1000),
    supabase.from('health_entries').select('user_id').gte('entry_date', sevenDaysAgo.toISOString().split('T')[0]),
    supabase.from('health_entries').select('user_id').gte('entry_date', thirtyDaysAgo.toISOString().split('T')[0]),
  ]);

  // Most earned badge
  const badgeCounts: Record<string, number> = {};
  for (const b of mostEarnedBadge.data ?? []) {
    badgeCounts[b.badge_key] = (badgeCounts[b.badge_key] ?? 0) + 1;
  }
  const topBadge = Object.entries(badgeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const active7Set = new Set((active7.data ?? []).map((r) => r.user_id));
  const active30Set = new Set((active30.data ?? []).map((r) => r.user_id));

  // Quiet users (no activity in 7 days)
  const { data: quietUsers } = await supabase
    .from('profiles')
    .select('id, first_name, updated_at')
    .neq('subscription_tier', 'inactive')
    .order('updated_at', { ascending: true })
    .limit(20);

  const quietFiltered = (quietUsers ?? []).filter((u) => !active7Set.has(u.id)).slice(0, 10);

  return jsonResponse({
    total_users: totalUsers.count ?? 0,
    active_last_7_days: active7Set.size,
    active_last_30_days: active30Set.size,
    member_tier: memberTier.count ?? 0,
    subscriber_tier: subscriberTier.count ?? 0,
    inactive: inactive.count ?? 0,
    pending_invites: pendingInvites.count ?? 0,
    total_badges_earned: totalBadges.count ?? 0,
    most_earned_badge: topBadge,
    users_quiet_7_days: quietFiltered.map((u) => ({
      id: u.id,
      first_name: u.first_name,
      last_active: u.updated_at,
    })),
  });
});
