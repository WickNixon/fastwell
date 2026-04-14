'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const TODAY = new Date().toISOString().split('T')[0];
const LEVELS = [
  { value: 1, label: 'Exhausted', icon: '😴' },
  { value: 2, label: 'Low', icon: '😔' },
  { value: 3, label: 'Okay', icon: '🙂' },
  { value: 4, label: 'Good', icon: '😊' },
  { value: 5, label: 'Energised', icon: '⚡' },
];

export default function TrackEnergyPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<number | null>(null);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profile) return;
    getSupabase().from('health_entries').select('id,value')
      .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', 'energy')
      .maybeSingle()
      .then(({ data }) => { if (data) { setSelected(data.value); setEntryId(data.id); } });
  }, [profile]);

  const save = async (val: number) => {
    if (!profile || saving) return;
    setSaving(true);
    setSelected(val);
    if (entryId) {
      await getSupabase().from('health_entries').update({ value: val }).eq('id', entryId);
    } else {
      const { data } = await getSupabase().from('health_entries')
        .insert({ user_id: profile.id, entry_date: TODAY, metric: 'energy', value: val, unit: 'scale_1_5', source: 'manual' })
        .select('id').single();
      if (data) setEntryId(data.id);
    }
    setSaving(false);
    setTimeout(() => router.back(), 800);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Energy</h1>
      <p className="body-sm mb-32">How's your energy right now?</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {LEVELS.map(l => (
          <button
            key={l.value}
            onClick={() => save(l.value)}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '16px 20px', borderRadius: 12,
              border: `2px solid ${selected === l.value ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: selected === l.value ? 'var(--primary-pale)' : 'var(--surface)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 28 }}>{l.icon}</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 16, color: selected === l.value ? 'var(--primary)' : 'var(--text)' }}>
              {l.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
