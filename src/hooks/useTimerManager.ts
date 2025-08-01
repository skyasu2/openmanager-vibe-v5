import { useRef, useCallback, useEffect } from 'react';

// 🔄 타이머 설정 인터페이스
interface TimerConfig {
  id: string;
  callback: () => void | Promise<void>;
  interval: number;
  priority: 'low' | 'medium' | 'high';
  enabled: boolean;
}

// 🎯 타이머 정보
interface TimerInfo extends TimerConfig {
  handle: NodeJS.Timeout;
  startTime: number;
  runCount: number;
}

// 🕐 타이머 매니저 클래스
class TimerManager {
  private timers = new Map<string, TimerInfo>();
  private isDestroyed = false;

  // 타이머 등록
  register(config: TimerConfig): string {
    if (this.isDestroyed) {
      console.warn('TimerManager is destroyed, cannot register timer');
      return config.id;
    }

    // 기존 타이머가 있으면 정리
    this.unregister(config.id);

    if (!config.enabled) {
      return config.id;
    }

    // 새 타이머 생성
    const handle = setInterval(async () => {
      try {
        const timerInfo = this.timers.get(config.id);
        if (timerInfo && timerInfo.enabled && !this.isDestroyed) {
          await config.callback();
          timerInfo.runCount++;
        }
      } catch (error) {
        console.error(`Timer ${config.id} callback error:`, error);
      }
    }, config.interval);

    // 타이머 정보 저장
    this.timers.set(config.id, {
      ...config,
      handle,
      startTime: Date.now(),
      runCount: 0,
    });

    console.log(
      `✅ Timer registered: ${config.id} (${config.interval}ms, ${config.priority})`
    );
    return config.id;
  }

  // 타이머 해제
  unregister(id: string): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer.handle);
      this.timers.delete(id);
      console.log(`🗑️ Timer unregistered: ${id}`);
      return true;
    }
    return false;
  }

  // 타이머 활성화/비활성화
  toggle(id: string, enabled: boolean): boolean {
    const timer = this.timers.get(id);
    if (timer) {
      timer.enabled = enabled;
      console.log(
        `${enabled ? '▶️' : '⏸️'} Timer ${enabled ? 'enabled' : 'disabled'}: ${id}`
      );
      return true;
    }
    return false;
  }

  // 모든 타이머 정리
  cleanup(): void {
    console.log(`🧹 Cleaning up ${this.timers.size} timers`);

    for (const [id, timer] of this.timers) {
      clearInterval(timer.handle);
      console.log(`🗑️ Timer cleaned: ${id}`);
    }

    this.timers.clear();
    this.isDestroyed = true;
  }

  // 타이머 상태 조회
  getStatus(): Array<{
    id: string;
    interval: number;
    priority: string;
    enabled: boolean;
    runCount: number;
    uptime: number;
  }> {
    return Array.from(this.timers.values()).map((timer) => ({
      id: timer.id,
      interval: timer.interval,
      priority: timer.priority,
      enabled: timer.enabled,
      runCount: timer.runCount,
      uptime: Date.now() - timer.startTime,
    }));
  }

  // 우선순위별 타이머 카운트
  getPriorityStats(): Record<string, number> {
    const stats = { low: 0, medium: 0, high: 0 };

    for (const timer of this.timers.values()) {
      stats[timer.priority]++;
    }

    return stats;
  }
}

// 🪝 TimerManager 훅
export function useTimerManager() {
  const managerRef = useRef<TimerManager | null>(null);

  // 싱글톤 패턴으로 TimerManager 생성
  if (!managerRef.current) {
    managerRef.current = new TimerManager();
  }

  // 컴포넌트 언마운트 시 자동 정리
  useEffect(() => {
    const manager = managerRef.current;

    return () => {
      if (manager) {
        manager.cleanup();
      }
    };
  }, []);

  // 메모이제이션된 메서드들
  const register = useCallback((config: TimerConfig) => {
    return managerRef.current?.register(config) || config.id;
  }, []);

  const unregister = useCallback((id: string) => {
    return managerRef.current?.unregister(id) || false;
  }, []);

  const toggle = useCallback((id: string, enabled: boolean) => {
    return managerRef.current?.toggle(id, enabled) || false;
  }, []);

  const getStatus = useCallback(() => {
    return managerRef.current?.getStatus() || [];
  }, []);

  const getPriorityStats = useCallback(() => {
    return (
      managerRef.current?.getPriorityStats() || { low: 0, medium: 0, high: 0 }
    );
  }, []);

  const cleanup = useCallback(() => {
    managerRef.current?.cleanup();
  }, []);

  return {
    register,
    unregister,
    toggle,
    getStatus,
    getPriorityStats,
    cleanup,
  };
}

// 🌐 글로벌 TimerManager 인스턴스 (옵션)
let globalTimerManager: TimerManager | null = null;

export function getGlobalTimerManager(): TimerManager {
  if (!globalTimerManager) {
    globalTimerManager = new TimerManager();

    // 페이지 언로드 시 자동 정리
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        globalTimerManager?.cleanup();
      });
    }
  }

  return globalTimerManager;
}

// 🧹 전역 정리 함수
export function cleanupGlobalTimerManager(): void {
  if (globalTimerManager) {
    globalTimerManager.cleanup();
    globalTimerManager = null;
  }
}
