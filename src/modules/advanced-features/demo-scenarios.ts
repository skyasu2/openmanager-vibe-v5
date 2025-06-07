/**
 * 🎭 시연 시나리오 시스템
 * RealisticDataGenerator.ts에서 추출한 시연 특화 기능
 */

export interface ScenarioConfig {
  name: string;
  description: string;
  duration: number; // 분
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedMetrics: string[];
  triggerEvents: string[];
}

export type DemoScenario = 'normal' | 'spike' | 'memory_leak' | 'ddos' | 'performance_degradation' | 'stress' | 'failure' | 'maintenance';

export interface ScenarioMetrics {
  cpu: number;
  memory: number;
  disk: number;
  networkIn: number;
  networkOut: number;
  responseTime: number;
  activeConnections: number;
  errorRate: number;
  throughput: number;
}

export class DemoScenariosGenerator {
  private currentScenario: DemoScenario = 'normal';
  private scenarioStartTime: Date = new Date();
  
  // 시나리오 설정
  private scenarios: Record<DemoScenario, ScenarioConfig> = {
    normal: {
      name: '정상 운영 상태',
      description: '일반적인 업무 시간 중 정상 서버 운영',
      duration: 30,
      severity: 'low',
      affectedMetrics: [],
      triggerEvents: ['daily_backup', 'routine_maintenance']
    },
    spike: {
      name: '갑작스런 트래픽 증가',
      description: '마케팅 이벤트나 뉴스로 인한 급격한 사용자 증가',
      duration: 15,
      severity: 'medium',
      affectedMetrics: ['cpu', 'memory', 'network', 'responseTime', 'connections'],
      triggerEvents: ['viral_content', 'marketing_campaign', 'news_mention']
    },
    memory_leak: {
      name: '메모리 누수 발생',
      description: '애플리케이션 버그로 인한 점진적 메모리 증가',
      duration: 45,
      severity: 'high',
      affectedMetrics: ['memory', 'responseTime', 'cpu'],
      triggerEvents: ['code_deployment', 'memory_allocation_bug']
    },
    ddos: {
      name: 'DDoS 공격 시뮬레이션',
      description: '분산 서비스 거부 공격으로 인한 시스템 부하',
      duration: 20,
      severity: 'critical',
      affectedMetrics: ['network', 'cpu', 'connections', 'responseTime'],
      triggerEvents: ['security_breach', 'malicious_traffic']
    },
    performance_degradation: {
      name: '점진적 성능 저하',
      description: '디스크 공간 부족이나 데이터베이스 성능 저하',
      duration: 60,
      severity: 'high',
      affectedMetrics: ['disk', 'responseTime', 'cpu'],
      triggerEvents: ['database_slowdown', 'disk_fragmentation']
    },
    stress: {
      name: '스트레스 테스트',
      description: '시스템 한계 테스트를 위한 부하 증가',
      duration: 30,
      severity: 'high',
      affectedMetrics: ['cpu', 'memory', 'network', 'responseTime'],
      triggerEvents: ['load_testing', 'capacity_planning']
    },
    failure: {
      name: '시스템 장애',
      description: '하드웨어 장애나 크리티컬 에러 발생',
      duration: 10,
      severity: 'critical',
      affectedMetrics: ['all'],
      triggerEvents: ['hardware_failure', 'critical_error', 'service_unavailable']
    },
    maintenance: {
      name: '유지보수 모드',
      description: '계획된 시스템 유지보수 작업',
      duration: 120,
      severity: 'medium',
      affectedMetrics: ['availability'],
      triggerEvents: ['scheduled_maintenance', 'system_update', 'security_patch']
    }
  };

  private baselineMetrics = {
    cpu: 25,
    memory: 40,
    disk: 60,
    networkIn: 1500,
    networkOut: 2500,
    responseTime: 150,
    activeConnections: 200
  };

  /**
   * 🎯 현재 시나리오 설정
   */
  setScenario(scenario: DemoScenario): void {
    this.currentScenario = scenario;
    this.scenarioStartTime = new Date();
    console.log(`🎭 시나리오 변경: ${this.scenarios[scenario].name}`);
  }

