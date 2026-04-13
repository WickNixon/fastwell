# CLAUDE.md — Master Instructions for Fastwell

## What Fastwell Is

Fastwell is a personalised health and lifestyle tracking app built specifically for women navigating perimenopause, the menopause transition, and post-menopause. It is the digital companion to a New Zealand-based women's fasting membership community — designed to sit in a member's pocket and act as a consistent, encouraging coach between sessions.

Fastwell is NOT a generic fitness app. Every decision — language, features, data, UX — is made through the lens of this specific audience and this specific mission.

---

## The Founder's Why (Never Lose Sight of This)

Fastwell exists because women in midlife are struggling with consistency — not motivation. They know what they need to do. They just can't keep on track alone, and one-on-one coaching is out of reach financially for most members. Everything else on the market offers quick fixes that don't last.

Fastwell is the solution to that. It is a coach in their pocket — always available, never judging, always celebrating the small wins that add up to a transformed life. It also serves the business: keeping members engaged, accountable, and retained inside the membership by making Fastwell so valuable they cannot imagine leaving.

The goal is not weight loss. The goal is sustainable lifestyle change that makes women feel like themselves again.

---

## Who You Are Building For

- Women aged 40–80, based primarily in Auckland and New Zealand
- At various stages: perimenopause, menopause transition, post-menopause
- Many managing HRT (bioidentical or pharmaceutical), supplements, and lifestyle changes simultaneously
- Familiar with or following Dr. Mindy Pelz's fasting and cycle-syncing protocols
- Not tech-native — UX must be effortless, warm, and clear
- They want results but need encouragement and consistency tools, not pressure
- They struggle with consistency — Fastwell's job is to make consistency feel achievable and rewarding

---

## Core Philosophy

Fastwell is a lifestyle app, not a weight loss app. Weight loss may be a goal for many users but it is never the primary framing. The primary focus is energy, sleep quality, hormonal balance, sustainable habits, celebrating progress, and informed GP conversations.

Tracking is never mandatory. Some members will only track fasting. Some will only track water and sleep. That is completely valid — the app must honour partial engagement without ever making users feel guilty for it.

---

## Tech Stack (Never Deviate Without Discussion)

| Layer | Technology |
|---|---|
| Mobile App | React Native via Expo |
| Web Dashboard | Next.js hosted on Vercel |
| Backend / Database | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Authentication | Supabase Auth (email + password) |
| AI Insights | Anthropic Claude API (claude-sonnet-4-5) |
| Payments | Stripe |
| Transactional Email | Resend (from hello@wickedwellbeing.com) |
| Apple Health | HealthKit via react-native-health (v1.1) |
| Garmin | Garmin Connect API OAuth 2.0 (v1.1) |
| Push Notifications | Expo Push Notifications |
| Future | Oura Ring API, Fitbit API, Google Fit, smart rings |

---

## Brand

- **App name:** Fastwell (stored in `APP_NAME` env constant — may change)
- **Primary colour:** #5C8A34 (Wicked Wellbeing grass green)
- **Accent colour:** #D06820 (burnt orange — CTAs, highlights, rewards)
- **Background light:** #F4FAF0 | **Background dark:** #0D1A07
- **Surface light:** #FFFFFF | **Surface dark:** #1A2E0D
- **Text light:** #2C4A1A | **Text dark:** #D4EEC0
- **Muted text light:** #7A9A6A | **Muted text dark:** #6B9B4A
- **Heading font:** Montserrat 700
- **Body font:** Lato 400
- **Label font:** Montserrat 600

---

## Pricing & Access Tiers

### Tier 1 — Member (Wicked Wellbeing community)
- Access via **personal invite link** sent from admin dashboard (single-use, expires 7 days)
- First **3 months completely free**
- After trial: **50% off forever**
- Monthly after trial: **$9.50 NZD/month**
- Annual after trial: **$79.76 NZD/year** (~$6.65/month)
- 7 days before trial ends → personalised Resend email (member tone)

### Tier 2 — Non-member subscriber
- Standard signup with email + password
- **14-day free trial**, full access, no credit card at signup
- Day 15 → full-screen paywall, must choose a plan to continue
- Monthly: **$18.99 NZD/month**
- Annual: **$159.52 NZD/year** ($13.29/month — 30% saving)
- 3 days before trial ends → Resend email (annual plan focused)
- In-app cross-promo banner: "Wicked Wellbeing members get 50% off Fastwell — plus weekly coaching calls and a community of women just like you."

### Stripe Price IDs
```
STRIPE_PRICE_ID_MEMBER_MONTHLY        — $9.50 NZD/month
STRIPE_PRICE_ID_MEMBER_ANNUAL         — $79.76 NZD/year
STRIPE_PRICE_ID_SUBSCRIBER_MONTHLY    — $18.99 NZD/month
STRIPE_PRICE_ID_SUBSCRIBER_ANNUAL     — $159.52 NZD/year
```

---

## Key Features — Priority Order

