/**
 * 🧠 스마트 폴백 AI 엔진 (OpenManager Vibe v5)
 *
 * 🎯 컨텍스트 기반 자연어 처리 우선순위:
 * 1. MCP 컨텍스트 (실시간 서버 상태 + 자연어 처리) - 70% 커버리지
 * 2. RAG 엔진 (서버 지식 + 자연어 설명) - 15% 커버리지
 * 3. Google AI Studio (복잡한 자연어 전문가) - 최후 2% 커버리지
 *
 * 🔍 Google AI 제한적 역할:
 * - 기존 AI 모델이 자연어 질문 처리 못할 시에만 동작
 * - 실패 로그 분석 → 컨텍스트 보강 여부 판단 → 보강 (GeminiLearningEngine)
 * - 하루 300회 할당량 제한으로 신중한 사용
 *
 * 특징:
 * - 실패 로그 상세 기록
 * - 하루 할당량 관리 (Google AI 300회)
 * - 관리자 모드에서 할당량 리셋
 * - 각 단계별 성능 모니터링
 */

import { UnifiedAIEngine } from '@/core/ai/UnifiedAIEngine';
import { GoogleAIService } from './GoogleAIService';
import { LocalRAGEngine } from '@/lib/ml/rag-engine';
import { MCPAIRouter, MCPContext } from './MCPAIRouter';
import { getRedisClient } from '@/lib/redis';
import { aiLogger, LogLevel, LogCategory } from './logging/AILogger';

interface FallbackAttempt {
  timestamp: Date;
  stage: 'mcp' | 'rag' | 'google_ai';
  query: string;
  success: boolean;
  error?: string;
  responseTime: number;
  confidence?: number;
}

interface DailyQuota {
  date: string;
  googleAIUsed: number;
  totalQueries: number;
  mcpSuccessRate: number;
  ragSuccessRate: number;
  googleAISuccessRate: number;
  lastReset: string;
}

interface SmartFallbackOptions {
  enableMCP: boolean;
  enableRAG: boolean;
  enableGoogleAI: boolean;
  maxRetries: number;
  timeout: number;
  adminOverride?: boolean;
}

export class SmartFallbackEngine {
  private static instance: SmartFallbackEngine | null = null;
  private redis: any;
  private unifiedAI: UnifiedAIEngine;
  private googleAI: GoogleAIService;
  private ragEngine: LocalRAGEngine;
  private mcpRouter: MCPAIRouter;

  // 할당량 관리
  private readonly DAILY_GOOGLE_AI_LIMIT = 300; // 하루 300회
  private readonly GOOGLE_AI_SAFETY_MARGIN = 0.8; // 80% 사용시 경고

  // 로그 관리
  private failureLogs: FallbackAttempt[] = [];
  private dailyQuota: DailyQuota;

  private initialized = false;

  private constructor() {
    this.unifiedAI = UnifiedAIEngine.getInstance();
    this.googleAI = new GoogleAIService();
    this.ragEngine = new LocalRAGEngine();
    this.mcpRouter = new MCPAIRouter();

    this.dailyQuota = this.initializeDailyQuota();
  }

  static getInstance(): SmartFallbackEngine {
    if (!SmartFallbackEngine.instance) {
      SmartFallbackEngine.instance = new SmartFallbackEngine();
    }
    return SmartFallbackEngine.instance;
  }

