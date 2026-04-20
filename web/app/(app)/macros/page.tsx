'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import UpgradeModal from '@/components/UpgradeModal';

interface FoodLog {
  id: string; meal_name: string | null; image_url: string | null;
  calories: number | null; protein_g: number | null; carbs_g: number | null;
  fat_g: number | null; fibre_g: number | null; confidence: string | null;
  notes: string | null; logged_at: string;
}

interface MacroResult {
  meal_name?: string; calories?: number; protein_g?: number; carbs_g?: number;
  fat_g?: number; fibre_g?: number; confidence?: string; notes?: string; error?: string;
}

function todayNZ() {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

function dateLabelNZ() {
  return new Date().toLocaleDateString('en-NZ', {
    timeZone: 'Pacific/Auckland', weekday: 'long', day: 'numeric', month: 'long',
  });
}

export default function MacrosPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();

  const isPro = profile?.subscription_tier === 'pro' || profile?.subscription_tier === 'member_pro';
  const trialActive = profile?.pro_trial_ends_at
    ? new Date(profile.pro_trial_ends_at) > new Date()
    : false;
  const hasProAccess = isPro || trialActive;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState('image/jpeg');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult] = useState<MacroResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  const today = todayNZ();

  const loadTodayLogs = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await supabase.from('food_logs').select('*')
        .eq('user_id', user.id)
        .gte('logged_at', `${today}T00:00:00Z`)
        .lte('logged_at', `${today}T23:59:59Z`)
        .order('logged_at', { ascending: false });
      setTodayLogs(data ?? []);
    } catch {}
    setLoadingLogs(false);
  }, [user, today]);

  useEffect(() => { loadTodayLogs(); }, [loadTodayLogs]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowSheet(false);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, data] = dataUrl.split(',');
      const mt = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      setMediaType(mt);
      setImageBase64(data);
      setImagePreview(dataUrl);
      setResult(null);
      setAnalyzing(true);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (!imageBase64 || !analyzing) return;
    (async () => {
      try {
        const res = await fetch('/api/analyze-meal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64, mediaType }),
        });
        const data = await res.json();
        setResult(data);
      } catch {
        setResult({ error: 'Analysis failed — try a clearer photo' });
      }
      setAnalyzing(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBase64]);

  const saveMeal = async () => {
    if (!result || result.error || !user) return;
    setSaving(true);
    let imageUrl: string | null = null;
    if (imageBase64) {
      try {
        const filename = `${user.id}/${Date.now()}.jpg`;
        const bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
        const { data: up } = await supabase.storage.from('food-images').upload(filename, bytes, { contentType: mediaType });
        if (up) imageUrl = supabase.storage.from('food-images').getPublicUrl(filename).data.publicUrl;
      } catch {}
    }
    try {
      await supabase.from('food_logs').insert({
        user_id: user.id, meal_name: result.meal_name, image_url: imageUrl,
        calories: result.calories, protein_g: result.protein_g, carbs_g: result.carbs_g,
        fat_g: result.fat_g, fibre_g: result.fibre_g, confidence: result.confidence, notes: result.notes,
      });
      setResult(null); setImageBase64(null); setImagePreview(null);
      await loadTodayLogs();
    } catch {}
    setSaving(false);
  };

  const reset = () => {
    setResult(null); setImageBase64(null); setImagePreview(null); setAnalyzing(false);
  };

  const totalCalories = todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
  const totalProtein  = todayLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
  const totalCarbs    = todayLogs.reduce((s, l) => s + (l.carbs_g ?? 0), 0);
  const totalFat      = todayLogs.reduce((s, l) => s + (l.fat_g ?? 0), 0);
  const totalFibre    = todayLogs.reduce((s, l) => s + (l.fibre_g ?? 0), 0);

  return (
    <div className="page page-top">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 2 }}>
          Macros
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)' }}>
          {dateLabelNZ()}
        </p>
      </div>

      {/* Daily totals — always visible */}
      <div className="card" style={{ marginBottom: 20 }}>
        <p className="section-label" style={{ marginBottom: 12 }}>Today&apos;s totals</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
          {[
            { label: 'cal',     value: Math.round(totalCalories) },
            { label: 'protein', value: `${Math.round(totalProtein)}g` },
            { label: 'carbs',   value: `${Math.round(totalCarbs)}g` },
            { label: 'fat',     value: `${Math.round(totalFat)}g` },
            { label: 'fibre',   value: `${Math.round(totalFibre)}g` },
          ].map(({ label, value }) => (
            <div key={label} style={{ backgroundColor: 'var(--primary-pale)', borderRadius: 10, padding: '10px 4px', textAlign: 'center' }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{value}</p>
              <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pro gate */}
      {!hasProAccess ? (
        <div className="card" style={{ textAlign: 'center', padding: '28px 20px', marginBottom: 20 }}>
          <p style={{ fontSize: 36, marginBottom: 16 }}>🔒</p>
          <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 10 }}>
            Analyse your meals with a photo
          </p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            Snap a photo of your food and get an instant macro breakdown — protein, carbs, fats, and calories — without logging a single number.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setUpgradeModalVisible(true)}
            style={{ marginBottom: 8 }}
          >
            Upgrade to Pro
          </button>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)' }}>
            14-day free trial
          </p>
        </div>
      ) : (
        <>
      {/* Log a meal CTA */}
      {!imagePreview && (
        <button
          className="btn btn-primary"
          onClick={() => setShowSheet(true)}
          style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <span style={{ fontSize: 18 }}>📷</span> Log a meal
        </button>
      )}

      {/* Analysis card */}
      {imagePreview && (
        <div className="card" style={{ marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imagePreview} alt="Meal preview" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} />
          {analyzing && (
            <p style={{ textAlign: 'center', fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', padding: '12px 0' }}>
              Analysing your meal…
            </p>
          )}
          {result && !result.error && (
            <>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 17, marginBottom: 12, color: 'var(--text)' }}>
                {result.meal_name ?? 'Meal'}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
                {[
                  { label: 'Calories', value: result.calories ? `${result.calories}` : '—' },
                  { label: 'Protein',  value: result.protein_g ? `${result.protein_g}g` : '—' },
                  { label: 'Carbs',    value: result.carbs_g ? `${result.carbs_g}g` : '—' },
                  { label: 'Fat',      value: result.fat_g ? `${result.fat_g}g` : '—' },
                  { label: 'Fibre',    value: result.fibre_g ? `${result.fibre_g}g` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} style={{ textAlign: 'center', padding: '10px 4px', backgroundColor: 'var(--primary-pale)', borderRadius: 8 }}>
                    <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{value}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>{label}</p>
                  </div>
                ))}
              </div>
              {result.notes && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginBottom: 12, lineHeight: 1.5 }}>
                  {result.notes}
                </p>
              )}
              {result.confidence === 'low' && (
                <p style={{ fontSize: 12, color: 'var(--accent)', fontFamily: 'Lato, sans-serif', marginBottom: 12 }}>
                  This is an estimate — portions are hard to judge from photos.
                </p>
              )}
              <button className="btn btn-primary" onClick={saveMeal} disabled={saving} style={{ marginBottom: 8 }}>
                {saving ? 'Saving…' : 'Save this meal'}
              </button>
              <button className="btn btn-ghost" onClick={reset}>Try again</button>
            </>
          )}
          {result?.error && (
            <>
              <p style={{ textAlign: 'center', fontSize: 14, color: '#C62828', fontFamily: 'Lato, sans-serif', marginBottom: 12 }}>
                {result.error}
              </p>
              <button className="btn btn-ghost" onClick={reset}>Try again</button>
            </>
          )}
        </div>
      )}

      {/* Today's meals */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <p className="section-label">Meals today</p>
          {todayLogs.length > 0 && (
            <button
              onClick={() => setShowSheet(true)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13 }}
            >
              + Add
            </button>
          )}
        </div>

        {loadingLogs && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>Loading…</p>
        )}

        {!loadingLogs && todayLogs.length === 0 && !imagePreview && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', lineHeight: 1.6 }}>
            No meals logged yet today. Tap <strong>Log a meal</strong> above to take a photo and let Claude analyse your macros.
          </p>
        )}

        {todayLogs.map((log, i) => (
          <div key={log.id} style={{
            display: 'flex', gap: 12, padding: '12px 0',
            borderBottom: i < todayLogs.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            {log.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={log.image_url} alt={log.meal_name ?? ''} style={{ width: 54, height: 54, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 54, height: 54, borderRadius: 8, backgroundColor: 'var(--primary-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 22 }}>
                🍽
              </div>
            )}
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>
                {log.meal_name ?? 'Meal'}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>
                {[
                  log.calories   ? `${Math.round(log.calories)} cal`       : null,
                  log.protein_g  ? `${Math.round(log.protein_g)}g protein` : null,
                  log.carbs_g    ? `${Math.round(log.carbs_g)}g carbs`     : null,
                ].filter(Boolean).join(' · ')}
              </p>
              {log.confidence === 'low' && (
                <p style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'Lato, sans-serif', marginTop: 2 }}>
                  Estimate — portions are hard to judge from photos
                </p>
              )}
              <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginTop: 3 }}>
                {new Date(log.logged_at).toLocaleTimeString('en-NZ', { timeZone: 'Pacific/Auckland', hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </>
      )}

      {/* Personalised Meal Plans — Coming Soon */}
      <div style={{
        backgroundColor: '#F3F0E7', border: '1px solid rgba(92, 138, 52, 0.3)',
        borderRadius: 14, padding: '20px 18px', marginBottom: 20, marginTop: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <span style={{ fontSize: 28, flexShrink: 0 }}>🥗</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 6 }}>
              Personalised Meal Plans
            </p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 12 }}>
              Tell us your goals and we&apos;ll build your week — recipes, timing, and all.
            </p>
            <span style={{
              display: 'inline-block', fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
              fontSize: 12, color: '#1E8A4F', backgroundColor: '#D9ECE0',
              padding: '4px 12px', borderRadius: 20,
            }}>
              Coming Soon
            </span>
          </div>
        </div>
      </div>

      {/* Upgrade modal */}
      <UpgradeModal
        visible={upgradeModalVisible}
        onClose={() => setUpgradeModalVisible(false)}
        context="macros"
      />

      {/* Photo sheet */}
      {showSheet && (
        <div className="modal-overlay" onClick={() => setShowSheet(false)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <p style={{ textAlign: 'center', fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
              Log a meal
            </p>
            <button className="btn btn-primary" onClick={() => cameraInputRef.current?.click()} style={{ marginBottom: 10 }}>
              📷 Take a photo
            </button>
            <button className="btn btn-outline" onClick={() => fileInputRef.current?.click()} style={{ marginBottom: 10 }}>
              🖼 Choose from library
            </button>
            <button className="btn btn-ghost" onClick={() => setShowSheet(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
