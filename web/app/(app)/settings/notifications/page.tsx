'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { BackChip } from '../_components';

const TOGGLES = [
  { key: 'daily_reminder', label: 'Daily check-in reminder', sub: 'A gentle nudge to log how you\'re feeling' },
  { key: 'fasting', label: 'Fasting reminders', sub: 'Alerts when you start and complete a fast' },
  { key: 'weekly_summary', label: 'Weekly progress summary', sub: 'A look back at your week every Sunday' },
  { key: 'tips', label: 'New content & tips', sub: 'Articles and insights added to Learn' },
] as const;

const DEFAULTS: Record<string, boolean> = {
  daily_reminder: true,
  fasting: true,
  weekly_summary: true,
  tips: false,
};

function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled: boolean }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      disabled={disabled}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        border: 'none',
        background: on ? 'var(--primary)' : 'var(--border)',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        transition: 'background 0.18s',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: 10,
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.18)',
          transition: 'left 0.18s',
        }}
      />
    </button>
  );
}

export default function SettingsNotificationsPage() {
  const { profile, refreshProfile } = useAuth();
  const [prefs, setPrefs] = useState<Record<string, boolean>>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    if (profile) {
      const stored = profile.notification_prefs ?? {};
      setPrefs({ ...DEFAULTS, ...stored });
    }
  }, [profile]);

  const handleToggle = useCallback(async (key: string) => {
    if (!profile) return;
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    setSaving(true);
    setSaveError(false);
    try {
      const { error } = await getSupabase()
        .from('profiles')
        .update({ notification_prefs: next })
        .eq('id', profile.id);
      if (error) throw error;
      await refreshProfile();
    } catch (e) {
      console.error('Failed to save notification prefs:', e);
      setSaveError(true);
      setPrefs(prefs);
    } finally {
      setSaving(false);
    }
  }, [profile, prefs, refreshProfile]);

  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '16px 0 6px' }}>
        Notifications
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
        Choose what you'd like to hear about. Notifications are rolling out soon.
      </p>

      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)' }}>
        {TOGGLES.map(({ key, label, sub }, i) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '14px 16px',
              borderBottom: i < TOGGLES.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)', fontWeight: 400, marginBottom: 2 }}>
                {label}
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {sub}
              </p>
            </div>
            <Toggle on={!!prefs[key]} onToggle={() => handleToggle(key)} disabled={saving} />
          </div>
        ))}
      </div>

      {saveError && (
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--accent)', marginTop: 16, textAlign: 'center' }}>
          Couldn't save — please try again.
        </p>
      )}
    </div>
  );
}
