# Fastwell — Change Log 7
### Claude Code Prompt — Paste this in full, read completely before writing any code

---

Read this entire document before touching a single file. Complete all changes in the order listed. Each change gets its own commit, push to GitHub, and Vercel redeploy before moving to the next. Do not batch changes. Do not skip the redeploy between changes. If a build fails, fix it before proceeding.

---

## Pre-Flight Check — Complete Every Step Before Writing Any Code

**1.** Read `CLAUDE.md` in full.

**2.** Read Change Logs 1–6 in full — understand everything built so far, what version we are on, and what was last deployed.

**3.** Confirm the live Vercel app loads and you can log in successfully.

**4.** Confirm current version in `web/package.json` — note it and increment from there for each change.

**5.** Before writing any code, run this audit and paste your findings as a comment:
- What is the current CSS approach — CSS variables, Tailwind, inline styles, or a mix?
- Where are dark mode styles defined? (search for `dark`, `prefers-color-scheme`, `data-theme`)
- What is the exact file path for the home screen dashboard?
- What is the exact file path for the fasting timer page, if it exists?
- What is the exact file path for the Me tab trends section?
- What is the exact file path for the Settings hub?

**6.** Open `Fastwell Onboarding.html` in a browser. Keep it open for the entire session. Every visual decision must be checked against it.

---

## Change 1 — Remove Dark Mode Entirely

### Why
The app is light mode only. Dark mode was partially implemented and is causing visual inconsistency. Remove it completely so there is one single colour set throughout.

### What to find and delete

Search the entire `web/` directory for:
- `[data-theme="dark"]` — delete the entire block
- `@media (prefers-color-scheme: dark)` — delete the entire block
- `.dark` CSS class definitions — delete them
- `dark:` Tailwind utility prefixes — remove the `dark:` prefix and keep only the light variant, or delete if dark-only
- Any `theme` state variable that stores `'light'` or `'dark'`
- Any `localStorage.getItem('theme')` or `localStorage.setItem('theme', ...)` calls
- Any `document.documentElement.setAttribute('data-theme', ...)` calls
- The Appearance setting row in Settings (the one that says "Light or dark mode") — delete this row entirely

### What to set as permanent values
After removing dark mode, ensure these are the only values used throughout:
```
Background:  #F3F0E7
Surface:     #FFFFFF
Text:        #1A1A1A
Muted text:  #6B7066
Border:      #E8E4D9
Primary:     #1E8A4F
Accent:      #E2682A
```

### Verify
Run `cd web && npm run build` — zero errors. Visual check on Vercel — every screen light mode, no dark patches.

**Commit:** `v[x.x.x] — remove dark mode: light mode only, delete appearance setting`
**Push to GitHub → Redeploy Vercel → Confirm app loads before proceeding.**

---

## Change 2 — Home Screen: Date Format, Spacing, Calendar Habit Dots

**File:** Find and open the home screen dashboard file. Read it in full before making any changes.

### 2a — Date format
**What is wrong:** The date label shows "21 April" with no day name.
**Fix:** Change to full format — **"Tuesday, 21 April"**

```typescript
new Date().toLocaleDateString('en-NZ', {
  timeZone: 'Pacific/Auckland',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
})
```

### 2b — Spacing between calendar and fasting card
**Fix:** Add `marginTop: 20` to the fasting card container. The current gap is too tight — there needs to be clear breathing room between the calendar strip and the fasting card below it.

### 2c — Habit completion dots on calendar strip
**What to build:** Each day cell in the 7-day calendar strip shows small coloured dots below the date number — one dot per habit logged that day.

**Data:** Query `health_entries` for the last 7 days for the current user. Also query `fasting_sessions` for completed fasts. Group by date. Fetch in a single query on page load — not one query per day.

**Dot spec:**
- Size: 4×4px, borderRadius 2
- Sit below the date number, centred, gap 2px between dots
- Max 4 dots per day — if more than 4 habits logged, show 4 only
- Today: date number inside green filled circle (keep existing behaviour)
- No dots on future dates

**Dot colours:**
```
fasting (completed fast): #1E8A4F
exercise:                 #E2682A
water:                    #4A90D9
sleep:                    #6B9B4A
mood:                     #9B7BD6
meditation:               #3FA9A0
weight:                   #D9B84A
steps:                    #9B6B4A
energy:                   #D9B84A
symptoms:                 #E85D5D
caffeine:                 #8A5221
```

**Commit:** `v[x.x.x] — home: full date format, calendar spacing, habit dots per day`
**Push → Redeploy → Confirm before proceeding.**

---

## Change 3 — Habit Cards: Persist Green State + Partial Fill

**File:** Home screen dashboard file and the habit card component.

### The problem
Habit card turns green when ticked but reverts to white after ~10 seconds. Data saved correctly in Supabase — the UI reads from local state that resets, not from the database.

### The fix

**Before writing any code:** Read the habit card implementation carefully. Find exactly where the completed state is set and why it resets.

**Steps:**
1. On home screen mount, fetch today's `health_entries` for the current user in a single query. Store in `todayEntries` state.
2. Each habit card derives its completed state from `todayEntries` — not from a local boolean useState.
3. After any habit save, immediately re-fetch `todayEntries` and update state.
4. Set up a Supabase realtime subscription on `health_entries` filtered to `user_id = current user` and `entry_date = today`. On any insert or update, re-fetch `todayEntries`.
5. Never use a separate `useState` boolean for each card's completed status.

**The 24-hour window:** An entry counts as "today" if its `entry_date` matches today's date in `Pacific/Auckland` timezone. Cards stay green until midnight Auckland time, then reset for the new day.

### Partial fill progress

