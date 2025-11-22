/**
 * 🔄 SimplifiedQueryEngine Adapter
 *
 * 목적: GoogleAiUnifiedEngine을 SimplifiedQueryEngine 인터페이스로 래핑
 * - 기존 API 호환성 유지
 * - 타입 변환 (QueryRequest ↔ UnifiedQueryRequest)
 * - 시나리오 자동 감지
 */

import type {
  QueryRequest,
  QueryResponse,
} from '@/services/ai/SimplifiedQueryEngine.types';

import type {
  UnifiedQueryRequest,
  UnifiedQueryResponse,
  AIScenario,
} from '../core/types';

import { GoogleAiUnifiedEngine } from '../core/google-ai-unified-engine';

/**
 * 쿼리 → 시나리오 자동 감지
 */
function detectScenario(query: string, _context?: unknown): AIScenario {
  const lowerQuery = query.toLowerCase();

  // 키워드 기반 시나리오 감지
  if (
    lowerQuery.includes('장애') ||
    lowerQuery.includes('fail') ||
    lowerQuery.includes('error') ||
    lowerQuery.includes('문제')
  ) {
    return 'failure-analysis';
  }

  if (
    lowerQuery.includes('성능') ||
    lowerQuery.includes('performance') ||
    lowerQuery.includes('병목') ||
    lowerQuery.includes('느림')
  ) {
    return 'performance-report';
  }

  if (
    lowerQuery.includes('문서') ||
    lowerQuery.includes('doc') ||
    lowerQuery.includes('설명') ||
    lowerQuery.includes('어떻게')
  ) {
    return 'document-qa';
  }

  if (
    lowerQuery.includes('대시보드') ||
    lowerQuery.includes('dashboard') ||
    lowerQuery.includes('요약') ||
    lowerQuery.includes('summary')
  ) {
    return 'dashboard-summary';
  }

  if (
    lowerQuery.includes('사고') ||
    lowerQuery.includes('incident') ||
    lowerQuery.includes('장애 리포트')
  ) {
    return 'incident-report';
  }

  if (
    lowerQuery.includes('최적화') ||
    lowerQuery.includes('optimize') ||
    lowerQuery.includes('개선') ||
    lowerQuery.includes('improve')
  ) {
    return 'optimization-advice';
  }

  // 기본: 일반 쿼리
  return 'general-query';
}

/**
 * UnifiedQueryResponse → QueryResponse 변환
 */
function convertToQueryResponse(
  unifiedResponse: UnifiedQueryResponse
): QueryResponse {
  return {
    success: unifiedResponse.success,
    response: unifiedResponse.response,
    engine: unifiedResponse.metadata.engine,
    confidence: 0.9, // GoogleAiUnifiedEngine은 항상 높은 신뢰도
    thinkingSteps: unifiedResponse.thinkingSteps || [],
    metadata: {
      model: unifiedResponse.metadata.model,
      tokensUsed: unifiedResponse.metadata.tokensUsed,
      mcpUsed: false, // SimplifiedQueryEngine 호환성
      mode: 'google-ai-unified',
      timestamp: unifiedResponse.metadata.timestamp,
      cacheHit: unifiedResponse.metadata.cacheHit,
      providersUsed: unifiedResponse.metadata.providersUsed,
    },
    processingTime: unifiedResponse.metadata.processingTime,
    error: unifiedResponse.error,
  };
}

/**
 * 🔄 SimplifiedQueryEngine Adapter
 *
 * GoogleAiUnifiedEngine을 SimplifiedQueryEngine 인터페이스로 래핑
 */
export class SimplifiedQueryEngineAdapter {
  private engine: GoogleAiUnifiedEngine;

  constructor() {
    // GoogleAiUnifiedEngine 초기화 (기본 설정)
    this.engine = new GoogleAiUnifiedEngine({
      model: 'gemini-2.0-flash-lite',
      temperature: 0.7,
      maxTokens: 2048,
      timeout: 30000,
      cache: {
        enabled: true,
        ttl: 5 * 60 * 1000, // 5분
        maxSize: 100,
      },
      providers: {
        rag: {
          enabled: true,
          maxResults: 5,
          threshold: 0.7,
        },
        ml: {
          enabled: true,
          models: ['anomaly-detection', 'trend-analysis'],
        },
        rule: {
          enabled: true,
          confidenceThreshold: 0.6,
        },
      },
    });
  }

  /**
   * 초기화 (SimplifiedQueryEngine 호환성)
   */
  async _initialize(): Promise<void> {
    // GoogleAiUnifiedEngine은 초기화 불필요
    console.log('✅ SimplifiedQueryEngineAdapter 초기화 완료');
  }

  /**
   * 쿼리 처리 (SimplifiedQueryEngine 인터페이스)
   */
  async query(request: QueryRequest): Promise<QueryResponse> {
    const { query, context: _context, options } = request;

    // 1. 시나리오 자동 감지
    const scenario = detectScenario(query, _context);

    // 2. UnifiedQueryRequest 생성
    const unifiedRequest: UnifiedQueryRequest = {
      query,
      scenario,
      options: {
        enableRAG: options?.enableRAG ?? true,
        enableML: options?.enableML ?? true,
        enableRules: options?.enableRules ?? true,
        cached: options?.cached ?? true,
        includeThinking: true, // 항상 thinkingSteps 포함
        temperature: options?.temperature,
        timeoutMs: options?.timeoutMs || 30000,
      },
    };

    // 3. GoogleAiUnifiedEngine 호출
    const unifiedResponse = await this.engine.query(unifiedRequest);

    // 4. QueryResponse 변환
    return convertToQueryResponse(unifiedResponse);
  }

  /**
   * 헬스 체크 (SimplifiedQueryEngine 호환성)
   */
  async healthCheck(): Promise<{
    status: string;
    engines: {
      localRAG: boolean;
      googleAI: boolean;
      mcp: boolean;
    };
  }> {
    const health = await this.engine.healthCheck();

    return {
      status: health.healthy ? 'healthy' : 'degraded',
      engines: {
        localRAG: health.providers.some((p) => p.type === 'rag' && p.healthy),
        googleAI: health.googleAIStatus.available,
        mcp: false, // SimplifiedQueryEngine 호환성
      },
    };
  }

  /**
   * 통계 조회 (추가 기능)
   */
  getStats() {
    return this.engine.getStats();
  }

  /**
   * 설정 업데이트 (추가 기능)
   */
  configure(config: Parameters<GoogleAiUnifiedEngine['configure']>[0]) {
    this.engine.configure(config);
  }
}

/**
 * 싱글톤 인스턴스
 */
let adapterInstance: SimplifiedQueryEngineAdapter | null = null;

export function getSimplifiedQueryEngineAdapter(): SimplifiedQueryEngineAdapter {
  if (!adapterInstance) {
    adapterInstance = new SimplifiedQueryEngineAdapter();
  }
  return adapterInstance;
}
