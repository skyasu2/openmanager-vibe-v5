/**
 * 📦 통합 응답 포맷터
 *
 * 모든 분산 AI 서비스의 응답을 표준 형식으로 변환
 * - 서비스별 응답 정규화
 * - 메타데이터 통합
 * - 생각중 단계 병합
 */

import type {
  AIServiceType,
  DistributedResponse,
  ResponseMetadata,
  ThinkingStep,
  SupabaseRAGResponse,
  GCPFunctionResponse,
  RedisCacheResponse,
  EdgeRouterResponse,
  ProcessingStatus,
} from '../interfaces/distributed-ai.interface';

export interface UnifiedAIResponse {
  // 기본 응답
  id: string;
  success: boolean;
  answer: string;
  confidence: number;

  // 컨텍스트 정보
  context?: {
    sources: Array<{
      type: 'document' | 'cache' | 'function' | 'knowledge';
      content: string;
      relevance: number;
      metadata?: Record<string, unknown>;
    }>;
    totalSources: number;
  };

  // 처리 정보
  processing: {
    totalTime: number;
    services: Array<{
      name: AIServiceType;
      time: number;
      status: ProcessingStatus;
      tokensUsed?: number;
    }>;
    thinkingSteps: ThinkingStep[];
    routingPath: AIServiceType[];
  };

  // 메타데이터
  metadata: {
    requestId: string;
    timestamp: string;
    mode: 'local' | 'google-ai' | 'hybrid';
    cacheHit: boolean;
    fallbackUsed: boolean;
    tokensTotal?: number;
  };

  // 추가 데이터
  additionalData?: Record<string, unknown>;
}

/**
 * 통합 응답 포맷터 클래스
 */
export class UnifiedResponseFormatter {
  private static instance: UnifiedResponseFormatter;

  private constructor() {}

  static getInstance(): UnifiedResponseFormatter {
    if (!this.instance) {
      this.instance = new UnifiedResponseFormatter();
    }
    return this.instance;
  }

  /**
   * 분산 응답을 통합 형식으로 변환
   */
  formatResponse(
    responses: Map<AIServiceType, DistributedResponse>,
    request: { id: string; query: string },
    startTime: number
  ): UnifiedAIResponse {
    const mainResponse = this.selectMainResponse(responses);
    const answer = this.extractAnswer(mainResponse, responses);
    const confidence = this.calculateConfidence(responses);
    const context = this.buildContext(responses);
    const thinkingSteps = this.mergeThinkingSteps(responses);
    const routingPath = this.extractRoutingPath(responses);

    return {
      id: request.id,
      success: this.isOverallSuccess(responses),
      answer,
      confidence,
      context,
      processing: {
        totalTime: Date.now() - startTime,
        services: this.buildServicesSummary(responses),
        thinkingSteps,
        routingPath,
      },
      metadata: {
        requestId: request.id,
        timestamp: new Date().toISOString(),
        mode: this.determineMode(responses),
        cacheHit: this.hasCacheHit(responses),
        fallbackUsed: this.hasFallback(responses),
        tokensTotal: this.calculateTotalTokens(responses),
      },
      additionalData: this.extractAdditionalData(responses),
    };
  }

  /**
   * Supabase RAG 응답 포맷
   */
  formatSupabaseRAGResponse(
    response: DistributedResponse<SupabaseRAGResponse>,
    query: string,
    startTime: number
  ): UnifiedAIResponse {
    const data = response.data;
    const topResults = data.results.slice(0, 3);

    return {
      id: response.id,
      success: response.success,
      answer: this.generateRAGAnswer(query, topResults),
      confidence: this.calculateRAGConfidence(topResults),
      context: {
        sources: topResults.map((result) => ({
          type: 'document' as const,
          content: result.content,
          relevance: result.similarity,
          metadata: result.metadata,
        })),
        totalSources: data.totalResults,
      },
      processing: {
        totalTime: Date.now() - startTime,
        services: [
          {
            name: 'supabase-rag',
            time: response.metadata.processingTime,
            status: 'completed',
            tokensUsed: response.metadata.tokensUsed,
          },
        ],
        thinkingSteps: response.thinkingSteps || [],
        routingPath: ['supabase-rag'],
      },
      metadata: {
        requestId: response.id,
        timestamp: response.metadata.timestamp,
        mode: 'local',
        cacheHit: response.metadata.cacheHit || false,
        fallbackUsed: false,
        tokensTotal: response.metadata.tokensUsed,
      },
    };
  }

