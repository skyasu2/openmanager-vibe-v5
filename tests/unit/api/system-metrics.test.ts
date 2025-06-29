import { beforeEach, describe, expect, it, vi } from 'vitest';

// 🧪 시스템 메트릭 API 테스트용 타입 정의
interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: {
    in: number;
    out: number;
  };
}

// 시스템 메트릭 로직 테스트
describe('System Metrics Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('서버 메트릭 검증', () => {
    it('should validate server metric ranges', () => {
      const validateMetric = (value: number, type: string): boolean => {
        const ranges: Record<string, [number, number]> = {
          cpu: [0, 100],
          memory: [0, 100],
          disk: [0, 100],
          network: [0, 10000],
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
      const calculateSystemHealth = (metrics: SystemMetrics): number => {
        const { cpu, memory, disk, network } = metrics;

        const cpuScore = Math.max(0, 100 - cpu);
        const memoryScore = Math.max(0, 100 - memory);
        const diskScore = Math.max(0, 100 - disk);
        const networkScore = Math.min(100, network.in / 10); // 네트워크는 높을수록 좋음

        return (cpuScore + memoryScore + diskScore + networkScore) / 4;
      };

      const goodMetrics: SystemMetrics = {
        cpu: 20,
        memory: 30,
        disk: 40,
        network: { in: 500, out: 300 },
      };
      const poorMetrics: SystemMetrics = {
        cpu: 90,
        memory: 85,
        disk: 95,
        network: { in: 50, out: 30 },
      };

      const goodHealth = calculateSystemHealth(goodMetrics);
      const poorHealth = calculateSystemHealth(poorMetrics);

      expect(goodHealth).toBeGreaterThan(poorHealth);
      expect(goodHealth).toBeGreaterThan(60);
      expect(poorHealth).toBeLessThan(30);
    });

    it('should detect performance anomalies', () => {
      const detectAnomalies = (
        currentMetrics: Record<string, number>,
        historicalAvg: Record<string, number>,
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
      interface RawMetricData {
        cpu: number;
        memory: number;
        disk: number;
        timestamp: string;
      }

      interface ProcessedResult {
        latest: RawMetricData & {
          health: string;
          alerts: string[];
        };
        average: Pick<RawMetricData, 'cpu' | 'memory' | 'disk'>;
        trend: string;
        timestamp: number;
      }

      const processRealtimeMetrics = (
        rawData: RawMetricData[]
      ): ProcessedResult => {
        const latest = rawData[rawData.length - 1];

        const calculateHealth = (data: RawMetricData): string => {
          const score =
            (100 - data.cpu) * 0.4 +
            (100 - data.memory) * 0.3 +
            (100 - data.disk) * 0.3;
          if (score > 55) return 'healthy'; // 70에서 55로 수정
          if (score > 30) return 'warning'; // 40에서 30으로 수정
          return 'critical';
        };

        const generateAlerts = (data: RawMetricData): string[] => {
          const alerts: any[] = [];
          if (data.cpu > 80) alerts.push('high_cpu');
          if (data.memory > 85) alerts.push('high_memory');
          return alerts;
        };

        const calculateAverage = (
          data: RawMetricData[]
        ): Pick<RawMetricData, 'cpu' | 'memory' | 'disk'> => {
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

        const calculateTrend = (data: RawMetricData[]): string => {
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

      const mockData: RawMetricData[] = [
        { cpu: 30, memory: 40, disk: 50, timestamp: '2025-06-01T00:00:00Z' },
        { cpu: 35, memory: 45, disk: 55, timestamp: '2025-06-01T00:01:00Z' },
        { cpu: 40, memory: 50, disk: 60, timestamp: '2025-06-01T00:02:00Z' },
      ];

      const result = processRealtimeMetrics(mockData);
      expect(result.latest.health).toBe('warning');
      expect(result.average.cpu).toBeCloseTo(35, 0);
      expect(['increasing', 'decreasing', 'stable']).toContain(result.trend);
    });

    it('should handle metric data streams', () => {
      interface StreamData {
        cpu: number;
        memory: number;
        timestamp: number;
      }

      interface StreamResult {
        current: StreamData;
        moving_average: Pick<StreamData, 'cpu' | 'memory'>;
        volatility: number;
        prediction: {
          cpu: number;
          confidence: number;
        };
      }

      const processMetricStream = (
        stream: StreamData[],
        windowSize: number = 10
      ): StreamResult => {
        const window = stream.slice(-windowSize);

        return {
          current: window[window.length - 1],
          moving_average: calculateMovingAverage(window),
          volatility: calculateVolatility(window),
          prediction: predictNext(window),
        };
      };

      const calculateMovingAverage = (
        window: StreamData[]
      ): Pick<StreamData, 'cpu' | 'memory'> => {
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

      const calculateVolatility = (window: StreamData[]): number => {
        const values = window.map(item => item.cpu);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
          values.length;
        return Math.sqrt(variance);
      };

      const predictNext = (
        window: StreamData[]
      ): { cpu: number; confidence: number } => {
        const latest = window[window.length - 1];
        const trend =
          window.length > 1 ? latest.cpu - window[window.length - 2].cpu : 0;

        return {
          cpu: Math.max(0, Math.min(100, latest.cpu + trend)),
          confidence: Math.max(0.1, 1 - Math.abs(trend) / 50),
        };
      };

      const streamData: StreamData[] = Array.from({ length: 15 }, (_, i) => ({
        cpu: 30 + Math.sin(i * 0.5) * 10 + Math.random() * 5,
        memory: 40 + Math.cos(i * 0.3) * 8 + Math.random() * 3,
        timestamp: Date.now() + i * 1000,
      }));

      const result = processMetricStream(streamData);
      expect(result.current).toBeDefined();
      expect(result.moving_average.cpu).toBeGreaterThan(0);
      expect(result.volatility).toBeGreaterThanOrEqual(0);
      expect(result.prediction.confidence).toBeGreaterThanOrEqual(0.1);
      expect(result.prediction.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('15개 서버 관리', () => {
    it('should manage multiple server metrics', () => {
      interface Server {
        id: string;
        name: string;
        metrics: SystemMetrics;
        status: string;
      }

      interface ServerManagementResult {
        healthy: Server[];
        warning: Server[];
        critical: Server[];
        summary: {
          total: number;
          healthy: number;
          issues: number;
        };
      }

      const manageServerMetrics = (
        servers: Server[]
      ): ServerManagementResult => {
        const healthy: Server[] = [];
        const warning: Server[] = [];
        const critical: Server[] = [];

        servers.forEach(server => {
          const avgUsage = (server.metrics.cpu + server.metrics.memory) / 2;
          if (avgUsage < 60) {
            healthy.push(server);
          } else if (avgUsage < 85) {
            warning.push(server);
          } else {
            critical.push(server);
          }
        });

        return {
          healthy,
          warning,
          critical,
          summary: {
            total: servers.length,
            healthy: healthy.length,
            issues: warning.length + critical.length,
          },
        };
      };

      const mockServers: Server[] = [
        {
          id: 'server-1',
          name: 'Web Server',
          metrics: {
            cpu: 45,
            memory: 60,
            disk: 30,
            network: { in: 1000, out: 800 },
          },
          status: 'running',
        },
        {
          id: 'server-2',
          name: 'Database Server',
          metrics: {
            cpu: 80,
            memory: 75,
            disk: 60,
            network: { in: 2000, out: 1500 },
          },
          status: 'running',
        },
      ];

      const result = manageServerMetrics(mockServers);
      expect(result.summary.total).toBe(2);
      expect(
        result.healthy.length + result.warning.length + result.critical.length
      ).toBe(2);
    });

    it('should distribute load across servers', () => {
      interface ServerLoad {
        id: string;
        currentLoad: number;
        capacity: number;
        efficiency: number;
      }

      interface LoadDistribution {
        serverId: string;
        allocatedLoad: number;
        utilizationAfter: number;
      }

      const distributeLoad = (
        servers: ServerLoad[],
        totalLoad: number
      ): LoadDistribution[] => {
        const availableServers = servers.filter(
          s => s.currentLoad < s.capacity * 0.9
        );

        if (availableServers.length === 0) return [];

        const totalAvailableCapacity = availableServers.reduce(
          (sum, server) =>
            sum + (server.capacity - server.currentLoad) * server.efficiency,
          0
        );

        return availableServers.map(server => {
          const availableCapacity =
            (server.capacity - server.currentLoad) * server.efficiency;
          const loadShare =
            (availableCapacity / totalAvailableCapacity) * totalLoad;

          return {
            serverId: server.id,
            allocatedLoad: Math.min(
              loadShare,
              server.capacity - server.currentLoad
            ),
            utilizationAfter:
              (server.currentLoad + loadShare) / server.capacity,
          };
        });
      };

      const mockServers: ServerLoad[] = [
        { id: 'server-1', currentLoad: 30, capacity: 100, efficiency: 0.9 },
        { id: 'server-2', currentLoad: 50, capacity: 100, efficiency: 0.8 },
        { id: 'server-3', currentLoad: 95, capacity: 100, efficiency: 1.0 }, // 거의 포화
      ];

      const distribution = distributeLoad(mockServers, 40);
      expect(distribution.length).toBe(2); // server-3은 제외
      expect(distribution.every(d => d.utilizationAfter <= 1)).toBe(true);
    });
  });

  describe('알림 및 임계값', () => {
    it('should generate appropriate alerts', () => {
      interface AlertThreshold {
        cpu: number;
        memory: number;
        disk: number;
        network?: number;
      }

      interface Alert {
        type: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        message: string;
        value: number;
        threshold: number;
      }

      const generateSystemAlerts = (
        metrics: SystemMetrics,
        thresholds: AlertThreshold
      ): Alert[] => {
        const alerts: Alert[] = [];

        if (metrics.cpu > thresholds.cpu) {
          alerts.push({
            type: 'cpu',
            severity: metrics.cpu > 90 ? 'critical' : 'high',
            message: `CPU 사용률이 높습니다: ${metrics.cpu}%`,
            value: metrics.cpu,
            threshold: thresholds.cpu,
          });
        }

        if (metrics.memory > thresholds.memory) {
          alerts.push({
            type: 'memory',
            severity: metrics.memory > 90 ? 'critical' : 'high',
            message: `메모리 사용률이 높습니다: ${metrics.memory}%`,
            value: metrics.memory,
            threshold: thresholds.memory,
          });
        }

        return alerts;
      };

      const highUsageMetrics: SystemMetrics = {
        cpu: 85,
        memory: 92,
        disk: 45,
        network: { in: 1000, out: 800 },
      };

      const thresholds: AlertThreshold = {
        cpu: 80,
        memory: 85,
        disk: 90,
      };

      const alerts = generateSystemAlerts(highUsageMetrics, thresholds);
      expect(alerts.length).toBe(2);
      expect(alerts.some(a => a.type === 'cpu')).toBe(true);
      expect(alerts.some(a => a.type === 'memory')).toBe(true);
      expect(alerts.find(a => a.type === 'memory')?.severity).toBe('critical');
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
