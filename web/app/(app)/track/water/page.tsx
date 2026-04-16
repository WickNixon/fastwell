'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';

const DEFAULT_GOAL = 2000;

function getTodayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackWaterPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = getTodayNZ();

  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [customHabitsDb, setCustomHabitsDb] = useState<Record<string, { goal: number; unit: string }>>({});

  const [current, setCurrent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const [{ data: entry }, { data: profileData }] = await Promise.all([
      getSupabase().from('health_entries').select('value').eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'water_ml').eq('source', 'manual').maybeSingle(),
      getSupabase().from('profiles').select('custom_habits').eq('id', profile.id).maybeSingle(),
    ]);
    if (entry?.value) setCurrent(entry.value);
    if (profileData?.custom_habits) {
      const ch = profileData.custom_habits as Record<string, { goal: number; unit: string }>;
      setCustomHabitsDb(ch);
      if (ch.water?.goal) setGoal(ch.water.goal);
    }
  }, [profile, TODAY]);

  useEffect(() => { load(); }, [load]);

  const save = async (ml: number) => {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase
      .from('health_entries')
      .upsert({
        user_id: user.id, entry_date: TODAY, metric: 'water_ml',
        value: ml, unit: 'ml', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setCurrent(ml);
      setFeedback({ ok: true, msg: 'Saved' });
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  const saveGoal = async (newGoal: number) => {
    setGoal(newGoal);
    setEditingGoal(false);
    if (!user) return;
    const newDb = { ...customHabitsDb, water: { goal: newGoal, unit: 'ml' } };
    setCustomHabitsDb(newDb);
    await getSupabase().from('profiles').update({ custom_habits: newDb }).eq('id', user.id);
  };

  const add = (ml: number) => save(current + ml);
  const pct = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const goalDisplay = goal >= 1000 ? `${goal / 1000}L` : `${goal}ml`;

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
        ← Back
      </button>
      <h1 className="h1 mb-0">💧 Water</h1>

      {/* Goal row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, marginTop: 6 }}>
        {editingGoal ? (
          <>
            <input type="number" className="input" style={{ maxWidth: 90 }} value={goalInput}
              onChange={e => setGoalInput(e.target.value)} autoFocus placeholder="ml" />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', fontSize: 14 }}>ml</span>
            <button className="btn btn-primary btn-sm" onClick={() => saveGoal(parseInt(goalInput) || DEFAULT_GOAL)}>Save</button>
            <button onClick={() => setEditingGoal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 2 }}>✕</button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Goal: {goalDisplay} daily</span>
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

      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 64 }}>💧</div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 36, color: 'var(--primary)', marginTop: 8 }}>
          {current >= 1000 ? `${(current / 1000).toFixed(1)}L` : `${current}ml`}
        </p>
        <p className="body-sm">of {goalDisplay} daily goal</p>
        <div style={{ height: 8, backgroundColor: 'var(--border)', borderRadius: 4, margin: '12px auto', maxWidth: 280 }}>
          <div style={{ height: 8, backgroundColor: 'var(--primary)', borderRadius: 4, width: `${pct}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
        {[250, 500, 750, 1000].map(ml => (
          <button
            key={ml}
            className="btn btn-outline btn-sm"
            onClick={() => add(ml)}
            disabled={saving}
          >
            +{ml >= 1000 ? '1L' : `${ml}ml`}
          </button>
        ))}
      </div>

      <p className="section-label mb-12">Set a specific amount</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[500, 1000, 1500, 2000, 2500, 3000].map(ml => (
          <button
            key={ml}
            onClick={() => save(ml)}
            disabled={saving}
            style={{
              padding: '12px 8px', borderRadius: 10,
              border: `2px solid ${current === ml ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: current === ml ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, cursor: 'pointer',
              color: current === ml ? 'var(--primary)' : 'var(--text)',
            }}
          >
            {ml >= 1000 ? `${ml / 1000}L` : `${ml}ml`}
          </button>
        ))}
      </div>
    </div>
  );
}
