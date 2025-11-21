/**
 * 📊 AI Metrics Collector
 * 
 * @description
 * Collects and aggregates metrics from AI engines for monitoring and optimization.
 * Features:
 * - Real-time metric collection
 * - Provider-specific tracking
 * - Time-series data management
 * - Performance analytics
 * - Cache hit rate monitoring
 * - Error rate tracking
 * 
 * @version 1.0.0
 * @date 2025-11-21
 */

import { aiEngineConfig } from '@/config/ai-engine';
import type { AIEngineType } from '@/types/core-types';
import type { AIErrorType } from '../errors/AIErrorHandler';
import type { ComplexityLevel } from '../utils/QueryComplexityAnalyzer';

/**
 * 📊 Metric Data Point
 */
export interface MetricDataPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, unknown>;
}

/**
 * 📊 Provider Metrics
 */
export interface ProviderMetrics {
  provider: 'rag' | 'ml' | 'nlp' | 'rule';
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  cacheHitRate: number;
  lastRequestTime: number;
  errorCount: Record<AIErrorType, number>;
}

/**
 * 📊 Engine Metrics
 */
export interface EngineMetrics {
  engineType: AIEngineType;
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number; // queries per second
  complexityDistribution: Record<ComplexityLevel, number>;
  errorDistribution: Record<AIErrorType, number>;
  providerMetrics: Record<string, ProviderMetrics>;
  lastUpdated: number;
}

/**
 * 📊 System-wide Metrics
 */
export interface SystemMetrics {
  totalQueries: number;
  totalErrors: number;
  averageResponseTime: number;
  cacheHitRate: number;
  quotaUsage: number;
  quotaLimit: number;
  engineMetrics: Record<AIEngineType, EngineMetrics>;
  providerHealth: Record<string, boolean>;
  uptime: number;
  startTime: number;
  lastUpdated: number;
}

/**
 * 📊 Query Event
 */
export interface QueryEvent {
  engineType: AIEngineType;
  provider?: 'rag' | 'ml' | 'nlp' | 'rule';
  query: string;
  complexity: ComplexityLevel;
  responseTime: number;
  success: boolean;
  cacheHit: boolean;
  error?: AIErrorType;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * 📊 Aggregation Period
 */
export type AggregationPeriod = '1m' | '5m' | '15m' | '1h' | '6h' | '24h' | '7d' | '30d';

/**
 * 📊 Time Series Data
 */
export interface TimeSeriesData {
  period: AggregationPeriod;
  dataPoints: MetricDataPoint[];
  metric: string;
  aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

/**
 * 📊 Metrics Collector Configuration
 */
export interface MetricsConfig {
  enabled: boolean;
  retentionPeriod: number; // milliseconds
  aggregationIntervals: AggregationPeriod[];
  maxDataPoints: number;
  enableDetailedTracking: boolean;
  samplingRate: number; // 0.0 - 1.0
}

/**
 * 📊 AI Metrics Collector
 */
export class AIMetricsCollector {
  private static instance: AIMetricsCollector | null = null;
  private metrics: SystemMetrics;
  private config: MetricsConfig;
  private queryHistory: QueryEvent[] = [];
  private timeSeries: Map<string, TimeSeriesData> = new Map();
  
  private constructor(config?: Partial<MetricsConfig>) {
    this.config = {
      enabled: aiEngineConfig.advanced.collectStats,
      retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
      aggregationIntervals: ['1m', '5m', '15m', '1h', '24h'],
      maxDataPoints: 10000,
      enableDetailedTracking: true,
      samplingRate: 1.0,
      ...config,
    };
    
    this.metrics = this.initializeMetrics();
    
    // Start periodic aggregation
    if (this.config.enabled) {
      this.startAggregation();
    }
  }
  
  /**
   * 🎯 Get singleton instance
   */
  static getInstance(config?: Partial<MetricsConfig>): AIMetricsCollector {
    if (!AIMetricsCollector.instance) {
      AIMetricsCollector.instance = new AIMetricsCollector(config);
    }
    return AIMetricsCollector.instance;
  }
  
