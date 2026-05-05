'use client';

import { useRef, useState } from 'react';

function isoDate(d: Date) {
  return d.toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

const DAY_ABBRS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

export function DateScroller({
  completedDates,
  selectedDate,
  onDateSelect,
}: {
  completedDates?: Set<string>;
  selectedDate: string;
  onDateSelect: (date: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);
  const touchStartX = useRef(0);

  const today = new Date();
  const todayStr = isoDate(today);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + weekOffset * 7 - 6 + i);
    return d;
  });

  const completed = completedDates ?? new Set<string>();

  return (
    <div
      style={{ marginBottom: 8 }}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx < -50) setWeekOffset(o => o - 1);
        else if (dx > 50 && weekOffset < 0) setWeekOffset(o => o + 1);
      }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map(d => {
          const str = isoDate(d);
          const isToday = str === todayStr;
          const isSelected = str === selectedDate;
          const hasData = completed.has(str);
          const isFuture = str > todayStr;
          return (
            <div
              key={str}
              role="button"
              tabIndex={0}
              aria-label={str}
              onClick={() => !isFuture && onDateSelect(str)}
              onKeyDown={e => e.key === 'Enter' && !isFuture && onDateSelect(str)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                cursor: isFuture ? 'default' : 'pointer',
              }}
            >
              <span style={{
                fontFamily: 'Montserrat, sans-serif', fontWeight: 600,
                fontSize: 11, color: '#6B7066',
              }}>
                {DAY_ABBRS[d.getDay()]}
              </span>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: '50%',
                backgroundColor: isSelected ? '#1E8A4F' : hasData ? '#D9ECE0' : 'transparent',
                border: isSelected ? 'none' : isToday ? '2px solid #1E8A4F' : hasData ? 'none' : '1.5px solid #E8E4D9',
              }}>
                <span style={{
                  fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 13,
                  color: isSelected ? '#FFFFFF' : isToday ? '#1E8A4F' : hasData ? '#1E8A4F' : '#6B7066',
                }}>
                  {d.getDate()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {weekOffset < 0 && (
        <p style={{
          textAlign: 'center', marginTop: 8, fontSize: 11,
          color: 'var(--text-muted)', fontFamily: 'Lato, sans-serif',
        }}>
          Swipe right to return to this week
        </p>
      )}
    </div>
  );
}
