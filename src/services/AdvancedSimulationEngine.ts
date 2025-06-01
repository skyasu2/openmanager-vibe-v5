/**
 * 🚀 고도화된 서버 시뮬레이션 엔진 v3.0
 * 
 * ✨ 새로운 기능들:
 * - 서버 유형별 특성 기반 메트릭 생성
 * - 현실적 장애 시나리오 & 전이 모델
 * - 인과관계 기반 장애 전파
 * - 점진적 상태 변화 (normal → warning → critical)
 * - 복구 흐름 포함
 * - Redis/Supabase 저장 최적화
 */

import { 
  ServerMetrics, 
  ServerAlert, 
  ServerRole, 
  ServerStatus, 
  ServerEnvironment,
  SERVER_TYPE_DEFINITIONS,
  ServerTypeDefinition,
  RealisticFailureScenario,
  FAILURE_IMPACT_GRAPH
} from '../types/server';
import { simulationEngine } from './simulationEngine';
import { cacheService } from './cacheService';
import { redisTimeSeriesService } from './redisTimeSeriesService';

/**
 * 🎭 고도화된 서버 메트릭 (기본 + 확장)
 */
export interface AdvancedServerMetrics extends ServerMetrics {
  // 서버 유형 정보
  serverType: ServerTypeDefinition;
  
  // 실시간 상태 정보
  health_score: number; // 0-100 건강도 점수
  predicted_status: ServerStatus; // AI 예측 상태
  
  // 연관성 메트릭
  cascade_risk: number; // 0-100 장애 전이 위험도
  dependency_health: number; // 0-100 의존성 서버들의 평균 건강도
  
  // 장애 시나리오 정보
  active_scenarios: string[]; // 현재 활성화된 장애 시나리오 ID들
  recovery_progress: number; // 0-100 복구 진행률 (장애 상태일 때)
  
  // 확장된 메트릭
  connection_pool_usage?: number; // DB/API 서버용
  cache_hit_ratio?: number; // 캐시 서버용
  pod_count?: number; // K8s 서버용
  ssl_cert_days_remaining?: number; // 웹/로드밸런서용
}

/**
 * 🌊 현실적 장애 시나리오 정의
 */