  /**
   * 🚀 초기화
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await aiLogger.logAI({
        level: LogLevel.INFO,
        category: LogCategory.FALLBACK,
        engine: 'SmartFallbackEngine',
        message: '🧠 SmartFallbackEngine 초기화 시작...',
      });

      // Redis 연결
      this.redis = await getRedisClient();

      // 각 엔진 초기화
      await this.unifiedAI.initialize();
      await this.googleAI.initialize();

      if (
        this.ragEngine.isReady &&
        typeof this.ragEngine.isReady === 'function'
      ) {
        if (!this.ragEngine.isReady()) {
          await aiLogger.logAI({
            level: LogLevel.INFO,
            category: LogCategory.RAG,
            engine: 'SmartFallbackEngine',
            message: '📚 RAG 엔진 초기화 중...',
          });
        }
      }

      // 일일 할당량 로드
      await this.loadDailyQuota();

      // 정리 스케줄러 시작
      this.startCleanupScheduler();

      this.initialized = true;
      await aiLogger.logAI({
        level: LogLevel.INFO,
        category: LogCategory.FALLBACK,
        engine: 'SmartFallbackEngine',
        message: '✅ SmartFallbackEngine 초기화 완료!',
      });
    } catch (error) {
      await aiLogger.logError(
        'SmartFallbackEngine',
        LogCategory.FALLBACK,
        error as Error,
        { stage: 'initialization' }
      );
      this.initialized = true; // 기본 모드로 동작
    }
  }

  /**
   * 🎯 스마트 쿼리 처리 (메인 진입점)
   */
  async processQuery(
    query: string,
    context?: any,
    options: Partial<SmartFallbackOptions> = {}
  ): Promise<{
    success: boolean;
    response: string;
    stage: 'mcp' | 'rag' | 'google_ai';
    confidence: number;
    responseTime: number;
    fallbackPath: string[];
    quota: {
      googleAIUsed: number;
      googleAIRemaining: number;
      isNearLimit: boolean;
    };
  }> {
    const startTime = Date.now();
    const fallbackPath: string[] = [];

    if (!this.initialized) {
      await this.initialize();
    }

    // 일일 할당량 체크
    await this.checkAndResetDailyQuota();

    const defaultOptions: SmartFallbackOptions = {
      enableMCP: true,
      enableRAG: true,
      enableGoogleAI: true,
      maxRetries: 1,
      timeout: 15000,
      ...options,
    };

    try {
      // 1단계: MCP 시스템 시도
      if (defaultOptions.enableMCP) {
        try {
          fallbackPath.push('MCP 시도');
          const mcpResult = await this.tryMCPEngine(
            query,
            context,
            defaultOptions.timeout
          );

          if (mcpResult.success) {
            this.logAttempt(
              'mcp',
              query,
              true,
              mcpResult.responseTime,
              mcpResult.confidence
            );
            this.updateSuccessRate('mcp', true);

            return {
              success: true,
              response: mcpResult.response,
              stage: 'mcp',
              confidence: mcpResult.confidence,
              responseTime: Date.now() - startTime,
              fallbackPath,
              quota: this.getQuotaStatus(),
            };
          }

          this.logAttempt(
            'mcp',
            query,
            false,
            mcpResult.responseTime,
            0,
            mcpResult.error
          );
          this.updateSuccessRate('mcp', false);
          fallbackPath.push('MCP 실패');
        } catch (error) {
          await aiLogger.logWarning(
            'MCP',
            LogCategory.MCP,
            '⚠️ MCP 엔진 오류',
            { error, query, responseTime: Date.now() - startTime }
          );
          fallbackPath.push('MCP 오류');
        }
      }

      // 2단계: RAG 엔진 시도
      if (defaultOptions.enableRAG) {
        try {
          fallbackPath.push('RAG 시도');
          const ragResult = await this.tryRAGEngine(
            query,
            context,
            defaultOptions.timeout
          );

          if (ragResult.success) {
            this.logAttempt(
              'rag',
              query,
              true,
              ragResult.responseTime,
              ragResult.confidence
            );
            this.updateSuccessRate('rag', true);

            return {
              success: true,
              response: ragResult.response,
              stage: 'rag',
              confidence: ragResult.confidence,
              responseTime: Date.now() - startTime,
              fallbackPath,
              quota: this.getQuotaStatus(),
            };
          }

          this.logAttempt(
            'rag',
            query,
            false,
            ragResult.responseTime,
            0,
            ragResult.error
          );
          this.updateSuccessRate('rag', false);
          fallbackPath.push('RAG 실패');
        } catch (error) {
          await aiLogger.logWarning(
            'RAG',
            LogCategory.RAG,
            '⚠️ RAG 엔진 오류',
            { error, query, responseTime: Date.now() - startTime }
          );
          fallbackPath.push('RAG 오류');
        }
      }

      // 3단계: Google AI 최종 폴백 (할당량 체크)
      if (
        defaultOptions.enableGoogleAI &&
        this.canUseGoogleAI(defaultOptions.adminOverride)
      ) {
        try {
          fallbackPath.push('Google AI 시도');
          const googleResult = await this.tryGoogleAI(
            query,
            context,
            defaultOptions.timeout
          );

          if (googleResult.success) {
            this.logAttempt(
              'google_ai',
              query,
              true,
              googleResult.responseTime,
              googleResult.confidence
            );
            this.updateSuccessRate('google_ai', true);
            this.incrementGoogleAIUsage();

            return {
              success: true,
              response: googleResult.response,
              stage: 'google_ai',
              confidence: googleResult.confidence,
              responseTime: Date.now() - startTime,
              fallbackPath,
              quota: this.getQuotaStatus(),
            };
          }

          this.logAttempt(
            'google_ai',
            query,
            false,
            googleResult.responseTime,
            0,
            googleResult.error
          );
          this.updateSuccessRate('google_ai', false);
          fallbackPath.push('Google AI 실패');
        } catch (error) {
          await aiLogger.logWarning(
            'GoogleAI',
            LogCategory.GOOGLE_AI,
            '⚠️ Google AI 오류',
            { error, query, responseTime: Date.now() - startTime }
          );
          fallbackPath.push('Google AI 오류');
        }
      } else if (defaultOptions.enableGoogleAI) {
        fallbackPath.push('Google AI 할당량 초과');
      }

      // 모든 엔진 실패시
      throw new Error('모든 AI 엔진이 실패했습니다.');
    } catch (error) {
      await aiLogger.logError(
        'SmartFallbackEngine',
        LogCategory.FALLBACK,
        error as Error,
        {
          query,
          fallbackPath,
          totalResponseTime: Date.now() - startTime,
          quotaStatus: this.getQuotaStatus(),
        }
      );

      return {
        success: false,
        response: `죄송합니다. 현재 AI 시스템에 문제가 발생했습니다. 잠시 후 다시 시도해주세요.\n\n실패 경로: ${fallbackPath.join(' → ')}`,
        stage: 'mcp',
        confidence: 0,
        responseTime: Date.now() - startTime,
        fallbackPath: [...fallbackPath, '전체 실패'],
        quota: this.getQuotaStatus(),
      };
    }
  }

