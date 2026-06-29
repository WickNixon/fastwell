'use client';

import { useAuth } from '@/lib/auth-context';
import { BackChip, ChevronRight, SettingsGroup, SettingsRow, TierPill } from './_components';
import pkg from '@/../package.json';

export default function SettingsPage() {
  const { profile, signOut } = useAuth();
  const tier = profile?.subscription_tier;

  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--text)', margin: '16px 0 4px' }}>
        Settings
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
        Make Fastwell yours.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Group 1 — Account */}
        <SettingsGroup>
          <SettingsRow icon={<ProfileIcon />} label="Profile" href="/settings/profile" />
          <SettingsRow icon={<LockIcon />} label="Change password" href="/settings/change-password" />
          <SettingsRow
            icon={<CardIcon />}
            label="Subscription"
            href="/settings/subscription"
            right={<>{tier && tier !== 'free' && <TierPill tier={tier} />}<ChevronRight /></>}
            divider={false}
          />
        </SettingsGroup>

        {/* Group 2 — Connections */}
        <SettingsGroup>
          <SettingsRow
            icon={<LinkIcon />}
            label="Integrations"
            href="/settings/integrations"
            right={<><span style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)' }}>Apple Health, Garmin</span><ChevronRight /></>}
          />
          <SettingsRow icon={<BellIcon />} label="Notifications" href="/settings/notifications" divider={false} />
        </SettingsGroup>

        {/* Group 3 — Health data */}
        <SettingsGroup>
          <SettingsRow icon={<PillIcon />} label="Supplements & HRT" href="/settings/supplements" />
          <SettingsRow icon={<ExportIcon />} label="Export my data" href="/settings/export" divider={false} />
        </SettingsGroup>

        {/* Group 4 — Legal & account actions */}
        <SettingsGroup>
          <SettingsRow icon={<ShieldIcon />} label="Privacy policy" href="/settings/privacy" />
          <SettingsRow icon={<DocIcon />} label="Terms of service" href="/settings/terms" />
          <SettingsRow label="Sign out" destructive onClick={signOut} right={null} />
          <SettingsRow label="Delete my account" destructive href="/settings/delete-account" divider={false} />
        </SettingsGroup>

      </div>

      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 32, opacity: 0.6 }}>
        Fastwell · v{pkg.version}
      </p>
    </div>
  );
}

// ─── Inline icons ─────────────────────────────────────────────────────────────

function ProfileIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <circle cx="9" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M2.5 16c0-3.314 2.91-6 6.5-6s6.5 2.686 6.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="3" y="8" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 8V6a3 3 0 116 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
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

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M7.5 10.5a3.5 3.5 0 005 0l2-2a3.536 3.536 0 10-5-5l-1 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.5 7.5a3.5 3.5 0 00-5 0l-2 2a3.536 3.536 0 105 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 2a5 5 0 015 5v3l1 2H3l1-2V7a5 5 0 015-5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7.5 15a1.5 1.5 0 003 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function PillIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="2.5" y="6" width="13" height="6" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 6v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 2v9m0-9L6 5m3-3l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 12v3a1 1 0 001 1h10a1 1 0 001-1v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M9 2l6 2v5c0 4-3 6.5-6 7.5C6 15.5 3 13 3 9V4l6-2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <rect x="3" y="2" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 6h6M6 9h6M6 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
