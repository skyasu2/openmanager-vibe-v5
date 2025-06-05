import { env, envLog, shouldUseMockData } from '@/config/environment';

export interface ServerData {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  uptime: number;
  location: string;
  type: string;
  lastCheck: Date;
  metrics?: any[];
}

export interface MetricData {
  timestamp: Date;
  serverId: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  errorRate: number;
}

export class EnvironmentAwareDataGenerator {
  private static instance: EnvironmentAwareDataGenerator;
  
  private constructor() {
    envLog('info', `🎯 환경별 데이터 생성기 초기화: ${env.name}`);
  }

  static getInstance(): EnvironmentAwareDataGenerator {
    if (!this.instance) {
      this.instance = new EnvironmentAwareDataGenerator();
    }
    return this.instance;
  }

  /**
   * 환경별 서버 데이터 생성
   */
  generateServers(): ServerData[] {
    const serverCount = env.performance.serverCount;
    
    envLog('debug', `🏗️ ${serverCount}개 서버 생성 (환경: ${env.name})`);

    if (env.isTest) {
      return this.generateMinimalTestServers();
    }

    if (env.isDevelopment) {
      return this.generateRealisticDevServers(serverCount);
    }

    return this.generateProductionServers(serverCount);
  }

  /**
   * 테스트 환경용 최소 서버 데이터
   */
  private generateMinimalTestServers(): ServerData[] {
    return [
      {
        id: 'test-server-1',
        name: 'Test Server 1',
        status: 'healthy',
        cpu: 50,
        memory: 60,
        disk: 40,
        network: 30,
        uptime: 1000,
        location: 'test-dc',
        type: 'test',
        lastCheck: new Date(),
      },
      {
        id: 'test-server-2',
        name: 'Test Server 2',
        status: 'warning',
        cpu: 80,
        memory: 75,
        disk: 85,
        network: 60,
        uptime: 500,
        location: 'test-dc',
        type: 'test',
        lastCheck: new Date(),
      }
    ];
  }

  /**
   * 개발 환경용 현실적인 서버 데이터
   */
  private generateRealisticDevServers(count: number): ServerData[] {
    const servers: ServerData[] = [];
    const locations = ['Seoul-DC1', 'Seoul-DC2', 'Busan-DC1', 'US-East', 'Tokyo'];
    const types = ['web', 'api', 'database', 'cache', 'worker'];

    for (let i = 1; i <= count; i++) {
      const statusRand = Math.random();
      let status: 'healthy' | 'warning' | 'critical';
      
      if (statusRand < 0.7) status = 'healthy';
      else if (statusRand < 0.9) status = 'warning';
      else status = 'critical';

      servers.push({
        id: `dev-server-${i}`,
        name: `Development Server ${i}`,
        status,
        cpu: this.generateRealisticMetric(status, 'cpu'),
        memory: this.generateRealisticMetric(status, 'memory'),
        disk: this.generateRealisticMetric(status, 'disk'),
        network: this.generateRealisticMetric(status, 'network'),
        uptime: Math.random() * 30 * 24 * 60 * 60 * 1000, // 0-30일
        location: locations[Math.floor(Math.random() * locations.length)],
        type: types[Math.floor(Math.random() * types.length)],
        lastCheck: new Date(Date.now() - Math.random() * 300000), // 최근 5분 내
      });
    }

    return servers;
  }

  /**
   * 프로덕션 환경용 최적화된 서버 데이터
   */
  private generateProductionServers(count: number): ServerData[] {
    envLog('info', `🚀 프로덕션 서버 ${count}개 생성 (Vercel 최적화)`);
    
    const servers: ServerData[] = [];
    const prodLocations = ['Seoul-Production', 'US-East-1', 'EU-West-1'];
    const prodTypes = ['web-cluster', 'api-gateway', 'database-cluster'];

    for (let i = 1; i <= count; i++) {
      // 프로덕션은 더 안정적인 상태 분포
      const statusRand = Math.random();
      let status: 'healthy' | 'warning' | 'critical';
      
      if (statusRand < 0.85) status = 'healthy';
      else if (statusRand < 0.97) status = 'warning';
      else status = 'critical';

      servers.push({
        id: `prod-server-${i}`,
        name: `Production Server ${i}`,
        status,
        cpu: this.generateProductionMetric(status, 'cpu'),
        memory: this.generateProductionMetric(status, 'memory'),
        disk: this.generateProductionMetric(status, 'disk'),
        network: this.generateProductionMetric(status, 'network'),
        uptime: Math.random() * 90 * 24 * 60 * 60 * 1000, // 0-90일
        location: prodLocations[Math.floor(Math.random() * prodLocations.length)],
        type: prodTypes[Math.floor(Math.random() * prodTypes.length)],
        lastCheck: new Date(Date.now() - Math.random() * 60000), // 최근 1분 내
      });
    }

    return servers;
  }

