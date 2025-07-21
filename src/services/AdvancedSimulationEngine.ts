/**
 * 🎯 OpenManager Vibe v5 - 고급 시뮬레이션 엔진
 *
 * AI 기반 고급 서버 시뮬레이션 및 시나리오 생성
 */

import { VercelDatabase } from '@/lib/supabase';

export interface ServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: string;
  server_id?: string;
}

export interface SimulationMetrics extends ServerMetrics {
  scenario?: AdvancedScenario;
  confidence: number;
  data_source: 'real_database' | 'pattern_analysis' | 'fallback';
}

export interface AdvancedScenario {
  id: string;
  type:
    | 'load_spike'
    | 'memory_leak'
    | 'network_latency'
    | 'disk_failure'
    | 'normal';
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedServers: string[];
  startTime: Date;
  duration: number; // minutes
  description: string;
  probability: number; // 0.0 - 1.0
}

export class AdvancedSimulationEngine {
  private scenarios: AdvancedScenario[] = [];
  private realMetricsCache: Map<string, ServerMetrics[]> = new Map();
  private lastCacheUpdate = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5분
  private isRunning = false;

  constructor() {
    console.log('🎭 고급 시뮬레이션 엔진 초기화 (실제 데이터 기반)');
    this.initializeRealDataScenarios();
  }

  /**
   * 🔍 실제 데이터 기반 시나리오 초기화 (하드코딩 제거)
   */
  private initializeRealDataScenarios(): void {
    // 더 이상 하드코딩된 시나리오 사용하지 않음
    // 실제 데이터 패턴에서 시나리오 추출
    console.log('📊 실제 데이터 패턴 기반 시나리오 분석 준비 완료');
  }

  /**
   * 🔄 실제 서버 메트릭 조회 및 캐싱
   */
  private async getRealServerMetrics(): Promise<ServerMetrics[]> {
    const now = Date.now();

    // 캐시 확인
    if (
      now - this.lastCacheUpdate < this.CACHE_TTL &&
      this.realMetricsCache.size > 0
    ) {
      const cachedMetrics: ServerMetrics[] = [];
      this.realMetricsCache.forEach(metrics => cachedMetrics.push(...metrics));
      return cachedMetrics;
    }

    try {
      // 실제 데이터베이스에서 메트릭 조회
      const dashboardData = await VercelDatabase.getDashboardData();
      const realMetrics = dashboardData.metrics;

      // 서버별로 캐싱
      this.realMetricsCache.clear();
      const serverMetricsMap = new Map<string, ServerMetrics[]>();

      realMetrics.forEach(metric => {
        const serverId = metric.server_id || 'unknown';
        if (!serverMetricsMap.has(serverId)) {
          serverMetricsMap.set(serverId, []);
        }
        // common.ts ServerMetrics를 이 파일의 ServerMetrics로 변환
        const convertedMetric: ServerMetrics = {
          cpu: metric.cpu_usage || 0,
          memory: metric.memory_usage || 0,
          disk: metric.disk_usage || 0,
          network: metric.network_in || 0,
          timestamp: metric.timestamp.toISOString(),
          server_id: metric.server_id,
        };
        serverMetricsMap.get(serverId)!.push(convertedMetric);
      });

      this.realMetricsCache = serverMetricsMap;
      this.lastCacheUpdate = now;

      console.log(
        `📊 실제 메트릭 데이터 조회: ${realMetrics.length}개 레코드, ${serverMetricsMap.size}개 서버`
      );

      // 변환된 메트릭들을 평평하게 만들어서 반환
      const convertedMetrics: ServerMetrics[] = [];
      serverMetricsMap.forEach(metrics => convertedMetrics.push(...metrics));
      return convertedMetrics;
    } catch (error) {
      console.warn('⚠️ 실제 데이터 조회 실패, fallback 사용:', error);
      return this.generateFallbackMetrics(5); // 최소한의 fallback
    }
  }

