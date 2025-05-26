/**
 * System Health Checker
 * 
 * 🏥 시스템 상태 자동 진단 및 복구
 * - 서버 데이터 가용성 체크
 * - 자동 재시도 및 복구 로직
 * - 다단계 fallback 시스템
 */

export interface HealthCheckResult {
  isHealthy: boolean;
  serverCount: number;
  dataSource: 'api' | 'fallback' | 'none';
  lastCheck: Date;
  issues: string[];
  actions: string[];
  statisticalAnalysis?: StatisticalAnalysis;
  anomalies?: AnomalyDetection[];
}

export interface StatisticalAnalysis {
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgDiskUsage: number;
  avgResponseTime: number;
  totalAlerts: number;
  serverStatusDistribution: Record<string, number>;
  providerDistribution: Record<string, number>;
  healthScore: number; // 0-100
  trends: {
    cpuTrend: 'increasing' | 'decreasing' | 'stable';
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    alertTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface AnomalyDetection {
  id: string;
  type: 'performance' | 'availability' | 'resource' | 'pattern';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedServers: string[];
  metrics: {
    current: number;
    baseline: number;
    deviation: number;
    threshold: number;
  };
  recommendation: string;
  detectedAt: Date;
}

export interface RecoveryOptions {
  maxRetries?: number;
  retryDelayMs?: number;
  forceInit?: boolean;
  generateFallback?: boolean;
}

export class SystemHealthChecker {
  private static instance: SystemHealthChecker;
  private lastHealthCheck?: HealthCheckResult;
  private metricsHistory: StatisticalAnalysis[] = [];
  private baselineMetrics?: StatisticalAnalysis;
  
  public static getInstance(): SystemHealthChecker {
    if (!this.instance) {
      this.instance = new SystemHealthChecker();
    }
    return this.instance;
  }

  private constructor() {}

  /**
   * 종합 시스템 헬스체크 실행
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    console.log('🏥 Starting system health check...');
    
    const result: HealthCheckResult = {
      isHealthy: false,
      serverCount: 0,
      dataSource: 'none',
      lastCheck: new Date(),
      issues: [],
      actions: []
    };

    try {
      // 1. API 서버 데이터 확인
      const apiCheck = await this.checkAPIServers();
      result.serverCount = apiCheck.count;
      
      if (apiCheck.success && apiCheck.count > 0) {
        result.isHealthy = true;
        result.dataSource = apiCheck.isFallback ? 'fallback' : 'api';
        
        if (apiCheck.isFallback) {
          result.issues.push('Using fallback servers - real data generation may not be working');
          result.actions.push('Check data generator status');
        }
      } else {
        result.issues.push('No servers found via API');
        result.actions.push('Trigger data generation and server registration');
      }

      // 2. DataGenerator 상태 확인
      const generatorCheck = await this.checkDataGenerator();
      if (!generatorCheck.isRunning) {
        result.issues.push('Data generator is not running');
        result.actions.push('Start data generation');
      }

      // 3. ServerDataCollector 상태 확인
      const collectorCheck = await this.checkServerCollector();
      if (collectorCheck.serverCount === 0) {
        result.issues.push('No servers registered in collector');
        result.actions.push('Register servers to collector');
      }

      // 4. 📊 통계 기반 이상 징후 감지
      if (result.serverCount > 0) {
        try {
          const statisticalAnalysis = await this.performStatisticalAnalysis();
          const anomalies = await this.detectAnomalies(statisticalAnalysis);
          
          result.statisticalAnalysis = statisticalAnalysis;
          result.anomalies = anomalies;
          
          // 베이스라인 설정 (최초 실행 시)
          if (!this.baselineMetrics && statisticalAnalysis.healthScore > 70) {
            this.baselineMetrics = statisticalAnalysis;
            console.log('📊 Baseline metrics established');
          }
          
          // 히스토리 관리 (최근 10개만 유지)
          this.metricsHistory.push(statisticalAnalysis);
          if (this.metricsHistory.length > 10) {
            this.metricsHistory.shift();
          }
          
          // 이상 징후 발견 시 이슈 추가
          if (anomalies.length > 0) {
            const criticalAnomalies = anomalies.filter(a => a.severity === 'critical' || a.severity === 'high');
            if (criticalAnomalies.length > 0) {
              result.issues.push(`${criticalAnomalies.length} critical performance anomalies detected`);
              result.actions.push('Review performance anomalies and take corrective action');
            }
          }
          
          // 헬스 스코어 기반 전체 상태 조정
          if (statisticalAnalysis.healthScore < 50) {
            result.isHealthy = false;
            result.issues.push(`Overall health score is low: ${statisticalAnalysis.healthScore.toFixed(1)}/100`);
            result.actions.push('Investigate servers with poor performance metrics');
          }
          
        } catch (error) {
          console.error('📊 Statistical analysis failed:', error);
          result.issues.push('Statistical analysis failed');
        }
      }

      console.log(`🎯 Health check complete: ${result.isHealthy ? 'HEALTHY' : 'ISSUES'} (${result.serverCount} servers, Health Score: ${result.statisticalAnalysis?.healthScore.toFixed(1) || 'N/A'})`);
      this.lastHealthCheck = result;
      
    } catch (error) {
      result.issues.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('❌ Health check error:', error);
    }

    return result;
  }

  /**
   * 자동 시스템 복구 실행
   */
  async performAutoRecovery(options: RecoveryOptions = {}): Promise<HealthCheckResult> {
    const {
      maxRetries = 3,
      retryDelayMs = 2000,
      forceInit = true,
      generateFallback = true
    } = options;

    console.log('🔧 Starting auto recovery process...');
    
    let lastResult: HealthCheckResult | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`📡 Recovery attempt ${attempt}/${maxRetries}`);
      
      try {
        // 1. 먼저 헬스체크
        lastResult = await this.performHealthCheck();
        
        if (lastResult.isHealthy) {
          console.log('✅ System recovered successfully!');
          return lastResult;
        }

        // 2. 복구 액션 실행
        if (attempt === 1) {
          // 첫 번째 시도: 일반적인 데이터 생성
          console.log('📊 Triggering data generator...');
          await this.triggerDataGenerator();
          await this.sleep(retryDelayMs);
        }
        
        if (attempt === 2 && forceInit) {
          // 두 번째 시도: 강제 초기화
          console.log('🚀 Triggering force initialization...');
          await this.triggerForceInit();
          await this.sleep(retryDelayMs);
        }
        
        if (attempt === 3 && generateFallback) {
          // 세 번째 시도: 강제 서버 등록
          console.log('🔗 Force registering servers...');
          await this.forceRegisterServers();
          await this.sleep(retryDelayMs);
        }
        
      } catch (error) {
        console.error(`❌ Recovery attempt ${attempt} failed:`, error);
        if (lastResult) {
          lastResult.issues.push(`Recovery attempt ${attempt} failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }

    console.log('⚠️ Auto recovery completed with remaining issues');
    return lastResult || {
      isHealthy: false,
      serverCount: 0,
      dataSource: 'none',
      lastCheck: new Date(),
      issues: ['Auto recovery failed'],
      actions: ['Manual intervention required']
    };
  }

  /**
   * API 서버 데이터 확인
   */
  private async checkAPIServers(): Promise<{ success: boolean; count: number; isFallback: boolean }> {
    try {
      const response = await fetch('/api/servers');
      if (!response.ok) {
        return { success: false, count: 0, isFallback: false };
      }
      
      const data = await response.json();
      const servers = data.servers || [];
      const isFallback = data.source === 'fallback' || servers.some((s: any) => s.id?.startsWith('fallback-'));
      
      return {
        success: servers.length > 0,
        count: servers.length,
        isFallback
      };
    } catch (error) {
      console.error('API servers check failed:', error);
      return { success: false, count: 0, isFallback: false };
    }
  }

  /**
   * DataGenerator 상태 확인
   */
  private async checkDataGenerator(): Promise<{ isRunning: boolean; startTime?: Date }> {
    try {
      const response = await fetch('/api/data-generator');
      if (!response.ok) {
        return { isRunning: false };
      }
      
      const data = await response.json();
      return {
        isRunning: data.isGenerating || false,
        startTime: data.startTime ? new Date(data.startTime) : undefined
      };
    } catch (error) {
      console.error('Data generator check failed:', error);
      return { isRunning: false };
    }
  }

  /**
   * ServerDataCollector 상태 확인
   */
  private async checkServerCollector(): Promise<{ serverCount: number }> {
    try {
      // 서버 사이드에서만 확인 가능
      if (typeof window !== 'undefined') {
        return { serverCount: 0 };
      }

      const { serverRegistrationService } = await import('./ServerRegistrationService');
      const count = await serverRegistrationService.getRegisteredServerCount();
      
      return { serverCount: count };
    } catch (error) {
      console.error('Server collector check failed:', error);
      return { serverCount: 0 };
    }
  }

  /**
   * 데이터 생성기 트리거
   */
  private async triggerDataGenerator(): Promise<void> {
    try {
      const response = await fetch('/api/data-generator', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Data generator trigger failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to trigger data generator:', error);
      throw error;
    }
  }

  /**
   * 강제 초기화 트리거
   */
  private async triggerForceInit(): Promise<void> {
    try {
      const response = await fetch('/api/simulate/force-init', { method: 'POST' });
      if (!response.ok) {
        throw new Error(`Force init failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to trigger force init:', error);
      throw error;
    }
  }

  /**
   * 강제 서버 등록
   */
  private async forceRegisterServers(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        console.log('Client-side: cannot force register servers');
        return;
      }

      const { serverRegistrationService } = await import('./ServerRegistrationService');
      const result = await serverRegistrationService.forceReregister();
      
      if (!result.success) {
        throw new Error(`Force registration failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to force register servers:', error);
      throw error;
    }
  }

  /**
   * 대기 함수
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 마지막 헬스체크 결과 조회
   */
  getLastHealthCheck(): HealthCheckResult | undefined {
    return this.lastHealthCheck;
  }

  /**
   * 빠른 상태 체크 (캐시된 결과 우선)
   */
  async quickHealthCheck(): Promise<HealthCheckResult> {
    if (this.lastHealthCheck && (Date.now() - this.lastHealthCheck.lastCheck.getTime()) < 30000) {
      return this.lastHealthCheck;
    }
    return this.performHealthCheck();
  }

  // 📊 통계 기반 분석 메서드들

  /**
   * 📊 서버 메트릭 통계 분석
   */
  private async performStatisticalAnalysis(): Promise<StatisticalAnalysis> {
    try {
      // 서버 데이터 수집
      const response = await fetch('/api/servers');
      if (!response.ok) {
        throw new Error(`Failed to fetch servers: ${response.status}`);
      }
      
      const data = await response.json();
      const servers = data.data?.servers || [];
      
      if (servers.length === 0) {
        throw new Error('No servers available for analysis');
      }

      // 메트릭 계산
      const cpuValues = servers.map((s: any) => s.metrics?.cpu || 0);
      const memoryValues = servers.map((s: any) => s.metrics?.memory || 0);
      const diskValues = servers.map((s: any) => s.metrics?.disk || 0);
      const responseTimeValues = servers.map((s: any) => s.metrics?.network?.latency || 0);
      
      const avgCpuUsage = this.calculateAverage(cpuValues);
      const avgMemoryUsage = this.calculateAverage(memoryValues);
      const avgDiskUsage = this.calculateAverage(diskValues);
      const avgResponseTime = this.calculateAverage(responseTimeValues);
      
      // 상태 분포 계산
      const statusDistribution: Record<string, number> = {};
      const providerDistribution: Record<string, number> = {};
      let totalAlerts = 0;
      
      servers.forEach((server: any) => {
        const status = server.status || 'unknown';
        const provider = server.provider || 'unknown';
        
        statusDistribution[status] = (statusDistribution[status] || 0) + 1;
        providerDistribution[provider] = (providerDistribution[provider] || 0) + 1;
        totalAlerts += (server.alerts?.length || 0);
      });
      
      // 헬스 스코어 계산 (0-100)
      const healthScore = this.calculateHealthScore({
        avgCpuUsage,
        avgMemoryUsage,
        avgDiskUsage,
        avgResponseTime,
        totalAlerts,
        totalServers: servers.length,
        onlineServers: statusDistribution.online || 0
      });
      
      // 트렌드 분석 (히스토리 기반)
      const trends = this.analyzeTrends();
      
      return {
        avgCpuUsage,
        avgMemoryUsage,
        avgDiskUsage,
        avgResponseTime,
        totalAlerts,
        serverStatusDistribution: statusDistribution,
        providerDistribution,
        healthScore,
        trends
      };
      
    } catch (error) {
      console.error('Statistical analysis failed:', error);
      throw error;
    }
  }

  /**
   * 🔍 강화된 이상 징후 감지 (다층 분석)
   */
  private async detectAnomalies(currentStats: StatisticalAnalysis): Promise<AnomalyDetection[]> {
    const anomalies: AnomalyDetection[] = [];
    
    try {
      console.log('🔍 Starting enhanced anomaly detection...');
      
      // 1. 베이스라인 비교 이상 감지
      if (this.baselineMetrics) {
        anomalies.push(...this.detectBaselineAnomalies(currentStats));
      }
      
      // 2. 절대 임계값 기반 이상 감지
      anomalies.push(...this.detectThresholdAnomalies(currentStats));
      
      // 3. 이동평균 대비 이상 감지
      anomalies.push(...this.detectMovingAverageAnomalies(currentStats));
      
      // 4. 트렌드 기반 이상 감지
      anomalies.push(...this.detectTrendAnomalies(currentStats));
      
      // 5. 패턴 기반 이상 감지
      anomalies.push(...this.detectPatternAnomalies(currentStats));
      
      // 6. 메모리 스파이크 감지
      anomalies.push(...this.detectMemorySpikes(currentStats));
      
      // 7. 복합 메트릭 이상 감지
      anomalies.push(...this.detectComplexAnomalies(currentStats));
      
      console.log(`🔍 Anomaly detection complete: ${anomalies.length} anomalies found`);
      
    } catch (error) {
      console.error('🚨 Enhanced anomaly detection failed:', error);
    }
    
    return this.deduplicateAnomalies(anomalies);
  }

  /**
   * 베이스라인 비교 이상 감지
   */
  private detectBaselineAnomalies(currentStats: StatisticalAnalysis): AnomalyDetection[] {
    if (!this.baselineMetrics) return [];
    
    const anomalies: AnomalyDetection[] = [];
    
    // CPU 이상 감지 (30% 이상 이탈)
    const cpuDeviation = this.calculateDeviationPercent(currentStats.avgCpuUsage, this.baselineMetrics.avgCpuUsage);
    if (cpuDeviation > 30) {
      anomalies.push(this.createAnomaly(
        'cpu_baseline_deviation',
        'performance',
        cpuDeviation > 50 ? 'critical' : 'high',
        `CPU usage deviated ${cpuDeviation.toFixed(1)}% from baseline (current: ${currentStats.avgCpuUsage.toFixed(1)}%, baseline: ${this.baselineMetrics.avgCpuUsage.toFixed(1)}%)`,
        currentStats.avgCpuUsage,
        this.baselineMetrics.avgCpuUsage * 1.3,
        'Monitor CPU-intensive processes and consider performance optimization'
      ));
    }
    
    // 메모리 이상 감지
    const memoryDeviation = this.calculateDeviationPercent(currentStats.avgMemoryUsage, this.baselineMetrics.avgMemoryUsage);
    if (memoryDeviation > 30) {
      anomalies.push(this.createAnomaly(
        'memory_baseline_deviation',
        'resource',
        memoryDeviation > 50 ? 'critical' : 'high',
        `Memory usage deviated ${memoryDeviation.toFixed(1)}% from baseline (current: ${currentStats.avgMemoryUsage.toFixed(1)}%, baseline: ${this.baselineMetrics.avgMemoryUsage.toFixed(1)}%)`,
        currentStats.avgMemoryUsage,
        this.baselineMetrics.avgMemoryUsage * 1.3,
        'Check for memory leaks and optimize memory allocation'
      ));
    }
    
    // 응답시간 이상 감지
    const responseDeviation = this.calculateDeviationPercent(currentStats.avgResponseTime, this.baselineMetrics.avgResponseTime);
    if (responseDeviation > 30) {
      anomalies.push(this.createAnomaly(
        'response_baseline_deviation',
        'performance',
        responseDeviation > 50 ? 'critical' : 'medium',
        `Response time deviated ${responseDeviation.toFixed(1)}% from baseline (current: ${currentStats.avgResponseTime.toFixed(1)}ms, baseline: ${this.baselineMetrics.avgResponseTime.toFixed(1)}ms)`,
        currentStats.avgResponseTime,
        this.baselineMetrics.avgResponseTime * 1.3,
        'Investigate network latency and optimize application performance'
      ));
    }
    
    return anomalies;
  }

  /**
   * 절대 임계값 기반 이상 감지
   */
  private detectThresholdAnomalies(currentStats: StatisticalAnalysis): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // 크리티컬 CPU 사용률 (90% 이상)
    if (currentStats.avgCpuUsage > 90) {
      anomalies.push(this.createAnomaly(
        'cpu_critical_threshold',
        'performance',
        'critical',
        `Critical CPU usage: ${currentStats.avgCpuUsage.toFixed(1)}%`,
        currentStats.avgCpuUsage,
        90,
        '즉시 CPU 사용량 확인 및 스케일링 고려'
      ));
    } else if (currentStats.avgCpuUsage > 80) {
      anomalies.push(this.createAnomaly(
        'cpu_high_threshold',
        'performance',
        'high',
        `High CPU usage: ${currentStats.avgCpuUsage.toFixed(1)}%`,
        currentStats.avgCpuUsage,
        80,
        'CPU 사용량 모니터링 강화 및 최적화 검토'
      ));
    }
    
    // 크리티컬 메모리 사용률 (95% 이상)
    if (currentStats.avgMemoryUsage > 95) {
      anomalies.push(this.createAnomaly(
        'memory_critical_threshold',
        'resource',
        'critical',
        `Critical memory usage: ${currentStats.avgMemoryUsage.toFixed(1)}%`,
        currentStats.avgMemoryUsage,
        95,
        '즉시 메모리 정리 또는 스케일업 필요'
      ));
    } else if (currentStats.avgMemoryUsage > 85) {
      anomalies.push(this.createAnomaly(
        'memory_high_threshold',
        'resource',
        'high',
        `High memory usage: ${currentStats.avgMemoryUsage.toFixed(1)}%`,
        currentStats.avgMemoryUsage,
        85,
        '메모리 사용량 최적화 검토'
      ));
    }
    
    // 디스크 사용률 (90% 이상)
    if (currentStats.avgDiskUsage > 90) {
      anomalies.push(this.createAnomaly(
        'disk_critical_threshold',
        'resource',
        'critical',
        `Critical disk usage: ${currentStats.avgDiskUsage.toFixed(1)}%`,
        currentStats.avgDiskUsage,
        90,
        '디스크 공간 정리 또는 확장 필요'
      ));
    }
    
    // 응답시간 임계값 (200ms 이상)
    if (currentStats.avgResponseTime > 200) {
      anomalies.push(this.createAnomaly(
        'response_critical_threshold',
        'performance',
        'critical',
        `Critical response time: ${currentStats.avgResponseTime.toFixed(1)}ms`,
        currentStats.avgResponseTime,
        200,
        '응답시간 최적화 긴급 필요'
      ));
    } else if (currentStats.avgResponseTime > 100) {
      anomalies.push(this.createAnomaly(
        'response_high_threshold',
        'performance',
        'medium',
        `High response time: ${currentStats.avgResponseTime.toFixed(1)}ms`,
        currentStats.avgResponseTime,
        100,
        '응답시간 최적화 검토'
      ));
    }
    
    return anomalies;
  }

  /**
   * 이동평균 대비 이상 감지
   */
  private detectMovingAverageAnomalies(currentStats: StatisticalAnalysis): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    if (this.metricsHistory.length < 3) return anomalies;
    
    // CPU 이동평균 비교
    const cpuMA = this.calculateMovingAverage('avgCpuUsage', 5);
    const cpuMADeviation = this.calculateDeviationPercent(currentStats.avgCpuUsage, cpuMA);
    if (cpuMADeviation > 25) {
      anomalies.push(this.createAnomaly(
        'cpu_moving_average_anomaly',
        'performance',
        cpuMADeviation > 40 ? 'high' : 'medium',
        `CPU usage spike: ${cpuMADeviation.toFixed(1)}% above moving average (current: ${currentStats.avgCpuUsage.toFixed(1)}%, MA: ${cpuMA.toFixed(1)}%)`,
        currentStats.avgCpuUsage,
        cpuMA * 1.25,
        'CPU 사용량 급증 원인 분석'
      ));
    }
    
    // 메모리 이동평균 비교
    const memoryMA = this.calculateMovingAverage('avgMemoryUsage', 5);
    const memoryMADeviation = this.calculateDeviationPercent(currentStats.avgMemoryUsage, memoryMA);
    if (memoryMADeviation > 25) {
      anomalies.push(this.createAnomaly(
        'memory_moving_average_anomaly',
        'resource',
        memoryMADeviation > 40 ? 'high' : 'medium',
        `Memory usage spike: ${memoryMADeviation.toFixed(1)}% above moving average (current: ${currentStats.avgMemoryUsage.toFixed(1)}%, MA: ${memoryMA.toFixed(1)}%)`,
        currentStats.avgMemoryUsage,
        memoryMA * 1.25,
        '메모리 사용량 급증 원인 분석'
      ));
    }
    
    return anomalies;
  }

  /**
   * 트렌드 기반 이상 감지
   */
  private detectTrendAnomalies(currentStats: StatisticalAnalysis): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    if (this.metricsHistory.length < 3) return anomalies;
    
    // CPU 트렌드 분석
    const cpuTrend = this.analyzeTrend('avgCpuUsage', 5);
    if (cpuTrend.trend === 'increasing' && cpuTrend.changeRate > 15) {
      anomalies.push(this.createAnomaly(
        'cpu_increasing_trend',
        'pattern',
        cpuTrend.changeRate > 25 ? 'high' : 'medium',
        `CPU usage showing rapid increasing trend: ${cpuTrend.changeRate.toFixed(1)}% change rate`,
        currentStats.avgCpuUsage,
        currentStats.avgCpuUsage * 0.85,
        'CPU 사용량 증가 추세 모니터링 및 예방 조치'
      ));
    }
    
    // 메모리 트렌드 분석
    const memoryTrend = this.analyzeTrend('avgMemoryUsage', 5);
    if (memoryTrend.trend === 'increasing' && memoryTrend.changeRate > 15) {
      anomalies.push(this.createAnomaly(
        'memory_increasing_trend',
        'pattern',
        memoryTrend.changeRate > 25 ? 'high' : 'medium',
        `Memory usage showing rapid increasing trend: ${memoryTrend.changeRate.toFixed(1)}% change rate`,
        currentStats.avgMemoryUsage,
        currentStats.avgMemoryUsage * 0.85,
        '메모리 누수 가능성 검토 및 최적화'
      ));
    }
    
    // 알림 증가 트렌드
    const alertTrend = this.analyzeTrend('totalAlerts', 5);
    if (alertTrend.trend === 'increasing' && alertTrend.changeRate > 20) {
      anomalies.push(this.createAnomaly(
        'alert_increasing_trend',
        'pattern',
        'medium',
        `Alert count showing increasing trend: ${alertTrend.changeRate.toFixed(1)}% change rate`,
        currentStats.totalAlerts,
        currentStats.totalAlerts * 0.8,
        '알림 증가 원인 분석 및 해결'
      ));
    }
    
    return anomalies;
  }

  /**
   * 패턴 기반 이상 감지
   */
  private detectPatternAnomalies(currentStats: StatisticalAnalysis): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // 알림 급증 감지
    if (currentStats.totalAlerts > 10) {
      const severity = currentStats.totalAlerts > 20 ? 'critical' : 'high';
      anomalies.push(this.createAnomaly(
        'alert_spike',
        'pattern',
        severity,
        `Alert spike detected: ${currentStats.totalAlerts} total alerts`,
        currentStats.totalAlerts,
        10,
        '알림 발생 원인 즉시 분석 필요'
      ));
    }
    
    // 서버 가용성 패턴 이상
    const totalServers = Object.values(currentStats.serverStatusDistribution).reduce((a, b) => a + b, 0);
    const onlineServers = currentStats.serverStatusDistribution.online || 0;
    const availabilityRate = totalServers > 0 ? (onlineServers / totalServers) * 100 : 0;
    
    if (availabilityRate < 80) {
      const severity = availabilityRate < 50 ? 'critical' : availabilityRate < 70 ? 'high' : 'medium';
      anomalies.push(this.createAnomaly(
        'availability_pattern_anomaly',
        'availability',
        severity,
        `Low server availability pattern: ${availabilityRate.toFixed(1)}% (${onlineServers}/${totalServers} servers online)`,
        availabilityRate,
        80,
        '오프라인 서버 상태 점검 및 복구'
      ));
    }
    
    return anomalies;
  }

  /**
   * 메모리 스파이크 감지 (급격한 메모리 증가)
   */
  private detectMemorySpikes(currentStats: StatisticalAnalysis): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    if (this.metricsHistory.length < 2) return anomalies;
    
    const previousStats = this.metricsHistory[this.metricsHistory.length - 1];
    const memoryIncrease = currentStats.avgMemoryUsage - previousStats.avgMemoryUsage;
    
    // 메모리가 10% 이상 급증한 경우
    if (memoryIncrease > 10) {
      anomalies.push(this.createAnomaly(
        'memory_spike',
        'resource',
        memoryIncrease > 20 ? 'critical' : 'high',
        `Memory spike detected: ${memoryIncrease.toFixed(1)}% increase (from ${previousStats.avgMemoryUsage.toFixed(1)}% to ${currentStats.avgMemoryUsage.toFixed(1)}%)`,
        currentStats.avgMemoryUsage,
        previousStats.avgMemoryUsage + 10,
        '메모리 급증 원인 분석 (메모리 누수, 대용량 작업 등)'
      ));
    }
    
    return anomalies;
  }

  /**
   * 복합 메트릭 이상 감지 (여러 메트릭 조합)
   */
  private detectComplexAnomalies(currentStats: StatisticalAnalysis): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // CPU + 메모리 동시 고사용률
    if (currentStats.avgCpuUsage > 75 && currentStats.avgMemoryUsage > 80) {
      anomalies.push(this.createAnomaly(
        'cpu_memory_high_usage',
        'resource',
        'critical',
        `High CPU and memory usage: CPU ${currentStats.avgCpuUsage.toFixed(1)}%, Memory ${currentStats.avgMemoryUsage.toFixed(1)}%`,
        Math.max(currentStats.avgCpuUsage, currentStats.avgMemoryUsage),
        75,
        '시스템 전반적 부하 검토 및 스케일링 고려'
      ));
    }
    
    // 응답시간 + 알림 조합
    if (currentStats.avgResponseTime > 100 && currentStats.totalAlerts > 5) {
      anomalies.push(this.createAnomaly(
        'performance_degradation',
        'performance',
        'high',
        `Performance degradation: ${currentStats.avgResponseTime.toFixed(1)}ms response time with ${currentStats.totalAlerts} alerts`,
        currentStats.avgResponseTime,
        100,
        '전반적인 성능 저하 원인 분석'
      ));
    }
    
    return anomalies;
  }

  /**
   * 편차 백분율 계산
   */
  private calculateDeviationPercent(current: number, baseline: number): number {
    if (baseline === 0) return 0;
    return Math.abs(current - baseline) / baseline * 100;
  }

  /**
   * 중복 이상 징후 제거
   */
  private deduplicateAnomalies(anomalies: AnomalyDetection[]): AnomalyDetection[] {
    const seen = new Set<string>();
    return anomalies.filter(anomaly => {
      const key = `${anomaly.type}_${anomaly.severity}_${Math.floor(anomaly.metrics.current)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * 메트릭 이상 감지 헬퍼
   */
  private detectMetricAnomaly(
    metricName: string,
    current: number,
    baseline: number,
    threshold: number
  ): AnomalyDetection | null {
    const deviation = Math.abs(current - baseline);
    const deviationPercent = (deviation / baseline) * 100;
    
    // 베이스라인 대비 30% 이상 증가 또는 절대 임계값 초과
    if (deviationPercent > 30 || current > threshold) {
      const severity = current > threshold ? 'critical' : 
                     deviationPercent > 50 ? 'high' : 'medium';
      
      return this.createAnomaly(
        `${metricName}_anomaly`,
        'performance',
        severity as 'low' | 'medium' | 'high' | 'critical',
        `${metricName.toUpperCase()} anomaly detected: ${current.toFixed(1)} (baseline: ${baseline.toFixed(1)}, deviation: ${deviationPercent.toFixed(1)}%)`,
        current,
        threshold,
        `Monitor ${metricName} usage and consider scaling or optimization`
      );
    }
    
    return null;
  }

  /**
   * 이상 징후 객체 생성 헬퍼
   */
  private createAnomaly(
    id: string,
    type: 'performance' | 'availability' | 'resource' | 'pattern',
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    current: number,
    threshold: number,
    recommendation: string
  ): AnomalyDetection {
    return {
      id: `anomaly_${id}_${Date.now()}`,
      type,
      severity,
      description,
      affectedServers: [], // 실제 구현에서는 영향받는 서버 목록 포함
      metrics: {
        current,
        baseline: this.baselineMetrics ? this.getBaselineValue(type) : current,
        deviation: this.baselineMetrics ? Math.abs(current - this.getBaselineValue(type)) : 0,
        threshold
      },
      recommendation,
      detectedAt: new Date()
    };
  }

  /**
   * 베이스라인 값 조회 헬퍼
   */
  private getBaselineValue(metricType: string): number {
    if (!this.baselineMetrics) return 0;
    
    switch (metricType) {
      case 'performance':
      case 'cpu':
        return this.baselineMetrics.avgCpuUsage;
      case 'resource':
      case 'memory':
        return this.baselineMetrics.avgMemoryUsage;
      case 'response_time':
        return this.baselineMetrics.avgResponseTime;
      default:
        return 0;
    }
  }

  /**
   * 평균 계산
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  /**
   * 헬스 스코어 계산 (0-100)
   */
  private calculateHealthScore(metrics: {
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgDiskUsage: number;
    avgResponseTime: number;
    totalAlerts: number;
    totalServers: number;
    onlineServers: number;
  }): number {
    // 각 메트릭별 점수 계산 (높을수록 나쁨)
    const cpuScore = Math.max(0, 100 - metrics.avgCpuUsage);
    const memoryScore = Math.max(0, 100 - metrics.avgMemoryUsage);
    const diskScore = Math.max(0, 100 - metrics.avgDiskUsage);
    const responseScore = Math.max(0, 100 - Math.min(metrics.avgResponseTime, 100));
    
    // 가용성 점수
    const availabilityScore = (metrics.onlineServers / metrics.totalServers) * 100;
    
    // 알림 점수 (알림이 많을수록 점수 낮음)
    const alertScore = Math.max(0, 100 - (metrics.totalAlerts * 5));
    
    // 가중 평균 계산
    const weights = {
      cpu: 0.25,
      memory: 0.25,
      disk: 0.15,
      response: 0.15,
      availability: 0.15,
      alerts: 0.05
    };
    
    return Math.round(
      cpuScore * weights.cpu +
      memoryScore * weights.memory +
      diskScore * weights.disk +
      responseScore * weights.response +
      availabilityScore * weights.availability +
      alertScore * weights.alerts
    );
  }

  /**
   * 트렌드 분석 (히스토리 기반)
   */
  private analyzeTrends(): {
    cpuTrend: 'increasing' | 'decreasing' | 'stable';
    memoryTrend: 'increasing' | 'decreasing' | 'stable';
    alertTrend: 'increasing' | 'decreasing' | 'stable';
  } {
    if (this.metricsHistory.length < 3) {
      return {
        cpuTrend: 'stable',
        memoryTrend: 'stable',
        alertTrend: 'stable'
      };
    }
    
    const recent = this.metricsHistory.slice(-3);
    
    return {
      cpuTrend: this.calculateTrend(recent.map(m => m.avgCpuUsage)),
      memoryTrend: this.calculateTrend(recent.map(m => m.avgMemoryUsage)),
      alertTrend: this.calculateTrend(recent.map(m => m.totalAlerts))
    };
  }

  /**
   * 개별 메트릭 트렌드 계산
   */
  private calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (change > 10) return 'increasing';
    if (change < -10) return 'decreasing';
    return 'stable';
  }

  /**
   * 📈 이동평균 계산 (지정 시간 범위 내 메트릭 평균)
   */
  private calculateMovingAverage(
    metricName: 'avgCpuUsage' | 'avgMemoryUsage' | 'avgDiskUsage' | 'avgResponseTime' | 'totalAlerts',
    windowSize: number = 5
  ): number {
    if (this.metricsHistory.length === 0) return 0;
    
    const recentMetrics = this.metricsHistory.slice(-windowSize);
    const values = recentMetrics.map(metric => metric[metricName]);
    
    return this.calculateAverage(values);
  }

  /**
   * 📊 시계열 변화 추이 판단 (단일 메트릭)
   */
  private analyzeTrend(
    metricName: 'avgCpuUsage' | 'avgMemoryUsage' | 'avgDiskUsage' | 'avgResponseTime' | 'totalAlerts',
    windowSize: number = 5
  ): { 
    trend: 'increasing' | 'decreasing' | 'stable';
    changeRate: number;
    volatility: number;
  } {
    if (this.metricsHistory.length < 2) {
      return { trend: 'stable', changeRate: 0, volatility: 0 };
    }
    
    const recentMetrics = this.metricsHistory.slice(-windowSize);
    const values = recentMetrics.map(metric => metric[metricName]);
    
    if (values.length < 2) {
      return { trend: 'stable', changeRate: 0, volatility: 0 };
    }
    
    // 선형 회귀를 통한 추세 계산
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = this.calculateAverage(values);
    
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = values[i] - yMean;
      numerator += xDiff * yDiff;
      denominator += xDiff * xDiff;
    }
    
    const slope = denominator === 0 ? 0 : numerator / denominator;
    const changeRate = (slope / yMean) * 100; // 변화율을 백분율로
    
    // 변동성 계산 (표준편차 기반)
    const variance = values.reduce((acc, val) => acc + Math.pow(val - yMean, 2), 0) / n;
    const volatility = Math.sqrt(variance) / yMean * 100;
    
    // 추세 판단
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (Math.abs(changeRate) > 5) { // 5% 이상 변화
      trend = changeRate > 0 ? 'increasing' : 'decreasing';
    }
    
    return { trend, changeRate, volatility };
  }

  /**
   * 📋 전체 서버 진단 보고서 생성
   */
  async generateHealthReport(): Promise<{
    timestamp: Date;
    summary: {
      overallStatus: 'healthy' | 'warning' | 'critical';
      healthScore: number;
      serverCount: number;
      criticalIssues: number;
      warnings: number;
    };
    metrics: {
      current: StatisticalAnalysis;
      trends: Record<string, any>;
      movingAverages: Record<string, number>;
      predictions: Record<string, { nextValue: number; confidence: number }>;
    };
    anomalies: AnomalyDetection[];
    recommendations: string[];
    detailedAnalysis: {
      performance: any;
      availability: any;
      resource: any;
      patterns: any;
    };
  }> {
    console.log('📋 Generating comprehensive health report...');
    
    try {
      // 현재 통계 분석 수행
      const currentStats = await this.performStatisticalAnalysis();
      const anomalies = await this.detectAnomalies(currentStats);
      
      // 이동평균 계산
      const movingAverages = {
        cpu: this.calculateMovingAverage('avgCpuUsage', 5),
        memory: this.calculateMovingAverage('avgMemoryUsage', 5),
        disk: this.calculateMovingAverage('avgDiskUsage', 5),
        responseTime: this.calculateMovingAverage('avgResponseTime', 5),
        alerts: this.calculateMovingAverage('totalAlerts', 5)
      };
      
      // 트렌드 분석
      const trends = {
        cpu: this.analyzeTrend('avgCpuUsage', 5),
        memory: this.analyzeTrend('avgMemoryUsage', 5),
        disk: this.analyzeTrend('avgDiskUsage', 5),
        responseTime: this.analyzeTrend('avgResponseTime', 5),
        alerts: this.analyzeTrend('totalAlerts', 5)
      };
      
      // 예측 (단순 선형 외삽)
      const predictions = {
        cpu: this.predictNextValue('avgCpuUsage', trends.cpu),
        memory: this.predictNextValue('avgMemoryUsage', trends.memory),
        responseTime: this.predictNextValue('avgResponseTime', trends.responseTime)
      };
      
      // 전체 상태 판단
      const criticalAnomalies = anomalies.filter(a => a.severity === 'critical').length;
      const highAnomalies = anomalies.filter(a => a.severity === 'high').length;
      const warnings = anomalies.filter(a => a.severity === 'medium' || a.severity === 'low').length;
      
      let overallStatus: 'healthy' | 'warning' | 'critical' = 'healthy';
      if (criticalAnomalies > 0 || currentStats.healthScore < 30) {
        overallStatus = 'critical';
      } else if (highAnomalies > 0 || warnings > 3 || currentStats.healthScore < 60) {
        overallStatus = 'warning';
      }
      
      // 권장사항 생성
      const recommendations = this.generateRecommendations(currentStats, anomalies, trends);
      
      // 상세 분석
      const detailedAnalysis = {
        performance: this.analyzePerformance(currentStats, trends),
        availability: this.analyzeAvailability(currentStats),
        resource: this.analyzeResourceUsage(currentStats, trends),
        patterns: this.analyzePatterns(anomalies, trends)
      };
      
      return {
        timestamp: new Date(),
        summary: {
          overallStatus,
          healthScore: currentStats.healthScore,
          serverCount: Object.values(currentStats.serverStatusDistribution).reduce((a, b) => a + b, 0),
          criticalIssues: criticalAnomalies,
          warnings: highAnomalies + warnings
        },
        metrics: {
          current: currentStats,
          trends,
          movingAverages,
          predictions
        },
        anomalies,
        recommendations,
        detailedAnalysis
      };
      
    } catch (error) {
      console.error('📋 Health report generation failed:', error);
      throw error;
    }
  }

  /**
   * 예측값 계산 (단순 선형 외삽)
   */
  private predictNextValue(
    metricName: 'avgCpuUsage' | 'avgMemoryUsage' | 'avgDiskUsage' | 'avgResponseTime' | 'totalAlerts',
    trendInfo: { trend: string; changeRate: number; volatility: number }
  ): { nextValue: number; confidence: number } {
    if (this.metricsHistory.length === 0) {
      return { nextValue: 0, confidence: 0 };
    }
    
    const currentValue = this.metricsHistory[this.metricsHistory.length - 1][metricName];
    const changeRate = trendInfo.changeRate / 100;
    const nextValue = Math.max(0, currentValue * (1 + changeRate));
    
    // 신뢰도는 변동성과 반비례 (변동성이 낮을수록 예측 신뢰도 높음)
    const confidence = Math.max(0, Math.min(100, 100 - trendInfo.volatility));
    
    return { nextValue, confidence };
  }

  /**
   * 권장사항 생성
   */
  private generateRecommendations(
    stats: StatisticalAnalysis,
    anomalies: AnomalyDetection[],
    trends: Record<string, any>
  ): string[] {
    const recommendations: string[] = [];
    
    // 헬스 스코어 기반
    if (stats.healthScore < 30) {
      recommendations.push('🚨 즉시 전체 시스템 점검이 필요합니다');
    } else if (stats.healthScore < 60) {
      recommendations.push('⚠️ 시스템 성능 개선이 권장됩니다');
    }
    
    // CPU 관련
    if (stats.avgCpuUsage > 80 || trends.cpu.trend === 'increasing') {
      recommendations.push('💻 CPU 사용량 최적화 또는 스케일 업 검토');
    }
    
    // 메모리 관련
    if (stats.avgMemoryUsage > 85 || trends.memory.trend === 'increasing') {
      recommendations.push('🧠 메모리 사용량 모니터링 및 최적화 필요');
    }
    
    // 응답시간 관련
    if (stats.avgResponseTime > 100 || trends.responseTime.trend === 'increasing') {
      recommendations.push('⚡ 응답시간 개선을 위한 성능 튜닝 필요');
    }
    
    // 이상 징후 기반
    if (anomalies.length > 0) {
      const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
      if (criticalCount > 0) {
        recommendations.push(`🔥 ${criticalCount}개의 심각한 이상 징후에 대한 즉시 대응 필요`);
      }
    }
    
    // 알림 관련
    if (stats.totalAlerts > 10) {
      recommendations.push('📢 알림 발생 원인 분석 및 해결 필요');
    }
    
    return recommendations;
  }

  /**
   * 성능 분석
   */
  private analyzePerformance(stats: StatisticalAnalysis, trends: Record<string, any>) {
    return {
      cpu: {
        current: stats.avgCpuUsage,
        status: stats.avgCpuUsage > 80 ? 'critical' : stats.avgCpuUsage > 60 ? 'warning' : 'good',
        trend: trends.cpu.trend,
        prediction: trends.cpu.changeRate > 10 ? 'increasing_rapidly' : 'stable'
      },
      memory: {
        current: stats.avgMemoryUsage,
        status: stats.avgMemoryUsage > 85 ? 'critical' : stats.avgMemoryUsage > 70 ? 'warning' : 'good',
        trend: trends.memory.trend,
        prediction: trends.memory.changeRate > 10 ? 'increasing_rapidly' : 'stable'
      },
      responseTime: {
        current: stats.avgResponseTime,
        status: stats.avgResponseTime > 100 ? 'critical' : stats.avgResponseTime > 50 ? 'warning' : 'good',
        trend: trends.responseTime.trend
      }
    };
  }

  /**
   * 가용성 분석
   */
  private analyzeAvailability(stats: StatisticalAnalysis) {
    const totalServers = Object.values(stats.serverStatusDistribution).reduce((a, b) => a + b, 0);
    const onlineServers = stats.serverStatusDistribution.online || 0;
    const availabilityRate = totalServers > 0 ? (onlineServers / totalServers) * 100 : 0;
    
    return {
      rate: availabilityRate,
      status: availabilityRate >= 95 ? 'excellent' : 
              availabilityRate >= 90 ? 'good' : 
              availabilityRate >= 80 ? 'warning' : 'critical',
      onlineServers,
      totalServers,
      offlineServers: totalServers - onlineServers
    };
  }

  /**
   * 리소스 사용량 분석
   */
  private analyzeResourceUsage(stats: StatisticalAnalysis, trends: Record<string, any>) {
    return {
      overall: {
        cpu: { usage: stats.avgCpuUsage, trend: trends.cpu.trend },
        memory: { usage: stats.avgMemoryUsage, trend: trends.memory.trend },
        disk: { usage: stats.avgDiskUsage, trend: trends.disk.trend }
      },
      bottlenecks: this.identifyBottlenecks(stats),
      utilization: this.calculateUtilizationLevel(stats)
    };
  }

  /**
   * 패턴 분석
   */
  private analyzePatterns(anomalies: AnomalyDetection[], trends: Record<string, any>) {
    return {
      anomalyPatterns: this.categorizeAnomalies(anomalies),
      trendPatterns: this.analyzeTrendPatterns(trends),
      cyclicalPatterns: this.detectCyclicalPatterns()
    };
  }

  /**
   * 보틀넥 식별
   */
  private identifyBottlenecks(stats: StatisticalAnalysis): string[] {
    const bottlenecks: string[] = [];
    
    if (stats.avgCpuUsage > 80) bottlenecks.push('CPU');
    if (stats.avgMemoryUsage > 85) bottlenecks.push('Memory');
    if (stats.avgDiskUsage > 90) bottlenecks.push('Disk');
    if (stats.avgResponseTime > 100) bottlenecks.push('Network/Response');
    
    return bottlenecks;
  }

  /**
   * 활용도 수준 계산
   */
  private calculateUtilizationLevel(stats: StatisticalAnalysis): 'low' | 'medium' | 'high' | 'critical' {
    const avgUtilization = (stats.avgCpuUsage + stats.avgMemoryUsage + stats.avgDiskUsage) / 3;
    
    if (avgUtilization > 85) return 'critical';
    if (avgUtilization > 70) return 'high';
    if (avgUtilization > 40) return 'medium';
    return 'low';
  }

  /**
   * 이상 징후 분류
   */
  private categorizeAnomalies(anomalies: AnomalyDetection[]) {
    return {
      performance: anomalies.filter(a => a.type === 'performance').length,
      availability: anomalies.filter(a => a.type === 'availability').length,
      resource: anomalies.filter(a => a.type === 'resource').length,
      pattern: anomalies.filter(a => a.type === 'pattern').length
    };
  }

  /**
   * 트렌드 패턴 분석
   */
  private analyzeTrendPatterns(trends: Record<string, any>) {
    const increasingMetrics = Object.keys(trends).filter(key => trends[key].trend === 'increasing');
    const decreasingMetrics = Object.keys(trends).filter(key => trends[key].trend === 'decreasing');
    
    return {
      increasing: increasingMetrics,
      decreasing: decreasingMetrics,
      concerningTrends: increasingMetrics.filter(metric => ['cpu', 'memory', 'alerts'].includes(metric))
    };
  }

  /**
   * 주기적 패턴 감지 (간단한 구현)
   */
  private detectCyclicalPatterns() {
    if (this.metricsHistory.length < 10) {
      return { detected: false, patterns: [] };
    }
    
    // 실제 구현에서는 FFT 등을 사용할 수 있음
    return { detected: false, patterns: [] };
  }

  /**
   * 통계 분석 결과 조회
   */
  getStatisticalAnalysis(): StatisticalAnalysis | undefined {
    return this.lastHealthCheck?.statisticalAnalysis;
  }

  /**
   * 베이스라인 메트릭 조회
   */
  getBaselineMetrics(): StatisticalAnalysis | undefined {
    return this.baselineMetrics;
  }

  /**
   * 메트릭 히스토리 조회
   */
  getMetricsHistory(): StatisticalAnalysis[] {
    return [...this.metricsHistory];
  }

  /**
   * 베이스라인 재설정
   */
  resetBaseline(): void {
    this.baselineMetrics = undefined;
    this.metricsHistory = [];
    console.log('📊 Baseline metrics reset');
  }
}

// 싱글톤 인스턴스 export
export const systemHealthChecker = SystemHealthChecker.getInstance(); 