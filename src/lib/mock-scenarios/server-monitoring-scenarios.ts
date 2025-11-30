/**
 * 🎭 복잡한 서버 모니터링 시나리오
 *
 * 실제 운영 환경에서 발생 가능한 다양한 상황 시뮬레이션
 */

export interface ServerScenario {
  id: string;
  name: string;
  description: string;
  duration: number; // 시나리오 지속 시간 (초)
  servers: ServerState[];
  events: ScenarioEvent[];
}

export interface ServerState {
  serverId: string;
  timeOffset: number; // 시나리오 시작 후 경과 시간
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    responseTime: number;
  };
  status: 'healthy' | 'warning' | 'critical' | 'offline';
  alerts?: string[];
}

export interface ScenarioEvent {
  timeOffset: number;
  type: 'alert' | 'recovery' | 'maintenance' | 'spike' | 'failure';
  serverId: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

/**
 * 시나리오 1: 캐스케이딩 장애 (Cascading Failure)
 * 하나의 서버 장애가 연쇄적으로 다른 서버에 영향
 */
export const CASCADING_FAILURE_SCENARIO: ServerScenario = {
  id: 'cascading-failure',
  name: '캐스케이딩 장애',
  description: 'DB 서버 장애로 인한 연쇄 장애 발생',
  duration: 300, // 5분
  servers: [
    // T+0: 정상 상태
    {
      serverId: 'db-prd-01',
      timeOffset: 0,
      metrics: { cpu: 35, memory: 45, disk: 60, network: 30, responseTime: 50 },
      status: 'healthy',
    },
    // T+30: DB 서버 부하 증가
    {
      serverId: 'db-prd-01',
      timeOffset: 30,
      metrics: {
        cpu: 85,
        memory: 78,
        disk: 60,
        network: 70,
        responseTime: 250,
      },
      status: 'warning',
      alerts: ['High CPU usage detected'],
    },
    // T+60: DB 서버 장애
    {
      serverId: 'db-prd-01',
      timeOffset: 60,
      metrics: {
        cpu: 98,
        memory: 95,
        disk: 60,
        network: 90,
        responseTime: 5000,
      },
      status: 'critical',
      alerts: ['Database connection timeout', 'Memory exhausted'],
    },
    // T+90: API 서버 영향
    {
      serverId: 'api-prd-01',
      timeOffset: 90,
      metrics: {
        cpu: 75,
        memory: 65,
        disk: 40,
        network: 85,
        responseTime: 3000,
      },
      status: 'warning',
      alerts: ['Database connection failed', 'Request queue growing'],
    },
    // T+120: 웹 서버 영향
    {
      serverId: 'web-prd-01',
      timeOffset: 120,
      metrics: {
        cpu: 80,
        memory: 70,
        disk: 30,
        network: 95,
        responseTime: 4000,
      },
      status: 'warning',
      alerts: ['API timeout errors', 'User experience degraded'],
    },
  ],
  events: [
    {
      timeOffset: 30,
      type: 'alert',
      serverId: 'db-prd-01',
      message: 'Database CPU 사용률 85% 초과',
      severity: 'warning',
    },
    {
      timeOffset: 60,
      type: 'failure',
      serverId: 'db-prd-01',
      message: '데이터베이스 연결 풀 고갈, 메모리 부족',
      severity: 'critical',
    },
    {
      timeOffset: 90,
      type: 'alert',
      serverId: 'api-prd-01',
      message: 'API 서버 DB 연결 실패, 요청 대기열 증가',
      severity: 'error',
    },
    {
      timeOffset: 120,
      type: 'alert',
      serverId: 'web-prd-01',
      message: '웹 서버 응답 시간 초과, 사용자 경험 저하',
      severity: 'error',
    },
    {
      timeOffset: 180,
      type: 'maintenance',
      serverId: 'db-prd-01',
      message: '긴급 데이터베이스 재시작 시작',
      severity: 'info',
    },
    {
      timeOffset: 240,
      type: 'recovery',
      serverId: 'db-prd-01',
      message: '데이터베이스 정상 복구 완료',
      severity: 'info',
    },
  ],
};

/**
 * 시나리오 2: 피크 부하 (Peak Load)
 * 이벤트나 프로모션으로 인한 급격한 트래픽 증가
 */
export const PEAK_LOAD_SCENARIO: ServerScenario = {
  id: 'peak-load',
  name: '피크 부하',
  description: '프로모션 이벤트로 인한 트래픽 급증',
  duration: 600, // 10분
  servers: [
    // T+0: 평상시
    {
      serverId: 'web-prd-01',
      timeOffset: 0,
      metrics: { cpu: 25, memory: 40, disk: 50, network: 20, responseTime: 80 },
      status: 'healthy',
    },
    // T+60: 트래픽 증가 시작
    {
      serverId: 'web-prd-01',
      timeOffset: 60,
      metrics: {
        cpu: 45,
        memory: 55,
        disk: 50,
        network: 40,
        responseTime: 120,
      },
      status: 'healthy',
    },
    // T+120: 급격한 증가
    {
      serverId: 'web-prd-01',
      timeOffset: 120,
      metrics: {
        cpu: 75,
        memory: 70,
        disk: 50,
        network: 80,
        responseTime: 300,
      },
      status: 'warning',
      alerts: ['Traffic spike detected'],
    },
    // T+180: 피크 도달
    {
      serverId: 'web-prd-01',
      timeOffset: 180,
      metrics: {
        cpu: 92,
        memory: 85,
        disk: 50,
        network: 95,
        responseTime: 800,
      },
      status: 'critical',
      alerts: ['CPU near capacity', 'Response time degraded'],
    },
    // T+300: 오토스케일링 적용
    {
      serverId: 'web-prd-02',
      timeOffset: 300,
      metrics: {
        cpu: 30,
        memory: 35,
        disk: 40,
        network: 25,
        responseTime: 100,
      },
      status: 'healthy',
      alerts: ['Auto-scaling activated'],
    },
    // T+360: 부하 분산
    {
      serverId: 'web-prd-01',
      timeOffset: 360,
      metrics: {
        cpu: 60,
        memory: 65,
        disk: 50,
        network: 50,
        responseTime: 150,
      },
      status: 'healthy',
    },
  ],
  events: [
    {
      timeOffset: 60,
      type: 'alert',
      serverId: 'web-prd-01',
      message: '트래픽 평소 대비 200% 증가',
      severity: 'info',
    },
    {
      timeOffset: 120,
      type: 'spike',
      serverId: 'web-prd-01',
      message: '프로모션 이벤트 시작, 동시 접속자 급증',
      severity: 'warning',
    },
    {
      timeOffset: 180,
      type: 'alert',
      serverId: 'web-prd-01',
      message: '서버 용량 한계 도달, 응답 시간 저하',
      severity: 'critical',
    },
    {
      timeOffset: 300,
      type: 'maintenance',
      serverId: 'web-prd-02',
      message: '오토스케일링: 새 인스턴스 추가됨',
      severity: 'info',
    },
    {
      timeOffset: 360,
      type: 'recovery',
      serverId: 'web-prd-01',
      message: '부하 분산 완료, 서비스 정상화',
      severity: 'info',
    },
  ],
};

/**
 * 시나리오 3: 메모리 누수 (Memory Leak)
 * 점진적인 메모리 증가로 인한 성능 저하
 */
export const MEMORY_LEAK_SCENARIO: ServerScenario = {
  id: 'memory-leak',
  name: '메모리 누수',
  description: '애플리케이션 메모리 누수로 인한 점진적 성능 저하',
  duration: 900, // 15분
  servers: [
    {
      serverId: 'api-prd-01',
      timeOffset: 0,
      metrics: {
        cpu: 30,
        memory: 35,
        disk: 40,
        network: 25,
        responseTime: 100,
      },
      status: 'healthy',
    },
    {
      serverId: 'api-prd-01',
      timeOffset: 180,
      metrics: {
        cpu: 35,
        memory: 55,
        disk: 40,
        network: 30,
        responseTime: 150,
      },
      status: 'healthy',
    },
    {
      serverId: 'api-prd-01',
      timeOffset: 360,
      metrics: {
        cpu: 40,
        memory: 72,
        disk: 40,
        network: 35,
        responseTime: 250,
      },
      status: 'warning',
      alerts: ['Memory usage increasing'],
    },
    {
      serverId: 'api-prd-01',
      timeOffset: 540,
      metrics: {
        cpu: 50,
        memory: 88,
        disk: 40,
        network: 40,
        responseTime: 500,
      },
      status: 'critical',
      alerts: ['High memory usage', 'GC overhead limit'],
    },
    {
      serverId: 'api-prd-01',
      timeOffset: 720,
      metrics: {
        cpu: 65,
        memory: 95,
        disk: 40,
        network: 45,
        responseTime: 1000,
      },
      status: 'critical',
      alerts: ['Memory exhaustion imminent', 'Service degradation'],
    },
  ],
  events: [
    {
      timeOffset: 360,
      type: 'alert',
      serverId: 'api-prd-01',
      message: '메모리 사용률 지속적 증가 감지',
      severity: 'warning',
    },
    {
      timeOffset: 540,
      type: 'alert',
      serverId: 'api-prd-01',
      message: 'GC 오버헤드 증가, 성능 저하',
      severity: 'error',
    },
    {
      timeOffset: 720,
      type: 'failure',
      serverId: 'api-prd-01',
      message: '메모리 부족 임박, 서비스 재시작 필요',
      severity: 'critical',
    },
    {
      timeOffset: 780,
      type: 'maintenance',
      serverId: 'api-prd-01',
      message: '서비스 재시작 시작',
      severity: 'info',
    },
    {
      timeOffset: 840,
      type: 'recovery',
      serverId: 'api-prd-01',
      message: '서비스 재시작 완료, 메모리 정상화',
      severity: 'info',
    },
  ],
};

/**
 * 시나리오 4: 네트워크 분할 (Network Partition)
 * 네트워크 문제로 인한 서비스 간 통신 장애
 */
export const NETWORK_PARTITION_SCENARIO: ServerScenario = {
  id: 'network-partition',
  name: '네트워크 분할',
  description: '데이터센터 간 네트워크 장애',
  duration: 480, // 8분
  servers: [
    {
      serverId: 'web-dc1-01',
      timeOffset: 0,
      metrics: {
        cpu: 40,
        memory: 50,
        disk: 45,
        network: 35,
        responseTime: 100,
      },
      status: 'healthy',
    },
    {
      serverId: 'api-dc2-01',
      timeOffset: 0,
      metrics: { cpu: 35, memory: 45, disk: 50, network: 30, responseTime: 90 },
      status: 'healthy',
    },
    {
      serverId: 'web-dc1-01',
      timeOffset: 120,
      metrics: {
        cpu: 45,
        memory: 52,
        disk: 45,
        network: 10,
        responseTime: 2000,
      },
      status: 'warning',
      alerts: ['Network latency detected'],
    },
    {
      serverId: 'api-dc2-01',
      timeOffset: 120,
      metrics: {
        cpu: 38,
        memory: 47,
        disk: 50,
        network: 5,
        responseTime: 3000,
      },
      status: 'warning',
      alerts: ['Cross-DC communication failing'],
    },
    {
      serverId: 'web-dc1-01',
      timeOffset: 240,
      metrics: {
        cpu: 50,
        memory: 55,
        disk: 45,
        network: 0,
        responseTime: 5000,
      },
      status: 'critical',
      alerts: ['Network partition detected', 'DC2 unreachable'],
    },
  ],
  events: [
    {
      timeOffset: 60,
      type: 'alert',
      serverId: 'network',
      message: '데이터센터 간 네트워크 지연 증가',
      severity: 'warning',
    },
    {
      timeOffset: 120,
      type: 'failure',
      serverId: 'network',
      message: 'DC1-DC2 간 네트워크 연결 불안정',
      severity: 'error',
    },
    {
      timeOffset: 240,
      type: 'failure',
      serverId: 'network',
      message: '네트워크 분할 발생, 데이터센터 간 통신 두절',
      severity: 'critical',
    },
    {
      timeOffset: 360,
      type: 'maintenance',
      serverId: 'network',
      message: '네트워크 경로 재구성 시작',
      severity: 'info',
    },
    {
      timeOffset: 420,
      type: 'recovery',
      serverId: 'network',
      message: '네트워크 연결 복구 완료',
      severity: 'info',
    },
  ],
};

/**
 * 시나리오 조합 함수
 * 여러 시나리오를 동시에 실행하거나 순차적으로 실행
 */
export function combineScenarios(
  scenarios: ServerScenario[],
  mode: 'sequential' | 'parallel' = 'sequential'
): ServerScenario {
  if (mode === 'sequential') {
    let totalDuration = 0;
    const combinedServers: ServerState[] = [];
    const combinedEvents: ScenarioEvent[] = [];

    scenarios.forEach((scenario) => {
      scenario.servers.forEach((server) => {
        combinedServers.push({
          ...server,
          timeOffset: server.timeOffset + totalDuration,
        });
      });

      scenario.events.forEach((event) => {
        combinedEvents.push({
          ...event,
          timeOffset: event.timeOffset + totalDuration,
        });
      });

      totalDuration += scenario.duration;
    });

    return {
      id: 'combined-sequential',
      name: '복합 시나리오 (순차)',
      description: scenarios.map((s) => s.name).join(' → '),
      duration: totalDuration,
      servers: combinedServers,
      events: combinedEvents,
    };
  } else {
    // 병렬 실행
    const maxDuration = Math.max(...scenarios.map((s) => s.duration));
    const combinedServers: ServerState[] = [];
    const combinedEvents: ScenarioEvent[] = [];

    scenarios.forEach((scenario) => {
      combinedServers.push(...scenario.servers);
      combinedEvents.push(...scenario.events);
    });

    return {
      id: 'combined-parallel',
      name: '복합 시나리오 (병렬)',
      description: scenarios.map((s) => s.name).join(' + '),
      duration: maxDuration,
      servers: combinedServers,
      events: combinedEvents,
    };
  }
}

/**
 * 시나리오 실행기
 * 시간 경과에 따른 서버 상태 변화 시뮬레이션
 */
export class ScenarioRunner {
  private scenario: ServerScenario;
  private startTime: number;
  private currentTime: number = 0;
  private isRunning: boolean = false;

