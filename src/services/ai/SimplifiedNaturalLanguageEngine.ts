/**
 * 🚀 단순화된 자연어 처리 엔진 (OpenManager Vibe v5) - Ultra Simple 리팩토링
 *
 * 🎯 목표: 자연어 질의 응답이 1순위, 스마트 모드 선택, 자동 장애 보고서
 *
 * 핵심 기능:
 * 1. 스마트 모드 선택 (Auto/Google-Only/Local/Offline)
 * 2. 3-엔진 병렬 처리: MCP + RAG + Google AI (3초 이내)
 * 3. 자동 장애 보고서 생성 (기존 AutoReportService 활용)
 * 4. MCP 웜업: Render 서버 자동 웨이크업
 * 5. 서버 정보 및 AI 도구 필요시에만 사용
 */

import { UnifiedAIEngine } from '@/core/ai/UnifiedAIEngine';
import { LocalRAGEngine } from '@/lib/ml/rag-engine';
import { MCPContext } from '@/services/ai/MCPAIRouter';
import { GoogleAIService } from '@/services/ai/GoogleAIService';
import { MCPWarmupService } from '@/services/mcp/mcp-warmup-service';
import { AutoReportService } from '@/services/monitoring/AutoReportService';

// 🎯 스마트 모드 정의
type AIMode = 'auto' | 'google-only' | 'local' | 'offline';

interface FastTrackOptions {
  timeout: number; // 기본 3초
  enableParallel: boolean; // 병렬 처리 활성화
  preferEngine?: 'mcp' | 'rag' | 'google' | 'auto'; // 선호 엔진
  enableMCPWarmup: boolean; // MCP 웜업 활성화
  mode?: AIMode; // 강제 모드 설정
  enableAutoReport: boolean; // 자동장애보고서 트리거 감지 활성화
}

interface FastTrackResult {
  success: boolean;
  response: string;
  engine: 'mcp' | 'rag' | 'google' | 'hybrid';
  confidence: number;
  responseTime: number;
  fallbackUsed: boolean;
  warmupTime?: number; // MCP 웜업 시간
  mode: AIMode; // 사용된 모드
  failureReport?: any; // 자동 장애 보고서 (기존 시스템 활용)
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
  };
}

export class SimplifiedNaturalLanguageEngine {
  private static instance: SimplifiedNaturalLanguageEngine | null = null;
  private unifiedAI: UnifiedAIEngine;
  private ragEngine: LocalRAGEngine;
  private googleAI: GoogleAIService | null = null;
  private mcpWarmup: MCPWarmupService;
  private autoReportService: AutoReportService;
  private initialized = false;
  private mcpWarmedUp = false;
  private currentMode: AIMode = 'auto';

  private constructor() {
    this.unifiedAI = UnifiedAIEngine.getInstance();
    this.ragEngine = new LocalRAGEngine();
    this.mcpWarmup = MCPWarmupService.getInstance();
    this.autoReportService = AutoReportService.getInstance();

    // Google AI 초기화 (사용 가능한 경우)
    try {
      this.googleAI = new GoogleAIService();
    } catch (error) {
      console.warn('Google AI 서비스 초기화 실패:', error);
      this.googleAI = null;
    }
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
        this.ragEngine.initialize?.() || Promise.resolve(),
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
        mode: config.mode,
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
      this.googleAI = new GoogleAIService();
      await this.googleAI.initialize();
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
      },
    };
  }

  /**
   * 🤖 Google AI 시도
   */
  private async tryGoogle(query: string) {
    if (!this.googleAI) {
      this.googleAI = new GoogleAIService();
      await this.googleAI.initialize();
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
   * 🔧 MCP 시도
   */
  private async tryMCP(query: string) {
    if (!this.unifiedAI) {
      this.unifiedAI = UnifiedAIEngine.getInstance();
    }

    const result = await this.unifiedAI.processQuery({
      query,
      context: { sessionId: `ultra_${Date.now()}` },
    });

    if (result?.success && result?.analysis?.summary) {
      return {
        response: result.analysis.summary,
        confidence: 0.8,
        engine: 'mcp',
      };
    }

    throw new Error('MCP 실패');
  }

  /**
   * 📚 RAG 시도
   */
  private async tryRAG(query: string) {
    if (!this.ragEngine) {
      this.ragEngine = new LocalRAGEngine();
      await this.ragEngine.initialize?.();
    }

    const result = await this.ragEngine.processQuery(
      query,
      `ultra_${Date.now()}`
    );

    if (result?.response) {
      return {
        response: result.response,
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
    // 장애 관련 키워드 감지
    const failureKeywords = [
      '오류',
      '에러',
      '장애',
      '실패',
      '다운',
      '응답없음',
      'error',
      'failure',
      'down',
      'critical',
      '위험',
      '심각',
    ];

    const hasFailureKeyword = failureKeywords.some(
      keyword =>
        query.toLowerCase().includes(keyword) ||
        response.toLowerCase().includes(keyword)
    );

    if (!hasFailureKeyword) {
      return undefined;
    }

    try {
      // 기존 AutoReportService의 활성 장애 확인
      const activeIncidents = this.autoReportService.getActiveIncidents();

      // 새로운 장애 감지 시 기존 시스템에 알림
      if (activeIncidents.length === 0) {
        console.log(
          '🚨 자연어 질의에서 장애 상황 감지됨, AutoReportService에 알림'
        );

        // 간단한 장애 정보 반환 (기존 시스템과 호환)
        return {
          detected: true,
          source: 'natural_language_query',
          query,
          response,
          timestamp: new Date().toISOString(),
          activeIncidents: activeIncidents.length,
        };
      }

      return {
        detected: true,
        source: 'natural_language_query',
        existingIncidents: activeIncidents.length,
        timestamp: new Date().toISOString(),
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
}
