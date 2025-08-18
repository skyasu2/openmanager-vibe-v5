/**
 * 🛠️ Unified AI Engine Router - Utility Functions
 *
 * Collection of utility functions and response generators
 * - Korean NLP response conversion utilities
 * - Cache key generation and management
 * - Error response and status response generators
 * - Helper functions for routing operations
 * - Response formatting and processing utilities
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import { QueryRequest, QueryResponse } from './SimplifiedQueryEngine';
import {
  RouteResult,
  RouterConfig,
  RouterMetrics,
} from './UnifiedAIEngineRouter.types';
import type { SanitizationResult } from './security/PromptSanitizer';

// Korean NLP Response 타입 정의
interface KoreanNLPResponse {
  intent?: string;
  entities?: Array<{ value: string; type?: string }>;
  semantic_analysis?: {
    main_topic?: string;
    urgency_level?: string;
  };
  response_guidance?: {
    visualization_suggestions?: string[];
  };
}

export class UnifiedAIEngineRouterUtils {
  private cache: Map<
    string,
    {
      response: QueryResponse;
      timestamp: number;
      ttl: number;
    }
  >;

  constructor() {
    this.cache = new Map();
  }

  /**
   * 🔄 한국어 NLP 응답 변환
   *
   * Korean NLP API 응답을 사용자 친화적인 텍스트로 변환
   */
  public convertKoreanNLPResponse(nlpData: KoreanNLPResponse | null): string {
    if (!nlpData) return '한국어 분석 결과를 가져올 수 없습니다.';

    const { intent, entities, semantic_analysis, response_guidance } = nlpData;

    let response = `분석 결과:\n`;
    response += `- 의도: ${intent}\n`;

    if (entities && entities.length > 0) {
      response += `- 감지된 요소: ${entities.map((e) => e.value).join(', ')}\n`;
    }

    if (semantic_analysis) {
      response += `- 주요 주제: ${semantic_analysis.main_topic}\n`;
      if (semantic_analysis.urgency_level !== 'low') {
        response += `- 긴급도: ${semantic_analysis.urgency_level}\n`;
      }
    }

    if (
      response_guidance?.visualization_suggestions &&
      response_guidance.visualization_suggestions.length > 0
    ) {
      response += `\n권장 시각화: ${response_guidance.visualization_suggestions.join(', ')}`;
    }

    return response;
  }

  /**
   * 💾 캐시 키 생성
   *
   * 요청 데이터를 기반으로 고유한 캐시 키 생성
   */
  public generateCacheKey(request: QueryRequest & { userId?: string }): string {
    const keyParts = [
      request.query,
      request.mode || 'auto',
      JSON.stringify(request.context || {}),
      request.userId || 'anonymous',
    ];
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  /**
   * 💾 캐시된 응답 조회
   *
   * TTL을 확인하여 유효한 캐시된 응답 반환
   */
  public getCachedResponse(cacheKey: string): QueryResponse | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    // TTL 확인
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.response;
  }

  /**
   * 💾 응답 캐시 저장
   *
   * 성공적인 응답을 TTL과 함께 캐시에 저장
   */
  public setCachedResponse(
    cacheKey: string,
    response: QueryResponse,
    ttl: number = 300000
  ): void {
    // 5분 기본 TTL
    this.cache.set(cacheKey, {
      response: { ...response },
      timestamp: Date.now(),
      ttl,
    });

    // 캐시 크기 제한 (최대 200개 엔트리로 최적화)
    if (this.cache.size > 200) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * 🚫 보안 차단 응답 생성
   *
   * 보안 정책에 위반된 요청에 대한 표준화된 응답 생성
   */
  public createSecurityBlockedResponse(
    securityResult: SanitizationResult,
    processingPath: string[],
    config: RouterConfig
  ): RouteResult {
    const message = config.strictSecurityMode
      ? '보안 정책에 의해 처리할 수 없는 요청입니다. 다른 방식으로 질문해 주세요.'
      : '안전한 요청으로 수정하여 다시 시도해 주세요.';

    return {
      success: false,
      response: message,
      engine: 'fallback' as const,
      confidence: 0,
      thinkingSteps: [
        {
          step: '보안 검사',
          description: `위험 요소 탐지: ${securityResult.threatsDetected.join(', ')}`,
          status: 'failed' as const,
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'fallback',
        fallbackUsed: false,
        securityApplied: true,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  /**
   * 🚫 토큰 제한 응답 생성
   *
   * 토큰 사용량 한도 초과 시 표준화된 응답 생성
   */
  public createTokenLimitResponse(
    reason: string,
    processingPath: string[]
  ): RouteResult {
    const message = this.getTokenLimitMessage(reason);
    const description = this.getTokenLimitDescription(reason);

    return {
      success: false,
      response: message,
      engine: 'fallback' as const,
      confidence: 0,
      thinkingSteps: [
        {
          step: '사용량 확인',
          description,
          status: 'failed' as const,
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'fallback',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  /**
   * 🔌 Circuit Breaker 열림 응답 생성
   *
   * 모든 엔진이 Circuit Breaker에 의해 차단된 상태의 응답 생성
   */
  public createCircuitOpenResponse(processingPath: string[]): RouteResult {
    return {
      success: false,
      response:
        '시스템이 일시적으로 제한된 모드로 동작 중입니다. 잠시 후 다시 시도해 주세요.',
      engine: 'fallback' as const,
      confidence: 0,
      thinkingSteps: [
        {
          step: 'Circuit Breaker',
          description: '모든 엔진이 차단된 상태',
          status: 'failed' as const,
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'fallback',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  /**
   * ❌ 에러 응답 생성
   *
   * 예상치 못한 오류에 대한 표준화된 응답 생성
   */
  public createErrorResponse(
    error: Error | unknown,
    processingPath: string[]
  ): RouteResult {
    const errorMessage =
      error instanceof Error ? error.message : '알 수 없는 오류';

    return {
      success: false,
      response: '요청을 처리하는 중 오류가 발생했습니다.',
      engine: 'fallback' as const,
      confidence: 0,
      error: errorMessage,
      thinkingSteps: [
        {
          step: '오류 처리',
          description: errorMessage,
          status: 'failed',
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'fallback',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  /**
   * 🔄 폴백 재시도 응답 생성
   *
   * 모든 엔진 실패 후 최후 폴백 시도의 응답 생성
   */
  public async createRetryWithFallbackResponse(
    request: QueryRequest,
    processingPath: string[],
    simplifiedEngine: any // SimplifiedQueryEngine 인스턴스
  ): Promise<RouteResult> {
    try {
      processingPath.push('fallback_attempt');
      const response = await simplifiedEngine.query({
        ...request,
        mode: 'local',
      });

      return {
        ...response,
        routingInfo: {
          selectedEngine: 'fallback',
          fallbackUsed: true,
          securityApplied: false,
          tokensCounted: false,
          processingPath,
        },
      };
    } catch (fallbackError) {
      return this.createErrorResponse(fallbackError, processingPath);
    }
  }

  /**
   * 🧹 캐시 초기화
   *
   * 모든 캐시 항목 삭제
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 캐시 초기화 완료');
  }

  /**
   * 📊 캐시 통계 조회
   *
   * 현재 캐시 상태 및 통계 정보 반환
   */
  public getCacheStats(): {
    totalEntries: number;
    cacheSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    let oldestTimestamp = Infinity;
    let newestTimestamp = 0;

    for (const [, cached] of this.cache) {
      if (cached.timestamp < oldestTimestamp) {
        oldestTimestamp = cached.timestamp;
      }
      if (cached.timestamp > newestTimestamp) {
        newestTimestamp = cached.timestamp;
      }
    }

    return {
      totalEntries: this.cache.size,
      cacheSize: this.cache.size,
      oldestEntry:
        oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : null,
      newestEntry: newestTimestamp > 0 ? new Date(newestTimestamp) : null,
    };
  }

  /**
   * 🔍 캐시 정리
   *
   * 만료된 캐시 항목들을 정리
   */
  public cleanupExpiredCache(): number {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, cached] of this.cache) {
      if (now - cached.timestamp > cached.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 만료된 캐시 항목 ${removedCount}개 정리됨`);
    }

    return removedCount;
  }

  /**
   * 💰 토큰 제한 메시지 생성
   */
  private getTokenLimitMessage(reason: string): string {
    switch (reason) {
      case 'daily_limit_exceeded':
        return '일일 사용 한도를 초과했습니다. 내일 다시 시도해 주세요.';
      case 'user_limit_exceeded':
        return '개인 사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
      default:
        return '사용 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.';
    }
  }

  /**
   * 💰 토큰 제한 설명 생성
   */
  private getTokenLimitDescription(reason: string): string {
    switch (reason) {
      case 'daily_limit_exceeded':
        return '일일 전체 토큰 사용량 한도 초과';
      case 'user_limit_exceeded':
        return '사용자별 토큰 사용량 한도 초과';
      default:
        return '토큰 사용량 한도 초과';
    }
  }

  /**
   * 📏 문자열 자르기 유틸리티
   *
   * 로그나 에러 메시지에서 긴 문자열을 안전하게 자름
   */
  public truncateString(str: string, maxLength: number = 100): string {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  }

  /**
   * 🎯 응답 시간 포맷터
   *
   * 밀리초를 사람이 읽기 쉬운 형태로 변환
   */
  public formatResponseTime(ms: number): string {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = Math.round((ms % 60000) / 1000);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * 🔧 Deep clone 유틸리티
   *
   * 객체의 깊은 복사본 생성 (순환 참조 안전)
   */
  public deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Map) {
      const clonedMap = new Map();
      for (const [key, value] of obj) {
        clonedMap.set(key, this.deepClone(value));
      }
      return clonedMap as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map((item) => this.deepClone(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const clonedObj = {} as T;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }

    return obj;
  }

  /**
   * 📦 메타데이터 합성기
   *
   * 여러 소스의 메타데이터를 안전하게 병합
   */
  public mergeMetadata(
    ...metadataObjects: Array<Record<string, unknown> | undefined>
  ): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    for (const metadata of metadataObjects) {
      if (metadata && typeof metadata === 'object') {
        Object.assign(result, metadata);
      }
    }

    return result;
  }

  /**
   * 🎭 처리 경로 포맷터
   *
   * processingPath를 사람이 읽기 쉬운 형태로 포맷
   */
  public formatProcessingPath(processingPath: string[]): string {
    if (processingPath.length === 0) return '처리 경로 없음';

    return processingPath
      .map((step, index) => `${index + 1}. ${step.replace(/_/g, ' ')}`)
      .join(' → ');
  }
}
