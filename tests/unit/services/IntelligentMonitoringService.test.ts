/**
 * 🧠 Intelligent Monitoring Service - Unit Tests
 *
 * @description
 * Tests for anomaly detection and trend prediction integration
 *
 * @date 2025-11-21
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  IntelligentMonitoringService,
  getIntelligentMonitoringService,
  type MetricHistory,
} from '@/services/ai/IntelligentMonitoringService';
import type { ServerMetrics } from '@/types/unified-server';

describe('IntelligentMonitoringService', () => {
  let service: IntelligentMonitoringService;

  beforeEach(() => {
    service = getIntelligentMonitoringService();
  });

  describe('analyzeServerMetrics', () => {
    it('should populate EnhancedServerMetrics with AI analysis', () => {
      // Arrange: Create current metrics
      const currentMetrics: ServerMetrics = {
        cpu: 75,
        memory: 82,
        disk: 65,
        network: 50,
        timestamp: new Date().toISOString(),
      };

      // Arrange: Create historical data (26 hours of data)
      const now = Date.now();
      const historicalData: MetricHistory = {
        cpu: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000, // 5-minute intervals
          value: 70 + Math.random() * 10, // 70-80% baseline
        })),
        memory: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 75 + Math.random() * 10, // 75-85% baseline
        })),
        disk: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 60 + Math.random() * 10, // 60-70% baseline
        })),
        network: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 45 + Math.random() * 10, // 45-55% baseline
        })),
      };

      // Act
      const result = service.analyzeServerMetrics(
        currentMetrics,
        historicalData
      );

      // Assert: Check structure
      expect(result).toBeDefined();
      expect(result.aiAnalysis).toBeDefined();
      expect(result.trends).toBeDefined();

      // Assert: AI Analysis structure
      expect(result.aiAnalysis).toHaveProperty('anomalyScore');
      expect(result.aiAnalysis).toHaveProperty('predictedIssues');
      expect(result.aiAnalysis).toHaveProperty('recommendations');
      expect(result.aiAnalysis).toHaveProperty('confidence');

      // Assert: Trends structure
      expect(result.trends).toHaveProperty('cpu');
      expect(result.trends).toHaveProperty('memory');
      expect(result.trends).toHaveProperty('disk');
      expect(result.trends).toHaveProperty('network');

      // Assert: Types
      expect(typeof result.aiAnalysis?.anomalyScore).toBe('number');
      expect(typeof result.aiAnalysis?.confidence).toBe('number');
      expect(Array.isArray(result.aiAnalysis?.predictedIssues)).toBe(true);
      expect(Array.isArray(result.aiAnalysis?.recommendations)).toBe(true);
    });

    it('should detect high CPU anomaly', () => {
      // Arrange: Current metrics with HIGH CPU (spike)
      const currentMetrics: ServerMetrics = {
        cpu: 95, // High spike
        memory: 75,
        disk: 60,
        network: 50,
        timestamp: new Date().toISOString(),
      };

      // Arrange: Historical data with normal CPU
      const now = Date.now();
      const historicalData: MetricHistory = {
        cpu: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 50 + Math.random() * 10, // Normal: 50-60%
        })),
        memory: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 70 + Math.random() * 10,
        })),
        disk: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 55 + Math.random() * 10,
        })),
        network: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 45 + Math.random() * 10,
        })),
      };

      // Act
      const result = service.analyzeServerMetrics(
        currentMetrics,
        historicalData
      );

      // Assert: Should detect anomaly
      expect(result.aiAnalysis?.anomalyScore).toBeGreaterThan(0.5);
      expect(result.aiAnalysis?.predictedIssues.length).toBeGreaterThan(0);
      expect(
        result.aiAnalysis?.recommendations.some((r) => r.includes('CPU'))
      ).toBe(true);
    });

    it('should predict increasing trend', () => {
      // Arrange: Current metrics
      const currentMetrics: ServerMetrics = {
        cpu: 75,
        memory: 82,
        disk: 65,
        network: 50,
        timestamp: new Date().toISOString(),
      };

      // Arrange: Historical data with INCREASING TREND
      const now = Date.now();
      const historicalData: MetricHistory = {
        // CPU: Strong increasing trend in last 12 points (50% → 65%, 30% increase)
        // TrendPredictor uses last 12 points with slopeThreshold = 0.1 (10%)
        cpu: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: i < 300 ? 50 : 50 + ((i - 300) / 12) * 15, // Last 12 points: 50% → 65%
        })),
        memory: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 70 + Math.random() * 10,
        })),
        disk: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 60 + Math.random() * 10,
        })),
        network: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 45 + Math.random() * 10,
        })),
      };

      // Act
      const result = service.analyzeServerMetrics(
        currentMetrics,
        historicalData
      );

      // Assert: CPU trend should be increasing
      expect(result.trends?.cpu).toBe('increasing');
    });

    it('should generate recommendations', () => {
      // Arrange
      const currentMetrics: ServerMetrics = {
        cpu: 75,
        memory: 82,
        disk: 65,
        network: 50,
        timestamp: new Date().toISOString(),
      };

      const now = Date.now();
      const historicalData: MetricHistory = {
        cpu: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 70 + Math.random() * 10,
        })),
        memory: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 75 + Math.random() * 10,
        })),
        disk: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 60 + Math.random() * 10,
        })),
        network: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 45 + Math.random() * 10,
        })),
      };

      // Act
      const result = service.analyzeServerMetrics(
        currentMetrics,
        historicalData
      );

      // Assert: Should have recommendations (max 5)
      expect(result.aiAnalysis?.recommendations).toBeDefined();
      expect(result.aiAnalysis?.recommendations.length).toBeGreaterThan(0);
      expect(result.aiAnalysis?.recommendations.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getDetailedAnalysis', () => {
    it('should return detailed analysis result', () => {
      // Arrange
      const currentMetrics: ServerMetrics = {
        cpu: 75,
        memory: 82,
        disk: 65,
        network: 50,
        timestamp: new Date().toISOString(),
      };

      const now = Date.now();
      const historicalData: MetricHistory = {
        cpu: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 70 + Math.random() * 10,
        })),
        memory: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 75 + Math.random() * 10,
        })),
        disk: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 60 + Math.random() * 10,
        })),
        network: Array.from({ length: 312 }, (_, i) => ({
          timestamp: now - (311 - i) * 5 * 60 * 1000,
          value: 45 + Math.random() * 10,
        })),
      };

      // Act
      const result = service.getDetailedAnalysis(
        currentMetrics,
        historicalData
      );

      // Assert: Check structure
      expect(result).toBeDefined();
      expect(result).toHaveProperty('anomalies');
      expect(result).toHaveProperty('trends');
      expect(result).toHaveProperty('aggregateAnomalyScore');
      expect(result).toHaveProperty('recommendationsGenerated');
      expect(result).toHaveProperty('timestamp');

      // Assert: Check anomalies for each metric
      expect(result.anomalies).toHaveProperty('cpu');
      expect(result.anomalies).toHaveProperty('memory');
      expect(result.anomalies).toHaveProperty('disk');
      expect(result.anomalies).toHaveProperty('network');

      // Assert: Check trends for each metric
      expect(result.trends).toHaveProperty('cpu');
      expect(result.trends).toHaveProperty('memory');
      expect(result.trends).toHaveProperty('disk');
      expect(result.trends).toHaveProperty('network');
    });
  });
});
