'use client';

import { useRef, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { Insight } from '@/lib/learnContent';

// Stable per UTC day; changes at UTC midnight (close enough for NZ users)
function getDailyBaseIndex(poolLength: number): number {
  return Math.floor(Date.now() / 86400000) % poolLength;
}

export default function InsightCard({ pool }: { pool: Insight[] }) {
  const base = getDailyBaseIndex(pool.length);
  const [offset, setOffset] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);

  // Prevents a swipe gesture from also firing the tap handler
  const didSwipeRef = useRef(false);

  const index = ((base + offset) % pool.length + pool.length) % pool.length;
  const insight = pool[index];

  const advance = (dir: 1 | -1) => {
    didSwipeRef.current = true;
    setOffset(o => o + dir);
    // Fallback clear in case click never fires (e.g. touch ends off-element)
    setTimeout(() => { didSwipeRef.current = false; }, 300);
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => advance(1),
    onSwipedRight: () => advance(-1),
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 12, // minimum px movement to count as a swipe (not a tap)
  });

  const handleTap = () => {
    if (didSwipeRef.current) {
      didSwipeRef.current = false;
      return;
    }
    setDetailOpen(true);
  };

  return (
    <>
      {/* ── Insight card ──────────────────────────────────────────────────── */}
      <div
        {...handlers}
        onClick={handleTap}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDetailOpen(true); }}
        aria-label="Insight of the day — tap to read more"
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderLeft: '3px solid var(--primary)',
          borderRadius: 'var(--radius)',
          padding: '16px 18px',
          cursor: 'pointer',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'pan-y',
        }}
      >
        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'var(--primary)',
          marginBottom: 8,
        }}>
          Insight of the day
        </p>

        <p style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: 14,
          color: 'var(--text)',
          lineHeight: 1.55,
          marginBottom: 14,
        }}>
          {insight.title}
        </p>

        {/* Bottom row: tap hint + position dots */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            Swipe for another · tap to read more
          </span>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0, marginLeft: 8 }}>
            {pool.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === index ? 14 : 5,
                  height: 5,
                  borderRadius: 3,
                  backgroundColor: i === index ? 'var(--primary)' : 'var(--border)',
                  transition: 'all 0.2s',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Detail sheet ──────────────────────────────────────────────────── */}
      {detailOpen && (
        <div
          className="modal-overlay"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="modal-sheet"
            onClick={e => e.stopPropagation()}
            style={{ animation: 'insightSheetSlideUp 0.25s ease-out' }}
          >
            <style>{`
              @keyframes insightSheetSlideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
              }
            `}</style>
            <div className="modal-handle" />

            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--primary)',
              marginBottom: 10,
            }}>
              Insight
            </p>

            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 17,
              color: 'var(--text)',
              lineHeight: 1.4,
              marginBottom: 16,
            }}>
              {insight.title}
            </p>

            <p style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: 15,
              color: 'var(--text)',
              lineHeight: 1.65,
              marginBottom: 28,
            }}>
              {insight.detail}
            </p>

            <button
              className="btn btn-outline"
              onClick={() => setDetailOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
