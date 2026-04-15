'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { getAuthUserId } from '@/lib/get-user-id';
import type { HealthEntry } from '@/lib/types';

const TODAY = new Date().toISOString().split('T')[0];

export default function TrackWeightPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<HealthEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const unit = profile?.weight_unit ?? 'kg';

  useEffect(() => {
    if (!profile) return;
    getSupabase()
      .from('health_entries')
      .select('*')
      .eq('user_id', profile.id)
      .eq('metric', 'weight')
      .order('entry_date', { ascending: false })
      .limit(10)
      .then(({ data }) => setHistory(data ?? []));
  }, [profile]);

  const handleSave = async () => {
    const userId = await getAuthUserId();
    if (!value || !userId || saving) return;
    setSaving(true);
    const { error } = await getSupabase().from('health_entries').upsert({
      user_id: userId,
      entry_date: TODAY,
      metric: 'weight',
      value: parseFloat(value),
      unit,
      source: 'manual',
    }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setFeedback({ ok: true, msg: 'Saved' });
      setTimeout(() => setFeedback(null), 1500);
      const { data } = await getSupabase()
        .from('health_entries').select('*').eq('user_id', userId).eq('metric', 'weight')
        .order('entry_date', { ascending: false }).limit(10);
      setHistory(data ?? []);
    }
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>
        ← Back
      </button>
      <h1 className="h1 mb-24">Weight</h1>

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

      <div className="card-lg mb-24">
        <p className="section-label mb-12">Log today</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            type="number"
            step="0.1"
            placeholder="e.g. 68.5"
            value={value}
            onChange={e => setValue(e.target.value)}
            style={{ flex: 1 }}
          />
          <span style={{ display: 'flex', alignItems: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: 'var(--text-muted)', padding: '0 8px' }}>
            {unit}
          </span>
        </div>
        <button className="btn btn-primary mt-12" onClick={handleSave} disabled={!value || saving}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="section">
          <p className="section-label mb-12">Recent readings</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {history.map((e, i) => (
              <div key={e.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 16px',
                borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <p className="body-sm">{new Date(e.entry_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                  {e.value} {e.unit}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
