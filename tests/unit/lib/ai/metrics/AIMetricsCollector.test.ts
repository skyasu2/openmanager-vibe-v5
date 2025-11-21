/**
 * 🧪 AI Metrics Collector Tests
 * 
 * @description
 * Unit tests for AIMetricsCollector functionality.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIMetricsCollector, type QueryEvent } from '../../../../../src/lib/ai/metrics/AIMetricsCollector';

describe('AIMetricsCollector', () => {
  let collector: AIMetricsCollector;
  
  beforeEach(() => {
    collector = AIMetricsCollector.getInstance();
    collector.reset();
  });
  
  it('should initialize with empty metrics', () => {
    const metrics = collector.getMetrics();
    
    expect(metrics.totalQueries).toBe(0);
    expect(metrics.totalErrors).toBe(0);
    expect(metrics.averageResponseTime).toBe(0);
    expect(metrics.cacheHitRate).toBe(0);
  });
  
  it('should record successful query event', () => {
    const event: QueryEvent = {
      engineType: 'google-ai',
      query: 'test query',
      complexity: 'simple',
      responseTime: 100,
      success: true,
      cacheHit: false,
      timestamp: Date.now(),
    };
    
    collector.recordQuery(event);
    const metrics = collector.getMetrics();
    
    expect(metrics.totalQueries).toBe(1);
    expect(metrics.totalErrors).toBe(0);
  });
  
  it('should record failed query event', () => {
    const event: QueryEvent = {
      engineType: 'google-ai',
      query: 'test query',
      complexity: 'medium',
      responseTime: 200,
      success: false,
      cacheHit: false,
      error: 'timeout',
      timestamp: Date.now(),
    };
    
    collector.recordQuery(event);
    const metrics = collector.getMetrics();
    
    expect(metrics.totalQueries).toBe(1);
    expect(metrics.totalErrors).toBe(1);
  });
  
  it('should calculate average response time', () => {
    const events: QueryEvent[] = [
      {
        engineType: 'google-ai',
        query: 'query 1',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 2',
        complexity: 'simple',
        responseTime: 200,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 3',
        complexity: 'simple',
        responseTime: 300,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
    ];
    
    events.forEach(e => collector.recordQuery(e));
    const engineMetrics = collector.getEngineMetrics('google-ai');
    
    expect(engineMetrics?.averageResponseTime).toBe(200);
  });
  
  it('should calculate cache hit rate', () => {
    const events: QueryEvent[] = [
      {
        engineType: 'google-ai',
        query: 'query 1',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: true,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 2',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: true,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 3',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 4',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
    ];
    
    events.forEach(e => collector.recordQuery(e));
    const engineMetrics = collector.getEngineMetrics('google-ai');
    
    expect(engineMetrics?.cacheHitRate).toBe(0.5); // 2 out of 4
  });
  
  it('should track complexity distribution', () => {
    const events: QueryEvent[] = [
      {
        engineType: 'google-ai',
        query: 'query 1',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 2',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 3',
        complexity: 'medium',
        responseTime: 200,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 4',
        complexity: 'complex',
        responseTime: 300,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
    ];
    
    events.forEach(e => collector.recordQuery(e));
    const engineMetrics = collector.getEngineMetrics('google-ai');
    
    expect(engineMetrics?.complexityDistribution.simple).toBe(2);
    expect(engineMetrics?.complexityDistribution.medium).toBe(1);
    expect(engineMetrics?.complexityDistribution.complex).toBe(1);
    expect(engineMetrics?.complexityDistribution.very_complex).toBe(0);
  });
  
  it('should track error distribution', () => {
    const events: QueryEvent[] = [
      {
        engineType: 'google-ai',
        query: 'query 1',
        complexity: 'simple',
        responseTime: 100,
        success: false,
        cacheHit: false,
        error: 'timeout',
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 2',
        complexity: 'simple',
        responseTime: 100,
        success: false,
        cacheHit: false,
        error: 'timeout',
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 3',
        complexity: 'simple',
        responseTime: 100,
        success: false,
        cacheHit: false,
        error: 'rate_limit',
        timestamp: Date.now(),
      },
    ];
    
    events.forEach(e => collector.recordQuery(e));
    const engineMetrics = collector.getEngineMetrics('google-ai');
    
    expect(engineMetrics?.errorDistribution.timeout).toBe(2);
    expect(engineMetrics?.errorDistribution.rate_limit).toBe(1);
  });
  
  it('should calculate error rate', () => {
    const events: QueryEvent[] = [
      {
        engineType: 'google-ai',
        query: 'query 1',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 2',
        complexity: 'simple',
        responseTime: 100,
        success: false,
        cacheHit: false,
        error: 'timeout',
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 3',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
      {
        engineType: 'google-ai',
        query: 'query 4',
        complexity: 'simple',
        responseTime: 100,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      },
    ];
    
    events.forEach(e => collector.recordQuery(e));
    const engineMetrics = collector.getEngineMetrics('google-ai');
    
    expect(engineMetrics?.errorRate).toBe(0.25); // 1 out of 4
  });
  
  it('should track provider-specific metrics', () => {
    const event: QueryEvent = {
      engineType: 'google-ai',
      provider: 'rag',
      query: 'test query',
      complexity: 'simple',
      responseTime: 100,
      success: true,
      cacheHit: false,
      timestamp: Date.now(),
    };
    
    collector.recordQuery(event);
    const providerMetrics = collector.getProviderMetrics('google-ai', 'rag');
    
    expect(providerMetrics?.provider).toBe('rag');
    expect(providerMetrics?.totalRequests).toBe(1);
    expect(providerMetrics?.successfulRequests).toBe(1);
    expect(providerMetrics?.failedRequests).toBe(0);
  });
  
  it('should reset metrics', () => {
    const event: QueryEvent = {
      engineType: 'google-ai',
      query: 'test query',
      complexity: 'simple',
      responseTime: 100,
      success: true,
      cacheHit: false,
      timestamp: Date.now(),
    };
    
    collector.recordQuery(event);
    expect(collector.getMetrics().totalQueries).toBe(1);
    
    collector.reset();
    expect(collector.getMetrics().totalQueries).toBe(0);
  });
  
  it('should export metrics', () => {
    const event: QueryEvent = {
      engineType: 'google-ai',
      query: 'test query',
      complexity: 'simple',
      responseTime: 100,
      success: true,
      cacheHit: false,
      timestamp: Date.now(),
    };
    
    collector.recordQuery(event);
    const exported = collector.exportMetrics();
    const parsed = JSON.parse(exported);
    
    expect(parsed).toHaveProperty('metrics');
    expect(parsed).toHaveProperty('queryHistory');
    expect(parsed).toHaveProperty('timeSeries');
    expect(parsed).toHaveProperty('config');
  });
});