  /**
   * 🎯 Initialize metrics structure
   */
  private initializeMetrics(): SystemMetrics {
    const engineTypes: AIEngineType[] = ['google-ai', 'simplified', 'performance-optimized'];
    const engineMetrics: Partial<Record<AIEngineType, EngineMetrics>> = {};
    
    engineTypes.forEach(type => {
      engineMetrics[type] = this.createEngineMetrics(type);
    });
    
    return {
      totalQueries: 0,
      totalErrors: 0,
      errorRate: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      quotaUsage: 0,
      quotaLimit: aiEngineConfig.quotaProtection.dailyLimit,
      engineMetrics: engineMetrics as Record<AIEngineType, EngineMetrics>,
      providerHealth: {
        rag: true,
        ml: true,
        nlp: true,
        rule: true,
      },
      uptime: 0,
      startTime: Date.now(),
      lastUpdated: Date.now(),
    };
  }
  
  /**
   * 🎯 Create empty engine metrics
   */
  private createEngineMetrics(type: AIEngineType): EngineMetrics {
    return {
      engineType: type,
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      averageResponseTime: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      cacheHitRate: 0,
      errorRate: 0,
      throughput: 0,
      complexityDistribution: {
        simple: 0,
        medium: 0,
        complex: 0,
        very_complex: 0,
      },
      errorDistribution: {} as Record<AIErrorType, number>,
      providerMetrics: {},
      lastUpdated: Date.now(),
    };
  }
  
  /**
   * 🎯 Record query event
   */
  recordQuery(event: QueryEvent): void {
    if (!this.config.enabled) return;
    
    // Sampling
    if (Math.random() > this.config.samplingRate) return;
    
    // Add to history
    this.queryHistory.push(event);
    
    // Update real-time metrics
    this.updateMetrics(event);
    
    // Cleanup old data
    this.cleanupOldData();
  }
  
  /**
   * 🎯 Update metrics based on query event
   */
  private updateMetrics(event: QueryEvent): void {
    const { engineType, provider, complexity, responseTime, success, cacheHit, error } = event;
    
    // System-wide metrics
    this.metrics.totalQueries++;
    if (!success) this.metrics.totalErrors++;
    if (aiEngineConfig.quotaProtection.enabled) {
      this.metrics.quotaUsage++;
    }
    
    // Engine-specific metrics
    const engineMetrics = this.metrics.engineMetrics[engineType];
    if (engineMetrics) {
      engineMetrics.totalQueries++;
      if (success) {
        engineMetrics.successfulQueries++;
      } else {
        engineMetrics.failedQueries++;
      }
      
      // Update response time (rolling average)
      engineMetrics.averageResponseTime = 
        (engineMetrics.averageResponseTime * (engineMetrics.totalQueries - 1) + responseTime) / 
        engineMetrics.totalQueries;
      
      // Update complexity distribution
      engineMetrics.complexityDistribution[complexity]++;
      
      // Update cache hit rate
      const totalCacheableQueries = engineMetrics.totalQueries;
      const cacheHits = cacheHit ? 1 : 0;
      engineMetrics.cacheHitRate = 
        (engineMetrics.cacheHitRate * (totalCacheableQueries - 1) + cacheHits) / 
        totalCacheableQueries;
      
      // Update error distribution
      if (error) {
        engineMetrics.errorDistribution[error] = (engineMetrics.errorDistribution[error] || 0) + 1;
      }
      
      // Update error rate
      engineMetrics.errorRate = engineMetrics.failedQueries / engineMetrics.totalQueries;
      
      // Update provider metrics
      if (provider && this.config.enableDetailedTracking) {
        if (!engineMetrics.providerMetrics[provider]) {
          engineMetrics.providerMetrics[provider] = this.createProviderMetrics(provider);
        }
        this.updateProviderMetrics(engineMetrics.providerMetrics[provider], event);
      }
      
      engineMetrics.lastUpdated = Date.now();
    }
    
    // Update system averages
    this.updateSystemAverages();
    this.metrics.lastUpdated = Date.now();
  }
  
