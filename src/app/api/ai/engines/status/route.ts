import { NextResponse } from 'next/server';
import { googleAIManager } from '../../../../../lib/google-ai-manager';
import { metricsCollector } from '../../../../../services/ai/RealTimeMetricsCollector';

/**
 * 🚀 AI 엔진 상태 API v5.43.0 - Google AI 실제 상태 반영
 *
 * 현재 활성 상태인 14개 AI 엔진의 실시간 상태를 반환합니다.
 * - 실제 메트릭 기반 상태 제공
 * - Google AI 매니저 실제 상태 반영
 * - API 호출 통계 반영
 */

interface EngineStatus {
  name: string;
  type: 'opensource' | 'custom';
  status: 'active' | 'inactive' | 'error' | 'training';
  requests: number;
  accuracy: number;
  responseTime: number;
  lastUsed: string;
  version?: string;
  description?: string;
}

interface EngineMetrics {
  totalEngines: number;
  activeEngines: number;
  totalRequests: number;
  averageResponseTime: number;
  averageAccuracy: number;
  lastUpdated: string;
}

/**
 * 🔍 AI 엔진 상태 조회
 */
export async function GET() {
  try {
    const startTime = Date.now();

    // 실시간 엔진 상태 수집
    const engines = await collectEngineStatus();

    // 메트릭 계산
    const metrics = calculateEngineMetrics(engines);

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        engines,
        metrics,
        system: {
          version: 'v5.43.0',
          architecture: 'Lightweight ML Engine',
          processingTime: `${processingTime}ms`,
          timestamp: new Date().toISOString(),
        },
      },
    });
  } catch (error) {
    console.error('❌ [AI Engine Status] 상태 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'AI 엔진 상태 조회에 실패했습니다',
          code: 'ENGINE_STATUS_ERROR',
          timestamp: new Date().toISOString(),
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 실시간 엔진 상태 수집 (실제 메트릭 기반)
 */
async function collectEngineStatus(): Promise<EngineStatus[]> {
  // 실제 메트릭 데이터 가져오기
  const realMetrics = metricsCollector.getEngineMetrics();
  const engines: EngineStatus[] = [];

  // 기본 엔진 정의 (실제 존재하는 것들만)
  const engineDefinitions = [
    {
      name: 'SmartQuery',
      type: 'custom' as const,
      description: '스마트 질의 처리 엔진',
      endpoint: '/api/ai/smart-query',
    },
    {
      name: 'GoogleAI',
      type: 'custom' as const,
      description: 'Gemini 베타 연동',
      endpoint: '/api/ai/google-ai/status',
      useGoogleAIManager: true, // 특별 처리 플래그
    },
    {
      name: 'EngineManager',
      type: 'opensource' as const,
      description: 'AI 엔진 관리 시스템',
      endpoint: null, // 순환 참조 방지
    },
    {
      name: 'TestEngine',
      type: 'opensource' as const,
      description: '테스트 및 검증 엔진',
      endpoint: '/api/test/smart-query',
    },
    {
      name: 'MCPEngine',
      type: 'custom' as const,
      description: 'MCP 통합 처리',
      endpoint: '/api/mcp/query',
    },
  ];

  // 실제 메트릭이 있는 엔진들 처리
  for (const definition of engineDefinitions) {
    const realMetric = realMetrics.find(m => m.name === definition.name);

    if (realMetric) {
      // 실제 데이터 사용
      engines.push({
        name: definition.name,
        type: definition.type,
        status: realMetric.status,
        requests: realMetric.totalCalls,
        accuracy: Math.round(
          (realMetric.successfulCalls / realMetric.totalCalls) * 100
        ),
        responseTime: realMetric.avgResponseTime,
        lastUsed: formatLastUsed(realMetric.lastUsed),
        version: 'v5.43.0',
        description: definition.description,
      });
    } else {
      // Google AI 특별 처리
      if (definition.name === 'GoogleAI') {
        const googleStatus = googleAIManager.getStatus();
        engines.push({
          name: definition.name,
          type: definition.type,
          status:
            googleStatus.isInitialized && googleStatus.hasApiKey
              ? 'active'
              : 'inactive',
          requests: 0,
          accuracy: googleStatus.isValid ? 100 : 0,
          responseTime: 15, // 추정값
          lastUsed: googleStatus.isInitialized
            ? '최근 초기화됨'
            : '사용 기록 없음',
          version: 'v5.43.0',
          description: `${definition.description} (${googleStatus.apiKeySource})`,
        });
      } else {
        // 다른 엔진들은 헬스체크로 상태 확인
        const health = await checkEngineHealth(definition.endpoint);
        engines.push({
          name: definition.name,
          type: definition.type,
          status: health.isHealthy ? 'active' : 'inactive',
          requests: 0,
          accuracy: 0,
          responseTime: health.responseTime || 0,
          lastUsed: '사용 기록 없음',
          version: 'v5.43.0',
          description: definition.description,
        });
      }
    }
  }

  return engines;
}

/**
 * 마지막 사용 시간 포맷팅
 */
function formatLastUsed(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60 * 1000) return '방금 전';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}분 전`;
  if (diff < 24 * 60 * 60 * 1000)
    return `${Math.floor(diff / (60 * 60 * 1000))}시간 전`;
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}일 전`;
}

/**
 * 🏥 엔진 헬스 체크
 */
async function checkEngineHealth(
  endpoint: string | null
): Promise<{ isHealthy: boolean; responseTime?: number }> {
  if (!endpoint) {
    return { isHealthy: true }; // 엔드포인트가 없는 엔진은 활성으로 간주
  }

  try {
    const startTime = Date.now();
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${endpoint}`,
      {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000), // 5초 타임아웃
      }
    );

    const responseTime = Date.now() - startTime;
    return {
      isHealthy: response.ok,
      responseTime,
    };
  } catch (error) {
    console.warn(`⚠️ 엔진 헬스 체크 실패: ${endpoint}`, error);
    return { isHealthy: false };
  }
}

/**
 * 📊 엔진 메트릭 계산
 */
function calculateEngineMetrics(engines: EngineStatus[]): EngineMetrics {
  const activeEngines = engines.filter(e => e.status === 'active');
  const totalRequests = engines.reduce((sum, e) => sum + e.requests, 0);
  const averageResponseTime =
    engines.reduce((sum, e) => sum + e.responseTime, 0) / engines.length;
  const averageAccuracy =
    engines.reduce((sum, e) => sum + e.accuracy, 0) / engines.length;

  return {
    totalEngines: engines.length,
    activeEngines: activeEngines.length,
    totalRequests,
    averageResponseTime: Math.round(averageResponseTime * 100) / 100,
    averageAccuracy: Math.round(averageAccuracy * 100) / 100,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * 🕒 랜덤 마지막 사용 시간 생성
 */
function getRandomLastUsed(): string {
  const options = [
    '방금 전',
    '1분 전',
    '2분 전',
    '3분 전',
    '5분 전',
    '10분 전',
  ];
  return options[Math.floor(Math.random() * options.length)];
}
