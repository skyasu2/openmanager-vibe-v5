/**
 * POST /api/ai/nlq/extract-entities
 *
 * Groq GPT-OSS 20B로 쿼리에서 엔티티(server/metric/timeRange)를 추출하고,
 * 저신뢰도 또는 모호한 결과만 GPT-OSS 120B로 재평가합니다.
 * 클래리피케이션 사전 차단에 사용됩니다.
 *
 * Note: URL의 `nlq`는 Natural Language Query 기능 카테고리를 가리키는 feature slug이며,
 * Cloud Run의 에이전트 이름("Metrics Query Agent")과는 별개입니다.
 */

import { createGroq } from '@ai-sdk/groq';
import { generateText, Output } from 'ai';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  GROQ_TEXT_FALLBACK_MODEL_ID,
  GROQ_TEXT_MODEL_ID,
} from '@/config/ai-providers';
import {
  ENTITY_CONFIDENCE_THRESHOLD,
  type ExtractedEntities,
  KNOWN_ENTITY_SERVER_IDS,
  normalizeExtractedEntitiesForQuery,
  SEMANTIC_AGGREGATIONS,
  SEMANTIC_AMBIGUITIES,
  SEMANTIC_DOMAINS,
  SEMANTIC_EXECUTION_MODES,
  SEMANTIC_INTENTS,
  SEMANTIC_METRICS,
  SEMANTIC_SCOPES,
  SEMANTIC_TIME_WINDOWS,
  SYSTEM_PROMPT,
} from '@/lib/ai/entity-extractor';
import {
  BLOCKED_INPUT_MESSAGE,
  buildLogSummaryPrompt,
  runQueryGuard,
} from '@/lib/ai/query-guard';
import { withAuth } from '@/lib/auth/api-auth';
import { logger } from '@/lib/logging';
import { rateLimiters, withRateLimit } from '@/lib/security/rate-limiter';

// MIGRATED: Removed export const runtime = "nodejs" (default)
export const maxDuration = 10;

const GROQ_TIMEOUT_MS = 3000;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

const SemanticIntentFrameSchema = z.object({
  domain: z.enum(SEMANTIC_DOMAINS),
  intent: z.enum(SEMANTIC_INTENTS),
  scope: z.enum(SEMANTIC_SCOPES),
  targets: z.array(z.string()),
  metric: z.enum(SEMANTIC_METRICS),
  timeWindow: z.enum(SEMANTIC_TIME_WINDOWS),
  aggregation: z.enum(SEMANTIC_AGGREGATIONS),
  topN: z.number().int().positive().max(20).nullable(),
  ambiguity: z.enum(SEMANTIC_AMBIGUITIES),
  executionMode: z.enum(SEMANTIC_EXECUTION_MODES),
  confidence: z.number().min(0).max(100),
});

// OpenAI-compatible structured-output providers require every object property
// to be listed in JSON Schema `required`. Nullable fields keep the legacy
// response contract while avoiding provider-side schema rejection. The
// top-level metric/timeRange schema is intentionally tolerant because the
// normalizer still preserves only the legacy ExtractedMetric/ExtractedTimeRange
// slots; load/current variants live in intentFrame.
const EntitySchema = z.object({
  server: z.enum(KNOWN_ENTITY_SERVER_IDS).nullable(),
  metric: z.enum(SEMANTIC_METRICS).nullable(),
  timeRange: z.enum(SEMANTIC_TIME_WINDOWS).nullable(),
  intentFrame: SemanticIntentFrameSchema.nullable(),
  confidence: z.number().min(0).max(100),
});

async function generateEntities(
  modelId: string,
  query: string
): Promise<ExtractedEntities> {
  const { output } = await generateText({
    model: groq(modelId),
    instructions: SYSTEM_PROMPT,
    prompt: query,
    temperature: 0,
    maxOutputTokens: 320,
    providerOptions: { groq: { reasoningEffort: 'low' } },
    timeout: GROQ_TIMEOUT_MS,
    output: Output.object({
      schema: EntitySchema,
      name: 'nlq_entities',
      description:
        'Extract monitoring entities and a semantic intent frame for clarification.',
    }),
  });

  return normalizeExtractedEntitiesForQuery(output, query);
}

