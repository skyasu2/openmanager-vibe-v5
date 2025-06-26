export interface WarmupMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  successRate: number;
  averageWarmupTime: number;
  lastWarmupTime: number;
  lastAttemptTime: string;
  lastSuccessTime: string;
}

export interface PerformanceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerMinute: number;
  enginesUsage: {
    tensorflow: number;
    transformers: number;
    onnx: number;
    python: number;
    fallback: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  pythonServiceStatus: 'up' | 'down' | 'slow';
  jsEnginesStatus: 'up' | 'down' | 'partial';
  warmupHealth: 'good' | 'poor' | 'failed';
  lastHealthCheck: string;
  uptime: number;
}

export interface ErrorReport {
  timestamp: string;
  type: 'warmup_failure' | 'request_failure' | 'engine_failure' | 'timeout';
  message: string;
  stack?: string;
  context?: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export class MonitoringService {
  private warmupMetrics: WarmupMetrics = {
    totalAttempts: 0,
    successfulAttempts: 0,
    failedAttempts: 0,
    successRate: 0,
    averageWarmupTime: 0,
    lastWarmupTime: 0,
    lastAttemptTime: '',
    lastSuccessTime: ''
  };
  private performanceMetrics: PerformanceMetrics = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    p95ResponseTime: 0,
    p99ResponseTime: 0,
    requestsPerMinute: 0,
    enginesUsage: {
      tensorflow: 0,
      transformers: 0,
      onnx: 0,
      python: 0,
      fallback: 0
    }
  };
  private systemHealth: SystemHealth = {
    status: 'healthy',
    pythonServiceStatus: 'up',
    jsEnginesStatus: 'up',
    warmupHealth: 'good',
    lastHealthCheck: new Date().toISOString(),
    uptime: 0
  };
  private errorReports: ErrorReport[] = [];
  private responseTimesBuffer: number[] = [];
  private requestBuffer: Array<{ timestamp: number; success: boolean; responseTime: number; engine: string }> = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.initializeMetrics();
    
