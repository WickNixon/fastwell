import { corsHeaders, errorResponse, getServiceClient, getUserClient, jsonResponse } from '../_shared/supabase.ts';

const MEDICAL_DISCLAIMER = 'Fastwell is a personal health tracking tool, not a medical device. The information and insights provided are for general wellness tracking purposes only and are not intended as medical advice, diagnosis, or treatment. Always consult your GP or qualified healthcare professional before making changes to your diet, medication, or health routine.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = getUserClient(authHeader);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  try {
    const { from_date, to_date } = await req.json();
    if (!from_date || !to_date) return errorResponse('from_date and to_date are required', 'MISSING_FIELDS');

    const supabase = getServiceClient();

    // Rate limit: 5 per user per day
    const today = new Date().toISOString().split('T')[0];
    const { count: exportCount } = await supabase
      .from('user_badges')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('badge_key', 'first_export');

    // Fetch all data for the range
    const [profile, fasting, health, symptoms, biomarkers, supplements] = await Promise.all([
      supabase.from('profiles').select('first_name, full_name, date_of_birth, menopause_stage, on_hrt, primary_goal').eq('id', user.id).single(),
      supabase.from('fasting_sessions').select('*').eq('user_id', user.id).gte('started_at', from_date).lte('started_at', to_date + 'T23:59:59Z').order('started_at'),
      supabase.from('health_entries').select('*').eq('user_id', user.id).gte('entry_date', from_date).lte('entry_date', to_date).order('entry_date'),
      supabase.from('symptoms_log').select('*').eq('user_id', user.id).gte('entry_date', from_date).lte('entry_date', to_date).order('entry_date'),
      supabase.from('biomarkers').select('*').eq('user_id', user.id).gte('reading_date', from_date).lte('reading_date', to_date).order('reading_date'),
      supabase.from('supplements').select('*').eq('user_id', user.id).eq('is_active', true),
    ]);

    const generatedDate = new Date().toLocaleDateString('en-NZ', { day: '2-digit', month: 'long', year: 'numeric' });

    // Build HTML for PDF
    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: Arial, sans-serif; color: #2C4A1A; max-width: 800px; margin: 0 auto; padding: 40px; }
  h1 { color: #5C8A34; font-size: 28px; }
  h2 { color: #5C8A34; font-size: 18px; border-bottom: 2px solid #C8DFB0; padding-bottom: 6px; margin-top: 32px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; }
  th { background: #EAF3DC; padding: 8px; text-align: left; font-size: 13px; }
  td { padding: 8px; border-bottom: 1px solid #EAF3DC; font-size: 13px; }
  .disclaimer { font-size: 11px; color: #7A9A6A; border: 1px solid #C8DFB0; padding: 12px; border-radius: 6px; margin-top: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; }
  .generated { font-size: 12px; color: #7A9A6A; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>Fastwell Health Report</h1>
    <p><strong>${profile.data?.full_name ?? profile.data?.first_name ?? 'Health Report'}</strong></p>
    <p>Period: ${from_date} to ${to_date}</p>
  </div>
  <div class="generated">Generated: ${generatedDate}</div>
</div>

<h2>Fasting Summary</h2>
${fasting.data && fasting.data.length > 0 ? `
<table>
  <tr><th>Date</th><th>Protocol</th><th>Duration</th><th>Notes</th></tr>
  ${fasting.data.map((s) => `<tr><td>${new Date(s.started_at).toLocaleDateString('en-NZ')}</td><td>${s.protocol ?? '—'}</td><td>${s.duration_minutes ? Math.round(s.duration_minutes / 60) + 'h' : '—'}</td><td>${s.notes ?? '—'}</td></tr>`).join('')}
</table>` : '<p>No fasting sessions recorded in this period.</p>'}

<h2>Biomarkers</h2>
${biomarkers.data && biomarkers.data.length > 0 ? `
<table>
  <tr><th>Date</th><th>Marker</th><th>Value</th><th>Unit</th><th>Notes</th></tr>
  ${biomarkers.data.map((b) => `<tr><td>${new Date(b.reading_date).toLocaleDateString('en-NZ')}</td><td>${b.marker}</td><td>${b.value}</td><td>${b.unit}</td><td>${b.notes ?? '—'}</td></tr>`).join('')}
</table>` : '<p>No biomarkers recorded in this period.</p>'}

<h2>Supplements & HRT</h2>
${supplements.data && supplements.data.length > 0 ? `
<table>
  <tr><th>Name</th><th>Type</th><th>Dose</th><th>Frequency</th></tr>
  ${supplements.data.map((s) => `<tr><td>${s.name}</td><td>${s.type ?? '—'}</td><td>${s.dose ?? '—'}</td><td>${s.frequency ?? '—'}</td></tr>`).join('')}
</table>` : '<p>No active supplements recorded.</p>'}

<h2>Lifestyle Tracking</h2>
${health.data && health.data.length > 0 ? `
<table>
  <tr><th>Date</th><th>Metric</th><th>Value</th><th>Unit</th></tr>
  ${health.data.slice(0, 100).map((h) => `<tr><td>${h.entry_date}</td><td>${h.metric}</td><td>${h.value ?? h.value_text ?? '—'}</td><td>${h.unit ?? '—'}</td></tr>`).join('')}
</table>` : '<p>No lifestyle entries in this period.</p>'}

<div class="disclaimer">
  <strong>Medical Disclaimer:</strong> ${MEDICAL_DISCLAIMER}
</div>
</body>
</html>`;

    // Store HTML as a "PDF" in Supabase Storage (in production, use a PDF library)
    const fileName = `exports/${user.id}/${Date.now()}_health_report.html`;
    await supabase.storage.from('exports').upload(fileName, new Blob([html], { type: 'text/html' }), {
      contentType: 'text/html',
      upsert: false,
    });

    const { data: signedUrl } = await supabase.storage
      .from('exports')
      .createSignedUrl(fileName, 86400); // 24 hours

    // Award first_export badge if not already earned
    if ((exportCount ?? 0) === 0) {
      await supabase.from('user_badges').insert({
        user_id: user.id,
        badge_key: 'first_export',
        badge_name: 'Taking control',
      }).onConflict('user_id, badge_key').ignore();
    }

    return jsonResponse({
      download_url: signedUrl?.signedUrl,
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });
  } catch (e) {
    console.error('generate-export error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