  /**
   * 🎯 Create empty provider metrics
   */
  private createProviderMetrics(provider: 'rag' | 'ml' | 'nlp' | 'rule'): ProviderMetrics {
    return {
      provider,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      lastRequestTime: 0,
      errorCount: {} as Record<AIErrorType, number>,
    };
  }
  
  /**
   * 🎯 Update provider metrics
   */
  private updateProviderMetrics(providerMetrics: ProviderMetrics, event: QueryEvent): void {
    const { responseTime, success, cacheHit, error, timestamp } = event;
    
    providerMetrics.totalRequests++;
    if (success) {
      providerMetrics.successfulRequests++;
    } else {
      providerMetrics.failedRequests++;
    }
    
    // Update average response time
    providerMetrics.averageResponseTime = 
      (providerMetrics.averageResponseTime * (providerMetrics.totalRequests - 1) + responseTime) / 
      providerMetrics.totalRequests;
    
    // Update cache hit rate
    const cacheHits = cacheHit ? 1 : 0;
    providerMetrics.cacheHitRate = 
      (providerMetrics.cacheHitRate * (providerMetrics.totalRequests - 1) + cacheHits) / 
      providerMetrics.totalRequests;
    
    // Update error count
    if (error) {
      providerMetrics.errorCount[error] = (providerMetrics.errorCount[error] || 0) + 1;
    }
    
    providerMetrics.lastRequestTime = timestamp;
  }
  
  /**
   * 🎯 Update system-wide averages
   */
  private updateSystemAverages(): void {
    const engines = Object.values(this.metrics.engineMetrics);
    
    // Average response time across all engines
    const totalQueries = engines.reduce((sum, e) => sum + e.totalQueries, 0);
    const weightedResponseTime = engines.reduce(
      (sum, e) => sum + e.averageResponseTime * e.totalQueries,
      0
    );
    this.metrics.averageResponseTime = totalQueries > 0 ? weightedResponseTime / totalQueries : 0;
    
    // Average cache hit rate across all engines
    const weightedCacheHitRate = engines.reduce(
      (sum, e) => sum + e.cacheHitRate * e.totalQueries,
      0
    );
    this.metrics.cacheHitRate = totalQueries > 0 ? weightedCacheHitRate / totalQueries : 0;
    
    // Error rate across all engines
    this.metrics.errorRate = this.metrics.totalQueries > 0 
      ? this.metrics.totalErrors / this.metrics.totalQueries 
      : 0;
    
    // Uptime
    this.metrics.uptime = Date.now() - this.metrics.startTime;
  }
  
  /**
   * 🎯 Get current metrics
   */
  getMetrics(): SystemMetrics {
    return JSON.parse(JSON.stringify(this.metrics));
  }
  
  /**
   * 🎯 Get engine metrics
   */
  getEngineMetrics(engineType: AIEngineType): EngineMetrics | null {
    return this.metrics.engineMetrics[engineType] ?? null;
  }
  
  /**
   * 🎯 Get provider metrics
   */
  getProviderMetrics(engineType: AIEngineType, provider: string): ProviderMetrics | null {
    const engineMetrics = this.metrics.engineMetrics[engineType];
    return engineMetrics?.providerMetrics[provider] ?? null;
  }
  
  /**
   * 🎯 Get time series data
   */
  getTimeSeries(metric: string, period: AggregationPeriod): TimeSeriesData | null {
    const key = `${metric}:${period}`;
    return this.timeSeries.get(key) || null;
  }
  