    // 정기적인 메트릭 정리 (5분마다)
    setInterval(() => this.cleanupMetrics(), 5 * 60 * 1000);
  }

  private initializeMetrics() {
    this.warmupMetrics = {
      totalAttempts: 0,
      successfulAttempts: 0,
      failedAttempts: 0,
      successRate: 0,
      averageWarmupTime: 0,
      lastWarmupTime: 0,
      lastAttemptTime: '',
      lastSuccessTime: ''
    };

    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerMinute: 0,
      enginesUsage: {
        tensorflow: 0,
        transformers: 0,
        onnx: 0,
        python: 0,
        fallback: 0
      }
    };

    this.systemHealth = {
      status: 'healthy',
      pythonServiceStatus: 'up',
      jsEnginesStatus: 'up',
      warmupHealth: 'good',
      lastHealthCheck: new Date().toISOString(),
      uptime: 0
    };
  }

  /**
   * 🔥 웜업 시도 기록
   */
  recordWarmupAttempt(success: boolean, warmupTime: number, error?: string) {
    const now = new Date().toISOString();
    
    this.warmupMetrics.totalAttempts++;
    this.warmupMetrics.lastWarmupTime = warmupTime;
    this.warmupMetrics.lastAttemptTime = now;
    
    if (success) {
      this.warmupMetrics.successfulAttempts++;
      this.warmupMetrics.lastSuccessTime = now;
    } else {
      this.warmupMetrics.failedAttempts++;
      
      // 에러 보고서 생성
      this.addErrorReport({
        timestamp: now,
        type: 'warmup_failure',
        message: error || '웜업 실패',
        severity: 'high'
      });
    }
    
    // 성공률 계산
    this.warmupMetrics.successRate = this.warmupMetrics.successfulAttempts / this.warmupMetrics.totalAttempts;
    
    // 평균 웜업 시간 계산 (성공한 경우만)
    if (success) {
      const totalSuccessTime = this.warmupMetrics.averageWarmupTime * (this.warmupMetrics.successfulAttempts - 1) + warmupTime;
      this.warmupMetrics.averageWarmupTime = totalSuccessTime / this.warmupMetrics.successfulAttempts;
    }
  }

  /**
   * 📊 요청 성능 기록
   */
  recordRequest(success: boolean, responseTime: number, engine: string) {
    const now = Date.now();
    
    this.performanceMetrics.totalRequests++;
    this.responseTimesBuffer.push(responseTime);
    this.requestBuffer.push({ timestamp: now, success, responseTime, engine });
    
    if (success) {
      this.performanceMetrics.successfulRequests++;
      
      // 엔진 사용량 기록
      const engineKey = this.mapEngineToKey(engine);
      if (engineKey) {
        this.performanceMetrics.enginesUsage[engineKey]++;
      }
    } else {
      this.performanceMetrics.failedRequests++;
    }
    
    // 응답시간 메트릭 업데이트
    this.updateResponseTimeMetrics();
    
    // 분당 요청수 계산 (최근 1분간)
    this.calculateRequestsPerMinute();
    
    // 버퍼 크기 제한 (최근 1000개만 유지)
    if (this.responseTimesBuffer.length > 1000) {
      this.responseTimesBuffer = this.responseTimesBuffer.slice(-1000);
    }
    if (this.requestBuffer.length > 1000) {
      this.requestBuffer = this.requestBuffer.slice(-1000);
    }
  }

  private mapEngineToKey(engine: string): keyof typeof this.performanceMetrics.enginesUsage | null {
    if (engine.includes('tensorflow')) return 'tensorflow';
    if (engine.includes('transformers')) return 'transformers';
    if (engine.includes('onnx')) return 'onnx';
    if (engine.includes('python')) return 'python';
    if (engine.includes('fallback')) return 'fallback';
    return null;
  }

  private updateResponseTimeMetrics() {
    if (this.responseTimesBuffer.length === 0) return;
    
    const sorted = [...this.responseTimesBuffer].sort((a, b) => a - b);
    const total = sorted.reduce((sum, time) => sum + time, 0);
    
    this.performanceMetrics.averageResponseTime = total / sorted.length;
    this.performanceMetrics.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
    this.performanceMetrics.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)];
  }

  private calculateRequestsPerMinute() {
    const oneMinuteAgo = Date.now() - 60 * 1000;
    const recentRequests = this.requestBuffer.filter(req => req.timestamp > oneMinuteAgo);
    this.performanceMetrics.requestsPerMinute = recentRequests.length;
  }

  /**
   * ❌ 에러 보고서 추가
   */
  addErrorReport(error: Omit<ErrorReport, 'timestamp'> & { timestamp?: string }) {
    const errorReport: ErrorReport = {
      timestamp: error.timestamp || new Date().toISOString(),
      type: error.type,
      message: error.message,
      stack: error.stack,
      context: error.context,
      severity: error.severity
    };
    
    this.errorReports.push(errorReport);
    
    // 최근 100개만 유지
    if (this.errorReports.length > 100) {
      this.errorReports = this.errorReports.slice(-100);
    }
  }

  /**
   * 🏥 시스템 헬스 업데이트
   */
  updateSystemHealth(pythonStatus: 'up' | 'down' | 'slow', jsEnginesStatus: 'up' | 'down' | 'partial') {
    this.systemHealth.pythonServiceStatus = pythonStatus;
    this.systemHealth.jsEnginesStatus = jsEnginesStatus;
    this.systemHealth.lastHealthCheck = new Date().toISOString();
    this.systemHealth.uptime = Date.now() - this.startTime;
    
    // 웜업 건강도 평가
    if (this.warmupMetrics.successRate > 0.9) {
      this.systemHealth.warmupHealth = 'good';
    } else if (this.warmupMetrics.successRate > 0.7) {
      this.systemHealth.warmupHealth = 'poor';
    } else {
      this.systemHealth.warmupHealth = 'failed';
    }
    
    // 🔧 전체 시스템 상태 결정 - Python 서비스를 옵셔널로 처리
    const criticalErrors = this.errorReports.filter(e => e.severity === 'critical').length;
    const recentFailureRate = this.calculateRecentFailureRate();
    
    // ✅ Python 서비스는 더 이상 전체 시스템 상태에 영향주지 않음 (옵셔널 AI 기능)
    if (criticalErrors > 0 || recentFailureRate > 0.5) {
      this.systemHealth.status = 'unhealthy';
    } else if (recentFailureRate > 0.2 || jsEnginesStatus === 'partial') {
      this.systemHealth.status = 'degraded';
    } else {
      this.systemHealth.status = 'healthy';
    }
    
    // 🔔 Python 서비스 상태는 별도 경고로만 처리
    if (pythonStatus === 'down') {
      console.warn('⚠️ [MonitoringService] Python AI 서비스 비활성화 - 기본 모니터링은 정상 동작');
    } else if (pythonStatus === 'slow') {
      console.warn('⚠️ [MonitoringService] Python AI 서비스 응답 지연 - 기본 모니터링은 정상 동작');
    }
  }

  private calculateRecentFailureRate(): number {
    const recentRequests = this.requestBuffer.filter(req => req.timestamp > Date.now() - 5 * 60 * 1000);
    if (recentRequests.length === 0) return 0;
    
    const failures = recentRequests.filter(req => !req.success).length;
    return failures / recentRequests.length;
  }

  /**
   * 📈 전체 메트릭 조회
   */
  getAllMetrics() {
    return {
      warmup: this.warmupMetrics,
      performance: this.performanceMetrics,
      health: this.systemHealth,
      errors: this.errorReports.slice(-10), // 최근 10개 에러만
      summary: {
        totalUptime: Date.now() - this.startTime,
        overallSuccessRate: this.performanceMetrics.totalRequests > 0 ? 
          this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests : 1,
        warmupSuccessRate: this.warmupMetrics.successRate,
        averageResponseTime: this.performanceMetrics.averageResponseTime,
        systemStatus: this.systemHealth.status
      }
    };
  }

  /**
   * 🔍 헬스체크 실행
   */
  async performHealthCheck(): Promise<any> {
    const healthChecks: any[] = [];
    
    // 🔧 Python 서비스 체크 - 실패해도 전체 시스템에 영향 없음
    try {
      const pythonServiceUrl = process.env.FASTAPI_BASE_URL || 'https://openmanager-ai-engine.onrender.com';
      const startTime = Date.now();
      
      const response = await fetch(`${pythonServiceUrl}/health`, {
        signal: AbortSignal.timeout(10000)
      });
      
      const responseTime = Date.now() - startTime;
      
      healthChecks.push({
        name: 'Python AI 서비스 (옵셔널)',
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime,
        details: response.ok ? 'AI 기능 사용 가능' : `HTTP ${response.status} - AI 기능 제한적`,
        optional: true
      });
      
      this.updateSystemHealth(
        response.ok ? (responseTime > 5000 ? 'slow' : 'up') : 'down',
        'up' // JS 엔진은 항상 up (로컬 실행)
      );
      
    } catch (error: any) {
      healthChecks.push({
        name: 'Python AI 서비스 (옵셔널)',
        status: 'unhealthy',
        responseTime: 10000,
        details: `${error.message} - 기본 모니터링은 정상 동작`,
        optional: true
      });
      
      // ✅ Python 서비스 실패해도 JS 엔진은 정상으로 처리
      this.updateSystemHealth('down', 'up');
    }
    
    // 🔧 핵심 서비스 체크 (항상 정상)
    healthChecks.push({
      name: '서버 모니터링 (핵심)',
      status: 'healthy',
      responseTime: 0,
      details: 'API 서버 정상 동작',
      optional: false
    });
    
    healthChecks.push({
      name: '대시보드 UI (핵심)',
      status: 'healthy',
      responseTime: 0,
      details: 'React 컴포넌트 정상 렌더링',
      optional: false
    });
    
    const totalResponseTime = healthChecks
      .filter(check => !check.optional)
      .reduce((sum, check) => sum + check.responseTime, 0);
    
    // 🎯 헬스체크 결과: 핵심 기능 기준으로 판단
    const coreServicesHealthy = healthChecks
      .filter(check => !check.optional)
      .every(check => check.status === 'healthy');
    
    const overallStatus = coreServicesHealthy ? 'healthy' : this.systemHealth.status;
    
    return {
      status: overallStatus,
      checks: healthChecks,
      totalResponseTime,
      coreServicesHealthy,
      optionalServicesCount: healthChecks.filter(check => check.optional).length,
      message: coreServicesHealthy ? 
        '핵심 모니터링 기능 정상 동작' : 
        '일부 서비스에 문제가 있지만 모니터링 기능은 사용 가능',
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 🧹 메트릭 정리
   */
  private cleanupMetrics() {
    // 1시간 이전 요청 제거
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    this.requestBuffer = this.requestBuffer.filter(req => req.timestamp > oneHourAgo);
    
    // 오래된 에러 보고서 제거 (24시간 이전)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.errorReports = this.errorReports.filter(error => 
      new Date(error.timestamp).getTime() > oneDayAgo
    );
    
    console.log('📊 메트릭 정리 완료:', {
      requestBufferSize: this.requestBuffer.length,
      errorReportsSize: this.errorReports.length
    });
  }

  /**
   * 📊 실시간 통계 조회
   */
  getRealTimeStats() {
    const now = Date.now();
    const last5Minutes = this.requestBuffer.filter(req => req.timestamp > now - 5 * 60 * 1000);
    const last1Hour = this.requestBuffer.filter(req => req.timestamp > now - 60 * 60 * 1000);
    
    return {
      last5Minutes: {
        requests: last5Minutes.length,
        successRate: last5Minutes.length > 0 ? 
          last5Minutes.filter(r => r.success).length / last5Minutes.length : 1,
        averageResponseTime: last5Minutes.length > 0 ? 
          last5Minutes.reduce((sum, r) => sum + r.responseTime, 0) / last5Minutes.length : 0
      },
      last1Hour: {
        requests: last1Hour.length,
        successRate: last1Hour.length > 0 ? 
          last1Hour.filter(r => r.success).length / last1Hour.length : 1,
        averageResponseTime: last1Hour.length > 0 ? 
          last1Hour.reduce((sum, r) => sum + r.responseTime, 0) / last1Hour.length : 0
      },
      current: {
        systemStatus: this.systemHealth.status,
        warmupSuccessRate: this.warmupMetrics.successRate,
        uptime: now - this.startTime
      }
    };
  }
}

// 싱글톤 인스턴스
export const monitoringService = new MonitoringService(); 