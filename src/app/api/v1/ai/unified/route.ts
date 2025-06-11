/**
 * 🌟 Unified AI API v1
 *
 * 모든 AI 서비스들을 통합한 단일 엔드포인트
 * - Real AI Processor
 * - Python Backend Integration
 * - MCP Tools
 * - Redis Caching
 */

import { NextRequest, NextResponse } from 'next/server';
import { realAIProcessor } from '@/services/ai/RealAIProcessor';
// import { realPrometheusCollector } from '@/services/collectors/RealPrometheusCollector'; // 🗑️ 프로메테우스 제거
import { getMCPClient } from '@/services/mcp/official-mcp-client';
import { getRedisClient } from '@/lib/redis';
import { unifiedMetricsManager } from '@/services/UnifiedMetricsManager';

interface UnifiedRequest {
  query: string;
  type?:
    | 'analysis'
    | 'monitoring'
    | 'prediction'
    | 'optimization'
    | 'troubleshooting';
  options?: {
    includeMetrics?: boolean;
    includeLogs?: boolean;
    usePython?: boolean;
    useMCP?: boolean;
    aiModel?:
      | 'gpt-3.5-turbo'
      | 'claude-3-haiku'
      | 'gemini-1.5-flash'
      | 'local-analyzer';
    realTime?: boolean;
    maxResponseTime?: number;
  };
  context?: {
    sessionId?: string;
    userId?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
  };
}

interface UnifiedResponse {
  success: boolean;
  timestamp: string;
  query: string;
  type: string;
  analysis: {
    intent: string;
    confidence: number;
    summary: string;
    details: string[];
    urgency: string;
  };
  data: {
    metrics?: any;
    logs?: any[];
    systemStatus?: any;
    predictions?: any;
    recommendations?: string[];
  };
  sources: {
    ai: boolean;
    prometheus: boolean;
    python: boolean;
    mcp: boolean;
    redis: boolean;
  };
  performance: {
    totalTime: number;
    aiTime: number;
    dataCollectionTime: number;
    cacheHits: number;
    fallbacks: number;
  };
  metadata: {
    version: string;
    sessionId: string;
    cached: boolean;
    model: string;
    confidence: number;
  };
}

// 캐시 관리
const responseCache = new Map<
  string,
  { response: UnifiedResponse; timestamp: number }
>();
const CACHE_TTL = 2 * 60 * 1000; // 2분

