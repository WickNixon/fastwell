'use client';

// Content-agnostic quiz / check-in component.
// Phase 2: swap question data in learnContent.ts — no changes needed here.

import { useState } from 'react';
import type { QuizQuestion } from '@/lib/learnContent';

interface StageQuizProps {
  stageLabel: string;
  stageEmoji: string;
  stageColour: string;
  questions: QuizQuestion[];
  onClose: () => void;
}

type Phase = 'question' | 'insight' | 'done';

export default function StageQuiz({
  stageLabel,
  stageEmoji,
  stageColour,
  questions,
  onClose,
}: StageQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  function handleOptionSelect(optionId: string) {
    if (phase !== 'question') return;
    setSelectedOption(optionId);
    setPhase('insight');
  }

  function handleNext() {
    if (isLast) {
      setPhase('done');
    } else {
      setCurrentIndex(i => i + 1);
      setSelectedOption(null);
      setPhase('question');
    }
  }

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
          backgroundColor: stageColour,
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
          aria-label="Close check-in"
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
        <span style={{ fontSize: 22 }}>{stageEmoji}</span>
        <p style={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          color: 'var(--text)',
          flex: 1,
        }}>
          {stageLabel} check-in
        </p>

        {/* Progress dots */}
        {phase !== 'done' && (
          <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            {questions.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === currentIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: i <= currentIndex ? 'var(--primary)' : 'var(--border)',
                  transition: 'all 0.2s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px 20px 40px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {phase === 'done' ? (
          <CompletionState stageLabel={stageLabel} onClose={onClose} />
        ) : phase === 'insight' && selectedOption !== null ? (
          <InsightReveal
            question={question}
            selectedOptionId={selectedOption}
            isLast={isLast}
            onNext={handleNext}
          />
        ) : (
          <QuestionView
            question={question}
            questionNumber={currentIndex + 1}
            totalQuestions={questions.length}
            onSelect={handleOptionSelect}
          />
        )}
      </div>
    </div>
  );
}

// ── Question view ─────────────────────────────────────────────────────────────

function QuestionView({
  question,
  questionNumber,
  totalQuestions,
  onSelect,
}: {
  question: QuizQuestion;
  questionNumber: number;
  totalQuestions: number;
  onSelect: (optionId: string) => void;
}) {
  return (
    <>
      <p style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600,
        fontSize: 11,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: 'var(--text-muted)',
        marginBottom: 16,
      }}>
        {questionNumber} of {totalQuestions}
      </p>

      <p style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 700,
        fontSize: 19,
        color: 'var(--text)',
        lineHeight: 1.4,
        marginBottom: 28,
      }}>
        {question.prompt}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {question.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => onSelect(opt.id)}
            className="choice-card"
            style={{ minHeight: 56 }}
          >
            <div className="choice-title" style={{ fontSize: 15 }}>{opt.label}</div>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Insight reveal ────────────────────────────────────────────────────────────

function InsightReveal({
  question,
  selectedOptionId,
  isLast,
  onNext,
}: {
  question: QuizQuestion;
  selectedOptionId: string;
  isLast: boolean;
  onNext: () => void;
}) {
  const selectedLabel = question.options.find(o => o.id === selectedOptionId)?.label ?? '';

  return (
    <>
      {/* What they answered */}
      <div
        style={{
          backgroundColor: 'var(--primary-pale)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 18 }}>✓</span>
        <p style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: 14,
          color: 'var(--primary-deep)',
          fontWeight: 700,
          lineHeight: 1.4,
        }}>
          {selectedLabel}
        </p>
      </div>

      {/* Insight */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: '20px',
          marginBottom: 28,
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        <p style={{
          fontFamily: 'Lato, sans-serif',
          fontSize: 15,
          color: 'var(--text)',
          lineHeight: 1.65,
        }}>
          {question.insight}
        </p>
      </div>

      <button className="btn btn-primary" onClick={onNext}>
        {isLast ? 'Finish check-in' : 'Next →'}
      </button>
    </>
  );
}

// ── Completion state ──────────────────────────────────────────────────────────

function CompletionState({
  stageLabel,
  onClose,
}: {
  stageLabel: string;
  onClose: () => void;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 8px' }}>
      <div style={{ fontSize: 52, marginBottom: 20 }}>🌿</div>
      <p style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 700,
        fontSize: 22,
        color: 'var(--text)',
        marginBottom: 12,
      }}>
        That&apos;s it for now
      </p>
      <p style={{
        fontFamily: 'Lato, sans-serif',
        fontSize: 15,
        color: 'var(--text-muted)',
        lineHeight: 1.6,
        marginBottom: 32,
        maxWidth: 300,
      }}>
        [PLACEHOLDER] A warm closing message for completing the {stageLabel} check-in goes here. Short, encouraging.
      </p>
      <button className="btn btn-primary" onClick={onClose} style={{ maxWidth: 280 }}>
        Back to Learn
      </button>
    </div>
  );
}
