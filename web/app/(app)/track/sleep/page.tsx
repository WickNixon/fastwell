'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';

const DEFAULT_GOAL = 8;
const HOURS_OPTIONS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
const QUALITY_LABELS = ['', 'Poor', 'Restless', 'Okay', 'Good', 'Great'];

function getTodayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackSleepPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = getTodayNZ();

  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [customHabitsDb, setCustomHabitsDb] = useState<Record<string, { goal: number; unit: string }>>({});

  const [hours, setHours] = useState<number | null>(null);
  const [quality, setQuality] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const [{ data: h }, { data: q }, { data: profileData }] = await Promise.all([
      getSupabase().from('health_entries').select('value').eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'sleep_hours').eq('source', 'manual').maybeSingle(),
      getSupabase().from('health_entries').select('value').eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'sleep_quality').eq('source', 'manual').maybeSingle(),
      getSupabase().from('profiles').select('custom_habits').eq('id', profile.id).maybeSingle(),
    ]);
    if (h) setHours(h.value);
    if (q) setQuality(q.value);
    if (profileData?.custom_habits) {
      const ch = profileData.custom_habits as Record<string, { goal: number; unit: string }>;
      setCustomHabitsDb(ch);
      if (ch.sleep?.goal) setGoal(ch.sleep.goal);
    }
  }, [profile, TODAY]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!user || !hours || saving) return;
    setSaving(true);
    const [r1, r2] = await Promise.all([
      supabase.from('health_entries').upsert({
        user_id: user.id, entry_date: TODAY, metric: 'sleep_hours',
        value: hours, unit: 'hours', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' }),
      quality ? supabase.from('health_entries').upsert({
        user_id: user.id, entry_date: TODAY, metric: 'sleep_quality',
        value: quality, unit: 'scale_1_5', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' }) : Promise.resolve({ error: null }),
    ]);
    const err = r1.error || r2.error;
    if (err) {
      setFeedback({ ok: false, msg: err.message });
    } else {
      setFeedback({ ok: true, msg: 'Logged' });
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  const saveGoal = async (newGoal: number) => {
    setGoal(newGoal);
    setEditingGoal(false);
    if (!user) return;
    const newDb = { ...customHabitsDb, sleep: { goal: newGoal, unit: 'hours' } };
    setCustomHabitsDb(newDb);
    await getSupabase().from('profiles').update({ custom_habits: newDb }).eq('id', user.id);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-0">😴 Sleep</h1>

      {/* Goal row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, marginTop: 6 }}>
        {editingGoal ? (
          <>
            <input type="number" className="input" style={{ maxWidth: 80 }} value={goalInput} step={0.5}
              onChange={e => setGoalInput(e.target.value)} autoFocus />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', fontSize: 14 }}>hours</span>
            <button className="btn btn-primary btn-sm" onClick={() => saveGoal(parseFloat(goalInput) || DEFAULT_GOAL)}>Save</button>
            <button onClick={() => setEditingGoal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 2 }}>✕</button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Goal: {goal} hours</span>
            <button onClick={() => { setGoalInput(String(goal)); setEditingGoal(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)', padding: 2 }}
              aria-label="Edit goal">✎</button>
          </>
        )}
      </div>

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

      <p className="section-label mb-12">Hours slept</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
        {HOURS_OPTIONS.map(h => (
          <button
            key={h}
            onClick={() => setHours(h)}
            style={{
              padding: '16px 10px', borderRadius: 12,
              border: `2px solid ${hours === h ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: hours === h ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, cursor: 'pointer',
              color: hours === h ? 'var(--primary)' : 'var(--text)',
            }}
          >
            {h}h
          </button>
        ))}
      </div>

      <p className="section-label mb-12">Sleep quality</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[1, 2, 3, 4, 5].map(q => (
          <button
            key={q}
            onClick={() => setQuality(q)}
            style={{
              flex: 1, padding: '12px 4px', borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${quality === q ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: quality === q ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18,
              color: quality === q ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            {'⭐'.repeat(q)}
          </button>
        ))}
      </div>

      {quality && (
        <p className="body-sm text-center mb-20" style={{ color: 'var(--text-muted)' }}>
          {QUALITY_LABELS[quality]}
        </p>
      )}

      <button className="btn btn-primary" onClick={save} disabled={!hours || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
