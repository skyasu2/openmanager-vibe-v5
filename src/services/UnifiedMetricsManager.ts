/**
 * 🎯 통합 메트릭 관리자 - 중복 제거 및 Prometheus 통합
 *
 * 기존 문제점들:
 * - SimulationEngine, DataFlowManager, OptimizedDataGenerator 중복 동작
 * - 23개+ setInterval 분산 실행
 * - 서로 다른 데이터 소스 사용으로 인한 불일치
 *
 * 해결책:
 * - 단일 메트릭 관리자로 통합
 * - TimerManager 기반 중앙화된 스케줄링
 * - Prometheus 표준 메트릭 단일 소스
 * - 서버 모니터링 ↔ AI 에이전트 동일 데이터 보장
 */

import { timerManager } from '../utils/TimerManager';
// import { prometheusDataHub } from '../modules/prometheus-integration/PrometheusDataHub'; // 🗑️ 프로메테우스 제거
import { getDataGeneratorConfig } from '../config/environment';

// 전역 접근을 위한 설정
if (typeof globalThis !== 'undefined') {
  (globalThis as any).getDataGeneratorConfig = getDataGeneratorConfig;
}

// 통합된 서버 메트릭 인터페이스
export interface UnifiedServerMetrics {
  // 서버 기본 정보
  id: string;
  hostname: string;
  environment: 'production' | 'staging' | 'development';
  role: 'web' | 'api' | 'database' | 'cache' | 'worker';
  status: 'healthy' | 'warning' | 'critical';

  // Prometheus 표준 메트릭
  node_cpu_usage_percent: number;
  node_memory_usage_percent: number;
  node_disk_usage_percent: number;
  node_network_receive_rate_mbps: number;
  node_network_transmit_rate_mbps: number;
  node_uptime_seconds: number;

  // 애플리케이션 메트릭
  http_request_duration_seconds: number;
  http_requests_total: number;
  http_requests_errors_total: number;

  // 메타데이터
  timestamp: number;
  labels: Record<string, string>;

  // AI 분석 결과 (선택적)
  ai_analysis?: {
    prediction_score: number;
    anomaly_score: number;
    recommendation: string;
  };
}

// 시스템 설정
interface UnifiedMetricsConfig {
  // 메트릭 생성 설정
  generation: {
    enabled: boolean;
    interval_seconds: number;
    realistic_patterns: boolean;
    failure_scenarios: boolean;
  };

  // 🗑️ Prometheus 통합 제거됨
  // prometheus: {
  //   enabled: false,
  //   scraping_enabled: false,
  //   push_gateway_enabled: false,
  //   retention_days: 7,
  // },

  // AI 분석
  ai_analysis: {
    enabled: boolean;
    interval_seconds: number;
    python_engine_preferred: boolean;
    fallback_to_typescript: boolean;
  };

  // 자동 스케일링 시뮬레이션
  autoscaling: {
    enabled: boolean;
    min_servers: number;
    max_servers: number;
    target_cpu_percent: number;
    scale_interval_seconds: number;
  };

  // 성능 최적화
  performance: {
    memory_optimization: boolean;
    batch_processing: boolean;
    cache_enabled: boolean;
    parallel_processing: boolean;
  };
}

export class UnifiedMetricsManager {
  private static instance: UnifiedMetricsManager;
  private isRunning: boolean = false;
  private servers: Map<string, UnifiedServerMetrics> = new Map();

  // 기본 설정 (업계 표준)
  private config: UnifiedMetricsConfig = {
    generation: {
      enabled: true,
      interval_seconds: 15,
      realistic_patterns: true,
      failure_scenarios: true,
    },
    ai_analysis: {
      enabled: true,
      interval_seconds: 300,
      python_engine_preferred: false,
      fallback_to_typescript: true,
    },
    autoscaling: {
      enabled: true,
      min_servers: 3,
      max_servers: 20,
      target_cpu_percent: 70,
      scale_interval_seconds: 60,
    },
    performance: {
      memory_optimization: true,
      batch_processing: true,
      cache_enabled: true,
      parallel_processing: true,
    },
  };

  // 성능 메트릭
  private metrics = {
    total_updates: 0,
    last_update: Date.now(),
    avg_processing_time: 0,
    errors_count: 0,
    ai_analysis_count: 0,
    scaling_decisions: 0,
  };

  private constructor() {
    this.initializeServers();
  }

