'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession } from '@/lib/types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface HabitDef {
  key: string;
  label: string;
  icon: string;
  href: string;
  goal?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_HABITS: HabitDef[] = [
  { key: 'exercise', label: 'Exercise', icon: '🏃', href: '/track/exercise', goal: '30 mins' },
  { key: 'sleep', label: 'Sleep', icon: '😴', href: '/track/sleep', goal: '8 hours' },
  { key: 'water', label: 'Water', icon: '💧', href: '/track/water', goal: '2000ml' },
];

const HABIT_LIBRARY: HabitDef[] = [
  { key: 'walking', label: 'Walking', icon: '🚶', href: '/track/steps', goal: '10,000 steps' },
  { key: 'meditation', label: 'Meditation', icon: '🧘', href: '/track', goal: '10 mins' },
  { key: 'reading', label: 'Read a book', icon: '📚', href: '/track', goal: '20 mins' },
  { key: 'caffeine', label: 'Caffeine intake', icon: '☕', href: '/track', goal: 'Daily log' },
  { key: 'alcohol', label: 'Alcohol intake', icon: '🍷', href: '/track', goal: 'Daily log' },
  { key: 'veggies', label: 'Eat fruits & veggies', icon: '🥦', href: '/track', goal: 'Daily tick' },
  { key: 'review', label: 'Review your day', icon: '🌙', href: '/track', goal: 'Daily tick' },
  { key: 'mood', label: 'Mood check', icon: '😊', href: '/track/mood', goal: 'Daily' },
  { key: 'energy', label: 'Energy check', icon: '⚡', href: '/track/energy', goal: 'Daily' },
  { key: 'symptoms', label: 'Symptoms log', icon: '🌡', href: '/track/symptoms', goal: 'Daily' },
  { key: 'weight', label: 'Weight', icon: '⚖️', href: '/track/weight', goal: 'Daily' },
];

const MEMO_EMOJIS = ['😩', '😕', '😐', '🙂', '😄'];
const PROTOCOLS = ['16:8', '18:6', '20:4', '24h'];
const PROTOCOL_HOURS: Record<string, number> = { '16:8': 16, '18:6': 18, '20:4': 20, '24h': 24 };

function isoDate(d: Date) { return d.toISOString().split('T')[0]; }

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatElapsed(sec: number) {
  const h = String(Math.floor(sec / 3600)).padStart(2, '0');
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
  const s = String(sec % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

// ─── Calendar Strip ───────────────────────────────────────────────────────────

function CalendarStrip({ completedDates }: { completedDates: Set<string> }) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week
  const touchStartX = useRef(0);

  const today = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + weekOffset * 7 - 6 + i);
    return d;
  });

  const todayStr = isoDate(today);

  return (
    <div
      style={{ marginBottom: 24 }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx < -50) setWeekOffset(o => o - 1);
        else if (dx > 50 && weekOffset < 0) setWeekOffset(o => o + 1);
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map(d => {
          const str = isoDate(d);
          const isToday = str === todayStr;
          const hasData = completedDates.has(str);
          return (
            <div
              key={str}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '50%', margin: '0 auto',
                backgroundColor: isToday ? '#5C8A34' : hasData ? '#EAF3DC' : 'transparent',
                border: isToday ? 'none' : hasData ? 'none' : '1.5px solid #C8DFB0',
              }}
            >
              <span style={{
                fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13,
                color: isToday ? '#FFFFFF' : hasData ? '#5C8A34' : '#C8DFB0',
              }}>
                {d.getDate()}
              </span>
            </div>
          );
        })}
      </div>
      {weekOffset < 0 && (
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
          Swipe right to return to this week
        </p>
      )}
    </div>
  );
}

// ─── Fasting Card ─────────────────────────────────────────────────────────────

