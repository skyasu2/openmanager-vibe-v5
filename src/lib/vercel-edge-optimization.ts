/**
 * 🚀 Vercel Edge Runtime 성능 최적화 설정
 * Pro/Hobby 플랜 대응 및 리소스 관리
 */

// Vercel 플랜별 제한사항 정의
export const VERCEL_PLANS = {
  hobby: {
    // 실행 시간 제한
    maxExecutionTime: 10000, // 10초
    maxMemory: 128, // MB

    // 요청 제한
    requestsPerMinute: 100,
    edgeRequestsPerMonth: 1000000, // 1M

    // 기능 제한
    enableGoogleAI: false,
    enableAdvancedRAG: false,
    enableMCPIntegration: false,
    maxConcurrentRequests: 10,

    // 타임아웃 설정
    ragTimeout: 3000,
    koreanNLPTimeout: 2000,
    mcpTimeout: 1000,

    // 캐시 설정
    cacheSize: 50,
    cacheTTL: 300000, // 5분
  },

  pro: {
    // 실행 시간 제한
    maxExecutionTime: 15000, // 15초 (기본), 최대 300초 구성 가능
    maxMemory: 1024, // MB

    // 요청 제한
    requestsPerMinute: 1000,
    edgeRequestsPerMonth: 10000000, // 10M

    // 기능 활성화
    enableGoogleAI: true,
    enableAdvancedRAG: true,
    enableMCPIntegration: true,
    maxConcurrentRequests: 100,

    // 타임아웃 설정
    ragTimeout: 10000,
    koreanNLPTimeout: 8000,
    mcpTimeout: 5000,

    // 캐시 설정
    cacheSize: 200,
    cacheTTL: 600000, // 10분
  },
} as const;

// Edge Runtime 지역 설정
export const EDGE_REGIONS = {
  asia: ['icn1', 'hnd1', 'sin1'], // Seoul, Tokyo, Singapore
  global: ['iad1', 'fra1', 'syd1'], // Washington DC, Frankfurt, Sydney
  americas: ['iad1', 'sfo1', 'cle1'], // East Coast, West Coast, Cleveland
} as const;

// 현재 환경 감지
export function detectVercelEnvironment() {
  const isVercel = process.env.VERCEL === '1';
  const isPro = process.env.VERCEL_PLAN === 'pro';
  const region = process.env.VERCEL_REGION || 'auto';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    isVercel,
    isPro: isPro || isDevelopment, // 개발 환경에서는 Pro 기능 활성화
    isHobby: !isPro && !isDevelopment,
    region,
    isDevelopment,
    environment: process.env.NODE_ENV || 'production',
  };
}

// 플랜별 설정 가져오기
export function getVercelConfig() {
  const env = detectVercelEnvironment();
  const config = env.isPro ? VERCEL_PLANS.pro : VERCEL_PLANS.hobby;

  return {
    ...config,
    environment: env,
    regions: EDGE_REGIONS.asia, // 아시아 지역 최적화
  };
}

// Edge Runtime 타임아웃 관리자
export class EdgeTimeoutManager {
  private timeouts = new Map<string, NodeJS.Timeout>();
  private config = getVercelConfig();

  startTimeout(id: string, callback: () => void, customTimeout?: number): void {
    const timeout = customTimeout || this.config.maxExecutionTime;

    if (this.timeouts.has(id)) {
      this.clearTimeout(id);
    }

    const timeoutId = setTimeout(callback, timeout);
    this.timeouts.set(id, timeoutId);
  }

  clearTimeout(id: string): void {
    const timeoutId = this.timeouts.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.timeouts.delete(id);
    }
  }

  clearAllTimeouts(): void {
    this.timeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.timeouts.clear();
  }

  getActiveTimeouts(): string[] {
    return Array.from(this.timeouts.keys());
  }
}

// 리소스 사용량 모니터링
export class EdgeResourceMonitor {
  private requestCounts = new Map<string, number>();
  private lastReset = Date.now();
  private config = getVercelConfig();

  trackRequest(endpoint: string): boolean {
    const now = Date.now();
    const minutesSinceReset = (now - this.lastReset) / 60000;

    // 1분마다 카운터 리셋
    if (minutesSinceReset >= 1) {
      this.requestCounts.clear();
      this.lastReset = now;
    }

    const currentCount = this.requestCounts.get(endpoint) || 0;
    const newCount = currentCount + 1;

    // 요청 제한 확인
    if (newCount > this.config.requestsPerMinute) {
      return false; // 제한 초과
    }

    this.requestCounts.set(endpoint, newCount);
    return true; // 허용
  }

  getUsageStats() {
    return {
      requestCounts: Object.fromEntries(this.requestCounts),
      totalRequests: Array.from(this.requestCounts.values()).reduce(
        (sum, count) => sum + count,
        0
      ),
      maxRequestsPerMinute: this.config.requestsPerMinute,
      resetTime: new Date(this.lastReset).toISOString(),
    };
  }
}