const REALISTIC_FAILURE_SCENARIOS: RealisticFailureScenario[] = [
  {
    id: 'db_connection_spike',
    name: 'DB 연결 과부하',
    description: 'API 서버 과부하로 인한 데이터베이스 동시 연결 급증',
    triggerCondition: {
      serverType: 'api',
      metric: 'cpu_usage',
      threshold: 85,
      operator: '>='
    },
    cascadeEffect: [
      {
        targetServerType: 'database',
        delayMs: 15000, // 15초 후 영향
        impact: {
          metric: 'cpu_usage',
          multiplier: 1.4 // 40% 증가
        },
        alertMessage: 'DB 연결 풀 과부하 - API 서버 고부하로 인한 연결 급증',
        severity: 'warning'
      },
      {
        targetServerType: 'database',
        delayMs: 30000, // 30초 후 메모리도 영향
        impact: {
          metric: 'memory_usage',
          multiplier: 1.3 // 30% 증가
        },
        alertMessage: 'DB 메모리 사용률 급증 - 슬로우 쿼리 발생 가능성',
        severity: 'critical'
      }
    ],
    recoveryTimeMs: 180000, // 3분 복구 시간
    probability: 25
  },
  {
    id: 'disk_full_cascade',
    name: '디스크 포화 연쇄 장애',
    description: 'Storage 서버 디스크 포화로 인한 연쇄 영향',
    triggerCondition: {
      serverType: 'storage',
      metric: 'disk_usage',
      threshold: 95,
      operator: '>='
    },
    cascadeEffect: [
      {
        targetServerType: 'database',
        delayMs: 20000,
        impact: {
          metric: 'response_time',
          multiplier: 2.5 // 응답시간 2.5배 증가
        },
        alertMessage: '데이터베이스 쓰기 지연 - 스토리지 디스크 부족',
        severity: 'critical'
      },
      {
        targetServerType: 'backup',
        delayMs: 45000,
        impact: {
          metric: 'disk_usage',
          multiplier: 1.2
        },
        alertMessage: '백업 서버 디스크 사용률 증가 - 백업 실패 위험',
        severity: 'warning'
      }
    ],
    recoveryTimeMs: 300000, // 5분 복구 시간
    probability: 20
  },
  {
    id: 'k8s_node_not_ready',
    name: 'K8s 노드 준비 해제',
    description: 'Worker 노드 리소스 부족으로 인한 클러스터 영향',
    triggerCondition: {
      serverType: 'k8s-worker',
      metric: 'memory_usage',
      threshold: 90,
      operator: '>='
    },
    cascadeEffect: [
      {
        targetServerType: 'k8s-control',
        delayMs: 10000,
        impact: {
          metric: 'cpu_usage',
          multiplier: 1.3
        },
        alertMessage: 'K8s 컨트롤 플레인 부하 증가 - 파드 재스케줄링',
        severity: 'warning'
      },
      {
        targetServerType: 'api',
        delayMs: 25000,
        impact: {
          metric: 'response_time',
          multiplier: 1.8
        },
        alertMessage: 'API 응답 지연 - K8s 파드 재배치로 인한 서비스 불안정',
        severity: 'warning'
      }
    ],
    recoveryTimeMs: 120000, // 2분 복구 시간
    probability: 30
  },
  {
    id: 'web_service_degradation',
    name: '웹 서비스 성능 저하',
    description: '프론트엔드 서버 고부하로 인한 사용자 경험 저하',
    triggerCondition: {
      serverType: 'web',
      metric: 'cpu_usage',
      threshold: 80,
      operator: '>='
    },
    cascadeEffect: [
      {
        targetServerType: 'api',
        delayMs: 12000,
        impact: {
          metric: 'network_in',
          multiplier: 1.6
        },
        alertMessage: 'API 서버 요청 급증 - 웹 서버 부하 전이',
        severity: 'warning'
      },
      {
        targetServerType: 'cache',
        delayMs: 18000,
        impact: {
          metric: 'memory_usage',
          multiplier: 1.4
        },
        alertMessage: '캐시 서버 부하 증가 - 캐시 미스율 상승',
        severity: 'warning'
      }
    ],
    recoveryTimeMs: 90000, // 1.5분 복구 시간
    probability: 35
  },
  {
    id: 'control_plane_failure',
    name: '컨트롤 플레인 장애',
    description: 'etcd 쓰기 실패 및 메모리 고갈로 인한 클러스터 제어 불가',
    triggerCondition: {
      serverType: 'k8s-control',
      metric: 'memory_usage',
      threshold: 88,
      operator: '>='
    },
    cascadeEffect: [
      {
        targetServerType: 'k8s-worker',
        delayMs: 8000,
        impact: {
          metric: 'cpu_usage',
          multiplier: 1.5
        },
        alertMessage: 'Worker 노드 불안정 - 컨트롤 플레인 통신 장애',
        severity: 'critical'
      },
      {
        targetServerType: 'api',
        delayMs: 15000,
        impact: {
          metric: 'response_time',
          multiplier: 3.0
        },
        alertMessage: 'API 서비스 중단 위험 - K8s 클러스터 제어 불가',
        severity: 'critical'
      }
    ],
    recoveryTimeMs: 240000, // 4분 복구 시간
    probability: 15
  }
];

/**
 * 🎮 고도화된 시뮬레이션 엔진
 */
export class AdvancedSimulationEngine {
  private servers: AdvancedServerMetrics[] = [];
  private activeScenarios: Map<string, { startTime: number; scenario: RealisticFailureScenario }> = new Map();
  private simulationRunning: boolean = false;
  private updateInterval: NodeJS.Timeout | null = null;
  private readonly UPDATE_FREQUENCY_MS = 30000; // 30초마다 업데이트

  constructor() {
    this.initializeServers();
    console.log('🚀 고도화된 시뮬레이션 엔진 초기화 완료');
  }

  /**
   * 🏭 서버 초기화 (기존 시뮬레이션 엔진 기반)
   */
  private initializeServers(): void {
    // 기존 시뮬레이션 엔진에서 서버 가져오기
    const baseServers = simulationEngine.getServers();
    
    this.servers = baseServers.map(server => this.enhanceServerMetrics(server));
    
    console.log(`✅ ${this.servers.length}개 서버 고도화 완료`);
  }

