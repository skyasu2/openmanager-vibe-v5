/**
 * 🎯 AI Insight Center - Performance Analysis Module
 *
 * System performance analysis and optimization:
 * - System bottleneck identification
 * - Database performance analysis
 * - Network optimization recommendations
 * - Performance monitoring insights
 */

import type {
  SystemMetrics,
  DatabaseMetrics,
  NetworkMetrics,
  Bottleneck,
  DatabaseAnalysis,
  NetworkOptimization,
} from './insight-center.types';

/**
 * Identify system bottlenecks
 */
export function identifyBottlenecks(metrics: SystemMetrics): Bottleneck[] {
  const bottlenecks = [];

  // Check server bottlenecks
  for (const server of metrics.servers) {
    if (server.cpu_avg > 80) {
      bottlenecks.push({
        component: `Server ${server.id}`,
        severity: server.cpu_avg > 90 ? 'critical' : 'high',
        impact: 'Performance degradation and potential downtime',
        resolution: 'Scale up CPU resources or optimize code',
      });
    }

    if (server.response_time > 300) {
      bottlenecks.push({
        component: `Server ${server.id} Response Time`,
        severity: server.response_time > 500 ? 'critical' : 'high',
        impact: 'Poor user experience',
        resolution: 'Optimize queries and add caching',
      });
    }
  }

  // Check database bottlenecks
  if (metrics.database.query_performance.slow_queries > 10) {
    bottlenecks.push({
      component: 'Database Queries',
      severity: 'high' as const,
      impact: 'Slow application performance',
      resolution: 'Optimize slow queries and add indexes',
    });
  }

  if (
    metrics.database.connection_pool.active >=
    metrics.database.connection_pool.max * 0.9
  ) {
    bottlenecks.push({
      component: 'Database Connection Pool',
      severity: 'critical' as const,
      impact: 'Connection exhaustion risk',
      resolution: 'Increase pool size or optimize connection usage',
    });
  }

  // Check network bottlenecks
  if (metrics.network.latency.p99 > 100) {
    bottlenecks.push({
      component: 'Network Latency',
      severity: 'medium' as const,
      impact: 'Slow page loads for some users',
      resolution: 'Implement CDN or edge caching',
    });
  }

  return (bottlenecks as Bottleneck[]).sort((a, b) => {
    const severityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return (severityOrder[a.severity] ?? 999) - (severityOrder[b.severity] ?? 999);
  });
}

/**
 * Analyze database performance
 */
export function analyzeDatabasePerformance(
  dbMetrics: DatabaseMetrics
): DatabaseAnalysis {
  return {
    slow_query_analysis: {
      count: dbMetrics.query_performance.slow_queries,
      avg_time: dbMetrics.query_performance.avg_execution_time,
      recommendation:
        dbMetrics.query_performance.slow_queries > 10
          ? 'Review and optimize queries with execution time > 100ms'
          : 'Query performance is acceptable',
    },
    connection_pool_health: {
      utilization:
        (dbMetrics.connection_pool.active / dbMetrics.connection_pool.max) *
        100,
      status:
        dbMetrics.connection_pool.active > dbMetrics.connection_pool.max * 0.8
          ? 'warning'
          : 'healthy',
      recommendation:
        dbMetrics.connection_pool.idle < 2
          ? 'Consider increasing pool size'
          : 'Pool size is adequate',
    },
    optimization_suggestions: [
      'Add indexes for frequently queried columns',
      'Implement query result caching',
      'Use connection pooling effectively',
      'Consider read replicas for heavy read workloads',
    ],
  };
}

/**
 * Generate network optimization insights
 */
export function generateNetworkOptimizations(
  networkMetrics: NetworkMetrics
): NetworkOptimization {
  return {
    latency_reduction: {
      current_p99: networkMetrics.latency.p99,
      target_p99: 50,
      strategies: [
        'Implement edge caching',
        'Use CDN for static assets',
        'Optimize API response sizes',
      ],
    },
    throughput_improvement: {
      current: networkMetrics.throughput,
      recommendations: [
        'Enable HTTP/2 or HTTP/3',
        'Implement request batching',
        'Use compression for responses',
      ],
    },
    cdn_recommendations: {
      benefit: 'Reduce latency by 40-60%',
      providers: ['Cloudflare', 'Fastly', 'AWS CloudFront'],
      estimated_cost: '$50-200/month',
    },
  };
}