  /**
   * 환경별 메트릭 데이터 생성
   */
  generateMetrics(serverId: string, hours: number = 24): MetricData[] {
    const metricsCount = Math.min(env.performance.metricsCount, hours * 60); // 최대 분당 1개
    const metrics: MetricData[] = [];
    
    const now = new Date();
    const interval = (hours * 60 * 60 * 1000) / metricsCount;

    for (let i = 0; i < metricsCount; i++) {
      const timestamp = new Date(now.getTime() - (metricsCount - i) * interval);
      
      metrics.push({
        timestamp,
        serverId,
        cpu: this.generateTimeSeriesValue(i, metricsCount, 'cpu'),
        memory: this.generateTimeSeriesValue(i, metricsCount, 'memory'),
        disk: this.generateTimeSeriesValue(i, metricsCount, 'disk'),
        network: this.generateTimeSeriesValue(i, metricsCount, 'network'),
        responseTime: this.generateTimeSeriesValue(i, metricsCount, 'responseTime'),
        errorRate: this.generateTimeSeriesValue(i, metricsCount, 'errorRate'),
      });
    }

    return metrics;
  }

  /**
   * 상태별 현실적인 메트릭 생성
   */
  private generateRealisticMetric(status: string, type: string): number {
    const baseValues = {
      cpu: { healthy: 40, warning: 75, critical: 95 },
      memory: { healthy: 50, warning: 80, critical: 95 },
      disk: { healthy: 30, warning: 85, critical: 98 },
      network: { healthy: 25, warning: 70, critical: 90 }
    };

    const base = baseValues[type as keyof typeof baseValues][status as keyof typeof baseValues.cpu];
    const variance = status === 'healthy' ? 20 : status === 'warning' ? 10 : 5;
    
    return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance));
  }

  /**
   * 프로덕션용 최적화된 메트릭 생성
   */
  private generateProductionMetric(status: string, type: string): number {
    const prodValues = {
      cpu: { healthy: 35, warning: 70, critical: 90 },
      memory: { healthy: 45, warning: 75, critical: 90 },
      disk: { healthy: 25, warning: 80, critical: 95 },
      network: { healthy: 20, warning: 65, critical: 85 }
    };

    const base = prodValues[type as keyof typeof prodValues][status as keyof typeof prodValues.cpu];
    const variance = status === 'healthy' ? 15 : status === 'warning' ? 8 : 3;
    
    return Math.max(0, Math.min(100, base + (Math.random() - 0.5) * variance));
  }

  /**
   * 시계열 데이터 생성 (트렌드 고려)
   */
  private generateTimeSeriesValue(index: number, total: number, type: string): number {
    const progress = index / total;
    
    // 기본 트렌드 (시간에 따른 변화)
    const trend = Math.sin(progress * Math.PI * 4) * 10; // 4번의 주기
    
    // 타입별 기본값
    const baseValues = {
      cpu: 50,
      memory: 60,
      disk: 40,
      network: 30,
      responseTime: 200,
      errorRate: 2
    };

    const base = baseValues[type as keyof typeof baseValues];
    const noise = (Math.random() - 0.5) * 20; // 랜덤 노이즈
    
    const value = base + trend + noise;
    
    // 타입별 범위 제한
    if (type === 'errorRate') {
      return Math.max(0, Math.min(20, value));
    } else if (type === 'responseTime') {
      return Math.max(50, Math.min(2000, value));
    } else {
      return Math.max(0, Math.min(100, value));
    }
  }

  /**
   * 환경별 더미 알림 데이터
   */
  generateAlerts(serverCount: number) {
    if (env.isTest) {
      return []; // 테스트 환경에서는 알림 없음
    }

    const alertCount = env.isDevelopment ? Math.floor(serverCount * 0.3) : Math.floor(serverCount * 0.1);
    const alerts = [];

    for (let i = 0; i < alertCount; i++) {
      alerts.push({
        id: `alert-${i + 1}`,
        serverId: `server-${Math.floor(Math.random() * serverCount) + 1}`,
        type: Math.random() > 0.7 ? 'critical' : 'warning',
        message: this.generateAlertMessage(),
        timestamp: new Date(Date.now() - Math.random() * 3600000), // 최근 1시간 내
        resolved: Math.random() > 0.6
      });
    }

    return alerts;
  }

  private generateAlertMessage(): string {
    const messages = [
      'High CPU usage detected',
      'Memory usage above threshold',
      'Disk space running low',
      'Network latency increased',
      'Service response time high',
      'Error rate spike detected'
    ];
    
    return messages[Math.floor(Math.random() * messages.length)];
  }

  /**
   * 환경 정보 가져오기
   */
  getEnvironmentInfo() {
    return {
      environment: env.name,
      useMockData: shouldUseMockData(),
      serverCount: env.performance.serverCount,
      metricsCount: env.performance.metricsCount,
      optimizations: env.performance.enableOptimizations
    };
  }
} 