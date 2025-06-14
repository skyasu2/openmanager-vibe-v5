/**
 * 🎭 시연용 현실적 데이터 생성기 v2.0
 *
 * 독립적으로 사용 가능한 시연용 서버 시나리오 시뮬레이션 모듈
 * - 5가지 주요 시나리오 지원 (normal, spike, memory_leak, ddos, performance_degradation)
 * - 실제 서버 패턴 기반 데이터 생성
 * - 시간대별 트래픽 패턴 반영
 * - 시연 및 데모용 최적화
 *
 * @version 2.0.0
 * @author OpenManager Vibe Team
 * @standalone true
 */

// 🎯 모듈 메타데이터
export const MODULE_INFO = {
  name: 'RealisticDataGenerator',
  version: '2.0.0',
  description: '시연용 현실적 서버 시나리오 시뮬레이션',
  features: [
    '5가지 시나리오 지원',
    '실제 서버 패턴 기반',
    '시간대별 트래픽 패턴',
    '시연용 최적화',
    '로그 및 메트릭 생성',
  ],
  standalone: true,
  dependencies: [],
} as const;

// 🔧 표준 인터페이스
export interface IDemoDataGenerator {
  setScenario(scenario: DemoScenario): void;
  generateTimeSeriesData(count?: number): ServerMetrics[];
  generateLogEntries(count?: number): DemoLogEntry[];
  getCurrentScenarioInfo(): ScenarioConfig & { currentScenario: DemoScenario };
  getAllScenarios(): Record<DemoScenario, ScenarioConfig>;
}

export interface ServerMetrics {
  timestamp: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  responseTime: number;
  activeConnections: number;
  errorRate?: number;
  throughput?: number;
}

export interface DemoLogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  source: string;
  message: string;
  category: 'system' | 'security' | 'performance' | 'network' | 'application';
  severity: number; // 1-10
  metadata?: Record<string, any>;
}

export interface ScenarioConfig {
  name: string;
  description: string;
  duration: number; // 분
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedMetrics: string[];
  triggerEvents: string[];
}

export type DemoScenario =
  | 'normal'
  | 'spike'
  | 'memory_leak'
  | 'ddos'
  | 'performance_degradation';

export class RealisticDataGenerator implements IDemoDataGenerator {
  private startTime: Date;
  private currentScenario: DemoScenario = 'normal';
  private scenarioStartTime: Date;
  private baselineMetrics = {
    cpu: 25,
    memory: 40,
    disk: 60,
    networkIn: 1500,
    networkOut: 2500,
    responseTime: 150,
    activeConnections: 200,
  };

  // 🎯 시나리오 설정
  private scenarios: Record<DemoScenario, ScenarioConfig> = {
    normal: {
      name: '정상 운영 상태',
      description: '일반적인 업무 시간 중 정상 서버 운영',
      duration: 30,
      severity: 'low',
      affectedMetrics: [],
      triggerEvents: ['daily_backup', 'routine_maintenance'],
    },
    spike: {
      name: '갑작스런 트래픽 증가',
      description: '마케팅 이벤트나 뉴스로 인한 급격한 사용자 증가',
      duration: 15,
      severity: 'medium',
      affectedMetrics: [
        'cpu',
        'memory',
        'network',
        'responseTime',
        'connections',
      ],
      triggerEvents: ['viral_content', 'marketing_campaign', 'news_mention'],
    },
    memory_leak: {
      name: '메모리 누수 발생',
      description: '애플리케이션 버그로 인한 점진적 메모리 증가',
      duration: 45,
      severity: 'high',
      affectedMetrics: ['memory', 'responseTime', 'cpu'],
      triggerEvents: ['code_deployment', 'memory_allocation_bug'],
    },
    ddos: {
      name: 'DDoS 공격 시뮬레이션',
      description: '분산 서비스 거부 공격으로 인한 시스템 부하',
      duration: 20,
      severity: 'critical',
      affectedMetrics: ['network', 'cpu', 'connections', 'responseTime'],
      triggerEvents: ['security_breach', 'malicious_traffic'],
    },
    performance_degradation: {
      name: '점진적 성능 저하',
      description: '디스크 공간 부족이나 데이터베이스 성능 저하',
      duration: 60,
      severity: 'high',
      affectedMetrics: ['disk', 'responseTime', 'cpu'],
      triggerEvents: ['database_slowdown', 'disk_fragmentation'],
    },
  };

