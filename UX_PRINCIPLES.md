# UX_PRINCIPLES.md — Fastwell

## Design Philosophy

Fastwell is used by women aged 40–80 managing complex health journeys. Every design decision must serve this: the app needs to feel effortless, warm, and safe — like a coach who is always in their corner.

- **Effortless** — if it takes more than 2 taps to log something, redesign it
- **Calming** — wellness space, not a gym dashboard
- **Personal** — the app knows her name and uses it
- **Non-judgmental** — rest days and missed logs look the same as active days
- **Trustworthy** — health data is sacred

---

## Colour Palette — Wicked Wellbeing Brand

### Light Mode
| Role | Hex | Usage |
|---|---|---|
| Background | #F4FAF0 | App background |
| Surface | #FFFFFF | Cards, modals, inputs |
| Primary | #5C8A34 | Buttons, timer, active states, nav |
| Primary deep | #3D6020 | Pressed states |
| Accent orange | #D06820 | CTAs, badges, highlights |
| Text primary | #2C4A1A | All main text |
| Text muted | #7A9A6A | Labels, secondary info |
| Green pale | #EAF3DC | Inactive states, rest days |
| Border | #C8DFB0 | Card borders, dividers |

### Dark Mode
| Role | Hex | Usage |
|---|---|---|
| Background | #0D1A07 | App background |
| Surface | #1A2E0D | Cards, modals |
| Primary | #7CBB44 | Buttons, active states |
| Primary light | #A8D878 | Highlights |
| Accent orange | #E8842A | CTAs, badges |
| Text primary | #D4EEC0 | All main text |
| Text muted | #6B9B4A | Labels |
| Green pale | #1E3A10 | Inactive states |
| Border | #2E5018 | Card borders |

---

## Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Screen headings | Montserrat | 700 | 22–26pt |
| Card titles | Montserrat | 600 | 16–18pt |
| Body text | Lato | 400 | 15–16pt |
| Labels & badges | Montserrat | 600 | 11–13pt |
| Muted subtitles | Lato | 400 | 13pt |
| Timer display | Montserrat | 700 | 42–48pt |

Minimum readable size: 13pt. Line height: 1.5–1.6 for body text.

---

## Login & Auth Screens

### Login Screen Layout
- Fastwell logo centred, top third
- Email input field
- Password input field with **eye toggle icon** (right side of field — tap to reveal/hide characters)
- "Forgot password?" — small link below password field, right-aligned
- Primary CTA button: "Log in" (full width, primary green)
- Divider: "or"
- Secondary link: "Create an account"

### Signup Screen Layout
- Email field
- Password field + eye toggle
- Confirm password field + eye toggle
- Password requirements shown below field (minimum 8 characters)
- CTA: "Create my account"
- Link back to login: "Already have an account? Log in"

### Forgot Password Screen
- Single email input
- CTA: "Send reset link"
- After submit: warm message shown regardless of whether email exists
  - "If that email is registered, you'll receive a reset link shortly."
- Back link to login

### Reset Password Screen
- New password field + eye toggle
- Confirm new password field + eye toggle
- CTA: "Set new password"
- On success → redirect to login with message: "Password updated. Log in to continue."

---

## Invite Landing Screen (Member Flow)

The very first thing a member sees after clicking their invite link.

