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
    detail: '[PLACEHOLDER] First sentence of insight 1 detail — sets up the concept in warm, grounded language. [PLACEHOLDER] Second sentence expands on it with a practical observation relevant to women navigating hormonal change. [PLACEHOLDER] Third sentence closes with an encouraging, non-prescriptive note that makes the reader feel informed and supported.',
  },
  {
    id: 'ins-2',
    title: '[PLACEHOLDER] Sleep and hormones are more connected than you think.',
    detail: '[PLACEHOLDER] First sentence of insight 2 detail — introduces the connection between sleep and hormones in plain, warm language. [PLACEHOLDER] Second sentence goes deeper on why this matters specifically during the menopause journey, without being alarming. [PLACEHOLDER] Third sentence offers a gentle, actionable takeaway the reader can use today.',
  },
  {
    id: 'ins-3',
    title: '[PLACEHOLDER] What you eat in the morning sets your energy for the day.',
    detail: '[PLACEHOLDER] First sentence of insight 3 detail — frames how morning food choices shape energy and blood sugar for the day ahead. [PLACEHOLDER] Second sentence explains why this is particularly relevant during hormonal transition, in a practical and non-judgemental way. [PLACEHOLDER] Third sentence encourages the reader with a specific, easy action they can take at their next meal.',
  },
  {
    id: 'ins-4',
    title: '[PLACEHOLDER] Stress is a hormone too — and it affects everything else.',
    detail: '[PLACEHOLDER] First sentence of insight 4 detail — explains that stress is a hormonal event, not just a feeling, in a grounded and compassionate way. [PLACEHOLDER] Second sentence describes how cortisol interacts with oestrogen and progesterone during menopause, and why this matters for energy and sleep. [PLACEHOLDER] Third sentence validates what the reader is experiencing and offers a small, practical stress-reduction idea without pressure.',
  },
  {
    id: 'ins-5',
    title: '[PLACEHOLDER] Fasting works differently at different times of your cycle.',
    detail: '[PLACEHOLDER] First sentence of insight 5 detail — introduces the idea that fasting is not one-size-fits-all and varies across the menstrual cycle and hormonal stages. [PLACEHOLDER] Second sentence explains which phases call for lighter fasting and which offer more flexibility, grounded in Dr. Mindy Pelz\'s framework. [PLACEHOLDER] Third sentence reassures the reader that listening to their body is the right instinct, and that Fastwell is designed to help them do exactly that.',
  },
  {
    id: 'ins-6',
    title: '[PLACEHOLDER] Small consistent actions outperform big irregular ones.',
    detail: '[PLACEHOLDER] First sentence of insight 6 detail — reframes consistency as a gentle, sustainable practice rather than an all-or-nothing performance. [PLACEHOLDER] Second sentence explains why small daily habits compound over time, particularly during hormonal transition when the body benefits most from predictability and routine. [PLACEHOLDER] Third sentence celebrates the reader for showing up at all, and encourages them to keep going without pressure or judgement.',
  },
  {
    id: 'ins-7',
    title: '[PLACEHOLDER] Hydration matters more than you might expect during this stage.',
    detail: '[PLACEHOLDER] First sentence of insight 7 detail — explains that hydration needs change during hormonal transition and this is completely normal, not a sign something is wrong. [PLACEHOLDER] Second sentence describes how oestrogen influences fluid regulation and why symptoms like dryness, bloating, or increased thirst can appear during perimenopause and beyond. [PLACEHOLDER] Third sentence offers a simple, practical hydration habit the reader can try, framed warmly and without prescribing a specific amount.',
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
    subtitle: '[PLACEHOLDER] Your hormonal rhythm — understanding what\'s normal for you.',
    colour: '#D9ECE0',
  },
  perimenopause: {
    id: 'perimenopause',
    label: 'Perimenopause',
    emoji: '🌊',
    subtitle: '[PLACEHOLDER] The transition begins — what to expect and how to feel your best.',
    colour: '#D4E8F0',
  },
  transition: {
    id: 'transition',
    label: 'Transition Year',
    emoji: '🦋',
    subtitle: '[PLACEHOLDER] The year of significant change — you\'re not alone in this.',
    colour: '#F0E8D4',
  },
  post_menopause: {
    id: 'post_menopause',
    label: 'Post-Menopause',
    emoji: '☀️',
    subtitle: '[PLACEHOLDER] A new chapter of health, energy, and possibility.',
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
