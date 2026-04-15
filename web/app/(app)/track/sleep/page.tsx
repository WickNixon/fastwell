'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const TODAY = new Date().toISOString().split('T')[0];
const OPTIONS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];

export default function TrackSleepPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    getSupabase().from('health_entries').select('value')
      .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'sleep_hours').eq('source', 'manual')
      .maybeSingle()
      .then(({ data }) => { if (data) setSelected(data.value); });
  }, [profile]);

  const save = async (hours: number) => {
    if (!profile || saving) return;
    setSaving(true);
    setSelected(hours);
    const { error } = await getSupabase().from('health_entries')
      .upsert({
        user_id: profile.id, entry_date: TODAY, metric: 'sleep_hours',
        value: hours, unit: 'hours', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setFeedback({ ok: true, msg: 'Logged' });
      setTimeout(() => setSaving(false), 0);
    }
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Sleep</h1>
      <p className="body-sm mb-24">How many hours did you sleep last night?</p>

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {OPTIONS.map(h => (
          <button
            key={h}
            onClick={() => save(h)}
            disabled={saving}
            style={{
              padding: '16px 10px', borderRadius: 12,
              border: `2px solid ${selected === h ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: selected === h ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, cursor: 'pointer',
              color: selected === h ? 'var(--primary)' : 'var(--text)',
            }}
          >
            {h}h
          </button>
        ))}
      </div>
    </div>
  );
}
