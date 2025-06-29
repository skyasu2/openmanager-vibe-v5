/**
 * 🚀 베르셀 친화적 Redis 기반 시스템 스토어 v2.0
 *
 * 한국시간: 2025-01-28 02:20 KST
 * - Redis/Upstash 기반 다중 사용자 동기화
 * - 서버리스 환경 최적화
 * - 세션 기반 실시간 상태 관리
 * - 자동 폴백 및 에러 처리
 */

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// 시스템 상태 타입 (Redis API와 동일)
export type SystemState = 'STOPPED' | 'STARTING' | 'RUNNING' | 'STOPPING';

export interface VercelSystemInfo {
  state: SystemState;
  lastUpdated: string;
  sessionId: string;
  activeUsers: number;
  startedAt?: string;
  stoppedAt?: string;
  heartbeat: string;
}

interface VercelSystemStore {
  // 상태
  systemInfo: VercelSystemInfo;
  isLoading: boolean;
  error: string | null;
  pollingEnabled: boolean;
  pollingInterval: NodeJS.Timeout | null;
  sessionId: string;

  // Redis 동기화 관련
  isConnectedToRedis: boolean;
  lastSyncTime: string;
  retryCount: number;

  // 액션
  startSystem: () => Promise<void>;
  stopSystem: () => Promise<void>;
  fetchSystemState: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  reset: () => void;

