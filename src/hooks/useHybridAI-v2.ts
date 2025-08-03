/**
 * 🎯 하이브리드 AI 시스템 React Hook v2
 * 
 * Supabase Realtime 기반 AI 요청 관리
 * - 실시간 WebSocket 구독
 * - 자동 재연결
 * - 로컬 캐싱으로 요청 최소화
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { UnifiedAIResponse } from '@/services/ai/formatters/unified-response-formatter';
import type { ThinkingStep, AIServiceType } from '@/services/ai/interfaces/distributed-ai.interface';

// Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Hook 설정
const CONFIG = {
  apiEndpoint: '/api/ai/edge-v2',
  streamEndpoint: '/api/ai/thinking/stream-v2',
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
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
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
    connectionStatus: 'disconnected',
  });

  // Refs
  const localCache = useRef<Map<string, CacheEntry>>(new Map());
  const batchQueue = useRef<BatchRequest[]>([]);
  const batchTimer = useRef<NodeJS.Timeout>();
  const realtimeChannel = useRef<RealtimeChannel>();
  const responseTimes = useRef<number[]>([]);
  const currentSessionId = useRef<string>();

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

  // Supabase Realtime 구독
  const subscribeToThinkingSteps = useCallback((sessionId: string) => {
    // 기존 채널 정리
    if (realtimeChannel.current) {
      realtimeChannel.current.unsubscribe();
    }

    currentSessionId.current = sessionId;
    setState(prev => ({ ...prev, connectionStatus: 'connecting' }));

    // 새 채널 생성
    realtimeChannel.current = supabase
      .channel(`thinking-steps:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'thinking_steps',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const step = payload.new as any;
          const thinkingStep: ThinkingStep = {
            id: step.id,
            step: step.step,
            description: step.description,
            status: step.status,
            timestamp: step.timestamp,
            duration: step.duration,
            service: step.service,
          };

          setState((prev) => ({
            ...prev,
            thinkingSteps: [...prev.thinkingSteps, thinkingStep],
          }));

          // 완료 감지
          if (step.status === 'completed' && step.step === 'AI 처리 완료') {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'thinking_steps',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setState((prev) => ({
            ...prev,
            thinkingSteps: prev.thinkingSteps.map(step =>
              step.id === updated.id
                ? {
                    ...step,
                    status: updated.status,
                    duration: updated.duration,
                  }
                : step
            ),
          }));
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setState(prev => ({ ...prev, connectionStatus: 'connected' }));
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setState(prev => ({ ...prev, connectionStatus: 'disconnected' }));
        }
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
              subscribeToThinkingSteps(sessionId);

              const response = await fetch(CONFIG.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  query: prompt,
                  userId: session?.user?.id,
                  sessionId,
                  services: options.services || ['redis-cache', 'supabase-rag', 'gcp-korean-nlp'],
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
              const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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
    [session, subscribeToThinkingSteps, processBatch]
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
      if (realtimeChannel.current) {
        realtimeChannel.current.unsubscribe();
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
    isStreaming: state.connectionStatus === 'connected',
    cacheSize: localCache.current.size,
    queueSize: batchQueue.current.length,
  };
}