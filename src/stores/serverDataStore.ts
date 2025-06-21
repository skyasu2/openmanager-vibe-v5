/**
 * 🎯 서버 데이터 스토어 - 서버 모니터링 전처리기 연동
 *
 * 새로운 전처리기 기반 단일 데이터 소스 보장:
 * - ServerMonitoringProcessor에서 데이터 가져오기
 * - 서버 모니터링 ↔ AI 에이전트 분리된 전처리기 사용
 * - 중복 API 호출 제거
 * - 캐시 기반 효율적 업데이트
 */

import { transformServerInstanceToServer } from '@/adapters/server-data-adapter';
import { ServerMonitoringProcessor } from '@/services/data-generator/ServerMonitoringProcessor';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { EnhancedServerMetrics } from '../types/server';

// 🔄 중복 제거: common.ts의 타입들 사용
import type { ServerStatus } from '../types/common';

// ✅ 클라이언트 전용 타입 정의 (UI 표시용)
interface ClientServerMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
}

interface ClientServer {
  id: string;
  name: string;
  status: ServerStatus;
  location: string;
  type: string;
  metrics: ClientServerMetrics;
  // 🩺 건강 점수 및 추세 (선택)
  health: {
    score: number;
    trend: number[];
  };
  // 🚨 알림 요약 (선택)
  alertsSummary: {
    total: number;
    critical: number;
    warning: number;
  };
  uptime: number;
  lastUpdate: Date;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface SystemStatus {
  totalServers: number;
  healthyServers: number;
  warningServers: number;
  criticalServers: number;
  activeAlerts: number;
  lastUpdate: Date;
}

interface ServerDataState {
  // 데이터 상태
  servers: EnhancedServerMetrics[];
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;

  // 통합 메트릭 관리자 상태
  unifiedManagerStatus: any;
  prometheusHubStatus: any;

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

  // 통합 시스템 제어
  startUnifiedSystem: () => Promise<void>;
  stopUnifiedSystem: () => void;
  getSystemStatus: () => any;

