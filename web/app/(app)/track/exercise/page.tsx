'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const TODAY = new Date().toISOString().split('T')[0];
const TYPES = ['Walk', 'Run', 'Yoga', 'Swim', 'Weights', 'Pilates', 'Cycling', 'Other'];
const DURATIONS = [15, 20, 30, 45, 60, 90];

export default function TrackExercisePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [type, setType] = useState('Walk');
  const [duration, setDuration] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    getSupabase().from('health_entries').select('value,value_text')
      .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'exercise_minutes').eq('source', 'manual')
      .maybeSingle()
      .then(({ data }) => { if (data) { setDuration(data.value); if (data.value_text) setType(data.value_text); } });
  }, [profile]);

  const save = async () => {
    if (!duration || !profile || saving) return;
    setSaving(true);
    const { error } = await getSupabase().from('health_entries')
      .upsert({
        user_id: profile.id, entry_date: TODAY, metric: 'exercise_minutes',
        value: duration, value_text: type, unit: 'minutes', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setFeedback({ ok: true, msg: 'Saved' });
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-24">Exercise</h1>

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
        <p className="section-label mb-12">Duration</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
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

      <button className="btn btn-primary" onClick={save} disabled={!duration || saving}>
        {saving ? 'Saving…' : 'Log exercise'}
      </button>
    </div>
  );
}
