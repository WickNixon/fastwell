'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import type { HealthEntry } from '@/lib/types';

function isoDate(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackStepsPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = isoDate(new Date());
  const [value, setValue] = useState('');
  const [current, setCurrent] = useState<number | null>(null);
  const [trend, setTrend] = useState<HealthEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const past = new Date(); past.setDate(past.getDate() - 6);
    const { data } = await getSupabase().from('health_entries').select('*')
      .eq('user_id', profile.id).eq('metric', 'steps')
      .gte('entry_date', isoDate(past)).order('entry_date', { ascending: true });
    setTrend(data ?? []);
    const todayEntry = (data ?? []).find(e => e.entry_date === TODAY);
    if (todayEntry) { setCurrent(todayEntry.value); setValue(String(todayEntry.value ?? '')); }
  }, [profile]);

  useEffect(() => { load(); }, [load]);

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

  const pct = current ? Math.min((current / 8000) * 100, 100) : 0;
  const maxSteps = Math.max(...trend.map(e => e.value ?? 0), 1);

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Steps</h1>
      <p className="body-sm mb-24">Today's step count</p>

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
          <p className="body-sm mt-4">of 8,000 daily goal</p>
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
