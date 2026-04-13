import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { corsHeaders, errorResponse, getServiceClient, jsonResponse } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const { token, password } = await req.json();
    if (!token || !password) return errorResponse('Token and password are required', 'MISSING_FIELDS');

    const supabase = getServiceClient();

    // Validate token
    const { data: invite, error: inviteError } = await supabase
      .from('invite_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (inviteError || !invite) return jsonResponse({ success: false, reason: 'not_found' }, 400);
    if (invite.is_used) return jsonResponse({ success: false, reason: 'used' }, 400);
    if (new Date(invite.expires_at) < new Date()) return jsonResponse({ success: false, reason: 'expired' }, 400);

    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: invite.email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return errorResponse(authError?.message ?? 'Failed to create user', 'AUTH_ERROR', 500);
    }

    const userId = authData.user.id;
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 90);

    // Create Stripe customer + subscription with 90-day trial and 50% forever coupon
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });

    const customer = await stripe.customers.create({
      email: invite.email,
      name: invite.first_name,
      metadata: { user_id: userId, tier: 'member' },
    });

    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: Deno.env.get('STRIPE_PRICE_ID_MEMBER_MONTHLY')! }],
      trial_period_days: 90,
      discounts: [{ coupon: Deno.env.get('STRIPE_COUPON_MEMBER_50_FOREVER')! }],
      metadata: { user_id: userId, tier: 'member' },
    });

    // Update profile
    await supabase.from('profiles').upsert({
      id: userId,
      subscription_tier: 'member',
      subscription_status: 'trialing',
      trial_ends_at: trialEndsAt.toISOString(),
      stripe_customer_id: customer.id,
      stripe_subscription_id: subscription.id,
    });

    // Mark token used
    await supabase
      .from('invite_tokens')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('token', token);

    return jsonResponse({ success: true, user_id: userId });
  } catch (e) {
    console.error('create-member-account error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
