/**
 * 🧪 AI Metrics Integration Tests
 * 
 * @description
 * Tests for AI metrics collection and API endpoints.
 * Validates that metrics are properly collected across engine lifecycle.
 * 
 * @version 1.0.0
 * @date 2025-11-21
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AIMetricsCollector } from '@/lib/ai/metrics/AIMetricsCollector';
import { ComplexityLevel } from '@/lib/ai/utils/QueryComplexityAnalyzer';
import type { QueryEvent } from '@/lib/ai/metrics/AIMetricsCollector';

describe('AI Metrics Integration Tests', () => {
  let collector: AIMetricsCollector;
  
  beforeEach(() => {
    collector = AIMetricsCollector.getInstance();
    collector.reset();
  });
  
  afterEach(() => {
    collector.reset();
  });
  
  describe('StreamingAIEngine Integration', () => {
    it('should record cache hit metrics', () => {
      const event: QueryEvent = {
        engineType: 'performance-optimized',
        query: 'test query',
        complexity: ComplexityLevel.SIMPLE,
        responseTime: 10,
        success: true,
        cacheHit: true,
        timestamp: Date.now(),
      };
      
      collector.recordQuery(event);
      const metrics = collector.getMetrics();
      
      expect(metrics.totalQueries).toBe(1);
      expect(metrics.cacheHitRate).toBe(1.0);
      expect(metrics.averageResponseTime).toBe(10);
    });
    
    it('should record predictive hit metrics', () => {
      const event: QueryEvent = {
        engineType: 'performance-optimized',
        query: 'common query',
        complexity: ComplexityLevel.SIMPLE,
        responseTime: 5,
        success: true,
        cacheHit: true,
        timestamp: Date.now(),
      };
      
      collector.recordQuery(event);
      const engineMetrics = collector.getEngineMetrics('performance-optimized');
      
      expect(engineMetrics?.totalQueries).toBe(1);
      expect(engineMetrics?.cacheHitRate).toBe(1.0);
      expect(engineMetrics?.averageResponseTime).toBe(5);
      expect(engineMetrics?.complexityDistribution.simple).toBe(1);
    });
    
    it('should record streaming query metrics', () => {
      const event: QueryEvent = {
        engineType: 'performance-optimized',
        query: 'streaming query',
        complexity: ComplexityLevel.SIMPLE,
        responseTime: 152,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      };
      
      collector.recordQuery(event);
      const engineMetrics = collector.getEngineMetrics('performance-optimized');
      
      expect(engineMetrics?.totalQueries).toBe(1);
      expect(engineMetrics?.successfulQueries).toBe(1);
      expect(engineMetrics?.cacheHitRate).toBe(0);
      expect(engineMetrics?.averageResponseTime).toBe(152);
    });
    
    it('should record error metrics', () => {
      const event: QueryEvent = {
        engineType: 'performance-optimized',
        query: 'failing query',
        complexity: ComplexityLevel.SIMPLE,
        responseTime: 100,
        success: false,
        cacheHit: false,
        error: 'unknown',
        timestamp: Date.now(),
      };
      
      collector.recordQuery(event);
      const metrics = collector.getMetrics();
      const engineMetrics = collector.getEngineMetrics('performance-optimized');
      
      expect(metrics.totalQueries).toBe(1);
      expect(metrics.totalErrors).toBe(1);
      expect(engineMetrics?.errorRate).toBe(1.0);
      expect(engineMetrics?.errorDistribution.unknown).toBe(1);
    });
  });
  
  describe('GoogleAIModeProcessor Integration', () => {
    it('should record simple query metrics', () => {
      const event: QueryEvent = {
        engineType: 'google-ai',
        query: 'short query',
        complexity: ComplexityLevel.SIMPLE,
        responseTime: 500,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
        metadata: {
          model: 'gemini-2.0-flash-lite',
          tokensUsed: 50,
          koreanNLPUsed: false,
        },
      };
      
      collector.recordQuery(event);
      const engineMetrics = collector.getEngineMetrics('google-ai');
      
      expect(engineMetrics?.totalQueries).toBe(1);
      expect(engineMetrics?.successfulQueries).toBe(1);
      expect(engineMetrics?.complexityDistribution.simple).toBe(1);
      expect(engineMetrics?.averageResponseTime).toBe(500);
    });
    
    it('should record medium complexity query metrics', () => {
      const event: QueryEvent = {
        engineType: 'google-ai',
        query: 'This is a medium length query that requires more processing and should be classified as medium complexity',
        complexity: ComplexityLevel.MEDIUM,
        responseTime: 800,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
        metadata: {
          model: 'gemini-2.0-flash',
          tokensUsed: 150,
          koreanNLPUsed: true,
        },
      };
      
      collector.recordQuery(event);
      const engineMetrics = collector.getEngineMetrics('google-ai');
      
      expect(engineMetrics?.totalQueries).toBe(1);
      expect(engineMetrics?.complexityDistribution.medium).toBe(1);
      expect(engineMetrics?.averageResponseTime).toBe(800);
    });
    
    it('should record complex query metrics', () => {
      const event: QueryEvent = {
        engineType: 'google-ai',
        query: 'This is a very long and complex query that requires significant processing power and multiple provider interactions. It should be classified as complex due to its length and the amount of context it requires. The query involves multiple steps and deep analysis.',
        complexity: ComplexityLevel.COMPLEX,
        responseTime: 1500,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
        metadata: {
          model: 'gemini-1.5-pro',
          tokensUsed: 500,
          koreanNLPUsed: true,
        },
      };
      
      collector.recordQuery(event);
      const engineMetrics = collector.getEngineMetrics('google-ai');
      
      expect(engineMetrics?.totalQueries).toBe(1);
      expect(engineMetrics?.complexityDistribution.complex).toBe(1);
      expect(engineMetrics?.averageResponseTime).toBe(1500);
    });
    
    it('should record RAG provider metrics', () => {
      const event: QueryEvent = {
        engineType: 'google-ai',
        provider: 'rag',
        query: 'query using RAG',
        complexity: ComplexityLevel.MEDIUM,
        responseTime: 600,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
        metadata: {
          model: 'gemini-2.0-flash',
          tokensUsed: 100,
          koreanNLPUsed: false,
        },
      };
      
      collector.recordQuery(event);
      const providerMetrics = collector.getProviderMetrics('google-ai', 'rag');
      
      expect(providerMetrics?.provider).toBe('rag');
      expect(providerMetrics?.totalRequests).toBe(1);
      expect(providerMetrics?.successfulRequests).toBe(1);
      expect(providerMetrics?.averageResponseTime).toBe(600);
    });
    
    it('should record API error metrics', () => {
      const event: QueryEvent = {
        engineType: 'google-ai',
        query: 'failing query',
        complexity: ComplexityLevel.SIMPLE,
        responseTime: 1000,
        success: false,
        cacheHit: false,
        error: 'api_error',
        timestamp: Date.now(),
      };
      
      collector.recordQuery(event);
      const engineMetrics = collector.getEngineMetrics('google-ai');
      
      expect(engineMetrics?.totalQueries).toBe(1);
      expect(engineMetrics?.failedQueries).toBe(1);
      expect(engineMetrics?.errorRate).toBe(1.0);
      expect(engineMetrics?.errorDistribution.api_error).toBe(1);
    });
  });
  
  describe('Multi-Engine Metrics', () => {
    it('should track metrics across multiple engines', () => {
      const streamingEvent: QueryEvent = {
        engineType: 'performance-optimized',
        query: 'streaming query',
        complexity: ComplexityLevel.SIMPLE,
        responseTime: 150,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      };
      
      const googleEvent: QueryEvent = {
        engineType: 'google-ai',
        query: 'google ai query',
        complexity: ComplexityLevel.MEDIUM,
        responseTime: 800,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
      };
      
      collector.recordQuery(streamingEvent);
      collector.recordQuery(googleEvent);
      
      const metrics = collector.getMetrics();
      const streamingMetrics = collector.getEngineMetrics('performance-optimized');
      const googleMetrics = collector.getEngineMetrics('google-ai');
      
      expect(metrics.totalQueries).toBe(2);
      expect(streamingMetrics?.totalQueries).toBe(1);
      expect(googleMetrics?.totalQueries).toBe(1);
      expect(metrics.averageResponseTime).toBe((150 + 800) / 2);
    });
    
    it('should calculate correct cache hit rate across engines', () => {
      const events: QueryEvent[] = [
        {
          engineType: 'performance-optimized',
          query: 'cached query 1',
          complexity: ComplexityLevel.SIMPLE,
          responseTime: 10,
          success: true,
          cacheHit: true,
          timestamp: Date.now(),
        },
        {
          engineType: 'performance-optimized',
          query: 'non-cached query 1',
          complexity: ComplexityLevel.SIMPLE,
          responseTime: 150,
          success: true,
          cacheHit: false,
          timestamp: Date.now(),
        },
        {
          engineType: 'google-ai',
          query: 'non-cached query 2',
          complexity: ComplexityLevel.MEDIUM,
          responseTime: 800,
          success: true,
          cacheHit: false,
          timestamp: Date.now(),
        },
      ];
      
      events.forEach(e => collector.recordQuery(e));
      
      const metrics = collector.getMetrics();
      expect(metrics.cacheHitRate).toBeCloseTo(1 / 3, 2);
    });
    
    it('should calculate correct error rate across engines', () => {
      const events: QueryEvent[] = [
        {
          engineType: 'performance-optimized',
          query: 'success query 1',
          complexity: ComplexityLevel.SIMPLE,
          responseTime: 150,
          success: true,
          cacheHit: false,
          timestamp: Date.now(),
        },
        {
          engineType: 'google-ai',
          query: 'failed query 1',
          complexity: ComplexityLevel.MEDIUM,
          responseTime: 1000,
          success: false,
          cacheHit: false,
          error: 'api_error',
          timestamp: Date.now(),
        },
        {
          engineType: 'google-ai',
          query: 'success query 2',
          complexity: ComplexityLevel.SIMPLE,
          responseTime: 500,
          success: true,
          cacheHit: false,
          timestamp: Date.now(),
        },
      ];
      
      events.forEach(e => collector.recordQuery(e));
      
      const metrics = collector.getMetrics();
      expect(metrics.errorRate).toBeCloseTo(1 / 3, 2);
    });
  });
  
  describe('Metrics Export', () => {
    it('should export complete metrics data', () => {
      const event: QueryEvent = {
        engineType: 'google-ai',
        provider: 'rag',
        query: 'test query',
        complexity: ComplexityLevel.SIMPLE,
        responseTime: 500,
        success: true,
        cacheHit: false,
        timestamp: Date.now(),
        metadata: {
          model: 'gemini-2.0-flash',
          tokensUsed: 100,
        },
      };
      
      collector.recordQuery(event);
      const exported = collector.exportMetrics();
      const parsed = JSON.parse(exported);
      
      expect(parsed).toHaveProperty('metrics');
      expect(parsed).toHaveProperty('queryHistory');
      expect(parsed).toHaveProperty('timeSeries');
      expect(parsed).toHaveProperty('config');
      expect(parsed.metrics.totalQueries).toBe(1);
      expect(parsed.queryHistory).toHaveLength(1);
    });
  });
});
