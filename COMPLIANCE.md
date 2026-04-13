# COMPLIANCE.md — Fastwell

## Overview

Fastwell handles sensitive personal health data. Compliance is foundational to user trust and legal operation in New Zealand. This is not optional.

---

## NZ Privacy Act 2020

**IPP 1 — Purpose of Collection**
We only collect information necessary for Fastwell's function. Onboarding questions are the minimum needed to personalise the experience.

**IPP 3 — Collection from the Individual**
We tell users clearly what we're collecting and why at each collection point.

**IPP 6 — Access**
Users can export their data via the Results PDF. A full data export is available on request.

**IPP 7 — Correction**
Users can edit all data they've entered. Onboarding answers are editable in Settings → Profile.

**IPP 10 — Limits on Use**
We use data only to provide the Fastwell service. We do not sell, share, or use data for advertising.

**IPP 11 — Limits on Disclosure**
We do not disclose user data to third parties except:
- Supabase (data processor — covered by their DPA)
- Stripe (payment data only — no health data ever)
- Anthropic (AI insights — data sent as anonymised summary only, no PII beyond first name)
- Garmin (user-initiated OAuth — we read from them, not share to them)
- Apple (HealthKit — read-only, no data sent back to Apple)

---

## Health Data Classification

Weight, HbA1c, blood glucose, symptoms, medications, HRT details — classified as sensitive personal information. Highest standard of care required.

- All data encrypted at rest (Supabase standard)
- All data in transit: TLS 1.2+
- OAuth tokens: Supabase Vault (additional encryption)
- No health data ever touches Stripe
- Admin dashboard shows activity only — individual health entries never visible to admins
- Data sent to Claude API: aggregated summaries only, first name only, no email or payment data

---

## Privacy Policy Requirements

Must be in place before launch:
- What we collect and why
- How we store and protect it
- Who we share it with (and that we don't sell it)
- How users can access, correct, or delete their data
- Contact details for privacy queries
- Date last updated

Must be:
- Linked and acknowledged during onboarding
- Accessible from Settings at any time
- Written in plain language

---

## Terms of Service Requirements

Must cover:
- Eligibility (18+)
- What Fastwell is and is not (not a medical device, not clinical advice)
- Subscription terms (billing, cancellation, refunds — NZD)
- User responsibilities
- Limitation of liability
- Governing law: New Zealand

---

## Medical Disclaimer

Must appear in the app and on every PDF export:

> "Fastwell is a personal health tracking tool, not a medical device. The information and insights provided are for general wellness tracking purposes only and are not intended as medical advice, diagnosis, or treatment. Always consult your GP or qualified healthcare professional before making changes to your diet, medication, or health routine."

---

## Anthropic / Claude API

Data sent to generate AI insights must be:
- Aggregated summaries (e.g. "average sleep 6.8 hours") not raw daily entries
- First name only — no full name, email, or account identifiers
- No payment or subscription data
- No sensitive biomarker readings in raw form (use ranges or averages)

This minimises data exposure and aligns with IPP 11.

---

## Stripe & PCI DSS

Stripe is PCI DSS Level 1 compliant. We never store, transmit, or process raw card data. No card numbers are logged anywhere in Fastwell systems.

---

## Apple App Store Requirements

Required Info.plist keys:
```xml
<key>NSHealthShareUsageDescription</key>
<string>Fastwell reads your health data from Apple Health to automatically 
track your steps, sleep, and workouts so you don't have to log them manually.</string>

<key>NSHealthUpdateUsageDescription</key>
<string>Fastwell writes water intake data to Apple Health to keep your 
records consistent.</string>
```

Privacy policy must be live before HealthKit access is approved.

---

## Data Retention & Deletion

Users can delete their account from Settings → Account → Delete account.

On deletion:
1. All health_entries, fasting_sessions, biomarkers, symptoms_log, supplements, user_badges, ai_insights deleted immediately
2. All integration_tokens deleted and OAuth tokens revoked
3. Stripe subscription cancelled
4. profiles row anonymised and soft-deleted for 30 days, then hard-deleted
5. email_log entries retained for 90 days (compliance), then deleted
6. Communicate clearly before confirming: deleted data cannot be recovered

---

## Pre-Launch Compliance Checklist

- [ ] Privacy Policy drafted, reviewed by NZ lawyer, published at public URL
- [ ] Terms of Service drafted and published
- [ ] Medical disclaimer in app and on every PDF export
- [ ] Supabase RLS tested — users cannot access each other's data
- [ ] Garmin developer application submitted (do this now — 1–4 week approval)
- [ ] Apple HealthKit permission strings in Info.plist
- [ ] Stripe webhook signature verification implemented
- [ ] Data deletion flow tested end-to-end
- [ ] Onboarding privacy acknowledgement implemented
- [ ] Claude API data minimisation confirmed — no PII beyond first name sent
- [ ] Password reset link expiry tested (1 hour)
- [ ] Breach response plan documented internally
