'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';
import UpgradeModal from '@/components/UpgradeModal';
import { checkAndAwardBadges } from '@/lib/checkBadges';

interface FoodLog {
  id: string; meal_name: string | null; image_url: string | null;
  calories: number | null; protein_g: number | null; carbs_g: number | null;
  fat_g: number | null; fibre_g: number | null; confidence: string | null;
  notes: string | null; logged_at: string;
  final_payload?: { items?: Array<unknown> } | null;
}

interface MealItem {
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  confidence: 'high' | 'medium' | 'low';
  alternatives: string[];
}

interface AnalysisResult {
  items: MealItem[];
  overall_confidence: 'high' | 'medium' | 'low';
  notes: string;
}

interface CorrectionEvent {
  type: 'item_swap' | 'describe' | 'manual_edit';
  oldName?: string;
  newName?: string;
  userText?: string;
  at: string;
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

  const isPro = profile?.subscription_tier === 'member' || profile?.subscription_tier === 'subscriber';
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
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [originalResult, setOriginalResult] = useState<AnalysisResult | null>(null);
  const [corrections, setCorrections] = useState<CorrectionEvent[]>([]);
  const [isReanalysing, setIsReanalysing] = useState(false);
  const [reanalysingItemName, setReanalysingItemName] = useState<string | null>(null);
  const [describeExpanded, setDescribeExpanded] = useState(false);
  const [describeText, setDescribeText] = useState('');
  const [saving, setSaving] = useState(false);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [showEditManual, setShowEditManual] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');
  const [editFibre, setEditFibre] = useState('');

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
      setCurrentResult(null);
      setOriginalResult(null);
      setCorrections([]);
      setAnalysisError(null);
      setDescribeExpanded(false);
      setDescribeText('');
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
        if (data.error) {
          setAnalysisError(data.error);
        } else {
          const result = data as AnalysisResult;
          setCurrentResult(result);
          setOriginalResult(result);
        }
      } catch {
        setAnalysisError('Analysis failed — try a clearer photo');
      }
      setAnalyzing(false);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageBase64]);

  const handleAlternativeTap = async (item: MealItem, alternative: string) => {
    setReanalysingItemName(item.name);
    setIsReanalysing(true);
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mediaType,
          correction: { type: 'item_swap', oldName: item.name, newName: alternative },
        }),
      });
      const data = await res.json();
      if (!data.error) {
        setCorrections(prev => [...prev, { type: 'item_swap', oldName: item.name, newName: alternative, at: new Date().toISOString() }]);
        setCurrentResult(data as AnalysisResult);
      }
    } catch {}
    setReanalysingItemName(null);
    setIsReanalysing(false);
  };

  const handleDescribeSubmit = async () => {
    const text = describeText.trim();
    if (!text) return;
    setIsReanalysing(true);
    try {
      const res = await fetch('/api/analyze-meal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mediaType,
          correction: { type: 'describe', userText: text },
        }),
      });
      const data = await res.json();
      if (!data.error) {
        setCorrections(prev => [...prev, { type: 'describe', userText: text, at: new Date().toISOString() }]);
        setCurrentResult(data as AnalysisResult);
        setDescribeExpanded(false);
        setDescribeText('');
      }
    } catch {}
    setIsReanalysing(false);
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageBase64 || !user) return null;
    try {
      const filename = `${user.id}/${Date.now()}.jpg`;
      const bytes = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
      const { data: up } = await supabase.storage.from('food-images').upload(filename, bytes, { contentType: mediaType });
      if (up) return supabase.storage.from('food-images').getPublicUrl(filename).data.publicUrl;
    } catch {}
    return null;
  };

  const saveMeal = async () => {
    if (!currentResult || !user) return;
    setSaving(true);
    const imageUrl = await uploadImage();
    try {
      const mealName = currentResult.items.map(i => i.name).join(', ');
      const totalCalories = currentResult.items.reduce((s, i) => s + i.calories, 0);
      const totalProtein  = currentResult.items.reduce((s, i) => s + i.protein_g, 0);
      const totalCarbs    = currentResult.items.reduce((s, i) => s + i.carbs_g, 0);
      const totalFat      = currentResult.items.reduce((s, i) => s + i.fat_g, 0);
      const totalFibre    = currentResult.items.reduce((s, i) => s + i.fibre_g, 0);

      await supabase.from('food_logs').insert({
        user_id: user.id,
        meal_name: mealName,
        image_url: imageUrl,
        calories: totalCalories,
        protein_g: totalProtein,
        carbs_g: totalCarbs,
        fat_g: totalFat,
        fibre_g: totalFibre,
        confidence: currentResult.overall_confidence,
        notes: currentResult.notes || null,
        ai_original_payload: originalResult,
        ai_corrections: corrections,
        final_payload: currentResult,
      });
      setCurrentResult(null); setOriginalResult(null); setCorrections([]);
      setImageBase64(null); setImagePreview(null); setAnalysisError(null);
      await loadTodayLogs();
      if (user) checkAndAwardBadges(user.id).catch(() => {});
    } catch {}
    setSaving(false);
  };

  const reset = () => {
    setCurrentResult(null); setOriginalResult(null); setCorrections([]);
    setImageBase64(null); setImagePreview(null); setAnalyzing(false);
    setAnalysisError(null); setDescribeExpanded(false); setDescribeText('');
    setReanalysingItemName(null); setIsReanalysing(false);
  };

  const openEditManual = () => {
    const totalCal    = currentResult?.items.reduce((s, i) => s + i.calories, 0) ?? 0;
    const totalProt   = currentResult?.items.reduce((s, i) => s + i.protein_g, 0) ?? 0;
    const totalCarbs_ = currentResult?.items.reduce((s, i) => s + i.carbs_g, 0) ?? 0;
    const totalFat_   = currentResult?.items.reduce((s, i) => s + i.fat_g, 0) ?? 0;
    const totalFibre_ = currentResult?.items.reduce((s, i) => s + i.fibre_g, 0) ?? 0;
    setEditName(currentResult?.items.map(i => i.name).join(', ') ?? '');
    setEditCalories(totalCal ? String(Math.round(totalCal)) : '');
    setEditProtein(totalProt ? String(Math.round(totalProt)) : '');
    setEditCarbs(totalCarbs_ ? String(Math.round(totalCarbs_)) : '');
    setEditFat(totalFat_ ? String(Math.round(totalFat_)) : '');
    setEditFibre(totalFibre_ ? String(Math.round(totalFibre_)) : '');
    setShowEditManual(true);
  };

  const saveEditedMeal = async () => {
    if (!user) return;
    setSaving(true);
    const imageUrl = await uploadImage();
    try {
      const manualCalories = editCalories ? parseFloat(editCalories) : null;
      const manualProtein  = editProtein  ? parseFloat(editProtein)  : null;
      const manualCarbs    = editCarbs    ? parseFloat(editCarbs)    : null;
      const manualFat      = editFat      ? parseFloat(editFat)      : null;
      const manualFibre    = editFibre    ? parseFloat(editFibre)    : null;
      const manualName     = editName || 'Meal';

      const manualFinalPayload: AnalysisResult = {
        items: [{
          name: manualName,
          grams: 0,
          calories: manualCalories ?? 0,
          protein_g: manualProtein ?? 0,
          carbs_g: manualCarbs ?? 0,
          fat_g: manualFat ?? 0,
          fibre_g: manualFibre ?? 0,
          confidence: 'manual' as unknown as 'low',
          alternatives: [],
        }],
        overall_confidence: 'manual' as unknown as 'low',
        notes: '',
      };

      const manualCorrections: CorrectionEvent[] = [
        ...corrections,
        { type: 'manual_edit', at: new Date().toISOString() },
      ];

      await supabase.from('food_logs').insert({
        user_id: user.id,
        meal_name: manualName,
        image_url: imageUrl,
        calories: manualCalories,
        protein_g: manualProtein,
        carbs_g: manualCarbs,
        fat_g: manualFat,
        fibre_g: manualFibre,
        confidence: 'manual',
        notes: null,
        ai_original_payload: originalResult ?? null,
        ai_corrections: manualCorrections,
        final_payload: manualFinalPayload,
      });
      setShowEditManual(false);
      setCurrentResult(null); setOriginalResult(null); setCorrections([]);
      setImageBase64(null); setImagePreview(null); setAnalysisError(null);
      await loadTodayLogs();
      checkAndAwardBadges(user.id).catch(() => {});
    } catch {}
    setSaving(false);
  };

  const totalCalories = todayLogs.reduce((s, l) => s + (l.calories ?? 0), 0);
  const totalProtein  = todayLogs.reduce((s, l) => s + (l.protein_g ?? 0), 0);
  const totalCarbs    = todayLogs.reduce((s, l) => s + (l.carbs_g ?? 0), 0);
  const totalFat      = todayLogs.reduce((s, l) => s + (l.fat_g ?? 0), 0);
  const totalFibre    = todayLogs.reduce((s, l) => s + (l.fibre_g ?? 0), 0);

  const summaryTotals = currentResult ? {
    calories: currentResult.items.reduce((s, i) => s + i.calories, 0),
    protein:  currentResult.items.reduce((s, i) => s + i.protein_g, 0),
    carbs:    currentResult.items.reduce((s, i) => s + i.carbs_g, 0),
    fat:      currentResult.items.reduce((s, i) => s + i.fat_g, 0),
    fibre:    currentResult.items.reduce((s, i) => s + i.fibre_g, 0),
  } : null;

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

          {analysisError && (
            <>
              <p style={{ textAlign: 'center', fontSize: 14, color: '#C62828', fontFamily: 'Lato, sans-serif', marginBottom: 12 }}>
                {analysisError}
              </p>
              <button className="btn btn-ghost" onClick={reset}>Try again</button>
            </>
          )}

          {currentResult && (
            <>
              {/* Meal summary headline */}
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 17, color: '#1A1A1A', marginBottom: 6 }}>
                {currentResult.items.map(i => i.name).join(', ')}
              </p>

              {/* Confidence label — only when not high */}
              {currentResult.overall_confidence !== 'high' && (
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: '#6B7066', marginBottom: 12 }}>
                  {currentResult.overall_confidence === 'medium'
                    ? 'Medium confidence — tap any item to fix'
                    : 'Low confidence — tap an item or describe your meal below'}
                </p>
              )}

              {/* Per-item list */}
              <div style={{ marginBottom: 12 }}>
                {currentResult.items.map(item => {
                  const spinning = reanalysingItemName === item.name && isReanalysing;
                  return (
                    <div
                      key={item.name}
                      style={{
                        position: 'relative',
                        backgroundColor: '#F8F5EC',
                        borderRadius: 12,
                        padding: 12,
                        marginBottom: 8,
                        opacity: spinning ? 0.6 : 1,
                      }}
                    >
                      {spinning && (
                        <div style={{ position: 'absolute', top: 10, right: 12, fontSize: 14, color: 'var(--primary)' }}>
                          ⏳
                        </div>
                      )}
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: '#1A1A1A', marginBottom: 3 }}>
                        {item.name}
                      </p>
                      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#6B7066' }}>
                        {item.grams}g · {item.calories} cal · {item.protein_g}g protein
                      </p>
                      {(item.confidence === 'medium' || item.confidence === 'low') && item.alternatives.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                          {item.alternatives.map(alt => (
                            <button
                              key={alt}
                              onClick={() => !isReanalysing && handleAlternativeTap(item, alt)}
                              disabled={isReanalysing}
                              style={{
                                borderRadius: 14, padding: '4px 10px',
                                backgroundColor: 'white', border: '1px solid #E8E4D9',
                                fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#1A1A1A',
                                cursor: isReanalysing ? 'not-allowed' : 'pointer',
                              }}
                            >
                              {alt}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Describe your meal expandable */}
              <div style={{ marginBottom: 14 }}>
                <button
                  onClick={() => setDescribeExpanded(!describeExpanded)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--primary)',
                    padding: '4px 0', width: '100%', textAlign: 'left',
                  }}
                >
                  {describeExpanded ? 'Close ↑' : 'None of these right? Describe your meal →'}
                </button>
                {describeExpanded && (
                  <div style={{ marginTop: 8 }}>
                    <textarea
                      value={describeText}
                      onChange={e => setDescribeText(e.target.value)}
                      placeholder="e.g. grilled salmon with steamed broccoli and brown rice"
                      rows={3}
                      style={{
                        width: '100%', borderRadius: 10, border: '1px solid #E8E4D9',
                        padding: '10px 12px', fontFamily: 'Lato, sans-serif', fontSize: 13,
                        color: '#1A1A1A', backgroundColor: '#FAFAFA', resize: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      className="btn btn-outline"
                      onClick={handleDescribeSubmit}
                      disabled={isReanalysing || !describeText.trim()}
                      style={{ marginTop: 8 }}
                    >
                      {isReanalysing ? 'Re-analysing…' : 'Re-analyse'}
                    </button>
                  </div>
                )}
              </div>

              {/* Total macros pills */}
              {summaryTotals && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 6, marginBottom: 14 }}>
                  {[
                    { label: 'Cal',     value: Math.round(summaryTotals.calories) },
                    { label: 'Protein', value: `${Math.round(summaryTotals.protein)}g` },
                    { label: 'Carbs',   value: `${Math.round(summaryTotals.carbs)}g` },
                    { label: 'Fat',     value: `${Math.round(summaryTotals.fat)}g` },
                    { label: 'Fibre',   value: `${Math.round(summaryTotals.fibre)}g` },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: 'center', padding: '10px 4px', backgroundColor: 'var(--primary-pale)', borderRadius: 8 }}>
                      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: 'var(--primary)' }}>{value}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif' }}>{label}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Notes */}
              {currentResult.notes && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', marginBottom: 14, lineHeight: 1.5 }}>
                  {currentResult.notes}
                </p>
              )}

              <button className="btn btn-primary" onClick={saveMeal} disabled={saving || isReanalysing} style={{ marginBottom: 8 }}>
                {saving ? 'Saving…' : 'Save this meal'}
              </button>
              <button className="btn btn-ghost" onClick={reset} style={{ marginBottom: 4 }}>Retake photo.</button>
              <button
                onClick={openEditManual}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif', fontSize: 13, textDecoration: 'underline', textUnderlineOffset: 2, width: '100%', textAlign: 'center', padding: '6px 0' }}
              >
                Edit manually
              </button>
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

        {todayLogs.map((log, i) => {
          const itemCount = Array.isArray(log.final_payload?.items) ? log.final_payload.items.length : null;
          return (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>
                    {log.meal_name ?? 'Meal'}
                  </p>
                  {itemCount && itemCount > 1 && (
                    <span style={{
                      fontFamily: 'Lato, sans-serif', fontSize: 11, color: 'var(--primary)',
                      backgroundColor: 'var(--primary-pale)', borderRadius: 10,
                      padding: '1px 7px',
                    }}>
                      {itemCount} items
                    </span>
                  )}
                </div>
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
          );
        })}
      </div>

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
        </>
      )}

      {/* Personalised Meal Plans — Coming Soon */}
      <div style={{
        backgroundColor: '#F3F0E7', border: '1px solid rgba(30, 138, 79, 0.2)',
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

      {/* Edit manually sheet */}
      {showEditManual && (
        <div className="modal-overlay" onClick={() => setShowEditManual(false)}>
          <div className="modal-sheet" style={{ backgroundColor: '#F3F0E7', maxHeight: '70vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>Edit macros</h2>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>Adjust anything that looks off.</p>
            {[
              { label: 'MEAL NAME', value: editName, set: setEditName, type: 'text', placeholder: 'e.g. Chicken salad' },
              { label: 'CALORIES', value: editCalories, set: setEditCalories, type: 'number', placeholder: 'e.g. 450' },
              { label: 'PROTEIN (G)', value: editProtein, set: setEditProtein, type: 'number', placeholder: 'e.g. 32' },
              { label: 'CARBS (G)', value: editCarbs, set: setEditCarbs, type: 'number', placeholder: 'e.g. 28' },
              { label: 'FAT (G)', value: editFat, set: setEditFat, type: 'number', placeholder: 'e.g. 14' },
              { label: 'FIBRE (G)', value: editFibre, set: setEditFibre, type: 'number', placeholder: 'e.g. 5' },
            ].map(({ label, value, set, type, placeholder }) => (
              <div key={label} className="input-group">
                <label className="input-label">{label}</label>
                <input
                  className="input"
                  type={type}
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder={placeholder}
                  inputMode={type === 'number' ? 'numeric' : undefined}
                />
              </div>
            ))}
            <button className="btn btn-primary mt-8" onClick={saveEditedMeal} disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
            <button className="btn btn-ghost mt-8" onClick={() => setShowEditManual(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
