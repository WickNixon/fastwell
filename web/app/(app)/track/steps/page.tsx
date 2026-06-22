'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import type { HealthEntry } from '@/lib/types';

const DEFAULT_GOAL = 10000;

function isoDate(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackStepsPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = isoDate(new Date());

  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [customHabitsDb, setCustomHabitsDb] = useState<Record<string, { goal: number; unit: string }>>({});

  const [value, setValue] = useState('');
  const [current, setCurrent] = useState<number | null>(null);
  const [trend, setTrend] = useState<HealthEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const [editingToday, setEditingToday] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [undoConfirm, setUndoConfirm] = useState(false);
  const [undoSaving, setUndoSaving] = useState(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const past = new Date(); past.setDate(past.getDate() - 6);
    const [{ data: entries }, { data: profileData }] = await Promise.all([
      getSupabase().from('health_entries').select('*')
        .eq('user_id', profile.id).eq('metric', 'steps')
        .gte('entry_date', isoDate(past)).order('entry_date', { ascending: true }),
      getSupabase().from('profiles').select('custom_habits').eq('id', profile.id).maybeSingle(),
    ]);
    setTrend(entries ?? []);
    const todayEntry = (entries ?? []).find(e => e.entry_date === TODAY);
    if (todayEntry) { setCurrent(todayEntry.value); setValue(String(todayEntry.value ?? '')); }
    else { setCurrent(null); setValue(''); }
    if (profileData?.custom_habits) {
      const ch = profileData.custom_habits as Record<string, { goal: number; unit: string }>;
      setCustomHabitsDb(ch);
      if (ch.walking?.goal) setGoal(ch.walking.goal);
    }
  }, [profile, TODAY]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => () => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current); }, []);

  const save = async () => {
    if (!value || !user || saving) return;
    setSaving(true);
    const steps = parseInt(value);
    const { error } = await supabase.from('health_entries')
      .upsert({
        user_id: user.id, entry_date: TODAY, metric: 'steps',
        value: steps, unit: 'steps', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setCurrent(steps);
      setFeedback({ ok: true, msg: 'Saved' });
      await load();
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  const handleEditSet = async () => {
    const N = parseInt(editValue);
    if (!N || N <= 0 || !user) return;
    setEditSaving(true);
    setFeedback(null);
    const { error } = await supabase.from('health_entries').upsert({
      user_id: user.id, entry_date: TODAY,
      metric: 'steps', value: N, unit: 'steps', source: 'manual',
    }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      console.error('Edit: upsert error:', error);
      setFeedback({ ok: false, msg: 'Something went wrong. Please try again.' });
      setEditSaving(false);
      return;
    }
    setEditingToday(false);
    setEditValue('');
    setEditSaving(false);
    setFeedback({ ok: true, msg: `Updated to ${N.toLocaleString()} steps` });
    setTimeout(() => setFeedback(null), 2000);
    await load();
  };

  const handleUndo = async () => {
    if (!undoConfirm) {
      setUndoConfirm(true);
      undoTimeoutRef.current = setTimeout(() => setUndoConfirm(false), 4000);
      return;
    }
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    if (!user) return;
    setUndoSaving(true);
    setFeedback(null);
    const { error } = await supabase.from('health_entries').delete()
      .eq('user_id', user.id).eq('entry_date', TODAY).eq('metric', 'steps');
    if (error) {
      console.error('Undo error:', error);
      setFeedback({ ok: false, msg: 'Something went wrong. Please try again.' });
      setUndoSaving(false);
      setUndoConfirm(false);
      return;
    }
    setUndoConfirm(false);
    setUndoSaving(false);
    setFeedback({ ok: true, msg: 'Cleared' });
    setTimeout(() => setFeedback(null), 1500);
    await load();
  };

  const saveGoal = async (newGoal: number) => {
    setGoal(newGoal);
    setEditingGoal(false);
    if (!user) return;
    const newDb = { ...customHabitsDb, walking: { goal: newGoal, unit: 'steps' } };
    setCustomHabitsDb(newDb);
    await getSupabase().from('profiles').update({ custom_habits: newDb }).eq('id', user.id);
  };

  const pct = current && goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
  const maxSteps = Math.max(...trend.map(e => e.value ?? 0), 1);

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-0">🚶 Walking</h1>

      {/* Goal row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, marginTop: 6 }}>
        {editingGoal ? (
          <>
            <input type="number" className="input" style={{ maxWidth: 100 }} value={goalInput}
              onChange={e => setGoalInput(e.target.value)} autoFocus />
            <span style={{ color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', fontSize: 14 }}>steps</span>
            <button className="btn btn-primary btn-sm" onClick={() => saveGoal(parseInt(goalInput) || DEFAULT_GOAL)}>Save</button>
            <button onClick={() => setEditingGoal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 2 }}>✕</button>
          </>
        ) : (
          <>
            <span style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Goal: {goal.toLocaleString()} steps</span>
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

      {current !== null && (
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 42, color: 'var(--primary)', lineHeight: 1 }}>
            {current.toLocaleString()}
          </p>
          <p className="body-sm mt-4">of {goal.toLocaleString()} daily goal</p>
          <div style={{ height: 8, backgroundColor: 'var(--border)', borderRadius: 4, margin: '12px auto', maxWidth: 280 }}>
            <div style={{ height: 8, backgroundColor: 'var(--primary)', borderRadius: 4, width: `${pct}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}

      <div className="card-lg mb-24">
        <div className="input-group">
          <label className="input-label">Enter steps</label>
          <input className="input" type="number" placeholder="e.g. 6500" value={value} onChange={e => setValue(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!value || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {current !== null && (
        <div style={{ marginTop: 10 }}>
          {editingToday ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                className="input"
                style={{ maxWidth: 110 }}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                placeholder={String(current)}
                autoFocus
                min={1}
              />
              <span style={{ color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', fontSize: 14 }}>steps</span>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleEditSet}
                disabled={editSaving || !editValue}
              >
                {editSaving ? 'Saving…' : 'Set'}
              </button>
              <button
                onClick={() => { setEditingToday(false); setEditValue(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18, lineHeight: 1, padding: 2 }}
              >✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline"
                onClick={() => { setEditingToday(true); setEditValue(String(current)); setUndoConfirm(false); }}
                style={{ flex: 1 }}
              >
                Edit Today
              </button>
              <button
                className="btn btn-outline"
                onClick={handleUndo}
                disabled={undoSaving}
                style={{ flex: 1, color: undoConfirm ? '#C62828' : undefined, borderColor: undoConfirm ? '#C62828' : undefined }}
              >
                {undoSaving ? 'Clearing…' : undoConfirm ? 'Tap again to confirm' : 'Undo Today'}
              </button>
            </div>
          )}
        </div>
      )}

      {trend.length > 1 && (
        <div className="section">
          <p className="section-label mb-12">7-day trend</p>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
              {trend.map(e => {
                const barPct = ((e.value ?? 0) / maxSteps) * 100;
                const isToday = e.entry_date === TODAY;
                return (
                  <div key={e.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{
                      width: '100%', height: `${barPct}%`, minHeight: 4,
                      backgroundColor: isToday ? 'var(--primary)' : 'var(--primary-pale)',
                      border: isToday ? 'none' : '1px solid var(--border)',
                      borderRadius: 3,
                    }} />
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
                      {new Date(e.entry_date).toLocaleDateString('en-NZ', { day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
