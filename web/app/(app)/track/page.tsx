'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import { todayNZ } from '@/lib/dateNZ';
import type { PeriodLog, SymptomLog } from '@/lib/types';
import {
  resolveTrackingMode, analyzeCycles, phaseForCycleDay, PHASE_INFO,
  moonDay, moonRhythmForDay, symptomLoadGuidance,
  type TrackingMode,
} from '@/lib/cycle';

const SYMPTOMS = [
  { key: 'hot_flush', label: 'Hot flush' },
  { key: 'night_sweats', label: 'Night sweats' },
  { key: 'brain_fog', label: 'Brain fog' },
  { key: 'joint_pain', label: 'Joint pain' },
  { key: 'anxiety', label: 'Anxiety' },
  { key: 'bloating', label: 'Bloating' },
  { key: 'headache', label: 'Headache' },
  { key: 'fatigue', label: 'Fatigue' },
  { key: 'mood_swings', label: 'Mood swings' },
  { key: 'insomnia', label: 'Sleep trouble' },
  { key: 'low_libido', label: 'Low libido' },
  { key: 'vaginal_dryness', label: 'Vaginal dryness' },
  { key: 'hair_thinning', label: 'Hair thinning' },
];

function monthLabel(d: Date) {
  return d.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric', timeZone: 'Pacific/Auckland' });
}