  /**
   * 🎯 서버 메트릭 고도화 (유형별 특성 적용)
   */
  private enhanceServerMetrics(baseServer: any): AdvancedServerMetrics {
    const serverTypeDef = SERVER_TYPE_DEFINITIONS[baseServer.role as ServerRole] || SERVER_TYPE_DEFINITIONS.web;
    
    // 서버 유형 특성 기반 메트릭 조정
    const enhanced: AdvancedServerMetrics = {
      ...baseServer,
      serverType: serverTypeDef,
      
      // 건강도 점수 계산 (CPU, 메모리, 디스크 가중 평균)
      health_score: this.calculateHealthScore(baseServer, serverTypeDef),
      
      // AI 예측 상태 (현재는 기존 상태 기반)
      predicted_status: this.predictStatus(baseServer, serverTypeDef),
      
      // 장애 전이 위험도
      cascade_risk: this.calculateCascadeRisk(baseServer.role),
      
      // 의존성 건강도 (나중에 계산)
      dependency_health: 85,
      
      // 초기 상태
      active_scenarios: [],
      recovery_progress: 0,
      
      // 서버 유형별 추가 메트릭
      ...this.generateTypeSpecificMetrics(baseServer.role)
    };

    // 서버 유형 특성 가중치 적용
    enhanced.cpu_usage = Math.min(100, enhanced.cpu_usage * serverTypeDef.characteristics.cpuWeight);
    enhanced.memory_usage = Math.min(100, enhanced.memory_usage * serverTypeDef.characteristics.memoryWeight);
    enhanced.disk_usage = Math.min(100, enhanced.disk_usage * serverTypeDef.characteristics.diskWeight);
    enhanced.response_time = Math.max(10, serverTypeDef.characteristics.responseTimeBase + (enhanced.response_time - 100));

    return enhanced;
  }

