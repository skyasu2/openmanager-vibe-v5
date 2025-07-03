/**
 * 🚨 긴급 중지 상태 사용량 최적화기
 */

import { systemLogger } from './logger';

export class EmergencyIdleOptimizer {
  private static instance: EmergencyIdleOptimizer;
  private isIdle = false;
  private lastActivity = Date.now();

  private constructor() {
    this.initializeOptimizer();
  }

  public static getInstance(): EmergencyIdleOptimizer {
    if (!EmergencyIdleOptimizer.instance) {
      EmergencyIdleOptimizer.instance = new EmergencyIdleOptimizer();
    }
    return EmergencyIdleOptimizer.instance;
  }

  private initializeOptimizer(): void {
    systemLogger.system('🚨 긴급 중지 상태 최적화기 초기화');

    // 브라우저 환경 최적화
    if (typeof window !== 'undefined') {
      this.setupBrowserOptimization();
    }

    // 서버 환경 최적화
    if (typeof window === 'undefined') {
      this.setupServerOptimization();
    }
  }

  private setupBrowserOptimization(): void {
    // 페이지 가시성 감지
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.onIdle();
      } else {
        this.onActive();
      }
    });

    // 사용자 활동 감지
    const events = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, () => this.recordActivity());
    });
  }

  private setupServerOptimization(): void {
    // 응급 모드 환경변수 확인
    if (process.env.EMERGENCY_IDLE_OPTIMIZATION === 'true') {
      this.activateEmergencyMode();
    }
  }

  public recordActivity(): void {
    this.lastActivity = Date.now();
    if (this.isIdle) {
      this.onActive();
    }
  }

  private onIdle(): void {
    if (this.isIdle) return;

    this.isIdle = true;
    systemLogger.system('😴 중지 상태 감지 - 사용량 최적화 시작');

    // 폴링 간격 최적화
    this.optimizePollingIntervals();

    // 백그라운드 프로세스 비활성화
    this.disableBackgroundProcesses();
  }

  private onActive(): void {
    if (!this.isIdle) return;

    this.isIdle = false;
    systemLogger.system('🚀 활성 상태 복원');

    // 폴링 간격 복원
    this.restorePollingIntervals();

    // 백그라운드 프로세스 재활성화
    this.restoreBackgroundProcesses();
  }

  private optimizePollingIntervals(): void {
    const idleInterval = 300000; // 5분

    // React Query 설정 업데이트
    if (typeof window !== 'undefined' && (window as any).queryClient) {
      const queryClient = (window as any).queryClient;
      queryClient.setDefaultOptions({
        queries: {
          refetchInterval: idleInterval,
          refetchIntervalInBackground: false,
          refetchOnWindowFocus: false,
        },
      });
    }

    // 글로벌 폴링 간격 설정
    if (typeof global !== 'undefined') {
      (global as any).OPTIMIZED_POLLING_INTERVAL = idleInterval;
    }

    systemLogger.system(`⏰ 폴링 간격 최적화: ${idleInterval / 1000}초`);
  }

  private restorePollingIntervals(): void {
    const normalInterval = 30000; // 30초

    // React Query 설정 복원
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

  private disableBackgroundProcesses(): void {
    systemLogger.system('🛑 백그라운드 프로세스 비활성화 시작');

    // 환경변수로 스케줄러 비활성화
    if (typeof process !== 'undefined') {
      process.env.SERVER_DATA_SCHEDULER_DISABLED = 'true';
      process.env.KEEP_ALIVE_SCHEDULER_DISABLED = 'true';
      process.env.UNIFIED_METRICS_SCHEDULER_DISABLED = 'true';
    }

    // 글로벌 플래그 설정
    if (typeof global !== 'undefined') {
      (global as any).IDLE_STATE_SCHEDULERS_DISABLED = true;
    }

    systemLogger.system('✅ 백그라운드 프로세스 비활성화 완료');
  }

  private restoreBackgroundProcesses(): void {
    systemLogger.system('🚀 백그라운드 프로세스 재활성화 시작');

    // 환경변수 복원
    if (typeof process !== 'undefined') {
      delete process.env.SERVER_DATA_SCHEDULER_DISABLED;
      delete process.env.KEEP_ALIVE_SCHEDULER_DISABLED;
      delete process.env.UNIFIED_METRICS_SCHEDULER_DISABLED;
    }

    // 글로벌 플래그 제거
    if (typeof global !== 'undefined') {
      delete (global as any).IDLE_STATE_SCHEDULERS_DISABLED;
    }

    systemLogger.system('✅ 백그라운드 프로세스 재활성화 완료');
  }

  private activateEmergencyMode(): void {
    systemLogger.system('🚨 응급 모드 활성화');

    const emergencyInterval = 600000; // 10분

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

  public getOptimizationStatus() {
    return {
      isIdle: this.isIdle,
      lastActivity: this.lastActivity,
      estimatedDailyCalls: this.estimateDailyCalls(),
    };
  }

  private estimateDailyCalls(): number {
    const currentInterval = this.isIdle ? 300000 : 30000; // 5분 vs 30초
    const callsPerMinute = 60000 / currentInterval;
    return Math.round(callsPerMinute * 60 * 24);
  }

  public activateOptimization(): void {
    this.onIdle();
  }

  public deactivateOptimization(): void {
    this.onActive();
  }
}

// 전역 인스턴스
export const emergencyIdleOptimizer = EmergencyIdleOptimizer.getInstance();

// 환경변수 기반 자동 활성화
if (process.env.AUTO_ACTIVATE_IDLE_OPTIMIZATION === 'true') {
  emergencyIdleOptimizer.activateOptimization();
  console.log('🚨 긴급 중지 상태 최적화 자동 활성화됨');
}
