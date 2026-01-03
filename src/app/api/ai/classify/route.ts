/**
 * Query Classification API Endpoint
 * 서버 사이드에서 Groq LLM을 사용한 쿼리 분류
 *
 * v1.0.0 (2026-01-04): 초기 구현
 * - POST: 쿼리 분류 (complexity, intent, confidence)
 */

import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import * as z from 'zod';

// Node.js 런타임 사용
export const runtime = 'nodejs';

// Classification schema
const classificationSchema = z.object({
  complexity: z
    .number()
    .min(1)
    .max(5)
    .describe(
      'The complexity of the query from 1 (simple) to 5 (complex). 1-3: Simple retrieval or conversation. 4-5: Complex analysis, coding, or reasoning.'
    ),
  intent: z
    .enum(['general', 'monitoring', 'analysis', 'guide', 'coding'])
    .describe('The primary intent of the user.'),
  reasoning: z.string().describe('Brief explanation for the classification.'),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe(
      'Confidence level (0-100) in this classification. 90+: Very certain. 70-89: Confident. 50-69: Uncertain, may need clarification. <50: Ambiguous query.'
    ),
});

export type QueryClassification = z.infer<typeof classificationSchema>;

/**
 * POST /api/ai/classify
 * Groq LLM을 사용한 쿼리 분류
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { query } = body as { query: string };

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Check GROQ API key
    if (!process.env.GROQ_API_KEY) {
      console.warn(
        '[Classify API] GROQ_API_KEY not configured, using fallback'
      );
      return NextResponse.json({
        ...fallbackClassify(query),
        source: 'fallback',
        latency: Date.now() - startTime,
      });
    }

    // LLM Classification
    const { object } = await generateObject({
      model: groq('llama-3.1-8b-instant'),
      schema: classificationSchema,
      prompt: `Classify the following user query for an IT infrastructure monitoring assistant.

        Query: "${query}"

        Guidelines:
        - Complexity 1-2: Greetings, simple status checks ("is server up?"), checking distinct metric ("cpu usage").
        - Complexity 3: How-to guides, explanation of concepts, multiple metrics.
        - Complexity 4-5: Root cause analysis, "why" questions, coding requests, log analysis, complex correlations.

        Confidence Guidelines:
        - 90-100: Query is very clear and specific (e.g., "Show CPU usage for web-server-01")
        - 70-89: Query is reasonably clear but could be more specific (e.g., "Show server status")
        - 50-69: Query is ambiguous, missing key details (e.g., "Check it", "Is there a problem?")
        - 0-49: Query is very vague or unclear (e.g., "Help", "?")`,
      temperature: 0,
    });

    return NextResponse.json({
      ...object,
      source: 'llm',
      latency: Date.now() - startTime,
    });
  } catch (error) {
    console.error('[Classify API] Error:', error);

    // Fallback on error
    try {
      const body = await request.clone().json();
      const { query } = body as { query: string };
      if (query) {
        return NextResponse.json({
          ...fallbackClassify(query),
          source: 'fallback',
          error: error instanceof Error ? error.message : 'Unknown error',
          latency: Date.now() - startTime,
        });
      }
    } catch {
      // Ignore parse error
    }

    return NextResponse.json(
      {
        error: 'Failed to classify query',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Fallback classification using regex
 */
function fallbackClassify(query: string): QueryClassification {
  const q = query.toLowerCase();
  let confidence = 70;

  if (query.length > 50) confidence += 10;
  if (query.length < 10) confidence -= 20;

  if (/[a-z]+-[a-z]+-\d+|server-?\d+/i.test(query)) {
    confidence += 15;
  }

  if (/\d+시간|\d+일|지난|최근|어제|오늘/i.test(query)) {
    confidence += 10;
  }

  // Coding/Analysis
  if (
    q.includes('code') ||
    q.includes('script') ||
    q.includes('analysis') ||
    q.includes('why') ||
    q.includes('fix') ||
    q.includes('분석') ||
    q.includes('원인')
  ) {
    return {
      complexity: 4,
      intent: 'analysis',
      reasoning: 'Keyword match: Analysis/Coding',
      confidence: Math.min(100, Math.max(0, confidence - 5)),
    };
  }

  // Monitoring
  if (
    q.includes('status') ||
    q.includes('cpu') ||
    q.includes('memory') ||
    q.includes('server') ||
    q.includes('상태') ||
    q.includes('서버') ||
    q.includes('확인') ||
    q.includes('체크') ||
    q.includes('check')
  ) {
    return {
      complexity: 2,
      intent: 'monitoring',
      reasoning: 'Keyword match: Monitoring',
      confidence: Math.min(100, Math.max(0, confidence)),
    };
  }

  // Problem detection
  if (
    q.includes('문제') ||
    q.includes('이상') ||
    q.includes('오류') ||
    q.includes('에러') ||
    q.includes('error') ||
    q.includes('issue') ||
    q.includes('problem')
  ) {
    return {
      complexity: 2,
      intent: 'monitoring',
      reasoning: 'Keyword match: Problem detection',
      confidence: Math.min(100, Math.max(0, confidence - 10)),
    };
  }

  // Default
  return {
    complexity: 1,
    intent: 'general',
    reasoning: 'Fallback default',
    confidence: Math.min(100, Math.max(0, confidence - 15)),
  };
}
