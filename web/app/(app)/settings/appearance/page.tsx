'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const OPTIONS = [
  { key: 'system', label: 'Follow device', sub: 'Uses your system setting' },
  { key: 'light', label: 'Light mode', sub: null },
  { key: 'dark', label: 'Dark mode', sub: null },
];

export default function SettingsAppearancePage() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState('system');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile?.theme_preference) setSelected(profile.theme_preference);
  }, [profile]);

  const handleSelect = async (key: string) => {
    if (!profile) return;
    setSelected(key);
    setSaving(true);
    await getSupabase().from('profiles').update({ theme_preference: key }).eq('id', profile.id);
    // Apply immediately
    if (key === 'light' || key === 'dark') {
      document.documentElement.setAttribute('data-theme', key);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    await refreshProfile();
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-24">Appearance</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {OPTIONS.map(o => (
          <button
            key={o.key}
            onClick={() => handleSelect(o.key)}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderRadius: 12, textAlign: 'left',
              border: `2px solid ${selected === o.key ? 'var(--primary)' : 'var(--border)'}`,
              backgroundColor: selected === o.key ? 'var(--primary-pale)' : 'var(--surface)',
              cursor: 'pointer',
            }}
          >
            <div>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: selected === o.key ? 'var(--primary)' : 'var(--text)' }}>
                {o.label}
              </p>
              {o.sub && <p className="body-sm">{o.sub}</p>}
            </div>
            {selected === o.key && <span style={{ color: 'var(--primary)', fontSize: 18 }}>✓</span>}
          </button>
        ))}
      </div>

      {saving && <p className="body-sm text-center mt-16">Saving…</p>}
    </div>
  );
}
