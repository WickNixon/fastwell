'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { useState } from 'react';

export default function SettingsSubscriptionPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const tier = profile?.subscription_tier ?? 'inactive';
  const status = profile?.subscription_status ?? '';
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const daysLeft = trialEnds ? Math.ceil((trialEnds.getTime() - Date.now()) / 86400000) : null;

  const openPortal = async () => {
    if (!profile?.stripe_subscription_id) return;
    setLoading(true);
    const { data: { session } } = await getSupabase().auth.getSession();
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-24">Subscription</h1>

      <div className="card-lg mb-24">
        <div className="flex justify-between items-center mb-12">
          <p className="h3">Current plan</p>
          <span className={`badge ${tier === 'member' ? 'badge-green' : tier === 'subscriber' ? 'badge-orange' : 'badge-muted'}`}>
            {tier === 'member' ? 'Member' : tier === 'subscriber' ? 'Subscriber' : 'Inactive'}
          </span>
        </div>

        {status === 'trialing' && daysLeft !== null && (
          <div style={{ marginBottom: 12 }}>
            <p className="body" style={{ color: daysLeft <= 3 ? 'var(--accent)' : 'var(--text)' }}>
              {daysLeft > 0
                ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial`
                : 'Your free trial has ended'}
            </p>
            {tier === 'member' && <p className="body-sm mt-4">After your trial: $9.50 NZD/month or $79.76 NZD/year</p>}
            {tier === 'subscriber' && <p className="body-sm mt-4">After your trial: $18.99 NZD/month or $159.52 NZD/year</p>}
          </div>
        )}

        {status === 'active' && (
          <p className="body" style={{ color: 'var(--primary)' }}>Active subscription</p>
        )}

        {tier === 'member' && (
          <div style={{ background: 'var(--primary-pale)', borderRadius: 10, padding: '12px 14px', marginTop: 12 }}>
            <p className="body-sm" style={{ color: 'var(--text)' }}>
              As a Wicked Wellbeing member, you get 50% off Fastwell forever.
            </p>
          </div>
        )}
      </div>

      {profile?.stripe_subscription_id && (
        <button className="btn btn-outline" onClick={openPortal} disabled={loading}>
          {loading ? 'Opening portal…' : 'Manage billing & payment'}
        </button>
      )}

      {!profile?.stripe_subscription_id && status !== 'active' && (
        <button className="btn btn-primary" onClick={() => router.push('/paywall')}>
          Choose a plan
        </button>
      )}
    </div>
  );
}
