'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const OPTIONS = [
  { key: 'yes', title: 'Yes' },
  { key: 'no', title: 'No' },
  { key: 'not_sure', title: "Not sure" },
];

export default function OnboardingHrtPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = async (key: string) => {
    if (!user) return;
    setSelected(key);
    setLoading(true);
    await getSupabase().from('profiles').update({ on_hrt: key }).eq('id', user.id);
    setTimeout(() => router.push('/onboarding/goal'), 600);
  };

  return (
    <div className="onboard-page">
      <div className="dot-progress">
        {[0,1,2,3,4,5].map(i => <div key={i} className={`dot ${i === 4 ? 'active' : ''}`} />)}
      </div>

      <h1 className="h1 mb-8">Are you currently using</h1>
      <h1 className="h1 mb-8" style={{ color: 'var(--primary)' }}>HRT or bioidentical hormones?</h1>
      <p className="body-sm mb-32">This helps us make your experience more relevant. You can update this anytime.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {OPTIONS.map(o => (
          <button
            key={o.key}
            className={`choice-card ${selected === o.key ? 'selected' : ''}`}
            onClick={() => handleSelect(o.key)}
            disabled={loading}
          >
            <div className="choice-title">{o.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
