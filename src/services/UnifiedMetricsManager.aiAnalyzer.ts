/**
 * 🤖 Unified Metrics Manager AI Analyzer
 *
 * AI analysis and recommendation functionality:
 * - Server health analysis
 * - Performance prediction
 * - Anomaly detection
 * - Recommendation generation
 */

import type {
  AIAnalysisResult,
  MetricsPerformanceData,
  UnifiedServerMetrics,
} from './UnifiedMetricsManager.types';

export const AIAnalyzer = {
  /**
   * 🤖 Perform AI analysis on servers
   */
  async performAIAnalysis(
    servers: UnifiedServerMetrics[],
    metrics: MetricsPerformanceData
  ): Promise<void> {
    console.log('🤖 AI 분석 시작...');
    const startTime = Date.now();

    try {
      // 서버별 AI 분석 수행
      const analysisPromises = servers.map(async (server) => {
        const analysis = await this.analyzeServer(server);

        // AI 분석 결과를 서버 객체에 추가
        server.ai_analysis = {
          prediction_score: analysis.prediction_score,
          anomaly_score: analysis.anomaly_score,
          recommendation: analysis.recommendation,
        };

        return analysis;
      });

      await Promise.all(analysisPromises);

      // 전체 시스템 분석
      const systemAnalysis = this.analyzeSystemHealth(servers);
      console.log('📊 시스템 분석 결과:', systemAnalysis);

      const processingTime = Date.now() - startTime;
      metrics.avg_processing_time =
        (metrics.avg_processing_time + processingTime) / 2;
      metrics.ai_analysis_count++;

      console.log(`🤖 AI 분석 완료 (${processingTime}ms)`);
    } catch (error) {
      console.error('❌ AI 분석 실패:', error);
      metrics.errors_count++;
    }
  },

  /**
   * 📊 Individual server analysis
   */
  async analyzeServer(server: UnifiedServerMetrics) {
    // Simulate AI analysis processing time
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50));

    const prediction_score = this.calculatePredictionScore(server);
    const anomaly_score = this.calculateAnomalyScore(server);
    const recommendation = this.generateRecommendation(server);

    return {
      prediction_score,
      anomaly_score,
      recommendation,
    };
  },

  /**
   * 🎯 Calculate prediction score for server performance
   */
  calculatePredictionScore(server: UnifiedServerMetrics): number {
    let score = 100; // Start with perfect score

    // CPU usage impact
    if (server.node_cpu_usage_percent > 80) {
      score -= (server.node_cpu_usage_percent - 80) * 2;
    }

    // Memory usage impact
    if (server.node_memory_usage_percent > 85) {
      score -= (server.node_memory_usage_percent - 85) * 3;
    }

    // Response time impact
    if (server.http_request_duration_seconds > 1.0) {
      score -= (server.http_request_duration_seconds - 1.0) * 20;
    }

    // Error rate impact
    const errorRate =
      server.http_requests_total > 0
        ? server.http_requests_errors_total / server.http_requests_total
        : 0;

    if (errorRate > 0.01) {
      // More than 1% error rate
      score -= errorRate * 100 * 50;
    }

    return Math.max(0, Math.min(100, score));
  },

  /**
   * 🚨 Calculate anomaly score for unusual behavior detection
   */
  calculateAnomalyScore(server: UnifiedServerMetrics): number {
    let anomalyScore = 0;

    // Check for unusual patterns
    // Look for extreme values or unusual combinations
    if (
      server.node_cpu_usage_percent > 95 &&
      server.node_memory_usage_percent < 20
    ) {
      anomalyScore += 30; // High CPU, low memory - unusual
    }

    if (
      server.node_memory_usage_percent > 95 &&
      server.node_cpu_usage_percent < 10
    ) {
      anomalyScore += 25; // Memory leak pattern
    }

    if (server.http_request_duration_seconds > 5.0) {
      anomalyScore += 40; // Extremely slow response
    }

    // Network anomalies
    const networkRatio =
      server.node_network_transmit_rate_mbps > 0
        ? server.node_network_receive_rate_mbps /
          server.node_network_transmit_rate_mbps
        : 0;

    if (networkRatio > 10 || networkRatio < 0.1) {
      anomalyScore += 20; // Unusual network pattern
    }

    return Math.min(100, anomalyScore);
  },

  /**
   * 💡 Generate actionable recommendations
   */
  generateRecommendation(server: UnifiedServerMetrics): string {
    const recommendations: string[] = [];

    // CPU recommendations
    if (server.node_cpu_usage_percent > 85) {
      recommendations.push(
        '🔴 CPU 사용률이 매우 높습니다. 스케일 아웃을 즉시 고려하세요.'
      );
    } else if (server.node_cpu_usage_percent > 75) {
      recommendations.push('🟡 CPU 사용률이 높습니다. 모니터링을 강화하세요.');
    }

    // Memory recommendations
    if (server.node_memory_usage_percent > 90) {
      recommendations.push(
        '🔴 메모리 사용률이 위험 수준입니다. 메모리 누수 확인이 필요합니다.'
      );
    } else if (server.node_memory_usage_percent > 80) {
      recommendations.push(
        '🟡 메모리 사용률이 높습니다. 메모리 최적화를 고려하세요.'
      );
    }

    // Performance recommendations
    if (server.http_request_duration_seconds > 2.0) {
      recommendations.push(
        '🔴 응답 시간이 매우 느립니다. 성능 튜닝이 시급합니다.'
      );
    } else if (server.http_request_duration_seconds > 1.0) {
      recommendations.push('🟡 응답 시간 개선이 필요합니다.');
    }

    // Error rate recommendations
    const errorRate =
      server.http_requests_total > 0
        ? server.http_requests_errors_total / server.http_requests_total
        : 0;

    if (errorRate > 0.05) {
      recommendations.push(
        '🔴 에러율이 매우 높습니다 (5% 이상). 즉시 조치가 필요합니다.'
      );
    } else if (errorRate > 0.01) {
      recommendations.push(
        '🟡 에러율이 높습니다 (1% 이상). 로그를 확인하세요.'
      );
    }

    // Disk usage recommendations
    if (server.node_disk_usage_percent > 85) {
      recommendations.push(
        '🟡 디스크 사용률이 높습니다. 디스크 정리를 고려하세요.'
      );
    }

    // Network recommendations
    if (server.node_network_receive_rate_mbps > 80) {
      recommendations.push('🟡 네트워크 입력 트래픽이 높습니다.');
    }

    return recommendations.length > 0
      ? recommendations
          .slice(0, 3)
          .join(' ') // Max 3 recommendations
      : '✅ 서버가 정상 상태입니다.';
  },

  /**
   * 🏥 Analyze overall system health
   */
  analyzeSystemHealth(servers: UnifiedServerMetrics[]): AIAnalysisResult {
    if (servers.length === 0) {
      return {
        analysis: 'no_servers',
        server_count: 0,
        avg_cpu: '0.0',
        avg_memory: '0.0',
        critical_servers: 0,
        health_score: '0.0',
        timestamp: new Date().toISOString(),
      };
    }

    const totalServers = servers.length;
    const avgCpu =
      servers.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) /
      totalServers;
    const avgMemory =
      servers.reduce((sum, s) => sum + s.node_memory_usage_percent, 0) /
      totalServers;
    const criticalServers = servers.filter(
      (s) => s.status === 'critical'
    ).length;

    return {
      analysis: 'typescript_enhanced',
      server_count: totalServers,
      avg_cpu: avgCpu.toFixed(1),
      avg_memory: avgMemory.toFixed(1),
      critical_servers: criticalServers,
      health_score: (
        ((totalServers - criticalServers) / totalServers) *
        100
      ).toFixed(1),
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * 🔮 Predict future server state
   */
  predictServerState(
    server: UnifiedServerMetrics,
    timeHorizonMinutes: number = 30
  ): Partial<UnifiedServerMetrics> {
    // Simple linear trend prediction based on current state
    const trendFactor = timeHorizonMinutes / 60; // Convert to hours

    let cpuTrend = 0;
    let memoryTrend = 0;

    // Predict trends based on current load
    if (server.node_cpu_usage_percent > 70) {
      cpuTrend = 2 * trendFactor; // High CPU tends to increase
    } else if (server.node_cpu_usage_percent < 30) {
      cpuTrend = -1 * trendFactor; // Low CPU might decrease slightly
    }

    if (server.node_memory_usage_percent > 80) {
      memoryTrend = 3 * trendFactor; // Memory leaks tend to grow
    }

    return {
      node_cpu_usage_percent: Math.min(
        100,
        Math.max(0, server.node_cpu_usage_percent + cpuTrend)
      ),
      node_memory_usage_percent: Math.min(
        100,
        Math.max(0, server.node_memory_usage_percent + memoryTrend)
      ),
    };
  },

  /**
   * 📈 Calculate server efficiency score
   */
  calculateEfficiencyScore(server: UnifiedServerMetrics): number {
    // Efficiency is inversely related to resource usage
    const cpuEfficiency = 100 - server.node_cpu_usage_percent;
    const memoryEfficiency = 100 - server.node_memory_usage_percent;
    const responseTimeEfficiency =
      server.http_request_duration_seconds < 1.0
        ? 100 - server.http_request_duration_seconds * 50
        : 50;

    return (cpuEfficiency + memoryEfficiency + responseTimeEfficiency) / 3;
  },
};
