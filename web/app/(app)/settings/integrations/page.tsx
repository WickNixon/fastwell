'use client';

import { useRouter } from 'next/navigation';

const INTEGRATIONS = [
  { icon: '🍎', name: 'Apple Health', sub: 'Steps, sleep, weight, heart rate', available: false },
  { icon: '⌚', name: 'Garmin Connect', sub: 'Steps, sleep, HRV, body battery', available: false },
  { icon: '💍', name: 'Oura Ring', sub: 'Sleep, readiness, activity', available: false },
];

export default function SettingsIntegrationsPage() {
  const router = useRouter();

  return (
    <div className="page page-top">
      <button onClick={() => router.back()} style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Lato, sans-serif' }}>← Back</button>
      <h1 className="h1 mb-8">Integrations</h1>
      <p className="body-sm mb-24">These will just make it easier — Fastwell reads your existing data so you're not logging twice.</p>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {INTEGRATIONS.map((item, i) => (
          <div key={item.name} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '16px',
            borderBottom: i < INTEGRATIONS.length - 1 ? '1px solid var(--border)' : 'none',
            opacity: item.available ? 1 : 0.65,
          }}>
            <div className="list-item-icon" style={{ fontSize: 22 }}>{item.icon}</div>
            <div style={{ flex: 1 }}>
              <p className="h3" style={{ fontSize: 15 }}>{item.name}</p>
              <p className="body-sm">{item.sub}</p>
            </div>
            <span className="badge badge-muted" style={{ fontSize: 10 }}>Coming soon</span>
          </div>
        ))}
      </div>

      <p className="body-sm text-center mt-20" style={{ color: 'var(--text-muted)' }}>
        Integrations are coming in v1.1. Manual logging always works perfectly.
      </p>
    </div>
  );
}
