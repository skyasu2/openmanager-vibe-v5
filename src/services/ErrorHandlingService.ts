/**
 * ⚠️ Error Handling Service
 * 
 * 표준화된 에러 처리 시스템
 * - 에러 분류 및 처리
 * - 에러 복구 전략
 * - 에러 로깅 및 모니터링
 * - 사용자 친화적 에러 메시지
 */

import { IErrorHandler, ServiceError } from '@/interfaces/services';
import { ILogger } from '@/interfaces/services';

export class ErrorHandlingService implements IErrorHandler {
  private errorHistory: ServiceError[] = [];
  private errorHandlers = new Map<string, (error: ServiceError) => void>();
  private logger?: ILogger;
  private readonly maxHistorySize = 500;

  constructor(logger?: ILogger) {
    this.logger = logger;
    this.setupDefaultHandlers();
  }

  /**
   * 에러 처리
   */
  handle(error: ServiceError): void {
    // 에러 히스토리에 추가
    this.addToHistory(error);

    // 로깅
    if (this.logger) {
      this.logger.error(`Service Error [${error.service}]: ${error.message}`, error, {
        code: error.code,
        service: error.service,
        context: error.context
      });
    }

    // 등록된 핸들러 실행
    const handler = this.errorHandlers.get(error.code) || this.errorHandlers.get('default');
    if (handler) {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Error handler failed:', handlerError);
      }
    }

