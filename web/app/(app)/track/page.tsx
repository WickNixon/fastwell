'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

const LIFESTYLE = [
  { key: 'weight', label: 'Weight', icon: '⚖️', href: '/track/weight', metric: 'weight' },
  { key: 'sleep', label: 'Sleep', icon: '🌙', href: '/track/sleep', metric: 'sleep_hours' },
  { key: 'water', label: 'Water', icon: '💧', href: '/track/water', metric: 'water_ml' },
  { key: 'steps', label: 'Steps', icon: '👟', href: '/track/steps', metric: 'steps' },
  { key: 'exercise', label: 'Exercise', icon: '🏃‍♀️', href: '/track/exercise', metric: 'exercise_minutes' },
  { key: 'mood', label: 'Mood', icon: '🌿', href: '/track/mood', metric: 'mood' },
  { key: 'energy', label: 'Energy', icon: '⚡', href: '/track/energy', metric: 'energy' },
  { key: 'symptoms', label: 'Symptoms', icon: '📋', href: '/track/symptoms', metric: 'symptoms' },
];

const CLINICAL = [
  { key: 'hba1c', label: 'HbA1c', icon: '🩸', href: '/biomarkers/hba1c', sub: '3-month blood sugar average' },
  { key: 'glucose', label: 'Blood Glucose', icon: '💉', href: '/biomarkers/glucose', sub: 'Daily readings' },
  { key: 'ketones', label: 'Ketones', icon: '🔬', href: '/biomarkers/ketones', sub: 'Metabolic state' },
];

export default function TrackPage() {
  const { profile } = useAuth();
  const [loggedToday, setLoggedToday] = useState<Set<string>>(new Set());

  const loadToday = useCallback(async () => {
    if (!profile) return;
    const today = new Date().toISOString().split('T')[0];
    const { data } = await getSupabase()
      .from('health_entries')
      .select('metric')
      .eq('user_id', profile.id)
      .eq('entry_date', today);
    if (data) setLoggedToday(new Set(data.map(d => d.metric)));
  }, [profile]);

  useEffect(() => { loadToday(); }, [loadToday]);

  return (
    <div className="page page-top">
      <h1 className="h1 mb-8">Track</h1>
      <p className="body-sm mb-24">Everything here is optional. Track what matters to you.</p>

      <div className="section">
        <p className="section-label">Lifestyle</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {LIFESTYLE.map(item => {
            const logged = loggedToday.has(item.metric);
            return (
              <Link key={item.key} href={item.href}>
                <div className="card" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    backgroundColor: logged ? 'var(--primary)' : 'var(--primary-pale)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {logged ? '✓' : item.icon}
                  </div>
                  <div>
                    <p className="h3" style={{ fontSize: 14 }}>{item.label}</p>
                    {logged && <p style={{ fontSize: 11, color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>Logged today</p>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="section">
        <p className="section-label">Biomarkers</p>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {CLINICAL.map((item, i) => (
            <Link key={item.key} href={item.href}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 16px',
                borderBottom: i < CLINICAL.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
              }}>
                <div className="list-item-icon">{item.icon}</div>
                <div style={{ flex: 1 }}>
                  <p className="h3" style={{ fontSize: 14 }}>{item.label}</p>
                  <p className="body-sm">{item.sub}</p>
                </div>
                <span className="list-item-chevron">›</span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="section">
        <p className="section-label">Supplements & HRT</p>
        <Link href="/supplements">
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
            <div className="list-item-icon">💊</div>
            <div style={{ flex: 1 }}>
              <p className="h3" style={{ fontSize: 14 }}>Supplements & Medications</p>
              <p className="body-sm">HRT, bioidenticals, supplements</p>
            </div>
            <span className="list-item-chevron">›</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
