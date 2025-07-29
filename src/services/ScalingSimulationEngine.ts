/**
 * 📈 OpenManager Vibe v5 - 스케일링 시뮬레이션 엔진
 *
 * 자동 스케일링 시뮬레이션 및 용량 계획
 */

export interface ScalingEvent {
  type: 'scale_up' | 'scale_down' | 'auto_scale';
  trigger:
    | 'cpu_threshold'
    | 'memory_threshold'
    | 'request_volume'
    | 'scheduled';
  currentInstances: number;
  targetInstances: number;
  timestamp: string;
  reason: string;
}

export interface CapacityPlan {
  predictedLoad: number;
  recommendedInstances: number;
  costEstimate: number;
  confidence: number;
  timeframe: string;
}

export class ScalingSimulationEngine {
  private scalingHistory: ScalingEvent[] = [];
  private currentInstances: number = 5;
  private maxInstances: number = 20;
  private minInstances: number = 2;

  constructor() {
    this._initializeScaling();
  }

  /**
   * 📊 스케일링 초기화
   */
  private _initializeScaling(): void {
    // 초기 스케일링 이벤트 생성
    this.scalingHistory.push({
      type: 'auto_scale',
      trigger: 'cpu_threshold',
      currentInstances: this.currentInstances,
      targetInstances: this.currentInstances,
      timestamp: new Date().toISOString(),
      reason: '시스템 초기화 완료',
    });
  }

  /**
   * 🎯 스케일링 시뮬레이션
   */
  simulateScaling(metrics: any[]): ScalingEvent | null {
    const avgCpu = metrics.reduce((sum, m) => sum + m.cpu, 0) / metrics.length;
    const avgMemory =
      metrics.reduce((sum, m) => sum + m.memory, 0) / metrics.length;

    let scalingEvent: ScalingEvent | null = null;

    // CPU 기반 스케일링
    if (avgCpu > 80 && this.currentInstances < this.maxInstances) {
      const targetInstances = Math.min(
        this.currentInstances + Math.ceil(avgCpu / 30),
        this.maxInstances
      );

      scalingEvent = {
        type: 'scale_up',
        trigger: 'cpu_threshold',
        currentInstances: this.currentInstances,
        targetInstances,
        timestamp: new Date().toISOString(),
        reason: `CPU 사용률 ${avgCpu.toFixed(1)}%로 스케일 업 필요`,
      };

      this.currentInstances = targetInstances;
    }
    // 메모리 기반 스케일링
    else if (avgMemory > 85 && this.currentInstances < this.maxInstances) {
      const targetInstances = Math.min(
        this.currentInstances + Math.ceil(avgMemory / 40),
        this.maxInstances
      );

      scalingEvent = {
        type: 'scale_up',
        trigger: 'memory_threshold',
        currentInstances: this.currentInstances,
        targetInstances,
        timestamp: new Date().toISOString(),
        reason: `메모리 사용률 ${avgMemory.toFixed(1)}%로 스케일 업 필요`,
      };

      this.currentInstances = targetInstances;
    }
    // 리소스 여유가 있을 때 스케일 다운
    else if (
      avgCpu < 30 &&
      avgMemory < 40 &&
      this.currentInstances > this.minInstances
    ) {
      const targetInstances = Math.max(
        this.currentInstances - 1,
        this.minInstances
      );

      scalingEvent = {
        type: 'scale_down',
        trigger: 'cpu_threshold',
        currentInstances: this.currentInstances,
        targetInstances,
        timestamp: new Date().toISOString(),
        reason: `리소스 사용률 낮음으로 스케일 다운 (CPU: ${avgCpu.toFixed(1)}%, Memory: ${avgMemory.toFixed(1)}%)`,
      };

      this.currentInstances = targetInstances;
    }

    if (scalingEvent) {
      this.scalingHistory.push(scalingEvent);
      // 최근 50개만 유지
      if (this.scalingHistory.length > 50) {
        this.scalingHistory = this.scalingHistory.slice(-50);
      }
    }

    return scalingEvent;
  }

  /**
   * 📈 용량 계획 생성
   */
  generateCapacityPlan(timeframe: string = '24h'): CapacityPlan {
    const currentTime = new Date();
    const recentEvents = this.scalingHistory.slice(-10);

    // 예측 로직 (단순화된 버전)
    const avgInstances =
      recentEvents.length > 0
        ? recentEvents.reduce((sum, event) => sum + event.targetInstances, 0) /
          recentEvents.length
        : this.currentInstances;

    const predictedLoad = Math.random() * 50 + 50; // 50-100% 범위
    const recommendedInstances = Math.ceil(avgInstances * (predictedLoad / 70));

    return {
      predictedLoad,
      recommendedInstances: Math.min(
        Math.max(recommendedInstances, this.minInstances),
        this.maxInstances
      ),
      costEstimate: recommendedInstances * 45, // 시간당 $45 가정
      confidence: Math.random() * 30 + 70, // 70-100% 신뢰도
      timeframe,
    };
  }

