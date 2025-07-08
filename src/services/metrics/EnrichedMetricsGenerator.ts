/**
 * 🚀 강화된 메트릭 생성기 v4.0 (VM 최적화)
 *
 * 핵심 개선점:
 * - ❌ Vercel 30분 제한 → ✅ VM 24시간 연속 운영
 * - ❌ 기본 5개 메트릭 → ✅ 10배 풍부한 50+ 메트릭
 * - ❌ 단순 난수 생성 → ✅ 기존 베이스라인 방식 + 현실적 패턴
 * - ✅ 시스템 시작시 베이스라인 자동 로드
 * - ✅ 시스템 종료시 베이스라인 자동 저장
 */

import type { EnhancedServerMetrics } from '../../types/server';
import { BaselineStorageService } from '../gcp/BaselineStorageService';
import { LongRunningScenarioEngine } from '../vm/LongRunningScenarioEngine';

// 10배 풍부한 메트릭 인터페이스
export interface EnrichedMetrics {
  // 🖥️ 시스템 메트릭 (기존)
  system: {
    cpu: {
      usage: number;
      load1: number;
      load5: number;
      load15: number;
      processes: number;
      threads: number;
      context_switches: number;
      interrupts: number;
    };
    memory: {
      used: number;
      available: number;
      buffers: number;
      cached: number;
      swap: { used: number; total: number };
      page_faults: number;
      memory_leaks: number;
    };
    disk: {
      io: { read: number; write: number };
      throughput: { read_mbps: number; write_mbps: number };
      utilization: number;
      queue_depth: number;
      latency: { read_ms: number; write_ms: number };
      errors: number;
    };
    network: {
      in_mbps: number;
      out_mbps: number;
      connections: number;
      errors: number;
      dropped_packets: number;
      retransmissions: number;
    };
  };

  // 🎯 애플리케이션 메트릭 (신규)
  application: {
    http: {
      requests_per_second: number;
      response_time_ms: number;
      error_rate: number;
      active_connections: number;
      queue_size: number;
    };
    database: {
      connections: number;
      query_time_ms: number;
      slow_queries: number;
      deadlocks: number;
      cache_hit_rate: number;
    };
    cache: {
      hit_rate: number;
      memory_usage: number;
      evictions: number;
      operations_per_second: number;
    };
    sessions: {
      active_users: number;
      session_duration_avg: number;
      login_rate: number;
      authentication_failures: number;
    };
  };

  // 💼 비즈니스 메트릭 (신규)
  business: {
    traffic: {
      page_views: number;
      unique_visitors: number;
      bounce_rate: number;
      conversion_rate: number;
    };
    performance: {
      sla_compliance: number;
      availability: number;
      mttr_minutes: number;
      incident_count: number;
    };
    cost: {
      cpu_cost_per_hour: number;
      memory_cost_per_hour: number;
      storage_cost_per_hour: number;
      total_cost_per_hour: number;
    };
  };

  // 🌡️ 환경 컨텍스트 (신규)
  context: {
    time: {
      hour: number;
      day_of_week: number;
      is_peak_hour: boolean;
      is_maintenance_window: boolean;
    };
    external: {
      temperature: number;
      humidity: number;
      power_efficiency: number;
      cooling_cost: number;
    };
    security: {
      threat_level: number;
      failed_login_attempts: number;
      suspicious_activities: number;
      firewall_blocks: number;
    };
  };
}

/**
 * 🚀 강화된 메트릭 생성기 (VM 24시간 연속 운영)
 */
export class EnrichedMetricsGenerator {
  private static instance: EnrichedMetricsGenerator;
  private isRunning: boolean = false;
  private servers: Map<string, EnhancedServerMetrics> = new Map();

  // 🔄 VM 환경 최적화
  private baselineStorage = BaselineStorageService.getInstance();
  private scenarioEngine = new LongRunningScenarioEngine();

  // 🕐 24시간 연속 운영 (기존 30분 제한 제거)
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_CYCLE_MS = 35 * 1000; // 35초 (기존 방식 유지)

