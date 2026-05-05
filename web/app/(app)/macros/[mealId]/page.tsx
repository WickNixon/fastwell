'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { createClient } from '@/lib/supabase';

interface MealItemDetail {
  name: string;
  grams: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fibre_g: number;
  confidence?: string;
  alternatives?: string[];
}

interface FinalPayload {
  items?: MealItemDetail[];
  notes?: string;
  overall_confidence?: string;
}

interface FoodLog {
  id: string;
  meal_name: string | null;
  image_url: string | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  fibre_g: number | null;
  confidence: string | null;
  notes: string | null;
  logged_at: string;
  final_payload: FinalPayload | null;
  ai_original_payload: unknown;
  ai_corrections: unknown[];
}

interface EditableItem {
  name: string;
  grams: string;
  calories: string;
  protein_g: string;
}

const SECTION_LABEL: React.CSSProperties = {
  fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11,
  color: '#6B7066', letterSpacing: '0.16em', textTransform: 'uppercase' as const,
  marginBottom: 10,
};

export default function MealDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const mealId = params.mealId as string;
  const supabase = createClient();

  const [meal, setMeal] = useState<FoodLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editCalories, setEditCalories] = useState('');
  const [editProtein, setEditProtein] = useState('');
  const [editCarbs, setEditCarbs] = useState('');
  const [editFat, setEditFat] = useState('');
  const [editFibre, setEditFibre] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<EditableItem[]>([]);
  const [showPerItemEdit, setShowPerItemEdit] = useState(false);

  useEffect(() => {
    if (!user || !mealId) return;
    (async () => {
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('id', mealId)
        .eq('user_id', user.id)
        .single();
      if (error || !data) {
        console.error('MealDetail fetch error:', error);
        router.replace('/macros');
        return;
      }
      setMeal(data as FoodLog);
      setLoading(false);
    })();
  }, [user, mealId]); // eslint-disable-line react-hooks/exhaustive-deps

  const enterEditMode = (m: FoodLog) => {
    setEditName(m.meal_name ?? '');
    setEditCalories(m.calories != null ? String(Math.round(m.calories)) : '');
    setEditProtein(m.protein_g != null ? String(Math.round(m.protein_g)) : '');
    setEditCarbs(m.carbs_g != null ? String(Math.round(m.carbs_g)) : '');
    setEditFat(m.fat_g != null ? String(Math.round(m.fat_g)) : '');
    setEditFibre(m.fibre_g != null ? String(Math.round(m.fibre_g)) : '');
    setEditNotes(m.final_payload?.notes ?? m.notes ?? '');
    const items = m.final_payload?.items ?? [];
    setEditItems(items.map(it => ({
      name: it.name,
      grams: String(it.grams),
      calories: String(it.calories),
      protein_g: String(it.protein_g),
    })));
    setShowPerItemEdit(false);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setShowPerItemEdit(false);
  };

  const handleSaveEdit = async () => {
    if (!meal || !user) return;
    setSaving(true);

    const newCalories = editCalories ? parseFloat(editCalories) : null;
    const newProtein  = editProtein  ? parseFloat(editProtein)  : null;
    const newCarbs    = editCarbs    ? parseFloat(editCarbs)    : null;
    const newFat      = editFat      ? parseFloat(editFat)      : null;
    const newFibre    = editFibre    ? parseFloat(editFibre)    : null;
    const newName     = editName.trim() || 'Meal';
    const newNotes    = editNotes.trim() || null;

    // Build new final_payload
    let newItems: MealItemDetail[];
    const originalItems = meal.final_payload?.items ?? [];
    if (showPerItemEdit && editItems.length > 0) {
      newItems = editItems.map(ei => ({
        name: ei.name,
        grams: parseFloat(ei.grams) || 0,
        calories: parseFloat(ei.calories) || 0,
        protein_g: parseFloat(ei.protein_g) || 0,
        carbs_g: 0,
        fat_g: 0,
        fibre_g: 0,
        confidence: 'manual',
        alternatives: [],
      }));
    } else {
      // User only edited totals — synthesise single item
      newItems = [{
        name: newName,
        grams: 0,
        calories: newCalories ?? 0,
        protein_g: newProtein ?? 0,
        carbs_g: newCarbs ?? 0,
        fat_g: newFat ?? 0,
        fibre_g: newFibre ?? 0,
        confidence: 'manual',
        alternatives: [],
      }];
    }
    // Preserve multi-item structure if user didn't touch per-item and original had items
    if (!showPerItemEdit && originalItems.length > 1) {
      newItems = originalItems;
    }

    const newFinalPayload: FinalPayload = {
      items: newItems,
      notes: newNotes ?? undefined,
      overall_confidence: 'manual',
    };

    const existingCorrections = Array.isArray(meal.ai_corrections) ? meal.ai_corrections : [];
    const newCorrection = { type: 'manual_edit_post_save', at: new Date().toISOString() };

    const { error } = await supabase
      .from('food_logs')
      .update({
        meal_name: newName,
        calories: newCalories,
        protein_g: newProtein,
        carbs_g: newCarbs,
        fat_g: newFat,
        fibre_g: newFibre,
        notes: newNotes,
        confidence: 'manual',
        final_payload: newFinalPayload,
        ai_corrections: [...existingCorrections, newCorrection],
      })
      .eq('id', meal.id)
      .eq('user_id', user.id);

    if (error) {
      console.error('handleSaveEdit error:', error);
      setSaving(false);
      return;
    }

    // Update local state with saved values and flip back to read-only
    setMeal(prev => prev ? {
      ...prev,
      meal_name: newName,
      calories: newCalories,
      protein_g: newProtein,
      carbs_g: newCarbs,
      fat_g: newFat,
      fibre_g: newFibre,
      notes: newNotes,
      confidence: 'manual',
      final_payload: newFinalPayload,
      ai_corrections: [...existingCorrections, newCorrection],
    } : prev);
    setIsEditing(false);
    setShowPerItemEdit(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!meal || !user) return;
    if (!confirm("Delete this meal? You can't undo this.")) return;
    const { error } = await supabase
      .from('food_logs')
      .delete()
      .eq('id', meal.id)
      .eq('user_id', user.id);
    if (error) { console.error('MealDetail delete error:', error); return; }
    router.push('/macros');
  };

  if (loading) {
    return (
      <div className="page page-top" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    );
  }

  if (!meal) return null;

  const items = Array.isArray(meal.final_payload?.items) ? meal.final_payload!.items : [];
  const payloadNotes = meal.final_payload?.notes ?? meal.notes;
  const loggedAtTime = new Date(meal.logged_at).toLocaleTimeString('en-NZ', {
    timeZone: 'Pacific/Auckland', hour: 'numeric', minute: '2-digit', hour12: true,
  });

  const inputStyle: React.CSSProperties = {
    width: '100%', borderRadius: 12, border: '1px solid #E8E4D9',
    padding: '10px 12px', fontFamily: 'Lato, sans-serif', fontSize: 15,
    color: '#1A1A1A', backgroundColor: 'white', boxSizing: 'border-box',
    marginBottom: 12,
  };

  const macroInputStyle: React.CSSProperties = {
    ...inputStyle,
    textAlign: 'center',
  };

  return (
    <div className="page page-top">
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, position: 'relative' }}>
        <button
          onClick={() => isEditing ? cancelEdit() : router.push('/macros')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600, fontSize: 15, padding: '4px 0',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          aria-label={isEditing ? 'Cancel edit' : 'Back to macros'}
        >
          ← {isEditing ? 'Cancel' : 'Back'}
        </button>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16,
          color: 'var(--text)', position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          {isEditing ? 'Edit meal' : 'Meal logged'}
        </p>
      </div>

      {/* Photo */}
      {meal.image_url && (
        <div style={{ marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meal.image_url}
            alt={meal.meal_name ?? 'Meal photo'}
            style={{ width: '100%', aspectRatio: '1 / 1', objectFit: 'cover', borderRadius: 16 }}
          />
        </div>
      )}

      {isEditing ? (
        /* ── EDIT MODE ── */
        <>
          {/* Meal name */}
          <p style={{ ...SECTION_LABEL, marginBottom: 6 }}>Meal name</p>
          <input
            style={inputStyle}
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            placeholder="e.g. Grilled chicken with salad"
          />

          {/* Macro totals */}
          <p style={{ ...SECTION_LABEL, marginBottom: 6 }}>Totals</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Cal',    value: editCalories, set: setEditCalories },
              { label: 'Protein', value: editProtein,  set: setEditProtein },
              { label: 'Carbs',  value: editCarbs,    set: setEditCarbs },
              { label: 'Fat',    value: editFat,      set: setEditFat },
              { label: 'Fibre',  value: editFibre,    set: setEditFibre },
            ].map(({ label, value, set }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <input
                  style={macroInputStyle}
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={e => set(e.target.value)}
                  placeholder="0"
                />
                <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 11, color: '#6B7066', marginTop: -8 }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Per-item edit — only shown for multi-item meals */}
          {items.length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <button
                onClick={() => setShowPerItemEdit(v => !v)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--primary)', fontFamily: 'Lato, sans-serif', fontSize: 13,
                  padding: '4px 0', marginBottom: showPerItemEdit ? 12 : 0,
                }}
              >
                {showPerItemEdit ? 'Hide per-item edit ↑' : 'Edit individual items →'}
              </button>
              {showPerItemEdit && editItems.map((item, i) => (
                <div key={i} style={{ backgroundColor: '#F8F5EC', borderRadius: 12, padding: 12, marginBottom: 8 }}>
                  <input
                    style={{ ...inputStyle, marginBottom: 6 }}
                    type="text"
                    value={item.name}
                    onChange={e => setEditItems(prev => prev.map((it, idx) => idx === i ? { ...it, name: e.target.value } : it))}
                    placeholder="Item name"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {[
                      { key: 'grams',     label: 'g',       val: item.grams },
                      { key: 'calories',  label: 'cal',     val: item.calories },
                      { key: 'protein_g', label: 'protein', val: item.protein_g },
                    ].map(({ key, label, val }) => (
                      <div key={key} style={{ textAlign: 'center' }}>
                        <input
                          style={{ ...macroInputStyle, marginBottom: 2, padding: '8px 4px' }}
                          type="number"
                          inputMode="numeric"
                          value={val}
                          onChange={e => setEditItems(prev => prev.map((it, idx) => idx === i ? { ...it, [key]: e.target.value } : it))}
                          placeholder="0"
                        />
                        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 10, color: '#6B7066' }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Notes */}
          <p style={{ ...SECTION_LABEL, marginBottom: 6 }}>Notes (optional)</p>
          <textarea
            style={{ ...inputStyle, resize: 'none', minHeight: 80 }}
            value={editNotes}
            onChange={e => setEditNotes(e.target.value)}
            placeholder="Any notes about this meal…"
            rows={3}
          />

          {/* Save */}
          <button
            onClick={handleSaveEdit}
            disabled={saving}
            style={{
              width: '100%', height: 48, borderRadius: 24,
              backgroundColor: '#1E8A4F', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
              fontSize: 15, marginBottom: 12, opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>

          {/* Cancel */}
          <button
            onClick={cancelEdit}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#6B7066', fontFamily: 'Lato, sans-serif', fontSize: 13,
              width: '100%', textAlign: 'center', padding: '4px 0',
            }}
          >
            Cancel
          </button>
        </>
      ) : (
        /* ── READ-ONLY MODE ── */
        <>
          {/* Title + time */}
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 20,
            color: '#1A1A1A', marginBottom: 4,
          }}>
            {meal.meal_name ?? 'Meal'}
          </p>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#6B7066', marginBottom: 20 }}>
            Logged at {loggedAtTime}
          </p>

          {/* TOTALS */}
          <p style={SECTION_LABEL}>Totals</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 24 }}>
            {[
              meal.calories  != null ? `${Math.round(meal.calories)} cal`        : null,
              meal.protein_g != null ? `${Math.round(meal.protein_g)}g protein`  : null,
              meal.carbs_g   != null ? `${Math.round(meal.carbs_g)}g carbs`      : null,
              meal.fat_g     != null ? `${Math.round(meal.fat_g)}g fat`          : null,
              meal.fibre_g   != null ? `${Math.round(meal.fibre_g)}g fibre`      : null,
            ].filter(Boolean).map(label => (
              <span key={label!} style={{
                borderRadius: 10, padding: '6px 12px',
                backgroundColor: '#D9ECE0',
                fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#1E8A4F',
              }}>
                {label}
              </span>
            ))}
          </div>

          {/* ITEMS */}
          {items.length > 1 && (
            <>
              <p style={SECTION_LABEL}>Items</p>
              <div style={{ marginBottom: 24 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ backgroundColor: '#F8F5EC', borderRadius: 12, padding: 12, marginBottom: 6 }}>
                    <p style={{
                      fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14,
                      color: '#1A1A1A', marginBottom: 2,
                    }}>
                      {item.name}
                    </p>
                    <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#6B7066' }}>
                      {item.grams}g · {item.calories} cal · {item.protein_g}g protein
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* NOTES */}
          {payloadNotes && payloadNotes.trim() && (
            <>
              <p style={SECTION_LABEL}>Notes</p>
              <p style={{
                fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#6B7066',
                lineHeight: 1.6, marginBottom: 24,
              }}>
                {payloadNotes}
              </p>
            </>
          )}

          {/* Edit CTA */}
          <button
            onClick={() => enterEditMode(meal)}
            style={{
              width: '100%', height: 48, borderRadius: 24,
              backgroundColor: '#1E8A4F', border: 'none', cursor: 'pointer',
              color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
              fontSize: 15, marginBottom: 16,
            }}
          >
            Edit meal
          </button>

          {/* Delete link */}
          <button
            onClick={handleDelete}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#C44536', fontFamily: 'Lato, sans-serif', fontSize: 13,
              width: '100%', textAlign: 'center', padding: '4px 0',
            }}
          >
            🗑 Delete meal
          </button>
        </>
      )}
    </div>
  );
}
