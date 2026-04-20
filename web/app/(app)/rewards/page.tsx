'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { UserBadge } from '@/lib/types';
import { BADGES, type BadgeId } from '@/constants/badges';
import { checkAndAwardBadges } from '@/lib/checkBadges';

const ALL_BADGE_IDS = Object.keys(BADGES) as BadgeId[];

export default function RewardsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [selected, setSelected] = useState<UserBadge | null>(null);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setLoading(false), 5000);

    try {
      // Check and award any newly earned badges on page open
      await checkAndAwardBadges(profile.id);

      const { data } = await getSupabase()
        .from('user_badges').select('*').eq('user_id', profile.id)
        .order('earned_at', { ascending: false });
      setEarnedBadges(data ?? []);

      const unseen = (data ?? []).filter(b => !b.seen).map(b => b.id);
      if (unseen.length) {
        await getSupabase().from('user_badges').update({ seen: true }).in('id', unseen);
      }
    } catch {
      // Failed to load badges
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

  const earnedKeys = new Set(earnedBadges.map(b => b.badge_key));
  const earnedAt = new Map(earnedBadges.map(b => [b.badge_key, b.earned_at]));

  return (
    <div className="page page-top">
      <h1 className="h1 mb-4">Your milestones</h1>
      <p className="body-sm mb-24">Every step you've taken, in one place.</p>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><div className="spinner" /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {ALL_BADGE_IDS.map(badgeId => {
            const badge = BADGES[badgeId];
            const isEarned = earnedKeys.has(badgeId);
            const earnedDate = earnedAt.get(badgeId);
            const earnedBadge = earnedBadges.find(b => b.badge_key === badgeId);

            return (
              <button
                key={badgeId}
                onClick={() => isEarned && earnedBadge ? setSelected(earnedBadge) : null}
                style={{
                  backgroundColor: 'var(--surface)',
                  border: isEarned ? `1px solid ${badge.orange ? '#E2682A' : 'var(--primary-pale)'}` : '1px solid var(--border)',
                  borderRadius: 14,
                  padding: '16px 10px',
                  textAlign: 'center',
                  cursor: isEarned ? 'pointer' : 'default',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  opacity: isEarned ? 1 : 0.55,
                  position: 'relative',
                }}
              >
                {!isEarned && (
                  <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10 }}>🔒</span>
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: isEarned ? (badge.orange ? '#FBE4D6' : 'var(--primary-pale)') : 'var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22,
                  filter: isEarned ? 'none' : 'grayscale(100%)',
                }}>
                  {badge.emoji}
                </div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text)', lineHeight: 1.3 }}>
                  {badge.name}
                </p>
                {isEarned && earnedDate ? (
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
                    {new Date(earnedDate).toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' })}
                  </p>
                ) : (
                  <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', lineHeight: 1.4 }}>
                    {badge.hint}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Badge detail modal */}
      {selected && (() => {
        const badge = BADGES[selected.badge_key as BadgeId];
        if (!badge) return null;
        return (
          <div className="modal-overlay" onClick={() => setSelected(null)}>
            <div className="modal-sheet" style={{ backgroundColor: '#F3F0E7' }} onClick={e => e.stopPropagation()}>
              <div className="modal-handle" />
              <div style={{ textAlign: 'center', paddingBottom: 8 }}>
                <div style={{
                  width: 96, height: 96, borderRadius: 48,
                  backgroundColor: badge.orange ? '#FBE4D6' : 'var(--primary-pale)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 48, margin: '0 auto 16px',
                }}>
                  {badge.emoji}
                </div>
                <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  EARNED {new Date(selected.earned_at).toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}
                </p>
                <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 24, color: 'var(--text)', marginBottom: 12 }}>
                  {badge.name}.
                </h2>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 8 }}>
                  {badge.description}
                </p>
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)', lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic' }}>
                  {badge.earnedMessage}
                </p>
                <button className="btn btn-primary" onClick={() => setSelected(null)}>See all milestones</button>
                <button className="btn btn-ghost mt-8" onClick={() => setSelected(null)}>Close</button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
