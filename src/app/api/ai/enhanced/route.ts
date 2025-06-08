/**
 * 🚀 Enhanced AI API Route v2.0
 *
 * RealServerDataGenerator와 개선된 한국어 AI 엔진을 활용한 고도화된 API
 * - 실시간 서버 데이터 분석
 * - 한국어 자연어 쿼리 처리
 * - 다층적 시스템 인사이트 제공
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { koreanAIEngine } from '@/services/ai/korean-ai-engine';

// 요청 인터페이스
interface AIQueryRequest {
  query: string;
  type?: 'analysis' | 'query' | 'recommendation';
  context?: {
    serverId?: string;
    clusterId?: string;
    timeRange?: string;
  };
}

// 응답 인터페이스
interface AIResponse {
  success: boolean;
  data?: {
    query: string;
    response: string;
    analysis: any;
    insights: string[];
    recommendations: Array<{
      priority: 'high' | 'medium' | 'low';
      action: string;
      impact: string;
    }>;
    serverData: {
      totalServers: number;
      healthyServers: number;
      clusters: number;
      applications: number;
    };
  };
  error?: string;
  timestamp: string;
}

/**
 * POST /api/ai/enhanced
 * 향상된 AI 분석 요청 처리
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<AIResponse>> {
  try {
    const body: AIQueryRequest = await request.json();
    const { query, type = 'analysis', context } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: '유효한 쿼리를 입력해주세요.',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // 실제 서버 데이터 가져오기
    const dataGenerator = RealServerDataGenerator.getInstance();
    await dataGenerator.initialize();

    const servers = dataGenerator.getAllServers();
    const clusters = dataGenerator.getAllClusters();
    const applications = dataGenerator.getAllApplications();
    const summary = dataGenerator.getDashboardSummary();

    const realServerData = {
      servers,
      clusters,
      applications,
      summary,
    };

    // AI 엔진으로 쿼리 처리
    const aiResult = await koreanAIEngine.processQuery(query, realServerData);

    // 추가 인사이트 생성
    const insights = generateSystemInsights(servers, clusters, applications);
    const recommendations = generateRecommendations(servers, summary);

    const response: AIResponse = {
      success: true,
      data: {
        query,
        response: aiResult.response?.message || '분석이 완료되었습니다.',
        analysis: aiResult.analysis,
        insights,
        recommendations,
        serverData: {
          totalServers: servers.length,
          healthyServers: servers.filter(s => s.health.score > 80).length,
          clusters: clusters.length,
          applications: applications.length,
        },
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Enhanced AI API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '서버 내부 오류가 발생했습니다.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/enhanced
 * 시스템 상태 및 AI 엔진 정보 조회
 */
