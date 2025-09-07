/**
 * 📊 베이스라인 최적화 시스템
 * OptimizedDataGenerator.ts에서 추출한 성능 최적화 기능
 */

interface BaselineServerInput {
  id: string;
  hostname: string;
  environment: 'production' | 'staging' | 'development';
  role:
    | 'web'
    | 'api'
    | 'database'
    | 'cache'
    | 'vm'
    | 'storage'
    | 'load-balancer'
    | 'backup';
  status: 'healthy' | 'warning' | 'critical';
}

export interface BaselineDataPoint {
  timestamp: number;
  cpu_baseline: number;
  memory_baseline: number;
  disk_baseline: number;
  network_in_baseline: number;
  network_out_baseline: number;
  response_time_baseline: number;
  pattern_multiplier: number;
}

export interface ServerBaselineData {
  server_id: string;
  hostname: string;
  environment: 'production' | 'staging' | 'development';
  role:
    | 'web'
    | 'api'
    | 'database'
    | 'cache'
    | 'vm'
    | 'storage'
    | 'load-balancer'
    | 'backup';
  baseline_status: 'healthy' | 'warning' | 'critical';
  daily_pattern: BaselineDataPoint[];
  last_generated: number;
}

export interface BaselineConfig {
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  responseTime: number;
}

export class BaselineOptimizer {
  private static instance: BaselineOptimizer;
  private baselineStorage = new Map<string, ServerBaselineData>();
  private lastPatternUpdate: number = 0;

  // 서버 역할별 기본 부하 설정
  private readonly HIGH_LOAD_CONFIGS: Record<string, BaselineConfig> = {
    web: {
      cpu: 85,
      memory: 75,
      disk: 50,
      networkIn: 300,
      networkOut: 280,
      responseTime: 250,
    },
    api: {
      cpu: 90,
      memory: 85,
      disk: 45,
      networkIn: 250,
      networkOut: 200,
      responseTime: 350,
    },
    database: {
      cpu: 70,
      memory: 80,
      disk: 60,
      networkIn: 80,
      networkOut: 60,
      responseTime: 50,
    },
    cache: {
      cpu: 30,
      memory: 85,
      disk: 20,
      networkIn: 200,
      networkOut: 180,
      responseTime: 30,
    },
    'k8s-worker': {
      cpu: 80,
      memory: 60,
      disk: 45,
      networkIn: 50,
      networkOut: 40,
      responseTime: 200,
    },
    'k8s-control': {
      cpu: 25,
      memory: 40,
      disk: 70,
      networkIn: 60,
      networkOut: 80,
      responseTime: 100,
    },
    storage: {
      cpu: 40,
      memory: 50,
      disk: 85,
      networkIn: 120,
      networkOut: 100,
      responseTime: 150,
    },
    'load-balancer': {
      cpu: 50,
      memory: 45,
      disk: 30,
      networkIn: 300,
      networkOut: 350,
      responseTime: 60,
    },
    backup: {
      cpu: 35,
      memory: 40,
      disk: 90,
      networkIn: 30,
      networkOut: 150,
      responseTime: 120,
    },
  };

  static getInstance(): BaselineOptimizer {
    if (!BaselineOptimizer.instance) {
      BaselineOptimizer.instance = new BaselineOptimizer();
    }
    return BaselineOptimizer.instance;
  }

  private constructor() {
    console.log('📊 BaselineOptimizer 초기화');
  }

  /**
   * 🏗️ 24시간 베이스라인 데이터 생성
   */
  async generateBaselineData(servers: BaselineServerInput[]): Promise<void> {
    console.log('🏗️ 24시간 베이스라인 데이터 생성 시작...');

    for (const server of servers) {
      const baseline = this.createServerBaseline(server);
      this.baselineStorage.set(server.id, baseline);
    }

    this.lastPatternUpdate = Date.now();
    console.log(
      `✅ ${servers.length}개 서버의 24시간 베이스라인 데이터 생성 완료`
    );
  }

  /**
   * 📊 개별 서버 베이스라인 생성
   */
  private createServerBaseline(
    server: BaselineServerInput
  ): ServerBaselineData {
    const dailyPattern: BaselineDataPoint[] = [];
    const currentTime = Date.now();

    // 24시간 (1440분) 데이터 포인트 생성
    for (let minute = 0; minute < 1440; minute++) {
      const hourOfDay = Math.floor(minute / 60);
      const minuteOfHour = minute % 60;

      // 시간대별 패턴 적용
      const patternMultiplier = this.calculateTimePattern(
        hourOfDay,
        minuteOfHour
      );

      // 서버 역할별 기본 부하 설정
      const baseLoad = this.getServerBaseLoad(server.role, server.status);

      const dataPoint: BaselineDataPoint = {
        timestamp: currentTime + minute * 60 * 1000,
        cpu_baseline: baseLoad.cpu * patternMultiplier,
        memory_baseline: baseLoad.memory * patternMultiplier,
        disk_baseline: baseLoad.disk + minute * 0.001, // 디스크는 시간에 따라 점진적 증가
        network_in_baseline: baseLoad.networkIn * patternMultiplier,
        network_out_baseline: baseLoad.networkOut * patternMultiplier,
        response_time_baseline: baseLoad.responseTime / patternMultiplier, // 부하가 높을수록 응답시간 증가
        pattern_multiplier: patternMultiplier,
      };

      dailyPattern.push(dataPoint);
    }

    return {
      server_id: server.id,
      hostname: server.hostname,
      environment: server.environment,
      role: server.role,
      baseline_status: server.status,
      daily_pattern: dailyPattern,
      last_generated: currentTime,
    };
  }

