'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession } from '@/lib/types';

function calcLongestStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export default function MePage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [totalFasts, setTotalFasts] = useState<number | null>(null);
  const [badgeCount, setBadgeCount] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  // Results data (period filtered)
  const [period, setPeriod] = useState<'7d' | '30d' | '3m' | '6m' | '12m'>('30d');
  const [fasts, setFasts] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [avgSleep, setAvgSleep] = useState<string | null>(null);
  const [avgEnergy, setAvgEnergy] = useState<string | null>(null);
  const [avgWater, setAvgWater] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const DAYS: Record<string, number> = { '7d': 7, '30d': 30, '3m': 90, '6m': 180, '12m': 365 };

  const loadStats = useCallback(async () => {
    if (!profile) return;
    const sb = getSupabase();
    try {
      const [{ count: fastsCount }, { count: badges }, { data: entryDates }] = await Promise.all([
        sb.from('fasting_sessions').select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id).not('ended_at', 'is', null),
        sb.from('user_badges').select('id', { count: 'exact', head: true })
          .eq('user_id', profile.id),
        sb.from('health_entries').select('entry_date').eq('user_id', profile.id),
      ]);
      setTotalFasts(fastsCount ?? 0);
      setBadgeCount(badges ?? 0);
      setStreak(calcLongestStreak((entryDates ?? []).map((e: { entry_date: string }) => e.entry_date)));
    } catch {}
  }, [profile]);

  const loadPeriod = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLoading(false), 5000);
    try {
      const since = new Date(Date.now() - DAYS[period] * 86400000).toISOString();
      const sb = getSupabase();
      const [{ data: f }, { data: entries }] = await Promise.all([
        sb.from('fasting_sessions').select('*').eq('user_id', profile.id)
          .gte('started_at', since).not('ended_at', 'is', null),
        sb.from('health_entries').select('metric,value').eq('user_id', profile.id)
          .gte('entry_date', since.split('T')[0]),
      ]);
      setFasts(f ?? []);
      const avg = (metric: string) => {
        const vals = (entries ?? []).filter(e => e.metric === metric).map(e => e.value).filter(v => v != null) as number[];
        return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
      };
      setAvgSleep(avg('sleep_hours'));
      setAvgEnergy(avg('energy_level'));
      setAvgWater(avg('water_ml'));
    } catch {} finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  }, [profile, period]);

  useEffect(() => {
    if (authLoading) return;
    loadStats();
    loadPeriod();
  }, [authLoading, loadStats, loadPeriod]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const initials = profile?.first_name
    ? profile.first_name.slice(0, 2).toUpperCase()
    : '??';

  const tierLabel = profile?.subscription_tier === 'member' ? 'Member' : 'Subscriber';
  const tierColor = profile?.subscription_tier === 'member' ? '#5C8A34' : '#D06820';

  const fastCount = fasts.length;
  const avgFastHours = fastCount
    ? Math.floor(fasts.reduce((s, f) => s + (f.duration_minutes ?? 0), 0) / fastCount / 60)
    : null;

  return (
    <div className="page page-top">
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
        <button
          onClick={() => router.push('/settings')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)' }}
          aria-label="Settings"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Profile header */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', backgroundColor: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: '#FFFFFF' }}>
            {initials}
          </span>
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>
          {profile?.first_name ?? 'Welcome'}
        </p>
        <span style={{
          fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12,
          color: tierColor, backgroundColor: tierColor + '20',
          padding: '3px 10px', borderRadius: 20, border: `1px solid ${tierColor}40`,
        }}>
          {tierLabel}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 28 }}>
        {[
          { label: 'total fasts', value: totalFasts },
          { label: 'badges', value: badgeCount },
          { label: 'day streak', value: streak },
        ].map(({ label, value }) => (
          <div key={label} style={{
            backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 8px', textAlign: 'center',
          }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--primary)', lineHeight: 1 }}>
              {value ?? '—'}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Period filter */}
      <div className="filter-tabs mb-20">
        {(['7d', '30d', '3m', '6m', '12m'] as const).map(p => (
          <button key={p} className={`filter-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : (
        <>
          <div className="section">
            <p className="section-label mb-12">Fasting</p>
            <div className="stat-row">
              <div className="stat-card">
                <p className="stat-value">{fastCount}</p>
                <p className="stat-unit">fasts</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{avgFastHours != null ? `${avgFastHours}h` : '—'}</p>
                <p className="stat-unit">avg duration</p>
              </div>
            </div>
          </div>

          <div className="section">
            <p className="section-label mb-12">Wellbeing</p>
            <div className="stat-row">
              <div className="stat-card">
                <p className="stat-value">{avgSleep ?? '—'}</p>
                <p className="stat-unit">avg sleep</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{avgEnergy ?? '—'}</p>
                <p className="stat-unit">avg energy</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{avgWater ? `${Math.round(parseFloat(avgWater) / 100) * 100}` : '—'}</p>
                <p className="stat-unit">avg water</p>
              </div>
            </div>
          </div>

          {fastCount === 0 && !avgSleep && !avgEnergy && (
            <div className="empty-state mt-20">
              <div className="empty-state-icon">🌱</div>
              <p className="h3">Nothing here yet</p>
              <p className="body-sm">As you start logging, your progress will show up here — ready to share with your GP or just to see how far you've come.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