If a habit has a numeric goal and the user has partially met it, the progress bar fills proportionally:
- Water 1200 of 2000ml → 60% fill
- Exercise 20 of 30 mins → 67% fill
- Sleep 8 of 8 hours → 100% (completed)

Fill colour: `#1E8A4F`. Track colour: `#D9ECE0`.

Binary habits (Caffeine, Symptoms) — treat as either logged (full green) or not logged (empty). No partial fill.

**Commit:** `v[x.x.x] — fix: habit cards persist green 24hrs from Supabase, partial fill`
**Push → Redeploy → Test: log a habit, wait 30 seconds, confirm card stays green. Confirm before proceeding.**

---

## Change 4 — Fasting Card: Navigate to Full-Screen Timer + End Fast Works

**Files:** Home screen dashboard file. Fasting timer page (find exact path or create it).

### 4a — Tap fasting card to open full-screen timer

Wrap the entire fasting card in a clickable container. Tapping anywhere on the card EXCEPT the Log glucose and Log ketones buttons navigates to the full-screen fasting timer page. Log glucose and Log ketones buttons must call `e.stopPropagation()` to prevent triggering the card navigation.

### 4b — Full-screen fasting timer page

**Before writing any code:** Check if a fasting timer route already exists. If it does, read the full file. If not, create it. Match design file screen F02 exactly — open the HTML file first.

```
Container:
  Full-screen, background: #1E8A4F, overflow hidden
  Two decorative circles (position absolute, rgba(255,255,255,0.06)):
    Top-right:   width/height 320, borderRadius 320, top -100, right -100
    Bottom-left: width/height 360, borderRadius 360, bottom -120, left -100

Top bar (position absolute, top 56, left 20, right 20,
         display flex, alignItems center, justifyContent space-between):
  Back arrow button:
    width 36, height 36, borderRadius 18
    background rgba(255,255,255,0.15)
    SVG left arrow — stroke white, strokeWidth 2
    On tap: navigate back to home
  Centre label:
    "[X]-HOUR FAST" using actual protocol from fasting_sessions
    Montserrat 600, 11px, rgba(255,255,255,0.8), letterSpacing 0.16em, uppercase
  Right spacer: same width as back button (for centering)

Progress ring (position absolute, centred horizontally, top 130):
  SVG 260×260
  Track circle: cx 130, cy 130, r 120, stroke rgba(255,255,255,0.22),
                strokeWidth 12, fill none
  Progress arc: cx 130, cy 130, r 120, stroke #E2682A, strokeWidth 12, fill none
                strokeDasharray: circumference = 2 * π * 120 = 753.98
                strokeDashoffset: circumference * (1 - elapsed_pct)
                strokeLinecap round, transform rotate(-90deg) from centre
  Centre content (absolute, inset 0, display flex, flexDirection column,
                  alignItems center, justifyContent center):
    Time remaining: Montserrat 700, 40px, white, letterSpacing -0.02em
    "remaining": Lato 13px, rgba(255,255,255,0.7), marginTop 4
    "STARTED [time]": Montserrat 600, 10px, rgba(255,255,255,0.6),
                      letterSpacing 0.18em, uppercase, marginTop 12
    Format started time as "8:00 PM" from fasting_sessions.started_at

"How are you feeling?" section (position absolute, top 440, left 0, right 0):
  Label: "How are you feeling?" — Lato 15px, rgba(255,255,255,0.85), textAlign center
  5 mood options row (display flex, justifyContent center, gap 10, padding 0 16px, marginTop 14):
    Each option (display flex, flexDirection column, alignItems center, gap 6, flex 1):
      Circle (width 36, height 36, borderRadius 18):
        Unselected: background rgba(255,255,255,0.12), border 1px solid rgba(255,255,255,0.3)
        Selected: background white, contains green checkmark SVG
      Label (Montserrat 600, 9px, rgba(255,255,255,0.65), letterSpacing 0.1em):
        EXHAUSTED | LOW | OKAY | GOOD | ENERGISED
  Only one mood selected at a time. On select: save to fasting_sessions (add mood column if needed)

Log buttons row (position absolute, top 560, left 0, right 0,
                 display flex, justifyContent center, gap 10, padding 0 20px):
  "🩸 Log glucose" button:
    height 40, borderRadius 12, flex 1
    background rgba(255,255,255,0.15), border 1px solid rgba(255,255,255,0.3)
    Montserrat 600, 13px, white
    On tap: navigate to glucose logging page
  "🔥 Log ketones" button: same style
    On tap: navigate to ketones logging page

"End my fast" button (position absolute, bottom 24, left 20, right 20):
  height 48, borderRadius 24
  background rgba(255,255,255,0.18)
  border 1px solid rgba(255,255,255,0.35)
  Montserrat 600, 15px, white, textAlign center
  On tap: show End Fast confirmation (see below)
```

**Timer logic:**
- On mount: fetch active `fasting_sessions` row where `status = 'active'` and `user_id = current user`
- Time remaining = `(started_at + target_hours * 3600000) - Date.now()`
- Update every second via `setInterval` — clear on unmount
- Elapsed percentage = `elapsed_seconds / (target_hours * 3600)`
- Pass elapsed_pct to SVG arc strokeDashoffset calculation

### 4c — End fast confirmation

On "End my fast" tap, show a bottom sheet:
```
Sheet (height 48%, white background, borderTopRadius 24):
  Drag handle (40×4, borderRadius 2, background #E8E4D9, centred top)
  "End your fast?" — Montserrat 700, 22px, #1A1A1A, textAlign center, marginTop 10
  "You're [X hrs Y mins] in. You can always start a new one when you're ready."
    Lato 14px, #6B7066, textAlign center, lineHeight 1.4, marginTop 8

  Duration card (marginTop 16):
    background #D9ECE0, borderRadius 16, border 1px solid #A9D7BB
    height 80, display flex, flexDirection column, alignItems center, justifyContent center
    Elapsed time: Montserrat 700, 24px, #1E8A4F (e.g. "5h 32m")
    "of your [X]-hour goal": Lato 12px, #6B7066, marginTop 2

  "Yes, end my fast." — green glow CTA (marginTop 18)
  "Keep going." — white secondary button (height 52, borderRadius 26,
                  background white, border 1px solid #E8E4D9,
                  Montserrat 600, 15px, #1A1A1A, marginTop 10)
```

