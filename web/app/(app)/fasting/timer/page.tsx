'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession, UserBadge } from '@/lib/types';
import { checkAndAwardBadges } from '@/lib/checkBadges';

const PROTOCOLS = [
  { key: '17h', label: '17h', hours: 17 },
  { key: '24h', label: '24h', hours: 24 },
  { key: 'Custom', label: 'Custom', hours: 0 },
];

const FAST_KEY = 'fastwell_active_fast';

const MOOD_OPTIONS = [
  { key: 'exhausted', label: 'EXHAUSTED' },
  { key: 'low', label: 'LOW' },
  { key: 'okay', label: 'OKAY' },
  { key: 'good', label: 'GOOD' },
  { key: 'energised', label: 'ENERGISED' },
];

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

function BiomarkerLogSheet({
  type, userId, onClose,
}: {
  type: 'blood_glucose' | 'ketones_blood';
  userId: string;
  onClose: () => void;
}) {
  const label = type === 'blood_glucose' ? 'Blood glucose' : 'Ketones';
  const unit = 'mmol/L';
  const placeholder = type === 'blood_glucose' ? 'e.g. 5.2' : 'e.g. 0.8';
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return;
    setSaving(true);
    await getSupabase().from('biomarkers').insert({
      user_id: userId,
      marker: type,
      value: num,
      unit,
      recorded_at: new Date().toISOString(),
    });
    setSaved(true);
    setTimeout(onClose, 800);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 }} onClick={onClose}>
      <div style={{ backgroundColor: 'var(--surface)', borderRadius: '24px 24px 0 0', padding: '24px 20px 40px', width: '100%', maxWidth: 480 }} onClick={e => e.stopPropagation()}>
        <div style={{ width: 40, height: 4, backgroundColor: 'var(--border)', borderRadius: 2, margin: '0 auto 20px' }} />
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 6, color: 'var(--text)', textAlign: 'center' }}>
          {type === 'blood_glucose' ? '🩸' : '🔥'} Log {label}
        </p>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', marginBottom: 20, textAlign: 'center' }}>
          {type === 'blood_glucose' ? 'Enter your current blood glucose reading.' : 'Enter your current ketone reading.'}
        </p>
        {saved ? (
          <p style={{ textAlign: 'center', color: '#1E8A4F', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, padding: '16px 0' }}>✓ Saved</p>
        ) : (
          <>
            <div className="input-group">
              <label className="input-label">{label} ({unit})</label>
              <input className="input" type="number" step="0.1" min="0" value={value}
                onChange={e => setValue(e.target.value)} placeholder={placeholder} autoFocus />
            </div>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving || !value}>
              {saving ? 'Saving…' : 'Save reading'}
            </button>
            <button className="btn btn-ghost mt-12" onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  );
}

