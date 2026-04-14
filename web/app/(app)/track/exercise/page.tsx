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
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getSupabase().from('health_entries').select('id,value,value_text')
      .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'exercise_minutes')
      .maybeSingle()
      .then(({ data }) => { if (data) { setDuration(data.value); setEntryId(data.id); if (data.value_text) setType(data.value_text); } });
  }, [profile]);

  const save = async () => {
    if (!duration || !profile) return;
    setSaving(true);
    if (entryId) {
      await getSupabase().from('health_entries').update({ value: duration, value_text: type }).eq('id', entryId);
    } else {
      const { data } = await getSupabase().from('health_entries')
        .insert({ user_id: profile.id, entry_date: TODAY, metric: 'exercise_minutes', value: duration, value_text: type, unit: 'minutes', source: 'manual' })
        .select('id').single();
      if (data) setEntryId(data.id);
    }
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-24">Exercise</h1>

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
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Log exercise'}
      </button>
    </div>
  );
}
