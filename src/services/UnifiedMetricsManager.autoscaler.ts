/**
 * ⚖️ Unified Metrics Manager Autoscaler
 *
 * Auto-scaling simulation functionality:
 * - Server scaling decisions
 * - Dynamic server creation/removal
 * - CPU-based scaling logic
 * - Configuration-aware scaling limits
 */

import type {
  UnifiedServerMetrics,
  UnifiedMetricsConfig,
  MetricsPerformanceData,
  ServerEnvironment,
  ServerRole,
} from './UnifiedMetricsManager.types';

export class Autoscaler {
  /**
   * ⚖️ Perform autoscaling analysis and simulation
   */
  static async performAutoscaling(
    servers: Map<string, UnifiedServerMetrics>,
    config: UnifiedMetricsConfig,
    metrics: MetricsPerformanceData,
    createServerFn: (
      id: string,
      environment: ServerEnvironment,
      role: ServerRole
    ) => UnifiedServerMetrics
  ): Promise<void> {
    if (!config.autoscaling.enabled) return;

    try {
      const serverList = Array.from(servers.values());
      await this.simulateAutoscaling(
        servers,
        serverList,
        config,
        createServerFn
      );
      metrics.scaling_decisions++;
    } catch (error) {
      console.error('❌ 자동 스케일링 실패:', error);
      metrics.errors_count++;
    }
  }

  /**
   * ⚖️ Auto-scaling simulation logic
   */
  static async simulateAutoscaling(
    servers: Map<string, UnifiedServerMetrics>,
    serverList: UnifiedServerMetrics[],
    config: UnifiedMetricsConfig,
    createServerFn: (
      id: string,
      environment: ServerEnvironment,
      role: ServerRole
    ) => UnifiedServerMetrics
  ): Promise<void> {
    const avgCpu =
      serverList.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) /
      serverList.length;
    const currentCount = serverList.length;

    let action = 'maintain';
    let targetCount = currentCount;

    // Scale out conditions
    if (
      avgCpu > config.autoscaling.target_cpu_percent &&
      currentCount < config.autoscaling.max_servers
    ) {
      action = 'scale_out';
      targetCount = Math.min(currentCount + 1, config.autoscaling.max_servers);
    }

    // Scale in conditions
    if (
      avgCpu < config.autoscaling.target_cpu_percent * 0.5 &&
      currentCount > config.autoscaling.min_servers
    ) {
      action = 'scale_in';
      targetCount = Math.max(currentCount - 1, config.autoscaling.min_servers);
    }

