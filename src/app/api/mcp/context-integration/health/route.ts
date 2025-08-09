/**
 * 🏥 MCP 서버 헬스체크 API
 *
 * 로컬 MCP 서버 상태 실시간 모니터링
 *
 * GET /api/mcp/context-integration/health
 */

import { CloudContextLoader } from '@/services/mcp/CloudContextLoader';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// 🔒 타입 안전성을 위한 인터페이스 정의
interface MCPServerInfo {
  url: string;
  status: 'online' | 'degraded' | 'offline';
  lastChecked: string;
  responseTime: number;
  version: string;
  capabilities: string[];
}

interface ContextCacheInfo {
  hitRate: number;
}

interface RAGIntegrationInfo {
  enabled: boolean;
  syncCount: number;
}

interface PerformanceInfo {
  // Add specific performance properties as needed
  [key: string]: unknown;
}

interface IntegratedStatus {
  mcpServer: MCPServerInfo;
  contextCache: ContextCacheInfo;
  ragIntegration: RAGIntegrationInfo;
  performance: PerformanceInfo;
}

interface ConnectivityTest {
  success: boolean;
  tests: Array<{
    name: string;
    status: 'pass' | 'fail';
    duration: number;
    message?: string;
  }>;
}

interface HealthAlert {
  level: 'info' | 'warning' | 'error';
  message: string;
  action?: string;
}

