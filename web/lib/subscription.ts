import type { Profile } from './types';

/**
 * The eight distinct views a user can be in on the subscription page.
 *
 * Derived from three independent facts:
 *   1. member_origin — who they are (owner / member / subscriber)
 *   2. access_state  — what Pro access they have right now (trial / pro / free / inactive)
 *   3. stripe_subscription_id — whether a paying Stripe subscription exists
 *
 * Single source of truth: the subscription page (and anything else) reads
 * this, not its own inline tier branches.
 */
export type SubView =
  | 'owner'              // role='admin' — permanent full access, never billed
  | 'member_trial'       // member in their 3-month free Pro trial
  | 'member_paying'      // member paying at 50% discount
  | 'member_free'        // member lapsed to Free (keeps 50% entitlement)
  | 'subscriber_trial'   // public user in their 14-day trial
  | 'subscriber_paying'  // public user paying at full price
  | 'subscriber_free'    // public user on Free / trial expired
  | 'inactive';          // access explicitly paused/inactive

export function resolveSubView(profile: Profile | null | undefined): SubView {
  // Safe fallback: null profile or missing fields → subscriber_free (safest, no crashes)
  if (!profile) return 'subscriber_free';

  // 1. Owner always wins — regardless of tier or Stripe state
  if (profile.role === 'admin') return 'owner';

  const origin = profile.member_origin;     // 'owner' | 'member' | 'subscriber' | null
  const state  = profile.access_state;      // 'trial' | 'pro' | 'free' | 'inactive' | null
  const hasStripe = !!profile.stripe_subscription_id;

  // 2. If new fields are populated, use them directly
  if (origin && state) {
    if (state === 'inactive') return 'inactive';

    if (origin === 'member') {
      if (state === 'trial')  return 'member_trial';
      if (state === 'pro')    return 'member_paying';
      return 'member_free'; // state === 'free'
    }

    if (origin === 'subscriber') {
      if (state === 'trial')  return 'subscriber_trial';
      if (state === 'pro')    return 'subscriber_paying';
      return 'subscriber_free'; // state === 'free'
    }
  }

  // 3. Backwards-compat fallback: new fields not yet set (pre-migration row or new signup
  //    before trigger is updated). Derive best-effort from old subscription_tier field.
  const tier = profile.subscription_tier ?? 'free';

  if (tier === 'member_pro') {
    // member_pro with Stripe → paying member; without → free member
    return hasStripe ? 'member_paying' : 'member_free';
  }
  if (tier === 'pro') {
    // Check if in trial via pro_trial_ends_at
    const trialEnd = profile.pro_trial_ends_at ? new Date(profile.pro_trial_ends_at) : null;
    if (trialEnd && trialEnd > new Date()) return 'subscriber_trial';
    return hasStripe ? 'subscriber_paying' : 'subscriber_free';
  }

  // tier === 'free' or anything unexpected
  return 'subscriber_free';
}

/** True if the user currently has Pro-level feature access. */
export function hasProAccess(profile: Profile | null | undefined): boolean {
  const view = resolveSubView(profile);
  return (
    view === 'owner' ||
    view === 'member_trial' ||
    view === 'member_paying' ||
    view === 'subscriber_trial' ||
    view === 'subscriber_paying'
  );
}

/** True if the user is a Wicked Wellbeing member (keeps 50% discount forever). */
export function isMemberOrigin(profile: Profile | null | undefined): boolean {
  if (!profile) return false;
  if (profile.role === 'admin') return true;
  if (profile.member_origin === 'member') return true;
  // Backwards compat
  return profile.subscription_tier === 'member_pro';
}
