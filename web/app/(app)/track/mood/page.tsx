'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const TODAY = new Date().toISOString().split('T')[0];
const MOODS = [
  { value: 1, label: 'Struggling', icon: '😞' },
  { value: 2, label: 'Not great', icon: '😕' },
  { value: 3, label: 'Okay', icon: '😐' },
  { value: 4, label: 'Good', icon: '🙂' },
  { value: 5, label: 'Wonderful', icon: '😊' },
];

export default function TrackMoodPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    getSupabase().from('health_entries').select('value')
      .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'mood').eq('source', 'manual')
      .maybeSingle()
      .then(({ data }) => { if (data) setSelected(data.value); });
  }, [profile]);

  const save = async (val: number) => {
    if (!profile || saving) return;
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
    </div>
  );
}