  static getInstance(): UnifiedMetricsManager {
    if (!this.instance) {
      this.instance = new UnifiedMetricsManager();
    }
    return this.instance;
  }

  /**
   * 🚀 통합 메트릭 관리자 시작
   */
  async start(): Promise<void> {
    // 클라이언트 사이드에서는 실행하지 않음
    if (typeof window !== 'undefined') {
      console.log('⚠️ 클라이언트 환경: UnifiedMetricsManager 시작 건너뛰기');
      return;
    }

    if (this.isRunning) {
      console.log('⚠️ 통합 메트릭 관리자가 이미 실행 중입니다');
      return;
    }

    console.log('🚀 통합 메트릭 관리자 시작...');

    try {
      // 1. 기존 중복 타이머들 정리
      await this.cleanupDuplicateTimers();

      // 2. Prometheus 데이터 허브 시작
      // if (this.config.prometheus.enabled) {
      //   // await prometheusDataHub.start();
      // }

      // 3. 통합 스케줄러 시작
      this.startUnifiedSchedulers();

      this.isRunning = true;
      console.log('✅ 통합 메트릭 관리자 시작 완료');
    } catch (error) {
      console.error('❌ 통합 메트릭 관리자 시작 실패:', error);
      throw error;
    }
  }

  /**
   * 🧹 기존 중복 타이머 정리
   */
  private async cleanupDuplicateTimers(): Promise<void> {
    console.log('🧹 기존 중복 타이머 정리 중...');

    // 알려진 중복 타이머 ID들
    const duplicateTimerIds = [
      'simulation-engine-update',
      'optimized-data-generator',
      'data-flow-generation',
      'data-flow-ai-analysis',
      'data-flow-autoscaling',
      'data-flow-performance',
      'server-dashboard-refresh',
      'websocket-data-generation',
      'smart-cache-cleanup',
      'memory-optimizer',
      'performance-monitor',
    ];

    // TimerManager에서 제거
    duplicateTimerIds.forEach(id => {
      timerManager.unregister(id);
    });

    console.log(`🧹 ${duplicateTimerIds.length}개 중복 타이머 정리 완료`);
  }

  /**
   * ⏰ 통합 스케줄러 시작
   */
  private startUnifiedSchedulers(): void {
    // 1. 메트릭 생성 스케줄러 - 🎯 데이터 생성기와 동기화 (15초 → 20초)
    if (this.config.generation.enabled) {
      timerManager.register({
        id: 'unified-metrics-generation',
        callback: async () => await this.generateMetrics(),
        interval: 20000, // 20초 (데이터 생성기와 동기화)
        priority: 'high',
        enabled: true,
      });
    }

    // 2. AI 분석 스케줄러 - 🎯 데이터 생성기 간격의 3배로 조정 (5분 → 60초)
    if (this.config.ai_analysis.enabled) {
      timerManager.register({
        id: 'unified-ai-analysis',
        callback: async () => {
          console.log('🤖 AI 분석 수행 중...');
          // await this.performAIAnalysis();
        },
        interval: 60000, // 60초 (데이터 생성기 20초의 3배)
        priority: 'medium',
        enabled: true,
      });
    }

    // 3. 자동 스케일링 스케줄러 - 🎯 데이터 생성기 간격의 4배로 조정 (60초 → 80초)
    if (this.config.autoscaling.enabled) {
      timerManager.register({
        id: 'unified-autoscaling',
        callback: async () => {
          console.log('⚖️ 자동 스케일링 수행 중...');
          // await this.performAutoscaling();
        },
        interval: 80000, // 80초 (데이터 생성기 20초의 4배)
        priority: 'medium',
        enabled: true,
      });
    }

    // 4. 성능 모니터링 스케줄러 - 🎯 데이터 생성기 간격의 6배로 조정 (120초 → 120초 유지)
    timerManager.register({
      id: 'unified-performance-monitor',
      callback: async () => await this.monitorPerformance(),
      interval: 120000, // 120초 (데이터 생성기 20초의 6배)
      priority: 'low',
      enabled: true,
    });

    console.log('⏰ 통합 스케줄러 시작 완료');
  }

