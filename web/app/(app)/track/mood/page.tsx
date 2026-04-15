'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { HealthEntry } from '@/lib/types';

const MOODS = [
  { value: 1, label: 'Struggling', icon: '😞' },
  { value: 2, label: 'Not great', icon: '😕' },
  { value: 3, label: 'Okay', icon: '😐' },
  { value: 4, label: 'Good', icon: '🙂' },
  { value: 5, label: 'Wonderful', icon: '😊' },
];

function isoDate(d: Date) { return d.toISOString().split('T')[0]; }
const TODAY = isoDate(new Date());

export default function TrackMoodPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [trend, setTrend] = useState<HealthEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const past = new Date(); past.setDate(past.getDate() - 6);
    const { data } = await getSupabase().from('health_entries').select('*')
      .eq('user_id', profile.id).eq('metric', 'mood')
      .gte('entry_date', isoDate(past)).order('entry_date', { ascending: true });
    setTrend(data ?? []);
    const todayEntry = (data ?? []).find(e => e.entry_date === TODAY);
    if (todayEntry) setSelected(todayEntry.value);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const save = async (val: number) => {
    if (!profile?.id || saving) return;
    setSaving(true);
    setSelected(val);
    const { error } = await getSupabase().from('health_entries')
      .upsert({
        user_id: profile.id, entry_date: TODAY, metric: 'mood',
        value: val, unit: 'scale_1_5', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setFeedback({ ok: true, msg: 'Saved' });
      await load();
      setTimeout(() => { setFeedback(null); router.back(); }, 1000);
    }
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Mood</h1>
      <p className="body-sm mb-32">How are you feeling emotionally today?</p>

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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
        {MOODS.map(m => (
          <button
            key={m.value}
            onClick={() => save(m.value)}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px', borderRadius: 12,
              border: `2px solid ${selected === m.value ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: selected === m.value ? 'var(--primary-pale)' : 'var(--surface)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 28 }}>{m.icon}</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 16, color: selected === m.value ? 'var(--primary)' : 'var(--text)' }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {trend.length > 1 && (
        <div className="section">
          <p className="section-label mb-12">7-day trend</p>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
              {trend.map(e => {
                const pct = ((e.value ?? 0) / 5) * 100;
                return (
                  <div key={e.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: '100%', height: `${pct}%`, minHeight: 4, backgroundColor: 'var(--primary)', borderRadius: 3 }} />
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
