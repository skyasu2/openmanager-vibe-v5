/**
 * 🎲 구조화된 랜덤 시나리오 시스템 v2.0.0
 *
 * "시나리오 템플릿 + 랜덤 변수" 접근법으로 매번 다른 20분 스토리 생성
 * - 8가지 장애 유형 풀에서 랜덤 선택
 * - 장애 강도, 지속시간, 영향받는 서버 수 랜덤화
 * - 연쇄 장애 패턴 다양화
 * - 복구 패턴 및 속도 랜덤화
 * - AI 학습을 위한 구조화된 다양성 보장
 */

import type {
  EnhancedServerMetrics,
  ServerRole,
  ServerStatus,
} from '../types/server';

// 🎯 장애 유형 풀 (랜덤 선택)
const FAILURE_SCENARIOS = [
  'traffic_spike', // 트래픽 급증
  'memory_leak', // 메모리 누수
  'database_deadlock', // DB 데드락
  'network_partition', // 네트워크 분할
  'disk_full', // 디스크 포화
  'cpu_thermal', // CPU 과열
  'cache_invalidation', // 캐시 무효화
  'connection_pool', // 커넥션 풀 고갈
] as const;

type FailureType = (typeof FAILURE_SCENARIOS)[number];

// 💪 장애 강도 랜덤화
interface FailureIntensity {
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  duration: number; // 5-30분 랜덤
  affectedServers: number; // 1-8대 랜덤
  recoverySpeed: 'fast' | 'gradual' | 'manual';
  cascadeDelay: number; // 연쇄 장애 지연시간 (분)
}

// 🔗 연쇄 장애 패턴 맵핑
const CASCADE_PATTERNS: Record<FailureType, FailureType[]> = {
  traffic_spike: ['database_deadlock', 'cache_invalidation'],
  memory_leak: ['cpu_thermal', 'disk_full'],
  database_deadlock: ['connection_pool', 'network_partition'],
  network_partition: ['cache_invalidation', 'connection_pool'],
  disk_full: ['memory_leak', 'cpu_thermal'],
  cpu_thermal: ['memory_leak', 'network_partition'],
  cache_invalidation: ['database_deadlock', 'traffic_spike'],
  connection_pool: ['database_deadlock', 'traffic_spike'],
};

// 🏥 복구 패턴 유형
const RECOVERY_TYPES = [
  'auto_scaling', // 자동 스케일링
  'manual_restart', // 수동 재시작
  'gradual_healing', // 점진적 회복
  'circuit_breaker', // 서킷 브레이커 동작
  'failover_switch', // 페일오버 전환
] as const;

type RecoveryType = (typeof RECOVERY_TYPES)[number];

// 📊 시나리오 세션 정의
interface ScenarioSession {
  sessionId: string;
  mainFailure: FailureType;
  intensity: FailureIntensity;
  cascadeFailures: FailureType[];
  recoveryType: RecoveryType;
  timeline: ScenarioTimeline;
  affectedInfrastructure: {
    primaryTargets: ServerRole[];
    secondaryTargets: ServerRole[];
    criticalServers: string[];
  };
  metricsVariation: {
    cpuRange: [number, number];
    memoryRange: [number, number];
    responseTimeRange: [number, number];
    networkRange: [number, number];
  };
}

// ⏰ 타임라인 정의 (랜덤 요소 포함)
interface ScenarioTimeline {
  normalPeriod: number; // 1-3분 정상
  failureStart: number; // 2-5분 장애 시작
  cascadeDelay: number; // 3-7분 연쇄 발생
  peakCrisis: number; // 8-14분 최고 위기
  recoveryStart: number; // 12-16분 복구 시작
  stabilization: number; // 16-20분 안정화
}

export class DemoScenarioManager {
  private static instance: DemoScenarioManager;
  private isActive: boolean = true;
  private startTime: number = Date.now();
  private currentSession: ScenarioSession;
  private lastGeneratedTime: number = 0;

  static getInstance(): DemoScenarioManager {
    if (!DemoScenarioManager.instance) {
      DemoScenarioManager.instance = new DemoScenarioManager();
    }
    return DemoScenarioManager.instance;
  }

