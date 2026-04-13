# API_SPEC.md — Fastwell

## Overview

Fastwell primarily uses Supabase's auto-generated REST API and Realtime via the Supabase JS SDK. Custom logic lives in Supabase Edge Functions.

All requests require a valid Supabase session token: `Authorization: Bearer [token]`

---

## Supabase Client (Standard Queries)

```typescript
const { data, error } = await supabase
  .from('health_entries')
  .select('*')
  .eq('user_id', userId)
  .eq('entry_date', today)
  .order('created_at', { ascending: false });
```

RLS policies enforce that users only access their own data.

---

## Edge Functions

Base URL: `https://[project-ref].supabase.co/functions/v1/`

---

### `POST /validate-invite`
Validates a member invite token before password creation.

**Request:** `{ "token": "uuid-string" }`

**Logic:** Check token exists, `is_used = false`, `expires_at > now()` → return email

**Response (valid):** `{ "valid": true, "email": "member@example.com" }`
**Response (invalid):** `{ "valid": false, "reason": "expired" | "used" | "not_found" }`

---

### `POST /create-member-account`
Called after password is set on the invite screen.

**Request:** `{ "token": "uuid", "password": "string" }`

**Logic:**
1. Validate token (double-check)
2. Create Supabase auth user with locked email + password
3. Create Stripe customer + subscription (90-day trial, 50% forever coupon)
4. Mark token `is_used: true`
5. Set profile `subscription_tier: 'member'`, `trial_ends_at: now + 90 days`

**Response:** `{ "success": true, "user_id": "uuid" }`

---

### `POST /create-subscriber-checkout`
Creates Stripe Checkout for non-member choosing a plan at paywall.

**Request:**
```json
{ "user_id": "uuid", "email": "user@example.com", "plan": "monthly" | "annual" }
```

**Logic:** Create/retrieve Stripe customer → Checkout Session with 14-day trial → return URL

**Response:** `{ "url": "https://checkout.stripe.com/pay/cs_..." }`

---

### `POST /create-portal-session`
Lets subscribers manage billing via Stripe portal.

**Request:** `{ "user_id": "uuid" }`
**Response:** `{ "url": "https://billing.stripe.com/session/..." }`

---

### `GET /check-paywall`
Called on every app open. Returns whether paywall should be shown.

**Response (no paywall):**
```json
{ "paywall": false, "subscription_tier": "subscriber", "subscription_status": "active" }
```

**Response (paywall):**
```json
{
  "paywall": true,
  "reason": "trial_expired",
  "fasting_sessions": 9,
  "badges_earned": 3,
  "days_tracked": 14
}
```

The summary fields power the paywall screen copy: "You've logged 9 fasting sessions and earned 3 badges — don't lose your progress."

---

### `POST /send-invite`
Admin-only. Generates invite token + sends invite email via Resend.

**Request:** `{ "email": "member@example.com", "first_name": "Sarah" }`
**Auth:** `role: 'admin'` required → 403 if not admin

**Logic:**
1. Insert into `invite_tokens`
2. Build invite URL: `https://fastwellapp.com/join?token=[token]`
3. Send Email 1 via Resend

**Response:** `{ "sent": true, "expires_at": "2025-04-19T00:00:00Z" }`

---

### `POST /stripe-webhook`
Handles Stripe events. See WEBHOOK_SPEC.md.

---

### `POST /generate-insights`
Generates AI insight cards for a user via Claude API.

**Request:** `{ "user_id": "uuid" }` (internal — called by cron or on app open)

**Logic:**
1. Check if cache expired (`ai_insights.expires_at < now`)
2. Check user has 7+ days of data
3. Fetch last 30 days of data
4. Send to Claude API with brand voice system prompt
5. Parse response → insert into `ai_insights` table
6. Return insight cards

**Response:**
```json
{
  "insights": [
    "Your sleep scores 0.9 points higher on days after a fast, Sarah.",
    "You finish fasting windows more easily on Mondays and Tuesdays."
  ]
}
```

---

### `POST /award-badge`
Internal. Server-side badge awarding called from triggers and crons.

**Request:** `{ "user_id": "uuid", "badge_key": "first_fast" }`
**Response:** `{ "awarded": true }` or `{ "awarded": false, "reason": "already_earned" }`

---

### `POST /generate-export`
Generates a dated PDF health report.

**Request:**
```json
{ "user_id": "uuid", "from_date": "2025-01-01", "to_date": "2025-04-12" }
```

**Logic:** Fetch all data for range → generate PDF with medical disclaimer → upload to Supabase Storage (24hr expiry) → return signed URL

**Response:**
```json
{
  "download_url": "https://[project].supabase.co/storage/v1/object/sign/exports/...",
  "expires_at": "2025-04-13T08:00:00Z"
}
```

Rate limit: 5 per user per day.

---

### `POST /send-nudge`
Admin-only. Push notification to one member or all.

**Request:**
```json
{ "target": "all" | "user", "user_id": "uuid (if user)", "title": "...", "body": "..." }
```

**Auth:** `role: 'admin'` required → 403 if not
**Response:** `{ "sent_to": 47, "failed": 0 }`

---

### `GET /admin/stats`
Admin-only. Aggregate stats across all users.

**Response:**
```json
{
  "total_users": 203,
  "active_last_7_days": 141,
  "active_last_30_days": 178,
  "member_tier": 186,
  "subscriber_tier": 17,
  "trialing_members": 24,
  "trialing_subscribers": 11,
  "inactive": 0,
  "pending_invites": 8,
  "avg_fasting_sessions_per_week": 3.2,
  "avg_sleep_hours": 6.8,
  "total_badges_earned": 1204,
  "most_earned_badge": "first_fast",
  "users_quiet_7_days": [
    { "id": "uuid", "first_name": "Sarah", "last_active": "2025-04-04" }
  ]
}
```

---

## Error Format

```json
{ "error": { "code": "UNAUTHORIZED", "message": "You must be logged in." } }
```

Status codes: 200 / 400 / 401 / 403 / 404 / 500

---

## Rate Limits

- `/generate-export`: 5 per user per day
- `/send-nudge`: 10 per admin per hour
- `/generate-insights`: handled by cron — not directly rate-limited on the endpoint