  /**
   * 📊 시나리오별 메트릭 생성
   */
  generateScenarioMetrics(index: number, total: number): ScenarioMetrics {
    const progress = index / total;
    const timePattern = this.getTimeBasedPattern(new Date());
    const scenarioModifier = this.getScenarioModifier(progress);
    
    // 기본 메트릭 계산
    let cpu = this.generateMetricWithPattern('cpu', timePattern, scenarioModifier, index);
    let memory = this.generateMetricWithPattern('memory', timePattern, scenarioModifier, index);
    let disk = this.generateMetricWithPattern('disk', timePattern, scenarioModifier, index);
    let networkIn = this.generateMetricWithPattern('networkIn', timePattern, scenarioModifier, index);
    let networkOut = this.generateMetricWithPattern('networkOut', timePattern, scenarioModifier, index);
    let responseTime = this.generateMetricWithPattern('responseTime', timePattern, scenarioModifier, index);
    let activeConnections = this.generateMetricWithPattern('activeConnections', timePattern, scenarioModifier, index);

    // 제한값 적용
    cpu = Math.max(1, Math.min(100, cpu));
    memory = Math.max(10, Math.min(100, memory));
    disk = Math.max(20, Math.min(100, disk));
    networkIn = Math.max(0, networkIn);
    networkOut = Math.max(0, networkOut);
    responseTime = Math.max(50, responseTime);
    activeConnections = Math.max(0, activeConnections);

    return {
      cpu: Math.round(cpu * 100) / 100,
      memory: Math.round(memory * 100) / 100,
      disk: Math.round(disk * 100) / 100,
      networkIn: Math.round(networkIn),
      networkOut: Math.round(networkOut),
      responseTime: Math.round(responseTime),
      activeConnections: Math.round(activeConnections),
      errorRate: this.generateErrorRate(scenarioModifier),
      throughput: this.generateThroughput(scenarioModifier, activeConnections)
    };
  }

  /**
   * ⏰ 시간대별 패턴 (업무시간 고려)
   */
  private getTimeBasedPattern(timestamp: Date): number {
    const hour = timestamp.getHours();
    
    if (hour >= 9 && hour <= 18) {
      return 1.0 + Math.sin((hour - 9) / 9 * Math.PI) * 0.3;
    } else if (hour >= 19 && hour <= 23) {
      return 0.7 + Math.sin((hour - 19) / 4 * Math.PI) * 0.2;
    } else {
      return 0.3 + Math.sin(hour / 24 * Math.PI) * 0.1;
    }
  }

  /**
   * 🎭 시나리오별 수정자
   */
  private getScenarioModifier(progress: number): Record<string, number> {
    switch (this.currentScenario) {
      case 'spike':
        return {
          cpu: 1 + Math.sin(progress * Math.PI) * 2.5,
          memory: 1 + Math.sin(progress * Math.PI) * 1.8,
          network: 1 + Math.sin(progress * Math.PI) * 3.0,
          responseTime: 1 + Math.sin(progress * Math.PI) * 4.0,
          connections: 1 + Math.sin(progress * Math.PI) * 5.0
        };
        
      case 'memory_leak':
        return {
          cpu: 1 + progress * 1.5,
          memory: 1 + Math.pow(progress, 1.5) * 3.0, // 점진적 증가
          network: 1,
          responseTime: 1 + progress * 2.0,
          connections: 1 + progress * 0.5
        };
        
      case 'ddos':
        return {
          cpu: 1 + Math.sin(progress * Math.PI * 3) * 2.0, // 빠른 진동
          memory: 1 + Math.sin(progress * Math.PI * 2) * 1.5,
          network: 1 + Math.sin(progress * Math.PI * 4) * 6.0, // 매우 높은 네트워크 부하
          responseTime: 1 + Math.sin(progress * Math.PI * 3) * 8.0,
          connections: 1 + Math.sin(progress * Math.PI * 2) * 10.0
        };
        
      case 'performance_degradation':
        return {
          cpu: 1 + Math.log(1 + progress) * 1.2,
          memory: 1 + progress * 0.8,
          network: 1,
          responseTime: 1 + Math.pow(progress, 2) * 3.0, // 제곱 증가
          connections: 1 - progress * 0.3 // 연결 수 감소
        };
        
      case 'stress':
        return {
          cpu: 1 + progress * 2.5,
          memory: 1 + progress * 2.0,
          network: 1 + progress * 1.5,
          responseTime: 1 + progress * 3.0,
          connections: 1 + progress * 1.2
        };
        
      case 'failure':
        return {
          cpu: 1 + Math.random() * 3.0, // 불규칙한 변동
          memory: 1 + Math.random() * 2.0,
          network: Math.random() > 0.5 ? 0.1 : 1 + Math.random() * 4.0, // 간헐적 장애
          responseTime: 1 + Math.random() * 10.0,
          connections: Math.random() * 0.5 // 대부분의 연결 끊김
        };
        
      case 'maintenance':
        return {
          cpu: 0.3 + Math.sin(progress * Math.PI) * 0.2, // 낮은 부하
          memory: 0.5,
          network: 0.2,
          responseTime: 2.0, // 유지보수로 인한 응답 지연
          connections: 0.1 // 대부분의 연결 차단
        };
        
      default: // normal
        return {
          cpu: 1,
          memory: 1,
          network: 1,
          responseTime: 1,
          connections: 1
        };
    }
  }