  /**
   * 📊 실제 데이터 기반 고급 메트릭 생성
   */
  async generateAdvancedMetrics(
    serverCount: number = 8
  ): Promise<SimulationMetrics[]> {
    const startTime = Date.now();

    try {
      // 실제 서버 메트릭 조회
      const realMetrics = await this.getRealServerMetrics();

      if (realMetrics.length === 0) {
        console.warn('⚠️ 실제 메트릭 데이터가 없습니다. Fallback 사용');
        return this.generateFallbackSimulationMetrics(serverCount);
      }

      // 실제 데이터 기반 시뮬레이션 메트릭 생성
      const simulationMetrics: SimulationMetrics[] = [];
      const availableServers = [
        ...new Set(realMetrics.map(m => m.server_id).filter(Boolean)),
      ];

      for (
        let i = 0;
        i < Math.min(serverCount, availableServers.length || 8);
        i++
      ) {
        const serverId = availableServers[i] || `server-${i + 1}`;
        const serverMetrics = realMetrics.filter(m => m.server_id === serverId);

        let metrics: SimulationMetrics;

        if (serverMetrics.length > 0) {
          // 실제 데이터에서 최신 메트릭 사용 + 패턴 분석
          const latestMetric = serverMetrics[serverMetrics.length - 1];
          const pattern = this.analyzeMetricPattern(serverMetrics);

          metrics = {
            ...latestMetric,
            server_id: serverId,
            scenario: pattern.detectedScenario,
            confidence: pattern.confidence,
            data_source: 'real_database',
            timestamp: new Date().toISOString(),
          };
        } else {
          // 패턴 기반 추정
          metrics = this.generatePatternBasedMetrics(serverId, realMetrics);
        }

        simulationMetrics.push(metrics);
      }

      const processingTime = Date.now() - startTime;
      console.log(
        `🎯 실제 데이터 기반 메트릭 생성 완료: ${simulationMetrics.length}개 서버, ${processingTime}ms`
      );

      return simulationMetrics;
    } catch (error) {
      console.error('❌ 고급 메트릭 생성 실패:', error);
      return this.generateFallbackSimulationMetrics(serverCount);
    }
  }

  /**
   * 📈 메트릭 패턴 분석 (시나리오 추출)
   */
  private analyzeMetricPattern(serverMetrics: ServerMetrics[]): {
    detectedScenario: AdvancedScenario | undefined;
    confidence: number;
  } {
    if (serverMetrics.length < 2) {
      return { detectedScenario: undefined, confidence: 0.1 };
    }

    const recent = serverMetrics.slice(-5); // 최근 5개 샘플
    const avg = this.calculateAverage(recent);

    // 패턴 감지 로직
    let scenarioType: AdvancedScenario['type'] = 'normal';
    let severity: AdvancedScenario['severity'] = 'low';
    let confidence = 0.5;

    // CPU 스파이크 감지
    if (avg.cpu > 80) {
      scenarioType = 'load_spike';
      severity = avg.cpu > 95 ? 'critical' : avg.cpu > 90 ? 'high' : 'medium';
      confidence = Math.min((avg.cpu - 70) / 30, 1.0);
    }

    // 메모리 누수 패턴 감지
    else if (
      avg.memory > 85 &&
      this.detectIncreasingTrend(recent.map(m => m.memory))
    ) {
      scenarioType = 'memory_leak';
      severity = avg.memory > 95 ? 'critical' : 'high';
      confidence = Math.min((avg.memory - 80) / 20, 1.0);
    }

    // 디스크 문제 감지
    else if (avg.disk > 90) {
      scenarioType = 'disk_failure';
      severity = avg.disk > 98 ? 'critical' : 'high';
      confidence = Math.min((avg.disk - 85) / 15, 1.0);
    }

    // 네트워크 지연 감지
    else if (avg.network > 150) {
      scenarioType = 'network_latency';
      severity = avg.network > 200 ? 'high' : 'medium';
      confidence = Math.min((avg.network - 100) / 100, 1.0);
    }

    if (scenarioType === 'normal') {
      return { detectedScenario: undefined, confidence: 0.9 };
    }

    const detectedScenario: AdvancedScenario = {
      id: `pattern-${Date.now()}`,
      type: scenarioType,
      severity,
      affectedServers: [recent[0].server_id || 'unknown'],
      startTime: new Date(),
      duration: 15, // 15분 추정
      description: `실제 데이터에서 감지된 ${scenarioType} 패턴`,
      probability: confidence,
    };

    return { detectedScenario, confidence };
  }

  /**
   * 📊 평균 계산
   */
  private calculateAverage(metrics: ServerMetrics[]): ServerMetrics {
    const sum = metrics.reduce(
      (acc, m) => ({
        cpu: acc.cpu + m.cpu,
        memory: acc.memory + m.memory,
        disk: acc.disk + m.disk,
        network: acc.network + m.network,
        timestamp: acc.timestamp,
      }),
      { cpu: 0, memory: 0, disk: 0, network: 0, timestamp: '' }
    );

    return {
      cpu: sum.cpu / metrics.length,
      memory: sum.memory / metrics.length,
      disk: sum.disk / metrics.length,
      network: sum.network / metrics.length,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 📈 증가 트렌드 감지
   */
  private detectIncreasingTrend(values: number[]): boolean {
    if (values.length < 3) return false;

    let increasingCount = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[i - 1]) increasingCount++;
    }

    return increasingCount / (values.length - 1) > 0.6; // 60% 이상 증가
  }

