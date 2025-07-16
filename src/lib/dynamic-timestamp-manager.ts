/**
 * 🕒 동적 타임스탬프 매니저
 * 
 * 실시간 타임스탬프 생성 및 시간대별 가중치 적용
 * TDD Green 단계: 테스트를 통과하는 최소한의 구현
 */

import { 
  ServerMetrics, 
  TimestampManagerConfig, 
  ScenarioTransformation,
  FailureScenario 
} from '../types/fixed-data-system';

// ==============================================
// 🔧 기본 설정
// ==============================================

const DEFAULT_CONFIG: TimestampManagerConfig = {
  updateInterval: 30000, // 30초
  variationRange: 0.1,   // 10% 변동
  timeBasedWeights: {
    businessHours: 1.5,  // 업무시간 가중치
    nightTime: 0.5,      // 야간 가중치
    weekend: 0.7         // 주말 가중치
  }
};

// ==============================================
// 🏗️ 동적 타임스탬프 매니저 클래스
// ==============================================

export class DynamicTimestampManager {
  private config: TimestampManagerConfig;
  private transformationHistory: ScenarioTransformation[];
  private lastUpdateTime: Date;

  constructor(config: Partial<TimestampManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.transformationHistory = [];
    this.lastUpdateTime = new Date();
  }

  /**
   * 🕒 실시간 타임스탬프 생성
   */
  generateRealtimeTimestamp(): string {
    const now = new Date();
    this.lastUpdateTime = now;
    return now.toISOString();
  }

  /**
   * 📊 시간대별 가중치 적용
   */
  applyTimeBasedWeights(
    metrics: ServerMetrics,
    timestamp: Date
  ): ServerMetrics {
    const weight = this.calculateTimeWeight(timestamp);
    
    // 가중치를 적용한 메트릭 생성
    const weightedMetrics: ServerMetrics = {
      ...metrics,
      cpu: this.applyVariation(metrics.cpu * weight, this.config.variationRange),
      memory: this.applyVariation(metrics.memory * weight, this.config.variationRange),
      disk: metrics.disk, // 디스크는 시간대 영향 적음
      network: {
        ...metrics.network,
        latency: this.applyVariation(metrics.network.latency * (2 - weight), this.config.variationRange),
        throughput: this.applyVariation(metrics.network.throughput * weight, this.config.variationRange)
      },
      response_time: this.applyVariation(metrics.response_time * (2 - weight), this.config.variationRange),
      request_count: Math.round(metrics.request_count * weight),
      error_rate: this.applyVariation(metrics.error_rate * (2 - weight), this.config.variationRange),
      uptime: metrics.uptime
    };

    // 범위 제한
    return this.clampMetrics(weightedMetrics);
  }

  /**
   * 🎯 시나리오 변환 적용
   */
  applyScenarioTransformation(
    baseMetrics: ServerMetrics,
    scenario: FailureScenario,
    progressTime: number
  ): ServerMetrics {
    const transformation: ScenarioTransformation = {
      serverId: 'temp-id',
      scenario,
      baseMetrics,
      transformedMetrics: baseMetrics,
      intensity: progressTime,
      timestamp: new Date()
    };

    // 시나리오별 변환 로직
    let transformedMetrics = { ...baseMetrics };
    
    switch (scenario) {
      case 'cpu_overload':
        transformedMetrics.cpu = this.interpolate(
          baseMetrics.cpu, 
          Math.min(95, 80 + Math.random() * 15), 
          progressTime
        );
        transformedMetrics.response_time = this.interpolate(
          baseMetrics.response_time,
          baseMetrics.response_time * 2,
          progressTime
        );
        break;
        
      case 'memory_leak':
        transformedMetrics.memory = this.interpolate(
          baseMetrics.memory,
          Math.min(95, 85 + Math.random() * 10),
          progressTime
        );
        break;
        
      case 'storage_full':
        transformedMetrics.disk = this.interpolate(
          baseMetrics.disk,
          Math.min(95, 90 + Math.random() * 5),
          progressTime
        );
        break;
        
      case 'network_issue':
        transformedMetrics.network.latency = this.interpolate(
          baseMetrics.network.latency,
          1000 + Math.random() * 1000,
          progressTime
        );
        transformedMetrics.network.throughput = this.interpolate(
          baseMetrics.network.throughput,
          Math.max(10, 50 + Math.random() * 50),
          progressTime
        );
        break;
        
      case 'database_slow':
        transformedMetrics.response_time = this.interpolate(
          baseMetrics.response_time,
          5000 + Math.random() * 3000,
          progressTime
        );
        transformedMetrics.error_rate = this.interpolate(
          baseMetrics.error_rate,
          10 + Math.random() * 10,
          progressTime
        );
        break;
    }

    transformation.transformedMetrics = transformedMetrics;
    this.transformationHistory.push(transformation);

    // 히스토리 크기 제한 (메모리 관리)
    if (this.transformationHistory.length > 1000) {
      this.transformationHistory = this.transformationHistory.slice(-500);
    }

    return transformedMetrics;
  }

