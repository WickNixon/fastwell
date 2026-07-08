'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { todayNZ } from '@/lib/dateNZ';
import { BackChip } from '../settings/_components';
import {
  getUserHabits, habitColour, habitGoalNumber, buildHabitValueMap,
  type HabitDef, type ValueMap,
} from '@/lib/resultsHabits';

function ChevronDown() {
  return (
    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden>
      <path d="M1 1l4 4 4-4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Dropdown ──────────────────────────────────────────────────────────────

function ResultsDropdown({
  habits, selected, onChange,
}: {
  habits: HabitDef[];
  selected: string;
  onChange: (val: string) => void;
}) {
  const selectedLabel = selected === 'overall' ? 'Overall' : habits.find(h => h.key === selected)?.label ?? 'Overall';
  const dotColour = selected === 'overall' ? 'var(--primary)' : habitColour(selected);
  return (
    <div style={{
      position: 'relative', border: '1px solid var(--border)', borderRadius: 12,
      backgroundColor: 'var(--surface)', marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 52, padding: '0 16px', gap: 10, pointerEvents: 'none' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: dotColour, flexShrink: 0 }} />
        <span style={{ flex: 1, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)' }}>
          {selectedLabel}
        </span>
        <ChevronDown />
      </div>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        aria-label="View"
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%', fontSize: 16 }}
      >
        <option value="overall">Overall</option>
        {habits.map(h => (
          <option key={h.key} value={h.key}>{h.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Overall view (filled in Change 2) ──────────────────────────────────────

function OverallView({ habits, valueMap, goals, today }: { habits: HabitDef[]; valueMap: ValueMap; goals: Record<string, number>; today: string }) {
  void habits; void valueMap; void goals; void today;
  return (
    <div className="card-lg">
      <p className="body-sm">Overall stats coming next.</p>
    </div>
  );
}

// ─── Per-habit view (filled in Change 3) ────────────────────────────────────

function HabitView({ habit, valueMap, goal, today }: { habit: HabitDef; valueMap: ValueMap; goal: number; today: string }) {
  void valueMap; void goal; void today;
  return (
    <div className="card-lg">
      <p className="section-label" style={{ color: habitColour(habit.key) }}>{habit.label}</p>
      <p className="body-sm">Habit detail coming next.</p>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────

export default function ProgressPage() {
  const { profile } = useAuth();
  const today = todayNZ();

  const [habits, setHabits] = useState<HabitDef[]>([]);
  const [selected, setSelected] = useState('overall');
  const [customHabitsDb, setCustomHabitsDb] = useState<Record<string, { goal: number; unit: string }>>({});
  const [entries, setEntries] = useState<{ entry_date: string; metric: string; value: number | null }[]>([]);
  const [symptomDates, setSymptomDates] = useState<string[]>([]);

  useEffect(() => { setHabits(getUserHabits()); }, []);

  const load = useCallback(async () => {
    if (!profile) return;
    const yearAgo = new Date();
    yearAgo.setDate(yearAgo.getDate() - 400);
    const yearAgoISO = yearAgo.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
    const sb = getSupabase();
    const [{ data: profileData }, { data: entryRows }, { data: symptomRows }] = await Promise.all([
      sb.from('profiles').select('custom_habits').eq('id', profile.id).maybeSingle(),
      sb.from('health_entries').select('entry_date,metric,value').eq('user_id', profile.id).gte('entry_date', yearAgoISO),
      sb.from('symptoms_log').select('entry_date').eq('user_id', profile.id).gte('entry_date', yearAgoISO),
    ]);
    if (profileData?.custom_habits) setCustomHabitsDb(profileData.custom_habits as Record<string, { goal: number; unit: string }>);
    setEntries(entryRows ?? []);
    setSymptomDates(Array.from(new Set((symptomRows ?? []).map(r => r.entry_date))));
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const valueMap = useMemo(() => buildHabitValueMap(entries, symptomDates), [entries, symptomDates]);

  const goals = useMemo(() => {
    const g: Record<string, number> = {};
    habits.forEach(h => { g[h.key] = habitGoalNumber(h, customHabitsDb); });
    return g;
  }, [habits, customHabitsDb]);

  const selectedHabit = habits.find(h => h.key === selected) ?? null;

  return (
    <div className="page page-top">
      <BackChip />
      <h1 className="h1 mb-8" style={{ marginTop: 16 }}>Results</h1>
      <p className="body-sm mb-16">Your consistency, not a streak to lose.</p>

      <ResultsDropdown habits={habits} selected={selected} onChange={setSelected} />

      {selected === 'overall' || !selectedHabit ? (
        <OverallView habits={habits} valueMap={valueMap} goals={goals} today={today} />
      ) : (
        <HabitView habit={selectedHabit} valueMap={valueMap} goal={goals[selectedHabit.key] ?? 1} today={today} />
      )}
    </div>
  );
}