  /**
   * 🎯 패턴 기반 메트릭 생성
   */
  private generatePatternBasedMetrics(
    serverId: string,
    allMetrics: ServerMetrics[]
  ): SimulationMetrics {
    if (allMetrics.length === 0) {
      return this.generateFallbackMetric(serverId);
    }

    // 전체 시스템 평균 기반 추정
    const systemAvg = this.calculateAverage(allMetrics);
    const variance = 0.1; // 10% 변동

    return {
      server_id: serverId,
      cpu: Math.max(0, systemAvg.cpu + (Math.random() - 0.5) * variance * 100),
      memory: Math.max(
        0,
        systemAvg.memory + (Math.random() - 0.5) * variance * 100
      ),
      disk: Math.max(
        0,
        systemAvg.disk + (Math.random() - 0.5) * variance * 100
      ),
      network: Math.max(
        0,
        systemAvg.network + (Math.random() - 0.5) * variance * 100
      ),
      timestamp: new Date().toISOString(),
      scenario: undefined,
      confidence: 0.6,
      data_source: 'pattern_analysis',
    };
  }

  /**
   * 🔄 Fallback 메트릭 생성 (최소한의 더미 데이터)
   */
  private generateFallbackSimulationMetrics(
    serverCount: number
  ): SimulationMetrics[] {
    console.log('⚠️ Fallback 메트릭 생성 사용');

    return Array.from({ length: serverCount }, (_, i) =>
      this.generateFallbackMetric(`server-${i + 1}`)
    );
  }

  private generateFallbackMetric(serverId: string): SimulationMetrics {
    return {
      server_id: serverId,
      cpu: 20 + Math.random() * 30, // 20-50% 범위
      memory: 30 + Math.random() * 30, // 30-60% 범위
      disk: 15 + Math.random() * 25, // 15-40% 범위
      network: 5 + Math.random() * 15, // 5-20% 범위
      timestamp: new Date().toISOString(),
      scenario: undefined,
      confidence: 0.3,
      data_source: 'fallback',
    };
  }

  private generateFallbackMetrics(count: number): ServerMetrics[] {
    return Array.from({ length: count }, (_, i) => ({
      server_id: `server-${i + 1}`,
      cpu: 20 + Math.random() * 30,
      memory: 30 + Math.random() * 30,
      disk: 15 + Math.random() * 25,
      network: 5 + Math.random() * 15,
      timestamp: new Date().toISOString(),
    }));
  }

  /**
   * 📊 실제 데이터 기반 활성 시나리오 반환
   */
  async getActiveScenarios(): Promise<AdvancedScenario[]> {
    try {
      const realMetrics = await this.getRealServerMetrics();
      const detectedScenarios: AdvancedScenario[] = [];

      // 서버별로 패턴 분석
      const serverGroups = new Map<string, ServerMetrics[]>();
      realMetrics.forEach(metric => {
        const serverId = metric.server_id || 'unknown';
        if (!serverGroups.has(serverId)) {
          serverGroups.set(serverId, []);
        }
        serverGroups.get(serverId)!.push(metric);
      });

      serverGroups.forEach((metrics, serverId) => {
        const pattern = this.analyzeMetricPattern(metrics);
        if (pattern.detectedScenario && pattern.confidence > 0.7) {
          detectedScenarios.push(pattern.detectedScenario);
        }
      });

      console.log(
        `🔍 실제 데이터에서 ${detectedScenarios.length}개 시나리오 감지`
      );
      return detectedScenarios;
    } catch (error) {
      console.warn('⚠️ 활성 시나리오 감지 실패:', error);
      return [];
    }
  }

  /**
   * 📋 현재 상태
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeScenarios: this.scenarios.length,
      timestamp: new Date().toISOString(),
      cacheStatus: {
        lastUpdate: this.lastCacheUpdate,
        serverCount: this.realMetricsCache.size,
        ttl: this.CACHE_TTL,
      },
      dataSource: 'real_database_integrated',
    };
  }

  /**
   * 🎯 분석 대상 서버 목록 반환
   */
  async getAnalysisTargets(): Promise<any[]> {
    const metrics = await this.generateAdvancedMetrics();
    return metrics.map((metric, index) => ({
      id: `server-${index + 1}`,
      name: `Server-${String(index + 1).padStart(2, '0')}`,
      status:
        metric.cpu > 80 ? 'critical' : metric.cpu > 60 ? 'warning' : 'healthy',
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
  async getIntegratedAIMetrics(): Promise<any> {
    const targets = await this.getAnalysisTargets();
    const totalServers = targets.length;
    const criticalServers = targets.filter(
      (s: any) => s.status === 'critical'
    ).length;
    const warningServers = targets.filter(
      (s: any) => s.status === 'warning'
    ).length;

    return {
      totalServers,
      criticalServers,
      warningServers,
      healthyServers: totalServers - criticalServers - warningServers,
      averageCpu: Math.round(
        targets.reduce((sum: number, s: any) => sum + s.cpu_usage, 0) /
          totalServers
      ),
      averageMemory: Math.round(
        targets.reduce((sum: number, s: any) => sum + s.memory_usage, 0) /
          totalServers
      ),
      activeScenarios: this.scenarios.length,
      timestamp: new Date().toISOString(),
    };
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
