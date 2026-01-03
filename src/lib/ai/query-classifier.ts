import { groq } from '@ai-sdk/groq';
import { generateObject } from 'ai';
import * as z from 'zod';

// Define the classification schema
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
 * 명확화가 필요한 쿼리인지 확인
 * @param confidence 신뢰도 (0-100)
 * @param complexity 복잡도 (1-5)
 * @returns 명확화 필요 여부
 */
export function needsClarification(
  confidence: number,
  complexity: number
): boolean {
  // 신뢰도 85% 미만이고 복잡도가 2 이상인 경우 명확화 필요
  return confidence < 85 && complexity >= 2;
}

export class QueryClassifier {
  private static instance: QueryClassifier;

  private constructor() {}

  static getInstance(): QueryClassifier {
    if (!QueryClassifier.instance) {
      QueryClassifier.instance = new QueryClassifier();
    }
    return QueryClassifier.instance;
  }

  /**
   * Classifies a user query using Groq (Llama-3.1-8b-instant).
   * This is designed to be extremely fast (< 500ms).
   */
  async classify(query: string): Promise<QueryClassification> {
    if (!process.env.GROQ_API_KEY) {
      console.warn(
        '⚠️ GROQ_API_KEY missing. Fallback to basic regex classification.'
      );
      return this.fallbackClassify(query);
    }

    try {
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
        temperature: 0, // Deterministic
      });

      return object;
    } catch (error) {
      console.error('❌ Groq classification failed:', error);
      return this.fallbackClassify(query);
    }
  }

  /**
   * Fallback classification using regex (Zero latency, low intelligence)
   * 신뢰도는 쿼리의 구체성에 따라 계산
   */
  private fallbackClassify(query: string): QueryClassification {
    const q = query.toLowerCase();
    let confidence = 70; // 기본 신뢰도

    // 쿼리 길이에 따른 신뢰도 조정
    if (query.length > 50) confidence += 10; // 긴 쿼리는 더 구체적
    if (query.length < 10) confidence -= 20; // 짧은 쿼리는 모호

    // 서버 이름이 명시된 경우 신뢰도 상승
    if (/[a-z]+-[a-z]+-\d+|server-?\d+/i.test(query)) {
      confidence += 15;
    }

    // 시간 범위가 명시된 경우 신뢰도 상승
    if (/\d+시간|\d+일|지난|최근|어제|오늘/i.test(query)) {
      confidence += 10;
    }

    // Coding/Analysis -> High complexity
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
        confidence: Math.min(100, Math.max(0, confidence - 5)), // 복잡한 쿼리는 더 모호할 수 있음
      };
    }

    // Monitoring -> Medium complexity
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

    // Problem/Issue detection -> Medium complexity (명확화 트리거 대상)
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
        confidence: Math.min(100, Math.max(0, confidence - 10)), // 문제 관련은 더 모호할 수 있음
      };
    }

    // Default -> Simple (낮은 신뢰도)
    return {
      complexity: 1,
      intent: 'general',
      reasoning: 'Fallback default',
      confidence: Math.min(100, Math.max(0, confidence - 15)),
    };
  }
}

export const classifyQuery = (query: string) =>
  QueryClassifier.getInstance().classify(query);
