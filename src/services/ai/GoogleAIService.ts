/**
 * 🤖 Google AI Service v5.44.3
 * Edge Runtime 완전 호환 버전
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

interface GoogleAIConfig {
  apiKey: string;
  model: 'gemini-1.5-flash' | 'gemini-1.5-pro';
  enabled: boolean;
  rateLimits: {
    rpm: number;
    daily: number;
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
 * 🤖 Google AI 서비스 클래스
 * GOOGLE_ONLY 모드 전용, 자연어 질의 처리
 */
export class GoogleAIService {
  private static instance: GoogleAIService | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private initialized = false;
  private requestCount = 0;
  private lastError: string | null = null;

  constructor() {
    logger.info('🤖 Google AI Service 초기화 시작 - Edge Runtime 모드');
  }

  /**
   * 🎯 싱글톤 인스턴스 가져오기
   */
  public static getInstance(): GoogleAIService {
    if (!GoogleAIService.instance) {
      GoogleAIService.instance = new GoogleAIService();
    }
    return GoogleAIService.instance;
  }

  /**
   * 🔧 서비스 초기화
   */
  async initialize(): Promise<void> {
    const timer = performance.startTimer('google-ai-initialization');

    try {
      // Vercel 환경에서 Google AI 사용 가능 여부 확인
      if (!vercelConfig.enableGoogleAI) {
        throw new Error('Google AI는 Pro 플랜에서만 사용 가능합니다');
      }

      const apiKey = process.env.GOOGLE_AI_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_AI_API_KEY 환경 변수가 설정되지 않았습니다');
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
      });

      this.initialized = true;
      this.lastError = null;

