/**
 * 🚨 장애 시나리오 엔진
 * 
 * 5개 장애 시나리오를 구현하고 실행하는 핵심 엔진
 * TDD Green 단계: 테스트를 통과하는 최소한의 구현
 */

import { 
  FailureScenario, 
  FixedServerTemplate, 
  ServerMetrics, 
  ScenarioConfig,
  ActiveScenario,
  ScenarioTransformation 
} from '../types/fixed-data-system';

// ==============================================
// 📊 시나리오 설정 데이터
// ==============================================

export const SCENARIO_CONFIGS: Record<FailureScenario, ScenarioConfig> = {
  cpu_overload: {
    id: 'cpu_overload',
    name: 'CPU 과부하',
    description: 'CPU 사용률이 80-95%까지 증가하는 시나리오',
    duration: 15, // 15분
    severity: 'high',
    affectedMetrics: ['cpu', 'response_time'],
    triggerConditions: {
      timeRange: '09:00-17:00',
      probability: 0.3,
      prerequisites: []
    }
  },
  memory_leak: {
    id: 'memory_leak',
    name: '메모리 누수',
    description: '메모리 사용률이 지속적으로 증가하는 시나리오',
    duration: 30, // 30분
    severity: 'critical',
    affectedMetrics: ['memory', 'response_time'],
    triggerConditions: {
      timeRange: '10:00-16:00',
      probability: 0.2,
      prerequisites: []
    }
  },
  storage_full: {
    id: 'storage_full',
    name: '디스크 용량 부족',
    description: '디스크 사용률이 90% 이상으로 증가하는 시나리오',
    duration: 45, // 45분
    severity: 'medium',
    affectedMetrics: ['disk', 'response_time'],
    triggerConditions: {
      timeRange: '00:00-23:59',
      probability: 0.15,
      prerequisites: []
    }
  },
  network_issue: {
    id: 'network_issue',
    name: '네트워크 문제',
    description: '네트워크 지연 시간 증가 및 처리량 감소',
    duration: 20, // 20분
    severity: 'high',
    affectedMetrics: ['network', 'response_time'],
    triggerConditions: {
      timeRange: '08:00-18:00',
      probability: 0.25,
      prerequisites: []
    }
  },
  database_slow: {
    id: 'database_slow',
    name: '데이터베이스 지연',
    description: '데이터베이스 응답 시간 증가 및 에러율 상승',
    duration: 60, // 60분
    severity: 'critical',
    affectedMetrics: ['response_time', 'error_rate'],
    triggerConditions: {
      timeRange: '09:00-17:00',
      probability: 0.1,
      prerequisites: []
    }
  }
};

// ==============================================
// 🏗️ 장애 시나리오 엔진 클래스
// ==============================================

export class FailureScenarioEngine {
  private servers: Map<string, FixedServerTemplate>;
  private activeScenarios: Map<string, ActiveScenario[]>;
  private scenarioHistory: Map<string, ScenarioTransformation[]>;
  private startTime: Date;

  constructor(serverTemplates: FixedServerTemplate[]) {
    this.servers = new Map();
    this.activeScenarios = new Map();
    this.scenarioHistory = new Map();
    this.startTime = new Date();
    
    // 서버 템플릿 저장
    serverTemplates.forEach(template => {
      this.servers.set(template.id, template);
      this.activeScenarios.set(template.id, []);
      this.scenarioHistory.set(template.id, []);
    });
  }