  // 내부 메서드
  setSystemInfo: (info: VercelSystemInfo) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 세션 ID 생성
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 한국시간 반환
function getKoreanTime(): string {
  return new Date().toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// API 호출 유틸리티
async function callSystemAPI(
  method: 'GET' | 'POST' | 'DELETE',
  body?: any,
  params?: Record<string, string>
): Promise<any> {
  try {
    const url = new URL('/api/system/state', window.location.origin);

    // 쿼리 파라미터 추가
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      throw new Error(
        `API 호출 실패: ${response.status} ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API 호출 에러:', error);
    throw error;
  }
}

// 기본 시스템 정보
const defaultSystemInfo: VercelSystemInfo = {
  state: 'STOPPED',
  lastUpdated: getKoreanTime(),
  sessionId: generateSessionId(),
  activeUsers: 0,
  heartbeat: getKoreanTime(),
};

export const useVercelSystemStore = create<VercelSystemStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      systemInfo: defaultSystemInfo,
      isLoading: false,
      error: null,
      pollingEnabled: false,
      pollingInterval: null,
      sessionId: generateSessionId(),
      isConnectedToRedis: false,
      lastSyncTime: getKoreanTime(),
      retryCount: 0,

      // 시스템 시작
      startSystem: async () => {
        const store = get();

        try {
          set({ isLoading: true, error: null });

          // 1단계: 시작 요청
          const startResponse = await callSystemAPI('POST', {
            action: 'start',
            sessionId: store.sessionId,
          });

          if (!startResponse.success) {
            throw new Error(startResponse.error || '시스템 시작 요청 실패');
          }

          // 상태 업데이트
          set({
            systemInfo: startResponse.data,
            isConnectedToRedis: true,
            lastSyncTime: getKoreanTime(),
            retryCount: 0,
          });

          // 시작 프로세스 시뮬레이션 (3초)
          setTimeout(async () => {
            try {
              const completeResponse = await callSystemAPI('POST', {
                action: 'complete_start',
                sessionId: store.sessionId,
              });

              if (completeResponse.success) {
                set({
                  systemInfo: completeResponse.data,
                  lastSyncTime: getKoreanTime(),
                });
              }
            } catch (error) {
              console.error('시작 완료 요청 실패:', error);
              set({ error: '시작 완료 처리 실패' });
            }
          }, 3000);
        } catch (error) {
          console.error('시스템 시작 실패:', error);
          set({
            error: error instanceof Error ? error.message : '시스템 시작 실패',
            isConnectedToRedis: false,
            retryCount: get().retryCount + 1,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // 시스템 중지
      stopSystem: async () => {
        const store = get();

        try {
          set({ isLoading: true, error: null });

          // 1단계: 중지 요청
          const stopResponse = await callSystemAPI('POST', {
            action: 'stop',
            sessionId: store.sessionId,
          });

          if (!stopResponse.success) {
            throw new Error(stopResponse.error || '시스템 중지 요청 실패');
          }

          // 상태 업데이트
          set({
            systemInfo: stopResponse.data,
            lastSyncTime: getKoreanTime(),
          });

          // 중지 프로세스 시뮬레이션 (2초)
          setTimeout(async () => {
            try {
              const completeResponse = await callSystemAPI('POST', {
                action: 'complete_stop',
                sessionId: store.sessionId,
              });

              if (completeResponse.success) {
                set({
                  systemInfo: completeResponse.data,
                  lastSyncTime: getKoreanTime(),
                });
              }
            } catch (error) {
              console.error('중지 완료 요청 실패:', error);
              set({ error: '중지 완료 처리 실패' });
            }
          }, 2000);
        } catch (error) {
          console.error('시스템 중지 실패:', error);
          set({
            error: error instanceof Error ? error.message : '시스템 중지 실패',
            retryCount: get().retryCount + 1,
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // 시스템 상태 조회 (Redis 동기화)
      fetchSystemState: async () => {
        const store = get();

        try {
          const response = await callSystemAPI('GET', undefined, {
            sessionId: store.sessionId,
          });

          if (response.success) {
            const updatedInfo = response.data;

            // 상태 업데이트
            set({
              systemInfo: updatedInfo,
              isConnectedToRedis: true,
              lastSyncTime: getKoreanTime(),
              error: null,
              retryCount: 0,
            });

            console.log(
              `🔄 Redis 동기화: ${updatedInfo.state} (사용자: ${updatedInfo.activeUsers}명)`
            );
          } else {
            throw new Error(response.error || '상태 조회 실패');
          }
        } catch (error) {
          console.error('상태 조회 실패:', error);

          const retryCount = get().retryCount + 1;
          set({
            error: error instanceof Error ? error.message : '상태 조회 실패',
            isConnectedToRedis: false,
            retryCount,
          });

          // 재시도 로직 (최대 3회)
          if (retryCount < 3) {
            setTimeout(() => {
              get().fetchSystemState();
            }, 2000 * retryCount); // 점진적 백오프
          }
        }
      },

      // 폴링 시작
      startPolling: () => {
        const store = get();

        if (store.pollingInterval) {
          clearInterval(store.pollingInterval);
        }

        // 즉시 한 번 실행
        store.fetchSystemState();

        // 10초마다 폴링
        const interval = setInterval(() => {
          const currentStore = get();
          if (currentStore.pollingEnabled) {
            currentStore.fetchSystemState();
          }
        }, 10000);

        set({
          pollingEnabled: true,
          pollingInterval: interval,
        });

        console.log('🔄 Redis 폴링 시작 (10초 간격)');
      },

      // 폴링 중지
      stopPolling: () => {
        const store = get();

        if (store.pollingInterval) {
          clearInterval(store.pollingInterval);
        }

        set({
          pollingEnabled: false,
          pollingInterval: null,
        });

        console.log('⏹️ Redis 폴링 중지');
      },

      // 상태 초기화
      reset: () => {
        const store = get();

        // 폴링 중지
        if (store.pollingInterval) {
          clearInterval(store.pollingInterval);
        }

        // 새 세션 ID 생성
        const newSessionId = generateSessionId();

        set({
          systemInfo: {
            ...defaultSystemInfo,
            sessionId: newSessionId,
          },
          isLoading: false,
          error: null,
          pollingEnabled: false,
          pollingInterval: null,
          sessionId: newSessionId,
          isConnectedToRedis: false,
          lastSyncTime: getKoreanTime(),
          retryCount: 0,
        });

        console.log('🔄 베르셀 시스템 스토어 초기화');
      },

      // 내부 메서드들
      setSystemInfo: (info: VercelSystemInfo) => {
        set({
          systemInfo: info,
          lastSyncTime: getKoreanTime(),
        });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    {
      name: 'vercel-system-storage-v3', // 버전 업그레이드
      partialize: state => ({
        // 중요한 상태만 persist
        sessionId: state.sessionId,
        systemInfo: {
          ...state.systemInfo,
          // 하트비트는 저장하지 않음
          heartbeat: getKoreanTime(),
        },
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          // 스토리지에서 복원 후 즉시 Redis와 동기화
          console.log('📦 베르셀 시스템 스토어 복원 완료');

          // 복원 후 즉시 폴링 시작하여 최신 상태 동기화
          setTimeout(() => {
            if (state.fetchSystemState) {
              state.fetchSystemState();
              state.startPolling();
            }
          }, 100);
        }
      },
    }
  )
);

// 자동 초기화 (클라이언트 사이드에서만)
if (typeof window !== 'undefined') {
  // 페이지 로드 시 자동으로 폴링 시작
  setTimeout(() => {
    const store = useVercelSystemStore.getState();
    if (!store.pollingEnabled) {
      store.startPolling();
    }
  }, 1000);

  // 페이지 언로드 시 정리
  window.addEventListener('beforeunload', () => {
    const store = useVercelSystemStore.getState();
    store.stopPolling();

    // 세션 정리 요청 (백그라운드에서)
    if (store.sessionId && navigator.sendBeacon) {
      const url = `/api/system/state?sessionId=${store.sessionId}`;
      navigator.sendBeacon(url, JSON.stringify({ method: 'DELETE' }));
    }
  });
}
