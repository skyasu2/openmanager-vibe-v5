/**
 * Unified AI Engine Router for OpenManager VIBE v5
 *
 * Central orchestrator for all AI services with:
 * - Intelligent routing between AI engines
 * - Comprehensive security layer
 * - Token usage monitoring and limits
 * - Circuit breaker patterns
 * - Performance optimization
 * - Korean NLP integration
 *
 * @author AI Systems Engineer
 * @version 1.0.0
 */

import {
    QueryRequest,
    QueryResponse,
    SimplifiedQueryEngine,
} from './SimplifiedQueryEngine';
import {
    getPerformanceOptimizedQueryEngine,
    type PerformanceOptimizedQueryEngine
} from './performance-optimized-query-engine';
import {
    AIResponseFilter,
    filterAIResponse,
} from './security/AIResponseFilter';
import {
    PromptSanitizer,
    sanitizePrompt,
    type SanitizationResult
} from './security/PromptSanitizer';
import { getSupabaseRAGEngine } from './supabase-rag-engine';
import { serverCommandsMap, recommendCommands, type OSCommand } from '@/config/serverCommandsConfig';

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

// 명령어 추천 관련 타입 정의
interface CommandRecommendation {
  command: string;
  description: string;
  category: string;
  confidence: number;
  usage_example: string;
  related_commands?: string[];
}

interface CommandRequestContext {
  isCommandRequest: boolean;
  detectedCategories: string[];
  specificCommands: string[];
  confidence: number;
  requestType: 'command_inquiry' | 'command_usage' | 'command_request' | 'general';
}

export interface RouterConfig {
  // 보안 설정
  enableSecurity: boolean;
  strictSecurityMode: boolean;

  // 토큰 사용량 제한
  dailyTokenLimit: number;
  userTokenLimit: number;

  // 엔진 선택 설정
  preferredEngine: 'auto' | 'google-ai' | 'local-rag' | 'korean-nlp';
  fallbackChain: string[];

  // 성능 설정
  enableCircuitBreaker: boolean;
  maxRetries: number;
  timeoutMs: number;

  // 한국어 처리
  enableKoreanNLP: boolean;
  koreanNLPThreshold: number;
}

export interface RouterMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  tokenUsage: {
    daily: number;
    total: number;
    byUser: Map<string, number>;
  };
  engineUsage: {
    googleAI: number;
    localRAG: number;
    koreanNLP: number;
    fallback: number;
  };
  securityEvents: {
    promptsBlocked: number;
    responsesFiltered: number;
    threatsDetected: string[];
  };
}

export interface RouteResult extends QueryResponse {
  routingInfo: {
    selectedEngine: string;
    fallbackUsed: boolean;
    securityApplied: boolean;
    tokensCounted: boolean;
    processingPath: string[];
  };
}

export class UnifiedAIEngineRouter {
  private static instance: UnifiedAIEngineRouter;
  private config: RouterConfig;
  private metrics: RouterMetrics;

  // AI 엔진 인스턴스들
  private simplifiedEngine!: SimplifiedQueryEngine;
  private performanceEngine!: PerformanceOptimizedQueryEngine;
  private ragEngine: unknown; // SupabaseRAGEngine

  // 보안 컴포넌트들
  private promptSanitizer!: PromptSanitizer;
  private responseFilter!: AIResponseFilter;

  // Circuit Breaker 상태
  private circuitBreakers: Map<
    string,
    {
      failures: number;
      lastFailure: number;
      state: 'closed' | 'open' | 'half-open';
      threshold: number;
      timeout: number;
    }
  >;

  // 간단한 인메모리 캐시 (프로덕션에서는 Redis 사용)
  private cache: Map<string, {
    response: QueryResponse;
    timestamp: number;
    ttl: number;
  }>;

  private constructor(config?: Partial<RouterConfig>) {
    this.config = {
      enableSecurity: true,
      strictSecurityMode: true, // 엔터프라이즈급 보안 적용
      dailyTokenLimit: 10000, // 무료 티어 고려
      userTokenLimit: 1000, // 사용자당 일일 제한
      preferredEngine: 'auto',
      fallbackChain: ['local-rag', 'google-ai', 'korean-nlp'],
      enableCircuitBreaker: true,
      maxRetries: 2,
      timeoutMs: 30000, // 30초
      enableKoreanNLP: true,
      koreanNLPThreshold: 0.7,
      ...config,
    };

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      tokenUsage: {
        daily: 0,
        total: 0,
        byUser: new Map(),
      },
      engineUsage: {
        googleAI: 0,
        localRAG: 0,
        koreanNLP: 0,
        fallback: 0,
      },
      securityEvents: {
        promptsBlocked: 0,
        responsesFiltered: 0,
        threatsDetected: [],
      },
    };

    this.circuitBreakers = new Map();
    this.cache = new Map();
    
