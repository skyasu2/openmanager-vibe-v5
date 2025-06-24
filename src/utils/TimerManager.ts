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
  immediate?: boolean;
}

class TimerManager {
  private static instance: TimerManager;
  private timers = new Map<string, TimerConfig>();
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private isRunning = false;
  private masterInterval: ReturnType<typeof setInterval> | null = null;

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
  register(config: TimerConfig): void {
    if (this.timers.has(config.id)) {
      this.unregister(config.id);
    }

    this.timers.set(config.id, { ...config, enabled: true });

    if (config.immediate) {
      this.executeCallback(config);
    }

    this.scheduleNextExecution(config.id);
    console.log(`⏰ Timer registered: ${config.id} (Dynamic interval)`);
  }

  /**
   * 타이머 해제
   */
  unregister(timerId: string): void {
    const timeoutId = this.timeouts.get(timerId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(timerId);
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
      this.scheduleNextExecution(timerId);
      console.log(`▶️ Timer resumed: ${timerId}`);
    } else {
      const timeoutId = this.timeouts.get(timerId);
      if (timeoutId) {
        clearTimeout(timeoutId);
        this.timeouts.delete(timerId);
      }
      console.log(`⏸️ Timer paused: ${timerId}`);
    }
  }

  /**
   * 모든 타이머 정리
   */
  cleanup(): void {
    console.log('🧹 Cleaning up all timers...');
    this.timers.forEach((_, timerId) => {
      const timeoutId = this.timeouts.get(timerId);
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    });
    this.timeouts.clear();
    this.timers.clear();
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
        nextRun: timer.lastRun ? timer.lastRun + timer.interval : Date.now(),
      }))
      .sort((a, b) => a.nextRun - b.nextRun);

    return {
      totalTimers: this.timers.size,
      activeTimers: activeTimers.length,
      timers: activeTimers,
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
    console.log(
      `🎯 ${priority} priority timers ${enabled ? 'enabled' : 'disabled'}`
    );
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
  registerExclusive(
    config: Omit<TimerConfig, 'enabled' | 'lastRun' | 'errorCount'>,
    category: string
  ): void {
    // 같은 카테고리의 다른 타이머들 정지
    for (const [id, timer] of this.timers) {
      if ((timer as any)._category === category && id !== config.id) {
        this.unregister(id);
      }
    }

    // 새 타이머 등록
    const fullConfig: TimerConfig = {
      ...config,
      enabled: true,
      lastRun: undefined,
      errorCount: 0,
    };
    this.register(fullConfig);
    (this.timers.get(config.id) as any)._category = category;
    console.log(
      `🛡️ Exclusive timer registered: ${config.id} in category: ${category}`
    );
  }

  /**
   * 📊 디버깅을 위한 상세 상태 출력
   */
  debugStatus(): void {
    console.group('🕒 TimerManager 상태');
    console.log('실행 중:', this.isRunning);
    console.log('등록된 타이머 수:', this.timers.size);
    console.log('활성 인터벌 수:', this.timeouts.size);

    console.group('타이머 목록:');
    for (const [id, timer] of this.timers) {
      const timeoutId = this.timeouts.get(id);
      console.log(`${id}:`, {
        enabled: timer.enabled,
        priority: timer.priority,
        interval: timer.interval,
        hasTimeout: !!timeoutId,
        lastRun: timer.lastRun
          ? new Date(timer.lastRun).toLocaleTimeString()
          : 'never',
        errorCount: timer.errorCount,
        pausedForAI: !!(timer as any)._pausedForAI,
        category: (timer as any)._category,
      });
    }
    console.groupEnd();
    console.groupEnd();
  }

  /**
   * 🚀 성능 최적화 모드 활성화
   * - 모든 타이머 간격을 2배로 늘림
   * - low 우선순위 타이머 일시 정지
   */
  enablePerformanceMode(): void {
    console.log('🚀 성능 최적화 모드 활성화');

    for (const [id, timer] of this.timers) {
      // low 우선순위 타이머 정지
      if (timer.priority === 'low') {
        this.toggle(id, false);
        (timer as any)._pausedForPerformance = true;
        continue;
      }

      // 나머지 타이머 간격 2배로 늘림
      if (timer.enabled) {
        this.scheduleNextExecution(id);
        timer.interval = timer.interval * 2;
        (timer as any)._originalInterval = timer.interval / 2;
      }
    }
  }

  /**
   * 🔄 성능 최적화 모드 비활성화
   */
  disablePerformanceMode(): void {
    console.log('🔄 성능 최적화 모드 비활성화');

    for (const [id, timer] of this.timers) {
      // 성능 모드로 정지된 타이머 재시작
      if ((timer as any)._pausedForPerformance) {
        this.toggle(id, true);
        delete (timer as any)._pausedForPerformance;
      }

      // 원래 간격으로 복원
      if ((timer as any)._originalInterval) {
        this.scheduleNextExecution(id);
        timer.interval = (timer as any)._originalInterval;
        delete (timer as any)._originalInterval;
      }
    }
  }

  /**
   * 📊 시스템 부하 기반 자동 최적화
   */
  autoOptimize(): void {
    const stats = this.getStatus();
    const nodeProcess =
      typeof globalThis !== 'undefined'
        ? (globalThis as any).process
        : undefined;
    const memoryUsage =
      nodeProcess && typeof nodeProcess.memoryUsage === 'function'
        ? nodeProcess.memoryUsage()
        : { heapUsed: 0, heapTotal: 1 };
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    // 메모리 사용률이 80% 이상이거나 활성 타이머가 20개 이상이면 최적화
    if (memoryPercent > 80 || stats.activeTimers > 20) {
      console.log(
        `🚨 자동 최적화 트리거: 메모리 ${memoryPercent.toFixed(1)}%, 타이머 ${stats.activeTimers}개`
      );
      this.enablePerformanceMode();

      // 5분 후 자동으로 복원
      setTimeout(
        () => {
          this.disablePerformanceMode();
        },
        5 * 60 * 1000
      );
    }
  }

  private scheduleNextExecution(timerId: string): void {
    const timer = this.timers.get(timerId);
    if (!timer || !timer.enabled) {
      return;
    }

    // 50초에서 60초 사이의 랜덤한 지연 시간 계산 (50000ms + 0~10000ms)
    const delay = 50000 + Math.random() * 10000;

    const timeoutId = setTimeout(async () => {
      await this.executeCallback(timer);
      this.scheduleNextExecution(timerId); // 재귀 호출
    }, delay);

    this.timeouts.set(timerId, timeoutId);
  }

  private async executeCallback(config: TimerConfig): Promise<void> {
    if (!config.enabled) return;

    try {
      config.lastRun = Date.now();
      await config.callback();
      config.errorCount = 0;
    } catch (error) {
      config.errorCount = (config.errorCount || 0) + 1;
      console.error(
        `❌ Timer ${config.id} error (${config.errorCount}/3):`,
        error
      );

      if (config.errorCount >= 3) {
        console.error(
          `🚫 Timer ${config.id} disabled due to repeated failures.`
        );
        this.toggle(config.id, false);
      }
    }
  }

  // 활성 타이머 목록
  getActiveTimers(): string[] {
    return Array.from(this.timeouts.keys());
  }

  // 타이머 상태 확인
  isActive(id: string): boolean {
    return this.timeouts.has(id);
  }

  // AI 관리자 모드를 위한 새로운 메소드들
  /**
   * AI 관리자 모드 타이머 시작
   */
  startAIMode(): void {
    console.log('🤖 Starting AI Admin Mode timers...');

    // AI 에이전트 하트비트 (GET 방식으로 변경)
    this.registerExclusive(
      {
        id: 'ai-agent-heartbeat',
        callback: async () => {
          try {
            const response = await fetch('/api/ai-agent?action=health', {
              method: 'GET',
            });

            if (!response.ok) {
              console.warn(`⚠️ AI Agent heartbeat failed: ${response.status}`);
            } else {
              const data = await response.json();
              if (data.success) {
                console.log('✅ AI Agent heartbeat successful');
              } else {
                console.warn('⚠️ AI Agent heartbeat failed (response)');
              }
            }
          } catch (error) {
            console.warn(
              '⚠️ AI Agent heartbeat error (expected in offline mode):',
              error
            );
          }
        },
        interval: 15000, // 15초로 간격 증가
        priority: 'medium', // 우선순위 낮춤
      },
      'ai-mode'
    );

    // MCP 시스템 모니터링 (GET 방식으로 개선)
    this.registerExclusive(
      {
        id: 'mcp-monitor',
        callback: async () => {
          try {
            const response = await fetch('/api/mcp/status');
            if (response.ok) {
              const data = await response.json();
              console.log('🔍 MCP Status:', data.success ? '✅' : '⚠️');
            } else {
              console.warn(`🔍 MCP Status: ⚠️ (${response.status})`);
            }
          } catch (error) {
            console.warn('🔍 MCP Monitor: ⚠️ (offline mode)');
          }
        },
        interval: 30000, // 30초로 간격 증가
        priority: 'low', // 우선순위를 낮춤
      },
      'ai-mode'
    );

    // AI 분석 데이터 수집 - 🎯 데이터 생성기와 동기화
    this.registerExclusive(
      {
        id: 'ai-analytics-collector',
        callback: async () => {
          try {
            console.log('📊 Collecting AI analytics data...');
            // AI 분석 데이터 수집 로직
          } catch (error) {
            console.error('❌ AI Analytics error:', error);
          }
        },
        interval: 40000, // 40초 (데이터 생성기 20초의 2배 간격)
        priority: 'low',
      },
      'ai-mode'
    );
  }

  /**
   * 기본 모니터링 모드 타이머 시작 (AUTO 모드로 통합)
   */
  startMonitoringMode(): void {
    console.log('📊 Starting Basic Monitoring Mode timers (AUTO 모드)...');

    // 기본 서버 모니터링
    this.registerExclusive(
      {
        id: 'basic-monitoring',
        callback: async () => {
          try {
            const response = await fetch('/api/health');
            if (response.ok) {
              console.log('✅ Basic monitoring check passed');
            }
          } catch (error) {
            console.error('❌ Basic monitoring error:', error);
          }
        },
        interval: 15000, // 15초
        priority: 'high',
      },
      'monitoring-mode'
    );

    // 데이터 생성기 상태 확인 - 🎯 데이터 생성기 간격(20초)보다 길게 조정
    this.registerExclusive(
      {
        id: 'data-generator-status',
        callback: async () => {
          try {
            const response = await fetch('/api/data-generator');
            if (response.ok) {
              const data = await response.json();
              console.log(
                '🧪 Data Generator:',
                data.data?.generation?.isGenerating ? '✅' : '⏸️'
              );
            }
          } catch (error) {
            console.error('❌ Data Generator status error:', error);
          }
        },
        interval: 25000, // 25초 (데이터 생성기 20초보다 5초 길게)
        priority: 'medium',
      },
      'monitoring-mode'
    );
  }

  /**
   * 모드별 타이머 전환
   */
  switchMode(mode: 'ai' | 'monitoring'): void {
    console.log(`🔄 Switching to ${mode} mode...`);

    // 기존 모든 타이머 정지
    this.cleanup();

    // 새 모드 타이머 시작
    if (mode === 'ai') {
      this.startAIMode();
    } else {
      this.startMonitoringMode();
    }
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
