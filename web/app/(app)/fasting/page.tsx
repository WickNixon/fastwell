'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession } from '@/lib/types';

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function FastingHubPage() {
  const { profile } = useAuth();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [recent, setRecent] = useState<FastingSession[]>([]);
  const [elapsed, setElapsed] = useState(0);

  const load = useCallback(async () => {
    if (!profile) return;
    const sb = getSupabase();

    const { data: fast } = await sb
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .is('ended_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setActiveFast(fast ?? null);
    if (fast) setElapsed(Math.floor((Date.now() - new Date(fast.started_at).getTime()) / 60000));

    const { data: sessions } = await sb
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false })
      .limit(5);

    setRecent(sessions ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeFast) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeFast.started_at).getTime()) / 60000));
    }, 60000);
    return () => clearInterval(id);
  }, [activeFast]);

  return (
    <div className="page page-top">
      <h1 className="h1 mb-24">Fasting</h1>

      {/* Active fast card */}
      <Link href="/fasting/timer">
        <div style={{
          borderRadius: 16,
          padding: 24,
          textAlign: 'center',
          marginBottom: 24,
          cursor: 'pointer',
          backgroundColor: activeFast ? 'var(--primary)' : 'var(--surface)',
          border: activeFast ? 'none' : '1px solid var(--border)',
          minHeight: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
        }}>
          {activeFast ? (
            <>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                {activeFast.protocol ?? 'Fasting'} · In progress
              </p>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 38, color: '#FFFFFF', lineHeight: 1 }}>
                {Math.floor(elapsed / 60)}h {elapsed % 60}m
              </p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Tap to manage →</p>
            </>
          ) : (
            <>
              <p className="h3" style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Not fasting</p>
              <p style={{ color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Start a fast →</p>
            </>
          )}
        </div>
      </Link>

      {/* Recent sessions */}
      {recent.length > 0 && (
        <div className="section">
          <div className="flex justify-between items-center mb-12">
            <p className="section-label">Recent fasts</p>
            <Link href="/fasting/history" style={{ fontSize: 13, color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
              View all →
            </Link>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {recent.map((s, i) => (
              <div key={s.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <p className="h3" style={{ fontSize: 14 }}>
                    {new Date(s.started_at).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="body-sm">{s.protocol ?? 'Fast'}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="h3" style={{ color: 'var(--primary)' }}>
                    {s.duration_minutes ? formatDuration(s.duration_minutes) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
