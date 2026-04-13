# WEBHOOK_SPEC.md — Fastwell

## Overview

Fastwell uses Stripe webhooks for subscription events, Supabase database triggers for gamification, and Resend for all transactional email. All webhook handlers are Supabase Edge Functions.

---

## Stripe Webhooks

### Endpoint
```
POST https://[project-ref].supabase.co/functions/v1/stripe-webhook
```

### Signature Verification (always required)
```typescript
const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

### Events We Handle

#### `checkout.session.completed`
1. Identify tier from metadata (`tier: 'member' | 'subscriber'`)
2. Set `subscription_tier`, `subscription_status: 'trialing'`
3. Store `stripe_customer_id` and `stripe_subscription_id`
4. Send welcome push notification

#### `customer.subscription.trial_will_end`
Stripe fires 3 days before trial ends.
1. Look up user by `stripe_customer_id`
2. If `subscriber` AND `trial_reminder_sent = false` → send subscriber trial email via Resend
3. Member 7-day emails handled separately by Supabase cron

#### `customer.subscription.updated`
1. Update `subscription_status` in profiles
2. If `active` (trial converted) → push "You're all set"
3. If `past_due` → push payment nudge

#### `customer.subscription.deleted`
1. Set `subscription_tier: 'inactive'`, `subscription_status: 'canceled'`
2. Push + Resend: kind farewell message

#### `invoice.payment_failed`
1. Set `subscription_status: 'past_due'`
2. Push notification + Resend payment failed email
3. Stripe retries automatically

---

## Resend Email Templates

All sent from `hello@wickedwellbeing.com`. All logged in `email_log` table.

### Email 1 — Member Invite
**Trigger:** Coach clicks "Send Invite"
**Subject:** "You're invited to Fastwell — 3 months free, [Name]"
```
Hi [Name],

Wick here. I've built something for our community — and I'd love 
for you to be one of the first to use it.

Fastwell is your personal health companion. Track your fasting, sleep, 
energy, and biomarkers — all in one place, built for women like you.

Your first 3 months are completely free. After that, as a Wicked 
Wellbeing member, you'll always get 50% off.

[JOIN FASTWELL — FREE FOR 3 MONTHS]

This link is just for you and expires in 7 days.

See you inside,
Wick
```

### Email 2 — Subscriber Trial Ending (3 days before day 15)
**Trigger:** Stripe `customer.subscription.trial_will_end` (subscriber tier)
**Subject:** "Your Fastwell trial ends in 3 days, [Name]"
```
Hi [Name],

Your 14-day Fastwell trial is almost up.

  Monthly — $18.99 NZD/month
  Annual  — $159.52 NZD/year · Save 30%

Your progress and badges are all saved and waiting for you.

[CONTINUE WITH ANNUAL — BEST VALUE]
[OR CHOOSE MONTHLY]

Did you know? Wicked Wellbeing members get 50% off Fastwell — 
plus weekly coaching calls and a community of women just like you.
[Find out more →]

The Fastwell team
```

### Email 3 — Member Trial Ending (7 days before day 90)
**Trigger:** Supabase cron
**Subject:** "Your free access is almost up, [Name]"
```
Hi [Name],

Three months ago you joined Fastwell. A lot has happened since then.

Your free access ends in 7 days. As a Wicked Wellbeing member, 
you get 50% off — forever.

  Monthly — $9.50 NZD/month
  Annual  — $79.76 NZD/year

[CONTINUE AT 50% OFF]

Any questions? Just reply to this email.
Wick
```

### Email 4 — Password Reset
**Trigger:** Forgot password request (email in system only — never sent if not registered)
**Subject:** "Reset your Fastwell password"
```
Hi,

We received a request to reset your Fastwell password.
This link expires in 1 hour.

[RESET MY PASSWORD]

If you didn't request this, you can safely ignore this email.

The Fastwell team
```

### Email 5 — Payment Failed
**Trigger:** Stripe `invoice.payment_failed`
**Subject:** "We couldn't process your payment, [Name]"
```
Hi [Name],

Something went wrong with your Fastwell payment — don't worry, 
these things happen. Your access is paused until we sort this out.

[UPDATE PAYMENT DETAILS]

Your data and progress are safe.

The Fastwell team
```

---

## Supabase Cron Jobs

### Member trial ending check (daily, 9am NZST)
```typescript
// Find: trial_ends_at BETWEEN NOW()+6d AND NOW()+8d
//       AND subscription_tier = 'member'
//       AND trial_reminder_sent = false
// → Send Email 3 via Resend
// → Set trial_reminder_sent = true
```

### AI insights generation (daily, 6am NZST)
```typescript
// Find active users with expired insight cache AND 7+ days of data
// → Call generate-insights Edge Function per user
// → Insert new rows into ai_insights (expires_at: +24 hours)
```

### Garmin sync (every 6 hours)
```typescript
// For each user with active Garmin token:
//   Refresh token if needed → fetch last 2 days
//   Upsert into health_entries (source: 'garmin')
//   Update last_sync_at
//   After 3 failures: push user to reconnect
```

---

## Database Triggers

### On `fasting_sessions` — fast completed
```sql
-- If duration_minutes >= 1440 → award badge 'deep_fast'
```

### On `biomarkers` — HbA1c logged
```sql
-- Compare to first HbA1c reading
-- If improved → award badge 'hba1c_improved'
-- If not → no automated action
```

### On `user_badges` insert
```sql
-- Send push notification via Expo Push API
-- Set seen: false (triggers celebration screen on next open)
```

### On `profiles` — onboarding_complete = true
```sql
-- Award badge 'onboarding_complete'
-- Send welcome push
```

---

## Gamification Edge Function

```typescript
async function awardBadge(userId: string, badgeKey: string) {
  const { data: existing } = await supabase
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_key', badgeKey)
    .single();

  if (existing) return; // One-time only

  const badge = BADGE_REGISTRY[badgeKey];
  await supabase.from('user_badges').insert({
    user_id: userId,
    badge_key: badgeKey,
    badge_name: badge.name,
    seen: false,
  });
  await sendPushNotification(userId, { title: badge.name, body: badge.message });
}
```

---

## AI Insights Edge Function

```typescript
// supabase/functions/generate-insights/index.ts
import Anthropic from '@anthropic-ai/sdk';
const client = new Anthropic();

async function generateInsights(userId: string) {
  const profile = await getProfile(userId);
  const data = await getLast30DaysData(userId);

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 300,
    system: `You are the insight engine for Fastwell, a health tracking app 
for women in menopause. Generate 1–3 short insight cards.
Rules: use first name, max 2 sentences each, reference real numbers,
warm observational tone, no medical advice, return JSON array of strings only.`,
    messages: [{ role: 'user', content: buildDataSummary(profile, data) }],
  });

  const insights = JSON.parse(message.content[0].text);

  await supabase.from('ai_insights').delete()
    .eq('user_id', userId).lt('expires_at', new Date().toISOString());

  for (const insight of insights) {
    await supabase.from('ai_insights').insert({
      user_id: userId,
      insight_text: insight,
      data_snapshot: data,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });
  }
}
```

---

## Retry Logic

- Stripe: retries failed deliveries up to 3 days automatically
- Resend: retry once; log failure to `email_log` if second attempt fails
- Garmin: retry next scheduled run; alert user after 3 consecutive failures
- AI insights: retry next daily cron; show no cards rather than error state
