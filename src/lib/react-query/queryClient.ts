/**
 * 🚀 React Query Client 최적화 설정
 * 
 * Phase 7.2: 성능 최적화
 * - 지능형 캐시 관리
 * - 메모리 사용량 최적화
 * - 네트워크 효율성 개선
 */

import { QueryClient } from '@tanstack/react-query';

// 🎯 캐시 설정 상수
const CACHE_TIMES = {
  STALE_TIME: 5 * 60 * 1000,        // 5분 - 데이터가 stale하지 않은 시간
  GC_TIME: 10 * 60 * 1000,          // 10분 - 가비지 컬렉션 시간
  SERVER_STALE_TIME: 30 * 1000,     // 30초 - 서버 상태 데이터
  PREDICTION_STALE_TIME: 2 * 60 * 1000, // 2분 - AI 예측 데이터
} as const;

// 🔄 재시도 로직
function retryFunction(failureCount: number, error: any): boolean {
  // 404, 401, 403은 재시도하지 않음
  const noRetryStatuses = [401, 403, 404];
  if (error?.status && noRetryStatuses.includes(error.status)) {
    return false;
  }
  
  // 최대 3회 재시도
  return failureCount < 3;
}

// 🕐 재시도 지연 시간 (지수 백오프)
function retryDelay(attemptIndex: number): number {
  return Math.min(1000 * (2 ** attemptIndex), 30000);
}

// 📊 쿼리 메타데이터 타입
interface QueryMeta {
  errorMessage?: string;
  persist?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

// 🚀 최적화된 Query Client 생성
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 기본 캐시 설정
      staleTime: CACHE_TIMES.STALE_TIME,
      gcTime: CACHE_TIMES.GC_TIME,
      
      // 재시도 설정
      retry: retryFunction,
      retryDelay,
      
      // 네트워크 최적화
      refetchOnWindowFocus: false,    // 창 포커스 시 자동 새로고침 비활성화
      refetchOnReconnect: true,       // 재연결 시 새로고침
      refetchOnMount: true,           // 마운트 시 새로고침
      
      // 성능 최적화
      notifyOnChangeProps: 'all',     // 모든 변경사항 알림
      structuralSharing: true,        // 구조적 공유로 메모리 최적화
      
      // 에러 처리
      throwOnError: false,            // 에러를 throw하지 않고 상태로 관리
      
      // 개발 환경 설정
      ...(process.env.NODE_ENV === 'development' && {
        refetchOnWindowFocus: true,   // 개발 중에는 포커스 시 새로고침
      }),
    },
    mutations: {
      // Mutation 재시도 설정
      retry: (failureCount, error: any) => {
        if (error?.status && [400, 401, 403, 404].includes(error.status)) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay,
      
      // 에러 처리
      throwOnError: false,
      
      // 네트워크 설정
      networkMode: 'online',
    },
  },
});

// 🎯 쿼리별 특화 설정
export const queryConfigs = {
  // 서버 상태 쿼리
  servers: {
    staleTime: CACHE_TIMES.SERVER_STALE_TIME,
    refetchInterval: 30000, // 30초
    meta: { 
      errorMessage: '서버 데이터를 불러오는데 실패했습니다.',
      priority: 'high' 
    } as QueryMeta,
  },
  
  // AI 예측 쿼리
  predictions: {
    staleTime: CACHE_TIMES.PREDICTION_STALE_TIME,
    refetchInterval: 60000, // 1분
    meta: { 
      errorMessage: 'AI 예측 데이터를 불러오는데 실패했습니다.',
      priority: 'medium' 
    } as QueryMeta,
  },
  
  // 시스템 헬스 쿼리
  health: {
    staleTime: 10000, // 10초
    refetchInterval: 15000, // 15초
    meta: { 
      errorMessage: '시스템 상태를 확인하는데 실패했습니다.',
      priority: 'high' 
    } as QueryMeta,
  },
  
  // 메트릭 쿼리
  metrics: {
    staleTime: CACHE_TIMES.SERVER_STALE_TIME,
    refetchInterval: 45000, // 45초
    meta: { 
      errorMessage: '메트릭 데이터를 불러오는데 실패했습니다.',
      priority: 'medium' 
    } as QueryMeta,
  },
} as const;

// 🧹 캐시 관리 유틸리티
export const cacheUtils = {
  // 전체 캐시 클리어
  clearAll: () => {
    queryClient.clear();
  },
  
  // 특정 키 패턴 무효화
  invalidateByPattern: (pattern: string) => {
    queryClient.invalidateQueries({
      predicate: (query) => {
        return query.queryKey.some(key => 
          typeof key === 'string' && key.includes(pattern)
        );
      },
    });
  },
  
  // 오래된 캐시 정리
  removeStaleQueries: () => {
    queryClient.getQueryCache().getAll()
      .filter(query => query.isStale())
      .forEach(query => {
        queryClient.removeQueries({ queryKey: query.queryKey });
      });
  },
  
  // 메모리 사용량 확인
  getMemoryUsage: () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    return {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      memoryEstimate: `${Math.round(queries.length * 0.1)}KB`, // 대략적 추정
    };
  },
};

// 🔄 자동 캐시 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    cacheUtils.removeStaleQueries();
  }, 5 * 60 * 1000);
}

// 📊 성능 모니터링 (개발 환경)
if (process.env.NODE_ENV === 'development') {
  // 5분마다 캐시 상태 로깅
  setInterval(() => {
    console.log('📊 Cache Status:', cacheUtils.getMemoryUsage());
  }, 5 * 60 * 1000);
} 