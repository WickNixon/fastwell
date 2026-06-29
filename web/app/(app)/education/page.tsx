'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import {
  ALL_STAGES,
  MENOPAUSE_STAGE_TO_LEARN_ID,
  STAGE_CONTENT,
  type LearnStageId,
} from '@/lib/learnContent';

export default function EducationPage() {
  const { profile } = useAuth();

  const forYouId: LearnStageId | null = profile?.menopause_stage
    ? (MENOPAUSE_STAGE_TO_LEARN_ID[profile.menopause_stage] ?? null)
    : null;
  const forYouContent = forYouId ? STAGE_CONTENT[forYouId] : null;

  const exploreStages = ALL_STAGES
    .filter(id => id !== forYouId)
    .map(id => STAGE_CONTENT[id].definition);

  const [showQuizPlaceholder, setShowQuizPlaceholder] = useState(false);
  const [activeExplore, setActiveExplore] = useState<LearnStageId | null>(null);

  if (activeExplore) {
    return (
      <ExploreSheet
        stageId={activeExplore}
        onClose={() => setActiveExplore(null)}
      />
    );
  }

  return (
    <div className="page page-top">
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <h1 className="h1" style={{ marginBottom: 4 }}>Learn</h1>
        <p className="body-sm">Your stage, your way — one idea at a time.</p>
      </div>

      {/* ── FOR YOU ──────────────────────────────────── */}
      <div style={{ marginBottom: 32 }}>
        <p className="section-label" style={{ marginBottom: 12 }}>For You</p>

        {forYouContent ? (
          <>
            {/* Hero card for the user's stage */}
            <div
              style={{
                backgroundColor: forYouContent.definition.colour,
                borderRadius: 'var(--radius)',
                padding: '20px',
                marginBottom: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28 }}>{forYouContent.definition.emoji}</span>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: 18,
                  color: 'var(--text)',
                }}>
                  {forYouContent.definition.label}
                </p>
              </div>
              <p style={{
                fontFamily: 'Lato, sans-serif',
                fontSize: 14,
                color: 'var(--text)',
                lineHeight: 1.55,
                marginBottom: 16,
              }}>
                {forYouContent.definition.subtitle}
              </p>

              {showQuizPlaceholder ? (
                <div style={{
                  backgroundColor: 'rgba(255,255,255,0.65)',
                  borderRadius: 12,
                  padding: '16px',
                  textAlign: 'center',
                }}>
                  <p style={{
                    fontFamily: 'Lato, sans-serif',
                    fontSize: 14,
                    color: 'var(--text)',
                    marginBottom: 12,
                  }}>
                    [PLACEHOLDER — Quiz mechanic builds in Change 2]
                  </p>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ width: 'auto', margin: '0 auto' }}
                    onClick={() => setShowQuizPlaceholder(false)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowQuizPlaceholder(true)}
                >
                  Start your check-in →
                </button>
              )}
            </div>

            {/* Bite-size insight cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {forYouContent.insightCards.map(card => (
                <div
                  key={card.id}
                  className="card"
                  style={{ borderLeft: '3px solid var(--primary)' }}
                >
                  <p style={{
                    fontFamily: 'Lato, sans-serif',
                    fontSize: 14,
                    color: 'var(--text)',
                    lineHeight: 1.55,
                  }}>
                    {card.text}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* not_sure or null — gentle default */
          <div
            style={{
              backgroundColor: 'var(--primary-pale)',
              borderRadius: 'var(--radius)',
              padding: '20px',
            }}
          >
            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 18,
              color: 'var(--text)',
              marginBottom: 8,
            }}>
              Your journey, personalised ✨
            </p>
            <p style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: 14,
              color: 'var(--text)',
              lineHeight: 1.55,
              marginBottom: 16,
            }}>
              [PLACEHOLDER] Not sure which stage you&apos;re at? Take a quick check-in and
              we&apos;ll make this section yours.
            </p>

            {showQuizPlaceholder ? (
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.65)',
                borderRadius: 12,
                padding: '16px',
                textAlign: 'center',
              }}>
                <p style={{
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 14,
                  color: 'var(--text)',
                  marginBottom: 12,
                }}>
                  [PLACEHOLDER — Quiz mechanic builds in Change 2]
                </p>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ width: 'auto', margin: '0 auto' }}
                  onClick={() => setShowQuizPlaceholder(false)}
                >
                  Close
                </button>
              </div>
            ) : (
              <button
                className="btn btn-primary"
                onClick={() => setShowQuizPlaceholder(true)}
              >
                Take your check-in →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── EXPLORE ──────────────────────────────────── */}
      <div>
        <p className="section-label" style={{ marginBottom: 12 }}>Explore</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {exploreStages.map(stage => (
            <button
              key={stage.id}
              onClick={() => setActiveExplore(stage.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                backgroundColor: stage.colour,
                border: 'none',
                borderRadius: 14,
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ fontSize: 24, flexShrink: 0 }}>{stage.emoji}</span>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  fontSize: 14,
                  color: 'var(--text)',
                  marginBottom: 2,
                }}>
                  {stage.label}
                </p>
                <p style={{
                  fontFamily: 'Lato, sans-serif',
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  lineHeight: 1.4,
                }}>
                  {stage.subtitle}
                </p>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: 20, flexShrink: 0 }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Explore slide-up sheet ────────────────────────────────────────────────────

function ExploreSheet({
  stageId,
  onClose,
}: {
  stageId: LearnStageId;
  onClose: () => void;
}) {
  const { definition } = STAGE_CONTENT[stageId];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'var(--bg)',
        overflowY: 'auto',
        animation: 'slideUp 0.25s ease-out',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* Sticky header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: definition.colour,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 4,
            color: 'var(--text)',
            flexShrink: 0,
          }}
          aria-label="Back"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ width: 22, height: 22 }}
          >
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span style={{ fontSize: 24 }}>{definition.emoji}</span>
        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 17,
          color: 'var(--text)',
          flex: 1,
        }}>
          {definition.label}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px 80px' }}>
        <p style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: 15,
          color: 'var(--text)',
          lineHeight: 1.6,
          marginBottom: 24,
        }}>
          {definition.subtitle}
        </p>

        <div
          style={{
            backgroundColor: 'var(--primary-pale)',
            borderRadius: 12,
            padding: '20px',
            textAlign: 'center',
            fontFamily: 'Lato, sans-serif',
            fontSize: 14,
            color: 'var(--text)',
            lineHeight: 1.6,
          }}
        >
          [PLACEHOLDER — Full stage content goes here in Phase 2]
        </div>
      </div>
    </div>
  );
}
