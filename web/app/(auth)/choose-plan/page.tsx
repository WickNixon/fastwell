'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

function RadioCircle({ selected }: { selected: boolean }) {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 11, flexShrink: 0,
      border: selected ? 'none' : '2px solid rgba(255,255,255,0.6)',
      backgroundColor: selected ? 'white' : 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {selected && <div style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#1E8A4F' }} />}
    </div>
  );
}

function RadioCircleUnselected() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 11, flexShrink: 0,
      border: '2px solid #E8E4D9',
      backgroundColor: 'transparent',
    }} />
  );
}

export default function ChoosePlanPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [selected, setSelected] = useState<PlanKey>('monthly');
  const [loading, setLoading] = useState(false);

  const isMember = profile?.subscription_tier === 'member_pro';

  const getPrice = (plan: PlanDef) => isMember ? plan.memberPriceLabel : plan.priceLabel;

  const selectedPlan = PLANS.find(p => p.key === selected)!;

  const handleContinue = async () => {
    if (selected === 'payg') {
      router.push('/onboarding/name');
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
        position: 'relative',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 20, left: 20,
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontSize: 22, lineHeight: 1,
          }}
          aria-label="Back"
        >
          ‹
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 28, color: '#FFFFFF', marginBottom: 8, marginTop: 8 }}>
          Choose a plan.
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.82)' }}>
          Cancel anytime, no commitment.
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '28px 20px 48px' }}>
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
                {/* Floating badge */}
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

                {/* Radio */}
                {isSelected ? <RadioCircle selected={true} /> : <RadioCircleUnselected />}

                {/* Text */}
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

                {/* Price */}
                <p style={{
                  fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14,
                  color: isSelected ? 'white' : '#1A1A1A',
                  flexShrink: 0,
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
          onClick={() => router.push('/onboarding/name')}
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