function toISO(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

function daysInMonthGrid(monthDate: Date): (Date | null)[] {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Monday-first grid
  const leadIn = (firstOfMonth.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < leadIn; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  return cells;
}

// ─── Month calendar ────────────────────────────────────────────────────────

function MonthCalendar({
  month, today, dayFill, dayLabel, onSelect,
}: {
  month: Date;
  today: string;
  dayFill: (iso: string) => { bg: string; fg: string; ring?: boolean };
  dayLabel?: (iso: string) => string | null;
  onSelect: (iso: string) => void;
}) {
  const cells = useMemo(() => daysInMonthGrid(month), [month]);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = toISO(d);
          const isToday = iso === today;
          const { bg, fg, ring } = dayFill(iso);
          return (
            <button
              key={i}
              onClick={() => onSelect(iso)}
              style={{
                aspectRatio: '1', borderRadius: 10, border: ring ? '2px solid var(--primary-deep)' : '1px solid var(--border)',
                backgroundColor: bg, color: fg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'Lato, sans-serif', fontSize: 13, fontWeight: isToday ? 700 : 400,
                cursor: 'pointer', position: 'relative',
              }}
            >
              {d.getDate()}
              {dayLabel?.(iso) && (
                <span style={{ position: 'absolute', bottom: 2, fontSize: 8, color: fg }}>{dayLabel(iso)}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Severity dots (1-5) ───────────────────────────────────────────────────

function SeverityPicker({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          aria-label={`Severity ${n}`}
          style={{
            width: 20, height: 20, borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0,
            backgroundColor: n <= value ? 'var(--accent)' : 'var(--border)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Day log sheet ─────────────────────────────────────────────────────────

interface DayLogSheetProps {
  date: string;
  mode: TrackingMode;
  existingPeriod: PeriodLog | null;
  existingSymptoms: SymptomLog[];
  onClose: () => void;
  onSaved: () => void;
}

function DayLogSheet({ date, mode, existingPeriod, existingSymptoms, onClose, onSaved }: DayLogSheetProps) {
  const { user } = useAuth();
  const supabase = createClient();
  const [periodOn, setPeriodOn] = useState(!!existingPeriod);
  const [status, setStatus] = useState<'start' | 'ongoing' | 'end'>(existingPeriod?.status ?? 'start');
  const [flow, setFlow] = useState<'light' | 'medium' | 'heavy' | null>(existingPeriod?.flow ?? null);
  const [selected, setSelected] = useState<Record<string, number>>(
    Object.fromEntries(existingSymptoms.map(s => [s.symptom, s.severity]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' });

  const toggleSymptom = (key: string) => {
    setSelected(prev => {
      const next = { ...prev };
      if (key in next) delete next[key];
      else next[key] = 3;
      return next;
    });
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setError('');

    if (mode === 'period') {
      if (periodOn) {
        const { error: e1 } = await supabase.from('period_logs').upsert({
          user_id: user.id, entry_date: date, status, flow,
        }, { onConflict: 'user_id,entry_date' });
        if (e1) { setError(e1.message); setSaving(false); return; }
      } else if (existingPeriod) {
        const { error: e1 } = await supabase.from('period_logs').delete().eq('user_id', user.id).eq('entry_date', date);
        if (e1) { setError(e1.message); setSaving(false); return; }
      }
    }

    if (existingSymptoms.length > 0) {
      const { error: e2 } = await supabase.from('symptoms_log').delete().eq('user_id', user.id).eq('entry_date', date);
      if (e2) { setError(e2.message); setSaving(false); return; }
    }
    const rows = Object.entries(selected).map(([symptom, severity]) => ({
      user_id: user.id, entry_date: date, symptom, severity,
    }));
    if (rows.length > 0) {
      const { error: e3 } = await supabase.from('symptoms_log').insert(rows);
      if (e3) { setError(e3.message); setSaving(false); return; }
    }

    setSaving(false);
    onSaved();
  };

  const clearDay = async () => {
    if (!user) return;
    setSaving(true);
    setError('');
    await Promise.all([
      supabase.from('period_logs').delete().eq('user_id', user.id).eq('entry_date', date),
      supabase.from('symptoms_log').delete().eq('user_id', user.id).eq('entry_date', date),
    ]);
    setSaving(false);
    onSaved();
  };

  const hasExisting = !!existingPeriod || existingSymptoms.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 16 }}>
          {dateLabel}
        </p>

        {mode === 'period' && (
          <div style={{ marginBottom: 20 }}>
            <p className="section-label">Period</p>
            <button
              onClick={() => setPeriodOn(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
                padding: '12px 14px', borderRadius: 10, marginBottom: periodOn ? 10 : 0,
                border: `2px solid ${periodOn ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: periodOn ? '#FFF0E6' : 'var(--surface)', cursor: 'pointer',
              }}
            >
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: periodOn ? 'var(--accent)' : 'var(--text)' }}>
                Period day
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{periodOn ? 'Yes' : 'No'}</span>
            </button>

            {periodOn && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
                  {(['start', 'ongoing', 'end'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      style={{
                        padding: '10px 6px', borderRadius: 8, textTransform: 'capitalize',
                        border: `2px solid ${status === s ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: status === s ? 'var(--primary-pale)' : 'var(--surface)',
                        color: status === s ? 'var(--primary)' : 'var(--text)',
                        fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {(['light', 'medium', 'heavy'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setFlow(flow === f ? null : f)}
                      style={{
                        padding: '10px 6px', borderRadius: 8, textTransform: 'capitalize',
                        border: `2px solid ${flow === f ? 'var(--primary)' : 'var(--border)'}`,
                        backgroundColor: flow === f ? 'var(--primary-pale)' : 'var(--surface)',
                        color: flow === f ? 'var(--primary)' : 'var(--text-muted)',
                        fontFamily: 'Lato, sans-serif', fontSize: 12, cursor: 'pointer',
                      }}
                    >
                      {f} flow
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <p className="section-label">Symptoms</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {SYMPTOMS.map(s => {
            const active = s.key in selected;
            return (
              <button
                key={s.key}
                onClick={() => toggleSymptom(s.key)}
                style={{
                  padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                  border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  backgroundColor: active ? '#FFF0E6' : 'var(--surface)',
                  color: active ? 'var(--accent)' : 'var(--text)',
                  fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12.5, cursor: 'pointer',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {Object.keys(selected).length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <p className="section-label">How strong?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(selected).map(([key, sev]) => {
                const label = SYMPTOMS.find(s => s.key === key)?.label ?? key;
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text)' }}>{label}</span>
                    <SeverityPicker value={sev} onChange={n => setSelected(prev => ({ ...prev, [key]: n }))} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p style={{ color: 'var(--accent)', fontSize: 13, fontFamily: 'Lato, sans-serif', marginBottom: 12 }}>{error}</p>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          {hasExisting && (
            <button className="btn btn-outline" onClick={clearDay} disabled={saving} style={{ flex: 1 }}>
              Clear day
            </button>
          )}
          <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const { profile, user, refreshProfile } = useAuth();
  const supabase = createClient();
  const today = todayNZ();

  const mode = resolveTrackingMode(profile);
  const [savingMode, setSavingMode] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [periodLogs, setPeriodLogs] = useState<PeriodLog[]>([]);
  const [monthSymptoms, setMonthSymptoms] = useState<SymptomLog[]>([]);
  const [todaySymptoms, setTodaySymptoms] = useState<SymptomLog[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const monthStart = toISO(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1));
  const monthEnd = toISO(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0));

  const load = useCallback(async () => {
    if (!profile) return;
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);
    const [{ data: periods }, { data: symptomsMonth }, { data: symptomsToday }] = await Promise.all([
      getSupabase().from('period_logs').select('*').eq('user_id', profile.id).gte('entry_date', toISO(oneYearAgo)).lte('entry_date', monthEnd),
      getSupabase().from('symptoms_log').select('*').eq('user_id', profile.id).gte('entry_date', monthStart).lte('entry_date', monthEnd),
      getSupabase().from('symptoms_log').select('*').eq('user_id', profile.id).eq('entry_date', today),
    ]);
    setPeriodLogs(periods ?? []);
    setMonthSymptoms(symptomsMonth ?? []);
    setTodaySymptoms(symptomsToday ?? []);
  }, [profile, monthStart, monthEnd, today]);

  useEffect(() => { load(); }, [load]);

  const setMode = async (next: TrackingMode) => {
    if (!user || savingMode) return;
    setSavingMode(true);
    await supabase.from('profiles').update({ cycle_tracking_mode: next }).eq('id', user.id);
    await refreshProfile();
    setSavingMode(false);
  };

  const analysis = useMemo(() => analyzeCycles(periodLogs, today), [periodLogs, today]);

  const periodByDate = useMemo(() => {
    const map = new Map<string, PeriodLog>();
    periodLogs.forEach(p => map.set(p.entry_date, p));
    return map;
  }, [periodLogs]);

  const symptomCountByDate = useMemo(() => {
    const map = new Map<string, number>();
    monthSymptoms.forEach(s => map.set(s.entry_date, (map.get(s.entry_date) ?? 0) + 1));
    return map;
  }, [monthSymptoms]);

  const symptomFrequency = useMemo(() => {
    const counts: Record<string, number> = {};
    monthSymptoms.forEach(s => { counts[s.symptom] = (counts[s.symptom] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, n]) => ({ label: SYMPTOMS.find(s => s.key === key)?.label ?? key, n }));
  }, [monthSymptoms]);

  const dayFillPeriod = useCallback((iso: string) => {
    const p = periodByDate.get(iso);
    if (p) return { bg: PHASE_INFO.menstrual.colour, fg: '#FFFFFF' };
    if (analysis.lastStart && analysis.avgCycleLength) {
      const cycleDay = Math.round((new Date(iso + 'T00:00:00Z').getTime() - new Date(analysis.lastStart + 'T00:00:00Z').getTime()) / 86_400_000) + 1;
      if (cycleDay >= 1 && cycleDay <= analysis.avgCycleLength) {
        const phase = phaseForCycleDay(cycleDay, analysis.avgCycleLength);
        if (phase !== 'menstrual') return { bg: PHASE_INFO[phase].colour + '26', fg: 'var(--text)' };
      }
    }
    return { bg: 'var(--surface)', fg: 'var(--text)' };
  }, [periodByDate, analysis]);

  const dayFillSymptom = useCallback((iso: string) => {
    const n = symptomCountByDate.get(iso) ?? 0;
    if (n === 0) return { bg: 'var(--surface)', fg: 'var(--text)' };
    if (n <= 2) return { bg: 'var(--primary-pale)', fg: 'var(--primary-deep)' };
    return { bg: 'var(--primary)', fg: '#FFFFFF' };
  }, [symptomCountByDate]);

  const todayMoonDay = moonDay(today);
  const moon = moonRhythmForDay(todayMoonDay);
  const symptomGuidance = symptomLoadGuidance(todaySymptoms.length);
  const todayPhase = mode === 'period' && analysis.phase ? PHASE_INFO[analysis.phase] : null;

  const selectedExistingPeriod = selectedDay ? periodByDate.get(selectedDay) ?? null : null;
  const selectedExistingSymptoms = selectedDay
    ? (selectedDay === today ? todaySymptoms : monthSymptoms.filter(s => s.entry_date === selectedDay))
    : [];

  return (
    <div className="page page-top">
      <h1 className="h1 mb-8">Tracking</h1>
      <p className="body-sm mb-16">Everything here is optional. See your pattern, fast in rhythm with it.</p>

      {/* Mode switch */}
      <button
        onClick={() => setMode(mode === 'period' ? 'symptom' : 'period')}
        disabled={savingMode}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          padding: '12px 14px', borderRadius: 10, marginBottom: 20,
          border: '1px solid var(--border)', backgroundColor: 'var(--surface)', cursor: 'pointer',
        }}
      >
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)' }}>I still get periods</span>
        <span style={{
          width: 40, height: 22, borderRadius: 11, position: 'relative',
          backgroundColor: mode === 'period' ? 'var(--primary)' : 'var(--border)', transition: 'background-color 0.2s',
        }}>
          <span style={{
            position: 'absolute', top: 2, left: mode === 'period' ? 20 : 2, width: 18, height: 18, borderRadius: '50%',
            backgroundColor: '#FFFFFF', transition: 'left 0.2s',
          }} />
        </span>
      </button>

      {/* Guidance card */}
      {mode === 'period' ? (
        <div className="card-lg" style={{ marginBottom: 20 }}>
          {todayPhase ? (
            <>
              <p className="section-label" style={{ marginBottom: 4 }}>Today — {todayPhase.label} phase</p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)', lineHeight: 1.5, marginBottom: 12 }}>
                {todayPhase.guidance}
              </p>
            </>
          ) : (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', marginBottom: 12 }}>
              Log a period day below to start seeing your phase and a gentle fasting suggestion here.
            </p>
          )}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            {analysis.cyclesUsed < 2 ? (
              <p className="body-sm">Keep logging to see predictions.</p>
            ) : analysis.irregular ? (
              <p className="body-sm">Your cycles have varied a lot recently, so a date prediction wouldn&apos;t be reliable — lean on symptoms and how you feel instead.</p>
            ) : analysis.predictedNextStart ? (
              <p className="body-sm">
                Estimated next period: <strong style={{ color: 'var(--text)' }}>
                  {new Date(analysis.predictedNextStart + 'T12:00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'long' })}
                </strong> (an estimate, based on your last {analysis.cyclesUsed} cycle{analysis.cyclesUsed === 1 ? '' : 's'}).
              </p>
            ) : (
              <p className="body-sm">Keep logging to see predictions.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="card-lg" style={{ marginBottom: 20 }}>
          <p className="section-label" style={{ marginBottom: 4 }}>{symptomGuidance.label}</p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)', lineHeight: 1.5, marginBottom: 12 }}>
            {symptomGuidance.guidance}
          </p>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <p className="section-label" style={{ marginBottom: 4 }}>Moon rhythm — day {todayMoonDay} of 30 — {moon.label}</p>
            <p className="body-sm">{moon.guidance}</p>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="section">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <button
            onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: 4 }}
            aria-label="Previous month"
          >‹</button>
          <p className="section-label" style={{ marginBottom: 0 }}>{monthLabel(calendarMonth)}</p>
          <button
            onClick={() => setCalendarMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 18, cursor: 'pointer', padding: 4 }}
            aria-label="Next month"
          >›</button>
        </div>
        <MonthCalendar
          month={calendarMonth}
          today={today}
          dayFill={mode === 'period' ? dayFillPeriod : dayFillSymptom}
          onSelect={setSelectedDay}
        />
        <p className="body-sm" style={{ marginTop: 10, color: 'var(--text-muted)' }}>Tap any day to log or edit.</p>
      </div>

      {/* Monthly symptom view */}
      <div className="section">
        <p className="section-label">This month&apos;s symptoms</p>
        {symptomFrequency.length === 0 ? (
          <div className="card" style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Lato, sans-serif' }}>
            Nothing logged yet this month.
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {symptomFrequency.map((s, i) => (
              <div key={s.label} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px', borderBottom: i < symptomFrequency.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)' }}>{s.label}</span>
                <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12, color: 'var(--text-muted)' }}>{s.n} day{s.n === 1 ? '' : 's'}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
        This isn&apos;t medical advice — always check with your GP about what&apos;s right for you.
      </p>

      {selectedDay && (
        <DayLogSheet
          date={selectedDay}
          mode={mode}
          existingPeriod={selectedExistingPeriod}
          existingSymptoms={selectedExistingSymptoms}
          onClose={() => setSelectedDay(null)}
          onSaved={() => { setSelectedDay(null); load(); }}
        />
      )}
    </div>
  );
}
