import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase-server';

export default async function RootPage() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single();
      if (profile?.onboarding_complete) {
        redirect('/dashboard');
      } else {
        redirect('/onboarding/name');
      }
    }
  } catch {}
  redirect('/login');
}
