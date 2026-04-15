'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import type { SymptomLog } from '@/lib/types';

const TODAY = new Date().toISOString().split('T')[0];

const SYMPTOMS = [
  { key: 'hot_flush', label: 'Hot flush', icon: '🔥' },
  { key: 'night_sweats', label: 'Night sweats', icon: '💦' },
  { key: 'brain_fog', label: 'Brain fog', icon: '🌫️' },
  { key: 'joint_pain', label: 'Joint pain', icon: '🦴' },
  { key: 'anxiety', label: 'Anxiety', icon: '💭' },
  { key: 'bloating', label: 'Bloating', icon: '🫧' },
  { key: 'headache', label: 'Headache', icon: '🤕' },
  { key: 'fatigue', label: 'Fatigue', icon: '😴' },
  { key: 'mood_swings', label: 'Mood swings', icon: '🌊' },
  { key: 'insomnia', label: 'Insomnia', icon: '🌙' },
  { key: 'low_libido', label: 'Low libido', icon: '💚' },
  { key: 'hair_thinning', label: 'Hair thinning', icon: '🪮' },
];

export default function TrackSymptomsPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [logged, setLogged] = useState<SymptomLog[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await getSupabase()
      .from('symptoms_log')
      .select('*')
      .eq('user_id', profile.id)
      .eq('entry_date', TODAY);
    setLogged(data ?? []);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (symptom: string) => {
    if (!profile) return;
    setSaving(symptom);
    const existing = logged.find(l => l.symptom === symptom);
    if (existing) {
      const { error } = await getSupabase().from('symptoms_log').delete().eq('id', existing.id);
      if (error) {
        setFeedback({ ok: false, msg: error.message });
      } else {
        setLogged(prev => prev.filter(l => l.symptom !== symptom));
      }
    } else {
      const { data, error } = await getSupabase()
        .from('symptoms_log')
        .insert({ user_id: profile.id, entry_date: TODAY, symptom, severity: 3 })
        .select()
        .single();
      if (error) {
        setFeedback({ ok: false, msg: error.message });
      } else if (data) {
        setLogged(prev => [...prev, data as SymptomLog]);
        setFeedback({ ok: true, msg: 'Logged' });
        setTimeout(() => setFeedback(null), 1500);
      }
    }
    setSaving(null);
  };

  const loggedKeys = new Set(logged.map(l => l.symptom));

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Symptoms</h1>
      <p className="body-sm mb-24">Tap to log any symptoms you're experiencing today.</p>

      {feedback && (
        <div style={{
          background: feedback.ok ? 'var(--primary-pale)' : '#FFF3F3',
          border: `1px solid ${feedback.ok ? 'var(--border)' : '#FFCDD2'}`,
          color: feedback.ok ? 'var(--primary)' : '#C62828',
          borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          fontSize: 14, fontFamily: 'Lato, sans-serif',
        }}>
          {feedback.ok ? `✓ ${feedback.msg}` : feedback.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {SYMPTOMS.map(s => {
          const active = loggedKeys.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              disabled={saving === s.key}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 14px', borderRadius: 12, textAlign: 'left',
                border: `2px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                backgroundColor: active ? '#FFF0E6' : 'var(--surface)',
                cursor: 'pointer',
              }}
            >
              <span style={{ fontSize: 22 }}>{s.icon}</span>
              <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, color: active ? 'var(--accent)' : 'var(--text)' }}>
                {s.label}
              </span>
            </button>
          );
        })}
      </div>

      {logged.length > 0 && (
        <p className="body-sm text-center mt-20">
          {logged.length} symptom{logged.length === 1 ? '' : 's'} logged today
        </p>
      )}
    </div>
  );
}
