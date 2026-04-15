import { getSupabase } from './supabase-browser';

/**
 * Module-level cache populated by auth-context as soon as the session resolves.
 * All save handlers call getAuthUserId() which returns this instantly — no
 * Supabase auth lock contention, no network calls, no hangs.
 */
let _cachedUserId: string | null = null;

export function setCachedUserId(id: string | null) {
  _cachedUserId = id;
}

export async function getAuthUserId(): Promise<string | null> {
  if (_cachedUserId) return _cachedUserId;
  // Fallback only: if called before auth-context has initialised,
  // attempt one getSession() call. Auth-context normally populates
  // the cache well before any save button is reachable.
  try {
    const { data: { session } } = await getSupabase().auth.getSession();
    _cachedUserId = session?.user?.id ?? null;
  } catch {
    _cachedUserId = null;
  }
  return _cachedUserId;
}
