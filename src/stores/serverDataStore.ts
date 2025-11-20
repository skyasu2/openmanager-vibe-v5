/**
 * 🎯 서버 데이터 스토어 - 서버 모니터링 전처리기 연동
 *
 * 새로운 전처리기 기반 단일 데이터 소스 보장:
 * - ServerMonitoringProcessor에서 데이터 가져오기
 * - 서버 모니터링 ↔ AI 에이전트 분리된 전처리기 사용
 * - 중복 API 호출 제거
 * - 캐시 기반 효율적 업데이트
 */

import { createStore } from 'zustand';
import { devtools } from 'zustand/middleware';
import { calculateOptimalUpdateInterval } from '../config/serverConfig';
import type { EnhancedServerMetrics, ServerRole } from '../types/server';
import { getMultipleServerMetrics, type InterpolatedMetric } from '@/data/hourly-server-data';
import { KST } from '@/lib/time';

// 🎯 서버 ID 목록 (hourly JSON 파일에서 가져올 서버들)
const SERVER_IDS = [
  'web-prod-01', 'web-prod-02', 'web-prod-03',
  'api-prod-01', 'api-prod-02',
  'db-prod-01', 'db-prod-02',
  'cache-prod-01', 'cache-prod-02',
  'storage-prod-01',
  'lb-prod-01',
  'backup-prod-01',
  'monitoring-prod-01',
  'security-prod-01',
  'queue-prod-01',
  'app-prod-01',
] as const;

/**
 * InterpolatedMetric을 EnhancedServerMetrics로 변환
 */
function mapInterpolatedToEnhanced(
  serverId: string,
  metric: InterpolatedMetric
): EnhancedServerMetrics {
  // 서버 ID에서 타입 추출 (예: "web-prod-01" → "web")
  const [serverTypeRaw] = serverId.split('-');
  const serverType = serverTypeRaw ?? 'fallback';
  
  // 환경 결정 (prod/staging/dev)
  const environment = serverId.includes('prod') ? 'production' 
    : serverId.includes('staging') ? 'staging' 
    : 'development';
  
  // 역할 매핑 (ServerRole 타입에 맞게)
  const roleMap: Record<string, ServerRole> = {
    'web': 'web',
    'api': 'api',
    'db': 'database',
    'cache': 'cache',
    'storage': 'storage',
    'lb': 'load-balancer',
    'backup': 'backup',
    'monitoring': 'monitoring',
    'security': 'security',
    'queue': 'queue',
    'app': 'app',
  };
  
  const role = roleMap[serverType] || 'fallback';
  
  return {
    // 기본 식별 정보
    id: serverId,
    hostname: serverId,
    name: serverId,
    environment: environment,
    role: role,
    status: metric.status,
    
    // 메트릭 데이터 (중복 매핑으로 호환성 보장)
    cpu: metric.cpu,
    cpu_usage: metric.cpu,
    memory: metric.memory,
    memory_usage: metric.memory,
    disk: metric.disk,
    disk_usage: metric.disk,
    network: metric.network,
    network_usage: metric.network,
    network_in: metric.network / 2,
    network_out: metric.network / 2,
    
    // 성능 정보
    responseTime: metric.responseTime,
    uptime: metric.uptime,
    
    // 타임스탬프
    timestamp: metric.timestamp,
    last_updated: new Date().toISOString(),
    
    // 기본값
    alerts: [],
    
    // 메타데이터
    metadata: {
      timeInfo: {
        normalized: Date.now(),
        actual: Date.now(),
        cycle24h: 0,
        slot10min: Math.floor(new Date().getMinutes() / 10),
        hour: new Date().getHours(),
        validUntil: Date.now() + 60000, // 1분 후
      },
      isInterpolated: metric.isInterpolated,
    },
  };
}

// 사용하지 않는 인터페이스들 제거

