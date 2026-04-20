'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession } from '@/lib/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoDate(d: Date) { return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' }); }

function calcLongestStreak(dates: string[]): number {
  if (!dates.length) return 0;
  const sorted = [...new Set(dates)].sort();
  let longest = 1; let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    if (diff === 1) { current++; longest = Math.max(longest, current); }
    else { current = 1; }
  }
  return longest;
}

// ─── Habit colour palette ─────────────────────────────────────────────────────

const HABIT_COLOURS: Record<string, string> = {
  fasting:    '#1E8A4F',
  exercise:   '#E2682A',
  sleep:      '#6B9B4A',
  water:      '#4A90D9',
  walking:    '#9B6B4A',
  meditation: '#9B4AD9',
  reading:    '#4AD9C4',
  veggies:    '#D9C44A',
  review:     '#D94A6B',
  mood:       '#C44AD9',
  energy:     '#4AD96B',
  symptoms:   '#D9874A',
  weight:     '#4A6BD9',
};
const FALLBACK_COLOURS = ['#A0A0A0', '#B05050', '#50B0A0', '#A0B050', '#5050B0'];

function habitColour(key: string, idx: number): string {
  return HABIT_COLOURS[key] ?? FALLBACK_COLOURS[idx % FALLBACK_COLOURS.length];
}

// ─── Calendar Component ───────────────────────────────────────────────────────

interface DayEntry { metric: string; value?: number | null }

