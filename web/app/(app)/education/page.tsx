'use client';

import { useState } from 'react';

interface Topic {
  icon: string;
  name: string;
  colour: string;
  description: string;
  content: React.ReactNode;
}

function Section({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ width: 28, height: 3, backgroundColor: 'var(--primary)', borderRadius: 2, marginBottom: 6 }} />
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--text)', marginBottom: 8 }}>
        {heading}
      </p>
      <div style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text)', lineHeight: 1.7 }}>
        {children}
      </div>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
      <span style={{ color: 'var(--primary)', marginTop: 2, flexShrink: 0 }}>•</span>
      <span>{children}</span>
    </div>
  );
}

function WeeklyCard({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ backgroundColor: 'var(--primary-pale)', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
      <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 14, color: 'var(--primary)', marginBottom: 4 }}>
        {title}
      </p>
      <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>
        {description}
      </p>
    </div>
  );
}

const TOPICS: Topic[] = [
  {
    icon: '🌙',
    name: 'Regular Cycle',
    colour: '#D9ECE0',
    description: 'Understanding your hormonal rhythm and how to work with it',
    content: (
      <>
        <Section heading="What a regular cycle looks like">
          <p style={{ marginBottom: 10 }}>A typical cycle runs 21–35 days. It begins on the first day of your period and ends the day before your next one. Your body moves through four distinct phases — menstrual, follicular, ovulatory, and luteal — each governed by shifting hormones.</p>
        </Section>
        <Section heading="How hormones fluctuate through the month">
          <Bullet>Oestrogen rises steadily during the follicular phase, peaking just before ovulation</Bullet>
          <Bullet>Progesterone rises after ovulation and dominates the luteal phase</Bullet>
          <Bullet>Both drop sharply before your period if pregnancy doesn&apos;t occur</Bullet>
          <Bullet>These fluctuations affect your energy, mood, hunger, sleep, and body temperature</Bullet>
        </Section>
        <Section heading="How to adapt fasting to your cycle phases">
          <p style={{ marginBottom: 10 }}>Fasting is not one-size-fits-all across your cycle. Listening to your body — and working with its natural rhythm — gets better results than forcing the same protocol every day.</p>
          <Bullet><strong>Follicular phase (days 1–13):</strong> Energy and insulin sensitivity tend to be higher. A good time for longer or more intensive fasting windows if you feel ready</Bullet>
          <Bullet><strong>Ovulatory phase (days 14–16):</strong> Peak energy. Maintain your rhythm, keep eating nutrient-dense meals</Bullet>
          <Bullet><strong>Luteal phase (days 17–28):</strong> Progesterone rises, hunger increases, and blood sugar is less stable. Shorten your fast or eat a small nourishing snack. This is not failure — it is physiology</Bullet>
        </Section>
        <Section heading="Signs your cycle is changing">
          <Bullet>Periods becoming irregular, closer together, or further apart</Bullet>
          <Bullet>Heavier or lighter bleeding than usual</Bullet>
          <Bullet>New premenstrual symptoms — mood changes, sleep disruption, bloating</Bullet>
          <p style={{ marginTop: 8 }}>These are often early signs of perimenopause, typically beginning in the mid-40s — sometimes earlier. Your GP is your best first conversation.</p>
        </Section>
      </>
    ),
  },
  {
    icon: '🌊',
    name: 'Perimenopause',
    colour: '#D4E8F0',
    description: 'The transition begins — what to expect and how to feel your best',
    content: (
      <>
        <Section heading="What perimenopause is and when it starts">
          <p style={{ marginBottom: 10 }}>Perimenopause is the years-long lead-up to your final period. It typically begins in your mid-40s but can start as early as your late 30s. It ends 12 months after your last period — that moment marks menopause.</p>
          <p>During this time your body is recalibrating. Oestrogen and progesterone levels stop following a predictable pattern and begin to fluctuate more unpredictably — sometimes dramatically.</p>
        </Section>
        <Section heading="Common symptoms and why they happen">
          <Bullet>Hot flushes and night sweats — oestrogen fluctuation disrupts the body&apos;s thermostat</Bullet>
          <Bullet>Irregular periods — ovulation becomes unpredictable</Bullet>
          <Bullet>Sleep disruption — lower progesterone and night sweats interrupt rest</Bullet>
          <Bullet>Brain fog and forgetfulness — oestrogen supports cognitive clarity</Bullet>
          <Bullet>Mood changes — hormonal shifts affect serotonin and dopamine levels</Bullet>
          <Bullet>Weight changes — especially around the midsection, as insulin resistance can increase</Bullet>
        </Section>
        <Section heading="How fasting supports hormonal balance">
          <p style={{ marginBottom: 10 }}>Intermittent fasting can be particularly effective in perimenopause — not because it fights symptoms directly, but because it helps regulate the metabolic changes that often accompany this transition.</p>
          <Bullet>Supports insulin sensitivity — important as it can decline in perimenopause</Bullet>
          <Bullet>Reduces inflammatory markers linked to oestrogen fluctuation</Bullet>
          <Bullet>Supports autophagy — your body&apos;s cellular clean-up process</Bullet>
          <Bullet>Can improve sleep quality when eating windows are consistent</Bullet>
          <p style={{ marginTop: 8 }}>Start gently. A 12:12 or 14:10 approach is enough to see benefit without stressing the body.</p>
        </Section>
        <Section heading="Sleep, energy, and mood — what's normal">
          <p style={{ marginBottom: 10 }}>Variability is the hallmark of perimenopause. A week of great sleep followed by a week of broken nights is completely normal. So are windows of high energy punctuated by days of exhaustion. Track what you notice — patterns emerge over months, not days.</p>
        </Section>
        <Section heading="When to talk to your doctor">
          <Bullet>Periods fewer than 21 days apart or very heavy</Bullet>
          <Bullet>Symptoms significantly affecting your quality of life</Bullet>
          <Bullet>Considering HRT — this conversation is worth having early</Bullet>
          <Bullet>Any bleeding after you believe periods have stopped</Bullet>
        </Section>
      </>
    ),
  },
  {
    icon: '🦋',
    name: 'Your Transition Year',
    colour: '#F0E8D4',
    description: 'The 12 months around your final period — a year of significant change',
    content: (
      <>
        <Section heading="What the transition year means">
          <p style={{ marginBottom: 10 }}>Menopause is defined as 12 consecutive months without a period. The transition year is the window immediately surrounding that milestone — typically the final year of perimenopause through to the confirmation of menopause. It is often the most symptomatic phase of the entire journey.</p>
        </Section>
        <Section heading="Why this year is different from perimenopause">
          <p style={{ marginBottom: 10 }}>In perimenopause your hormones fluctuate unpredictably, but there are still periods of higher oestrogen. As you near your final period, oestrogen levels decline more consistently and significantly. The body is adjusting to a new hormonal baseline — and that process takes energy.</p>
          <Bullet>Hot flushes and night sweats often intensify</Bullet>
          <Bullet>Sleep quality frequently reaches its lowest point</Bullet>
          <Bullet>Joint aches, headaches, and low mood are common</Bullet>
          <Bullet>Many women report feeling unlike themselves — this is a valid and recognised experience</Bullet>
        </Section>
        <Section heading="Managing symptoms during the transition">
          <Bullet>Prioritise sleep above everything else — tiredness amplifies every other symptom</Bullet>
          <Bullet>Eat protein at every meal to support muscle mass and blood sugar stability</Bullet>
          <Bullet>Reduce alcohol — it worsens hot flushes and disrupts sleep architecture</Bullet>
          <Bullet>Gentle movement every day — walking, yoga, swimming — supports mood and joint health</Bullet>
          <Bullet>Consider HRT if quality of life is significantly affected — it is safe for most women</Bullet>
        </Section>
        <Section heading="Adjusting your fasting protocol">
          <p style={{ marginBottom: 10 }}>This is not the time to push hard with extended fasting. A 12:12 or 14:10 window is ideal. If you feel hungry, eat. Your body is doing significant work — nourishing it is not a step backwards.</p>
          <Bullet>Prioritise protein and healthy fats during your eating window</Bullet>
          <Bullet>Keep carbohydrates steady rather than very low — low-carb diets can worsen cortisol in this phase</Bullet>
          <Bullet>Avoid fasting on very poor sleep nights — cortisol is already elevated and further stress is counterproductive</Bullet>
        </Section>
        <Section heading="What to expect on the other side">
          <p>Post-menopause, the worst symptoms often ease. Many women report feeling more settled, clearer-headed, and in control of their health than they have in years. The transition year is genuinely hard — but it ends.</p>
        </Section>
      </>
    ),
  },
  {
    icon: '☀️',
    name: 'Post-Menopause',
    colour: '#F3F0E7',
    description: '12 months after your last period — a new chapter of health',
    content: (
      <>
        <Section heading="What post-menopause means for your body">
          <p style={{ marginBottom: 10 }}>Once you have gone 12 months without a period, you are post-menopausal. Your oestrogen and progesterone levels have stabilised at a consistently lower level. The unpredictable swings of perimenopause are behind you — your body is now adapting to its new baseline.</p>
          <p>Key changes to be aware of: bone density can decline (oestrogen was protective), cardiovascular risk increases slightly, and maintaining muscle mass becomes more important than ever. None of these is inevitable — all are manageable with the right lifestyle.</p>
        </Section>
        <Section heading="Four weekly rhythm options for fasting">
          <p style={{ marginBottom: 12 }}>In post-menopause you have more flexibility to choose a fasting rhythm that suits your life. Without a cycle to work around, consistency becomes your biggest asset. Here are four approaches — choose the one that fits your lifestyle and feels sustainable:</p>
          <WeeklyCard
            title="Option 1 — 5:2 approach"
            description="Fast (or eat very lightly, around 500–600 calories) on two non-consecutive days each week. Eat normally on the other five. Good for those who prefer defined fast days rather than daily windows."
          />
          <WeeklyCard
            title="Option 2 — 16:8 daily"
            description="Eat within an 8-hour window every day — for example 10am to 6pm. Fast for the remaining 16 hours including sleep. Consistent and easy to maintain once established. Works well for most post-menopausal women."
          />
          <WeeklyCard
            title="Option 3 — 24-hour weekly fast"
            description="One longer fast per week — dinner to dinner, for example. Eat normally on all other days. This approach gives significant metabolic benefit without daily restriction. Ensure you are well-hydrated and not doing this on stressful days."
          />
          <WeeklyCard
            title="Option 4 — Intuitive fasting"
            description="No fixed protocol. Fast when your body signals readiness — when you wake up genuinely not hungry, extend that naturally. Eat when you are hungry. This works best for women who have practised fasting for some time and have a good relationship with their hunger signals."
          />
        </Section>
        <Section heading="Biomarkers worth tracking post-menopause">
          <Bullet>HbA1c — reflects 3-month blood sugar average. Ask your GP for annual testing</Bullet>
          <Bullet>Fasting glucose — a useful daily or weekly check if you have a home monitor</Bullet>
          <Bullet>Blood pressure — cardiovascular risk increases post-menopause</Bullet>
          <Bullet>Cholesterol (LDL/HDL) — annual blood panel is worth requesting</Bullet>
          <Bullet>Bone density (DEXA scan) — discuss with your GP, especially if not on HRT</Bullet>
        </Section>
        <Section heading="HRT and fasting — how they interact">
          <p style={{ marginBottom: 10 }}>HRT does not interfere with fasting benefits. If anything, HRT can make fasting easier by reducing hot flushes that disrupt sleep (and therefore willpower), and by supporting insulin sensitivity.</p>
          <Bullet>Take oral HRT tablets with a small amount of food if fasting timing is a concern</Bullet>
          <Bullet>Patches and gels are unaffected by fasting windows</Bullet>
          <Bullet>If you start HRT, give your body 8–12 weeks to adjust before judging its effect</Bullet>
          <p style={{ marginTop: 8 }}>HRT is a personal decision. Your GP and this app can both support you — the decision is entirely yours.</p>
        </Section>
      </>
    ),
  },
];

