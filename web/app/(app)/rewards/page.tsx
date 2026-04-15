'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { UserBadge } from '@/lib/types';

const BADGE_DETAILS: Record<string, { icon: string; message: string }> = {
  onboarding_complete: { icon: '🌱', message: 'Completing your profile is the first step most people never take. Welcome to Fastwell.' },
  first_fast: { icon: '⏱️', message: 'Your first fasting session is in the books. This is where it begins.' },
  first_hba1c: { icon: '🩸', message: 'You\'ve logged your HbA1c. Now you have a starting point — and in three months, you\'ll see how far you\'ve come.' },
  seven_day_streak: { icon: '🌿', message: 'Seven days of showing up for yourself. This is what consistency actually looks like.' },
  thirty_day_streak: { icon: '🏆', message: 'Thirty days. Not perfect — consistent. That\'s the one that changes everything.' },
  deep_fast: { icon: '🌙', message: 'A 24-hour fast. Your body worked hard and so did you.' },
  hba1c_improved: { icon: '💚', message: 'Your HbA1c has improved since you started. Your hard work is showing up in your results.' },
  three_months: { icon: '🌻', message: 'Three months ago you started something. Look at where you are now.' },
  six_months: { icon: '✨', message: 'Six months of showing up. That is not a habit anymore — it\'s who you are.' },
  hydration_week: { icon: '💧', message: 'Seven days of staying hydrated. Your body is thanking you.' },
  first_export: { icon: '📄', message: 'You\'ve shared your data with your GP. That\'s taking your health seriously.' },
};

export default function RewardsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [selected, setSelected] = useState<UserBadge | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLoading(false), 5000);

    try {
      const { data } = await getSupabase()
        .from('user_badges').select('*').eq('user_id', profile.id)
        .order('earned_at', { ascending: false });
      setBadges(data ?? []);
      const unseen = (data ?? []).filter(b => !b.seen).map(b => b.id);
      if (unseen.length) {
        await getSupabase().from('user_badges').update({ seen: true }).in('id', unseen);
      }
    } catch {
      // Failed to load badges — show empty state
    } finally {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (authLoading) return;
    load();
  }, [authLoading, load]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  return (
    <div className="page page-top">
      <h1 className="h1 mb-4">Your milestones</h1>
      <p className="body-sm mb-24">Every one of these was earned.</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : badges.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🌱</div>
          <p className="h3">Your milestones will appear here</p>
          <p className="body-sm">Start logging and you'll earn your first one soon.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {badges.map(b => {
            const detail = BADGE_DETAILS[b.badge_key] ?? { icon: '🏅', message: '' };
            return (
              <button
                key={b.id}
                onClick={() => setSelected(b)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '20px 14px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 36 }}>{detail.icon}</div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13, color: 'var(--text)', lineHeight: 1.3 }}>
                  {b.badge_name}
                </p>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
                  {new Date(b.earned_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {/* Badge detail modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ textAlign: 'center', paddingBottom: 8 }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>
                {(BADGE_DETAILS[selected.badge_key] ?? { icon: '🏅' }).icon}
              </div>
              <h2 className="h2 mb-12">{selected.badge_name}</h2>
              <p className="body" style={{ color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 16 }}>
                {(BADGE_DETAILS[selected.badge_key] ?? { message: '' }).message}
              </p>
              <p className="body-sm">
                Earned {new Date(selected.earned_at).toLocaleDateString('en-NZ', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <button className="btn btn-outline mt-20" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
