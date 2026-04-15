'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { Supplement } from '@/lib/types';

// DB values that match the CHECK constraint in the supplements table
const TYPES: { label: string; value: string }[] = [
  { label: 'Supplement', value: 'supplement' },
  { label: 'HRT — Bioidentical', value: 'hrt_bioidentical' },
  { label: 'HRT — Pharmaceutical', value: 'hrt_pharmaceutical' },
  { label: 'Medication', value: 'medication' },
  { label: 'Other', value: 'other' },
];
const FREQUENCIES = ['Once daily', 'Twice daily', 'Three times daily', 'Weekly', 'As needed'];
const DELIVERY = ['Oral', 'Patch', 'Gel', 'Cream', 'Injection', 'Spray'];

function typeLabel(value: string) {
  return TYPES.find(t => t.value === value)?.label ?? value;
}

export default function SupplementsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<Supplement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('supplement');
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [delivery, setDelivery] = useState('Oral');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await getSupabase()
      .from('supplements').select('*').eq('user_id', profile.id)
      .order('is_active', { ascending: false }).order('created_at', { ascending: false });
    setItems(data ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!name || !profile?.id || saving) return;
    setSaving(true);
    const { error } = await getSupabase().from('supplements').insert({
      user_id: profile.id, name, type, dose: dose || null, frequency, delivery, is_active: true,
    });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setName(''); setDose(''); setType('supplement'); setFrequency('Once daily'); setDelivery('Oral');
      setShowModal(false);
      setFeedback({ ok: true, msg: 'Saved' });
      setTimeout(() => setFeedback(null), 1500);
      await load();
    }
    setSaving(false);
  };

  const toggleActive = async (item: Supplement) => {
    await getSupabase().from('supplements').update({
      is_active: !item.is_active,
      paused_at: !item.is_active ? null : new Date().toISOString(),
    }).eq('id', item.id);
    await load();
  };

  const active = items.filter(i => i.is_active);
  const paused = items.filter(i => !i.is_active);

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <div className="flex justify-between items-center mb-24">
        <h1 className="h1">Supplements & HRT</h1>
        <button className="btn btn-primary btn-sm" style={{ width: 'auto', paddingLeft: 16, paddingRight: 16 }} onClick={() => setShowModal(true)}>+ Add</button>
      </div>

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

      {active.length > 0 && (
        <div className="section">
          <p className="section-label mb-12">Active</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {active.map((s, i) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ flex: 1 }}>
                  <p className="h3" style={{ fontSize: 15 }}>{s.name}</p>
                  <p className="body-sm">{[s.type ? typeLabel(s.type) : null, s.dose, s.frequency].filter(Boolean).join(' · ')}</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={s.is_active} onChange={() => toggleActive(s)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {paused.length > 0 && (
        <div className="section">
          <p className="section-label mb-12">Paused</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {paused.map((s, i) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderBottom: i < paused.length - 1 ? '1px solid var(--border)' : 'none',
                opacity: 0.6,
              }}>
                <div style={{ flex: 1 }}>
                  <p className="h3" style={{ fontSize: 15 }}>{s.name}</p>
                  <p className="body-sm">{[s.type ? typeLabel(s.type) : null, s.dose, s.frequency].filter(Boolean).join(' · ')}</p>
                </div>
                <label className="toggle">
                  <input type="checkbox" checked={s.is_active} onChange={() => toggleActive(s)} />
                  <span className="toggle-slider" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">💊</div>
          <p className="h3">Nothing here yet</p>
          <p className="body-sm">Add your HRT, bioidentical hormones, supplements, or medications.</p>
          <button className="btn btn-primary mt-16" style={{ maxWidth: 240 }} onClick={() => setShowModal(true)}>Add first item</button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="h2 mb-20">Add supplement or HRT</h2>

            <div className="input-group">
              <label className="input-label">Name</label>
              <input className="input" type="text" placeholder="e.g. Magnesium Glycinate" value={name} onChange={e => setName(e.target.value)} autoFocus />
            </div>

            <div className="input-group">
              <label className="input-label">Type</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {TYPES.map(t => (
                  <button key={t.value} onClick={() => setType(t.value)} style={{
                    padding: '7px 14px', borderRadius: 20,
                    border: `1.5px solid ${type === t.value ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: type === t.value ? 'var(--primary-pale)' : 'var(--surface)',
                    fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12,
                    color: type === t.value ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
                  }}>{t.label}</button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Dose (optional)</label>
              <input className="input" type="text" placeholder="e.g. 400mg" value={dose} onChange={e => setDose(e.target.value)} />
            </div>

            <div className="input-group">
              <label className="input-label">Frequency</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {FREQUENCIES.map(f => (
                  <button key={f} onClick={() => setFrequency(f)} style={{
                    padding: '7px 14px', borderRadius: 20,
                    border: `1.5px solid ${frequency === f ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: frequency === f ? 'var(--primary-pale)' : 'var(--surface)',
                    fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12,
                    color: frequency === f ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
                  }}>{f}</button>
                ))}
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Delivery</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {DELIVERY.map(d => (
                  <button key={d} onClick={() => setDelivery(d)} style={{
                    padding: '7px 14px', borderRadius: 20,
                    border: `1.5px solid ${delivery === d ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: delivery === d ? 'var(--primary-pale)' : 'var(--surface)',
                    fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12,
                    color: delivery === d ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
                  }}>{d}</button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary mt-8" onClick={save} disabled={!name || saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button className="btn btn-ghost mt-8" onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
