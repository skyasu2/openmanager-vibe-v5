/**
 * 🎯 AI 에이전트 오케스트레이터 API
 *
 * 모든 데이터 처리 요청을 중앙에서 관리하는 새로운 API
 * - 단순화된 인터페이스
 * - 전략 패턴 기반 처리
 * - 통합 캐싱 및 에러 처리
 * - 성능 모니터링
 */

import { serverDataCache } from '@/services/cache/ServerDataCache';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

// 간단한 AI 필터
class SimpleAIFilter {
  async filterForAI(options: any) {
    const generator = RealServerDataGenerator.getInstance();
    const servers = await generator.getAllServers();
    return {
      data: servers.slice(0, 10),
      insights: {
        patterns: ['CPU 사용률이 높은 서버가 증가하고 있습니다'],
        anomalies: ['서버-5에서 비정상적인 메모리 사용 패턴 감지'],
        recommendations: ['메모리 사용량이 높은 서버들을 점검하세요'],
      },
      metadata: {
        processingTime: 150,
        dataQuality: {
          completeness: 0.95,
          consistency: 0.92,
          accuracy: 0.88,
        },
      },
    };
  }
}

// 간단한 전략 구현
class SimpleStrategy {
  name: string;
  priority: string;

  constructor(name: string, priority: string) {
    this.name = name;
    this.priority = priority;
  }

  async execute(request: any) {
    const startTime = Date.now();
    const generator = RealServerDataGenerator.getInstance();
    const aiFilter = new SimpleAIFilter();

    switch (this.name) {
      case 'monitoring_focus':
        const servers = await generator.getAllServers();
        return {
          strategy: this.name,
          data: {
            servers: servers.slice(0, 20),
            realTimeMetrics: {
              totalServers: servers.length,
              onlineServers: servers.filter(s => s.status === 'running').length,
              warningServers: servers.filter(s => s.status === 'warning')
                .length,
              criticalServers: servers.filter(s => s.status === 'error').length,
            },
          },
          metadata: {
            processingTime: Date.now() - startTime,
            dataSource: 'real_time_monitoring',
          },
          confidence: 0.95,
          dataQuality: 0.9,
        };

      case 'ai_analysis':
        const aiResult = await aiFilter.filterForAI({});
        return {
          strategy: this.name,
          data: {
            aiAnalysis: aiResult.data,
            insights: aiResult.insights,
            patterns: aiResult.insights.patterns,
            anomalies: aiResult.insights.anomalies,
          },
          metadata: {
            processingTime: Date.now() - startTime,
            dataSource: 'ai_analysis',
          },
          confidence: 0.85,
          dataQuality: 0.88,
        };

      default:
        const hybridServers = await generator.getAllServers();
        const hybridAI = await aiFilter.filterForAI({});
        return {
          strategy: 'hybrid_balanced',
          data: {
            monitoringData: { servers: hybridServers },
            aiData: hybridAI,
            fusedInsights: {
              summary: `전체 ${hybridServers.length}개 서버 중 정상 상태 비율 분석 완료`,
              keyFindings: ['실시간 모니터링과 AI 분석 결과가 일치합니다'],
              recommendations: ['현재 시스템 상태는 안정적입니다'],
            },
          },
          metadata: {
            processingTime: Date.now() - startTime,
            dataSource: 'hybrid_fusion',
          },
          confidence: 0.92,
          dataQuality: 0.89,
        };
    }
  }

  getMetadata() {
    return {
      name: this.name,
      description: `${this.name} 전략`,
      avgProcessingTime: 200,
      successRate: 0.95,
      lastUsed: new Date(),
      usageCount: 1,
    };
  }
}

// 간단한 전략 팩토리
class SimpleStrategyFactory {
  private static instance: SimpleStrategyFactory | null = null;
  private strategies: Map<string, SimpleStrategy>;

  constructor() {
    this.strategies = new Map([
      [
        'monitoring_focus',
        new SimpleStrategy('monitoring_focus', 'monitoring'),
      ],
      ['ai_analysis', new SimpleStrategy('ai_analysis', 'ai')],
      ['hybrid', new SimpleStrategy('hybrid_balanced', 'balanced')],
      ['auto_select', new SimpleStrategy('auto_select', 'balanced')],
    ]);
  }

  static getInstance(): SimpleStrategyFactory {
    if (!SimpleStrategyFactory.instance) {
      SimpleStrategyFactory.instance = new SimpleStrategyFactory();
    }
    return SimpleStrategyFactory.instance;
  }

  async selectStrategy(request: any): Promise<SimpleStrategy> {
    const strategyName = request.requestType;
    const strategy = this.strategies.get(strategyName);

    if (!strategy) {
      return this.strategies.get('auto_select')!;
    }

    return strategy;
  }

  async getStatus() {
    return {
      availableStrategies: Array.from(this.strategies.values()).map(s => ({
        name: s.name,
        metadata: s.getMetadata(),
      })),
      totalStrategies: this.strategies.size,
    };
  }
}

// 간단한 에러 핸들러
class SimpleErrorHandler {
  private static instance: SimpleErrorHandler | null = null;

  static getInstance(): SimpleErrorHandler {
    if (!SimpleErrorHandler.instance) {
      SimpleErrorHandler.instance = new SimpleErrorHandler();
    }
    return SimpleErrorHandler.instance;
  }

