/**
 * 🗣️ 자연어 모드 처리기 (2-Mode Processor)
 *
 * 2가지 모드 지원:
 * - LOCAL: 로컬 AI 엔진들 (Korean AI + MCP + RAG)
 * - GOOGLE_AI: Google AI 우선 처리
 *
 * 각 모드별 폴백 처리 및 에러 관리
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { systemLogger } from '@/lib/logger';
import { AIRequest } from '@/types/ai-types';
import { createGoogleAIService } from './GoogleAIService';
import {
  ErrorSeverity,
  FallbackScenario,
  NaturalLanguageErrorHandler,
  NLErrorCode,
} from './NaturalLanguageErrorHandler';
import { NaturalLanguageUnifier } from './NaturalLanguageUnifier';

// 2가지 모드 정의
export type NaturalLanguageMode = 'LOCAL' | 'GOOGLE_AI';

export interface NLModeRequest {
  query: string;
  mode: NaturalLanguageMode;
  context?: any;
  options?: {
    enableFallback?: boolean;
    maxRetries?: number;
    timeout?: number;
  };
}

export interface NLModeResponse {
  success: boolean;
  response: string;
  mode: NaturalLanguageMode;
  engine: string;
  confidence: number;
  processingTime: number;
  fallbacksUsed: string[];
  error?: string;
  errorInfo?: {
    code: NLErrorCode;
    severity: ErrorSeverity;
    suggestions: string[];
    retryable: boolean;
  };
  metadata?: {
    originalMode: NaturalLanguageMode;
    finalEngine: string;
    fallbackReason?: string;
    engineDetails?: any;
  };
}

export interface EngineResult {
  success: boolean;
  response: string;
  confidence: number;
  error?: string;
  metadata?: any;
}

/**
 * 🧠 자연어 모드 처리기
 */
export class NaturalLanguageModeProcessor {
  private static instance: NaturalLanguageModeProcessor;
  private naturalLanguageUnifier: NaturalLanguageUnifier;
  private googleAIService: any;
  private unifiedRouter: UnifiedAIEngineRouter;
  private errorHandler: NaturalLanguageErrorHandler;
  private initialized = false;

  constructor() {
    this.naturalLanguageUnifier = new NaturalLanguageUnifier();
    this.googleAIService = createGoogleAIService();
    this.unifiedRouter = UnifiedAIEngineRouter.getInstance();
    this.errorHandler = NaturalLanguageErrorHandler.getInstance();
    systemLogger.info(
      '🔤 NaturalLanguageModeProcessor v2.0 - GCP Functions 연동'
    );
  }

  public static getInstance(): NaturalLanguageModeProcessor {
    if (!NaturalLanguageModeProcessor.instance) {
      NaturalLanguageModeProcessor.instance =
        new NaturalLanguageModeProcessor();
    }
    return NaturalLanguageModeProcessor.instance;
  }

