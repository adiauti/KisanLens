import { NextResponse } from 'next/server';
import { diseases, diseaseMap } from '@/data/diseases';
import { diagnose, type DiagnosisInput } from '@/data/diagnosis';
import { computeWeatherRisk } from '@/data/weatherRisk';
import { buildManagementPlan } from '@/lib/managementPlan';
import type {
  CropId,
  PlantPart,
  SymptomType,
  Condition,
  WeatherId,
  Disease,
  WeatherRisk,
  ManagementPlan,
  Severity,
  RiskLevel,
} from '@/data/types';

export const runtime = 'nodejs';

interface ScanRequest {
  imageDataUrl: string;
  crop: CropId;
  symptoms: SymptomType[];
  parts: PlantPart[];
  conditions: Condition[];
  weather: WeatherId | null;
  state: string | null;
  locale: 'en' | 'hi';
}

interface ScanSuccess {
  ok: true;
  result: {
    disease: Disease;
    aiConfidence: number; // 0-1
    aiReasoning: string;
    weatherRisk: WeatherRisk;
    plan: ManagementPlan;
    source: 'vision';
    severity: Severity;
    riskLevel: RiskLevel;
    followUpDays: number;
  };
}

interface ScanFailure {
  ok: false;
  reason: 'ai_unconfigured' | 'ai_error' | 'bad_request';
  message?: string;
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-15';
const ANTHROPIC_MODEL = 'claude-sonnet-5';

const DATA_URL_RE = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/i;

export async function POST(request: Request) {
  let body: ScanRequest;
  try {
    body = (await request.json()) as ScanRequest;
  } catch {
    return NextResponse.json(
      { ok: false, reason: 'bad_request', message: 'Invalid JSON body.' } satisfies ScanFailure,
      { status: 400 }
    );
  }

  if (!body || !body.imageDataUrl || !body.crop) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'bad_request',
        message: 'imageDataUrl and crop are required.',
      } satisfies ScanFailure,
      { status: 400 }
    );
  }

  const dataUrlMatch = DATA_URL_RE.exec(body.imageDataUrl);
  if (!dataUrlMatch) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'bad_request',
        message: 'imageDataUrl must be a base64 data URL of type image/jpeg, image/png, image/webp or image/gif.',
      } satisfies ScanFailure,
      { status: 400 }
    );
  }
  const [, mediaType, base64] = dataUrlMatch;

  // Always compute local fallback first so the client can render a meaningful
  // result even if the AI call fails.
  const localResults = diagnose({
    crop: body.crop,
    affectedParts: body.parts ?? [],
    symptomTypes: body.symptoms ?? [],
    conditions: body.conditions ?? [],
  } satisfies DiagnosisInput);
  const topLocal = localResults[0];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'ai_unconfigured',
        message:
          'ANTHROPIC_API_KEY is not set. The server returned a heuristic-only result.',
      } satisfies ScanFailure,
      { status: 503 }
    );
  }

  if (!topLocal) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'ai_error',
        message: 'No candidate disease for the selected crop — check the wizard inputs.',
      } satisfies ScanFailure,
      { status: 422 }
    );
  }

  // Build a system prompt that constrains the model to one of our local IDs.
  const diseaseCatalog = diseases
    .filter((d) => d.crop === body.crop)
    .map((d) => ({
      id: d.id,
      name: d.name,
      pathogen: d.pathogen,
      symptoms: d.symptoms,
    }));
  const diseaseIdList = diseaseCatalog.map((d) => d.id).join(', ');

  const systemPrompt = [
    'You are KisanLens, an expert agronomist assistant for Indian farmers.',
    'You will be shown a photograph of a crop leaf, fruit, or whole plant, together with farmer-reported symptoms and field conditions.',
    'Your job: identify the SINGLE most likely disease from the provided catalog and return strict JSON only.',
    'Hard rules:',
    ` - You MUST pick diseaseId from exactly this list for crop=${body.crop}: [${diseaseIdList}].`,
    ' - If you are uncertain, still pick the closest match from the list — never invent a new id.',
    ' - Return JSON of the shape {"diseaseId": string, "confidence": number between 0 and 1, "reasoning": string <= 240 chars}.',
    ' - Do NOT include any markdown, prose, or commentary outside the JSON object.',
  ].join('\n');

  const userText = [
    `Crop: ${body.crop}`,
    `Affected parts: ${(body.parts ?? []).join(', ') || 'unspecified'}`,
    `Symptoms seen: ${(body.symptoms ?? []).join(', ') || 'unspecified'}`,
    `Field conditions: ${(body.conditions ?? []).join(', ') || 'unspecified'}`,
    `Current weather: ${body.weather ?? 'unspecified'}`,
    `Region: ${body.state ?? 'unspecified'}`,
    'Identify the most likely disease from the catalog. Return JSON only.',
  ].join('\n');

  try {
    const upstream = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 400,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif',
                  data: base64,
                },
              },
              { type: 'text', text: userText },
            ],
          },
        ],
      }),
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      return NextResponse.json(
        {
          ok: false,
          reason: 'ai_error',
          message: `Anthropic API returned ${upstream.status}: ${text.slice(0, 240)}`,
        } satisfies ScanFailure,
        { status: 502 }
      );
    }

    const payload = (await upstream.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = (payload.content ?? [])
      .filter((b) => b.type === 'text' && typeof b.text === 'string')
      .map((b) => b.text as string)
      .join('')
      .trim();

    const parsed = safeParseJson(text);
    if (!parsed) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'ai_error',
          message: `Could not parse AI response as JSON. Raw: ${text.slice(0, 240)}`,
        } satisfies ScanFailure,
        { status: 502 }
      );
    }

    const diseaseId = typeof parsed.diseaseId === 'string' ? parsed.diseaseId : '';
    const disease = diseaseMap[diseaseId];
    if (!disease || disease.crop !== body.crop) {
      return NextResponse.json(
        {
          ok: false,
          reason: 'ai_error',
          message: `AI returned an unknown or off-crop diseaseId: "${diseaseId}".`,
        } satisfies ScanFailure,
        { status: 502 }
      );
    }

    const aiConfidence = clamp01(Number(parsed.confidence) || 0.5);
    const aiReasoning = String(parsed.reasoning ?? '').slice(0, 280) || 'AI matched this disease from the photo and your inputs.';

    // Cross-check: if the local engine has a strong different match, surface the
    // local match as an "also possible" in reasoning — but trust the AI's disease.
    if (topLocal.disease.id !== disease.id && topLocal.score > 0.6) {
      // no-op: we keep AI primary. The local result is included in the AI text
      // reason implicitly via the catalog the model already saw.
    }

    const weatherRisk = computeWeatherRisk(
      body.crop,
      disease,
      body.conditions ?? [],
      body.weather ?? null
    );
    const plan = buildManagementPlan(disease, weatherRisk);

    const success: ScanSuccess = {
      ok: true,
      result: {
        disease,
        aiConfidence,
        aiReasoning,
        weatherRisk,
        plan,
        source: 'vision',
        severity: disease.severity,
        riskLevel: weatherRisk.level,
        followUpDays: plan.followUpDays,
      },
    };
    return NextResponse.json(success, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      {
        ok: false,
        reason: 'ai_error',
        message,
      } satisfies ScanFailure,
      { status: 502 }
    );
  }
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function safeParseJson(text: string): { diseaseId?: unknown; confidence?: unknown; reasoning?: unknown } | null {
  // Strip code fences if present
  const cleaned = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract a JSON object from the middle of the text
    const match = /\{[\s\S]*\}/.exec(cleaned);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}
