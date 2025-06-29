/**
 * 🔄 통합 실시간 상태 관리 스토어 v1.0 - 2025.06.27 KST
 *
 * ✅ 모든 컴포넌트 통합 실시간 업데이트
 * ✅ 중복 API 호출 제거
 * ✅ 30초 통일 polling 간격
 * ✅ 메모리 최적화 및 성능 향상
 * ✅ 에러 핸들링 및 자동 복구
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// 🎯 시스템 상태 타입 정의
export interface SystemStatus {
  health: 'healthy' | 'warning' | 'critical' | 'offline';
  uptime: number;
  memoryUsage: {
    percentage: number;
    used: number;
    total: number;
  };
  processes: Record<string, any>;
  timestamp: string;
}

export interface PerformanceData {
  metrics: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    performanceScore: number;
    avgResponseTime: number;
    activeConnections: number;
    errorRate: number;
  };
  detailed: any;
  timestamp: string;
}

export interface ServerInstance {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  lastUpdate: string;
}

// 🏪 통합 실시간 스토어 상태
interface GlobalRealtimeState {
  // 📊 시스템 상태
  systemStatus: SystemStatus | null;
  performanceData: PerformanceData | null;
  servers: ServerInstance[];

  // 🔄 업데이트 상태
  isPolling: boolean;
  lastUpdate: Date | null;
  error: string | null;
  retryCount: number;

  // 🎮 액션들
  startPolling: () => void;
  stopPolling: () => void;
  fetchAllData: () => Promise<void>;
  updateSystemStatus: (status: SystemStatus) => void;
  updatePerformanceData: (data: PerformanceData) => void;
  updateServers: (servers: ServerInstance[]) => void;
  clearError: () => void;
}

// 🔧 통합 실시간 설정
const UNIFIED_POLLING_INTERVAL = 30000; // 30초 통일
const MAX_RETRY_COUNT = 5;
const RETRY_DELAY_BASE = 2000;

let pollingInterval: NodeJS.Timeout | null = null;

// 🏪 글로벌 실시간 스토어 생성
export const useGlobalRealtimeStore = create<GlobalRealtimeState>()(
  subscribeWithSelector((set, get) => ({
    // 초기 상태
    systemStatus: null,
    performanceData: null,
    servers: [],
    isPolling: false,
    lastUpdate: null,
    error: null,
    retryCount: 0,

    // 🔄 통합 데이터 페칭
    fetchAllData: async () => {
      const state = get();

      try {
        console.log(
          '🔄 통합 실시간 데이터 업데이트 시작 (KST):',
          new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
        );

        // 병렬 API 호출로 성능 최적화
        const [systemResponse, performanceResponse, serversResponse] =
          await Promise.allSettled([
            fetch('/api/system/status', {
              headers: { 'Cache-Control': 'no-cache' },
              signal: AbortSignal.timeout(10000), // 10초 타임아웃
            }),
            fetch('/api/performance?summary=true', {
              headers: { 'Cache-Control': 'no-cache' },
              signal: AbortSignal.timeout(10000),
            }),
            fetch('/api/dashboard', {
              headers: { 'Cache-Control': 'no-cache' },
              signal: AbortSignal.timeout(10000),
            }),
          ]);

        let hasUpdate = false;

        // 시스템 상태 업데이트
        if (systemResponse.status === 'fulfilled' && systemResponse.value.ok) {
          const systemData = await systemResponse.value.json();
          set({ systemStatus: systemData });
          hasUpdate = true;
        }

        // 성능 데이터 업데이트
        if (
          performanceResponse.status === 'fulfilled' &&
          performanceResponse.value.ok
        ) {
          const performanceData = await performanceResponse.value.json();
          set({ performanceData: performanceData.data });
          hasUpdate = true;
        }

        // 서버 데이터 업데이트
        if (
          serversResponse.status === 'fulfilled' &&
          serversResponse.value.ok
        ) {
          const serverData = await serversResponse.value.json();
          const servers = serverData.data?.servers || serverData.servers || [];
          set({ servers: servers.slice(0, 20) }); // 최대 20개 서버만
          hasUpdate = true;
        }

        if (hasUpdate) {
          set({
            lastUpdate: new Date(),
            error: null,
            retryCount: 0,
          });

          console.log('✅ 통합 실시간 데이터 업데이트 완료:', {
            systemHealth: get().systemStatus?.health,
            serverCount: get().servers.length,
            performanceScore: get().performanceData?.metrics?.performanceScore,
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '알 수 없는 오류';
        console.error('❌ 통합 실시간 데이터 업데이트 실패:', errorMessage);

        // 재시도 로직
        const currentRetryCount = state.retryCount + 1;
        set({
          error: errorMessage,
          retryCount: currentRetryCount,
        });

        // 최대 재시도 횟수를 초과하지 않으면 재시도
        if (currentRetryCount < MAX_RETRY_COUNT) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, currentRetryCount - 1);
          console.log(
            `🔄 ${delay}ms 후 재시도 (${currentRetryCount}/${MAX_RETRY_COUNT})`
          );

          setTimeout(() => {
            if (get().isPolling) {
              get().fetchAllData();
            }
          }, delay);
        } else {
          console.error('⛔ 최대 재시도 횟수 초과 - 폴링 중단');
          get().stopPolling();
        }
      }
    },

    // 🎮 폴링 시작
    startPolling: () => {
      const state = get();

      if (state.isPolling) {
        console.log('⚠️ 이미 폴링이 실행 중입니다.');
        return;
      }

      console.log(
        `🚀 통합 실시간 폴링 시작 (${UNIFIED_POLLING_INTERVAL / 1000}초 간격)`
      );

      set({ isPolling: true, retryCount: 0 });

      // 즉시 첫 업데이트
      get().fetchAllData();

      // 정기 폴링 시작
      pollingInterval = setInterval(() => {
        // 페이지 가시성 확인
        if (document.visibilityState === 'visible') {
          get().fetchAllData();
        } else {
          console.log('📱 페이지 숨김 상태 - 폴링 건너뜀');
        }
      }, UNIFIED_POLLING_INTERVAL);

      // 페이지 가시성 이벤트 처리
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && get().isPolling) {
          console.log('👁️ 페이지 활성화 - 즉시 업데이트');
          get().fetchAllData();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
    },

    // ⏹️ 폴링 중단
    stopPolling: () => {
      console.log('⏹️ 통합 실시간 폴링 중단');

      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }

      set({ isPolling: false });

      document.removeEventListener('visibilitychange', () => {});
    },

    // 📝 개별 상태 업데이트 (외부 컴포넌트용)
    updateSystemStatus: (status: SystemStatus) => {
      set({ systemStatus: status, lastUpdate: new Date() });
    },

    updatePerformanceData: (data: PerformanceData) => {
      set({ performanceData: data, lastUpdate: new Date() });
    },

    updateServers: (servers: ServerInstance[]) => {
      set({ servers: servers.slice(0, 20), lastUpdate: new Date() });
    },

    clearError: () => {
      set({ error: null, retryCount: 0 });
    },
  }))
);

// 🎯 편의 훅들
export const useSystemStatus = () => {
  const systemStatus = useGlobalRealtimeStore(state => state.systemStatus);
  const lastUpdate = useGlobalRealtimeStore(state => state.lastUpdate);
  const error = useGlobalRealtimeStore(state => state.error);

  return { systemStatus, lastUpdate, error };
};

export const usePerformanceData = () => {
  const performanceData = useGlobalRealtimeStore(
    state => state.performanceData
  );
  const lastUpdate = useGlobalRealtimeStore(state => state.lastUpdate);
  const error = useGlobalRealtimeStore(state => state.error);

  return { performanceData, lastUpdate, error };
};

export const useServerList = () => {
  const servers = useGlobalRealtimeStore(state => state.servers);
  const lastUpdate = useGlobalRealtimeStore(state => state.lastUpdate);
  const error = useGlobalRealtimeStore(state => state.error);

  return { servers, lastUpdate, error };
};

export const useRealtimeControl = () => {
  const isPolling = useGlobalRealtimeStore(state => state.isPolling);
  const startPolling = useGlobalRealtimeStore(state => state.startPolling);
  const stopPolling = useGlobalRealtimeStore(state => state.stopPolling);
  const clearError = useGlobalRealtimeStore(state => state.clearError);

  return { isPolling, startPolling, stopPolling, clearError };
};

// 🎬 자동 초기화 (앱 시작시)
if (typeof window !== 'undefined') {
  // 페이지 언로드시 정리
  window.addEventListener('beforeunload', () => {
    useGlobalRealtimeStore.getState().stopPolling();
  });
}