  /**
   * 🎯 MCP 엔진 시도
   */
  private async tryMCPEngine(
    query: string,
    context?: any,
    timeout: number = 15000
  ): Promise<{
    success: boolean;
    response: string;
    confidence: number;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const mcpContext: MCPContext = {
        userQuery: query,
        serverMetrics: context?.serverMetrics || [],
        logEntries: context?.logEntries || [],
        timeRange: context?.timeRange || {
          start: new Date(Date.now() - 24 * 60 * 60 * 1000),
          end: new Date(),
        },
        sessionId: `mcp_${Date.now()}`,
        aiContexts: context?.aiContexts || [],
      };

      const result = (await Promise.race([
        this.unifiedAI.processQuery({ query, context: mcpContext }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MCP 타임아웃')), timeout)
        ),
      ])) as any;

      if (result.success && result.analysis?.summary) {
        return {
          success: true,
          response: result.analysis.summary,
          confidence: result.analysis.confidence || 0.8,
          responseTime: Date.now() - startTime,
        };
      }

      return {
        success: false,
        response: '',
        confidence: 0,
        responseTime: Date.now() - startTime,
        error: 'MCP 응답 없음',
      };
    } catch (error) {
      return {
        success: false,
        response: '',
        confidence: 0,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '알 수 없는 MCP 오류',
      };
    }
  }

  /**
   * 📚 RAG 엔진 시도
   */
  private async tryRAGEngine(
    query: string,
    context?: any,
    timeout: number = 15000
  ): Promise<{
    success: boolean;
    response: string;
    confidence: number;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      // RAG 엔진 준비 상태 체크
      if (
        !this.ragEngine.isReady ||
        (typeof this.ragEngine.isReady === 'function' &&
          !this.ragEngine.isReady())
      ) {
        return {
          success: false,
          response: '',
          confidence: 0,
          responseTime: Date.now() - startTime,
          error: 'RAG 엔진 준비되지 않음',
        };
      }

      const result = (await Promise.race([
        this.ragEngine.processQuery(query, `session_${Date.now()}`),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('RAG 타임아웃')), timeout)
        ),
      ])) as any;

      if (result && result.response) {
        return {
          success: true,
          response: result.response,
          confidence: result.confidence || 0.7,
          responseTime: Date.now() - startTime,
        };
      }

      return {
        success: false,
        response: '',
        confidence: 0,
        responseTime: Date.now() - startTime,
        error: 'RAG 응답 없음',
      };
    } catch (error) {
      return {
        success: false,
        response: '',
        confidence: 0,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : '알 수 없는 RAG 오류',
      };
    }
  }

  /**
   * 🤖 Google AI 시도
   */
  private async tryGoogleAI(
    query: string,
    context?: any,
    timeout: number = 15000
  ): Promise<{
    success: boolean;
    response: string;
    confidence: number;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      if (!this.googleAI.isAvailable()) {
        return {
          success: false,
          response: '',
          confidence: 0,
          responseTime: Date.now() - startTime,
          error: 'Google AI 사용 불가',
        };
      }

      // 서버 메트릭이 있으면 전문 분석, 없으면 일반 쿼리
      let result;
      if (context?.serverMetrics && context.serverMetrics.length > 0) {
        const analysisResult = (await Promise.race([
          this.googleAI.analyzeServerMetrics(context.serverMetrics),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Google AI 분석 타임아웃')),
              timeout
            )
          ),
        ])) as string;

        result = {
          success: true,
          content: analysisResult,
          confidence: 0.95,
        };
      } else {
        result = (await Promise.race([
          this.googleAI.generateContent(
            this.buildPromptForGoogleAI(query, context)
          ),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error('Google AI 생성 타임아웃')),
              timeout
            )
          ),
        ])) as any;
      }

      if (result.success && result.content) {
        return {
          success: true,
          response: result.content,
          confidence: result.confidence || 0.9,
          responseTime: Date.now() - startTime,
        };
      }

      return {
        success: false,
        response: '',
        confidence: 0,
        responseTime: Date.now() - startTime,
        error: 'Google AI 응답 생성 실패',
      };
    } catch (error) {
      return {
        success: false,
        response: '',
        confidence: 0,
        responseTime: Date.now() - startTime,
        error:
          error instanceof Error ? error.message : '알 수 없는 Google AI 오류',
      };
    }
  }

  /**
   * 📝 Google AI용 프롬프트 구성
   */
  private buildPromptForGoogleAI(query: string, context?: any): string {
    let prompt = `당신은 OpenManager 서버 모니터링 전문가입니다.

질문: ${query}

배경:
- MCP 시스템과 RAG 엔진이 실패하여 Google AI로 폴백되었습니다
- 전문적이고 실용적인 답변을 제공해주세요
- 서버 모니터링과 관련된 구체적인 조치사항을 포함해주세요

`;

    if (context?.serverMetrics) {
      prompt += `\n현재 서버 상태:\n`;
      context.serverMetrics.slice(0, 3).forEach((metric: any, i: number) => {
        prompt += `${i + 1}. CPU: ${metric.cpu}%, 메모리: ${metric.memory}%, 디스크: ${metric.disk}%\n`;
      });
    }

    if (context?.logEntries) {
      prompt += `\n최근 로그:\n`;
      context.logEntries.slice(-3).forEach((log: any, i: number) => {
        prompt += `${i + 1}. [${log.level}] ${log.message}\n`;
      });
    }

    prompt += `\n다음 형식으로 답변해주세요:
1. 🎯 핵심 요약 (2-3줄)
2. 📊 상세 분석
3. 💡 권장 조치사항
4. ⚠️ 주의사항 (있는 경우)

실용적이고 구체적인 답변을 부탁드립니다.`;

    return prompt;
  }

  /**
   * 🔒 Google AI 사용 가능 여부 체크
   */
  private canUseGoogleAI(adminOverride = false): boolean {
    if (adminOverride) {
      console.log('🔑 관리자 오버라이드: Google AI 할당량 무시');
      return this.googleAI.isAvailable();
    }

    return (
      this.googleAI.isAvailable() &&
      this.dailyQuota.googleAIUsed < this.DAILY_GOOGLE_AI_LIMIT
    );
  }

  /**
   * 📊 할당량 상태 조회
   */
  private getQuotaStatus() {
    const used = this.dailyQuota.googleAIUsed;
    const limit = this.DAILY_GOOGLE_AI_LIMIT;
    const remaining = Math.max(0, limit - used);
    const isNearLimit = used >= limit * this.GOOGLE_AI_SAFETY_MARGIN;

    return {
      googleAIUsed: used,
      googleAIRemaining: remaining,
      isNearLimit,
    };
  }

  /**
   * 🔄 일일 할당량 관리
   */
  private initializeDailyQuota(): DailyQuota {
    const today = new Date().toISOString().split('T')[0];
    return {
      date: today,
      googleAIUsed: 0,
      totalQueries: 0,
      mcpSuccessRate: 0,
      ragSuccessRate: 0,
      googleAISuccessRate: 0,
      lastReset: new Date().toISOString(),
    };
  }

  private async loadDailyQuota(): Promise<void> {
    try {
      if (!this.redis) return;

      const today = new Date().toISOString().split('T')[0];
      const quotaKey = `smart_fallback:quota:${today}`;
      const stored = await this.redis.get(quotaKey);

      if (stored) {
        this.dailyQuota = JSON.parse(stored);
        console.log(
          `📊 일일 할당량 로드: Google AI ${this.dailyQuota.googleAIUsed}/${this.DAILY_GOOGLE_AI_LIMIT}`
        );
      } else {
        this.dailyQuota = this.initializeDailyQuota();
        await this.saveDailyQuota();
      }
    } catch (error) {
      console.warn('⚠️ 할당량 로드 실패:', error);
      this.dailyQuota = this.initializeDailyQuota();
    }
  }

  private async saveDailyQuota(): Promise<void> {
    try {
      if (!this.redis) return;

      const quotaKey = `smart_fallback:quota:${this.dailyQuota.date}`;
      await this.redis.setex(quotaKey, 86400, JSON.stringify(this.dailyQuota)); // 24시간
    } catch (error) {
      console.warn('⚠️ 할당량 저장 실패:', error);
    }
  }

  private async checkAndResetDailyQuota(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    if (this.dailyQuota.date !== today) {
      console.log('🔄 일일 할당량 리셋');
      this.dailyQuota = this.initializeDailyQuota();
      await this.saveDailyQuota();
    }
  }

  private incrementGoogleAIUsage(): void {
    this.dailyQuota.googleAIUsed++;
    this.dailyQuota.totalQueries++;

    console.log(
      `📈 Google AI 사용량: ${this.dailyQuota.googleAIUsed}/${this.DAILY_GOOGLE_AI_LIMIT}`
    );

    // 할당량 경고
    if (
      this.dailyQuota.googleAIUsed >=
      this.DAILY_GOOGLE_AI_LIMIT * this.GOOGLE_AI_SAFETY_MARGIN
    ) {
      console.warn(
        `⚠️ Google AI 할당량 ${Math.round(this.GOOGLE_AI_SAFETY_MARGIN * 100)}% 도달!`
      );
    }

    this.saveDailyQuota().catch(console.warn);
  }

  /**
   * 📝 시도 로그 기록
   */
  private logAttempt(
    stage: 'mcp' | 'rag' | 'google_ai',
    query: string,
    success: boolean,
    responseTime: number,
    confidence = 0,
    error?: string
  ): void {
    const attempt: FallbackAttempt = {
      timestamp: new Date(),
      stage,
      query: query.slice(0, 100), // 처음 100자만 저장
      success,
      error,
      responseTime,
      confidence,
    };

    this.failureLogs.push(attempt);

    // 로그 크기 제한 (최대 1000개)
    if (this.failureLogs.length > 1000) {
      this.failureLogs = this.failureLogs.slice(-800); // 최근 800개만 유지
    }

    // 실패한 경우 상세 로그
    if (!success) {
      console.warn(`❌ ${stage.toUpperCase()} 실패:`, {
        query: query.slice(0, 50),
        error,
        responseTime: `${responseTime}ms`,
      });
    }
  }

  /**
   * 📊 성공률 업데이트
   */
  private updateSuccessRate(
    engine: 'mcp' | 'rag' | 'google_ai',
    success: boolean
  ): void {
    const recentAttempts = this.failureLogs
      .filter(log => log.stage === engine)
      .slice(-10); // 최근 10회 시도

    if (recentAttempts.length === 0) return;

    const successCount = recentAttempts.filter(log => log.success).length;
    const successRate = successCount / recentAttempts.length;

    switch (engine) {
      case 'mcp':
        this.dailyQuota.mcpSuccessRate = successRate;
        break;
      case 'rag':
        this.dailyQuota.ragSuccessRate = successRate;
        break;
      case 'google_ai':
        this.dailyQuota.googleAISuccessRate = successRate;
        break;
    }
  }

  /**
   * 🔧 정리 스케줄러
   */
  private startCleanupScheduler(): void {
    // 매시간 정리
    setInterval(
      () => {
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
        this.failureLogs = this.failureLogs.filter(
          log => log.timestamp > hourAgo
        );
      },
      60 * 60 * 1000
    ); // 1시간
  }

  /**
   * 🔑 관리자 기능들
   */
  async resetDailyQuota(adminKey?: string): Promise<boolean> {
    // 간단한 관리자 인증 (실제로는 더 강화된 인증 필요)
    if (adminKey !== process.env.ADMIN_SECRET_KEY) {
      console.warn('🚫 관리자 권한 없음: 할당량 리셋 거부');
      return false;
    }

    console.log('🔑 관리자 권한으로 할당량 리셋');
    this.dailyQuota = this.initializeDailyQuota();
    await this.saveDailyQuota();
    return true;
  }

  getSystemStatus() {
    const quota = this.getQuotaStatus();
    const recentFailures = this.failureLogs
      .filter(log => !log.success)
      .slice(-10);

    return {
      initialized: this.initialized,
      engines: {
        mcp: {
          available: this.unifiedAI ? true : false,
          successRate: this.dailyQuota.mcpSuccessRate,
        },
        rag: {
          available:
            this.ragEngine && this.ragEngine.isReady
              ? typeof this.ragEngine.isReady === 'function'
                ? this.ragEngine.isReady()
                : true
              : false,
          successRate: this.dailyQuota.ragSuccessRate,
        },
        googleAI: {
          available: this.googleAI.isAvailable(),
          successRate: this.dailyQuota.googleAISuccessRate,
        },
      },
      quota,
      dailyStats: {
        totalQueries: this.dailyQuota.totalQueries,
        date: this.dailyQuota.date,
        lastReset: this.dailyQuota.lastReset,
      },
      recentFailures: recentFailures.map(f => ({
        stage: f.stage,
        error: f.error,
        timestamp: f.timestamp,
      })),
    };
  }

  getFailureLogs(limit = 50) {
    return this.failureLogs
      .filter(log => !log.success)
      .slice(-limit)
      .map(log => ({
        timestamp: log.timestamp,
        stage: log.stage,
        query: log.query,
        error: log.error,
        responseTime: log.responseTime,
      }));
  }
}

export default SmartFallbackEngine;
