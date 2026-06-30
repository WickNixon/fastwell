'use client';

import { useState } from 'react';
import { getSupabase } from '@/lib/supabase-browser';
import { BackChip } from '../_components';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    // Eye-off: password is visible, tap to hide
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3 3l14 14M8.46 8.52A3 3 0 0011.5 13M4.22 6.22C2.88 7.36 2 8.6 2 10c0 0 2.5 6 8 6a8.4 8.4 0 003.78-.9M7 4.26C7.93 4.1 8.94 4 10 4c5.5 0 8 6 8 6a14.2 14.2 0 01-1.78 2.78" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    // Eye: password is hidden, tap to show
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M2 10s2.5-6 8-6 8 6 8 6-2.5 6-8 6-8-6-8-6z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" stroke="var(--text-muted)" strokeWidth="1.5" />
    </svg>
  );
}

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
      <BackChip />
      <h1 className="h1 mb-24" style={{ marginTop: 16 }}>Change password</h1>

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
            <button type="button" className="eye-toggle" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}><EyeIcon open={showPass} /></button>
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Confirm new password</label>
          <div className="input-wrapper">
            <input className="input" type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            <button type="button" className="eye-toggle" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Hide password' : 'Show password'}><EyeIcon open={showConfirm} /></button>
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