function HabitCalendar({
  dayData,
  startDate,
  numDays,
  onDayTap,
  selectedDay,
}: {
  dayData: Record<string, DayEntry[]>;
  startDate: Date;
  numDays: number;
  onDayTap: (dateStr: string) => void;
  selectedDay: string | null;
}) {
  const days = Array.from({ length: numDays }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });
  const today = isoDate(new Date());
  const DAY_ABBRS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  return (
    <div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
          {week.map(d => {
            const str = isoDate(d);
            const isToday = str === today;
            const isSelected = str === selectedDay;
            const entries = dayData[str] ?? [];
            return (
              <div
                key={str}
                onClick={() => onDayTap(str)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer' }}
              >
                {wi === 0 && (
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 10, color: '#6B7066' }}>
                    {DAY_ABBRS[d.getDay()]}
                  </span>
                )}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backgroundColor: isSelected ? 'var(--primary)' : isToday ? 'var(--primary-pale)' : 'transparent',
                  border: isToday && !isSelected ? '1.5px solid var(--primary)' : isSelected ? 'none' : '1px solid var(--border)',
                }}>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12, color: isSelected ? '#fff' : isToday ? 'var(--primary)' : 'var(--text-muted)' }}>
                    {d.getDate()}
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', minHeight: 8 }}>
                  {entries.slice(0, 5).map((e, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: habitColour(e.metric, i) }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Day Summary Panel ────────────────────────────────────────────────────────

function DaySummary({ dateStr, entries }: { dateStr: string; entries: DayEntry[] }) {
  const date = new Date(dateStr);
  const label = date.toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div style={{
      backgroundColor: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '14px 16px', marginTop: 12,
    }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, marginBottom: 10, color: 'var(--text)' }}>
        {label}
      </p>
      {entries.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Nothing logged this day.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entries.map((e, i) => {
            const UNIT_MAP: Record<string, string> = { water_ml: 'ml', exercise_minutes: 'mins', sleep_hours: 'h', steps: 'steps', meditation: 'mins', reading: 'mins', sleep_quality: '/5', energy_level: '/5' };
            const unit = UNIT_MAP[e.metric] ?? '';
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, backgroundColor: habitColour(e.metric, i) }} />
                  <p style={{ fontSize: 13, fontFamily: 'Lato, sans-serif', color: 'var(--text)', textTransform: 'capitalize' }}>
                    {e.metric.replace(/_/g, ' ')}
                  </p>
                </div>
                {e.value != null && e.value !== 1 && (
                  <p style={{ fontSize: 13, fontFamily: 'Montserrat, sans-serif', fontWeight: 600, color: 'var(--primary)' }}>
                    {e.value}{unit}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Trend Charts ─────────────────────────────────────────────────────────────

interface ChartPoint { label: string; value: number }

function BarChart({ points, color = '#1E8A4F' }: { points: ChartPoint[]; color?: string }) {
  if (!points.length) return null;
  const nonZero = points.filter(p => p.value > 0);
  const max = Math.max(...points.map(p => p.value), 0.001);
  const H = 80; const W = 100;
  const gap = 1.5;
  const barW = Math.max((W / points.length) - gap, 2);
  const isYear = points.length === 12;
  const isMonth = points.length === 30;
  const labelH = isYear ? 20 : 14;

  const showThisLabel = (i: number, label: string): boolean => {
    if (isMonth) { const day = parseInt(label, 10); return day === 1 || day % 5 === 0; }
    return true;
  };
  const labelY = (i: number): number => isYear ? H + (i % 2 === 0 ? 9 : 16) : H + labelH - 1;

  if (!nonZero.length) {
    return (
      <svg viewBox={`0 0 ${W} ${H + labelH}`} style={{ width: '100%', height: H + labelH + 4 }} preserveAspectRatio="none">
        <text x={W / 2} y={(H + labelH) / 2 + 4} textAnchor="middle" fontSize={7} fill="#6B7066" fontFamily="Lato,sans-serif">
          Nothing logged yet
        </text>
      </svg>
    );
  }
  return (
    <svg viewBox={`0 0 ${W} ${H + labelH}`} style={{ width: '100%', height: H + labelH + 4 }} preserveAspectRatio="none">
      {points.map((p, i) => {
        const h = Math.max((p.value / max) * H, p.value > 0 ? 2 : 0);
        const x = i * (W / points.length) + gap / 2;
        const r = Math.min(2.5, barW / 2);
        return (
          <g key={i}>
            {h > 0 && (
              <path
                d={`M${x + r},${H - h} Q${x},${H - h} ${x},${H - h + r} L${x},${H} L${x + barW},${H} L${x + barW},${H - h + r} Q${x + barW},${H - h} ${x + barW - r},${H - h} Z`}
                fill={color}
                opacity={0.88}
              />
            )}
            {showThisLabel(i, p.label) && (
              <text x={x + barW / 2} y={labelY(i)} textAnchor="middle" fontSize={5} fill="#6B7066" fontFamily="Montserrat,sans-serif" fontWeight="600">
                {p.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ points, color = '#1E8A4F' }: { points: ChartPoint[]; color?: string }) {
  const nonZero = points.filter(p => p.value > 0);
  if (points.length < 2 || !nonZero.length) {
    return (
      <svg viewBox="0 0 100 94" style={{ width: '100%', height: 98 }} preserveAspectRatio="none">
        <text x={50} y={47} textAnchor="middle" fontSize={7} fill="#6B7066" fontFamily="Lato,sans-serif">
          Nothing logged yet
        </text>
      </svg>
    );
  }
  const max = Math.max(...points.map(p => p.value), 0.001);
  const min = Math.min(...nonZero.map(p => p.value));
  const range = max - min || 1;
  const H = 80; const W = 100;
  const isYear = points.length === 12;
  const isMonth = points.length === 30;
  const labelH = isYear ? 20 : 14;
  const toX = (i: number) => (i / (points.length - 1)) * W;
  const toY = (v: number) => 4 + ((H - 8) - ((v - min) / range) * (H - 8));
  const activePoints = points.filter(p => p.value > 0);
  const poly = activePoints.map((p, i) => `${toX(points.indexOf(p))},${toY(p.value)}`).join(' ');
  const firstX = toX(points.indexOf(activePoints[0]));
  const lastX = toX(points.indexOf(activePoints[activePoints.length - 1]));
  const fillPath = `M${firstX},${H} L${poly.replace(/^\d+\.?\d*,\d+\.?\d*/, `${firstX},${toY(activePoints[0].value)}`)} L${lastX},${H} Z`;
  const hexToRgba = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${a})`;
  };
  const showThisLabel = (i: number, label: string): boolean => {
    if (isMonth) { const day = parseInt(label, 10); return day === 1 || day % 5 === 0; }
    return true;
  };
  const labelY = (i: number): number => isYear ? H + (i % 2 === 0 ? 9 : 16) : H + labelH - 1;
  return (
    <svg viewBox={`0 0 ${W} ${H + labelH}`} style={{ width: '100%', height: H + labelH + 4 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline points={poly} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      {activePoints.map((p, i) => (
        <circle key={i} cx={toX(points.indexOf(p))} cy={toY(p.value)} r={2} fill={color} />
      ))}
      {points.map((p, i) => showThisLabel(i, p.label) && (
        <text key={i} x={toX(i)} y={labelY(i)} textAnchor="middle" fontSize={5} fill="#6B7066" fontFamily="Montserrat,sans-serif" fontWeight="600">
          {p.label}
        </text>
      ))}
    </svg>
  );
}

function ChartCard({
  title, average, unit, points, type, color,
}: {
  title: string; average: string | null; unit: string;
  points: ChartPoint[]; type: 'bar' | 'line'; color: string;
}) {
  return (
    <div style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{title}</p>
        {average ? (
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, color, lineHeight: 1 }}>
            {average}
            <span style={{ fontWeight: 400, fontSize: 11, color: 'var(--text-muted)', marginLeft: 3 }}>{unit}</span>
          </p>
        ) : (
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 12, color: 'var(--text-muted)' }}>avg —</p>
        )}
      </div>
      {type === 'bar' ? <BarChart points={points} color={color} /> : <LineChart points={points} color={color} />}
    </div>
  );
}

interface TrendData {
  fasting: ChartPoint[];
  water: ChartPoint[];
  sleep: ChartPoint[];
  energy: ChartPoint[];
  weight: ChartPoint[];
  steps: ChartPoint[];
}

function buildPoints(
  period: 'week' | 'month' | 'year',
  rawEntries: { entry_date: string; metric: string; value: number }[],
  fastSessions: { started_at: string; duration_minutes: number | null }[],
): TrendData {
  const today = new Date();
  const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DAY_ABBRS = ['SU','MO','TU','WE','TH','FR','SA'];

  const metricMap = (metric: string) => {
    const map: Record<string, number[]> = {};
    rawEntries.filter(e => e.metric === metric).forEach(e => { (map[e.entry_date] ??= []).push(e.value); });
    return map;
  };

  if (period === 'week') {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - 6 + i);
      return { str: isoDate(d), label: DAY_ABBRS[d.getDay()] };
    });
    const avgMap = (metric: string) => {
      const m = metricMap(metric);
      return days.map(({ str, label }) => {
        const vals = m[str] ?? [];
        return { label, value: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
      });
    };
    const fastMap = (() => {
      const m: Record<string, number[]> = {};
      fastSessions.forEach(f => { const d = isoDate(new Date(f.started_at)); (m[d] ??= []).push(f.duration_minutes ?? 0); });
      return days.map(({ str, label }) => { const v = m[str] ?? []; return { label, value: v.length ? v.reduce((a,b)=>a+b,0)/v.length/60 : 0 }; });
    })();
    return { fasting: fastMap, water: avgMap('water_ml'), sleep: avgMap('sleep_hours'), energy: avgMap('energy_level'), weight: avgMap('weight'), steps: avgMap('steps') };
  }

  if (period === 'month') {
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(today); d.setDate(today.getDate() - 29 + i);
      return { str: isoDate(d), label: String(d.getDate()) };
    });
    const avgMap = (metric: string) => {
      const m = metricMap(metric);
      return days.map(({ str, label }) => { const v = m[str] ?? []; return { label, value: v.length ? v.reduce((a,b)=>a+b,0)/v.length : 0 }; });
    };
    const fastMap = (() => {
      const m: Record<string, number[]> = {};
      fastSessions.forEach(f => { const d = isoDate(new Date(f.started_at)); (m[d] ??= []).push(f.duration_minutes ?? 0); });
      return days.map(({ str, label }) => { const v = m[str] ?? []; return { label, value: v.length ? v.reduce((a,b)=>a+b,0)/v.length/60 : 0 }; });
    })();
    return { fasting: fastMap, water: avgMap('water_ml'), sleep: avgMap('sleep_hours'), energy: avgMap('energy_level'), weight: avgMap('weight'), steps: avgMap('steps') };
  }

  // Year — 12 months
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - 11 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
  });
  const monthKey = (dateStr: string) => { const d = new Date(dateStr); return `${d.getFullYear()}-${d.getMonth()}`; };
  const avgMap = (metric: string) => {
    const m: Record<string, number[]> = {};
    rawEntries.filter(e => e.metric === metric).forEach(e => { const k = monthKey(e.entry_date); (m[k] ??= []).push(e.value); });
    return months.map(({ year, month, label }) => { const v = m[`${year}-${month}`] ?? []; return { label, value: v.length ? v.reduce((a,b)=>a+b,0)/v.length : 0 }; });
  };
  const fastMap = (() => {
    const m: Record<string, number[]> = {};
    fastSessions.forEach(f => { const k = monthKey(isoDate(new Date(f.started_at))); (m[k] ??= []).push(f.duration_minutes ?? 0); });
    return months.map(({ year, month, label }) => { const v = m[`${year}-${month}`] ?? []; return { label, value: v.length ? v.reduce((a,b)=>a+b,0)/v.length/60 : 0 }; });
  })();
  return { fasting: fastMap, water: avgMap('water_ml'), sleep: avgMap('sleep_hours'), energy: avgMap('energy_level'), weight: avgMap('weight'), steps: avgMap('steps') };
}

function avgLabel(points: ChartPoint[], decimals = 1): string | null {
  const nonZero = points.filter(p => p.value > 0);
  if (!nonZero.length) return null;
  return (nonZero.reduce((s, p) => s + p.value, 0) / nonZero.length).toFixed(decimals);
}

// ─── Food Log Section ─────────────────────────────────────────────────────────
// Requires food_logs table in Supabase:
// CREATE TABLE food_logs (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   user_id UUID REFERENCES profiles(id) NOT NULL,
//   logged_at TIMESTAMPTZ DEFAULT NOW(),
//   meal_name TEXT, image_url TEXT,
//   calories NUMERIC, protein_g NUMERIC, carbs_g NUMERIC,
//   fat_g NUMERIC, fibre_g NUMERIC, confidence TEXT, notes TEXT,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
// ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
// CREATE POLICY food_logs_own ON food_logs USING (auth.uid() = user_id);

interface FoodLog {
  id: string; meal_name: string | null; image_url: string | null;
  calories: number | null; protein_g: number | null; carbs_g: number | null;
  fat_g: number | null; fibre_g: number | null; confidence: string | null;
  notes: string | null; logged_at: string;
}
interface MacroResult {
  meal_name?: string; calories?: number; protein_g?: number; carbs_g?: number;
  fat_g?: number; fibre_g?: number; confidence?: string; notes?: string; error?: string;
}

function FoodLogSection({ userId }: { userId: string }) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showSheet, setShowSheet] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState('image/jpeg');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<MacroResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const today = new Date().toISOString().split('T')[0];

  const loadTodayLogs = useCallback(async () => {
    try {
      const { data } = await supabase.from('food_logs').select('*')
        .eq('user_id', userId)
        .gte('logged_at', `${today}T00:00:00Z`)
        .lte('logged_at', `${today}T23:59:59Z`)
        .order('logged_at', { ascending: false });
      setTodayLogs(data ?? []);
    } catch {}
  }, [userId, today]);

  useEffect(() => { loadTodayLogs(); }, [loadTodayLogs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowSheet(false);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, data] = dataUrl.split(',');
      const mt = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      setMediaType(mt);
      setImageBase64(data);
      setImagePreview(dataUrl);
      setResult(null);
      setAnalyzing(true);
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  useEffect(() => {
    if (!imageBase64 || !analyzing) return;
    (async () => {
      try {
        const res = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, mediaType }),
        });
        const data = await res.json();
        setResult(data);
      } catch {
        setResult({ error: 'Analysis failed — try a clearer photo' });
      }
      setAnalyzing(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBase64]);

  const saveMeal = async () => {
    if (!result || result.error) return;
    setSaving(true);
    let imageUrl: string | null = null;
    if (imageBase64) {
      try {
        const filename = `${userId}/${Date.now()}.jpg`;
        const bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        const { data: up } = await supabase.storage.from('food-images').upload(filename, bytes, { contentType: mediaType });
        if (up) imageUrl = supabase.storage.from('food-images').getPublicUrl(filename).data.publicUrl;
      } catch {}
    }
    try {
      await supabase.from('food_logs').insert({
        user_id: userId, meal_name: result.meal_name, image_url: imageUrl,
        calories: result.calories, protein_g: result.protein_g, carbs_g: result.carbs_g,
        fat_g: result.fat_g, fibre_g: result.fibre_g, confidence: result.confidence, notes: result.notes,
      });
      setResult(null); setImageBase64(null); setImagePreview(null);
      await loadTodayLogs();
    } catch {}
    setSaving(false);
  };

  const reset = () => { setResult(null); setImageBase64(null); setImagePreview(null); setAnalyzing(false); };

  const totalCalories = todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
  const totalProtein = todayLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
  const totalCarbs = todayLogs.reduce((s, l) => s + (l.carbs_g ?? 0), 0);
  const totalFat = todayLogs.reduce((s, l) => s + (l.fat_g ?? 0), 0);

  return (
    <div className="section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p className="section-label">Food today</p>
        <button
          onClick={() => setShowSheet(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13 }}
        >
          + Log a meal
        </button>
      </div>

      {/* Daily totals */}
      {todayLogs.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'cal', value: Math.round(totalCalories) },
            { label: 'protein', value: `${Math.round(totalProtein)}g` },
            { label: 'carbs', value: `${Math.round(totalCarbs)}g` },
            { label: 'fat', value: `${Math.round(totalFat)}g` },
          ].map(({ label, value }) => (
            <div key={label} style={{ backgroundColor: 'var(--primary-pale)', borderRadius: 10, padding: '10px 6px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>{value}</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Today's meals */}
      {todayLogs.map(log => (
        <div key={log.id} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
          {log.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={log.image_url} alt={log.meal_name ?? ''} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2 }}>
              {log.meal_name ?? 'Meal'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
              {[log.calories ? `${Math.round(log.calories)} cal` : null, log.protein_g ? `${Math.round(log.protein_g)}g protein` : null].filter(Boolean).join(' · ')}
            </p>
            {log.confidence === 'low' && (
              <p style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Lato, sans-serif', marginTop: 2 }}>
                Estimate — portions are hard to judge from photos
              </p>
            )}
          </div>
        </div>
      ))}

      {todayLogs.length === 0 && !imagePreview && (
        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', padding: '8px 0' }}>
          No meals logged today.
        </p>
      )}

      {/* Analysis card */}
      {imagePreview && (
        <div style={{ marginTop: 16, backgroundColor: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Meal preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 12 }} />
          {analyzing && (
            <p style={{ textAlign: 'center', fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', padding: '8px 0' }}>
              Analysing your meal…
            </p>
          )}
          {result && !result.error && (
            <>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 10, color: 'var(--text)' }}>
                {result.meal_name ?? 'Meal'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                {[
                  { label: 'Calories', value: result.calories ? `${result.calories}` : '—' },
                  { label: 'Protein', value: result.protein_g ? `${result.protein_g}g` : '—' },
                  { label: 'Carbs', value: result.carbs_g ? `${result.carbs_g}g` : '—' },
                  { label: 'Fat', value: result.fat_g ? `${result.fat_g}g` : '—' },
                  { label: 'Fibre', value: result.fibre_g ? `${result.fibre_g}g` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '8px 4px', backgroundColor: 'var(--primary-pale)', borderRadius: 8 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{value}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>{label}</p>
                  </div>
                ))}
              </div>
              {result.confidence === 'low' && (
                <p style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Lato, sans-serif', marginBottom: 12 }}>
                  This is an estimate — portions are hard to judge from photos.
                </p>
              )}
              <button className="btn btn-primary" onClick={saveMeal} disabled={saving} style={{ marginBottom: 8 }}>
                {saving ? 'Saving…' : 'Save this meal'}
              </button>
              <button className="btn btn-ghost" onClick={reset}>Try again</button>
            </>
          )}
          {result?.error && (
            <>
              <p style={{ textAlign: 'center', fontSize: 14, color: '#C62828', fontFamily: 'Lato, sans-serif', marginBottom: 12 }}>
                {result.error}
              </p>
              <button className="btn btn-ghost" onClick={reset}>Try again</button>
            </>
          )}
        </div>
      )}

      {/* Photo sheet */}
      {showSheet && (
        <div className="modal-overlay" onClick={() => setShowSheet(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              Log a meal
            </p>
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <button className="btn btn-primary" onClick={() => cameraInputRef.current?.click()} style={{ marginBottom: 10 }}>
              📷 Take a photo
            </button>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 10 }}>
              🖼 Choose from library
            </button>
            <button className="btn btn-ghost" onClick={() => setShowSheet(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Me Page ─────────────────────────────────────────────────────────────

export default function MePage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // All-time stats
  const [totalFasts, setTotalFasts] = useState<number | null>(null);
  const [badgeCount, setBadgeCount] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  // Calendar data
  const [dayData, setDayData] = useState<Record<string, DayEntry[]>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showAllCalendar, setShowAllCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Trend charts
  const [trendPeriod, setTrendPeriod] = useState<'week' | 'month' | 'year'>('week');
  const [trendData, setTrendData] = useState<TrendData | null>(null);

  // Period results
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

  const loadCalendar = useCallback(async () => {
    if (!profile) return;
    const sb = getSupabase();
    try {
      const past = new Date(); past.setDate(past.getDate() - 60);
      const [{ data: entries }, { data: fastingDays }] = await Promise.all([
        sb.from('health_entries').select('entry_date,metric,value')
          .eq('user_id', profile.id).gte('entry_date', isoDate(past)),
        sb.from('fasting_sessions').select('started_at')
          .eq('user_id', profile.id).not('ended_at', 'is', null)
          .gte('started_at', past.toISOString()),
      ]);
      const map: Record<string, DayEntry[]> = {};
      (entries ?? []).forEach((e: { entry_date: string; metric: string; value?: number | null }) => {
        if (!map[e.entry_date]) map[e.entry_date] = [];
        if (!map[e.entry_date].find(x => x.metric === e.metric)) {
          map[e.entry_date].push({ metric: e.metric, value: e.value });
        }
      });
      (fastingDays ?? []).forEach((f: { started_at: string }) => {
        const d = isoDate(new Date(f.started_at));
        if (!map[d]) map[d] = [];
        if (!map[d].find(x => x.metric === 'fasting')) map[d].push({ metric: 'fasting' });
      });
      setDayData(map);
    } catch {}
  }, [profile]);

  const loadTrends = useCallback(async () => {
    if (!profile) return;
    const sb = getSupabase();
    try {
      const yearAgo = new Date(); yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      const [{ data: entries }, { data: fasts }] = await Promise.all([
        sb.from('health_entries').select('entry_date,metric,value')
          .eq('user_id', profile.id).gte('entry_date', isoDate(yearAgo)),
        sb.from('fasting_sessions').select('started_at,duration_minutes')
          .eq('user_id', profile.id).not('ended_at', 'is', null)
          .gte('started_at', yearAgo.toISOString()),
      ]);
      setTrendData(buildPoints(trendPeriod,
        (entries ?? []) as { entry_date: string; metric: string; value: number }[],
        (fasts ?? []) as { started_at: string; duration_minutes: number | null }[],
      ));
    } catch {}
  }, [profile, trendPeriod]);

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
    loadCalendar();
    loadPeriod();
    loadTrends();
  }, [authLoading, loadStats, loadCalendar, loadPeriod, loadTrends]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  const initials = profile?.first_name ? profile.first_name.charAt(0).toUpperCase() : '?';
  const tierLabel = profile?.subscription_tier === 'member_pro' ? 'Member' : 'Pro';
  const tierColor = profile?.subscription_tier === 'member_pro' ? '#1E8A4F' : '#E2682A';
  const fastCount = fasts.length;
  const avgFastHours = fastCount
    ? Math.floor(fasts.reduce((s, f) => s + (f.duration_minutes ?? 0), 0) / fastCount / 60)
    : null;

  // 14-day calendar window
  const twoWeeksAgo = new Date(); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 13);

  // Full month calendar window
  const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%', backgroundColor: 'var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
        }}>
          <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: '#FFFFFF' }}>
            {initials}
          </span>
        </div>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20, color: 'var(--text)', marginBottom: 6 }}>
          {profile?.first_name ?? ''}
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
              {value ?? 0}
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* 2-week habit calendar */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p className="section-label">Last 2 weeks</p>
          <button
            onClick={() => setShowAllCalendar(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13 }}
          >
            See all →
          </button>
        </div>
        <HabitCalendar
          dayData={dayData}
          startDate={twoWeeksAgo}
          numDays={14}
          onDayTap={d => setSelectedDay(selectedDay === d ? null : d)}
          selectedDay={selectedDay}
        />
        {selectedDay && <DaySummary dateStr={selectedDay} entries={dayData[selectedDay] ?? []} />}
      </div>

      {/* Food log */}
      {profile?.id && <FoodLogSection userId={profile.id} />}

      {/* Trend charts */}
      <div className="section">
        <p className="section-label mb-12">Trends</p>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {(['week', 'month', 'year'] as const).map(p => (
            <button key={p} onClick={() => setTrendPeriod(p)} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, cursor: 'pointer',
              border: `1.5px solid ${trendPeriod === p ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: trendPeriod === p ? 'var(--primary-pale)' : 'var(--surface)',
              fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13,
              color: trendPeriod === p ? 'var(--primary)' : 'var(--text-muted)',
            }}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
        {trendData && (
          <>
            <ChartCard title="Fasting duration" average={avgLabel(trendData.fasting)} unit="h" points={trendData.fasting} type="bar" color="#1E8A4F" />
            <ChartCard title="Water intake" average={avgLabel(trendData.water, 0)} unit="ml" points={trendData.water} type="bar" color="#4A90D9" />
            <ChartCard title="Sleep" average={avgLabel(trendData.sleep)} unit="h" points={trendData.sleep} type="line" color="#6B9B4A" />
            <ChartCard title="Energy level" average={avgLabel(trendData.energy)} unit="/5" points={trendData.energy} type="line" color="#D9C44A" />
            <ChartCard title="Weight" average={avgLabel(trendData.weight)} unit={profile?.weight_unit ?? 'kg'} points={trendData.weight} type="line" color="#E2682A" />
            <ChartCard title="Steps" average={avgLabel(trendData.steps, 0)} unit="steps" points={trendData.steps} type="bar" color="#9B6B4A" />
          </>
        )}
      </div>

      {/* Period filter + results */}
      <div className="filter-tabs mb-20">
        {(['7d', '30d', '3m', '6m', '12m'] as const).map(p => (
          <button key={p} className={`filter-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>{p}</button>
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
              <p className="body-sm">As you start logging, your progress will show up here.</p>
            </div>
          )}
        </>
      )}

      {/* See All calendar modal */}
      {showAllCalendar && (
        <div className="modal-overlay">
          <div className="modal-sheet" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-handle" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button
                onClick={() => setCalendarMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() - 1); return n; })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', padding: 4 }}
              >‹</button>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>
                {calendarMonth.toLocaleDateString('en-NZ', { month: 'long', year: 'numeric' })}
              </p>
              <button
                onClick={() => setCalendarMonth(m => { const n = new Date(m); n.setMonth(n.getMonth() + 1); return n; })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', padding: 4 }}
              >›</button>
            </div>
            <HabitCalendar
              dayData={dayData}
              startDate={monthStart}
              numDays={daysInMonth}
              onDayTap={d => setSelectedDay(selectedDay === d ? null : d)}
              selectedDay={selectedDay}
            />
            {selectedDay && <DaySummary dateStr={selectedDay} entries={dayData[selectedDay] ?? []} />}
            <button className="btn btn-ghost mt-16" onClick={() => setShowAllCalendar(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