  /**
   * 🌊 연쇄 장애 시뮬레이션
   */
  simulateCascadeFailures(
    servers: any[],
    primaryFailure: FailureScenario
  ): Map<string, FailureScenario> {
    const cascadeMap = new Map<string, FailureScenario>();
    
    // 단순화된 연쇄 장애 로직
    const cascadeRisk = this.getCascadeRisk(primaryFailure);
    
    servers.forEach(server => {
      if (server.dependencies && server.dependencies.length > 0) {
        if (Math.random() < cascadeRisk) {
          // 연쇄 장애 발생
          const cascadeScenario = this.determineCascadeScenario(primaryFailure);
          cascadeMap.set(server.id, cascadeScenario);
        }
      }
    });

    return cascadeMap;
  }

  /**
   * 📈 실시간 메트릭 변동 적용
   */
  applyRealtimeVariation(metrics: ServerMetrics): ServerMetrics {
    const variation = this.config.variationRange;
    
    return {
      ...metrics,
      cpu: this.applyVariation(metrics.cpu, variation),
      memory: this.applyVariation(metrics.memory, variation),
      disk: metrics.disk, // 디스크는 변동 적음
      network: {
        ...metrics.network,
        latency: this.applyVariation(metrics.network.latency, variation),
        throughput: this.applyVariation(metrics.network.throughput, variation)
      },
      response_time: this.applyVariation(metrics.response_time, variation),
      request_count: Math.round(metrics.request_count * (1 + (Math.random() - 0.5) * variation)),
      error_rate: this.applyVariation(metrics.error_rate, variation * 0.5),
      uptime: metrics.uptime
    };
  }

  /**
   * 📊 변환 히스토리 조회
   */
  getTransformationHistory(serverId?: string): ScenarioTransformation[] {
    if (serverId) {
      return this.transformationHistory.filter(t => t.serverId === serverId);
    }
    return this.transformationHistory;
  }

  /**
   * 🧹 히스토리 정리
   */
  clearHistory(): void {
    this.transformationHistory = [];
  }

  /**
   * 📈 성능 메트릭 조회
   */
  getPerformanceMetrics(): {
    transformationCount: number;
    lastUpdateTime: Date;
    averageProcessingTime: number;
    memoryUsage: number;
  } {
    return {
      transformationCount: this.transformationHistory.length,
      lastUpdateTime: this.lastUpdateTime,
      averageProcessingTime: 5, // 임시값
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024 // MB
    };
  }

  // ==============================================
  // 🛠️ 유틸리티 메서드
  // ==============================================

  /**
   * 시간대별 가중치 계산
   */
  private calculateTimeWeight(timestamp: Date): number {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();
    
    // 주말 확인
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return this.config.timeBasedWeights.weekend;
    }
    
    // 업무시간 확인 (9-17시)
    if (hour >= 9 && hour <= 17) {
      return this.config.timeBasedWeights.businessHours;
    }
    
    // 야간시간
    return this.config.timeBasedWeights.nightTime;
  }

  /**
   * 변동 적용
   */
  private applyVariation(value: number, variationRange: number): number {
    const variation = (Math.random() - 0.5) * 2 * variationRange;
    return Math.max(0, value * (1 + variation));
  }

  /**
   * 선형 보간
   */
  private interpolate(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * 메트릭 범위 제한
   */
  private clampMetrics(metrics: ServerMetrics): ServerMetrics {
    return {
      ...metrics,
      cpu: Math.max(0, Math.min(100, metrics.cpu)),
      memory: Math.max(0, Math.min(100, metrics.memory)),
      disk: Math.max(0, Math.min(100, metrics.disk)),
      network: {
        ...metrics.network,
        latency: Math.max(0, metrics.network.latency),
        throughput: Math.max(0, metrics.network.throughput)
      },
      response_time: Math.max(0, metrics.response_time),
      request_count: Math.max(0, metrics.request_count),
      error_rate: Math.max(0, Math.min(100, metrics.error_rate)),
      uptime: Math.max(0, metrics.uptime)
    };
  }

  /**
   * 연쇄 장애 위험도 계산
   */
  private getCascadeRisk(scenario: FailureScenario): number {
    const riskMap: Record<FailureScenario, number> = {
      cpu_overload: 0.3,
      memory_leak: 0.4,
      storage_full: 0.2,
      network_issue: 0.5,
      database_slow: 0.8
    };
    
    return riskMap[scenario] || 0.3;
  }

  /**
   * 연쇄 장애 시나리오 결정
   */
  private determineCascadeScenario(primaryFailure: FailureScenario): FailureScenario {
    const cascadeMap: Record<FailureScenario, FailureScenario[]> = {
      cpu_overload: ['network_issue', 'database_slow'],
      memory_leak: ['cpu_overload', 'database_slow'],
      storage_full: ['cpu_overload', 'memory_leak'],
      network_issue: ['database_slow', 'cpu_overload'],
      database_slow: ['cpu_overload', 'memory_leak', 'network_issue']
    };
    
    const possibleScenarios = cascadeMap[primaryFailure] || ['cpu_overload'];
    const randomIndex = Math.floor(Math.random() * possibleScenarios.length);
    
    return possibleScenarios[randomIndex];
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<TimestampManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 현재 설정 조회
   */
  getConfig(): TimestampManagerConfig {
    return { ...this.config };
  }
}