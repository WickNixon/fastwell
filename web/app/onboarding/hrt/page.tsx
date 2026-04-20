'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

const OPTIONS = [
  { key: 'yes', title: 'Yes' },
  { key: 'no', title: 'No' },
  { key: 'not_sure', title: 'Not sure' },
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
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <GreenHeader
        title="Using HRT or bioidentical hormones?"
        subtitle="You can update this anytime."
        dotIndex={3}
        totalDots={5}
        showBack
        onBack={() => router.back()}
      />

      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
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
