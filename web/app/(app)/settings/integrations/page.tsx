'use client';

import { BackChip } from '../_components';

// ─── Icons ────────────────────────────────────────────────────────────────────

function HeartIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M11 19s-8-5.25-8-10.5A5 5 0 0111 5.5a5 5 0 018 3c0 5.25-8 10.5-8 10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function WatchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="7" y="5" width="8" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 5V3h4v2M9 17v2h4v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 9v3l2 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RingIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="11" cy="11" r="3.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function BandIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <rect x="5" y="7" width="12" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7V4h6v3M8 15v3h6v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Integration items ────────────────────────────────────────────────────────

const AVAILABLE = [
  {
    icon: <HeartIcon />,
    name: 'Apple Health',
    sub: 'Sync steps, sleep, weight, and heart rate from your Health app',
  },
  {
    icon: <WatchIcon />,
    name: 'Garmin Connect',
    sub: 'Sync activity, sleep, HRV, and body battery from your Garmin device',
  },
];

const COMING_SOON = [
  {
    icon: <RingIcon />,
    name: 'Oura Ring',
    sub: 'Sleep, readiness, and activity — in testing',
  },
  {
    icon: <BandIcon />,
    name: 'Fitbit',
    sub: 'Activity, heart rate, and sleep — in testing',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsIntegrationsPage() {
  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 26, color: 'var(--text)', margin: '16px 0 6px' }}>
        Integrations
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.5 }}>
        Connect your devices so Fastwell reads your existing data — no double logging.
      </p>

      {/* Available section */}
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        Available in v1.1
      </p>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 28 }}>
        {AVAILABLE.map((item, i) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px',
              borderBottom: i < AVAILABLE.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ color: 'var(--primary)', flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>
                {item.name}
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {item.sub}
              </p>
            </div>
            <span style={{
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 700,
              fontSize: 11,
              color: 'var(--text-muted)',
              background: 'var(--bg)',
              border: '1px solid var(--border)',
              padding: '4px 10px',
              borderRadius: 20,
              flexShrink: 0,
              letterSpacing: '0.06em',
            }}>
              Soon
            </span>
          </div>
        ))}
      </div>

      {/* Coming soon section */}
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
        Coming later
      </p>
      <div style={{ borderRadius: 16, overflow: 'hidden', background: 'var(--surface)', marginBottom: 28, opacity: 0.5 }}>
        {COMING_SOON.map((item, i) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '16px',
              borderBottom: i < COMING_SOON.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>
                {item.name}
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {item.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
        Manual logging always works perfectly while integrations roll out.
      </p>
    </div>
  );
}
