import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

type AcceptedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';

const ACCEPTED_MEDIA_TYPES: AcceptedMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

function normaliseMediaType(raw: string): AcceptedMediaType {
  if ((ACCEPTED_MEDIA_TYPES as string[]).includes(raw)) return raw as AcceptedMediaType;
  // HEIC/HEIF from iPhone, BMP, TIFF etc — treat as jpeg
  return 'image/jpeg';
}

type Correction =
  | { type: 'item_swap'; oldName: string; newName: string }
  | { type: 'describe'; userText: string };

const SYSTEM_PROMPT = `You are a registered nutritionist analysing meal photos for Fastwell, a health app used primarily by women in midlife (40-65) across New Zealand, Australia, the UK, and the United States.

Your job is to identify each food item visible on the plate, estimate its portion size in grams, and provide nutritional macros (calories, protein, carbs, fat, fibre) for each item. The user will see your output and either accept it or correct individual items.

How to look at a meal photo:

1. Reason about what you see BEFORE naming any food. For each distinct item, describe its surface texture, colour, shape, and how it sits on the plate. Then identify it. This reasoning is for your own accuracy — you will not include it in the output.

2. Be honest about uncertainty. If you can't confidently distinguish between two visually similar foods, say so by lowering confidence and providing alternatives. It is far better to say "medium confidence, could be chicken or tempeh" than to confidently pick wrong.

3. Common visual confusions to watch for:
   - Grilled chicken vs. grilled tempeh: chicken has a smoother, more fibrous surface with visible muscle striations; tempeh shows mottled bean structure and is more uniform in colour.
   - Greek yogurt vs. poached egg whites: yogurt is matte and uniform, often with peaks from a spoon; egg whites are glossy, irregular, and show a yolk if visible.
   - White rice vs. couscous vs. quinoa: rice grains are longer and shinier; couscous is finer and pale; quinoa has visible curled germ rings.
   - Sweet potato vs. butternut squash vs. carrots: similar orange tones, but sweet potato has a smoother flesh, butternut is paler, carrots are more orange and have a denser texture.
   - Cottage cheese vs. ricotta vs. feta: cottage cheese is lumpy, ricotta is smooth and creamy, feta is crumbly with sharper edges.
   - Almond butter vs. peanut butter vs. tahini: peanut butter is browner, almond butter is paler tan, tahini is greyer/yellower and looser.

4. Audience prior: Fastwell's users are predominantly women in midlife in NZ, AU, UK, and US. Common foods in their meals include grilled chicken, fish (salmon, white fish), eggs, salads, roast vegetables, yogurt, oats, sourdough, lentils, hummus, cheese, and lean cuts of red meat. Tempeh, tofu, seitan, and other plant proteins do appear but are less common. When two foods look visually similar with no other distinguishing cues, lean toward the more common one in this audience. Do not exclude uncommon foods — just require slightly stronger visual evidence to pick them over a common look-alike.

5. Portion estimation. Use visible reference cues — a standard dinner plate is ~26cm diameter, a fork is ~2cm wide at the tines, a tablespoon holds ~15g of most things. Round portions to sensible whole numbers (e.g. 150g, not 147g). Do not pretend to estimate to within ±5g of accuracy.

6. Macros. Use standard reference values for the food you've identified at the portion you've estimated. Round protein, carbs, fat, and fibre to whole grams. Round calories to the nearest 5. Do not invent precision.

7. Per-item alternatives. For every item where your confidence is below 'high', provide 2-3 plausible alternative identifications. The alternatives should be realistic look-alikes, not random foods. Do not provide alternatives when you are confident.

8. Confidence ratings:
   - 'high' — you would bet money on this identification.
   - 'medium' — your best guess, but you can see how it could plausibly be something else.
   - 'low' — you genuinely cannot tell; this is an educated guess.

9. If the photo does not show food, or is too blurry to identify anything, return the error response described in the user message.

10. Maximum of 8 items per meal. If a meal has more than 8 distinct foods, group the smallest portions together (e.g. "mixed roasted vegetables") rather than listing every individual carrot stick.`;

const INITIAL_USER_PROMPT = `Analyse this meal photo. Return a single JSON object — no markdown, no code fences, no explanation outside the JSON.

Schema:

{
  "items": [
    {
      "name": "primary identification (e.g. 'grilled chicken breast')",
      "grams": estimated portion in grams (number),
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fat_g": number,
      "fibre_g": number,
      "confidence": "high" | "medium" | "low",
      "alternatives": [
        "plausible alternative 1",
        "plausible alternative 2",
        "plausible alternative 3"
      ]
    }
  ],
  "overall_confidence": "high" | "medium" | "low",
  "notes": "any relevant observations about the meal as a whole — cooking method, sauces, seasoning that affects macros, things you noticed but couldn't be sure of"
}

Rules:
- One entry in "items" per distinct food on the plate. Do not group "vegetables" as one item if you can distinguish carrots, potatoes, and capsicum — list them separately.
- "alternatives" must be an empty array [] if confidence is "high". Otherwise 2-3 entries.
- "overall_confidence" reflects your confidence in the meal as a whole — if any item is medium or low, the overall is at most medium.

If you cannot identify any food in the image, return:
{ "error": "No food detected in this image" }

If the image is too blurry, dark, or angled to identify food reliably, return:
{ "error": "Image too unclear to analyse — try a clearer photo" }`;

function buildReanalysisPrompt(correction: Correction): string {
  let correctionText: string;
  if (correction.type === 'item_swap') {
    correctionText = `The food previously identified as "${correction.oldName}" is actually ${correction.newName}. Other items on the plate were correctly identified.`;
  } else {
    correctionText = `User describes the meal as: "${correction.userText}". Re-analyse the entire plate using this description as the authoritative identification of the foods present.`;
  }

  return `You previously analysed this meal photo. The user has corrected one or more items. Re-analyse the photo with this correction in mind and return updated macros.

User's correction:
${correctionText}

Use the user's correction as authoritative — do not second-guess the named food. Your job is to estimate accurate portion sizes and macros for the corrected identification using visual cues from the photo.

Return the same JSON schema as before — items, overall_confidence, notes — with the corrected identification(s) and recalculated macros.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'FILL_IN_LATER') {
    console.error('[analyze-meal] ANTHROPIC_API_KEY is not set');
    return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 503 });
  }

  let imageBase64: string | undefined;
  let mediaType: string | undefined;
  let correction: Correction | undefined;

  try {
    const body = await req.json();
    imageBase64 = body.imageBase64;
    mediaType = body.mediaType;
    correction = body.correction;
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

  const userPrompt = correction ? buildReanalysisPrompt(correction) : INITIAL_USER_PROMPT;

  let rawText = '';
  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      temperature: 0.2,
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: normalisedType, data: imageBase64 },
          },
          { type: 'text', text: userPrompt },
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

    // Error responses pass through unchanged
    if (result.error) {
      return NextResponse.json(result);
    }

    // Validate the success shape
    if (!Array.isArray(result.items) || result.items.length === 0) {
      throw new Error('Invalid response shape — items missing or empty');
    }

    const validConfidence = ['high', 'medium', 'low'];
    if (!validConfidence.includes(result.overall_confidence)) {
      throw new Error('Invalid overall_confidence');
    }

    for (const item of result.items) {
      if (typeof item.name !== 'string') throw new Error('Item missing name');
      if (typeof item.calories !== 'number') throw new Error('Item missing calories');
      if (!validConfidence.includes(item.confidence)) throw new Error('Item invalid confidence');
      if (!Array.isArray(item.alternatives)) throw new Error('Item alternatives not array');
    }

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