function shouldEscalateToFallback(entities: ExtractedEntities): boolean {
  const intentFrame = entities.intentFrame;

  return (
    entities.confidence < ENTITY_CONFIDENCE_THRESHOLD ||
    (intentFrame !== undefined &&
      (intentFrame.confidence < ENTITY_CONFIDENCE_THRESHOLD ||
        intentFrame.ambiguity === 'high' ||
        intentFrame.intent === 'unknown' ||
        intentFrame.executionMode === 'unknown'))
  );
}

function getEntityQualityScore(entities: ExtractedEntities): number {
  const intentFrame = entities.intentFrame;
  let score = Math.max(entities.confidence, intentFrame?.confidence ?? 0);

  if (intentFrame?.ambiguity === 'high') score -= 20;
  if (intentFrame?.intent === 'unknown') score -= 20;
  if (intentFrame?.executionMode === 'unknown') score -= 10;

  return score;
}

async function postHandler(request: NextRequest) {
  let query: unknown;

  try {
    ({ query } = await request.json());
  } catch {
    return NextResponse.json({ confidence: 0 }, { status: 400 });
  }

  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return NextResponse.json({ confidence: 0 }, { status: 400 });
  }

  const guard = runQueryGuard(query);
  if (guard.verdict === 'block') {
    return NextResponse.json(
      {
        confidence: 0,
        blocked: true,
        blockReason: guard.blockReason,
        message: BLOCKED_INPUT_MESSAGE,
      },
      { status: 200 }
    );
  }

  const queryForLLM =
    guard.inputType === 'log_paste' || guard.inputType === 'mixed'
      ? buildLogSummaryPrompt(guard.logExtract ?? '', guard.sanitizedQuery)
      : guard.sanitizedQuery;

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      {
        confidence: 0,
        inputType: guard.inputType,
        ...(guard.logExtract && { logExtract: guard.logExtract }),
        ...(guard.truncated && { truncated: true }),
      },
      { status: 200 }
    );
  }

  const responseMetadata = {
    inputType: guard.inputType,
    ...(guard.logExtract && { logExtract: guard.logExtract }),
    ...(guard.truncated && { truncated: true }),
  };

  let primaryEntities: ExtractedEntities;

  try {
    primaryEntities = await generateEntities(GROQ_TEXT_MODEL_ID, queryForLLM);
  } catch (error) {
    logger.warn('[AI NLQ] primary entity extraction failed', {
      model: GROQ_TEXT_MODEL_ID,
      error: error instanceof Error ? error.message : String(error),
    });

    try {
      const fallbackEntities = await generateEntities(
        GROQ_TEXT_FALLBACK_MODEL_ID,
        queryForLLM
      );
      return NextResponse.json({
        ...fallbackEntities,
        ...responseMetadata,
      });
    } catch (fallbackError) {
      logger.warn('[AI NLQ] fallback entity extraction failed', {
        model: GROQ_TEXT_FALLBACK_MODEL_ID,
        error:
          fallbackError instanceof Error
            ? fallbackError.message
            : String(fallbackError),
      });
      return NextResponse.json({ confidence: 0, ...responseMetadata });
    }
  }

  if (!shouldEscalateToFallback(primaryEntities)) {
    return NextResponse.json({
      ...primaryEntities,
      ...responseMetadata,
    });
  }

  try {
    const fallbackEntities = await generateEntities(
      GROQ_TEXT_FALLBACK_MODEL_ID,
      queryForLLM
    );
    const selectedEntities =
      getEntityQualityScore(fallbackEntities) >
      getEntityQualityScore(primaryEntities)
        ? fallbackEntities
        : primaryEntities;

    return NextResponse.json({
      ...selectedEntities,
      ...responseMetadata,
    });
  } catch (error) {
    logger.warn(
      '[AI NLQ] quality fallback unavailable; keeping primary result',
      {
        model: GROQ_TEXT_FALLBACK_MODEL_ID,
        error: error instanceof Error ? error.message : String(error),
      }
    );
    return NextResponse.json({
      ...primaryEntities,
      ...responseMetadata,
    });
  }
}

export const POST = withAuth(
  withRateLimit(rateLimiters.aiAnalysis, postHandler)
);