/**
 * 🚀 통합 AI 분석 처리
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const sessionId = `unified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log(`🌟 통합 AI 분석 요청 시작 [${sessionId}]`);

  try {
    const body: UnifiedRequest = await request.json();

    // 입력 검증
    if (!body.query) {
      return NextResponse.json(
        {
          success: false,
          error: 'Query is required',
          code: 'MISSING_QUERY',
        },
        { status: 400 }
      );
    }

    // 캐시 확인
    const cacheKey = generateCacheKey(body);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log(`💨 캐시 히트 [${sessionId}]`);
      return NextResponse.json({
        ...cached,
        performance: {
          ...cached.performance,
          totalTime: Date.now() - startTime,
        },
        metadata: {
          ...cached.metadata,
          cached: true,
        },
      });
    }

    // 성능 추적
    const performance = {
      totalTime: 0,
      aiTime: 0,
      dataCollectionTime: 0,
      cacheHits: 0,
      fallbacks: 0,
    };

    // 소스 추적
    const sources = {
      ai: false,
      prometheus: false,
      python: false,
      mcp: false,
      redis: false,
    };

    // 1. 실시간 시스템 메트릭 수집
    let metrics: any = null;
    let systemStatus: any = null;

    if (body.options?.includeMetrics !== false || body.options?.realTime) {
      const metricsStart = Date.now();
      try {
        // 통합 메트릭 관리자 시작 및 데이터 수집
        if (!unifiedMetricsManager.getStatus().isRunning) {
          await unifiedMetricsManager.start();
        }
        metrics = unifiedMetricsManager.getServers();
        systemStatus = unifiedMetricsManager.getStatus();
        sources.prometheus = true; // 호환성을 위해 유지
        performance.dataCollectionTime += Date.now() - metricsStart;
        console.log(`📊 메트릭 수집 완료 [${sessionId}]`);
      } catch (error) {
        console.warn(`⚠️ 메트릭 수집 실패 [${sessionId}]:`, error);
        performance.fallbacks++;
      }
    }

    // 2. MCP 도구 활용 (선택적)
    let mcpResults: any[] = [];
    if (body.options?.useMCP !== false) {
      try {
        const mcpClient = getMCPClient();
        const tools = await mcpClient.listAllTools();

        // 시스템 상태 관련 도구 실행
        if (tools.has('system')) {
          const systemTools = tools.get('system');
          if (systemTools && systemTools.length > 0) {
            const mcpResult = await mcpClient.callTool(
              'system',
              'get_metrics',
              { type: 'all' }
            );
            mcpResults.push({
              tool: 'system_metrics',
              result: mcpResult,
              source: 'mcp',
            });
          }
        }

        sources.mcp = true;
        console.log(`🔧 MCP 도구 실행 완료 [${sessionId}]`);
      } catch (error) {
        console.warn(`⚠️ MCP 도구 실행 실패 [${sessionId}]:`, error);
        performance.fallbacks++;
      }
    }

    // 3. AI 분석 수행
    const aiStart = Date.now();
    let aiAnalysis: any;

    try {
      aiAnalysis = await realAIProcessor.processQuery({
        query: body.query,
        context: {
          serverMetrics: metrics ? [metrics] : [],
          systemState: systemStatus,
        },
        options: {
          model:
            body.options?.aiModel === 'local-analyzer'
              ? 'gpt-3.5-turbo'
              : body.options?.aiModel || 'gpt-3.5-turbo',
          useCache: true,
          usePython: body.options?.usePython || false,
          maxTokens: 1000,
          temperature: 0.7,
        },
      });

      sources.ai = true;
      performance.aiTime = Date.now() - aiStart;
      console.log(
        `🧠 AI 분석 완료 [${sessionId}] - Model: ${aiAnalysis.model}`
      );
    } catch (error) {
      console.error(`❌ AI 분석 실패 [${sessionId}]:`, error);
      performance.fallbacks++;

      // 폴백 분석
      aiAnalysis = createFallbackAnalysis(body.query, metrics);
    }

    // 4. Python 백엔드 분석 (선택적)
    let pythonAnalysis: any = null;
    if (body.options?.usePython && metrics) {
      try {
        const pythonUrl =
          process.env.PYTHON_SERVICE_URL ||
          'https://openmanager-ai-python.onrender.com';
        const response = await fetch(`${pythonUrl}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: body.query,
            metrics: [metrics],
            data: { sessionId, timestamp: new Date().toISOString() },
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          pythonAnalysis = await response.json();
          sources.python = true;
          console.log(`🐍 Python 분석 완료 [${sessionId}]`);
        }
      } catch (error) {
        console.warn(`⚠️ Python 분석 실패 [${sessionId}]:`, error);
        performance.fallbacks++;
      }
    }

    // 5. Redis 캐싱 상태 확인
    try {
      const redis = await getRedisClient();
      if (redis) {
        await redis.ping();
        sources.redis = true;
      }
    } catch (error) {
      console.warn(`⚠️ Redis 연결 실패 [${sessionId}]:`, error);
    }

    // 6. 로그 수집 (선택적)
    let logs: any[] = [];
    if (body.options?.includeLogs && metrics?.logs) {
      logs = metrics.logs.slice(0, 10); // 최근 10개 로그만
    }

    // 7. 예측 및 추천사항 생성
    const predictions = generatePredictions(metrics, aiAnalysis);
    const recommendations = combineRecommendations(
      aiAnalysis,
      pythonAnalysis,
      mcpResults
    );

    // 8. 응답 구성
    const response: UnifiedResponse = {
      success: true,
      timestamp: new Date().toISOString(),
      query: body.query,
      type: body.type || 'analysis',
      analysis: {
        intent: aiAnalysis.intent || 'general_analysis',
        confidence: aiAnalysis.confidence || 0.7,
        summary: aiAnalysis.summary || '시스템 분석을 완료했습니다.',
        details: aiAnalysis.details || [],
        urgency: aiAnalysis.urgency || 'medium',
      },
      data: {
        metrics,
        logs,
        systemStatus,
        predictions,
        recommendations,
      },
      sources,
      performance: {
        ...performance,
        totalTime: Date.now() - startTime,
      },
      metadata: {
        version: '2.1.0',
        sessionId: body.context?.sessionId || sessionId,
        cached: false,
        model: aiAnalysis.model || 'local-analyzer',
        confidence: aiAnalysis.confidence || 0.7,
      },
    };

    // 9. 응답 캐싱
    setCachedResponse(cacheKey, response);

    console.log(
      `✅ 통합 AI 분석 완료 [${sessionId}] - ${Date.now() - startTime}ms`
    );
    console.log(
      `📊 소스: AI(${sources.ai}) Prometheus(${sources.prometheus}) Python(${sources.python}) MCP(${sources.mcp}) Redis(${sources.redis})`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error(`❌ 통합 AI 분석 실패 [${sessionId}]:`, error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '통합 분석 실패',
        timestamp: new Date().toISOString(),
        sessionId,
        performance: {
          totalTime: Date.now() - startTime,
          failed: true,
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 📊 통합 시스템 상태 조회
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';

    switch (action) {
      case 'health':
        const healthData = await Promise.allSettled([
          realAIProcessor.healthCheck(),
          checkPythonService(),
          getMCPStatus(),
          checkRedisStatus(),
        ]);

        return NextResponse.json({
          success: true,
          timestamp: new Date().toISOString(),
          services: {
            ai:
              healthData[0].status === 'fulfilled'
                ? healthData[0].value
                : { status: 'error' },
            python:
              healthData[1].status === 'fulfilled'
                ? healthData[1].value
                : { status: 'error' },
            mcp:
              healthData[2].status === 'fulfilled'
                ? healthData[2].value
                : { status: 'error' },
            redis:
              healthData[3].status === 'fulfilled'
                ? healthData[3].value
                : { status: 'error' },
          },
          overall: healthData.every(h => h.status === 'fulfilled')
            ? 'healthy'
            : 'degraded',
        });

      case 'capabilities':
        return NextResponse.json({
          success: true,
          capabilities: {
            aiModels: [
              'gpt-3.5-turbo',
              'claude-3-haiku',
              'gemini-1.5-flash',
              'local-analyzer',
            ],
            dataCollectors: ['prometheus', 'system-metrics', 'docker'],
            analysisTypes: [
              'performance',
              'anomaly',
              'trend',
              'prediction',
              'optimization',
            ],
            integrations: ['python-backend', 'mcp-tools', 'redis-cache'],
            features: [
              'Real-time metrics collection',
              'AI-powered analysis',
              'Predictive analytics',
              'System optimization',
              'Anomaly detection',
              'Performance monitoring',
            ],
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json({
          success: true,
          status: 'running',
          version: '2.1.0',
          description: 'Unified AI Analysis System',
          endpoints: {
            'POST /api/v1/ai/unified': 'Unified AI analysis',
            'GET /api/v1/ai/unified?action=health': 'System health check',
            'GET /api/v1/ai/unified?action=capabilities': 'System capabilities',
          },
          timestamp: new Date().toISOString(),
        });
    }
  } catch (error) {
    console.error('❌ 통합 시스템 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '상태 조회 실패',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔧 유틸리티 함수들
 */
