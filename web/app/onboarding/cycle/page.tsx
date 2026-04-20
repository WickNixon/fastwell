'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <GreenHeader
        title="Are you still getting a regular period?"
        subtitle="This helps us sync your fasting plan."
        dotIndex={2}
        totalDots={5}
        showBack
        onBack={() => router.back()}
      />

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {OPTIONS.map(o => (
            <button
              key={o.key}
              className={`choice-card ${selected === o.key ? 'selected' : ''}`}
              onClick={() => setSelected(o.key)}
            >
              <div className="choice-title">{o.title}</div>
            </button>
          ))}
        </div>

        {selected === 'yes_regular' && (
          <div className="input-group">
            <label className="input-label">Cycle length (days)</label>
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

        <div style={{ marginTop: 'auto' }}>
          <button
            className="btn btn-primary"
            disabled={!selected || loading}
            onClick={handleContinue}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
