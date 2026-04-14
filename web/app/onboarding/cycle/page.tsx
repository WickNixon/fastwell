'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const OPTIONS = [
  { key: 'yes_regular', title: 'Yes, regular' },
  { key: 'yes_irregular', title: 'Yes, but irregular' },
  { key: 'no', title: 'No' },
];

export default function OnboardingCyclePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [loading, setLoading] = useState(false);

  const handleSelect = (key: string) => {
    setSelected(key);
  };

  const handleContinue = async () => {
    if (!selected || !user) return;
    setLoading(true);
    const update: Record<string, unknown> = { has_regular_cycle: selected };
    if (selected === 'yes_regular' && cycleLength) {
      update.cycle_length_days = parseInt(cycleLength);
    }
    await getSupabase().from('profiles').update(update).eq('id', user.id);
    router.push('/onboarding/hrt');
  };

  return (
    <div className="onboard-page">
      <div className="dot-progress">
        {[0,1,2,3,4,5].map(i => <div key={i} className={`dot ${i === 3 ? 'active' : ''}`} />)}
      </div>

      <h1 className="h1 mb-32" style={{ color: 'var(--primary)' }}>Are you still getting a regular period?</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {OPTIONS.map(o => (
          <button
            key={o.key}
            className={`choice-card ${selected === o.key ? 'selected' : ''}`}
            onClick={() => handleSelect(o.key)}
          >
            <div className="choice-title">{o.title}</div>
          </button>
        ))}
      </div>

      {selected === 'yes_regular' && (
        <div className="input-group">
          <label className="input-label">How long is your cycle usually? (days)</label>
          <input
            className="input"
            type="number"
            value={cycleLength}
            onChange={e => setCycleLength(e.target.value)}
            min={14}
            max={60}
            placeholder="28"
          />
        </div>
      )}

      <div className="mt-auto">
        <button
          className="btn btn-primary"
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? 'Saving…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
