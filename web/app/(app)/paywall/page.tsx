'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

type PlanKey = 'payg' | 'monthly' | 'annual';

interface PlanDef {
  key: PlanKey;
  title: string;
  desc: string;
  priceLabel: string;
  memberPriceLabel: string;
  badge?: string;
  discountTag?: string;
}

const PLANS: PlanDef[] = [
  {
    key: 'payg',
    title: 'Pay as you go',
    desc: 'Perfect for trying things out',
    priceLabel: '$4.75 / wk',
    memberPriceLabel: '$2.38 / wk',
  },
  {
    key: 'monthly',
    title: 'Monthly Pass',
    desc: 'Unlimited everything',
    priceLabel: '$18.99 / mo',
    memberPriceLabel: '$9.50 / mo',
    badge: 'Popular',
    discountTag: '–25%',
  },
  {
    key: 'annual',
    title: 'Annual',
    desc: 'Save 47% vs monthly',
    priceLabel: '$159.52 / yr',
    memberPriceLabel: '$79.76 / yr',
    badge: 'Best value',
  },
];

function RadioCircleSelected() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 11, flexShrink: 0,
      border: 'none', backgroundColor: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E8A4F' }} />
    </div>
  );
}

function RadioCircleUnselected() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 11, flexShrink: 0,
      border: '2px solid #E8E4D9', backgroundColor: 'transparent',
    }} />
  );
}

export default function PaywallPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<PlanKey>('monthly');
  const [loading, setLoading] = useState(false);
  const [fastCount, setFastCount] = useState(0);
  const [badgeCount, setBadgeCount] = useState(0);

  const isMember = profile?.subscription_tier === 'member_pro';

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

  const getPrice = (plan: PlanDef) => isMember ? plan.memberPriceLabel : plan.priceLabel;
  const selectedPlan = PLANS.find(p => p.key === selected)!;

  const handleContinue = async () => {
    if (selected === 'payg') {
      router.push('/dashboard');
      return;
    }
    setLoading(true);
    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      const planMap: Record<string, string> = { monthly: 'monthly', annual: 'annual' };
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ plan: planMap[selected], tier: profile?.subscription_tier ?? 'subscriber' }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      {/* Green header */}
      <div style={{
        height: 180,
        backgroundColor: '#1E8A4F',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        padding: '52px 24px 28px',
        flexShrink: 0,
      }}>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 28, color: '#FFFFFF', marginBottom: 8, marginTop: 8 }}>
          Choose a plan.
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.82)' }}>
          Cancel anytime, no commitment.
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '28px 20px 48px' }}>
        {/* Progress summary */}
        {(fastCount > 0 || badgeCount > 0) && (
          <div style={{ backgroundColor: 'white', border: '1px solid #E8E4D9', borderRadius: 14, padding: '14px 16px', marginBottom: 20 }}>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: '#1A1A1A', lineHeight: 1.5, textAlign: 'center' }}>
              {fastCount > 0 && `You&apos;ve completed ${fastCount} fast${fastCount === 1 ? '' : 's'}`}
              {fastCount > 0 && badgeCount > 0 && ' and '}
              {badgeCount > 0 && `earned ${badgeCount} badge${badgeCount === 1 ? '' : 's'}`}.
              {' '}Keep that progress.
            </p>
          </div>
        )}

        {/* Plan rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
          {PLANS.map(plan => {
            const isSelected = selected === plan.key;
            return (
              <button
                key={plan.key}
                onClick={() => setSelected(plan.key)}
                style={{
                  position: 'relative',
                  backgroundColor: isSelected ? '#1E8A4F' : 'white',
                  border: isSelected ? 'none' : '1px solid #E8E4D9',
                  borderRadius: 16,
                  padding: '16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  textAlign: 'left',
                  width: '100%',
                  marginTop: plan.badge ? 12 : 0,
                }}
              >
                {plan.badge && (
                  <span style={{
                    position: 'absolute', top: -10, right: 14,
                    backgroundColor: '#E2682A', color: 'white',
                    borderRadius: 20, padding: '3px 10px',
                    fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11,
                  }}>
                    {plan.badge}
                  </span>
                )}
                {isSelected ? <RadioCircleSelected /> : <RadioCircleUnselected />}
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15,
                    color: isSelected ? 'white' : '#1A1A1A', marginBottom: 2,
                  }}>
                    {plan.title}
                    {plan.discountTag && isSelected && (
                      <span style={{
                        marginLeft: 8,
                        backgroundColor: '#E2682A', color: 'white',
                        borderRadius: 20, padding: '2px 8px',
                        fontSize: 10, fontWeight: 600,
                        verticalAlign: 'middle',
                      }}>
                        {plan.discountTag}
                      </span>
                    )}
                  </p>
                  <p style={{
                    fontFamily: 'Lato, sans-serif', fontSize: 13,
                    color: isSelected ? 'rgba(255,255,255,0.82)' : '#6B7066',
                  }}>
                    {plan.desc}
                  </p>
                </div>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14,
                  color: isSelected ? 'white' : '#1A1A1A', flexShrink: 0,
                }}>
                  {getPrice(plan)}
                </p>
              </button>
            );
          })}
        </div>

        {/* CTA */}
        <button
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={loading}
          style={{ width: '100%', marginBottom: 16 }}
        >
          {loading ? 'Redirecting…' : `Continue with ${selectedPlan.title}`}
        </button>

        {/* Skip */}
        <button
          onClick={() => router.push('/dashboard')}
          style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
            color: '#1E8A4F', textDecoration: 'underline', textDecorationColor: '#1E8A4F',
            textAlign: 'center', padding: '8px 0',
          }}
        >
          Continue on the free plan
        </button>
      </div>
    </div>
  );
}