  /**
   * GCP Function 응답 포맷
   */
  formatGCPFunctionResponse(
    response: DistributedResponse<GCPFunctionResponse>,
    functionType: string,
    startTime: number
  ): UnifiedAIResponse {
    const data = response.data;

    return {
      id: response.id,
      success: response.success,
      answer: this.extractGCPAnswer(data.result, functionType),
      confidence: data.confidence || 0.8,
      context: data.processingSteps
        ? {
            sources: [
              {
                type: 'function' as const,
                content: data.processingSteps.join('\n'),
                relevance: 1.0,
                metadata: { functionType },
              },
            ],
            totalSources: 1,
          }
        : undefined,
      processing: {
        totalTime: Date.now() - startTime,
        services: [
          {
            name: response.metadata.service,
            time: response.metadata.processingTime,
            status: 'completed',
            tokensUsed: response.metadata.tokensUsed,
          },
        ],
        thinkingSteps: response.thinkingSteps || [],
        routingPath: [response.metadata.service],
      },
      metadata: {
        requestId: response.id,
        timestamp: response.metadata.timestamp,
        mode: 'google-ai',
        cacheHit: false,
        fallbackUsed: false,
        tokensTotal: response.metadata.tokensUsed,
      },
      additionalData: { result: data.result },
    };
  }

  /**
   * Edge Router 통합 응답 포맷
   */
  formatEdgeRouterResponse(
    response: EdgeRouterResponse,
    request: { id: string; query: string },
    startTime: number
  ): UnifiedAIResponse {
    const responses = response.results;
    return this.formatResponse(responses, request, startTime);
  }

  // === Private 헬퍼 메서드들 ===

  private selectMainResponse(
    responses: Map<AIServiceType, DistributedResponse>
  ): DistributedResponse | null {
    // 우선순위: google-ai > supabase-rag > gcp-korean-nlp > others
    const priorities: AIServiceType[] = [
      'edge-router',
      'supabase-rag',
      'gcp-korean-nlp',
      'gcp-ml-analytics',
      'redis-cache',
    ];

    for (const service of priorities) {
      const response = responses.get(service);
      if (response?.success && response.data) {
        return response;
      }
    }

    // 성공한 응답이 없으면 첫 번째 응답 반환
    return Array.from(responses.values())[0] || null;
  }

  private extractAnswer(
    mainResponse: DistributedResponse | null,
    responses: Map<AIServiceType, DistributedResponse>
  ): string {
    if (!mainResponse || !mainResponse.data) {
      return '죄송합니다. 요청을 처리할 수 없습니다.';
    }

    const service = mainResponse.metadata.service;

    // 서비스별 답변 추출
    switch (service) {
      case 'supabase-rag': {
        const data = mainResponse.data as SupabaseRAGResponse;
        return this.generateRAGAnswer('', data.results.slice(0, 3));
      }

      case 'gcp-korean-nlp':
      case 'gcp-ml-analytics': {
        const data = mainResponse.data as GCPFunctionResponse;
        return this.extractGCPAnswer(data.result, service);
      }

      case 'redis-cache': {
        const data = mainResponse.data as RedisCacheResponse;
        return typeof data.data === 'string'
          ? data.data
          : JSON.stringify(data.data);
      }

      default:
        return JSON.stringify(mainResponse.data);
    }
  }

  private generateRAGAnswer(
    query: string,
    results: SupabaseRAGResponse['results']
  ): string {
    if (results.length === 0) {
      return '관련된 정보를 찾을 수 없습니다.';
    }

    const topResult = results[0];
    const answer = topResult.content;

    if (results.length > 1) {
      return `${answer}\n\n관련 정보: ${results.length}개의 문서에서 추출됨`;
    }

    return answer;
  }

  private extractGCPAnswer(result: unknown, functionType: string): string {
    if (typeof result === 'string') {
      return result;
    }

    if (typeof result === 'object' && result !== null) {
      if ('answer' in result) {
        return String((result as { answer: unknown }).answer);
      }
      if ('response' in result) {
        return String((result as { response: unknown }).response);
      }
      if ('text' in result) {
        return String((result as { text: unknown }).text);
      }
    }

    return `${functionType} 처리 완료`;
  }

