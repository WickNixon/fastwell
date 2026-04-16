'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';

const HABIT_KEY = 'reading';
const DEFAULT_GOAL = 20;
const UNIT = 'mins';

function getTodayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackReadingPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = getTodayNZ();

  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [customHabitsDb, setCustomHabitsDb] = useState<Record<string, { goal: number; unit: string }>>({});

  const [todayTotal, setTodayTotal] = useState(0);
  const [duration, setDuration] = useState('');
  const [history, setHistory] = useState<{ id: string; entry_date: string; value: number | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const past = new Date(); past.setDate(past.getDate() - 6);
    const pastStr = past.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
    const [{ data: entries }, { data: profileData }] = await Promise.all([
      getSupabase().from('health_entries').select('id,entry_date,value')
        .eq('user_id', profile.id).eq('metric', HABIT_KEY)
        .gte('entry_date', pastStr).order('entry_date', { ascending: false }),
      getSupabase().from('profiles').select('custom_habits').eq('id', profile.id).maybeSingle(),
    ]);
    setHistory(entries ?? []);
    const todayEntry = (entries ?? []).find(e => e.entry_date === TODAY);
    if (todayEntry?.value) setTodayTotal(todayEntry.value);
    if (profileData?.custom_habits) {
      const ch = profileData.custom_habits as Record<string, { goal: number; unit: string }>;
      setCustomHabitsDb(ch);
      if (ch[HABIT_KEY]?.goal) setGoal(ch[HABIT_KEY].goal);
    }
  }, [profile, TODAY]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!duration || !user || saving) return;
    setSaving(true);
    const mins = parseFloat(duration);
    const newTotal = todayTotal + mins;
    const { error } = await supabase.from('health_entries')
      .upsert({
        user_id: user.id, entry_date: TODAY, metric: HABIT_KEY,
        value: newTotal, unit: UNIT, source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setTodayTotal(newTotal);
      setDuration('');
      setFeedback({ ok: true, msg: 'Saved' });
      await load();
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  const saveGoal = async (newGoal: number) => {
    setGoal(newGoal);
    setEditingGoal(false);
    if (!user) return;
    const newDb = { ...customHabitsDb, [HABIT_KEY]: { goal: newGoal, unit: UNIT } };
    setCustomHabitsDb(newDb);
    await getSupabase().from('profiles').update({ custom_habits: newDb }).eq('id', user.id);
  };

  const pct = goal > 0 ? Math.min((todayTotal / goal) * 100, 100) : 0;

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-0">📚 Read a book</h1>

      {/* Goal row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, marginTop: 6 }}>
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
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Goal: {goal} mins</span>
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

      {/* Today progress */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 38, color: 'var(--primary)', lineHeight: 1 }}>
          {todayTotal}<span style={{ fontSize: 18 }}> mins</span>
        </p>
        <p className="body-sm mt-4">of {goal} mins today</p>
        <div style={{ height: 8, backgroundColor: 'var(--border)', borderRadius: 4, margin: '12px auto', maxWidth: 280 }}>
          <div style={{ height: 8, backgroundColor: 'var(--primary)', borderRadius: 4, width: `${pct}%`, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div className="card-lg mb-24">
        <p className="section-label mb-12">Log reading session</p>
        <div className="input-group">
          <label className="input-label">Duration (mins)</label>
          <input className="input" type="number" min={1} step={1} placeholder="e.g. 20"
            value={duration} onChange={e => setDuration(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!duration || saving}>
          {saving ? 'Saving…' : 'Add session'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="section">
          <p className="section-label mb-12">Last 7 days</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {history.map((e, i) => (
              <div key={e.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <p className="body-sm">{new Date(e.entry_date).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>{e.value} mins</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