function generateCacheKey(request: UnifiedRequest): string {
  const keyData = {
    query: request.query.substring(0, 100),
    type: request.type,
    options: request.options,
    hour: Math.floor(Date.now() / (60 * 60 * 1000)), // 시간별 캐시
  };
  return `unified:${Buffer.from(JSON.stringify(keyData)).toString('base64').substring(0, 40)}`;
}

function getCachedResponse(key: string): UnifiedResponse | null {
  const cached = responseCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.response;
  }

  if (cached) {
    responseCache.delete(key);
  }

  return null;
}

function setCachedResponse(key: string, response: UnifiedResponse): void {
  responseCache.set(key, {
    response,
    timestamp: Date.now(),
  });

  // 캐시 크기 제한 (최대 100개)
  if (responseCache.size > 100) {
    const firstKey = responseCache.keys().next().value;
    if (firstKey) {
      responseCache.delete(firstKey);
    }
  }
}

function createFallbackAnalysis(query: string, metrics: any): any {
  return {
    intent: 'general_analysis',
    confidence: 0.5,
    summary: '기본 시스템 분석을 수행했습니다.',
    details: [
      '시스템이 정상적으로 작동 중입니다',
      metrics ? `현재 CPU: ${metrics.cpu?.usage || 0}%` : '메트릭 데이터 없음',
      '정기적인 모니터링을 계속하세요',
    ],
    actions: ['시스템 상태를 주기적으로 확인하세요'],
    urgency: 'low',
    model: 'fallback-analyzer',
  };
}

