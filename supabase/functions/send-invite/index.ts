import { corsHeaders, errorResponse, getServiceClient, getUserClient, jsonResponse } from '../_shared/supabase.ts';

const RESEND_API = 'https://api.resend.com/emails';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = getUserClient(authHeader);

  // Verify admin role
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const supabase = getServiceClient();
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'admin') return errorResponse('Forbidden', 'FORBIDDEN', 403);

  try {
    const { email, first_name } = await req.json();
    if (!email || !first_name) return errorResponse('email and first_name are required', 'MISSING_FIELDS');

    const token = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await supabase.from('invite_tokens').insert({
      token,
      email,
      first_name,
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    });

    const inviteUrl = `${Deno.env.get('APP_URL') ?? 'https://fastwellapp.com'}/invite/${token}`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: 'Lato', Arial, sans-serif; background: #F4FAF0; padding: 32px; color: #2C4A1A;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 40px; border: 1px solid #C8DFB0;">
    <h1 style="font-family: Montserrat, sans-serif; color: #5C8A34; font-size: 24px; margin-bottom: 8px;">Fastwell</h1>
    <p style="font-size: 16px; line-height: 1.6;">Hi ${first_name},</p>
    <p style="font-size: 16px; line-height: 1.6;">Wick here. I've built something for our community — and I'd love for you to be one of the first to use it.</p>
    <p style="font-size: 16px; line-height: 1.6;">Fastwell is your personal health companion. Track your fasting, sleep, energy, and biomarkers — all in one place, built for women like you.</p>
    <p style="font-size: 16px; line-height: 1.6;">Your first 3 months are completely free. After that, as a Wicked Wellbeing member, you'll always get 50% off.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="${inviteUrl}" style="background: #5C8A34; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-family: Montserrat, sans-serif; font-weight: 700; font-size: 15px;">JOIN FASTWELL — FREE FOR 3 MONTHS</a>
    </div>
    <p style="font-size: 13px; color: #7A9A6A;">This link is just for you and expires in 7 days.</p>
    <p style="font-size: 16px; line-height: 1.6; margin-top: 32px;">See you inside,<br><strong>Wick</strong></p>
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
        subject: `You're invited to Fastwell — 3 months free, ${first_name}`,
        html: emailHtml,
      }),
    });

    const resendData = await resendResp.json();

    await supabase.from('email_log').insert({
      email_type: 'invite',
      to_email: email,
      resend_id: resendData.id ?? null,
      failed: !resendResp.ok,
      error: resendResp.ok ? null : JSON.stringify(resendData),
    });

    return jsonResponse({ sent: true, expires_at: expiresAt.toISOString() });
  } catch (e) {
    console.error('send-invite error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
