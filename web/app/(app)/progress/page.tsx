'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { todayNZ } from '@/lib/dateNZ';
import { BackChip } from '../settings/_components';
import {
  getUserHabits, habitColour, habitGoalNumber, buildHabitValueMap,
  activeDaysSet, currentStreak, bestStreak, averageCompletionRate, isHabitDone,
  type HabitDef, type ValueMap,
} from '@/lib/resultsHabits';

function toISO(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

function daysInMonthGrid(monthDate: Date): (Date | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadIn = (firstOfMonth.getDay() + 6) % 7; // Monday-first
  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadIn; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

// ─── Small stat card ────────────────────────────────────────────────────────

function StatCard({ label, value, colour }: { label: string; value: string; colour?: string }) {
  return (
    <div className="card" style={{ padding: '14px 12px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: colour ?? 'var(--text)', lineHeight: 1.1 }}>
        {value}
      </p>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
        {label}
      </p>
    </div>
  );
}

// ─── Small month calendar (Overall — dots only, no per-habit detail) ───────

function SmallMonthCalendar({ month, activeDates, today, colour = 'var(--primary)' }: {
  month: Date; activeDates: Set<string>; today: string; colour?: string;
}) {
  const cells = useMemo(() => daysInMonthGrid(month), [month]);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const isToday = iso === today;
          const active = activeDates.has(iso);
          return (
            <div
              key={i}
              style={{
                aspectRatio: '1', borderRadius: 8,
                border: isToday ? `1.5px solid ${colour}` : '1px solid var(--border)',
                backgroundColor: active ? colour : 'var(--surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Lato, sans-serif', fontSize: 11, fontWeight: isToday ? 700 : 400,
                color: active ? '#FFFFFF' : 'var(--text-muted)',
              }}
            >
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
  const habitKeys = habits.map(h => h.key);
  const activeDates = useMemo(() => activeDaysSet(habitKeys, valueMap, goals), [habitKeys, valueMap, goals]);

  const monthStart = toISO(new Date(new Date(today).getFullYear(), new Date(today).getMonth(), 1));
  const successThisMonth = useMemo(
    () => Array.from(activeDates).filter(d => d >= monthStart && d <= today).length,
    [activeDates, monthStart, today]
  );
  const totalSuccess = activeDates.size;
  const streak = useMemo(() => currentStreak(activeDates, today), [activeDates, today]);
  const best = useMemo(() => bestStreak(activeDates), [activeDates]);
  const monthlyRate = useMemo(
    () => habitKeys.length > 0 ? averageCompletionRate(habitKeys, valueMap, goals, monthStart, today) : 0,
    [habitKeys, valueMap, goals, monthStart, today]
  );

  if (habits.length === 0) {
    return (
      <div className="card-lg">
        <p className="body-sm">Add a habit from Home to start seeing your progress here.</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatCard label="Success this month" value={String(successThisMonth)} colour="var(--primary)" />
        <StatCard label="Total success" value={String(totalSuccess)} colour="var(--primary)" />
        <StatCard label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} colour="var(--primary-deep)" />
        <StatCard label="Best streak" value={`${best} day${best === 1 ? '' : 's'}`} colour="var(--primary-deep)" />
      </div>
      <div className="card-lg" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
          <p className="section-label" style={{ marginBottom: 0 }}>Monthly rate</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--primary)' }}>{monthlyRate}%</p>
        </div>
        <p className="body-sm">Averaged across your {habitKeys.length} active habit{habitKeys.length === 1 ? '' : 's'} this month.</p>
      </div>
      <div className="section">
        <p className="section-label">Active days this month</p>
        <div className="card">
          <SmallMonthCalendar month={new Date(today)} activeDates={activeDates} today={today} />
        </div>
      </div>
    </div>
  );
}

// ─── Per-habit month calendar (navigable, that habit's own done state) ─────

function HabitMonthCalendar({ month, onMonthChange, habitKey, valueMap, goal, today, colour }: {
  month: Date; onMonthChange: (m: Date) => void; habitKey: string; valueMap: ValueMap; goal: number; today: string; colour: string;
}) {
  const cells = useMemo(() => daysInMonthGrid(month), [month]);
  const monthLabel = month.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' });
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: 4 }} aria-label="Previous month">‹</button>
        <p className="section-label" style={{ marginBottom: 0 }}>{monthLabel}</p>
        <button onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: 4 }} aria-label="Next month">›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 4 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const isToday = iso === today;
          const done = isHabitDone(habitKey, iso, valueMap, goal);
          const logged = valueMap[habitKey]?.[iso] != null;
          return (
            <div key={i} style={{
              aspectRatio: '1', borderRadius: 8,
              border: isToday ? `1.5px solid ${colour}` : '1px solid var(--border)',
              backgroundColor: done ? colour : logged ? colour + '40' : 'var(--surface)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'Lato, sans-serif', fontSize: 11, fontWeight: isToday ? 700 : 400,
              color: done ? '#FFFFFF' : 'var(--text-muted)',
            }}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Yearly heatmap (small, GitHub-style) ──────────────────────────────────

function YearlyHeatmap({ habitKey, valueMap, goal, today, colour }: {
  habitKey: string; valueMap: ValueMap; goal: number; today: string; colour: string;
}) {
  const weeks = useMemo(() => {
    const end = new Date(today + 'T00:00:00Z');
    // Roll back to the Monday of the current week, then 52 more weeks before that.
    const endDay = (end.getUTCDay() + 6) % 7;
    const gridEnd = new Date(end); gridEnd.setUTCDate(end.getUTCDate() + (6 - endDay));
    const gridStart = new Date(gridEnd); gridStart.setUTCDate(gridEnd.getUTCDate() - 7 * 52 - 6);
    const cols: { iso: string; done: boolean; logged: boolean }[][] = [];
    const cursor = new Date(gridStart);
    for (let w = 0; w < 53; w++) {
      const col: { iso: string; done: boolean; logged: boolean }[] = [];
      for (let d = 0; d < 7; d++) {
        const iso = cursor.toISOString().slice(0, 10);
        col.push({ iso, done: iso <= today && isHabitDone(habitKey, iso, valueMap, goal), logged: iso <= today && valueMap[habitKey]?.[iso] != null });
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      }
      cols.push(col);
    }
    return cols;
  }, [habitKey, valueMap, goal, today]);

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'grid', gridAutoFlow: 'column', gridTemplateRows: 'repeat(7, 7px)', gap: 2, width: 'max-content', padding: '2px 0' }}>
        {weeks.flatMap((col, w) => col.map((cell, d) => {
          const future = cell.iso > today;
          return (
            <div
              key={`${w}-${d}`}
              title={cell.iso}
              style={{
                width: 7, height: 7, borderRadius: 2,
                backgroundColor: future ? 'transparent' : cell.done ? colour : cell.logged ? colour + '40' : 'var(--border)',
              }}
            />
          );
        }))}
      </div>
    </div>
  );
}

