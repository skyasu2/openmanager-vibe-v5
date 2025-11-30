/**
 * 📈 Unified Metrics Manager Performance Monitor
 *
 * Performance monitoring and optimization functionality:
 * - System performance tracking
 * - Memory usage monitoring
 * - Performance metrics reporting
 * - Optimization recommendations
 */

import type {
  MetricsPerformanceData,
  UnifiedServerMetrics,
} from './UnifiedMetricsManager.types';

export class PerformanceMonitor {
  /**
   * 📈 Monitor system performance
   */
  static async monitorPerformance(
    serversSize: number,
    metrics: MetricsPerformanceData
  ): Promise<void> {
    const memoryUsage = process.memoryUsage();

    const performanceReport = {
      servers_count: serversSize,
      total_updates: metrics.total_updates,
      avg_processing_time: `${metrics.avg_processing_time.toFixed(2)}ms`,
      errors_count: metrics.errors_count,
      ai_analysis_count: metrics.ai_analysis_count,
      scaling_decisions: metrics.scaling_decisions,
      memory_heap_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      memory_external_mb: Math.round(memoryUsage.external / 1024 / 1024),
    };

    console.log('📈 통합 메트릭 관리자 성능:', performanceReport);

    // Performance warnings
    PerformanceMonitor.checkPerformanceWarnings(performanceReport);
  }

  /**
   * ⚠️ Check for performance warnings
   */
  static checkPerformanceWarnings(report: {
    servers_count: number;
    avg_processing_time: string;
    errors_count: number;
    memory_heap_mb: number;
    memory_external_mb: number;
  }): void {
    const processingTime = parseFloat(report.avg_processing_time);

    if (processingTime > 500) {
      console.warn(
        '⚠️ 평균 처리 시간이 500ms를 초과했습니다:',
        `${processingTime}ms`
      );
    }

    if (report.memory_heap_mb > 100) {
      console.warn(
        '⚠️ 힙 메모리 사용량이 높습니다:',
        `${report.memory_heap_mb}MB`
      );
    }

    if (report.errors_count > 10) {
      console.warn('⚠️ 에러 발생 수가 높습니다:', report.errors_count);
    }
  }

  /**
   * 📊 Generate comprehensive performance report
   */
  static generatePerformanceReport(
    servers: Map<string, UnifiedServerMetrics>,
    metrics: MetricsPerformanceData
  ): {
    system: {
      totalServers: number;
      uptime: string;
      memoryUsage: NodeJS.MemoryUsage;
      performanceScore: number;
    };
    metrics: {
      totalUpdates: number;
      avgProcessingTime: number;
      errorsCount: number;
      aiAnalysisCount: number;
      scalingDecisions: number;
      lastUpdate: string;
    };
    servers: {
      healthy: number;
      warning: number;
      critical: number;
      avgCpu: number;
      avgMemory: number;
      totalRequests: number;
    };
    recommendations: string[];
  } {
    const memoryUsage = process.memoryUsage();
    const serverList = Array.from(servers.values());

    // Calculate server statistics
    const healthyCount = serverList.filter(
      (s) => s.status === 'healthy'
    ).length;
    const warningCount = serverList.filter(
      (s) => s.status === 'warning'
    ).length;
    const criticalCount = serverList.filter(
      (s) => s.status === 'critical'
    ).length;

    const avgCpu =
      serverList.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) /
        serverList.length || 0;
    const avgMemory =
      serverList.reduce((sum, s) => sum + s.node_memory_usage_percent, 0) /
        serverList.length || 0;
    const totalRequests = serverList.reduce(
      (sum, s) => sum + s.http_requests_total,
      0
    );

    // Calculate performance score (0-100)
    let performanceScore = 100;
    if (metrics.avg_processing_time > 100) performanceScore -= 10;
    if (metrics.avg_processing_time > 500) performanceScore -= 20;
    if (metrics.errors_count > 5) performanceScore -= 15;
    if (metrics.errors_count > 20) performanceScore -= 25;
    if (criticalCount > 0) performanceScore -= criticalCount * 10;
    performanceScore = Math.max(0, performanceScore);