      const duration = timer();
      logger.info(`✅ Google AI Service 초기화 완료: ${duration.toFixed(2)}ms`);
    } catch (error) {
      const duration = timer();
      this.lastError = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        `❌ Google AI Service 초기화 실패: ${duration.toFixed(2)}ms`,
        error
      );
      throw error;
    }
  }

  /**
   * 🎯 AI 쿼리 처리 (자연어 질의 전용)
   */
  async processQuery(request: AIRequest): Promise<AIResponse> {
    const requestId = `google_${++this.requestCount}_${Date.now()}`;
    const timer = performance.startTimer('google-ai-query');

    logger.info(`🔄 Google AI 쿼리 처리 시작: ${requestId}`, {
      query: request.query?.substring(0, 100),
      mode: request.mode,
    });

    try {
      if (!this.initialized || !this.model) {
        throw new Error('Google AI Service가 초기화되지 않았습니다');
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

      const result = await Promise.race([
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
          mainEngine: 'Google AI (Gemini)',
          supportEngines: ['Google AI (Gemini)'],
          ragUsed: false,
          googleAIUsed: true,
          mcpContextUsed: false,
          subEnginesUsed: [],
          cacheUsed: false,
          processingTime: googleDuration,
          enginePath: ['google-ai-service'],
        },
      };

      // 성공한 응답 캐시 저장
      cache.set(cacheKey, response, vercelConfig.cacheTTL);

      const duration = timer();
      logger.info(
        `✅ Google AI 쿼리 완료: ${requestId} (${duration.toFixed(2)}ms)`
      );

      return response;
    } catch (error) {
      const duration = timer();
      this.lastError = error instanceof Error ? error.message : 'Unknown error';

      logger.error(
        `❌ Google AI 쿼리 실패: ${requestId} (${duration.toFixed(2)}ms)`,
        error
      );

      return {
        success: false,
        response: '',
        confidence: 0,
        mode: request.mode || 'GOOGLE_ONLY',
        enginePath: ['google-ai-error'],
        processingTime: duration,
        fallbacksUsed: 0,
        error: this.lastError,
        metadata: {
          mainEngine: 'Google AI (Error)',
          supportEngines: [],
          ragUsed: false,
          googleAIUsed: false,
          mcpContextUsed: false,
          subEnginesUsed: [],
          error: this.lastError,
        },
      };
    }
  }

  /**
   * 🔍 자연어 질의 판별
   */
  private isNaturalLanguageQuery(query: string): boolean {
    // 한국어 자연어 패턴
    const koreanNaturalPatterns = [
      /^(어떻게|왜|무엇|언제|어디서|누가|무엇을|어떤|어느)/,
      /\?$/,
      /(설명|분석|요약|정리|알려|추천|비교|차이|방법)/,
      /(할 수 있나요|가능한가요|해주세요|도와주세요)/,
      /(문제|해결|개선|최적화|성능|상태)/,
    ];

    // 영어 자연어 패턴
    const englishNaturalPatterns = [
      /^(how|why|what|when|where|who|which|can you|could you)/i,
      /\?$/,
      /(explain|analyze|summarize|tell me|recommend|compare|difference)/i,
      /(help|assist|show|provide|give)/i,
    ];

    const text = query.trim();
    return (
      koreanNaturalPatterns.some(pattern => pattern.test(text)) ||
      englishNaturalPatterns.some(pattern => pattern.test(text))
    );
  }

  /**
   * 📝 프롬프트 생성
   */
  private buildPrompt(request: AIRequest): string {
    const basePrompt = `
당신은 서버 시스템 관리 전문가입니다. 사용자의 질문에 대해 정확하고 실용적인 답변을 제공해주세요.

질문: ${request.query}

다음 사항을 고려하여 답변해주세요:
1. 기술적으로 정확한 정보 제공
2. 실무에 바로 적용 가능한 솔루션 제시
3. 한국어로 자연스럽고 이해하기 쉽게 설명
4. 필요시 단계별 가이드 제공
5. 주의사항이나 제한사항도 함께 안내

답변:`;

    return basePrompt.trim();
  }

  /**
   * 📊 신뢰도 계산
   */
  private calculateConfidence(response: string, query: string): number {
    let confidence = 0.7; // Google AI 기본 신뢰도

    // 응답 길이 평가
    if (response.length > 50) confidence += 0.1;
    if (response.length > 200) confidence += 0.1;

    // 전문 용어 포함 여부
    const technicalTerms = [
      'CPU',
      '메모리',
      '디스크',
      '네트워크',
      '서버',
      '데이터베이스',
      'API',
      '로드밸런서',
      '캐시',
      '모니터링',
      '로그',
      '백업',
    ];

    const termsFound = technicalTerms.filter(term =>
      response.toLowerCase().includes(term.toLowerCase())
    ).length;

    confidence += Math.min(termsFound * 0.02, 0.1);

    // 구체적인 해결책 제시 여부
    const solutionPatterns = [
      /단계/,
      /방법/,
      /해결/,
      /설치/,
      /설정/,
      /구성/,
      /최적화/,
    ];

    const solutionsFound = solutionPatterns.filter(pattern =>
      pattern.test(response)
    ).length;

    confidence += Math.min(solutionsFound * 0.03, 0.1);

    return Math.min(confidence, 0.95);
  }

  /**
   * 🔑 쿼리 해시 생성
   */
  private generateQueryHash(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 32bit integer 변환
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 🎯 응답 생성 (UnifiedAIEngine 호환)
   */
  async generateResponse(prompt: string): Promise<GoogleAIResponse> {
    try {
      const request: AIRequest = {
        query: prompt,
        mode: 'GOOGLE_ONLY',
      };

      const response = await this.processQuery(request);

      return {
        success: response.success,
        content: response.response || '',
        model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
        tokensUsed: 0,
        cached: false,
        processingTime: response.processingTime || 0,
        confidence: response.confidence || 0.7,
        error: response.error
          ? {
              code: 'GOOGLE_AI_ERROR',
              message: response.error,
              details: response.error,
              timestamp: new Date().toISOString(),
              retryable: false,
            }
          : undefined,
      };
    } catch (error: any) {
      logger.error('❌ Google AI 응답 생성 실패:', error);

      return {
        success: false,
        content: '',
        model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
        tokensUsed: 0,
        cached: false,
        processingTime: 0,
        confidence: 0,
        error: {
          code: 'GOOGLE_AI_ERROR',
          message: error.message || 'Google AI API 실패',
          details: error.stack || error.toString(),
          timestamp: new Date().toISOString(),
          retryable: false,
        },
      };
    }
  }

  /**
   * 🎯 서버 메트릭 분석 (기존 호환성)
   */
  async analyzeServerMetrics(metrics: ServerMetrics[]): Promise<string> {
    const prompt = `
서버 모니터링 데이터를 분석해주세요:

${metrics
  .map(
    server => `
서버: ${server.name}
CPU: ${server.cpu_usage}%
메모리: ${server.memory_usage}%
디스크: ${server.disk_usage}%
응답시간: ${server.response_time}ms
상태: ${server.status}
`
  )
  .join('\n')}

다음 관점에서 분석해주세요:
1. 현재 시스템 상태 요약
2. 주의가 필요한 서버 식별
3. 성능 최적화 권장사항
4. 예상되는 문제점과 대응방안

간결하고 실용적인 분석을 제공해주세요.
        `;

    const response = await this.generateResponse(prompt);
    return response.content;
  }

  /**
   * 🏥 헬스체크
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.initialized || !this.model) {
        return false;
      }

      // 간단한 테스트 쿼리
      const testResult = await Promise.race([
        this.model.generateContent('안녕하세요'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        ),
      ]);

      return !!testResult.response;
    } catch (error) {
      logger.warn('Google AI 헬스체크 실패:', error);
      return false;
    }
  }

  /**
   * 📊 서비스 상태 조회
   */
  getStatus() {
    return {
      initialized: this.initialized,
      requestCount: this.requestCount,
      lastError: this.lastError,
      model: process.env.GOOGLE_AI_MODEL || 'gemini-1.5-flash',
      enabledInPlan: vercelConfig.enableGoogleAI,
      vercelPlan: vercelConfig.environment.isPro ? 'pro' : 'hobby',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * ✅ 가용성 확인
   */
  isAvailable(): boolean {
    return this.initialized && vercelConfig.enableGoogleAI;
  }

  /**
   * ✅ 준비 상태 확인
   */
  isReady(): boolean {
    return this.isAvailable();
  }

  /**
   * 🔗 연결 테스트
   */
  async testConnection(): Promise<{
    success: boolean;
    message: string;
    latency?: number;
  }> {
    try {
      const isHealthy = await this.healthCheck();
      return {
        success: isHealthy,
        message: isHealthy ? 'Google AI 연결 성공' : 'Google AI 연결 실패',
        latency: isHealthy ? 100 : 0,
      };
    } catch (error) {
      return {
        success: false,
        message: `Google AI 연결 실패: ${error instanceof Error ? error.message : 'Unknown error'}`,
        latency: 0,
      };
    }
  }

  /**
   * 🧹 정리 작업
   */
  cleanup(): void {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
    this.requestCount = 0;
    this.lastError = null;

    logger.info('🧹 Google AI Service 정리 완료');
  }
}
