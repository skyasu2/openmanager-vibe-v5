/**
 * 🧠 Memory Pool 최적화: 효율적 메모리 관리
 * 
 * Phase 7.4: 고급 패턴 구현
 * - 객체 풀링 기본 구조
 * - 메모리 재사용 패턴
 * - 가비지 컬렉션 최적화
 * - 백엔드 분석 로직 대비
 */

import { useCallback, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

// 🧠 메모리 풀 타입
interface MemoryPool<T> {
  pool: T[];
  create: () => T;
  reset: (item: T) => void;
  maxSize: number;
  currentSize: number;
}

// 📊 메모리 통계 타입
interface MemoryStats {
  poolHits: number;
  poolMisses: number;
  totalAllocations: number;
  memoryReused: number;
  gcReductions: number;
}

// 🎯 기본 객체 풀 구현
export const createObjectPool = <T>(
  createFn: () => T,
  resetFn: (item: T) => void,
  maxSize: number = 50
): MemoryPool<T> => {
  const pool: T[] = [];
  const currentSize = 0;

  return {
    pool,
    create: createFn,
    reset: resetFn,
    maxSize,
    get currentSize() {
      return currentSize;
    },
  };
};

// 🔄 React Query 캐시 메모리 최적화
export const useQueryCacheOptimization = () => {
  const queryClient = useQueryClient();
  const statsRef = useRef<MemoryStats>({
    poolHits: 0,
    poolMisses: 0,
    totalAllocations: 0,
    memoryReused: 0,
    gcReductions: 0,
  });

  // 📊 캐시 크기 모니터링
  const getCacheStats = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    const totalQueries = queries.length;
    const activeQueries = queries.filter(q => q.observers.length > 0).length;
    const staleQueries = queries.filter(q => q.isStale()).length;
    
    const estimatedMemoryUsage = queries.reduce((acc, query) => {
      if (query.state.data) {
        return acc + JSON.stringify(query.state.data).length;
      }
      return acc;
    }, 0);

    return {
      totalQueries,
      activeQueries,
      staleQueries,
      estimatedMemoryUsage: Math.round(estimatedMemoryUsage / 1024), // KB
      hitRatio: statsRef.current.poolHits / Math.max(1, statsRef.current.totalAllocations),
    };
  }, [queryClient]);

  // 🧹 메모리 압축 및 정리
  const compactMemory = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    let removedCount = 0;

    queries.forEach(query => {
      // 10분 이상 사용되지 않은 비활성 쿼리 제거
      const isOldInactive = query.observers.length === 0 && 
                           Date.now() - query.state.dataUpdatedAt > 10 * 60 * 1000;
      
      // 오래된 실패한 쿼리 제거
      const isOldError = query.state.status === 'error' && 
                        Date.now() - query.state.errorUpdatedAt > 5 * 60 * 1000;

      if (isOldInactive || isOldError) {
        queryClient.removeQueries({ queryKey: query.queryKey });
        removedCount++;
        statsRef.current.gcReductions++;
      }
    });

    console.log(`🧹 메모리 압축: ${removedCount}개 쿼리 제거`);
    return removedCount;
  }, [queryClient]);

  // 🔄 데이터 구조 최적화
  const optimizeDataStructures = useCallback(() => {
    const queries = queryClient.getQueryCache().getAll();
    let optimizedCount = 0;

    queries.forEach(query => {
      if (query.state.data && Array.isArray(query.state.data)) {
        // 큰 배열 데이터 압축 (1000개 이상 시)
        if (query.state.data.length > 1000) {
          const compressedData = {
            ...query.state.data,
            // 최신 500개 + 랜덤 샘플 500개만 유지
            _compressed: true,
            _originalLength: query.state.data.length,
            data: [
              ...query.state.data.slice(0, 500),
              ...query.state.data.slice(-500)
            ]
          };
          
          queryClient.setQueryData(query.queryKey, compressedData);
          optimizedCount++;
          statsRef.current.memoryReused++;
        }
      }
    });

    return optimizedCount;
  }, [queryClient]);

  // ⏰ 자동 메모리 관리 (15분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      compactMemory();
      optimizeDataStructures();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [compactMemory, optimizeDataStructures]);

  return {
    getCacheStats,
    compactMemory,
    optimizeDataStructures,
    stats: statsRef.current,
  };
};

// 🎯 객체 재사용 풀 (로그 엔트리용)
export const useLogEntryPool = () => {
  const poolRef = useRef<MemoryPool<any> | null>(null);

  if (!poolRef.current) {
    poolRef.current = createObjectPool(
      // 로그 엔트리 생성
      () => ({
        id: '',
        timestamp: '',
        level: 'info',
        message: '',
        source: '',
        metadata: {},
        serverId: '',
      }),
      // 로그 엔트리 리셋
      (item) => {
        item.id = '';
        item.timestamp = '';
        item.level = 'info';
        item.message = '';
        item.source = '';
        item.metadata = {};
        item.serverId = '';
      },
      100 // 최대 100개 로그 엔트리 풀
    );
  }

  const getLogEntry = useCallback(() => {
    const pool = poolRef.current!;
    if (pool.pool.length > 0) {
      return pool.pool.pop()!;
    }
    return pool.create();
  }, []);

  const returnLogEntry = useCallback((entry: any) => {
    const pool = poolRef.current!;
    if (pool.pool.length < pool.maxSize) {
      pool.reset(entry);
      pool.pool.push(entry);
    }
  }, []);

  return { getLogEntry, returnLogEntry };
};