  /**
   * 💊 건강도 점수 계산
   */
  private calculateHealthScore(server: any, typeDef: ServerTypeDefinition): number {
    const weights = typeDef.characteristics;
    
    // 가중 평균으로 건강도 계산 (낮은 사용률일수록 높은 점수)
    const cpuHealth = (100 - server.cpu_usage) * weights.cpuWeight;
    const memoryHealth = (100 - server.memory_usage) * weights.memoryWeight;
    const diskHealth = (100 - server.disk_usage) * weights.diskWeight;
    const responseHealth = Math.max(0, 100 - (server.response_time / 10)) * 0.5;
    
    const totalWeight = weights.cpuWeight + weights.memoryWeight + weights.diskWeight + 0.5;
    const score = (cpuHealth + memoryHealth + diskHealth + responseHealth) / totalWeight;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * 🔮 상태 예측
   */
  private predictStatus(server: any, typeDef: ServerTypeDefinition): ServerStatus {
    const health = this.calculateHealthScore(server, typeDef);
    const stability = typeDef.characteristics.stabilityFactor;
    
    // 안정성 계수를 고려한 예측
    const adjustedHealth = health * stability;
    
    if (adjustedHealth < 30) return 'critical';
    if (adjustedHealth < 60) return 'warning';
    return 'healthy';
  }

  /**
   * ⚡ 장애 전이 위험도 계산
   */
  private calculateCascadeRisk(serverRole: ServerRole): number {
    const impactTargets = FAILURE_IMPACT_GRAPH[serverRole] || [];
    
    // 의존성이 많을수록 위험도 높음
    const dependencyRisk = impactTargets.length * 15;
    
    // 서버 유형별 기본 위험도
    const baseRisk = {
      'database': 40, // DB는 중요도 높음
      'k8s-control': 45, // 컨트롤 플레인도 중요
      'storage': 35,
      'api': 30,
      'web': 25,
      'cache': 20,
      'k8s-worker': 25,
      'load-balancer': 30,
      'backup': 15
    }[serverRole] || 20;
    
    return Math.min(100, baseRisk + dependencyRisk);
  }

  /**
   * 🎨 서버 유형별 추가 메트릭 생성
   */
  private generateTypeSpecificMetrics(role: ServerRole): Partial<AdvancedServerMetrics> {
    const extras: Partial<AdvancedServerMetrics> = {};
    
    switch (role) {
      case 'database':
      case 'api':
        extras.connection_pool_usage = Math.round(Math.random() * 40 + 30); // 30-70%
        break;
        
      case 'cache':
        extras.cache_hit_ratio = Math.round(Math.random() * 25 + 70); // 70-95%
        break;
        
      case 'k8s-worker':
      case 'k8s-control':
        extras.pod_count = Math.round(Math.random() * 15 + 5); // 5-20개
        break;
        
      case 'web':
      case 'load-balancer':
        extras.ssl_cert_days_remaining = Math.round(Math.random() * 60 + 10); // 10-70일
        break;
    }
    
    return extras;
  }

  /**
   * 🌊 장애 시나리오 실행
   */
  private processFailureScenarios(): void {
    REALISTIC_FAILURE_SCENARIOS.forEach(scenario => {
      // 확률 기반 시나리오 발생 체크
      if (Math.random() * 100 < scenario.probability) {
        this.checkAndTriggerScenario(scenario);
      }
    });

    // 복구 처리
    this.processRecovery();
  }

  /**
   * 🎯 시나리오 트리거 체크 및 실행
   */
  private checkAndTriggerScenario(scenario: RealisticFailureScenario): void {
    // 이미 활성화된 시나리오는 무시
    if (this.activeScenarios.has(scenario.id)) return;

    // 트리거 조건 체크
    const triggerServers = this.servers.filter(server => 
      server.role === scenario.triggerCondition.serverType
    );

    for (const server of triggerServers) {
      const metricValue = server[scenario.triggerCondition.metric] as number;
      const threshold = scenario.triggerCondition.threshold;
      
      let conditionMet = false;
      switch (scenario.triggerCondition.operator) {
        case '>': conditionMet = metricValue > threshold; break;
        case '>=': conditionMet = metricValue >= threshold; break;
        case '<': conditionMet = metricValue < threshold; break;
        case '<=': conditionMet = metricValue <= threshold; break;
        case '=': conditionMet = metricValue === threshold; break;
      }

      if (conditionMet) {
        console.log(`🚨 장애 시나리오 발생: ${scenario.name} (트리거: ${server.id})`);
        this.triggerScenario(scenario, server);
        break;
      }
    }
  }

  /**
   * 🎬 시나리오 실행
   */
  private triggerScenario(scenario: RealisticFailureScenario, triggerServer: AdvancedServerMetrics): void {
    // 활성 시나리오 등록
    this.activeScenarios.set(scenario.id, {
      startTime: Date.now(),
      scenario
    });

    // 트리거 서버에 시나리오 마킹
    triggerServer.active_scenarios.push(scenario.id);

    // 연쇄 효과 처리 (지연시간 기반)
    scenario.cascadeEffect.forEach((effect, index) => {
      setTimeout(() => {
        this.applyCascadeEffect(effect, scenario.id);
      }, effect.delayMs);
    });
  }

  /**
   * 🌀 연쇄 효과 적용
   */
  private applyCascadeEffect(
    effect: RealisticFailureScenario['cascadeEffect'][0], 
    scenarioId: string
  ): void {
    const targetServers = this.servers.filter(server => server.role === effect.targetServerType);
    
    targetServers.forEach(server => {
      // 메트릭 영향 적용
      const currentValue = server[effect.impact.metric] as number;
      const newValue = Math.min(100, Math.max(0, currentValue * effect.impact.multiplier));
      
      (server as any)[effect.impact.metric] = Math.round(newValue);
      
      // 시나리오 추가
      if (!server.active_scenarios.includes(scenarioId)) {
        server.active_scenarios.push(scenarioId);
      }
      
      // 알림 생성
      const alert: ServerAlert = {
        id: `alert-${Date.now()}-${server.id}`,
        server_id: server.id,
        type: 'custom',
        message: effect.alertMessage,
        severity: effect.severity,
        timestamp: new Date().toISOString(),
        resolved: false,
        rootCause: scenarioId
      };
      
      if (!server.alerts) server.alerts = [];
      server.alerts.push(alert);
      
      console.log(`⚡ 연쇄 효과 적용: ${server.id} (${effect.impact.metric}: ${currentValue} → ${newValue})`);
    });
  }

  /**
   * 🏥 복구 처리
   */
  private processRecovery(): void {
    const now = Date.now();
    
    this.activeScenarios.forEach((data, scenarioId) => {
      const elapsed = now - data.startTime;
      const recoveryTime = data.scenario.recoveryTimeMs;
      
      if (elapsed >= recoveryTime) {
        console.log(`✅ 장애 시나리오 복구 완료: ${data.scenario.name}`);
        this.recoverFromScenario(scenarioId);
        this.activeScenarios.delete(scenarioId);
      } else {
        // 복구 진행률 업데이트
        const progress = Math.round((elapsed / recoveryTime) * 100);
        this.updateRecoveryProgress(scenarioId, progress);
      }
    });
  }

  /**
   * 🔧 시나리오 복구
   */
  private recoverFromScenario(scenarioId: string): void {
    this.servers.forEach(server => {
      if (server.active_scenarios.includes(scenarioId)) {
        // 시나리오 제거
        server.active_scenarios = server.active_scenarios.filter(id => id !== scenarioId);
        
        // 복구 진행률 리셋
        server.recovery_progress = 0;
        
        // 관련 알림 해결
        if (server.alerts) {
          server.alerts.forEach(alert => {
            if (alert.rootCause === scenarioId) {
              alert.resolved = true;
            }
          });
        }
        
        // 메트릭 정상화 (점진적)
        this.normalizeServerMetrics(server);
      }
    });
  }

  /**
   * 📈 복구 진행률 업데이트
   */
  private updateRecoveryProgress(scenarioId: string, progress: number): void {
    this.servers.forEach(server => {
      if (server.active_scenarios.includes(scenarioId)) {
        server.recovery_progress = progress;
      }
    });
  }

  /**
   * 🔄 서버 메트릭 정상화
   */
  private normalizeServerMetrics(server: AdvancedServerMetrics): void {
    const typeDef = server.serverType;
    
    // 점진적으로 정상 수치로 복귀
    const normalCpu = 20 + Math.random() * 30; // 20-50%
    const normalMemory = 25 + Math.random() * 35; // 25-60%
    const normalDisk = 30 + Math.random() * 40; // 30-70%
    const normalResponse = typeDef.characteristics.responseTimeBase + Math.random() * 50;
    
    // 20% 정도씩 정상치로 이동
    server.cpu_usage = Math.round(server.cpu_usage * 0.8 + normalCpu * 0.2);
    server.memory_usage = Math.round(server.memory_usage * 0.8 + normalMemory * 0.2);
    server.disk_usage = Math.round(server.disk_usage * 0.8 + normalDisk * 0.2);
    server.response_time = Math.round(server.response_time * 0.8 + normalResponse * 0.2);
    
    // 건강도 재계산
    server.health_score = this.calculateHealthScore(server, typeDef);
    server.predicted_status = this.predictStatus(server, typeDef);
  }

  /**
   * ▶️ 시뮬레이션 시작
   */
  public start(): void {
    if (this.simulationRunning) {
      console.log('⚠️ 고도화된 시뮬레이션이 이미 실행 중입니다');
      return;
    }

    this.simulationRunning = true;
    
    this.updateInterval = setInterval(() => {
      this.updateSimulation();
    }, this.UPDATE_FREQUENCY_MS);

    console.log(`🚀 고도화된 시뮬레이션 시작 (${this.servers.length}개 서버, ${this.UPDATE_FREQUENCY_MS/1000}초 간격)`);
  }

  /**
   * ⏸️ 시뮬레이션 정지
   */
  public stop(): void {
    if (!this.simulationRunning) {
      console.log('⚠️ 고도화된 시뮬레이션이 실행 중이 아닙니다');
      return;
    }

    this.simulationRunning = false;
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }

    console.log('🛑 고도화된 시뮬레이션 정지');
  }