  /**
   * 📊 스케일링 메트릭 생성
   */
  generateScalingMetrics() {
    return {
      currentInstances: this.currentInstances,
      maxInstances: this.maxInstances,
      minInstances: this.minInstances,
      scalingEvents: this.scalingHistory.length,
      lastScalingEvent: this.scalingHistory[this.scalingHistory.length - 1],
      utilizationRate: (this.currentInstances / this.maxInstances) * 100,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 📋 스케일링 히스토리 반환
   */
  getScalingHistory(limit: number = 20): ScalingEvent[] {
    return this.scalingHistory.slice(-limit);
  }

  /**
   * ⚙️ 스케일링 설정 업데이트
   */
  updateScalingConfig(config: {
    maxInstances?: number;
    minInstances?: number;
  }): void {
    if (config.maxInstances) this.maxInstances = config.maxInstances;
    if (config.minInstances) this.minInstances = config.minInstances;

    // 현재 인스턴스 수가 범위를 벗어나면 조정
    this.currentInstances = Math.min(
      Math.max(this.currentInstances, this.minInstances),
      this.maxInstances
    );
  }

  /**
   * 📈 상태 반환
   */
  getStatus() {
    return {
      currentInstances: this.currentInstances,
      maxInstances: this.maxInstances,
      minInstances: this.minInstances,
      totalEvents: this.scalingHistory.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🖥️ 운영 서버 목록 반환
   */
  getOperationalServers(): any[] {
    const servers: any[] = [];
    for (let i = 1; i <= this.currentInstances; i++) {
      servers.push({
        id: `scaling-server-${i}`,
        name: `Scaling-Server-${String(i).padStart(2, '0')}`,
        status: Math.random() > 0.1 ? 'running' : 'starting',
        cpu_usage: Math.random() * 80 + 10,
        memory_usage: Math.random() * 70 + 15,
        instance_type: 't3.medium',
        launch_time: new Date(
          Date.now() - Math.random() * 86400000
        ).toISOString(),
        scaling_group: 'web-servers-asg',
      });
    }
    return servers;
  }

  /**
   * 🏊 서버 풀 정보 반환
   */
  getServerPool(): any {
    return {
      total_capacity: this.maxInstances,
      current_active: this.currentInstances,
      available_slots: this.maxInstances - this.currentInstances,
      minimum_required: this.minInstances,
      utilization_percentage: (this.currentInstances / this.maxInstances) * 100,
      pool_health:
        this.currentInstances >= this.minInstances ? 'healthy' : 'degraded',
      last_scaling_action:
        this.scalingHistory[this.scalingHistory.length - 1]?.type || 'none',
    };
  }

  /**
   * 🤖 AI 메트릭 반환
   */
  getAIMetrics(): any {
    const servers = this.getOperationalServers();
    const totalServers = servers.length;
    const runningServers = servers.filter(
      (s: any) => s.status === 'running'
    ).length;
    const avgCpu =
      servers.reduce((sum: number, s: any) => sum + s.cpu_usage, 0) /
      totalServers;
    const avgMemory =
      servers.reduce((sum: number, s: any) => sum + s.memory_usage, 0) /
      totalServers;

    return {
      totalServers,
      runningServers,
      startingServers: totalServers - runningServers,
      averageCpu: Math.round(avgCpu),
      averageMemory: Math.round(avgMemory),
      scalingEfficiency: (runningServers / this.maxInstances) * 100,
      recentScalingEvents: this.scalingHistory.slice(-5),
      capacityUtilization: (this.currentInstances / this.maxInstances) * 100,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 📝 스케일링 정책 업데이트
   */
  updateScalingPolicy(policy: any): void {
    console.log('📝 스케일링 정책 업데이트:', policy);
    // 정책 업데이트 로직은 필요에 따라 구현
    if (policy.maxInstances) this.maxInstances = policy.maxInstances;
    if (policy.minInstances) this.minInstances = policy.minInstances;
  }
}

// 싱글톤 인스턴스
export const scalingSimulationEngine = new ScalingSimulationEngine();
