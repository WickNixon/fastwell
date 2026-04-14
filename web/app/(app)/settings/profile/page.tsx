'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const STAGES = [
  { key: 'perimenopause', label: 'Perimenopause' },
  { key: 'transition', label: 'Menopause transition' },
  { key: 'post_menopause', label: 'Post-menopause' },
  { key: 'not_sure', label: 'Not sure' },
];

export default function SettingsProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [stage, setStage] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.first_name ?? '');
      setWeightUnit(profile.weight_unit ?? 'kg');
      setStage(profile.menopause_stage ?? '');
    }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    await getSupabase().from('profiles').update({
      first_name: name,
      weight_unit: weightUnit,
      menopause_stage: stage || null,
    }).eq('id', profile.id);
    await refreshProfile();
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-24">Profile</h1>

      <div className="input-group">
        <label className="input-label">First name</label>
        <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} />
      </div>

      <div className="input-group">
        <label className="input-label">Weight units</label>
        <div style={{ display: 'flex', gap: 10 }}>
          {['kg', 'lbs'].map(u => (
            <button key={u} onClick={() => setWeightUnit(u)} style={{
              flex: 1, padding: '12px 0', borderRadius: 10,
              border: `2px solid ${weightUnit === u ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: weightUnit === u ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15,
              color: weightUnit === u ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
            }}>
              {u}
            </button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Menopause stage</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {STAGES.map(s => (
            <button key={s.key} onClick={() => setStage(s.key)} style={{
              padding: '12px 16px', borderRadius: 10, textAlign: 'left',
              border: `2px solid ${stage === s.key ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: stage === s.key ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
              color: stage === s.key ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
            }}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary mt-8" onClick={save} disabled={saving}>
        {saved ? '✓ Saved' : saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
