/**
 * 🚫 서버리스 호환: 타이머 관리 시스템 비활성화
 *
 * 서버리스 환경에서는 지속적 타이머가 불가능하므로
 * 모든 타이머 기능을 비활성화하고 Vercel 플랫폼 모니터링 사용 권장
 */

interface TimerConfig {
  id: string;
  callback: () => void | Promise<void>;
  interval: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  lastRun?: number;
  errorCount?: number;
  immediate?: boolean;
}

/**
 * 🚫 서버리스 호환: 타이머 기능 완전 비활성화
 * 모든 메서드는 경고 메시지만 출력하고 실제 동작하지 않음
 */
class ServerlessTimerManager {
  private timers = new Map<string, TimerConfig>();

  constructor() {
    console.warn('⚠️ 서버리스 환경에서는 타이머 기능이 비활성화됩니다. Vercel Dashboard를 사용하세요.');
  }

  /**
   * 🚫 타이머 등록 비활성화
   */
  register(config: TimerConfig): void {
    console.warn(`⚠️ 타이머 등록 무시됨: ${config.id} - 서버리스에서는 Vercel 모니터링 사용`);
    console.warn('📊 Vercel Dashboard: https://vercel.com/dashboard');
  }

  /**
   * 🚫 타이머 해제 비활성화
   */
  unregister(timerId: string): void {
    console.warn(`⚠️ 타이머 해제 무시됨: ${timerId} - 서버리스 환경`);
  }

  /**
   * 🚫 타이머 토글 비활성화
   */
  toggle(timerId: string, enabled: boolean): void {
    console.warn(`⚠️ 타이머 토글 무시됨: ${timerId} - 서버리스 환경`);
  }

  /**
   * 🚫 타이머 정리 비활성화
   */
  cleanup(): void {
    console.warn('⚠️ 타이머 정리 무시됨 - 서버리스 환경에서는 자동 정리됨');
  }

  /**
   * 🚫 타이머 상태 조회 비활성화
   */
  getStatus() {
    console.warn('⚠️ 타이머 상태 조회 무시됨 - Vercel Dashboard 사용 권장');
    return {
      totalTimers: 0,
      activeTimers: 0,
      timers: [],
      message: 'Vercel 서버리스 환경에서는 타이머 기능이 비활성화됩니다.'
    };
  }

  /**
   * 🚫 우선순위별 타이머 제어 비활성화
   */
  toggleByPriority(priority: TimerConfig['priority'], enabled: boolean): void {
    console.warn(`⚠️ 우선순위별 타이머 제어 무시됨: ${priority} - 서버리스 환경`);
  }

  /**
   * 🚫 AI 처리 모드 비활성화
   */
  setAIProcessingMode(isProcessing: boolean): void {
    console.warn('⚠️ AI 처리 모드 무시됨 - 서버리스에서는 요청별 처리');
  }

  /**
   * 🚫 배타적 타이머 등록 비활성화
   */
  registerExclusive(
    config: Omit<TimerConfig, 'enabled' | 'lastRun' | 'errorCount'>,
    category: string
  ): void {
    console.warn(`⚠️ 배타적 타이머 등록 무시됨: ${config.id} - 서버리스 환경`);
  }

  /**
   * 🚫 성능 모드 비활성화
   */
  enablePerformanceMode(): void {
    console.warn('⚠️ 성능 모드 무시됨 - Vercel 자동 최적화 사용');
  }

  disablePerformanceMode(): void {
    console.warn('⚠️ 성능 모드 해제 무시됨 - 서버리스 환경');
  }

  /**
   * 🚫 자동 최적화 비활성화
   */
  autoOptimize(): void {
    console.warn('⚠️ 자동 최적화 무시됨 - Vercel 플랫폼이 자동 처리');
  }

  /**
   * 🚫 활성 타이머 조회 비활성화
   */
  getActiveTimers(): string[] {
    console.warn('⚠️ 활성 타이머 조회 무시됨 - 서버리스 환경');
    return [];
  }

  /**
   * 🚫 타이머 활성 상태 확인 비활성화
   */
  isActive(id: string): boolean {
    console.warn(`⚠️ 타이머 활성 상태 확인 무시됨: ${id} - 서버리스 환경`);
    return false;
  }

  /**
   * 🚫 AI 모드 시작 비활성화
   */
  startAIMode(): void {
    console.warn('⚠️ AI 모드 시작 무시됨 - 서버리스에서는 요청별 AI 처리');
  }

  /**
   * 🚫 모니터링 모드 시작 비활성화
   */
  startMonitoringMode(): void {
    console.warn('⚠️ 모니터링 모드 시작 무시됨 - Vercel Dashboard 사용');
    console.warn('📊 Vercel Analytics: https://vercel.com/analytics');
  }

  /**
   * 🚫 모드 전환 비활성화
   */
  switchMode(mode: 'ai' | 'monitoring'): void {
    console.warn(`⚠️ 모드 전환 무시됨: ${mode} - 서버리스에서는 요청별 처리`);
  }
}

/**
 * 🔧 서버리스 호환 팩토리 함수
 */
export function createServerlessTimerManager(): ServerlessTimerManager {
  return new ServerlessTimerManager();
}

/**
 * 🚫 레거시 호환성 (사용 금지)
 * @deprecated 서버리스 환경에서는 createServerlessTimerManager() 사용
 */
export const TimerManager = {
  getInstance: () => {
    console.warn('⚠️ TimerManager.getInstance()는 서버리스에서 사용 금지.');
    console.warn('📊 대신 Vercel Dashboard를 사용하세요: https://vercel.com/dashboard');
    return new ServerlessTimerManager();
  }
};

/**
 * 🔄 호환성을 위한 인스턴스 export
 */
export const timerManager = new ServerlessTimerManager();
