'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';

type Stage = 'loading' | 'animating' | 'setup' | 'invalid';

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

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('loading');
  const [email, setEmail] = useState('');
  const [inviteId, setInviteId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoVisible, setLogoVisible] = useState(false);

  useEffect(() => {
    validateToken();
  }, [token]);

  const validateToken = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('invite_tokens')
      .select('id, email, used, expires_at')
      .eq('token', token)
      .single();

    if (error || !data || data.used || new Date(data.expires_at) < new Date()) {
      setStage('invalid');
      return;
    }

    setEmail(data.email);
    setInviteId(data.id);
    setStage('animating');

    setTimeout(() => setLogoVisible(true), 100);
    setTimeout(() => setLogoVisible(false), 1900);
    setTimeout(() => setStage('setup'), 2400);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const score = getStrengthScore(password);
    if (score < 2 || password !== confirm) return;
    setLoading(true);
    setError('');

    const supabase = getSupabase();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { subscription_tier: 'member', invite_token: token },
      },
    });

    if (signUpError) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
    }

    await supabase.from('invite_tokens').update({ used: true, used_at: new Date().toISOString() }).eq('id', inviteId);
    router.push('/onboarding/name');
  };

  if (stage === 'loading') {
    return (
      <div className="loading-screen" style={{ background: '#0D1A07' }}>
        <div className="spinner" style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#7CBB44' }} />
      </div>
    );
  }

  if (stage === 'invalid') {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center', maxWidth: 320 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔗</div>
          <h1 className="h2 mb-12">This link isn&apos;t valid</h1>
          <p className="body-sm mb-24">
            Your invite link may have expired or already been used. Contact your coach for a new one.
          </p>
        </div>
      </div>
    );
  }

  if (stage === 'animating') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#0D1A07',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.3s ease',
      }}>
        <div style={{
          opacity: logoVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 56, marginBottom: 12 }}>🌿</div>
          <h1 style={{
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 700,
            fontSize: 28,
            color: '#D4EEC0',
            letterSpacing: '-0.5px',
          }}>
            Fastwell
          </h1>
        </div>
      </div>
    );
  }

  const score = getStrengthScore(password);
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const confirmMatch = confirm.length > 0 && confirm === password;
  const confirmMismatch = confirm.length > 0 && confirm !== password;
  const valid = score >= 2 && password === confirm && confirm.length > 0;

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 60 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 className="h1 mb-8">Welcome to Fastwell.</h1>
        <p className="body mb-4" style={{ color: 'var(--text-muted)' }}>Let&apos;s get you set up.</p>
        <p className="body-sm mb-32">You&apos;re joining as a Wicked Wellbeing member — 3 months free.</p>

        <div className="input-group mb-20">
          <label className="input-label">Email</label>
          <input
            className="input"
            type="email"
            value={email}
            disabled
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
        </div>

        {error && (
          <div style={{
            background: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 10,
            padding: '12px 16px', marginBottom: 16, color: '#C62828',
            fontSize: 14, fontFamily: 'Lato, sans-serif',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSetPassword}>
          <div className="input-group">
            <label className="input-label">Create a password</label>
            <div className="input-wrapper">
              <input
                className="input"
                type={showPass ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
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
                type={showPass ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
                style={{
                  borderColor: confirmMatch ? '#1E8A4F' : confirmMismatch ? '#E2682A' : undefined,
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-16"
            disabled={loading || !valid}
            style={{ opacity: loading || !valid ? 0.45 : 1 }}
          >
            {loading ? 'Setting up…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