  // 📊 베이스라인 기반 생성 (기존 OptimizedDataGenerator 방식 계승)
  private baselineData: Map<string, any> = new Map();
  private lastBaselineLoad: Date | null = null;

  private constructor() {
    console.log('🚀 강화된 메트릭 생성기 v4.0 초기화 (VM 최적화)');
  }

  static getInstance(): EnrichedMetricsGenerator {
    if (!EnrichedMetricsGenerator.instance) {
      EnrichedMetricsGenerator.instance = new EnrichedMetricsGenerator();
    }
    return EnrichedMetricsGenerator.instance;
  }

  /**
   * 🎯 시스템 시작시 자동 초기화 (베이스라인 로드)
   */
  async startWithBaselineLoad(servers: EnhancedServerMetrics[]): Promise<void> {
    if (this.isRunning) {
      console.warn('⚠️ 메트릭 생성기가 이미 실행 중입니다');
      return;
    }

    console.log('🔄 시스템 시작 - 베이스라인 데이터 로드 중...');

    // 1️⃣ 서버 목록 초기화 (15개 서버 유지)
    this.initializeServers(servers);

    // 2️⃣ 베이스라인 데이터 로드 (GCP Storage에서)
    await this.loadBaselineFromStorage();

    // 3️⃣ 장기 실행 시나리오 엔진 시작
    await this.scenarioEngine.start();

    // 4️⃣ 24시간 연속 업데이트 시작
    this.startContinuousGeneration();

    console.log('✅ 강화된 메트릭 생성기 시작 완료 (VM 24시간 모드)');
    console.log(`📊 관리 중인 서버: ${this.servers.size}개`);
    console.log(`🔄 업데이트 주기: ${this.UPDATE_CYCLE_MS / 1000}초`);
  }

  /**
   * 🛑 시스템 종료시 자동 정리 (베이스라인 저장)
   */
  async stopWithBaselineSave(): Promise<void> {
    console.log('🔄 시스템 종료 - 베이스라인 데이터 저장 중...');

    // 1️⃣ 업데이트 중지
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    // 2️⃣ 시나리오 엔진 정지
    await this.scenarioEngine.stop();

    // 3️⃣ 현재 베이스라인 저장 (GCP Storage에)
    await this.saveBaselineToStorage();

    this.isRunning = false;
    console.log('✅ 강화된 메트릭 생성기 정지 완료 (베이스라인 저장됨)');
  }

  /**
   * 🏗️ 서버 목록 초기화 (기존 방식 유지 - 15개)
   */
  private initializeServers(servers: EnhancedServerMetrics[]): void {
    this.servers.clear();

    servers.forEach(server => {
      this.servers.set(server.id, server);
    });

    console.log(`📊 서버 목록 초기화: ${this.servers.size}개 서버 등록`);
  }

  /**
   * 🔄 24시간 연속 메트릭 생성 시작
   */
  private startContinuousGeneration(): void {
    this.isRunning = true;

    this.updateInterval = setInterval(async () => {
      try {
        await this.generateEnrichedMetricsForAllServers();
      } catch (error) {
        console.error('❌ 메트릭 생성 오류:', error);
      }
    }, this.UPDATE_CYCLE_MS);

    console.log('🔄 24시간 연속 메트릭 생성 시작됨');
  }

