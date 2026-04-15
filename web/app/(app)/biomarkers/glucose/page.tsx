'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { Biomarker } from '@/lib/types';

export default function GlucosePage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [unit, setUnit] = useState<'mmol' | 'mgdl'>('mmol');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [history, setHistory] = useState<Biomarker[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await getSupabase()
      .from('biomarkers').select('*').eq('user_id', profile.id).eq('marker', 'blood_glucose')
      .order('reading_date', { ascending: false }).limit(20);
    setHistory(data ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!value || !profile || saving) return;
    setSaving(true);
    const { error } = await getSupabase().from('biomarkers').insert({
      user_id: profile.id,
      marker: 'blood_glucose',
      value: parseFloat(value),
      unit: unit === 'mmol' ? 'mmol/L' : 'mg/dL',
      reading_date: date,
      notes: notes || null,
    });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setValue('');
      setNotes('');
      setFeedback({ ok: true, msg: 'Reading saved' });
      setTimeout(() => setFeedback(null), 1500);
      await load();
    }
    setSaving(false);
  };

  const latest = history[0];
  const isNormal = latest && (latest.unit === 'mmol/L' ? latest.value >= 3.9 && latest.value <= 5.5 : latest.value >= 70 && latest.value <= 99);

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-4">Blood Glucose</h1>
      <p className="body-sm mb-24">Normal fasting range: 3.9–5.5 mmol/L</p>

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
        <div className="card-lg mb-24" style={{ background: isNormal ? 'var(--primary-pale)' : '#FFF0E6', border: `1px solid ${isNormal ? 'var(--border)' : 'var(--accent)'}` }}>
          <p className="section-label mb-4">Latest reading</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 36, color: isNormal ? 'var(--primary)' : 'var(--accent)', lineHeight: 1 }}>
            {latest.value} <span style={{ fontSize: 18 }}>{latest.unit}</span>
          </p>
          <p className="body-sm mt-4">{isNormal ? 'Within normal range' : 'Outside normal fasting range'}</p>
        </div>
      )}

      <div className="card-lg mb-24">
        <div className="flex gap-8 mb-16">
          {(['mmol', 'mgdl'] as const).map(u => (
            <button key={u} onClick={() => setUnit(u)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                border: `1.5px solid ${unit === u ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: unit === u ? 'var(--primary-pale)' : 'var(--surface)',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
                color: unit === u ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
              }}>
              {u === 'mmol' ? 'mmol/L' : 'mg/dL'}
            </button>
          ))}
        </div>
        <div className="input-group">
          <label className="input-label">Reading</label>
          <input className="input" type="number" step="0.1" placeholder={unit === 'mmol' ? 'e.g. 5.2' : 'e.g. 94'} value={value} onChange={e => setValue(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="input-group">
          <label className="input-label">Notes (optional)</label>
          <input className="input" type="text" placeholder="e.g. fasting, post-meal" value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={save} disabled={!value || saving}>
          {saving ? 'Saving…' : 'Save reading'}
        </button>
      </div>

      {history.length > 0 && (
        <div className="section">
          <p className="section-label mb-12">History</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {history.map((b, i) => (
              <div key={b.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '13px 16px', borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <p className="body-sm">{new Date(b.reading_date).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}</p>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15 }}>{b.value} {b.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
