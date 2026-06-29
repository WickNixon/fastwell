'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';
import { BackChip } from '../_components';

const MEDICAL_DISCLAIMER =
  'Fastwell is a personal health tracking tool, not a medical device. The information provided is for general wellness tracking only and is not medical advice, diagnosis, or treatment. Always consult your GP or a qualified healthcare professional before making changes to your diet, medication, or health routine.';

const CATEGORIES = [
  { key: 'everything', label: 'Everything' },
  { key: 'health', label: 'Health entries' },
  { key: 'fasting', label: 'Fasting history' },
  { key: 'biomarkers', label: 'Biomarkers' },
  { key: 'meals', label: 'Meals' },
  { key: 'profile', label: 'Profile & goals' },
] as const;

type Category = typeof CATEGORIES[number]['key'];

interface ExportData {
  profile: Record<string, unknown> | null;
  healthEntries: Record<string, unknown>[];
  symptomsLog: Record<string, unknown>[];
  fastingSessions: Record<string, unknown>[];
  biomarkers: Record<string, unknown>[];
  foodLogs: Record<string, unknown>[];
  userBadges: Record<string, unknown>[];
}

async function fetchData(userId: string, category: Category): Promise<ExportData> {
  const sb = getSupabase();
  const empty: ExportData = {
    profile: null, healthEntries: [], symptomsLog: [],
    fastingSessions: [], biomarkers: [], foodLogs: [], userBadges: [],
  };

  const all = category === 'everything';

  const [
    profileRes, healthRes, symptomsRes, fastingRes, bioRes, foodRes, badgesRes,
  ] = await Promise.all([
    (all || category === 'profile')
      ? sb.from('profiles').select('first_name, full_name, date_of_birth, menopause_stage, has_regular_cycle, on_hrt, primary_goal, weight_unit, timezone').eq('id', userId).single()
      : Promise.resolve({ data: null }),
    (all || category === 'health')
      ? sb.from('health_entries').select('entry_date, metric, value, value_text, unit, memo').eq('user_id', userId).order('entry_date')
      : Promise.resolve({ data: [] }),
    (all || category === 'health')
      ? sb.from('symptoms_log').select('entry_date, symptom, severity, notes').eq('user_id', userId).order('entry_date')
      : Promise.resolve({ data: [] }),
    (all || category === 'fasting')
      ? sb.from('fasting_sessions').select('started_at, ended_at, duration_minutes, protocol, mood, notes').eq('user_id', userId).order('started_at')
      : Promise.resolve({ data: [] }),
    (all || category === 'biomarkers')
      ? sb.from('biomarkers').select('reading_date, marker, value, unit, notes').eq('user_id', userId).order('reading_date')
      : Promise.resolve({ data: [] }),
    (all || category === 'meals')
      ? sb.from('food_logs').select('logged_at, meal_type, meal_name, description, calories, protein_g, carbs_g, fat_g, fibre_g').eq('user_id', userId).order('logged_at')
      : Promise.resolve({ data: [] }),
    all
      ? sb.from('user_badges').select('badge_key, badge_name, earned_at').eq('user_id', userId).order('earned_at')
      : Promise.resolve({ data: [] }),
  ]);

  return {
    profile: profileRes.data ?? null,
    healthEntries: (healthRes.data ?? []) as Record<string, unknown>[],
    symptomsLog: (symptomsRes.data ?? []) as Record<string, unknown>[],
    fastingSessions: (fastingRes.data ?? []) as Record<string, unknown>[],
    biomarkers: (bioRes.data ?? []) as Record<string, unknown>[],
    foodLogs: (foodRes.data ?? []) as Record<string, unknown>[],
    userBadges: (badgesRes.data ?? []) as Record<string, unknown>[],
  };
}

function fmt(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' });
}

function val(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  return String(v);
}

// ─── PDF generation ───────────────────────────────────────────────────────────

