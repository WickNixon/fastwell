# APP_ARCHITECTURE.md — Fastwell

## System Overview

Fastwell is a mobile-first health tracking app with a web-based coach/admin dashboard. Built on a serverless architecture using Supabase as the backend, React Native (Expo) for the mobile app, and Next.js for the admin dashboard hosted on Vercel.

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENTS                              │
│                                                              │
│   Fastwell Mobile (Expo / React Native)                     │
│   iOS + Android                                              │
│                                                              │
│   Fastwell Admin (Next.js / Vercel)                         │
│   Coach-only web dashboard                                   │
└──────────────────┬───────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────────────────┐
│                    SUPABASE BACKEND                          │
│                                                              │
│   Auth (email + password)                                    │
│   PostgreSQL (all app data, RLS enforced)                   │
│   Storage (profile photos, PDF exports)                      │
│   Realtime (live dashboard updates)                          │
│   Edge Functions (AI insights, webhooks, sync, PDF)          │
│   Vault (encrypted OAuth tokens)                             │
└────────┬──────────────────┬─────────────────┬────────────────┘
         │                  │                  │
   ┌─────┴──────┐    ┌──────┴──────┐   ┌──────┴──────┐
   │   STRIPE   │    │   CLAUDE    │   │ INTEGRATIONS │
   │            │    │     API     │   │              │
   │ $18.99/mo  │    │             │   │ Apple Health │
   │ $159.52/yr │    │ AI Insights │   │ Garmin API   │
   │ Webhooks   │    │             │   │              │
   └────────────┘    └─────────────┘   └─────────────┘
         │
   ┌─────┴──────┐
   │   RESEND   │
   │            │
   │ Invite     │
   │ Trial end  │
   │ Password   │
   │ reset      │
   └────────────┘
```

---

## Mobile App Structure (React Native + Expo)

```
app/
├── (auth)/
│   ├── login.tsx              — Email + password login, eye toggle, forgot password
│   ├── signup.tsx             — New user email + password signup
│   ├── forgot-password.tsx    — Enter email to receive reset link
│   ├── reset-password.tsx     — Set new password from email link
│   └── invite/
│       ├── [token].tsx        — Invite landing: logo fade → welcome → set password
│       └── onboarding/
│           ├── name.tsx       — "What's your name?"
│           ├── age.tsx        — "How old are you?"
│           ├── stage.tsx      — Menopause stage selection
│           ├── cycle.tsx      — Period status + cycle length
│           ├── hrt.tsx        — HRT / bioidenticals
│           └── goal.tsx       — Primary health goal
│
└── (app)/
    ├── index.tsx              — Home dashboard (personalised)
    ├── fasting/
    │   ├── timer.tsx          — Active fasting timer (hero)
    │   ├── planner.tsx        — Weekly/monthly fasting plan (v1.1)
    │   └── history.tsx        — Fasting log calendar view
    ├── track/
    │   ├── index.tsx          — Tracking hub (all optional)
    │   ├── weight.tsx
    │   ├── sleep.tsx
    │   ├── water.tsx
    │   ├── steps.tsx
    │   ├── exercise.tsx
    │   ├── mood.tsx
    │   └── symptoms.tsx
    ├── biomarkers/
    │   ├── hba1c.tsx
    │   ├── glucose.tsx
    │   └── ketones.tsx
    ├── supplements/
    │   └── index.tsx
    ├── results/
    │   └── index.tsx          — Progress, charts, GP export
    ├── rewards/
    │   └── index.tsx          — Earned badges and milestones
    └── settings/
        ├── profile.tsx
        ├── integrations.tsx
        ├── subscription.tsx
        ├── appearance.tsx     — Light / dark mode toggle
        ├── notifications.tsx
        └── change-password.tsx
