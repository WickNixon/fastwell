'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';

type Stage = 'loading' | 'animating' | 'setup' | 'invalid';

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

    // Logo animation sequence
    setTimeout(() => setLogoVisible(true), 100);
    setTimeout(() => setLogoVisible(false), 1900);
    setTimeout(() => setStage('setup'), 2400);
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8 || password !== confirm) return;
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
      // Try signing in (may already have account from token)
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError('Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
    }

    // Mark token used
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
          <h1 className="h2 mb-12">This link isn't valid</h1>
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

  // setup stage
  const valid = password.length >= 8 && password === confirm;

  return (
    <div className="auth-page" style={{ justifyContent: 'flex-start', paddingTop: 60 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 className="h1 mb-8">Welcome to Fastwell.</h1>
        <p className="body mb-4" style={{ color: 'var(--text-muted)' }}>Let's get you set up.</p>
        <p className="body-sm mb-32">You're joining as a Wicked Wellbeing member — 3 months free.</p>

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
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-16"
            disabled={loading || !valid}
          >
            {loading ? 'Setting up…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