  /**
   * 🎯 시나리오 적용 (테스트 통과용 최소 구현)
   */
  async applyScenario(
    serverId: string,
    scenario: FailureScenario,
    baseMetrics: ServerMetrics
  ): Promise<ServerMetrics> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`서버 ${serverId}를 찾을 수 없습니다.`);
    }

    const failurePattern = server.failurePatterns[scenario];
    if (!failurePattern.enabled) {
      return baseMetrics;
    }

    // 시나리오 효과 적용
    const transformedMetrics = { ...baseMetrics };
    
    switch (scenario) {
      case 'cpu_overload':
        transformedMetrics.cpu = Math.min(95, Math.max(80, 
          (failurePattern.metrics.cpu || 90) + Math.random() * 5
        ));
        transformedMetrics.response_time = baseMetrics.response_time * 1.5;
        break;
        
      case 'memory_leak':
        transformedMetrics.memory = Math.min(95, Math.max(80, 
          (failurePattern.metrics.memory || 90) + Math.random() * 5
        ));
        transformedMetrics.response_time = baseMetrics.response_time * 1.3;
        break;
        
      case 'storage_full':
        transformedMetrics.disk = Math.min(95, Math.max(90, 
          (failurePattern.metrics.disk || 92) + Math.random() * 3
        ));
        transformedMetrics.response_time = baseMetrics.response_time * 1.2;
        break;
        
      case 'network_issue':
        if (failurePattern.metrics.network) {
          transformedMetrics.network = {
            ...transformedMetrics.network,
            latency: failurePattern.metrics.network.latency || 2000,
            throughput: failurePattern.metrics.network.throughput || 50
          };
        }
        transformedMetrics.response_time = failurePattern.metrics.response_time || 5000;
        break;
        
      case 'database_slow':
        transformedMetrics.response_time = failurePattern.metrics.response_time || 8000;
        transformedMetrics.error_rate = failurePattern.metrics.error_rate || 15;
        break;
    }

    return transformedMetrics;
  }

  /**
   * 🔄 진행률에 따른 시나리오 적용
   */
  async applyScenarioWithProgress(
    serverId: string,
    scenario: FailureScenario,
    baseMetrics: ServerMetrics,
    progress: number // 0-1
  ): Promise<ServerMetrics> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`서버 ${serverId}를 찾을 수 없습니다.`);
    }

    const failurePattern = server.failurePatterns[scenario];
    const curve = failurePattern.progressionCurve;
    
    // 진행률에 따른 강도 계산
    let intensity = progress;
    
    switch (curve) {
      case 'exponential':
        intensity = Math.pow(progress, 2); // 나중에 급격히 증가
        break;
      case 'linear':
        intensity = progress; // 일정한 증가
        break;
      case 'step':
        intensity = progress < 0.5 ? 0.3 : 0.9; // 단계적 증가
        break;
      case 'random':
        intensity = Math.random() * progress; // 무작위 변동
        break;
    }

    // 기본 시나리오 적용 후 강도 조정
    const scenarioMetrics = await this.applyScenario(serverId, scenario, baseMetrics);
    
    // 강도에 따라 베이스라인과 시나리오 메트릭 사이를 보간
    const interpolatedMetrics: ServerMetrics = {
      cpu: this.interpolate(baseMetrics.cpu, scenarioMetrics.cpu, intensity),
      memory: this.interpolate(baseMetrics.memory, scenarioMetrics.memory, intensity),
      disk: this.interpolate(baseMetrics.disk, scenarioMetrics.disk, intensity),
      network: {
        latency: this.interpolate(baseMetrics.network.latency, scenarioMetrics.network.latency, intensity),
        throughput: this.interpolate(baseMetrics.network.throughput, scenarioMetrics.network.throughput, intensity),
        in: baseMetrics.network.in,
        out: baseMetrics.network.out
      },
      response_time: this.interpolate(baseMetrics.response_time, scenarioMetrics.response_time, intensity),
      request_count: baseMetrics.request_count,
      error_rate: this.interpolate(baseMetrics.error_rate, scenarioMetrics.error_rate, intensity),
      uptime: baseMetrics.uptime
    };

    return interpolatedMetrics;
  }

  /**
   * 🎭 시나리오 트리거
   */
  async triggerScenario(serverId: string, scenario: FailureScenario): Promise<void> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`서버 ${serverId}를 찾을 수 없습니다.`);
    }

    const config = SCENARIO_CONFIGS[scenario];
    const activeScenario: ActiveScenario = {
      scenario,
      serverId,
      startTime: new Date(),
      endTime: new Date(Date.now() + config.duration * 60 * 1000),
      intensity: 1.0,
      isRecovering: false
    };

    const scenarios = this.activeScenarios.get(serverId) || [];
    scenarios.push(activeScenario);
    this.activeScenarios.set(serverId, scenarios);
  }

  /**
   * 🔗 연쇄 장애 시뮬레이션
   */
  async getCascadeFailures(): Promise<Map<string, FailureScenario[]>> {
    const cascadeMap = new Map<string, FailureScenario[]>();
    
    // 모든 활성 시나리오 확인
    for (const [serverId, scenarios] of this.activeScenarios) {
      const server = this.servers.get(serverId);
      if (!server) continue;

      for (const scenario of scenarios) {
        // 의존성 서버들에게 연쇄 장애 전파
        for (const dependentServerId of this.getDependentServers(serverId)) {
          const dependentServer = this.servers.get(dependentServerId);
          if (!dependentServer) continue;

          const failurePattern = server.failurePatterns[scenario.scenario];
          const cascadeRisk = failurePattern.cascadeRisk;
          
          // 연쇄 장애 확률 계산
          if (Math.random() < cascadeRisk) {
            const cascadeFailures = cascadeMap.get(dependentServerId) || [];
            cascadeFailures.push(scenario.scenario);
            cascadeMap.set(dependentServerId, cascadeFailures);
          }
        }
      }
    }

    return cascadeMap;
  }

  /**
   * ⏰ 시간 경과 시뮬레이션
   */
  async simulateTimeElapse(milliseconds: number): Promise<void> {
    const currentTime = new Date();
    const elapsedTime = new Date(currentTime.getTime() + milliseconds);
    
    // 모든 활성 시나리오 업데이트
    for (const [serverId, scenarios] of this.activeScenarios) {
      const updatedScenarios = scenarios.filter(scenario => {
        // 시나리오 종료 확인
        if (elapsedTime > scenario.endTime) {
          return false; // 제거
        }
        
        // 복구 단계 확인
        const config = SCENARIO_CONFIGS[scenario.scenario];
        const server = this.servers.get(serverId);
        if (server) {
          const recoveryTime = server.failurePatterns[scenario.scenario].recoveryTime;
          const recoveryStart = new Date(scenario.endTime.getTime() - recoveryTime * 60 * 1000);
          
          if (elapsedTime > recoveryStart) {
            scenario.isRecovering = true;
            // 복구 중 강도 감소
            const recoveryProgress = (elapsedTime.getTime() - recoveryStart.getTime()) / (recoveryTime * 60 * 1000);
            scenario.intensity = Math.max(0, 1 - recoveryProgress);
          }
        }
        
        return true; // 유지
      });
      
      this.activeScenarios.set(serverId, updatedScenarios);
    }
  }

  /**
   * 📊 서버 메트릭 조회
   */
  async getServerMetrics(serverId: string): Promise<ServerMetrics> {
    const server = this.servers.get(serverId);
    if (!server) {
      throw new Error(`서버 ${serverId}를 찾을 수 없습니다.`);
    }

    // 베이스라인 메트릭 생성
    const baseMetrics: ServerMetrics = {
      cpu: server.baselineMetrics.cpu.normal,
      memory: server.baselineMetrics.memory.normal,
      disk: server.baselineMetrics.disk.normal,
      network: {
        latency: server.baselineMetrics.network.latency.normal,
        throughput: server.baselineMetrics.network.throughput.normal,
        in: 100,
        out: 150
      },
      response_time: server.baselineMetrics.response_time.normal,
      request_count: 1000,
      error_rate: 0.5,
      uptime: 86400
    };

    // 활성 시나리오 효과 적용
    const scenarios = this.activeScenarios.get(serverId) || [];
    let currentMetrics = baseMetrics;
    
    for (const scenario of scenarios) {
      if (scenario.isRecovering) {
        // 복구 중인 경우 강도 감소
        currentMetrics = await this.applyScenarioWithProgress(
          serverId, 
          scenario.scenario, 
          currentMetrics, 
          scenario.intensity
        );
      } else {
        // 정상 시나리오 적용
        currentMetrics = await this.applyScenario(
          serverId, 
          scenario.scenario, 
          currentMetrics
        );
      }
    }

    return currentMetrics;
  }

  // ==============================================
  // 🛠️ 유틸리티 메서드
  // ==============================================

  /**
   * 선형 보간 함수
   */
  private interpolate(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }

  /**
   * 의존성 서버 목록 조회
   */
  private getDependentServers(serverId: string): string[] {
    const dependentServers: string[] = [];
    
    for (const [id, server] of this.servers) {
      if (server.dependencies.includes(serverId)) {
        dependentServers.push(id);
      }
    }
    
    return dependentServers;
  }

  /**
   * 현재 시간이 업무시간인지 확인
   */
  private isBusinessHours(date: Date): boolean {
    const hour = date.getHours();
    return hour >= 9 && hour <= 17;
  }

  /**
   * 시나리오 확률 계산
   */
  private calculateScenarioProbability(scenario: FailureScenario, timestamp: Date): number {
    const config = SCENARIO_CONFIGS[scenario];
    let probability = config.triggerConditions.probability;
    
    // 시간대별 가중치 적용
    if (this.isBusinessHours(timestamp)) {
      probability *= 1.5; // 업무시간 가중치
    }
    
    // 주말 가중치
    const dayOfWeek = timestamp.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      probability *= 0.5; // 주말 감소
    }
    
    return Math.min(1, probability);
  }

  /**
   * 디버깅을 위한 상태 출력
   */
  getDebugInfo(): any {
    return {
      servers: Array.from(this.servers.keys()),
      activeScenarios: Object.fromEntries(this.activeScenarios),
      scenarioConfigs: SCENARIO_CONFIGS
    };
  }
}