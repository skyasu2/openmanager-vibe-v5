/**
 * 🚀 Vercel 환경 최적화 유틸리티
 *
 * AI 교차검증 기반 Vercel 특화 최적화:
 * - Edge Runtime 호환성
 * - Cold Start 최소화
 * - 메모리 효율성
 * - 캐싱 전략
 */

/**
 * Vercel 환경 정보
 */
import { logger } from '@/lib/logging';
export interface VercelEnvironment {
  isVercel: boolean;
  region: string;
  environment: 'production' | 'preview' | 'development';
  deploymentUrl?: string;
  gitBranch?: string;
}

/**
 * Performance API 확장 (메모리 정보)
 */
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

/**
 * Vercel 환경 감지 및 정보 수집
 */
export function getVercelEnvironment(): VercelEnvironment {
  // 서버 환경에서는 process.env 사용
  if (typeof window === 'undefined') {
    const vercelEnv = process.env.VERCEL_ENV;
    const environment: 'production' | 'preview' | 'development' =
      vercelEnv === 'production' || vercelEnv === 'preview'
        ? vercelEnv
        : 'development';

    return {
      isVercel: process.env.VERCEL === '1',
      region: process.env.VERCEL_REGION || 'unknown',
      environment,
      deploymentUrl: process.env.VERCEL_URL,
      gitBranch: process.env.VERCEL_GIT_COMMIT_REF,
    };
  }

  // 클라이언트 환경에서는 URL 기반 감지
  const hostname = window.location.hostname;
  const isVercel = hostname.includes('vercel.app');

  return {
    isVercel,
    region: 'client-side', // 클라이언트에서는 region 정보 없음
    environment: isVercel
      ? hostname.includes('-git-')
        ? 'preview'
        : 'production'
      : 'development',
    deploymentUrl: isVercel ? hostname : undefined,
    gitBranch:
      isVercel && hostname.includes('-git-')
        ? hostname.split('-git-')[1]?.split('-')[0]
        : undefined,
  };
}

/**
 * 성능 메트릭 수집 (Vercel Analytics 호환)
 */
export class VercelPerformanceTracker {
  private metrics: Map<string, number> = new Map();
  private startTimes: Map<string, number> = new Map();

  /**
   * 성능 측정 시작
   */
  start(label: string): void {
    this.startTimes.set(label, performance.now());
  }

