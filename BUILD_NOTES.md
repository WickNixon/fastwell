# BUILD_NOTES.md — Fastwell

## Build Environment

- **IDE:** Claude Code (CLI)
- **Mobile:** React Native via Expo SDK 51+
- **Web Admin:** Next.js 14+ (App Router)
- **Database:** Supabase (PostgreSQL + Edge Functions)
- **Hosting:** Vercel (admin web), EAS (mobile builds)
- **Payments:** Stripe
- **AI:** Anthropic Claude API (claude-sonnet-4-5)
- **Transactional Email:** Resend (from hello@wickedwellbeing.com)
- **Version Control:** Git / GitHub
- **Package Manager:** npm or bun

---

## Pricing — Stripe Setup

Four Stripe price objects must be created before any testing:

| Constant | Plan | Amount |
|---|---|---|
| `STRIPE_PRICE_ID_MEMBER_MONTHLY` | Member monthly (post-trial) | $9.50 NZD |
| `STRIPE_PRICE_ID_MEMBER_ANNUAL` | Member annual (post-trial) | $79.76 NZD |
| `STRIPE_PRICE_ID_SUBSCRIBER_MONTHLY` | Non-member monthly | $18.99 NZD |
| `STRIPE_PRICE_ID_SUBSCRIBER_ANNUAL` | Non-member annual | $159.52 NZD |

Also create in Stripe:
- **Member coupon:** 50% off, forever, applied to member subscriptions
- **Member trial:** 90 days
- **Subscriber trial:** 14 days, `payment_method_collection: 'if_required'`

---

## Authentication — Full Spec

### Login Screen
- Email field
- Password field with **eye toggle** (tap to show/hide)
- "Forgot password?" link below password field
- "Create account" link for new users
- Fastwell logo centred above form

### Signup Screen (non-member)
- Email + password + confirm password
- Eye toggle on password fields
- Minimum 8 characters (enforced client + server)
- On submit → Supabase creates account → onboarding begins → 14-day trial starts

### Invite Flow (member)
1. Member clicks invite link → app validates token
2. Fastwell logo fades in → holds 1.5s → fades out (300ms each way)
3. "Welcome to Fastwell. Let's get you set up." appears
4. Password creation field (email pre-filled and locked from token)
5. Confirm password field
6. Submit → token marked used → proceeds directly into onboarding (name → age → stage → cycle → HRT → goal)

### Forgot Password Flow
1. User taps "Forgot password?" → email input screen
2. On submit:
   - If email in system → Resend sends reset email with "Reset my password" button
   - If email not in system → no email sent (silent)
   - Either way → show: "If that email is registered, you'll receive a reset link shortly."
3. Reset link expires after **1 hour**
4. User clicks button → set new password screen → redirected to login

### Change Password (Settings)
- Requires current password + new password + confirm new password
- Eye toggles on all fields

---

## AI Insights — Build Spec

Powered by Anthropic Claude API (claude-sonnet-4-5). Built into MVP.

### Edge Function: `generate-insights`
Runs daily per user via Supabase cron, or on app open if cache expired.

```typescript
const systemPrompt = `
You are the insight engine for Fastwell, a health tracking app for women in menopause.
Generate 1–3 short insight cards based on the user's data.
Rules:
- Use the user's first name
- Maximum 2 short sentences per insight
- Reference specific numbers from the data
- Warm, observational tone — never alarming or prescriptive
- No medical advice. Plain language.
- Return as a JSON array of strings only.
`;
// Fetch last 30 days of user data
// Send to Claude API with system prompt + data summary
// Parse JSON response → insert rows into ai_insights table
// Cache expires_at: now + 24 hours
```

### What's Sent to Claude
- First name, menopause stage, primary goal
- Last 30 days: fasting sessions, sleep, energy, mood, water, steps, symptoms, HbA1c
- Aggregate summaries — not raw rows
- Never: full name, email, payment data

### Display Rules
- Shows on home dashboard below fasting timer
- Only after 7+ days of logged data
- Max 3 cards at a time
- Soft card design with subtle dismiss option
- Refreshes daily when new data present

### Short Card Examples
- "Your sleep scores 0.9 points higher on days after a fast, Sarah."
- "You finish fasting windows more easily on Mondays and Tuesdays."
- "HbA1c down from 6.2% to 5.8% since you started. That's real progress."
- "Hot flushes up this week — same pattern as your last two short-sleep nights."
- "Your energy dips mid-week. Water intake is lower those days too."

---

## Member Invite — Admin Flow

1. Coach enters member first name + email in admin dashboard → "Send Invite"
2. Token generated → stored in `invite_tokens` table
3. Resend sends invite email from hello@wickedwellbeing.com
4. Admin sees status per invite: Pending / Used / Expired
5. Expired invites can be resent (new token generated)

Token rules: single-use, expires 7 days, email locked to token.

---

## Non-Member Trial & Paywall

### Day-15 Paywall Screen
- Full-screen, primary green background, Fastwell logo at top
- Warm headline: "Your 14 days are up — ready to keep going?"
- Data summary: "You've logged [X] fasting sessions and earned [X] badges."
- Two plan cards: Monthly $18.99 | Annual $159.52 (Save 30%)
- Small text: "Wicked Wellbeing members get 50% off — [find out more]"
- No dismiss — access suspended until plan chosen

