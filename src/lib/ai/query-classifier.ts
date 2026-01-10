/**
 * Query Classifier - 서버 API를 통한 LLM 기반 쿼리 분류
 *
 * v2.0.0 (2026-01-04): 서버 API 방식으로 전환
 * - 클라이언트에서 /api/ai/classify 호출
 * - GROQ API 키 보안 유지
 */

import { logger } from '@/lib/logging';
export interface QueryClassification {
  complexity: number; // 1-5
  intent: 'general' | 'monitoring' | 'analysis' | 'guide' | 'coding';
  reasoning: string;
  confidence: number; // 0-100
  source?: 'llm' | 'fallback';
  latency?: number;
}

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
   * Classifies a user query via server API (Groq LLM).
   * 서버에서 GROQ API 키를 사용하여 분류 수행
   */
  async classify(query: string): Promise<QueryClassification> {
    try {
      const response = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        logger.warn('⚠️ Classification API failed, using fallback');
        return this.fallbackClassify(query);
      }

      const result = await response.json();
      return result as QueryClassification;
    } catch (error) {
      logger.error('❌ Classification request failed:', error);
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