  /**
   * 성능 측정 종료 및 기록
   */
  end(label: string): number {
    const startTime = this.startTimes.get(label);
    if (!startTime) {
      logger.warn(`⚠️ 성능 측정 시작점을 찾을 수 없음: ${label}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.metrics.set(label, duration);
    this.startTimes.delete(label);

    // Vercel 환경에서는 console.log가 모니터링됨
    if (getVercelEnvironment().isVercel) {
      logger.info(`📊 Vercel Performance [${label}]: ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * 모든 메트릭 가져오기
   */
  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * 메트릭 초기화
   */
  clear(): void {
    this.metrics.clear();
    this.startTimes.clear();
  }
}

/**
 * 전역 성능 트래커 인스턴스
 */
export const performanceTracker = new VercelPerformanceTracker();

/**
 * Cold Start 최소화를 위한 사전 로딩
 */
export async function preloadCriticalResources(): Promise<void> {
  const env = getVercelEnvironment();

  if (!env.isVercel) return; // 로컬 환경에서는 스킵

  performanceTracker.start('preload-resources');

  try {
    // 1. DNS 사전 해결
    if (typeof document !== 'undefined') {
      const criticalDomains = [
        'https://api.supabase.co',
        'https://fonts.googleapis.com',
      ];

      criticalDomains.forEach((domain) => {
        const link = document.createElement('link');
        link.rel = 'dns-prefetch';
        link.href = domain;
        document.head.appendChild(link);
      });
    }

    // 2. 중요 API 엔드포인트 사전 로딩 (HEAD 요청)
    const criticalEndpoints = ['/api/system'];

    await Promise.allSettled(
      criticalEndpoints.map(async (endpoint) => {
        try {
          await fetch(endpoint, { method: 'HEAD' });
        } catch {
          // 실패해도 계속 진행 (사전 로딩이므로)
        }
      })
    );

    logger.info('🚀 Vercel 사전 로딩 완료');
  } catch (error) {
    logger.warn('⚠️ 사전 로딩 중 일부 실패:', error);
  } finally {
    performanceTracker.end('preload-resources');
  }
}

/**
 * Vercel 환경별 최적화 설정
 */
export function getOptimizationConfig() {
  const env = getVercelEnvironment();

  return {
    // 캐싱 설정
    cache: {
      // 프로덕션에서는 더 긴 캐시
      maxAge: env.environment === 'production' ? 3600 : 60,
      // 프리뷰에서는 캐시 버스팅
      bustCache: env.environment === 'preview',
    },

    // 네트워크 설정
    network: {
      // Vercel 환경에서는 더 긴 타임아웃
      timeout: env.isVercel ? 10000 : 5000,
      // 프로덕션에서는 재시도
      retries: env.environment === 'production' ? 2 : 0,
    },

    // 로깅 설정
    logging: {
      // 프로덕션에서는 에러만
      level: env.environment === 'production' ? 'error' : 'debug',
      // Vercel Analytics 호환 포맷
      format: env.isVercel ? 'structured' : 'simple',
    },

    // 성능 설정
    performance: {
      // 번들 분할 임계값
      bundleThreshold: env.isVercel ? 200000 : 500000, // 200KB vs 500KB
      // 이미지 최적화
      imageOptimization: env.isVercel,
    },
  };
}

/**
 * Vercel 에지 런타임 호환성 체크
 */
export function checkEdgeRuntimeCompatibility(): {
  isCompatible: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Node.js API 사용 체크 (Edge Runtime에서 제한됨)
  if (typeof process !== 'undefined' && process.versions?.node) {
    // fs, path 등 Node.js 전용 API 사용 여부 체크는 정적 분석이 필요
    // 여기서는 기본적인 체크만 수행
  }

  // 메모리 사용량 체크 (Edge Runtime은 128MB 제한)
  if (typeof performance !== 'undefined') {
    const extendedPerf = performance as ExtendedPerformance;
    if (extendedPerf.memory) {
      const memory = extendedPerf.memory;
      if (memory.usedJSHeapSize > 50 * 1024 * 1024) {
        // 50MB 이상
        issues.push('높은 메모리 사용량 감지 (Edge Runtime 제한 고려 필요)');
      }
    }
  }

  return {
    isCompatible: issues.length === 0,
    issues,
  };
}

/**
 * Vercel 배포 최적화 체크리스트
 */
export function getDeploymentChecklist(): {
  category: string;
  items: { name: string; status: 'pass' | 'warn' | 'fail' }[];
}[] {
  const env = getVercelEnvironment();
  const optimization = getOptimizationConfig();
  const edgeCompatibility = checkEdgeRuntimeCompatibility();

  return [
    {
      category: '환경 설정',
      items: [
        {
          name: 'Vercel 환경 감지',
          status: env.isVercel ? 'pass' : 'warn',
        },
        {
          name: '환경변수 설정',
          status: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'pass' : 'fail',
        },
      ],
    },
    {
      category: '성능 최적화',
      items: [
        {
          name: '번들 크기',
          status:
            optimization.performance.bundleThreshold < 300000 ? 'pass' : 'warn',
        },
        {
          name: '이미지 최적화',
          status: optimization.performance.imageOptimization ? 'pass' : 'warn',
        },
      ],
    },
    {
      category: 'Edge Runtime 호환성',
      items: [
        {
          name: 'API 호환성',
          status: edgeCompatibility.isCompatible ? 'pass' : 'warn',
        },
        {
          name: '메모리 사용량',
          status: edgeCompatibility.issues.length === 0 ? 'pass' : 'warn',
        },
      ],
    },
  ];
}

// 초기화 로그 (빌드 중에는 스킵)
if (process.env.NEXT_PHASE !== 'phase-production-build') {
  logger.info('🚀 Vercel 최적화 유틸리티 초기화됨:', getVercelEnvironment());
}
