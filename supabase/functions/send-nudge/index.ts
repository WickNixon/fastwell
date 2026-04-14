// Edge Function: send-nudge
// Admin-only: sends coach nudge notifications via Expo Push API
// Also used internally by badge-award triggers for celebration notifications

import { corsHeaders, errorResponse, getServiceClient, getUserClient, jsonResponse } from '../_shared/supabase.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: 'default' | null;
}

async function sendExpoPushBatch(messages: PushMessage[]): Promise<{ ok: number; failed: number }> {
  if (messages.length === 0) return { ok: 0, failed: 0 };

  // Expo Push API accepts batches of up to 100
  const BATCH_SIZE = 100;
  let ok = 0;
  let failed = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      const resp = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(batch),
      });

      if (!resp.ok) { failed += batch.length; continue; }

      const result = await resp.json();
      const receipts: Array<{ status: string }> = result.data ?? [];
      receipts.forEach((r) => {
        if (r.status === 'ok') ok++;
        else failed++;
      });
    } catch {
      failed += batch.length;
    }
  }

  return { ok, failed };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders() });

  const authHeader = req.headers.get('Authorization') ?? '';
  const userClient = getUserClient(authHeader);
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return errorResponse('Unauthorized', 'UNAUTHORIZED', 401);

  const supabase = getServiceClient();
  const { data: callerProfile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!callerProfile || callerProfile.role !== 'admin') return errorResponse('Forbidden', 'FORBIDDEN', 403);

  try {
    const { target, user_id, title, body, data } = await req.json();
    if (!title || !body) return errorResponse('title and body are required', 'MISSING_FIELDS');

    let targets: Array<{ id: string; push_token: string | null }> = [];

    if (target === 'all') {
      const { data: rows } = await supabase
        .from('profiles')
        .select('id, push_token')
        .neq('subscription_tier', 'inactive');
      targets = rows ?? [];
    } else if (target === 'user' && user_id) {
      const { data: row } = await supabase
        .from('profiles')
        .select('id, push_token')
        .eq('id', user_id)
        .single();
      if (row) targets = [row];
    } else {
      return errorResponse('target must be "all" or "user" with user_id', 'INVALID_TARGET');
    }

    // Log all notifications
    if (targets.length > 0) {
      await supabase.from('notifications_log').insert(
        targets.map((t) => ({
          user_id: t.id,
          sent_by: user.id,
          type: 'coach_nudge',
          title,
          body,
        }))
      );
    }

    // Deliver via Expo Push API to targets that have a push token
    const messages: PushMessage[] = targets
      .filter((t) => t.push_token && t.push_token.startsWith('ExponentPushToken['))
      .map((t) => ({
        to: t.push_token!,
        title,
        body,
        sound: 'default',
        data: data ?? {},
      }));

    const result = await sendExpoPushBatch(messages);

    return jsonResponse({
      targeted: targets.length,
      tokens_found: messages.length,
      delivered: result.ok,
      failed: result.failed,
    });
  } catch (e) {
    console.error('send-nudge error:', e);
    return errorResponse('Internal error', 'INTERNAL_ERROR', 500);
  }
});
