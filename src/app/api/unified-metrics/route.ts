/**
 * 🔧 통합 메트릭 API 엔드포인트 v2.0
 *
 * UnifiedDataGeneratorModule 기반으로 완전 리팩토링
 * - OpenManager 스타일 전처리 데이터 사용
 * - 4개 전략 (real, optimized, advanced, realistic) 지원
 * - Redis 24시간 히스토리 통합
 * - UI/AI 데이터 모두 제공
 */

import { unifiedDataGenerator } from '@/services/data-generator/UnifiedDataGeneratorModule';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log(
      '🔍 API /unified-metrics 요청 처리 시작 (통합 데이터 생성기 v6.1 사용)'
    );

    // 통합 데이터 생성기 초기화 및 전처리된 데이터 가져오기
    await unifiedDataGenerator.initialize();
    const processedData = await unifiedDataGenerator.generateProcessedData();

    console.log(
      `📊 전처리된 서버 데이터: ${processedData.dashboardData.servers.length}개`
    );
    console.log(`🎯 사용된 전략: ${processedData.metadata.strategy}`);

    // 🛡️ 안전한 서버 데이터 변환 (기존 API 호환성 유지)
    const servers = processedData.dashboardData.servers.map(server => {
      try {
        // EnhancedServerMetrics 형태로 변환
        return {
          id: server.id,
          name: server.name,
          hostname: server.hostname || server.name,
          status: server.status,
          environment: server.environment,
          role: server.role || 'worker',
          cpu_usage: server.cpu,
          memory_usage: server.memory,
          disk_usage: server.disk,
          network_in: server.network || 0,
          network_out: server.network || 0,
          response_time: Math.floor(Math.random() * 100) + 50, // 50-150ms
          uptime: server.uptime || 0,
          last_updated:
            server.lastUpdate?.toISOString() || new Date().toISOString(),
          alerts: Array.isArray(server.alerts) ? server.alerts : [],
          timestamp: new Date().toISOString(),
        };
      } catch (conversionError) {
        console.error('❌ 서버 변환 실패:', server.id, conversionError);
        // 폴백 데이터 반환
        return {
          id: server.id || `server-${Date.now()}`,
          name: server.name || 'Unknown Server',
          hostname: server.name || 'unknown',
          status: server.status || 'offline',
          environment: server.environment || 'production',
          role: 'worker',
          cpu_usage: server.cpu || 0,
          memory_usage: server.memory || 0,
          disk_usage: server.disk || 0,
          network_in: 0,
          network_out: 0,
          response_time: 100,
          uptime: 0,
          last_updated: new Date().toISOString(),
          alerts: [],
          timestamp: new Date().toISOString(),
        };
      }
    });

    // 현재 시간
    const timestamp = new Date().toISOString();

    // 기존 API와 호환되는 통계 (전처리된 통계 사용)
    const stats = processedData.dashboardData.stats;

    console.log(`✅ 통합 메트릭 서버 데이터 반환: ${servers.length}개`);
    console.log(
      `📊 상태 분포: 정상 ${stats.healthy}, 경고 ${stats.warning}, 심각 ${stats.critical}`
    );

    const unifiedMetrics = {
      servers: servers, // 🎯 실제 서버 배열 반환
      system: {
        uptime: '15일 7시간 23분',
        totalRequests: 1247892,
        errorRate: 0.003,
        responseTime: 145,
        throughput: 2847,
      },
      stats: {
        total: stats.total,
        active: stats.healthy, // healthy를 active로 매핑
        warning: stats.warning,
        critical: stats.critical + stats.offline, // critical + offline을 critical로 통합
        averageCpu: stats.averageCpu,
        averageMemory: stats.averageMemory,
        averageDisk: stats.averageDisk,
      },
      alerts: {
        total: servers.reduce((sum, s) => sum + (s.alerts?.length || 0), 0),
        critical: servers.reduce(
          (sum, s) =>
            sum +
            (s.alerts?.filter(
              a => a.severity === 'critical' || a.severity === 'high'
            ).length || 0),
          0
        ),
        warning: servers.reduce(
          (sum, s) =>
            sum +
            (s.alerts?.filter(
              a => a.severity === 'warning' || a.severity === 'medium'
            ).length || 0),
          0
        ),
        info: servers.reduce(
          (sum, s) =>
            sum +
            (s.alerts?.filter(
              a => a.severity === 'info' || a.severity === 'low'
            ).length || 0),
          0
        ),
        resolved: 156,
      },
      performance: {
        cpuTrend:
          stats.averageCpu > 80
            ? 'high'
            : stats.averageCpu > 50
              ? 'increasing'
              : 'stable',
        memoryTrend:
          stats.averageMemory > 80
            ? 'high'
            : stats.averageMemory > 50
              ? 'increasing'
              : 'stable',
        diskTrend:
          stats.averageDisk > 80
            ? 'high'
            : stats.averageDisk > 50
              ? 'increasing'
              : 'stable',
        networkTrend: 'stable',
      },
      timestamp,
      source: 'unified-data-generator-v6.1',
      strategy: processedData.metadata.strategy,
      version: '2.0.0',
      metadata: processedData.metadata,
    };

    return NextResponse.json({
      success: true,
      servers: servers, // 🎯 최상위 레벨에서도 서버 배열 제공
      data: unifiedMetrics,
      timestamp,
      // 추가 정보 (필요시 사용)
      aiData: processedData.aiData,
      rawData: processedData.rawData.slice(0, 5), // 처음 5개만
    });
  } catch (error) {
    console.error('❌ 통합 메트릭 조회 실패:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '통합 메트릭 조회 실패',
        servers: [], // 🛡️ 오류 시에도 빈 배열 보장
        timestamp: new Date().toISOString(),
        source: 'unified-data-generator-v6.1-error',
      },
      { status: 500 }
    );
  }
}
