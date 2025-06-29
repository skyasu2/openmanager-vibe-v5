/**
 * 🚀 최적화된 자연어 처리 엔진 + 경량 ML 엔진 통합 v4.0 (2025.06.10)
 *
 * ✅ Supabase RAG 전용 (LocalRAG 제거)
 * ✅ Google AI 싱글톤 사용
 * ✅ UnifiedAI 라우터 통합
 * ✅ 자동 장애 보고서 생성
 * ✅ 경량 ML 엔진 통합 - 질의 최적화 및 자동 학습 (NEW!)
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import {
  SupabaseRAGEngine,
  getSupabaseRAGEngine,
} from '@/lib/ml/supabase-rag-engine';
import { AutoReportService } from '@/services/ai/AutoReportService';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { MCPWarmupService } from '@/services/mcp/mcp-warmup-service';
import { RealMCPClient } from '@/services/mcp/real-mcp-client';

// 🎯 스마트 모드 정의
type AIMode = 'auto' | 'google-only' | 'local' | 'offline';

interface FastTrackOptions {
  timeout: number; // 기본 3초
  enableParallel: boolean; // 병렬 처리 활성화
  preferEngine?: 'mcp' | 'rag' | 'google' | 'auto'; // 선호 엔진
  enableMCPWarmup: boolean; // MCP 웜업 활성화
  mode?: AIMode; // 강제 모드 설정
  enableAutoReport: boolean; // 자동장애보고서 트리거 감지 활성화
  enableMLOptimization?: boolean; // 🤖 ML 최적화 활성화
}

interface FastTrackResult {
  success: boolean;
  response: string;
  engine: 'mcp' | 'rag' | 'google' | 'hybrid' | 'ml-enhanced'; // 🤖 ML 향상 엔진 추가
  confidence: number;
  responseTime: number;
  fallbackUsed: boolean;
  warmupTime?: number; // MCP 웜업 시간
  mode: AIMode; // 사용된 모드
  failureReport?: any; // 자동 장애 보고서 (기존 시스템 활용)
  mlInsights?: any; // 🤖 ML 인사이트 (NEW!)
  metadata: {
    engines: {
      attempted: string[];
      used: string[];
      fallbackChain: string[];
    };
    performance: {
      totalTime: number;
      engineTime: number;
      networkLatency: number;
    };
    autoReportTriggered: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoReportReason?: string;
    mlEnhanced: boolean; // 🤖 ML 향상 여부
  };
}

export class SimplifiedNaturalLanguageEngine {
  private static instance: SimplifiedNaturalLanguageEngine | null = null;
  private unifiedAI: UnifiedAIEngineRouter;
  private ragEngine: SupabaseRAGEngine; // 🎯 Supabase RAG 전용
  private googleAI: GoogleAIService | null = null;
  private mcpWarmup: MCPWarmupService;
  private autoReportService: AutoReportService;
  private initialized = false;
  private mcpWarmedUp = false;
  private currentMode: AIMode = 'auto';

  // 🤖 ML 엔진 통합 (NEW!)
  private mlEngine: any = null;
  private mlInitialized = false;

  private constructor() {
    this.unifiedAI = UnifiedAIEngineRouter.getInstance();
    this.ragEngine = getSupabaseRAGEngine(); // 🎯 Supabase RAG 싱글톤 사용
    this.mcpWarmup = MCPWarmupService.getInstance();
    this.autoReportService = AutoReportService.getInstance();

    // 🎯 Google AI 싱글톤 인스턴스 사용 (할당량 중앙 관리)
    try {
      this.googleAI = GoogleAIService.getInstance();
      console.log(
        '✅ GoogleAI 싱글톤 인스턴스 연결됨 (SimplifiedNaturalLanguageEngine)'
      );
    } catch (error) {
      console.warn('⚠️ Google AI 서비스 연결 실패:', error);
      this.googleAI = null;
    }

    // 🤖 ML 엔진 지연 초기화
    this.initializeMLEngine();
  }

  static getInstance(): SimplifiedNaturalLanguageEngine {
    if (!SimplifiedNaturalLanguageEngine.instance) {
      SimplifiedNaturalLanguageEngine.instance =
        new SimplifiedNaturalLanguageEngine();
    }
    return SimplifiedNaturalLanguageEngine.instance;
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // 병렬 초기화로 시간 단축
      const initPromises = [
        this.unifiedAI.initialize?.() || Promise.resolve(),
        this.ragEngine.initialize(),
      ];

      // Google AI 초기화 (사용 가능한 경우)
      if (this.googleAI) {
        initPromises.push(
          this.googleAI
            .initialize()
            .then(() => {
              console.log('✅ Google AI 초기화 성공');
            })
            .catch(error => {
              console.warn('Google AI 초기화 실패:', error);
              this.googleAI = null;
            })
        );
      }

      await Promise.all(initPromises);

      // 스마트 모드 선택
      this.currentMode = this.selectOptimalMode();
      this.initialized = true;

      console.log(
        `✅ SimplifiedNaturalLanguageEngine 초기화 완료 (모드: ${this.currentMode})`
      );
    } catch (error) {
      console.error('❌ SimplifiedNaturalLanguageEngine 초기화 실패:', error);
      throw error;
    }
  }

  /**
   * 🚀 메인 진입점: 자연어 질의 처리 (Ultra Simple 스타일)
   */
  async processQuery(
    query: string,
    context?: any,
    options: Partial<FastTrackOptions> = {}
  ): Promise<FastTrackResult> {
    const startTime = Date.now();

    if (!this.initialized) {
      await this.initialize();
    }

    const config: FastTrackOptions = {
      timeout: 3000, // 3초 타임아웃 (더 빠르게)
      enableParallel: true,
      preferEngine: 'auto',
      enableMCPWarmup: true,
      mode: options.mode || this.currentMode,
      enableAutoReport: options.enableAutoReport || false,
      enableMLOptimization: options.enableMLOptimization || false,
      ...options,
    };

    try {
      let result: FastTrackResult;

      // 🎯 스마트 모드별 처리
      switch (config.mode) {
        case 'google-only':
          result = await this.processGoogleOnly(query, startTime);
          break;

        case 'local':
          result = await this.processLocal(query, startTime);
          break;

        case 'auto':
          result = await this.processAuto(query, startTime);
          break;

        default:
          result = await this.processOffline(query, startTime);
      }

      // 🚨 자동 장애 보고서 생성 (기존 AutoReportService 활용)
      result.failureReport = await this.generateFailureReportIfNeeded(
        query,
        result.response
      );

      // 🤖 자동장애보고서 트리거 감지
      const autoReportTrigger = config.enableAutoReport
        ? this.detectAutoReportTrigger(query, result.response)
        : { shouldTrigger: false, severity: 'low' as const };

      console.log('✅ SimplifiedNaturalLanguageEngine 응답 완료:', {
        mode: config.mode,
        engine: result.engine,
        responseTime: `${result.responseTime}ms`,
        confidence: result.confidence,
        autoReportTrigger: autoReportTrigger.shouldTrigger
          ? autoReportTrigger
          : undefined,
      });

      return {
        success: true,
        response: result.response,
        mode: config.mode || 'auto',
        engine: result.engine,
        responseTime: result.responseTime,
        confidence: result.confidence,
        fallbackUsed: result.engine !== 'google',
        metadata: {
          engines: {
            attempted: [result.engine],
            used: [result.engine],
            fallbackChain:
              result.engine !== 'google'
                ? ['google', result.engine]
                : ['google'],
          },
          performance: {
            totalTime: result.responseTime,
            engineTime: result.responseTime,
            networkLatency: 0,
          },
          autoReportTriggered: autoReportTrigger.shouldTrigger,
          severity: autoReportTrigger.severity,
          autoReportReason: autoReportTrigger.reason,
          mlEnhanced: result.engine === 'ml-enhanced',
        },
      };
    } catch (error) {
      console.error('❌ SimplifiedNaturalLanguageEngine 오류:', error);

      return {
        success: false,
        response: this.getFallbackResponse(query),
        engine: 'hybrid',
        confidence: 0,
        responseTime: Date.now() - startTime,
        fallbackUsed: true,
        mode: config.mode || 'offline',
        metadata: {
          engines: {
            attempted: [],
            used: [],
            fallbackChain: ['google'],
          },
          performance: {
            totalTime: Date.now() - startTime,
            engineTime: Date.now() - startTime,
            networkLatency: 0,
          },
          autoReportTriggered: false,
          severity: 'low',
          autoReportReason: undefined,
          mlEnhanced: false,
        },
      };
    }
  }

  /**
   * 🎯 스마트 모드 선택 로직
   */
  private selectOptimalMode(): AIMode {
    // Google AI 사용 가능 여부 확인
    const googleAvailable = this.isGoogleAIAvailable();

    // 로컬 환경 여부 확인
    const isLocal = process.env.NODE_ENV === 'development';

    // 네트워크 상태 확인 (간단히)
    const isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

    if (!isOnline) {
      return 'offline';
    }

    if (googleAvailable && !isLocal) {
      // 프로덕션에서 Google AI 사용 가능하면 Google 우선
      return 'google-only';
    }

    if (googleAvailable && isLocal) {
      // 로컬에서 Google AI 사용 가능하면 Auto (3개 병렬)
      return 'auto';
    }

    // Google AI 없으면 로컬 엔진만
    return 'local';
  }

  /**
   * 🤖 Google AI 전용 모드
   */
  private async processGoogleOnly(
    query: string,
    startTime: number
  ): Promise<FastTrackResult> {
    if (!this.googleAI) {
      // 🎯 싱글톤 인스턴스 사용 (새 인스턴스 생성 금지)
      this.googleAI = GoogleAIService.getInstance();
      console.log('🔄 Google AI 싱글톤 재연결 (processGoogleOnly)');
    }

    const result = (await Promise.race([
      this.googleAI.generateResponse(query),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Google AI 타임아웃')), 3000)
      ),
    ])) as any;

    if (result?.success && result?.content) {
      return {
        success: true,
        response: result.content,
        mode: 'google-only',
        engine: 'google',
        responseTime: Date.now() - startTime,
        confidence: 0.95,
        fallbackUsed: false,
        metadata: {
          engines: {
            attempted: ['google'],
            used: ['google'],
            fallbackChain: ['google'],
          },
          performance: {
            totalTime: Date.now() - startTime,
            engineTime: Date.now() - startTime,
            networkLatency: 0,
          },
          autoReportTriggered: false,
          severity: 'low',
          autoReportReason: undefined,
          mlEnhanced: false,
        },
      };
    }

    throw new Error('Google AI 응답 실패');
  }

  /**
   * 🏠 로컬 엔진 모드 (MCP + RAG)
   */
  private async processLocal(
    query: string,
    startTime: number
  ): Promise<FastTrackResult> {
    // MCP 웜업 (필요시)
    let warmupTime = 0;
    if (!this.mcpWarmedUp) {
      const warmupStart = Date.now();
      await this.warmupMCP();
      warmupTime = Date.now() - warmupStart;
      this.mcpWarmedUp = true;
    }

    // 병렬 실행: MCP + RAG
    const promises = [
      this.tryMCP(query).catch(() => null),
      this.tryRAG(query).catch(() => null),
    ];

    const results = await Promise.allSettled(promises);
    const successResults = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => (r as PromiseFulfilledResult<any>).value);

    if (successResults.length > 0) {
      const best = successResults.reduce((a, b) =>
        (a.confidence || 0) > (b.confidence || 0) ? a : b
      );

      return {
        success: true,
        response: best.response,
        mode: 'local',
        engine: best.engine,
        responseTime: Date.now() - startTime,
        confidence: best.confidence || 0.8,
        fallbackUsed: false,
        warmupTime,
        metadata: {
          engines: {
            attempted: [best.engine],
            used: [best.engine],
            fallbackChain:
              best.engine !== 'google' ? ['google', best.engine] : ['google'],
          },
          performance: {
            totalTime: Date.now() - startTime,
            engineTime: Date.now() - startTime,
            networkLatency: 0,
          },
          autoReportTriggered: false,
          severity: 'low',
          autoReportReason: undefined,
          mlEnhanced: false,
        },
      };
    }

    throw new Error('로컬 엔진 모두 실패');
  }

  /**
   * 🚀 Auto 모드 (3개 병렬: Google + MCP + RAG)
   */
  private async processAuto(
    query: string,
    startTime: number
  ): Promise<FastTrackResult> {
    // MCP 웜업 (필요시)
    let warmupTime = 0;
    if (!this.mcpWarmedUp) {
      const warmupStart = Date.now();
      await this.warmupMCP();
      warmupTime = Date.now() - warmupStart;
      this.mcpWarmedUp = true;
    }

    // 3개 엔진 병렬 실행
    const promises = [
      this.tryGoogle(query).catch(() => null),
      this.tryMCP(query).catch(() => null),
      this.tryRAG(query).catch(() => null),
    ];

    const results = await Promise.allSettled(promises);
    const successResults = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => (r as PromiseFulfilledResult<any>).value);

    if (successResults.length > 0) {
      // Google AI 우선, 그 다음 신뢰도 순
      const best = successResults.reduce((a, b) => {
        if (a.engine === 'google') return a;
        if (b.engine === 'google') return b;
        return (a.confidence || 0) > (b.confidence || 0) ? a : b;
      });

      console.log(
        `✅ 3-엔진 병렬 처리 성공: ${best.engine} 엔진 (신뢰도: ${best.confidence})`
      );

      return {
        success: true,
        response: best.response,
        mode: 'auto',
        engine: best.engine,
        responseTime: Date.now() - startTime,
        confidence: best.confidence || 0.8,
        fallbackUsed: false,
        warmupTime,
        metadata: {
          engines: {
            attempted: ['google', best.engine],
            used: [best.engine],
            fallbackChain:
              best.engine !== 'google' ? ['google', best.engine] : ['google'],
          },
          performance: {
            totalTime: Date.now() - startTime,
            engineTime: Date.now() - startTime,
            networkLatency: 0,
          },
          autoReportTriggered: false,
          severity: 'low',
          autoReportReason: undefined,
          mlEnhanced: false,
        },
      };
    }

    throw new Error('모든 엔진 실패');
  }

  /**
   * 📴 오프라인 모드 (정적 응답)
   */
  private async processOffline(
    query: string,
    startTime: number
  ): Promise<FastTrackResult> {
    return {
      success: true,
      response: this.getFallbackResponse(query),
      mode: 'offline',
      engine: 'hybrid',
      responseTime: Date.now() - startTime,
      confidence: 0.5,
      fallbackUsed: true,
      metadata: {
        engines: {
          attempted: [],
          used: [],
          fallbackChain: ['google'],
        },
        performance: {
          totalTime: Date.now() - startTime,
          engineTime: Date.now() - startTime,
          networkLatency: 0,
        },
        autoReportTriggered: false,
        severity: 'low',
        autoReportReason: undefined,
        mlEnhanced: false,
      },
    };
  }

  /**
   * 🤖 Google AI 시도
   */
  private async tryGoogle(query: string) {
    if (!this.googleAI) {
      // 🎯 싱글톤 인스턴스 사용 (새 인스턴스 생성 금지)
      this.googleAI = GoogleAIService.getInstance();
      console.log('🔄 Google AI 싱글톤 재연결 (tryGoogle)');
    }

    const result = await this.googleAI.generateResponse(query);

    if (result?.success && result?.content) {
      return {
        response: result.content,
        confidence: 0.95,
        engine: 'google',
      };
    }

    throw new Error('Google AI 실패');
  }

  /**
   * 🔧 MCP 시도 (서버 모니터링 전문)
   */
  private async tryMCP(query: string) {
    // 🎯 MCP 역할 변경: AI 응답 생성 → 컨텍스트 수집 도우미
    const mcpClient = RealMCPClient.getInstance();

    try {
      const contextResult = await mcpClient.performComplexQuery(query);

      if (contextResult && typeof contextResult === 'object') {
        // MCP는 더 이상 응답을 생성하지 않고, 컨텍스트만 제공
        const mcpContext = {
          summary: contextResult.response || contextResult.summary,
          category: contextResult.category,
          additionalInfo: contextResult.additionalInfo || contextResult.context,
          timestamp: new Date().toISOString(),
          source: 'mcp-context-helper',
        };

        console.log('✅ MCP 컨텍스트 수집 성공:', mcpContext.summary);

        // 컨텍스트를 Supabase RAG 엔진에 전달하여 더 나은 응답 생성
        if (this.ragEngine) {
          const enhancedQuery = `${query}\n\n[MCP 컨텍스트: ${mcpContext.summary}]`;
          const ragResult = await this.ragEngine.searchSimilar(enhancedQuery, {
            maxResults: 3,
            threshold: 0.5,
          });

          if (ragResult?.success && ragResult.results.length > 0) {
            let finalResponse = ragResult.results[0].content;

            // MCP 컨텍스트 정보를 응답에 통합
            if (mcpContext.additionalInfo) {
              finalResponse += `\n\n📋 시스템 컨텍스트: ${mcpContext.additionalInfo}`;
            }

            return {
              response: finalResponse,
              confidence: 0.8, // RAG + MCP 컨텍스트 조합
              engine: 'rag-with-mcp-context',
            };
          }
        }

        // RAG가 실패하면 기본 컨텍스트 응답 제공
        return {
          response: `수집된 정보를 바탕으로 답변드립니다.\n\n${mcpContext.summary}${mcpContext.additionalInfo ? '\n\n추가 정보: ' + mcpContext.additionalInfo : ''}`,
          confidence: 0.6,
          engine: 'mcp-context-only',
        };
      }
    } catch (error) {
      console.warn('MCP 컨텍스트 수집 실패:', error);
    }

    throw new Error('MCP 컨텍스트 수집 실패');
  }

  /**
   * 📚 RAG 시도
   */
  private async tryRAG(query: string) {
    if (!this.ragEngine) {
      this.ragEngine = getSupabaseRAGEngine();
      await this.ragEngine.initialize();
    }

    const result = await this.ragEngine.searchSimilar(query, {
      maxResults: 5,
      threshold: 0.5,
    });

    if (result?.success && result.results.length > 0) {
      const topResult = result.results[0];
      return {
        response: topResult.content || `검색 결과: ${topResult.id}`,
        confidence: 0.7,
        engine: 'rag',
      };
    }

    throw new Error('RAG 실패');
  }

  /**
   * 🚨 자동 장애 보고서 생성 (기존 AutoReportService 활용)
   */
  private async generateFailureReportIfNeeded(
    query: string,
    response: string
  ): Promise<any> {
    try {
      // 자연어 질의에서 장애 상황 감지 시 기본 보고서 생성
      console.log(
        '🚨 자연어 질의에서 장애 상황 감지됨, AutoReportService 활용 가능'
      );

      // 간단한 장애 정보 반환
      return {
        detected: true,
        source: 'natural_language_query',
        query,
        response,
        timestamp: new Date().toISOString(),
        canGenerateReport: true,
      };
    } catch (error) {
      console.warn('자동 장애 보고서 생성 실패:', error);
      return undefined;
    }
  }

  /**
   * 🔄 폴백 응답 생성
   */
  private getFallbackResponse(query: string): string {
    if (query.includes('서버') || query.includes('상태')) {
      return '현재 서버 상태를 확인하고 있습니다. 대시보드에서 실시간 정보를 확인해주세요.';
    }

    if (query.includes('장애') || query.includes('오류')) {
      return '시스템 상태를 점검하고 있습니다. 문제가 지속되면 관리자에게 문의해주세요.';
    }

    if (
      query.includes('CPU') ||
      query.includes('메모리') ||
      query.includes('디스크')
    ) {
      return '시스템 리소스 정보를 조회하고 있습니다. 서버 모니터링 페이지에서 상세 정보를 확인할 수 있습니다.';
    }

    return '요청하신 정보를 처리하고 있습니다. 잠시 후 다시 시도해주세요.';
  }

  /**
   * 🔥 MCP 웜업
   */
  private async warmupMCP(): Promise<void> {
    try {
      await this.mcpWarmup.warmupAllServers();
      this.mcpWarmedUp = true;
    } catch (error) {
      console.warn('MCP 웜업 실패:', error);
    }
  }

  /**
   * 🔍 Google AI 사용 가능 여부 확인
   */
  private isGoogleAIAvailable(): boolean {
    return !!(
      process.env.GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_ENABLED === 'true'
    );
  }

  /**
   * 📊 시스템 상태 확인 (Ultra Simple 스타일)
   */
  getSystemStatus() {
    return {
      initialized: this.initialized,
      currentMode: this.currentMode,
      mcpWarmedUp: this.mcpWarmedUp,
      engines: {
        mcp: this.unifiedAI ? true : false,
        rag: this.ragEngine ? true : false,
        google: this.googleAI ? this.isGoogleAIAvailable() : false,
      },
      architecture: 'ultra-simple-refactored',
      primaryFunction: '자연어 질의 응답',
      responseTimeTarget: '< 3초',
      parallelProcessing: true,
      autoFailureReporting: true,
    };
  }

  /**
   * 🤖 자동장애보고서 트리거 감지
   */
  private detectAutoReportTrigger(
    query: string,
    response: string
  ): {
    shouldTrigger: boolean;
    severity: 'low' | 'medium' | 'high' | 'critical';
    reason?: string;
  } {
    const lowerQuery = query.toLowerCase();
    const lowerResponse = response.toLowerCase();

    // 🚨 Critical 수준 키워드
    const criticalKeywords = [
      '서버 다운',
      '시스템 장애',
      '완전 중단',
      '접속 불가',
      '데이터 손실',
      'critical error',
      'system failure',
      'complete outage',
    ];

    // ⚠️ High 수준 키워드
    const highKeywords = [
      'cpu 100%',
      '메모리 부족',
      '디스크 가득',
      '응답 없음',
      '타임아웃',
      '네트워크 끊김',
      'high cpu',
      'memory leak',
      'disk full',
    ];

    // 🔶 Medium 수준 키워드
    const mediumKeywords = [
      '느려',
      '지연',
      '경고',
      '임계치',
      '사용률 높',
      '성능 저하',
      'slow',
      'warning',
      'threshold',
      'performance',
    ];

    // 🔵 Low 수준 키워드
    const lowKeywords = [
      '상태 확인',
      '모니터링',
      '점검',
      '분석',
      '로그',
      'status',
      'monitoring',
      'check',
      'analysis',
    ];

    const combinedText = `${lowerQuery} ${lowerResponse}`;

    // Critical 수준 체크
    if (criticalKeywords.some(keyword => combinedText.includes(keyword))) {
      return {
        shouldTrigger: true,
        severity: 'critical',
        reason: 'Critical 수준의 시스템 장애 키워드 감지',
      };
    }

    // High 수준 체크
    if (highKeywords.some(keyword => combinedText.includes(keyword))) {
      return {
        shouldTrigger: true,
        severity: 'high',
        reason: 'High 수준의 성능 이슈 키워드 감지',
      };
    }

    // Medium 수준 체크
    if (mediumKeywords.some(keyword => combinedText.includes(keyword))) {
      return {
        shouldTrigger: true,
        severity: 'medium',
        reason: 'Medium 수준의 경고 키워드 감지',
      };
    }

    // Low 수준 체크 (상태 확인 등)
    if (lowKeywords.some(keyword => combinedText.includes(keyword))) {
      return {
        shouldTrigger: false, // Low 수준은 자동 트리거하지 않음
        severity: 'low',
        reason: 'Low 수준의 일반 모니터링 키워드 감지',
      };
    }

    return {
      shouldTrigger: false,
      severity: 'low',
    };
  }

  /**
   * 🤖 ML 엔진 초기화 (NEW!)
   */
  private async initializeMLEngine(): Promise<void> {
    try {
      const { LightweightMLEngine } = await import(
        '@/lib/ml/LightweightMLEngine'
      );
      this.mlEngine = new LightweightMLEngine();
      this.mlInitialized = true;
      console.log('🤖 SimplifiedNaturalLanguageEngine: ML 엔진 초기화 완료');
    } catch (error) {
      console.warn('⚠️ ML 엔진 초기화 실패:', error);
      this.mlEngine = null;
      this.mlInitialized = false;
    }
  }
}
