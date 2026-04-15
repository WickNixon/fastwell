'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const TODAY = new Date().toISOString().split('T')[0];
const HOURS_OPTIONS = [5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9];
const QUALITY_LABELS = ['', 'Poor', 'Restless', 'Okay', 'Good', 'Great'];

export default function TrackSleepPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [hours, setHours] = useState<number | null>(null);
  const [quality, setQuality] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    Promise.all([
      getSupabase().from('health_entries').select('value')
        .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'sleep_hours').eq('source', 'manual').maybeSingle(),
      getSupabase().from('health_entries').select('value')
        .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'sleep_quality').eq('source', 'manual').maybeSingle(),
    ]).then(([h, q]) => {
      if (h.data) setHours(h.data.value);
      if (q.data) setQuality(q.data.value);
    });
  }, [profile]);

  const save = async () => {
    if (!profile?.id || !hours || saving) return;
    setSaving(true);
    const sb = getSupabase();
    const [r1, r2] = await Promise.all([
      sb.from('health_entries').upsert({
        user_id: profile.id, entry_date: TODAY, metric: 'sleep_hours',
        value: hours, unit: 'hours', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' }),
      quality ? sb.from('health_entries').upsert({
        user_id: profile.id, entry_date: TODAY, metric: 'sleep_quality',
        value: quality, unit: 'scale_1_5', source: 'manual',
      }, { onConflict: 'user_id,entry_date,metric,source' }) : Promise.resolve({ error: null }),
    ]);
    const err = r1.error || r2.error;
    if (err) {
      setFeedback({ ok: false, msg: err.message });
    } else {
      setFeedback({ ok: true, msg: 'Logged' });
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Sleep</h1>
      <p className="body-sm mb-24">How did you sleep last night?</p>

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

      <p className="section-label mb-12">Hours slept</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
        {HOURS_OPTIONS.map(h => (
          <button
            key={h}
            onClick={() => setHours(h)}
            style={{
              padding: '16px 10px', borderRadius: 12,
              border: `2px solid ${hours === h ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: hours === h ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, cursor: 'pointer',
              color: hours === h ? 'var(--primary)' : 'var(--text)',
            }}
          >
            {h}h
          </button>
        ))}
      </div>

      <p className="section-label mb-12">Sleep quality</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
        {[1, 2, 3, 4, 5].map(q => (
          <button
            key={q}
            onClick={() => setQuality(q)}
            style={{
              flex: 1, padding: '12px 4px', borderRadius: 10, cursor: 'pointer',
              border: `2px solid ${quality === q ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: quality === q ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18,
              color: quality === q ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            {'⭐'.repeat(q)}
          </button>
        ))}
      </div>

      {quality && (
        <p className="body-sm text-center mb-20" style={{ color: 'var(--text-muted)' }}>
          {QUALITY_LABELS[quality]}
        </p>
      )}

      <button className="btn btn-primary" onClick={save} disabled={!hours || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
