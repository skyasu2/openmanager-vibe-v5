/**
 * 🚨 긴급 중지 상태 사용량 최적화기
 *
 * 시스템이 중지된 상태에서 불필요한 API 호출을 최소화하여
 * Vercel 사용량을 극적으로 감소시킵니다.
 */

import { systemLogger } from './logger';

export interface IdleOptimizationConfig {
  // 중지 상태 감지 설정
  idleDetectionInterval: number; // 중지 상태 확인 간격 (ms)
  idleThreshold: number; // 중지 상태로 간주할 시간 (ms)

  // 폴링 간격 설정
  normalPollingInterval: number; // 정상 상태 폴링 간격
  idlePollingInterval: number; // 중지 상태 폴링 간격
  maxIdlePollingInterval: number; // 최대 중지 상태 폴링 간격

  // 백그라운드 프로세스 제어
  disableSchedulersOnIdle: boolean; // 중지 상태에서 스케줄러 비활성화
  disableKeepAliveOnIdle: boolean; // 중지 상태에서 Keep-Alive 비활성화

  // 응급 모드 설정
  emergencyMode: boolean; // 응급 모드 활성화
  emergencyPollingInterval: number; // 응급 모드 폴링 간격
}

export class EmergencyIdleStateOptimizer {
  private static instance: EmergencyIdleStateOptimizer;
  private config: IdleOptimizationConfig;
  private isIdle = false;
  private lastActivity = Date.now();
  private idleStartTime?: number;
  private pollingIntervals: Map<string, number> = new Map();
  private schedulerStates: Map<string, boolean> = new Map();

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initializeOptimizer();
  }

  public static getInstance(): EmergencyIdleStateOptimizer {
    if (!EmergencyIdleStateOptimizer.instance) {
      EmergencyIdleStateOptimizer.instance = new EmergencyIdleStateOptimizer();
    }
    return EmergencyIdleStateOptimizer.instance;
  }

  private getDefaultConfig(): IdleOptimizationConfig {
    // 🚨 응급 조치: 환경변수에서 설정 로드
    const emergencyMode = process.env.EMERGENCY_IDLE_OPTIMIZATION === 'true';

    return {
      idleDetectionInterval: parseInt(
        process.env.IDLE_DETECTION_INTERVAL || '60000'
      ), // 1분
      idleThreshold: parseInt(process.env.IDLE_THRESHOLD || '300000'), // 5분

      normalPollingInterval: parseInt(
        process.env.NORMAL_POLLING_INTERVAL || '30000'
      ), // 30초
      idlePollingInterval: parseInt(
        process.env.IDLE_POLLING_INTERVAL || '300000'
      ), // 5분
      maxIdlePollingInterval: parseInt(
        process.env.MAX_IDLE_POLLING_INTERVAL || '600000'
      ), // 10분

      disableSchedulersOnIdle:
        process.env.DISABLE_SCHEDULERS_ON_IDLE !== 'false',
      disableKeepAliveOnIdle:
        process.env.DISABLE_KEEP_ALIVE_ON_IDLE !== 'false',

      emergencyMode,
      emergencyPollingInterval: parseInt(
        process.env.EMERGENCY_POLLING_INTERVAL || '600000'
      ), // 10분
    };
  }

  /**
   * 🚀 최적화기 초기화
   */
  private initializeOptimizer(): void {
    // 빌드 시간에는 실행하지 않음
    if (
      typeof window === 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      return;
    }

    systemLogger.system('🚨 긴급 중지 상태 최적화기 초기화');

    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      this.setupBrowserOptimization();
    }

    // 서버 환경에서만 실행
    if (typeof window === 'undefined') {
      this.setupServerOptimization();
    }

    systemLogger.system(
      `✅ 중지 상태 최적화기 활성화 (응급모드: ${this.config.emergencyMode})`
    );
  }

  /**
   * 🌐 브라우저 최적화 설정
   */
  private setupBrowserOptimization(): void {
    // 페이지 가시성 API로 중지 상태 감지
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onIdle();
      } else {
        this.onActive();
      }
    });

    // 사용자 활동 감지
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];
    activityEvents.forEach(event => {
      document.addEventListener(event, () => this.recordActivity(), {
        passive: true,
      });
    });

    // 주기적인 중지 상태 확인
    setInterval(() => {
      this.checkIdleState();
    }, this.config.idleDetectionInterval);
  }

  /**
   * 🖥️ 서버 최적화 설정
   */
  private setupServerOptimization(): void {
    // 환경변수 기반 응급 모드 확인
    if (this.config.emergencyMode) {
      systemLogger.system('🚨 서버 응급 모드 활성화');
      this.activateEmergencyMode();
    }

    // 시스템 신호 처리
    const gracefulShutdown = () => {
      systemLogger.system('📡 Graceful shutdown - 중지 상태 최적화 적용');
      this.onIdle();
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);
  }

  /**
   * 📝 활동 기록
   */
  public recordActivity(): void {
    this.lastActivity = Date.now();

    if (this.isIdle) {
      this.onActive();
    }
  }

  /**
   * 🔍 중지 상태 확인
   */
  private checkIdleState(): void {
    const idleDuration = Date.now() - this.lastActivity;

    if (!this.isIdle && idleDuration > this.config.idleThreshold) {
      this.onIdle();
    } else if (this.isIdle && idleDuration < this.config.idleThreshold) {
      this.onActive();
    }
  }

  /**
   * 😴 중지 상태 활성화
   */
  private onIdle(): void {
    if (this.isIdle) return;

    this.isIdle = true;
    this.idleStartTime = Date.now();

    systemLogger.system('😴 중지 상태 감지 - 사용량 최적화 시작');

    // 폴링 간격 증가
    this.optimizePollingIntervals();

    // 백그라운드 프로세스 비활성화
    this.disableBackgroundProcesses();

    // 응급 모드 적용
    if (this.config.emergencyMode) {
      this.activateEmergencyMode();
    }

    // 브라우저 환경에서 이벤트 발송
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('system:idle-state-activated'));
    }
  }

  /**
   * 🚀 활성 상태 복원
   */
  private onActive(): void {
    if (!this.isIdle) return;

    const idleDuration = this.idleStartTime
      ? Date.now() - this.idleStartTime
      : 0;

    this.isIdle = false;
    this.idleStartTime = undefined;

    systemLogger.system(
      `🚀 활성 상태 복원 (중지 시간: ${Math.round(idleDuration / 1000)}초)`
    );

    // 폴링 간격 복원
    this.restorePollingIntervals();

    // 백그라운드 프로세스 재활성화
    this.restoreBackgroundProcesses();

    // 브라우저 환경에서 이벤트 발송
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('system:active-state-restored'));
    }
  }

  /**
   * ⏰ 폴링 간격 최적화
   */
  private optimizePollingIntervals(): void {
    const targetInterval = this.config.emergencyMode
      ? this.config.emergencyPollingInterval
      : this.config.idlePollingInterval;

    // React Query 전역 설정 업데이트
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      queryClient.setDefaultOptions({
        queries: {
          refetchInterval: targetInterval,
          refetchIntervalInBackground: false,
          refetchOnWindowFocus: false,
        },
      });
    }

    // 글로벌 폴링 간격 설정
    if (typeof global !== 'undefined') {
      (global as any).OPTIMIZED_POLLING_INTERVAL = targetInterval;
    }

    systemLogger.system(`⏰ 폴링 간격 최적화: ${targetInterval / 1000}초`);
  }

  /**
   * ⏰ 폴링 간격 복원
   */
  private restorePollingIntervals(): void {
    const normalInterval = this.config.normalPollingInterval;

    // React Query 전역 설정 복원
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      queryClient.setDefaultOptions({
        queries: {
          refetchInterval: normalInterval,
          refetchIntervalInBackground: true,
          refetchOnWindowFocus: true,
        },
      });
    }

    // 글로벌 폴링 간격 복원
    if (typeof global !== 'undefined') {
      delete (global as any).OPTIMIZED_POLLING_INTERVAL;
    }

    systemLogger.system(`⏰ 폴링 간격 복원: ${normalInterval / 1000}초`);
  }

  /**
   * 🛑 백그라운드 프로세스 비활성화
   */
  private disableBackgroundProcesses(): void {
    if (!this.config.disableSchedulersOnIdle) return;

    systemLogger.system('🛑 백그라운드 프로세스 비활성화 시작');

    // 환경변수 설정으로 스케줄러 비활성화
    if (typeof process !== 'undefined') {
      process.env.SERVER_DATA_SCHEDULER_DISABLED = 'true';
      process.env.KEEP_ALIVE_SCHEDULER_DISABLED = 'true';
      process.env.UNIFIED_METRICS_SCHEDULER_DISABLED = 'true';
      process.env.AI_ANALYSIS_SCHEDULER_DISABLED = 'true';
    }

    // 글로벌 플래그 설정
    if (typeof global !== 'undefined') {
      (global as any).IDLE_STATE_SCHEDULERS_DISABLED = true;
    }

    systemLogger.system('✅ 백그라운드 프로세스 비활성화 완료');
  }

  /**
   * 🚀 백그라운드 프로세스 재활성화
   */
  private restoreBackgroundProcesses(): void {
    if (!this.config.disableSchedulersOnIdle) return;

    systemLogger.system('🚀 백그라운드 프로세스 재활성화 시작');

    // 환경변수 복원
    if (typeof process !== 'undefined') {
      delete process.env.SERVER_DATA_SCHEDULER_DISABLED;
      delete process.env.KEEP_ALIVE_SCHEDULER_DISABLED;
      delete process.env.UNIFIED_METRICS_SCHEDULER_DISABLED;
      delete process.env.AI_ANALYSIS_SCHEDULER_DISABLED;
    }

    // 글로벌 플래그 제거
    if (typeof global !== 'undefined') {
      delete (global as any).IDLE_STATE_SCHEDULERS_DISABLED;
    }

    systemLogger.system('✅ 백그라운드 프로세스 재활성화 완료');
  }

  /**
   * 🚨 응급 모드 활성화
   */
  private activateEmergencyMode(): void {
    systemLogger.system('🚨 응급 모드 활성화');

    // 극도의 폴링 간격 설정
    const emergencyInterval = this.config.emergencyPollingInterval;

    // 모든 타이머와 인터벌 최적화
    if (typeof global !== 'undefined') {
      (global as any).EMERGENCY_MODE_ACTIVE = true;
      (global as any).EMERGENCY_POLLING_INTERVAL = emergencyInterval;
    }

    // 환경변수 응급 설정
    if (typeof process !== 'undefined') {
      process.env.EMERGENCY_MODE_ACTIVE = 'true';
      process.env.SYSTEM_POLLING_DISABLED = 'true';
    }

    systemLogger.system(
      `🚨 응급 모드: 폴링 간격 ${emergencyInterval / 1000}초로 설정`
    );
  }

  /**
   * 📊 현재 최적화 상태 조회
   */
  public getOptimizationStatus() {
    const idleDuration = this.idleStartTime
      ? Date.now() - this.idleStartTime
      : 0;

    return {
      isIdle: this.isIdle,
      idleDuration,
      lastActivity: this.lastActivity,
      config: this.config,
      estimatedDailyCalls: this.estimateDailyCalls(),
      emergencyModeActive: this.config.emergencyMode,
    };
  }

  /**
   * 📈 예상 일일 호출 수 계산
   */
  private estimateDailyCalls(): number {
    const currentInterval = this.isIdle
      ? this.config.emergencyMode
        ? this.config.emergencyPollingInterval
        : this.config.idlePollingInterval
      : this.config.normalPollingInterval;

    const callsPerMinute = 60000 / currentInterval;
    return Math.round(callsPerMinute * 60 * 24);
  }

  /**
   * 🔧 설정 업데이트
   */
  public updateConfig(newConfig: Partial<IdleOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    systemLogger.system('🔧 중지 상태 최적화 설정 업데이트됨');
  }

  /**
   * 🚀 수동 최적화 활성화
   */
  public activateOptimization(): void {
    this.onIdle();
  }

  /**
   * 🛑 수동 최적화 비활성화
   */
  public deactivateOptimization(): void {
    this.onActive();
  }
}

// 전역 인스턴스 생성
export const emergencyIdleOptimizer = EmergencyIdleStateOptimizer.getInstance();

// 환경변수 기반 자동 활성화
if (process.env.AUTO_ACTIVATE_IDLE_OPTIMIZATION === 'true') {
  emergencyIdleOptimizer.activateOptimization();
  console.log('🚨 긴급 중지 상태 최적화 자동 활성화됨');
}
