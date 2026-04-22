'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import { getSupabase } from '@/lib/supabase-browser';
import HabitHistoryRow from '@/app/components/HabitHistoryRow';

const HABIT_KEY = 'day_review';
const MOOD_LABELS = ['', 'Tough day', 'Hard', 'Okay', 'Good', 'Great day'];

function getTodayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

export default function TrackReviewPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const TODAY = getTodayNZ();

  const [reviewText, setReviewText] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [history, setHistory] = useState<{ id: string; entry_date: string; value: number | null; memo: string | null }[]>([]);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const past = new Date(); past.setDate(past.getDate() - 6);
    const pastStr = past.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
    const { data: entries } = await getSupabase().from('health_entries')
      .select('id,entry_date,value,memo')
      .eq('user_id', profile.id).eq('metric', HABIT_KEY)
      .gte('entry_date', pastStr).order('entry_date', { ascending: false });
    setHistory(entries ?? []);
    const todayEntry = (entries ?? []).find(e => e.entry_date === TODAY);
    if (todayEntry) {
      if (todayEntry.value) setMood(todayEntry.value);
      if (todayEntry.memo) setReviewText(todayEntry.memo);
    }
  }, [profile, TODAY]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!user || saving) return;
    setSaving(true);
    const { error } = await supabase.from('health_entries')
      .upsert({
        user_id: user.id, entry_date: TODAY, metric: HABIT_KEY,
        value: mood, unit: 'scale_1_5', source: 'manual',
        memo: reviewText || null,
      }, { onConflict: 'user_id,entry_date,metric,source' });
    if (error) {
      setFeedback({ ok: false, msg: error.message });
    } else {
      setFeedback({ ok: true, msg: 'Saved' });
      await load();
      setTimeout(() => setFeedback(null), 1500);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('health_entries').delete().eq('id', id).eq('user_id', user.id);
    if (error) {
      setFeedback({ ok: false, msg: error.message });
      return;
    }
    setFeedback({ ok: true, msg: 'Deleted' });
    setTimeout(() => setFeedback(null), 1500);
    await load();
  };

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-4">🌙 Review your day</h1>
      <p className="body-sm mb-24">Take a moment to reflect</p>

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

      <div className="card-lg mb-24">
        <p className="section-label mb-12">How did today go?</p>
        <textarea
          className="input"
          placeholder="What went well today? What would you do differently?"
          value={reviewText}
          onChange={e => setReviewText(e.target.value)}
          rows={5}
          style={{ resize: 'none', marginBottom: 20 }}
        />

        <p className="section-label mb-12">How do you feel overall?</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: mood ? 12 : 0 }}>
          {[1, 2, 3, 4, 5].map(q => (
            <button
              key={q}
              onClick={() => setMood(q === mood ? null : q)}
              style={{
                flex: 1, padding: '12px 4px', borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${mood === q ? 'var(--primary)' : 'var(--border)'}`,
                backgroundColor: mood === q ? 'var(--primary-pale)' : 'var(--surface)',
                fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18,
                color: mood === q ? 'var(--primary)' : 'var(--text-muted)',
              }}
            >
              {'⭐'.repeat(q)}
            </button>
          ))}
        </div>
        {mood && (
          <p className="body-sm text-center mb-0" style={{ color: 'var(--text-muted)', marginTop: 8 }}>
            {MOOD_LABELS[mood]}
          </p>
        )}
      </div>

      <button className="btn btn-primary" onClick={save} disabled={saving || (!reviewText && !mood)}>
        {saving ? 'Saving…' : 'Save review'}
      </button>

      {history.length > 0 && (
        <div className="section mt-32">
          <p className="section-label mb-12">Recent reviews</p>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {history.map((e, i) => (
              <div key={e.id} style={{ borderBottom: i < history.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <HabitHistoryRow
                  id={e.id}
                  dateLabel={new Date(e.entry_date).toLocaleDateString('en-NZ', { weekday: 'short', day: 'numeric', month: 'short' })}
                  valueLabel={e.value ? '⭐'.repeat(e.value) : e.memo ? '✓' : '—'}
                  onDelete={handleDelete}
                />
                {e.memo && (
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', lineHeight: 1.5, padding: '0 16px 10px' }}>{e.memo}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