  constructor() {
    this.startTime = new Date();
    this.scenarioStartTime = new Date();
  }

  // 🏗️ 정적 팩토리 메서드 (독립 실행용)
  public static createForDemo(
    scenario: DemoScenario = 'normal'
  ): RealisticDataGenerator {
    const generator = new RealisticDataGenerator();
    generator.setScenario(scenario);
    return generator;
  }

  /**
   * 🎯 현재 시나리오 설정
   */
  public setScenario(scenario: DemoScenario): void {
    this.currentScenario = scenario;
    this.scenarioStartTime = new Date();
    console.log(`🎭 시나리오 변경: ${this.scenarios[scenario].name}`);
  }

  /**
   * 📊 시계열 데이터 생성 (메인 메서드)
   */
  public generateTimeSeriesData(count: number = 50): ServerMetrics[] {
    const metrics: ServerMetrics[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - (count - i) * 60000); // 1분 간격
      const dataPoint = this.generateDataPoint(timestamp, i, count);
      metrics.push(dataPoint);
    }

    return metrics;
  }

  /**
   * 🔥 단일 데이터 포인트 생성
   */
  private generateDataPoint(
    timestamp: Date,
    index: number,
    total: number
  ): ServerMetrics {
    // 시간대별 기본 패턴
    const timePattern = this.getTimeBasedPattern(timestamp);

    // 시나리오별 수정자
    const scenarioModifier = this.getScenarioModifier(index, total);

    // 기본 메트릭 계산
    let cpu = this.generateCPUPattern(timePattern, scenarioModifier, index);
    let memory = this.generateMemoryPattern(
      timePattern,
      scenarioModifier,
      index
    );
    let disk = this.generateDiskPattern(timePattern, scenarioModifier, index);
    let networkIn = this.generateNetworkInPattern(
      timePattern,
      scenarioModifier,
      index
    );
    let networkOut = this.generateNetworkOutPattern(
      timePattern,
      scenarioModifier,
      index
    );
    let responseTime = this.generateResponseTimePattern(
      timePattern,
      scenarioModifier,
      index
    );
    let activeConnections = this.generateConnectionsPattern(
      timePattern,
      scenarioModifier,
      index
    );

    // 제한값 적용
    cpu = Math.max(1, Math.min(100, cpu));
    memory = Math.max(10, Math.min(100, memory));
    disk = Math.max(20, Math.min(100, disk));
    networkIn = Math.max(0, networkIn);
    networkOut = Math.max(0, networkOut);
    responseTime = Math.max(50, responseTime);
    activeConnections = Math.max(0, activeConnections);

    return {
      timestamp: timestamp.toISOString(),
      cpu: Math.round(cpu * 100) / 100,
      memory: Math.round(memory * 100) / 100,
      disk: Math.round(disk * 100) / 100,
      networkIn: Math.round(networkIn),
      networkOut: Math.round(networkOut),
      responseTime: Math.round(responseTime),
      activeConnections: Math.round(activeConnections),
      errorRate: this.generateErrorRate(scenarioModifier),
      throughput: this.generateThroughput(scenarioModifier, activeConnections),
    };
  }

  /**
   * ⏰ 시간대별 패턴 (업무시간 고려)
   */
  private getTimeBasedPattern(timestamp: Date): number {
    const hour = timestamp.getHours();

    // 업무시간 패턴 (9-18시 높음)
    if (hour >= 9 && hour <= 18) {
      return 1.0 + Math.sin(((hour - 9) / 9) * Math.PI) * 0.3;
    } else if (hour >= 19 && hour <= 23) {
      return 0.7 + Math.sin(((hour - 19) / 4) * Math.PI) * 0.2;
    } else {
      return 0.3 + Math.sin((hour / 24) * Math.PI) * 0.1;
    }
  }

  /**
   * 🎭 시나리오별 수정자
   */
  private getScenarioModifier(
    index: number,
    total: number
  ): Record<string, number> {
    const progress = index / total;
    const scenario = this.scenarios[this.currentScenario];

    switch (this.currentScenario) {
      case 'spike':
        return {
          cpu: 1 + Math.sin(progress * Math.PI) * 2.5,
          memory: 1 + Math.sin(progress * Math.PI) * 1.8,
          network: 1 + Math.sin(progress * Math.PI) * 5,
          responseTime: 1 + Math.sin(progress * Math.PI) * 3,
          connections: 1 + Math.sin(progress * Math.PI) * 4,
        };

      case 'memory_leak':
        return {
          cpu: 1 + progress * 0.5,
          memory: 1 + progress * 3, // 점진적 증가
          network: 1,
          responseTime: 1 + progress * 2,
          connections: 1,
        };

      case 'ddos':
        const ddosIntensity = Math.sin(progress * Math.PI * 2) * 0.5 + 0.5;
        return {
          cpu: 1 + ddosIntensity * 4,
          memory: 1 + ddosIntensity * 2,
          network: 1 + ddosIntensity * 10,
          responseTime: 1 + ddosIntensity * 8,
          connections: 1 + ddosIntensity * 15,
        };

      case 'performance_degradation':
        return {
          cpu: 1 + progress * 1.5,
          memory: 1 + progress * 0.8,
          network: 1,
          responseTime: 1 + progress * 4,
          connections: 1,
        };

      default: // normal
        return {
          cpu: 1,
          memory: 1,
          network: 1,
          responseTime: 1,
          connections: 1,
        };
    }
  }

  /**
   * 🖥️ CPU 패턴 생성
   */
  private generateCPUPattern(
    timePattern: number,
    modifier: Record<string, number>,
    index: number
  ): number {
    const baseline = this.baselineMetrics.cpu * timePattern;
    const noise = (Math.random() - 0.5) * 10;
    const wave = Math.sin(index / 10) * 5;

    return baseline * (modifier.cpu || 1) + noise + wave;
  }

  /**
   * 💾 메모리 패턴 생성 (누수 포함)
   */
  private generateMemoryPattern(
    timePattern: number,
    modifier: Record<string, number>,
    index: number
  ): number {
    const baseline = this.baselineMetrics.memory * timePattern;
    const noise = (Math.random() - 0.5) * 8;

    // 메모리 누수 시나리오에서는 선형 증가
    if (this.currentScenario === 'memory_leak') {
      const leakRate = index * 0.3;
      return baseline + leakRate * (modifier.memory || 1) + noise;
    }

    const wave = Math.sin(index / 15) * 3;
    return baseline * (modifier.memory || 1) + noise + wave;
  }

  /**
   * 💽 디스크 패턴 생성
   */
  private generateDiskPattern(
    timePattern: number,
    modifier: Record<string, number>,
    index: number
  ): number {
    const baseline = this.baselineMetrics.disk;
    const noise = (Math.random() - 0.5) * 2; // 디스크는 변동이 적음

    // 성능 저하 시나리오에서는 점진적 증가
    if (this.currentScenario === 'performance_degradation') {
      const degradation = index * 0.2;
      return baseline + degradation + noise;
    }

    return baseline + noise;
  }

  /**
   * 🌐 네트워크 입력 패턴
   */
  private generateNetworkInPattern(
    timePattern: number,
    modifier: Record<string, number>,
    index: number
  ): number {
    const baseline = this.baselineMetrics.networkIn * timePattern;
    const noise = (Math.random() - 0.5) * 500;
    const burst = Math.sin(index / 5) * 200;

    return baseline * (modifier.network || 1) + noise + burst;
  }

  /**
   * 🌐 네트워크 출력 패턴
   */
  private generateNetworkOutPattern(
    timePattern: number,
    modifier: Record<string, number>,
    index: number
  ): number {
    const baseline = this.baselineMetrics.networkOut * timePattern;
    const noise = (Math.random() - 0.5) * 800;
    const burst = Math.sin(index / 7) * 300;

    return baseline * (modifier.network || 1) + noise + burst;
  }

  /**
   * ⏱️ 응답시간 패턴
   */
  private generateResponseTimePattern(
    timePattern: number,
    modifier: Record<string, number>,
    index: number
  ): number {
    const baseline = this.baselineMetrics.responseTime / timePattern; // 부하가 높으면 응답시간 증가
    const noise = (Math.random() - 0.5) * 50;
    const spike = Math.random() > 0.95 ? 200 : 0; // 5% 확률로 스파이크

    return baseline * (modifier.responseTime || 1) + noise + spike;
  }

  /**
   * 🔗 활성 연결 패턴
   */
  private generateConnectionsPattern(
    timePattern: number,
    modifier: Record<string, number>,
    index: number
  ): number {
    const baseline = this.baselineMetrics.activeConnections * timePattern;
    const noise = (Math.random() - 0.5) * 50;
    const wave = Math.sin(index / 8) * 30;

    return baseline * (modifier.connections || 1) + noise + wave;
  }

  /**
   * ❌ 에러율 생성
   */
  private generateErrorRate(modifier: Record<string, number>): number {
    const baseErrorRate = 0.5; // 0.5%

    if (this.currentScenario === 'ddos') {
      return baseErrorRate * 20 + Math.random() * 10;
    } else if (this.currentScenario === 'performance_degradation') {
      return baseErrorRate * 5 + Math.random() * 3;
    }

    return baseErrorRate + Math.random() * 2;
  }

  /**
   * 📈 처리량 생성
   */
  private generateThroughput(
    modifier: Record<string, number>,
    connections: number
  ): number {
    const baselinePerConnection = 2.5; // requests per connection
    let throughput = connections * baselinePerConnection;

    if (this.currentScenario === 'ddos') {
      throughput *= 0.3; // DDoS 중에는 처리량 감소
    } else if (this.currentScenario === 'performance_degradation') {
      throughput *= 0.6;
    }

    return Math.round(throughput);
  }

  /**
   * 📝 로그 엔트리 생성
   */
  public generateLogEntries(count: number = 20): DemoLogEntry[] {
    const logs: DemoLogEntry[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const timestamp = new Date(now - Math.random() * 3600000); // 1시간 범위
      logs.push(this.generateLogEntry(timestamp));
    }

    return logs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * 📝 단일 로그 엔트리 생성
   */
  private generateLogEntry(timestamp: Date): DemoLogEntry {
    const scenario = this.scenarios[this.currentScenario];
    const scenarioMessages = this.getScenarioLogMessages();

    // 시나리오에 따른 로그 레벨 가중치
    let levelWeights: Record<string, number> = {
      INFO: 70,
      WARN: 20,
      ERROR: 8,
      CRITICAL: 2,
    };

    if (this.currentScenario === 'ddos') {
      levelWeights = { INFO: 20, WARN: 30, ERROR: 35, CRITICAL: 15 };
    } else if (this.currentScenario === 'memory_leak') {
      levelWeights = { INFO: 40, WARN: 40, ERROR: 15, CRITICAL: 5 };
    } else if (this.currentScenario === 'performance_degradation') {
      levelWeights = { INFO: 30, WARN: 50, ERROR: 15, CRITICAL: 5 };
    }

    const level = this.weightedRandom(levelWeights) as DemoLogEntry['level'];
    const messageData =
      scenarioMessages[level][
        Math.floor(Math.random() * scenarioMessages[level].length)
      ];

    return {
      timestamp: timestamp.toISOString(),
      level,
      source: this.getRandomSource(),
      message: messageData.message,
      category: messageData.category,
      severity: messageData.severity,
      metadata: this.generateLogMetadata(level, messageData.category),
    };
  }

  /**
   * 🎯 시나리오별 로그 메시지
   */
  private getScenarioLogMessages() {
    const baseMessages = {
      INFO: [
        {
          message: 'HTTP 요청 처리 완료',
          category: 'application' as const,
          severity: 1,
        },
        {
          message: '일일 백업 작업 시작',
          category: 'system' as const,
          severity: 2,
        },
        {
          message: '사용자 인증 성공',
          category: 'security' as const,
          severity: 1,
        },
        {
          message: '캐시 히트 - 응답 최적화',
          category: 'performance' as const,
          severity: 1,
        },
      ],
      WARN: [
        {
          message: 'CPU 사용률 70% 초과',
          category: 'performance' as const,
          severity: 4,
        },
        {
          message: '메모리 사용량 증가 감지',
          category: 'system' as const,
          severity: 5,
        },
        {
          message: '응답 시간 지연 발생',
          category: 'performance' as const,
          severity: 4,
        },
        {
          message: '연결 풀 80% 사용 중',
          category: 'network' as const,
          severity: 5,
        },
      ],
      ERROR: [
        {
          message: '데이터베이스 연결 타임아웃',
          category: 'system' as const,
          severity: 7,
        },
        {
          message: 'API 요청 처리 실패',
          category: 'application' as const,
          severity: 6,
        },
        {
          message: '메모리 할당 오류',
          category: 'system' as const,
          severity: 8,
        },
        {
          message: '네트워크 연결 끊어짐',
          category: 'network' as const,
          severity: 7,
        },
      ],
      CRITICAL: [
        {
          message: '서비스 응답 불가',
          category: 'system' as const,
          severity: 10,
        },
        {
          message: 'DDoS 공격 의심 트래픽 감지',
          category: 'security' as const,
          severity: 9,
        },
        {
          message: '메모리 누수로 인한 서비스 불안정',
          category: 'system' as const,
          severity: 9,
        },
        {
          message: '디스크 공간 부족 - 긴급 조치 필요',
          category: 'system' as const,
          severity: 10,
        },
      ],
    };

    // 시나리오별 특수 메시지 추가
    if (this.currentScenario === 'ddos') {
      baseMessages.ERROR.push(
        {
          message: '비정상적인 트래픽 패턴 감지',
          category: 'security' as any,
          severity: 8,
        },
        {
          message: '연결 수 임계치 초과',
          category: 'network' as const,
          severity: 7,
        }
      );
      baseMessages.CRITICAL.push({
        message: '보안 위협 레벨 상승',
        category: 'security' as any,
        severity: 9,
      });
    }

    return baseMessages;
  }

  /**
   * 🎲 가중치 기반 랜덤 선택
   */
  private weightedRandom(weights: Record<string, number>): string {
    const items = Object.keys(weights);
    const totalWeight = Object.values(weights).reduce(
      (sum, weight) => sum + weight,
      0
    );
    let randomValue = Math.random() * totalWeight;

    for (const item of items) {
      randomValue -= weights[item];
      if (randomValue <= 0) {
        return item;
      }
    }

    return items[items.length - 1];
  }

  /**
   * 🏷️ 랜덤 소스 선택
   */
  private getRandomSource(): string {
    const sources = [
      'web-server-01',
      'web-server-02',
      'api-gateway',
      'database-primary',
      'database-replica',
      'cache-server',
      'load-balancer',
      'worker-node-01',
      'worker-node-02',
      'monitoring-service',
      'backup-service',
      'auth-service',
    ];

    return sources[Math.floor(Math.random() * sources.length)];
  }

  /**
   * 📊 로그 메타데이터 생성
   */
  private generateLogMetadata(
    level: DemoLogEntry['level'],
    category: DemoLogEntry['category']
  ): Record<string, any> {
    const metadata: Record<string, any> = {
      scenario: this.currentScenario,
      thread_id: Math.floor(Math.random() * 100),
      request_id: `req_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    };

    if (category === 'performance') {
      metadata.response_time = Math.round(100 + Math.random() * 500);
      metadata.memory_usage = Math.round(30 + Math.random() * 50);
    }

    if (category === 'security') {
      metadata.ip_address = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
      metadata.user_agent = 'suspicious_bot_v1.0';
    }

    if (level === 'ERROR' || level === 'CRITICAL') {
      metadata.stack_trace = 'Error stack trace would be here...';
      metadata.error_code = `E${Math.floor(Math.random() * 9000) + 1000}`;
    }

    return metadata;
  }

  /**
   * 📈 현재 시나리오 정보 반환
   */
  public getCurrentScenarioInfo(): ScenarioConfig & {
    currentScenario: DemoScenario;
  } {
    return {
      ...this.scenarios[this.currentScenario],
      currentScenario: this.currentScenario,
    };
  }

  /**
   * 🎭 사용 가능한 모든 시나리오 반환
   */
  public getAllScenarios(): Record<DemoScenario, ScenarioConfig> {
    return this.scenarios;
  }
}