function DetailModal({ topic, onClose }: { topic: Topic; onClose: () => void }) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        backgroundColor: 'var(--background)',
        overflowY: 'auto',
        animation: 'slideUp 0.28s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>

      {/* Sticky header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: topic.colour,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid var(--border)',
      }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text)', flexShrink: 0 }}
          aria-label="Back"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <span style={{ fontSize: 26 }}>{topic.icon}</span>
        <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 17, color: 'var(--text)', flex: 1 }}>
          {topic.name}
        </p>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text-muted)', flexShrink: 0 }}
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ width: 20, height: 20 }}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 20px 48px' }}>
        {topic.content}
      </div>
    </div>
  );
}

export default function EducationPage() {
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  return (
    <div className="page page-top">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 22, color: 'var(--text)', marginBottom: 4 }}>
          Learn
        </h1>
        <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          Understanding your cycle and health through every stage.
        </p>
      </div>

      {/* Topic cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {TOPICS.map(topic => (
          <button
            key={topic.name}
            onClick={() => setActiveTopic(topic)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              backgroundColor: topic.colour,
              border: 'none', borderRadius: 14, padding: '16px 18px',
              cursor: 'pointer', textAlign: 'left', width: '100%',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            }}
          >
            <span style={{ fontSize: 32, flexShrink: 0 }}>{topic.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3 }}>
                {topic.name}
              </p>
              <p style={{ fontFamily: 'Lato, sans-serif', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {topic.description}
              </p>
            </div>
            <span style={{ color: 'var(--primary)', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 13, flexShrink: 0, whiteSpace: 'nowrap' }}>
              Read →
            </span>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {activeTopic && (
        <DetailModal topic={activeTopic} onClose={() => setActiveTopic(null)} />
      )}
    </div>
  );
}
