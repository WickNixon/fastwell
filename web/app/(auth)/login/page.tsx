'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = getSupabase();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Incorrect email or password. Please try again.');
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '')
      .single();
    router.push(profile?.onboarding_complete ? '/dashboard' : '/onboarding/name');
  };

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div className="text-center mb-32">
          <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
          <h1 className="h1">Fastwell</h1>
          <p className="body-sm mt-8">Your health companion</p>
        </div>

        {error && (
          <div style={{
            background: '#FFF3F3',
            border: '1px solid #FFCDD2',
            borderRadius: 10,
            padding: '12px 16px',
            marginBottom: 16,
            color: '#C62828',
            fontSize: 14,
            fontFamily: 'Lato, sans-serif',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
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
                placeholder="Your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPass(!showPass)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !email || !password}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="divider-text mt-20">or</div>

        <Link href="/signup">
          <button className="btn btn-outline" style={{ marginTop: 0 }}>
            Create an account
          </button>
        </Link>
      </div>
    </div>
  );
}
