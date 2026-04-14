'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabase();
    // Always show success — never confirm or deny email existence (security)
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 400 }}>
        <Link href="/login" style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', display: 'block', marginBottom: 32 }}>
          ← Back to login
        </Link>

        <h1 className="h1 mb-8">Reset your password</h1>
        <p className="body-sm mb-32">Enter your email and we'll send you a reset link.</p>

        {sent ? (
          <div style={{
            background: 'var(--primary-pale)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            padding: '16px 20px',
            color: 'var(--text)',
            fontFamily: 'Lato, sans-serif',
            fontSize: 15,
            lineHeight: 1.5,
          }}>
            If that email is registered, you'll receive a reset link shortly. Check your inbox.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label className="input-label">Email address</label>
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
            <button
              type="submit"
              className="btn btn-primary mt-8"
              disabled={loading || !email}
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