  private generateMetricWithPattern(
    metric: keyof typeof this.baselineMetrics,
    timePattern: number,
    modifier: Record<string, number>,
    index: number
  ): number {
    const baseValue = this.baselineMetrics[metric];
    const modifierKey = this.getModifierKey(metric);
    const modifierValue = modifier[modifierKey] || 1;
    
    // 기본 변동 추가
    const randomVariation = 0.9 + Math.random() * 0.2; // ±10% 변동
    
    return baseValue * timePattern * modifierValue * randomVariation;
  }

  private getModifierKey(metric: string): string {
    const mapping: Record<string, string> = {
      cpu: 'cpu',
      memory: 'memory',
      disk: 'cpu', // 디스크는 CPU와 연관
      networkIn: 'network',
      networkOut: 'network',
      responseTime: 'responseTime',
      activeConnections: 'connections'
    };
    return mapping[metric] || 'cpu';
  }

  private generateErrorRate(modifier: Record<string, number>): number {
    const baseErrorRate = 0.1; // 0.1%
    const errorMultiplier = modifier.responseTime || 1;
    
    return Math.min(50, baseErrorRate * errorMultiplier); // 최대 50%
  }

  private generateThroughput(modifier: Record<string, number>, connections: number): number {
    const baseTPSPerConnection = 2.5;
    const throughputMultiplier = 1 / (modifier.responseTime || 1); // 응답시간과 반비례
    
    return connections * baseTPSPerConnection * throughputMultiplier;
  }

  /**
   * 📋 현재 시나리오 정보 조회
   */
  getCurrentScenarioInfo(): ScenarioConfig & { currentScenario: DemoScenario } {
    return {
      ...this.scenarios[this.currentScenario],
      currentScenario: this.currentScenario
    };
  }

  /**
   * 📜 모든 시나리오 조회
   */
  getAllScenarios(): Record<DemoScenario, ScenarioConfig> {
    return this.scenarios;
  }

  /**
   * ⏱️ 시나리오 진행률 계산
   */
  getScenarioProgress(): number {
    const elapsed = Date.now() - this.scenarioStartTime.getTime();
    const duration = this.scenarios[this.currentScenario].duration * 60 * 1000; // 분을 밀리초로
    
    return Math.min(1, elapsed / duration);
  }

  /**
   * 🔄 자동 시나리오 순환
   */
  autoRotateScenario(): void {
    const scenarios: DemoScenario[] = ['normal', 'spike', 'memory_leak', 'performance_degradation', 'stress'];
    const currentIndex = scenarios.indexOf(this.currentScenario);
    const nextIndex = (currentIndex + 1) % scenarios.length;
    
    this.setScenario(scenarios[nextIndex]);
  }
}

// 싱글톤 인스턴스
export const demoScenariosGenerator = new DemoScenariosGenerator();

// 편의 함수들
export function setDemoScenario(scenario: DemoScenario) {
  demoScenariosGenerator.setScenario(scenario);
}

export function generateScenarioMetrics(index: number = 0, total: number = 100) {
  return demoScenariosGenerator.generateScenarioMetrics(index, total);
}

export function getCurrentScenario() {
  return demoScenariosGenerator.getCurrentScenarioInfo();
} 