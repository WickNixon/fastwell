'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import AgeTumbler from '@/components/AgeTumbler';

export default function OnboardingAgePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [age, setAge] = useState(52);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.age && profile.age >= 18 && profile.age <= 97) {
      setAge(profile.age);
    }
  }, [profile]);

  const handleChange = useCallback((val: number) => setAge(val), []);

  const handleContinue = async () => {
    if (!user) return;
    setLoading(true);
    await getSupabase().from('profiles').update({ age }).eq('id', user.id);
    router.push('/onboarding/stage');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      {/* Green header card */}
      <div style={{
        backgroundColor: '#1E8A4F',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        padding: '52px 24px 28px',
      }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              height: 6,
              borderRadius: 3,
              backgroundColor: i === 0 ? '#FFFFFF' : 'rgba(255,255,255,0.35)',
              width: i === 0 ? 18 : 6,
            }} />
          ))}
        </div>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 28, color: '#FFFFFF', marginBottom: 6, letterSpacing: '-0.01em' }}>
          How old are you?
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.82)' }}>
          No judgment here.
        </p>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        <AgeTumbler value={age} onChange={handleChange} />

        <div style={{ marginTop: 'auto', paddingTop: 32 }}>
          <button
            className="btn btn-primary"
            onClick={handleContinue}
            disabled={loading}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
          <button
            type="button"
            className="btn btn-ghost mt-8"
            onClick={() => router.push('/onboarding/stage')}
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
