/**
 * 🛡️ 빌드 시 타이머 차단 시스템
 *
 * Vercel 배포 시 Edge Runtime에서 타이머 생성으로 인한 오류를 방지합니다.
 * 모든 setInterval, setTimeout 호출을 빌드 시에 차단합니다.
 */

class TimerBlocker {
  private static instance: TimerBlocker | null = null;
  private originalSetInterval: typeof setInterval;
  private originalSetTimeout: typeof setTimeout;
  private isBlocked = false;
  private blockedTimers: string[] = [];

  private constructor() {
    this.originalSetInterval = setInterval;
    this.originalSetTimeout = setTimeout;
  }

  static getInstance(): TimerBlocker {
    if (!TimerBlocker.instance) {
      TimerBlocker.instance = new TimerBlocker();
    }
    return TimerBlocker.instance;
  }

  /**
   * 🔨 빌드 환경 감지
   */
  private isBuildEnvironment(): boolean {
    return (
      process.env.BUILD_TIME === 'true' ||
      process.env.VERCEL_BUILD_PHASE === 'true' ||
      (process.env.NODE_ENV === 'production' && process.env.VERCEL === '1') ||
      process.env.NEXT_PHASE === 'phase-production-build'
    );
  }

  /**
   * 🛡️ 타이머 차단 활성화
   */
  enableBlocking(): void {
    if (!this.isBuildEnvironment()) {
      console.log('🟢 런타임 환경 - 타이머 차단 비활성화');
      return;
    }

    if (this.isBlocked) {
      return;
    }

    this.isBlocked = true;
    console.log('🔨 빌드 환경 감지 - 전역 타이머 차단 활성화');

    // setInterval 차단
    (global as any).setInterval = (
      callback: (...args: any[]) => void,
      delay: number,
      ...args: any[]
    ): NodeJS.Timeout => {
      const stack = new Error().stack || '';
      const caller = this.extractCaller(stack);

      console.log(`🚫 타이머 차단: setInterval(${delay}ms) from ${caller}`);
      this.blockedTimers.push(`setInterval(${delay}ms) from ${caller}`);

      // 가짜 타이머 ID 반환 (undefined 방지)
      return {
        unref: () => {},
        ref: () => {},
        hasRef: () => false,
        refresh: () => {},
      } as any;
    };

    // setTimeout 차단 (긴 시간만)
    (global as any).setTimeout = (
      callback: (...args: any[]) => void,
      delay: number,
      ...args: any[]
    ): NodeJS.Timeout => {
      if (delay > 5000) {
        // 5초 이상만 차단
        const stack = new Error().stack || '';
        const caller = this.extractCaller(stack);

        console.log(`🚫 타이머 차단: setTimeout(${delay}ms) from ${caller}`);
        this.blockedTimers.push(`setTimeout(${delay}ms) from ${caller}`);

        return {
          unref: () => {},
          ref: () => {},
          hasRef: () => false,
          refresh: () => {},
        } as any;
      }

      // 짧은 시간은 허용 (필수 기능)
      return this.originalSetTimeout.call(global, callback, delay, ...args);
    };

    console.log('✅ 타이머 차단 시스템 활성화 완료');
  }

  /**
   * 🔍 호출자 추출
   */
  private extractCaller(stack: string): string {
    const lines = stack.split('\n');
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('at ') && !line.includes('TimerBlocker')) {
        const match = line.match(/at (.+) \((.+)\)/);
        if (match) {
          const [, funcName, location] = match;
          const fileName = location.split('/').pop() || location;
          return `${funcName} (${fileName})`;
        }
      }
    }
    return 'unknown';
  }

  /**
   * 📊 차단된 타이머 통계
   */
  getBlockedTimers(): { count: number; timers: string[] } {
    return {
      count: this.blockedTimers.length,
      timers: this.blockedTimers,
    };
  }

  /**
   * 🔄 타이머 차단 해제 (런타임 시)
   */
  disableBlocking(): void {
    if (!this.isBlocked) {
      return;
    }

    (global as any).setInterval = this.originalSetInterval;
    (global as any).setTimeout = this.originalSetTimeout;
    this.isBlocked = false;

    const stats = this.getBlockedTimers();
    console.log(`🟢 타이머 차단 해제 - 총 ${stats.count}개 타이머 차단됨`);
  }
}

// 🚀 즉시 실행 (모듈 로드 시)
const timerBlocker = TimerBlocker.getInstance();
timerBlocker.enableBlocking();

export default timerBlocker;