// ─── Per-habit view ──────────────────────────────────────────────────────

function HabitView({ habit, valueMap, goal, today }: { habit: HabitDef; valueMap: ValueMap; goal: number; today: string }) {
  const colour = habitColour(habit.key);
  const [month, setMonth] = useState(() => new Date(today));

  const habitActiveDates = useMemo(
    () => activeDaysSet([habit.key], valueMap, { [habit.key]: goal }),
    [habit.key, valueMap, goal]
  );
  const streak = useMemo(() => currentStreak(habitActiveDates, today), [habitActiveDates, today]);
  const best = useMemo(() => bestStreak(habitActiveDates), [habitActiveDates]);
  const successCount = habitActiveDates.size;

  const loggedDates = Object.keys(valueMap[habit.key] ?? {});
  const firstLogged = loggedDates.length > 0 ? loggedDates.sort()[0] : null;
  const completionRate = firstLogged
    ? Math.round((successCount / (Math.round((new Date(today + 'T00:00:00Z').getTime() - new Date(firstLogged + 'T00:00:00Z').getTime()) / 86_400_000) + 1)) * 100)
    : null;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <StatCard label="Current streak" value={`${streak} day${streak === 1 ? '' : 's'}`} colour={colour} />
        <StatCard label="Best streak" value={`${best} day${best === 1 ? '' : 's'}`} colour={colour} />
        <StatCard label="Success count" value={String(successCount)} colour={colour} />
        <StatCard label="Completion rate" value={completionRate != null ? `${completionRate}%` : '—'} colour={colour} />
      </div>

      <div className="section">
        <div className="card">
          <HabitMonthCalendar
            month={month} onMonthChange={setMonth}
            habitKey={habit.key} valueMap={valueMap} goal={goal} today={today} colour={colour}
          />
        </div>
      </div>

      <div className="section">
        <p className="section-label">Yearly status</p>
        <div className="card">
          <YearlyHeatmap habitKey={habit.key} valueMap={valueMap} goal={goal} today={today} colour={colour} />
        </div>
      </div>
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
