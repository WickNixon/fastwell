import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

type AcceptedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const ACCEPTED_MEDIA_TYPES: AcceptedMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function normaliseMediaType(raw: string): AcceptedMediaType {
  if ((ACCEPTED_MEDIA_TYPES as string[]).includes(raw)) return raw as AcceptedMediaType;
  // HEIC/HEIF from iPhone, BMP, TIFF etc — treat as jpeg
  return 'image/jpeg';
}

const PROMPT = `Analyse this meal photo and return a JSON object only, no markdown, no explanation, no code fences — just the raw JSON:
{
  "meal_name": "brief description of what you can see",
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "fibre_g": number,
  "confidence": "high" | "medium" | "low",
  "notes": "any relevant observations about the meal"
}
If you cannot identify food in the image, return:
{ "error": "No food detected in this image" }`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'FILL_IN_LATER') {
    console.error('[analyze-meal] ANTHROPIC_API_KEY is not set');
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 503 });
  }

  let imageBase64: string | undefined;
  let mediaType: string | undefined;

  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    mediaType = body.mediaType;
  } catch (e) {
    console.error('[analyze-meal] Failed to parse request body:', e);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!imageBase64 || !mediaType) {
    console.error('[analyze-meal] Missing imageBase64 or mediaType');
    return NextResponse.json({ error: 'Missing image data' }, { status: 400 });
  }

  const normalisedType = normaliseMediaType(mediaType);
  if (normalisedType !== mediaType) {
    console.warn(`[analyze-meal] Media type "${mediaType}" normalised to "${normalisedType}"`);
  }

  let rawText = '';
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 600,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: normalisedType, data: imageBase64 },
          },
          { type: 'text', text: PROMPT },
        ],
      }],
    });

    rawText = response.content[0].type === 'text' ? response.content[0].text : '';
    console.log('[analyze-meal] Raw Claude response:', rawText);

    // Strip markdown code fences if present
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```\s*$/, '')
      .trim();

    const result = JSON.parse(cleaned);
    return NextResponse.json(result);
  } catch (e) {
    console.error('[analyze-meal] Error:', e);
    console.error('[analyze-meal] Raw text at time of error:', rawText);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: 'Analysis failed — try a clearer photo', detail: message },
      { status: 500 }
    );
  }
}
