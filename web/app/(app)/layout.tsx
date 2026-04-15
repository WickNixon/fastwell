'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
      <path d="M3 12L12 3l9 9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21V12h6v9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10v11h14V10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FastIcon({ active }: { active: boolean }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 15" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrackIcon({ active }: { active: boolean }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function ResultsIcon({ active }: { active: boolean }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <polyline points="4 18 8 12 12 15 16 9 20 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

const NAV = [
  { href: '/dashboard', label: 'Home', Icon: HomeIcon },
  { href: '/fasting', label: 'Fast', Icon: FastIcon },
  { href: '/track', label: 'Track', Icon: TrackIcon },
  { href: '/results', label: 'Results', Icon: ResultsIcon },
  { href: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, user, profile } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  // Hard timeout: if auth loading takes more than 5s, show the page anyway
  useEffect(() => {
    if (!loading) return;
    const t = setTimeout(() => setTimedOut(true), 5000);
    return () => clearTimeout(t);
  }, [loading]);

  useEffect(() => {
    if (loading && !timedOut) return;
    if (!user) { router.push('/login'); return; }
    if (profile && !profile.onboarding_complete) { router.push('/onboarding/name'); }
  }, [loading, timedOut, user, profile]);

  if (loading && !timedOut) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      <main style={{ flex: 1, paddingBottom: 'var(--nav-height)' }}>
        {children}
      </main>
      <nav className="bottom-nav" role="navigation" aria-label="Main navigation">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`} aria-current={active ? 'page' : undefined}>
              <Icon active={active} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