    if (action !== 'maintain') {
      console.log(
        `⚖️ 자동 스케일링: ${action} (${currentCount} → ${targetCount})`
      );

      // Execute scaling action
      if (action === 'scale_out') {
        const newServer = createServerFn(
          `server-auto-${Date.now()}`,
          'production',
          'web'
        );
        servers.set(newServer.id, newServer);
      } else if (action === 'scale_in') {
        // Remove oldest server
        const serverIds = Array.from(servers.keys());
        if (serverIds.length > config.autoscaling.min_servers) {
          const lastServerId = serverIds[serverIds.length - 1];
          if (lastServerId !== undefined) {
            servers.delete(lastServerId);
          }
        }
      }
    }
  }

  /**
   * 📊 Calculate scaling recommendation
   */
  static calculateScalingRecommendation(
    servers: UnifiedServerMetrics[],
    config: UnifiedMetricsConfig
  ): {
    action: 'scale_out' | 'scale_in' | 'maintain';
    reason: string;
    currentCount: number;
    recommendedCount: number;
    avgCpu: number;
    avgMemory: number;
  } {
    const currentCount = servers.length;
    const avgCpu =
      servers.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) /
      currentCount;
    const avgMemory =
      servers.reduce((sum, s) => sum + s.node_memory_usage_percent, 0) /
      currentCount;

    let action: 'scale_out' | 'scale_in' | 'maintain' = 'maintain';
    let reason = '현재 리소스 사용량이 적절합니다.';
    let recommendedCount = currentCount;

    // Scale out logic
    if (avgCpu > config.autoscaling.target_cpu_percent) {
      if (currentCount < config.autoscaling.max_servers) {
        action = 'scale_out';
        reason = `CPU 평균 사용률이 ${avgCpu.toFixed(1)}%로 목표치 ${config.autoscaling.target_cpu_percent}%를 초과했습니다.`;
        recommendedCount = Math.min(
          currentCount + Math.ceil(avgCpu / 50),
          config.autoscaling.max_servers
        );
      } else {
        reason = `CPU 사용률이 높지만 최대 서버 수 ${config.autoscaling.max_servers}개에 도달했습니다.`;
      }
    }
    // Scale in logic
    else if (avgCpu < config.autoscaling.target_cpu_percent * 0.3) {
      if (currentCount > config.autoscaling.min_servers) {
        action = 'scale_in';
        reason = `CPU 평균 사용률이 ${avgCpu.toFixed(1)}%로 매우 낮아 리소스 절약이 가능합니다.`;
        recommendedCount = Math.max(
          currentCount - 1,
          config.autoscaling.min_servers
        );
      } else {
        reason = `CPU 사용률이 낮지만 최소 서버 수 ${config.autoscaling.min_servers}개를 유지해야 합니다.`;
      }
    }

    return {
      action,
      reason,
      currentCount,
      recommendedCount,
      avgCpu: Number(avgCpu.toFixed(1)),
      avgMemory: Number(avgMemory.toFixed(1)),
    };
  }

  /**
   * 🎯 Predict future scaling needs
   */
  static predictScalingNeeds(
    servers: UnifiedServerMetrics[],
    config: UnifiedMetricsConfig,
    timeHorizonMinutes: number = 30
  ): {
    prediction: 'scale_out' | 'scale_in' | 'maintain';
    confidence: number;
    estimatedTimeToAction: number;
    reasoning: string;
  } {
    const currentCpu =
      servers.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) /
      servers.length;
    const trendFactor = timeHorizonMinutes / 60;

    // Simple trend calculation (in real implementation, this would be more sophisticated)
    let cpuTrend = 0;
    if (currentCpu > 70) {
      cpuTrend = 5 * trendFactor; // Higher CPU tends to increase
    } else if (currentCpu < 30) {
      cpuTrend = -2 * trendFactor; // Lower CPU might decrease
    }

    const predictedCpu = Math.min(100, Math.max(0, currentCpu + cpuTrend));
    let prediction: 'scale_out' | 'scale_in' | 'maintain' = 'maintain';
    let confidence = 60; // Base confidence
    let estimatedTimeToAction = 0;
    let reasoning = '현재 트렌드가 유지될 것으로 예상됩니다.';

    if (predictedCpu > config.autoscaling.target_cpu_percent * 1.1) {
      prediction = 'scale_out';
      confidence = Math.min(
        90,
        60 + (predictedCpu - config.autoscaling.target_cpu_percent)
      );
      estimatedTimeToAction = Math.max(
        5,
        timeHorizonMinutes -
          (predictedCpu - config.autoscaling.target_cpu_percent) * 2
      );
      reasoning = `${timeHorizonMinutes}분 후 CPU 사용률이 ${predictedCpu.toFixed(1)}%로 증가하여 스케일 아웃이 필요할 것으로 예상됩니다.`;
    } else if (predictedCpu < config.autoscaling.target_cpu_percent * 0.4) {
      prediction = 'scale_in';
      confidence = Math.min(
        85,
        60 + (config.autoscaling.target_cpu_percent - predictedCpu)
      );
      estimatedTimeToAction = Math.max(
        10,
        timeHorizonMinutes -
          (config.autoscaling.target_cpu_percent - predictedCpu) * 3
      );
      reasoning = `${timeHorizonMinutes}분 후 CPU 사용률이 ${predictedCpu.toFixed(1)}%로 감소하여 스케일 인이 가능할 것으로 예상됩니다.`;
    }

    return {
      prediction,
      confidence,
      estimatedTimeToAction,
      reasoning,
    };
  }
}
