'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession, UserBadge } from '@/lib/types';

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
  { key: 'meditation', label: 'Meditation', icon: '🧘', href: '/track/meditation', goal: '10 mins' },
  { key: 'reading', label: 'Read a book', icon: '📚', href: '/track/reading', goal: '20 mins' },
  { key: 'caffeine', label: 'Caffeine intake', icon: '☕', href: '/track/caffeine', goal: 'Daily log' },
  { key: 'veggies', label: 'Eat fruits & veggies', icon: '🥦', href: '/track/fruits', goal: 'Daily tick' },
  { key: 'review', label: 'Review your day', icon: '🌙', href: '/track/review', goal: 'Daily tick' },
  { key: 'mood', label: 'Mood check', icon: '😊', href: '/track/mood', goal: 'Daily' },
  { key: 'energy', label: 'Energy check', icon: '⚡', href: '/track/energy', goal: 'Daily' },
  { key: 'symptoms', label: 'Symptoms log', icon: '🌡', href: '/track/symptoms', goal: 'Daily' },
  { key: 'weight', label: 'Weight', icon: '⚖️', href: '/track/weight', goal: 'Daily' },
];

const MEMO_EMOJIS = ['😩', '😕', '😐', '🙂', '😄'];
const FAST_KEY = 'fastwell_active_fast';

// Maps tracking-page metric names → dashboard habit keys (for progress fill)
const METRIC_TO_HABIT: Record<string, string> = {
  'water_ml': 'water',
  'exercise_minutes': 'exercise',
  'sleep_hours': 'sleep',
  'steps': 'walking',
  'meditation': 'meditation',
  'reading': 'reading',
};

const HABIT_UNITS: Record<string, string> = {
  water: 'ml', exercise: 'mins', sleep: 'hours', walking: 'steps',
  meditation: 'mins', reading: 'mins',
};

