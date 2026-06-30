'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { BackChip } from '../_components';

// ─── Plan data (unchanged from original) ─────────────────────────────────────

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

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2" y="4" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2 8h14" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M4 2v14l2-1.5L8 16l2-1.5L12 16l2-1.5L16 16V2H4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 7h4M7 10h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 6h12M11 3l4 3-4 3M15 12H3M7 9l-4 3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 9a6 6 0 1011.65-2M14 3v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="11" viewBox="0 0 14 11" fill="none" aria-hidden>
      <path d="M1 5.5l4 4 8-8" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Action row ───────────────────────────────────────────────────────────────

function ActionRow({
  icon,
  label,
  sub,
  onClick,
  divider = true,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
  divider?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        padding: sub ? '14px 16px' : '0 16px',
        height: sub ? 'auto' : 56,
        minHeight: 56,
        background: 'none',
        border: 'none',
        borderBottom: divider ? '1px solid var(--border)' : 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</span>}
      </span>
      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}><ArrowIcon /></span>
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsSubscriptionPage() {
  const { profile } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly' | 'annual'>('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');

  const tier = profile?.subscription_tier ?? 'free';
  const isMember = tier === 'member_pro';
  const isPro = tier === 'member_pro' || tier === 'pro';
  const trialExpired = !isPro && profile?.pro_trial_ends_at
    ? new Date(profile.pro_trial_ends_at) < new Date()
    : false;

  const plans = isMember ? MEMBER_PLANS : NON_MEMBER_PLANS;
  const selected = plans.find(p => p.key === selectedPlan)!;

  const openPortal = async () => {
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-portal-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
      });
      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        setLoading(false);
        setError('Could not open billing portal. Please try again.');
      }
    } catch {
      setLoading(false);
      setError('Could not open billing portal. Please try again.');
    }
  };

  const startCheckout = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const { data: { session } } = await getSupabase().auth.getSession();
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

  const handleRestore = () => {
    setRestoreMsg('Purchases are managed through your billing portal. Tap "Manage payment method" to review your subscription.');
    setTimeout(() => setRestoreMsg(''), 5000);
  };

  // ─── Active Pro — plan card + action rows ──────────────────────────────────

  if (isPro && profile?.stripe_subscription_id) {
    const planLabel = isMember ? 'Member Pro' : 'Fastwell Pro';

    return (
      <div className="page page-top">
        <BackChip />

        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '16px 0 24px' }}>
          Subscription
        </h1>

        {/* Plan card */}
        <div style={{
          background: 'var(--primary)',
          borderRadius: 18,
          padding: '20px 20px 22px',
          marginBottom: 20,
          color: '#fff',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>
              Current plan
            </span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20 }}>
              {isMember ? 'Member' : 'Pro'}
            </span>
          </div>

          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
            {planLabel}
          </p>
          {isMember && (
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, opacity: 0.85, marginBottom: 12 }}>
              50% member discount, forever
            </p>
          )}

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', margin: '14px 0' }} />

          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, opacity: 0.75 }}>
            Next payment · See billing portal for details
          </p>
        </div>

        {/* Action rows */}
        <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
          <ActionRow icon={<SwapIcon />} label="Change plan" onClick={openPortal} />
          <ActionRow icon={<CardIcon />} label="Manage payment method" onClick={openPortal} />
          <ActionRow icon={<ReceiptIcon />} label="View past invoices" onClick={openPortal} />
          <ActionRow
            icon={<RefreshIcon />}
            label="Restore purchases"
            sub={restoreMsg || undefined}
            onClick={handleRestore}
            divider={false}
          />
        </div>

        {error && (
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#C62828', textAlign: 'center', margin: '12px 0' }}>{error}</p>
        )}

        {/* Cancel link */}
        <div style={{ textAlign: 'center', marginTop: 20, paddingBottom: 32 }}>
          <button
            onClick={openPortal}
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'Lato, sans-serif',
              fontSize: 14,
              color: 'var(--accent)',
              textDecoration: 'underline',
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? 'Opening portal…' : 'Cancel subscription'}
          </button>
        </div>
      </div>
    );
  }

  // ─── Free / trial — plan selection screen ─────────────────────────────────

  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '16px 0 8px', textAlign: 'center' }}>
        {trialExpired ? 'Your 14 days are up' : 'Upgrade to Pro'}
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 28 }}>
        {trialExpired ? 'Ready to keep going? Choose a plan to continue.' : 'Try free for 14 days — cancel anytime'}
      </p>

      {/* Horizontal plan cards */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, marginBottom: 28, scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}>
        {plans.map(plan => {
          const isSelected = selectedPlan === plan.key;
          return (
            <div
              key={plan.key}
              onClick={() => setSelectedPlan(plan.key as 'weekly' | 'monthly' | 'annual')}
              style={{
                minWidth: 150, maxWidth: 170, flexShrink: 0, padding: '16px 14px',
                borderRadius: 14, cursor: 'pointer', scrollSnapAlign: 'start',
                border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: isSelected ? 'var(--primary-pale)' : 'var(--surface)',
                position: 'relative',
              }}
            >
              {isSelected && (
                <span style={{ position: 'absolute', top: 10, right: 10 }}><CheckIcon /></span>
              )}
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11, color: 'var(--primary)', marginBottom: 4 }}>
                {plan.badge}
              </p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 2 }}>
                {plan.duration}
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: plan.save ? 6 : 0 }}>
                {plan.perDay}
              </p>
              {plan.save && (
                <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'var(--accent)', backgroundColor: '#FFF3E8', padding: '2px 6px', borderRadius: 6, display: 'inline-block', marginBottom: 6 }}>
                  {plan.save}
                </span>
              )}
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: isSelected ? 'var(--primary)' : 'var(--text)', marginTop: 4 }}>
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
      <div style={{ marginBottom: 28 }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
            <span style={{ flexShrink: 0, marginTop: 2 }}><CheckIcon /></span>
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
          width: '100%', background: 'var(--primary)', color: '#fff', border: 'none',
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
  );
}
