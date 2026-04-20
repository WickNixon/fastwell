import { getSupabase } from './supabase-browser';
import { BADGES, type BadgeId } from '@/constants/badges';

async function hasEarned(userId: string, badgeId: BadgeId): Promise<boolean> {
  const { data } = await getSupabase()
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_key', badgeId)
    .maybeSingle();
  return !!data;
}

async function award(userId: string, badgeId: BadgeId): Promise<void> {
  const badge = BADGES[badgeId];
  await getSupabase().from('user_badges').insert({
    user_id: userId,
    badge_key: badgeId,
    badge_name: badge.name,
    earned_at: new Date().toISOString(),
    seen: false,
  });
}

function consecutiveDays(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort().reverse();
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i - 1]).getTime() - new Date(sorted[i]).getTime()) / 86400000;
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}

export async function checkAndAwardBadges(userId: string): Promise<BadgeId[]> {
  const sb = getSupabase();
  const newlyEarned: BadgeId[] = [];

  const tryAward = async (id: BadgeId, condition: boolean) => {
    if (!condition) return;
    if (await hasEarned(userId, id)) return;
    await award(userId, id);
    newlyEarned.push(id);
  };

  try {
    // you_showed_up — awarded directly from onboarding complete screen; check here for safety
    const { data: profile } = await sb.from('profiles').select('created_at, onboarding_complete').eq('id', userId).maybeSingle();
    await tryAward('you_showed_up', !!profile?.onboarding_complete);

    // three_months_stronger — 90 days since account creation
    if (profile?.created_at) {
      const daysSince = (Date.now() - new Date(profile.created_at).getTime()) / 86400000;
      await tryAward('three_months_stronger', daysSince >= 90);
    }

    // Fasting-based badges
    const { data: fastingSessions } = await sb
      .from('fasting_sessions')
      .select('id, ended_at, duration_minutes')
      .eq('user_id', userId)
      .not('ended_at', 'is', null);

    const completedFasts = fastingSessions ?? [];
    await tryAward('first_fast', completedFasts.length >= 1);
    await tryAward('building_momentum', completedFasts.length >= 7);
    await tryAward('fortnight_faster', completedFasts.length >= 14);
    const hasDeepFast = completedFasts.some(f => (f.duration_minutes ?? 0) >= 24 * 60);
    await tryAward('going_deep', hasDeepFast);

    // food_logs
    const { count: mealCount } = await sb
      .from('food_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    await tryAward('meal_mindful', (mealCount ?? 0) >= 10);

    // Biomarker-based badges
    const { data: biomarkers } = await sb
      .from('biomarkers')
      .select('id, marker, value, reading_date')
      .eq('user_id', userId)
      .order('reading_date', { ascending: true });

    const allBiomarkers = biomarkers ?? [];
    await tryAward('know_your_numbers', allBiomarkers.length >= 1);

    const glucoseReadings = allBiomarkers.filter(b => b.marker === 'glucose');
    await tryAward('blood_sugar_watcher', glucoseReadings.length >= 10);

    const hba1cReadings = allBiomarkers.filter(b => b.marker === 'hba1c');
    if (hba1cReadings.length >= 2) {
      const first = hba1cReadings[0].value;
      const latest = hba1cReadings[hba1cReadings.length - 1].value;
      await tryAward('your_body_is_responding', latest < first);
    }

    // Health entry streaks
    const { data: healthEntries } = await sb
      .from('health_entries')
      .select('entry_date, metric, value')
      .eq('user_id', userId)
      .order('entry_date', { ascending: false });

    const entries = healthEntries ?? [];

    // Water goal: 7 consecutive days ≥ 2000ml
    const waterDates = entries
      .filter(e => e.metric === 'water_ml' && (e.value ?? 0) >= 2000)
      .map(e => e.entry_date);
    await tryAward('hydration_queen', consecutiveDays(waterDates) >= 7);

    // Sleep devotee: 5 consecutive days ≥ 7 hours
    const sleepDates = entries
      .filter(e => e.metric === 'sleep_hours' && (e.value ?? 0) >= 7)
      .map(e => e.entry_date);
    await tryAward('sleep_devotee', consecutiveDays(sleepDates) >= 5);

    // Consistent mover: 5 consecutive days exercise > 0
    const exerciseDates = entries
      .filter(e => (e.metric === 'exercise_minutes' || e.metric === 'exercise') && (e.value ?? 0) > 0)
      .map(e => e.entry_date);
    await tryAward('consistent_mover', consecutiveDays(exerciseDates) >= 5);

    // This is who you are now: 30 consecutive days any single metric
    const metricGroups: Record<string, string[]> = {};
    for (const e of entries) {
      if (!metricGroups[e.metric]) metricGroups[e.metric] = [];
      metricGroups[e.metric].push(e.entry_date);
    }
    const hasThirtyStreak = Object.values(metricGroups).some(dates => consecutiveDays(dates) >= 30);
    await tryAward('this_is_who_you_are_now', hasThirtyStreak);

  } catch {
    // Non-critical — badge checking should never break the app
  }

  return newlyEarned;
}
