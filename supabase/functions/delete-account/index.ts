import Stripe from 'https://esm.sh/stripe@14?target=deno';
import {
  corsHeaders,
  errorResponse,
  getServiceClient,
  getUserClient,
  jsonResponse,
} from '../_shared/supabase.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  // 1. Verify the requesting user's JWT
  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = getUserClient(authHeader);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const serviceClient = getServiceClient();

  try {
    // 2. Fetch profile for Stripe info before any deletion
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    // 3. NULL out RESTRICT FK columns so deletion is not blocked
    //    invite_tokens.created_by and membership_whitelist.added_by have no ON DELETE
    //    clause, which defaults to RESTRICT in PostgreSQL.
    await serviceClient
      .from('invite_tokens')
      .update({ created_by: null })
      .eq('created_by', user.id);

    await serviceClient
      .from('membership_whitelist')
      .update({ added_by: null })
      .eq('added_by', user.id);

    // 4. Cancel Stripe subscription if active — non-fatal if it fails
    //    (subscription may already be cancelled or not exist in Stripe)
    if (profile?.stripe_subscription_id) {
      try {
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
          apiVersion: '2024-06-20',
        });
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      } catch (stripeErr) {
        console.error('Stripe cancel failed (proceeding with account deletion):', stripeErr);
      }
    }

    // 5. Delete the auth user — cascades:
    //    auth.users → profiles → fasting_sessions, health_entries, symptoms_log,
    //    biomarkers, supplements, fasting_plans, ai_insights, user_badges,
    //    integration_tokens, notifications_log, food_logs (all ON DELETE CASCADE)
    //    email_log.user_id is SET NULL (audit rows remain, user_id nulled)
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('auth.admin.deleteUser failed:', deleteError);
      return errorResponse(
        'Account deletion failed. Please try again or contact support at wick@wickedwellbeing.com.',
        'DELETE_FAILED',
        500,
      );
    }

    return jsonResponse({ success: true });

  } catch (e) {
    console.error('delete-account unexpected error:', e);
    return errorResponse('An unexpected error occurred.', 'INTERNAL_ERROR', 500);
  }
});
