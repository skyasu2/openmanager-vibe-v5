/**
 * 🤖 Google AI Service v2025.7
 * Edge Runtime 완전 호환 버전
 *
 * 📋 2025년 7월 최신 모델 지원:
 * - Gemini 2.0 Flash (기본, 추천): 15 RPM, 1M TPM, 1500 RPD
 * - Gemini 2.5 Flash Preview: 10 RPM, 250K TPM, 500 RPD
 * - Gemini 2.5 Pro Experimental: 5 RPM, 250K TPM, 25 RPD
 * - Gemini 2.0 Flash-Lite: 30 RPM, 1M TPM, 1500 RPD
 */

import { getVercelConfig } from '@/config/vercel-edge-config';
import { edgeRuntimeService } from '@/lib/edge-runtime-utils';
import { AIRequest, AIResponse } from '@/types/ai-types';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Edge Runtime 설정
const vercelConfig = getVercelConfig();
const logger = edgeRuntimeService.logger;
const cache = edgeRuntimeService.cache;
const performance = edgeRuntimeService.performance;

// 🚀 신규: 쿼리 복잡도에 따른 모델 매핑 (Free Tier 전용)
const MODEL_MAPPING = {
  simple: 'gemini-2.0-flash-lite', // 비용 최적화
  normal: 'gemini-2.0-flash', // 표준
  complex: 'gemini-2.5-pro', // 🚀 복잡한 쿼리도 안정적인 무료 티어 모델로 처리
} as const;

type QueryComplexity = keyof typeof MODEL_MAPPING;

interface GoogleAIConfig {
  apiKey: string;
  model:
  | 'gemini-2.0-flash'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.0-flash-lite';
  enabled: boolean;
  rateLimits: {
    rpm: number;
    daily: number;
    tpm: number; // Token Per Minute 추가
  };
}

export interface GoogleAIResponse {
  success: boolean;
  content: string;
  model: string;
  tokensUsed?: number;
  cached?: boolean;
  processingTime: number;
  confidence: number;
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
    model: string;
  };
  error?: {
    code: string;
    message: string;
    details: string;
    timestamp: string;
    retryable: boolean;
  };
}

interface ServerMetrics {
  name: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  response_time: number;
  status: string;
  timestamp: string;
}

/**
 * 🚫 서버리스 호환: 요청별 Google AI 서비스
 * 전역 상태 없이 각 요청마다 새로운 인스턴스 생성
 */