function FastingCard({
  activeFast, elapsed, selectedProtocol, setSelectedProtocol, onStart, onEnd, starting,
}: {
  activeFast: FastingSession | null;
  elapsed: number;
  selectedProtocol: string;
  setSelectedProtocol: (p: string) => void;
  onStart: () => void;
  onEnd: () => void;
  starting: boolean;
}) {
  const goalHours = PROTOCOL_HOURS[activeFast?.protocol ?? selectedProtocol] ?? 16;
  const progress = Math.min(elapsed / (goalHours * 3600), 1);

  if (activeFast) {
    return (
      <div style={{
        backgroundColor: 'var(--primary)', borderRadius: 16, padding: '20px 20px 24px',
        marginBottom: 16,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: 'rgba(255,255,255,0.8)' }}>
            🕐 Fasting
          </span>
          <span style={{ fontSize: 11, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: '#A8E060', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: 10 }}>
            🟢 Active
          </span>
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 38, color: '#FFFFFF', letterSpacing: 2, marginBottom: 8 }}>
          {formatElapsed(elapsed)}
        </p>
        <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 8 }}>
          <div style={{ height: 6, backgroundColor: '#FFFFFF', borderRadius: 3, width: `${progress * 100}%`, transition: 'width 1s linear' }} />
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Lato, sans-serif', marginBottom: 16 }}>
          {Math.floor(elapsed / 3600)}h {Math.floor((elapsed % 3600) / 60)}m of {goalHours}h goal
        </p>
        <button
          onClick={onEnd}
          style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#FFFFFF', padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
          }}
        >
          End fast
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16,
      padding: '20px 20px 24px', marginBottom: 16,
    }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text-muted)', marginBottom: 14 }}>
        🕐 Fasting
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {PROTOCOLS.map(p => (
          <button
            key={p}
            onClick={() => setSelectedProtocol(p)}
            style={{
              flex: 1, padding: '8px 4px', borderRadius: 8,
              border: `1.5px solid ${selectedProtocol === p ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: selectedProtocol === p ? 'var(--primary-pale)' : 'transparent',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13,
              color: selectedProtocol === p ? 'var(--primary)' : 'var(--text-muted)', cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <button
        className="btn btn-primary"
        onClick={onStart}
        disabled={starting}
        style={{ width: '100%' }}
      >
        {starting ? 'Starting…' : 'Start your fast →'}
      </button>
    </div>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({
  habit, done, progress, onTick, onCardTap,
}: {
  habit: HabitDef;
  done: boolean;
  progress: string;
  onTick: () => void;
  onCardTap: () => void;
}) {
  return (
    <div
      style={{
        backgroundColor: done ? 'var(--primary-pale)' : 'var(--surface)',
        border: `1px solid ${done ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
      }}
      onClick={onCardTap}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onCardTap()}
    >
      <span style={{ fontSize: 26, flexShrink: 0 }}>{habit.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: done ? 'var(--primary)' : 'var(--text)', marginBottom: 2 }}>
          {habit.label}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>{progress}</p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onTick(); }}
        style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          backgroundColor: done ? 'var(--primary)' : 'var(--border)',
          color: done ? '#FFFFFF' : 'var(--text-muted)',
          fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16,
          cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        aria-label={done ? `${habit.label} done` : `Complete ${habit.label}`}
      >
        ✓
      </button>
    </div>
  );
}

// ─── Bottom Sheet ─────────────────────────────────────────────────────────────

function BottomSheet({
  habit, onDone, onClose,
}: {
  habit: HabitDef;
  onDone: (emoji: number | null, memo: string) => void;
  onClose: () => void;
}) {
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [memo, setMemo] = useState('');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
          {habit.icon} {habit.label} — done!
        </p>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Lato, sans-serif', marginBottom: 20 }}>
          How did that feel?
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, padding: '0 16px' }}>
          {MEMO_EMOJIS.map((em, i) => (
            <button
              key={i}
              onClick={() => setSelectedEmoji(i + 1)}
              style={{
                fontSize: 32, background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 10,
                backgroundColor: selectedEmoji === i + 1 ? 'var(--primary-pale)' : 'transparent',
                outline: selectedEmoji === i + 1 ? '2px solid var(--primary)' : 'none',
              }}
            >
              {em}
            </button>
          ))}
        </div>
        <textarea
          className="input"
          placeholder="Add a note... (optional)"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          rows={3}
          style={{ resize: 'none', marginBottom: 16 }}
        />
        <button className="btn btn-primary" onClick={() => onDone(selectedEmoji, memo)}>
          Done
        </button>
      </div>
    </div>
  );
}

// ─── Add Habit Modal ──────────────────────────────────────────────────────────

