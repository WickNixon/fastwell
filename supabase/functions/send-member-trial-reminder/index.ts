// Edge Function: send-member-trial-reminder
// Called daily at 9am NZST via pg_cron
// Finds members whose trial ends in 7–8 days and sends Email 3

import { corsHeaders, getServiceClient, jsonResponse, errorResponse } from '../_shared/supabase.ts';

const RESEND_API = 'https://api.resend.com/emails';
const APP_URL = Deno.env.get('APP_URL') ?? 'https://fastwellapp.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  // Accept calls from pg_cron (no user auth) — validate cron secret instead
  const authHeader = req.headers.get('Authorization') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  if (!authHeader.includes(serviceKey.slice(-20))) {
    // Also allow requests with the service role key directly
    const cronSecret = Deno.env.get('CRON_SECRET');
    if (cronSecret && !authHeader.includes(cronSecret)) {
      return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);
    }
  }

  const supabase = getServiceClient();

  try {
    // Find members whose trial ends in 7–8 days and haven't been reminded yet
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() + 6);
    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 8);

    const { data: members, error } = await supabase
      .from('profiles')
      .select('id, first_name, trial_ends_at')
      .eq('subscription_tier', 'member')
      .eq('trial_reminder_sent', false)
      .gte('trial_ends_at', windowStart.toISOString())
      .lte('trial_ends_at', windowEnd.toISOString());

    if (error) throw error;
    if (!members || members.length === 0) {
      return jsonResponse({ processed: 0, message: 'No members due for reminder' });
    }

    let sent = 0;
    let failed = 0;

    for (const member of members) {
      const firstName = member.first_name ?? 'there';

      // Look up email from auth.users (profiles doesn't store email directly)
      const { data: authUser } = await supabase.auth.admin.getUserById(member.id);
      const email = authUser?.user?.email;
      if (!email) { failed++; continue; }

      const html = `
<!DOCTYPE html>
<html>
<body style="font-family: Lato, Arial, sans-serif; background: #F4FAF0; padding: 32px; color: #2C4A1A;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; border: 1px solid #C8DFB0;">
    <h1 style="font-family: Montserrat, sans-serif; color: #5C8A34; font-size: 22px; margin-bottom: 16px;">Fastwell</h1>
    <p style="font-size: 16px; line-height: 1.6;">Hi ${firstName},</p>
    <p style="font-size: 16px; line-height: 1.6;">Three months ago you joined Fastwell. A lot has happened since then.</p>
    <p style="font-size: 16px; line-height: 1.6;">Your free access ends in 7 days. As a Wicked Wellbeing member, you get 50% off — forever.</p>
    <table style="width: 100%; border: 1px solid #C8DFB0; border-radius: 8px; padding: 16px; border-collapse: separate; margin: 20px 0;">
      <tr>
        <td style="padding: 10px 14px;">Monthly</td>
        <td style="padding: 10px 14px; text-align: right;"><strong>$9.50 NZD/month</strong></td>
      </tr>
      <tr style="border-top: 1px solid #C8DFB0;">
        <td style="padding: 10px 14px;">Annual</td>
        <td style="padding: 10px 14px; text-align: right;"><strong>$79.76 NZD/year</strong></td>
      </tr>
    </table>
    <div style="text-align: center; margin: 28px 0;">
      <a href="${APP_URL}/settings/subscription" style="background: #5C8A34; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 15px;">CONTINUE AT 50% OFF</a>
    </div>
    <p style="font-size: 13px; color: #7A9A6A;">Any questions? Just reply to this email — I read every one.</p>
    <p style="font-size: 16px; line-height: 1.6; margin-top: 28px;">Warmly,<br><strong>Wick</strong></p>
  </div>
</body>
</html>`;

      const resendResp = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: Deno.env.get('EMAIL_FROM') ?? 'hello@wickedwellbeing.com',
          to: email,
          subject: `Your free access is almost up, ${firstName}`,
          html,
        }),
      });

      const resendData = await resendResp.json();

      await supabase.from('email_log').insert({
        user_id: member.id,
        email_type: 'trial_end_member',
        to_email: email,
        resend_id: resendData.id ?? null,
        failed: !resendResp.ok,
        error: resendResp.ok ? null : JSON.stringify(resendData),
      });

      if (resendResp.ok) {
        await supabase.from('profiles').update({ trial_reminder_sent: true }).eq('id', member.id);
        sent++;
      } else {
        failed++;
      }
    }

    return jsonResponse({ processed: members.length, sent, failed });
  } catch (e) {
    console.error('send-member-trial-reminder error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
