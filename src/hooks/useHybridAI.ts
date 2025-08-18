/**
 * 🎯 하이브리드 AI 시스템 React Hook
 *
 * 무료 티어 최적화된 AI 요청 관리
 * - 자동 요청 배치 처리
 * - 실시간 생각중 상태 스트리밍
 * - 로컬 캐싱으로 요청 최소화
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type { UnifiedAIResponse } from '@/services/ai/formatters/unified-response-formatter';
import type {
  ThinkingStep,
  AIServiceType,
} from '@/services/ai/interfaces/distributed-ai.interface';

// Hook 설정
const CONFIG = {
  apiEndpoint: '/api/ai/edge',
  streamEndpoint: '/api/ai/thinking/stream',
  localCacheTTL: 5 * 60 * 1000, // 5분
  batchDelay: 100, // 100ms
  maxBatchSize: 3,
};

// 로컬 캐시 타입
interface CacheEntry {
  query: string;
  response: UnifiedAIResponse;
  timestamp: number;
}

// Hook 상태 타입
interface HybridAIState {
  isLoading: boolean;
  response: UnifiedAIResponse | null;
  thinkingSteps: ThinkingStep[];
  error: string | null;
  stats: {
    cacheHits: number;
    totalRequests: number;
    avgResponseTime: number;
  };
}

// 배치 요청 타입
interface BatchRequest {
  query: string;
  resolve: (response: UnifiedAIResponse) => void;
  reject: (error: Error) => void;
}

export function useHybridAI() {
  const { data: session } = useSession();
  const [state, setState] = useState<HybridAIState>({
    isLoading: false,
    response: null,
    thinkingSteps: [],
    error: null,
    stats: {
      cacheHits: 0,
      totalRequests: 0,
      avgResponseTime: 0,
    },
  });

  // Refs
  const localCache = useRef<Map<string, CacheEntry>>(new Map());
  const batchQueue = useRef<BatchRequest[]>([]);
  const batchTimer = useRef<NodeJS.Timeout>();
  const eventSource = useRef<EventSource>();
  const responseTimes = useRef<number[]>([]);

  // 캐시 정리
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of localCache.current.entries()) {
        if (now - entry.timestamp > CONFIG.localCacheTTL) {
          localCache.current.delete(key);
        }
      }
    }, 60000); // 1분마다

    return () => clearInterval(interval);
  }, []);

  // SSE 연결 설정
  const connectThinkingStream = useCallback((sessionId: string) => {
    // 기존 연결 종료
    if (eventSource.current) {
      eventSource.current.close();
    }

    // 새 연결 생성
    eventSource.current = new EventSource(
      `${CONFIG.streamEndpoint}?sessionId=${sessionId}`
    );

    eventSource.current.addEventListener('thinking', (event) => {
      const step: ThinkingStep = JSON.parse(event.data);
      setState((prev) => ({
        ...prev,
        thinkingSteps: [...prev.thinkingSteps, step],
      }));
    });

    eventSource.current.addEventListener('complete', () => {
      eventSource.current?.close();
      eventSource.current = undefined;
    });

    eventSource.current.addEventListener('error', (event) => {
      console.error('SSE Error:', event);
      eventSource.current?.close();
      eventSource.current = undefined;
    });
  }, []);

  // 배치 처리 실행
  const processBatch = useCallback(async () => {
    const batch = batchQueue.current.splice(0, CONFIG.maxBatchSize);
    if (batch.length === 0) return;

    try {
      // 병렬 요청 (무료 티어 내에서)
      const promises = batch.map(async ({ query, resolve, reject }) => {
        try {
          const response = await fetch(CONFIG.apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query,
              userId: session?.user?.id,
              services: ['redis-cache', 'supabase-rag'], // 무료 서비스 우선
              parallel: true,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data: UnifiedAIResponse = await response.json();

          // 로컬 캐시 저장
          const cacheKey = query.toLowerCase().trim();
          localCache.current.set(cacheKey, {
            query,
            response: data,
            timestamp: Date.now(),
          });

          resolve(data);
        } catch (error) {
          reject(error instanceof Error ? error : new Error('Unknown error'));
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }, [session]);

  // AI 쿼리 실행
  const query = useCallback(
    async (
      prompt: string,
      options?: {
        services?: AIServiceType[];
        skipCache?: boolean;
        priority?: 'low' | 'normal' | 'high';
      }
    ): Promise<UnifiedAIResponse> => {
      const startTime = Date.now();
      const cacheKey = prompt.toLowerCase().trim();

      // 통계 업데이트
      setState((prev) => ({
        ...prev,
        stats: {
          ...prev.stats,
          totalRequests: prev.stats.totalRequests + 1,
        },
      }));

      // 1. 로컬 캐시 확인
      if (!options?.skipCache) {
        const cached = localCache.current.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CONFIG.localCacheTTL) {
          setState((prev) => ({
            ...prev,
            response: cached.response,
            stats: {
              ...prev.stats,
              cacheHits: prev.stats.cacheHits + 1,
            },
          }));
          return cached.response;
        }
      }

      // 2. 요청 준비
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
        thinkingSteps: [],
      }));

      return new Promise((resolve, reject) => {
        // 높은 우선순위는 즉시 처리
        if (options?.priority === 'high') {
          (async () => {
            try {
              const sessionId = crypto.randomUUID();
              connectThinkingStream(sessionId);

              const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: prompt,
                  userId: session?.user?.id,
                  sessionId,
                  services: options.services || [
                    'redis-cache',
                    'supabase-rag',
                    'gcp-korean-nlp',
                  ],
                  parallel: true,
                }),
              });

              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }

              const data: UnifiedAIResponse = await response.json();

              // 상태 업데이트
              const responseTime = Date.now() - startTime;
              responseTimes.current.push(responseTime);
              if (responseTimes.current.length > 100) {
                responseTimes.current.shift();
              }

              setState((prev) => ({
                ...prev,
                isLoading: false,
                response: data,
                stats: {
                  ...prev.stats,
                  avgResponseTime:
                    responseTimes.current.reduce((a, b) => a + b, 0) /
                    responseTimes.current.length,
                },
              }));

              resolve(data);
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Unknown error';
              setState((prev) => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
              }));
              reject(error);
            }
          })();
        } else {
          // 배치 큐에 추가
          batchQueue.current.push({ query: prompt, resolve, reject });

          // 배치 타이머 설정
          if (batchTimer.current) {
            clearTimeout(batchTimer.current);
          }

          batchTimer.current = setTimeout(() => {
            processBatch();
          }, CONFIG.batchDelay);

          // 큐가 가득 차면 즉시 처리
          if (batchQueue.current.length >= CONFIG.maxBatchSize) {
            clearTimeout(batchTimer.current);
            processBatch();
          }
        }
      });
    },
    [session, connectThinkingStream, processBatch]
  );

  // 캐시 클리어
  const clearCache = useCallback(() => {
    localCache.current.clear();
    setState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        cacheHits: 0,
      },
    }));
  }, []);

  // 통계 리셋
  const resetStats = useCallback(() => {
    responseTimes.current = [];
    setState((prev) => ({
      ...prev,
      stats: {
        cacheHits: 0,
        totalRequests: 0,
        avgResponseTime: 0,
      },
    }));
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (eventSource.current) {
        eventSource.current.close();
      }
      if (batchTimer.current) {
        clearTimeout(batchTimer.current);
      }
    };
  }, []);

  return {
    // 상태
    ...state,

    // 메서드
    query,
    clearCache,
    resetStats,

    // 유틸리티
    isStreaming: !!eventSource.current,
    cacheSize: localCache.current.size,
    queueSize: batchQueue.current.length,
  };
}