export async function GET(_request: NextRequest) {
  try {
    console.log('🏥 MCP 서버 헬스체크 시작...');

    const cloudContextLoader = CloudContextLoader.getInstance();
    const integratedStatus = await cloudContextLoader.getIntegratedStatus();

    const mcpServerInfo = integratedStatus.mcpServer;
    
    // 안전한 서버 정보 (version과 capabilities가 undefined일 수 있으므로 기본값 제공)
    const safeServerInfo: MCPServerInfo = {
      ...mcpServerInfo,
      version: mcpServerInfo.version ?? 'unknown',
      capabilities: mcpServerInfo.capabilities ?? [],
    };

    // 안전한 통합 상태 (safeServerInfo 사용)
    const safeIntegratedStatus: IntegratedStatus = {
      ...integratedStatus,
      mcpServer: safeServerInfo,
    };

    // 상세 헬스 정보 구성
    const healthDetails = {
      server: {
        url: mcpServerInfo.url,
        status: mcpServerInfo.status,
        lastChecked: mcpServerInfo.lastChecked,
        responseTime: mcpServerInfo.responseTime,
        version: mcpServerInfo.version,
        capabilities: mcpServerInfo.capabilities,
      },
      connectivity: {
        isOnline: mcpServerInfo.status === 'online',
        isDegraded: mcpServerInfo.status === 'degraded',
        isOffline: mcpServerInfo.status === 'offline',
        responseTimeCategory: categorizeResponseTime(
          mcpServerInfo.responseTime
        ),
      },
      integration: {
        contextCache: integratedStatus.contextCache,
        ragIntegration: integratedStatus.ragIntegration,
        performance: integratedStatus.performance,
      },
      recommendations: generateHealthRecommendations(
        safeServerInfo,
        safeIntegratedStatus
      ),
    };

    // 헬스 점수 계산 (0-100)
    const healthScore = calculateHealthScore(safeServerInfo, safeIntegratedStatus);

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      healthScore,
      status: mcpServerInfo.status,
      details: healthDetails,
      alerts: generateHealthAlerts(safeServerInfo, safeIntegratedStatus),
      nextCheckIn: getNextCheckTime(),
      troubleshooting: {
        commonIssues: [
          {
            issue: 'MCP 서버 오프라인',
            symptoms: ['status: offline', 'responseTime: -1'],
            solutions: [
              '네트워크 연결 확인',
              'Google Cloud VM 인스턴스 상태 확인',
              'MCP 서버 프로세스 재시작',
            ],
          },
          {
            issue: '응답 시간 지연',
            symptoms: ['responseTime > 5000ms', 'status: degraded'],
            solutions: [
              '서버 리소스 사용량 확인',
              '네트워크 대역폭 확인',
              'MCP 서버 최적화',
            ],
          },
          {
            issue: 'RAG 동기화 실패',
            symptoms: ['syncCount: 0', 'ragIntegration.enabled: false'],
            solutions: [
              'RAG 엔진 상태 확인',
              '컨텍스트 수동 동기화 실행',
              '통합 설정 재구성',
            ],
          },
        ],
      },
    };

    console.log(
      `✅ MCP 헬스체크 완료: ${mcpServerInfo.status} (점수: ${healthScore})`
    );

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=15', // 15초 캐싱 (빠른 업데이트)
      },
    });
  } catch (error) {
    console.error('❌ MCP 헬스체크 실패:', error);

    return NextResponse.json(
      {
        success: false,
        healthScore: 0,
        status: 'error',
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        recommendations: [
          'CloudContextLoader 초기화 상태 확인',
          'MCP 서버 연결 설정 확인',
          '시스템 로그 검토',
        ],
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 강제 헬스체크 실행
 *
 * POST /api/mcp/context-integration/health
 */
export async function POST(_request: NextRequest) {
  try {
    console.log('🔄 강제 MCP 헬스체크 실행...');

    const body = await _request.json();
    const { includeDetailed = true, testConnectivity = true } = body;

    const cloudContextLoader = CloudContextLoader.getInstance();

    // 강제 캐시 무효화로 최신 상태 강제 조회
    cloudContextLoader.invalidateCache();

    // 연결 테스트 추가 실행
    let connectivityTest: ConnectivityTest | null = null;
    if (testConnectivity) {
      connectivityTest = await performConnectivityTest(cloudContextLoader);
    }

    // 업데이트된 상태 조회
    const integratedStatus = await cloudContextLoader.getIntegratedStatus();

    // 안전한 서버 정보 생성 (이 스코프에서도)
    const localSafeServerInfo: MCPServerInfo = {
      ...integratedStatus.mcpServer,
      version: integratedStatus.mcpServer.version ?? 'unknown',
      capabilities: integratedStatus.mcpServer.capabilities ?? [],
    };

    const localSafeIntegratedStatus: IntegratedStatus = {
      ...integratedStatus,
      mcpServer: localSafeServerInfo,
    };

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      forcedCheck: true,
      healthScore: calculateHealthScore(
        localSafeServerInfo,
        localSafeIntegratedStatus
      ),
      status: localSafeServerInfo.status,
      details: includeDetailed
        ? {
            server: localSafeServerInfo,
            integration: {
              contextCache: integratedStatus.contextCache,
              ragIntegration: integratedStatus.ragIntegration,
              performance: integratedStatus.performance,
            },
            connectivityTest,
          }
        : undefined,
      summary: generateHealthSummary(localSafeServerInfo),
    };

    console.log(`✅ 강제 헬스체크 완료: ${localSafeServerInfo.status}`);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache', // 강제 체크는 캐싱하지 않음
      },
    });
  } catch (error) {
    console.error('❌ 강제 헬스체크 실패:', error);

    return NextResponse.json(
      {
        success: false,
        forcedCheck: true,
        healthScore: 0,
        status: 'error',
        error: 'Forced health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 응답 시간 카테고리 분류
 */
function categorizeResponseTime(responseTime: number): string {
  if (responseTime < 0) return 'error';
  if (responseTime < 500) return 'excellent';
  if (responseTime < 1000) return 'good';
  if (responseTime < 3000) return 'fair';
  if (responseTime < 5000) return 'poor';
  return 'critical';
}

/**
 * 헬스 점수 계산 (0-100)
 */
function calculateHealthScore(
  mcpServerInfo: MCPServerInfo,
  integratedStatus: IntegratedStatus
): number {
  let score = 0;

  // 기본 연결 상태 (40점)
  if (mcpServerInfo.status === 'online') score += 40;
  else if (mcpServerInfo.status === 'degraded') score += 20;

  // 응답 시간 (30점)
  const responseTime = mcpServerInfo.responseTime;
  if (responseTime > 0) {
    if (responseTime < 500) score += 30;
    else if (responseTime < 1000) score += 25;
    else if (responseTime < 3000) score += 15;
    else if (responseTime < 5000) score += 5;
  }

  // 캐시 성능 (15점)
  const hitRate = integratedStatus.contextCache.hitRate;
  if (hitRate > 80) score += 15;
  else if (hitRate > 60) score += 10;
  else if (hitRate > 40) score += 5;

  // RAG 통합 (15점)
  if (integratedStatus.ragIntegration.enabled) {
    score += 10;
    if (integratedStatus.ragIntegration.syncCount > 0) score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * 헬스 경고 생성
 */
function generateHealthAlerts(
  mcpServerInfo: MCPServerInfo,
  integratedStatus: IntegratedStatus
): HealthAlert[] {
  const alerts = [];

  if (mcpServerInfo.status === 'offline') {
    alerts.push({
      level: 'error' as const,
      message: 'MCP 서버가 오프라인 상태입니다',
      action: '로컬 MCP 서버 프로세스 상태 확인 필요',
    });
  }

  if (mcpServerInfo.status === 'degraded') {
    alerts.push({
      level: 'warning' as const,
      message: 'MCP 서버 응답이 지연되고 있습니다',
      action: '서버 리소스 및 네트워크 상태 점검 권장',
    });
  }

  if (mcpServerInfo.responseTime > 3000) {
    alerts.push({
      level: 'warning' as const,
      message: `응답 시간이 느립니다 (${mcpServerInfo.responseTime}ms)`,
      action: '성능 최적화 검토 필요',
    });
  }

  if (integratedStatus.contextCache.hitRate < 50) {
    alerts.push({
      level: 'warning' as const,
      message: `캐시 히트율이 낮습니다 (${integratedStatus.contextCache.hitRate}%)`,
      action: '캐시 설정 최적화 고려',
    });
  }

  if (!integratedStatus.ragIntegration.enabled) {
    alerts.push({
      level: 'info' as const,
      message: 'RAG 통합이 비활성화되어 있습니다',
      action: 'RAG 엔진 통합 활성화 고려',
    });
  }

  return alerts;
}

/**
 * 헬스 권장사항 생성
 */
function generateHealthRecommendations(
  mcpServerInfo: MCPServerInfo,
  integratedStatus: IntegratedStatus
): string[] {
  const recommendations = [];

  if (mcpServerInfo.status === 'online' && mcpServerInfo.responseTime < 1000) {
    recommendations.push('시스템이 정상적으로 작동하고 있습니다');
  }

  if (mcpServerInfo.responseTime > 1000) {
    recommendations.push('응답 시간 개선을 위해 서버 최적화를 고려하세요');
  }

  if (integratedStatus.contextCache.hitRate > 80) {
    recommendations.push('캐시 성능이 우수합니다');
  } else {
    recommendations.push('캐시 설정을 최적화하여 성능을 향상시킬 수 있습니다');
  }

  if (
    integratedStatus.ragIntegration.enabled &&
    integratedStatus.ragIntegration.syncCount > 0
  ) {
    recommendations.push('RAG 통합이 잘 작동하고 있습니다');
  } else if (!integratedStatus.ragIntegration.enabled) {
    recommendations.push(
      'RAG 엔진 통합을 활성화하면 더 나은 컨텍스트 제공이 가능합니다'
    );
  }

  return recommendations;
}

/**
 * 다음 헬스체크 시간 조회
 */
function getNextCheckTime(): string {
  const now = new Date();
  const nextCheck = new Date(now.getTime() + 30000); // 30초 후
  return nextCheck.toISOString();
}

/**
 * 연결 테스트 수행
 */
async function performConnectivityTest(cloudContextLoader: CloudContextLoader): Promise<ConnectivityTest> {
  const tests = [];

  // 기본 연결 테스트
  const basicTest = await testBasicConnection(cloudContextLoader);
  tests.push(basicTest);

  // 컨텍스트 조회 테스트
  const contextTest = await testContextQuery(cloudContextLoader);
  tests.push(contextTest);

  return {
    success: tests.every((test) => test.status === 'pass'),
    tests,
  };
}

async function testBasicConnection(cloudContextLoader: CloudContextLoader) {
  const startTime = Date.now();
  try {
    // 기본 헬스체크 엔드포인트 테스트
    await cloudContextLoader['checkMCPServerHealth']();
    return {
      name: '기본 연결',
      status: 'pass' as const,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name: '기본 연결',
      status: 'fail' as const,
      duration: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testContextQuery(cloudContextLoader: CloudContextLoader) {
  const startTime = Date.now();
  try {
    // 간단한 컨텍스트 조회 테스트
    const result = await cloudContextLoader.queryMCPContextForRAG(
      '테스트 쿼리',
      {
        maxFiles: 1,
        includeSystemContext: false,
      }
    );
    return {
      name: '컨텍스트 조회',
      status: result ? ('pass' as const) : ('fail' as const),
      duration: Date.now() - startTime,
      message: result ? undefined : '컨텍스트 조회 실패',
    };
  } catch (error) {
    return {
      name: '컨텍스트 조회',
      status: 'fail' as const,
      duration: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * 헬스 요약 생성
 */
function generateHealthSummary(mcpServerInfo: MCPServerInfo): string {
  const status = mcpServerInfo.status;
  const responseTime = mcpServerInfo.responseTime;

  if (status === 'online') {
    if (responseTime < 1000) {
      return '🟢 MCP 서버가 정상적으로 작동하고 있습니다';
    } else {
      return '🟡 MCP 서버는 온라인이지만 응답이 다소 느립니다';
    }
  } else if (status === 'degraded') {
    return '🟡 MCP 서버가 성능 저하 상태입니다';
  } else {
    return '🔴 MCP 서버가 오프라인 상태입니다';
  }
}
