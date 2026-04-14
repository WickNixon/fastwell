'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

export default function OnboardingAgePage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [age, setAge] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.age) setAge(String(profile.age));
  }, [profile]);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    const ageNum = parseInt(age);
    if (!ageNum || ageNum < 18 || ageNum > 100 || !user) return;
    setLoading(true);
    await getSupabase().from('profiles').update({ age: ageNum }).eq('id', user.id);
    router.push('/onboarding/stage');
  };

  const name = profile?.first_name ?? 'there';

  return (
    <div className="onboard-page">
      <div className="dot-progress">
        {[0,1,2,3,4,5].map(i => <div key={i} className={`dot ${i === 1 ? 'active' : ''}`} />)}
      </div>

      <h1 className="h1 mb-8">How old are you,</h1>
      <h1 className="h1 mb-8" style={{ color: 'var(--primary)' }}>{name}?</h1>
      <p className="body-sm mb-32">This helps us personalise your experience. No judgment here.</p>

      <form onSubmit={handleContinue} className="flex flex-col flex-1">
        <input
          className="input"
          type="number"
          placeholder="Your age"
          value={age}
          onChange={e => setAge(e.target.value)}
          min={18}
          max={100}
          autoFocus
          style={{ fontSize: 20, padding: '16px 18px' }}
        />

        <div className="mt-auto">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!age || parseInt(age) < 18 || loading}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
          <button type="button" className="btn btn-ghost mt-8" onClick={() => router.push('/onboarding/stage')}>
            Skip for now
          </button>
        </div>
      </form>
    </div>
  );
}