### Animation Sequence
1. Screen opens on deep green background (#0D1A07 — same as dark mode bg)
2. Fastwell logo fades in from 0 opacity → 100% (300ms ease-in)
3. Logo holds for 1.5 seconds
4. Logo fades out (300ms ease-out)
5. Background transitions to light (#F4FAF0) — smooth 200ms
6. "Welcome to Fastwell." appears — Montserrat 700, 26pt
7. "Let's get you set up." appears below — Lato 400, 16pt, muted
8. Password creation field slides up from below (300ms ease)

### Password Screen (Invite)
- Email shown as locked, non-editable (greyed out, padlock icon)
- Password field + eye toggle
- Confirm password field + eye toggle
- CTA: "Continue" — primary green, full width
- On submit → automatically into onboarding (no delay, no confirmation screen)

---

## Onboarding UX

### Principles
- One question per screen — never a form
- Large tappable cards for all multiple choice
- Progress shown as soft dots at top — never numbered steps
- Back navigation always available
- Warm, conversational heading language (see BRAND_VOICE.md)

### Screen Designs

**Q1 — Name:** Large centred text input, auto-focused. Continue activates when not empty.

**Q2 — Age:** Number picker or scrollable wheel. Subtext: "No judgment here."

**Q3 — Stage:** 4 stacked tappable cards. Selecting highlights in primary green and auto-advances after 0.8s.
- Perimenopause — "I still have periods but they're changing"
- Menopause transition — "My periods have been stopping and starting"
- Post-menopause — "I haven't had a period for 12+ months"
- Not sure — "I'm not certain which stage I'm at"

**Q4 — Cycle:** 3 cards: Yes, regular / Yes, but irregular / No
- If "Yes, regular" → inline follow-up: "How long is your cycle usually?" (number input, default 28)

**Q5 — HRT:** 3 cards: Yes / No / Not sure. Subtext: "You can update this anytime."

**Q6 — Goal:** 6 cards in 2-column grid. Selection highlighted in accent orange.

**Final screen:** Full-screen warm moment. "[Name], you're all set. Welcome to Fastwell."
Single CTA: "Take me to my dashboard."

---

## Home Dashboard Layout

1. **Greeting** — "Good morning, [Name]." Montserrat 700
2. **Date context** — "Sunday, 12 April · Wicked Wellbeing"
3. **Fasting Timer** — large and prominent if active; soft prompt if not
4. **AI Insight Cards** — 1–3 short cards, visible after 7 days of data
5. **Quick Check-in Strip** — 4 tap-targets: Water / Energy / Mood / Symptoms (max 2 taps)
6. **Today's Snapshot** — 3 stat cards: sleep, steps, water (or goal-relevant metrics)
7. **Your Week** — fasting calendar strip: green = fasting, pale = rest, orange = today

---

## Fasting Timer Screen

The hero. Must feel significant and calm.

- Large typographic timer: elapsed fasting time
- Protocol label: "16:8 fast"
- Time remaining to goal
- "How are you feeling?" — one-tap energy check below timer
- Log glucose / Log ketones buttons
- "Break my fast" — requires confirmation tap
- Background: primary green (#5C8A34), white text — distinctively different from all other screens

---

## AI Insight Cards

- Soft card, surface white, subtle border
- No icon — just the text. Clean.
- Dismiss option: small 'x' top right (non-intrusive)
- Maximum 2 sentences, reads in under 5 seconds
- Stacked vertically, max 3 visible

---

## Tracking Screen

- Entry from bottom nav "Track"
- Grid of categories: Weight / Sleep / Water / Steps / Exercise / Mood / Symptoms
- Each shows logged status: green dot (logged) or empty (not logged — neutral, no red, no X)
- Tapping category → metric entry screen
- Empty is never shown as failure

---

## Day-15 Paywall Screen

- Full-screen, primary green background
- Fastwell logo top centre
- Warm headline: "Your 14 days are up — ready to keep going?"
- Data summary card: "You've logged [X] fasting sessions and earned [X] badges."
- Two plan cards (white, rounded):
  - Monthly — "$18.99/month"
  - Annual — "$159.52/year · Save 30%"
- Small text below: "Wicked Wellbeing members get 50% off — [find out more →]"
- No dismiss — access suspended until choice made
- Do NOT use red, warning language, or threatening copy

---

## Rewards / Badges Screen

- Title: "Your milestones" (not "Achievements")
- Grid of earned badges — colour, name, date earned
- Unearned badges shown faded — curiosity, not pressure
- Newest first
- Tapping badge shows full message and earn date

---

## Results & Progress Screen

- Time filter tabs: 7d / 30d / 3m / 6m / 12m
- Sections (collapsible): Body, Metabolic, Fasting, Lifestyle, Wellbeing, Supplements & HRT
- "Since I started" comparison in each section
- Export button: "Share with my GP" → generates dated PDF

---

## Accessibility

- WCAG AA contrast (4.5:1 for body text) — all colours
- Minimum touch target: 48×48pt
- Accessible labels on all interactive elements
- iOS VoiceOver + Android TalkBack compatible
- App must not break at iOS Large Text settings
- No time-limited interactions

---

## Micro-interactions

- Water log: satisfying fill animation
- Fast complete: calm pulse, not confetti
- Badge earned: gentle glow + haptic
- Onboarding card selection: smooth highlight + brief haptic
- Logo fade on invite screen: ease-in / ease-out, 300ms each
- All animations: under 300ms, never heavy
