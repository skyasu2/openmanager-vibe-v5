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

interface PhaseChanges {
  targetServers?: string[];
  serverTypes?: string[];
  metricsDeltas?: Record<string, any>;
  cascadeEffects?: {
    affectedTypes: string[];
    delayMs: number;
    metrics: Record<string, string>;
  };
  alertTriggers?: {
    threshold: number;
    type: string;
  };
  recoveryHints?: {
    suggestedActions: string[];
    estimatedTime: string;
  };
  [key: string]: any; // Allow additional properties
}

interface MetricChanges {
  cpu?: string | number;
  memory?: string | number;
  disk?: string | number;
  network_in?: string | number;
  network_out?: string | number;
  response_time?: string | number;
  [key: string]: any;
}

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
  'ssl_certificate_expiry', // SSL 인증서 만료
  'dns_resolution_failure', // DNS 해석 실패
  'load_balancer_failure', // 로드밸런서 장애
  'storage_corruption', // 스토리지 손상
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

// 🔗 연쇄 장애 패턴 맵핑 (확장된 패턴)
const CASCADE_PATTERNS: Record<FailureType, FailureType[]> = {
  traffic_spike: ['database_deadlock', 'cache_invalidation', 'connection_pool'],
  memory_leak: ['cpu_thermal', 'disk_full', 'storage_corruption'],
  database_deadlock: ['connection_pool', 'network_partition', 'memory_leak'],
  network_partition: [
    'cache_invalidation',
    'connection_pool',
    'dns_resolution_failure',
  ],
  disk_full: ['memory_leak', 'cpu_thermal', 'storage_corruption'],
  cpu_thermal: ['memory_leak', 'network_partition', 'storage_corruption'],
  cache_invalidation: ['database_deadlock', 'traffic_spike', 'connection_pool'],
  connection_pool: ['database_deadlock', 'traffic_spike', 'memory_leak'],
  ssl_certificate_expiry: [
    'dns_resolution_failure',
    'load_balancer_failure',
    'network_partition',
  ],
  dns_resolution_failure: [
    'ssl_certificate_expiry',
    'network_partition',
    'load_balancer_failure',
  ],
  load_balancer_failure: [
    'traffic_spike',
    'connection_pool',
    'dns_resolution_failure',
  ],
  storage_corruption: ['disk_full', 'memory_leak', 'cpu_thermal'],
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

// 📊 시나리오 세션 정의 (24시간 사전 데이터 연결)
interface ScenarioSession {
  sessionId: string;
  preScenarioPattern: PreScenarioPattern; // 🧩 24시간 사전 패턴
  mainFailure: FailureType;
  intensity: FailureIntensity;
  cascadeFailures: FailureType[];
  recoveryType: RecoveryType;
  timeline: ScenarioTimeline;
  unpredictablePattern: UnpredictablePattern; // 🎭 AI 혼란 패턴
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
  preDataConnection: {
    trendStart: number; // 24시간 전부터 시작된 트렌드 강도
    warningSignals: number; // 사전 경고 신호 수
    patternConsistency: number; // 패턴 일관성 (0-1)
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

// 🧩 24시간 사전 시나리오 패턴 (AI 학습용 다양성)
const PRE_SCENARIO_PATTERNS = [
  'gradual_degradation', // 점진적 성능 저하 (24시간 전부터 조짐)
  'periodic_spikes', // 주기적 부하 증가 (3-6시간 간격)
  'cascading_warnings', // 연쇄 경고 (12시간 전부터 경고 신호)
  'resource_exhaustion', // 리소스 고갈 (18시간 점진적 증가)
  'intermittent_failures', // 간헐적 장애 (6-12시간 무작위 발생)
  'thermal_buildup', // 열적 누적 (10시간 온도 상승)
  'network_congestion', // 네트워크 혼잡 (8시간 점진적 증가)
  'security_probes', // 보안 탐지 (24시간 분산 공격 시도)
] as const;

type PreScenarioPattern = (typeof PRE_SCENARIO_PATTERNS)[number];

// 🔗 사전 패턴과 실시간 장애의 연관성 매핑
const PATTERN_TO_FAILURE_MAP: Record<PreScenarioPattern, FailureType[]> = {
  gradual_degradation: ['memory_leak', 'disk_full', 'cpu_thermal'],
  periodic_spikes: ['traffic_spike', 'database_deadlock', 'connection_pool'],
  cascading_warnings: [
    'network_partition',
    'load_balancer_failure',
    'dns_resolution_failure',
  ],
  resource_exhaustion: ['memory_leak', 'disk_full', 'storage_corruption'],
  intermittent_failures: [
    'cache_invalidation',
    'ssl_certificate_expiry',
    'dns_resolution_failure',
  ],
  thermal_buildup: ['cpu_thermal', 'storage_corruption', 'network_partition'],
  network_congestion: [
    'traffic_spike',
    'load_balancer_failure',
    'connection_pool',
  ],
  security_probes: [
    'dns_resolution_failure',
    'ssl_certificate_expiry',
    'network_partition',
  ],
};

// 🎭 AI 혼란 유발 패턴 (예측 불가능성 증대)
interface UnpredictablePattern {
  triggerDelay: number; // 예상과 다른 지연시간
  intensityVariation: number; // 예상과 다른 강도
  affectedSystemsShift: number; // 예상과 다른 영향 범위
  recoveryPattern: 'false_positive' | 'double_dip' | 'plateau' | 'oscillation';
  noiseInjection: number; // 0-1, 노이즈 레벨
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
   * 🎲 새로운 랜덤 시나리오 세션 생성 (24시간 연결 패턴)
   */
  private generateNewSession(): ScenarioSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 🧩 24시간 사전 패턴 선택
    const preScenarioPattern = this.selectRandom(PRE_SCENARIO_PATTERNS);

    // 🎯 사전 패턴에 기반한 메인 장애 선택 (AI 혼란 요소)
    const possibleFailures = PATTERN_TO_FAILURE_MAP[preScenarioPattern];
    const mainFailure = this.selectRandom(possibleFailures);

    const intensity = this.generateRandomIntensity();
    const cascadeFailures = this.selectRandomCascadeFailures(mainFailure);
    const recoveryType = this.selectRandom(RECOVERY_TYPES);
    const timeline = this.generateRandomTimeline();
    const infrastructure = this.selectRandomInfrastructure();
    const metricsVariation = this.generateMetricsVariation();

    // 🎭 AI 혼란 패턴 생성
    const unpredictablePattern = this.generateUnpredictablePattern();

    // 🔗 24시간 사전 데이터 연결 정보
    const preDataConnection =
      this.generatePreDataConnection(preScenarioPattern);

    return {
      sessionId,
      preScenarioPattern,
      mainFailure,
      intensity,
      cascadeFailures,
      recoveryType,
      timeline,
      unpredictablePattern,
      affectedInfrastructure: infrastructure,
      metricsVariation,
      preDataConnection,
    };
  }

  /**
   * 🎯 배열에서 랜덤 선택
   */
  private selectRandom<T>(array: readonly T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * 🎭 AI 혼란 패턴 생성 (예측 불가능성 증대)
   */
  private generateUnpredictablePattern(): UnpredictablePattern {
    const recoveryPatterns: UnpredictablePattern['recoveryPattern'][] = [
      'false_positive',
      'double_dip',
      'plateau',
      'oscillation',
    ];

    return {
      triggerDelay: 0.5 + Math.random() * 2, // 0.5-2.5배 지연
      intensityVariation: 0.7 + Math.random() * 0.6, // 0.7-1.3배 강도 변화
      affectedSystemsShift: Math.random() * 0.4, // 0-40% 영향 범위 변화
      recoveryPattern: this.selectRandom(recoveryPatterns),
      noiseInjection: Math.random() * 0.3, // 0-30% 노이즈
    };
  }

  /**
   * 🔗 24시간 사전 데이터 연결 정보 생성
   */
  private generatePreDataConnection(pattern: PreScenarioPattern): {
    trendStart: number;
    warningSignals: number;
    patternConsistency: number;
  } {
    const patternIntensity = {
      gradual_degradation: 0.8,
      periodic_spikes: 0.6,
      cascading_warnings: 0.9,
      resource_exhaustion: 0.85,
      intermittent_failures: 0.4,
      thermal_buildup: 0.7,
      network_congestion: 0.75,
      security_probes: 0.5,
    };

    return {
      trendStart: patternIntensity[pattern] + Math.random() * 0.2 - 0.1,
      warningSignals: Math.floor(3 + Math.random() * 8), // 3-10개 경고
      patternConsistency: 0.6 + Math.random() * 0.3, // 60-90% 일관성
    };
  }

  /**
   * 💪 랜덤 장애 강도 생성 - 🎭 시연용 고도화
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

    // 🎭 시연용으로 더 강력하고 지속적인 장애 시나리오 생성
    return {
      severity: this.selectRandom(severities),
      duration: 15 + Math.random() * 45, // 🔥 15-60분 (기존: 5-30분)
      affectedServers: 3 + Math.floor(Math.random() * 12), // 🔥 3-15대 (기존: 1-8대)
      recoverySpeed: this.selectRandom(recoveryModes),
      cascadeDelay: 3 + Math.random() * 7, // 🔥 3-10분 (기존: 2-7분)
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
   * ⏰ 30분 연속 장애 타임라인 생성 - 🎭 실시간 데이터 전용
   */
  private generateRandomTimeline(): ScenarioTimeline {
    // 🔥 30분 실시간 데이터 기간 동안 계속 장애 유지
    return {
      normalPeriod: 0, // 🔥 정상 기간 없음 - 즉시 장애 시작
      failureStart: 0, // 🔥 시작 즉시 장애 발생
      cascadeDelay: 3 + Math.random() * 5, // 🔥 3-8분 연쇄 장애
      peakCrisis: 8 + Math.random() * 12, // 🔥 8-20분 최고 위기
      recoveryStart: 25, // 🔥 25분부터 약간의 회복 조짐 (하지만 완전 복구 안됨)
      stabilization: 35, // 🔥 30분 넘어서 안정화 (실제로는 도달 안함)
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

    console.log('🎭 24시간 연결 시나리오 세션 (30분 연속 장애):');
    console.log(
      `   🧩 사전 패턴: ${this.getPrePatternDescription(this.currentSession.preScenarioPattern)}`
    );
    console.log(
      `   🎯 주요 장애: ${this.getFailureDescription(mainFailure)} (${intensity.severity})`
    );
    console.log(
      `   🔗 연쇄 장애: ${cascadeFailures.map(f => this.getFailureDescription(f)).join(', ')}`
    );
    console.log(
      `   🏥 복구 방식: ${this.getRecoveryDescription(recoveryType)}`
    );
    console.log(`   📊 영향 서버: ${intensity.affectedServers}대 (30분 지속)`);
    console.log(
      `   ⏱️ 지속 시간: ${intensity.duration.toFixed(1)}분 (연속 장애)`
    );
    console.log(
      `   📈 사전 트렌드: ${this.currentSession.preDataConnection.trendStart.toFixed(2)} (24시간 누적)`
    );
    console.log('   🔥 30분 연속 장애 타임라인:');
    console.log(`     0분: 즉시 장애 시작 (사전 징후 실현)`);
    console.log(`     ${timeline.cascadeDelay.toFixed(1)}분: 연쇄 장애 확산`);
    console.log(`     ${timeline.peakCrisis.toFixed(1)}분: 최고 위기 상황`);
    console.log(
      `     ${timeline.recoveryStart.toFixed(1)}분: 약간의 회복 조짐 (불완전)`
    );
    console.log(`     30분: 자동 종료 (장애 지속 상태)`);
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
      ssl_certificate_expiry: 'SSL 인증서 만료',
      dns_resolution_failure: 'DNS 해석 실패',
      load_balancer_failure: '로드밸런서 장애',
      storage_corruption: '스토리지 손상',
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
   * 🧩 사전 패턴 설명 반환
   */
  private getPrePatternDescription(pattern: PreScenarioPattern): string {
    const descriptions: Record<PreScenarioPattern, string> = {
      gradual_degradation: '점진적 성능 저하 (24시간 누적)',
      periodic_spikes: '주기적 부하 증가 (3-6시간 간격)',
      cascading_warnings: '연쇄 경고 (12시간 전조)',
      resource_exhaustion: '리소스 고갈 (18시간 점진)',
      intermittent_failures: '간헐적 장애 (6-12시간 무작위)',
      thermal_buildup: '열적 누적 (10시간 온도 상승)',
      network_congestion: '네트워크 혼잡 (8시간 점진)',
      security_probes: '보안 탐지 (24시간 분산 공격)',
    };
    return descriptions[pattern];
  }

  /**
   * ⏰ 현재 시나리오 단계 확인 - 🔥 30분 연속 장애 모드
   */
  getCurrentScenario() {
    if (!this.isActive) return null;

    const elapsedMinutes = (Date.now() - this.startTime) / (1000 * 60);
    const cycleMinutes = elapsedMinutes % 30; // 🔥 30분 사이클 고정

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

    const changes: PhaseChanges = {
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
   * 🎯 단계별 강도 계수 계산 - 🎭 시연용 고도화
   */
  private calculatePhaseIntensity(phase: string, cycleMinutes: number): number {
    switch (phase) {
      case 'normal_baseline':
        return 0.2; // 🔥 더 낮은 기준선
      case 'failure_start':
        return 0.6 + Math.random() * 0.3; // 🔥 더 강한 시작 강도
      case 'cascade_failure':
        return 0.8 + Math.random() * 0.2; // 🔥 더 심각한 연쇄 장애
      case 'critical_state':
        return 0.95 + Math.random() * 0.05; // 🔥 거의 최대 강도
      case 'auto_recovery':
        return 0.7 - Math.random() * 0.4; // 🔥 더 느린 복구
      case 'stabilization':
        return 0.3 + Math.random() * 0.2; // 🔥 더 안정적인 복구
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
      case 'cpu': {
        const cpuBase =
          metricsVariation.cpuRange[0] +
          (metricsVariation.cpuRange[1] - metricsVariation.cpuRange[0]) *
            intensity;
        return Math.round(cpuBase + (Math.random() - 0.5) * 10);
      }

      case 'memory': {
        const memBase =
          metricsVariation.memoryRange[0] +
          (metricsVariation.memoryRange[1] - metricsVariation.memoryRange[0]) *
            intensity;
        return Math.round(memBase + (Math.random() - 0.5) * 8);
      }

      case 'response_time': {
        const rtBase =
          metricsVariation.responseTimeRange[0] +
          (metricsVariation.responseTimeRange[1] -
            metricsVariation.responseTimeRange[0]) *
            intensity;
        return Math.round(rtBase + (Math.random() - 0.5) * 50);
      }

      case 'network': {
        const netIncrease = Math.round((10 + Math.random() * 90) * intensity);
        return `+${netIncrease}`;
      }

      default:
        return Math.round(30 + Math.random() * 40);
    }
  }

  /**
   * 🚨 랜덤 서버 상태 생성
   */
  private generateRandomStatus(intensity: number): ServerStatus {
    if (intensity < 0.4) return 'healthy';
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
      Math.floor((Date.now() - this.startTime) / (1000 * 60)) % 30; // 🔥 30분 사이클 고정

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
      totalDuration: 30, // 🔥 30분 전체 사이클
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
    metrics: MetricChanges
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
    if (metrics.responseTime !== undefined) {
      server.responseTime = this.calculateNewValue(
        server.responseTime,
        metrics.responseTime
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
    else server.status = 'healthy';
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
