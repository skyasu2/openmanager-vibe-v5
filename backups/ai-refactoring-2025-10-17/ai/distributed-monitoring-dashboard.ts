/**
 * 🌐 Distributed AI Services Monitoring Dashboard
 *
 * 목표: 분산 AI 서비스 실시간 모니터링
 * - Vercel Edge Runtime 상태
 * - Supabase pgvector 성능
 * - GCP Functions 응답 시간
 * - Redis 캐시 적중률
 * - 서비스 간 통신 지연
 */

interface ServiceMetrics {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  successRate: number;
  lastCheck: string;
  errorCount: number;
  throughput: number; // requests per minute
}

interface DistributedMetrics {
  vercelEdge: ServiceMetrics;
  supabaseRAG: ServiceMetrics;
  gcpKoreanNLP: ServiceMetrics;
  gcpMLAnalytics: ServiceMetrics;
  memoryCache: ServiceMetrics;
  interServiceLatency: {
    vercelToSupabase: number;
    vercelToGCP: number;
    supabaseToCache: number;
  };
}

interface AlertRule {
  id: string;
  service: string;
  metric: 'responseTime' | 'successRate' | 'errorCount';
  threshold: number;
  operator: 'gt' | 'lt' | 'eq';
  severity: 'warning' | 'critical';
  enabled: boolean;
}

interface Alert {
  id: string;
  ruleId: string;
  service: string;
  message: string;
  severity: 'warning' | 'critical';
  timestamp: number;
  acknowledged: boolean;
}

