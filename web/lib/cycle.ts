import type { PeriodLog, Profile } from './types';

export type TrackingMode = 'period' | 'symptom';

// Resolve which version of the Tracking page a user sees.
// Explicit override (profiles.cycle_tracking_mode) always wins.
// Otherwise: still-cycling perimenopause -> period; everything else -> symptom
// (transition, post_menopause, not_sure, null, or perimenopause with no cycle).
export function resolveTrackingMode(profile: Pick<Profile, 'menopause_stage' | 'has_regular_cycle' | 'cycle_tracking_mode'> | null): TrackingMode {
  if (!profile) return 'symptom';
  if (profile.cycle_tracking_mode === 'period' || profile.cycle_tracking_mode === 'symptom') {
    return profile.cycle_tracking_mode;
  }
  const stillCycling = profile.menopause_stage === 'perimenopause' && profile.has_regular_cycle !== 'no';
  return stillCycling ? 'period' : 'symptom';
}

// ─── Cycle phases ──────────────────────────────────────────────────────────

export type Phase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal';

export const PHASE_INFO: Record<Phase, { label: string; colour: string; guidance: string }> = {
  menstrual: {
    label: 'Menstrual',
    colour: '#E2682A',
    guidance: 'Energy is often lower here. Gentle is good — shorter windows (~13h), nourish and hydrate.',
  },
  follicular: {
    label: 'Follicular',
    colour: '#1E8A4F',
    guidance: 'Usually your strongest window for fasting. Longer windows (up to ~15h) tend to feel fine here.',
  },
  ovulation: {
    label: 'Ovulation',
    colour: '#14693A',
    guidance: 'Energy and focus often peak now. Moderate windows (~15h) are usually well tolerated.',
  },
  luteal: {
    label: 'Luteal',
    colour: '#6B9B4A',
    guidance: 'The week before your period is a good one to ease off — shorter windows (12-14h), more carbs and rest, less pressure.',
  },
};

// Proportional phase bands scaled to a cycle length (defaults to 28 days).
export function phaseForCycleDay(cycleDay: number, cycleLength = 28): Phase {
  const len = cycleLength > 0 ? cycleLength : 28;
  const menstrualEnd = Math.max(4, Math.round(len * 0.18));
  const follicularEnd = Math.round(len * 0.5);
  const ovulationEnd = Math.min(len - 1, follicularEnd + 3);
  if (cycleDay <= menstrualEnd) return 'menstrual';
  if (cycleDay <= follicularEnd) return 'follicular';
  if (cycleDay <= ovulationEnd) return 'ovulation';
  return 'luteal';
}

// ─── Prediction ────────────────────────────────────────────────────────────

export interface CyclePrediction {
  lastStart: string | null;
  cycleDay: number | null;
  avgCycleLength: number | null;
  cyclesUsed: number;
  predictedNextStart: string | null;
  irregular: boolean;
  phase: Phase | null;
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86_400_000);
}

export function analyzeCycles(periodLogs: PeriodLog[], todayISO: string): CyclePrediction {
  const starts = Array.from(new Set(
    periodLogs.filter(p => p.status === 'start').map(p => p.entry_date)
  )).sort();

  if (starts.length === 0) {
    return { lastStart: null, cycleDay: null, avgCycleLength: null, cyclesUsed: 0, predictedNextStart: null, irregular: false, phase: null };
  }

  const lengths: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    lengths.push(daysBetween(starts[i - 1], starts[i]));
  }
  const lastThree = lengths.slice(-3);
  const avgCycleLength = lastThree.length > 0
    ? Math.round(lastThree.reduce((a, b) => a + b, 0) / lastThree.length)
    : null;

  let irregular = false;
  if (lastThree.length >= 2 && avgCycleLength) {
    const variance = lastThree.reduce((sum, l) => sum + (l - avgCycleLength) ** 2, 0) / lastThree.length;
    const stdev = Math.sqrt(variance);
    irregular = stdev / avgCycleLength > 0.2; // >20% variability -> too irregular to trust
  }

  const lastStart = starts[starts.length - 1];
  const cycleDay = daysBetween(lastStart, todayISO) + 1;
  const effectiveLength = avgCycleLength ?? 28;
  const phase = phaseForCycleDay(cycleDay, effectiveLength);

  const predictedNextStart = avgCycleLength && !irregular && lengths.length >= 2
    ? new Date(new Date(lastStart + 'T00:00:00Z').getTime() + avgCycleLength * 86_400_000).toISOString().slice(0, 10)
    : null;

  return {
    lastStart,
    cycleDay,
    avgCycleLength,
    cyclesUsed: lengths.length,
    predictedNextStart,
    irregular,
    phase,
  };
}

// ─── Moon rhythm (30-day, new-moon-anchored) — for no-cycle stages ────────

// A known new moon reference (astronomical), used purely as a day-count anchor.
const REFERENCE_NEW_MOON_UTC = Date.UTC(2000, 0, 6, 18, 14);
const SYNODIC_MONTH_DAYS = 29.530588853;

// Returns 1-30 (new moon = day 1).
export function moonDay(dateISO: string): number {
  const t = new Date(dateISO + 'T12:00:00Z').getTime();
  const daysSinceRef = (t - REFERENCE_NEW_MOON_UTC) / 86_400_000;
  const cyclePos = ((daysSinceRef % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  return Math.floor(cyclePos) + 1;
}

export type MoonRhythm = 'build' | 'sustain' | 'ease';

export function moonRhythmForDay(day: number): { rhythm: MoonRhythm; label: string; guidance: string } {
  if (day <= 10) {
    return {
      rhythm: 'build',
      label: 'Build phase',
      guidance: 'New-to-waxing moon — often a stronger stretch for a slightly longer fasting window, if it feels right.',
    };
  }
  if (day <= 20) {
    return {
      rhythm: 'sustain',
      label: 'Sustain phase',
      guidance: 'Full-moon stretch — keep a steady, moderate rhythm. Listen to your body rather than pushing.',
    };
  }
  return {
    rhythm: 'ease',
    label: 'Ease phase',
    guidance: 'Waning back to new moon — a gentler stretch. Shorter windows and more nourishment are completely fine.',
  };
}

// ─── Symptom-led guidance (no reliable cycle) ─────────────────────────────

export function symptomLoadGuidance(symptomCountToday: number): { label: string; guidance: string } {
  if (symptomCountToday >= 3) {
    return {
      label: 'Heavier symptom day',
      guidance: 'A few things showing up today — a gentler, shorter fasting window and extra nourishment is a kind choice.',
    };
  }
  if (symptomCountToday === 0) {
    return {
      label: 'Good stretch',
      guidance: 'A clear day — if it feels right, this can be a stronger window for fasting.',
    };
  }
  return {
    label: 'Steady day',
    guidance: 'A moderate day — keep your usual rhythm and adjust if anything changes.',
  };
}