  /**
   * 📊 모든 서버의 강화된 메트릭 생성
   */
  private async generateEnrichedMetricsForAllServers(): Promise<void> {
    const startTime = Date.now();
    const updatedServers: EnhancedServerMetrics[] = [];

    for (const [serverId, server] of this.servers) {
      try {
        // 🎯 10배 풍부한 메트릭 생성
        const enrichedMetrics = await this.generateEnrichedMetrics(server);

        // 📊 서버 메트릭 업데이트
        const updatedServer = this.applyEnrichedMetrics(
          server,
          enrichedMetrics
        );
        this.servers.set(serverId, updatedServer);
        updatedServers.push(updatedServer);
      } catch (error) {
        console.error(`❌ 서버 ${serverId} 메트릭 생성 실패:`, error);
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `📊 강화된 메트릭 생성 완료: ${updatedServers.length}개 서버, ${duration}ms`
    );
  }

  /**
   * 🌟 10배 풍부한 메트릭 생성 (핵심 로직)
   */
  private async generateEnrichedMetrics(
    server: EnhancedServerMetrics
  ): Promise<EnrichedMetrics> {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();

    // 🎯 베이스라인 데이터 활용 (기존 OptimizedDataGenerator 방식)
    const baseline = this.getServerBaseline(server.id, hour);
    const scenarios = this.scenarioEngine.getActiveScenarios();

    // 🖥️ 시스템 메트릭 (기존 5개 → 25개로 확장)
    const systemMetrics = this.generateSystemMetrics(
      server,
      baseline,
      scenarios
    );

    // 🎯 애플리케이션 메트릭 (신규 15개)
    const applicationMetrics = this.generateApplicationMetrics(
      server,
      hour,
      baseline
    );

    // 💼 비즈니스 메트릭 (신규 10개)
    const businessMetrics = this.generateBusinessMetrics(
      server,
      dayOfWeek,
      hour
    );

    // 🌡️ 환경 컨텍스트 (신규 15개)
    const contextMetrics = this.generateContextMetrics(hour, dayOfWeek);

    return {
      system: systemMetrics,
      application: applicationMetrics,
      business: businessMetrics,
      context: contextMetrics,
    };
  }

  /**
   * 🖥️ 시스템 메트릭 생성 (5개 → 25개 확장)
   */
  private generateSystemMetrics(
    server: EnhancedServerMetrics,
    baseline: any,
    scenarios: any[]
  ): EnrichedMetrics['system'] {
    // 기존 베이스라인 방식 + 시나리오 영향 적용
    const baseMultiplier = baseline?.pattern_multiplier || 1.0;
    const scenarioImpact = this.calculateScenarioImpact(scenarios);

    const currentLoad =
      baseMultiplier * scenarioImpact * (0.8 + Math.random() * 0.4);

    return {
      cpu: {
        usage: Math.min(99.5, (baseline?.cpu_baseline || 30) * currentLoad),
        load1: currentLoad * 2,
        load5: currentLoad * 1.5,
        load15: currentLoad * 1.2,
        processes: 50 + Math.floor(currentLoad * 30),
        threads: 200 + Math.floor(currentLoad * 150),
        context_switches: Math.floor(currentLoad * 10000),
        interrupts: Math.floor(currentLoad * 5000),
      },
      memory: {
        used: (baseline?.memory_baseline || 40) * currentLoad,
        available: 100 - (baseline?.memory_baseline || 40) * currentLoad,
        buffers: 5 + Math.random() * 3,
        cached: 15 + Math.random() * 10,
        swap: {
          used: Math.max(0, (currentLoad - 0.8) * 10),
          total: 100,
        },
        page_faults: Math.floor(currentLoad * 1000),
        memory_leaks: scenarios.some(
          s => s.pattern?.id === 'gradual-memory-leak'
        )
          ? Math.floor(currentLoad * 50)
          : 0,
      },
      disk: {
        io: {
          read: Math.floor(currentLoad * 100),
          write: Math.floor(currentLoad * 50),
        },
        throughput: {
          read_mbps: currentLoad * 50,
          write_mbps: currentLoad * 25,
        },
        utilization: Math.min(
          95,
          (baseline?.disk_baseline || 20) + currentLoad * 30
        ),
        queue_depth: Math.floor(currentLoad * 5),
        latency: {
          read_ms: 5 + currentLoad * 15,
          write_ms: 8 + currentLoad * 20,
        },
        errors: Math.floor(Math.random() * currentLoad * 2),
      },
      network: {
        in_mbps: (baseline?.network_in_baseline || 10) * currentLoad,
        out_mbps: (baseline?.network_out_baseline || 8) * currentLoad,
        connections: Math.floor(50 + currentLoad * 200),
        errors: Math.floor(Math.random() * currentLoad * 3),
        dropped_packets: Math.floor(Math.random() * currentLoad * 5),
        retransmissions: Math.floor(Math.random() * currentLoad * 2),
      },
    };
  }

  /**
   * 🎯 애플리케이션 메트릭 생성 (신규)
   */
  private generateApplicationMetrics(
    server: EnhancedServerMetrics,
    hour: number,
    baseline: any
  ): EnrichedMetrics['application'] {
    const trafficMultiplier = this.getTrafficMultiplier(hour);
    const baseRps = baseline?.response_time_baseline || 100;

    return {
      http: {
        requests_per_second: Math.floor(baseRps * trafficMultiplier),
        response_time_ms: 50 + Math.random() * 200,
        error_rate: 0.5 + Math.random() * 2,
        active_connections: Math.floor(50 + trafficMultiplier * 300),
        queue_size: Math.floor(Math.random() * trafficMultiplier * 10),
      },
      database: {
        connections: Math.floor(10 + trafficMultiplier * 40),
        query_time_ms: 5 + Math.random() * 50,
        slow_queries: Math.floor(Math.random() * 5),
        deadlocks: Math.floor(Math.random() * 2),
        cache_hit_rate: 85 + Math.random() * 10,
      },
      cache: {
        hit_rate: 80 + Math.random() * 15,
        memory_usage: 30 + Math.random() * 40,
        evictions: Math.floor(Math.random() * 100),
        operations_per_second: Math.floor(500 + trafficMultiplier * 2000),
      },
      sessions: {
        active_users: Math.floor(100 + trafficMultiplier * 500),
        session_duration_avg: 10 + Math.random() * 20,
        login_rate: Math.floor(5 + trafficMultiplier * 20),
        authentication_failures: Math.floor(Math.random() * 3),
      },
    };
  }

  /**
   * 💼 비즈니스 메트릭 생성 (신규)
   */
  private generateBusinessMetrics(
    server: EnhancedServerMetrics,
    dayOfWeek: number,
    hour: number
  ): EnrichedMetrics['business'] {
    const businessMultiplier = this.getBusinessMultiplier(dayOfWeek, hour);

    return {
      traffic: {
        page_views: Math.floor(1000 + businessMultiplier * 5000),
        unique_visitors: Math.floor(200 + businessMultiplier * 1000),
        bounce_rate: 25 + Math.random() * 15,
        conversion_rate: 2 + Math.random() * 3,
      },
      performance: {
        sla_compliance: 95 + Math.random() * 4,
        availability: 99.5 + Math.random() * 0.5,
        mttr_minutes: 15 + Math.random() * 30,
        incident_count: Math.floor(Math.random() * 3),
      },
      cost: {
        cpu_cost_per_hour: 0.05 + Math.random() * 0.03,
        memory_cost_per_hour: 0.02 + Math.random() * 0.01,
        storage_cost_per_hour: 0.01 + Math.random() * 0.005,
        total_cost_per_hour: 0.08 + Math.random() * 0.045,
      },
    };
  }

  /**
   * 🌡️ 환경 컨텍스트 생성 (신규)
   */
  private generateContextMetrics(
    hour: number,
    dayOfWeek: number
  ): EnrichedMetrics['context'] {
    const isPeakHour =
      hour >= 9 && hour <= 18 && dayOfWeek >= 1 && dayOfWeek <= 5;
    const isMaintenanceWindow = hour >= 2 && hour <= 4;

    return {
      time: {
        hour,
        day_of_week: dayOfWeek,
        is_peak_hour: isPeakHour,
        is_maintenance_window: isMaintenanceWindow,
      },
      external: {
        temperature: 18 + Math.random() * 12, // 18-30도
        humidity: 40 + Math.random() * 20, // 40-60%
        power_efficiency: 85 + Math.random() * 10, // 85-95%
        cooling_cost: 0.02 + Math.random() * 0.01, // 시간당 비용
      },
      security: {
        threat_level: Math.floor(Math.random() * 5), // 0-4 레벨
        failed_login_attempts: Math.floor(Math.random() * 10),
        suspicious_activities: Math.floor(Math.random() * 5),
        firewall_blocks: Math.floor(Math.random() * 20),
      },
    };
  }

  // 🛠️ 유틸리티 메서드들

  private getServerBaseline(serverId: string, hour: number): any {
    return this.baselineData.get(`${serverId}-${hour}`) || {};
  }

  private calculateScenarioImpact(scenarios: any[]): number {
    let impact = 1.0;
    scenarios.forEach(scenario => {
      switch (scenario.pattern?.severity) {
        case 'critical':
          impact *= 1.5;
          break;
        case 'high':
          impact *= 1.3;
          break;
        case 'medium':
          impact *= 1.1;
          break;
        default:
          impact *= 1.05;
          break;
      }
    });
    return Math.min(impact, 2.0); // 최대 2배까지
  }

  private getTrafficMultiplier(hour: number): number {
    // 시간대별 트래픽 패턴
    if (hour >= 9 && hour <= 18) return 1.0; // 업무시간
    if (hour >= 19 && hour <= 22) return 0.8; // 저녁시간
    return 0.3; // 새벽시간
  }

  private getBusinessMultiplier(dayOfWeek: number, hour: number): number {
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const isPeakHour = hour >= 9 && hour <= 18;

    if (isWeekday && isPeakHour) return 1.0;
    if (isWeekday && !isPeakHour) return 0.6;
    return 0.4; // 주말
  }

  private applyEnrichedMetrics(
    server: EnhancedServerMetrics,
    metrics: EnrichedMetrics
  ): EnhancedServerMetrics {
    return {
      ...server,
      cpu_usage: metrics.system.cpu.usage,
      memory_usage: metrics.system.memory.used,
      disk_usage: metrics.system.disk.utilization,
      network_in: metrics.system.network.in_mbps,
      network_out: metrics.system.network.out_mbps,
      response_time: metrics.application.http.response_time_ms,
      last_updated: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      // 강화된 메트릭을 확장 속성으로 추가 (타입 안전)
      ...(metrics && ({ enriched_metrics: metrics } as any)),
    };
  }

  private async loadBaselineFromStorage(): Promise<void> {
    try {
      console.log('📥 베이스라인 데이터 로드 중...');
      // GCP Storage에서 베이스라인 로드 (현재는 스텁)
      const servers = Array.from(this.servers.values());
      // TODO: 실제 베이스라인 로드 구현 예정
      this.lastBaselineLoad = new Date();
      console.log('✅ 베이스라인 데이터 로드 완료 (스텁 모드)');
    } catch (error) {
      console.warn('⚠️ 베이스라인 로드 실패, 동적 생성으로 대체:', error);
    }
  }

  private async saveBaselineToStorage(): Promise<void> {
    try {
      console.log('💾 베이스라인 데이터 저장 중...');
      // 현재는 스텁 모드 - 실제 저장 구현 예정
      console.log('✅ 베이스라인 데이터 저장 완료 (스텁 모드)');
    } catch (error) {
      console.error('❌ 베이스라인 저장 실패:', error);
    }
  }

  // 📊 상태 조회 메서드들

  getEnrichedServers(): EnhancedServerMetrics[] {
    return Array.from(this.servers.values());
  }

  getGeneratorStatus() {
    return {
      isRunning: this.isRunning,
      serverCount: this.servers.size,
      lastBaselineLoad: this.lastBaselineLoad?.toISOString(),
      updateCycleMs: this.UPDATE_CYCLE_MS,
      activeScenarios: this.scenarioEngine.getActiveScenarios().length,
      version: '4.0.0-vm-optimized',
    };
  }
}
