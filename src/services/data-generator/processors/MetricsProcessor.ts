/**
 * 📊 MetricsProcessor - 메트릭 처리 및 분석 전담 모듈
 *
 * 📝 담당 기능:
 * - 실시간 메트릭 처리 및 변환
 * - 장애 시나리오 기반 메트릭 조정
 * - 유의미한 변화 감지
 * - 서버 상태 결정 로직
 * - 클러스터/애플리케이션 건강 상태 계산
 *
 * 🎯 SOLID 원칙: 단일 책임 - 메트릭 처리만 담당
 *
 * @author OpenManager Vibe v5
 * @since 2025-07-02 04:33 KST
 */

import { ServerInstance } from '@/types/data-generator';

/**
 * 🎭 장애 시나리오 컨텍스트 인터페이스
 */
export interface ScenarioContext {
  intensity: number;
  affectedTypes: string[];
  phase: string;
  isAffectedServer: boolean;
}

/**
 * 📊 메트릭 처리 결과 인터페이스
 */
export interface MetricsProcessingResult {
  processedMetrics: any;
  hasSignificantChange: boolean;
  newStatus: 'running' | 'warning' | 'error';
  healthScore: number;
}

/**
 * 📊 MetricsProcessor 클래스
 */
export class MetricsProcessor {
  /**
   * 🎯 실시간 메트릭 처리 (메인 로직)
   */
  public static processServerMetrics(
    server: ServerInstance,
    scenarioContext: ScenarioContext,
    updateInterval: number = 30000
  ): MetricsProcessingResult {
    // 🎯 1단계: 원본 메트릭 수집
    const rawMetrics = {
      cpu: server.metrics.cpu,
      memory: server.metrics.memory,
      disk: server.metrics.disk,
      network: { ...server.metrics.network },
    };

    // 🎯 2단계: 데이터 전처리 (장애 시나리오 반영)
    const effectiveIntensity = scenarioContext.isAffectedServer
      ? scenarioContext.intensity
      : 1.0;

    let processedMetrics = {
      cpu: parseFloat(
        Math.max(
          0,
          Math.min(
            100,
            rawMetrics.cpu + (Math.random() - 0.5) * 20 * effectiveIntensity
          )
        ).toFixed(2)
      ),
      memory: parseFloat(
        Math.max(
          0,
          Math.min(
            100,
            rawMetrics.memory + (Math.random() - 0.5) * 15 * effectiveIntensity
          )
        ).toFixed(2)
      ),
      disk: parseFloat(
        Math.max(
          0,
          Math.min(
            100,
            rawMetrics.disk + (Math.random() - 0.5) * 10 * effectiveIntensity
          )
        ).toFixed(2)
      ),
      network: {
        in: Math.max(
          0,
          rawMetrics.network.in +
          (Math.random() - 0.5) * 50 * effectiveIntensity
        ),
        out: Math.max(
          0,
          rawMetrics.network.out +
          (Math.random() - 0.5) * 30 * effectiveIntensity
        ),
      },
    };

    // 🎭 3단계: 장애 시나리오 기반 추가 메트릭 조정
    if (scenarioContext.isAffectedServer) {
      processedMetrics = this.applyScenarioAdjustments(
        processedMetrics,
        scenarioContext
      );
    }

    // 🎯 4단계: 유의미한 변화 감지
    const hasSignificantChange = this.detectSignificantChange(
      server.metrics,
      processedMetrics
    );

    // 🎯 5단계: 서버 상태 결정
    const newStatus = this.determineServerStatus(processedMetrics);

    // 🎯 6단계: 건강 점수 계산
    const healthScore = this.calculateHealthScore(processedMetrics);

    // 🎯 7단계: 최종 메트릭 업데이트
    const currentMetrics = server.metrics || { uptime: 0, requests: 0, errors: 0 };
    const finalMetrics = {
      ...currentMetrics,
      ...processedMetrics,
      uptime: (currentMetrics.uptime || 0) + updateInterval / 1000,
      requests: ((currentMetrics as any).requests || 0) + Math.floor(Math.random() * 100),
      errors: ((currentMetrics as any).errors || 0) + (Math.random() > 0.95 ? 1 : 0),
    };

    return {
      processedMetrics: finalMetrics,
      hasSignificantChange,
      newStatus,
      healthScore,
    };
  }

