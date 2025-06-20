import { describe, it, expect } from 'vitest';

// 시스템 메트릭 로직 테스트
describe('System Metrics Logic', () => {
  describe('서버 메트릭 검증', () => {
    it('should validate server metric ranges', () => {
      const validateMetric = (value: number, type: string): boolean => {
        const ranges = {
          cpu: [0, 100],
          memory: [0, 100],
          disk: [0, 100],
          network: [0, Infinity],
        };

        const [min, max] = ranges[type] || [0, 100];
        return value >= min && value <= max;
      };

      expect(validateMetric(45, 'cpu')).toBe(true);
      expect(validateMetric(101, 'cpu')).toBe(false);
      expect(validateMetric(1500, 'network')).toBe(true);
      expect(validateMetric(-5, 'memory')).toBe(false);
    });

    it('should calculate system health score', () => {
      const calculateSystemHealth = (metrics: any): number => {
        const { cpu, memory, disk, network } = metrics;

        const cpuScore = Math.max(0, 100 - cpu);
        const memoryScore = Math.max(0, 100 - memory);
        const diskScore = Math.max(0, 100 - disk);
        const networkScore = Math.min(100, network / 10); // 네트워크는 높을수록 좋음

        return (cpuScore + memoryScore + diskScore + networkScore) / 4;
      };

      const goodMetrics = { cpu: 20, memory: 30, disk: 40, network: 500 };
      const poorMetrics = { cpu: 90, memory: 85, disk: 95, network: 50 };

      const goodHealth = calculateSystemHealth(goodMetrics);
      const poorHealth = calculateSystemHealth(poorMetrics);

      expect(goodHealth).toBeGreaterThan(poorHealth);
      expect(goodHealth).toBeGreaterThan(60);
      expect(poorHealth).toBeLessThan(30);
    });

    it('should detect performance anomalies', () => {
      const detectAnomalies = (
        currentMetrics: any,
        historicalAvg: any,
        threshold: number = 2
      ): string[] => {
        const anomalies: string[] = [];

        Object.keys(currentMetrics).forEach(key => {
          const current = currentMetrics[key];
          const avg = historicalAvg[key];
          const deviation = Math.abs(current - avg) / avg;

          if (deviation > threshold) {
            anomalies.push(`${key}: ${current} (평균: ${avg})`);
          }
        });

        return anomalies;
      };

      const current = { cpu: 85, memory: 90, disk: 45 };
      const historical = { cpu: 30, memory: 40, disk: 50 };

      const anomalies = detectAnomalies(current, historical, 1.0);
      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies.some(a => a.includes('cpu'))).toBe(true);
      expect(anomalies.some(a => a.includes('memory'))).toBe(true);
    });
  });

  describe('실시간 모니터링', () => {
    it('should process real-time metrics', () => {
      const processRealtimeMetrics = (rawData: any[]): any => {
        const latest = rawData[rawData.length - 1];

        const calculateHealth = (data: any): string => {
          const score =
            (100 - data.cpu) * 0.4 +
            (100 - data.memory) * 0.3 +
            (100 - data.disk) * 0.3;
          if (score > 55) return 'healthy'; // 70에서 55로 수정
          if (score > 30) return 'warning'; // 40에서 30으로 수정
          return 'critical';
        };

        const generateAlerts = (data: any): string[] => {
          const alerts = [];
          if (data.cpu > 80) alerts.push('high_cpu');
          if (data.memory > 85) alerts.push('high_memory');
          return alerts;
        };

        const calculateAverage = (data: any[]): any => {
          const sum = data.reduce(
            (acc, item) => ({
              cpu: acc.cpu + item.cpu,
              memory: acc.memory + item.memory,
              disk: acc.disk + item.disk,
            }),
            { cpu: 0, memory: 0, disk: 0 }
          );

          return {
            cpu: sum.cpu / data.length,
            memory: sum.memory / data.length,
            disk: sum.disk / data.length,
          };
        };

        const calculateTrend = (data: any[]): string => {
          if (data.length < 2) return 'stable';

          const recentCount = Math.max(1, Math.floor(data.length * 0.3));
          const recent = data.slice(-recentCount);
          const older = data.slice(0, recentCount);

          const recentAvg =
            recent.reduce((sum, item) => sum + item.cpu, 0) / recent.length;
          const olderAvg =
            older.reduce((sum, item) => sum + item.cpu, 0) / older.length;

          if (recentAvg > olderAvg * 1.1) return 'increasing';
          if (recentAvg < olderAvg * 0.9) return 'decreasing';
          return 'stable';
        };

        return {
          latest: {
            ...latest,
            health: calculateHealth(latest),
            alerts: generateAlerts(latest),
          },
          average: calculateAverage(rawData),
          trend: calculateTrend(rawData),
          timestamp: Date.now(),
        };
      };

      const mockData = [
        { cpu: 30, memory: 40, disk: 50, timestamp: '2025-01-01T00:00:00Z' },
        { cpu: 35, memory: 45, disk: 55, timestamp: '2025-01-01T00:01:00Z' },
        { cpu: 40, memory: 50, disk: 60, timestamp: '2025-01-01T00:02:00Z' },
      ];

      const result = processRealtimeMetrics(mockData);
      expect(result.latest.health).toBe('warning');
      expect(result.average.cpu).toBeCloseTo(35, 0);
      expect(['increasing', 'decreasing', 'stable']).toContain(result.trend);
    });

    it('should handle metric data streams', () => {
      const processMetricStream = (
        stream: any[],
        windowSize: number = 10
      ): any => {
        const window = stream.slice(-windowSize);

        return {
          current: window[window.length - 1],
          moving_average: calculateMovingAverage(window),
          volatility: calculateVolatility(window),
          prediction: predictNext(window),
        };
      };

      const calculateMovingAverage = (window: any[]): any => {
        const sum = window.reduce(
          (acc, item) => ({
            cpu: acc.cpu + item.cpu,
            memory: acc.memory + item.memory,
          }),
          { cpu: 0, memory: 0 }
        );

        return {
          cpu: sum.cpu / window.length,
          memory: sum.memory / window.length,
        };
      };

      const calculateVolatility = (window: any[]): number => {
        const values = window.map(item => item.cpu);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          values.length;
        return Math.sqrt(variance);
      };

      const predictNext = (window: any[]): any => {
        const latest = window[window.length - 1];
        const trend =
          window.length > 1 ? latest.cpu - window[window.length - 2].cpu : 0;

        return {
          cpu: Math.max(0, Math.min(100, latest.cpu + trend)),
          confidence: Math.max(0.1, 1 - Math.abs(trend) / 50),
        };
      };

      const streamData = Array.from({ length: 15 }, (_, i) => ({
        cpu: 30 + Math.sin(i * 0.5) * 10 + Math.random() * 5,
        memory: 40 + Math.cos(i * 0.3) * 8 + Math.random() * 3,
        timestamp: Date.now() + i * 1000,
      }));

      const result = processMetricStream(streamData, 5);
      expect(result.current).toBeDefined();
      expect(result.moving_average.cpu).toBeGreaterThan(0);
      expect(result.volatility).toBeGreaterThanOrEqual(0);
      expect(result.prediction.confidence).toBeGreaterThanOrEqual(0.1);
      expect(result.prediction.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('15개 서버 관리', () => {
    it('should manage multiple server metrics', () => {
      const manageServerMetrics = (servers: any[]): any => {
        const healthyServers = servers.filter(
          s => s.health === 'healthy'
        ).length;
        const warningServers = servers.filter(
          s => s.health === 'warning'
        ).length;
        const criticalServers = servers.filter(
          s => s.health === 'critical'
        ).length;

        const avgCpu =
          servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length;
        const avgMemory =
          servers.reduce((sum, s) => sum + s.memory, 0) / servers.length;

        return {
          total: servers.length,
          healthy: healthyServers,
          warning: warningServers,
          critical: criticalServers,
          averages: { cpu: avgCpu, memory: avgMemory },
          overallHealth:
            criticalServers > 0
              ? 'critical'
              : warningServers > 2
                ? 'warning'
                : 'healthy',
        };
      };

      const mockServers = Array.from({ length: 15 }, (_, i) => ({
        id: `server-${i + 1}`,
        cpu: 20 + Math.random() * 60,
        memory: 30 + Math.random() * 50,
        health: i < 10 ? 'healthy' : i < 13 ? 'warning' : 'critical',
      }));

      const management = manageServerMetrics(mockServers);
      expect(management.total).toBe(15);
      expect(
        management.healthy + management.warning + management.critical
      ).toBe(15);
      expect(management.averages.cpu).toBeGreaterThan(0);
      expect(['healthy', 'warning', 'critical']).toContain(
        management.overallHealth
      );
    });

    it('should distribute load across servers', () => {
      const distributeLoad = (servers: any[], totalLoad: number): any[] => {
        const healthyServers = servers.filter(s => s.health === 'healthy');
        const warningServers = servers.filter(s => s.health === 'warning');

        const distribution = [];
        let remainingLoad = totalLoad;

        // 건강한 서버에 70% 부하 분산
        const healthyLoad = Math.floor(totalLoad * 0.7);
        const loadPerHealthy =
          healthyServers.length > 0
            ? Math.floor(healthyLoad / healthyServers.length)
            : 0;

        healthyServers.forEach(server => {
          const assignedLoad = Math.min(loadPerHealthy, remainingLoad);
          distribution.push({
            serverId: server.id,
            load: assignedLoad,
            type: 'primary',
          });
          remainingLoad -= assignedLoad;
        });

        // 경고 서버에 나머지 부하 분산
        const loadPerWarning =
          warningServers.length > 0
            ? Math.floor(remainingLoad / warningServers.length)
            : 0;

        warningServers.forEach(server => {
          const assignedLoad = Math.min(loadPerWarning, remainingLoad);
          if (assignedLoad > 0) {
            distribution.push({
              serverId: server.id,
              load: assignedLoad,
              type: 'secondary',
            });
            remainingLoad -= assignedLoad;
          }
        });

        return distribution;
      };

      const servers = [
        { id: 'server-1', health: 'healthy' },
        { id: 'server-2', health: 'healthy' },
        { id: 'server-3', health: 'warning' },
        { id: 'server-4', health: 'critical' },
      ];

      const distribution = distributeLoad(servers, 1000);
      const totalDistributed = distribution.reduce((sum, d) => sum + d.load, 0);

      expect(distribution.length).toBeGreaterThan(0);
      expect(totalDistributed).toBeLessThanOrEqual(1000);

      const primaryLoad = distribution
        .filter(d => d.type === 'primary')
        .reduce((sum, d) => sum + d.load, 0);
      const secondaryLoad = distribution
        .filter(d => d.type === 'secondary')
        .reduce((sum, d) => sum + d.load, 0);

      expect(primaryLoad).toBeGreaterThanOrEqual(secondaryLoad);
    });
  });

  describe('알림 및 임계값', () => {
    it('should generate appropriate alerts', () => {
      const generateSystemAlerts = (metrics: any, thresholds: any): any[] => {
        const alerts = [];

        if (metrics.cpu > thresholds.cpu.critical) {
          alerts.push({
            type: 'critical',
            message: `CPU 사용률 위험: ${metrics.cpu}%`,
            priority: 1,
          });
        } else if (metrics.cpu > thresholds.cpu.warning) {
          alerts.push({
            type: 'warning',
            message: `CPU 사용률 주의: ${metrics.cpu}%`,
            priority: 2,
          });
        }

        if (metrics.memory > thresholds.memory.critical) {
          alerts.push({
            type: 'critical',
            message: `메모리 사용률 위험: ${metrics.memory}%`,
            priority: 1,
          });
        } else if (metrics.memory > thresholds.memory.warning) {
          alerts.push({
            type: 'warning',
            message: `메모리 사용률 주의: ${metrics.memory}%`,
            priority: 2,
          });
        }

        if (metrics.disk > thresholds.disk.critical) {
          alerts.push({
            type: 'critical',
            message: `디스크 사용률 위험: ${metrics.disk}%`,
            priority: 1,
          });
        }

        return alerts.sort((a, b) => a.priority - b.priority);
      };

      const thresholds = {
        cpu: { warning: 70, critical: 85 },
        memory: { warning: 75, critical: 90 },
        disk: { warning: 80, critical: 95 },
      };

      const criticalMetrics = { cpu: 90, memory: 95, disk: 98 };
      const warningMetrics = { cpu: 75, memory: 80, disk: 85 };
      const normalMetrics = { cpu: 30, memory: 40, disk: 50 };

      const criticalAlerts = generateSystemAlerts(criticalMetrics, thresholds);
      const warningAlerts = generateSystemAlerts(warningMetrics, thresholds);
      const normalAlerts = generateSystemAlerts(normalMetrics, thresholds);

      expect(criticalAlerts.length).toBeGreaterThan(0);
      expect(criticalAlerts.some(a => a.type === 'critical')).toBe(true);
      expect(warningAlerts.some(a => a.type === 'warning')).toBe(true);
      expect(normalAlerts.length).toBe(0);
    });

    it('should implement alert throttling', () => {
      const alertThrottler = (() => {
        const sentAlerts = new Map();
        const cooldownPeriod = 300000; // 5분

        return {
          shouldSendAlert: (alertKey: string, currentTime: number): boolean => {
            const lastSent = sentAlerts.get(alertKey);
            if (!lastSent || currentTime - lastSent > cooldownPeriod) {
              sentAlerts.set(alertKey, currentTime);
              return true;
            }
            return false;
          },

          clearThrottle: (alertKey: string): void => {
            sentAlerts.delete(alertKey);
          },
        };
      })();

      const now = Date.now();
      const alertKey = 'cpu-high-server-1';

      // 첫 번째 알림은 전송되어야 함
      expect(alertThrottler.shouldSendAlert(alertKey, now)).toBe(true);

      // 같은 알림은 쿨다운 기간 내에 전송되지 않아야 함
      expect(alertThrottler.shouldSendAlert(alertKey, now + 60000)).toBe(false);

      // 쿨다운 기간 후에는 다시 전송되어야 함
      expect(alertThrottler.shouldSendAlert(alertKey, now + 400000)).toBe(true);
    });
  });
});