  private constructor() {
    this.currentSession = this.generateNewSession();
    console.log('🎲 DemoScenarioManager v2.0 초기화 완료');
    this.logCurrentScenario();
  }

  /**
   * 🎲 새로운 랜덤 시나리오 세션 생성
   */
  private generateNewSession(): ScenarioSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const mainFailure = this.selectRandom(FAILURE_SCENARIOS);
    const intensity = this.generateRandomIntensity();
    const cascadeFailures = this.selectRandomCascadeFailures(mainFailure);
    const recoveryType = this.selectRandom(RECOVERY_TYPES);
    const timeline = this.generateRandomTimeline();
    const infrastructure = this.selectRandomInfrastructure();
    const metricsVariation = this.generateMetricsVariation();

    return {
      sessionId,
      mainFailure,
      intensity,
      cascadeFailures,
      recoveryType,
      timeline,
      affectedInfrastructure: infrastructure,
      metricsVariation,
    };
  }

  /**
   * 🎯 배열에서 랜덤 선택
   */
  private selectRandom<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 💪 랜덤 장애 강도 생성
   */
  private generateRandomIntensity(): FailureIntensity {
    const severities: FailureIntensity['severity'][] = [
      'minor',
      'moderate',
      'severe',
      'critical',
    ];
    const recoveryModes: FailureIntensity['recoverySpeed'][] = [
      'fast',
      'gradual',
      'manual',
    ];

    return {
      severity: this.selectRandom(severities),
      duration: 5 + Math.random() * 25, // 5-30분
      affectedServers: 1 + Math.floor(Math.random() * 8), // 1-8대
      recoverySpeed: this.selectRandom(recoveryModes),
      cascadeDelay: 2 + Math.random() * 5, // 2-7분
    };
  }

  /**
   * 🔗 랜덤 연쇄 장애 선택
   */
  private selectRandomCascadeFailures(
    primaryFailure: FailureType
  ): FailureType[] {
    const possibleCascades = CASCADE_PATTERNS[primaryFailure];
    const cascadeCount = 1 + Math.floor(Math.random() * 2); // 1-2개 연쇄 장애

    return possibleCascades
      .sort(() => Math.random() - 0.5)
      .slice(0, cascadeCount);
  }

  /**
   * ⏰ 랜덤 타임라인 생성
   */
  private generateRandomTimeline(): ScenarioTimeline {
    return {
      normalPeriod: 1 + Math.random() * 2, // 1-3분
      failureStart: 2 + Math.random() * 3, // 2-5분
      cascadeDelay: 3 + Math.random() * 4, // 3-7분
      peakCrisis: 8 + Math.random() * 6, // 8-14분
      recoveryStart: 12 + Math.random() * 4, // 12-16분
      stabilization: 16 + Math.random() * 4, // 16-20분
    };
  }

  /**
   * 🏗️ 랜덤 인프라 선택
   */
  private selectRandomInfrastructure() {
    const allRoles: ServerRole[] = [
      'web',
      'database',
      'cache',
      'api',
      'storage',
    ];
    const primaryCount = 1 + Math.floor(Math.random() * 2); // 1-2개 주요 타겟
    const secondaryCount = 1 + Math.floor(Math.random() * 3); // 1-3개 보조 타겟

    const primaryTargets = allRoles
      .sort(() => Math.random() - 0.5)
      .slice(0, primaryCount);

    const remainingRoles = allRoles.filter(
      role => !primaryTargets.includes(role)
    );
    const secondaryTargets = remainingRoles
      .sort(() => Math.random() - 0.5)
      .slice(0, secondaryCount);

    // 임계 서버 랜덤 선택 (실제 서버명 패턴)
    const criticalServers = [
      `server-${primaryTargets[0]}-0${1 + Math.floor(Math.random() * 3)}`,
      `server-${secondaryTargets[0] || 'web'}-0${1 + Math.floor(Math.random() * 3)}`,
    ];

    return {
      primaryTargets,
      secondaryTargets,
      criticalServers,
    };
  }

  /**
   * 📊 메트릭 변동 범위 생성
   */
  private generateMetricsVariation() {
    return {
      cpuRange: [
        20 + Math.random() * 30, // 하한: 20-50%
        70 + Math.random() * 25, // 상한: 70-95%
      ] as [number, number],
      memoryRange: [
        30 + Math.random() * 20, // 하한: 30-50%
        60 + Math.random() * 35, // 상한: 60-95%
      ] as [number, number],
      responseTimeRange: [
        50 + Math.random() * 100, // 하한: 50-150ms
        200 + Math.random() * 1800, // 상한: 200-2000ms
      ] as [number, number],
      networkRange: [
        10 + Math.random() * 40, // 하한: 10-50% 증가
        100 + Math.random() * 200, // 상한: 100-300% 증가
      ] as [number, number],
    };
  }

  /**
   * 📋 현재 시나리오 정보 로그
   */
  private logCurrentScenario(): void {
    const { mainFailure, intensity, cascadeFailures, recoveryType, timeline } =
      this.currentSession;

    console.log('🎭 새로운 랜덤 시나리오 세션:');
    console.log(
      `   주요 장애: ${this.getFailureDescription(mainFailure)} (${intensity.severity})`
    );
    console.log(
      `   연쇄 장애: ${cascadeFailures.map(f => this.getFailureDescription(f)).join(', ')}`
    );
    console.log(`   복구 방식: ${this.getRecoveryDescription(recoveryType)}`);
    console.log(`   영향 서버: ${intensity.affectedServers}대`);
    console.log('   타임라인:');
    console.log(`     ${timeline.normalPeriod.toFixed(1)}분: 정상 운영`);
    console.log(
      `     ${timeline.failureStart.toFixed(1)}분: ${this.getFailureDescription(mainFailure)} 시작`
    );
    console.log(`     ${timeline.cascadeDelay.toFixed(1)}분: 연쇄 장애 확산`);
    console.log(`     ${timeline.peakCrisis.toFixed(1)}분: 최고 위기 상황`);
    console.log(
      `     ${timeline.recoveryStart.toFixed(1)}분: ${this.getRecoveryDescription(recoveryType)} 시작`
    );
    console.log(`     ${timeline.stabilization.toFixed(1)}분: 완전 안정화`);
  }

  /**
   * 📝 장애 유형 한국어 설명
   */
  private getFailureDescription(failure: FailureType): string {
    const descriptions = {
      traffic_spike: '트래픽 급증',
      memory_leak: '메모리 누수',
      database_deadlock: 'DB 데드락',
      network_partition: '네트워크 분할',
      disk_full: '디스크 포화',
      cpu_thermal: 'CPU 과열',
      cache_invalidation: '캐시 무효화',
      connection_pool: '커넥션 풀 고갈',
    };
    return descriptions[failure];
  }

  /**
   * 🏥 복구 방식 한국어 설명
   */
  private getRecoveryDescription(recovery: RecoveryType): string {
    const descriptions = {
      auto_scaling: '자동 스케일링',
      manual_restart: '수동 재시작',
      gradual_healing: '점진적 회복',
      circuit_breaker: '서킷 브레이커',
      failover_switch: '페일오버 전환',
    };
    return descriptions[recovery];
  }

  /**
   * ⏰ 현재 시나리오 단계 확인
   */
  getCurrentScenario() {
    if (!this.isActive) return null;

    const elapsedMinutes = (Date.now() - this.startTime) / (1000 * 60);
    const cycleMinutes = elapsedMinutes % 20;

    const { timeline, mainFailure, cascadeFailures, intensity, recoveryType } =
      this.currentSession;

    // 현재 단계 판단
    let currentPhase: string;
    let description: string;
    let koreanDescription: string;
    let aiAnalysisPoints: string[];

    if (cycleMinutes < timeline.normalPeriod) {
      currentPhase = 'normal_baseline';
      description = 'System baseline - all servers operating normally';
      koreanDescription =
        '시스템 정상 상태 - 모든 서버가 안정적으로 운영 중입니다';
      aiAnalysisPoints = ['정상 베이스라인 설정', '서버 간 안정적인 통신 패턴'];
    } else if (cycleMinutes < timeline.failureStart) {
      currentPhase = 'failure_start';
      description = `${mainFailure} detected and escalating`;
      koreanDescription = `${this.getFailureDescription(mainFailure)} 감지 및 확산 중 🚨`;
      aiAnalysisPoints = [
        `${this.getFailureDescription(mainFailure)} 패턴 인식`,
        '초기 장애 지표 상관관계 분석',
      ];
    } else if (cycleMinutes < timeline.cascadeDelay) {
      currentPhase = 'cascade_failure';
      description = `Cascade failures: ${cascadeFailures.join(', ')}`;
      koreanDescription = `연쇄 장애 확산: ${cascadeFailures.map(f => this.getFailureDescription(f)).join(', ')} 🔥`;
      aiAnalysisPoints = ['연쇄 장애 패턴 감지', '장애 전파 경로 분석'];
    } else if (cycleMinutes < timeline.peakCrisis) {
      currentPhase = 'critical_state';
      description = `Critical state - ${intensity.affectedServers} servers affected (${intensity.severity})`;
      koreanDescription = `임계 상태 - ${intensity.affectedServers}대 서버 영향 (${intensity.severity}) ⚠️`;
      aiAnalysisPoints = [
        '임계 상태 서버 우선순위 결정',
        '시스템 가용성 위험도 계산',
      ];
    } else if (cycleMinutes < timeline.recoveryStart) {
      currentPhase = 'auto_recovery';
      description = `${recoveryType} initiated - recovery in progress`;
      koreanDescription = `${this.getRecoveryDescription(recoveryType)} 시작 - 복구 진행 중 🔄`;
      aiAnalysisPoints = [
        `${this.getRecoveryDescription(recoveryType)} 효과 측정`,
        '복구 패턴 최적화 분석',
      ];
    } else {
      currentPhase = 'stabilization';
      description = 'System stabilization achieved';
      koreanDescription = '시스템 완전 정상화 완료 ✅';
      aiAnalysisPoints = ['시스템 복구 완료 검증', '성능 최적화 달성 확인'];
    }

    return {
      phase: currentPhase,
      timeRange: `${Math.floor(cycleMinutes)}-${Math.floor(cycleMinutes) + 1}분`,
      description,
      koreanDescription,
      aiAnalysisPoints,
      changes: this.generateCurrentChanges(currentPhase, cycleMinutes),
      sessionInfo: {
        sessionId: this.currentSession.sessionId,
        mainFailure,
        cascadeFailures,
        intensity,
        recoveryType,
      },
    };
  }

  /**
   * 📊 현재 단계별 메트릭 변화 생성
   */
  private generateCurrentChanges(phase: string, cycleMinutes: number) {
    const { metricsVariation, affectedInfrastructure, intensity } =
      this.currentSession;

    // 단계별 강도 계수
    const phaseIntensity = this.calculatePhaseIntensity(phase, cycleMinutes);

    const changes: any = {
      targetServers: affectedInfrastructure.criticalServers,
      serverTypes: affectedInfrastructure.primaryTargets,
      metrics: {
        cpu: this.generateRandomMetric('cpu', phaseIntensity),
        memory: this.generateRandomMetric('memory', phaseIntensity),
        response_time: this.generateRandomMetric(
          'response_time',
          phaseIntensity
        ),
        network_in: this.generateRandomMetric('network', phaseIntensity),
        status: this.generateRandomStatus(phaseIntensity),
      },
    };

    // 연쇄 효과 추가
    if (phase === 'cascade_failure' || phase === 'critical_state') {
      changes.cascadeEffects = {
        affectedTypes: affectedInfrastructure.secondaryTargets,
        delayMs: 1000 + Math.random() * 3000,
        metrics: {
          cpu: `+${5 + Math.random() * 15}`,
          response_time: `+${100 + Math.random() * 400}`,
        },
      };
    }

    return changes;
  }

  /**
   * 🎯 단계별 강도 계수 계산
   */
  private calculatePhaseIntensity(phase: string, cycleMinutes: number): number {
    switch (phase) {
      case 'normal_baseline':
        return 0.3;
      case 'failure_start':
        return 0.5 + Math.random() * 0.3;
      case 'cascade_failure':
        return 0.7 + Math.random() * 0.2;
      case 'critical_state':
        return 0.9 + Math.random() * 0.1;
      case 'auto_recovery':
        return 0.6 - Math.random() * 0.3;
      case 'stabilization':
        return 0.3 + Math.random() * 0.1;
      default:
        return 0.5;
    }
  }

  /**
   * 📊 랜덤 메트릭 값 생성
   */
  private generateRandomMetric(
    type: string,
    intensity: number
  ): number | string {
    const { metricsVariation } = this.currentSession;

    switch (type) {
      case 'cpu':
        const cpuBase =
          metricsVariation.cpuRange[0] +
          (metricsVariation.cpuRange[1] - metricsVariation.cpuRange[0]) *
            intensity;
        return Math.round(cpuBase + (Math.random() - 0.5) * 10);

      case 'memory':
        const memBase =
          metricsVariation.memoryRange[0] +
          (metricsVariation.memoryRange[1] - metricsVariation.memoryRange[0]) *
            intensity;
        return Math.round(memBase + (Math.random() - 0.5) * 8);

      case 'response_time':
        const rtBase =
          metricsVariation.responseTimeRange[0] +
          (metricsVariation.responseTimeRange[1] -
            metricsVariation.responseTimeRange[0]) *
            intensity;
        return Math.round(rtBase + (Math.random() - 0.5) * 50);

      case 'network':
        const netIncrease = Math.round((10 + Math.random() * 90) * intensity);
        return `+${netIncrease}`;

      default:
        return Math.round(30 + Math.random() * 40);
    }
  }

  /**
   * 🚨 랜덤 서버 상태 생성
   */
  private generateRandomStatus(intensity: number): ServerStatus {
    if (intensity < 0.4) return 'normal';
    if (intensity < 0.7) return 'warning';
    if (intensity < 0.9) return 'critical';
    return 'critical';
  }

  /**
   * 📊 데모 상태 정보 조회
   */
  getStatus() {
    if (!this.isActive) return null;

    const currentScenario = this.getCurrentScenario();
    if (!currentScenario) return null;

    const elapsedMinutes =
      Math.floor((Date.now() - this.startTime) / (1000 * 60)) % 20;

    return {
      isActive: true,
      sessionId: this.currentSession.sessionId,
      currentPhase: currentScenario.phase,
      timeRange: currentScenario.timeRange,
      description: currentScenario.description,
      koreanDescription: currentScenario.koreanDescription,
      elapsedMinutes,
      nextPhaseIn: this.calculateNextPhaseTime(elapsedMinutes),
      aiAnalysisPoints: currentScenario.aiAnalysisPoints,
      totalDuration: 20,
      scenarioDetails: {
        mainFailure: currentScenario.sessionInfo.mainFailure,
        cascadeFailures: currentScenario.sessionInfo.cascadeFailures,
        intensity: currentScenario.sessionInfo.intensity,
        recoveryType: currentScenario.sessionInfo.recoveryType,
      },
      variationLevel: this.calculateVariationLevel(),
    };
  }

  /**
   * 📈 변동성 수준 계산
   */
  private calculateVariationLevel(): string {
    const { intensity } = this.currentSession;
    if (intensity.severity === 'critical') return 'HIGH';
    if (intensity.severity === 'severe') return 'MEDIUM-HIGH';
    if (intensity.severity === 'moderate') return 'MEDIUM';
    return 'LOW';
  }

  /**
   * ⏱️ 다음 단계까지 시간 계산
   */
  private calculateNextPhaseTime(elapsed: number): number {
    const { timeline } = this.currentSession;

    if (elapsed < timeline.normalPeriod) return timeline.normalPeriod - elapsed;
    if (elapsed < timeline.failureStart) return timeline.failureStart - elapsed;
    if (elapsed < timeline.cascadeDelay) return timeline.cascadeDelay - elapsed;
    if (elapsed < timeline.peakCrisis) return timeline.peakCrisis - elapsed;
    if (elapsed < timeline.recoveryStart)
      return timeline.recoveryStart - elapsed;
    return timeline.stabilization - elapsed;
  }

  /**
   * 🎭 서버 데이터에 시나리오 적용
   */
  applyToServers(servers: EnhancedServerMetrics[]): void {
    const currentScenario = this.getCurrentScenario();
    if (!currentScenario || !this.isActive) return;

    const { changes } = currentScenario;

    // 타겟 서버들에 변화 적용
    if (changes.targetServers) {
      servers.forEach(server => {
        if (changes.targetServers!.includes(server.id)) {
          this.applyMetricChanges(server, changes.metrics);
        }
      });
    }

    // 서버 타입별 변화 적용
    if (changes.serverTypes) {
      servers.forEach(server => {
        if (changes.serverTypes!.includes(server.role)) {
          this.applyMetricChanges(server, changes.metrics);
        }
      });
    }

    // 연쇄 효과 적용
    if (changes.cascadeEffects) {
      setTimeout(() => {
        servers.forEach(server => {
          if (changes.cascadeEffects!.affectedTypes.includes(server.role)) {
            this.applyMetricChanges(server, changes.cascadeEffects!.metrics);
          }
        });
      }, changes.cascadeEffects.delayMs);
    }
  }

  /**
   * 📊 메트릭 변화 적용
   */
  private applyMetricChanges(
    server: EnhancedServerMetrics,
    metrics: any
  ): void {
    if (metrics.cpu !== undefined) {
      server.cpu_usage = this.calculateNewValue(server.cpu_usage, metrics.cpu);
    }
    if (metrics.memory !== undefined) {
      server.memory_usage = this.calculateNewValue(
        server.memory_usage,
        metrics.memory
      );
    }
    if (metrics.disk !== undefined) {
      server.disk_usage = this.calculateNewValue(
        server.disk_usage,
        metrics.disk
      );
    }
    if (metrics.network_in !== undefined) {
      server.network_in = this.calculateNewValue(
        server.network_in,
        metrics.network_in
      );
    }
    if (metrics.network_out !== undefined) {
      server.network_out = this.calculateNewValue(
        server.network_out,
        metrics.network_out
      );
    }
    if (metrics.response_time !== undefined) {
      server.response_time = this.calculateNewValue(
        server.response_time,
        metrics.response_time
      );
    }
    if (metrics.status !== undefined) {
      server.status = metrics.status;
    }

    // 상태 업데이트
    this.updateServerStatus(server);
  }

  /**
   * 🧮 새로운 값 계산 (절대값 또는 상대값)
   */
  private calculateNewValue(current: number, change: number | string): number {
    if (typeof change === 'number') {
      return Math.max(0, Math.min(100, change + (Math.random() - 0.5) * 5)); // ±2.5% 노이즈
    }

    if (typeof change === 'string' && change.startsWith('+')) {
      const increase = parseInt(change.substring(1));
      return Math.max(
        0,
        Math.min(100, current + increase + (Math.random() - 0.5) * 3)
      );
    }

    if (typeof change === 'string' && change.startsWith('-')) {
      const decrease = parseInt(change.substring(1));
      return Math.max(
        0,
        Math.min(100, current - decrease + (Math.random() - 0.5) * 3)
      );
    }

    return current;
  }

  /**
   * 🚨 서버 상태 업데이트
   */
  private updateServerStatus(server: EnhancedServerMetrics): void {
    const avgLoad =
      (server.cpu_usage + server.memory_usage + server.disk_usage) / 3;

    if (avgLoad > 85) server.status = 'critical';
    else if (avgLoad > 70) server.status = 'warning';
    else server.status = 'normal';
  }

  /**
   * 🔄 데모 활성화/비활성화
   */
  toggle(enabled: boolean): void {
    this.isActive = enabled;
    if (enabled) {
      this.restart();
    }
  }

  /**
   * 🎲 데모 재시작 (새로운 랜덤 시나리오 생성)
   */
  restart(): void {
    this.startTime = Date.now();
    this.currentSession = this.generateNewSession();
    console.log('🎭 데모 시나리오 재시작 - 새로운 랜덤 세션 생성');
    this.logCurrentScenario();
  }

  /**
   * 📊 현재 세션 정보 조회
   */
  getSessionInfo() {
    return {
      sessionId: this.currentSession.sessionId,
      mainFailure: this.currentSession.mainFailure,
      intensity: this.currentSession.intensity,
      cascadeFailures: this.currentSession.cascadeFailures,
      recoveryType: this.currentSession.recoveryType,
      affectedInfrastructure: this.currentSession.affectedInfrastructure,
      metricsVariation: this.currentSession.metricsVariation,
      timeline: this.currentSession.timeline,
    };
  }
}