    // 동기적으로 초기화 (테스트 환경에서 문제 방지)
    try {
      this.initializeComponents();
    } catch (error) {
      console.warn('⚠️ 초기화 중 일부 컴포넌트 실패 (테스트 환경에서는 정상):', error);
    }
  }

  public static getInstance(
    config?: Partial<RouterConfig>
  ): UnifiedAIEngineRouter {
    if (!UnifiedAIEngineRouter.instance) {
      UnifiedAIEngineRouter.instance = new UnifiedAIEngineRouter(config);
    }
    return UnifiedAIEngineRouter.instance;
  }

  /**
   * 🚀 컴포넌트 초기화
   */
  private initializeComponents(): void {
    try {
      // AI 엔진들 초기화
      this.simplifiedEngine = new SimplifiedQueryEngine();
      this.performanceEngine = getPerformanceOptimizedQueryEngine();
      this.ragEngine = getSupabaseRAGEngine();

      // 보안 컴포넌트들 초기화
      this.promptSanitizer = PromptSanitizer.getInstance({
        enableStrictMode: this.config.strictSecurityMode,
        enableKoreanProtection: this.config.enableKoreanNLP,
      });

      this.responseFilter = AIResponseFilter.getInstance({
        enableStrictFiltering: this.config.strictSecurityMode,
      });

      console.log('🎯 UnifiedAIEngineRouter 초기화 완료');
    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter 초기화 실패:', error);
      // 테스트 환경에서는 에러를 던지지 않음
      if (process.env.NODE_ENV !== 'test') {
        throw error;
      }
    }
  }

  /**
   * 🎯 메인 라우팅 메서드
   */
  public async route(
    request: QueryRequest & { userId?: string }
  ): Promise<RouteResult> {
    const startTime = Date.now();
    const processingPath: string[] = [];
    let selectedEngine = 'unknown';
    let fallbackUsed = false;
    let securityApplied = false;
    let tokensCounted = false;

    try {
      this.metrics.totalRequests++;
      processingPath.push('request_received');

      // 1. 캐시 확인
      const cacheKey = this.generateCacheKey(request);
      const cachedResult = this.getCachedResponse(cacheKey);
      if (cachedResult) {
        processingPath.push('cache_hit');
        return {
          ...cachedResult,
          routingInfo: {
            selectedEngine: 'cache',
            fallbackUsed: false,
            securityApplied: false,
            tokensCounted: false,
            processingPath,
          },
          metadata: cachedResult.metadata ? (() => {
            const { complexity, cacheHit, ...rest } = cachedResult.metadata as any;
            return {
              ...rest,
              cached: true,
            };
          })() : undefined,
          processingTime: Date.now() - startTime,
        };
      }
      processingPath.push('cache_miss');

      // 2. 보안 검사
      if (this.config.enableSecurity) {
        const securityResult = await this.applySecurity(request);
        if (securityResult.blocked) {
          this.metrics.securityEvents.promptsBlocked++;
          return this.createSecurityBlockedResponse(
            securityResult,
            processingPath
          );
        }
        request.query = securityResult.sanitized;
        securityApplied = true;
        processingPath.push('security_applied');
      }

      // 3. 토큰 사용량 확인
      if (request.userId) {
        const tokenCheck = this.checkTokenLimits(request.userId);
        if (!tokenCheck.allowed) {
          return this.createTokenLimitResponse(
            tokenCheck.reason || 'token_limit_exceeded',
            processingPath
          );
        }
        processingPath.push('token_check_passed');
      }

      // 4. 엔진 선택
      selectedEngine = await this.selectEngine(request);
      processingPath.push(`engine_selected_${selectedEngine}`);

      // 5. Circuit Breaker 확인
      if (this.config.enableCircuitBreaker) {
        // 선택된 엔진이 Circuit이 열린 상태인지 확인
        if (this.isCircuitOpen(selectedEngine)) {
          processingPath.push(`circuit_open_${selectedEngine}`);
          
          // 폴백 엔진 찾기
          const fallbackEngine = this.getFallbackEngine(selectedEngine);
          if (fallbackEngine && !this.isCircuitOpen(fallbackEngine)) {
            selectedEngine = fallbackEngine;
            fallbackUsed = true;
            processingPath.push(`circuit_breaker_fallback_to_${selectedEngine}`);
          } else {
            // 모든 엔진이 Circuit이 열린 상태
            return this.createCircuitOpenResponse(processingPath);
          }
        }
      }

      // 6. AI 엔진 실행 (폴백 지원)
      let response: QueryResponse | undefined;
      let currentEngine = selectedEngine;
      let engineAttempts = 0;
      const maxEngineAttempts = this.config.fallbackChain.length + 2; // 선택된 엔진 + 폴백 체인 모든 엔진
      let lastError: Error | undefined;

      while (engineAttempts < maxEngineAttempts) {
        try {
          response = await this.executeEngine(currentEngine, request);
          processingPath.push(`engine_executed_${currentEngine}`);
          break; // 성공시 종료
        } catch (engineError) {
          lastError = engineError instanceof Error ? engineError : new Error(String(engineError));
          engineAttempts++;
          this.recordFailure(currentEngine);
          processingPath.push(`engine_failed_${currentEngine}`);
          
          // 다음 폴백 엔진 선택
          const nextEngine = this.getFallbackEngine(currentEngine);
          if (nextEngine && engineAttempts < maxEngineAttempts) {
            currentEngine = nextEngine;
            fallbackUsed = true;
            processingPath.push(`fallback_to_${currentEngine}`);
            continue;
          } else {
            // 모든 엔진 실패
            processingPath.push('all_engines_failed');
            break; // while 루프 종료
          }
        }
      }

      // 모든 시도 후에도 response가 없으면 에러 던지기
      if (!response) {
        const finalError = lastError || new Error('모든 AI 엔진에서 응답을 받지 못했습니다.');
        throw finalError;
      }

      // 최종 선언된 엔진 업데이트
      selectedEngine = currentEngine;

      // 7. 응답 보안 필터링
      if (this.config.enableSecurity) {
        const filterResult = filterAIResponse(response.response);
        if (
          filterResult.riskLevel === 'blocked' ||
          filterResult.requiresRegeneration
        ) {
          this.metrics.securityEvents.responsesFiltered++;
          processingPath.push('response_needs_filtering');
          
          // 다른 엔진으로 재시도
          const retryResponse = await this.retryWithDifferentEngine(
            selectedEngine,
            request,
            processingPath
          );
          if (retryResponse) {
            response = retryResponse;
            selectedEngine = retryResponse.engine; // 재시도 엔진으로 업데이트
            processingPath.push('retry_successful');
          } else {
            response.response = filterResult.filtered;
            processingPath.push('response_filtered');
          }
        }
      }

      // 8. 토큰 사용량 기록
      if (request.userId && response.metadata?.tokensUsed) {
        const tokensUsed = typeof response.metadata.tokensUsed === 'number' 
          ? response.metadata.tokensUsed 
          : parseInt(String(response.metadata.tokensUsed), 10);
        
        if (!isNaN(tokensUsed)) {
          this.recordTokenUsage(request.userId, tokensUsed);
          tokensCounted = true;
          processingPath.push('tokens_recorded');
        }
      }

      // 9. 캐시 저장 (성공적인 응답만)
      if (response.success && !response.error) {
        this.setCachedResponse(cacheKey, response);
        processingPath.push('response_cached');
      }

      // 10. 메트릭 업데이트
      this.updateMetrics(selectedEngine, startTime, true);
      processingPath.push('metrics_updated');

      this.metrics.successfulRequests++;

      return {
        ...response,
        routingInfo: {
          selectedEngine,
          fallbackUsed,
          securityApplied,
          tokensCounted,
          processingPath,
        },
        metadata: response.metadata ? (() => {
          const { complexity, cacheHit, ...rest } = response.metadata as any;
          return {
            ...rest,
            cached: false, // 새로운 응답이므로 cached = false
          };
        })() : undefined,
      };
    } catch (error) {
      console.error('❌ UnifiedAIEngineRouter 오류:', error);
      this.recordFailure(selectedEngine);
      this.metrics.failedRequests++;
      processingPath.push('final_error');

      // 모든 엔진이 실패했으므로 바로 에러 응답 반환
      return this.createErrorResponse(error, processingPath);
    }
  }

  /**
   * 🛡️ 보안 적용
   */
  private async applySecurity(request: QueryRequest): Promise<SanitizationResult> {
    const sanitizationResult = sanitizePrompt(request.query);

    if (sanitizationResult.threatsDetected.length > 0) {
      this.metrics.securityEvents.threatsDetected.push(
        ...sanitizationResult.threatsDetected
      );
    }

    return sanitizationResult;
  }

  /**
   * 🎯 엔진 선택 로직
   */
  private async selectEngine(request: QueryRequest): Promise<string> {
    if (this.config.preferredEngine !== 'auto') {
      return this.config.preferredEngine;
    }

    // 쿼리 복잡도에 따른 우선 선택
    const queryLength = request.query.length;
    const hasServerContext = !!request.context?.servers;
    const hasLargeContext = request.context && Object.keys(request.context).length > 5;
    
    // 매우 복잡한 쿼리는 Google AI 우선
    if (queryLength > 200 || hasLargeContext) {
      return 'google-ai';
    }

    // 한국어 검출 및 NLP 엔진 선택 (중간 복잡도)
    if (this.config.enableKoreanNLP) {
      const koreanRatio = this.calculateKoreanRatio(request.query);
      if (koreanRatio > this.config.koreanNLPThreshold) {
        // 복잡한 한국어 쿼리는 여전히 Google AI 사용
        if (queryLength > 100 || hasServerContext) {
          return 'google-ai';
        }
        return 'korean-nlp';
      }
    }

    // 기본 복잡도 체크
    if (queryLength > 100 || hasServerContext) {
      return 'google-ai'; // 복잡한 쿼리는 Google AI
    } else {
      return 'local-rag'; // 간단한 쿼리는 로컬 RAG
    }
  }

  /**
   * 🇰🇷 한국어 비율 계산
   */
  private calculateKoreanRatio(text: string): number {
    const koreanChars = text.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g) || [];
    return koreanChars.length / text.length;
  }

  /**
   * ⚡ AI 엔진 실행
   */
  private async executeEngine(
    engineName: string,
    request: QueryRequest
  ): Promise<QueryResponse> {
    let response: QueryResponse;
    
    switch (engineName) {
      case 'google-ai':
        response = await this.simplifiedEngine.query({
          ...request,
          mode: 'google-ai',
        });
        break;

      case 'local-rag':
        response = await this.simplifiedEngine.query({ ...request, mode: 'local' });
        break;

      case 'korean-nlp':
        response = await this.executeKoreanNLP(request);
        break;

      case 'performance':
        response = await this.performanceEngine.query(request);
        break;

      default:
        throw new Error(`Unknown engine: ${engineName}`);
    }
    
    // 성공했을 때만 엔진 사용량 증가 (updateMetrics에서 처리됨)
    return response;
  }

  /**
   * 🇰🇷 한국어 NLP 실행
   */
  private async executeKoreanNLP(
    request: QueryRequest
  ): Promise<QueryResponse> {
    try {
      // 1. GCP Function 호출
      const response = await fetch('/api/ai/korean-nlp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: request.query,
          context: request.context,
        }),
      });

      if (!response.ok) {
        throw new Error(`Korean NLP API 오류: ${response.statusText}`);
      }

      const data = await response.json();
      const nlpData = data.data as KoreanNLPResponse;

      // 2. 명령어 요청 분석
      const commandContext = this.analyzeCommandRequest(
        request.query,
        nlpData?.entities
      );

      let finalResponse: string;
      let thinkingSteps = [
        {
          step: '한국어 NLP 분석',
          description: `의도: ${nlpData?.intent}, 엔티티: ${nlpData?.entities?.length || 0}개`,
          status: 'completed' as const,
          timestamp: Date.now(),
        },
      ];

      // 3. 명령어 요청인지 확인하고 적절히 처리
      if (commandContext.isCommandRequest && commandContext.confidence > 0.5) {
        // 명령어 추천 모드
        const recommendations = await this.generateCommandRecommendations(commandContext);
        finalResponse = this.formatCommandRecommendations(
          recommendations,
          commandContext,
          request.query
        );

        thinkingSteps.push({
          step: '명령어 요청 감지',
          description: `카테고리: ${commandContext.detectedCategories.join(', ')}, 신뢰도: ${Math.round(commandContext.confidence * 100)}%`,
          status: 'completed' as const,
          timestamp: Date.now(),
        });

        thinkingSteps.push({
          step: '명령어 추천 생성',
          description: `${recommendations.length}개 명령어 추천됨`,
          status: 'completed' as const,
          timestamp: Date.now(),
        });
      } else {
        // 일반 NLP 응답 모드
        finalResponse = this.convertKoreanNLPResponse(nlpData);
        
        if (commandContext.isCommandRequest) {
          thinkingSteps.push({
            step: '명령어 요청 감지',
            description: `낮은 신뢰도로 명령어 요청 감지됨 (${Math.round(commandContext.confidence * 100)}%), 일반 응답으로 처리`,
            status: 'completed' as const,
            timestamp: Date.now(),
          });
        }
      }

      // 4. 최종 응답 반환
      return {
        success: data.success,
        response: finalResponse,
        engine: 'korean-nlp' as const, // 명령어 추천도 Korean NLP 엔진으로 분류
        confidence: commandContext.isCommandRequest 
          ? Math.max(commandContext.confidence, data.data?.quality_metrics?.confidence || 0.8)
          : data.data?.quality_metrics?.confidence || 0.8,
        thinkingSteps,
        metadata: {
          koreanNLP: true,
          commandRecommendation: commandContext.isCommandRequest,
          commandContext: commandContext.isCommandRequest ? {
            categories: commandContext.detectedCategories,
            specificCommands: commandContext.specificCommands,
            requestType: commandContext.requestType,
            confidence: commandContext.confidence
          } : undefined,
          processingTime: data.data?.quality_metrics?.processing_time,
        },
        processingTime: data.data?.quality_metrics?.processing_time || 0,
      };
    } catch (error) {
      console.error('Korean NLP 실행 오류:', error);
      
      // 로컬 폴백 전에 간단한 명령어 추천 시도
      try {
        const commandContext = this.analyzeCommandRequest(request.query);
        if (commandContext.isCommandRequest && commandContext.confidence > 0.6) {
          const recommendations = await this.generateCommandRecommendations(commandContext);
          const response = this.formatCommandRecommendations(
            recommendations,
            commandContext,
            request.query
          );

          return {
            success: true,
            response: `[오프라인 모드] ${response}`,
            engine: 'fallback' as const,
            confidence: commandContext.confidence,
            thinkingSteps: [
              {
                step: 'Korean NLP 실패',
                description: 'API 오류로 로컬 명령어 분석 사용',
                status: 'completed',
                timestamp: Date.now(),
              },
              {
                step: '로컬 명령어 분석',
                description: `${recommendations.length}개 명령어 추천됨`,
                status: 'completed',
                timestamp: Date.now(),
              },
            ],
            metadata: {
              koreanNLP: false,
              commandRecommendation: true,
              fallbackMode: true,
            },
            processingTime: 100,
          };
        }
      } catch (fallbackError) {
        console.warn('로컬 명령어 분석도 실패:', fallbackError);
      }

      // 최종 폴백: 로컬 RAG
      return await this.simplifiedEngine.query({ ...request, mode: 'local' });
    }
  }

  /**
   * 🔄 한국어 NLP 응답 변환
   */
  private convertKoreanNLPResponse(nlpData: KoreanNLPResponse | null): string {
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

    if (response_guidance?.visualization_suggestions && response_guidance.visualization_suggestions.length > 0) {
      response += `\n권장 시각화: ${response_guidance.visualization_suggestions.join(', ')}`;
    }

    return response;
  }

  /**
   * 🤖 명령어 요청 감지
   */
  private analyzeCommandRequest(
    query: string, 
    nlpEntities?: Array<{ value: string; type?: string }>
  ): CommandRequestContext {
    const lowerQuery = query.toLowerCase();
    
    // 명령어 관련 키워드 패턴
    const commandPatterns = [
      /(\w+)\s*(명령어|커맨드|command)/,
      /(어떻게|어떤|무슨)\s*명령어/,
      /(실행|사용)하는\s*(방법|명령어)/,
      /(서버|시스템)\s*(상태|모니터링|관리).*명령어/,
      /command\s+(to|for)\s+/,
      /how\s+to\s+.*(command|cmd)/,
      /(확인|체크|모니터링)할\s*(명령어|커맨드|방법)/,  // 추가
      /(높을|낮을|많을|적을)\s*때\s*(확인|사용)할\s*(명령어|방법)?/  // 추가
    ];

    // 카테고리별 키워드
    const categoryKeywords = {
      monitoring: ['모니터링', '상태', '확인', 'monitor', 'status', 'check'],
      service: ['서비스', '프로세스', 'service', 'process', 'daemon'],
      log: ['로그', '기록', 'log', 'journal', 'history'],
      network: ['네트워크', '연결', 'network', 'connection', 'ping'],
      disk: ['디스크', '저장소', 'disk', 'storage', 'space'],
      system: ['시스템', '정보', 'system', 'info', 'hardware']
    };

    // 서버/서비스별 키워드 (specificCommands에 추가용)
    const serverKeywords = {
      // 웹 서버
      nginx: ['nginx', '엔진엑스'],
      apache: ['apache', 'httpd', '아파치'],
      // 앱 서버
      tomcat: ['tomcat', '톰캣', 'java'],
      nodejs: ['node', 'nodejs', 'pm2', '노드'],
      // DB 서버
      postgres: ['postgres', 'postgresql', '포스트그레스'],
      mysql: ['mysql'],
      // 기타
      windows: ['windows', 'smb', 'file', 'nas'],
      backup: ['backup', 'bacula', '백업']
    };

    let isCommandRequest = false;
    let requestType: CommandRequestContext['requestType'] = 'general';
    let confidence = 0;
    const detectedCategories: string[] = [];
    const specificCommands: string[] = [];

    // 패턴 매칭으로 명령어 요청 감지
    for (const pattern of commandPatterns) {
      if (pattern.test(lowerQuery)) {
        isCommandRequest = true;
        confidence += 0.3;
        
        if (lowerQuery.includes('어떻게') || lowerQuery.includes('how')) {
          requestType = 'command_usage';
        } else if (lowerQuery.includes('무슨') || lowerQuery.includes('어떤')) {
          requestType = 'command_inquiry';
        } else {
          requestType = 'command_request';
        }
        break;
      }
    }

    // NLP 엔티티에서 명령어 카테고리 감지
    if (nlpEntities) {
      for (const entity of nlpEntities) {
        if (entity.type === 'command') {
          isCommandRequest = true;
          confidence += 0.4;
          detectedCategories.push(entity.value);
          
          if (entity.value === 'command_request') {
            requestType = 'command_request';
            confidence += 0.2;
          }
        }
      }
    }

    // 카테고리별 키워드 매칭
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          detectedCategories.push(category);
          if (isCommandRequest) {
            confidence += 0.1;
          }
        }
      }
    }

    // 서버/서비스 키워드를 specificCommands에 추가
    for (const [server, keywords] of Object.entries(serverKeywords)) {
      for (const keyword of keywords) {
        if (lowerQuery.includes(keyword)) {
          specificCommands.push(server);
          if (!isCommandRequest) {
            isCommandRequest = true;
            requestType = 'command_inquiry';
          }
          confidence += 0.15;
        }
      }
    }

    // 특정 Linux/Unix 명령어 감지
    const commonCommands = [
      'top', 'htop', 'ps', 'free', 'df', 'iostat', 'vmstat', 'netstat', 'ss',
      'systemctl', 'service', 'tail', 'journalctl', 'ping', 'traceroute',
      'nslookup', 'dig', 'curl', 'wget', 'ifconfig', 'ip'
    ];

    for (const cmd of commonCommands) {
      if (lowerQuery.includes(cmd)) {
        specificCommands.push(cmd);
        if (!isCommandRequest) {
          isCommandRequest = true;
          requestType = 'command_inquiry';
        }
        confidence += 0.2;
      }
    }

    // 최종 confidence 조정 (0-1 범위)
    confidence = Math.min(confidence, 1.0);

    return {
      isCommandRequest,
      detectedCategories: [...new Set(detectedCategories)], // 중복 제거
      specificCommands: [...new Set(specificCommands)], // 중복 제거
      confidence,
      requestType
    };
  }

  /**
   * 💡 명령어 추천 생성
   */
  private async generateCommandRecommendations(
    context: CommandRequestContext
  ): Promise<CommandRecommendation[]> {
    const recommendations: CommandRecommendation[] = [];

    // 서버 ID 감지 또는 기본값 사용
    // TODO: 향후 context에서 serverId 받아오도록 개선
    const detectedServerId = this.detectServerFromContext(context);
    
    if (detectedServerId) {
      // serverCommandsConfig의 recommendCommands 함수 사용
      let scenario = 'general';
      
      // context 기반으로 시나리오 결정
      if (context.detectedCategories.includes('monitoring')) {
        if (context.specificCommands.some(cmd => 
          cmd.includes('cpu') || cmd.includes('top') || cmd.includes('htop')
        )) {
          scenario = 'cpu_high';
        } else if (context.specificCommands.some(cmd => 
          cmd.includes('memory') || cmd.includes('free') || cmd.includes('mem')
        )) {
          scenario = 'memory_leak';
        }
      } else if (context.detectedCategories.includes('disk')) {
        scenario = 'disk_full';
      } else if (context.detectedCategories.includes('service') || 
                 context.detectedCategories.includes('system')) {
        scenario = 'service_down';
      }

      // recommendCommands 함수로 서버별 맞춤 명령어 가져오기
      const osCommands = recommendCommands(
        detectedServerId, 
        scenario,
        context.detectedCategories[0]
      );

      // OSCommand를 CommandRecommendation 형식으로 변환
      for (const cmd of osCommands) {
        recommendations.push({
          command: cmd.command,
          description: cmd.description,
          category: cmd.category,
          confidence: context.confidence * 0.9, // 서버별 맞춤 명령어는 높은 신뢰도
          usage_example: cmd.usage || cmd.example || cmd.command,
          related_commands: cmd.alternatives
        });
      }
    }

    // 서버를 감지하지 못한 경우 일반적인 명령어 추천
    if (recommendations.length === 0) {
      // 모든 서버의 공통 명령어 수집
      const commonCommands = this.getCommonCommands(context);
      recommendations.push(...commonCommands);
    }

    // 특정 명령어가 언급된 경우 모든 서버에서 검색
    if (context.specificCommands.length > 0) {
      for (const cmd of context.specificCommands) {
        const foundCommands = this.searchCommandsAcrossServers(cmd);
        for (const found of foundCommands) {
          if (!recommendations.find(r => r.command === found.command)) {
            recommendations.push(found);
          }
        }
      }
    }

    // 신뢰도순으로 정렬하고 상위 5개만 반환
    return recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /**
   * 🔍 컨텍스트에서 서버 ID 감지
   */
  private detectServerFromContext(context: CommandRequestContext): string | null {
    // 서버 이름 패턴과 서버 ID 매핑
    const serverPatterns: Array<{ patterns: RegExp[], serverId: string }> = [
      { 
        patterns: [/nginx/i, /web.*1/i, /web.*prd.*01/i], 
        serverId: 'web-prd-01' 
      },
      { 
        patterns: [/apache/i, /httpd/i, /web.*2/i, /web.*prd.*02/i], 
        serverId: 'web-prd-02' 
      },
      { 
        patterns: [/tomcat/i, /java/i, /app.*1/i, /app.*prd.*01/i], 
        serverId: 'app-prd-01' 
      },
      { 
        patterns: [/node/i, /pm2/i, /app.*2/i, /app.*prd.*02/i], 
        serverId: 'app-prd-02' 
      },
      { 
        patterns: [/postgres/i, /postgresql/i, /db.*main/i, /db.*01/i], 
        serverId: 'db-main-01' 
      },
      { 
        patterns: [/replica/i, /db.*repl/i, /db.*02/i], 
        serverId: 'db-repl-01' 
      },
      { 
        patterns: [/windows/i, /smb/i, /file.*nas/i, /storage/i], 
        serverId: 'file-nas-01' 
      },
      { 
        patterns: [/backup/i, /bacula/i], 
        serverId: 'backup-01' 
      }
    ];

    // specificCommands에서 서버 힌트 찾기
    for (const { patterns, serverId } of serverPatterns) {
      for (const pattern of patterns) {
        if (context.specificCommands.some(cmd => pattern.test(cmd))) {
          console.log(`🎯 서버 감지: ${serverId}`);
          return serverId;
        }
      }
    }

    // 기본값: 첫 번째 웹 서버
    return null;
  }

  /**
   * 🌐 모든 서버의 공통 명령어 수집
   */
  private getCommonCommands(context: CommandRequestContext): CommandRecommendation[] {
    const commonCommands: CommandRecommendation[] = [];
    
    // 카테고리별 대표 명령어
    const categoryDefaults: Record<string, OSCommand[]> = {
      monitoring: [
        {
          command: 'top',
          description: '실시간 프로세스 및 시스템 리소스 모니터링',
          category: 'monitoring',
          riskLevel: 'safe',
          usage: 'top [-b] [-n count]',
          example: 'top -b -n 1'
        },
        {
          command: 'htop',
          description: '향상된 대화형 프로세스 뷰어',
          category: 'monitoring',
          riskLevel: 'safe'
        }
      ],
      disk: [
        {
          command: 'df -h',
          description: '디스크 사용량 확인 (사람이 읽기 쉬운 형식)',
          category: 'disk',
          riskLevel: 'safe'
        }
      ],
      network: [
        {
          command: 'netstat -tuln',
          description: '열린 네트워크 포트 확인',
          category: 'network',
          riskLevel: 'safe'
        }
      ],
      system: [
        {
          command: 'systemctl status',
          description: '서비스 상태 확인',
          category: 'system',
          riskLevel: 'safe',
          example: 'systemctl status nginx'
        }
      ]
    };

    // 감지된 카테고리에 따라 명령어 추가
    for (const category of context.detectedCategories) {
      if (categoryDefaults[category]) {
        for (const cmd of categoryDefaults[category]) {
          commonCommands.push({
            command: cmd.command,
            description: cmd.description,
            category: cmd.category,
            confidence: context.confidence * 0.7, // 일반 명령어는 낮은 신뢰도
            usage_example: cmd.usage || cmd.example || cmd.command,
            related_commands: cmd.alternatives
          });
        }
      }
    }

    return commonCommands;
  }

  /**
   * 🔎 모든 서버에서 특정 명령어 검색
   */
  private searchCommandsAcrossServers(searchTerm: string): CommandRecommendation[] {
    const foundCommands: CommandRecommendation[] = [];
    const searchLower = searchTerm.toLowerCase();

    // 모든 서버의 명령어 검색
    for (const [serverId, serverConfig] of Object.entries(serverCommandsMap)) {
      const allCommands = [
        ...serverConfig.commands.basic,
        ...serverConfig.commands.advanced,
        ...serverConfig.commands.troubleshooting
      ];

      for (const cmd of allCommands) {
        if (cmd.command.toLowerCase().includes(searchLower) ||
            cmd.description.toLowerCase().includes(searchLower)) {
          
          // 중복 방지
          const exists = foundCommands.find(f => 
            f.command === cmd.command && f.description === cmd.description
          );
          
          if (!exists) {
            foundCommands.push({
              command: cmd.command,
              description: `${cmd.description} (${serverConfig.os})`,
              category: cmd.category,
              confidence: 0.8,
              usage_example: cmd.usage || cmd.example || cmd.command,
              related_commands: cmd.alternatives
            });
          }
        }
      }
    }

    return foundCommands;
  }

  /**
   * 📝 명령어 추천 응답 포맷팅
   */
  private formatCommandRecommendations(
    recommendations: CommandRecommendation[],
    context: CommandRequestContext,
    originalQuery: string
  ): string {
    if (recommendations.length === 0) {
      return `"${originalQuery}"에 대한 명령어를 찾지 못했습니다. 더 구체적인 요청을 해주세요.`;
    }

    let response = '';
    
    // 요청 유형에 따른 인사말
    switch (context.requestType) {
      case 'command_request':
        response += `요청하신 작업에 적합한 명령어들을 추천드립니다:\n\n`;
        break;
      case 'command_inquiry':
        response += `문의하신 명령어에 대한 정보입니다:\n\n`;
        break;  
      case 'command_usage':
        response += `사용 방법과 함께 관련 명령어들을 안내드립니다:\n\n`;
        break;
      default:
        response += `관련 명령어 추천:\n\n`;
    }

    // 각 명령어 정보 포맷팅
    recommendations.forEach((rec, index) => {
      response += `${index + 1}. **${rec.command}**\n`;
      response += `   📝 ${rec.description}\n`;
      response += `   💡 사용 예시: \`${rec.usage_example}\`\n`;
      
      if (rec.related_commands && rec.related_commands.length > 0) {
        response += `   🔗 관련 명령어: ${rec.related_commands.join(', ')}\n`;
      }
      
      response += `   📊 카테고리: ${rec.category} (신뢰도: ${Math.round(rec.confidence * 100)}%)\n\n`;
    });

    // 추가 도움말
    if (context.confidence > 0.7) {
      response += `💡 **도움말**: 위 명령어들은 "${originalQuery}" 요청에 기반해 추천되었습니다.\n`;
      response += `더 자세한 사용법이나 옵션이 필요하시면 \`man [명령어]\` 또는 \`[명령어] --help\`를 사용해보세요.`;
    } else {
      response += `💡 **참고**: 요청이 명확하지 않아 일반적인 명령어들을 추천드렸습니다.\n`;
      response += `더 구체적인 작업이나 상황을 알려주시면 더 정확한 명령어를 추천해드릴 수 있습니다.`;
    }

    return response;
  }

  /**
   * 🔄 다른 엔진으로 재시도
   */
  private async retryWithDifferentEngine(
    failedEngine: string,
    request: QueryRequest,
    processingPath: string[]
  ): Promise<QueryResponse | null> {
    const availableEngines = this.config.fallbackChain.filter(
      engine => engine !== failedEngine
    );

    for (const engine of availableEngines) {
      try {
        processingPath.push(`retry_with_${engine}`);
        const response = await this.executeEngine(engine, request);

        // 응답 필터링 다시 확인
        const filterResult = filterAIResponse(response.response);
        if (filterResult.riskLevel !== 'blocked') {
          return response;
        }
      } catch (error) {
        console.warn(`재시도 실패 - ${engine}:`, error);
        continue;
      }
    }

    return null;
  }

  /**
   * 💰 토큰 사용량 확인
   */
  private checkTokenLimits(userId: string): {
    allowed: boolean;
    reason?: string;
  } {
    // 일일 전체 한도 확인
    if (this.metrics.tokenUsage.daily >= this.config.dailyTokenLimit) {
      return { allowed: false, reason: 'daily_limit_exceeded' };
    }

    // 사용자별 한도 확인
    const userUsage = this.metrics.tokenUsage.byUser.get(userId) || 0;
    if (userUsage >= this.config.userTokenLimit) {
      return { allowed: false, reason: 'user_limit_exceeded' };
    }

    return { allowed: true };
  }

  /**
   * 📊 토큰 사용량 기록
   */
  private recordTokenUsage(userId: string, tokens: number): void {
    this.metrics.tokenUsage.daily += tokens;
    this.metrics.tokenUsage.total += tokens;

    const currentUserUsage = this.metrics.tokenUsage.byUser.get(userId) || 0;
    this.metrics.tokenUsage.byUser.set(userId, currentUserUsage + tokens);
  }

  /**
   * 🔌 Circuit Breaker 확인
   */
  private isCircuitOpen(engine: string): boolean {
    const breaker = this.circuitBreakers.get(engine);
    if (!breaker) return false;

    // Circuit이 열린 상태일 때
    if (breaker.state === 'open') {
      // 타임아웃이 지났으면 half-open으로 전환
      if (Date.now() - breaker.lastFailure > breaker.timeout) {
        breaker.state = 'half-open';
        console.log(`🔌 Circuit breaker ${engine} transitioned to half-open`);
        return false; // half-open은 요청을 시도해볼 수 있음
      }
      return true; // 아직 타임아웃 전이므로 열린 상태
    }

    // half-open 상태는 요청을 시도할 수 있음
    if (breaker.state === 'half-open') {
      return false;
    }

    // closed 상태는 정상
    return false;
  }

  /**
   * 🔄 폴백 엔진 선택
   */
  private getFallbackEngine(failedEngine: string): string | null {
    const fallbackIndex = this.config.fallbackChain.indexOf(failedEngine);
    if (
      fallbackIndex >= 0 &&
      fallbackIndex < this.config.fallbackChain.length - 1
    ) {
      return this.config.fallbackChain[fallbackIndex + 1];
    }
    
    // 실패한 엔진이 fallbackChain에 없으면 첫 번째 엔진부터 시작
    if (fallbackIndex === -1 && this.config.fallbackChain.length > 0) {
      // 실패한 엔진이 fallbackChain의 첫 번째가 아니라면 첫 번째 반환
      if (this.config.fallbackChain[0] !== failedEngine) {
        return this.config.fallbackChain[0];
      }
      // 첫 번째도 실패했다면 두 번째 반환
      if (this.config.fallbackChain.length > 1) {
        return this.config.fallbackChain[1];
      }
    }
    
    return null;
  }

  /**
   * 📊 메트릭 업데이트
   */
  private updateMetrics(
    engine: string,
    startTime: number,
    success: boolean
  ): void {
    const responseTime = Date.now() - startTime;

    // 평균 응답 시간 계산 (totalRequests가 0이면 첫 번째 요청)
    const totalRequests = this.metrics.totalRequests;
    if (totalRequests === 1) {
      this.metrics.averageResponseTime = responseTime;
    } else {
      this.metrics.averageResponseTime =
        (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) /
        totalRequests;
    }

    // 엔진별 사용량 추적
    switch (engine) {
      case 'google-ai':
        this.metrics.engineUsage.googleAI++;
        break;
      case 'local-rag':
        this.metrics.engineUsage.localRAG++;
        break;
      case 'korean-nlp':
        this.metrics.engineUsage.koreanNLP++;
        break;
      default:
        this.metrics.engineUsage.fallback++;
        break;
    }
  }

  /**
   * ❌ 실패 기록
   */
  public recordFailure(engine: string): void {
    let breaker = this.circuitBreakers.get(engine);
    if (!breaker) {
      breaker = {
        failures: 0,
        lastFailure: 0,
        state: 'closed',
        threshold: 5,
        timeout: 60000, // 1분
      };
      this.circuitBreakers.set(engine, breaker);
    }

    breaker.failures++;
    breaker.lastFailure = Date.now();

    if (breaker.failures >= breaker.threshold) {
      breaker.state = 'open';
      console.warn(`🔌 Circuit breaker opened for engine: ${engine}`);
    }
  }

  // 응답 생성 헬퍼 메서드들
  private createSecurityBlockedResponse(
    securityResult: SanitizationResult,
    processingPath: string[]
  ): RouteResult {
    return {
      success: false,
      response: '보안상 처리할 수 없는 요청입니다.',
      engine: 'fallback' as const, // 보안 필터는 fallback으로 분류
      confidence: 0,
      thinkingSteps: [
        {
          step: '보안 검사',
          description: `위험 요소 탐지: ${securityResult.threatsDetected.join(', ')}`,
          status: 'failed' as const, // 차단된 요청은 failed로 처리
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'security-filter',
        fallbackUsed: false,
        securityApplied: true,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  private createTokenLimitResponse(
    reason: string,
    processingPath: string[]
  ): RouteResult {
    const message =
      reason === 'daily_limit_exceeded'
        ? '일일 사용 한도를 초과했습니다.'
        : '개인 사용 한도를 초과했습니다.';

    return {
      success: false,
      response: message,
      engine: 'fallback' as const, // 속도 제한은 fallback으로 분류
      confidence: 0,
      thinkingSteps: [
        {
          step: '사용량 확인',
          description: reason,
          status: 'failed' as const, // 차단된 요청은 failed로 처리
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'rate-limiter',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  private createCircuitOpenResponse(processingPath: string[]): RouteResult {
    return {
      success: false,
      response:
        '시스템이 일시적으로 제한된 모드로 동작 중입니다. 잠시 후 다시 시도해 주세요.',
      engine: 'fallback' as const, // 회로 차단은 fallback으로 분류
      confidence: 0,
      thinkingSteps: [
        {
          step: 'Circuit Breaker',
          description: '모든 엔진이 차단된 상태',
          status: 'failed' as const, // 차단된 요청은 failed로 처리
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'circuit-breaker',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  private createErrorResponse(
    error: Error | unknown,
    processingPath: string[]
  ): RouteResult {
    return {
      success: false,
      response: '요청을 처리하는 중 오류가 발생했습니다.',
      engine: 'fallback' as const, // 에러 핸들러는 fallback으로 분류
      confidence: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      thinkingSteps: [
        {
          step: '오류 처리',
          description:
            error instanceof Error ? error.message : '알 수 없는 오류',
          status: 'failed',
          timestamp: Date.now(),
        },
      ],
      processingTime: 0,
      routingInfo: {
        selectedEngine: 'error-handler',
        fallbackUsed: false,
        securityApplied: false,
        tokensCounted: false,
        processingPath,
      },
    };
  }

  private async retryWithFallback(
    request: QueryRequest,
    processingPath: string[]
  ): Promise<RouteResult> {
    try {
      processingPath.push('fallback_attempt');
      const response = await this.simplifiedEngine.query({
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
   * 📊 통계 조회
   */
  public getMetrics(): RouterMetrics {
    return { ...this.metrics };
  }

  /**
   * ⚙️ 설정 업데이트
   */
  public updateConfig(newConfig: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 💾 캐시 키 생성
   */
  private generateCacheKey(request: QueryRequest & { userId?: string }): string {
    const keyParts = [
      request.query,
      request.mode || 'auto',
      JSON.stringify(request.context || {}),
      request.userId || 'anonymous'
    ];
    return Buffer.from(keyParts.join('|')).toString('base64');
  }

  /**
   * 💾 캐시된 응답 조회
   */
  private getCachedResponse(cacheKey: string): QueryResponse | null {
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
   */
  private setCachedResponse(cacheKey: string, response: QueryResponse, ttl: number = 300000): void {
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
   * 🧹 일일 초기화 (토큰 사용량 리셋)
   */
  public resetDailyLimits(): void {
    this.metrics.tokenUsage.daily = 0;
    this.metrics.tokenUsage.byUser.clear();
    console.log('🔄 일일 토큰 사용량 리셋');
  }

  /**
   * 🔥 Circuit Breaker 리셋
   */
  public resetCircuitBreakers(): void {
    this.circuitBreakers.clear();
    console.log('🔌 Circuit Breaker 상태 리셋');
  }

  /**
   * 💾 캐시 초기화
   */
  public clearCache(): void {
    this.cache.clear();
    console.log('🗑️ 캐시 초기화 완료');
  }

  /**
   * 🤖 명령어 추천 시스템 (공개 메서드)
   * 외부에서 직접 명령어 추천을 요청할 수 있는 메서드
   */
  public async getCommandRecommendations(
    query: string,
    options?: {
      includeAnalysis?: boolean;
      maxRecommendations?: number;
    }
  ): Promise<{
    recommendations: CommandRecommendation[];
    analysis: CommandRequestContext;
    formattedResponse: string;
  }> {
    const { includeAnalysis = true, maxRecommendations = 5 } = options || {};

    // 1. 명령어 요청 분석
    const analysis = this.analyzeCommandRequest(query);
    
    console.log('🔍 명령어 분석 결과:', {
      query,
      isCommandRequest: analysis.isCommandRequest,
      detectedCategories: analysis.detectedCategories,
      specificCommands: analysis.specificCommands,
      confidence: analysis.confidence,
      requestType: analysis.requestType
    });

    // 2. 명령어 추천 생성
    let recommendations = await this.generateCommandRecommendations(analysis);

    // 3. 최대 개수 제한 적용
    if (maxRecommendations && recommendations.length > maxRecommendations) {
      recommendations = recommendations.slice(0, maxRecommendations);
    }

    // 4. 포맷된 응답 생성
    const formattedResponse = this.formatCommandRecommendations(
      recommendations,
      analysis,
      query
    );

    return {
      recommendations,
      analysis,
      formattedResponse
    };
  }

  /**
   * 🔍 명령어 카테고리 분석 (공개 메서드)
   * 쿼리가 명령어 요청인지 간단히 확인할 수 있는 메서드
   */
  public isCommandRequest(query: string): {
    isCommand: boolean;
    confidence: number;
    categories: string[];
    type: CommandRequestContext['requestType'];
  } {
    const analysis = this.analyzeCommandRequest(query);
    
    return {
      isCommand: analysis.isCommandRequest,
      confidence: analysis.confidence,
      categories: analysis.detectedCategories,
      type: analysis.requestType
    };
  }
}

// 편의를 위한 유틸리티 함수
export function getUnifiedAIRouter(
  config?: Partial<RouterConfig>
): UnifiedAIEngineRouter {
  return UnifiedAIEngineRouter.getInstance(config);
}

export async function routeAIQuery(
  request: QueryRequest & { userId?: string },
  config?: Partial<RouterConfig>
): Promise<RouteResult> {
  const router = getUnifiedAIRouter(config);
  return await router.route(request);
}
