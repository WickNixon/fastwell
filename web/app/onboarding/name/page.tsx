'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

export default function OnboardingNamePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !user) return;
    setLoading(true);
    await getSupabase().from('profiles').update({ first_name: name.trim() }).eq('id', user.id);
    router.push('/onboarding/age');
  };

  return (
    <div className="onboard-page">
      <div className="dot-progress">
        {[0,1,2,3,4,5].map(i => <div key={i} className={`dot ${i === 0 ? 'active' : ''}`} />)}
      </div>

      <h1 className="h1 mb-8">Before anything else —</h1>
      <h1 className="h1 mb-32" style={{ color: 'var(--primary)' }}>what should we call you?</h1>

      <form onSubmit={handleContinue} className="flex flex-col flex-1">
        <input
          className="input"
          type="text"
          placeholder="Your first name"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
          style={{ fontSize: 20, padding: '16px 18px' }}
        />

        <div className="mt-auto">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || loading}
          >
            {loading ? 'Saving…' : 'Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