export interface ServerDataState {
  // 데이터 상태
  servers: EnhancedServerMetrics[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // 통합 메트릭 관리자 상태
  unifiedManagerStatus: unknown;
  prometheusHubStatus: unknown;

  // 자동 갱신 관련
  autoRefreshIntervalId: NodeJS.Timeout | null;
  isAutoRefreshEnabled: boolean;

  // 성능 메트릭
  performance: {
    totalRequests: number;
    avgResponseTime: number;
    cacheHitRate: number;
    lastSyncTime: Date | null;
  };

  // 액션들
  fetchServers: () => Promise<void>;
  refreshData: () => Promise<void>;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;

  // 자동 갱신 액션 (30-60초 주기)
  startAutoRefresh: () => void;
  stopAutoRefresh: () => void;

  // 통합 시스템 제어
  startUnifiedSystem: () => Promise<void>;
  stopUnifiedSystem: () => void;
  getSystemStatus: () => unknown;

  // 개별 서버 조회
  getServerById: (id: string) => EnhancedServerMetrics | undefined;
  getServersByStatus: (
    status: 'healthy' | 'warning' | 'critical'
  ) => EnhancedServerMetrics[];
  getServersByEnvironment: (environment: string) => EnhancedServerMetrics[];

  // 추가 액션들
  actions?: {
    updateServer?: (id: string, data: unknown) => void;
    refreshServers?: () => Promise<void>;
  };
}

export type ServerDataStore = ReturnType<typeof createServerDataStore>;

// Export hook for component usage will be handled in StoreProvider

export const createServerDataStore = (
  _initialState: Partial<ServerDataState> = {}
) => {
  return createStore<ServerDataState>()(
    devtools((set, get) => ({
      ...{
        // 초기 상태
        servers: [],
        isLoading: false,
        error: null,
        lastUpdate: null,
        unifiedManagerStatus: null,
        prometheusHubStatus: null,
        autoRefreshIntervalId: null,
        isAutoRefreshEnabled: false,
        performance: {
          totalRequests: 0,
          avgResponseTime: 0,
          cacheHitRate: 0,
          lastSyncTime: null,
        },
      },
      ..._initialState,

      // 서버 데이터 가져오기 (Vercel JSON hourly files 사용)
      fetchServers: async () => {
        console.log('🎯 fetchServers 함수 시작 - Vercel JSON hourly 데이터 로드');
        
        set({ isLoading: true, error: null });

        try {
          console.log('🚀 Vercel JSON hourly 데이터 로드 시작');
          
          // 현재 KST 시간 가져오기
          const kst = KST.getKST();
          const hour = kst.getUTCHours();
          const minute = kst.getUTCMinutes();
          
          console.log(`🕐 현재 시간: ${hour}시 ${minute}분 (KST)`);
          console.log(`📊 로드할 서버 수: ${SERVER_IDS.length}개`);
          
          // 모든 서버의 메트릭을 병렬로 가져오기
          const metricsMap = await getMultipleServerMetrics(
            [...SERVER_IDS], // spread to convert readonly array to mutable array
            hour,
            minute
          );
          
          console.log('📡 hourly JSON 데이터 수신 완료');
          console.log(`✅ 성공적으로 로드된 서버: ${metricsMap.size}개`);
          
          // InterpolatedMetric → EnhancedServerMetrics 변환
          const enhancedServers: EnhancedServerMetrics[] = [];
          
          for (const serverId of SERVER_IDS) {
            const metric = metricsMap.get(serverId);
            
            if (metric) {
              const enhanced = mapInterpolatedToEnhanced(serverId, metric);
              enhancedServers.push(enhanced);
              
              if (enhancedServers.length === 1) {
                // 첫 번째 서버 데이터 샘플 로깅
                console.log('🔍 첫 번째 서버 데이터 샘플:', {
                  id: enhanced.id,
                  status: enhanced.status,
                  cpu: enhanced.cpu,
                  memory: enhanced.memory,
                  isInterpolated: enhanced.metadata?.isInterpolated,
                });
              }
            } else {
              console.warn(`⚠️ 서버 "${serverId}" 데이터를 찾을 수 없습니다.`);
            }
          }
          
          if (enhancedServers.length > 0) {
            console.log(
              '✅ Vercel JSON 데이터 변환 성공:',
              enhancedServers.length,
              '개 서버'
            );
            
            set({
              servers: enhancedServers,
              isLoading: false,
              lastUpdate: new Date(),
              error: null,
            });

            console.log('✅ 서버 데이터 Zustand 스토어 업데이트 완료');
          } else {
            throw new Error('로드된 서버 데이터가 없습니다.');
          }
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          console.error('❌ 서버 데이터 로드 최종 실패:');
          console.error('  - 오류 메시지:', error.message);
          console.error('  - 오류 스택:', error.stack);
          console.error('  - 오류 타입:', error.constructor.name);
          
          set({ 
            isLoading: false, 
            error: error.message,
            servers: []
          });
        }
      },

      // 데이터 새로고침
      refreshData: async () => {
        console.log('🔄 데이터 새로고침 중...');
        await get().fetchServers();
      },

      // 실시간 업데이트 시작 (구현 필요)
      startRealTimeUpdates: () => {
        console.log('🔴 실시간 업데이트 시작 (미구현)');
        // 여기에 WebSocket 또는 SSE 로직 추가
      },

      stopRealTimeUpdates: () => {
        console.log('⚫ 실시간 업데이트 중지 (미구현)');
      },

      // 통합 시스템 제어
      startUnifiedSystem: async () => {
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
          const response = await fetch(`${appUrl}/api/system/start`, {
            method: 'POST',
          });
          if (!response.ok) throw new Error('통합 시스템 시작에 실패했습니다.');
          await get().refreshData();
        } catch (e) {
          const error = e instanceof Error ? e : new Error(String(e));
          console.error(error.message);
        }
      },

      stopUnifiedSystem: () => {
        void (async () => {
          try {
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
            const response = await fetch(`${appUrl}/api/system/stop`, {
              method: 'POST',
            });
            if (!response.ok) throw new Error('통합 시스템 중지에 실패했습니다.');
            // 자동 갱신도 함께 중지
            get().stopAutoRefresh();
            set({ servers: [] });
          } catch (e) {
            const error = e instanceof Error ? e : new Error(String(e));
            console.error(error.message);
          }
        })();
      },

      // 자동 갱신 시작 (30-60초 주기)
      startAutoRefresh: () => {
        const state = get();

        // 이미 자동 갱신 중이면 중복 실행 방지
        if (state.isAutoRefreshEnabled && state.autoRefreshIntervalId) {
          console.log('⚠️ 자동 갱신이 이미 실행 중입니다.');
          return;
        }

        // 동적 갱신 주기 계산 (30-35초)
        const refreshInterval = calculateOptimalUpdateInterval();
        console.log(
          `🔄 서버 자동 갱신 시작 (${refreshInterval / 1000}초 주기)`
        );

        // 즉시 한 번 실행 - Vercel Edge Runtime 호환성 확보
        const currentState = get();
        void currentState.fetchServers();

        // 주기적 갱신 설정 - Vercel Edge Runtime 호환성 확보
        const intervalId = setInterval(() => {
          void (async () => {
            console.log('🔄 서버 데이터 자동 갱신 중...');
            const currentState = get();
            await currentState.fetchServers();
          })();
        }, refreshInterval);

        set({
          autoRefreshIntervalId: intervalId,
          isAutoRefreshEnabled: true,
        });
      },

      // 자동 갱신 중지
      stopAutoRefresh: () => {
        const state = get();

        if (state.autoRefreshIntervalId) {
          clearInterval(state.autoRefreshIntervalId);
          console.log('⏹️ 서버 자동 갱신 중지됨');

          set({
            autoRefreshIntervalId: null,
            isAutoRefreshEnabled: false,
          });
        }
      },

      getSystemStatus: () => {
        const { servers, isLoading, error, lastUpdate } = get();
        return {
          totalServers: servers.length,
          healthyServers: servers.filter((s) => s.status === 'online').length, // 🔧 수정: 'healthy' → 'online' (타입 통합)
          warningServers: servers.filter((s) => s.status === 'warning').length,
          criticalServers: servers.filter((s) => s.status === 'critical')
            .length,
          isLoading,
          error,
          lastUpdate,
        };
      },

      // 개별 서버 조회 및 필터링
      getServerById: (id: string) => {
        return get().servers.find((s) => s.id === id);
      },

      getServersByStatus: (status: 'healthy' | 'warning' | 'critical') => {
        return get().servers.filter((s) => s.status === status);
      },

      getServersByEnvironment: (environment: string) => {
        return get().servers.filter((s) => s.environment === environment);
      },
    }))
  );
};