export default function FastingTimerPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [selectedProtocol, setSelectedProtocol] = useState('17h');
  const [customHours, setCustomHours] = useState(17);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [gratification, setGratification] = useState<{ badge: UserBadge | null } | null>(null);
  const [error, setError] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showGlucoseSheet, setShowGlucoseSheet] = useState(false);
  const [showKetonesSheet, setShowKetonesSheet] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTick = useCallback((startTime: Date) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const tick = () => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  useEffect(() => {
    if (!profile) { setLoading(false); return; }
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      try {
        const stored = localStorage.getItem(FAST_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as StoredFast;
          if (!cancelled) {
            setActiveFast({ id: parsed.sessionId, user_id: profile.id, started_at: parsed.startedAt, protocol: parsed.protocol, ended_at: null, duration_minutes: null, notes: null, completion_celebrated: null, created_at: parsed.startedAt });
            startTick(new Date(parsed.startedAt));
          }
        }
      } catch {}
      if (!cancelled) setLoading(false);
    }, 5000);

    (async () => {
      try {
        const { data } = await getSupabase()
          .from('fasting_sessions').select('*').eq('user_id', profile.id)
          .is('ended_at', null).order('started_at', { ascending: false }).limit(1).maybeSingle();
        clearTimeout(timer);
        if (cancelled) return;
        if (data) {
          try {
            localStorage.setItem(FAST_KEY, JSON.stringify({ sessionId: data.id, startedAt: data.started_at, protocol: data.protocol, goalHours: getGoalHours(data.protocol ?? '17h', 17) } satisfies StoredFast));
          } catch {}
          setActiveFast(data);
          startTick(new Date(data.started_at));
        } else {
          try {
            const stored = localStorage.getItem(FAST_KEY);
            if (stored) {
              const parsed = JSON.parse(stored) as StoredFast;
              setActiveFast({ id: parsed.sessionId, user_id: profile.id, started_at: parsed.startedAt, protocol: parsed.protocol, ended_at: null, duration_minutes: null, notes: null, completion_celebrated: null, created_at: parsed.startedAt });
              startTick(new Date(parsed.startedAt));
            }
          } catch {}
        }
      } catch {
        clearTimeout(timer);
        if (cancelled) return;
        try {
          const stored = localStorage.getItem(FAST_KEY);
          if (stored) {
            const parsed = JSON.parse(stored) as StoredFast;
            setActiveFast({ id: parsed.sessionId, user_id: profile.id, started_at: parsed.startedAt, protocol: parsed.protocol, ended_at: null, duration_minutes: null, notes: null, completion_celebrated: null, created_at: parsed.startedAt });
            startTick(new Date(parsed.startedAt));
          }
        } catch {}
      }
      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; clearTimeout(timer); };
  }, [profile, startTick]);

  const startFast = async () => {
    if (!user || starting) return;
    setStarting(true);
    setError('');
    const protocolToStore = selectedProtocol === 'Custom' ? `${customHours}h` : selectedProtocol;
    const { data, error: err } = await supabase
      .from('fasting_sessions')
      .insert({ user_id: user.id, protocol: protocolToStore, started_at: new Date().toISOString() })
      .select().single();
    if (err) { setError(err.message); setStarting(false); return; }
    if (data) {
      setActiveFast(data as FastingSession);
      startTick(new Date(data.started_at));
      try {
        localStorage.setItem(FAST_KEY, JSON.stringify({
          sessionId: data.id, startedAt: data.started_at, protocol: data.protocol,
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
      .update({ ended_at: new Date().toISOString(), duration_minutes: Math.floor(elapsed / 60), completion_celebrated: true })
      .eq('id', sessionId);
    if (err) { setError(err.message); startTick(new Date(activeFast.started_at)); return; }
    try { localStorage.removeItem(FAST_KEY); } catch {}
    setActiveFast(null);
    setElapsed(0);
    try {
      const key = `fastwell_fast_popup_${sessionId}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch {}
    try {
      if (profile) {
        await checkAndAwardBadges(profile.id);
        const { data: badge } = await getSupabase()
          .from('user_badges').select('*').eq('user_id', profile.id).eq('seen', false)
          .order('earned_at', { ascending: false }).limit(1).maybeSingle();
        setGratification({ badge: (badge as UserBadge) ?? null });
      } else {
        setGratification({ badge: null });
      }
    } catch { setGratification({ badge: null }); }
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
    return <div className="loading-screen" style={{ background: '#1E8A4F' }}><div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /></div>;
  }

  if (activeFast) {
    // SVG ring constants for 260×260 ring
    const R = 112;
    const CIRC = 2 * Math.PI * R;
    const offset = CIRC * (1 - progress);

    const startedDate = new Date(activeFast.started_at);
    const startedLabel = startedDate.toLocaleTimeString('en-NZ', { timeZone: 'Pacific/Auckland', hour: 'numeric', minute: '2-digit', hour12: true }).toUpperCase();

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#1E8A4F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0 24px 40px',
        maxWidth: 480,
        margin: '0 auto',
        position: 'relative',
      }}>
        {/* Top bar */}
        <div style={{ width: '100%', display: 'flex', alignItems: 'center', paddingTop: 20, marginBottom: 24 }}>
          <button
            onClick={() => router.back()}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontSize: 20, flexShrink: 0 }}
            aria-label="Back"
          >
            ‹
          </button>
          <p style={{ flex: 1, textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            {(activeFast.protocol ?? '17h').toUpperCase()}-HOUR FAST
          </p>
          <div style={{ width: 36 }} />
        </div>

        {/* Progress ring */}
        <div style={{ position: 'relative', width: 260, height: 260, marginBottom: 32 }}>
          <svg width="260" height="260" viewBox="0 0 260 260" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="130" cy="130" r={R} fill="none" stroke="rgba(255,255,255,0.22)" strokeWidth="12" />
            <circle
              cx="130" cy="130" r={R} fill="none"
              stroke="#E2682A" strokeWidth="12"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 40, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1 }}>
              {formatTime(remaining)}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>remaining</p>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: 12 }}>
              STARTED {startedLabel}
            </p>
          </div>
        </div>

        {/* How are you feeling? */}
        <div style={{ width: '100%', marginBottom: 20 }}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginBottom: 12 }}>
            How are you feeling?
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
            {MOOD_OPTIONS.map(mood => {
              const isSelected = selectedMood === mood.key;
              return (
                <div key={mood.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                  <button
                    onClick={() => setSelectedMood(isSelected ? null : mood.key)}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.12)',
                      border: `1px solid ${isSelected ? '#FFFFFF' : 'rgba(255,255,255,0.3)'}`,
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11,
                      color: isSelected ? '#1E8A4F' : 'transparent',
                    }}
                  >
                    {isSelected ? '✓' : ''}
                  </button>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 9, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', maxWidth: 48 }}>
                    {mood.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Log buttons row */}
        <div style={{ display: 'flex', gap: 12, width: '100%', marginBottom: 32 }}>
          <button
            onClick={() => setShowGlucoseSheet(true)}
            style={{
              flex: 1, height: 40, borderRadius: 12, paddingLeft: 16, paddingRight: 16,
              backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#FFFFFF',
            }}
          >
            🩸 Log glucose
          </button>
          <button
            onClick={() => setShowKetonesSheet(true)}
            style={{
              flex: 1, height: 40, borderRadius: 12, paddingLeft: 16, paddingRight: 16,
              backgroundColor: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: '#FFFFFF',
            }}
          >
            🔥 Log ketones
          </button>
        </div>

        {error && (
          <p style={{ color: '#FFCDD2', fontFamily: 'Lato, sans-serif', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>{error}</p>
        )}

        {/* End my fast button */}
        <button
          onClick={() => setConfirm(true)}
          style={{
            height: 48, borderRadius: 24,
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: '1px solid rgba(255,255,255,0.35)',
            color: '#FFFFFF',
            fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15,
            cursor: 'pointer',
            width: '100%',
            marginTop: 'auto',
          }}
        >
          End my fast
        </button>

        {/* Confirm end dialog */}
        {confirm && (
          <div className="confirm-dialog">
            <div className="confirm-box">
              <p className="h3 mb-8">End your fast?</p>
              <p className="body-sm mb-16">You can always start a new one when you&apos;re ready.</p>
              <div className="confirm-actions">
                <button className="btn btn-outline btn-sm flex-1" onClick={() => setConfirm(false)}>Keep going.</button>
                <button className="btn btn-primary btn-sm flex-1" onClick={breakFast}>Yes, end my fast.</button>
              </div>
            </div>
          </div>
        )}

        {/* Gratification sheet */}
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 16, backgroundColor: '#FFF3E8', borderRadius: 12, border: '1px solid #E2682A', marginBottom: 20 }}>
                  <span style={{ fontSize: 36, marginBottom: 8 }}>🏅</span>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: '#E2682A', textAlign: 'center' }}>
                    Badge earned: {gratification.badge.badge_name}
                  </p>
                </div>
              )}
              <button className="btn btn-primary" onClick={collectBadge}>
                {gratification.badge ? 'Collect badge' : 'Done'}
              </button>
              <button
                onClick={() => { collectBadge(); router.push('/rewards'); }}
                style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontFamily: 'Lato, sans-serif', fontSize: 14, textDecoration: 'underline', width: '100%', textAlign: 'center', padding: 8 }}
              >
                View all milestones
              </button>
            </div>
          </div>
        )}

        {/* Biomarker log sheets */}
        {showGlucoseSheet && user && (
          <BiomarkerLogSheet type="blood_glucose" userId={user.id} onClose={() => setShowGlucoseSheet(false)} />
        )}
        {showKetonesSheet && user && (
          <BiomarkerLogSheet type="ketones_blood" userId={user.id} onClose={() => setShowKetonesSheet(false)} />
        )}
      </div>
    );
  }

  // Idle state — start a fast
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
