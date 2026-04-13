import Stripe from 'https://esm.sh/stripe@14?target=deno';
import { corsHeaders, getServiceClient, jsonResponse } from '../_shared/supabase.ts';

const RESEND_API = 'https://api.resend.com/emails';

async function sendEmail(to: string, subject: string, html: string, emailType: string, userId: string | null, supabase: ReturnType<typeof getServiceClient>) {
  const resendResp = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('EMAIL_FROM') ?? 'hello@wickedwellbeing.com',
      to,
      subject,
      html,
    }),
  });

  const resendData = await resendResp.json();
  await supabase.from('email_log').insert({
    user_id: userId,
    email_type: emailType,
    to_email: to,
    resend_id: resendData.id ?? null,
    failed: !resendResp.ok,
    error: resendResp.ok ? null : JSON.stringify(resendData),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' });
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
  const signature = req.headers.get('stripe-signature') ?? '';
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook Error', { status: 400 });
  }

  const supabase = getServiceClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const tier = session.metadata?.tier;
      if (!userId) break;

      await supabase.from('profiles').update({
        subscription_tier: tier,
        subscription_status: 'trialing',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
      }).eq('id', userId);
      break;
    }

    case 'customer.subscription.trial_will_end': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      const tier = subscription.metadata?.tier;
      if (!userId || tier !== 'subscriber') break;

      const { data: profile } = await supabase
        .from('profiles')
        .select('trial_reminder_sent, first_name')
        .eq('id', userId)
        .single();

      if (profile?.trial_reminder_sent) break;

      const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
      const firstName = profile?.first_name ?? 'there';

      const html = `
<div style="font-family: Lato, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2C4A1A; padding: 32px;">
  <h2 style="font-family: Montserrat, sans-serif; color: #5C8A34;">Hi ${firstName},</h2>
  <p>Your 14-day Fastwell trial is almost up.</p>
  <table style="width: 100%; border: 1px solid #C8DFB0; border-radius: 8px; padding: 16px; border-collapse: separate;">
    <tr><td style="padding: 8px;">Monthly</td><td style="padding: 8px; text-align: right;"><strong>$18.99 NZD/month</strong></td></tr>
    <tr><td style="padding: 8px;">Annual</td><td style="padding: 8px; text-align: right;"><strong>$159.52 NZD/year · Save 30%</strong></td></tr>
  </table>
  <p>Your progress and badges are all saved and waiting for you.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${Deno.env.get('APP_URL') ?? 'https://fastwellapp.com'}/subscription" style="background: #D06820; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-family: Montserrat, sans-serif; font-weight: 700;">CONTINUE — BEST VALUE</a>
  </div>
  <p style="font-size: 13px; color: #7A9A6A;">Did you know? Wicked Wellbeing members get 50% off Fastwell — plus weekly coaching calls and a community of women just like you.</p>
  <p>The Fastwell team</p>
</div>`;

      await sendEmail(customer.email!, `Your Fastwell trial ends in 3 days, ${firstName}`, html, 'trial_end_subscriber', userId, supabase);
      await supabase.from('profiles').update({ trial_reminder_sent: true }).eq('id', userId);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      await supabase.from('profiles').update({
        subscription_status: subscription.status,
      }).eq('id', userId);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.user_id;
      if (!userId) break;

      await supabase.from('profiles').update({
        subscription_tier: 'inactive',
        subscription_status: 'canceled',
      }).eq('id', userId);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, first_name')
        .eq('stripe_customer_id', invoice.customer)
        .single();

      if (!profile) break;

      await supabase.from('profiles').update({ subscription_status: 'past_due' }).eq('id', profile.id);

      const firstName = profile.first_name ?? 'there';
      const html = `
<div style="font-family: Lato, Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #2C4A1A; padding: 32px;">
  <h2 style="font-family: Montserrat, sans-serif; color: #5C8A34;">Hi ${firstName},</h2>
  <p>Something went wrong with your Fastwell payment — don't worry, these things happen. Your access is paused until we sort this out.</p>
  <div style="text-align: center; margin: 24px 0;">
    <a href="${Deno.env.get('APP_URL') ?? 'https://fastwellapp.com'}/settings/subscription" style="background: #5C8A34; color: #fff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-family: Montserrat, sans-serif; font-weight: 700;">UPDATE PAYMENT DETAILS</a>
  </div>
  <p>Your data and progress are safe.</p>
  <p>The Fastwell team</p>
</div>`;

      await sendEmail(customer.email!, `We couldn't process your payment, ${firstName}`, html, 'payment_failed', profile.id, supabase);
      break;
    }

    default:
      console.log('Unhandled event type:', event.type);
  }

  return jsonResponse({ received: true });
});
