/**
 * GCP Functions 클라이언트 - 개선된 보안 및 성능
 *
 * Google Cloud Functions에 직접 연결하여 실제 클라우드 환경 활용
 * - 타입 안전성
 * - 기본 보안 헤더
 * - 타임아웃 및 재시도
 * - Rate limiting
 */

import type {
  Result,
  GCPFunctionsClientConfig,
  KoreanNLPRequest,
  KoreanNLPResponse,
  MLAnalyticsRequest,
  MLAnalyticsResponse,
  UnifiedAIRequest,
  UnifiedAIResponse
} from './gcp-functions.types';

import { GCPFunctionErrorCode } from './gcp-functions.types';

import { createConfig, RATE_LIMIT_CONFIG, logConfiguration } from './gcp-functions.config';
import {
  checkRateLimit,
  createSecurityHeaders,
  fetchWithTimeout,
  retryWithBackoff,
  createGCPError,
  convertHttpError,
  createSafeUrl,
  validateResponse,
  debugLog
} from './gcp-functions.utils';

/**
 * 개선된 GCP Functions 클라이언트
 */
export class GCPFunctionsClient {
  private config: GCPFunctionsClientConfig;

  constructor(config?: Partial<GCPFunctionsClientConfig>) {
    this.config = config ? { ...createConfig(), ...config } : createConfig();
    
    // 개발 환경에서 설정 로깅
    if (process.env.NODE_ENV === 'development') {
      logConfiguration();
    }
  }

  /**
   * 제네릭 함수 호출 메서드
   */
  async callFunction<TRequest, TResponse>(
    functionName: string,
    data: TRequest
  ): Promise<Result<TResponse>> {
    // Rate limiting 확인
    if (!checkRateLimit(functionName, RATE_LIMIT_CONFIG)) {
      return {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        code: 429
      };
    }

    debugLog(functionName, 'Starting request', { data });

    return retryWithBackoff(
      () => this.performRequest<TRequest, TResponse>(functionName, data),
      this.config.maxRetries,
      this.config.retryDelay
    );
  }

  /**
   * 실제 HTTP 요청 수행
   */
  private async performRequest<TRequest, TResponse>(
    functionName: string,
    data: TRequest
  ): Promise<Result<TResponse>> {
    try {
      // 안전한 URL 생성
      const url = createSafeUrl(this.config.baseUrl, functionName);
      
      // 보안 헤더 생성
      const headers = createSecurityHeaders();

      debugLog(functionName, 'Making HTTP request', { 
        url: url.toString(),
        timeout: this.config.timeout 
      });

      // 타임아웃과 함께 요청
      const response = await fetchWithTimeout(
        url.toString(),
        {
          method: 'POST',
          headers,
          body: JSON.stringify(data),
        },
        this.config.timeout
      );

      // HTTP 에러 처리
      if (!response.ok) {
        throw convertHttpError(response, functionName);
      }

      // JSON 파싱
      let responseData: unknown;
      try {
        responseData = await response.json();
      } catch (parseError) {
        throw createGCPError(
          GCPFunctionErrorCode.CLIENT_ERROR,
          'Invalid JSON response',
          response.status,
          functionName
        );
      }

      debugLog(functionName, 'Request successful', { status: response.status });

      // 응답 검증 및 반환
      return validateResponse<TResponse>(responseData);

    } catch (error) {
      debugLog(functionName, 'Request failed', { error });

      // 이미 GCP Function Error인 경우
      if (error && typeof error === 'object' && 'code' in error) {
        const gcpError = error as any;
        return {
          success: false,
          error: gcpError.message,
          code: gcpError.code || gcpError.status || 500,
          details: gcpError.details
        };
      }

      // 기타 에러
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        code: 500
      };
    }
  }

  /**
   * 클라이언트 상태 조회
   */
  getStatus() {
    return {
      baseUrl: this.config.baseUrl,
      environment: process.env.NODE_ENV,
      timeout: this.config.timeout,
      maxRetries: this.config.maxRetries,
      apiVersion: this.config.apiVersion,
      clientId: this.config.clientId,
    };
  }
}

// 글로벌 클라이언트 인스턴스
let globalClient: GCPFunctionsClient | null = null;

/**
 * GCP Functions 클라이언트 가져오기
 *
 * @returns GCPFunctionsClient 인스턴스 (실제 API)
 */
export function getGCPFunctionsClient(): GCPFunctionsClient {
  if (!globalClient) {
    const baseUrl = process.env.NEXT_PUBLIC_GCP_FUNCTIONS_URL;
    if (!baseUrl || baseUrl.includes('your-project')) {
      throw new Error(
        '⚠️ GCP Functions URL이 설정되지 않았습니다. .env.local을 확인하세요.'
      );
    }
    globalClient = new GCPFunctionsClient();
    console.log('🌐 실제 GCP Functions 사용 중');
  }
  return globalClient;
}

/**
 * Korean NLP 분석 헬퍼 (직접 호출)
 */
export async function analyzeKoreanNLP(
  query: string, 
  context?: unknown
): Promise<Result<KoreanNLPResponse>> {
  const client = getGCPFunctionsClient();
  return client.callFunction<KoreanNLPRequest, KoreanNLPResponse>(
    'enhanced-korean-nlp', 
    { query, context }
  );
}

/**
 * ML Analytics 분석 헬퍼 (직접 호출)
 */
export async function analyzeMLMetrics(
  metrics: unknown[], 
  context?: { analysis_type?: string; [key: string]: unknown }
): Promise<Result<MLAnalyticsResponse>> {
  const client = getGCPFunctionsClient();
  return client.callFunction<MLAnalyticsRequest, MLAnalyticsResponse>(
    'ml-analytics-engine', 
    { metrics, context }
  );
}

/**
 * 통합 AI 처리 헬퍼 (직접 호출)
 */
export async function processUnifiedAI(
  request: UnifiedAIRequest
): Promise<Result<UnifiedAIResponse>> {
  const client = getGCPFunctionsClient();
  return client.callFunction<UnifiedAIRequest, UnifiedAIResponse>(
    'unified-ai-processor', 
    request
  );
}

/**
 * GCP Functions 상태 조회 (단순화)
 */
export function getGCPFunctionsStatus() {
  return {
    baseUrl: process.env.NEXT_PUBLIC_GCP_FUNCTIONS_URL,
    environment: process.env.NODE_ENV,
    directCall: true, // Circuit Breaker 비활성화
  };
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('🌐 GCP Functions 직접 호출 모드:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Base URL: ${process.env.NEXT_PUBLIC_GCP_FUNCTIONS_URL}`);
  console.log(`  - Circuit Breaker: 비활성화`);
  console.log(`  - Mock Fallback: 비활성화`);
  console.log(`  - 100% GCP Functions 사용`);
}
