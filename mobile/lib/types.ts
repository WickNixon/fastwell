// Fastwell — Database Types

export interface Profile {
  id: string;
  full_name: string | null;
  first_name: string | null;
  date_of_birth: string | null;
  age: number | null;
  menopause_stage: 'perimenopause' | 'transition' | 'post_menopause' | 'not_sure' | null;
  has_regular_cycle: 'yes_regular' | 'yes_irregular' | 'no' | null;
  cycle_length_days: number | null;
  on_hrt: 'yes' | 'no' | 'not_sure' | null;
  primary_goal: 'energy' | 'sleep' | 'weight_loss' | 'hormonal_balance' | 'blood_sugar' | 'all' | null;
  theme_preference: 'system' | 'light' | 'dark';
  subscription_tier: 'member' | 'subscriber' | 'inactive';
  trial_ends_at: string | null;
  trial_reminder_sent: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  role: string;
  timezone: string;
  weight_unit: string;
  push_token: string | null;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface FastingSession {
  id: string;
  user_id: string;
  protocol: string | null;
  started_at: string;
  ended_at: string | null;
  duration_minutes: number | null;
  broken_by: string | null;
  notes: string | null;
  created_at: string;
}

export interface HealthEntry {
  id: string;
  user_id: string;
  entry_date: string;
  metric: string;
  value: number | null;
  value_text: string | null;
  unit: string | null;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface SymptomLog {
  id: string;
  user_id: string;
  entry_date: string;
  symptom: string;
  severity: number;
  notes: string | null;
  created_at: string;
}

export interface Biomarker {
  id: string;
  user_id: string;
  marker: string;
  value: number;
  unit: string;
  reading_date: string;
  notes: string | null;
  created_at: string;
}

export interface Supplement {
  id: string;
  user_id: string;
  name: string;
  type: string | null;
  dose: string | null;
  frequency: string | null;
  delivery: string | null;
  brand: string | null;
  is_active: boolean;
  started_at: string | null;
  paused_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AiInsight {
  id: string;
  user_id: string;
  insight_text: string;
  insight_type: string | null;
  generated_at: string;
  expires_at: string;
  shown_at: string | null;
  dismissed_at: string | null;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  badge_name: string;
  earned_at: string;
  seen: boolean;
}

export type SymptomType =
  | 'hot_flush'
  | 'night_sweats'
  | 'brain_fog'
  | 'joint_pain'
  | 'anxiety'
  | 'bloating'
  | 'headache'
  | 'fatigue'
  | 'mood_swings'
  | 'low_libido'
  | 'vaginal_dryness'
  | 'hair_thinning'
  | 'insomnia';

export type FastingProtocol = '16:8' | '18:6' | '20:4' | '24h' | '5:2' | 'custom';
