/**
 * 🟢 TDD Green - SSE 건강 모니터
 *
 * @description
 * 테스트를 통과하는 최소한의 SSE 연결 건강 상태 모니터링
 * 연결 품질과 안정성을 추적합니다.
 *
 * v5.80.1 변경사항:
 * - 모니터링 주기 1초 → 5분으로 변경 (Vercel 사용량 최적화)
 * - SystemInactivityService 통합 (시스템 비활성 시 자동 중지)
 */

import { logger } from '@/lib/logging';
import { systemInactivityService } from '../system/SystemInactivityService';

export interface SSEHealthMonitorConfig {
  /** 모니터링 주기 (기본값: 5분 = 300000ms) */
  checkInterval?: number;
  /** 타임아웃 임계값 (기본값: 5초) */
  timeoutThreshold?: number;
  /** 오류 임계값 (기본값: 3) */
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
  private systemResumeHandler?: () => void;

  constructor(config: SSEHealthMonitorConfig = {}) {
    // 기본값: 5분 (300000ms) - Vercel 사용량 최적화
    this.config = {
      checkInterval: config.checkInterval || 300000, // 5분
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

    logger.warn(
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
   * SystemInactivityService와 통합되어 시스템 비활성 시 자동 중지
   */
  startMonitoring(): void {
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      logger.warn('⚠️ 서버리스 환경에서 SSE 지속적 모니터링 비활성화');
      logger.warn('📊 Vercel 플랫폼 모니터링 사용 권장:');
      logger.warn('   - Functions > Logs 탭에서 SSE 연결 로그 확인');
      logger.warn('   - Analytics 탭에서 실시간 연결 메트릭 확인');
      logger.warn('   - Edge Network 탭에서 네트워크 상태 확인');

      // 서버리스 환경에서는 즉시 성공 상태로 설정
      this.healthStatus.isHealthy = true;
      this.healthStatus.lastCheck = new Date();
      return;
    }

    if (this.isMonitoring) return;

    // SystemInactivityService에 백그라운드 작업 등록
    systemInactivityService.registerBackgroundTask(
      'sse-health-monitor',
      'SSE 건강 모니터링',
      () =>
        void this.performHealthCheck().catch((e) =>
          this.recordError(`모니터링 체크 실패: ${e}`)
        ),
      this.config.checkInterval
    );

    // 시스템 재개 이벤트 리스너 등록
    this.systemResumeHandler = () => {
      logger.info('🔄 시스템 재개 - SSE 모니터링 재시작');
      this.healthStatus.isHealthy = true;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('system-resume', this.systemResumeHandler);
    }

    this.isMonitoring = true;

    // 자체 인터벌도 유지 (백업용)
    this.monitoringInterval = setInterval(() => {
      // 시스템이 활성 상태일 때만 실행
      if (!systemInactivityService.isActive()) return;

      void (async () => {
        try {
          await this.performHealthCheck();
        } catch (error) {
          this.recordError(`모니터링 체크 실패: ${error}`);
        }
      })();
    }, this.config.checkInterval);

    const intervalMinutes = Math.round(this.config.checkInterval / 60000);
    logger.info(
      `🔄 SSE 건강 모니터링 시작 (${intervalMinutes}분 간격, SystemInactivityService 통합) - 로컬 환경`
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

    // SystemInactivityService에서 백그라운드 작업 해제
    systemInactivityService.unregisterBackgroundTask('sse-health-monitor');

    // 시스템 재개 이벤트 리스너 제거
    if (this.systemResumeHandler && typeof window !== 'undefined') {
      window.removeEventListener('system-resume', this.systemResumeHandler);
      this.systemResumeHandler = undefined;
    }

    this.isMonitoring = false;
    logger.info('⏹️ SSE 건강 모니터링 중지');
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

    // 시스템 재개 이벤트 리스너 정리 (stopMonitoring에서 누락된 경우 대비)
    if (this.systemResumeHandler && typeof window !== 'undefined') {
      window.removeEventListener('system-resume', this.systemResumeHandler);
      this.systemResumeHandler = undefined;
    }

    logger.info('🗑️ SSE 건강 모니터 파기 완료');
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

    logger.info('🔧 SSE 건강 모니터 임계치 업데이트 완료', newThresholds);
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

    logger.info('🔄 SSE 건강 모니터 상태 리셋 완료');
  }
}
