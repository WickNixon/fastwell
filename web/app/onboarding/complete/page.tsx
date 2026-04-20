'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getSupabase } from '@/lib/supabase-browser';

export default function OnboardingCompletePage() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const name = profile?.first_name ?? 'there';

  const handleGo = async () => {
    if (profile) {
      await getSupabase().from('user_badges').upsert({
        user_id: profile.id,
        badge_key: 'you_showed_up',
        earned_at: new Date().toISOString(),
        seen: false,
      }, { onConflict: 'user_id,badge_key' });
    }
    await refreshProfile();
    router.push('/dashboard');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1E8A4F',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '52px 24px 40px',
      maxWidth: 480,
      margin: '0 auto',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

      {/* Checkmark icon */}
      <div style={{ width: 68, height: 68, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28, fontSize: 36 }}>
        ✓
      </div>

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 30, color: '#FFFFFF', marginBottom: 14, letterSpacing: '-0.01em' }}>
        You&apos;re all set, {name} 🎉
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 16, color: 'rgba(255,255,255,0.82)', marginBottom: 40, lineHeight: 1.55 }}>
        Let&apos;s make Fastwell yours. A few quick questions so we can personalise everything.
      </p>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', marginBottom: 40 }}>
        {[
          { value: '3 mo', label: 'Free trial' },
          { value: '20+', label: 'Habits' },
          { value: '24/7', label: 'Support' },
        ].map(stat => (
          <div key={stat.label} style={{ backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 8px', textAlign: 'center' }}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 18, color: '#FFFFFF', lineHeight: 1 }}>{stat.value}</p>
            <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <button
        onClick={handleGo}
        style={{
          width: '100%',
          height: 56,
          borderRadius: 28,
          backgroundColor: '#E2682A',
          color: '#FFFFFF',
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 600,
          fontSize: 16,
          border: 'none',
          cursor: 'pointer',
          marginBottom: 16,
          boxShadow: '0 6px 14px rgba(226,104,42,0.35)',
        }}
      >
        Let&apos;s personalise it.
      </button>

      <button
        onClick={handleGo}
        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontFamily: 'Lato, sans-serif', fontSize: 13, cursor: 'pointer' }}
      >
        Skip for now.
      </button>
    </div>
  );
}
