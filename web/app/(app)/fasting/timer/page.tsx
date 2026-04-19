'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession, UserBadge } from '@/lib/types';

const PROTOCOLS = [
  { key: '17h', label: '17h', hours: 17 },
  { key: '24h', label: '24h', hours: 24 },
  { key: 'Custom', label: 'Custom', hours: 0 },
];

const FAST_KEY = 'fastwell_active_fast';

interface StoredFast {
  sessionId: string;
  startedAt: string;
  protocol: string;
  goalHours: number;
}

function getGoalHours(protocol: string, customHrs: number): number {
  const HOURS: Record<string, number> = { '17h': 17, '24h': 24 };
  if (protocol in HOURS) return HOURS[protocol];
  const m = protocol.match(/^(\d+(?:\.\d+)?)h$/);
  return m ? parseFloat(m[1]) : customHrs;
}

export default function FastingTimerPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [selectedProtocol, setSelectedProtocol] = useState('17h');
  const [customHours, setCustomHours] = useState(17);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [gratification, setGratification] = useState<{ badge: UserBadge | null } | null>(null);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTick = useCallback((startTime: Date) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const tick = () => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  // Resume on mount if session exists
  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      // Hard timeout — fall back to localStorage if Supabase is slow
      if (cancelled) return;
      try {
        const stored = localStorage.getItem(FAST_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StoredFast;
          if (!cancelled) {
            setActiveFast({ id: parsed.sessionId, user_id: profile.id, started_at: parsed.startedAt, protocol: parsed.protocol, ended_at: null, duration_minutes: null, notes: null, created_at: parsed.startedAt });
            startTick(new Date(parsed.startedAt));
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    }, 5000);

    (async () => {
      try {
        const { data } = await getSupabase()
          .from('fasting_sessions')
          .select('*')
          .eq('user_id', profile.id)
          .is('ended_at', null)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        clearTimeout(timer);
        if (cancelled) return;
        if (data) {
          // Sync to localStorage so we have a fresh fallback
          try {
            localStorage.setItem(FAST_KEY, JSON.stringify({
              sessionId: data.id,
              startedAt: data.started_at,
              protocol: data.protocol,
              goalHours: getGoalHours(data.protocol ?? '17h', 17),
            } satisfies StoredFast));
          } catch {}
          setActiveFast(data);
          startTick(new Date(data.started_at));
        } else {
          // No open session in Supabase — try localStorage fallback
          try {
            const stored = localStorage.getItem(FAST_KEY);
            if (stored) {
              const parsed = JSON.parse(stored) as StoredFast;
              setActiveFast({ id: parsed.sessionId, user_id: profile.id, started_at: parsed.startedAt, protocol: parsed.protocol, ended_at: null, duration_minutes: null, notes: null, created_at: parsed.startedAt });
              startTick(new Date(parsed.startedAt));
            }
          } catch {}
        }
      } catch {
        clearTimeout(timer);
        if (cancelled) return;
        // Supabase failed — use localStorage
        try {
          const stored = localStorage.getItem(FAST_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as StoredFast;
            setActiveFast({ id: parsed.sessionId, user_id: profile.id, started_at: parsed.startedAt, protocol: parsed.protocol, ended_at: null, duration_minutes: null, notes: null, created_at: parsed.startedAt });
            startTick(new Date(parsed.startedAt));
          }
        } catch {}
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [profile, startTick]);

  const startFast = async () => {
    if (!user || starting) return;
    setStarting(true);
    setError('');
    const protocolToStore = selectedProtocol === 'Custom' ? `${customHours}h` : selectedProtocol;
    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .insert({ user_id: user.id, protocol: protocolToStore, started_at: new Date().toISOString() })
      .select()
      .single();
    if (err) {
      setError(err.message);
      setStarting(false);
      return;
    }
    if (data) {
      setActiveFast(data as FastingSession);
      startTick(new Date(data.started_at));
      try {
        localStorage.setItem(FAST_KEY, JSON.stringify({
          sessionId: data.id,
          startedAt: data.started_at,
          protocol: data.protocol,
          goalHours: getGoalHours(data.protocol ?? protocolToStore, customHours),
        } satisfies StoredFast));
      } catch {}
    }
    setStarting(false);
  };

  const breakFast = async () => {
    if (!activeFast) return;
    setConfirm(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const sessionId = activeFast.id;
    const { error: err } = await getSupabase()
      .from('fasting_sessions')
      .update({ ended_at: new Date().toISOString(), duration_minutes: Math.floor(elapsed / 60) })
      .eq('id', sessionId);
    if (err) {
      setError(err.message);
      startTick(new Date(activeFast.started_at));
      return;
    }
    try { localStorage.removeItem(FAST_KEY); } catch {}
    setActiveFast(null);
    setElapsed(0);
    // Guard: only show popup once per session (prevents double-fire on slow taps)
    try {
      const key = `fastwell_fast_popup_${sessionId}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {}
    try {
      if (profile) {
        const { data: badge } = await getSupabase()
          .from('user_badges').select('*')
          .eq('user_id', profile.id).eq('seen', false)
          .order('earned_at', { ascending: false }).limit(1).maybeSingle();
        setGratification({ badge: (badge as UserBadge) ?? null });
      } else {
        setGratification({ badge: null });
      }
    } catch {
      setGratification({ badge: null });
    }
  };

  const collectBadge = async () => {
    if (gratification?.badge) {
      await getSupabase().from('user_badges').update({ seen: true }).eq('id', gratification.badge.id);
    }
    setGratification(null);
    router.push('/dashboard');
  };

  const formatTime = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const goalHours = getGoalHours(
    activeFast?.protocol ?? (selectedProtocol === 'Custom' ? `${customHours}h` : selectedProtocol),
    customHours,
  );
  const goalSeconds = goalHours * 3600;
  const progress = Math.min(elapsed / goalSeconds, 1);
  const remaining = Math.max(goalSeconds - elapsed, 0);

  if (loading) {
    return <div className="loading-screen" style={{ background: 'var(--primary)' }}><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /></div>;
  }

  if (activeFast) {
    return (
      <div className="timer-screen">
        <button
          onClick={() => router.back()}
          style={{ position: 'absolute', top: 20, left: 20, color: 'rgba(255,255,255,0.7)', fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' }}
          aria-label="Back"
        >
          ‹
        </button>

        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
          {activeFast.protocol ?? 'Fasting'} fast
        </p>

        <p className="timer-text" style={{ marginBottom: 12 }}>
          {formatTime(remaining)}
        </p>

        <p style={{ color: 'rgba(255,255,255,0.8)', fontFamily: 'Lato, sans-serif', fontSize: 16, marginBottom: 24 }}>
          {remaining > 0
            ? `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m remaining`
            : 'Window complete — well done.'}
        </p>

        <div className="progress-track" style={{ width: '100%', maxWidth: 300, marginBottom: 40 }}>
          <div className="progress-fill" style={{ width: `${progress * 100}%` }} />
        </div>

        {error && (
          <p style={{ color: '#FFCDD2', fontFamily: 'Lato, sans-serif', fontSize: 14, marginBottom: 16 }}>{error}</p>
        )}

        <button
          className="btn btn-white"
          style={{ maxWidth: 240 }}
          onClick={() => setConfirm(true)}
        >
          Break my fast
        </button>

        {confirm && (
          <div className="confirm-dialog">
            <div className="confirm-box">
              <p className="h3 mb-8">Break your fast?</p>
              <p className="body-sm mb-16">This will end your current fasting window.</p>
              <div className="confirm-actions">
                <button className="btn btn-outline btn-sm flex-1" onClick={() => setConfirm(false)}>Keep fasting</button>
                <button className="btn btn-primary btn-sm flex-1" onClick={breakFast}>Break my fast</button>
              </div>
            </div>
          </div>
        )}

        {gratification && (
          <div className="modal-overlay">
            <div className="modal-sheet">
              <div className="modal-handle" />
              <p style={{ textAlign: 'center', fontSize: 48, marginBottom: 12 }}>🌿</p>
              <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 8, color: 'var(--text)' }}>
                Fast complete.
              </p>
              <p style={{ textAlign: 'center', fontFamily: 'Lato, sans-serif', fontSize: 16, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
                Your body worked hard today{profile?.first_name ? `, ${profile.first_name}` : ''}. That matters.
              </p>
              {gratification.badge && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: 16, backgroundColor: '#FFF3E8', borderRadius: 12,
                  border: '1px solid #D06820', marginBottom: 20,
                }}>
                  <span style={{ fontSize: 36, marginBottom: 8 }}>🏅</span>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: '#D06820', textAlign: 'center' }}>
                    Badge earned: {gratification.badge.badge_name}
                  </p>
                </div>
              )}
              <button className="btn btn-primary" onClick={collectBadge}>
                {gratification.badge ? 'Collect badge' : 'Done'}
              </button>
              <button
                onClick={() => { collectBadge(); router.push('/rewards'); }}
                style={{
                  marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', fontFamily: 'Lato, sans-serif', fontSize: 14,
                  textDecoration: 'underline', width: '100%', textAlign: 'center', padding: 8,
                }}
              >
                View all milestones
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Idle state
  return (
    <div className="page page-top">
      <button
        onClick={() => router.back()}
        style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}
      >
        ← Back
      </button>
      <h1 className="h1 mb-8">Start a fast</h1>
      <p className="body-sm mb-32">Choose your fasting window.</p>

      {error && (
        <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', color: '#C62828', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 14, fontFamily: 'Lato, sans-serif' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: selectedProtocol === 'Custom' ? 16 : 32 }}>
        {PROTOCOLS.map(p => (
          <button
            key={p.key}
            onClick={() => setSelectedProtocol(p.key)}
            style={{
              padding: 16, borderRadius: 12,
              border: `2px solid ${selectedProtocol === p.key ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: selectedProtocol === p.key ? 'var(--primary-pale)' : 'var(--surface)',
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, color: selectedProtocol === p.key ? 'var(--primary)' : 'var(--text)' }}>
              {p.label}
            </p>
            <p className="body-sm">{p.key === 'Custom' ? 'Set your hours' : `${p.hours}h fast`}</p>
          </button>
        ))}
      </div>

      {selectedProtocol === 'Custom' && (
        <div className="input-group" style={{ marginBottom: 24 }}>
          <label className="input-label">Hours to fast</label>
          <input
            className="input"
            type="number"
            min={1}
            max={72}
            step={0.5}
            value={customHours}
            onChange={e => setCustomHours(Math.max(1, parseFloat(e.target.value) || 1))}
            placeholder="e.g. 19"
          />
        </div>
      )}

      <button className="btn btn-primary" onClick={startFast} disabled={starting}>
        {starting ? 'Starting…' : 'Start fast'}
      </button>
    </div>
  );
}
