'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const NON_MEMBER_PLANS = [
  { key: 'weekly',  label: 'Weekly',  badge: 'Popular',    duration: '1 Week',  perDay: '$0.61 / day', price: '$4.30',   priceSub: 'per week',            save: null },
  { key: 'monthly', label: 'Monthly', badge: 'Best Value', duration: '1 Month', perDay: '$0.47 / day', price: '$13.99',  priceSub: 'per month',           save: 'Save 25%' },
  { key: 'annual',  label: 'Annual',  badge: 'Best Price', duration: '1 Year',  perDay: '$0.33 / day', price: '$117.48', priceSub: 'per year ($9.79/mo)', save: 'Save 47%' },
];

const MEMBER_PLANS = [
  { key: 'weekly',  label: 'Weekly',  badge: 'Popular',    duration: '1 Week',  perDay: '$0.31 / day', price: '$2.15',  priceSub: 'per week',            save: null },
  { key: 'monthly', label: 'Monthly', badge: 'Best Value', duration: '1 Month', perDay: '$0.23 / day', price: '$7.00',  priceSub: 'per month',           save: 'Save 25%' },
  { key: 'annual',  label: 'Annual',  badge: 'Best Price', duration: '1 Year',  perDay: '$0.16 / day', price: '$58.74', priceSub: 'per year ($4.90/mo)', save: 'Save 47%' },
];

const FEATURES = [
  { text: 'Macro image analyser', soon: false },
  { text: 'Personalised Meal Plans', soon: true },
  { text: 'Everything in Free — plus more as we grow', soon: false },
];

const HEADLINES: Record<string, { headline: string; sub: string }> = {
  macros:     { headline: 'Unlock the Macro Analyser',    sub: 'Snap a photo — get your macros in seconds.' },
  meal_plans: { headline: 'Personalised Meal Plans',      sub: 'Tell us your goals. We\'ll plan your week.' },
  general:    { headline: 'Upgrade to Pro',               sub: 'Try free for 14 days — cancel anytime.' },
};

interface UpgradeModalProps {
  visible: boolean;
  onClose: () => void;
  context?: 'macros' | 'meal_plans' | 'general';
}

export default function UpgradeModal({ visible, onClose, context = 'general' }: UpgradeModalProps) {
  const { user, profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!visible) return null;

  const isMember = profile?.subscription_tier === 'member';
  const plans = isMember ? MEMBER_PLANS : NON_MEMBER_PLANS;
  const selected = plans.find(p => p.key === selectedPlan)!;
  const { headline, sub } = HEADLINES[context] ?? HEADLINES.general;

  const startCheckout = async () => {
    if (loading || !user) return;
    setLoading(true);
    setError('');
    try {
      const supabase = getSupabase();
      await supabase.from('profiles').update({
        pro_trial_started_at: new Date().toISOString(),
        pro_trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      }).eq('id', user.id);

      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-subscriber-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setError(json.error ?? 'Something went wrong. Please try again.');
        setLoading(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'var(--bg)', borderRadius: '20px 20px 0 0', maxHeight: '92dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle + close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '12px 20px 0', flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)', lineHeight: 1, padding: 4 }}
            aria-label="Close"
          >✕</button>
        </div>

        <div style={{ flex: 1, padding: '4px 20px 32px', overflowY: 'auto' }}>
          {/* Headline */}
          <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text)', marginBottom: 6, textAlign: 'center' }}>
            {headline}
          </h2>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 24 }}>
            {sub}
          </p>

          {/* Plan cards */}
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 24, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
            {plans.map(plan => {
              const isSelected = selectedPlan === plan.key;
              return (
                <div
                  key={plan.key}
                  onClick={() => setSelectedPlan(plan.key as 'weekly' | 'monthly' | 'annual')}
                  style={{
                    minWidth: 150, maxWidth: 170, flexShrink: 0, padding: '16px 14px',
                    borderRadius: 14, cursor: 'pointer', scrollSnapAlign: 'start',
                    border: `2px solid ${isSelected ? '#3B82F6' : 'var(--border)'}`,
                    backgroundColor: isSelected ? '#EFF6FF' : 'var(--surface)',
                    position: 'relative',
                  }}
                >
                  {isSelected && (
                    <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 14, color: '#3B82F6' }}>✓</span>
                  )}
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11, color: '#1E8A4F', marginBottom: 4 }}>
                    {plan.badge}
                  </p>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>
                    {plan.duration}
                  </p>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: plan.save ? 6 : 0 }}>
                    {plan.perDay}
                  </p>
                  {plan.save && (
                    <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: '#E2682A', backgroundColor: '#FFF3E8', padding: '2px 6px', borderRadius: 6, display: 'inline-block', marginBottom: 6 }}>
                      {plan.save}
                    </span>
                  )}
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: isSelected ? '#3B82F6' : 'var(--text)', marginTop: 4 }}>
                    {plan.price}
                  </p>
                  <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 11, color: 'var(--text-muted)' }}>
                    {plan.priceSub}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Feature list */}
          <div style={{ marginBottom: 24 }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ color: '#1E8A4F', fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)', lineHeight: 1.4 }}>
                  {f.text}{f.soon && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>coming soon</span>}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={startCheckout}
            disabled={loading}
            style={{
              width: '100%', background: '#1E8A4F', color: '#fff', border: 'none',
              borderRadius: 14, padding: '14px 20px', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              opacity: loading ? 0.7 : 1,
            }}
          >
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 17 }}>
              {loading ? 'Opening Checkout…' : 'Start My Free Trial'}
            </span>
            {!loading && (
              <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, opacity: 0.8 }}>
                14-day free trial · {selected.price} {selected.priceSub} after
              </span>
            )}
          </button>

          {error && (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#C62828', marginTop: 12, textAlign: 'center' }}>{error}</p>
          )}

          {isMember && (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16 }}>
              Wicked Wellbeing member prices — 50% off forever.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
