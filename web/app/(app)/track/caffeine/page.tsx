'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';

const HABIT_KEY = 'caffeine_drinks';

function getTodayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackCaffeinePage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = getTodayNZ();

  const [cups, setCups] = useState('');
  const [notes, setNotes] = useState('');
  const [todayCount, setTodayCount] = useState<number | null>(null);
  const [history, setHistory] = useState<{ id: string; entry_date: string; value: number | null; memo: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const past = new Date(); past.setDate(past.getDate() - 6);
    const pastStr = past.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
    const { data: entries } = await getSupabase().from('health_entries')
      .select('id,entry_date,value,memo')
      .eq('user_id', profile.id).eq('metric', HABIT_KEY)
      .gte('entry_date', pastStr).order('entry_date', { ascending: false });
    setHistory(entries ?? []);
    const todayEntry = (entries ?? []).find(e => e.entry_date === TODAY);
    if (todayEntry) setTodayCount(todayEntry.value);
  }, [profile, TODAY]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!cups || !user || saving) return;
    setSaving(true);
    const count = parseFloat(cups);
    const { error } = await supabase.from('health_entries')
      .upsert({
        user_id: user.id, entry_date: TODAY, metric: HABIT_KEY,
        value: count, unit: 'cups', source: 'manual',
        memo: notes || null,
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setTodayCount(count);
      setCups('');
      setNotes('');
      setFeedback({ ok: true, msg: 'Saved' });
      await load();
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-4">☕ Caffeine intake</h1>
      <p className="body-sm mb-24">Log today's caffeinated drinks</p>

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

      {todayCount !== null && (
        <div className="card-lg mb-20" style={{ backgroundColor: 'var(--primary-pale)', border: '1px solid var(--border)', textAlign: 'center' }}>
          <p className="section-label mb-4">Today</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 38, color: 'var(--primary)', lineHeight: 1 }}>
            {todayCount}
          </p>
          <p className="body-sm mt-4">{todayCount === 1 ? 'cup' : 'cups'} logged today</p>
        </div>
      )}

      {/* Quick add buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
        {[1, 2, 3, 4].map(n => (
          <button key={n} onClick={() => setCups(String(n))}
            style={{
              padding: 14, borderRadius: 12, cursor: 'pointer',
              border: `2px solid ${cups === String(n) ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: cups === String(n) ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18,
              color: cups === String(n) ? 'var(--primary)' : 'var(--text)',
            }}>
            {n}
          </button>
        ))}
      </div>

      <div className="card-lg mb-24">
        <div className="input-group">
          <label className="input-label">Or enter amount</label>
          <input className="input" type="number" min={0} step={0.5} placeholder="Number of cups/drinks"
            value={cups} onChange={e => setCups(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Notes (optional)</label>
          <input className="input" type="text" placeholder="e.g. coffee, green tea"
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!cups || saving}>
          {saving ? 'Saving…' : 'Save'}
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
                <div>
                  <p className="body-sm">{new Date(e.entry_date).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
                  {e.memo && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginTop: 2 }}>{e.memo}</p>}
                </div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>
                  {e.value} {e.value === 1 ? 'cup' : 'cups'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
