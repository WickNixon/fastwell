// ⚠️ PLACEHOLDER CONTENT — Phase 1 structure only.
// Phase 2 replaces all text in this file. No component changes needed for Phase 2.

// ── Daily insight pool ────────────────────────────────────────────────────────
// General pool — not stage-specific. Phase 2 will expand this to ~100+ real insights.
// InsightCard derives the day's entry from UTC date; swipe offset is session state.

export interface Insight {
  id: string;
  title: string; // short hook shown on the card
  detail: string; // expanded text shown in the tap-to-read sheet
}

export const DAILY_INSIGHTS: Insight[] = [
  {
    id: 'ins-1',
    title: '[PLACEHOLDER] Your body is doing something remarkable right now.',
    detail: '[PLACEHOLDER] Longer detail for insight 1 goes here. Two short paragraphs explaining the concept in warm, encouraging language. Written for women 40–80 navigating hormonal change. Non-prescriptive, non-alarming.',
  },
  {
    id: 'ins-2',
    title: '[PLACEHOLDER] Sleep and hormones are more connected than you think.',
    detail: '[PLACEHOLDER] Longer detail for insight 2. Explains the relationship between sleep quality and hormonal rhythms during perimenopause and beyond. Warm, actionable, not alarming.',
  },
  {
    id: 'ins-3',
    title: '[PLACEHOLDER] What you eat in the morning sets your energy for the day.',
    detail: '[PLACEHOLDER] Longer detail for insight 3. Covers how morning nutrition choices — especially protein and fat — influence blood sugar and energy through hormonal shifts. Practical and encouraging.',
  },
  {
    id: 'ins-4',
    title: '[PLACEHOLDER] Stress is a hormone too — and it affects everything else.',
    detail: '[PLACEHOLDER] Longer detail for insight 4. Explains cortisol\'s role in perimenopause and post-menopause, and why managing stress is genuinely physiological, not just mindset work. Compassionate tone.',
  },
  {
    id: 'ins-5',
    title: '[PLACEHOLDER] Fasting works differently at different times of your cycle.',
    detail: '[PLACEHOLDER] Longer detail for insight 5. Introduces the idea of cycle-synced fasting — lighter fasting in the luteal phase, more flexibility in follicular. Grounded in Dr. Mindy Pelz\'s framework.',
  },
  {
    id: 'ins-6',
    title: '[PLACEHOLDER] Small consistent actions outperform big irregular ones.',
    detail: '[PLACEHOLDER] Longer detail for insight 6. Encourages consistency over perfection. References research on habit formation and why women in midlife respond especially well to sustainable routines.',
  },
  {
    id: 'ins-7',
    title: '[PLACEHOLDER] Hydration matters more than you might expect during this stage.',
    detail: '[PLACEHOLDER] Longer detail for insight 7. Covers how oestrogen affects fluid regulation and why hydration needs can shift during perimenopause. Practical tips without being prescriptive.',
  },
];

export type LearnStageId = 'regular_cycle' | 'perimenopause' | 'transition' | 'post_menopause';

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: Array<{ id: string; label: string }>;
  insight: string;
}

export interface StageDefinition {
  id: LearnStageId;
  label: string;
  emoji: string;
  subtitle: string;
  colour: string;
}

export interface StageContent {
  definition: StageDefinition;
  quiz: QuizQuestion[];
  insightCards: Array<{ id: string; text: string }>;
}

export const STAGE_DEFINITIONS: Record<LearnStageId, StageDefinition> = {
  regular_cycle: {
    id: 'regular_cycle',
    label: 'Regular Cycle',
    emoji: '🌙',
    subtitle: '[PLACEHOLDER] Your hormonal rhythm is one of your greatest assets — when you understand it, you can work with it rather than against it. [PLACEHOLDER] Throughout your cycle, oestrogen, progesterone, and other hormones rise and fall in a predictable pattern that shapes your energy, appetite, sleep, and mood. [PLACEHOLDER] Learning to recognise these natural shifts means you can adapt your fasting, exercise, and nutrition to feel your best at every phase. [PLACEHOLDER] This section will walk you through what\'s happening hormonally at each stage of your cycle, and how to use that knowledge to your advantage.',
    colour: '#D9ECE0',
  },
  perimenopause: {
    id: 'perimenopause',
    label: 'Perimenopause',
    emoji: '🌊',
    subtitle: '[PLACEHOLDER] Perimenopause is the years-long transition leading up to menopause, and it can begin as early as your late 30s — though most women notice changes in their 40s. [PLACEHOLDER] During this phase, oestrogen and progesterone levels become more unpredictable, which is why your periods may change and familiar symptoms like sleep disruption, brain fog, or mood shifts can appear. [PLACEHOLDER] The good news is that lifestyle changes — including fasting, nutrition, and movement — can make a real difference to how you feel day to day. [PLACEHOLDER] This section covers what to expect, what\'s completely normal, and how to support your body through the changes.',
    colour: '#D4E8F0',
  },
  transition: {
    id: 'transition',
    label: 'Transition Year',
    emoji: '🦋',
    subtitle: '[PLACEHOLDER] The menopause transition — sometimes called the menopausal year — marks the point when your periods have stopped or become very infrequent, as your body completes its hormonal shift. [PLACEHOLDER] This is often when symptoms like hot flushes, night sweats, and sleep disruption are at their most intense, but it is also a turning point — your body is adapting to a new hormonal baseline. [PLACEHOLDER] Many women find that consistent fasting, protein-focused eating, and stress management help significantly during this phase. [PLACEHOLDER] You are not alone in this, and what you\'re experiencing is a natural biological transition that millions of women navigate every year.',
    colour: '#F0E8D4',
  },
  post_menopause: {
    id: 'post_menopause',
    label: 'Post-Menopause',
    emoji: '☀️',
    subtitle: '[PLACEHOLDER] Post-menopause begins after 12 consecutive months without a period, and for many women it brings a welcome sense of stability as the unpredictability of the transition settles. [PLACEHOLDER] Oestrogen levels are now consistently lower, which means your approach to fasting, nutrition, and movement may need some adjustment to keep your energy, bone density, and metabolic health in good shape. [PLACEHOLDER] The lifestyle choices you make in post-menopause have a compounding effect — consistent habits now lay the foundation for the decades ahead. [PLACEHOLDER] This section covers what changes in your body post-menopause, what to prioritise, and how Fastwell can support you in this new chapter.',
    colour: '#FBE4D6',
  },
};

