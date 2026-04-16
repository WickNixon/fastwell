'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import type { Biomarker } from '@/lib/types';

// Plain language zones per changelog
const ZONES = [
  { label: 'Not yet in ketosis', min: 0, max: 0.5, color: '#7A9A6A' },
  { label: 'Nutritional ketosis — fat burning zone ✓', min: 0.5, max: 3.0, color: '#5C8A34' },
  { label: 'Deep ketosis', min: 3.0, max: Infinity, color: '#D06820' },
];

function getZone(val: number) {
  return ZONES.find(z => val >= z.min && val < z.max) ?? ZONES[0];
}

function getTodayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function KetonesPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(getTodayNZ);
  const [history, setHistory] = useState<Biomarker[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await getSupabase()
      .from('biomarkers').select('*').eq('user_id', profile.id).eq('marker', 'ketones_blood')
      .order('reading_date', { ascending: false }).limit(20);
    setHistory(data ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!value || !user || saving) return;
    setSaving(true);
    const { error } = await supabase.from('biomarkers').insert({
      user_id: user.id, marker: 'ketones_blood', value: parseFloat(value), unit: 'mmol/L', reading_date: date,
    });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setValue('');
      setFeedback({ ok: true, msg: 'Reading saved' });
      setTimeout(() => setFeedback(null), 1500);
      await load();
    }
    setSaving(false);
  };

  const latest = history[0];

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-4">Ketones</h1>
      <p className="body-sm mb-24">Blood ketone readings (mmol/L)</p>

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

      <div className="card-lg mb-20">
        <p className="section-label mb-10">Zone guide</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)' }}>Not yet in ketosis</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#7A9A6A' }}>Under 0.5</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)' }}>Nutritional ketosis (fat burning zone) ✓</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#5C8A34' }}>0.5–3.0</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)' }}>Deep ketosis</span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#D06820' }}>3.0+</span>
          </div>
        </div>
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
          {saving ? 'Saving…' : 'Save'}
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
