import { NextResponse } from 'next/server';
import { simulationEngine } from '../../../../services/simulationEngine';

/**
 * 🔍 시스템 상태 조회 API
 * GET /api/system/status
 * 시뮬레이션 엔진 및 전체 시스템 상태를 반환합니다
 */
export async function GET() {
  try {
    // 시뮬레이션 엔진 상태 조회
    const simulationState = simulationEngine.getState();
    const isRunning = simulationEngine.isRunning();
    const simulationSummary = simulationEngine.getSimulationSummary();
    
    // 기본 시스템 정보
    const systemStatus = {
      isRunning,
      startTime: simulationState.startTime,
      runtime: simulationState.startTime ? Date.now() - simulationState.startTime : 0,
      dataCount: simulationState.dataCount,
      activeScenarios: simulationState.activeScenarios || [],
      prometheusEnabled: simulationState.prometheusEnabled
    };

    // 실행 중일 때 상세 정보
    if (isRunning) {
      const servers = simulationEngine.getServers();
      
      // 서버 상태 분포 계산
      const statusDistribution = {
        healthy: servers.filter(s => s.status === 'healthy').length,
        warning: servers.filter(s => s.status === 'warning').length,
        critical: servers.filter(s => s.status === 'critical').length
      };

      // 환경별 분포 계산
      const envDistribution = {
        onpremise: servers.filter(s => s.environment === 'onpremise').length,
        aws: servers.filter(s => s.environment === 'aws').length,
        gcp: servers.filter(s => s.environment === 'gcp').length,
        kubernetes: servers.filter(s => s.environment === 'kubernetes').length
      };

      // 평균 메트릭 계산
      const avgMetrics = servers.length > 0 ? {
        cpu_usage: servers.reduce((sum, s) => sum + s.cpu_usage, 0) / servers.length,
        memory_usage: servers.reduce((sum, s) => sum + s.memory_usage, 0) / servers.length,
        disk_usage: servers.reduce((sum, s) => sum + s.disk_usage, 0) / servers.length,
        response_time: servers.reduce((sum, s) => sum + s.response_time, 0) / servers.length
      } : {
        cpu_usage: 0,
        memory_usage: 0,
        disk_usage: 0,
        response_time: 0
      };

      // 알림 통계 계산
      const allAlerts = servers.flatMap(s => s.alerts || []);
      const alertStats = {
        total: allAlerts.length,
        critical: allAlerts.filter(a => a.severity === 'critical').length,
        warning: allAlerts.filter(a => a.severity === 'warning').length,
        resolved: allAlerts.filter(a => a.resolved).length
      };

      return NextResponse.json({
        success: true,
        data: {
          system: systemStatus,
          simulation: simulationSummary,
          servers: {
            total: servers.length,
            byStatus: statusDistribution,
            byEnvironment: envDistribution,
            averageMetrics: {
              cpu_usage: Math.round(avgMetrics.cpu_usage * 100) / 100,
              memory_usage: Math.round(avgMetrics.memory_usage * 100) / 100,
              disk_usage: Math.round(avgMetrics.disk_usage * 100) / 100,
              response_time: Math.round(avgMetrics.response_time)
            }
          },
          alerts: alertStats,
          performance: {
            updateInterval: 8000, // 8초 간격
            totalMetrics: simulationSummary.totalMetrics,
            patternsEnabled: simulationSummary.patternsEnabled,
            activeFailures: simulationSummary.activeFailures
          },
          realtimeData: servers.map(server => ({
            id: server.id,
            hostname: server.hostname,
            status: server.status,
            cpu_usage: server.cpu_usage,
            memory_usage: server.memory_usage,
            disk_usage: server.disk_usage,
            response_time: server.response_time,
            alerts: server.alerts?.length || 0,
            last_updated: server.last_updated
          }))
        },
        timestamp: new Date().toISOString()
      });
    }

    // 중지 상태일 때 기본 정보만
    return NextResponse.json({
      success: true,
      data: {
        system: systemStatus,
        simulation: simulationSummary,
        servers: {
          total: 0,
          byStatus: { healthy: 0, warning: 0, critical: 0 },
          byEnvironment: { onpremise: 0, aws: 0, gcp: 0, kubernetes: 0 },
          averageMetrics: { cpu_usage: 0, memory_usage: 0, disk_usage: 0, response_time: 0 }
        },
        alerts: { total: 0, critical: 0, warning: 0, resolved: 0 },
        performance: {
          updateInterval: 0,
          totalMetrics: 0,
          patternsEnabled: simulationSummary.patternsEnabled,
          activeFailures: 0
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ 시스템 상태 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      message: '시스템 상태 조회에 실패했습니다.',
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}