'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';

function EnvelopeSVG() {
  return (
    <svg width="100" height="80" viewBox="0 0 100 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Envelope body */}
      <rect x="4" y="14" width="92" height="62" rx="8" fill="white" stroke="#1E8A4F" strokeWidth="2.5" />
      {/* V fold */}
      <path d="M4 22 L50 46 L96 22" stroke="#1E8A4F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Check circle */}
      <circle cx="78" cy="14" r="14" fill="#1E8A4F" />
      <path d="M71 14 L76 19 L85 9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function CheckEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? 'your email';

  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notConfirmedMsg, setNotConfirmedMsg] = useState('');

  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    if (!canResend || resending) return;
    setResending(true);
    const supabase = getSupabase();
    await supabase.auth.resend({ type: 'signup', email });
    setCountdown(60);
    setCanResend(false);
    setResending(false);
  };

  const handleContinue = async () => {
    setChecking(true);
    setNotConfirmedMsg('');
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push('/onboarding/name');
    } else {
      setNotConfirmedMsg('Still waiting for confirmation — please check your email.');
      setChecking(false);
    }
  };

  const formatCountdown = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      {/* Green header card */}
      <div style={{
        height: 180,
        backgroundColor: '#1E8A4F',
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        padding: '52px 24px 28px',
        position: 'relative',
        flexShrink: 0,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 20, left: 20,
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.18)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#FFFFFF', fontSize: 22, lineHeight: 1,
          }}
          aria-label="Back"
        >
          ‹
        </button>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 28, color: '#FFFFFF', marginBottom: 8, marginTop: 8 }}>
          Check your email.
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'rgba(255,255,255,0.82)', lineHeight: 1.4 }}>
          We&apos;ve sent a confirmation link to {email}.
        </p>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 48px' }}>
        {/* Illustration card */}
        <div style={{
          width: 200, height: 200, borderRadius: 24,
          backgroundColor: '#D9ECE0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 22,
        }}>
          <EnvelopeSVG />
        </div>

        {/* Helper text */}
        <p style={{
          fontFamily: 'Lato, sans-serif', fontSize: 14, color: '#6B7066',
          textAlign: 'center', lineHeight: 1.5, padding: '0 12px', marginBottom: 18,
        }}>
          Tap the link in your email to confirm. Then come right back — we&apos;ll pick up where you left off.
        </p>

        {/* Resend pill */}
        <button
          onClick={handleResend}
          disabled={!canResend || resending}
          style={{
            height: 32, paddingLeft: 14, paddingRight: 14, borderRadius: 16,
            backgroundColor: 'white', border: '1px solid #E8E4D9',
            cursor: canResend ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 4,
            marginBottom: 28,
          }}
        >
          <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#1E8A4F', fontWeight: 700 }}>
            {resending ? 'Sending…' : 'Resend email'}
          </span>
          {!canResend && !resending && (
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#E2682A', fontWeight: 700 }}>
              ({formatCountdown(countdown)})
            </span>
          )}
        </button>

        {notConfirmedMsg && (
          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#E2682A',
            textAlign: 'center', marginBottom: 16, lineHeight: 1.4,
          }}>
            {notConfirmedMsg}
          </p>
        )}

        {/* CTA */}
        <button
          className="btn btn-primary"
          onClick={handleContinue}
          disabled={checking}
          style={{ width: '100%' }}
        >
          {checking ? 'Checking…' : 'I\'ve confirmed — continue'}
        </button>
      </div>
    </div>
  );
}
