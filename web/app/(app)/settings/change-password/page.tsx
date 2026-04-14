'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from '@/lib/supabase-browser';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const valid = password.length >= 8 && password === confirm;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setLoading(true);
    setError('');
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) { setError('Unable to update password. Please try again.'); setLoading(false); return; }
    setSaved(true);
    setPassword('');
    setConfirm('');
    setLoading(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-24">Change password</h1>

      {saved && (
        <div style={{ background: 'var(--primary-pale)', border: '1px solid var(--border)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: 'var(--primary)', fontFamily: 'Lato, sans-serif', fontSize: 14 }}>
          ✓ Password updated successfully
        </div>
      )}

      {error && (
        <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#C62828', fontFamily: 'Lato, sans-serif', fontSize: 14 }}>
          {error}
        </div>
      )}

      <form onSubmit={save}>
        <div className="input-group">
          <label className="input-label">New password</label>
          <div className="input-wrapper">
            <input className="input" type={showPass ? 'text' : 'password'} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} required />
            <button type="button" className="eye-toggle" onClick={() => setShowPass(!showPass)}>{showPass ? '🙈' : '👁'}</button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Confirm new password</label>
          <div className="input-wrapper">
            <input className="input" type={showPass ? 'text' : 'password'} placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
          </div>
          {confirm && confirm !== password && <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Passwords don't match</p>}
        </div>

        <button type="submit" className="btn btn-primary mt-8" disabled={!valid || loading}>
          {loading ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  );
}
