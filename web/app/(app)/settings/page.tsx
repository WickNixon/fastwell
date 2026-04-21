'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const MENU = [
  { href: '/settings/profile', icon: '👤', label: 'Profile', sub: 'Name, age, stage' },
  { href: '/settings/subscription', icon: '💳', label: 'Subscription', sub: 'Plan, billing, trial' },
  { href: '/settings/change-password', icon: '🔒', label: 'Change password', sub: null },
  { href: '/settings/integrations', icon: '🔗', label: 'Integrations', sub: 'Apple Health, Garmin — coming soon' },
];

export default function SettingsPage() {
  const { profile, signOut } = useAuth();

  return (
    <div className="page page-top">
      <h1 className="h1 mb-4">Settings</h1>
      <p className="body-sm mb-24">
        {profile?.first_name ?? ''} · {profile?.subscription_tier === 'member' ? 'Wicked Wellbeing member' : profile?.subscription_tier === 'subscriber' ? 'Fastwell subscriber' : 'Free plan'}
      </p>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        {MENU.map((item, i) => (
          <Link key={item.href} href={item.href}>
            <div className="list-item" style={{ padding: '14px 16px', borderBottom: i < MENU.length - 1 ? '1px solid var(--border)' : 'none', marginBottom: 0 }}>
              <div className="list-item-icon">{item.icon}</div>
              <div className="list-item-content">
                <p className="h3" style={{ fontSize: 15 }}>{item.label}</p>
                {item.sub && <p className="body-sm">{item.sub}</p>}
              </div>
              <span className="list-item-chevron">›</span>
            </div>
          </Link>
        ))}
      </div>

      <button
        className="btn btn-outline"
        style={{ borderColor: '#C62828', color: '#C62828' }}
        onClick={signOut}
      >
        Log out
      </button>

      <p className="body-sm text-center mt-20" style={{ opacity: 0.5 }}>Fastwell · v2.2.0</p>
    </div>
  );
}
