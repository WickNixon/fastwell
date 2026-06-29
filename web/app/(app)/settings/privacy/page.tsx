'use client';

import { BackChip } from '../_components';

// ─── Content — update copy here only, no layout changes needed ───────────────

const LAST_UPDATED = '30 June 2026';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'What we collect',
    body: 'Your email address and first name. The things you choose to track in the app — your fasting sessions, sleep, water, steps, exercise, mood, energy, weight, meals, supplements, and any symptoms or biomarkers (like blood glucose or ketones) you log. Your profile answers about your menopause stage and goals. And basic usage data like which features you use, so we can make the app better.',
  },
  {
    heading: 'What we don\'t collect',
    body: 'We don\'t sell your data. We don\'t use ad tracking. We don\'t share your health information with advertisers — ever. We only collect what we need to make Fastwell work for you.',
  },
  {
    heading: 'How we use your data',
    body: 'To run the app — showing you your trends, personalising your experience to your stage, and powering features like meal analysis and insights. To improve Fastwell using overall patterns (not individual tracking). And to email you about your account when needed. No marketing spam, ever.',
  },
  {
    heading: 'Your health data',
    body: 'Some of what you track — like weight, blood glucose, symptoms, or HRT details — is sensitive. We treat it carefully: it\'s encrypted, only you can see your own data, and it\'s never used for anything except giving you the Fastwell service.',
  },
  {
    heading: 'Third-party services',
    body: 'We use a small number of trusted services to run Fastwell: Supabase (secure database and login), Vercel (hosting), Stripe (subscription payments — Stripe only ever sees payment info, never your health data), Anthropic / Claude AI (powers meal analysis and insights, and only receives anonymised summaries with no identifying details beyond your first name), and Resend (account emails). None of these receive your data for advertising purposes.',
  },
  {
    heading: 'Where your data lives',
    body: 'Your data is stored securely with Supabase and encrypted.',
  },
  {
    heading: 'Your rights',
    body: 'You can see your data anytime in the app, and export it (Settings → Export my data). You can edit anything you\'ve entered, including your profile answers (Settings → Profile). And you can permanently delete your account and all your data whenever you want (Settings → Delete my account) — no hoops. If you need help, email wick@wickedwellbeing.com.\n\nUnder the NZ Privacy Act 2020 you also have the right to ask us for a copy of your information or to complain to the Office of the Privacy Commissioner (www.privacy.org.nz).',
  },
  {
    heading: 'Children',
    body: 'Fastwell is made for adults and isn\'t designed for anyone under 18.',
  },
  {
    heading: 'Changes',
    body: 'We may update this policy as Fastwell grows. We\'ll note the date below and let you know about big changes.',
  },
  {
    heading: 'Contact',
    body: 'Questions about your data? Email us at wick@wickedwellbeing.com.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPrivacyPage() {
  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--text)', margin: '16px 0 4px' }}>
        Privacy Policy
      </h1>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 12, color: 'var(--text-muted)', marginBottom: 32 }}>
        Last updated: {LAST_UPDATED}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, paddingBottom: 40 }}>
        {SECTIONS.map(({ heading, body }) => (
          <div key={heading}>
            <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>
              {heading}
            </p>
            {body.split('\n\n').map((paragraph, i) => (
              <p key={i} style={{ fontFamily: 'Lato, sans-serif', fontSize: 15, color: 'var(--text)', lineHeight: 1.6, marginBottom: i < body.split('\n\n').length - 1 ? 12 : 0 }}>
                {paragraph}
              </p>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
