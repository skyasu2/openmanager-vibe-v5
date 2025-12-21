/**
 * @vitest-environment node
 */

/**
 * 🎯 MetricsProvider - Unit Tests
 *
 * @description
 * Tests for KST-based fixed metrics data provider (Single Source of Truth)
 *
 * @date 2025-12-22
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getKSTMinuteOfDay,
  getKSTTimestamp,
  MetricsProvider,
  metricsProvider,
  type ServerMetrics,
  type SystemSummary,
} from './MetricsProvider';

describe('MetricsProvider', () => {
  describe('getKSTMinuteOfDay', () => {
    it('should return a multiple of 10 (10-minute slots)', () => {
      const minuteOfDay = getKSTMinuteOfDay();
      expect(minuteOfDay % 10).toBe(0);
    });

    it('should return value between 0 and 1430 (inclusive)', () => {
      const minuteOfDay = getKSTMinuteOfDay();
      expect(minuteOfDay).toBeGreaterThanOrEqual(0);
      expect(minuteOfDay).toBeLessThanOrEqual(1430); // 23:50 = 1430
    });

    it('should calculate correct KST offset from UTC', () => {
      // Mock a specific UTC time (e.g., 00:00 UTC = 09:00 KST)
      const mockDate = new Date('2025-12-22T00:00:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const minuteOfDay = getKSTMinuteOfDay();
      // 09:00 KST = 540 minutes, rounded to 10-min = 540
      expect(minuteOfDay).toBe(540);

      vi.useRealTimers();
    });

    it('should handle day boundary correctly', () => {
      // Mock 23:55 KST (14:55 UTC)
      const mockDate = new Date('2025-12-22T14:55:00.000Z');
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const minuteOfDay = getKSTMinuteOfDay();
      // 23:55 KST = 1435 minutes, rounded down to 1430
      expect(minuteOfDay).toBe(1430);

      vi.useRealTimers();
    });
  });

  describe('getKSTTimestamp', () => {
    it('should return ISO 8601 format with KST offset', () => {
      const timestamp = getKSTTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(timestamp).toContain('+09:00');
    });

    it('should not contain Z (UTC indicator)', () => {
      const timestamp = getKSTTimestamp();
      expect(timestamp).not.toContain('Z');
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = MetricsProvider.getInstance();
      const instance2 = MetricsProvider.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should match exported singleton', () => {
      const instance = MetricsProvider.getInstance();
      expect(instance).toBe(metricsProvider);
    });
  });

  describe('getServerList', () => {
    it('should return array of servers', () => {
      const serverList = metricsProvider.getServerList();
      expect(Array.isArray(serverList)).toBe(true);
      expect(serverList.length).toBeGreaterThan(0);
    });

    it('should have correct server structure', () => {
      const serverList = metricsProvider.getServerList();
      const server = serverList[0];

      expect(server).toHaveProperty('serverId');
      expect(server).toHaveProperty('serverType');
      expect(server).toHaveProperty('location');

      expect(typeof server.serverId).toBe('string');
      expect(typeof server.serverType).toBe('string');
      expect(typeof server.location).toBe('string');
    });

    it('should have unique server IDs', () => {
      const serverList = metricsProvider.getServerList();
      const serverIds = serverList.map((s) => s.serverId);
      const uniqueIds = new Set(serverIds);
      expect(uniqueIds.size).toBe(serverIds.length);
    });
  });

  describe('getServerMetrics', () => {
    it('should return null for non-existent server', () => {
      const metrics = metricsProvider.getServerMetrics('non-existent-server');
      expect(metrics).toBeNull();
    });

    it('should return valid metrics for existing server', () => {
      const serverList = metricsProvider.getServerList();
      const firstServerId = serverList[0].serverId;

      const metrics = metricsProvider.getServerMetrics(firstServerId);
      expect(metrics).not.toBeNull();

      if (metrics) {
        expect(metrics.serverId).toBe(firstServerId);
        expect(typeof metrics.cpu).toBe('number');
        expect(typeof metrics.memory).toBe('number');
        expect(typeof metrics.disk).toBe('number');
        expect(typeof metrics.network).toBe('number');
        expect(['online', 'warning', 'critical', 'offline']).toContain(
          metrics.status
        );
      }
    });

    it('should have metrics in valid range (0-100)', () => {
      const serverList = metricsProvider.getServerList();
      const metrics = metricsProvider.getServerMetrics(serverList[0].serverId);

      if (metrics) {
        expect(metrics.cpu).toBeGreaterThanOrEqual(0);
        expect(metrics.cpu).toBeLessThanOrEqual(100);
        expect(metrics.memory).toBeGreaterThanOrEqual(0);
        expect(metrics.memory).toBeLessThanOrEqual(100);
        expect(metrics.disk).toBeGreaterThanOrEqual(0);
        expect(metrics.disk).toBeLessThanOrEqual(100);
        expect(metrics.network).toBeGreaterThanOrEqual(0);
        expect(metrics.network).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('getAllServerMetrics', () => {
    it('should return metrics for all servers', () => {
      const allMetrics = metricsProvider.getAllServerMetrics();
      const serverList = metricsProvider.getServerList();

      expect(allMetrics.length).toBe(serverList.length);
    });

    it('should have consistent timestamp across all metrics', () => {
      const allMetrics = metricsProvider.getAllServerMetrics();

      if (allMetrics.length > 1) {
        const firstTimestamp = allMetrics[0].timestamp;
        const firstMinuteOfDay = allMetrics[0].minuteOfDay;

        allMetrics.forEach((metric) => {
          // Timestamps should be close (within same second)
          expect(metric.timestamp.substring(0, 19)).toBe(
            firstTimestamp.substring(0, 19)
          );
          expect(metric.minuteOfDay).toBe(firstMinuteOfDay);
        });
      }
    });
  });

  describe('getSystemSummary', () => {
    it('should return valid summary structure', () => {
      const summary = metricsProvider.getSystemSummary();

      expect(summary).toHaveProperty('timestamp');
      expect(summary).toHaveProperty('minuteOfDay');
      expect(summary).toHaveProperty('totalServers');
      expect(summary).toHaveProperty('onlineServers');
      expect(summary).toHaveProperty('warningServers');
      expect(summary).toHaveProperty('criticalServers');
      expect(summary).toHaveProperty('averageCpu');
      expect(summary).toHaveProperty('averageMemory');
      expect(summary).toHaveProperty('averageDisk');
      expect(summary).toHaveProperty('averageNetwork');
    });

    it('should have correct server count', () => {
      const summary = metricsProvider.getSystemSummary();
      const serverList = metricsProvider.getServerList();

      expect(summary.totalServers).toBe(serverList.length);
    });

    it('should have status counts that sum to total', () => {
      const summary = metricsProvider.getSystemSummary();

      const statusSum =
        summary.onlineServers +
        summary.warningServers +
        summary.criticalServers;
      // Note: offline is excluded from these counts
      expect(statusSum).toBeLessThanOrEqual(summary.totalServers);
    });

    it('should have average metrics in valid range', () => {
      const summary = metricsProvider.getSystemSummary();

      expect(summary.averageCpu).toBeGreaterThanOrEqual(0);
      expect(summary.averageCpu).toBeLessThanOrEqual(100);
      expect(summary.averageMemory).toBeGreaterThanOrEqual(0);
      expect(summary.averageMemory).toBeLessThanOrEqual(100);
      expect(summary.averageDisk).toBeGreaterThanOrEqual(0);
      expect(summary.averageDisk).toBeLessThanOrEqual(100);
      expect(summary.averageNetwork).toBeGreaterThanOrEqual(0);
      expect(summary.averageNetwork).toBeLessThanOrEqual(100);
    });
  });

  describe('getMetricsAtTime', () => {
    it('should return null for non-existent server', () => {
      const metrics = metricsProvider.getMetricsAtTime(
        'non-existent-server',
        540
      );
      expect(metrics).toBeNull();
    });

    it('should return metrics for valid server and time', () => {
      const serverList = metricsProvider.getServerList();
      const firstServerId = serverList[0].serverId;

      // Test with a valid 10-minute slot (e.g., 09:00 = 540)
      const metrics = metricsProvider.getMetricsAtTime(firstServerId, 540);

      // May return null if no data at that time slot
      if (metrics) {
        expect(typeof metrics.cpu).toBe('number');
        expect(typeof metrics.memory).toBe('number');
        expect(typeof metrics.disk).toBe('number');
        expect(typeof metrics.network).toBe('number');
      }
    });
  });

  describe('getTimeInfo', () => {
    it('should return debug time information', () => {
      const timeInfo = metricsProvider.getTimeInfo();

      expect(timeInfo).toHaveProperty('kstTime');
      expect(timeInfo).toHaveProperty('minuteOfDay');
      expect(timeInfo).toHaveProperty('slotIndex');
      expect(timeInfo).toHaveProperty('humanReadable');
    });

    it('should have consistent minuteOfDay with getKSTMinuteOfDay', () => {
      const timeInfo = metricsProvider.getTimeInfo();
      const minuteOfDay = getKSTMinuteOfDay();

      expect(timeInfo.minuteOfDay).toBe(minuteOfDay);
    });

    it('should have correct slotIndex calculation', () => {
      const timeInfo = metricsProvider.getTimeInfo();

      expect(timeInfo.slotIndex).toBe(timeInfo.minuteOfDay / 10);
    });

    it('should have valid humanReadable format (HH:MM KST)', () => {
      const timeInfo = metricsProvider.getTimeInfo();

      expect(timeInfo.humanReadable).toMatch(/^\d{2}:\d{2} KST$/);
    });
  });

  describe('Status Determination', () => {
    it('should mark as critical when any metric >= 90%', () => {
      // This test verifies the determineStatus logic indirectly
      const allMetrics = metricsProvider.getAllServerMetrics();

      allMetrics.forEach((metric) => {
        if (
          metric.cpu >= 90 ||
          metric.memory >= 90 ||
          metric.disk >= 95 ||
          metric.network >= 90
        ) {
          expect(metric.status).toBe('critical');
        }
      });
    });

    it('should mark as warning when any metric >= 80% (but not critical)', () => {
      const allMetrics = metricsProvider.getAllServerMetrics();

      allMetrics.forEach((metric) => {
        const isCritical =
          metric.cpu >= 90 ||
          metric.memory >= 90 ||
          metric.disk >= 95 ||
          metric.network >= 90;
        const isWarning =
          metric.cpu >= 80 ||
          metric.memory >= 80 ||
          metric.disk >= 85 ||
          metric.network >= 80;

        if (isWarning && !isCritical) {
          expect(metric.status).toBe('warning');
        }
      });
    });
  });
});