// Maps profiles.menopause_stage → LearnStageId for "For You" personalisation.
// 'not_sure' and null are intentionally absent → null → gentle default shown.
export const MENOPAUSE_STAGE_TO_LEARN_ID: Partial<Record<string, LearnStageId>> = {
  perimenopause: 'perimenopause',
  transition: 'transition',
  post_menopause: 'post_menopause',
};

export const ALL_STAGES: LearnStageId[] = [
  'regular_cycle',
  'perimenopause',
  'transition',
  'post_menopause',
];

function makePlaceholderQuiz(stageLabel: string): QuizQuestion[] {
  return [
    {
      id: 'q1',
      prompt: `[PLACEHOLDER Q1] A gentle check-in question about ${stageLabel} goes here?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Option A' },
        { id: 'b', label: '[PLACEHOLDER] Option B' },
        { id: 'c', label: '[PLACEHOLDER] Option C' },
      ],
      insight: `[PLACEHOLDER INSIGHT 1] A short, warm insight about ${stageLabel} revealed after answering Q1. One or two sentences.`,
    },
    {
      id: 'q2',
      prompt: `[PLACEHOLDER Q2] How is your energy or sleep feeling during ${stageLabel}?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Really well' },
        { id: 'b', label: '[PLACEHOLDER] Variable' },
        { id: 'c', label: '[PLACEHOLDER] Pretty rough lately' },
      ],
      insight: `[PLACEHOLDER INSIGHT 2] A warm and encouraging observation for Q2, specific to ${stageLabel}.`,
    },
    {
      id: 'q3',
      prompt: `[PLACEHOLDER Q3] Are you noticing any symptoms in ${stageLabel}?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Yes, quite a few' },
        { id: 'b', label: '[PLACEHOLDER] A couple' },
        { id: 'c', label: '[PLACEHOLDER] Not really' },
      ],
      insight: `[PLACEHOLDER INSIGHT 3] A reassuring note about common experiences in ${stageLabel}. Calm and non-alarming.`,
    },
    {
      id: 'q4',
      prompt: `[PLACEHOLDER Q4] How is fasting feeling for you right now in ${stageLabel}?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Natural and easy' },
        { id: 'b', label: '[PLACEHOLDER] Some days are harder' },
        { id: 'c', label: '[PLACEHOLDER] Still finding my rhythm' },
      ],
      insight: `[PLACEHOLDER INSIGHT 4] A practical tip about fasting in ${stageLabel}. Warm and non-judgemental.`,
    },
    {
      id: 'q5',
      prompt: `[PLACEHOLDER Q5] What feels most important to you right now?`,
      options: [
        { id: 'a', label: '[PLACEHOLDER] Better sleep' },
        { id: 'b', label: '[PLACEHOLDER] More energy' },
        { id: 'c', label: '[PLACEHOLDER] Hormonal balance' },
        { id: 'd', label: '[PLACEHOLDER] All of the above' },
      ],
      insight: `[PLACEHOLDER INSIGHT 5] A closing warm note for ${stageLabel}. Encouraging — they completed the check-in.`,
    },
  ];
}

function makePlaceholderInsights(): Array<{ id: string; text: string }> {
  return [
    { id: 'i1', text: '[PLACEHOLDER TIP 1] Sample bite-size insight card. One sentence, warm and actionable.' },
    { id: 'i2', text: '[PLACEHOLDER TIP 2] Another helpful note for this stage. Short, specific, encouraging.' },
    { id: 'i3', text: '[PLACEHOLDER TIP 3] A third tip. Practical, calm, easy to act on today.' },
  ];
}

export const STAGE_CONTENT: Record<LearnStageId, StageContent> = {
  regular_cycle: {
    definition: STAGE_DEFINITIONS.regular_cycle,
    quiz: makePlaceholderQuiz('Regular Cycle'),
    insightCards: makePlaceholderInsights(),
  },
  perimenopause: {
    definition: STAGE_DEFINITIONS.perimenopause,
    quiz: makePlaceholderQuiz('Perimenopause'),
    insightCards: makePlaceholderInsights(),
  },
  transition: {
    definition: STAGE_DEFINITIONS.transition,
    quiz: makePlaceholderQuiz('Transition Year'),
    insightCards: makePlaceholderInsights(),
  },
  post_menopause: {
    definition: STAGE_DEFINITIONS.post_menopause,
    quiz: makePlaceholderQuiz('Post-Menopause'),
    insightCards: makePlaceholderInsights(),
  },
};
