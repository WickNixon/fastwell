'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <GreenHeader
        title="What's your name?"
        subtitle="We'll use this to personalise everything."
        dotIndex={0}
        totalDots={5}
      />

      <form onSubmit={handleContinue} style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}>
        <div className="input-group">
          <label className="input-label">First name</label>
          <input
            className="input"
            type="text"
            placeholder="Your first name"
            value={name}
            onChange={e => setName(e.target.value)}
            autoFocus
            style={{ fontSize: 18 }}
          />
        </div>

        <div style={{ marginTop: 'auto' }}>
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
