/**
 * 🟢 TDD Green - SSE 건강 모니터
 *
 * @description
 * 테스트를 통과하는 최소한의 SSE 연결 건강 상태 모니터링
 * 연결 품질과 안정성을 추적합니다.
 */

export interface SSEHealthMonitorConfig {
  checkInterval?: number;
  timeoutThreshold?: number;
  errorThreshold?: number;
}

export interface HealthStatus {
  isHealthy: boolean;
  lastCheck: Date;
  errorCount: number;
  consecutiveErrors: number;
  uptime: number;
}

export class SSEHealthMonitor {
  private config: Required<SSEHealthMonitorConfig>;
  private healthStatus: HealthStatus;
  private startTime: Date;
  private monitoringInterval?: NodeJS.Timeout;
  private isMonitoring = false;

  constructor(config: SSEHealthMonitorConfig = {}) {
    this.config = {
      checkInterval: config.checkInterval || 1000,
      timeoutThreshold: config.timeoutThreshold || 5000,
      errorThreshold: config.errorThreshold || 3,
    };

    this.startTime = new Date();
    this.healthStatus = {
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0,
      consecutiveErrors: 0,
      uptime: 0,
    };
  }

  /**
   * 📊 건강 상태 조회
   */
  getHealthStatus(): HealthStatus {
    return {
      ...this.healthStatus,
      uptime: Date.now() - this.startTime.getTime(),
    };
  }

  /**
   * 🏥 건강 체크 수행
   */
  async performHealthCheck(): Promise<boolean> {
    this.healthStatus.lastCheck = new Date();

    // 건강 체크 로직 (시뮬레이션)
    const isHealthy =
      this.healthStatus.consecutiveErrors < this.config.errorThreshold;
    this.healthStatus.isHealthy = isHealthy;

    return isHealthy;
  }

  /**
   * 🚨 오류 기록
   */
  recordError(errorMessage: string): void {
    this.healthStatus.errorCount++;
    this.healthStatus.consecutiveErrors++;

    // 오류 임계치 확인
    if (this.healthStatus.consecutiveErrors >= this.config.errorThreshold) {
      this.healthStatus.isHealthy = false;
    }

    console.warn(
      `🚨 SSE 건강 모니터 오류 기록: ${errorMessage} (연속 ${this.healthStatus.consecutiveErrors}회)`
    );
  }

  /**
   * ✅ 성공 기록
   */
  recordSuccess(): void {
    this.healthStatus.consecutiveErrors = 0;
    this.healthStatus.isHealthy = true;
  }

  /**
   * 🔄 모니터링 시작 (서버리스 환경에서 비활성화)
   */
  startMonitoring(): void {
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      console.warn('⚠️ 서버리스 환경에서 SSE 지속적 모니터링 비활성화');
      console.warn('📊 Vercel 플랫폼 모니터링 사용 권장:');
      console.warn('   - Functions > Logs 탭에서 SSE 연결 로그 확인');
      console.warn('   - Analytics 탭에서 실시간 연결 메트릭 확인');
      console.warn('   - Edge Network 탭에서 네트워크 상태 확인');

      // 서버리스 환경에서는 즉시 성공 상태로 설정
      this.healthStatus.isHealthy = true;
      this.healthStatus.lastCheck = new Date();
      return;
    }

    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      void (async () => {
        try {
          await this.performHealthCheck();
        } catch (error) {
          this.recordError(`모니터링 체크 실패: ${error}`);
        }
      })();
    }, this.config.checkInterval);

    console.log(
      `🔄 SSE 건강 모니터링 시작 (${this.config.checkInterval}ms 간격) - 로컬 환경`
    );
  }

  /**
   * ⏹️ 모니터링 중지
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
    this.isMonitoring = false;
    console.log('⏹️ SSE 건강 모니터링 중지');
  }

  /**
   * 🗑️ 리소스 정리
   */
  destroy(): void {
    this.stopMonitoring();

    // 상태 초기화
    this.healthStatus = {
      isHealthy: false,
      lastCheck: new Date(),
      errorCount: 0,
      consecutiveErrors: 0,
      uptime: 0,
    };

    console.log('🗑️ SSE 건강 모니터 파기 완료');
  }

  /**
   * 📈 통계 조회
   */
  getStatistics(): {
    totalErrors: number;
    consecutiveErrors: number;
    uptime: number;
    errorRate: number;
    lastCheckTime: Date;
  } {
    const uptime = Date.now() - this.startTime.getTime();
    const uptimeInMinutes = uptime / (1000 * 60);
    const errorRate =
      uptimeInMinutes > 0 ? this.healthStatus.errorCount / uptimeInMinutes : 0;

    return {
      totalErrors: this.healthStatus.errorCount,
      consecutiveErrors: this.healthStatus.consecutiveErrors,
      uptime,
      errorRate: Math.round(errorRate * 100) / 100, // 소수점 2자리
      lastCheckTime: this.healthStatus.lastCheck,
    };
  }

  /**
   * 🔧 임계치 업데이트
   */
  updateThresholds(newThresholds: Partial<SSEHealthMonitorConfig>): void {
    if (newThresholds.errorThreshold !== undefined) {
      this.config.errorThreshold = newThresholds.errorThreshold;
    }
    if (newThresholds.timeoutThreshold !== undefined) {
      this.config.timeoutThreshold = newThresholds.timeoutThreshold;
    }
    if (newThresholds.checkInterval !== undefined) {
      this.config.checkInterval = newThresholds.checkInterval;

      // 모니터링 재시작
      if (this.isMonitoring) {
        this.stopMonitoring();
        this.startMonitoring();
      }
    }

    console.log('🔧 SSE 건강 모니터 임계치 업데이트 완료', newThresholds);
  }

  /**
   * 🔄 상태 리셋
   */
  reset(): void {
    this.healthStatus = {
      isHealthy: true,
      lastCheck: new Date(),
      errorCount: 0,
      consecutiveErrors: 0,
      uptime: 0,
    };
    this.startTime = new Date();

    console.log('🔄 SSE 건강 모니터 상태 리셋 완료');
  }
}