  /**
   * 📊 초기 서버 데이터 생성
   */
  private initializeServers(): void {
    // 🔍 환경별 서버 수 동적 결정
    const dataGeneratorConfig = (
      globalThis as any
    ).getDataGeneratorConfig?.() || {
      maxServers: 16,
      defaultArchitecture: 'load-balanced',
    };

    const maxServers = dataGeneratorConfig.maxServers;
    const architecture = dataGeneratorConfig.defaultArchitecture;

    console.log(`🎯 ${maxServers}개 서버 생성 시작 (${architecture} 아키텍처)`);

    // 🏗️ 아키텍처별 서버 구성
    let serverConfigs: Array<{
      environment: string;
      role: string;
      count: number;
    }> = [];

    if (architecture === 'microservices' && maxServers >= 20) {
      // 마이크로서비스 아키텍처 (20개 이상)
      serverConfigs = [
        {
          environment: 'production',
          role: 'web',
          count: Math.floor(maxServers * 0.25),
        }, // 25%
        {
          environment: 'production',
          role: 'api',
          count: Math.floor(maxServers * 0.35),
        }, // 35%
        {
          environment: 'production',
          role: 'database',
          count: Math.floor(maxServers * 0.15),
        }, // 15%
        {
          environment: 'production',
          role: 'cache',
          count: Math.floor(maxServers * 0.1),
        }, // 10%
        {
          environment: 'staging',
          role: 'web',
          count: Math.floor(maxServers * 0.08),
        }, // 8%
        {
          environment: 'staging',
          role: 'api',
          count: Math.floor(maxServers * 0.07),
        }, // 7%
      ];
    } else if (architecture === 'load-balanced' && maxServers >= 12) {
      // 로드밸런스 아키텍처 (12개 이상)
      serverConfigs = [
        {
          environment: 'production',
          role: 'web',
          count: Math.floor(maxServers * 0.3),
        }, // 30%
        {
          environment: 'production',
          role: 'api',
          count: Math.floor(maxServers * 0.35),
        }, // 35%
        {
          environment: 'production',
          role: 'database',
          count: Math.floor(maxServers * 0.15),
        }, // 15%
        {
          environment: 'production',
          role: 'cache',
          count: Math.floor(maxServers * 0.1),
        }, // 10%
        {
          environment: 'staging',
          role: 'web',
          count: Math.floor(maxServers * 0.05),
        }, // 5%
        {
          environment: 'staging',
          role: 'api',
          count: Math.floor(maxServers * 0.05),
        }, // 5%
      ];
    } else {
      // 프라이머리-레플리카 아키텍처 (8개 이하) 또는 기본 구성
      const baseCount = Math.max(1, Math.floor(maxServers / 8));
      serverConfigs = [
        { environment: 'production', role: 'web', count: baseCount * 3 },
        { environment: 'production', role: 'api', count: baseCount * 2 },
        { environment: 'production', role: 'database', count: baseCount * 2 },
        { environment: 'production', role: 'cache', count: baseCount * 1 },
      ];
    }

    // 📊 실제 서버 생성
    let serverIndex = 1;
    let totalGenerated = 0;

    serverConfigs.forEach(({ environment, role, count }) => {
      for (let i = 0; i < count && totalGenerated < maxServers; i++) {
        const server = this.createServer(
          `server-${environment.slice(0, 4)}-${role}-${String(serverIndex).padStart(2, '0')}`,
          environment as any,
          role as any
        );
        this.servers.set(server.id, server);
        serverIndex++;
        totalGenerated++;
      }
    });

    // 🔄 부족한 서버 수 채우기 (기본 web 서버로)
    while (totalGenerated < maxServers) {
      const server = this.createServer(
        `server-auto-web-${String(serverIndex).padStart(2, '0')}`,
        'production' as any,
        'web' as any
      );
      this.servers.set(server.id, server);
      serverIndex++;
      totalGenerated++;
    }

    console.log(`📊 초기 서버 ${this.servers.size}개 생성 완료`);
    console.log(`🏗️ 아키텍처: ${architecture}`);
    console.log(`🎯 목표: ${maxServers}개, 실제 생성: ${totalGenerated}개`);
  }