  /**
   * ⏰ 시간대별 패턴 계산
   */
  private calculateTimePattern(hour: number, minute: number): number {
    // 업무시간 패턴 (09:00-18:00 높은 부하)
    if (hour >= 9 && hour <= 18) {
      return 0.8 + 0.4 * Math.sin(((hour - 9) * Math.PI) / 9); // 0.8 ~ 1.2
    }

    // 야간시간 (22:00-06:00 낮은 부하)
    if (hour >= 22 || hour <= 6) {
      return 0.3 + 0.2 * Math.random(); // 0.3 ~ 0.5
    }

    // 전환시간 (중간 부하)
    return 0.5 + 0.3 * Math.random(); // 0.5 ~ 0.8
  }

  /**
   * 🏗️ 서버 역할별 기본 부하 설정
   */
  private getServerBaseLoad(role: string, status: string): BaselineConfig {
    const config =
      this.HIGH_LOAD_CONFIGS[role] || this.HIGH_LOAD_CONFIGS['web'];

    if (!config) {
      // 기본값 반환
      return {
        cpu: 50,
        memory: 60,
        disk: 40,
        networkIn: 100,
        networkOut: 80,
        responseTime: 200,
      };
    }

    // 상태별 조정
    const statusMultiplier =
      status === 'critical' ? 0.3 : status === 'warning' ? 0.7 : 1.0;

    return {
      cpu: config.cpu * statusMultiplier,
      memory: config.memory * statusMultiplier,
      disk: config.disk * statusMultiplier,
      networkIn: config.networkIn * statusMultiplier,
      networkOut: config.networkOut * statusMultiplier,
      responseTime: config.responseTime / statusMultiplier, // 상태가 나쁠수록 응답시간 증가
    };
  }

  /**
   * 📈 현재 시간대에 맞는 베이스라인 값 조회
   */
  getCurrentBaseline(serverId: string): BaselineDataPoint | null {
    const serverBaseline = this.baselineStorage.get(serverId);
    if (!serverBaseline) return null;

    const now = new Date();
    const minuteOfDay = now.getHours() * 60 + now.getMinutes();

    return serverBaseline.daily_pattern[minuteOfDay] || null;
  }

  /**
   * 🔄 베이스라인 패턴 새로고침
   */
  async refreshPatterns(): Promise<void> {
    const now = Date.now();
    const oneHour = 3600000;

    if (now - this.lastPatternUpdate > oneHour) {
      console.log('🔄 베이스라인 패턴 새로고침...');

      for (const [serverId, baseline] of this.baselineStorage.entries()) {
        // 새로운 패턴으로 업데이트
        const updatedBaseline = this.updateBaselinePattern(baseline);
        this.baselineStorage.set(serverId, updatedBaseline);
      }

      this.lastPatternUpdate = now;
      console.log('✅ 베이스라인 패턴 새로고침 완료');
    }
  }

  private updateBaselinePattern(
    baseline: ServerBaselineData
  ): ServerBaselineData {
    // 기존 패턴에 약간의 변화를 주어 업데이트
    const updatedPattern = baseline.daily_pattern.map((point) => ({
      ...point,
      pattern_multiplier:
        point.pattern_multiplier * (0.95 + Math.random() * 0.1), // ±5% 변화
    }));

    return {
      ...baseline,
      daily_pattern: updatedPattern,
      last_generated: Date.now(),
    };
  }

  /**
   * 📊 베이스라인 통계 조회
   */
  getBaselineStats() {
    return {
      totalServers: this.baselineStorage.size,
      lastPatternUpdate: new Date(this.lastPatternUpdate).toISOString(),
      memoryUsage: process.memoryUsage().heapUsed,
      oldestBaseline: Math.min(
        ...Array.from(this.baselineStorage.values()).map(
          (b) => b.last_generated
        )
      ),
      avgDataPoints: this.baselineStorage.size > 0 ? 1440 : 0, // 24시간 = 1440분
    };
  }

  /**
   * 🧹 메모리 정리
   */
  cleanup(): void {
    const now = Date.now();
    const maxAge = 86400000; // 24시간

    for (const [serverId, baseline] of this.baselineStorage.entries()) {
      if (now - baseline.last_generated > maxAge) {
        this.baselineStorage.delete(serverId);
        console.log(`🗑️ 오래된 베이스라인 데이터 삭제: ${serverId}`);
      }
    }
  }
}

// 싱글톤 인스턴스
export const baselineOptimizer = BaselineOptimizer.getInstance();

// 편의 함수들
export function generateBaseline(servers: BaselineServerInput[]) {
  return baselineOptimizer.generateBaselineData(servers);
}

export function getCurrentBaseline(serverId: string) {
  return baselineOptimizer.getCurrentBaseline(serverId);
}

export function refreshBaselinePatterns() {
  return baselineOptimizer.refreshPatterns();
}