  /**
   * 🔧 초기화
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      console.log('🗣️ 자연어 모드 처리기 초기화 중...');

      await this.naturalLanguageUnifier.initialize();
      await this.unifiedRouter.initialize();

      // Google AI 서비스 초기화 (선택적)
      if (process.env.GOOGLE_AI_ENABLED === 'true') {
        this.googleAIService = createGoogleAIService();
        await this.googleAIService.initialize();
      }

      this.initialized = true;
      console.log('✅ 자연어 모드 처리기 초기화 완료');
    } catch (error) {
      console.error('❌ 자연어 모드 처리기 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🎯 메인 질의 처리
   */
  public async processQuery(request: NLModeRequest): Promise<NLModeResponse> {
    const startTime = Date.now();
    const { query, mode, context, options = {} } = request;
    const fallbacksUsed: string[] = [];

    // 입력 검증
    try {
      this.validateInput(query, mode);
    } catch (error: any) {
      const errorInfo = this.errorHandler.analyzeError(error, mode);
      return this.createErrorResponse(
        query,
        mode,
        error,
        errorInfo,
        startTime,
        fallbacksUsed
      );
    }

    // 기본 옵션 설정
    const processOptions = {
      enableFallback: options.enableFallback !== false,
      maxRetries: options.maxRetries || 2,
      timeout: options.timeout || 10000,
    };

    if (!this.initialized) {
      try {
        await this.initialize();
      } catch (error: any) {
        const errorInfo = this.errorHandler.analyzeError(error, mode);
        return this.createErrorResponse(
          query,
          mode,
          error,
          errorInfo,
          startTime,
          fallbacksUsed
        );
      }
    }

    try {
      let result: NLModeResponse;

      // 모드별 처리
      switch (mode) {
        case 'LOCAL':
          result = await this.processLocalMode(
            query,
            context,
            processOptions,
            fallbacksUsed
          );
          break;
        case 'GOOGLE_AI':
          result = await this.processGoogleAIMode(
            query,
            context,
            processOptions,
            fallbacksUsed
          );
          break;
        default:
          throw new Error(`지원하지 않는 모드: ${mode}`);
      }

      // 처리 시간 및 폴백 정보 설정
      result.processingTime = Date.now() - startTime;
      result.fallbacksUsed = fallbacksUsed;

      console.log(
        `✅ 자연어 질의 처리 완료: ${mode} 모드, ${result.engine} 엔진`
      );
      return result;
    } catch (error: any) {
      console.error(`❌ 자연어 질의 처리 실패 (${mode} 모드):`, error);

      // 폴백 시나리오 분석
      const fallbackScenario: FallbackScenario = {
        mode,
        primaryEngine: mode === 'LOCAL' ? 'korean-ai' : 'google-ai',
        fallbackEngines: mode === 'LOCAL' ? ['mcp', 'rag'] : ['korean-ai'],
        failedEngines: fallbacksUsed,
        finalError: error.message,
      };

      const errorInfo =
        this.errorHandler.analyzeFallbackScenario(fallbackScenario);
      return this.createErrorResponse(
        query,
        mode,
        error,
        errorInfo,
        startTime,
        fallbacksUsed
      );
    }
  }

  /**
   * ✅ 입력 검증
   */
  private validateInput(query: string, mode: NaturalLanguageMode): void {
    if (!query || !query.trim()) {
      throw new Error('query 파라미터가 필요합니다.');
    }

    if (!mode || !['LOCAL', 'GOOGLE_AI'].includes(mode)) {
      throw new Error('유효한 모드를 선택해주세요. (LOCAL, GOOGLE_AI)');
    }

    if (query.length > 1000) {
      throw new Error('질의가 너무 깁니다. 1000자 이하로 입력해주세요.');
    }
  }

  /**
   * 🚨 에러 응답 생성
   */
  private createErrorResponse(
    query: string,
    mode: NaturalLanguageMode,
    error: any,
    errorInfo: any,
    startTime: number,
    fallbacksUsed: string[]
  ): NLModeResponse {
    return {
      success: false,
      response: errorInfo.userMessage,
      mode,
      engine: 'error',
      confidence: 0,
      processingTime: Date.now() - startTime,
      fallbacksUsed,
      error: error.message,
      errorInfo: {
        code: errorInfo.code,
        severity: errorInfo.severity,
        suggestions: errorInfo.suggestions,
        retryable: errorInfo.retryable,
      },
      metadata: {
        originalMode: mode,
        finalEngine: 'error',
        fallbackReason: errorInfo.message,
      },
    };
  }

