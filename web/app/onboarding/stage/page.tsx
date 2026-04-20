'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

const STAGES = [
  { key: 'perimenopause', title: 'Perimenopause', sub: "I still have periods but they're changing." },
  { key: 'transition', title: 'Menopause transition', sub: 'Periods stopping and starting.' },
  { key: 'post_menopause', title: 'Post-menopause', sub: "No period for 12+ months." },
  { key: 'not_sure', title: 'Not sure', sub: "I don't know which stage I'm at." },
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
    const next = key === 'post_menopause' ? '/onboarding/hrt' : '/onboarding/cycle';
    setTimeout(() => router.push(next), 600);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <GreenHeader
        title="Where are you on your journey?"
        subtitle="Pick whichever feels closest."
        dotIndex={1}
        totalDots={5}
        showBack
        onBack={() => router.back()}
      />

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