  /**
   * 🎭 장애 시나리오 기반 메트릭 조정
   */
  private static applyScenarioAdjustments(
    metrics: any,
    scenarioContext: ScenarioContext
  ): any {
    const adjustedMetrics = { ...metrics };

    switch (scenarioContext.phase) {
      case 'failure_start':
        // 장애 시작: CPU와 메모리 급증
        adjustedMetrics.cpu = Math.min(100, adjustedMetrics.cpu + 15);
        adjustedMetrics.memory = Math.min(100, adjustedMetrics.memory + 10);
        break;
      case 'cascade_failure':
        // 연쇄 장애: 모든 리소스에 부하
        adjustedMetrics.cpu = Math.min(100, adjustedMetrics.cpu + 25);
        adjustedMetrics.memory = Math.min(100, adjustedMetrics.memory + 20);
        adjustedMetrics.disk = Math.min(100, adjustedMetrics.disk + 15);
        break;
      case 'critical_state':
        // 임계 상태: 극심한 부하
        adjustedMetrics.cpu = Math.min(100, adjustedMetrics.cpu + 35);
        adjustedMetrics.memory = Math.min(100, adjustedMetrics.memory + 30);
        break;
      case 'auto_recovery':
        // 복구 중: 점진적 개선
        adjustedMetrics.cpu = Math.max(0, adjustedMetrics.cpu - 10);
        adjustedMetrics.memory = Math.max(0, adjustedMetrics.memory - 8);
        break;
    }

    return adjustedMetrics;
  }

  /**
   * 🎯 유의미한 변화 감지 (10% 이상 변화)
   */
  private static detectSignificantChange(
    originalMetrics: any,
    newMetrics: any
  ): boolean {
    const cpuChange = Math.abs(newMetrics.cpu - originalMetrics.cpu);
    const memoryChange = Math.abs(newMetrics.memory - originalMetrics.memory);

    return cpuChange > 10 || memoryChange > 10;
  }

  /**
   * 🎯 메트릭 기반 서버 상태 결정
   */
  public static determineServerStatus(
    metrics: any
  ): 'running' | 'warning' | 'error' {
    const { cpu, memory, disk } = metrics;

    // Critical 조건 (error 상태)
    if (cpu > 90 || memory > 95 || disk > 95) {
      return 'error';
    }

    // Warning 조건
    if (cpu > 75 || memory > 85 || disk > 85) {
      return 'warning';
    }

    // 정상 상태
    return 'running';
  }

  /**
   * 🎯 건강 점수 계산 (0-100점)
   */
  public static calculateHealthScore(metrics: any): number {
    const { cpu, memory, disk } = metrics;

    // 각 메트릭의 건강도 점수 계산 (100 - 사용률)
    const cpuHealth = Math.max(0, 100 - cpu);
    const memoryHealth = Math.max(0, 100 - memory);
    const diskHealth = Math.max(0, 100 - disk);

    // 가중 평균 (CPU 40%, Memory 35%, Disk 25%)
    const healthScore =
      cpuHealth * 0.4 + memoryHealth * 0.35 + diskHealth * 0.25;

    return parseFloat(healthScore.toFixed(1));
  }

  /**
   * 🏥 클러스터 건강 상태 계산
   */
  public static calculateClusterHealth(
    servers: ServerInstance[]
  ): 'healthy' | 'warning' | 'critical' {
    if (servers.length === 0) return 'critical';

    const healthyCount = servers.filter(s => s.status === 'running').length;
    const healthPercentage = healthyCount / servers.length;

    if (healthPercentage >= 0.8) return 'healthy';
    if (healthPercentage >= 0.5) return 'warning';
    return 'critical';
  }

  /**
   * 🏥 애플리케이션 건강 상태 계산
   */
  public static calculateApplicationHealth(
    servers: ServerInstance[]
  ): 'healthy' | 'warning' | 'critical' {
    if (servers.length === 0) return 'critical';

    const healthyCount = servers.filter(s => s.status === 'running').length;
    const healthPercentage = healthyCount / servers.length;

    if (healthPercentage >= 0.9) return 'healthy';
    if (healthPercentage >= 0.7) return 'warning';
    return 'critical';
  }

  private extractMetrics(server: ServerInstance): any {
    if (!server.metrics) {
      return {
        cpu: 0,
        memory: 0,
        disk: 0,
        network: { in: 0, out: 0 },
        requests: 0,
        errors: 0,
        uptime: 0,
      };
    }

    const metrics = server.metrics;

    return {
      cpu: metrics.cpu || 0,
      memory: metrics.memory || 0,
      disk: metrics.disk || 0,
      network: typeof metrics.network === 'object'
        ? { ...metrics.network }
        : { in: metrics.network || 0, out: metrics.network || 0 },
      requests: (metrics as any).requests || 0,
      errors: (metrics as any).errors || 0,
      uptime: metrics.uptime || 0,
    };
  }
}
