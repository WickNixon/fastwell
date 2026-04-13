import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { corsHeaders, errorResponse, getServiceClient, getUserClient, jsonResponse } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = getUserClient(authHeader);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  try {
    const { plan } = await req.json();
    if (!plan || !['monthly', 'annual'].includes(plan)) {
      return errorResponse('plan must be "monthly" or "annual"', 'INVALID_PLAN');
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const supabase = getServiceClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, first_name')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: profile?.first_name ?? undefined,
        metadata: { user_id: user.id, tier: 'subscriber' },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    const priceId = plan === 'monthly'
      ? Deno.env.get('STRIPE_PRICE_ID_SUBSCRIBER_MONTHLY')!
      : Deno.env.get('STRIPE_PRICE_ID_SUBSCRIBER_ANNUAL')!;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_collection: 'if_required',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 14, metadata: { user_id: user.id, tier: 'subscriber' } },
      success_url: `${Deno.env.get('APP_URL') ?? 'https://fastwellapp.com'}/subscription/success`,
      cancel_url: `${Deno.env.get('APP_URL') ?? 'https://fastwellapp.com'}/subscription/cancel`,
      metadata: { user_id: user.id, tier: 'subscriber' },
    });

    return jsonResponse({ url: session.url });
  } catch (e) {
    console.error('create-subscriber-checkout error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
