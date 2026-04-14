'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const GOALS = [
  { key: 'energy', title: 'More energy', icon: '⚡' },
  { key: 'sleep', title: 'Better sleep', icon: '🌙' },
  { key: 'weight_loss', title: 'Weight loss', icon: '🌿' },
  { key: 'hormonal_balance', title: 'Hormonal balance', icon: '⚖️' },
  { key: 'blood_sugar', title: 'Blood sugar control', icon: '💉' },
  { key: 'all', title: 'All of the above', icon: '✨' },
];

export default function OnboardingGoalPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  const name = profile?.first_name ?? 'there';

  const handleContinue = async () => {
    if (!selected || !user) return;
    setLoading(true);
    await getSupabase()
      .from('profiles')
      .update({
        primary_goal: selected,
        onboarding_complete: true,
      })
      .eq('id', user.id);
    router.push('/onboarding/complete');
  };

  return (
    <div className="onboard-page">
      <div className="dot-progress">
        {[0,1,2,3,4,5].map(i => <div key={i} className={`dot ${i === 5 ? 'active' : ''}`} />)}
      </div>

      <h1 className="h1 mb-4">What's your main focus</h1>
      <h1 className="h1 mb-8" style={{ color: 'var(--primary)' }}>right now, {name}?</h1>
      <p className="body-sm mb-24">We'll show you what matters most to you first. You can change this anytime.</p>

      <div className="choice-grid mb-24">
        {GOALS.map(g => (
          <button
            key={g.key}
            className={`choice-card ${selected === g.key ? 'selected' : ''}`}
            onClick={() => setSelected(g.key)}
            style={{ minHeight: 80 }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{g.icon}</div>
            <div className="choice-title" style={{ textAlign: 'center', fontSize: 13 }}>{g.title}</div>
          </button>
        ))}
      </div>

      <div className="mt-auto">
        <button
          className="btn btn-primary"
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? 'Finishing setup…' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