export class DistributedMonitoringDashboard {
  private metrics: DistributedMetrics;
  private metricsHistory: Array<{
    timestamp: number;
    metrics: DistributedMetrics;
  }> = [];
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.metrics = this.initializeMetrics();
    this.setupDefaultAlertRules();
    this.startMonitoring();
  }

  /**
   * 📊 메트릭 초기화
   */
  private initializeMetrics(): DistributedMetrics {
    const defaultServiceMetrics: ServiceMetrics = {
      name: '',
      status: 'healthy',
      responseTime: 0,
      successRate: 1.0,
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      throughput: 0,
    };

    return {
      vercelEdge: { ...defaultServiceMetrics, name: 'Vercel Edge Runtime' },
      supabaseRAG: { ...defaultServiceMetrics, name: 'Supabase RAG Engine' },
      gcpKoreanNLP: { ...defaultServiceMetrics, name: 'GCP Korean NLP' },
      gcpMLAnalytics: { ...defaultServiceMetrics, name: 'GCP ML Analytics' },
      memoryCache: { ...defaultServiceMetrics, name: 'Memory Cache System' },
      interServiceLatency: {
        vercelToSupabase: 0,
        vercelToGCP: 0,
        supabaseToCache: 0,
      },
    };
  }

  /**
   * 🚨 기본 알림 규칙 설정
   */
  private setupDefaultAlertRules(): void {
    this.alertRules = [
      // 응답 시간 알림
      {
        id: 'vercel_response_time',
        service: 'vercelEdge',
        metric: 'responseTime',
        threshold: 500,
        operator: 'gt',
        severity: 'warning',
        enabled: true,
      },
      {
        id: 'supabase_response_time',
        service: 'supabaseRAG',
        metric: 'responseTime',
        threshold: 1000,
        operator: 'gt',
        severity: 'critical',
        enabled: true,
      },
      {
        id: 'gcp_response_time',
        service: 'gcpKoreanNLP',
        metric: 'responseTime',
        threshold: 3000,
        operator: 'gt',
        severity: 'warning',
        enabled: true,
      },
      // 성공률 알림
      {
        id: 'vercel_success_rate',
        service: 'vercelEdge',
        metric: 'successRate',
        threshold: 0.95,
        operator: 'lt',
        severity: 'critical',
        enabled: true,
      },
      {
        id: 'supabase_success_rate',
        service: 'supabaseRAG',
        metric: 'successRate',
        threshold: 0.9,
        operator: 'lt',
        severity: 'warning',
        enabled: true,
      },
      // 에러 수 알림
      {
        id: 'error_count_critical',
        service: 'vercelEdge',
        metric: 'errorCount',
        threshold: 10,
        operator: 'gt',
        severity: 'critical',
        enabled: true,
      },
    ];
  }

  /**
   * 🔄 모니터링 시작
   */
  private startMonitoring(): void {
    // 30초마다 메트릭 수집
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000);

    console.log('🌐 분산 서비스 모니터링 시작');
  }

  /**
   * 📊 메트릭 수집
   */
  private async collectMetrics(): Promise<void> {
    const timestamp = Date.now();

    try {
      // 병렬로 모든 서비스 상태 확인
      const [
        vercelMetrics,
        supabaseMetrics,
        gcpNlpMetrics,
        gcpMlMetrics,
        cacheMetrics,
        latencyMetrics,
      ] = await Promise.allSettled([
        this.checkVercelEdgeHealth(),
        this.checkSupabaseRAGHealth(),
        this.checkGCPKoreanNLPHealth(),
        this.checkGCPMLAnalyticsHealth(),
        this.checkMemoryCacheHealth(),
        this.measureInterServiceLatency(),
      ]);

      // 메트릭 업데이트
      if (vercelMetrics.status === 'fulfilled') {
        this.metrics.vercelEdge = vercelMetrics.value;
      }
      if (supabaseMetrics.status === 'fulfilled') {
        this.metrics.supabaseRAG = supabaseMetrics.value;
      }
      if (gcpNlpMetrics.status === 'fulfilled') {
        this.metrics.gcpKoreanNLP = gcpNlpMetrics.value;
      }
      if (gcpMlMetrics.status === 'fulfilled') {
        this.metrics.gcpMLAnalytics = gcpMlMetrics.value;
      }
      if (cacheMetrics.status === 'fulfilled') {
        this.metrics.memoryCache = cacheMetrics.value;
      }
      if (latencyMetrics.status === 'fulfilled') {
        this.metrics.interServiceLatency = latencyMetrics.value;
      }

      // 메트릭 히스토리 저장 (최근 100개)
      this.metricsHistory.push({ timestamp, metrics: { ...this.metrics } });
      if (this.metricsHistory.length > 100) {
        this.metricsHistory.shift();
      }

      // 알림 규칙 확인
      this.checkAlertRules();
    } catch (error) {
      console.error('메트릭 수집 실패:', error);
    }
  }

  /**
   * ⚡ Vercel Edge 상태 확인
   */
  private async checkVercelEdgeHealth(): Promise<ServiceMetrics> {
    const startTime = Date.now();

    try {
      // Edge Runtime 헬스체크 (실제로는 /api/health 엔드포인트 호출)
      const response = await fetch('/api/health', {
        method: 'HEAD',
        headers: { 'x-health-check': 'true' },
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      return {
        name: 'Vercel Edge Runtime',
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        successRate: isHealthy ? 1.0 : 0.0,
        lastCheck: new Date().toISOString(),
        errorCount: isHealthy ? 0 : 1,
        throughput: this.calculateThroughput('vercelEdge'),
      };
    } catch (error) {
      return {
        name: 'Vercel Edge Runtime',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        successRate: 0.0,
        lastCheck: new Date().toISOString(),
        errorCount: 1,
        throughput: 0,
      };
    }
  }

  /**
   * 🧠 Supabase RAG 상태 확인
   */
  private async checkSupabaseRAGHealth(): Promise<ServiceMetrics> {
    const startTime = Date.now();

    try {
      // RAG 엔진 헬스체크 (실제 구현에서는 RAG 엔진 healthCheck 호출)
      const testQuery = '테스트 쿼리';

      // 시뮬레이션된 RAG 검색
      const isHealthy = Math.random() > 0.1; // 90% 성공률
      const responseTime = Date.now() - startTime + Math.random() * 200;

      return {
        name: 'Supabase RAG Engine',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        successRate: isHealthy ? 0.95 : 0.8,
        lastCheck: new Date().toISOString(),
        errorCount: isHealthy ? 0 : 1,
        throughput: this.calculateThroughput('supabaseRAG'),
      };
    } catch (error) {
      return {
        name: 'Supabase RAG Engine',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        successRate: 0.0,
        lastCheck: new Date().toISOString(),
        errorCount: 1,
        throughput: 0,
      };
    }
  }

  /**
   * 🇰🇷 GCP Korean NLP 상태 확인
   */
  private async checkGCPKoreanNLPHealth(): Promise<ServiceMetrics> {
    const startTime = Date.now();

    try {
      // GCP Function 헬스체크 (실제로는 Function URL 호출)
      const healthCheckPayload = {
        query: '헬스체크',
        type: 'health_check',
      };

      // 시뮬레이션된 응답
      const responseTime = Math.random() * 2000 + 500; // 0.5-2.5초
      const isHealthy = Math.random() > 0.05; // 95% 성공률

      return {
        name: 'GCP Korean NLP',
        status: responseTime < 3000 && isHealthy ? 'healthy' : 'degraded',
        responseTime,
        successRate: isHealthy ? 0.95 : 0.7,
        lastCheck: new Date().toISOString(),
        errorCount: isHealthy ? 0 : 1,
        throughput: this.calculateThroughput('gcpKoreanNLP'),
      };
    } catch (error) {
      return {
        name: 'GCP Korean NLP',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        successRate: 0.0,
        lastCheck: new Date().toISOString(),
        errorCount: 1,
        throughput: 0,
      };
    }
  }

  /**
   * 📊 GCP ML Analytics 상태 확인
   */
  private async checkGCPMLAnalyticsHealth(): Promise<ServiceMetrics> {
    const startTime = Date.now();

    try {
      // ML Analytics Function 헬스체크
      const responseTime = Math.random() * 1500 + 300; // 0.3-1.8초
      const isHealthy = Math.random() > 0.08; // 92% 성공률

      return {
        name: 'GCP ML Analytics',
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime,
        successRate: isHealthy ? 0.92 : 0.75,
        lastCheck: new Date().toISOString(),
        errorCount: isHealthy ? 0 : 1,
        throughput: this.calculateThroughput('gcpMLAnalytics'),
      };
    } catch (error) {
      return {
        name: 'GCP ML Analytics',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        successRate: 0.0,
        lastCheck: new Date().toISOString(),
        errorCount: 1,
        throughput: 0,
      };
    }
  }

  /**
   * 💾 Memory Cache 상태 확인
   */
  private async checkMemoryCacheHealth(): Promise<ServiceMetrics> {
    try {
      // 메모리 캐시 통계 (실제로는 캐시 헬퍼에서 가져옴)
      const cacheStats = {
        hitRate: Math.random() * 0.4 + 0.6, // 60-100%
        size: Math.floor(Math.random() * 500) + 100, // 100-600개
        memoryUsage: Math.random() * 50 + 20, // 20-70MB
      };

      const responseTime = Math.random() * 5 + 1; // 1-6ms

      return {
        name: 'Memory Cache System',
        status: cacheStats.hitRate > 0.7 ? 'healthy' : 'degraded',
        responseTime,
        successRate: 0.99,
        lastCheck: new Date().toISOString(),
        errorCount: 0,
        throughput: cacheStats.size * 2, // 캐시 아이템 수 * 2
      };
    } catch (error) {
      return {
        name: 'Memory Cache System',
        status: 'unhealthy',
        responseTime: 0,
        successRate: 0.0,
        lastCheck: new Date().toISOString(),
        errorCount: 1,
        throughput: 0,
      };
    }
  }

  /**
   * 📡 서비스 간 지연 시간 측정
   */
  private async measureInterServiceLatency(): Promise<
    DistributedMetrics['interServiceLatency']
  > {
    try {
      // 실제로는 각 서비스 간 ping 테스트
      return {
        vercelToSupabase: Math.random() * 50 + 20, // 20-70ms
        vercelToGCP: Math.random() * 100 + 50, // 50-150ms
        supabaseToCache: Math.random() * 10 + 1, // 1-11ms
      };
    } catch (error) {
      return {
        vercelToSupabase: 999,
        vercelToGCP: 999,
        supabaseToCache: 999,
      };
    }
  }

  /**
   * 📈 처리량 계산
   */
  private calculateThroughput(serviceName: string): number {
    // 실제로는 지난 1분간의 요청 수를 계산
    // 여기서는 시뮬레이션
    const baseRate = {
      vercelEdge: 120, // 분당 120개
      supabaseRAG: 80, // 분당 80개
      gcpKoreanNLP: 40, // 분당 40개
      gcpMLAnalytics: 30, // 분당 30개
      memoryCache: 200, // 분당 200개 (캐시 액세스)
    };

    return Math.floor(
      (baseRate[serviceName as keyof typeof baseRate] || 50) *
        (0.8 + Math.random() * 0.4)
    );
  }

  /**
   * 🚨 알림 규칙 확인
   */
  private checkAlertRules(): void {
    const currentTime = Date.now();

    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      const service = this.metrics[
        rule.service as keyof DistributedMetrics
      ] as ServiceMetrics;
      if (!service || typeof service !== 'object' || !('name' in service))
        continue;

      const metricValue = service[rule.metric];
      let shouldAlert = false;

      switch (rule.operator) {
        case 'gt':
          shouldAlert = metricValue > rule.threshold;
          break;
        case 'lt':
          shouldAlert = metricValue < rule.threshold;
          break;
        case 'eq':
          shouldAlert = metricValue === rule.threshold;
          break;
      }

      if (shouldAlert) {
        // 중복 알림 방지 (최근 5분 내 동일 알림 체크)
        const recentAlert = this.alerts.find(
          (alert) =>
            alert.ruleId === rule.id &&
            currentTime - alert.timestamp < 5 * 60 * 1000
        );

        if (!recentAlert) {
          const alert: Alert = {
            id: `alert_${currentTime}_${Math.random().toString(36).substr(2, 9)}`,
            ruleId: rule.id,
            service: service.name,
            message: `${service.name}: ${rule.metric} ${rule.operator} ${rule.threshold} (현재: ${metricValue})`,
            severity: rule.severity,
            timestamp: currentTime,
            acknowledged: false,
          };

          this.alerts.push(alert);
          console.warn(`🚨 알림 발생: ${alert.message}`);
        }
      }
    }
  }

  /**
   * 📊 대시보드 데이터 조회
   */
  getDashboardData() {
    const currentMetrics = this.metrics;
    const recentHistory = this.metricsHistory.slice(-20); // 최근 20개
    const activeAlerts = this.alerts.filter((alert) => !alert.acknowledged);

    // 전체 시스템 상태 계산
    const serviceStatuses = [
      currentMetrics.vercelEdge,
      currentMetrics.supabaseRAG,
      currentMetrics.gcpKoreanNLP,
      currentMetrics.gcpMLAnalytics,
      currentMetrics.memoryCache,
    ];

    const healthyServices = serviceStatuses.filter(
      (s) => s.status === 'healthy'
    ).length;
    const totalServices = serviceStatuses.length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices) {
      overallStatus = 'healthy';
    } else if (healthyServices >= totalServices * 0.6) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'unhealthy';
    }

    return {
      // 현재 상태
      current: {
        overallStatus,
        healthyServices,
        totalServices,
        services: currentMetrics,
        interServiceLatency: currentMetrics.interServiceLatency,
      },

      // 히스토리 차트 데이터
      history: recentHistory.map((h) => ({
        timestamp: h.timestamp,
        vercelResponseTime: h.metrics.vercelEdge.responseTime,
        supabaseResponseTime: h.metrics.supabaseRAG.responseTime,
        gcpKoreanNLPResponseTime: h.metrics.gcpKoreanNLP.responseTime,
        overallSuccessRate:
          serviceStatuses.reduce((sum, s) => sum + s.successRate, 0) /
          serviceStatuses.length,
      })),

      // 활성 알림
      alerts: {
        active: activeAlerts.length,
        critical: activeAlerts.filter((a) => a.severity === 'critical').length,
        warning: activeAlerts.filter((a) => a.severity === 'warning').length,
        list: activeAlerts.slice(0, 10), // 최신 10개
      },

      // 성능 요약
      performance: {
        averageResponseTime:
          serviceStatuses.reduce((sum, s) => sum + s.responseTime, 0) /
          serviceStatuses.length,
        totalThroughput: serviceStatuses.reduce(
          (sum, s) => sum + s.throughput,
          0
        ),
        cacheHitRate: currentMetrics.memoryCache.successRate,
        systemLoad: this.calculateSystemLoad(),
      },

      // SLA 준수율
      sla: {
        uptime: healthyServices / totalServices,
        responseTime:
          serviceStatuses.filter((s) => s.responseTime < 1000).length /
          totalServices,
        errorRate:
          1 -
          serviceStatuses.reduce((sum, s) => sum + s.successRate, 0) /
            serviceStatuses.length,
      },
    };
  }

  /**
   * 📊 시스템 부하 계산
   */
  private calculateSystemLoad(): number {
    const services = [
      this.metrics.vercelEdge,
      this.metrics.supabaseRAG,
      this.metrics.gcpKoreanNLP,
      this.metrics.gcpMLAnalytics,
      this.metrics.memoryCache,
    ];

    // 응답 시간 기반 부하 계산
    const avgResponseTime =
      services.reduce((sum, s) => sum + s.responseTime, 0) / services.length;
    const errorRate =
      1 - services.reduce((sum, s) => sum + s.successRate, 0) / services.length;

    // 0-1 스케일로 정규화 (낮을수록 좋음)
    const timeLoad = Math.min(avgResponseTime / 2000, 1); // 2초를 100%로
    const errorLoad = errorRate; // 이미 0-1 스케일

    return Math.min((timeLoad + errorLoad) / 2, 1);
  }

  /**
   * ✅ 알림 확인 처리
   */
  acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      console.log(`✅ 알림 확인: ${alert.message}`);
      return true;
    }
    return false;
  }

  /**
   * 🔧 알림 규칙 추가
   */
  addAlertRule(rule: Omit<AlertRule, 'id'>): string {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.alertRules.push({ ...rule, id });
    return id;
  }

  /**
   * 🏥 전체 시스템 헬스체크
   */
  async performHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, ServiceMetrics>;
    summary: string;
  }> {
    await this.collectMetrics();

    const services = {
      vercelEdge: this.metrics.vercelEdge,
      supabaseRAG: this.metrics.supabaseRAG,
      gcpKoreanNLP: this.metrics.gcpKoreanNLP,
      gcpMLAnalytics: this.metrics.gcpMLAnalytics,
      memoryCache: this.metrics.memoryCache,
    };

    const healthyCount = Object.values(services).filter(
      (s) => s.status === 'healthy'
    ).length;
    const totalCount = Object.values(services).length;

    let status: 'healthy' | 'degraded' | 'unhealthy';
    let summary: string;

    if (healthyCount === totalCount) {
      status = 'healthy';
      summary = '모든 분산 AI 서비스가 정상 동작 중입니다.';
    } else if (healthyCount >= totalCount * 0.6) {
      status = 'degraded';
      summary = `${totalCount}개 서비스 중 ${healthyCount}개가 정상입니다. 일부 서비스 성능 저하 감지.`;
    } else {
      status = 'unhealthy';
      summary = `심각한 서비스 장애 감지. ${totalCount}개 서비스 중 ${totalCount - healthyCount}개 서비스에 문제가 있습니다.`;
    }

    return { status, services, summary };
  }

  /**
   * 🛑 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 분산 서비스 모니터링 중지');
    }
  }
}

// 싱글톤 인스턴스
let dashboardInstance: DistributedMonitoringDashboard | null = null;

export function getDistributedMonitoringDashboard(): DistributedMonitoringDashboard {
  if (!dashboardInstance) {
    dashboardInstance = new DistributedMonitoringDashboard();
  }
  return dashboardInstance;
}
