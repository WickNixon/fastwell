'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

const GOALS = [
  { key: 'energy', title: 'More energy', icon: '🌞' },
  { key: 'sleep', title: 'Better sleep', icon: '💤' },
  { key: 'weight_loss', title: 'Reach my goals', icon: '⚖️' },
  { key: 'hormonal_balance', title: 'Hormonal balance', icon: '☯️' },
  { key: 'blood_sugar', title: 'Blood sugar', icon: '🩸' },
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
      .update({ primary_goal: selected, onboarding_complete: true })
      .eq('id', user.id);
    router.push('/onboarding/complete');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <GreenHeader
        title={`What's your main goal right now, ${name}?`}
        subtitle="Just one for now — you can add more later."
        dotIndex={4}
        totalDots={5}
        showBack
        onBack={() => router.back()}
      />

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {GOALS.map(g => (
            <button
              key={g.key}
              className={`choice-card ${selected === g.key ? 'selected' : ''}`}
              onClick={() => setSelected(g.key)}
              style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: 104, padding: 14 }}
            >
              <div style={{ fontSize: 24, marginBottom: 6 }}>{g.icon}</div>
              <div className="choice-title" style={{ fontSize: 13 }}>{g.title}</div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 'auto' }}>
          <button
            className="btn btn-primary"
            disabled={!selected || loading}
            onClick={handleContinue}
          >
            {loading ? 'Finishing setup…' : 'Take me to my dashboard'}
          </button>
        </div>
      </div>
    </div>
  );
}
