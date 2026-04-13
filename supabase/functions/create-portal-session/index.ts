import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { corsHeaders, errorResponse, getServiceClient, getUserClient, jsonResponse } from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = getUserClient(authHeader);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  try {
    const supabase = getServiceClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return errorResponse('No Stripe customer found', 'NO_CUSTOMER', 404);
    }

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${Deno.env.get('APP_URL') ?? 'https://fastwellapp.com'}/settings/subscription`,
    });

    return jsonResponse({ url: session.url });
  } catch (e) {
    console.error('create-portal-session error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