  /**
   * 🔄 시뮬레이션 업데이트
   */
  private updateSimulation(): void {
    // 1. 장애 시나리오 처리
    this.processFailureScenarios();
    
    // 2. 일반적인 메트릭 변동
    this.updateNormalVariations();
    
    // 3. 의존성 건강도 업데이트
    this.updateDependencyHealth();
    
    // 4. 상태 동기화 (기존 시뮬레이션 엔진과)
    this.syncWithBaseEngine();
    
    // 5. 캐싱 및 저장
    this.saveMetrics();
    
    console.log(`🔄 고도화된 시뮬레이션 업데이트 (활성 시나리오: ${this.activeScenarios.size}개)`);
  }

  /**
   * 📊 일반적인 메트릭 변동
   */
  private updateNormalVariations(): void {
    this.servers.forEach(server => {
      // 활성 시나리오가 없는 서버만 자연스러운 변동
      if (server.active_scenarios.length === 0) {
        const variation = () => Math.random() * 6 - 3; // ±3% 변동
        
        server.cpu_usage = Math.max(5, Math.min(95, server.cpu_usage + variation()));
        server.memory_usage = Math.max(10, Math.min(90, server.memory_usage + variation()));
        server.disk_usage = Math.max(15, Math.min(95, server.disk_usage + variation() * 0.5)); // 디스크는 변동 적음
        
        // 건강도 재계산
        server.health_score = this.calculateHealthScore(server, server.serverType);
        server.predicted_status = this.predictStatus(server, server.serverType);
      }
    });
  }