  /**
   * 🏗️ 서버 메트릭 생성
   */
  private createServer(
    id: string,
    environment: UnifiedServerMetrics['environment'],
    role: UnifiedServerMetrics['role']
  ): UnifiedServerMetrics {
    const now = Date.now();

    return {
      id,
      hostname: id,
      environment,
      role,
      status: 'healthy',

      // 기본 메트릭 (현실적 범위)
      node_cpu_usage_percent: this.generateRealisticValue(20, 80, role),
      node_memory_usage_percent: this.generateRealisticValue(30, 85, role),
      node_disk_usage_percent: this.generateRealisticValue(10, 70, role),
      node_network_receive_rate_mbps: this.generateRealisticValue(1, 100, role),
      node_network_transmit_rate_mbps: this.generateRealisticValue(
        1,
        100,
        role
      ),
      node_uptime_seconds: Math.floor(Math.random() * 30 * 24 * 3600), // 최대 30일

      // 애플리케이션 메트릭
      http_request_duration_seconds:
        this.generateRealisticValue(0.1, 2.0, role) / 1000,
      http_requests_total: Math.floor(Math.random() * 10000),
      http_requests_errors_total: Math.floor(Math.random() * 100),

      timestamp: now,
      labels: {
        environment,
        role,
        cluster: 'openmanager-v5',
        version: '5.11.0',
      },
    };
  }

  /**
   * 📊 현실적 메트릭 값 생성
   */
  private generateRealisticValue(
    min: number,
    max: number,
    role: string
  ): number {
    const baseValue = min + Math.random() * (max - min);

    // 역할별 특성 반영
    const roleMultipliers = {
      database: 1.3, // DB 서버는 부하가 높음
      api: 1.1, // API 서버도 약간 높음
      web: 0.9, // 웹 서버는 보통
      cache: 0.8, // 캐시 서버는 낮음
      worker: 1.2, // 워커는 높음
    };

    const multiplier =
      roleMultipliers[role as keyof typeof roleMultipliers] || 1.0;

    // 시간대별 패턴 (간단한 사인 곡선)
    const hour = new Date().getHours();
    const timePattern = 0.8 + 0.4 * Math.sin(((hour - 6) * Math.PI) / 12); // 오후 2시 피크

    return Math.round(baseValue * multiplier * timePattern * 100) / 100;
  }

  /**
   * 📊 메트릭 생성 및 업데이트
   */
  private async generateMetrics(): Promise<void> {
    const startTime = Date.now();

    try {
      const updatedServers: UnifiedServerMetrics[] = [];

      // 모든 서버 메트릭 업데이트
      for (const [id, server] of this.servers) {
        const updated = await this.updateServerMetrics(server);
        this.servers.set(id, updated);
        updatedServers.push(updated);
      }

      // 자동 스케일링 시뮬레이션
      if (this.config.autoscaling.enabled) {
        await this.simulateAutoscaling(updatedServers);
      }

      // Prometheus 허브로 전송
      // if (this.config.prometheus.enabled) {
      //   // await this.sendToPrometheusHub(updatedServers);
      // }

      // 성능 메트릭 업데이트
      this.updatePerformanceMetrics(startTime);

      console.log(
        `📊 메트릭 생성 완료: ${updatedServers.length}개 서버, ${Date.now() - startTime}ms`
      );
    } catch (error) {
      console.error('❌ 메트릭 생성 실패:', error);
      this.metrics.errors_count++;
    }
  }

  /**
   * 🔄 서버 메트릭 업데이트
   */
  private async updateServerMetrics(
    server: UnifiedServerMetrics
  ): Promise<UnifiedServerMetrics> {
    const updated = { ...server };

    // 메트릭 값들을 현실적으로 변동
    updated.node_cpu_usage_percent = this.applyVariation(
      server.node_cpu_usage_percent,
      0.95,
      1.05, // ±5% 변동
      5,
      95 // 5-95% 범위
    );

    updated.node_memory_usage_percent = this.applyVariation(
      server.node_memory_usage_percent,
      0.98,
      1.02, // ±2% 변동 (메모리는 안정적)
      10,
      90
    );

    updated.node_disk_usage_percent = this.applyVariation(
      server.node_disk_usage_percent,
      1.0,
      1.001, // 거의 변동 없음 (디스크는 천천히 증가)
      0,
      95
    );

    // 네트워크는 더 큰 변동
    updated.node_network_receive_rate_mbps = this.applyVariation(
      server.node_network_receive_rate_mbps,
      0.7,
      1.5, // ±30% 변동
      0.1,
      1000
    );

    updated.node_network_transmit_rate_mbps = this.applyVariation(
      server.node_network_transmit_rate_mbps,
      0.7,
      1.5,
      0.1,
      1000
    );

    // 업타임 증가
    updated.node_uptime_seconds += this.config.generation.interval_seconds;

    // HTTP 메트릭 업데이트
    const requestIncrement = Math.floor(Math.random() * 100);
    updated.http_requests_total += requestIncrement;

    if (Math.random() < 0.05) {
      // 5% 확률로 에러 발생
      updated.http_requests_errors_total += Math.floor(Math.random() * 5);
    }

    // 응답 시간 (CPU 사용률과 연관)
    updated.http_request_duration_seconds =
      0.05 + (updated.node_cpu_usage_percent / 100) * 0.5;

    // 서버 상태 결정
    updated.status = this.determineServerStatus(updated);

    // 타임스탬프 업데이트
    updated.timestamp = Date.now();

    return updated;
  }

