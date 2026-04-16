'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';

const STAGES = [
  { key: 'perimenopause', label: 'Perimenopause' },
  { key: 'transition', label: 'Menopause transition' },
  { key: 'post_menopause', label: 'Post-menopause' },
  { key: 'not_sure', label: 'Not sure' },
];

const CYCLE_OPTIONS = [
  { key: 'yes_regular', label: 'Yes, regular' },
  { key: 'yes_irregular', label: 'Yes, but irregular' },
  { key: 'no', label: 'No' },
];

const HRT_OPTIONS = [
  { key: 'yes', label: 'Yes' },
  { key: 'no', label: 'No' },
  { key: 'not_sure', label: 'Not sure' },
];

const GOAL_OPTIONS = [
  { key: 'energy', label: 'More energy' },
  { key: 'sleep', label: 'Better sleep' },
  { key: 'weight_loss', label: 'Weight loss' },
  { key: 'hormonal_balance', label: 'Hormonal balance' },
  { key: 'blood_sugar', label: 'Blood sugar control' },
  { key: 'all', label: 'All of the above' },
];

export default function SettingsProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState('');
  const [stage, setStage] = useState('');
  const [cycle, setCycle] = useState('');
  const [hrt, setHrt] = useState('');
  const [goal, setGoal] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setAge(profile.age ? String(profile.age) : '');
      setStage(profile.menopause_stage ?? '');
      setCycle(profile.has_regular_cycle ?? '');
      setHrt(profile.on_hrt ?? '');
      setGoal(profile.primary_goal ?? '');
      setWeightUnit(profile.weight_unit ?? 'kg');
    }
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    await supabase.from('profiles').update({
      first_name: firstName || null,
      age: age ? parseInt(age) : null,
      menopause_stage: stage || null,
      has_regular_cycle: cycle || null,
      on_hrt: hrt || null,
      primary_goal: goal || null,
      weight_unit: weightUnit,
    }).eq('id', profile.id);
    await refreshProfile();
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const isPostMeno = stage === 'post_menopause';

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Profile</h1>
      <p className="body-sm mb-24">Your details from setup — tap any field to update.</p>

      {saved && (
        <div style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)', color: 'var(--primary)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontFamily: 'Lato, sans-serif' }}>
          ✓ Changes saved
        </div>
      )}

      <div className="input-group">
        <label className="input-label">First name</label>
        <input className="input" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Your first name" />
      </div>

      <div className="input-group">
        <label className="input-label">Age</label>
        <input className="input" type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="e.g. 52" min={18} max={99} />
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

      {!isPostMeno && (
        <div className="input-group">
          <label className="input-label">Are you still getting a period?</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {CYCLE_OPTIONS.map(o => (
              <button key={o.key} onClick={() => setCycle(o.key)} style={{
                padding: '12px 16px', borderRadius: 10, textAlign: 'left',
                border: `2px solid ${cycle === o.key ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: cycle === o.key ? 'var(--primary-pale)' : 'var(--surface)',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
                color: cycle === o.key ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
              }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="input-group">
        <label className="input-label">Using HRT or bioidentical hormones?</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {HRT_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setHrt(o.key)} style={{
              flex: 1, padding: '12px 4px', borderRadius: 10,
              border: `2px solid ${hrt === o.key ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: hrt === o.key ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
              color: hrt === o.key ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
            }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="input-group">
        <label className="input-label">Primary goal</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GOAL_OPTIONS.map(o => (
            <button key={o.key} onClick={() => setGoal(o.key)} style={{
              padding: '12px 16px', borderRadius: 10, textAlign: 'left',
              border: `2px solid ${goal === o.key ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: goal === o.key ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
              color: goal === o.key ? 'var(--primary)' : 'var(--text)', cursor: 'pointer',
            }}>
              {o.label}
            </button>
          ))}
        </div>
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

      <button className="btn btn-primary mt-8" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