```

---

## Authentication Flow

### New Non-Member Signup
1. User opens app → taps "Create account"
2. Enters email + password (password must meet minimum requirements)
3. Supabase creates account → onboarding begins
4. 14-day free trial starts immediately

### Member Invite Flow
1. Coach sends invite from admin dashboard → Resend delivers invite email
2. Member clicks link → app opens invite screen
3. Fastwell logo fades in → holds → fades out
4. "Welcome to Fastwell. Let's get you set up." appears
5. Password creation field (email pre-filled from token, locked)
6. Member sets password → token validated and marked used
7. Automatically proceeds to onboarding: name → age → stage → cycle → HRT → goal
8. 3-month trial starts, member pricing applied in Stripe

### Returning User Login
1. Email field + password field
2. Eye toggle icon on password field (tap to show/hide characters)
3. "Forgot password?" link below password field
4. Successful login → personalised dashboard

### Forgot Password Flow
1. User taps "Forgot password?" → enters email
2. If email in system → Resend sends reset email with button link
3. If email not in system → no email sent, neutral message shown (security)
4. User clicks reset button → lands on reset screen → sets new password
5. Redirected to login page

---

## Personalised Dashboard Logic

The home dashboard is configured at first login using onboarding answers:

| Onboarding answer | Dashboard effect |
|---|---|
| Goal: More energy | Energy level widget shown prominently |
| Goal: Better sleep | Sleep widget shown prominently |
| Goal: Blood sugar control | HbA1c / glucose widget shown first |
| Goal: Weight loss | Weight trend shown, framed as "body changes" |
| Still cycling + cycle length | Fasting planner shows cycle phase overlay (v1.1) |
| Post-menopause | Fasting planner shows weekly rhythm view |
| On HRT | Supplements section pre-prompted at setup |
| Age 55+ + "not sure" | App suggests post-menopause gently |

---

## AI Insights Architecture

Powered by the Anthropic Claude API (claude-sonnet-4-5).

### How It Works
1. Supabase Edge Function runs daily per user (or on-demand when app opens)
2. Fetches last 30 days of the user's data: fasting sessions, health entries, biomarkers, symptoms
3. Constructs a prompt including the user's name, data summary, and brand voice instructions
4. Sends to Claude API → receives 1–3 short insight cards
5. Insight cards cached in `ai_insights` table for 24 hours (avoid re-generating unnecessarily)
6. Cards displayed on home dashboard below the fasting timer

### Insight Rules
- Minimum 7 days of data before any insights are shown
- Maximum 3 insight cards shown at once — rotate daily
- Each card: maximum 2 sentences, warm tone, specific numbers from her data
- Never alarming, never prescriptive, always observational
- Claude system prompt enforces: use first name, reference real numbers, no medical advice, match brand voice

### Example Insight Cards (final short format)
- "Your sleep scores 0.9 points higher on days after a fast, Sarah."
- "You complete fasting windows more easily on Mondays and Tuesdays."
- "HbA1c down from 6.2% to 5.8% since you started. That's real progress."
- "Hot flushes logged 4 times this week — same pattern as your last two short-sleep nights."
- "Your energy dips mid-week. Water intake is lower those days too."

---

## Gamification Architecture

Rewards triggered server-side via Supabase database functions and Edge Functions.

### Badge Triggers
| Event | Badge |
|---|---|
| Complete onboarding | "You showed up" |
| First fasting session | "First fast" |
| First HbA1c entered | "Know your numbers" |
| Log any habit 7 days in a row | "Building momentum" |
| Log any habit 30 days in a row | "This is who you are now" |
| Complete a 24hr+ fast | "Going deep" |
| Log water 7 days in a row | "Hydration queen" |
| First GP export | "Taking control" |
| HbA1c improves vs first reading | "Your body is responding" |
| 3 months since first log | "Three months stronger" |
| 6 months since first log | "Half a year of you" |

### Delivery
- Badge earned → stored in `user_badges` table
- Push notification sent immediately
- Subtle in-app animation on next open

---

## Data Sync (Integrations — V1.1)

### Apple HealthKit
- Syncs on app open: steps, sleep, workouts, weight, heart rate, water
- Manual entries take precedence for same day / same metric
- Source tagged: `source: 'apple_health'`

### Garmin Connect
- OAuth 2.0 flow, tokens in Supabase Vault
- Scheduled Edge Function polls every 6 hours
- Pulls: steps, sleep, stress, heart rate, HRV, body battery, workouts
- Source tagged: `source: 'garmin'`

---

## Light / Dark Mode
- Detected from device system setting by default (`useColorScheme()`)
- User can override in Settings → Appearance
- Preference stored in `profiles.theme_preference` ('system' | 'light' | 'dark')

---

## Offline Behaviour
- Core tracking (fasting timer, water, weight, mood) works offline
- Data stored locally using MMKV
- Sync queue processes when connectivity restored
- Visual indicator shown when offline
- Fasting timer continues accurately through offline periods

---

## Security
- All tables protected by Supabase RLS — users cannot access each other's data
- Passwords hashed by Supabase Auth (never stored in plain text)
- Garmin/OAuth tokens stored in Supabase Vault (encrypted)
- All API traffic over HTTPS / TLS 1.2+
- Stripe handles all card data — no payment data touches Fastwell servers
- PDF exports generated server-side, deleted after 24 hours
- Invite tokens single-use, expire after 7 days
- Password reset links expire after 1 hour
- NZ Privacy Act 2020 compliant (see COMPLIANCE.md)