---

## Resend Emails (Summary)

| Email | Trigger | Subject |
|---|---|---|
| Member invite | Coach sends invite | "You're invited to Fastwell — 3 months free" |
| Member trial ending | 7 days before day 90 | "Your free access is almost up, [Name]" |
| Subscriber trial ending | 3 days before day 15 | "Your Fastwell trial ends in 3 days" |
| Password reset | Forgot password | "Reset your Fastwell password" |
| Payment failed | Stripe webhook | "We couldn't process your payment, [Name]" |

Full copy in WEBHOOK_SPEC.md.

---

## MVP Scope

### Included in MVP

**Auth:** Email + password, eye toggles, forgot/reset password, invite token flow with logo fade

**Onboarding:** 6 screens — name, age, stage, cycle, HRT, goal — immediately personalises dashboard

**Fasting:** Timer, protocol selection, glucose/ketone logging during fast, break-fast log, history

**Daily Tracking (all optional):** Weight (trend graph), water, sleep, energy, mood, symptoms, steps, exercise

**Biomarkers:** HbA1c graph over time, blood glucose, ketones

**Supplements & HRT:** Add, edit, pause — type, dose, delivery, brand

**AI Insights:** Claude API, 1–3 short cards, shows after 7 days, refreshes daily

**Gamification:** All 11 badges, celebration screens, push notification on earn, rewards screen

**Results:** 7d / 30d / 3m / 6m / 12m filters, "since I started" baseline, PDF export (GP-ready)

**Admin Dashboard:** Member list, invite management, nudge notifications, aggregate stats

**Settings:** Profile edit, change password, light/dark toggle, notifications, Stripe portal

**Billing:** Member invite + 90-day trial, subscriber 14-day trial, day-15 paywall, Stripe webhooks, Resend emails

### Not In MVP
- Apple Health / Garmin (V1.1)
- Fasting planner with cycle-sync (V1.1)
- Gifting access (V2)
- Group fasting (V2)

---

## Development Sequence

1. Supabase project + full schema (all tables)
2. Auth screens — login, signup, forgot/reset password + eye toggles
3. Invite token flow + logo fade animation
4. Full onboarding (6 screens)
5. Stripe — 4 price objects, member coupon, trial configs
6. Resend — all 5 email templates
7. Fasting timer (perfect this before moving on)
8. Badge system + celebration screens
9. AI insights Edge Function + home dashboard cards
10. Daily tracking screens
11. Biomarkers screen
12. Supplements screen
13. Results page + charts + PDF export
14. Day-15 paywall screen
15. Admin dashboard (Next.js)
16. Push notifications
17. Light / dark mode
18. Apple Health (v1.1)
19. Garmin Connect (v1.1)
20. Fasting planner with cycle-sync (v1.1)

---

## Pre-Launch Checklist

### Accounts — Set Up Now
- [ ] Apple Developer account ($99 USD/year)
- [ ] Google Play Console ($25 USD one-off)
- [ ] Garmin developer application (submit now — 1–4 week approval)
- [ ] Resend account — verify hello@wickedwellbeing.com domain
- [ ] Stripe account — price objects, coupon, webhook endpoint
- [ ] Supabase project — auth, schema, RLS
- [ ] Anthropic account — API key

### Legal
- [ ] Privacy Policy (required for HealthKit + App Store)
- [ ] Terms of Service
- [ ] Medical disclaimer (in-app + every PDF export)

### Testing Priorities
- [ ] Invite token: single-use, 7-day expiry, email locked
- [ ] Logo fade: smooth on both iOS and Android
- [ ] Forgot password: reset email sends only if email in system, link expires 1 hour
- [ ] Eye toggle: works on all password fields
- [ ] Day-15 paywall: fires correctly, cannot be bypassed
- [ ] Member 90-day trial: correct dates, 50% coupon applied
- [ ] AI insights: generates after 7 days, short format, caches 24 hours
- [ ] Correct Resend email sent to correct tier
- [ ] RLS: users cannot see each other's data
- [ ] Badges: fire once only per user
- [ ] PDF: renders cleanly on A4 with medical disclaimer
- [ ] Fasting timer: survives background, lock screen, offline
- [ ] Dark mode: all text readable
- [ ] iOS Large Text: app does not break

---

## Known Decisions & Rationale

| Decision | Rationale |
|---|---|
| Email + password (not magic link) | Users need to log back in reliably; magic link requires email access every time |
| Eye toggle on passwords | Reduces login errors for less tech-native demographic |
| Silent forgot password (no confirm if email exists) | Security best practice — prevents email enumeration |
| Logo fade on invite screen | Warm first impression; signals this is a premium, considered product |
| AI insights in MVP | Differentiator; short card format keeps build scope manageable |
| Claude API not rule-based | Real pattern detection across any data combination — rule-based misses unexpected correlations |
| No fasting streaks | Daily fasting harmful for cycling women |
| All tracking optional | Guilt is the enemy of consistency |
| 30% annual discount (non-member) | Meaningful but preserves gap vs member 50% discount |
| 50% member discount | Creates strong visible incentive to join Wicked Wellbeing membership |
| NZD pricing | NZ-based business and primary audience |
