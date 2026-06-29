'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import {
  ALL_STAGES,
  MENOPAUSE_STAGE_TO_LEARN_ID,
  STAGE_CONTENT,
  type LearnStageId,
} from '@/lib/learnContent';
import StageQuiz from './StageQuiz';

// ── Re-check interval ────────────────────────────────────────────────────────
// Change this single constant to adjust the re-check frequency.
const STAGE_RECHECK_MONTHS = 3;

function isRecheckDue(profile: { stage_last_checked_at: string | null; created_at: string } | null): boolean {
  if (!profile) return false;
  const cutoffMs = STAGE_RECHECK_MONTHS * 30.44 * 24 * 60 * 60 * 1000;
  // Fall back to created_at when stage_last_checked_at is null so new users
  // don't see the re-check card immediately after onboarding.
  const reference = profile.stage_last_checked_at ?? profile.created_at;
  return Date.now() - new Date(reference).getTime() >= cutoffMs;
}

// Re-check stage options — match the onboarding stage question exactly.
const RECHECK_STAGES = [
  { key: 'perimenopause', title: 'Perimenopause', sub: "I still have periods but they're changing." },
  { key: 'transition', title: 'Menopause transition', sub: 'Periods stopping and starting.' },
  { key: 'post_menopause', title: 'Post-menopause', sub: 'No period for 12+ months.' },
  { key: 'not_sure', title: 'Not sure', sub: "I don't know which stage I'm at." },
] as const;

// ── Main page ────────────────────────────────────────────────────────────────

export default function EducationPage() {
  const { profile, refreshProfile } = useAuth();
  const searchParams = useSearchParams();

  // ⚠️ TEMPORARY TEST TRIGGER — add ?recheck=1 to the URL to force the re-check card.
  // Remove (or set to false) before shipping to production.
  const forceRecheck = searchParams.get('recheck') === '1';

  const recheckDue = forceRecheck || isRecheckDue(profile);

  const forYouId: LearnStageId | null = profile?.menopause_stage
    ? (MENOPAUSE_STAGE_TO_LEARN_ID[profile.menopause_stage] ?? null)
    : null;
  const forYouContent = forYouId ? STAGE_CONTENT[forYouId] : null;

  const exploreStages = ALL_STAGES
    .filter(id => id !== forYouId)
    .map(id => STAGE_CONTENT[id].definition);

  const [quizStage, setQuizStage] = useState<LearnStageId | null>(null);
  const [activeExplore, setActiveExplore] = useState<LearnStageId | null>(null);
  const [recheckOpen, setRecheckOpen] = useState(false);

  // Quiz screen
  if (quizStage) {
    const content = STAGE_CONTENT[quizStage];
    return (
      <StageQuiz
        stageLabel={content.definition.label}
        stageEmoji={content.definition.emoji}
        stageColour={content.definition.colour}
        questions={content.quiz}
        onClose={() => setQuizStage(null)}
      />
    );
  }

  // Re-check flow (full screen)
  if (recheckOpen) {
    return (
      <RecheckFlow
        userId={profile?.id ?? ''}
        onComplete={async (newStage) => {
          await refreshProfile();
          setRecheckOpen(false);
        }}
        onClose={() => setRecheckOpen(false)}
      />
    );
  }

  // Explore stage detail
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

      {/* ── RE-CHECK CARD (shown when due) ───────────────────────────────── */}
      {recheckDue && (
        <div
          className="card"
          style={{
            borderLeft: '3px solid var(--accent)',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>🔄</span>
          <div style={{ flex: 1 }}>
            <p style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: 'var(--text)',
              marginBottom: 4,
            }}>
              It&apos;s been a while — has anything changed?
            </p>
            <p style={{
              fontFamily: 'Lato, sans-serif',
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              marginBottom: 12,
            }}>
              [PLACEHOLDER] A gentle note inviting the user to check if their stage has changed. Keep it warm.
            </p>
            <button
              className="btn btn-accent btn-sm"
              style={{ width: 'auto' }}
              onClick={() => setRecheckOpen(true)}
            >
              Update my stage →
            </button>
          </div>
        </div>
      )}

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
              <button
                className="btn btn-primary"
                onClick={() => setQuizStage(forYouId)}
              >
                Start your check-in →
              </button>
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
            <button
              className="btn btn-primary"
              onClick={() => setRecheckOpen(true)}
            >
              Find your stage →
            </button>
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

// ── Re-check flow ────────────────────────────────────────────────────────────

function RecheckFlow({
  userId,
  onComplete,
  onClose,
}: {
  userId: string;
  onComplete: (newStage: string) => Promise<void>;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleSelect = async (key: string) => {
    if (saving) return;
    setSelected(key);
    setSaving(true);
    setSaveError('');

    const { error } = await getSupabase()
      .from('profiles')
      .update({
        menopause_stage: key,
        stage_last_checked_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('stage re-check save error:', error);
      setSaveError('Something went wrong saving your stage. Please try again.');
      setSelected(null);
      setSaving(false);
      return;
    }

    await onComplete(key);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: 480,
        margin: '0 auto',
        animation: 'slideUp 0.25s ease-out',
      }}
    >
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>

      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--primary-pale)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
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
          aria-label="Close"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            style={{ width: 22, height: 22 }}
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--text)',
          flex: 1,
        }}>
          Where are you now?
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 20px 40px' }}>
        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 20,
          color: 'var(--text)',
          marginBottom: 8,
          lineHeight: 1.3,
        }}>
          Has anything changed for you?
        </p>
        <p style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: 14,
          color: 'var(--text-muted)',
          lineHeight: 1.55,
          marginBottom: 28,
        }}>
          [PLACEHOLDER] A gentle warm sentence inviting the user to pick whichever feels closest today.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {RECHECK_STAGES.map(stage => (
            <button
              key={stage.key}
              className={`choice-card ${selected === stage.key ? 'selected' : ''}`}
              onClick={() => handleSelect(stage.key)}
              disabled={saving}
            >
              <div>
                <div className="choice-title">{stage.title}</div>
                <div className="choice-sub">{stage.sub}</div>
              </div>
            </button>
          ))}
        </div>

        {saveError && (
          <p style={{
            fontFamily: 'Lato, sans-serif',
            fontSize: 14,
            color: '#C62828',
            textAlign: 'center',
            marginTop: 16,
          }}>
            {saveError}
          </p>
        )}
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
