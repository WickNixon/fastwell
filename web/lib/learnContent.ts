// ⚠️ PLACEHOLDER CONTENT — Phase 1 structure only.
// Phase 2 replaces all text in this file. No component changes needed for Phase 2.

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