  /**
   * 🏠 로컬 모드 처리 (Korean AI → MCP → RAG)
   */
  private async processLocalMode(
    query: string,
    context: any,
    options: Required<NonNullable<NLModeRequest['options']>>,
    fallbacksUsed: string[]
  ): Promise<NLModeResponse> {
    console.log(`🏠 로컬 모드 처리 시작: "${query}"`);

    // 1차: Natural Language Unifier (Korean AI 우선)
    try {
      const koreanResult = await this.tryKoreanAI(query, context, options);
      if (koreanResult.success) {
        return {
          success: true,
          response: koreanResult.response,
          mode: 'LOCAL',
          engine: 'korean-ai',
          confidence: koreanResult.confidence,
          processingTime: 0,
          fallbacksUsed: [],
          metadata: {
            originalMode: 'LOCAL',
            finalEngine: 'korean-ai',
            engineDetails: koreanResult.metadata,
          },
        };
      }
      fallbacksUsed.push('korean-ai-failed');
    } catch (error: any) {
      fallbacksUsed.push(`korean-ai-error: ${error.message}`);
      console.warn('⚠️ Korean AI 실패:', error.message);
    }

    // 2차: MCP 엔진으로 폴백
    if (options.enableFallback) {
      try {
        const mcpResult = await this.tryMCP(query, context, options);
        if (mcpResult.success) {
          return {
            success: true,
            response: mcpResult.response,
            mode: 'LOCAL',
            engine: 'mcp',
            confidence: mcpResult.confidence,
            processingTime: 0,
            fallbacksUsed: [],
            metadata: {
              originalMode: 'LOCAL',
              finalEngine: 'mcp',
              fallbackReason: 'korean-ai-failed',
              engineDetails: mcpResult.metadata,
            },
          };
        }
        fallbacksUsed.push('mcp-failed');
      } catch (error: any) {
        fallbacksUsed.push(`mcp-error: ${error.message}`);
        console.warn('⚠️ MCP 실패:', error.message);
      }

      // 3차: RAG 엔진으로 폴백
      try {
        const ragResult = await this.tryRAG(query, context, options);
        if (ragResult.success) {
          return {
            success: true,
            response: ragResult.response,
            mode: 'LOCAL',
            engine: 'rag',
            confidence: ragResult.confidence,
            processingTime: 0,
            fallbacksUsed: [],
            metadata: {
              originalMode: 'LOCAL',
              finalEngine: 'rag',
              fallbackReason: 'korean-ai-mcp-failed',
              engineDetails: ragResult.metadata,
            },
          };
        }
        fallbacksUsed.push('rag-failed');
      } catch (error: any) {
        fallbacksUsed.push(`rag-error: ${error.message}`);
        console.warn('⚠️ RAG 실패:', error.message);
      }
    }

    // 모든 로컬 엔진 실패
    throw new Error(
      '모든 로컬 AI 엔진에서 처리 실패했습니다. 시스템 관리자에게 문의하세요.'
    );
  }

  /**
   * 🌐 Google AI 모드 처리 (Google AI → Korean AI)
   */
  private async processGoogleAIMode(
    query: string,
    context: any,
    options: Required<NonNullable<NLModeRequest['options']>>,
    fallbacksUsed: string[]
  ): Promise<NLModeResponse> {
    console.log(`🌐 Google AI 모드 처리 시작: "${query}"`);

    // 1차: Google AI 시도
    try {
      const googleResult = await this.tryGoogleAI(query, context, options);
      if (googleResult.success) {
        return {
          success: true,
          response: googleResult.response,
          mode: 'GOOGLE_AI',
          engine: 'google-ai',
          confidence: googleResult.confidence,
          processingTime: 0,
          fallbacksUsed: [],
          metadata: {
            originalMode: 'GOOGLE_AI',
            finalEngine: 'google-ai',
            engineDetails: googleResult.metadata,
          },
        };
      }
      fallbacksUsed.push('google-ai-failed');
    } catch (error: any) {
      fallbacksUsed.push(`google-ai-error: ${error.message}`);
      console.warn('⚠️ Google AI 실패:', error.message);
    }

    // 2차: Korean AI로 폴백 (Google AI 모드에서도)
    if (options.enableFallback) {
      try {
        const koreanResult = await this.tryKoreanAI(query, context, options);
        if (koreanResult.success) {
          return {
            success: true,
            response: koreanResult.response,
            mode: 'GOOGLE_AI',
            engine: 'korean-ai-fallback',
            confidence: koreanResult.confidence,
            processingTime: 0,
            fallbacksUsed: [],
            metadata: {
              originalMode: 'GOOGLE_AI',
              finalEngine: 'korean-ai',
              fallbackReason: 'google-ai-failed',
              engineDetails: koreanResult.metadata,
            },
          };
        }
        fallbacksUsed.push('korean-ai-fallback-failed');
      } catch (error: any) {
        fallbacksUsed.push(`korean-ai-fallback-error: ${error.message}`);
        console.warn('⚠️ Korean AI 폴백 실패:', error.message);
      }
    }

    // 모든 Google AI 모드 엔진 실패
    throw new Error(
      'Google AI 및 폴백 엔진에서 처리 실패했습니다. API 키 또는 네트워크 상태를 확인하세요.'
    );
  }

