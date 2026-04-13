import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.2?target=deno';
import { corsHeaders, errorResponse, getServiceClient, jsonResponse } from '../_shared/supabase.ts';

const SYSTEM_PROMPT = `You are the insight engine for Fastwell, a health tracking app for women in menopause.
Generate 1–3 short insight cards based on the user's data.
Rules:
- Use the user's first name
- Maximum 2 short sentences per insight
- Reference specific numbers from the data
- Warm, observational tone — never alarming or prescriptive
- No medical advice. Plain language.
- Return as a JSON array of strings only, e.g. ["Insight one.", "Insight two."]`;

function buildDataSummary(profile: Record<string, unknown>, data: Record<string, unknown>): string {
  return `
User: ${profile.first_name}, stage: ${profile.menopause_stage}, goal: ${profile.primary_goal}

Last 30 days summary:
- Fasting sessions completed: ${data.fasting_count}
- Average fasting duration: ${data.avg_fasting_minutes} minutes
- Average sleep: ${data.avg_sleep_hours} hours/night
- Average sleep quality: ${data.avg_sleep_quality}/5
- Average energy level: ${data.avg_energy}/5
- Average mood: ${data.avg_mood}/5
- Water logged (days): ${data.water_days_logged}/${data.total_days}
- Average daily water: ${data.avg_water_ml}ml
- Steps (avg/day): ${data.avg_steps}
- Symptoms logged this period: ${JSON.stringify(data.symptom_summary)}
- Most recent HbA1c: ${data.latest_hba1c ?? 'none'}
- First HbA1c: ${data.first_hba1c ?? 'none'}
- Best fasting day: ${data.best_fasting_day ?? 'unknown'}
`.trim();
}

async function getAggregateData(userId: string, supabase: ReturnType<typeof getServiceClient>) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const [fasting, health, symptoms, hba1c] = await Promise.all([
    supabase
      .from('fasting_sessions')
      .select('started_at, ended_at, duration_minutes')
      .eq('user_id', userId)
      .gte('started_at', dateStr)
      .not('ended_at', 'is', null),
    supabase
      .from('health_entries')
      .select('entry_date, metric, value')
      .eq('user_id', userId)
      .gte('entry_date', dateStr),
    supabase
      .from('symptoms_log')
      .select('symptom, severity, entry_date')
      .eq('user_id', userId)
      .gte('entry_date', dateStr),
    supabase
      .from('biomarkers')
      .select('value, reading_date')
      .eq('user_id', userId)
      .eq('marker', 'hba1c')
      .order('reading_date', { ascending: true }),
  ]);

  const sessions = fasting.data ?? [];
  const entries = health.data ?? [];
  const symptomRows = symptoms.data ?? [];
  const hba1cRows = hba1c.data ?? [];

  const byMetric = (m: string) => entries.filter((e) => e.metric === m).map((e) => e.value as number).filter(Boolean);
  const avg = (arr: number[]) => arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0;

  const symptomSummary: Record<string, number> = {};
  for (const s of symptomRows) {
    symptomSummary[s.symptom] = (symptomSummary[s.symptom] ?? 0) + 1;
  }

  const dayOfWeekCounts: Record<string, number> = {};
  for (const s of sessions) {
    const day = new Date(s.started_at).toLocaleDateString('en-NZ', { weekday: 'long' });
    dayOfWeekCounts[day] = (dayOfWeekCounts[day] ?? 0) + 1;
  }
  const bestDay = Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const uniqueDates = new Set(entries.map((e) => e.entry_date));

  return {
    fasting_count: sessions.length,
    avg_fasting_minutes: avg(sessions.map((s) => s.duration_minutes).filter(Boolean) as number[]),
    avg_sleep_hours: avg(byMetric('sleep_hours')),
    avg_sleep_quality: avg(byMetric('sleep_quality')),
    avg_energy: avg(byMetric('energy_level')),
    avg_mood: avg(byMetric('mood')),
    avg_water_ml: avg(byMetric('water_ml')),
    water_days_logged: byMetric('water_ml').length,
    avg_steps: avg(byMetric('steps')),
    total_days: 30,
    symptom_summary: symptomSummary,
    latest_hba1c: hba1cRows.at(-1)?.value ?? null,
    first_hba1c: hba1cRows[0]?.value ?? null,
    best_fasting_day: bestDay ?? null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  try {
    const { user_id } = await req.json();
    if (!user_id) return errorResponse('user_id is required', 'MISSING_USER_ID');

    const supabase = getServiceClient();

    // Check cache — if valid insights exist, return them
    const { data: cached } = await supabase
      .from('ai_insights')
      .select('insight_text')
      .eq('user_id', user_id)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(3);

    if (cached && cached.length > 0) {
      return jsonResponse({ insights: cached.map((c) => c.insight_text), cached: true });
    }

    // Check minimum 7 days of data
    const { count } = await supabase
      .from('health_entries')
      .select('entry_date', { count: 'exact', head: true })
      .eq('user_id', user_id);

    if ((count ?? 0) < 1) {
      const { count: fastingCount } = await supabase
        .from('fasting_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user_id);
      if ((fastingCount ?? 0) < 7) {
        return jsonResponse({ insights: [], reason: 'insufficient_data' });
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, menopause_stage, primary_goal')
      .eq('id', user_id)
      .single();

    if (!profile?.first_name) return jsonResponse({ insights: [], reason: 'no_profile' });

    const data = await getAggregateData(user_id, supabase);

    const client = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: buildDataSummary(profile, data) }],
    });

    const rawText = message.content[0].type === 'text' ? message.content[0].text : '[]';
    let insights: string[] = [];
    try {
      insights = JSON.parse(rawText);
    } catch {
      // Fallback: try to extract array from text
      const match = rawText.match(/\[[\s\S]*\]/);
      if (match) insights = JSON.parse(match[0]);
    }

    if (!Array.isArray(insights) || insights.length === 0) {
      return jsonResponse({ insights: [], reason: 'parse_error' });
    }

    // Clear old expired insights
    await supabase
      .from('ai_insights')
      .delete()
      .eq('user_id', user_id)
      .lt('expires_at', new Date().toISOString());

    // Insert new insights
    const expiresAt = new Date(Date.now() + 86400000).toISOString();
    for (const insightText of insights.slice(0, 3)) {
      await supabase.from('ai_insights').insert({
        user_id,
        insight_text: insightText,
        data_snapshot: data,
        expires_at: expiresAt,
      });
    }

    return jsonResponse({ insights, cached: false });
  } catch (e) {
    console.error('generate-insights error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