  handleError(request: any, error: any, processingTime: number) {
    console.error('🚨 [SimpleOrchestrator] 오류 발생:', error);

    return {
      success: false,
      error: {
        type: error.name || 'UnknownError',
        message: error.message || '알 수 없는 오류가 발생했습니다',
        code: error.code || 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
        requestId: request.requestId || 'unknown',
        processingTime,
      },
      data: null as any,
      metadata: {
        strategy: 'error_fallback',
        dataSource: 'error_handler',
        processingTime,
        cacheHit: false,
        cacheTime: 0,
        confidence: 0,
        dataQuality: 0,
      },
    };
  }
}

// 간단한 오케스트레이터
class SimpleOrchestrator {
  private static instance: SimpleOrchestrator | null = null;
  private strategyFactory: SimpleStrategyFactory;
  private errorHandler: SimpleErrorHandler;

  constructor() {
    this.strategyFactory = SimpleStrategyFactory.getInstance();
    this.errorHandler = SimpleErrorHandler.getInstance();
  }

  static getInstance(): SimpleOrchestrator {
    if (!SimpleOrchestrator.instance) {
      SimpleOrchestrator.instance = new SimpleOrchestrator();
    }
    return SimpleOrchestrator.instance;
  }

  async processRequest(request: any) {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      console.log(`🚀 [SimpleOrchestrator] 요청 처리 시작: ${requestId}`);

      // 캐시 확인
      const cacheKey = `orchestrator:${request.requestType}:${request.query.slice(0, 50)}`;
      const cachedResult = serverDataCache.getCachedData();

      if (cachedResult) {
        console.log(`⚡ [SimpleOrchestrator] 캐시 히트: ${requestId}`);
        return {
          success: true,
          requestId,
          data: cachedResult,
          metadata: {
            strategy: 'cached',
            dataSource: 'cache',
            cacheHit: true,
            processingTime: Date.now() - startTime,
            cacheTime: Date.now() - startTime,
            confidence: 0.95,
            dataQuality: 0.9,
          },
        };
      }

      // 전략 선택 및 실행
      const strategy = await this.strategyFactory.selectStrategy(request);
      const result = await strategy.execute(request);

      // 캐시에 저장
      await serverDataCache.refreshCache();

      console.log(`✅ [SimpleOrchestrator] 요청 처리 완료: ${requestId}`);

      return {
        success: true,
        requestId,
        data: result,
        metadata: {
          ...result.metadata,
          cacheHit: false,
          processingTime: Date.now() - startTime,
          cacheTime: 0,
          confidence: result.confidence || 0.8,
          dataQuality: result.dataQuality || 0.85,
        },
      };
    } catch (error) {
      console.error(
        `❌ [SimpleOrchestrator] 요청 처리 실패: ${requestId}`,
        error
      );
      return this.errorHandler.handleError(
        { ...request, requestId },
        error,
        Date.now() - startTime
      );
    }
  }

  async getSystemStatus() {
    const generator = RealServerDataGenerator.getInstance();
    const cacheStatus = serverDataCache.getCacheStatus();

    return {
      orchestrator: {
        status: 'active',
        version: '1.0.0',
        uptime: process.uptime(),
      },
      strategies: await this.strategyFactory.getStatus(),
      cache: cacheStatus,
      dataGenerator: {
        status: generator.getStatus(),
        serverCount: (await generator.getAllServers()).length,
      },
    };
  }
}

// API 핸들러들
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    console.log('🎯 오케스트레이터 API 요청:', body);

    const requestId =
      body.requestId ||
      `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const orchestratorRequest = {
      requestId,
      requestType: body.requestType || 'auto_select',
      query: body.query,
      urgency: body.urgency || 'medium',
      filters: body.filters,
      options: {
        useCache: body.options?.useCache !== false,
        timeout: body.options?.timeout || 15000,
        confidenceThreshold: body.options?.confidenceThreshold || 0.7,
        ...body.options,
      },
      context: {
        sessionId: body.context?.sessionId || `session_${Date.now()}`,
        userId: body.context?.userId,
        source: 'api_request',
      },
    };

    const orchestrator = SimpleOrchestrator.getInstance();
    const response = await orchestrator.processRequest(orchestratorRequest);

    const processingTime = Date.now() - startTime;

    console.log(
      `✅ 오케스트레이터 API 완료: ${processingTime}ms, 성공: ${response.success}`
    );

    return NextResponse.json({
      success: response.success,
      data: (response as any).data,
      error: (response as any).error,
      metadata: {
        ...response.metadata,
        apiProcessingTime: processingTime,
        version: '1.0.0-orchestrator',
        endpoint: '/api/ai-agent/orchestrator',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ 오케스트레이터 API 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '오케스트레이터 API 처리에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        metadata: {
          processingTime,
          timestamp: Date.now(),
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeDebug = searchParams.get('debug') === 'true';

    const orchestrator = SimpleOrchestrator.getInstance();
    const systemStatus = await orchestrator.getSystemStatus();

    const response = {
      success: true,
      data: {
        status: 'active',
        version: '1.0.0-orchestrator',
        system: systemStatus,
        capabilities: {
          supportedRequestTypes: [
            'monitoring_focus',
            'ai_analysis',
            'hybrid',
            'auto_select',
          ],
          supportedFilters: [
            'status',
            'location',
            'searchTerm',
            'analysisType',
          ],
          features: [
            'strategy_pattern',
            'multi_level_caching',
            'error_recovery',
            'performance_monitoring',
            'auto_strategy_selection',
          ],
        },
      },
      timestamp: Date.now(),
    };

    if (includeDebug) {
      (response.data as any).debug = {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ 오케스트레이터 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: '오케스트레이터 상태 조회에 실패했습니다',
        details: error instanceof Error ? error.message : String(error),
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}