function generatePredictions(metrics: any, aiAnalysis: any): any {
  if (!metrics) return null;

  return {
    nextHour: {
      cpu: Math.max(
        0,
        Math.min(100, (metrics.cpu?.usage || 0) + (Math.random() - 0.5) * 10)
      ),
      memory: Math.max(
        0,
        Math.min(100, (metrics.memory?.usage || 0) + (Math.random() - 0.5) * 5)
      ),
      disk: Math.max(
        0,
        Math.min(100, (metrics.disk?.usage || 0) + (Math.random() - 0.5) * 2)
      ),
    },
    confidence: aiAnalysis.confidence || 0.6,
    basis: 'current-trends',
  };
}

function combineRecommendations(
  aiAnalysis: any,
  pythonAnalysis: any,
  mcpResults: any[]
): string[] {
  const recommendations = new Set<string>();

  // AI 분석 추천사항
  if (aiAnalysis?.actions) {
    aiAnalysis.actions.forEach((action: string) => recommendations.add(action));
  }

  // Python 분석 추천사항
  if (pythonAnalysis?.recommendations) {
    pythonAnalysis.recommendations.forEach((rec: string) =>
      recommendations.add(rec)
    );
  }

  // MCP 결과 기반 추천사항
  mcpResults.forEach(result => {
    if (result.result?.content) {
      recommendations.add('MCP 도구 결과를 바탕으로 시스템을 점검하세요');
    }
  });

  // 기본 추천사항
  if (recommendations.size === 0) {
    recommendations.add('시스템이 정상적으로 작동하고 있습니다');
    recommendations.add('정기적인 모니터링을 계속하세요');
  }

  return Array.from(recommendations).slice(0, 5);
}

async function checkPythonService(): Promise<any> {
  try {
    const pythonUrl =
      process.env.PYTHON_SERVICE_URL ||
      'https://openmanager-ai-python.onrender.com';
    const response = await fetch(`${pythonUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    if (response.ok) {
      return await response.json();
    }

    return { status: 'unavailable', message: 'Service not responding' };
  } catch (error) {
    return { status: 'error', message: 'Connection failed' };
  }
}

async function getMCPStatus(): Promise<any> {
  try {
    const mcpClient = getMCPClient();
    const status = mcpClient.getConnectionStatus();
    const stats = mcpClient.getStats();

    return {
      status: stats.isConnected ? 'connected' : 'disconnected',
      servers: stats.totalServers,
      tools: stats.totalTools,
    };
  } catch (error) {
    return { status: 'error', message: 'MCP client unavailable' };
  }
}

async function checkRedisStatus(): Promise<any> {
  try {
    const redis = await getRedisClient();
    if (redis) {
      await redis.ping();
      return { status: 'connected', type: 'redis' };
    }
    return { status: 'not_configured', type: 'memory' };
  } catch (error) {
    return { status: 'error', message: 'Redis connection failed' };
  }
}
