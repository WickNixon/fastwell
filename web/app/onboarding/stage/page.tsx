'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const STAGES = [
  {
    key: 'perimenopause',
    title: 'Perimenopause',
    sub: "I still have periods but they're changing",
  },
  {
    key: 'transition',
    title: 'Menopause transition',
    sub: 'My periods have been stopping and starting',
  },
  {
    key: 'post_menopause',
    title: 'Post-menopause',
    sub: "I haven't had a period for 12+ months",
  },
  {
    key: 'not_sure',
    title: "Not sure",
    sub: "I'm not certain which stage I'm at",
  },
];

export default function OnboardingStagePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSelect = async (key: string) => {
    if (!user) return;
    setSelected(key);
    setLoading(true);
    await getSupabase().from('profiles').update({ menopause_stage: key }).eq('id', user.id);
    // Post-menopausal users skip the cycle question — it's not relevant
    const next = key === 'post_menopause' ? '/onboarding/hrt' : '/onboarding/cycle';
    setTimeout(() => router.push(next), 600);
  };

  return (
    <div className="onboard-page">
      <div className="dot-progress">
        {[0,1,2,3,4,5].map(i => <div key={i} className={`dot ${i === 2 ? 'active' : ''}`} />)}
      </div>

      <h1 className="h1 mb-8">Where are you in your</h1>
      <h1 className="h1 mb-8" style={{ color: 'var(--primary)' }}>menopause journey?</h1>
      <p className="body-sm mb-32">If you're not sure, that's okay — just pick the closest one.</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {STAGES.map(s => (
          <button
            key={s.key}
            className={`choice-card ${selected === s.key ? 'selected' : ''}`}
            onClick={() => handleSelect(s.key)}
            disabled={loading}
          >
            <div>
              <div className="choice-title">{s.title}</div>
              <div className="choice-sub">{s.sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