async function generatePDF(data: ExportData, category: Category, firstName: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - margin * 2;
  let y = margin;

  const checkPage = (needed = 8) => {
    if (y + needed > pageH - margin) { doc.addPage(); y = margin; }
  };

  const heading1 = (text: string) => {
    checkPage(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(30, 138, 79);
    doc.text(text, margin, y);
    y += 8;
    doc.setDrawColor(209, 236, 224);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageW - margin, y);
    y += 5;
    doc.setTextColor(26, 26, 26);
  };

  const heading2 = (text: string) => {
    checkPage(10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(26, 26, 26);
    doc.text(text, margin, y);
    y += 6;
  };

  const bodyText = (text: string, indent = 0) => {
    checkPage(6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(107, 112, 102);
    const lines = doc.splitTextToSize(text, contentW - indent);
    doc.text(lines, margin + indent, y);
    y += lines.length * 4.5;
  };

  const tableRow = (cols: string[], widths: number[], bold = false) => {
    checkPage(7);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(9);
    doc.setTextColor(bold ? 26 : 55, bold ? 26 : 60, bold ? 26 : 55);
    let x = margin;
    cols.forEach((col, i) => {
      const lines = doc.splitTextToSize(col, widths[i] - 1);
      doc.text(lines[0] ?? '', x, y);
      x += widths[i];
    });
    y += 5.5;
    if (bold) {
      doc.setDrawColor(220, 220, 215);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageW - margin, y);
      y += 1;
    }
  };

  const gap = (n = 4) => { y += n; };

  // ─── Cover header ───────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(30, 138, 79);
  doc.text('Fastwell', margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(26, 26, 26);
  doc.text(firstName ? `Health export — ${firstName}` : 'Health export', margin, y);
  y += 6;

  doc.setFontSize(9);
  doc.setTextColor(107, 112, 102);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' })}`, margin, y);
  y += 4;
  const catLabel = CATEGORIES.find(c => c.key === category)?.label ?? 'Everything';
  doc.text(`Categories: ${catLabel}`, margin, y);
  y += 8;
  doc.setDrawColor(30, 138, 79);
  doc.setLineWidth(0.6);
  doc.line(margin, y, pageW - margin, y);
  y += 8;

  // ─── Profile & goals ────────────────────────────────────────────────────────
  if (data.profile && (category === 'everything' || category === 'profile')) {
    heading1('Profile & Goals');
    const p = data.profile;
    const rows: [string, string][] = [
      ['Name', val(p.full_name ?? p.first_name)],
      ['Date of birth', fmt(p.date_of_birth as string)],
      ['Stage', val(p.menopause_stage)],
      ['Regular cycle', val(p.has_regular_cycle)],
      ['HRT / Bioidenticals', val(p.on_hrt)],
      ['Primary goal', val(p.primary_goal)],
      ['Weight unit', val(p.weight_unit)],
      ['Timezone', val(p.timezone)],
    ];
    rows.forEach(([label, value]) => {
      tableRow([label, value], [50, contentW - 50]);
    });
    gap();
  }

  // ─── Health entries ─────────────────────────────────────────────────────────
  if (category === 'everything' || category === 'health') {
    heading1('Health Entries');
    if (data.healthEntries.length === 0 && data.symptomsLog.length === 0) {
      bodyText('No health entries recorded.');
    } else {
      if (data.healthEntries.length > 0) {
        heading2('Measurements & Habits');
        tableRow(['Date', 'Metric', 'Value', 'Unit'], [28, 50, 24, 24], true);
        data.healthEntries.forEach(h => {
          tableRow([
            fmt(h.entry_date as string),
            val(h.metric),
            val(h.value ?? h.value_text),
            val(h.unit),
          ], [28, 50, 24, 24]);
        });
        gap();
      }
      if (data.symptomsLog.length > 0) {
        heading2('Symptoms');
        tableRow(['Date', 'Symptom', 'Severity', 'Notes'], [28, 45, 22, contentW - 95], true);
        data.symptomsLog.forEach(s => {
          tableRow([
            fmt(s.entry_date as string),
            val(s.symptom),
            val(s.severity),
            val(s.notes),
          ], [28, 45, 22, contentW - 95]);
        });
        gap();
      }
    }
  }

  // ─── Fasting history ────────────────────────────────────────────────────────
  if (category === 'everything' || category === 'fasting') {
    heading1('Fasting History');
    if (data.fastingSessions.length === 0) {
      bodyText('No fasting sessions recorded.');
    } else {
      tableRow(['Date', 'Protocol', 'Duration', 'Mood', 'Notes'], [28, 28, 22, 22, contentW - 100], true);
      data.fastingSessions.forEach(s => {
        const dur = s.duration_minutes ? `${Math.round(Number(s.duration_minutes) / 60)}h` : '—';
        tableRow([
          fmt(s.started_at as string),
          val(s.protocol),
          dur,
          val(s.mood),
          val(s.notes),
        ], [28, 28, 22, 22, contentW - 100]);
      });
    }
    gap();
  }

  // ─── Biomarkers ─────────────────────────────────────────────────────────────
  if (category === 'everything' || category === 'biomarkers') {
    heading1('Biomarkers');
    if (data.biomarkers.length === 0) {
      bodyText('No biomarker readings recorded.');
    } else {
      tableRow(['Date', 'Marker', 'Value', 'Unit', 'Notes'], [28, 42, 20, 20, contentW - 110], true);
      data.biomarkers.forEach(b => {
        tableRow([
          fmt(b.reading_date as string),
          val(b.marker),
          val(b.value),
          val(b.unit),
          val(b.notes),
        ], [28, 42, 20, 20, contentW - 110]);
      });
    }
    gap();
  }

  // ─── Meals ──────────────────────────────────────────────────────────────────
  if (category === 'everything' || category === 'meals') {
    heading1('Meals');
    if (data.foodLogs.length === 0) {
      bodyText('No meal logs recorded.');
    } else {
      tableRow(['Date', 'Type', 'Name / Description', 'kcal', 'P(g)', 'C(g)', 'F(g)'], [24, 22, 52, 16, 14, 14, 14], true);
      data.foodLogs.forEach(f => {
        tableRow([
          fmt(f.logged_at as string),
          val(f.meal_type),
          val(f.meal_name ?? f.description),
          val(f.calories),
          val(f.protein_g),
          val(f.carbs_g),
          val(f.fat_g),
        ], [24, 22, 52, 16, 14, 14, 14]);
      });
    }
    gap();
  }

  // ─── Badges (Everything only) ────────────────────────────────────────────────
  if (category === 'everything' && data.userBadges.length > 0) {
    heading1('Achievements');
    tableRow(['Badge', 'Earned'], [90, contentW - 90], true);
    data.userBadges.forEach(b => {
      tableRow([val(b.badge_name), fmt(b.earned_at as string)], [90, contentW - 90]);
    });
    gap();
  }

  // ─── Disclaimer ─────────────────────────────────────────────────────────────
  checkPage(20);
  y += 4;
  doc.setDrawColor(220, 220, 215);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(107, 112, 102);
  doc.text('Medical Disclaimer', margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  const disclaimerLines = doc.splitTextToSize(MEDICAL_DISCLAIMER, contentW);
  doc.text(disclaimerLines, margin, y);

  // Download
  const name = firstName ? `fastwell-${firstName.toLowerCase().replace(/\s+/g, '-')}-export` : 'fastwell-export';
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── CSV generation ──────────────────────────────────────────────────────────

function toCSV(rows: unknown[][], headers: string[]): string {
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map(r => r.map(escape).join(',')).join('\n');
}

function generateCSV(data: ExportData, category: Category, firstName: string) {
  const sections: string[] = [];

  if (data.profile && (category === 'everything' || category === 'profile')) {
    const p = data.profile;
    sections.push('PROFILE & GOALS');
    sections.push(toCSV(
      [['Name', val(p.full_name ?? p.first_name)],
       ['Date of birth', val(p.date_of_birth)],
       ['Menopause stage', val(p.menopause_stage)],
       ['Regular cycle', val(p.has_regular_cycle)],
       ['On HRT', val(p.on_hrt)],
       ['Primary goal', val(p.primary_goal)],
       ['Weight unit', val(p.weight_unit)]],
      ['Field', 'Value'],
    ));
    sections.push('');
  }

  if (category === 'everything' || category === 'health') {
    if (data.healthEntries.length > 0) {
      sections.push('HEALTH ENTRIES');
      sections.push(toCSV(
        data.healthEntries.map(h => [fmt(h.entry_date as string), val(h.metric), val(h.value ?? h.value_text), val(h.unit), val(h.memo)]),
        ['Date', 'Metric', 'Value', 'Unit', 'Notes'],
      ));
      sections.push('');
    }
    if (data.symptomsLog.length > 0) {
      sections.push('SYMPTOMS');
      sections.push(toCSV(
        data.symptomsLog.map(s => [fmt(s.entry_date as string), val(s.symptom), val(s.severity), val(s.notes)]),
        ['Date', 'Symptom', 'Severity', 'Notes'],
      ));
      sections.push('');
    }
    if (data.healthEntries.length === 0 && data.symptomsLog.length === 0) {
      sections.push('HEALTH ENTRIES\n(no data)');
      sections.push('');
    }
  }

  if (category === 'everything' || category === 'fasting') {
    sections.push('FASTING HISTORY');
    if (data.fastingSessions.length === 0) {
      sections.push('(no data)');
    } else {
      sections.push(toCSV(
        data.fastingSessions.map(s => [
          fmt(s.started_at as string), fmt(s.ended_at as string),
          s.duration_minutes ? `${Math.round(Number(s.duration_minutes) / 60)}h` : '',
          val(s.protocol), val(s.mood), val(s.notes),
        ]),
        ['Started', 'Ended', 'Duration', 'Protocol', 'Mood', 'Notes'],
      ));
    }
    sections.push('');
  }

  if (category === 'everything' || category === 'biomarkers') {
    sections.push('BIOMARKERS');
    if (data.biomarkers.length === 0) {
      sections.push('(no data)');
    } else {
      sections.push(toCSV(
        data.biomarkers.map(b => [fmt(b.reading_date as string), val(b.marker), val(b.value), val(b.unit), val(b.notes)]),
        ['Date', 'Marker', 'Value', 'Unit', 'Notes'],
      ));
    }
    sections.push('');
  }

  if (category === 'everything' || category === 'meals') {
    sections.push('MEALS');
    if (data.foodLogs.length === 0) {
      sections.push('(no data)');
    } else {
      sections.push(toCSV(
        data.foodLogs.map(f => [
          fmt(f.logged_at as string), val(f.meal_type), val(f.meal_name ?? f.description),
          val(f.calories), val(f.protein_g), val(f.carbs_g), val(f.fat_g), val(f.fibre_g),
        ]),
        ['Date', 'Type', 'Name / Description', 'Calories', 'Protein(g)', 'Carbs(g)', 'Fat(g)', 'Fibre(g)'],
      ));
    }
    sections.push('');
  }

  const csv = sections.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const name = firstName ? `fastwell-${firstName.toLowerCase().replace(/\s+/g, '-')}-export` : 'fastwell-export';
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsExportPage() {
  const { user, profile } = useAuth();
  const [category, setCategory] = useState<Category>('everything');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const firstName = profile?.first_name ?? profile?.full_name?.split(' ')[0] ?? '';

  const handleExport = async (format: 'pdf' | 'csv') => {
    if (!user) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const data = await fetchData(user.id, category);
      if (format === 'pdf') {
        await generatePDF(data, category, firstName);
      } else {
        generateCSV(data, category, firstName);
      }
      setStatus('idle');
    } catch (e) {
      console.error('Export failed:', e);
      setErrorMsg('Something went wrong generating the export. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '16px 0 6px' }}>
        Export my data
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
        Download a copy of your Fastwell data.
      </p>

      {/* Category picker */}
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
        What to include
      </p>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 28 }}>
        {CATEGORIES.map(({ key, label }, i) => (
          <button
            key={key}
            onClick={() => setCategory(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: '100%',
              height: 52,
              padding: '0 16px',
              background: 'none',
              border: 'none',
              borderBottom: i < CATEGORIES.length - 1 ? '1px solid var(--border)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span style={{
              width: 20, height: 20, borderRadius: 10, flexShrink: 0,
              border: `2px solid ${category === key ? 'var(--primary)' : 'var(--border)'}`,
              background: category === key ? 'var(--primary)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {category === key && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
            <span style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)' }}>
              {label}
            </span>
          </button>
        ))}
      </div>

      {/* Error */}
      {errorMsg && (
        <div style={{ background: '#FFF3F0', border: '1px solid #FFCDD2', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: '#C62828' }}>{errorMsg}</p>
        </div>
      )}

      {/* PDF button (primary) */}
      <button
        onClick={() => handleExport('pdf')}
        disabled={status === 'loading'}
        style={{
          width: '100%',
          padding: '14px 20px',
          borderRadius: 14,
          border: 'none',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          background: status === 'loading' ? 'var(--border)' : 'var(--primary)',
          color: status === 'loading' ? 'var(--text-muted)' : '#fff',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 700,
          fontSize: 16,
          marginBottom: 12,
          transition: 'background 0.15s',
        }}
      >
        {status === 'loading' ? 'Preparing your export…' : 'Download PDF'}
      </button>

      {/* CSV button (secondary / quieter) */}
      <button
        onClick={() => handleExport('csv')}
        disabled={status === 'loading'}
        style={{
          width: '100%',
          padding: '12px 20px',
          borderRadius: 14,
          border: '1px solid var(--border)',
          cursor: status === 'loading' ? 'not-allowed' : 'pointer',
          background: 'transparent',
          color: 'var(--text-muted)',
          fontFamily: 'Lato, sans-serif',
          fontWeight: 400,
          fontSize: 14,
          transition: 'color 0.15s',
        }}
      >
        Download as CSV
      </button>

      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
        Your data stays on your device. Nothing is shared.
      </p>
    </div>
  );
}
