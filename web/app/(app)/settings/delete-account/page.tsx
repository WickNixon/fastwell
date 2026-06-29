'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { BackChip } from '../_components';

const CONFIRM_WORD = 'DELETE';

const DELETED_DATA = [
  'Your profile and all personal information',
  'All fasting sessions and history',
  'All health entries (sleep, weight, water, steps, energy, mood, exercise)',
  'All meal logs and photos',
  'All biomarker readings (blood glucose, ketones, HbA1c)',
  'All symptom logs',
  'All supplements and HRT records',
  'All badges and progress',
  'All AI insights',
  'Any active subscription (cancelled immediately)',
];

export default function SettingsDeleteAccountPage() {
  const { signOut } = useAuth();
  const [confirmText, setConfirmText] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const canDelete = confirmText.trim() === CONFIRM_WORD;

  const handleDelete = async () => {
    if (!canDelete || status === 'loading') return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const { data: { session } } = await getSupabase().auth.getSession();
      if (!session?.access_token) {
        setErrorMessage('Your session has expired. Please log in again.');
        setStatus('error');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        },
      );

      const json = await res.json();

      if (!res.ok || !json.success) {
        const msg = json?.error?.message
          ?? 'Deletion failed. Please try again or contact support at wick@wickedwellbeing.com.';
        console.error('delete-account error response:', json);
        setErrorMessage(msg);
        setStatus('error');
        return;
      }

      // Success — show confirmation, then sign out (which redirects to /login)
      setStatus('success');
      setTimeout(() => signOut(), 2500);

    } catch (e) {
      console.error('delete-account unexpected client error:', e);
      setErrorMessage('An unexpected error occurred. Please try again or contact support at wick@wickedwellbeing.com.');
      setStatus('error');
    }
  };

  // ─── Success state ────────────────────────────────────────────────────────

  if (status === 'success') {
    return (
      <div className="page page-top" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', gap: 16 }}>
        <p style={{ fontSize: 32 }}>✓</p>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)' }}>
          Your account has been deleted.
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text-muted)', maxWidth: 280, lineHeight: 1.5 }}>
          All your data has been permanently removed. Signing you out now…
        </p>
      </div>
    );
  }

  // ─── Main confirmation flow ───────────────────────────────────────────────

  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '16px 0 8px' }}>
        Delete my account
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
        This is permanent and irreversible. There is no undo.
      </p>

      {/* Warning card */}
      <div style={{ background: '#FFF3F0', border: '1.5px solid #FFCDD2', borderRadius: 14, padding: '18px 16px', marginBottom: 24 }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: '#B71C1C', marginBottom: 12 }}>
          What will be permanently deleted
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DELETED_DATA.map(item => (
            <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: '#C62828', fontSize: 13, flexShrink: 0, marginTop: 1 }}>✕</span>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: '#5D0000', lineHeight: 1.5 }}>
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation input */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>
          To confirm, type <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: '0.08em' }}>DELETE</span> in the box below:
        </p>
        <input
          type="text"
          className="input"
          value={confirmText}
          onChange={e => setConfirmText(e.target.value)}
          placeholder="Type DELETE here"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={status === 'loading'}
          style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, letterSpacing: '0.08em', fontSize: 15 }}
        />
      </div>

      {/* Error message */}
      {status === 'error' && (
        <div style={{ background: '#FFF3F3', border: '1px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: '#C62828', lineHeight: 1.5 }}>
            {errorMessage}
          </p>
        </div>
      )}

      {/* Delete button */}
      <button
        onClick={handleDelete}
        disabled={!canDelete || status === 'loading'}
        style={{
          width: '100%',
          padding: '14px 20px',
          borderRadius: 14,
          border: 'none',
          cursor: canDelete && status !== 'loading' ? 'pointer' : 'not-allowed',
          background: canDelete && status !== 'loading' ? '#C62828' : 'var(--border)',
          color: canDelete && status !== 'loading' ? '#fff' : 'var(--text-muted)',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {status === 'loading' ? 'Deleting…' : 'Permanently delete my account'}
      </button>

      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        Changed your mind? Tap the back arrow above.
      </p>
    </div>
  );
}
