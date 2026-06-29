'use client';

import { BackChip } from '../_components';

// ─── Content — update copy here only, no layout changes needed ───────────────

const LAST_UPDATED = '30 June 2026';

const SECTIONS: { heading: string; body: string }[] = [
  {
    heading: 'What Fastwell is',
    body: 'Fastwell is a health and wellbeing app for women navigating perimenopause, menopause, and beyond. It helps you track fasting, build healthy habits, log how you\'re feeling, and learn along the way.',
  },
  {
    heading: 'Not medical advice',
    body: 'This is the important one. Fastwell is for general wellbeing and information — it is not medical advice and not a substitute for talking to a doctor. Always check with a healthcare professional before changing your diet, fasting routine, exercise, or medication, and with any health concerns.\n\nFasting isn\'t right for everyone. If you\'re pregnant, breastfeeding, have a history of eating disorders, have diabetes, or have any medical condition, please talk to your doctor before fasting. If you ever think you have a medical emergency, contact your doctor or emergency services right away.',
  },
  {
    heading: 'Your account',
    body: 'One account per person. You\'re responsible for keeping your login secure, and you must be at least 18 to use Fastwell. You can delete your account anytime in Settings — no hoops to jump through.',
  },
  {
    heading: 'What you can do',
    body: 'Track your habits and health, start and log fasts, read the learning content, and see your own trends and progress. It\'s your personal space.',
  },
  {
    heading: 'What you can\'t do',
    body: 'Don\'t try to access anyone else\'s data, break or disrupt the app, or use it for anything unlawful. Keep it real and respectful.',
  },
  {
    heading: 'Subscriptions',
    body: 'Some features may need a paid subscription, handled securely through Stripe. We\'ll always show you the price and terms clearly before you pay, and you can manage or cancel anytime in Settings.',
  },
  {
    heading: 'Your data',
    body: 'How we handle your information is covered in our Privacy Policy. You own the data you enter — we just use it to run the app for you.',
  },
  {
    heading: 'Availability',
    body: 'Fastwell is a growing product. We aim for it to be reliable, but things may occasionally break. We don\'t offer uptime guarantees, but we care a lot about your experience and fix issues quickly.',
  },
  {
    heading: 'Changes',
    body: 'We may update these terms as Fastwell evolves. Continued use of the app means you accept the updated terms.',
  },
  {
    heading: 'Governing law',
    body: 'These terms are governed by New Zealand law and the jurisdiction of New Zealand courts.',
  },
  {
    heading: 'Contact',
    body: 'Questions? Email us at wick@wickedwellbeing.com.',
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsTermsPage() {
  return (
    <div className="page page-top">
      <BackChip />

      <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 28, color: 'var(--text)', margin: '16px 0 4px' }}>
        Terms of Service
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
