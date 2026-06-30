'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { BackChip } from '../_components';
import { resolveSubView, isMemberOrigin } from '@/lib/subscription';

// ─── Placeholder prices ────────────────────────────────────────────────────────
// These are PLACEHOLDERS. Swap for real Stripe price objects in Batch B.
// One place to update — do not scatter price strings elsewhere.

const PRICES = {
  member: {
    monthly: { label: '$9.50 / month', sub: '50% member discount' },
    annual:  { label: '$79.76 / year', sub: '~$6.65/mo · 50% member discount' },
  },
  subscriber: {
    monthly: { label: '$18.99 / month', sub: null },
    annual:  { label: '$159.52 / year', sub: '~$13.29/mo · save 30%' },
  },
} as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 6h12M11 3l4 3-4 3M15 12H3M7 9l-4 3 4 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
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

function RefreshIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M3 9a6 6 0 1011.65-2M14 3v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Reusable sub-components ──────────────────────────────────────────────────

function GreenCard({ label, title, sub, badge }: {
  label: string;
  title: string;
  sub?: string;
  badge?: string;
}) {
  return (
    <div style={{
      background: 'var(--primary)',
      borderRadius: 18,
      padding: '20px 20px 22px',
      marginBottom: 20,
      color: '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>
          {label}
        </span>
        {badge && (
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: 20 }}>
            {badge}
          </span>
        )}
      </div>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: sub ? 6 : 0 }}>
        {title}
      </p>
      {sub && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, opacity: 0.85 }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function ActionRow({ icon, label, sub, onClick, divider = true }: {
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
        display: 'flex', alignItems: 'center', gap: 14, width: '100%',
        padding: sub ? '14px 16px' : '0 16px',
        height: sub ? 'auto' : 56, minHeight: 56,
        background: 'none', border: 'none',
        borderBottom: divider ? '1px solid var(--border)' : 'none',
        cursor: 'pointer', textAlign: 'left',
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

function UpgradeRow({ label, price, sub, onClick, primary = false }: {
  label: string;
  price: string;
  sub?: string | null;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '14px 16px', background: 'none', border: 'none',
        borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
      }}
    >
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)' }}>{label}</span>
        {sub && <span style={{ display: 'block', fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</span>}
      </span>
      <span style={{
        fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14,
        color: primary ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0, marginLeft: 12,
      }}>
        {price}
      </span>
    </button>
  );
}

function CancelLink({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <div style={{ textAlign: 'center', marginTop: 20, paddingBottom: 32 }}>
      <button
        onClick={onClick}
        disabled={loading}
        style={{
          background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: 'Lato, sans-serif', fontSize: 14,
          color: 'var(--accent)', textDecoration: 'underline', opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? 'Opening portal…' : 'Cancel subscription'}
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsSubscriptionPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [restoreMsg, setRestoreMsg] = useState('');

  const view = resolveSubView(profile);
  const isMember = isMemberOrigin(profile);

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
      if (url) { window.location.href = url; }
      else { setLoading(false); setError('Could not open billing portal. Please try again.'); }
    } catch {
      setLoading(false);
      setError('Could not open billing portal. Please try again.');
    }
  };

  const handleUpgrade = () => {
    // Batch B: wire real checkout here. For now → portal or stub.
    openPortal();
  };

  const handleRestore = () => {
    setRestoreMsg('Purchases are managed through your billing portal. Tap "Manage payment method" to review.');
    setTimeout(() => setRestoreMsg(''), 5000);
  };

  // Trial days remaining (used for subscriber_trial)
  const trialDaysLeft = profile?.pro_trial_ends_at
    ? Math.max(0, Math.ceil((new Date(profile.pro_trial_ends_at).getTime() - Date.now()) / 86400000))
    : null;

  const trialEndDate = profile?.pro_trial_ends_at
    ? new Date(profile.pro_trial_ends_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  const memberPrices = PRICES.member;
  const subPrices    = PRICES.subscriber;

  return (
    <div className="page page-top">
      <BackChip />
      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '16px 0 24px' }}>
        Subscription
      </h1>

      {/* ── OWNER ── */}
      {view === 'owner' && (
        <>
          <GreenCard
            label="Account"
            title="Owner access"
            sub="Full access to everything. No billing."
            badge="Owner"
          />
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Your account has permanent full access.
          </p>
        </>
      )}

      {/* ── MEMBER TRIAL ── */}
      {view === 'member_trial' && (
        <>
          <GreenCard
            label="Current plan"
            title={`Pro · Free until ${trialEndDate ?? 'end of trial'}`}
            sub="You're a Wicked Wellbeing member — 50% off after your trial."
            badge="Member"
          />
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Lock in your rate after the trial
          </p>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
            <UpgradeRow label="Monthly" price={memberPrices.monthly.label} sub={memberPrices.monthly.sub} onClick={handleUpgrade} primary />
            <UpgradeRow label="Annual" price={memberPrices.annual.label} sub={memberPrices.annual.sub} onClick={handleUpgrade} />
          </div>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Prices are placeholders — final rates set when billing launches.
          </p>
        </>
      )}

      {/* ── MEMBER PAYING ── */}
      {view === 'member_paying' && (
        <>
          <GreenCard
            label="Current plan"
            title="Fastwell Pro · Member"
            sub="50% member discount, forever."
            badge="Member"
          />
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
            <ActionRow icon={<SwapIcon />}   label="Change plan"              onClick={openPortal} />
            <ActionRow icon={<CardIcon />}   label="Manage payment method"    onClick={openPortal} />
            <ActionRow icon={<ReceiptIcon />}label="View past invoices"       onClick={openPortal} />
            <ActionRow icon={<RefreshIcon />}label="Restore purchases"        sub={restoreMsg || undefined} onClick={handleRestore} divider={false} />
          </div>
          {error && <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#C62828', textAlign: 'center', margin: '12px 0' }}>{error}</p>}
          <CancelLink onClick={openPortal} loading={loading} />
        </>
      )}

      {/* ── MEMBER FREE ── */}
      {view === 'member_free' && (
        <>
          <GreenCard
            label="Current plan"
            title="Free plan"
            sub="You're a member — upgrade anytime at 50% off."
            badge="Member"
          />
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Upgrade at your member rate
          </p>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
            <UpgradeRow label="Monthly" price={memberPrices.monthly.label} sub={memberPrices.monthly.sub} onClick={handleUpgrade} primary />
            <UpgradeRow label="Annual"  price={memberPrices.annual.label}  sub={memberPrices.annual.sub}  onClick={handleUpgrade} />
          </div>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Prices are placeholders — final rates set when billing launches.
          </p>
        </>
      )}

      {/* ── SUBSCRIBER TRIAL ── */}
      {view === 'subscriber_trial' && (
        <>
          <GreenCard
            label="Current plan"
            title={trialDaysLeft !== null ? `Pro trial · ${trialDaysLeft} day${trialDaysLeft === 1 ? '' : 's'} left` : 'Pro trial'}
            sub={trialEndDate ? `Trial ends ${trialEndDate}` : undefined}
          />
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Keep going after your trial
          </p>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
            <UpgradeRow label="Monthly" price={subPrices.monthly.label} sub={subPrices.monthly.sub} onClick={handleUpgrade} primary />
            <UpgradeRow label="Annual"  price={subPrices.annual.label}  sub={subPrices.annual.sub}  onClick={handleUpgrade} />
          </div>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Prices are placeholders — final rates set when billing launches.
          </p>
        </>
      )}

      {/* ── SUBSCRIBER PAYING ── */}
      {view === 'subscriber_paying' && (
        <>
          <GreenCard label="Current plan" title="Fastwell Pro" />
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
            <ActionRow icon={<SwapIcon />}   label="Change plan"              onClick={openPortal} />
            <ActionRow icon={<CardIcon />}   label="Manage payment method"    onClick={openPortal} />
            <ActionRow icon={<ReceiptIcon />}label="View past invoices"       onClick={openPortal} />
            <ActionRow icon={<RefreshIcon />}label="Restore purchases"        sub={restoreMsg || undefined} onClick={handleRestore} divider={false} />
          </div>
          {error && <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#C62828', textAlign: 'center', margin: '12px 0' }}>{error}</p>}
          <CancelLink onClick={openPortal} loading={loading} />
        </>
      )}

      {/* ── SUBSCRIBER FREE ── */}
      {view === 'subscriber_free' && (
        <>
          <GreenCard
            label="Current plan"
            title="Free plan"
            sub={isMember ? 'Upgrade anytime at your 50% member rate.' : 'Upgrade to Pro for full access.'}
          />
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
            Upgrade to Pro
          </p>
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
            <UpgradeRow label="Monthly" price={isMember ? memberPrices.monthly.label : subPrices.monthly.label} sub={isMember ? memberPrices.monthly.sub : subPrices.monthly.sub} onClick={handleUpgrade} primary />
            <UpgradeRow label="Annual"  price={isMember ? memberPrices.annual.label  : subPrices.annual.label}  sub={isMember ? memberPrices.annual.sub  : subPrices.annual.sub}  onClick={handleUpgrade} />
          </div>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Prices are placeholders — final rates set when billing launches.
          </p>
        </>
      )}

      {/* ── INACTIVE ── */}
      {view === 'inactive' && (
        <>
          <GreenCard label="Account status" title="Access paused" sub="Reactivate below to get back in." />
          <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 8 }}>
            <UpgradeRow label="Reactivate — Monthly" price={isMember ? memberPrices.monthly.label : subPrices.monthly.label} sub={null} onClick={handleUpgrade} primary />
            <UpgradeRow label="Reactivate — Annual"  price={isMember ? memberPrices.annual.label  : subPrices.annual.label}  sub={null} onClick={handleUpgrade} />
          </div>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
            Prices are placeholders — final rates set when billing launches.
          </p>
        </>
      )}

      {error && view !== 'member_paying' && view !== 'subscriber_paying' && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#C62828', textAlign: 'center', margin: '12px 0' }}>{error}</p>
      )}
    </div>
  );
}
