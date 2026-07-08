// Habit definitions + "done" math for the Results tab.
// Mirrors DEFAULT_HABITS / HABIT_LIBRARY / METRIC_TO_HABIT / goalToNumber in
// dashboard/page.tsx (Home is out of scope for the Results build, so this is a
// deliberate parallel copy, not an import — keep in sync if Home's habit list changes).

export interface HabitDef {
  key: string;
  label: string;
  icon: string;
  href: string;
  goal?: string;
}

export const DEFAULT_HABITS: HabitDef[] = [
  { key: 'exercise', label: 'Exercise', icon: '🏃', href: '/track/exercise', goal: '30 mins' },
  { key: 'sleep', label: 'Sleep', icon: '😴', href: '/track/sleep', goal: '8 hours' },
  { key: 'water', label: 'Water', icon: '💧', href: '/track/water', goal: '2000ml' },
];

export const HABIT_LIBRARY: HabitDef[] = [
  { key: 'walking', label: 'Walking', icon: '🚶', href: '/track/steps', goal: '10,000 steps' },
  { key: 'meditation', label: 'Meditation', icon: '🧘', href: '/track/meditation', goal: '10 mins' },
  { key: 'reading', label: 'Read a book', icon: '📚', href: '/track/reading', goal: '20 mins' },
  { key: 'caffeine', label: 'Caffeine intake', icon: '☕', href: '/track/caffeine', goal: 'Daily log' },
  { key: 'veggies', label: 'Eat fruits & veggies', icon: '🥦', href: '/track/fruits', goal: 'Daily tick' },
  { key: 'review', label: 'Review your day', icon: '🌙', href: '/track/review', goal: 'Daily tick' },
  { key: 'mood', label: 'Mood check', icon: '😊', href: '/track/mood', goal: 'Daily' },
  { key: 'energy', label: 'Energy check', icon: '⚡', href: '/track/energy', goal: 'Daily' },
  { key: 'symptoms', label: 'Symptoms log', icon: '🌡', href: '/track/symptoms', goal: 'Daily' },
  { key: 'weight', label: 'Weight', icon: '⚖️', href: '/track/weight', goal: 'Daily' },
];

// Every health_entries.metric string that represents a given habit being logged —
// covers both the "real metric" write path (from the habit's own track page) and
// the legacy check-row path (metric === habit key, written by a Home tick).
export const HABIT_METRICS: Record<string, string[]> = {
  exercise: ['exercise_minutes'],
  sleep: ['sleep_hours'],
  water: ['water_ml'],
  walking: ['steps'],
  meditation: ['meditation_minutes', 'meditation'],
  reading: ['reading_minutes', 'reading'],
  caffeine: ['caffeine_drinks', 'caffeine'],
  veggies: ['fruits_veggies', 'veggies'],
  review: ['day_review', 'review'],
  mood: ['mood'],
  energy: ['energy_level', 'energy'],
  weight: ['weight'],
  // symptoms is handled separately — it's primarily logged to symptoms_log, not health_entries.
};

// Habits with a real numeric goal to hit; everything else is "done if logged at all".
export const NUMERIC_GOAL_KEYS = new Set(['exercise', 'sleep', 'water', 'walking', 'meditation', 'reading']);

// No HABIT_COLOURS palette exists in the codebase (Home renders every habit in a single
// green) — this is a new, brand-safe per-habit palette for Results only. No red.
export const HABIT_COLOURS: Record<string, string> = {
  exercise: '#1E8A4F',
  sleep: '#14693A',
  water: '#2E9BB0',
  walking: '#E2682A',
  meditation: '#8A6D3B',
  reading: '#6B9B4A',
  caffeine: '#C98A3E',
  veggies: '#4F8A6B',
  review: '#7A6B9B',
  mood: '#9B7A4F',
  energy: '#3B8A8A',
  symptoms: '#B08040',
  weight: '#5B8A9B',
};

export function habitColour(key: string): string {
  return HABIT_COLOURS[key] ?? '#1E8A4F';
}