  /**
   * 📈 값 변동 적용
   */
  private applyVariation(
    currentValue: number,
    minMultiplier: number,
    maxMultiplier: number,
    min: number,
    max: number
  ): number {
    const multiplier =
      minMultiplier + Math.random() * (maxMultiplier - minMultiplier);
    const newValue = currentValue * multiplier;
    return Math.max(min, Math.min(max, Math.round(newValue * 100) / 100));
  }

  /**
   * 🚨 서버 상태 결정
   */
  private determineServerStatus(
    server: UnifiedServerMetrics
  ): 'healthy' | 'warning' | 'critical' {
    const cpu = server.node_cpu_usage_percent;
    const memory = server.node_memory_usage_percent;
    const responseTime = server.http_request_duration_seconds;

    // Critical 조건
    if (cpu > 90 || memory > 95 || responseTime > 5.0) {
      return 'critical';
    }

    // Warning 조건
    if (cpu > 75 || memory > 85 || responseTime > 2.0) {
      return 'warning';
    }

    return 'healthy';
  }

  /**
   * 🤖 AI 분석 수행
   */
  private async performAIAnalysis(): Promise<void> {
    if (!this.isRunning || !this.config.ai_analysis.enabled) return;

    try {
      const servers = Array.from(this.servers.values());
      // await this.analyzeWithAI(servers);
      console.log('🤖 AI 분석 기능 일시 비활성화 (데모용)');
      this.metrics.ai_analysis_count++;
    } catch (error) {
      console.error('❌ AI 분석 실패:', error);
      this.metrics.errors_count++;
    }
  }

  /**
   * 📊 기본 분석 수행 (TypeScript 폴백)
   */
  private performBasicAnalysis(servers: UnifiedServerMetrics[]): any {
    const totalServers = servers.length;
    const avgCpu =
      servers.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) /
      totalServers;
    const avgMemory =
      servers.reduce((sum, s) => sum + s.node_memory_usage_percent, 0) /
      totalServers;
    const criticalServers = servers.filter(s => s.status === 'critical').length;

