'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

// ─── BackChip ────────────────────────────────────────────────────────────────

export function BackChip() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      style={{
        width: 36, height: 36, borderRadius: 18,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0,
      }}
    >
      <ChevronLeft />
    </button>
  );
}

// ─── Chevron right (row indicator) ───────────────────────────────────────────

export function ChevronRight() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden>
      <path d="M1 1l6 6-6 6" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Chevron left (back chip) ─────────────────────────────────────────────────

function ChevronLeft() {
  return (
    <svg width="8" height="14" viewBox="0 0 8 14" fill="none" aria-hidden>
      <path d="M7 1L1 7l6 6" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── SettingsGroup ────────────────────────────────────────────────────────────

export function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      borderRadius: 16,
      overflow: 'hidden',
      background: 'var(--surface)',
    }}>
      {children}
    </div>
  );
}

// ─── SettingsRow ──────────────────────────────────────────────────────────────

interface SettingsRowProps {
  icon?: React.ReactNode;
  label: string;
  /** If provided, renders a Link to this href. If omitted, renders a plain div (non-navigable). */
  href?: string;
  /** Replaces the default chevron on the right. Pass null to suppress the chevron. */
  right?: React.ReactNode | null;
  /** Orange destructive variant — no icon needed; label is accent-coloured. */
  destructive?: boolean;
  /** Whether to show the bottom divider (false on the last row of a group). */
  divider?: boolean;
  onClick?: () => void;
}

export function SettingsRow({
  icon,
  label,
  href,
  right,
  destructive = false,
  divider = true,
  onClick,
}: SettingsRowProps) {
  const inner = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      height: 56, padding: '0 16px',
      background: 'var(--surface)',
      borderBottom: divider ? '1px solid var(--border)' : 'none',
      cursor: href || onClick ? 'pointer' : 'default',
    }}>
      {icon && (
        <div style={{
          width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          color: destructive ? 'var(--accent)' : 'var(--text-muted)',
        }}>
          {icon}
        </div>
      )}
      <span style={{
        flex: 1,
        fontFamily: 'Lato, sans-serif', fontSize: 15, fontWeight: 400,
        color: destructive ? 'var(--accent)' : 'var(--text)',
      }}>
        {label}
      </span>
      {right !== null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {right !== undefined ? right : <ChevronRight />}
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} style={{ display: 'block', textDecoration: 'none' }}>{inner}</Link>;
  }
  if (onClick) {
    return <button onClick={onClick} style={{ display: 'block', width: '100%', background: 'none', border: 'none', padding: 0, textAlign: 'left' }}>{inner}</button>;
  }
  return inner;
}

// ─── TierPill ─────────────────────────────────────────────────────────────────

export function TierPill({ tier }: { tier: string | null | undefined }) {
  if (!tier || tier === 'free') return null;
  const label = tier === 'member_pro' ? 'Member' : 'Pro';
  return (
    <span style={{
      fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 11,
      color: 'var(--primary)', background: 'var(--primary-pale)',
      padding: '3px 8px', borderRadius: 20,
    }}>
      {label}
    </span>
  );
}
