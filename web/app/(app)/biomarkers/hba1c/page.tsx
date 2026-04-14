'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { Biomarker } from '@/lib/types';

export default function HbA1cPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<Biomarker[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await getSupabase()
      .from('biomarkers')
      .select('*')
      .eq('user_id', profile.id)
      .eq('marker', 'hba1c')
      .order('reading_date', { ascending: false })
      .limit(10);
    setHistory(data ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!value || !profile) return;
    setSaving(true);
    await getSupabase().from('biomarkers').insert({
      user_id: profile.id,
      marker: 'hba1c',
      value: parseFloat(value),
      unit: '%',
      reading_date: date,
      notes: notes || null,
    });
    setValue('');
    setNotes('');
    setSaved(true);
    setSaving(false);
    await load();
    setTimeout(() => setSaved(false), 2000);
  };

  const latest = history[0];
  const first = history[history.length - 1];
  const improved = history.length > 1 && first.value > latest.value;

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-4">HbA1c</h1>
      <p className="body-sm mb-24">Your 3-month blood sugar average</p>

      {latest && (
        <div className="card-lg mb-24" style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)' }}>
          <p className="section-label mb-4">Latest reading</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 36, color: 'var(--primary)', lineHeight: 1 }}>
            {latest.value}%
          </p>
          <p className="body-sm mt-4">{new Date(latest.reading_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          {improved && (
            <p style={{ marginTop: 8, color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13 }}>
              ↓ Down from {first.value}% since you started
            </p>
          )}
        </div>
      )}

      <div className="card-lg mb-24">
        <p className="section-label mb-12">Log a reading</p>
        <div className="input-group">
          <label className="input-label">HbA1c %</label>
          <input className="input" type="number" step="0.1" placeholder="e.g. 5.8" value={value} onChange={e => setValue(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Date of test</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Notes (optional)</label>
          <input className="input" type="text" placeholder="e.g. post-fasting, GP appointment" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!value || saving}>
          {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save reading'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="section">
          <p className="section-label mb-12">History</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {history.map((b, i) => (
              <div key={b.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 16px',
                borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <p className="body-sm">{new Date(b.reading_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>{b.value}%</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