function AddHabitModal({
  existing, onAdd, onClose,
}: {
  existing: string[];
  onAdd: (habit: HabitDef) => void;
  onClose: () => void;
}) {
  const available = HABIT_LIBRARY.filter(h => !existing.includes(h.key));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
        <div className="modal-handle" />
        <h2 className="h2 mb-4">Add a habit</h2>
        <p className="body-sm mb-20">Tap to add to your daily list.</p>
        {available.length === 0 ? (
          <p className="body-sm text-center" style={{ padding: '24px 0' }}>You've added all available habits.</p>
        ) : (
          available.map(h => (
            <button
              key={h.key}
              onClick={() => { onAdd(h); onClose(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                padding: '14px 4px', background: 'none', border: 'none',
                borderBottom: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 24 }}>{h.icon}</span>
              <div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{h.label}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>{h.goal}</p>
              </div>
            </button>
          ))
        )}
        <button className="btn btn-ghost mt-16" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile } = useAuth();
  const router = useRouter();

  // Fasting state
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [selectedProtocol, setSelectedProtocol] = useState('16:8');
  const [starting, setStarting] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Calendar state
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());

  // Habit state
  const [customHabits, setCustomHabits] = useState<HabitDef[]>([]);
  const [todayEntries, setTodayEntries] = useState<Set<string>>(new Set());
  const [bottomSheet, setBottomSheet] = useState<HabitDef | null>(null);
  const [addModal, setAddModal] = useState(false);

  // Insights
  const [insights, setInsights] = useState<{ id: string; insight_text: string }[]>([]);

  const today = isoDate(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long' });

  // Load custom habits from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fastwell_custom_habits');
      if (stored) setCustomHabits(JSON.parse(stored));
    } catch {}
  }, []);

  const allHabits = [...DEFAULT_HABITS, ...customHabits];

  const startTick = useCallback((startTime: Date) => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const tick = () => setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    tick();
    intervalRef.current = setInterval(tick, 1000);
  }, []);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const load = useCallback(async () => {
    if (!profile) return;
    const sb = getSupabase();

    try {
      // Active fast
      const { data: fast } = await sb
        .from('fasting_sessions').select('*').eq('user_id', profile.id)
        .is('ended_at', null).order('started_at', { ascending: false }).limit(1).maybeSingle();
      setActiveFast(fast ?? null);
      if (fast) startTick(new Date(fast.started_at));
    } catch {}

    try {
      // Today's health entries
      const { data: entries } = await sb
        .from('health_entries').select('metric').eq('user_id', profile.id).eq('entry_date', today);
      setTodayEntries(new Set((entries ?? []).map((e: { metric: string }) => e.metric)));
    } catch {}

    try {
      // Completion dates (last 28 days for calendar)
      const past = new Date(); past.setDate(past.getDate() - 28);
      const { data: pastEntries } = await sb
        .from('health_entries').select('entry_date').eq('user_id', profile.id)
        .gte('entry_date', isoDate(past));
      setCompletedDates(new Set((pastEntries ?? []).map((e: { entry_date: string }) => e.entry_date)));
    } catch {}

    try {
      // AI insights
      const { data: ins } = await sb
        .from('ai_insights').select('id,insight_text').eq('user_id', profile.id)
        .gt('expires_at', new Date().toISOString()).is('dismissed_at', null)
        .order('generated_at', { ascending: false }).limit(2);
      setInsights(ins ?? []);
    } catch {}
  }, [profile, today, startTick]);

  useEffect(() => { load(); }, [load]);

  const startFast = async () => {
    if (!profile || starting) return;
    setStarting(true);
    const { data } = await getSupabase()
      .from('fasting_sessions')
      .insert({ user_id: profile.id, protocol: selectedProtocol, started_at: new Date().toISOString() })
      .select().single();
    if (data) {
      setActiveFast(data as FastingSession);
      startTick(new Date(data.started_at));
    }
    setStarting(false);
  };

  const endFast = async () => {
    if (!activeFast) return;
    setConfirmEnd(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    await getSupabase().from('fasting_sessions')
      .update({ ended_at: new Date().toISOString(), duration_minutes: Math.floor(elapsed / 60) })
      .eq('id', activeFast.id);
    setActiveFast(null);
    setElapsed(0);
    router.push('/fasting/timer');
  };

  const handleTick = (habit: HabitDef) => {
    if (todayEntries.has(habit.key)) return; // already done
    setBottomSheet(habit);
  };

  const handleBottomSheetDone = async (emoji: number | null, memo: string) => {
    if (!bottomSheet || !profile) return;
    setBottomSheet(null);
    // Save a health entry to mark it done today
    await getSupabase().from('health_entries').upsert({
      user_id: profile.id,
      entry_date: today,
      metric: bottomSheet.key,
      value: emoji ?? 1,
      value_text: memo || null,
      unit: 'check',
      source: 'manual',
    }, { onConflict: 'user_id,entry_date,metric,source' });
    setTodayEntries(prev => new Set([...prev, bottomSheet.key]));
    setCompletedDates(prev => new Set([...prev, today]));
  };

  const addHabit = (habit: HabitDef) => {
    const updated = [...customHabits, habit];
    setCustomHabits(updated);
    try { localStorage.setItem('fastwell_custom_habits', JSON.stringify(updated)); } catch {}
  };

  const dismissInsight = async (id: string) => {
    await getSupabase().from('ai_insights').update({ dismissed_at: new Date().toISOString() }).eq('id', id);
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="page page-top">
      {/* Greeting */}
      <h1 className="h1 mb-2">{greeting}{profile?.first_name ? `, ${profile.first_name}` : ''}.</h1>
      <p className="body-sm mb-20" style={{ color: 'var(--text-muted)' }}>{dateLabel}</p>

      {/* 7-day Calendar Strip */}
      <CalendarStrip completedDates={completedDates} />

      {/* Fasting Card */}
      <FastingCard
        activeFast={activeFast}
        elapsed={elapsed}
        selectedProtocol={selectedProtocol}
        setSelectedProtocol={setSelectedProtocol}
        onStart={startFast}
        onEnd={() => setConfirmEnd(true)}
        starting={starting}
      />

      {/* End fast confirm */}
      {confirmEnd && (
        <div className="confirm-dialog">
          <div className="confirm-box">
            <p className="h3 mb-8">End your fast?</p>
            <p className="body-sm mb-16">This will close your current fasting window.</p>
            <div className="confirm-actions">
              <button className="btn btn-outline btn-sm flex-1" onClick={() => setConfirmEnd(false)}>Keep fasting</button>
              <button className="btn btn-primary btn-sm flex-1" onClick={endFast}>End fast</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="section mb-0">
          <p className="section-label mb-10">Your insights</p>
          {insights.map(ins => (
            <div key={ins.id} className="card mb-8" style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <p className="body" style={{ flex: 1, lineHeight: 1.55, fontSize: 14 }}>{ins.insight_text}</p>
              <button onClick={() => dismissInsight(ins.id)} style={{ color: 'var(--text-muted)', fontSize: 20, padding: 4, flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer' }} aria-label="Dismiss">×</button>
            </div>
          ))}
        </div>
      )}

      {/* Habit Cards */}
      <div className="section">
        <p className="section-label mb-10">Today's habits</p>
        {allHabits.map(habit => (
          <HabitCard
            key={habit.key}
            habit={habit}
            done={todayEntries.has(habit.key)}
            progress={habit.goal ?? ''}
            onTick={() => handleTick(habit)}
            onCardTap={() => router.push(habit.href)}
          />
        ))}

        <button
          onClick={() => setAddModal(true)}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
            border: '1.5px dashed var(--border)', background: 'none',
            fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
            color: 'var(--text-muted)', marginTop: 4,
          }}
        >
          + Add a habit
        </button>
      </div>

      {/* Trial warning */}
      {profile?.subscription_tier === 'subscriber' && profile?.trial_ends_at && (() => {
        const daysLeft = Math.ceil((new Date(profile.trial_ends_at).getTime() - Date.now()) / 86400000);
        if (daysLeft > 3) return null;
        return (
          <Link href="/paywall">
            <div style={{ background: 'var(--accent)', borderRadius: 12, padding: 16, marginTop: 16, color: '#FFFFFF', cursor: 'pointer' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                {daysLeft <= 0 ? 'Your trial has ended' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your trial`}
              </p>
              <p style={{ fontSize: 13, opacity: 0.9 }}>Keep going — choose a plan →</p>
            </div>
          </Link>
        );
      })()}

      {/* Bottom sheet */}
      {bottomSheet && (
        <BottomSheet habit={bottomSheet} onDone={handleBottomSheetDone} onClose={() => setBottomSheet(null)} />
      )}

      {/* Add habit modal */}
      {addModal && (
        <AddHabitModal
          existing={allHabits.map(h => h.key)}
          onAdd={addHabit}
          onClose={() => setAddModal(false)}
        />
      )}
    </div>
  );
}
