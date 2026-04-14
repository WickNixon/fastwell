'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const valid = password.length >= 8 && password === confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError('');
    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError('Unable to update password. The link may have expired.');
      setLoading(false);
      return;
    }
    router.push('/login?reset=1');
  };

  return (
    <div className="auth-page">
      <div style={{ width: '100%', maxWidth: 400 }}>
        <h1 className="h1 mb-8">Set a new password</h1>
        <p className="body-sm mb-32">Choose something memorable — at least 8 characters.</p>

        {error && (
          <div style={{
            background: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 10,
            padding: '12px 16px', marginBottom: 16, color: '#C62828',
            fontSize: 14, fontFamily: 'Lato, sans-serif',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">New password</label>
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
            {confirm && confirm !== password && (
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
                Passwords don't match
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn btn-primary mt-8"
            disabled={loading || !valid}
          >
            {loading ? 'Saving…' : 'Set new password'}
          </button>
        </form>
      </div>
    </div>
  );
}
