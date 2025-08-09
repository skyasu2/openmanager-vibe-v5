/**
 * 📊 Unified Metrics Manager Metrics Updater
 * 
 * Metrics generation and update functionality:
 * - Server metrics generation
 * - Realistic value fluctuations
 * - Status determination
 * - Time-based patterns
 */

import type {
  UnifiedServerMetrics,
  UnifiedMetricsConfig,
  MetricsPerformanceData,
  ServerStatus,
} from './UnifiedMetricsManager.types';

export class MetricsUpdater {
  /**
   * 📊 Generate and update all server metrics
   */
  static async generateMetrics(
    servers: Map<string, UnifiedServerMetrics>,
    config: UnifiedMetricsConfig,
    metrics: MetricsPerformanceData,
    simulateAutoscalingFn: (servers: UnifiedServerMetrics[]) => Promise<void>
  ): Promise<void> {
    const startTime = Date.now();

    try {
      const updatedServers: UnifiedServerMetrics[] = [];

      // Update all server metrics
      for (const [id, server] of servers) {
        const updated = await this.updateServerMetrics(server, config);
        servers.set(id, updated);
        updatedServers.push(updated);
      }

      // Auto-scaling simulation
      if (config.autoscaling.enabled) {
        await simulateAutoscalingFn(updatedServers);
      }

      // Update performance metrics
      this.updatePerformanceMetrics(startTime, metrics);

      console.log(
        `📊 메트릭 생성 완료: ${updatedServers.length}개 서버, ${Date.now() - startTime}ms`
      );
    } catch (error) {
      console.error('❌ 메트릭 생성 실패:', error);
      metrics.errors_count++;
    }
  }

  /**
   * 🔄 Update individual server metrics
   */
  static async updateServerMetrics(
    server: UnifiedServerMetrics,
    config: UnifiedMetricsConfig
  ): Promise<UnifiedServerMetrics> {
    const updated = { ...server };

    // Apply realistic variations to metric values
    updated.node_cpu_usage_percent = this.applyVariation(
      server.node_cpu_usage_percent,
      0.95,
      1.05, // ±5% variation
      5,
      95 // 5-95% range
    );

    updated.node_memory_usage_percent = this.applyVariation(
      server.node_memory_usage_percent,
      0.98,
      1.02, // ±2% variation (memory is stable)
      10,
      90
    );

    updated.node_disk_usage_percent = this.applyVariation(
      server.node_disk_usage_percent,
      1.0,
      1.001, // Almost no variation (disk grows slowly)
      0,
      95
    );

    // Network has larger variations
    updated.node_network_receive_rate_mbps = this.applyVariation(
      server.node_network_receive_rate_mbps,
      0.7,
      1.5, // ±30% variation
      0.1,
      1000
    );

    updated.node_network_transmit_rate_mbps = this.applyVariation(
      server.node_network_transmit_rate_mbps,
      0.7,
      1.5,
      0.1,
      1000
    );

    // Increase uptime
    updated.node_uptime_seconds += config.generation.interval_seconds;

    // Update HTTP metrics
    const requestIncrement = Math.floor(Math.random() * 100);
    updated.http_requests_total += requestIncrement;

    if (Math.random() < 0.05) {
      // 5% chance of errors
      updated.http_requests_errors_total += Math.floor(Math.random() * 5);
    }

    // Response time (correlated with CPU usage)
    updated.http_request_duration_seconds =
      0.05 + (updated.node_cpu_usage_percent / 100) * 0.5;

    // Determine server status
    updated.status = this.determineServerStatus(updated);

    // Update timestamp
    updated.timestamp = Date.now();

    return updated;
  }

  /**
   * 📈 Apply variation to a metric value
   */
  static applyVariation(
    currentValue: number,
    minMultiplier: number,
    maxMultiplier: number,
    min: number,
    max: number
  ): number {
    const multiplier =
      minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
    const newValue = currentValue * multiplier;
    return Math.max(min, Math.min(max, Math.round(newValue * 100) / 100));
  }

