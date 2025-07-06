/**
 * 🚫 서버리스 호환: 메모리 최적화 시스템 비활성화
 *
 * 서버리스 환경에서는 Vercel이 자동으로 메모리 관리를 수행하므로
 * 수동 메모리 최적화가 불필요하고 오히려 성능을 저하시킬 수 있음
 */

interface MemoryStats {
  heapUsed: number;
  heapTotal: number;
  rss: number;
  external: number;
  usagePercent: number;
  timestamp: number;
}

interface OptimizationResult {
  before: MemoryStats;
  after: MemoryStats;
  freedMB: number;
  optimizationActions: string[];
  duration: number;
}

/**
 * 🚫 서버리스 호환: 메모리 최적화 기능 완전 비활성화
 * Vercel 플랫폼이 자동으로 메모리 관리를 수행
 */
export class ServerlessMemoryManager {
  constructor() {
    console.warn('⚠️ 서버리스 환경에서는 메모리 최적화가 비활성화됩니다. Vercel이 자동 관리합니다.');
  }

  /**
   * 🚫 메모리 상태 분석 비활성화
   */
  getCurrentMemoryStats(): MemoryStats {
    console.warn('⚠️ 메모리 상태 분석 무시됨 - Vercel Analytics 사용 권장');
    return {
      heapUsed: 0,
      heapTotal: 0,
      rss: 0,
      external: 0,
      usagePercent: 0,
      timestamp: Date.now(),
    };
  }

  /**
   * 🚫 메모리 최적화 비활성화
   */
  async optimizeMemoryNow(): Promise<OptimizationResult> {
    console.warn('⚠️ 메모리 최적화 무시됨 - Vercel이 자동 관리');
    console.warn('📊 Vercel Analytics: https://vercel.com/analytics');

    return {
      before: this.getCurrentMemoryStats(),
      after: this.getCurrentMemoryStats(),
      freedMB: 0,
      optimizationActions: ['서버리스 환경에서는 Vercel이 자동 관리'],
      duration: 0,
    };
  }

  /**
   * 🚫 적극적 최적화 비활성화
   */
  async performAggressiveOptimization(): Promise<OptimizationResult> {
    console.warn('⚠️ 적극적 메모리 최적화 무시됨 - 서버리스 환경');
    return this.optimizeMemoryNow();
  }

  /**
   * 🚫 메모리 모니터링 비활성화
   */
  startMemoryMonitoring(intervalMs: number = 60000): void {
    console.warn('⚠️ 메모리 모니터링 무시됨 - Vercel Dashboard 사용');
    console.warn('📊 Vercel Dashboard: https://vercel.com/dashboard');
  }

  /**
   * 🚫 메모리 모니터링 중지 비활성화
   */
  stopMemoryMonitoring(): void {
    console.warn('⚠️ 메모리 모니터링 중지 무시됨 - 서버리스 환경');
  }

  /**
   * 🚫 최적화 히스토리 조회 비활성화
   */
  getOptimizationHistory(): OptimizationResult[] {
    console.warn('⚠️ 최적화 히스토리 조회 무시됨 - 서버리스 환경');
    return [];
  }

  /**
   * 🚫 메모리 요약 정보 비활성화
   */
  getMemorySummary(): {
    current: MemoryStats;
    status: 'optimal' | 'warning' | 'critical';
    lastOptimization: string | null;
    totalOptimizations: number;
  } {
    console.warn('⚠️ 메모리 요약 정보 무시됨 - Vercel Analytics 사용');
    return {
      current: this.getCurrentMemoryStats(),
      status: 'optimal',
      lastOptimization: null,
      totalOptimizations: 0,
    };
  }
}

/**
 * 🔧 서버리스 호환 팩토리 함수
 */
export function createServerlessMemoryManager(): ServerlessMemoryManager {
  return new ServerlessMemoryManager();
}

/**
 * 🚫 레거시 호환성 (사용 금지)
 * @deprecated 서버리스 환경에서는 createServerlessMemoryManager() 사용
 */
export const MemoryOptimizer = {
  getInstance: () => {
    console.warn('⚠️ MemoryOptimizer.getInstance()는 서버리스에서 사용 금지.');
    console.warn('📊 대신 Vercel Analytics를 사용하세요: https://vercel.com/analytics');
    return new ServerlessMemoryManager();
  }
};

/**
 * 🔄 호환성을 위한 인스턴스 export
 */
export const memoryOptimizer = new ServerlessMemoryManager();
