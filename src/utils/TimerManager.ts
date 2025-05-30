/**
 * 🕒 통합 타이머 관리자
 * 
 * 시스템 전체의 setInterval을 통합 관리하여
 * - 타이머 충돌 방지
 * - 리소스 최적화
 * - 메모리 누수 방지
 */

interface TimerConfig {
  id: string;
  callback: () => void | Promise<void>;
  interval: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  enabled: boolean;
  lastRun?: number;
  errorCount?: number;
}

class TimerManager {
  private static instance: TimerManager;
  private timers = new Map<string, TimerConfig>();
  private intervals = new Map<string, NodeJS.Timeout>();
  private isRunning = false;
  private masterInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  static getInstance(): TimerManager {
    if (!TimerManager.instance) {
      TimerManager.instance = new TimerManager();
    }
    return TimerManager.instance;
  }

  /**
   * 타이머 등록
   */
  register(config: Omit<TimerConfig, 'enabled' | 'lastRun' | 'errorCount'>): void {
    if (this.timers.has(config.id)) {
      console.warn(`⚠️ Timer ${config.id} already exists, updating...`);
      this.unregister(config.id);
    }

    this.timers.set(config.id, {
      ...config,
      enabled: true,
      lastRun: 0,
      errorCount: 0
    });

    this.startTimer(config.id);
    console.log(`⏰ Timer registered: ${config.id} (${config.interval}ms, ${config.priority})`);
  }

  /**
   * 타이머 해제
   */
  unregister(timerId: string): void {
    if (this.intervals.has(timerId)) {
      clearInterval(this.intervals.get(timerId)!);
      this.intervals.delete(timerId);
    }
    this.timers.delete(timerId);
    console.log(`🗑️ Timer unregistered: ${timerId}`);
  }

  /**
   * 타이머 일시정지/재개
   */
  toggle(timerId: string, enabled: boolean): void {
    const timer = this.timers.get(timerId);
    if (!timer) return;

    timer.enabled = enabled;
    
    if (enabled) {
      this.startTimer(timerId);
    } else {
      this.stopTimer(timerId);
    }
  }

  /**
   * 개별 타이머 시작
   */
  private startTimer(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer || !timer.enabled) return;

    if (this.intervals.has(timerId)) {
      clearInterval(this.intervals.get(timerId)!);
    }

    const intervalId = setInterval(async () => {
      if (!timer.enabled) return;

      try {
        timer.lastRun = Date.now();
        await timer.callback();
        timer.errorCount = 0;
      } catch (error) {
        timer.errorCount = (timer.errorCount || 0) + 1;
        console.error(`❌ Timer ${timerId} error (${timer.errorCount}/3):`, error);

        // 3회 연속 실패 시 타이머 비활성화
        if (timer.errorCount >= 3) {
          console.error(`🚫 Timer ${timerId} disabled due to repeated failures`);
          this.toggle(timerId, false);
        }
      }
    }, timer.interval);

    this.intervals.set(timerId, intervalId);
  }

  /**
   * 개별 타이머 정지
   */
  private stopTimer(timerId: string): void {
    if (this.intervals.has(timerId)) {
      clearInterval(this.intervals.get(timerId)!);
      this.intervals.delete(timerId);
    }
  }

  /**
   * 모든 타이머 정리
   */
  cleanup(): void {
    console.log('🧹 Cleaning up all timers...');
    
    for (const [timerId] of this.intervals) {
      this.unregister(timerId);
    }
    
    if (this.masterInterval) {
      clearInterval(this.masterInterval);
      this.masterInterval = null;
    }
    
    this.isRunning = false;
    console.log('✅ All timers cleaned up');
  }

  /**
   * 타이머 상태 조회
   */
  getStatus() {
    const activeTimers = Array.from(this.timers.entries())
      .filter(([_, timer]) => timer.enabled)
      .map(([id, timer]) => ({
        id,
        interval: timer.interval,
        priority: timer.priority,
        lastRun: timer.lastRun,
        errorCount: timer.errorCount,
        nextRun: timer.lastRun ? timer.lastRun + timer.interval : Date.now()
      }))
      .sort((a, b) => a.nextRun - b.nextRun);

    return {
      totalTimers: this.timers.size,
      activeTimers: activeTimers.length,
      timers: activeTimers
    };
  }

  /**
   * 우선순위별 타이머 일괄 제어
   */
  toggleByPriority(priority: TimerConfig['priority'], enabled: boolean): void {
    for (const [id, timer] of this.timers) {
      if (timer.priority === priority) {
        this.toggle(id, enabled);
      }
    }
    console.log(`🎯 ${priority} priority timers ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * 🤖 AI 처리 상태에 따른 전역 타이머 제어
   */
  setAIProcessingMode(isProcessing: boolean): void {
    if (isProcessing) {
      console.log('🤖 AI 처리 모드 활성화 - 모든 타이머 일시 정지');
      // critical을 제외한 모든 타이머 정지
      for (const [id, timer] of this.timers) {
        if (timer.priority !== 'critical' && timer.enabled) {
          this.toggle(id, false);
          // 재시작을 위해 플래그 설정
          (timer as any)._pausedForAI = true;
        }
      }
    } else {
      console.log('🤖 AI 처리 모드 비활성화 - 타이머 복원');
      // AI 처리로 인해 정지된 타이머들 재시작
      for (const [id, timer] of this.timers) {
        if ((timer as any)._pausedForAI) {
          this.toggle(id, true);
          delete (timer as any)._pausedForAI;
        }
      }
    }
  }

  /**
   * 🛡️ 타이머 충돌 방지 - 같은 카테고리 내에서 한 번에 하나만 실행
   */
  registerExclusive(config: Omit<TimerConfig, 'enabled' | 'lastRun' | 'errorCount'>, category: string): void {
    // 같은 카테고리의 다른 타이머들 정지
    for (const [id, timer] of this.timers) {
      if ((timer as any)._category === category && id !== config.id) {
        this.unregister(id);
      }
    }

    // 새 타이머 등록
    this.register(config);
    (this.timers.get(config.id) as any)._category = category;
    console.log(`🛡️ Exclusive timer registered: ${config.id} in category: ${category}`);
  }

  /**
   * 📊 디버깅을 위한 상세 상태 출력
   */
  debugStatus(): void {
    console.group('🕒 TimerManager 상태');
    console.log('실행 중:', this.isRunning);
    console.log('등록된 타이머 수:', this.timers.size);
    console.log('활성 인터벌 수:', this.intervals.size);
    
    console.group('타이머 목록:');
    for (const [id, timer] of this.timers) {
      const interval = this.intervals.get(id);
      console.log(`${id}:`, {
        enabled: timer.enabled,
        priority: timer.priority,
        interval: timer.interval,
        hasInterval: !!interval,
        lastRun: timer.lastRun ? new Date(timer.lastRun).toLocaleTimeString() : 'never',
        errorCount: timer.errorCount,
        pausedForAI: !!(timer as any)._pausedForAI,
        category: (timer as any)._category
      });
    }
    console.groupEnd();
    console.groupEnd();
  }
}

// 전역 인스턴스 생성
export const timerManager = TimerManager.getInstance();

// 브라우저 환경에서 페이지 언로드 시 자동 정리
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    timerManager.cleanup();
  });
}

export default TimerManager; 