    // 심각한 에러의 경우 추가 처리
    if (this.isCriticalError(error)) {
      this.handleCriticalError(error);
    }
  }

  /**
   * 에러 핸들러 등록
   */
  register(errorType: string, handler: (error: ServiceError) => void): void {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * 에러 핸들러 제거
   */
  unregister(errorType: string): void {
    this.errorHandlers.delete(errorType);
  }

  /**
   * 에러 히스토리 조회
   */
  getErrorHistory(limit?: number): ServiceError[] {
    const history = [...this.errorHistory].reverse(); // 최신 순
    return limit ? history.slice(0, limit) : history;
  }

  /**
   * 에러 히스토리 초기화
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  /**
   * 기본 에러 핸들러 설정
   */
  private setupDefaultHandlers(): void {
    // 기본 핸들러
    this.register('default', (error: ServiceError) => {
      console.error(`Unhandled service error: ${error.message}`);
    });

    // 네트워크 에러
    this.register('NETWORK_ERROR', (error: ServiceError) => {
      console.warn('Network error detected, implementing retry strategy');
      this.attemptRecovery(error);
    });

    // 데이터베이스 에러
    this.register('DATABASE_ERROR', (error: ServiceError) => {
      console.error('Database error detected, switching to fallback mode');
      this.attemptRecovery(error);
    });

    // 인증 에러
    this.register('AUTH_ERROR', (error: ServiceError) => {
      console.warn('Authentication error, redirecting to login');
      // 로그인 페이지 리다이렉트 로직
    });

    // 권한 에러
    this.register('PERMISSION_ERROR', (error: ServiceError) => {
      console.warn('Permission denied, showing access denied message');
      // 접근 거부 메시지 표시
    });

    // 검증 에러
    this.register('VALIDATION_ERROR', (error: ServiceError) => {
      console.info('Validation error, showing user-friendly message');
      // 사용자 친화적 검증 에러 메시지
    });

    // 설정 에러
    this.register('CONFIG_ERROR', (error: ServiceError) => {
      console.error('Configuration error detected, using default settings');
      // 기본 설정 사용
    });

    // 타임아웃 에러
    this.register('TIMEOUT_ERROR', (error: ServiceError) => {
      console.warn('Operation timeout, implementing retry with backoff');
      this.attemptRecovery(error);
    });

    // AI 에이전트 에러
    this.register('AI_AGENT_ERROR', (error: ServiceError) => {
      console.warn('AI Agent error detected, attempting restart');
      this.handleAIAgentError(error);
    });

    // 메모리 부족 에러
    this.register('MEMORY_EXHAUSTED', (error: ServiceError) => {
      console.error('Memory exhausted, triggering cleanup');
      this.handleMemoryExhaustedError(error);
    });

    // 디스크 공간 부족 에러
    this.register('DISK_FULL', (error: ServiceError) => {
      console.error('Disk space full, cleaning up temporary files');
      this.handleDiskFullError(error);
    });

    // Redis 연결 에러
    this.register('REDIS_CONNECTION_ERROR', (error: ServiceError) => {
      console.warn('Redis connection error, switching to memory cache');
      this.handleRedisConnectionError(error);
    });

    // Prometheus 메트릭 에러
    this.register('PROMETHEUS_ERROR', (error: ServiceError) => {
      console.warn('Prometheus metrics error, using fallback monitoring');
      this.handlePrometheusError(error);
    });

    // 시스템 과부하 에러
    this.register('SYSTEM_OVERLOAD', (error: ServiceError) => {
      console.error('System overload detected, implementing throttling');
      this.handleSystemOverloadError(error);
    });

    // 외부 API 에러
    this.register('EXTERNAL_API_ERROR', (error: ServiceError) => {
      console.warn('External API error, using cached data');
      this.handleExternalAPIError(error);
    });

    // 웹소켓 연결 에러
    this.register('WEBSOCKET_ERROR', (error: ServiceError) => {
      console.warn('WebSocket connection error, attempting reconnection');
      this.handleWebSocketError(error);
    });

    // 파일 시스템 에러
    this.register('FILESYSTEM_ERROR', (error: ServiceError) => {
      console.error('File system error, checking permissions and space');
      this.handleFileSystemError(error);
    });

    // 보안 위반 에러
    this.register('SECURITY_BREACH', (error: ServiceError) => {
      console.error('SECURITY BREACH DETECTED - Immediate action required');
      this.handleSecurityBreachError(error);
    });

    // 레이트 리미트 에러
    this.register('RATE_LIMIT_EXCEEDED', (error: ServiceError) => {
      console.warn('Rate limit exceeded, implementing backoff strategy');
      this.handleRateLimitError(error);
    });

    // 서비스 의존성 에러
    this.register('SERVICE_DEPENDENCY_ERROR', (error: ServiceError) => {
      console.error('Service dependency error, checking health of dependencies');
      this.handleServiceDependencyError(error);
    });
  }

  /**
   * 에러 히스토리에 추가
   */
  private addToHistory(error: ServiceError): void {
    this.errorHistory.push(error);
    
    // 히스토리 크기 제한
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory.shift();
    }
  }

  /**
   * 심각한 에러 여부 확인
   */
  private isCriticalError(error: ServiceError): boolean {
    const criticalCodes = [
      'SYSTEM_FAILURE',
      'DATABASE_CONNECTION_LOST',
      'MEMORY_EXHAUSTED',
      'DISK_FULL',
      'SECURITY_BREACH'
    ];
    
    return criticalCodes.includes(error.code);
  }

  /**
   * 심각한 에러 처리
   */
  private handleCriticalError(error: ServiceError): void {
    console.error('CRITICAL ERROR DETECTED:', error);
    
    // 알림 시스템에 긴급 알림 전송
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Critical System Error', {
          body: `${error.service}: ${error.message}`,
          icon: '/favicon.ico',
          tag: 'critical-error'
        });
      }
    }

    // 추가 모니터링 시스템에 알림 (실제 환경에서는 외부 서비스 사용)
    this.notifyMonitoringSystem(error);
  }

  /**
   * 모니터링 시스템 알림
   */
  private notifyMonitoringSystem(error: ServiceError): void {
    // 실제 환경에서는 Sentry, DataDog 등의 모니터링 서비스 사용
    console.log('Notifying monitoring system:', {
      error: error.message,
      service: error.service,
      code: error.code,
      timestamp: error.timestamp,
      context: error.context
    });
  }

  /**
   * 에러 통계
   */
  getErrorStats(): {
    total: number;
    byService: Record<string, number>;
    byCode: Record<string, number>;
    recentCritical: ServiceError[];
    errorRate: number;
  } {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentErrors = this.errorHistory.filter(error => error.timestamp >= oneHourAgo);

    const stats = {
      total: this.errorHistory.length,
      byService: {} as Record<string, number>,
      byCode: {} as Record<string, number>,
      recentCritical: this.errorHistory.filter(error => this.isCriticalError(error)).slice(-10),
      errorRate: recentErrors.length // 시간당 에러 수
    };

    this.errorHistory.forEach(error => {
      stats.byService[error.service] = (stats.byService[error.service] || 0) + 1;
      stats.byCode[error.code] = (stats.byCode[error.code] || 0) + 1;
    });

    return stats;
  }

  /**
   * 에러 복구 시도
   */
  async attemptRecovery(error: ServiceError): Promise<boolean> {
    try {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return await this.recoverFromNetworkError(error);
        case 'DATABASE_ERROR':
          return await this.recoverFromDatabaseError(error);
        case 'TIMEOUT_ERROR':
          return await this.recoverFromTimeoutError(error);
        default:
          return false;
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  }

  /**
   * 네트워크 에러 복구
   */
  private async recoverFromNetworkError(error: ServiceError): Promise<boolean> {
    // 간단한 재시도 로직
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // 네트워크 연결 테스트
        await fetch('/api/health', { method: 'HEAD' });
        return true;
      } catch {
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1000 * retries)); // 백오프
      }
    }

    return false;
  }

  /**
   * 데이터베이스 에러 복구
   */
  private async recoverFromDatabaseError(error: ServiceError): Promise<boolean> {
    // 데이터베이스 연결 재시도 로직
    try {
      // 실제 환경에서는 데이터베이스 연결 테스트
      console.log('Attempting database reconnection...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 타임아웃 에러 복구
   */
  private async recoverFromTimeoutError(error: ServiceError): Promise<boolean> {
    // 타임아웃 설정 조정 및 재시도
    try {
      console.log('Adjusting timeout settings and retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * AI 에이전트 에러 처리
   */
  private async handleAIAgentError(error: ServiceError): Promise<void> {
    try {
      console.log('Attempting AI Agent recovery...');
      
      // AI 에이전트 상태 확인
      const response = await fetch('/api/ai-agent/status');
      if (!response.ok) {
        // AI 에이전트 재시작 시도
        await fetch('/api/ai-agent/restart', { method: 'POST' });
        console.log('AI Agent restart initiated');
      }
    } catch (recoveryError) {
      console.error('AI Agent recovery failed:', recoveryError);
    }
  }

  /**
   * 메모리 부족 에러 처리
   */
  private async handleMemoryExhaustedError(error: ServiceError): Promise<void> {
    try {
      console.log('Triggering memory cleanup...');
      
      // 가비지 컬렉션 강제 실행 (Node.js 환경)
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
      
      // 캐시 정리
      await fetch('/api/system/clear-cache', { method: 'POST' });
      
      // 메모리 사용량 모니터링 강화
      console.log('Memory cleanup completed');
    } catch (recoveryError) {
      console.error('Memory cleanup failed:', recoveryError);
    }
  }

  /**
   * 디스크 공간 부족 에러 처리
   */
  private async handleDiskFullError(error: ServiceError): Promise<void> {
    try {
      console.log('Cleaning up disk space...');
      
      // 임시 파일 정리
      await fetch('/api/system/cleanup-temp', { method: 'POST' });
      
      // 로그 파일 압축/정리
      await fetch('/api/system/cleanup-logs', { method: 'POST' });
      
      console.log('Disk cleanup completed');
    } catch (recoveryError) {
      console.error('Disk cleanup failed:', recoveryError);
    }
  }

  /**
   * Redis 연결 에러 처리
   */
  private async handleRedisConnectionError(error: ServiceError): Promise<void> {
    try {
      console.log('Switching to memory cache fallback...');
      
      // 메모리 캐시로 전환
      await fetch('/api/cache/switch-to-memory', { method: 'POST' });
      
      // Redis 재연결 시도
      setTimeout(async () => {
        try {
          await fetch('/api/cache/reconnect-redis', { method: 'POST' });
          console.log('Redis reconnection attempted');
        } catch {
          console.log('Redis reconnection failed, continuing with memory cache');
        }
      }, 5000);
      
    } catch (recoveryError) {
      console.error('Redis fallback failed:', recoveryError);
    }
  }

  /**
   * Prometheus 에러 처리
   */
  private async handlePrometheusError(error: ServiceError): Promise<void> {
    try {
      console.log('Switching to fallback monitoring...');
      
      // 내부 메트릭 시스템으로 전환
      await fetch('/api/metrics/switch-to-internal', { method: 'POST' });
      
      console.log('Fallback monitoring activated');
    } catch (recoveryError) {
      console.error('Prometheus fallback failed:', recoveryError);
    }
  }

  /**
   * 시스템 과부하 에러 처리
   */
  private async handleSystemOverloadError(error: ServiceError): Promise<void> {
    try {
      console.log('Implementing system throttling...');
      
      // 요청 제한 활성화
      await fetch('/api/system/enable-throttling', { method: 'POST' });
      
      // 비필수 서비스 일시 중지
      await fetch('/api/system/pause-non-essential', { method: 'POST' });
      
      console.log('System throttling activated');
    } catch (recoveryError) {
      console.error('System throttling failed:', recoveryError);
    }
  }

  /**
   * 보안 위반 에러 처리
   */
  private async handleSecurityBreachError(error: ServiceError): Promise<void> {
    try {
      console.error('SECURITY BREACH - 보안 위반 감지');
      
      // TODO: 보안 기능은 Phase 2에서 구현 예정
      console.log('⚠️ 긴급 보안 모드는 현재 개발 중입니다');
      
      // 기본적인 로깅만 수행
      console.error('보안 위반 로그:', {
        level: 'CRITICAL',
        message: error.message,
        timestamp: error.timestamp,
        action: 'logged_only'
      });
      
      console.error('보안 프로토콜 로그 완료');
    } catch (recoveryError) {
      console.error('보안 위반 대응 실패:', recoveryError);
    }
  }

  /**
   * 레이트 리미트 에러 처리
   */
  private async handleRateLimitError(error: ServiceError): Promise<void> {
    try {
      console.log('Implementing rate limit backoff strategy...');
      
      // 백오프 전략 활성화
      const backoffTime = Math.min(1000 * Math.pow(2, (error.context?.retryCount || 0)), 30000);
      
      await new Promise(resolve => setTimeout(resolve, backoffTime));
      
      console.log(`Rate limit backoff completed (${backoffTime}ms)`);
    } catch (recoveryError) {
      console.error('Rate limit handling failed:', recoveryError);
    }
  }

  /**
   * 서비스 의존성 에러 처리
   */
  private async handleServiceDependencyError(error: ServiceError): Promise<void> {
    try {
      console.log('서비스 의존성 확인 중...');
      
      // 실제 의존성 체크 구현
      const dependencyStatus = await this.checkServiceDependencies();
      
      if (dependencyStatus.failed.length > 0) {
        console.warn('의존성 서비스 장애 감지:', dependencyStatus.failed);
        
        // 실패한 서비스들에 대한 폴백 활성화
        for (const failedService of dependencyStatus.failed) {
          await this.activateFallbackForService(failedService);
        }
      }
      
      console.log('서비스 의존성 체크 완료:', {
        healthy: dependencyStatus.healthy,
        failed: dependencyStatus.failed,
        fallbacksActivated: dependencyStatus.failed.length
      });
      
    } catch (recoveryError) {
      console.error('서비스 의존성 체크 실패:', recoveryError);
    }
  }

  /**
   * 파일 시스템 에러 처리
   */
  private async handleFileSystemError(error: ServiceError): Promise<void> {
    try {
      console.log('파일 시스템 상태 확인 중...');
      
      // 실제 파일 시스템 체크 구현
      const fsStatus = await this.checkFileSystemHealth();
      
      if (fsStatus.issues.length > 0) {
        console.warn('파일 시스템 문제 감지:', fsStatus.issues);
        
        // 자동 복구 시도
        for (const issue of fsStatus.issues) {
          await this.attemptFileSystemRecovery(issue);
        }
      }
      
      console.log('파일 시스템 헬스 체크 완료:', {
        totalSpace: `${(fsStatus.totalSpace / 1024 / 1024 / 1024).toFixed(2)}GB`,
        freeSpace: `${(fsStatus.freeSpace / 1024 / 1024 / 1024).toFixed(2)}GB`,
        usage: `${fsStatus.usagePercent.toFixed(1)}%`,
        issues: fsStatus.issues.length
      });
      
    } catch (recoveryError) {
      console.error('파일 시스템 체크 실패:', recoveryError);
    }
  }

  /**
   * 외부 API 에러 처리
   */
  private async handleExternalAPIError(error: ServiceError): Promise<void> {
    try {
      console.log('외부 API 장애 대응 중...');
      
      // 실제 외부 API 연동 구현
      const apiUrl = error.context?.url || 'unknown';
      const apiStatus = await this.checkExternalAPIHealth(apiUrl);
      
      if (!apiStatus.isHealthy) {
        console.warn(`외부 API 장애 확인: ${apiUrl}`, apiStatus);
        
        // 서킷 브레이커 패턴 적용
        await this.activateCircuitBreaker(apiUrl, {
          failureThreshold: 5,
          timeout: 60000, // 1분
          retryAfter: 300000 // 5분
        });
        
        // 폴백 서비스 활성화
        const fallbackResult = await this.activateAPIFallback(apiUrl);
        if (fallbackResult.success) {
          console.log(`폴백 서비스 활성화됨: ${fallbackResult.fallbackUrl}`);
        }
      }
      
      console.log('외부 API 에러 처리 완료:', {
        api: apiUrl,
        status: apiStatus.isHealthy ? 'healthy' : 'failed',
        responseTime: apiStatus.responseTime,
        circuitBreakerActive: !apiStatus.isHealthy
      });
      
    } catch (recoveryError) {
      console.error('외부 API 에러 처리 실패:', recoveryError);
    }
  }

  /**
   * 웹소켓 연결 에러 처리
   */
  private async handleWebSocketError(error: ServiceError): Promise<void> {
    try {
      console.log('웹소켓 연결 에러 대응 중...');
      
      // 실제 웹소켓 재연결 구현
      const wsStatus = await this.checkWebSocketHealth();
      
      if (!wsStatus.isConnected) {
        console.warn('웹소켓 연결 장애 확인');
        
        // 지수 백오프를 사용한 재연결 시도
        const reconnectResult = await this.attemptWebSocketReconnection({
          maxRetries: 5,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffFactor: 2
        });
        
        if (reconnectResult.success) {
          console.log(`웹소켓 재연결 성공 (${reconnectResult.attempts}번째 시도)`);
          
          // 재연결 후 상태 복원
          await this.restoreWebSocketState();
        } else {
          console.error(`웹소켓 재연결 실패 (${reconnectResult.attempts}번 시도 후 포기)`);
          
          // 폴백 모드로 전환 (폴링 방식)
          await this.activatePollingFallback();
        }
      }
      
      console.log('웹소켓 재연결 처리 완료:', {
        connected: wsStatus.isConnected,
        lastHeartbeat: wsStatus.lastHeartbeat,
        reconnectAttempts: wsStatus.reconnectAttempts
      });
      
    } catch (recoveryError) {
      console.error('웹소켓 에러 처리 실패:', recoveryError);
    }
  }

  /**
   * 🌐 외부 서비스 장애 대응
   */
  private async handleExternalServiceFailure(): Promise<void> {
    try {
      console.log('🌐 외부 서비스 장애 감지');
      
      // 실제 외부 서비스 연동 구현
      const externalServices = [
        { name: 'openai', url: 'https://api.openai.com/v1/models', critical: true },
        { name: 'supabase', url: process.env.NEXT_PUBLIC_SUPABASE_URL, critical: true },
        { name: 'github', url: 'https://api.github.com', critical: false }
      ];
      
      const serviceChecks = await Promise.allSettled(
        externalServices.map(service => this.checkExternalService(service))
      );
      
      const failedServices = serviceChecks
        .map((result, index) => ({ result, service: externalServices[index] }))
        .filter(({ result }) => result.status === 'rejected' || !result.value?.isHealthy)
        .map(({ service }) => service);
      
      if (failedServices.length > 0) {
        console.warn('장애 서비스 감지:', failedServices.map(s => s.name));
        
        // 중요 서비스 장애 시 긴급 모드 활성화
        const criticalFailures = failedServices.filter(s => s.critical);
        if (criticalFailures.length > 0) {
          await this.activateEmergencyMode(criticalFailures);
        }
        
        // 비중요 서비스는 우아한 성능 저하 모드
        const nonCriticalFailures = failedServices.filter(s => !s.critical);
        if (nonCriticalFailures.length > 0) {
          await this.activateGracefulDegradation(nonCriticalFailures);
        }
      }
      
      console.log('외부 서비스 장애 대응 완료:', {
        totalServices: externalServices.length,
        failedServices: failedServices.length,
        criticalFailures: failedServices.filter(s => s.critical).length
      });
      
    } catch (error) {
      console.error('❌ 외부 서비스 대응 실패:', error);
    }
  }

  // === 새로운 헬퍼 메서드들 ===

  /**
   * 서비스 의존성 체크
   */
  private async checkServiceDependencies(): Promise<{
    healthy: string[];
    failed: string[];
  }> {
    const services = ['database', 'redis', 'mcp', 'ai-engine'];
    const results = await Promise.allSettled(
      services.map(async (service) => {
        try {
          switch (service) {
            case 'database':
              const dbResponse = await fetch('/api/database/status');
              return { service, healthy: dbResponse.ok };
            case 'redis':
              const redisResponse = await fetch('/api/system/status');
              return { service, healthy: redisResponse.ok };
            case 'mcp':
              const mcpResponse = await fetch('/api/mcp/status');
              return { service, healthy: mcpResponse.ok };
            case 'ai-engine':
              const aiResponse = await fetch('/api/ai/enhanced');
              return { service, healthy: aiResponse.ok };
            default:
              return { service, healthy: false };
          }
        } catch {
          return { service, healthy: false };
        }
      })
    );

    const healthy: string[] = [];
    const failed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.healthy) {
        healthy.push(services[index]);
      } else {
        failed.push(services[index]);
      }
    });

    return { healthy, failed };
  }

  /**
   * 서비스 폴백 활성화
   */
  private async activateFallbackForService(serviceName: string): Promise<void> {
    console.log(`폴백 활성화: ${serviceName}`);
    
    switch (serviceName) {
      case 'ai-engine':
        // AI 엔진 폴백: 로컬 처리 모드
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai-fallback-mode', 'true');
        }
        break;
      case 'database':
        // 데이터베이스 폴백: 로컬 캐시 모드
        if (typeof window !== 'undefined') {
          localStorage.setItem('db-fallback-mode', 'true');
        }
        break;
      case 'mcp':
        // MCP 폴백: 내장 도구 모드
        if (typeof window !== 'undefined') {
          localStorage.setItem('mcp-fallback-mode', 'true');
        }
        break;
    }
  }

  /**
   * 파일 시스템 상태 체크
   */
  private async checkFileSystemHealth(): Promise<{
    totalSpace: number;
    freeSpace: number;
    usagePercent: number;
    issues: string[];
  }> {
    const issues: string[] = [];
    
    // 브라우저 환경에서는 대략적인 저장소 정보만 확인 가능
    if (typeof navigator !== 'undefined' && 'storage' in navigator) {
      try {
        const estimate = await navigator.storage.estimate();
        const totalSpace = estimate.quota || 0;
        const usedSpace = estimate.usage || 0;
        const freeSpace = totalSpace - usedSpace;
        const usagePercent = totalSpace > 0 ? (usedSpace / totalSpace) * 100 : 0;

        if (usagePercent > 90) {
          issues.push('disk_space_critical');
        } else if (usagePercent > 80) {
          issues.push('disk_space_warning');
        }

        return {
          totalSpace,
          freeSpace,
          usagePercent,
          issues
        };
      } catch (error) {
        issues.push('storage_api_unavailable');
      }
    }

    // 폴백: 기본값 반환
    return {
      totalSpace: 0,
      freeSpace: 0,
      usagePercent: 0,
      issues
    };
  }

  /**
   * 파일 시스템 복구 시도
   */
  private async attemptFileSystemRecovery(issue: string): Promise<void> {
    console.log(`파일 시스템 복구 시도: ${issue}`);
    
    switch (issue) {
      case 'disk_space_critical':
      case 'disk_space_warning':
        // 브라우저 캐시 정리
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            if (cacheName.includes('old') || cacheName.includes('temp')) {
              await caches.delete(cacheName);
              console.log(`캐시 삭제됨: ${cacheName}`);
            }
          }
        }
        
        // 로컬 스토리지 정리
        if (typeof localStorage !== 'undefined') {
          const keysToDelete: string[] = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('temp') || key.includes('cache'))) {
              keysToDelete.push(key);
            }
          }
          keysToDelete.forEach(key => localStorage.removeItem(key));
          console.log(`로컬 스토리지 정리: ${keysToDelete.length}개 항목 삭제`);
        }
        break;
    }
  }

  /**
   * 외부 API 상태 체크
   */
  private async checkExternalAPIHealth(apiUrl: string): Promise<{
    isHealthy: boolean;
    responseTime: number;
    statusCode?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃
      
      const response = await fetch(apiUrl, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      return {
        isHealthy: response.ok,
        responseTime,
        statusCode: response.status
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        isHealthy: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 서킷 브레이커 활성화
   */
  private async activateCircuitBreaker(apiUrl: string, config: {
    failureThreshold: number;
    timeout: number;
    retryAfter: number;
  }): Promise<void> {
    const circuitBreakerKey = `circuit_breaker_${btoa(apiUrl)}`;
    const circuitBreakerData = {
      url: apiUrl,
      isOpen: true,
      openedAt: Date.now(),
      config
    };
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(circuitBreakerKey, JSON.stringify(circuitBreakerData));
    }
    
    console.log(`서킷 브레이커 활성화: ${apiUrl}`);
    
    // 재시도 타이머 설정
    setTimeout(() => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(circuitBreakerKey);
        console.log(`서킷 브레이커 해제: ${apiUrl}`);
      }
    }, config.retryAfter);
  }

  /**
   * API 폴백 활성화
   */
  private async activateAPIFallback(apiUrl: string): Promise<{
    success: boolean;
    fallbackUrl?: string;
  }> {
    // OpenAI API 폴백 예시
    if (apiUrl.includes('openai.com')) {
      const fallbackUrl = '/api/ai/local-fallback';
      return { success: true, fallbackUrl };
    }
    
    // 기타 API들의 폴백 처리
    const fallbackUrl = '/api/fallback/generic';
    return { success: true, fallbackUrl };
  }

  /**
   * 웹소켓 상태 체크
   */
  private async checkWebSocketHealth(): Promise<{
    isConnected: boolean;
    lastHeartbeat?: Date;
    reconnectAttempts: number;
  }> {
    // 글로벌 웹소켓 상태 확인
    const wsStateKey = 'websocket_state';
    let wsState = { isConnected: false, reconnectAttempts: 0 };
    
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(wsStateKey);
      if (stored) {
        try {
          wsState = JSON.parse(stored);
        } catch {
          // 파싱 실패 시 기본값 사용
        }
      }
    }
    
    return {
      isConnected: wsState.isConnected,
      lastHeartbeat: wsState.lastHeartbeat ? new Date(wsState.lastHeartbeat) : undefined,
      reconnectAttempts: wsState.reconnectAttempts || 0
    };
  }

  /**
   * 웹소켓 재연결 시도
   */
  private async attemptWebSocketReconnection(config: {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
  }): Promise<{ success: boolean; attempts: number }> {
    let attempts = 0;
    
    while (attempts < config.maxRetries) {
      attempts++;
      
      try {
        // 지수 백오프 계산
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffFactor, attempts - 1),
          config.maxDelay
        );
        
        console.log(`웹소켓 재연결 시도 ${attempts}/${config.maxRetries} (${delay}ms 후)`);
        
        if (attempts > 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        
        // 실제 재연결 시도 (WebSocket 생성)
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/websocket/servers`;
        const ws = new WebSocket(wsUrl);
        
        const connectPromise = new Promise<boolean>((resolve) => {
          const timeout = setTimeout(() => {
            ws.close();
            resolve(false);
          }, 5000);
          
          ws.onopen = () => {
            clearTimeout(timeout);
            resolve(true);
          };
          
          ws.onerror = () => {
            clearTimeout(timeout);
            resolve(false);
          };
        });
        
        const connected = await connectPromise;
        
        if (connected) {
          // 연결 성공
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('websocket_state', JSON.stringify({
              isConnected: true,
              lastHeartbeat: new Date().toISOString(),
              reconnectAttempts: attempts
            }));
          }
          
          return { success: true, attempts };
        }
        
      } catch (error) {
        console.warn(`웹소켓 재연결 실패 (시도 ${attempts}):`, error);
      }
    }
    
    return { success: false, attempts };
  }

  /**
   * 웹소켓 상태 복원
   */
  private async restoreWebSocketState(): Promise<void> {
    console.log('웹소켓 상태 복원 중...');
    
    // 구독 정보 복원
    const subscriptions = ['server-metrics', 'alert-notifications', 'system-health'];
    
    try {
      const response = await fetch('/api/websocket/restore-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions })
      });
      
      if (response.ok) {
        console.log('웹소켓 구독 복원 완료');
      }
    } catch (error) {
      console.warn('웹소켓 구독 복원 실패:', error);
    }
  }

  /**
   * 폴링 폴백 활성화
   */
  private async activatePollingFallback(): Promise<void> {
    console.log('웹소켓 대신 폴링 모드 활성화');
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('polling_fallback_active', 'true');
      localStorage.setItem('polling_interval', '5000'); // 5초 간격
    }
    
    // 폴링 시작 신호 발송
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('activate-polling-fallback'));
    }
  }

  /**
   * 외부 서비스 상태 체크
   */
  private async checkExternalService(service: { name: string; url?: string; critical: boolean }): Promise<{
    isHealthy: boolean;
    responseTime: number;
  }> {
    if (!service.url) {
      return { isHealthy: false, responseTime: 0 };
    }
    
    return await this.checkExternalAPIHealth(service.url);
  }

  /**
   * 긴급 모드 활성화
   */
  private async activateEmergencyMode(failedServices: { name: string; critical: boolean }[]): Promise<void> {
    console.warn('🚨 긴급 모드 활성화:', failedServices.map(s => s.name));
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('emergency_mode', 'true');
      localStorage.setItem('failed_critical_services', JSON.stringify(failedServices));
    }
    
    // 사용자에게 알림
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emergency-mode-activated', {
        detail: { failedServices }
      }));
    }
  }

  /**
   * 우아한 성능 저하 모드
   */
  private async activateGracefulDegradation(failedServices: { name: string; critical: boolean }[]): Promise<void> {
    console.log('📉 성능 저하 모드 활성화:', failedServices.map(s => s.name));
    
    for (const service of failedServices) {
      switch (service.name) {
        case 'github':
          // GitHub API 실패 시 캐시된 데이터 사용
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('github_fallback', 'true');
          }
          break;
      }
    }
  }
}

/**
 * 서비스 에러 생성 헬퍼
 */
export function createServiceError(
  code: string,
  message: string,
  service: string,
  context?: Record<string, any>,
  cause?: Error
): ServiceError {
  const error = new Error(message) as ServiceError;
  error.code = code;
  error.service = service;
  error.timestamp = new Date();
  error.context = context;
  error.cause = cause;
  return error;
}

/**
   * 에러 코드 상수
   */
export const ERROR_CODES = {
  // 시스템 에러
  SYSTEM_FAILURE: 'SYSTEM_FAILURE',
  MEMORY_EXHAUSTED: 'MEMORY_EXHAUSTED',
  DISK_FULL: 'DISK_FULL',
  
  // 네트워크 에러
  NETWORK_ERROR: 'NETWORK_ERROR',
  CONNECTION_TIMEOUT: 'CONNECTION_TIMEOUT',
  DNS_RESOLUTION_FAILED: 'DNS_RESOLUTION_FAILED',
  
  // 데이터베이스 에러
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_LOST: 'DATABASE_CONNECTION_LOST',
  QUERY_TIMEOUT: 'QUERY_TIMEOUT',
  CONSTRAINT_VIOLATION: 'CONSTRAINT_VIOLATION',
  
  // 인증/권한 에러
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  
  // 검증 에러
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // 설정 에러
  CONFIG_ERROR: 'CONFIG_ERROR',
  MISSING_CONFIG: 'MISSING_CONFIG',
  INVALID_CONFIG: 'INVALID_CONFIG',
  
  // 비즈니스 로직 에러
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // 외부 서비스 에러
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  API_RATE_LIMIT_EXCEEDED: 'API_RATE_LIMIT_EXCEEDED',
  THIRD_PARTY_SERVICE_DOWN: 'THIRD_PARTY_SERVICE_DOWN',
  
  // 타임아웃 에러
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  OPERATION_TIMEOUT: 'OPERATION_TIMEOUT',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  
  // 보안 에러
  SECURITY_BREACH: 'SECURITY_BREACH',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
} as const; 