function goalToNumber(goal: string | undefined, habitKey: string): number {
  const defaults: Record<string, number> = {
    water: 2000, exercise: 30, sleep: 8, walking: 10000, meditation: 10, reading: 20,
  };
  if (!goal) return defaults[habitKey] ?? 0;
  const match = goal.replace(/,/g, '').match(/[\d]+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : (defaults[habitKey] ?? 0);
}
const PROTOCOLS = ['17h', '24h', 'Custom'];
const PROTOCOL_HOURS: Record<string, number> = { '17h': 17, '24h': 24 };
function getGoalHours(protocol: string, customHrs: number): number {
  if (protocol in PROTOCOL_HOURS) return PROTOCOL_HOURS[protocol];
  const m = protocol.match(/^(\d+(?:\.\d+)?)h$/);
  return m ? parseFloat(m[1]) : customHrs;
}

function isoDate(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

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

  const DAY_ABBRS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

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
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <span style={{
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11,
                color: '#7A9A6A',
              }}>
                {DAY_ABBRS[d.getDay()]}
              </span>
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: '50%',
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
  activeFast, elapsed, selectedProtocol, setSelectedProtocol,
  customHours, setCustomHours, goalHours, onStart, onEnd, starting,
}: {
  activeFast: FastingSession | null;
  elapsed: number;
  selectedProtocol: string;
  setSelectedProtocol: (p: string) => void;
  customHours: number;
  setCustomHours: (h: number) => void;
  goalHours: number;
  onStart: () => void;
  onEnd: () => void;
  starting: boolean;
}) {
  const goalSecs = goalHours * 3600;
  const remaining = Math.max(goalSecs - elapsed, 0);
  const progress = Math.min(elapsed / goalSecs, 1);

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
          {formatElapsed(remaining)}
        </p>
        <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 8 }}>
          <div style={{ height: 6, backgroundColor: '#FFFFFF', borderRadius: 3, width: `${progress * 100}%`, transition: 'width 1s linear' }} />
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontFamily: 'Lato, sans-serif', marginBottom: 16 }}>
          {remaining > 0
            ? `${Math.floor(remaining / 3600)}h ${Math.floor((remaining % 3600) / 60)}m remaining`
            : 'Window complete — well done.'}
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
      <div style={{ display: 'flex', gap: 8, marginBottom: selectedProtocol === 'Custom' ? 12 : 16 }}>
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
      {selectedProtocol === 'Custom' && (
        <div className="input-group" style={{ marginBottom: 16 }}>
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
  habit, done, customGoal, memoEmoji, progress, onTick, onCardTap, onEdit,
}: {
  habit: HabitDef;
  done: boolean;
  customGoal: string | undefined;
  memoEmoji?: { emoji: string | null; memo: string | null };
  progress: number; // 0–100
  onTick: () => void;
  onCardTap: () => void;
  onEdit: () => void;
}) {
  const effectiveDone = done || progress >= 100;
  return (
    <div
      style={{
        position: 'relative', overflow: 'hidden',
        border: `1px solid ${effectiveDone ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
        backgroundColor: 'var(--surface)',
      }}
      onClick={onCardTap}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onCardTap()}
    >
      {/* Progress fill layer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, height: '100%',
        width: `${progress}%`,
        backgroundColor: '#EAF3DC',
        transition: 'width 0.4s ease',
        zIndex: 0,
      }} />
      {/* Content */}
      <span style={{ fontSize: 26, flexShrink: 0, position: 'relative', zIndex: 1 }}>{habit.icon}</span>
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: effectiveDone ? 'var(--primary)' : 'var(--text)', marginBottom: 2 }}>
          {habit.label}{memoEmoji?.emoji ? <span style={{ marginLeft: 6, fontSize: 14 }}>{memoEmoji.emoji}</span> : null}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
            {memoEmoji?.memo ? memoEmoji.memo : (customGoal ?? habit.goal ?? '')}
          </p>
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--text-muted)', fontSize: 11, lineHeight: 1, flexShrink: 0 }}
            aria-label="Edit goal"
          >
            ✎
          </button>
        </div>
      </div>
      <button
        onClick={e => { e.stopPropagation(); onTick(); }}
        style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          backgroundColor: effectiveDone ? 'var(--primary)' : 'var(--border)',
          color: effectiveDone ? '#FFFFFF' : 'var(--text-muted)',
          fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16,
          cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', zIndex: 1,
        }}
        aria-label={effectiveDone ? `${habit.label} done` : `Complete ${habit.label}`}
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

// ─── Goal Edit Modal ─────────────────────────────────────────────────────────

function GoalEditModal({
  habit, currentGoal, onSave, onClose,
}: {
  habit: HabitDef;
  currentGoal: string;
  onSave: (goal: string) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(currentGoal);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
          {habit.icon} {habit.label}
        </p>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Lato, sans-serif', marginBottom: 20 }}>
          Set your daily goal
        </p>
        <div className="input-group">
          <label className="input-label">Goal</label>
          <input
            className="input"
            type="text"
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder={habit.goal ?? 'e.g. 30 mins'}
            autoFocus
          />
        </div>
        <button className="btn btn-primary" onClick={() => { onSave(value); onClose(); }} disabled={!value.trim()}>
          Save goal
        </button>
        <button className="btn btn-ghost mt-12" onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
}

// ─── Gratification Sheet ─────────────────────────────────────────────────────

function GratificationSheet({
  reason, badge, onCollect, onViewMilestones,
}: {
  reason: 'fast' | 'habits';
  badge: UserBadge | null;
  onCollect: () => void;
  onViewMilestones: () => void;
}) {
  return (
    <div className="modal-overlay">
      <div className="modal-sheet">
        <div className="modal-handle" />
        <p style={{ textAlign: 'center', fontSize: 48, marginBottom: 12 }}>
          {reason === 'fast' ? '🌿' : '⭐'}
        </p>
        <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, marginBottom: 8, color: 'var(--text)' }}>
          {reason === 'fast' ? 'Fast complete.' : 'All habits done today.'}
        </p>
        <p style={{ textAlign: 'center', fontFamily: 'Lato, sans-serif', fontSize: 16, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.5 }}>
          {reason === 'fast'
            ? 'Your body worked hard today. Every hour counts.'
            : 'Consistency is everything. You showed up for yourself today.'}
        </p>
        {badge && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: 16, backgroundColor: '#FFF3E8', borderRadius: 12,
            border: '1px solid #D06820', marginBottom: 20,
          }}>
            <span style={{ fontSize: 36, marginBottom: 8 }}>🏅</span>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: '#D06820', textAlign: 'center' }}>
              Badge earned: {badge.badge_name}
            </p>
          </div>
        )}
        <button className="btn btn-primary" onClick={onCollect}>
          {badge ? 'Collect badge' : 'Done'}
        </button>
        <button
          onClick={onViewMilestones}
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
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();

  // Fasting state
  const [activeFast, setActiveFast] = useState<FastingSession | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [selectedProtocol, setSelectedProtocol] = useState('17h');
  const [customHours, setCustomHours] = useState(17);
  const [starting, setStarting] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gratification state
  const [gratification, setGratification] = useState<{ reason: 'fast' | 'habits'; badge: UserBadge | null } | null>(null);
  const fastCompleteTriggeredRef = useRef(false);
  const habitsCompleteTriggeredRef = useRef('');

  // Calendar state
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set());

  // Habit state
  const [customHabits, setCustomHabits] = useState<HabitDef[]>([]);
  const [customGoals, setCustomGoals] = useState<Record<string, string>>({});
  const [customHabitsDb, setCustomHabitsDb] = useState<Record<string, { goal: number; unit: string }>>({});
  const [todayEntries, setTodayEntries] = useState<Set<string>>(new Set());
  const [todayMemos, setTodayMemos] = useState<Record<string, { emoji: string | null; memo: string | null }>>({});
  const [todayValues, setTodayValues] = useState<Record<string, number>>({});
  const [bottomSheet, setBottomSheet] = useState<HabitDef | null>(null);
  const [addModal, setAddModal] = useState(false);
  const [goalEditHabit, setGoalEditHabit] = useState<HabitDef | null>(null);

  // Habit error
  const [habitError, setHabitError] = useState('');

  // Insights
  const [insights, setInsights] = useState<{ id: string; insight_text: string }[]>([]);

  const today = isoDate(new Date());
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateLabel = new Date().toLocaleDateString('en-NZ', { day: 'numeric', month: 'long' });

  const goalHours = getGoalHours(
    activeFast?.protocol ?? (selectedProtocol === 'Custom' ? `${customHours}h` : selectedProtocol),
    customHours,
  );
  const remaining = activeFast ? Math.max(goalHours * 3600 - elapsed, 0) : 0;

  const checkBadge = async (): Promise<UserBadge | null> => {
    if (!profile) return null;
    try {
      const { data } = await getSupabase()
        .from('user_badges').select('*')
        .eq('user_id', profile.id).eq('seen', false)
        .order('earned_at', { ascending: false }).limit(1).maybeSingle();
      return (data as UserBadge) ?? null;
    } catch { return null; }
  };

  // Load custom habits + goals from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('fastwell_custom_habits');
      if (stored) {
        const parsed = JSON.parse(stored) as HabitDef[];
        setCustomHabits(parsed.filter(h => h.key !== 'alcohol'));
      }
      const storedGoals = localStorage.getItem('fastwell_habit_goals');
      if (storedGoals) setCustomGoals(JSON.parse(storedGoals));
    } catch {}
  }, []);

  const allHabits = [...DEFAULT_HABITS, ...customHabits];

  // Fast completion detection
  useEffect(() => {
    if (activeFast && elapsed > 0 && remaining === 0 && !fastCompleteTriggeredRef.current) {
      fastCompleteTriggeredRef.current = true;
      checkBadge().then(badge => setGratification({ reason: 'fast', badge }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, activeFast, elapsed]);

  // All habits completion detection
  useEffect(() => {
    if (
      allHabits.length > 0 &&
      allHabits.every(h => todayEntries.has(h.key)) &&
      habitsCompleteTriggeredRef.current !== today
    ) {
      habitsCompleteTriggeredRef.current = today;
      checkBadge().then(badge => setGratification({ reason: 'habits', badge }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayEntries, allHabits, today]);

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
      if (fast) {
        setActiveFast(fast);
        startTick(new Date(fast.started_at));
        // Keep localStorage in sync as a fallback
        try {
          localStorage.setItem(FAST_KEY, JSON.stringify({
            sessionId: fast.id, startedAt: fast.started_at,
            protocol: fast.protocol, goalHours: getGoalHours(fast.protocol ?? '17h', 17),
          }));
        } catch {}
      } else {
        // No open session — try localStorage fallback
        try {
          const stored = localStorage.getItem(FAST_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            setActiveFast({ id: parsed.sessionId, user_id: profile.id, started_at: parsed.startedAt, protocol: parsed.protocol, ended_at: null, duration_minutes: null, notes: null, created_at: parsed.startedAt } as FastingSession);
            startTick(new Date(parsed.startedAt));
          }
        } catch {}
      }
    } catch {
      // Supabase failed — try localStorage
      try {
        const stored = localStorage.getItem(FAST_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setActiveFast({ id: parsed.sessionId, user_id: profile.id, started_at: parsed.startedAt, protocol: parsed.protocol, ended_at: null, duration_minutes: null, notes: null, created_at: parsed.startedAt } as FastingSession);
          startTick(new Date(parsed.startedAt));
        }
      } catch {}
    }

    try {
      // Today's health entries — metric, value, memo, emoji for cards and progress fill
      const { data: entries } = await sb
        .from('health_entries').select('metric, value, memo, emoji').eq('user_id', profile.id).eq('entry_date', today);
      setTodayEntries(new Set((entries ?? []).map((e: { metric: string }) => e.metric)));
      const memos: Record<string, { emoji: string | null; memo: string | null }> = {};
      const values: Record<string, number> = {};
      for (const e of (entries ?? [])) {
        if (e.emoji || e.memo) memos[e.metric] = { emoji: e.emoji ?? null, memo: e.memo ?? null };
        const habitKey = METRIC_TO_HABIT[e.metric];
        if (habitKey) values[habitKey] = (values[habitKey] ?? 0) + (e.value ?? 0);
      }
      setTodayMemos(memos);
      setTodayValues(values);
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
      // Custom habit goals from profiles
      const { data: profileData } = await sb.from('profiles').select('custom_habits').eq('id', profile.id).maybeSingle();
      if (profileData?.custom_habits) {
        const ch = profileData.custom_habits as Record<string, { goal: number; unit: string }>;
        setCustomHabitsDb(ch);
        const goals: Record<string, string> = {};
        for (const [key, val] of Object.entries(ch)) {
          goals[key] = `${val.goal} ${val.unit}`;
        }
        setCustomGoals(prev => ({ ...prev, ...goals }));
        try { localStorage.setItem('fastwell_habit_goals', JSON.stringify({ ...JSON.parse(localStorage.getItem('fastwell_habit_goals') ?? '{}'), ...goals })); } catch {}
      }
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
    if (!user || starting) return;
    setStarting(true);
    fastCompleteTriggeredRef.current = false;
    const protocolToStore = selectedProtocol === 'Custom' ? `${customHours}h` : selectedProtocol;
    try {
      const { data, error: err } = await supabase
        .from('fasting_sessions')
        .insert({ user_id: user.id, protocol: protocolToStore, started_at: new Date().toISOString() })
        .select().single();
      if (err) throw err;
      if (data) {
        setActiveFast(data as FastingSession);
        startTick(new Date(data.started_at));
        try {
          localStorage.setItem(FAST_KEY, JSON.stringify({
            sessionId: data.id,
            startedAt: data.started_at,
            protocol: data.protocol,
            goalHours: getGoalHours(protocolToStore, customHours),
          }));
        } catch {}
      }
    } catch {}
    setStarting(false);
  };

  const collectBadge = async () => {
    if (gratification?.badge) {
      await getSupabase().from('user_badges').update({ seen: true }).eq('id', gratification.badge.id);
    }
    setGratification(null);
  };

  const endFast = async () => {
    if (!activeFast) return;
    setConfirmEnd(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const { error: err } = await getSupabase().from('fasting_sessions')
      .update({ ended_at: new Date().toISOString(), duration_minutes: Math.floor(elapsed / 60) })
      .eq('id', activeFast.id);
    if (err) {
      // Restart tick and stay on page if update fails
      startTick(new Date(activeFast.started_at));
      return;
    }
    try { localStorage.removeItem(FAST_KEY); } catch {}
    setActiveFast(null);
    setElapsed(0);
  };

  const handleTick = async (habit: HabitDef) => {
    if (todayEntries.has(habit.key) || !user) return;
    setHabitError('');
    // Optimistic update immediately
    setTodayEntries(prev => new Set([...prev, habit.key]));
    setCompletedDates(prev => new Set([...prev, today]));
    // Save to Supabase immediately — don't wait for memo
    const { error } = await supabase.from('health_entries').upsert({
      user_id: user.id,
      entry_date: today,
      metric: habit.key,
      value: 1,
      unit: 'check',
      source: 'manual',
    }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      console.error('Habit save error:', error);
      setHabitError(error.message);
      // Revert optimistic update
      setTodayEntries(prev => { const next = new Set(prev); next.delete(habit.key); return next; });
      return;
    }
    // Open memo sheet for optional emoji/note enrichment
    setBottomSheet(habit);
  };

  const handleBottomSheetDone = async (emojiIndex: number | null, memo: string) => {
    if (!bottomSheet || !user) return;
    const habitKey = bottomSheet.key;
    setBottomSheet(null);
    const emojiChar = emojiIndex !== null ? MEMO_EMOJIS[emojiIndex - 1] : null;
    // Always update — even if no emoji/memo, clears old values
    const { error } = await supabase.from('health_entries')
      .update({ emoji: emojiChar, memo: memo || null })
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .eq('metric', habitKey)
      .eq('source', 'manual');
    if (!error && (emojiChar || memo)) {
      setTodayMemos(prev => ({ ...prev, [habitKey]: { emoji: emojiChar, memo: memo || null } }));
    }
  };

  const saveCustomGoal = async (habitKey: string, goal: string) => {
    const updated = { ...customGoals, [habitKey]: goal };
    setCustomGoals(updated);
    try { localStorage.setItem('fastwell_habit_goals', JSON.stringify(updated)); } catch {}
    if (!user) return;
    const unit = HABIT_UNITS[habitKey] || 'check';
    const goalNum = goalToNumber(goal, habitKey);
    const newDb = { ...customHabitsDb, [habitKey]: { goal: goalNum, unit } };
    setCustomHabitsDb(newDb);
    await getSupabase().from('profiles').update({ custom_habits: newDb }).eq('id', user.id);
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
      <h1 className="h1 mb-2" style={{ textAlign: 'center' }}>{greeting}{profile?.first_name ? `, ${profile.first_name}` : ''}.</h1>
      <p className="body-sm mb-20" style={{ color: 'var(--text-muted)', textAlign: 'center' }}>{dateLabel}</p>

      {/* 7-day Calendar Strip */}
      <CalendarStrip completedDates={completedDates} />

      {/* Fasting Card */}
      <FastingCard
        activeFast={activeFast}
        elapsed={elapsed}
        selectedProtocol={selectedProtocol}
        setSelectedProtocol={setSelectedProtocol}
        customHours={customHours}
        setCustomHours={setCustomHours}
        goalHours={goalHours}
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
        {habitError && (
          <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', color: '#C62828', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 13, fontFamily: 'Lato, sans-serif' }}>
            {habitError}
          </div>
        )}
        {allHabits.map(habit => {
          const done = todayEntries.has(habit.key);
          const goalStr = customGoals[habit.key] ?? habit.goal;
          const goalNum = goalToNumber(goalStr, habit.key);
          const actualValue = todayValues[habit.key] ?? 0;
          const progress = done ? 100 : (goalNum > 0 ? Math.min((actualValue / goalNum) * 100, 100) : 0);
          return (
          <HabitCard
            key={habit.key}
            habit={habit}
            done={done}
            customGoal={goalStr}
            memoEmoji={todayMemos[habit.key]}
            progress={progress}
            onTick={() => handleTick(habit)}
            onCardTap={() => router.push(habit.href)}
            onEdit={() => setGoalEditHabit(habit)}
          />
          );
        })}

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

      {/* Goal edit modal */}
      {goalEditHabit && (
        <GoalEditModal
          habit={goalEditHabit}
          currentGoal={customGoals[goalEditHabit.key] ?? goalEditHabit.goal ?? ''}
          onSave={goal => saveCustomGoal(goalEditHabit.key, goal)}
          onClose={() => setGoalEditHabit(null)}
        />
      )}

      {/* Gratification sheet */}
      {gratification && (
        <GratificationSheet
          reason={gratification.reason}
          badge={gratification.badge}
          onCollect={collectBadge}
          onViewMilestones={() => { setGratification(null); router.push('/rewards'); }}
        />
      )}
    </div>
  );
}
