'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const TODAY = new Date().toISOString().split('T')[0];

export default function TrackStepsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [current, setCurrent] = useState<number | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getSupabase().from('health_entries').select('id,value')
      .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'steps')
      .maybeSingle()
      .then(({ data }) => { if (data) { setCurrent(data.value); setEntryId(data.id); setValue(String(data.value ?? '')); } });
  }, [profile]);

  const save = async () => {
    if (!value || !profile) return;
    setSaving(true);
    const steps = parseInt(value);
    if (entryId) {
      await getSupabase().from('health_entries').update({ value: steps }).eq('id', entryId);
    } else {
      const { data } = await getSupabase().from('health_entries')
        .insert({ user_id: profile.id, entry_date: TODAY, metric: 'steps', value: steps, unit: 'steps', source: 'manual' })
        .select('id').single();
      if (data) setEntryId(data.id);
    }
    setCurrent(steps);
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const pct = current ? Math.min((current / 8000) * 100, 100) : 0;

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Steps</h1>
      <p className="body-sm mb-24">Today's step count</p>

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

      <div className="card-lg">
        <div className="input-group">
          <label className="input-label">Enter steps</label>
          <input
            className="input"
            type="number"
            placeholder="e.g. 6500"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!value || saving}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
}
