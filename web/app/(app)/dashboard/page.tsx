'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { AiInsight, FastingSession } from '@/lib/types';

function formatElapsed(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [elapsedMin, setElapsedMin] = useState(0);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const today = new Date().toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' });

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
    if (fast) {
      setElapsedMin(Math.floor((Date.now() - new Date(fast.started_at).getTime()) / 60000));
    }

    const { data: ins } = await sb
      .from('ai_insights')
      .select('*')
      .eq('user_id', profile.id)
      .gt('expires_at', new Date().toISOString())
      .is('dismissed_at', null)
      .order('generated_at', { ascending: false })
      .limit(3);

    setInsights(ins ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!activeFast) return;
    const id = setInterval(() => {
      setElapsedMin(Math.floor((Date.now() - new Date(activeFast.started_at).getTime()) / 60000));
    }, 60000);
    return () => clearInterval(id);
  }, [activeFast]);

  const dismissInsight = async (id: string) => {
    await getSupabase().from('ai_insights').update({ dismissed_at: new Date().toISOString() }).eq('id', id);
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="page page-top">
      {/* Greeting */}
      <h1 className="h1 mb-4">
        {greeting}{profile?.first_name ? `, ${profile.first_name}` : ''}.
      </h1>
      <p className="body-sm mb-24">{today} · Wicked Wellbeing</p>

      {/* Fasting Timer Card */}
      <div
        onClick={() => router.push('/fasting/timer')}
        style={{
          borderRadius: 16,
          padding: 24,
          textAlign: 'center',
          marginBottom: 24,
          cursor: 'pointer',
          backgroundColor: activeFast ? 'var(--primary)' : 'var(--surface)',
          border: activeFast ? 'none' : '1px solid var(--border)',
          minHeight: 120,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && router.push('/fasting/timer')}
        aria-label={activeFast ? `Fasting for ${formatElapsed(elapsedMin)}` : 'Start a fast'}
      >
        {activeFast ? (
          <>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
              {activeFast.protocol ?? 'Fasting'} · In progress
            </p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 42, color: '#FFFFFF', lineHeight: 1.1 }}>
              {formatElapsed(elapsedMin)}
            </p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>Tap to view</p>
          </>
        ) : (
          <>
            <p className="h3" style={{ color: 'var(--text-muted)', marginBottom: 6 }}>Not fasting</p>
            <p style={{ color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15 }}>
              Start a fast →
            </p>
          </>
        )}
      </div>

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="section">
          <p className="section-label">Your insights</p>
          {insights.map(ins => (
            <div key={ins.id} className="card mb-8" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <p className="body" style={{ flex: 1, lineHeight: 1.55 }}>{ins.insight_text}</p>
              <button
                onClick={() => dismissInsight(ins.id)}
                style={{ color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, padding: 4, flexShrink: 0 }}
                aria-label="Dismiss insight"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Rewards shortcut */}
      <Link href="/rewards">
        <div className="card mb-24" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <span style={{ fontSize: 22 }}>🏅</span>
          <span className="body" style={{ flex: 1 }}>Your badges & milestones</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>›</span>
        </div>
      </Link>

      {/* Quick check-in */}
      <div className="section">
        <p className="section-label">Quick check-in</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          {[
            { label: 'Water', icon: '💧', href: '/track/water' },
            { label: 'Energy', icon: '⚡', href: '/track/energy' },
            { label: 'Mood', icon: '🌿', href: '/track/mood' },
            { label: 'Symptoms', icon: '📋', href: '/track/symptoms' },
          ].map(item => (
            <Link key={item.label} href={item.href}>
              <div className="card" style={{ textAlign: 'center', padding: '14px 8px', cursor: 'pointer' }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{item.icon}</div>
                <p className="label">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Paywall banner if trial ending */}
      {profile?.subscription_tier === 'subscriber' && profile?.subscription_status === 'trialing' &&
        profile?.trial_ends_at && (() => {
          const daysLeft = Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000);
          if (daysLeft <= 3) {
            return (
              <Link href="/paywall">
                <div style={{
                  background: 'var(--accent)',
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 16,
                  color: '#FFFFFF',
                  cursor: 'pointer',
                }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {daysLeft <= 0 ? 'Your trial has ended' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your trial`}
                  </p>
                  <p style={{ fontSize: 13, opacity: 0.9 }}>Keep going — choose a plan →</p>
                </div>
              </Link>
            );
          }
          return null;
        })()
      }
    </div>
  );
}
