import { corsHeaders, errorResponse, getServiceClient, jsonResponse } from '../_shared/supabase.ts';

const BADGE_REGISTRY: Record<string, { name: string; message: string }> = {
  onboarding_complete: {
    name: 'You showed up',
    message: 'Completing your profile is the first step most people never take. Welcome to Fastwell.',
  },
  first_fast: {
    name: 'First fast',
    message: 'Your first fasting session is in the books. This is where it begins.',
  },
  know_your_numbers: {
    name: 'Know your numbers',
    message: "You've logged your HbA1c. Now you have a starting point — and in three months, you'll see how far you've come.",
  },
  momentum_7: {
    name: 'Building momentum',
    message: 'Seven days of showing up for yourself. This is what consistency actually looks like.',
  },
  lifestyle_30: {
    name: 'This is who you are now',
    message: 'Thirty days. Not perfect — consistent. That\'s the one that changes everything.',
  },
  deep_fast: {
    name: 'Going deep',
    message: 'A 24-hour fast. Your body worked hard and so did you.',
  },
  hydration_7: {
    name: 'Hydration queen',
    message: 'Seven days of logging your water. Your body notices.',
  },
  first_export: {
    name: 'Taking control',
    message: "You've generated your first GP report. Your data is yours — use it.",
  },
  hba1c_improved: {
    name: 'Your body is responding',
    message: 'Your HbA1c has improved since you started. Your hard work is showing up in your results.',
  },
  three_months: {
    name: 'Three months stronger',
    message: 'Three months ago you started something. Look at where you are now.',
  },
  six_months: {
    name: 'Half a year of you',
    message: "Six months of showing up. That is not a habit anymore — it's who you are.",
  },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const { user_id, badge_key } = await req.json();
    if (!user_id || !badge_key) return errorResponse('user_id and badge_key are required', 'MISSING_FIELDS');

    const badge = BADGE_REGISTRY[badge_key];
    if (!badge) return errorResponse(`Unknown badge_key: ${badge_key}`, 'UNKNOWN_BADGE');

    const supabase = getServiceClient();

    const { data: existing } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', user_id)
      .eq('badge_key', badge_key)
      .single();

    if (existing) return jsonResponse({ awarded: false, reason: 'already_earned' });

    await supabase.from('user_badges').insert({
      user_id,
      badge_key,
      badge_name: badge.name,
      seen: false,
    });

    return jsonResponse({ awarded: true, badge_name: badge.name, message: badge.message });
  } catch (e) {
    console.error('award-badge error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
