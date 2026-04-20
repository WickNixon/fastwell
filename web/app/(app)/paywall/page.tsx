'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

export default function PaywallPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [plan, setPlan] = useState<'monthly' | 'annual'>('annual');
  const [fastCount, setFastCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const sb = getSupabase();
    Promise.all([
      sb.from('fasting_sessions').select('id', { count: 'exact' }).eq('user_id', profile.id).not('ended_at', 'is', null),
      sb.from('user_badges').select('id', { count: 'exact' }).eq('user_id', profile.id),
    ]).then(([{ count: f }, { count: b }]) => {
      setFastCount(f ?? 0);
      setBadgeCount(b ?? 0);
    });
  }, [profile]);

  const handleSubscribe = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ plan, tier: profile.subscription_tier }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div className="paywall-screen">
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, color: '#FFFFFF' }}>Fastwell</h1>
      </div>

      {/* Headline */}
      <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: '#FFFFFF', textAlign: 'center', marginBottom: 8 }}>
        Your 14 days are up —
      </h2>
      <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: '#FFFFFF', textAlign: 'center', marginBottom: 24 }}>
        ready to keep going?
      </h2>

      {/* Data summary card */}
      {(fastCount > 0 || badgeCount > 0) && (
        <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 14, padding: '16px 20px', marginBottom: 24, textAlign: 'center' }}>
          <p style={{ color: '#FFFFFF', fontFamily: 'Lato, sans-serif', fontSize: 15, lineHeight: 1.5 }}>
            {fastCount > 0 && `You've completed ${fastCount} fasting session${fastCount === 1 ? '' : 's'}`}
            {fastCount > 0 && badgeCount > 0 && ' and '}
            {badgeCount > 0 && `earned ${badgeCount} badge${badgeCount === 1 ? '' : 's'}`}.
            {' '}Don't lose that progress.
          </p>
        </div>
      )}

      {/* Plan cards */}
      <div onClick={() => setPlan('annual')} className={`plan-card ${plan === 'annual' ? 'selected' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#1A1A1A' }}>Annual</p>
          <span style={{ background: '#E2682A', color: '#FFFFFF', borderRadius: 20, padding: '3px 10px', fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Save 30%</span>
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: '#1A1A1A' }}>$159.52 NZD/year</p>
        <p style={{ fontSize: 13, color: '#6B7066', fontFamily: 'Lato, sans-serif' }}>$13.29/month</p>
      </div>

      <div onClick={() => setPlan('monthly')} className={`plan-card ${plan === 'monthly' ? 'selected' : ''}`}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: '#1A1A1A', marginBottom: 4 }}>Monthly</p>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: '#1A1A1A' }}>$18.99 NZD/month</p>
        <p style={{ fontSize: 13, color: '#6B7066', fontFamily: 'Lato, sans-serif' }}>Cancel anytime</p>
      </div>

      <button
        className="btn"
        style={{ backgroundColor: '#FFFFFF', color: 'var(--primary)', marginTop: 8, fontFamily: 'Montserrat, sans-serif', fontWeight: 700 }}
        onClick={handleSubscribe}
        disabled={loading}
      >
        {loading ? 'Redirecting…' : `Continue with ${plan === 'annual' ? 'annual' : 'monthly'}`}
      </button>

      <p style={{ textAlign: 'center', marginTop: 16, color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Lato, sans-serif' }}>
        Wicked Wellbeing members get 50% off —{' '}
        <a href="/invite" style={{ color: '#FFFFFF', textDecoration: 'underline' }}>find out more</a>
      </p>
    </div>
  );
}