  // 개별 서버 조회
  getServerById: (id: string) => EnhancedServerMetrics | undefined;
  getServersByStatus: (
    status: 'healthy' | 'warning' | 'critical'
  ) => EnhancedServerMetrics[];
  getServersByEnvironment: (environment: string) => EnhancedServerMetrics[];
}

// ✅ 안전한 초기 서버 데이터 생성 (hydration 에러 방지)
const getInitialServers = (): ClientServer[] => {
  return [
    {
      id: 'server-1',
      name: 'Web Server 01',
      status: 'healthy',
      location: 'Seoul',
      type: 'web',
      metrics: { cpu: 45, memory: 60, disk: 30, network: 80 },
      uptime: 99.9,
      lastUpdate: new Date(),
      health: { score: 85, trend: Array(30).fill(85) },
      alertsSummary: { total: 0, critical: 0, warning: 0 },
    },
  ];
};

// ✅ 서버 모니터링 전처리기 기반 데이터 가져오기
const fetchServersFromProcessor = async (): Promise<
  EnhancedServerMetrics[]
> => {
  try {
    // 🔄 새로운 전처리기 활용
    const processor = ServerMonitoringProcessor.getInstance();
    const processedData = await processor.getProcessedServerData({
      includeHistorical: true,
      forceRefresh: true,
    });

    // 📊 통계 정보 글로벌 저장 (디버깅용)
    if (processedData.stats && typeof window !== 'undefined') {
      (window as any).__serverStats = processedData.stats;
      console.log('📊 글로벌 서버 통계 업데이트:', processedData.stats);
    }

    // 🎯 Server[] → EnhancedServerMetrics[] 변환
    const servers = processedData.servers;
    return servers.map((serverInfo: any): EnhancedServerMetrics => {
      try {
        // RawServerData 형태로 변환하여 전처리기에 전달
        const rawServerData = {
          id: serverInfo.id,
          name: serverInfo.name || serverInfo.hostname,
          hostname: serverInfo.hostname || serverInfo.name,
          status: serverInfo.status,
          location: serverInfo.location,
          region: serverInfo.region,
          environment: serverInfo.environment,
          role: serverInfo.role,
          type: serverInfo.type,
          provider: serverInfo.provider,
          cpu: serverInfo.cpu,
          memory: serverInfo.memory,
          disk: serverInfo.disk,
          network: serverInfo.network,
          uptime: serverInfo.uptime,
          lastUpdate: serverInfo.lastUpdate,
          alerts: serverInfo.alerts,
          services: serverInfo.services,
          networkStatus: serverInfo.networkStatus,
          metrics: {
            cpu: serverInfo.cpu_usage || serverInfo.cpu || 0,
            memory: serverInfo.memory_usage || serverInfo.memory || 0,
            disk: serverInfo.disk_usage || serverInfo.disk || 0,
            network: {
              in: serverInfo.network_in || 0,
              out: serverInfo.network_out || 0,
            },
            uptime: serverInfo.uptime || 0,
          },
        };

        // 데이터 전처리기를 통한 변환 (타입 안전성 보장)
        const transformedServer = transformServerInstanceToServer(
          rawServerData as any
        );

        // EnhancedServerMetrics 형태로 최종 변환
        return {
          id: transformedServer.id,
          name: transformedServer.name,
          hostname: transformedServer.hostname || transformedServer.name,
          environment: transformedServer.environment as any,
          role: (serverInfo.role || 'worker') as any,
          status: transformedServer.status as any,
          cpu_usage: transformedServer.cpu,
          memory_usage: transformedServer.memory,
          disk_usage: transformedServer.disk,
          network_in: serverInfo.network_in || transformedServer.network || 0,
          network_out: serverInfo.network_out || transformedServer.network || 0,
          response_time:
            serverInfo.response_time || Math.floor(Math.random() * 100) + 50,
          uptime: transformedServer.uptime
            ? typeof transformedServer.uptime === 'string'
              ? parseInt(transformedServer.uptime)
              : transformedServer.uptime
            : 0,
          last_updated: transformedServer.lastUpdate.toISOString(),
          alerts: Array.isArray(transformedServer.alerts)
            ? transformedServer.alerts
            : [],
          timestamp: new Date().toISOString(),
        };
      } catch (conversionError) {
        console.error(
          '❌ 서버 데이터 변환 실패:',
          serverInfo?.id,
          conversionError
        );

        // 폴백 데이터 반환
        return {
          id: serverInfo.id || `server-${Date.now()}`,
          name: serverInfo.name || serverInfo.hostname || 'Unknown Server',
          hostname: serverInfo.hostname || serverInfo.name || 'unknown',
          environment: (serverInfo.environment || 'production') as any,
          role: (serverInfo.role || 'worker') as any,
          status: (serverInfo.status || 'stopped') as any,
          cpu_usage: serverInfo.cpu_usage || serverInfo.cpu || 0,
          memory_usage: serverInfo.memory_usage || serverInfo.memory || 0,
          disk_usage: serverInfo.disk_usage || serverInfo.disk || 0,
          network_in: serverInfo.network_in || 0,
          network_out: serverInfo.network_out || 0,
          response_time: serverInfo.response_time || 100,
          uptime: serverInfo.uptime || 0,
          last_updated: new Date(
            serverInfo.last_updated || Date.now()
          ).toISOString(),
          alerts: Array.isArray(serverInfo.alerts) ? serverInfo.alerts : [],
          timestamp: new Date().toISOString(),
        };
      }
    });
  } catch (error) {
    console.error('❌ 전처리기 서버 데이터 가져오기 실패:', error);
    return [];
  }
};

// 폴백 함수 정의
const fetchServersFromAPI = async () => {
  const response = await fetch('/api/servers/all');
  if (!response.ok) {
    throw new Error(`서버 데이터 조회 실패: ${response.status}`);
  }
  return response.json();
};

export const useServerDataStore = create<ServerDataState>()(
  devtools(
    (set, get) => ({
      // 초기 상태
      servers: [],
      isLoading: false,
      error: null,
      lastUpdate: null,
      unifiedManagerStatus: null,
      prometheusHubStatus: null,
      performance: {
        totalRequests: 0,
        avgResponseTime: 0,
        cacheHitRate: 0,
        lastSyncTime: null,
      },

      // 서버 데이터 가져오기 (직접 API 호출로 단순화)
      fetchServers: async () => {
        set({ isLoading: true, error: null });

        try {
          // 🎯 1순위: 실제 서버 데이터 생성기 API 직접 호출
          console.log('🔄 서버 데이터 생성기 API 호출 중...');
          const response = await fetch('/api/servers/all');

          if (!response.ok) {
            throw new Error(`서버 API 호출 실패: ${response.status}`);
          }

          const result = await response.json();

          if (!result.success || !Array.isArray(result.data)) {
            throw new Error('서버 API 응답 형식 오류');
          }

          const servers = result.data;

          console.log(`✅ 서버 데이터 로드 성공: ${servers.length}개 서버`);
          console.log(
            '📊 첫 번째 서버 샘플:',
            servers[0]?.name,
            servers[0]?.cpu,
            servers[0]?.memory
          );

          // EnhancedServerMetrics 형태로 변환
          const enhancedServers: EnhancedServerMetrics[] = servers.map(
            (server: any) => ({
              id: server.id,
              name: server.name,
              hostname: server.hostname || server.name,
              environment: server.environment || 'production',
              role: server.role || 'worker',
              status: server.status,
              cpu_usage: server.cpu || 0,
              memory_usage: server.memory || 0,
              disk_usage: server.disk || 0,
              network_in: server.network || 0,
              network_out: server.network || 0,
              response_time:
                server.response_time || Math.floor(Math.random() * 100) + 50,
              uptime:
                typeof server.uptime === 'string'
                  ? parseInt(server.uptime.replace(/[^\d]/g, '')) || 0
                  : server.uptime || 0,
              location: server.location || 'Unknown',
              provider: server.provider || 'AWS',
              alerts: server.alerts || 0,
              services: server.services || [],
              lastUpdate: server.lastUpdate
                ? new Date(server.lastUpdate)
                : new Date(),
            })
          );

          set({
            servers: enhancedServers,
            lastUpdate: new Date(),
            isLoading: false,
            error: null,
            performance: {
              ...get().performance,
              totalRequests: get().performance.totalRequests + 1,
              lastSyncTime: new Date(),
            },
          });
        } catch (error) {
          console.error('❌ 서버 데이터 로드 실패:', error);

          // 🚨 폴백: 실시간 서버 API 시도
          try {
            console.log('🔄 실시간 서버 API 폴백 시도...');
            const fallbackResponse = await fetch(
              '/api/servers/realtime?type=servers'
            );

            if (fallbackResponse.ok) {
              const fallbackResult = await fallbackResponse.json();
              const fallbackServers = fallbackResult.data || [];

              console.log(`✅ 폴백 API 성공: ${fallbackServers.length}개 서버`);

              const enhancedFallbackServers: EnhancedServerMetrics[] =
                fallbackServers.map((server: any) => ({
                  id: server.id,
                  name: server.name,
                  hostname: server.hostname || server.name,
                  environment: server.environment || 'production',
                  role: server.role || 'worker',
                  status: server.status,
                  cpu_usage: server.cpu || 0,
                  memory_usage: server.memory || 0,
                  disk_usage: server.disk || 0,
                  network_in: server.network || 0,
                  network_out: server.network || 0,
                  response_time:
                    server.response_time ||
                    Math.floor(Math.random() * 100) + 50,
                  uptime:
                    typeof server.uptime === 'string'
                      ? parseInt(server.uptime.replace(/[^\d]/g, '')) || 0
                      : server.uptime || 0,
                  location: server.location || 'Unknown',
                  provider: server.provider || 'AWS',
                  alerts: server.alerts || 0,
                  services: server.services || [],
                  lastUpdate: server.lastUpdate
                    ? new Date(server.lastUpdate)
                    : new Date(),
                }));

              set({
                servers: enhancedFallbackServers,
                lastUpdate: new Date(),
                isLoading: false,
                error: null,
              });
            } else {
              throw new Error('폴백 API도 실패');
            }
          } catch (fallbackError) {
            console.error('❌ 폴백 API도 실패:', fallbackError);
            set({
              error: `모든 서버 API 실패: ${error}`,
              isLoading: false,
              servers: [], // 빈 배열로 설정하여 폴백 서버 사용 방지
            });
          }
        }
      },

      // 데이터 새로고침
      refreshData: async () => {
        await get().fetchServers();
      },

      // 실시간 업데이트 시작
      startRealTimeUpdates: () => {
        // 기존 타이머가 있으면 정리
        const existingInterval = (get() as any)._updateInterval;
        if (existingInterval) {
          clearInterval(existingInterval);
          console.log('🔄 기존 폴링 타이머 정리됨');
        }

        // ✅ 폴링 주기 최적화: 5초 → 35초 (서버 모니터링과 동일)
        const updateInterval = setInterval(() => {
          console.log('🔄 서버 데이터 자동 업데이트 (35초 주기)');
          get().fetchServers();
        }, 35000); // 35초마다 업데이트

        // 정리를 위해 interval ID 저장
        (get() as any)._updateInterval = updateInterval;
        console.log('✅ 실시간 업데이트 시작 (35초 주기)');
      },

      // 실시간 업데이트 중지
      stopRealTimeUpdates: () => {
        const interval = (get() as any)._updateInterval;
        if (interval) {
          clearInterval(interval);
          delete (get() as any)._updateInterval;
        }
      },

      // 통합 시스템 시작
      startUnifiedSystem: async () => {
        try {
          const response = await fetch('/api/system/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (response.ok) {
            const status = await response.json();
            set({ unifiedManagerStatus: status });

            // 시스템 시작 후 데이터 가져오기
            await get().fetchServers();
          }
        } catch (error) {
          console.error('통합 시스템 시작 실패:', error);
          set({ error: `시스템 시작 실패: ${error}` });
        }
      },

      // 통합 시스템 중지
      stopUnifiedSystem: () => {
        get().stopRealTimeUpdates();

        fetch('/api/system/stop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }).catch(error => {
          console.error('시스템 중지 실패:', error);
        });
      },

      // 시스템 상태 조회
      getSystemStatus: () => {
        const { servers, unifiedManagerStatus } = get();

        return {
          totalServers: servers.length,
          healthyServers: servers.filter(s => s.status === 'healthy').length,
          warningServers: servers.filter(s => s.status === 'warning').length,
          criticalServers: servers.filter(
            s =>
              s.status === 'critical' ||
              s.status === 'offline' ||
              s.status === 'maintenance'
          ).length,
          unifiedManagerStatus,
          lastUpdate: get().lastUpdate,
        };
      },

      // 개별 서버 조회
      getServerById: (id: string) => {
        return get().servers.find(server => server.id === id);
      },

      // 상태별 서버 조회
      getServersByStatus: (status: 'healthy' | 'warning' | 'critical') => {
        return get().servers.filter(server => {
          // 상태 매핑 처리
          const serverStatus = server.status;
          switch (status) {
            case 'healthy':
              return serverStatus === 'healthy';
            case 'warning':
              return serverStatus === 'warning';
            case 'critical':
              return (
                serverStatus === 'critical' ||
                serverStatus === 'offline' ||
                serverStatus === 'maintenance'
              );
            default:
              return false;
          }
        });
      },

      // 환경별 서버 조회
      getServersByEnvironment: (environment: string) => {
        return get().servers.filter(
          server =>
            server.environment?.toLowerCase() === environment.toLowerCase()
        );
      },
    }),
    { name: 'server-data-store' }
  )
);
