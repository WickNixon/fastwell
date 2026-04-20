'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getSupabase } from '@/lib/supabase-browser';
import GreenHeader from '@/components/GreenHeader';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabase();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F3F0E7', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>
      <GreenHeader
        title="Reset your password."
        subtitle="Enter your email and we'll send a reset link."
        showBack
        onBack={() => history.back()}
      />

      <div style={{ flex: 1, padding: '32px 24px' }}>
        {sent ? (
          <div style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', color: 'var(--text)', fontFamily: 'Lato, sans-serif', fontSize: 15, lineHeight: 1.5 }}>
            If that email is registered, you&apos;ll receive a reset link shortly. Check your inbox.
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
            <button type="submit" className="btn btn-primary mt-8" disabled={loading || !email}>
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <Link href="/login" style={{ fontSize: 14, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
                Back to login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
