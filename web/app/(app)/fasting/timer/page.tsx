'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession } from '@/lib/types';

const PROTOCOLS = [
  { key: '16:8', label: '16:8', hours: 16 },
  { key: '18:6', label: '18:6', hours: 18 },
  { key: '20:4', label: '20:4', hours: 20 },
  { key: '24h', label: '24h', hours: 24 },
];

export default function FastingTimerPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [selectedProtocol, setSelectedProtocol] = useState('16:8');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [complete, setComplete] = useState(false);
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
    if (!profile) return;
    (async () => {
      const { data } = await getSupabase()
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', profile.id)
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setActiveFast(data ?? null);
      if (data) startTick(new Date(data.started_at));
      setLoading(false);
    })();
  }, [profile, startTick]);

  const startFast = async () => {
    if (!profile?.id || starting) return;
    setStarting(true);
    setError('');
    const { data, error: err } = await getSupabase()
      .from('fasting_sessions')
      .insert({ user_id: profile.id, protocol: selectedProtocol, started_at: new Date().toISOString() })
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
    }
    setStarting(false);
  };

  const breakFast = async () => {
    if (!activeFast) return;
    setConfirm(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const { error: err } = await getSupabase()
      .from('fasting_sessions')
      .update({ ended_at: new Date().toISOString(), duration_minutes: Math.floor(elapsed / 60) })
      .eq('id', activeFast.id);
    if (err) {
      setError(err.message);
      return;
    }
    setActiveFast(null);
    setElapsed(0);
    setComplete(true);
    setTimeout(() => router.push('/dashboard'), 2000);
  };

  const formatTime = (s: number) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const goalHours = PROTOCOLS.find(p => p.key === (activeFast?.protocol ?? selectedProtocol))?.hours ?? 16;
  const goalSeconds = goalHours * 3600;
  const progress = Math.min(elapsed / goalSeconds, 1);
  const remaining = Math.max(goalSeconds - elapsed, 0);

  if (loading) {
    return <div className="loading-screen" style={{ background: 'var(--primary)' }}><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /></div>;
  }

  // Completion screen
  if (complete) {
    return (
      <div className="timer-screen" style={{ justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🌿</div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, color: '#FFFFFF', marginBottom: 12 }}>
          Fast complete.
        </p>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 18, color: 'rgba(255,255,255,0.85)' }}>
          Well done{profile?.first_name ? `, ${profile.first_name}` : ''}.
        </p>
      </div>
    );
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
          {formatTime(elapsed)}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
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
            <p className="body-sm">{p.hours}h fast</p>
          </button>
        ))}
      </div>

      <button className="btn btn-primary" onClick={startFast} disabled={starting}>
        {starting ? 'Starting…' : 'Start fast'}
      </button>
    </div>
  );
}