On "Yes, end my fast.":
1. Update `fasting_sessions` row:
   - `ended_at = NOW()`
   - `duration_minutes = EXTRACT(EPOCH FROM (NOW() - started_at)) / 60`
2. Navigate back to home screen
3. Home screen fasting card shows "fast complete" state:
   - Pale green card background (#D9ECE0), green border
   - Green checkmark circle left
   - "[X]h fast complete" — Montserrat 600, 14px, #1E8A4F
   - Time completed — Lato 13px, #6B7066

On "Keep going.": dismiss sheet, return to timer.

**Commit:** `v[x.x.x] — build: full-screen fasting timer, tap card to open, End fast works`
**Push → Redeploy → Test full flow: tap card → timer opens → end fast → home shows complete state. Confirm before proceeding.**

---

## Change 5 — Habit Detail Pages: Visual Redesign

**Files:** Every file in `web/app/(app)/track/`. Read each file before editing it.
**Reference:** Open `Fastwell Onboarding.html` screens T02–T14 before starting.

### Universal layout — apply to ALL habit pages

```
Page background: #F3F0E7

Top bar (paddingTop 56, paddingHorizontal 20):
  Back arrow button ONLY — no text:
    width 38, height 38, borderRadius 19
    background white, border 1px solid #E8E4D9
    shadow 0 1px 3px rgba(0,0,0,0.04)
    SVG left arrow, stroke #6B7066, strokeWidth 2
    Path: "M9 1L2 9l7 8"
    On tap: navigate back to /track

Hero section (textAlign center, marginTop 16):
  Emoji: fontSize 48, lineHeight 1
  Habit name: Montserrat 700, 26px, #1A1A1A, marginTop 12
  Subtitle: Lato 400, 14px, #6B7066, marginTop 6
    (see subtitle list below — unique per habit)

Goal pill (display flex, justifyContent center, marginTop 14):
  Inner pill: height 36, paddingHorizontal 14, borderRadius 20
    background #D9ECE0, display inline-flex, alignItems center, gap 8
    Text: Montserrat 600, 14px, #1E8A4F (e.g. "Goal: 30 mins")
    Pencil SVG icon: 16×16, stroke #1E8A4F, strokeWidth 1.4
      Path: "M8.5 1.5l2 2L4 10l-3 1 1-3 6.5-6.5z"
  On pencil tap: show inline input or sheet to update goal
    Save goal to user_goals table or profiles JSONB column

White input card (marginTop 16):
  background white, borderRadius 24
  shadow 0 2px 10px rgba(0,0,0,0.04), padding 24
  Contains habit-specific input UI (see per-habit specs below)

Summary line (textAlign center, marginTop 12):
  Montserrat 600, 14px, #1E8A4F
  e.g. "20 of 30 mins logged today." or "Nothing logged yet today."
  Updates immediately after save

Save CTA (marginTop 16):
  Green glow pill — height 56, borderRadius 28, background #1E8A4F
  Glow: absolute element, inset 2, borderRadius 28,
        background #1E8A4F, opacity 0.22, filter blur(14px)
  Text: Montserrat 600, 16px, white
  Label: "Save." (or "Log [habit].")
  On tap: upsert to health_entries, re-fetch, update summary line

LAST 7 DAYS (marginTop 22):
  Label: "LAST 7 DAYS" — Montserrat 600, 11px, #6B7066,
         letterSpacing 1.5, uppercase, textTransform uppercase
  History row (marginTop 8):
    7 cells: MO TU WE TH FR SA SU
    Each cell: flex 1, height 52, borderRadius 12, display flex,
               flexDirection column, alignItems center, justifyContent center, gap 4
    Today cell: background #1E8A4F
      Day label: Montserrat 600, 9px, rgba(255,255,255,0.75), letterSpacing 0.1em
      Value: Montserrat 700, 12px, white
    Has data: background #D9ECE0
      Day label: #6B7066 | Value: #1E8A4F
    No data: background white, border 1px solid #E8E4D9
      Day label: #6B7066 | Value: "—" in #6B7066
    Fetch last 7 days of health_entries for this specific metric
```

### Subtitles — exact text per habit
```
Exercise:   "Every minute counts."
Sleep:      "Rest is where your body repairs."
Water:      "Hydration is everything."
Weight:     "Progress, not perfection."
Mood:       "How you feel matters."
Energy:     "Notice your patterns."
Steps:      "Every step adds up."
Meditation: "Even five minutes changes everything."
Symptoms:   "Knowing is half the battle."
Caffeine:   "Awareness is the first step."
```

### Per-habit input UI (inside the white card)

**Exercise:**
```
Label: "TYPE" — uppercase label style, marginBottom 10
Type chips row (display flex, flexWrap wrap, gap 8):
  Walk | Run | Gym | Swim | Yoga | Cycle | Custom
  Each chip: padding 8px 16px, borderRadius 20, Montserrat 600, 13px
  Selected: background #D9ECE0, border 1px solid #1E8A4F, text #1E8A4F
  Unselected: background white, border 1px solid #E8E4D9, text #1A1A1A
  "Custom" selected → show text input below: "Name your activity"
    Input: height 52, borderRadius 14, border 1px solid #E8E4D9, Lato 16px, marginTop 10

Label: "ADD MORE — DURATION" — uppercase label, marginTop 16, marginBottom 10
Duration grid (display grid, gridTemplateColumns 1fr 1fr 1fr, gap 10):
  15m | 20m | 30m
  45m | 60m | Custom
  Each: height 72, borderRadius 14, background #FBF9F2, border 1px solid #E8E4D9
        Montserrat 600, 16px, #1A1A1A, textAlign center, display flex,
        alignItems center, justifyContent center
  Selected: background #D9ECE0, border 1px solid #1E8A4F, text #1E8A4F
  "Custom" selected → show number input: "Enter minutes"
    Input: height 52, borderRadius 14, border 1px solid #E8E4D9,
           numeric keyboard, Montserrat 700, 20px, marginTop 10

Label: "INTENSITY" — uppercase label, marginTop 16, marginBottom 10
Intensity row (display flex, gap 10):
  Easy | Moderate | Hard
  Each: flex 1, height 52, borderRadius 14, same chip style as type
```

**Sleep:**
```
Replace existing hour grid buttons with tumbler picker.
Use the same Tumbler component built for the age picker in onboarding.

Hours tumbler:
  Values: 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10
  5 rows visible — selected row large (Montserrat 700, 48px, #1E8A4F)
  Adjacent rows smaller (Montserrat 500, 22px, #6B7066, opacity 0.45–0.25)
  Highlight bar behind selected: rgba(30,138,79,0.06), border 1px solid #D9ECE0
  Display format: "7.5 hrs" or "8 hrs"
  White card container: borderRadius 16, border 1px solid #E8E4D9, padding 22 0

Label: "SLEEP QUALITY" — uppercase label, marginTop 16
Star rating (display flex, gap 8, marginTop 8):
  5 options: ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐
  Each: white card, height 52, flex 1, borderRadius 12,
        border 1px solid #E8E4D9, textAlign center, fontSize 14
  Selected: border 1px solid #1E8A4F, background #D9ECE0
```

**Water:**
```
Quick-add grid (display grid, gridTemplateColumns 1fr 1fr, gap 10):
  +250 ml | +500 ml | +750 ml | +1,000 ml
  Each: height 72, borderRadius 14, background #FBF9F2,
        border 1px solid #E8E4D9, Montserrat 600, 16px, #1A1A1A,
        display flex, alignItems center, justifyContent center
  On tap: add that amount to today's total (additive, not replace)

Progress bar (marginTop 18, position relative):
  Track: height 8, borderRadius 4, background #D9ECE0
  Fill: position absolute, left 0, top 0, bottom 0,
        width = (logged/goal)*100%, background #1E8A4F, borderRadius 4
  Droplet dot at fill edge:
    position absolute, right edge of fill, top -4
    width 16, height 16, borderRadius 8
    background white, border 2px solid #1E8A4F
    Contains 💧 at fontSize 8, centred
```

**Weight:**
```
Tumbler picker (same component, values from 40–150 in 0.5 increments)
Default centred on last logged weight or 70

Unit toggle below tumbler (marginTop 16):
  height 48, borderRadius 12, background white, border 1px solid #E8E4D9
  padding 4, display flex, gap 4
  [kg] [lbs] — each fills half
  Active: background #D9ECE0, text #1E8A4F, borderRadius 8
  Inactive: background transparent, text #6B7066
```

**Mood:**
```
5 emoji options (display flex, gap 10, justifyContent center, marginTop 8):
  😞 | 😕 | 😐 | 🙂 | 😊
  Each: width 54, height 54, borderRadius 27, background white,
        border 1px solid #E8E4D9, fontSize 22,
        display flex, alignItems center, justifyContent center
  Selected: border 2px solid #1E8A4F, background #D9ECE0
  Label below each (Montserrat 600, 10px, #6B7066):
    Low | Okay | Good | Great | Amazing
```

**Energy:**
```
Same layout as Mood
Emoji: 😴 | 😓 | 😐 | ⚡ | 🔥
Labels: Exhausted | Low | Okay | Good | Energised
```

**Steps:**
```
Large number display (textAlign center, marginTop 8):
  Current step count: Montserrat 700, 48px, #1E8A4F
  "steps today" below: Lato 13px, #6B7066
  Tap number to edit via numeric input

Quick-add chips (display flex, gap 8, marginTop 16, justifyContent center):
  +1,000 | +2,500 | +5,000
  Each: padding 8px 16px, borderRadius 20, background #D9ECE0,
        Montserrat 600, 13px, #1E8A4F
  On tap: add that amount to today's total
```

**Meditation:**
```
Duration chips (display flex, flexWrap wrap, gap 8):
  5 min | 10 min | 15 min | 20 min | 30 min | Custom
  Same chip style as Exercise type chips
  Custom → show number input
```

**Symptoms:**
```
Symptom chips (display flex, flexWrap wrap, gap 8, marginTop 8):
  Hot flush | Night sweats | Brain fog | Joint pain | Anxiety
  Bloating | Headache | Fatigue | Mood swings | Insomnia
  Each: padding 8px 14px, borderRadius 20, Montserrat 600, 13px
  Multi-select allowed
  Selected: background #D9ECE0, border 1px solid #1E8A4F, text #1E8A4F
  Unselected: background white, border 1px solid #E8E4D9, text #1A1A1A

Label: "SEVERITY" — uppercase label, marginTop 16
Severity dots (display flex, gap 8, marginTop 8):
  5 dots in a row: width 28, height 28, borderRadius 14, each numbered 1–5
  Filled up to selected: background #E2682A | Unfilled: background #E8E4D9
  Tap to select severity level (1 = mild, 5 = severe)
```

**Caffeine:**
```
Toggle row (display flex, alignItems center, justifyContent space-between):
  "Had caffeine today" — Montserrat 600, 15px, #1A1A1A
  Toggle (same style as notifications toggle)

If ON: show text input below
  Placeholder: "Type (e.g. Coffee, green tea)" — optional
  Input: height 52, borderRadius 14, border 1px solid #E8E4D9, Lato 16px
```

**Commit:** `v[x.x.x] — redesign: all habit detail pages — centred layout, subtitles, per-habit inputs`
**Push → Redeploy → Open every habit page and visually compare against the design file before proceeding.**

---

## Change 6 — Learn Tab: Articles Navigate to Dedicated Full Pages

**File:** `web/app/(app)/learn/page.tsx` and new article page files.

### What is broken
Tapping a Learn topic card opens a modal or overlay that renders at full browser width. This must be replaced with navigation to a dedicated route.

### Steps

**Step 1 — Remove the modal.** Find where article content currently renders (likely a `useState` modal or dialog). Delete the modal component and replace the card tap handler with a `router.push()` navigation call.

**Step 2 — Create 4 new page files:**
```
web/app/(app)/learn/regular-cycle/page.tsx
web/app/(app)/learn/perimenopause/page.tsx
web/app/(app)/learn/transition-year/page.tsx
web/app/(app)/learn/post-menopause/page.tsx
```

**Step 3 — Article page layout (all 4 pages use this structure):**
```
Page background: #F3F0E7
Max-width 430px centred (inherited from root layout)

Top bar:
  Back arrow button (same style as habit pages) → navigates to /learn
  No title text in top bar

Coloured header card (borderBottomLeftRadius 28, borderBottomRightRadius 28):
  Topic colours:
    Regular Cycle:   background #D4E8F0, emoji 🌙
    Perimenopause:   background #D9ECE0, emoji 🌊
    Transition Year: background #F0E8D4, emoji 🦋
    Post-Menopause:  background #FBE4D6, emoji 🌟
  Contents (padding 20px sides, paddingTop 56, paddingBottom 24):
    Emoji: fontSize 36
    Title: Montserrat 700, 24px, #1A1A1A, marginTop 10
    "X min read": Lato 13px, #6B7066, marginTop 4

Article body (padding 20, scrollable):
  Content in white cards, one card per section:
    Card: background white, borderRadius 16, padding 16,
          border 1px solid #E8E4D9, marginBottom 12
    Section heading: Montserrat 700, 16px, #1A1A1A, marginBottom 8
    Body text: Lato 400, 15px, #1A1A1A, lineHeight 1.6
    List items: Lato 400, 14px, #1A1A1A, lineHeight 1.5
      Bullet dot: 6×6, borderRadius 3, background #1E8A4F, marginRight 8

Bottom navigation: visible
```

**Step 4 — Move existing content.** Do not rewrite the article content — find it in the existing codebase and move it into these page components.

**Step 5 — Update Learn hub** so each topic card navigates to the correct route on tap.

**Commit:** `v[x.x.x] — fix: Learn articles navigate to dedicated full pages`
**Push → Redeploy → Test all 4 articles open correct pages and are readable on mobile before proceeding.**

---

## Change 7 — Settings: Full Redesign + All Missing Pages Built

**Files:** `web/app/(app)/settings/page.tsx` and all sub-pages. Read every existing settings file before writing any code.

### 7a — Settings hub redesign

Read the current settings page file in full first. Then replace its layout to match design file St01 exactly.

**Remove:** All emoji icons. Appearance/dark mode row (already gone from Change 1). "My Milestones" row.

**Settings hub layout:**
```
Page background: #F3F0E7

Header (paddingTop 56, paddingHorizontal 20):
  Back arrow button → navigates to Me tab
  "Settings" — Montserrat 700, 28px, #1A1A1A, marginTop 14
  "Make Fastwell yours." — Lato 400, 13px, #6B7066, marginTop 4

Groups (paddingHorizontal 20, paddingTop 18, gap 16 between groups):

Group 1 (white card, borderRadius 16, overflow hidden):
  Row — Profile         | person icon  | → chevron
  Row — Change password | lock icon    | → chevron
  Row — Subscription    | card icon    | → [Member pill] + chevron
  Member pill: background #D9ECE0, text #1E8A4F, Montserrat 600, 10px,
               uppercase, paddingH 10, paddingV 3, borderRadius 14

Group 2 (white card):
  Row — Integrations  | link icon | → "Apple Health, Garmin" (Lato 12px #6B7066) + chevron
  Row — Notifications | bell icon | → chevron

Group 3 (white card):
  Row — Supplements & HRT | pill icon     | → chevron
  Row — Export my data    | download icon | → chevron

Group 4 (white card):
  Row — Privacy policy   | document icon | → chevron
  Row — Terms of service | document icon | → chevron

Each row inside a group:
  height 56, paddingHorizontal 16
  display flex, alignItems center, gap 14
  borderBottom 1px solid #E8E4D9 (except last row in each group)

  Icon container:
    width 32, height 32, borderRadius 8, background #F3F0E7
    display flex, alignItems center, justifyContent center

  SVG icons (16×16, stroke currentColor, strokeWidth 1.5, fill none,
             set color #6B7066 on the container):
    Person:   <circle cx="8" cy="6" r="2.5"/>
              <path d="M3 14c1-3 3-4 5-4s4 1 5 4"/>
    Lock:     <rect x="3" y="7" width="10" height="7" rx="1.5"/>
              <path d="M5 7V5a3 3 0 0 1 6 0v2"/>
    Card:     <rect x="2" y="4" width="12" height="9" rx="1.5"/>
              <path d="M2 7h12"/>
    Link:     <path d="M6 10l4-4M6 5H4a3 3 0 0 0 0 6h2M10 11h2a3 3 0 0 0 0-6h-2"/>
    Bell:     <path d="M3 12h10l-1-1V7a4 4 0 0 0-8 0v4l-1 1z"/>
              <path d="M6 13a2 2 0 0 0 4 0"/>
    Pill:     <rect x="2" y="5" width="12" height="6" rx="3"/>
              <path d="M8 5v6"/>
    Download: <path d="M8 2v9m0 0l-3-3m3 3l3-3M3 13h10"/>
    Document: <path d="M4 2h6l3 3v9H4V2z"/>

  Row label: Lato 400, 15px, #1A1A1A, flex 1
  Chevron SVG: width 8, height 14, path "M1 1l6 6-6 6",
               stroke #6B7066, strokeWidth 1.6, fill none

Sign out (marginTop 24, marginBottom 8, paddingHorizontal 20):
  No card. Just text button.
  Text: "Sign out" — Montserrat 600, 15px, #E2682A
  width 100%, textAlign center, padding 12 0
  On tap: supabase.auth.signOut() → clear local state → redirect to /login
  No confirmation dialog — signs out immediately

Version (marginTop 8, marginBottom 20):
  "Fastwell · v[version from package.json]"
  Lato 400, 11px, #6B7066, textAlign center
```

### 7b — Notifications page (build from scratch)

**Route:** `web/app/(app)/settings/notifications/page.tsx`

Match design file St04 exactly:

```
Page background: #F3F0E7
Back arrow → /settings
"Notifications" — Montserrat 700, 24px, marginTop 14
"Only what matters — nothing more." — Lato 13px, muted, marginTop 4

Section label style (used for all three sections):
  Montserrat 600, 11px, #6B7066, uppercase, letterSpacing 1.5
  paddingHorizontal 20, marginTop 20, marginBottom 8

FASTING (white card group):
  Halfway check-in    — toggle — default ON
  Fast complete       — toggle — default ON
  Ready to start?     — toggle — default OFF

TRACKING (white card group):
  Morning habit reminder — toggle ON + "8:00 AM" time label
  Evening wind-down      — toggle ON + "9:00 PM" time label
  Weekly reflection      — toggle OFF

INSIGHTS & MILESTONES (white card group):
  New AI insight       — toggle — default ON
  New milestone earned — toggle — default ON

Each row:
  height 56, paddingHorizontal 16
  display flex, alignItems center
  borderBottom 1px solid #E8E4D9 (except last in group)
  Label: Lato 400, 15px, #1A1A1A, flex 1
  Time label (where applicable): Lato 400, 13px, #6B7066, marginRight 12
  Toggle component:
    width 51, height 31, borderRadius 16, cursor pointer
    ON:  track background #1E8A4F, thumb translated to right
    OFF: track background #E8E4D9, thumb at left
    Thumb: white circle, width 27, height 27, shadow
    Animate 200ms ease

Persistence:
  Add column to profiles if not exists:
    ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}';
  On load: fetch profile → parse notification_prefs → set toggle states
  On change: debounce 500ms → upsert profiles.notification_prefs
  Default if no prefs saved: all ON except "Ready to start?" and "Weekly reflection"
```

### 7c — Supplements & HRT page

**Route:** `web/app/(app)/settings/supplements/page.tsx`

Check if this exists and matches the design. If not, rebuild it to match St06:

```
Page background: #F3F0E7
Back arrow → /settings
"Supplements & HRT" — Montserrat 700, 24px, marginTop 14
"Keep track of what you're taking." — Lato 13px, muted, marginTop 4

Filter pills (display flex, gap 8, marginTop 12, paddingHorizontal 20):
  All | Supplements | HRT | Paused
  Active: background #D9ECE0, text #1E8A4F, no border
  Inactive: background white, border 1px solid #E8E4D9, text #6B7066
  Each: padding 6 12, borderRadius 14, Montserrat 600, 12px

Supplement cards (paddingHorizontal 20, marginTop 16, gap 10, flexDirection column):
  Each card (background white, borderRadius 16, padding 14,
              border 1px solid #E8E4D9, display flex, alignItems center, gap 12):
    Left (flex 1):
      Type badge:
        HRT:        background #E2682A, text white
        SUPPLEMENT: background #D9ECE0, text #1E8A4F
        PAUSED:     background #D9D5C7, text #6B7066
        Style: padding 3 8, borderRadius 10, Montserrat 600, 9px, uppercase
      Name: Montserrat 600, 15px, #1A1A1A, marginTop 4
      Detail: Lato 400, 12px, #6B7066, marginTop 2
        e.g. "50 mcg · twice weekly · Mon + Thu"
    Right: checkmark circle
      Taken: width 26, height 26, borderRadius 13, background #1E8A4F
             white checkmark SVG (path "M1 5l3 3L11 1", strokeWidth 2)
      Not taken: width 26, height 26, borderRadius 13,
                 border 1.5px solid #E8E4D9, no fill
      On tap: toggle taken_today → save to supplements table or health_entries
    Paused card: opacity 0.55

FAB (position fixed/absolute, bottom 24, right 20):
  width 56, height 56, borderRadius 28, background #1E8A4F
  shadow: 0 4px 12px rgba(0,0,0,0.12), green glow behind
  "+" text: white, fontSize 28, Montserrat 500, lineHeight 1
  On tap: open Add Supplement bottom sheet:
    Fields: Name | Type (HRT/Supplement/Medication) | Dose | Frequency | Days (optional)
    "Add" green CTA → INSERT into supplements table
    Dismiss sheet → refresh list

Data: read from and write to supplements table (already in schema)
Filter "All" shows everything. Filter "Paused" shows is_active = false.
```

### 7d — Export my data page (build from scratch)

**Route:** `web/app/(app)/settings/export/page.tsx`

```
Page background: #F3F0E7
Back arrow → /settings
"Export my data" — Montserrat 700, 24px, marginTop 14
"Download a copy of everything Fastwell has stored for you."
  Lato 13px, #6B7066, marginTop 4

White card 1 (marginTop 20, padding 20, borderRadius 16, border 1px solid #E8E4D9):
  "Your full data export" — Montserrat 600, 16px, #1A1A1A
  "Includes all fasting sessions, habit logs, biomarkers, supplements,
   and account details."
  Lato 14px, #6B7066, lineHeight 1.5, marginTop 6
  "Export as PDF" — green glow CTA button, marginTop 16
  On tap: show loading state "Preparing your export…" (1.5s) then show:
    Green success card: "We've sent your export to [user email]. Check your inbox."
    (This is a UI placeholder — actual email generation built later)

White card 2 (marginTop 12, same style):
  "Share with my GP" — Montserrat 600, 16px, #1A1A1A
  "A clean 90-day summary of your fasting, biomarkers, and habits.
   Designed to bring to your next appointment."
  Lato 14px, #6B7066, lineHeight 1.5, marginTop 6
  "Generate GP report" — green glow CTA button, marginTop 16
  On tap: same placeholder pattern → success message
```

### 7e — Privacy policy and Terms of service (build from scratch)

**Routes:**
```
web/app/(app)/settings/privacy/page.tsx
web/app/(app)/settings/terms/page.tsx
```

Both use this layout:
```
Page background: #F3F0E7
Back arrow → /settings
Title (Montserrat 700, 24px, marginTop 14):
  Privacy: "Privacy Policy"
  Terms:   "Terms of Service"

White card (marginTop 20, padding 20, borderRadius 16, border 1px solid #E8E4D9):
  "We're updating our [Privacy Policy / Terms of Service] to make it clearer
   and more straightforward. Check back soon."
  Lato 400, 15px, #1A1A1A, lineHeight 1.6

  Divider: height 1, background #E8E4D9, margin 16 0

  "Questions? Email us at hello@wickedwellbeing.com"
  Lato 400, 13px, #6B7066
  Email address: underlined, tappable — href="mailto:hello@wickedwellbeing.com"
```

**Commit:** `v[x.x.x] — redesign: settings hub + build notifications, supplements, export, privacy, terms`
**Push → Redeploy → Test every settings row navigates correctly. Test sign out. Confirm before proceeding.**

---

## Change 8 — Me Tab: Reduce Spacing + Trends Complete Rebuild

**File:** `web/app/(app)/me/page.tsx` or equivalent. Read it in full before making any changes.

### 8a — Reduce top white space

**What is wrong:** Too much empty space above the avatar at the top of the Me tab.

**Fix:** Reduce `paddingTop` at the top of the Me tab container by approximately 20–30px from its current value. Target: the settings gear icon appears within ~60px of the top of the content area. Move everything up — the gear icon, avatar, name, tier badge, and stats row all shift up together.

Settings gear button:
- Stays top-right corner
- width 36, height 36, borderRadius 18
- background white, border 1px solid #E8E4D9
- Gear SVG, stroke #6B7066
- On tap → navigate to /settings

### 8b — Trends section: complete rebuild

**What is wrong:** Charts are squashed, unreadable, broken on all three time views. Full rebuild required.

**Before writing any code:** Read the current trends implementation. Identify the charting library and why charts are squashing. If the library cannot be fixed by resizing, replace it with Recharts (`npm install recharts`). Wrap all charts in `<ResponsiveContainer width="100%" height={60}>`.

**Trends section layout:**

```
Section header (display flex, alignItems center, justifyContent space-between,
                marginTop 20, marginBottom 0):
  "TRENDS" label — Montserrat 600, 11px, #6B7066, uppercase, letterSpacing 1.5
  "Edit" pill button:
    height 30, paddingHorizontal 12, borderRadius 15
    background white, border 1px solid #E8E4D9
    Lato 400, 12px, #6B7066
    On tap: open Customise sheet (see below)

Time period tabs (display flex, gap 8, marginTop 10, marginBottom 16):
  Week | Month | Year
  Active: background #D9ECE0, text #1E8A4F, Montserrat 600, 13px
  Inactive: background white, border 1px solid #E8E4D9, text #6B7066
  Each: height 36, paddingHorizontal 16, borderRadius 18, flex none
```

**Each trend card:**
```
White card: background white, borderRadius 16, padding 14,
            shadow 0 2px 6px rgba(0,0,0,0.03), marginBottom 12

Header row (display flex, justifyContent space-between,
            alignItems baseline, marginBottom 8):
  Metric name: Montserrat 600, 14px, #1A1A1A
  Summary value: Montserrat 600, 12px, #1E8A4F
    Format: "Avg 16.2h" / "Avg 7.3 hrs" / "Avg 1,850 ml" / "Avg 7,420" etc.
    Use muted (#6B7066) if no data

Chart (height 60, width 100%):
  Bar chart for: Fasting, Water, Steps, Exercise
    Each bar: proportional height, habit colour, borderRadius 2 top corners
    Min bar height: 4px if value > 0
    Zero values: no bar
  Line chart for: Sleep, Energy, Weight, Mood
    Smooth curve, tension 0.3
    Filled area below line at 20% opacity of line colour
    Data point circles: radius 3, habit colour

Day labels below chart (marginTop 6):
  Week:  MO TU WE TH FR SA SU
  Month: 1  5  10  15  20  25  30 (or similar even spacing)
  Year:  Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec
  Style: Lato 400, 10px, #6B7066, textAlign center, display grid

Empty state (if no data for this metric):
  "Nothing logged yet" — Lato italic, 12px, #6B7066, textAlign center,
  padding 16 0
```

**Habit chart colours:**
```
Fasting:  #1E8A4F (green)
Water:    #4A90D9 (blue)
Sleep:    #6B9B4A (light green)
Exercise: #E2682A (orange)
Mood:     #9B7BD6 (purple)
Energy:   #D9B84A (yellow)
Weight:   #4A6BD9 (blue-purple)
Steps:    #9B6B4A (brown)
```

**Data queries per time view:**
```
Week (last 7 days):
  SELECT entry_date, metric, value FROM health_entries
  WHERE user_id = [id] AND entry_date >= NOW() - INTERVAL '7 days'
  GROUP BY entry_date, metric
  Also: SELECT date(started_at), SUM(duration_minutes) / 60.0 FROM fasting_sessions
  WHERE user_id = [id] AND started_at >= NOW() - INTERVAL '7 days'
  AND ended_at IS NOT NULL GROUP BY date(started_at)

Month (last 30 days): same queries, extend interval to '30 days'
Year (last 365 days): same queries, extend to '365 days', group by week or month
```

**Default visible trends (in this order):**
1. Fasting duration
2. Water intake
3. Sleep
4. Exercise

**Customise sheet:**
```
Bottom sheet: height 60%, background #F3F0E7
borderTopLeftRadius 24, borderTopRightRadius 24
Drag handle (40×4, #E8E4D9, centred, marginTop 10)

"Customise trends" — Montserrat 700, 20px, marginTop 10
"Choose what to show." — Lato 14px, muted, marginTop 4

Metric list with toggles (same toggle style as Notifications):
  Fasting duration
  Water intake
  Sleep
  Exercise
  Mood
  Energy
  Weight
  Steps

"Save" green CTA (marginTop 20)
On save:
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trends_prefs JSONB DEFAULT '{}';
  Save as: {"visible": ["fasting", "water", "sleep", "exercise"]}
  Upsert to profiles.trends_prefs
  Dismiss sheet → re-render trends section with updated visible list

On Me tab mount: fetch trends_prefs from profiles and apply to visible trends list.
If no prefs saved: default to Fasting, Water, Sleep, Exercise.
```

**Commit:** `v[x.x.x] — me tab: reduce top spacing, trends complete rebuild, customise sheet`
**Push → Redeploy → Check all 3 time views on trends. Confirm customise saves and persists. Confirm before finishing.**

---

## Final Checklist

**Change 1 — Dark mode removed**
- [ ] No dark mode CSS, no theme toggle, no system preference detection
- [ ] Appearance setting row gone
- [ ] Every screen light mode only
- [ ] Zero build errors — committed and deployed ✓

**Change 2 — Home screen**
- [ ] Date shows "Tuesday, 21 April" format with full day name
- [ ] Increased spacing between calendar strip and fasting card
- [ ] Coloured habit dots appear correctly on calendar days
- [ ] Correct colour per habit type
- [ ] Zero build errors — committed and deployed ✓

**Change 3 — Habit cards**
- [ ] Habit cards stay green — tested after 30+ seconds
- [ ] State comes from Supabase not local useState
- [ ] Partial fill shows correct percentage (water, exercise)
- [ ] Cards reset at midnight Auckland time for new day
- [ ] Zero build errors — committed and deployed ✓

**Change 4 — Fasting timer**
- [ ] Tapping fasting card navigates to full-screen timer
- [ ] Timer shows orange progress ring, ticks every second
- [ ] "STARTED [time]" shows correctly
- [ ] Mood row: 5 options, selectable, saves to Supabase
- [ ] Log glucose and Log ketones buttons navigate correctly
- [ ] "End my fast" is a proper pill button at bottom
- [ ] Confirmation sheet appears with duration card
- [ ] Confirming end updates fasting_sessions correctly in Supabase
- [ ] Home screen shows fast complete state after ending
- [ ] Zero build errors — committed and deployed ✓

**Change 5 — Habit detail pages**
- [ ] All pages centred — emoji, name, subtitle, goal pill, input card
- [ ] Every page has correct subtitle text
- [ ] Goal pill is green with clearly visible 16px pencil icon
- [ ] Back button is arrow only — no text
- [ ] Exercise: Custom duration option works, Custom type works
- [ ] Sleep: tumbler picker replaces button grid
- [ ] 7-day history row shows real Supabase data
- [ ] Save updates summary line immediately
- [ ] Zero build errors — committed and deployed ✓

**Change 6 — Learn articles**
- [ ] All 4 topics navigate to dedicated page routes
- [ ] No modal or overlay used
- [ ] Pages confined to phone width — no full browser width stretching
- [ ] Back arrow returns to Learn hub
- [ ] Article content is readable on mobile
- [ ] Zero build errors — committed and deployed ✓

**Change 7 — Settings**
- [ ] Hub has no emoji — clean SVG icons only
- [ ] Correct 4 grouped card sections
- [ ] Every row navigates to correct sub-page
- [ ] Notifications page built, toggles work, persists on reload
- [ ] Supplements & HRT page matches design file
- [ ] Add supplement sheet saves to Supabase
- [ ] Export my data page built with placeholder success states
- [ ] Privacy and Terms pages built
- [ ] Sign out signs out and redirects to login
- [ ] Version number shows at bottom of settings
- [ ] Zero build errors — committed and deployed ✓

**Change 8 — Me tab**
- [ ] Less white space at top — avatar and gear closer to top of screen
- [ ] Trends cards are readable — not squashed
- [ ] Bar charts: Fasting, Water, Steps, Exercise — correct colours
- [ ] Line charts: Sleep, Energy, Weight, Mood — correct colours
- [ ] Week / Month / Year tabs all show real Supabase data
- [ ] Edit button opens customise sheet
- [ ] Customise selection persists on reload
- [ ] Default order: Fasting, Water, Sleep, Exercise
- [ ] Zero build errors — committed and deployed ✓
