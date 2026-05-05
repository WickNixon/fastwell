export function todayNZ(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Pacific/Auckland' });
}

// Returns UTC ISO bounds that cover the full Pacific/Auckland calendar day for a YYYY-MM-DD string.
// Use this whenever filtering a TIMESTAMPTZ column (logged_at, created_at) by NZ calendar date.
export function nzDayBoundsUTC(date: string): { startUTC: string; endUTC: string } {
  const utcMidnight = new Date(`${date}T00:00:00.000Z`);
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Pacific/Auckland',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  }).formatToParts(utcMidnight);
  const h = parseInt(parts.find(p => p.type === 'hour')?.value ?? '12', 10);
  const m = parseInt(parts.find(p => p.type === 'minute')?.value ?? '0', 10);
  const adjustedH = h === 24 ? 0 : h;
  const nzMidnightMs = utcMidnight.getTime() - adjustedH * 3_600_000 - m * 60_000;
  return {
    startUTC: new Date(nzMidnightMs).toISOString(),
    endUTC: new Date(nzMidnightMs + 24 * 3_600_000 - 1).toISOString(),
  };
}

export function deriveMealCategory(timestamp: Date): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
  const nzHour = parseInt(
    timestamp.toLocaleString('en-NZ', {
      timeZone: 'Pacific/Auckland',
      hour: 'numeric',
      hour12: false,
    }),
    10
  );
  if (nzHour >= 5 && nzHour <= 10) return 'breakfast';
  if (nzHour >= 11 && nzHour <= 15) return 'lunch';
  if (nzHour >= 16 && nzHour <= 22) return 'dinner';
  return 'snack';
}