export async function GET(): Promise<NextResponse> {
  try {
    const dataGenerator = RealServerDataGenerator.getInstance();
    const servers = dataGenerator.getAllServers();
    const clusters = dataGenerator.getAllClusters();
    const applications = dataGenerator.getAllApplications();
    const engineStatus = koreanAIEngine.getEngineStatus();

    const systemStatus = {
      dataGenerator: {
        initialized: true,
        servers: servers.length,
        clusters: clusters.length,
        applications: applications.length,
        lastUpdate: new Date().toISOString(),
      },
      aiEngine: engineStatus,
      capabilities: [
        '한국어 자연어 쿼리 처리',
        '실시간 서버 데이터 분석',
        '다층적 시스템 인사이트',
        '성능 최적화 권장사항',
        '이상 징후 감지 및 알림',
      ],
      sampleQueries: [
        'CPU 사용률이 높은 서버를 찾아주세요',
        '메모리 부족 문제가 있는 서버가 있나요?',
        '시스템 전체 성능 상태는 어떤가요?',
        '오류가 많이 발생하는 서버를 알려주세요',
        '클러스터별 부하 분산 상태를 확인해주세요',
      ],
    };

    return NextResponse.json({
      success: true,
      data: systemStatus,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Enhanced AI 상태 조회 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '시스템 상태를 조회할 수 없습니다.',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 시스템 인사이트 생성
 */
function generateSystemInsights(
  servers: any[],
  clusters: any[],
  applications: any[]
): string[] {
  const insights: string[] = [];

  // 서버 상태 분석
  const totalServers = servers.length;
  const healthyServers = servers.filter(s => s.health.score > 80).length;
  const warningServers = servers.filter(
    s => s.health.score <= 80 && s.health.score > 50
  ).length;
  const criticalServers = servers.filter(s => s.health.score <= 50).length;

  if (totalServers > 0) {
    const healthyPercentage = Math.round((healthyServers / totalServers) * 100);
    insights.push(
      `전체 ${totalServers}대 서버 중 ${healthyPercentage}%가 정상 상태입니다.`
    );

    if (criticalServers > 0) {
      insights.push(
        `⚠️ ${criticalServers}대 서버가 임계 상태로 즉시 점검이 필요합니다.`
      );
    }

    if (warningServers > 0) {
      insights.push(
        `${warningServers}대 서버가 경고 상태로 모니터링이 필요합니다.`
      );
    }
  }

  // 리소스 사용률 분석
  if (servers.length > 0) {
    const avgCpu =
      servers.reduce((sum, s) => sum + s.metrics.cpu, 0) / servers.length;
    const avgMemory =
      servers.reduce((sum, s) => sum + s.metrics.memory, 0) / servers.length;

    if (avgCpu > 80) {
      insights.push(
        `평균 CPU 사용률이 ${avgCpu.toFixed(1)}%로 높습니다. 부하 분산을 고려해보세요.`
      );
    }

    if (avgMemory > 85) {
      insights.push(
        `평균 메모리 사용률이 ${avgMemory.toFixed(1)}%로 높습니다. 메모리 최적화가 필요합니다.`
      );
    }
  }

  // 클러스터 분석
  if (clusters.length > 0) {
    insights.push(
      `${clusters.length}개 클러스터가 운영 중이며 로드밸런싱이 활성화되어 있습니다.`
    );
  }

  // 애플리케이션 분석
  if (applications.length > 0) {
    const avgAvailability =
      applications.reduce((sum, app) => sum + app.performance.availability, 0) /
      applications.length;
    insights.push(
      `애플리케이션 평균 가용성은 ${avgAvailability.toFixed(1)}%입니다.`
    );
  }

  return insights;
}

/**
 * 권장사항 생성
 */
function generateRecommendations(
  servers: any[],
  summary: any
): Array<{
  priority: 'high' | 'medium' | 'low';
  action: string;
  impact: string;
}> {
  const recommendations = [];

  // 고사용률 서버 체크
  const highCpuServers = servers.filter(s => s.metrics.cpu > 85);
  if (highCpuServers.length > 0) {
    recommendations.push({
      priority: 'high' as const,
      action: `${highCpuServers.length}대 서버의 CPU 사용률이 85%를 초과했습니다. 프로세스 최적화 또는 스케일링을 고려하세요.`,
      impact: '시스템 응답성 및 안정성 향상',
    });
  }

  // 메모리 부족 서버 체크
  const highMemoryServers = servers.filter(s => s.metrics.memory > 90);
  if (highMemoryServers.length > 0) {
    recommendations.push({
      priority: 'high' as const,
      action: `${highMemoryServers.length}대 서버의 메모리 사용률이 90%를 초과했습니다. 메모리 증설 또는 캐시 최적화가 필요합니다.`,
      impact: '메모리 부족으로 인한 시스템 중단 방지',
    });
  }

  // 디스크 공간 부족 체크
  const highDiskServers = servers.filter(s => s.metrics.disk > 85);
  if (highDiskServers.length > 0) {
    recommendations.push({
      priority: 'medium' as const,
      action: `${highDiskServers.length}대 서버의 디스크 사용률이 85%를 초과했습니다. 불필요한 파일 정리 또는 스토리지 확장을 고려하세요.`,
      impact: '디스크 공간 부족으로 인한 서비스 중단 방지',
    });
  }

  // 오류율 높은 서버 체크
  const highErrorServers = servers.filter(s => s.metrics.errors > 10);
  if (highErrorServers.length > 0) {
    recommendations.push({
      priority: 'high' as const,
      action: `${highErrorServers.length}대 서버에서 높은 오류율이 감지되었습니다. 로그 분석 및 애플리케이션 점검이 필요합니다.`,
      impact: '서비스 품질 및 사용자 경험 개선',
    });
  }

  // 저사용률 서버 체크 (비용 최적화)
  const lowUtilizationServers = servers.filter(
    s => s.metrics.cpu < 20 && s.metrics.memory < 30
  );
  if (lowUtilizationServers.length > 2) {
    recommendations.push({
      priority: 'low' as const,
      action: `${lowUtilizationServers.length}대 서버의 리소스 사용률이 낮습니다. 워크로드 통합을 통한 비용 최적화를 고려해보세요.`,
      impact: '인프라 비용 절감 및 효율성 향상',
    });
  }

  return recommendations;
}
