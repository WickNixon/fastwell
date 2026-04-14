'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function OnboardingCompletePage() {
  const { profile, refreshProfile } = useAuth();
  const router = useRouter();
  const name = profile?.first_name ?? 'there';

  const handleGo = async () => {
    await refreshProfile();
    router.push('/dashboard');
  };

  return (
    <div className="onboard-page" style={{ justifyContent: 'center', textAlign: 'center' }}>
      <div style={{ fontSize: 56, marginBottom: 24 }}>🌿</div>
      <h1 className="h1 mb-12">You're all set, {name}.</h1>
      <h1 className="h1 mb-20" style={{ color: 'var(--primary)' }}>Welcome to Fastwell.</h1>
      <p className="body mb-12" style={{ color: 'var(--text-muted)' }}>
        Everything here is for you, at your pace.
      </p>
      <p className="body mb-40" style={{ color: 'var(--text-muted)' }}>
        Start wherever feels right.
      </p>
      <button className="btn btn-primary" onClick={handleGo}>
        Take me to my dashboard
      </button>
    </div>
  );
}
