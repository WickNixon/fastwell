'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = email && password.length >= 8 && password === confirm;

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
      router.push('/onboarding/name');
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
            {password && password.length < 8 && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Minimum 8 characters</p>
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
              />
              <button type="button" className="eye-toggle" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
            {confirm && confirm !== password && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Passwords don&apos;t match</p>
            )}
          </div>

          <button type="submit" className="btn btn-primary mt-8" disabled={loading || !valid}>
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
