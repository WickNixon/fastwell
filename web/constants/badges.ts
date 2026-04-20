export type BadgeId =
  | 'you_showed_up'
  | 'first_fast'
  | 'know_your_numbers'
  | 'building_momentum'
  | 'going_deep'
  | 'hydration_queen'
  | 'this_is_who_you_are_now'
  | 'your_body_is_responding'
  | 'three_months_stronger'
  | 'sleep_devotee'
  | 'consistent_mover'
  | 'meal_mindful'
  | 'fortnight_faster'
  | 'blood_sugar_watcher';

export const BADGES: Record<BadgeId, {
  name: string;
  emoji: string;
  description: string;
  earnedMessage: string;
  hint: string;
  trigger: string;
  orange?: boolean;
}> = {

  you_showed_up: {
    name: 'You showed up',
    emoji: '🌱',
    description: 'You completed your Fastwell profile and took the first step.',
    earnedMessage: "The hardest part is starting. You've already done it.",
    hint: 'Complete your onboarding profile.',
    trigger: 'Awarded on completion of onboarding (S12 — goal selected).',
  },

  first_fast: {
    name: 'First fast',
    emoji: '⏳',
    description: 'You completed your very first fasting session.',
    earnedMessage: 'Your first fast is done. Your body noticed.',
    hint: 'Complete your first fasting session.',
    trigger: 'Awarded when fasting_sessions has first row with status = complete for this user.',
  },

  know_your_numbers: {
    name: 'Know your numbers',
    emoji: '📊',
    description: 'You logged your first biomarker reading.',
    earnedMessage: 'Knowing your numbers is how you make it real. Well done.',
    hint: 'Log your first biomarker (glucose or ketones).',
    trigger: 'Awarded when biomarkers table has first row for this user.',
  },

  building_momentum: {
    name: 'Building momentum',
    emoji: '🌿',
    description: 'You completed 7 fasting sessions.',
    earnedMessage: 'Seven fasts in. The rhythm is yours now.',
    hint: 'Complete 7 fasting sessions.',
    trigger: 'Awarded when COUNT(fasting_sessions WHERE status=complete) = 7 for this user.',
  },

  going_deep: {
    name: 'Going deep',
    emoji: '🔥',
    description: 'You completed a 24-hour fast.',
    earnedMessage: 'A 24-hour fast. Your body worked hard and so did you.',
    hint: 'Complete a 24-hour fasting session.',
    trigger: 'Awarded when fasting_sessions has a row where duration_hours >= 24 and status = complete.',
    orange: true,
  },

  hydration_queen: {
    name: 'Hydration queen',
    emoji: '💧',
    description: 'You hit your water goal 7 days in a row.',
    earnedMessage: "Seven days, every drop. That's consistency.",
    hint: 'Hit your water goal 7 days in a row.',
    trigger: 'Awarded when health_entries has 7 consecutive days where metric=water and value >= user water goal.',
  },

  this_is_who_you_are_now: {
    name: 'This is who you are now',
    emoji: '🌟',
    description: 'You logged any habit 30 days in a row.',
    earnedMessage: "Thirty days in a row. This isn't a habit anymore — it's just you.",
    hint: 'Log any habit 30 days in a row.',
    trigger: 'Awarded when health_entries for any single metric shows 30 consecutive days for this user.',
  },

  your_body_is_responding: {
    name: 'Your body is responding',
    emoji: '📈',
    description: 'Your HbA1c improved since you started.',
    earnedMessage: 'Your numbers moved. Your effort made that happen.',
    hint: 'Show improvement in your HbA1c from your first reading.',
    trigger: 'Awarded when biomarkers has 2+ rows where metric=hba1c and the latest value < first value.',
  },

  three_months_stronger: {
    name: 'Three months stronger',
    emoji: '💪',
    description: "You've been with Fastwell for 90 days.",
    earnedMessage: 'Three months. You made it yours.',
    hint: '90 days with Fastwell.',
    trigger: 'Awarded when profiles.created_at is 90+ days ago for this user.',
  },

  sleep_devotee: {
    name: 'Sleep devotee',
    emoji: '🌙',
    description: 'You logged 7+ hours of sleep 5 nights in a row.',
    earnedMessage: 'Five nights of real rest. Recovery is progress.',
    hint: 'Log 7+ hours of sleep 5 nights in a row.',
    trigger: 'Awarded when health_entries has 5 consecutive days where metric=sleep_hours and value >= 7.',
  },

  consistent_mover: {
    name: 'Consistent mover',
    emoji: '🏃',
    description: 'You logged exercise 5 days in a row.',
    earnedMessage: 'Five days moving. Your body is thanking you.',
    hint: 'Log exercise 5 days in a row.',
    trigger: 'Awarded when health_entries has 5 consecutive days where metric=exercise and value > 0.',
  },

  meal_mindful: {
    name: 'Meal mindful',
    emoji: '🥗',
    description: 'You logged 10 meals using the macro analyser.',
    earnedMessage: "Ten meals logged. That's real awareness.",
    hint: 'Log 10 meals using the photo analyser. (Pro feature)',
    trigger: 'Awarded when food_logs COUNT >= 10 for this user.',
  },

  fortnight_faster: {
    name: 'Fortnight faster',
    emoji: '🗓',
    description: 'You completed 14 fasting sessions.',
    earnedMessage: "Fourteen fasts. You've built something real here.",
    hint: 'Complete 14 fasting sessions.',
    trigger: 'Awarded when COUNT(fasting_sessions WHERE status=complete) = 14 for this user.',
  },

  blood_sugar_watcher: {
    name: 'Blood sugar watcher',
    emoji: '🩸',
    description: 'You logged 10 glucose readings.',
    earnedMessage: "Ten readings in. You're building a picture.",
    hint: 'Log 10 glucose readings.',
    trigger: 'Awarded when biomarkers has 10+ rows where metric=glucose for this user.',
  },
};
