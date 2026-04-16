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

function MacrosIcon({ active }: { active: boolean }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M3 11c0-1.1.9-2 2-2h14a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2z" strokeLinejoin="round" />
      <path d="M12 9V5m0 14v-5" strokeLinecap="round" />
      <path d="M8 9V7m8 2V7" strokeLinecap="round" />
    </svg>
  );
}

function EducationIcon({ active }: { active: boolean }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}>
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" strokeLinejoin="round" />
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

function MeIcon({ active }: { active: boolean }) {
  return (
    <svg className="nav-icon" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 1.8}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV = [
  { href: '/dashboard', label: 'Home', Icon: HomeIcon },
  { href: '/macros', label: 'Macros', Icon: MacrosIcon },
  { href: '/education', label: 'Learn', Icon: EducationIcon },
  { href: '/track', label: 'Track', Icon: TrackIcon },
  { href: '/results', label: 'Me', Icon: MeIcon },
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