  private calculateConfidence(
    responses: Map<AIServiceType, DistributedResponse>
  ): number {
    const confidences: number[] = [];

    for (const response of responses.values()) {
      if (response.success && response.data) {
        // RAG 응답
        if (
          typeof response.data === 'object' &&
          response.data !== null &&
          'results' in response.data
        ) {
          const data = response.data as SupabaseRAGResponse;
          if (data.results.length > 0) {
            confidences.push(data.results[0].similarity);
          }
        }
        // GCP 응답
        else if (
          typeof response.data === 'object' &&
          response.data !== null &&
          'confidence' in response.data
        ) {
          confidences.push(
            (response.data as GCPFunctionResponse).confidence || 0.8
          );
        }
        // 기본 성공
        else {
          confidences.push(0.7);
        }
      }
    }

    if (confidences.length === 0) return 0;
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  private calculateRAGConfidence(
    results: SupabaseRAGResponse['results']
  ): number {
    if (results.length === 0) return 0;

    // 상위 결과들의 가중 평균
    const weights = [0.5, 0.3, 0.2];
    let confidence = 0;

    for (let i = 0; i < Math.min(results.length, weights.length); i++) {
      confidence += results[i].similarity * weights[i];
    }

    return confidence;
  }

  private buildContext(
    responses: Map<AIServiceType, DistributedResponse>
  ): UnifiedAIResponse['context'] | undefined {
    const sources: Array<{
      type: 'document' | 'cache' | 'function' | 'knowledge';
      content: string;
      relevance: number;
      metadata?: Record<string, unknown>;
    }> = [];

    for (const [service, response] of responses) {
      if (!response.success || !response.data) continue;

      // RAG 소스
      if (
        service === 'supabase-rag' &&
        typeof response.data === 'object' &&
        response.data !== null &&
        'results' in response.data
      ) {
        const data = response.data as SupabaseRAGResponse;
        sources.push(
          ...data.results.map((result) => ({
            type: 'document' as const,
            content: result.content,
            relevance: result.similarity,
            metadata: result.metadata,
          }))
        );
      }

      // 캐시 소스
      else if (service === 'redis-cache') {
        sources.push({
          type: 'cache' as const,
          content: String(response.data),
          relevance: 1.0,
          metadata: { cached: true },
        });
      }
    }

    return sources.length > 0
      ? { sources, totalSources: sources.length }
      : undefined;
  }

  private mergeThinkingSteps(
    responses: Map<AIServiceType, DistributedResponse>
  ): ThinkingStep[] {
    const allSteps: ThinkingStep[] = [];

    for (const [service, response] of responses) {
      if (response.thinkingSteps) {
        allSteps.push(
          ...response.thinkingSteps.map((step) => ({
            ...step,
            service: step.service || service,
          }))
        );
      }
    }

    // 시간순 정렬
    return allSteps.sort((a, b) => a.timestamp - b.timestamp);
  }

  private extractRoutingPath(
    responses: Map<AIServiceType, DistributedResponse>
  ): AIServiceType[] {
    return Array.from(responses.keys()).filter(
      (service) => responses.get(service)?.success
    );
  }

  private buildServicesSummary(
    responses: Map<AIServiceType, DistributedResponse>
  ): UnifiedAIResponse['processing']['services'] {
    return Array.from(responses.entries()).map(([service, response]) => ({
      name: service,
      time: response.metadata.processingTime,
      status: response.success ? 'completed' : 'failed',
      tokensUsed: response.metadata.tokensUsed,
    }));
  }

  private isOverallSuccess(
    responses: Map<AIServiceType, DistributedResponse>
  ): boolean {
    // 최소 하나의 성공적인 응답이 있으면 성공
    for (const response of responses.values()) {
      if (response.success) return true;
    }
    return false;
  }

  private determineMode(
    responses: Map<AIServiceType, DistributedResponse>
  ): 'local' | 'google-ai' | 'hybrid' {
    const services = Array.from(responses.keys());

    const hasLocal = services.some(
      (s) => s === 'supabase-rag' || s === 'redis-cache'
    );
    const hasGoogle = services.some((s) => s.startsWith('gcp-'));

    if (hasLocal && hasGoogle) return 'hybrid';
    if (hasGoogle) return 'google-ai';
    return 'local';
  }

  private hasCacheHit(
    responses: Map<AIServiceType, DistributedResponse>
  ): boolean {
    for (const response of responses.values()) {
      if (response.metadata.cacheHit) return true;
    }
    return false;
  }

  private hasFallback(
    responses: Map<AIServiceType, DistributedResponse>
  ): boolean {
    for (const response of responses.values()) {
      if (response.metadata.fallbackUsed) return true;
    }
    return false;
  }

  private calculateTotalTokens(
    responses: Map<AIServiceType, DistributedResponse>
  ): number | undefined {
    let total = 0;
    let hasTokens = false;

    for (const response of responses.values()) {
      if (response.metadata.tokensUsed) {
        total += response.metadata.tokensUsed;
        hasTokens = true;
      }
    }

    return hasTokens ? total : undefined;
  }

  private extractAdditionalData(
    responses: Map<AIServiceType, DistributedResponse>
  ): Record<string, unknown> | undefined {
    const data: Record<string, unknown> = {};

    for (const [service, response] of responses) {
      if (response.data && typeof response.data === 'object') {
        // 추가 데이터 추출 (answer, confidence 등 기본 필드 제외)
        const { results, result, context, ...additionalData } =
          response.data as Record<string, unknown>;
        if (Object.keys(additionalData).length > 0) {
          data[service] = additionalData;
        }
      }
    }

    return Object.keys(data).length > 0 ? data : undefined;
  }
}

// 싱글톤 인스턴스 export
export const unifiedResponseFormatter = UnifiedResponseFormatter.getInstance();