    // Generate recommendations
    const recommendations = PerformanceMonitor.generateRecommendations({
      avgProcessingTime: metrics.avg_processing_time,
      errorsCount: metrics.errors_count,
      memoryHeap: memoryUsage.heapUsed / 1024 / 1024,
      criticalServers: criticalCount,
      avgCpu,
      avgMemory,
    });

    return {
      system: {
        totalServers: serverList.length,
        uptime: process.uptime()
          ? `${Math.floor(process.uptime() / 3600)}시간`
          : 'N/A',
        memoryUsage,
        performanceScore,
      },
      metrics: {
        totalUpdates: metrics.total_updates,
        avgProcessingTime: metrics.avg_processing_time,
        errorsCount: metrics.errors_count,
        aiAnalysisCount: metrics.ai_analysis_count,
        scalingDecisions: metrics.scaling_decisions,
        lastUpdate: new Date(metrics.last_update).toISOString(),
      },
      servers: {
        healthy: healthyCount,
        warning: warningCount,
        critical: criticalCount,
        avgCpu: Number(avgCpu.toFixed(1)),
        avgMemory: Number(avgMemory.toFixed(1)),
        totalRequests,
      },
      recommendations,
    };
  }

  /**
   * 💡 Generate performance optimization recommendations
   */
  static generateRecommendations(params: {
    avgProcessingTime: number;
    errorsCount: number;
    memoryHeap: number;
    criticalServers: number;
    avgCpu: number;
    avgMemory: number;
  }): string[] {
    const recommendations: string[] = [];

    if (params.avgProcessingTime > 500) {
      recommendations.push(
        '평균 처리 시간이 길어 배치 처리 크기를 줄이는 것을 고려하세요.'
      );
    }

    if (params.memoryHeap > 150) {
      recommendations.push(
        '메모리 사용량이 높아 가비지 컬렉션 최적화를 고려하세요.'
      );
    }

    if (params.errorsCount > 10) {
      recommendations.push('에러 발생률이 높아 에러 처리 로직을 점검하세요.');
    }

    if (params.criticalServers > 2) {
      recommendations.push(
        `${params.criticalServers}개 서버가 위험 상태입니다. 즉시 점검이 필요합니다.`
      );
    }

    if (params.avgCpu > 80) {
      recommendations.push(
        '평균 CPU 사용률이 높습니다. 자동 스케일링 설정을 확인하세요.'
      );
    }

    if (params.avgMemory > 85) {
      recommendations.push(
        '평균 메모리 사용률이 높습니다. 메모리 누수를 점검하세요.'
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('시스템이 정상적으로 운영되고 있습니다.');
    }

    return recommendations;
  }

  /**
   * 📊 Calculate system efficiency metrics
   */
  static calculateSystemEfficiency(
    servers: UnifiedServerMetrics[],
    _metrics: MetricsPerformanceData
  ): {
    overallEfficiency: number;
    resourceUtilization: number;
    responseTimeEfficiency: number;
    errorRateEfficiency: number;
    uptimeEfficiency: number;
    bottlenecks: string[];
  } {
    if (servers.length === 0) {
      return {
        overallEfficiency: 0,
        resourceUtilization: 0,
        responseTimeEfficiency: 0,
        errorRateEfficiency: 0,
        uptimeEfficiency: 0,
        bottlenecks: ['서버 데이터 없음'],
      };
    }

    // Resource utilization efficiency (optimal around 60-70%)
    const avgCpu =
      servers.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) /
      servers.length;
    const avgMemory =
      servers.reduce((sum, s) => sum + s.node_memory_usage_percent, 0) /
      servers.length;
    const optimalCpu = 65;
    const optimalMemory = 70;

    const cpuEfficiency = Math.max(0, 100 - Math.abs(avgCpu - optimalCpu) * 2);
    const memoryEfficiency = Math.max(
      0,
      100 - Math.abs(avgMemory - optimalMemory) * 2
    );
    const resourceUtilization = (cpuEfficiency + memoryEfficiency) / 2;

    // Response time efficiency
    const avgResponseTime =
      servers.reduce((sum, s) => sum + s.http_request_duration_seconds, 0) /
      servers.length;
    const responseTimeEfficiency = Math.max(
      0,
      100 - (avgResponseTime - 0.1) * 100
    );

    // Error rate efficiency
    const totalRequests = servers.reduce(
      (sum, s) => sum + s.http_requests_total,
      0
    );
    const totalErrors = servers.reduce(
      (sum, s) => sum + s.http_requests_errors_total,
      0
    );
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;
    const errorRateEfficiency = Math.max(0, 100 - errorRate * 2000);

    // Uptime efficiency (based on healthy servers)
    const healthyServers = servers.filter((s) => s.status === 'healthy').length;
    const uptimeEfficiency = (healthyServers / servers.length) * 100;

    // Overall efficiency
    const overallEfficiency =
      resourceUtilization * 0.3 +
      responseTimeEfficiency * 0.25 +
      errorRateEfficiency * 0.25 +
      uptimeEfficiency * 0.2;

    // Identify bottlenecks
    const bottlenecks: string[] = [];
    if (avgCpu > 85) bottlenecks.push('CPU 과부하');
    if (avgMemory > 90) bottlenecks.push('메모리 부족');
    if (avgResponseTime > 2.0) bottlenecks.push('응답 시간 지연');
    if (errorRate > 0.05) bottlenecks.push('높은 에러율');
    if (healthyServers / servers.length < 0.8)
      bottlenecks.push('서버 가용성 저하');

    return {
      overallEfficiency: Number(overallEfficiency.toFixed(1)),
      resourceUtilization: Number(resourceUtilization.toFixed(1)),
      responseTimeEfficiency: Number(responseTimeEfficiency.toFixed(1)),
      errorRateEfficiency: Number(errorRateEfficiency.toFixed(1)),
      uptimeEfficiency: Number(uptimeEfficiency.toFixed(1)),
      bottlenecks,
    };
  }

  /**
   * 🎯 Generate performance optimization plan
   */
  static generateOptimizationPlan(
    efficiency: ReturnType<typeof PerformanceMonitor.calculateSystemEfficiency>,
    metrics: MetricsPerformanceData
  ): {
    priority: 'high' | 'medium' | 'low';
    actions: Array<{
      action: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      timeframe: string;
    }>;
  } {
    const actions: Array<{
      action: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
      timeframe: string;
    }> = [];

    // High priority actions
    if (efficiency.bottlenecks.includes('CPU 과부하')) {
      actions.push({
        action: 'CPU 집약적인 작업 최적화 또는 서버 증설',
        impact: 'high',
        effort: 'medium',
        timeframe: '즉시',
      });
    }

    if (efficiency.bottlenecks.includes('메모리 부족')) {
      actions.push({
        action: '메모리 누수 점검 및 메모리 최적화',
        impact: 'high',
        effort: 'medium',
        timeframe: '1주일 내',
      });
    }

    if (efficiency.bottlenecks.includes('서버 가용성 저하')) {
      actions.push({
        action: '장애 서버 복구 및 헬스체크 강화',
        impact: 'high',
        effort: 'high',
        timeframe: '즉시',
      });
    }

    // Medium priority actions
    if (efficiency.responseTimeEfficiency < 70) {
      actions.push({
        action: '데이터베이스 쿼리 최적화 및 캐싱 강화',
        impact: 'medium',
        effort: 'medium',
        timeframe: '2주일 내',
      });
    }

    if (metrics.errors_count > 5) {
      actions.push({
        action: '에러 로그 분석 및 예외 처리 개선',
        impact: 'medium',
        effort: 'low',
        timeframe: '1주일 내',
      });
    }

    // Low priority actions
    if (efficiency.overallEfficiency > 80) {
      actions.push({
        action: '시스템 모니터링 및 예방적 유지보수',
        impact: 'low',
        effort: 'low',
        timeframe: '지속적',
      });
    }

    // Determine overall priority
    let priority: 'high' | 'medium' | 'low' = 'low';
    if (
      efficiency.overallEfficiency < 50 ||
      efficiency.bottlenecks.length > 2
    ) {
      priority = 'high';
    } else if (
      efficiency.overallEfficiency < 70 ||
      efficiency.bottlenecks.length > 0
    ) {
      priority = 'medium';
    }

    return { priority, actions };
  }
}
