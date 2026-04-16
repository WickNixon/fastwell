'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';

const HABIT_KEY = 'exercise_minutes';
const DEFAULT_GOAL = 30;
const TYPES = ['Walk', 'Run', 'Gym', 'Swim', 'Yoga', 'Cycle', 'Other'];
const DURATIONS = [15, 20, 30, 45, 60, 90];
const INTENSITIES = [
  { value: 'easy', label: 'Easy' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'hard', label: 'Hard' },
];

function getTodayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackExercisePage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = getTodayNZ();

  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [customHabitsDb, setCustomHabitsDb] = useState<Record<string, { goal: number; unit: string }>>({});

  const [todayTotal, setTodayTotal] = useState(0);
  const [type, setType] = useState('Walk');
  const [duration, setDuration] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const [{ data: entry }, { data: profileData }] = await Promise.all([
      getSupabase().from('health_entries').select('value,value_text')
        .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', HABIT_KEY).eq('source', 'manual').maybeSingle(),
      getSupabase().from('profiles').select('custom_habits').eq('id', profile.id).maybeSingle(),
    ]);
    if (entry) {
      setTodayTotal(entry.value ?? 0);
      if (entry.value_text) {
        const parts = entry.value_text.split('|');
        setType(parts[0] ?? 'Walk');
        if (parts[1]) setIntensity(parts[1]);
      }
    }
    if (profileData?.custom_habits) {
      const ch = profileData.custom_habits as Record<string, { goal: number; unit: string }>;
      setCustomHabitsDb(ch);
      if (ch.exercise?.goal) setGoal(ch.exercise.goal);
    }
  }, [profile, TODAY]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!duration || !user || saving) return;
    setSaving(true);
    const newTotal = todayTotal + duration;
    const valueText = intensity ? `${type}|${intensity}` : type;
    const { error } = await supabase.from('health_entries')
      .upsert({
        user_id: user.id, entry_date: TODAY, metric: HABIT_KEY,
        value: newTotal, value_text: valueText, unit: 'minutes', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setTodayTotal(newTotal);
      setDuration(null);
      setFeedback({ ok: true, msg: `${newTotal} of ${goal} mins logged today` });
      setTimeout(() => { setFeedback(null); }, 2000);
    }
    setSaving(false);
  };

  const saveGoal = async (newGoal: number) => {
    setGoal(newGoal);
    setEditingGoal(false);
    if (!user) return;
    const newDb = { ...customHabitsDb, exercise: { goal: newGoal, unit: 'mins' } };
    setCustomHabitsDb(newDb);
    await getSupabase().from('profiles').update({ custom_habits: newDb }).eq('id', user.id);
  };

  const pct = goal > 0 ? Math.min((todayTotal / goal) * 100, 100) : 0;

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-0">🏃 Exercise</h1>

      {/* Goal row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, marginTop: 6 }}>
        {editingGoal ? (
          <>
            <input type="number" className="input" style={{ maxWidth: 80 }} value={goalInput}
              onChange={e => setGoalInput(e.target.value)} autoFocus />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', fontSize: 14 }}>mins</span>
            <button className="btn btn-primary btn-sm" onClick={() => saveGoal(parseInt(goalInput) || DEFAULT_GOAL)}>Save</button>
            <button onClick={() => setEditingGoal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 2 }}>✕</button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Goal: {goal} mins today</span>
            <button onClick={() => { setGoalInput(String(goal)); setEditingGoal(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: 2 }}
              aria-label="Edit goal">✎</button>
          </>
        )}
      </div>

      {/* Today progress */}
      {todayTotal > 0 && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 32, color: 'var(--primary)', lineHeight: 1 }}>
            {todayTotal}<span style={{ fontSize: 16 }}> of {goal} mins</span>
          </p>
          <p className="body-sm mt-4">logged today</p>
          <div style={{ height: 8, backgroundColor: 'var(--border)', borderRadius: 4, margin: '10px auto', maxWidth: 280 }}>
            <div style={{ height: 8, backgroundColor: 'var(--primary)', borderRadius: 4, width: `${pct}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      {feedback && (
        <div style={{
          background: feedback.ok ? 'var(--primary-pale)' : '#FFF3F3',
          border: `1px solid ${feedback.ok ? 'var(--border)' : '#FFCDD2'}`,
          color: feedback.ok ? 'var(--primary)' : '#C62828',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          fontSize: 14, fontFamily: 'Lato, sans-serif',
        }}>
          {feedback.ok ? `✓ ${feedback.msg}` : feedback.msg}
        </div>
      )}

      <div className="section">
        <p className="section-label mb-12">Type</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TYPES.map(t => (
            <button
              key={t}
              onClick={() => setType(t)}
              style={{
                padding: '8px 16px', borderRadius: 20,
                border: `1.5px solid ${type === t ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: type === t ? 'var(--primary-pale)' : 'var(--surface)',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
                color: type === t ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <p className="section-label mb-12">Add {todayTotal > 0 ? 'more — ' : ''}duration</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(duration === d ? null : d)}
              style={{
                padding: 14, borderRadius: 12,
                border: `2px solid ${duration === d ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: duration === d ? 'var(--primary-pale)' : 'var(--surface)',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16,
                color: duration === d ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
              }}
            >
              {d}m
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <p className="section-label mb-12">Intensity</p>
        <div style={{ display: 'flex', gap: 10 }}>
          {INTENSITIES.map(i => (
            <button
              key={i.value}
              onClick={() => setIntensity(intensity === i.value ? null : i.value)}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 12,
                border: `2px solid ${intensity === i.value ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: intensity === i.value ? 'var(--primary-pale)' : 'var(--surface)',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
                color: intensity === i.value ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
              }}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={save} disabled={!duration || saving}>
        {saving ? 'Saving…' : `Log ${duration ? `${duration}m` : 'exercise'}`}
      </button>
    </div>
  );
}
