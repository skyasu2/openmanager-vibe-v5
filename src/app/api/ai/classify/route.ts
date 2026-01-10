/**
 * Query Classification API Endpoint
 * 서버 사이드에서 Groq LLM을 사용한 쿼리 분류
 *
 * v1.1.0 (2026-01-04): generateText + JSON 파싱 방식으로 변경
 * - Groq 모델은 json_schema 미지원, text 기반 JSON 응답 사용
 */

import { groq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { type NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';

// Node.js 런타임 사용
export const runtime = 'nodejs';

export interface QueryClassification {
  complexity: number;
  intent: 'general' | 'monitoring' | 'analysis' | 'guide' | 'coding';
  reasoning: string;
  confidence: number;
}

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
      logger.warn('[Classify API] GROQ_API_KEY not configured, using fallback');
      return NextResponse.json({
        ...fallbackClassify(query),
        source: 'fallback',
        latency: Date.now() - startTime,
      });
    }

    // LLM Classification using generateText + JSON parsing
    const { text } = await generateText({
      model: groq('llama-3.1-8b-instant'),
      prompt: `You are a query classifier for an IT infrastructure monitoring assistant.
Classify the following query and respond ONLY with a valid JSON object (no markdown, no explanation).

Query: "${query}"

Respond with this exact JSON format:
{"complexity": <1-5>, "intent": "<general|monitoring|analysis|guide|coding>", "reasoning": "<brief explanation>", "confidence": <0-100>}

Guidelines:
- complexity 1-2: Greetings, simple status checks, single metric queries
- complexity 3: How-to guides, concept explanations, multiple metrics
- complexity 4-5: Root cause analysis, "why" questions, coding, log analysis
- confidence 90-100: Very clear and specific query
- confidence 70-89: Reasonably clear query
- confidence 50-69: Ambiguous, may need clarification
- confidence 0-49: Very vague or unclear`,
      temperature: 0,
    });

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      logger.warn('[Classify API] Failed to parse JSON, using fallback');
      return NextResponse.json({
        ...fallbackClassify(query),
        source: 'fallback',
        latency: Date.now() - startTime,
      });
    }

    const parsed = JSON.parse(jsonMatch[0]) as QueryClassification;

    // Validate parsed result
    if (
      typeof parsed.complexity !== 'number' ||
      typeof parsed.confidence !== 'number' ||
      !parsed.intent ||
      !parsed.reasoning
    ) {
      logger.warn('[Classify API] Invalid response structure, using fallback');
      return NextResponse.json({
        ...fallbackClassify(query),
        source: 'fallback',
        latency: Date.now() - startTime,
      });
    }

    return NextResponse.json({
      ...parsed,
      source: 'llm',
      latency: Date.now() - startTime,
    });
  } catch (error) {
    logger.error('[Classify API] Error:', error);

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
