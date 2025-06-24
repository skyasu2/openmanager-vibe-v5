/**
 * 통합 메트릭 API 엔드포인트 v3.0 - 데이터 일치성 보장
 *
 * ✅ RealServerDataGenerator 기반으로 수정 (대시보드와 동일한 데이터 소스)
 * - 데이터 일치성 보장을 위해 UnifiedDataGeneratorModule 대신 RealServerDataGenerator 사용
 * - /api/dashboard와 동일한 서버 데이터 제공
 * - 서버 모니터링 프론트엔드 일관성 보장
 */

import { RealServerDataGenerator } from '@/services/data-generator/RealServerDataGenerator';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log(
      '🔍 API /unified-metrics 요청 처리 시작 (RealServerDataGenerator 사용 - 데이터 일치성 보장)'
    );

    // ✅ 대시보드와 동일한 데이터 생성기 사용
    const realGenerator = RealServerDataGenerator.getInstance();
    await realGenerator.initialize();

    // 서버 데이터 가져오기 (대시보드와 동일한 방식)
    const servers = realGenerator.getAllServers();
    const serverArray = Array.from(servers.values());

    console.log(
      `📊 RealServerDataGenerator 서버 데이터: ${serverArray.length}개 (대시보드와 일치)`
    );

    // URL 파라미터 처리
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'enhanced';
    const limit = parseInt(searchParams.get('limit') || '0');

    // 서버 데이터를 EnhancedServerMetrics 형태로 변환
    let processedServers = serverArray.map(server => ({
      id: server.id,
      name: server.name,
      hostname: server.name,
      environment: server.environment,
      role: server.role,
      status:
        server.status === 'running'
          ? 'healthy'
          : server.status === 'warning'
            ? 'warning'
            : server.status === 'error'
              ? 'critical'
              : 'offline',
      cpu_usage: server.metrics?.cpu || 0,
      memory_usage: server.metrics?.memory || 0,
      disk_usage: server.metrics?.disk || 0,
      network_in: server.metrics?.network?.in || 0,
      network_out: server.metrics?.network?.out || 0,
      response_time: Math.random() * 100 + 50, // 50-150ms
      uptime: server.metrics?.uptime || 0,
      last_updated: new Date().toISOString(),
      alerts: [],
      // 추가 필드들
      network_usage:
        ((server.metrics?.network?.in || 0) +
          (server.metrics?.network?.out || 0)) /
        1024 /
        1024, // MB
      timestamp: new Date().toISOString(),
      currentLoad: (server.metrics?.cpu || 0) / 100,
      activeFailures: 0,
    }));

    // 제한 적용
    if (limit > 0) {
      processedServers = processedServers.slice(0, limit);
    }

    // 통계 계산 (대시보드와 동일한 방식)
    const totalServers = processedServers.length;
    const healthyServers = processedServers.filter(
      s => s.status === 'healthy'
    ).length;
    const warningServers = processedServers.filter(
      s => s.status === 'warning'
    ).length;
    const criticalServers = processedServers.filter(
      s => s.status === 'critical'
    ).length;
    const offlineServers = processedServers.filter(
      s => s.status === 'offline'
    ).length;

    const avgCpu =
      totalServers > 0
        ? processedServers.reduce((sum, s) => sum + s.cpu_usage, 0) /
          totalServers
        : 0;
    const avgMemory =
      totalServers > 0
        ? processedServers.reduce((sum, s) => sum + s.memory_usage, 0) /
          totalServers
        : 0;
    const avgDisk =
      totalServers > 0
        ? processedServers.reduce((sum, s) => sum + s.disk_usage, 0) /
          totalServers
        : 0;

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'RealServerDataGenerator', // 데이터 소스 명시
      dataConsistency: 'dashboard-aligned', // 일치성 보장 표시
      data: processedServers,
      summary: {
        total: totalServers,
        healthy: healthyServers,
        warning: warningServers,
        critical: criticalServers,
        offline: offlineServers,
        healthyPercent:
          totalServers > 0
            ? ((healthyServers / totalServers) * 100).toFixed(1)
            : '0',
        warningPercent:
          totalServers > 0
            ? ((warningServers / totalServers) * 100).toFixed(1)
            : '0',
        criticalPercent:
          totalServers > 0
            ? ((criticalServers / totalServers) * 100).toFixed(1)
            : '0',
        avgCpu: avgCpu.toFixed(1),
        avgMemory: avgMemory.toFixed(1),
        avgDisk: avgDisk.toFixed(1),
      },
      metadata: {
        format,
        limit: limit || 'unlimited',
        generationTime: Date.now(),
        version: '3.0.0',
        dataSource: 'RealServerDataGenerator',
        consistencyGuarantee: 'dashboard-aligned',
      },
    };

    console.log(
      `✅ 통합 메트릭 API 응답 완료: ${totalServers}개 서버 (대시보드 일치 보장)`
    );
    console.log(
      `📊 상태 분포: 정상 ${healthyServers}개, 경고 ${warningServers}개, 심각 ${criticalServers}개`
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ 통합 메트릭 API 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        source: 'RealServerDataGenerator',
      },
      { status: 500 }
    );
  }
}
