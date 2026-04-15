'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
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
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const [logged, setLogged] = useState<SymptomLog[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data } = await getSupabase()
      .from('symptoms_log').select('*')
      .eq('user_id', profile.id).eq('entry_date', TODAY);
    const existing = data ?? [];
    setLogged(existing);
    setSelected(new Set(existing.map((l: SymptomLog) => l.symptom)));
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  const toggleSelected = (symptom: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(symptom)) next.delete(symptom);
      else next.add(symptom);
      return next;
    });
  };

  const save = async () => {
    if (!user || saving) return;
    setSaving(true);

    // Delete any existing for today so we can re-insert cleanly
    if (logged.length > 0) {
      await supabase.from('symptoms_log').delete().eq('user_id', user.id).eq('entry_date', TODAY);
    }

    if (selected.size > 0) {
      const rows = Array.from(selected).map(symptom => ({
        user_id: user.id,
        entry_date: TODAY,
        symptom,
        severity: 3,
        notes: notes || null,
      }));
      const { error } = await supabase.from('symptoms_log').insert(rows);
      if (error) {
        setFeedback({ ok: false, msg: error.message });
        setSaving(false);
        return;
      }
    }

    setFeedback({ ok: true, msg: `${selected.size} symptom${selected.size === 1 ? '' : 's'} saved` });
    await load();
    setTimeout(() => { setFeedback(null); router.back(); }, 1200);
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Symptoms</h1>
      <p className="body-sm mb-24">Select any symptoms you're experiencing today, then tap Save.</p>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
        {SYMPTOMS.map(s => {
          const active = selected.has(s.key);
          return (
            <button
              key={s.key}
              onClick={() => toggleSelected(s.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px', borderRadius: 12, textAlign: 'left',
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

      {selected.size > 0 && (
        <div className="input-group">
          <label className="input-label">Notes (optional)</label>
          <textarea
            className="input"
            placeholder="e.g. Noticed this after having coffee..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            style={{ resize: 'none' }}
          />
        </div>
      )}

      <button
        className="btn btn-primary"
        onClick={save}
        disabled={saving}
      >
        {saving ? 'Saving…' : selected.size > 0 ? `Save ${selected.size} symptom${selected.size === 1 ? '' : 's'}` : 'Save — no symptoms today'}
      </button>
    </div>
  );
}
