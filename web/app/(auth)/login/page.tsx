'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <GreenHeader
        title="Welcome back."
        subtitle="Log in to keep going."
      />

      <div style={{ flex: 1, padding: '32px 24px' }}>
        {error && (
          <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#C62828', fontSize: 14, fontFamily: 'Lato, sans-serif' }}>
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
              <button type="button" className="eye-toggle" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}>
                {showPass ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <Link href="/forgot-password" style={{ fontSize: 13, color: '#E2682A', fontFamily: 'Lato, sans-serif' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading || !email || !password}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)' }}>
          New to Fastwell?{' '}
          <Link href="/signup" style={{ color: '#E2682A', fontWeight: 600, textDecoration: 'none' }}>
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
