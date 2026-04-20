'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

function getStrengthScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(pw)) score++;
  return score;
}

function StrengthBar({ score }: { score: number }) {
  const segmentColour = (i: number) => {
    if (score === 0 || i >= score) return '#E8E4D9';
    return score <= 2 ? '#E2682A' : '#1E8A4F';
  };
  const label = score === 0 ? '' : score <= 2 ? 'Medium strength.' : score === 3 ? 'Strong.' : 'Very strong.';
  const labelColour = score <= 2 ? '#6B7066' : '#1E8A4F';
  return (
    <div style={{ marginTop: 10, marginBottom: 4 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: segmentColour(i), transition: 'background-color 0.2s' }} />
        ))}
      </div>
      {label && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: labelColour }}>{label}</p>
      )}
    </div>
  );
}

function RequirementChip({ label, met }: { label: string; met: boolean }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      height: 22, paddingLeft: 6, paddingRight: 6, borderRadius: 11,
      backgroundColor: met ? '#D9ECE0' : '#FBE4D6',
      fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11,
      color: met ? '#1E8A4F' : '#E2682A',
      transition: 'all 0.2s',
    }}>
      {label} {met ? '✓' : '✗'}
    </span>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const score = getStrengthScore(password);
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const confirmMatch = confirm.length > 0 && confirm === password;
  const confirmMismatch = confirm.length > 0 && confirm !== password;
  const valid = email.length > 0 && score >= 2 && password === confirm && confirm.length > 0;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setError('');
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { subscription_tier: 'subscriber' } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data.user) {
      router.push('/auth/check-email?email=' + encodeURIComponent(email));
    } else {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <GreenHeader
        title="Create your account."
        subtitle="Start feeling better in under 2 minutes."
      />

      <div style={{ flex: 1, padding: '32px 24px' }}>
        {error && (
          <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#C62828', fontSize: 14, fontFamily: 'Lato, sans-serif' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSignup}>
          <div className="input-group">
            <label className="input-label">Email</label>
            <input
              className="input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button type="button" className="eye-toggle" onClick={() => setShowPass(!showPass)}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
            {password.length > 0 && <StrengthBar score={score} />}
            {password.length > 0 && (
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                <RequirementChip label="8+ characters" met={hasMinLength} />
                <RequirementChip label="Uppercase" met={hasUppercase} />
                <RequirementChip label="Number" met={hasNumber} />
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label">Confirm password</label>
            <div className="input-wrapper">
              <input
                className="input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                style={{
                  borderColor: confirmMatch ? '#1E8A4F' : confirmMismatch ? '#E2682A' : undefined,
                }}
              />
              <button type="button" className="eye-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-8"
            disabled={loading || !valid}
            style={{ opacity: loading || !valid ? 0.45 : 1 }}
          >
            {loading ? 'Creating account…' : 'Continue'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
        </p>
      </div>
    </div>
  );
}