// Edge Runtime 메모리 최적화
export class EdgeMemoryOptimizer {
  private memoryUsage = new Map<string, number>();
  private config = getVercelConfig();

  trackMemoryUsage(context: string, sizeInMB: number): boolean {
    this.memoryUsage.set(context, sizeInMB);

    const totalUsage = Array.from(this.memoryUsage.values()).reduce(
      (sum, size) => sum + size,
      0
    );

    // 메모리 제한 확인
    if (totalUsage > this.config.maxMemory * 0.8) {
      // 80% 임계값
      console.warn(
        `⚠️ Edge Runtime 메모리 사용량 경고: ${totalUsage}MB / ${this.config.maxMemory}MB`
      );

      if (totalUsage > this.config.maxMemory) {
        return false; // 메모리 초과
      }
    }

    return true;
  }

  freeMemory(context: string): void {
    this.memoryUsage.delete(context);

    // 강제 가비지 컬렉션 (Node.js 환경에서만)
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }

  getMemoryStats() {
    const totalUsage = Array.from(this.memoryUsage.values()).reduce(
      (sum, size) => sum + size,
      0
    );

    return {
      totalUsage,
      maxMemory: this.config.maxMemory,
      usagePercentage: (totalUsage / this.config.maxMemory) * 100,
      contexts: Object.fromEntries(this.memoryUsage),
    };
  }
}

// 통합 Edge Runtime 관리자
export class EdgeRuntimeManager {
  private timeoutManager = new EdgeTimeoutManager();
  private resourceMonitor = new EdgeResourceMonitor();
  private memoryOptimizer = new EdgeMemoryOptimizer();
  private config = getVercelConfig();

  constructor() {
    console.log(
      `🚀 Edge Runtime Manager 초기화 - ${this.config.environment.isPro ? 'Pro' : 'Hobby'} 플랜`
    );
  }

  // 요청 시작 시 호출
  startRequest(
    requestId: string,
    endpoint: string
  ): { allowed: boolean; reason?: string } {
    // 요청 제한 확인
    if (!this.resourceMonitor.trackRequest(endpoint)) {
      return {
        allowed: false,
        reason: `요청 제한 초과 (${this.config.requestsPerMinute}/분)`,
      };
    }

    // 타임아웃 설정
    this.timeoutManager.startTimeout(requestId, () => {
      console.warn(`⏱️ 요청 타임아웃: ${requestId}`);
    });

    return { allowed: true };
  }

  // 요청 완료 시 호출
  finishRequest(requestId: string): void {
    this.timeoutManager.clearTimeout(requestId);
    this.memoryOptimizer.freeMemory(requestId);
  }

  // 시스템 상태 조회
  getSystemStatus() {
    return {
      config: this.config,
      timeouts: this.timeoutManager.getActiveTimeouts(),
      resources: this.resourceMonitor.getUsageStats(),
      memory: this.memoryOptimizer.getMemoryStats(),
      timestamp: new Date().toISOString(),
    };
  }

  // 플랜별 기능 확인
  isFeatureEnabled(feature: keyof typeof VERCEL_PLANS.pro): boolean {
    return this.config[feature] as boolean;
  }

  // 정리 작업
  cleanup(): void {
    this.timeoutManager.clearAllTimeouts();
  }
}

// 싱글톤 인스턴스
export const edgeRuntimeManager = new EdgeRuntimeManager();

// Next.js Edge Runtime 설정 도우미
export function createEdgeConfig(regions?: string[]) {
  const config = getVercelConfig();

  return {
    runtime: 'edge' as const,
    preferredRegion: regions || config.regions,
    // 추가 Edge Runtime 설정
    experimental: {
      edgeRuntime: true,
    },
  };
}

// 응답 최적화 도우미
export function optimizeEdgeResponse(data: any, compress = true) {
  if (!compress) return data;

  // 불필요한 메타데이터 제거 (Hobby 플랜)
  const config = getVercelConfig();
  if (config.environment.isHobby) {
    const { metadata, ...essentialData } = data;
    return {
      ...essentialData,
      metadata: {
        vercelPlan: 'hobby',
        optimized: true,
      },
    };
  }

  return data;
}

// 에러 핸들링 도우미
export function handleEdgeError(error: any, requestId: string) {
  const config = getVercelConfig();

  edgeRuntimeManager.finishRequest(requestId);

  if (error.name === 'TimeoutError' || error.message?.includes('timeout')) {
    return {
      success: false,
      error: `요청 시간 초과 (${config.maxExecutionTime}ms 제한)`,
      code: 'TIMEOUT',
      plan: config.environment.isPro ? 'pro' : 'hobby',
      suggestion: config.environment.isHobby
        ? 'Pro 플랜 업그레이드시 더 긴 처리 시간 이용 가능'
        : '더 간단한 요청으로 시도해보세요',
    };
  }

  return {
    success: false,
    error: config.environment.isPro
      ? error.message || 'Unknown error'
      : 'Service temporarily limited',
    code: 'SYSTEM_ERROR',
    plan: config.environment.isPro ? 'pro' : 'hobby',
  };
}
