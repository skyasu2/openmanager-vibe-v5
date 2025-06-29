/**
 * 💬 하이브리드 AI용 응답 생성기 (래퍼)
 *
 * 통합 응답 생성 시스템의 래퍼 클래스
 * 다중 AI 엔진 결과 통합을 위한 기존 API 호환성 유지
 */

import {
  SmartQuery,
  DocumentContext,
  ResponseContext,
} from '../types/HybridTypes';
import {
  unifiedResponseGenerator,
  UnifiedResponseRequest,
} from '../../response/UnifiedResponseGenerator';

export class ResponseGenerator {
  private isInitialized: boolean = false;

  /**
   * 초기화
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // 통합 응답 생성기 초기화
    await unifiedResponseGenerator.initialize();

    this.isInitialized = true;
    console.log(
      '💬 [ResponseGenerator] 하이브리드 AI용 응답 생성기가 초기화되었습니다 (통합 시스템 사용)'
    );
  }

  /**
   * 하이브리드 응답 생성 (통합 시스템 사용)
   */
  async generateResponse(
    smartQuery: SmartQuery,
    documents: DocumentContext[],
    analysisResults: any
  ): Promise<ResponseContext> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 통합 응답 생성기로 요청 변환
    const unifiedRequest: UnifiedResponseRequest = {
      query: smartQuery.originalQuery,
      context: {
        isKorean: smartQuery.isKorean,
        keywords: smartQuery.keywords,
        intent: smartQuery.intent,
        entities: (smartQuery as any).entities || {},
      },
      analysisResults: analysisResults,
      documents: documents,
      language: smartQuery.isKorean ? 'ko' : 'en',
      responseType: 'hybrid',
    };

    // 통합 응답 생성기로 응답 생성
    const unifiedResult =
      await unifiedResponseGenerator.generateResponse(unifiedRequest);

    // 기존 인터페이스로 변환하여 반환
    return {
      text: unifiedResult.text,
      confidence: unifiedResult.confidence,
      reasoning: unifiedResult.metadata.reasoning,
    };
  }

  /**
   * 응답 품질 평가 (기존 로직 유지)
   */
  evaluateResponseQuality(
    response: ResponseContext,
    smartQuery: SmartQuery
  ): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = response.confidence * 100;

    // 신뢰도 기반 평가
    if (response.confidence < 0.3) {
      feedback.push('응답 신뢰도가 낮습니다');
      score -= 20;
    } else if (response.confidence > 0.8) {
      feedback.push('높은 신뢰도의 응답입니다');
      score += 10;
    }

    // 응답 길이 평가
    if (response.text.length < 50) {
      feedback.push('응답이 너무 짧습니다');
      score -= 10;
    } else if (response.text.length > 1000) {
      feedback.push('응답이 너무 깁니다');
      score -= 5;
    }

    // 한국어 쿼리 처리 평가
    if (smartQuery.isKorean && response.text.includes('English')) {
      feedback.push('한국어 응답이 필요합니다');
      score -= 15;
    }

    // 추론 과정 평가
    if (response.reasoning && response.reasoning.length > 0) {
      feedback.push('추론 과정이 포함되어 있습니다');
      score += 5;
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      feedback,
    };
  }

  /**
   * 📊 통계 조회 (통합 시스템 위임)
   */
  public getStats() {
    return {
      isInitialized: this.isInitialized,
      unifiedGeneratorStats: unifiedResponseGenerator.getStats(),
      wrapperType: 'HybridResponseGenerator',
    };
  }
}