  constructor(scenario: ServerScenario) {
    this.scenario = scenario;
    this.startTime = Date.now();
  }

  start() {
    this.isRunning = true;
    this.startTime = Date.now();
    this.currentTime = 0;
  }

  stop() {
    this.isRunning = false;
  }

  getCurrentState(): {
    elapsedTime: number;
    servers: Map<string, ServerState>;
    recentEvents: ScenarioEvent[];
  } {
    if (!this.isRunning) {
      return {
        elapsedTime: 0,
        servers: new Map(),
        recentEvents: [],
      };
    }

    this.currentTime = (Date.now() - this.startTime) / 1000; // 초 단위

    // 현재 시간에 해당하는 서버 상태 찾기
    const currentServers = new Map<string, ServerState>();

    this.scenario.servers.forEach((server) => {
      if (server.timeOffset <= this.currentTime) {
        const existing = currentServers.get(server.serverId);
        if (!existing || existing.timeOffset < server.timeOffset) {
          currentServers.set(server.serverId, server);
        }
      }
    });

    // 최근 이벤트 찾기 (지난 30초)
    const recentEvents = this.scenario.events.filter(
      (event) =>
        event.timeOffset <= this.currentTime &&
        event.timeOffset > this.currentTime - 30
    );

    return {
      elapsedTime: this.currentTime,
      servers: currentServers,
      recentEvents,
    };
  }

  isComplete(): boolean {
    return this.currentTime >= this.scenario.duration;
  }
}

// 시나리오 저장소
export const SCENARIO_LIBRARY = {
  cascadingFailure: CASCADING_FAILURE_SCENARIO,
  peakLoad: PEAK_LOAD_SCENARIO,
  memoryLeak: MEMORY_LEAK_SCENARIO,
  networkPartition: NETWORK_PARTITION_SCENARIO,
};

// 랜덤 시나리오 선택
export function getRandomScenario(): ServerScenario {
  const scenarios = Object.values(SCENARIO_LIBRARY);
  const randomScenario =
    scenarios[Math.floor(Math.random() * scenarios.length)];

  if (!randomScenario) {
    // Fallback scenario - Gemini 제안 반영
    return {
      id: 'fallback',
      name: '기본 시나리오',
      description: '기본 정상 상태',
      duration: 60,
      servers: [],
      events: [],
    };
  }

  return randomScenario;
}

// 서버 타입별 시나리오 필터링
export function getScenariosByServerType(
  type: 'web' | 'api' | 'database'
): ServerScenario[] {
  return Object.values(SCENARIO_LIBRARY).filter((scenario) =>
    scenario.servers.some((server) => server.serverId.includes(type))
  );
}