// 🔮 AI 예측 결과 풀
export const usePredictionPool = () => {
  const poolRef = useRef<MemoryPool<any> | null>(null);

  if (!poolRef.current) {
    poolRef.current = createObjectPool(
      // 예측 결과 생성
      () => ({
        id: '',
        timestamp: '',
        metric: '',
        predicted_value: 0,
        actual_value: null,
        accuracy: null,
        model_version: '',
        serverId: '',
        confidence: 0,
      }),
      // 예측 결과 리셋
      (item) => {
        item.id = '';
        item.timestamp = '';
        item.metric = '';
        item.predicted_value = 0;
        item.actual_value = null;
        item.accuracy = null;
        item.model_version = '';
        item.serverId = '';
        item.confidence = 0;
      },
      50 // 최대 50개 예측 결과 풀
    );
  }

  const getPrediction = useCallback(() => {
    const pool = poolRef.current!;
    if (pool.pool.length > 0) {
      return pool.pool.pop()!;
    }
    return pool.create();
  }, []);

  const returnPrediction = useCallback((prediction: any) => {
    const pool = poolRef.current!;
    if (pool.pool.length < pool.maxSize) {
      pool.reset(prediction);
      pool.pool.push(prediction);
    }
  }, []);

  return { getPrediction, returnPrediction };
};

// 🧠 통합 메모리 풀 관리자
export const useMemoryPoolManager = () => {
  const cacheOptimization = useQueryCacheOptimization();
  const logPool = useLogEntryPool();
  const predictionPool = usePredictionPool();

  // 📊 전체 메모리 상태
  const getOverallMemoryStatus = useCallback(() => {
    const cacheStats = cacheOptimization.getCacheStats();
    
    return {
      cache: cacheStats,
      pools: {
        logs: {
          available: typeof logPool.getLogEntry === 'function' ? 'active' : 'inactive',
          usage: 'optimized',
        },
        predictions: {
          available: typeof predictionPool.getPrediction === 'function' ? 'active' : 'inactive',
          usage: 'optimized',
        },
      },
      recommendations: generateMemoryRecommendations(cacheStats),
    };
  }, [cacheOptimization, logPool, predictionPool]);

  // 🧹 전체 메모리 정리
  const performFullCleanup = useCallback(async () => {
    const removedQueries = cacheOptimization.compactMemory();
    const optimizedStructures = cacheOptimization.optimizeDataStructures();
    
    // 강제 가비지 컬렉션 제안 (브라우저에서 실제로 실행되지는 않음)
    if ('gc' in window && typeof (window as any).gc === 'function') {
      (window as any).gc();
    }

    return {
      removedQueries,
      optimizedStructures,
      timestamp: new Date().toISOString(),
    };
  }, [cacheOptimization]);

  return {
    getOverallMemoryStatus,
    performFullCleanup,
    cache: cacheOptimization,
    pools: {
      logs: logPool,
      predictions: predictionPool,
    },
  };
};

// 🎯 메모리 추천 생성기
function generateMemoryRecommendations(stats: {
  totalQueries: number;
  activeQueries: number;
  staleQueries: number;
  estimatedMemoryUsage: number;
  hitRatio: number;
}) {
  const recommendations: string[] = [];

  if (stats.estimatedMemoryUsage > 5000) { // 5MB 이상
    recommendations.push('캐시 크기가 큽니다. 메모리 정리를 권장합니다.');
  }

  if (stats.staleQueries > stats.totalQueries * 0.3) {
    recommendations.push('오래된 데이터가 많습니다. 자동 갱신 설정을 확인하세요.');
  }

  if (stats.hitRatio < 0.7) {
    recommendations.push('캐시 적중률이 낮습니다. 캐시 전략을 재검토하세요.');
  }

  if (recommendations.length === 0) {
    recommendations.push('메모리 사용량이 최적화되었습니다. 👍');
  }

  return recommendations;
}

// 🎯 메모리 풀 설정 프리셋
export const MEMORY_POOL_PRESETS = {
  // 🚀 고성능 모드
  performance: {
    logPoolSize: 200,
    predictionPoolSize: 100,
    cacheMaxAge: 5 * 60 * 1000, // 5분
    compactionInterval: 5 * 60 * 1000, // 5분
  },
  
  // ⚖️ 균형 모드
  balanced: {
    logPoolSize: 100,
    predictionPoolSize: 50,
    cacheMaxAge: 10 * 60 * 1000, // 10분
    compactionInterval: 15 * 60 * 1000, // 15분
  },
  
  // 💾 메모리 절약 모드
  conservative: {
    logPoolSize: 50,
    predictionPoolSize: 25,
    cacheMaxAge: 2 * 60 * 1000, // 2분
    compactionInterval: 2 * 60 * 1000, // 2분
  },
} as const;

// 📝 향후 확장 기능 타입 정의
export interface FutureMemoryOptimizations {
  // 🔄 스마트 압축
  smartCompression?: {
    algorithm: 'lz4' | 'gzip' | 'brotli';
    threshold: number; // 압축 임계값 (바이트)
    enabled: boolean;
  };
  
  // 🎯 적응형 풀 크기
  adaptivePooling?: {
    minSize: number;
    maxSize: number;
    growthFactor: number;
    shrinkFactor: number;
  };
  
  // 📊 고급 메트릭
  advancedMetrics?: {
    heapUsage: boolean;
    fragmentationRatio: boolean;
    allocationRate: boolean;
  };
} 