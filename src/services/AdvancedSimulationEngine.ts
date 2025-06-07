/**
 * 🎯 OpenManager Vibe v5 - 고급 시뮬레이션 엔진
 *
 * AI 기반 고급 서버 시뮬레이션 및 시나리오 생성
 */

export interface AdvancedScenario {
  type: 'load_spike' | 'memory_leak' | 'network_latency' | 'disk_failure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  duration: number;
  affectedServers: string[];
  description: string;
}

export interface SimulationMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: string;
  scenario?: AdvancedScenario;
}

export class AdvancedSimulationEngine {
  private scenarios: AdvancedScenario[] = [];
  private isRunning: boolean = false;

  constructor() {
    this.initializeScenarios();
  }

  /**
   * 🎮 시나리오 초기화
   */
  private initializeScenarios(): void {
    this.scenarios = [
      {
        type: 'load_spike',
        severity: 'high',
        duration: 300000, // 5분
        affectedServers: ['server-1', 'server-2'],
        description: '트래픽 급증으로 인한 부하 스파이크',
      },
      {
        type: 'memory_leak',
        severity: 'medium',
        duration: 600000, // 10분
        affectedServers: ['server-3'],
        description: '애플리케이션 메모리 누수 발생',
      },
    ];
  }

  /**
   * 📊 고급 메트릭 생성
   */
  generateAdvancedMetrics(serverCount: number = 30): SimulationMetrics[] {
    const metrics: SimulationMetrics[] = [];

    for (let i = 0; i < serverCount; i++) {
      const serverId = `server-${i + 1}`;
      const activeScenario = this.getActiveScenario(serverId);

      let cpu = Math.random() * 50 + 10;
      let memory = Math.random() * 40 + 20;
      let disk = Math.random() * 60 + 10;
      let network = Math.random() * 50 + 5;

      // 시나리오 적용
      if (activeScenario) {
        const multiplier = this.getSeverityMultiplier(activeScenario.severity);

        switch (activeScenario.type) {
          case 'load_spike':
            cpu *= multiplier;
            network *= multiplier;
            break;
          case 'memory_leak':
            memory *= multiplier;
            break;
          case 'network_latency':
            network *= multiplier;
            break;
          case 'disk_failure':
            disk *= multiplier;
            break;
        }
      }

      metrics.push({
        cpu: Math.min(cpu, 100),
        memory: Math.min(memory, 100),
        disk: Math.min(disk, 100),
        network: Math.min(network, 200),
        timestamp: new Date().toISOString(),
        scenario: activeScenario,
      });
    }

    return metrics;
  }

  /**
   * 🎯 활성 시나리오 확인
   */
  private getActiveScenario(serverId: string): AdvancedScenario | undefined {
    return this.scenarios.find(
      scenario =>
        scenario.affectedServers.includes(serverId) && Math.random() < 0.1
    );
  }

  /**
   * 📈 심각도 배수 계산
   */
  private getSeverityMultiplier(
    severity: AdvancedScenario['severity']
  ): number {
    switch (severity) {
      case 'low':
        return 1.2;
      case 'medium':
        return 1.5;
      case 'high':
        return 2.0;
      case 'critical':
        return 3.0;
      default:
        return 1.0;
    }
  }

  /**
   * ⚙️ 시나리오 추가
   */
  addScenario(scenario: AdvancedScenario): void {
    this.scenarios.push(scenario);
  }

  /**
   * 📋 현재 상태
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeScenarios: this.scenarios.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🎯 분석 대상 서버 목록 반환
   */
  getAnalysisTargets(): any[] {
    const metrics = this.generateAdvancedMetrics();
    return metrics.map((metric, index) => ({
      id: `server-${index + 1}`,
      name: `Server-${String(index + 1).padStart(2, '0')}`,
      status:
        metric.cpu > 80 ? 'critical' : metric.cpu > 60 ? 'warning' : 'normal',
      cpu_usage: metric.cpu,
      memory_usage: metric.memory,
      disk_usage: metric.disk,
      network_usage: metric.network,
      timestamp: metric.timestamp,
      scenario: metric.scenario,
      predicted_status: metric.cpu > 70 ? 'warning' : 'healthy',
    }));
  }

  /**
   * 🤖 통합 AI 메트릭 반환
   */
  getIntegratedAIMetrics(): any {
    const targets = this.getAnalysisTargets();
    const totalServers = targets.length;
    const criticalServers = targets.filter(s => s.status === 'critical').length;
    const warningServers = targets.filter(s => s.status === 'warning').length;

    return {
      totalServers,
      criticalServers,
      warningServers,
      healthyServers: totalServers - criticalServers - warningServers,
      averageCpu: Math.round(
        targets.reduce((sum, s) => sum + s.cpu_usage, 0) / totalServers
      ),
      averageMemory: Math.round(
        targets.reduce((sum, s) => sum + s.memory_usage, 0) / totalServers
      ),
      activeScenarios: this.scenarios.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 🎭 활성 시나리오 목록 반환
   */
  getActiveScenarios(): AdvancedScenario[] {
    return this.scenarios.filter(scenario => Math.random() < 0.3); // 30% 확률로 활성
  }

  /**
   * 🔍 실행 상태 확인
   */
  getIsRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 🚀 시뮬레이션 시작
   */
  start(): void {
    this.isRunning = true;
    console.log('🚀 고급 시뮬레이션 엔진 시작됨');
  }

  /**
   * ⏹️ 시뮬레이션 중지
   */
  stop(): void {
    this.isRunning = false;
    console.log('⏹️ 고급 시뮬레이션 엔진 중지됨');
  }
}

// 싱글톤 인스턴스
export const advancedSimulationEngine = new AdvancedSimulationEngine();
