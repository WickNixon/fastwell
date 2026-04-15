'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { FastingSession } from '@/lib/types';

type Filter = '7d' | '30d' | '3m' | 'all';

const FILTERS: Filter[] = ['7d', '30d', '3m', 'all'];

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export default function FastingHistoryPage() {
  const { profile } = useAuth();
  const [filter, setFilter] = useState<Filter>('30d');
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    let query = getSupabase()
      .from('fasting_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .not('ended_at', 'is', null)
      .order('started_at', { ascending: false });

    if (filter !== 'all') {
      const days = filter === '7d' ? 7 : filter === '30d' ? 30 : 90;
      const since = new Date(Date.now() - days * 86400000).toISOString();
      query = query.gte('started_at', since);
    }

    const { data } = await query;
    setSessions(data ?? []);
    setLoading(false);
  }, [profile, filter]);

  useEffect(() => { load(); }, [load]);

  const total = sessions.length;
  const avgMin = total ? Math.round(sessions.reduce((s, f) => s + (f.duration_minutes ?? 0), 0) / total) : 0;
  const longest = sessions.reduce((best, f) => Math.max(best, f.duration_minutes ?? 0), 0);
  const goalMap: Record<string, number> = { '16:8': 16 * 60, '18:6': 18 * 60, '20:4': 20 * 60, '24h': 24 * 60 };

  return (
    <div className="page page-top">
      <h1 className="h1 mb-20">Fasting history</h1>

      <div className="filter-tabs">
        {FILTERS.map(f => (
          <button key={f} className={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All time' : f}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="stat-row mb-24">
        <div className="stat-card">
          <p className="stat-value">{total}</p>
          <p className="stat-unit">total fasts</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{avgMin ? formatDuration(avgMin) : '—'}</p>
          <p className="stat-unit">average</p>
        </div>
        <div className="stat-card">
          <p className="stat-value">{longest ? formatDuration(longest) : '—'}</p>
          <p className="stat-unit">longest</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌿</div>
          <p className="h3">No fasts in this period</p>
          <p className="body-sm">Your completed fasts will show up here — each one a moment you showed up for yourself.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {sessions.map((s, i) => {
            const goalMin = goalMap[s.protocol ?? ''] ?? 0;
            const goalMet = goalMin > 0 && (s.duration_minutes ?? 0) >= goalMin;
            return (
              <div key={s.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderBottom: i < sessions.length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <div>
                  <p className="h3" style={{ fontSize: 14 }}>
                    {new Date(s.started_at).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="body-sm">{s.protocol ?? 'Fast'}</p>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--primary)' }}>
                    {s.duration_minutes ? formatDuration(s.duration_minutes) : '—'}
                  </p>
                  {goalMet && <span className="badge badge-green" style={{ fontSize: 10 }}>Goal met</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
