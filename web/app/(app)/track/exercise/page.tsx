'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';

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
  const [type, setType] = useState('Walk');
  const [duration, setDuration] = useState<number | null>(null);
  const [intensity, setIntensity] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    getSupabase().from('health_entries').select('value,value_text,notes')
      .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'exercise_minutes').eq('source', 'manual')
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDuration(data.value);
          if (data.value_text) {
            const parts = data.value_text.split('|');
            setType(parts[0] ?? 'Walk');
            if (parts[1]) setIntensity(parts[1]);
          }
        }
      });
  }, [profile]);

  const save = async () => {
    if (!duration || !user || saving) return;
    setSaving(true);
    const valueText = intensity ? `${type}|${intensity}` : type;
    const { error } = await supabase.from('health_entries')
      .upsert({
        user_id: user.id, entry_date: TODAY, metric: 'exercise_minutes',
        value: duration, value_text: valueText, unit: 'minutes', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setFeedback({ ok: true, msg: 'Saved' });
      setTimeout(() => { setFeedback(null); router.back(); }, 1200);
    }
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Exercise</h1>
      <p className="body-sm mb-24">Log today's movement</p>

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
        {saving ? 'Saving…' : 'Log exercise'}
      </button>
    </div>
  );
}
