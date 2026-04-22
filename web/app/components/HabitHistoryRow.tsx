'use client';

import { useState } from 'react';

interface HabitHistoryRowProps {
  id: string;
  dateLabel: string;
  valueLabel: string;
  onDelete: (id: string) => void | Promise<void>;
}

export default function HabitHistoryRow({ id, dateLabel, valueLabel, onDelete }: HabitHistoryRowProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this entry?')) return;
    setDeleting(true);
    await onDelete(id);
    setDeleting(false);
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 16px',
    }}>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: '#6B7066' }}>{dateLabel}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: '#1E8A4F' }}>{valueLabel}</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          aria-label="Delete entry"
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: deleting ? 'default' : 'pointer',
            marginLeft: 8, opacity: deleting ? 0.4 : 1, flexShrink: 0,
          }}
          onMouseEnter={e => { if (!deleting) (e.currentTarget.firstElementChild as SVGElement).style.stroke = '#1A1A1A'; }}
          onMouseLeave={e => { (e.currentTarget.firstElementChild as SVGElement).style.stroke = '#6B7066'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B7066" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
