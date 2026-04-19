'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';

const HABIT_KEY = 'fruits_veggies';

function getTodayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackFruitsPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = getTodayNZ();

  const [didEat, setDidEat] = useState<boolean | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (!profile) return;
    getSupabase().from('health_entries').select('value,memo')
      .eq('user_id', profile.id).eq('entry_date', TODAY).eq('metric', HABIT_KEY).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setDidEat(data.value === 1);
          if (data.memo) setNotes(data.memo);
        }
      });
  }, [profile, TODAY]);

  const save = async () => {
    if (didEat === null || !user || saving) return;
    setSaving(true);
    const { error } = await supabase.from('health_entries')
      .upsert({
        user_id: user.id, entry_date: TODAY, metric: HABIT_KEY,
        value: didEat ? 1 : 0, unit: 'check', source: 'manual',
        memo: notes || null,
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setFeedback({ ok: true, msg: 'Saved' });
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-4">🥦 Eat fruits & veggies</h1>
      <p className="body-sm mb-32">Did you eat fruits and veggies today?</p>

      {feedback && (
        <div style={{
          background: feedback.ok ? 'var(--primary-pale)' : '#FFF3F3',
          border: `1px solid ${feedback.ok ? 'var(--border)' : '#FFCDD2'}`,
          color: feedback.ok ? 'var(--primary)' : '#C62828',
          borderRadius: 10, padding: '12px 16px', marginBottom: 24,
          fontSize: 14, fontFamily: 'Lato, sans-serif',
        }}>
          {feedback.ok ? `✓ ${feedback.msg}` : feedback.msg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        <button
          onClick={() => setDidEat(true)}
          style={{
            padding: '24px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
            border: `2px solid ${didEat === true ? 'var(--primary)' : 'var(--border)'}`,
            backgroundColor: didEat === true ? 'var(--primary-pale)' : 'var(--surface)',
          }}
        >
          <p style={{ fontSize: 36, marginBottom: 8 }}>✅</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: didEat === true ? 'var(--primary)' : 'var(--text)' }}>
            Yes
          </p>
        </button>
        <button
          onClick={() => setDidEat(false)}
          style={{
            padding: '24px 16px', borderRadius: 16, cursor: 'pointer', textAlign: 'center',
            border: `2px solid ${didEat === false ? 'var(--primary)' : 'var(--border)'}`,
            backgroundColor: didEat === false ? '#FFF3F3' : 'var(--surface)',
          }}
        >
          <p style={{ fontSize: 36, marginBottom: 8 }}>❌</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: didEat === false ? '#C62828' : 'var(--text)' }}>
            Not today
          </p>
        </button>
      </div>

      <div className="input-group mb-24">
        <label className="input-label">Notes (optional)</label>
        <input className="input" type="text" placeholder="e.g. salad at lunch, apple as snack"
          value={notes} onChange={e => setNotes(e.target.value)} />
      </div>

      <button className="btn btn-primary" onClick={save} disabled={didEat === null || saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}
