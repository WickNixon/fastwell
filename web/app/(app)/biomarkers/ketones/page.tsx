'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { Biomarker } from '@/lib/types';

const ZONES = [
  { label: 'Glucose burning', range: '0–0.4', color: '#7A9A6A' },
  { label: 'Light ketosis', range: '0.4–1.5', color: '#5C8A34' },
  { label: 'Nutritional ketosis', range: '1.5–3.0', color: '#3D6020' },
  { label: 'Deep ketosis', range: '3.0+', color: '#D06820' },
];

function getZone(val: number) {
  if (val < 0.4) return ZONES[0];
  if (val < 1.5) return ZONES[1];
  if (val < 3.0) return ZONES[2];
  return ZONES[3];
}

export default function KetonesPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState<Biomarker[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await getSupabase()
      .from('biomarkers').select('*').eq('user_id', profile.id).eq('marker', 'ketones')
      .order('reading_date', { ascending: false }).limit(20);
    setHistory(data ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!value || !profile) return;
    setSaving(true);
    await getSupabase().from('biomarkers').insert({
      user_id: profile.id, marker: 'ketones', value: parseFloat(value), unit: 'mmol/L', reading_date: date,
    });
    setValue('');
    setSaved(true);
    setSaving(false);
    await load();
    setTimeout(() => setSaved(false), 2000);
  };

  const latest = history[0];

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-4">Ketones</h1>
      <p className="body-sm mb-24">Blood ketone readings (mmol/L)</p>

      {latest && (
        <div className="card-lg mb-20" style={{ backgroundColor: 'var(--primary-pale)', border: '1px solid var(--border)' }}>
          <p className="section-label mb-4">Latest</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 36, color: getZone(latest.value).color, lineHeight: 1 }}>
            {latest.value} <span style={{ fontSize: 18 }}>mmol/L</span>
          </p>
          <p style={{ color: getZone(latest.value).color, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, marginTop: 6 }}>
            {getZone(latest.value).label}
          </p>
        </div>
      )}

      {/* Zone guide */}
      <div className="card-lg mb-20">
        <p className="section-label mb-10">Zone guide</p>
        {ZONES.map(z => (
          <div key={z.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)' }}>{z.label}</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: z.color }}>{z.range}</span>
          </div>
        ))}
      </div>

      <div className="card-lg mb-24">
        <p className="section-label mb-12">Log a reading</p>
        <div className="input-group">
          <label className="input-label">Ketones (mmol/L)</label>
          <input className="input" type="number" step="0.1" placeholder="e.g. 1.8" value={value} onChange={e => setValue(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!value || saving}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="section">
          <p className="section-label mb-12">History</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {history.map((b, i) => {
              const zone = getZone(b.value);
              return (
                <div key={b.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '13px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
                }}>
                  <div>
                    <p className="body-sm">{new Date(b.reading_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</p>
                    <p style={{ fontSize: 11, color: zone.color, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>{zone.label}</p>
                  </div>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15 }}>{b.value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