export class RequestScopedGoogleAIService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private initialized = false;
  private requestCount = 0;
  private lastError: string | null = null;

  constructor() {
    logger.info('🚫 서버리스 호환: 요청별 Google AI Service 초기화');
  }

  /**
   * 🔧 서비스 초기화 (요청별)
   */
  async initialize(): Promise<void> {
    const timer = performance.startTimer('google-ai-initialization');

    try {
      // Vercel 환경에서 Google AI 사용 가능 여부 확인
      if (!vercelConfig.enableGoogleAI) {
        throw new Error('Google AI는 Pro 플랜에서만 사용 가능합니다');
      }

      // 🔑 환경변수에서 API 키 가져오기
      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('Google AI API 키가 설정되지 않았습니다');
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: process.env.GOOGLE_AI_MODEL || 'gemini-2.0-flash',
      });

      this.initialized = true;
      this.lastError = null;

      const duration = timer();
      logger.info(`✅ 요청별 Google AI Service 초기화 완료: ${duration.toFixed(2)}ms`);
    } catch (error) {
      const duration = timer();
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        `❌ 요청별 Google AI Service 초기화 실패: ${duration.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  }

  /**
   * 🚀 쿼리 복잡도 분석
   */
  private analyzeQueryComplexity(query: string): QueryComplexity {
    const length = query.length;
    const hasCode = query.includes('```');
    const hasKeywords =
      /(SELECT|UPDATE|DELETE|FROM|WHERE|function|class|interface|type)/i.test(
        query
      );

    if (hasCode || (length > 500 && hasKeywords)) {
      return 'complex';
    } else if (length > 150 || hasKeywords) {
      return 'normal';
    } else {
      return 'simple';
    }
  }

  /**
   * 🎯 AI 쿼리 처리 (자연어 질의 전용)
   */
  async processQuery(request: AIRequest): Promise<AIResponse> {
    const requestId = `google_${++this.requestCount}_${Date.now()}`;
    const timer = performance.startTimer('google-ai-query');

    logger.info(`🔄 요청별 Google AI 쿼리 처리: ${requestId}`, {
      query: request.query?.substring(0, 100),
      mode: request.mode,
    });

    try {
      if (!this.initialized || !this.model || !this.genAI) {
        await this.initialize();
      }

      // 자연어 질의 확인
      if (!this.isNaturalLanguageQuery(request.query || '')) {
        throw new Error('Google AI는 자연어 질의에만 사용됩니다');
      }

      // 캐시 확인
      const cacheKey = `google_ai_${this.generateQueryHash(request.query || '')}`;
      const cached = cache.get(cacheKey);
      if (cached) {
        logger.info(`📋 Google AI 캐시 응답: ${requestId}`);
        return cached;
      }

      // Google AI 요청
      const googleTimer = performance.startTimer('google-ai-api-call');

      const result: any = await Promise.race([
        this.model.generateContent(this.buildPrompt(request)),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error('Google AI API timeout')),
            vercelConfig.maxExecutionTime - 2000
          )
        ),
      ]);

      const googleDuration = googleTimer();

      if (!result.response) {
        throw new Error('Google AI에서 응답을 받지 못했습니다');
      }

      const text = result.response.text();
      const confidence = this.calculateConfidence(text, request.query || '');

      const response: AIResponse = {
        success: true,
        response: text,
        confidence,
        mode: request.mode || 'GOOGLE_ONLY',
        enginePath: ['google-ai-service'],
        processingTime: googleDuration,
        fallbacksUsed: 0,
        metadata: {
          mainEngine: 'Google AI (요청별)',
          supportEngines: ['Google AI (Gemini)'],
          ragUsed: false,
          googleAIUsed: true,
          mcpContextUsed: false,
          subEnginesUsed: [],
          cacheUsed: false,
          requestId,
        },
      };

      // 캐시에 저장
      cache.set(cacheKey, response, 300000); // 5분 캐시

      const totalDuration = timer();
      logger.info(`✅ 요청별 Google AI 응답 완료: ${totalDuration.toFixed(2)}ms`);

      return response;
    } catch (error) {
      const duration = timer();
      logger.error(`❌ 요청별 Google AI 처리 실패: ${duration.toFixed(2)}ms`, error);

      return {
        success: false,
        response: '죄송합니다. Google AI 서비스에 일시적인 문제가 발생했습니다.',
        confidence: 0,
        mode: request.mode || 'GOOGLE_ONLY',
        enginePath: ['google-ai-service'],
        processingTime: duration,
        fallbacksUsed: 0,
        metadata: {
          mainEngine: 'Google AI (요청별)',
          supportEngines: [],
          ragUsed: false,
          googleAIUsed: false,
          mcpContextUsed: false,
          subEnginesUsed: [],
          cacheUsed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  private isNaturalLanguageQuery(query: string): boolean {
    // 자연어 질의 패턴 검사
    const naturalLanguagePatterns = [
      /^(어떻게|왜|무엇|언제|어디서|누가)/,
      /\?$/,
      /(설명|알려|도움|방법|이유)/,
      /(서버|시스템|모니터링|분석)/,
    ];

    return naturalLanguagePatterns.some(pattern => pattern.test(query));
  }

  private buildPrompt(request: AIRequest): string {
    return `
사용자 질문: ${request.query}

다음 가이드라인에 따라 답변해주세요:
1. 한국어로 답변
2. 서버 모니터링 및 시스템 관리 관점에서 답변
3. 구체적이고 실용적인 조언 제공
4. 필요시 단계별 설명 포함
`;
  }

  private calculateConfidence(response: string, query: string): number {
    if (response.length < 50) return 0.3;
    if (response.includes('죄송합니다')) return 0.4;
    if (response.includes('확실하지 않습니다')) return 0.5;
    return 0.8;
  }

  private generateQueryHash(query: string): string {
    return Buffer.from(query).toString('base64').substring(0, 16);
  }

  /**
   * 🚫 헬스체크 비활성화
   */
  async healthCheck(): Promise<boolean> {
    console.warn('⚠️ Google AI 헬스체크 무시됨 - 서버리스에서는 요청별 처리');
    return true;
  }

  /**
   * 🚫 상태 조회 비활성화
   */
  getStatus() {
    console.warn('⚠️ Google AI 상태 조회 무시됨 - 서버리스 환경');
    return {
      initialized: this.initialized,
      available: false,
      mode: 'serverless',
      requestCount: this.requestCount,
      lastError: this.lastError,
    };
  }

  /**
   * 🚫 가용성 확인 비활성화
   */
  isAvailable(): boolean {
    console.warn('⚠️ Google AI 가용성 확인 무시됨 - 서버리스 환경');
    return false;
  }

  /**
   * 🚫 준비 상태 확인 비활성화
   */
  isReady(): boolean {
    console.warn('⚠️ Google AI 준비 상태 확인 무시됨 - 서버리스 환경');
    return this.initialized;
  }

  /**
   * 🚫 연결 테스트 비활성화
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    console.warn('⚠️ Google AI 연결 테스트 무시됨 - 서버리스 환경');
    return {
      success: false,
      message: '서버리스 환경에서는 연결 테스트가 비활성화됩니다.',
    };
  }

  /**
   * 🚫 정리 비활성화
   */
  cleanup(): void {
    console.warn('⚠️ Google AI 정리 무시됨 - 서버리스에서는 자동 정리');
  }
}

/**
 * 🔧 서버리스 호환 팩토리 함수
 */
export function createGoogleAIService(): RequestScopedGoogleAIService {
  return new RequestScopedGoogleAIService();
}

/**
 * 🚫 레거시 호환성 (사용 금지)
 * @deprecated 서버리스 환경에서는 createGoogleAIService() 사용
 */
export const GoogleAIService = {
  getInstance: () => {
    console.warn('⚠️ GoogleAIService.getInstance()는 서버리스에서 사용 금지.');
    console.warn('🔧 대신 createGoogleAIService()를 사용하세요.');
    return new RequestScopedGoogleAIService();
  }
};