1. Personalised onboarding (password → name → age → stage → cycle → HRT → goal)
2. Fasting Timer — hero feature
3. Dashboard — personalised from onboarding answers
4. AI Insights — Claude API pattern detection, short warm cards
5. Health Tracking — all optional (weight, sleep, water, steps, exercise, mood, symptoms)
6. Biomarkers — HbA1c, blood glucose, ketones
7. Supplements & Medications — HRT, bioidenticals, supplements
8. Gamification — lifestyle rewards, milestones, celebration moments
9. Results & Progress — time-filtered views with GP export
10. Fasting Planner — cycle-aware or weekly depending on stage (v1.1)
11. Integrations — Apple Health (v1.1), Garmin (v1.1)
12. Coach Dashboard — admin view, nudges, invite management
13. Membership & Billing — Stripe, invite links, trials, paywall

---

## Authentication Flow

### New User (non-member)
1. Lands on login screen — enters email + password to sign up
2. Supabase creates account
3. Onboarding flow begins: name → age → stage → cycle → HRT → goal
4. 14-day trial starts

### New User (member via invite link)
1. Clicks personal invite link from email
2. Fastwell logo fades in → fades out → "Welcome to Fastwell. Let's get you set up."
3. Password creation screen (email pre-filled from token, cannot be changed)
4. Sets password → automatically proceeds to onboarding: name → age → stage → cycle → HRT → goal
5. 3-month trial starts, member pricing applied

### Returning User
1. Login screen: email field + password field with eye toggle (show/hide)
2. "Forgot password?" link below password field
3. Enters credentials → straight to personalised dashboard

### Forgot Password Flow
1. User taps "Forgot password?"
2. Enters their email address
3. If email exists in system → Resend sends password reset email with a reset button/link
4. If email not in system → no email sent, screen shows: "If that email is registered, you'll receive a reset link shortly." (never confirm or deny — security best practice)
5. User clicks link in email → lands on reset screen → sets new password → redirected to login page

---

## Onboarding Flow (One Screen Per Question — after password set)

1. "What's your name?" — first name, large text input
2. "How old are you?" — number input or age picker
3. "Do you know where you are in your menopause journey?" — 4 tappable cards: Perimenopause / Menopause transition / Post-menopause / Not sure
4. "Are you still getting a regular period?" — Yes, regular / Yes, but irregular / No
   - If yes + regular → "How long is your cycle usually?" (days)
5. "Are you currently using HRT or bioidentical hormones?" — Yes / No / Not sure
6. "What's your main goal right now?" — More energy / Better sleep / Weight loss / Hormonal balance / Blood sugar control / All of the above

---

## AI Insights — Rules

- Powered by Anthropic Claude API (claude-sonnet-4-5)
- Insights generated after minimum 7 days of any logged data
- Cards are short — maximum 2 sentences, plain language, warm tone
- Never alarming, never prescriptive — always observational
- Generated server-side via Supabase Edge Function, cached for 24 hours per user
- Shown as soft cards on the home dashboard below the fasting timer
- Refresh daily when new data is present
- System prompt instructs Claude to: use the user's first name, reference specific numbers from their data, keep to 1–2 short sentences, never give medical advice, match Fastwell brand voice

---

## Gamification Rules

- Rewards earned for: logging any habit, completing a fast, hitting water goals, logging sleep, adding biomarkers, completing onboarding, health milestones, first HbA1c entry, consistent weekly logging
- Rewards NEVER tied to: fasting every day, hitting a weight number, or anything that could trigger unhealthy behaviour
- Celebrations are warm and personal — not gamey, noisy, or pressuring
- A user who only tracks fasting still earns rewards
- No fasting streaks — ever

---

## What NOT to Do

- Do NOT use weight-loss-first language
- Do NOT implement fasting streak mechanics
- Do NOT make any tracking field mandatory
- Do NOT shame users for rest days or partial engagement
- Do NOT use red/warning colours for missed days
- Do NOT store health data without encryption at rest
- Do NOT make a user feel behind or failing
- Do NOT silently charge a user — the day-15 paywall requires active consent
- Do NOT send a password reset email if the email is not in the system

---

## Naming Conventions

- `snake_case` for database columns and API fields
- `camelCase` for JavaScript/TypeScript variables and functions
- `PascalCase` for React components
- RLS policies prefixed with table name: e.g. `users_select_own`
- Feature flags prefixed `ff_`: e.g. `ff_garmin_sync`

---

## Environment Variables

```
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ANTHROPIC_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_MEMBER_MONTHLY
STRIPE_PRICE_ID_MEMBER_ANNUAL
STRIPE_PRICE_ID_SUBSCRIBER_MONTHLY
STRIPE_PRICE_ID_SUBSCRIBER_ANNUAL
RESEND_API_KEY
EMAIL_FROM=hello@wickedwellbeing.com
GARMIN_CLIENT_ID
GARMIN_CLIENT_SECRET
EXPO_PUSH_TOKEN
APP_NAME=Fastwell
```

---

## Currency & Locale

- All prices in NZD
- Date format: DD/MM/YYYY
- Timezone: Pacific/Auckland (NZST / NZDT)
- Units: kg, km, ml (user can adjust in settings)
