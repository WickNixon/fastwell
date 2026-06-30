'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { BackChip } from '../_components';
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

// ─── Select row — label + current value + chevron; native picker on tap ────────

function ChevronDown() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden>
      <path d="M1 1l5 5 5-5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
  divider = true,
}: {
  label: string;
  value: string;
  options: { key: string; label: string }[];
  onChange: (val: string) => void;
  divider?: boolean;
}) {
  const selectedLabel = options.find(o => o.key === value)?.label ?? '';
  return (
    <div style={{ position: 'relative', borderBottom: divider ? '1px solid var(--border)' : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 16px', gap: 12, pointerEvents: 'none' }}>
        <span style={{ flex: 1, fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)' }}>{label}</span>
        <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: selectedLabel ? 'var(--text-muted)' : 'var(--border)' }}>
          {selectedLabel || 'Select'}
        </span>
        <ChevronDown />
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={label}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          fontSize: 16, // prevent iOS zoom
        }}
      >
        <option value="" disabled>{label}</option>
        {options.map(o => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [firstName, setFirstName] = useState('');
  const [age, setAge] = useState(52);
  const [stage, setStage] = useState('');
  const [cycle, setCycle] = useState('');
  const [hrt, setHrt] = useState('');
  const [goal, setGoal] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name ?? '');
      setAge(profile.age && profile.age >= 18 && profile.age <= 97 ? profile.age : 52);
      setStage(profile.menopause_stage ?? '');
      setCycle(profile.has_regular_cycle ?? '');
      setHrt(profile.on_hrt ?? '');
      setGoal(profile.primary_goal ?? '');
      setWeightUnit(profile.weight_unit ?? 'kg');
    }
  }, [profile]);

  // Stable handler (no AgeTumbler useCallback needed — just a plain setter now)
  const handleAgeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    if (!Number.isNaN(v)) setAge(Math.max(18, Math.min(97, v)));
  }, []);

  const save = async () => {
    if (!profile) return;
    setSaving(true);
    setSaveError('');
    const { error } = await supabase.from('profiles').update({
      first_name: firstName || null,
      age,
      menopause_stage: stage || null,
      has_regular_cycle: cycle || null,
      on_hrt: hrt || null,
      primary_goal: goal || null,
      weight_unit: weightUnit,
    }).eq('id', profile.id);
    if (error) {
      setSaveError(error.message);
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  };

  const isPostMeno = stage === 'post_menopause';

  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '16px 0 6px' }}>
        Profile
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
        Your details from setup — tap any field to update.
      </p>

      {saved && (
        <div style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)', color: 'var(--primary)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontFamily: 'Lato, sans-serif' }}>
          Changes saved
        </div>
      )}
      {saveError && (
        <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', color: '#C62828', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontFamily: 'Lato, sans-serif' }}>
          {saveError}
        </div>
      )}

      {/* Account section */}
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        About you
      </p>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 20 }}>

        {/* First name — text field row */}
        <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 16px', gap: 12, borderBottom: '1px solid var(--border)' }}>
          <span style={{ flex: 1, fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)', flexShrink: 0 }}>First name</span>
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="Your name"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Lato, sans-serif',
              fontSize: 15,
              color: 'var(--text-muted)',
              textAlign: 'right',
              width: 160,
              padding: 0,
            }}
          />
        </div>

        {/* Age — number input row */}
        <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 16px', gap: 12 }}>
          <span style={{ flex: 1, fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)' }}>Age</span>
          <input
            type="number"
            min={18}
            max={97}
            value={age}
            onChange={handleAgeChange}
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontFamily: 'Lato, sans-serif',
              fontSize: 15,
              color: 'var(--text-muted)',
              textAlign: 'right',
              width: 60,
              padding: 0,
              MozAppearance: 'textfield',
            }}
          />
        </div>
      </div>

      {/* Health section */}
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        Health details
      </p>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 20 }}>
        <SelectRow label="Menopause stage" value={stage} options={STAGES} onChange={setStage} />
        {!isPostMeno && (
          <SelectRow label="Still getting a period?" value={cycle} options={CYCLE_OPTIONS} onChange={setCycle} />
        )}
        <SelectRow label="Using HRT or bioidenticals?" value={hrt} options={HRT_OPTIONS} onChange={setHrt} divider={false} />
      </div>

      {/* Goals & units section */}
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        Goals & units
      </p>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 28 }}>
        <SelectRow label="Primary goal" value={goal} options={GOAL_OPTIONS} onChange={setGoal} />

        {/* Weight unit — 2-option inline toggle */}
        <div style={{ display: 'flex', alignItems: 'center', height: 56, padding: '0 16px', gap: 12 }}>
          <span style={{ flex: 1, fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)' }}>Weight unit</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['kg', 'lbs'] as const).map(u => (
              <button
                key={u}
                onClick={() => setWeightUnit(u)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 20,
                  border: `1.5px solid ${weightUnit === u ? 'var(--primary)' : 'var(--border)'}`,
                  background: weightUnit === u ? 'var(--primary-pale)' : 'transparent',
                  color: weightUnit === u ? 'var(--primary)' : 'var(--text-muted)',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        className="btn btn-primary"
        onClick={save}
        disabled={saving}
        style={{ marginBottom: 32 }}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
    </div>
  );
}