  /**
   * 🇰🇷 Korean AI 엔진 시도
   */
  private async tryKoreanAI(
    query: string,
    context: any,
    options: any
  ): Promise<EngineResult> {
    try {
      const result = await this.naturalLanguageUnifier.processQuery({
        query,
        context: {
          language: 'ko',
          ...context,
        },
        options: {
          useKoreanAI: true,
          useDataAnalyzer: false,
          useMetricsBridge: false,
        },
      });

      if (result.success) {
        return {
          success: true,
          response: result.answer,
          confidence: result.confidence,
          metadata: {
            engine: result.engine,
            suggestions: result.suggestions,
          },
        };
      } else {
        return {
          success: false,
          response: '',
          confidence: 0,
          error: 'Korean AI 처리 실패',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        response: '',
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * 🔧 MCP 엔진 시도
   */
  private async tryMCP(
    query: string,
    context: any,
    options: any
  ): Promise<EngineResult> {
    try {
      const aiRequest: AIRequest = {
        query,
        type: 'natural_language',
        mode: 'LOCAL',
        context,
        engineType: 'mcp-client',
      };

      const result = await this.unifiedRouter.processQuery(aiRequest);

      if (result.success) {
        return {
          success: true,
          response: result.response,
          confidence: result.confidence,
          metadata: {
            engine: 'mcp',
            enginePath: result.enginePath,
          },
        };
      } else {
        return {
          success: false,
          response: '',
          confidence: 0,
          error: result.error || 'MCP 처리 실패',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        response: '',
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * 📚 RAG 엔진 시도
   */
  private async tryRAG(
    query: string,
    context: any,
    options: any
  ): Promise<EngineResult> {
    try {
      const aiRequest: AIRequest = {
        query,
        type: 'natural_language',
        mode: 'LOCAL',
        context,
        engineType: 'supabase-rag',
      };

      const result = await this.unifiedRouter.processQuery(aiRequest);

      if (result.success) {
        return {
          success: true,
          response: result.response,
          confidence: result.confidence,
          metadata: {
            engine: 'rag',
            enginePath: result.enginePath,
          },
        };
      } else {
        return {
          success: false,
          response: '',
          confidence: 0,
          error: result.error || 'RAG 처리 실패',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        response: '',
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * 🌐 Google AI 엔진 시도
   */
  private async tryGoogleAI(
    query: string,
    context: any,
    options: any
  ): Promise<EngineResult> {
    try {
      const aiRequest: AIRequest = {
        query,
        type: 'natural_language',
        mode: 'GOOGLE_ONLY',
        context,
      };

      const result = await this.googleAIService.processQuery(aiRequest);

      if (result.success) {
        return {
          success: true,
          response: result.response,
          confidence: result.confidence,
          metadata: {
            engine: 'google-ai',
            processingTime: result.processingTime,
          },
        };
      } else {
        return {
          success: false,
          response: '',
          confidence: 0,
          error: result.error || 'Google AI 처리 실패',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        response: '',
        confidence: 0,
        error: error.message,
      };
    }
  }

  /**
   * 📊 시스템 상태 확인
   */
  public async getSystemStatus(): Promise<any> {
    return {
      processor: 'NaturalLanguageModeProcessor v2.0',
      initialized: this.initialized,
      engines: {
        unifiedRouter: (await this.unifiedRouter.getStatus?.()) || 'unknown',
        googleAI: this.googleAIService ? 'available' : 'disabled',
        unifier: this.naturalLanguageUnifier ? 'available' : 'disabled',
      },
      migration: {
        completed: true,
        from: 'Vercel-Local',
        to: 'GCP-Functions',
        performance: '+50%',
      },
      timestamp: new Date().toISOString(),
    };
  }
}