  /**
   * 🚨 Determine server status based on metrics
   */
  static determineServerStatus(
    server: UnifiedServerMetrics
  ): ServerStatus {
    const cpu = server.node_cpu_usage_percent;
    const memory = server.node_memory_usage_percent;
    const responseTime = server.http_request_duration_seconds;

    // Critical conditions
    if (cpu > 90 || memory > 95 || responseTime > 5.0) {
      return 'critical';
    }

    // Warning conditions
    if (cpu > 75 || memory > 85 || responseTime > 2.0) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * 📊 Update performance tracking metrics
   */
  static updatePerformanceMetrics(
    startTime: number,
    metrics: MetricsPerformanceData
  ): void {
    const processingTime = Date.now() - startTime;
    metrics.total_updates++;
    metrics.avg_processing_time =
      (metrics.avg_processing_time * (metrics.total_updates - 1) +
        processingTime) /
      metrics.total_updates;
    metrics.last_update = Date.now();
  }

  /**
   * 📊 Generate realistic metric values with time patterns
   */
  static generateRealisticValue(
    min: number,
    max: number,
    role: string,
    includeTimePattern: boolean = true
  ): number {
    const baseValue = min + Math.random() * (max - min);

    // Role-based characteristics
    const roleMultipliers = {
      database: 1.3, // DB servers have higher load
      api: 1.1, // API servers slightly higher
      web: 0.9, // Web servers are normal
      cache: 0.8, // Cache servers are lower
      worker: 1.2, // Workers are higher
    };

    const multiplier =
      roleMultipliers[role as keyof typeof roleMultipliers] || 1.0;

    let timePattern = 1.0;
    if (includeTimePattern) {
      // Time-based pattern (simple sine curve)
      const hour = new Date().getHours();
      timePattern = 0.8 + 0.4 * Math.sin(((hour - 6) * Math.PI) / 12); // Peak at 2 PM
    }

    return Math.round(baseValue * multiplier * timePattern * 100) / 100;
  }

  /**
   * 🎯 Apply failure scenarios for realistic testing
   */
  static applyFailureScenarios(
    server: UnifiedServerMetrics,
    config: UnifiedMetricsConfig
  ): UnifiedServerMetrics {
    if (!config.generation.failure_scenarios) {
      return server;
    }

    const updated = { ...server };

    // Random failure scenarios (5% chance)
    if (Math.random() < 0.05) {
      const scenarioType = Math.floor(Math.random() * 4);

      switch (scenarioType) {
        case 0: // CPU spike
          updated.node_cpu_usage_percent = Math.min(95, updated.node_cpu_usage_percent * 1.8);
          updated.http_request_duration_seconds *= 2.5;
          break;

        case 1: // Memory leak
          updated.node_memory_usage_percent = Math.min(98, updated.node_memory_usage_percent * 1.5);
          break;

        case 2: // Network congestion
          updated.node_network_receive_rate_mbps *= 0.3;
          updated.node_network_transmit_rate_mbps *= 0.3;
          updated.http_request_duration_seconds *= 1.8;
          break;

        case 3: // High error rate
          updated.http_requests_errors_total += Math.floor(Math.random() * 50);
          updated.http_request_duration_seconds *= 1.4;
          break;
      }
    }

    return updated;
  }

  /**
   * 🔄 Batch update multiple servers efficiently
   */
  static async batchUpdateServers(
    servers: Map<string, UnifiedServerMetrics>,
    config: UnifiedMetricsConfig,
    batchSize: number = 10
  ): Promise<void> {
    const serverEntries = Array.from(servers.entries());
    const batches = [];

    // Create batches
    for (let i = 0; i < serverEntries.length; i += batchSize) {
      batches.push(serverEntries.slice(i, i + batchSize));
    }

    // Process batches in parallel
    const batchPromises = batches.map(async (batch) => {
      const updates = await Promise.all(
        batch.map(async ([id, server]) => {
          const updated = await this.updateServerMetrics(server, config);
          return [id, updated] as [string, UnifiedServerMetrics];
        })
      );

      // Update the servers map
      updates.forEach(([id, updated]) => {
        servers.set(id, updated);
      });
    });

    await Promise.all(batchPromises);
  }

  /**
   * 📈 Calculate metrics statistics
   */
  static calculateMetricsStatistics(
    servers: UnifiedServerMetrics[]
  ): {
    avgCpu: number;
    avgMemory: number;
    avgDisk: number;
    avgResponseTime: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
  } {
    if (servers.length === 0) {
      return {
        avgCpu: 0,
        avgMemory: 0,
        avgDisk: 0,
        avgResponseTime: 0,
        healthyServers: 0,
        warningServers: 0,
        criticalServers: 0,
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
      };
    }

    const totalServers = servers.length;
    const avgCpu = servers.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) / totalServers;
    const avgMemory = servers.reduce((sum, s) => sum + s.node_memory_usage_percent, 0) / totalServers;
    const avgDisk = servers.reduce((sum, s) => sum + s.node_disk_usage_percent, 0) / totalServers;
    const avgResponseTime = servers.reduce((sum, s) => sum + s.http_request_duration_seconds, 0) / totalServers;

    const healthyServers = servers.filter(s => s.status === 'healthy').length;
    const warningServers = servers.filter(s => s.status === 'warning').length;
    const criticalServers = servers.filter(s => s.status === 'critical').length;

    const totalRequests = servers.reduce((sum, s) => sum + s.http_requests_total, 0);
    const totalErrors = servers.reduce((sum, s) => sum + s.http_requests_errors_total, 0);
    const errorRate = totalRequests > 0 ? totalErrors / totalRequests : 0;

    return {
      avgCpu: Number(avgCpu.toFixed(1)),
      avgMemory: Number(avgMemory.toFixed(1)),
      avgDisk: Number(avgDisk.toFixed(1)),
      avgResponseTime: Number(avgResponseTime.toFixed(3)),
      healthyServers,
      warningServers,
      criticalServers,
      totalRequests,
      totalErrors,
      errorRate: Number(errorRate.toFixed(4)),
    };
  }
}