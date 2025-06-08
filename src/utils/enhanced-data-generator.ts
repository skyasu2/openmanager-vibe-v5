// 임시 enhanced-data-generator (삭제된 파일의 간단한 대체)

export type ScenarioType =
  | 'normal'
  | 'high_load'
  | 'failure'
  | 'maintenance'
  | 'emergency'
  | 'performance_degradation'
  | 'stress'
  | 'spike';

export interface MetricData {
  timestamp: number;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score: number;
  feature: string;
  value: number;
}

export class EnhancedDataGenerator {
  async initialize() {
    console.log('Enhanced Data Generator initialized');
  }

  async generateData() {
    return {
      servers: [],
      metrics: {},
      timestamp: Date.now(),
    };
  }

  async getStatus() {
    return {
      status: 'active',
      generated: 0,
    };
  }

  generateRealisticServerMetrics(scenario: ScenarioType = 'normal') {
    const serverId = `server-${Math.random().toString(36).substr(2, 9)}`;
    const serverName = `Server-${Math.floor(Math.random() * 100)}`;

    const baseMetrics = {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      disk: Math.random() * 100,
    };

    const networkMetrics = {
      in: Math.random() * 1000,
      out: Math.random() * 1000,
      bytesIn: Math.random() * 1000000,
      bytesOut: Math.random() * 1000000,
      latency: Math.random() * 100,
    };

    // 시나리오별 조정
    let adjustedMetrics = baseMetrics;
    switch (scenario) {
      case 'stress':
        adjustedMetrics = {
          cpu: Math.random() * 30 + 70, // 70-100%
          memory: Math.random() * 20 + 80, // 80-100%
          disk: baseMetrics.disk,
        };
        break;
      case 'spike':
        adjustedMetrics = {
          ...baseMetrics,
          cpu: Math.random() * 40 + 60, // 60-100%
        };
        networkMetrics.in = Math.random() * 2000 + 1000;
        networkMetrics.out = Math.random() * 2000 + 1000;
        break;
    }

    return {
      serverId,
      serverName,
      metrics: adjustedMetrics,
      network: networkMetrics,
      application: {
        name: `App-${Math.floor(Math.random() * 10)}`,
        version: '1.0.0',
        responseTime: Math.random() * 1000 + 100, // 100-1100ms
        throughput: Math.random() * 1000 + 500, // 500-1500 req/s
        errorRate: Math.random() * 5, // 0-5%
      },
      status:
        scenario === 'stress' || scenario === 'spike' ? 'warning' : 'healthy',
      timestamp: Date.now(),
    };
  }
}

export const enhancedDataGenerator = new EnhancedDataGenerator();