  /**
   * 🔗 의존성 건강도 업데이트
   */
  private updateDependencyHealth(): void {
    this.servers.forEach(server => {
      const dependencies = server.serverType.dependencies;
      
      if (dependencies.length > 0) {
        const depServers = this.servers.filter(s => dependencies.includes(s.role));
        const avgHealth = depServers.reduce((sum, s) => sum + s.health_score, 0) / depServers.length;
        
        server.dependency_health = Math.round(avgHealth || 100);
      }
    });
  }

  /**
   * 🔄 기존 엔진과 동기화
   */
  private syncWithBaseEngine(): void {
    // 기존 시뮬레이션 엔진의 서버들 업데이트
    const baseServers = simulationEngine.getServers();
    
    baseServers.forEach((baseServer: any) => {
      const enhanced = this.servers.find(s => s.id === baseServer.id);
      if (enhanced) {
        // 핵심 메트릭만 동기화
        baseServer.cpu_usage = enhanced.cpu_usage;
        baseServer.memory_usage = enhanced.memory_usage;
        baseServer.disk_usage = enhanced.disk_usage;
        baseServer.response_time = enhanced.response_time;
        baseServer.alerts = enhanced.alerts;
        baseServer.status = enhanced.predicted_status;
      }
    });
  }

  /**
   * 💾 메트릭 저장
   */
  private async saveMetrics(): Promise<void> {
    try {
      // Redis 캐싱
      await cacheService.cacheServerMetrics(this.servers);
      
      // 시계열 데이터 저장
      await redisTimeSeriesService.storeMetrics(this.servers);
      
    } catch (error) {
      console.warn('⚠️ 고도화된 메트릭 저장 실패:', error);
    }
  }

  /**
   * 📊 상태 조회 메서드들
   */
  public getServers(): AdvancedServerMetrics[] {
    return [...this.servers];
  }

  public getServerById(id: string): AdvancedServerMetrics | undefined {
    return this.servers.find(server => server.id === id);
  }

  public getActiveScenarios(): string[] {
    return Array.from(this.activeScenarios.keys());
  }

  public getSummary() {
    return {
      totalServers: this.servers.length,
      healthyServers: this.servers.filter(s => s.predicted_status === 'healthy').length,
      warningServers: this.servers.filter(s => s.predicted_status === 'warning').length,
      criticalServers: this.servers.filter(s => s.predicted_status === 'critical').length,
      activeScenarios: this.activeScenarios.size,
      avgHealthScore: Math.round(this.servers.reduce((sum, s) => sum + s.health_score, 0) / this.servers.length),
      highRiskServers: this.servers.filter(s => s.cascade_risk > 60).length
    };
  }

  public isRunning(): boolean {
    return this.simulationRunning;
  }
}

// 싱글톤 인스턴스
export const advancedSimulationEngine = new AdvancedSimulationEngine(); 