    return {
      analysis: 'typescript_basic',
      server_count: totalServers,
      avg_cpu: avgCpu.toFixed(1),
      avg_memory: avgMemory.toFixed(1),
      critical_servers: criticalServers,
      health_score: (
        ((totalServers - criticalServers) / totalServers) *
        100
      ).toFixed(1),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 💡 추천사항 생성
   */
  private generateRecommendation(server: UnifiedServerMetrics): string {
    if (server.node_cpu_usage_percent > 80) {
      return 'CPU 사용률이 높습니다. 스케일 아웃을 고려하세요.';
    }
    if (server.node_memory_usage_percent > 85) {
      return '메모리 사용률이 높습니다. 메모리 최적화가 필요합니다.';
    }
    if (server.http_request_duration_seconds > 2.0) {
      return '응답 시간이 느립니다. 성능 튜닝이 필요합니다.';
    }
    return '정상 상태입니다.';
  }

  /**
   * ⚖️ 자동 스케일링 시뮬레이션
   */
  private async simulateAutoscaling(
    servers: UnifiedServerMetrics[]
  ): Promise<void> {
    const avgCpu =
      servers.reduce((sum, s) => sum + s.node_cpu_usage_percent, 0) /
      servers.length;
    const currentCount = servers.length;

    let action = 'maintain';
    let targetCount = currentCount;

    // 스케일 아웃 조건
    if (
      avgCpu > this.config.autoscaling.target_cpu_percent &&
      currentCount < this.config.autoscaling.max_servers
    ) {
      action = 'scale_out';
      targetCount = Math.min(
        currentCount + 1,
        this.config.autoscaling.max_servers
      );
    }

    // 스케일 인 조건
    if (
      avgCpu < this.config.autoscaling.target_cpu_percent * 0.5 &&
      currentCount > this.config.autoscaling.min_servers
    ) {
      action = 'scale_in';
      targetCount = Math.max(
        currentCount - 1,
        this.config.autoscaling.min_servers
      );
    }

    if (action !== 'maintain') {
      console.log(
        `⚖️ 자동 스케일링: ${action} (${currentCount} → ${targetCount})`
      );
      this.metrics.scaling_decisions++;

      // 실제 서버 추가/제거 시뮬레이션
      if (action === 'scale_out') {
        const newServer = this.createServer(
          `server-auto-${Date.now()}`,
          'production',
          'web'
        );
        this.servers.set(newServer.id, newServer);
      } else if (action === 'scale_in') {
        // 가장 오래된 서버 제거
        const serverIds = Array.from(this.servers.keys());
        if (serverIds.length > this.config.autoscaling.min_servers) {
          this.servers.delete(serverIds[serverIds.length - 1]);
        }
      }
    }
  }

  /**
   * 📊 Prometheus 허브로 메트릭 전송
   */
  // private async sendToPrometheusHub(
  //   servers: UnifiedServerMetrics[]
  // ): Promise<void> {
  //   try {
  //     const prometheusMetrics = servers.map(server => ({
  //       name: 'openmanager_server_metrics',
  //       type: 'gauge' as const,
  //       help: 'OpenManager server metrics',
  //       labels: {
  //         ...server.labels,
  //         server_id: server.id,
  //         hostname: server.hostname,
  //       },
  //       value: server.node_cpu_usage_percent,
  //       timestamp: server.timestamp,
  //     }));

  //     // Prometheus 허브로 전송 (비활성화됨)
  //     // await prometheusDataHub.storeMetrics(prometheusMetrics);
  //     console.log(`📊 ${prometheusMetrics.length}개 메트릭 Prometheus 전송 완료`);
  //   } catch (error) {
  //     console.error('❌ Prometheus 허브 전송 실패:', error);
  //     this.metrics.errors_count++;
  //   }
  // }

  /**
   * 📈 성능 모니터링
   */
  private async monitorPerformance(): Promise<void> {
    const memoryUsage = process.memoryUsage();

    console.log('📈 통합 메트릭 관리자 성능:', {
      servers_count: this.servers.size,
      total_updates: this.metrics.total_updates,
      avg_processing_time: this.metrics.avg_processing_time.toFixed(2) + 'ms',
      errors_count: this.metrics.errors_count,
      ai_analysis_count: this.metrics.ai_analysis_count,
      scaling_decisions: this.metrics.scaling_decisions,
      memory_heap_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      memory_external_mb: Math.round(memoryUsage.external / 1024 / 1024),
    });
  }

  /**
   * 📊 성능 메트릭 업데이트
   */
  private updatePerformanceMetrics(startTime: number): void {
    const processingTime = Date.now() - startTime;
    this.metrics.total_updates++;
    this.metrics.avg_processing_time =
      (this.metrics.avg_processing_time * (this.metrics.total_updates - 1) +
        processingTime) /
      this.metrics.total_updates;
    this.metrics.last_update = Date.now();
  }

  /**
   * 🛑 통합 메트릭 시스템 중지
   */
  stop(): void {
    if (!this.isRunning) return;

    console.log('🛑 통합 메트릭 관리자 중지...');

    // 모든 타이머 해제
    timerManager.unregister('unified-metrics-generation');
    timerManager.unregister('unified-ai-analysis');
    timerManager.unregister('unified-autoscaling');
    timerManager.unregister('unified-performance-monitor');

    // Prometheus 허브 중지
    // await prometheusDataHub.stop();

    this.isRunning = false;
    console.log('🛑 통합 메트릭 관리자 중지 완료');
  }

  /**
   * 📊 현재 상태 조회
   */
  getStatus(): any {
    // 클라이언트 사이드에서는 기본 상태 반환
    if (typeof window !== 'undefined') {
      return {
        isRunning: false,
        servers_count: 0,
        environment: 'client',
        performance_metrics: {
          last_update: Date.now(),
        },
      };
    }

    try {
      return {
        isRunning: this.isRunning,
        servers_count: this.servers.size,
        current_config: this.config,
        performance_metrics: this.metrics,
        last_update: Date.now(),
      };
    } catch (error) {
      console.warn('⚠️ 상태 조회 실패:', error);
      return {
        isRunning: false,
        servers_count: 0,
        error: true,
      };
    }
  }

  /**
   * 📋 서버 목록 조회 (ServerDashboard 호환)
   */
  getServers(): any[] {
    // 클라이언트 사이드에서는 빈 배열 반환
    if (typeof window !== 'undefined') {
      console.log('⚠️ 클라이언트 환경: 빈 서버 목록 반환');
      return [];
    }

    try {
      // 서버가 비어있으면 초기화 재시도
      if (this.servers.size === 0) {
        console.log('📊 서버 목록이 비어있음. 재초기화 시도...');
        this.initializeServers();
      }

      const serverList = Array.from(this.servers.values()).map(server => ({
        ...server,
        environment: server.environment || 'development',
        // ServerDashboard 호환성을 위한 추가 필드
        cpu_usage: server.node_cpu_usage_percent,
        memory_usage: server.node_memory_usage_percent,
        disk_usage: server.node_disk_usage_percent,
        response_time: server.http_request_duration_seconds * 1000,
        uptime: server.node_uptime_seconds / 3600, // 시간 단위로 변환
        last_updated: new Date(server.timestamp).toISOString(),
      }));

      console.log(`📋 서버 목록 조회 성공: ${serverList.length}개 서버`);
      return serverList;
    } catch (error) {
      console.warn('⚠️ 서버 목록 조회 실패, 기본 데이터 생성:', error);

      // 실패시 기본 서버 데이터 생성
      return this.generateFallbackServers();
    }
  }

  /**
   * 🆘 Fallback 서버 데이터 생성
   */
  private generateFallbackServers(): any[] {
    console.log('🆘 Fallback 서버 데이터 생성 중...');

    const fallbackServers = Array.from({ length: 16 }, (_, i) => {
      const serverTypes = ['web', 'api', 'database', 'cache'];
      const environments = ['production', 'staging'];
      const serverType = serverTypes[i % serverTypes.length];
      const environment = environments[i % environments.length];
      const serverNum = Math.floor(i / serverTypes.length) + 1;

      const baseId = `${serverType}-${environment.slice(0, 4)}-${String(serverNum).padStart(2, '0')}`;
      const timestamp = Date.now();

      return {
        id: baseId,
        hostname: baseId,
        environment,
        role: serverType,
        status: i < 12 ? 'healthy' : i < 14 ? 'warning' : 'critical',

        // Prometheus 표준 메트릭
        node_cpu_usage_percent: 20 + Math.random() * 60,
        node_memory_usage_percent: 30 + Math.random() * 50,
        node_disk_usage_percent: 40 + Math.random() * 40,
        node_network_receive_rate_mbps: 1 + Math.random() * 99,
        node_network_transmit_rate_mbps: 1 + Math.random() * 99,
        node_uptime_seconds: 24 * 3600 * (1 + Math.random() * 30),
        http_request_duration_seconds: (50 + Math.random() * 200) / 1000,
        http_requests_total: Math.floor(Math.random() * 10000),
        http_requests_errors_total: Math.floor(Math.random() * 100),

        // ServerDashboard 호환 필드
        cpu_usage: 20 + Math.random() * 60,
        memory_usage: 30 + Math.random() * 50,
        disk_usage: 40 + Math.random() * 40,
        response_time: 50 + Math.random() * 200,
        uptime: 24 * (1 + Math.random() * 30),
        last_updated: new Date(timestamp).toISOString(),

        timestamp,
        labels: {
          environment,
          role: serverType,
          cluster: 'openmanager-v5',
          version: '5.12.0',
          fallback: 'true',
        },
      };
    });

    console.log(
      `✅ Fallback 서버 데이터 생성 완료: ${fallbackServers.length}개`
    );
    return fallbackServers;
  }

  /**
   * 🔧 설정 업데이트
   */
  updateConfig(newConfig: Partial<UnifiedMetricsConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('🔧 통합 메트릭 관리자 설정 업데이트됨');
  }

  /**
   * ⚖️ 자동 스케일링 수행
   */
  private async performAutoscaling(): Promise<void> {
    if (!this.isRunning || !this.config.autoscaling.enabled) return;

    try {
      const servers = Array.from(this.servers.values());
      await this.simulateAutoscaling(servers);
    } catch (error) {
      console.error('❌ 자동 스케일링 실패:', error);
      this.metrics.errors_count++;
    }
  }
}

// 싱글톤 인스턴스
export const unifiedMetricsManager = UnifiedMetricsManager.getInstance();
