import { getSupabase } from './supabase-browser';

/**
 * Reads the current authenticated user ID directly from the Supabase auth session.
 * Use this in all save handlers instead of profile.id from context,
 * to ensure the token is current and not stale.
 */
export async function getAuthUserId(): Promise<string | null> {
  const { data: { session } } = await getSupabase().auth.getSession();
  return session?.user?.id ?? null;
}