  /**
   * 🎯 Calculate percentile response times
   */
  calculatePercentiles(engineType: AIEngineType): void {
    const events = this.queryHistory.filter(e => e.engineType === engineType);
    if (events.length === 0) return;
    
    const responseTimes = events.map(e => e.responseTime).sort((a, b) => a - b);
    const engineMetrics = this.metrics.engineMetrics[engineType];
    
    if (engineMetrics) {
      engineMetrics.p50ResponseTime = this.getPercentile(responseTimes, 0.5);
      engineMetrics.p95ResponseTime = this.getPercentile(responseTimes, 0.95);
      engineMetrics.p99ResponseTime = this.getPercentile(responseTimes, 0.99);
    }
  }
  
  /**
   * 🎯 Get percentile value
   */
  private getPercentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil(sortedArray.length * percentile) - 1;
    return sortedArray[Math.max(0, index)] ?? 0;
  }
  
  /**
   * 🎯 Start periodic aggregation
   */
  private startAggregation(): void {
    // Aggregate every 1 minute
    setInterval(() => {
      this.aggregateMetrics('1m');
      this.calculateThroughput();
      
      // Calculate percentiles for all engines
      Object.keys(this.metrics.engineMetrics).forEach(type => {
        this.calculatePercentiles(type as AIEngineType);
      });
    }, 60000); // 1 minute
    
    // Aggregate every 5 minutes
    setInterval(() => {
      this.aggregateMetrics('5m');
    }, 300000); // 5 minutes
  }
  
  /**
   * 🎯 Calculate throughput
   */
  private calculateThroughput(): void {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    Object.keys(this.metrics.engineMetrics).forEach(type => {
      const engineType = type as AIEngineType;
      const recentQueries = this.queryHistory.filter(
        e => e.engineType === engineType && e.timestamp >= oneMinuteAgo
      );
      
      const engineMetrics = this.metrics.engineMetrics[engineType];
      if (engineMetrics) {
        engineMetrics.throughput = recentQueries.length / 60; // queries per second
      }
    });
  }
  
  /**
   * 🎯 Aggregate metrics for a period
   */
  private aggregateMetrics(period: AggregationPeriod): void {
    // This will aggregate data into time series
    // Implementation depends on specific metrics to aggregate
    // For now, we'll aggregate total queries
    
    const key = `totalQueries:${period}`;
    const dataPoint: MetricDataPoint = {
      timestamp: Date.now(),
      value: this.metrics.totalQueries,
    };
    
    if (!this.timeSeries.has(key)) {
      this.timeSeries.set(key, {
        period,
        dataPoints: [],
        metric: 'totalQueries',
        aggregation: 'sum',
      });
    }
    
    const series = this.timeSeries.get(key)!;
    series.dataPoints.push(dataPoint);
    
    // Limit data points
    if (series.dataPoints.length > this.config.maxDataPoints) {
      series.dataPoints.shift();
    }
  }
  
  /**
   * 🎯 Cleanup old data
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - this.config.retentionPeriod;
    
    // Remove old query events
    this.queryHistory = this.queryHistory.filter(e => e.timestamp >= cutoff);
    
    // Remove old time series data points
    this.timeSeries.forEach(series => {
      series.dataPoints = series.dataPoints.filter(dp => dp.timestamp >= cutoff);
    });
  }
  
  /**
   * 🎯 Reset metrics
   */
  reset(): void {
    this.metrics = this.initializeMetrics();
    this.queryHistory = [];
    this.timeSeries.clear();
  }
  
  /**
   * 🎯 Export metrics
   */
  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      queryHistory: this.queryHistory,
      timeSeries: Array.from(this.timeSeries.entries()),
      config: this.config,
    }, null, 2);
  }
}

/**
 * 🎯 Helper function to get metrics instance
 */
export function getMetricsCollector(): AIMetricsCollector {
  return AIMetricsCollector.getInstance();
}

/**
 * 🎯 Helper function to record query
 */
export function recordQueryMetrics(event: QueryEvent): void {
  const collector = getMetricsCollector();
  collector.recordQuery(event);
}
