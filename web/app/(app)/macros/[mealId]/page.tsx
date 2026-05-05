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

export default function MealDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const mealId = params.mealId as string;
  const supabase = createClient();

  const [meal, setMeal] = useState<FoodLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

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
  const payloadNotes = meal.final_payload?.notes;
  const loggedAtTime = new Date(meal.logged_at).toLocaleTimeString('en-NZ', {
    timeZone: 'Pacific/Auckland', hour: 'numeric', minute: '2-digit', hour12: true,
  });

  return (
    <div className="page page-top">
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
        <button
          onClick={() => router.push('/macros')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif',
            fontWeight: 600, fontSize: 15, padding: '4px 0', marginRight: 'auto',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
          aria-label="Back to macros"
        >
          ← Back
        </button>
        <p style={{
          fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16,
          color: 'var(--text)', position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          Meal logged
        </p>
      </div>

      {/* Photo */}
      {meal.image_url && (
        <div style={{ marginBottom: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={meal.image_url}
            alt={meal.meal_name ?? 'Meal photo'}
            style={{
              width: '100%', aspectRatio: '1 / 1', objectFit: 'cover',
              borderRadius: 16,
            }}
          />
        </div>
      )}

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
      <p style={{
        fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11,
        color: '#6B7066', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10,
      }}>
        Totals
      </p>
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

      {/* ITEMS — only for multi-item meals */}
      {items.length > 1 && (
        <>
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11,
            color: '#6B7066', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Items
          </p>
          <div style={{ marginBottom: 24 }}>
            {items.map((item, i) => (
              <div key={i} style={{
                backgroundColor: '#F8F5EC', borderRadius: 12, padding: 12, marginBottom: 6,
              }}>
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
          <p style={{
            fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 11,
            color: '#6B7066', letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Notes
          </p>
          <p style={{
            fontFamily: 'Lato, sans-serif', fontSize: 13, color: '#6B7066',
            lineHeight: 1.6, marginBottom: 24,
          }}>
            {payloadNotes}
          </p>
        </>
      )}

      {/* Edit meal CTA */}
      <button
        onClick={() => setIsEditing(true)}
        style={{
          width: '100%', height: 48, borderRadius: 24,
          backgroundColor: '#1E8A4F', border: 'none', cursor: 'pointer',
          color: 'white', fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
          fontSize: 15, marginBottom: 16,
        }}
      >
        {isEditing ? 'Editing…' : 'Edit meal'}
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
    </div>
  );
}
