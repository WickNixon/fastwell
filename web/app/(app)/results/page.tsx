'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { HealthEntry, Biomarker, FastingSession } from '@/lib/types';

type Period = '7d' | '30d' | '3m' | '6m' | '12m';

export default function ResultsPage() {
  const { profile } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [biomarkers, setBiomarkers] = useState<Biomarker[]>([]);
  const [fasts, setFasts] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '3m': 90, '6m': 180, '12m': 365 };

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const since = new Date(Date.now() - DAYS[period] * 86400000).toISOString();
    const sb = getSupabase();

    const [{ data: e }, { data: b }, { data: f }] = await Promise.all([
      sb.from('health_entries').select('*').eq('user_id', profile.id).gte('entry_date', since.split('T')[0]),
      sb.from('biomarkers').select('*').eq('user_id', profile.id).gte('reading_date', since.split('T')[0]).order('reading_date', { ascending: false }),
      sb.from('fasting_sessions').select('*').eq('user_id', profile.id).gte('started_at', since).not('ended_at', 'is', null),
    ]);

    setEntries(e ?? []);
    setBiomarkers(b ?? []);
    setFasts(f ?? []);
    setLoading(false);
  }, [profile, period]);

  useEffect(() => { load(); }, [load]);

  const avg = (metric: string) => {
    const vals = entries.filter(e => e.metric === metric).map(e => e.value).filter(v => v != null) as number[];
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  };

  const fastCount = fasts.length;
  const avgFast = fastCount ? Math.round(fasts.reduce((s, f) => s + (f.duration_minutes ?? 0), 0) / fastCount) : null;
  const latestWeight = entries.filter(e => e.metric === 'weight').sort((a, b) => b.entry_date.localeCompare(a.entry_date))[0];
  const latestHba1c = biomarkers.filter(b => b.marker === 'hba1c')[0];

  return (
    <div className="page page-top">
      <h1 className="h1 mb-20">Your results</h1>

      <div className="filter-tabs mb-24">
        {(['7d', '30d', '3m', '6m', '12m'] as Period[]).map(p => (
          <button key={p} className={`filter-tab ${period === p ? 'active' : ''}`} onClick={() => setPeriod(p)}>
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : (
        <>
          {/* Fasting */}
          <div className="section">
            <p className="section-label mb-12">Fasting</p>
            <div className="stat-row">
              <div className="stat-card">
                <p className="stat-value">{fastCount}</p>
                <p className="stat-unit">fasts</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{avgFast ? `${Math.floor(avgFast / 60)}h` : '—'}</p>
                <p className="stat-unit">avg duration</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{latestHba1c ? `${latestHba1c.value}%` : '—'}</p>
                <p className="stat-unit">HbA1c</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="section">
            <p className="section-label mb-12">Body</p>
            <div className="stat-row">
              <div className="stat-card">
                <p className="stat-value">{latestWeight ? `${latestWeight.value}` : '—'}</p>
                <p className="stat-unit">{profile?.weight_unit ?? 'kg'}</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{avg('sleep_hours') ?? '—'}</p>
                <p className="stat-unit">avg sleep</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{avg('steps') ? Math.round(parseFloat(avg('steps')!)).toLocaleString() : '—'}</p>
                <p className="stat-unit">avg steps</p>
              </div>
            </div>
          </div>

          {/* Wellbeing */}
          <div className="section">
            <p className="section-label mb-12">Wellbeing</p>
            <div className="stat-row">
              <div className="stat-card">
                <p className="stat-value">{avg('energy_level') ?? '—'}</p>
                <p className="stat-unit">avg energy</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{avg('mood') ?? '—'}</p>
                <p className="stat-unit">avg mood</p>
              </div>
              <div className="stat-card">
                <p className="stat-value">{avg('water_ml') ? `${Math.round(parseFloat(avg('water_ml')!) / 100) * 100}` : '—'}</p>
                <p className="stat-unit">avg water</p>
              </div>
            </div>
          </div>

          {entries.length === 0 && fasts.length === 0 && (
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