export function goalToNumber(goal: string | undefined, habitKey: string): number {
  const defaults: Record<string, number> = {
    water: 2000, exercise: 30, sleep: 8, walking: 10000, meditation: 10, reading: 20,
  };
  if (!goal) return defaults[habitKey] ?? 1;
  const match = goal.replace(/,/g, '').match(/[\d]+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : (defaults[habitKey] ?? 1);
}

// Reads the same localStorage key Home writes to — the active-habit list has no
// server-side source of truth (only each habit's goal value is mirrored to
// profiles.custom_habits). Client-side only; returns [] during SSR.
export function getUserHabits(): HabitDef[] {
  if (typeof window === 'undefined') return DEFAULT_HABITS;
  try {
    const stored = localStorage.getItem('fastwell_custom_habits');
    const custom: HabitDef[] = stored ? (JSON.parse(stored) as HabitDef[]).filter(h => h.key !== 'alcohol') : [];
    return [...DEFAULT_HABITS, ...custom];
  } catch {
    return DEFAULT_HABITS;
  }
}

export function habitGoalNumber(habit: HabitDef, customHabitsDb: Record<string, { goal: number; unit: string }>): number {
  const dbGoal = customHabitsDb[habit.key]?.goal;
  if (dbGoal != null) return dbGoal;
  return goalToNumber(habit.goal, habit.key);
}

// ─── Value map + "done" math ───────────────────────────────────────────────

export type ValueMap = Record<string, Record<string, number>>;

export function buildHabitValueMap(
  entries: { entry_date: string; metric: string; value: number | null }[],
  symptomDates: string[],
): ValueMap {
  const map: ValueMap = {};
  for (const e of entries) {
    for (const [habitKey, metrics] of Object.entries(HABIT_METRICS)) {
      if (metrics.includes(e.metric)) {
        const bucket = (map[habitKey] ??= {});
        bucket[e.entry_date] = Math.max(bucket[e.entry_date] ?? 0, e.value ?? 1);
      }
    }
  }
  if (symptomDates.length > 0) {
    const bucket = (map['symptoms'] ??= {});
    symptomDates.forEach(d => { bucket[d] = 1; });
  }
  return map;
}

export function isHabitDone(habitKey: string, date: string, valueMap: ValueMap, goalNum: number): boolean {
  const v = valueMap[habitKey]?.[date];
  if (v == null) return false;
  if (NUMERIC_GOAL_KEYS.has(habitKey)) return v >= goalNum;
  return true;
}

export function activeDaysSet(habitKeys: string[], valueMap: ValueMap, goals: Record<string, number>): Set<string> {
  const set = new Set<string>();
  for (const key of habitKeys) {
    for (const date of Object.keys(valueMap[key] ?? {})) {
      if (isHabitDone(key, date, valueMap, goals[key] ?? 1)) set.add(date);
    }
  }
  return set;
}

function toISO(d: Date) { return d.toISOString().slice(0, 10); }

export function currentStreak(activeDates: Set<string>, todayISO: string): number {
  let streak = 0;
  const cursor = new Date(todayISO + 'T00:00:00Z');
  while (activeDates.has(toISO(cursor))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

export function bestStreak(activeDates: Set<string>): number {
  const sorted = Array.from(activeDates).sort();
  let best = 0, cur = 0, prev: string | null = null;
  for (const d of sorted) {
    if (prev) {
      const gap = Math.round((new Date(d + 'T00:00:00Z').getTime() - new Date(prev + 'T00:00:00Z').getTime()) / 86_400_000);
      cur = gap === 1 ? cur + 1 : 1;
    } else {
      cur = 1;
    }
    best = Math.max(best, cur);
    prev = d;
  }
  return best;
}

// Average per-day completion (0-100), averaged across the given habits, for days
// in [startISO, endISO] inclusive. This is the "averaged across active habits"
// rollup used for Overall's Monthly rate — distinct from the "any habit done"
// definition used for Success/streaks/calendar, which never penalises a day where
// she only did some of her habits.
export function averageCompletionRate(
  habitKeys: string[], valueMap: ValueMap, goals: Record<string, number>, startISO: string, endISO: string,
): number {
  if (habitKeys.length === 0) return 0;
  const start = new Date(startISO + 'T00:00:00Z');
  const end = new Date(endISO + 'T00:00:00Z');
  let dayCount = 0;
  let sum = 0;
  for (const d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const iso = toISO(d);
    const doneCount = habitKeys.filter(k => isHabitDone(k, iso, valueMap, goals[k] ?? 1)).length;
    sum += doneCount / habitKeys.length;
    dayCount++;
  }
  return dayCount > 0 ? Math.round((sum / dayCount) * 100) : 0;
}

// ─── Trend chart data (reuses the same value map — Week/Month/Year buckets) ─

export type TrendPeriod = 'week' | 'month' | 'year';
export interface ChartPoint { label: string; value: number }

const DAY_ABBRS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function buildHabitTrendPoints(habitKey: string, period: TrendPeriod, valueMap: ValueMap, todayISO: string): ChartPoint[] {
  const series = valueMap[habitKey] ?? {};
  const today = new Date(todayISO + 'T00:00:00Z');

  if (period === 'week') {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setUTCDate(today.getUTCDate() - 6 + i);
      return { label: DAY_ABBRS[d.getUTCDay()], value: series[d.toISOString().slice(0, 10)] ?? 0 };
    });
  }
  if (period === 'month') {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today); d.setUTCDate(today.getUTCDate() - 29 + i);
      return { label: String(d.getUTCDate()), value: series[d.toISOString().slice(0, 10)] ?? 0 };
    });
  }
  // year — 12 months, averaged across the days logged in that month
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
    const y = d.getFullYear(), m = d.getMonth();
    const vals = Object.entries(series)
      .filter(([date]) => { const dd = new Date(date + 'T00:00:00Z'); return dd.getUTCFullYear() === y && dd.getUTCMonth() === m; })
      .map(([, v]) => v);
    return { label: MONTH_LABELS[m], value: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });
}
