/**
 * 🎛️ Infrastructure Overview Page
 *
 * AI 에이전트 사이드바의 인프라 전체 현황 페이지
 * - 전체 서버 통계
 * - CPU, RAM, Disk, Bandwidth 현황
 * - 실시간 상태 업데이트 (10초 간격)
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Activity,
  Cpu,
  HardDrive,
  MemoryStick,
  RefreshCw,
  Server,
  Wifi,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatPercentage } from '@/lib/utils';
import debug from '@/utils/debug';

interface InfrastructureStats {
  totalServers: number;
  onlineServers: number;
  offlineServers: number;
  alertCount: number;
  totalCpu: number;
  totalRam: number;
  totalDisk: number;
  bandwidth: number;
}

interface DashboardServerData {
  id?: string;
  name?: string;
  cpu?: number | { usage?: number };
  memory?: number | { usage?: number };
  disk?: number | { usage?: number };
  network?: {
    rx?: number;
    tx?: number;
    in?: number;
    out?: number;
  };
  status?: string;
  [key: string]: unknown;
}

interface InfrastructureOverviewPageProps {
  className?: string;
  servers?: unknown[];
  statsData?: {
    totalServers?: number;
    onlineServers?: number;
    warningServers?: number;
    criticalServers?: number;
    avgCpu?: number;
    avgMemory?: number;
    avgDisk?: number;
  };
}

export default function InfrastructureOverviewPage({
  className = '',
  servers: propServers,
  statsData: propStatsData,
}: InfrastructureOverviewPageProps) {
  console.log('🎯 [InfrastructureOverviewPage] 컴포넌트 렌더링 시작');

  const [stats, setStats] = useState<InfrastructureStats>({
    totalServers: 0,
    onlineServers: 0,
    offlineServers: 0,
    alertCount: 0,
    totalCpu: 0,
    totalRam: 0,
    totalDisk: 0,
    bandwidth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // 서버 데이터 가져오기 - 대시보드 API와 동일한 소스 사용
  const fetchServerData = useCallback(async () => {
    console.log('🚀 [InfrastructureOverviewPage] fetchServerData 함수 시작됨');
    try {
      const response = await fetch('/api/dashboard');
      if (!response.ok) throw new Error('Failed to fetch dashboard data');

      /*
       * ✅ 대시보드 API 응답 구조 처리
       *   - { data: { data: { servers: {}, stats: {} } } } 형태 (중첩 구조)
       *   - servers는 객체이므로 Object.values()로 배열 변환
       */
      const response_data = await response.json();
      console.log(
        '🔍 [InfrastructureOverviewPage] 전체 API 응답:',
        response_data
      );

      const actualData = response_data?.data?.data || {};
      const serversObject = actualData.servers || {};
      const stats = actualData.stats || {};

      console.log('🔍 [InfrastructureOverviewPage] 파싱된 데이터:', {
        actualData,
        serversObject: Object.keys(serversObject),
        stats,
      });

      // 서버 객체를 배열로 변환
      const servers = Object.values(serversObject);

      debug.log('🔍 인프라 현황 - 대시보드 데이터:', {
        serversCount: servers.length,
        stats,
        firstServer: servers[0],
        timestamp: new Date().toISOString(),
      });

      // 🎯 대시보드 API의 stats 데이터를 직접 사용 (올바른 필드명)
      const totalServers = stats.totalServers || servers.length;
      const onlineServers = stats.onlineServers || 0;
      const warningServers = stats.warningServers || 0;
      const offlineServers = stats.criticalServers || 0;
      const alertCount = warningServers + offlineServers;

      debug.log('📊 서버 상태 분포 (대시보드 API):', {
        totalServers,
        onlineServers,
        warningServers,
        offlineServers,
        alertCount,
      });

      // 🎯 리소스 사용률 계산 - 서버 메트릭 기반
      let totalCpu = 0;
      let totalRam = 0;
      let totalDisk = 0;
      let bandwidth = 0;

      if (servers.length > 0) {
        // 대시보드 API 서버 데이터 구조에 맞게 계산
        totalCpu =
          servers.reduce((sum: number, s: unknown) => {
            if (typeof s === 'object' && s !== null) {
              const server = s as DashboardServerData;
              // CPU 값은 cpu.usage 또는 직접 cpu 필드에서 가져옴
              const cpuValue =
                typeof server.cpu === 'object' && server.cpu
                  ? ((server.cpu as { usage?: number }).usage ?? 0)
                  : ((server.cpu as number) ?? 0);
              return sum + (typeof cpuValue === 'number' ? cpuValue : 0);
            }
            return sum;
          }, 0) / servers.length;

        totalRam =
          servers.reduce((sum: number, s: unknown) => {
            if (typeof s === 'object' && s !== null) {
              const server = s as DashboardServerData;
              // Memory 값은 memory.usage 또는 직접 memory 필드에서 가져옴
              const memoryValue =
                typeof server.memory === 'object' && server.memory
                  ? ((server.memory as { usage?: number }).usage ?? 0)
                  : ((server.memory as number) ?? 0);
              return sum + (typeof memoryValue === 'number' ? memoryValue : 0);
            }
            return sum;
          }, 0) / servers.length;

        totalDisk =
          servers.reduce((sum: number, s: unknown) => {
            if (typeof s === 'object' && s !== null) {
              const server = s as DashboardServerData;
              // Disk 값은 disk.usage 또는 직접 disk 필드에서 가져옴
              const diskValue =
                typeof server.disk === 'object' && server.disk
                  ? ((server.disk as { usage?: number }).usage ?? 0)
                  : ((server.disk as number) ?? 0);
              return sum + (typeof diskValue === 'number' ? diskValue : 0);
            }
            return sum;
          }, 0) / servers.length;

        // 네트워크는 총합으로 계산 (대역폭)
        bandwidth = servers.reduce((sum: number, s: unknown) => {
          if (typeof s === 'object' && s !== null) {
            const server = s as DashboardServerData;
            // Network 값은 network.rx/tx 또는 직접 network 필드에서 가져옴
            const networkRx = server.network?.rx || 0;
            const networkTx = server.network?.tx || 0;
            return sum + networkRx + networkTx;
          }
          return sum;
        }, 0);
      }

      // stats에서 평균 값들도 사용 가능한 경우 활용
      if (stats.avgCpu !== undefined) totalCpu = stats.avgCpu;
      if (stats.avgMemory !== undefined) totalRam = stats.avgMemory;
      if (stats.avgDisk !== undefined) totalDisk = stats.avgDisk;

      // 🛡️ NaN 방지 및 안전한 값 설정
      const safeStats = {
        totalServers,
        onlineServers,
        offlineServers,
        alertCount,
        totalCpu: Number.isNaN(totalCpu) ? 0 : Math.round(totalCpu),
        totalRam: Number.isNaN(totalRam) ? 0 : Math.round(totalRam),
        totalDisk: Number.isNaN(totalDisk) ? 0 : Math.round(totalDisk),
        bandwidth: Number.isNaN(bandwidth) ? 0 : Math.round(bandwidth),
      };

      debug.log('✅ 최종 통계:', safeStats);

      setStats(safeStats);
      setLastUpdate(new Date());
      setIsLoading(false);
    } catch (error) {
      debug.error('❌ 서버 데이터 가져오기 실패:', error);
      setIsLoading(false);

      // 🛡️ 에러 시 기본값 설정
      setStats({
        totalServers: 0,
        onlineServers: 0,
        offlineServers: 0,
        alertCount: 0,
        totalCpu: 0,
        totalRam: 0,
        totalDisk: 0,
        bandwidth: 0,
      });
    }
  }, []);

  // Props 데이터 우선 사용, 없을 경우에만 API 호출
  useEffect(() => {
    console.log('🔥 [InfrastructureOverviewPage] useEffect 실행됨', {
      hasPropServers: !!propServers,
      hasPropStatsData: !!propStatsData,
      propServers_length: propServers?.length,
    });

    // Props로 데이터가 전달된 경우 API 호출 없이 바로 사용
    if (propServers && propStatsData) {
      console.log('📊 [InfrastructureOverviewPage] Props 데이터 사용:', {
        servers: propServers.length,
        statsData: propStatsData,
      });

      const calculatedStats = {
        totalServers: propStatsData.totalServers || propServers.length,
        onlineServers: propStatsData.onlineServers || 0,
        offlineServers: propStatsData.criticalServers || 0,
        alertCount:
          (propStatsData.warningServers || 0) +
          (propStatsData.criticalServers || 0),
        totalCpu: propStatsData.avgCpu || 0,
        totalRam: propStatsData.avgMemory || 0,
        totalDisk: propStatsData.avgDisk || 0,
        bandwidth: 0, // 기본값
      };

      console.log(
        '✅ [InfrastructureOverviewPage] Props 기반 통계 계산 완료:',
        calculatedStats
      );
      setStats(calculatedStats);
      setLastUpdate(new Date());
      setIsLoading(false);
      return;
    }

    // Props가 없을 경우에만 API 호출
    console.log('🚀 [InfrastructureOverviewPage] Props 없음, API 호출 시작');
    void fetchServerData();

    // 🎯 데이터 생성기와 동기화: 30초 간격
    const interval = setInterval(() => {
      console.log('🔄 [InfrastructureOverviewPage] 30초 간격 데이터 업데이트');
      void fetchServerData();
    }, 30000);

    return () => {
      console.log('🧹 [InfrastructureOverviewPage] cleanup - interval 제거');
      clearInterval(interval);
    };
  }, [propServers, propStatsData, fetchServerData]); // propServers, propStatsData 객체 의존성 복구

  const getStatusColor = (value: number) => {
    if (value >= 90) return 'text-red-600';
    if (value >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBgColor = (value: number) => {
    if (value >= 90) return 'bg-red-100';
    if (value >= 70) return 'bg-yellow-100';
    return 'bg-green-100';
  };

  if (isLoading) {
    return (
      <div className={`flex h-full items-center justify-center ${className}`}>
        <div className="text-center">
          <RefreshCw className="mx-auto mb-2 h-8 w-8 animate-spin text-blue-500" />
          <p className="text-gray-600">인프라 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto p-3 ${className}`}>
      {/* 헤더 */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Server className="h-5 w-5 text-blue-600" />
            🎛️ 인프라 전체 현황
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            마지막 업데이트: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={() => {
            void fetchServerData();
          }}
          className="flex items-center gap-1 rounded-lg bg-blue-500 px-3 py-1.5 text-sm text-white transition-colors hover:bg-blue-600"
        >
          <RefreshCw className="h-3 w-3" />
          새로고침
        </button>
      </div>

      {/* 메인 통계 카드 */}
      <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          📊 전체 인프라 현황
        </h3>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {/* 총 서버 수 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2 text-center">
            <Server className="mx-auto mb-1 h-5 w-5 text-blue-600" />
            <div className="text-lg font-bold text-blue-600">
              {stats.totalServers}
            </div>
            <div className="text-xs text-blue-500">Total Servers</div>
          </div>

          {/* 온라인 서버 */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-center">
            <Activity className="mx-auto mb-1 h-5 w-5 text-green-600" />
            <div className="text-lg font-bold text-green-600">
              {stats.onlineServers}
            </div>
            <div className="text-xs text-green-500">🟢 Online</div>
          </div>

          {/* 오프라인 서버 */}
          <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-center">
            <Server className="mx-auto mb-1 h-5 w-5 text-red-600" />
            <div className="text-lg font-bold text-red-600">
              {stats.offlineServers}
            </div>
            <div className="text-xs text-red-500">🔴 Offline</div>
          </div>

          {/* 알림 수 */}
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-2 text-center">
            <RefreshCw className="mx-auto mb-1 h-5 w-5 text-yellow-600" />
            <div className="text-lg font-bold text-yellow-600">
              {stats.alertCount}
            </div>
            <div className="text-xs text-yellow-500">⚠️ Alerts</div>
          </div>
        </div>
      </div>

      {/* 리소스 사용률 */}
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-xs">
        <h3 className="mb-2 text-sm font-semibold text-gray-700">
          💻 평균 리소스 사용률
        </h3>

        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2 xl:grid-cols-4">
          {/* CPU 사용률 */}
          <div
            className={`rounded-lg border p-2 ${getStatusBgColor(stats.totalCpu)}`}
          >
            <div className="mb-1 flex items-center justify-between">
              <Cpu className={`h-4 w-4 ${getStatusColor(stats.totalCpu)}`} />
              <span
                className={`text-lg font-bold ${getStatusColor(stats.totalCpu)}`}
              >
                {formatPercentage(stats.totalCpu)}
              </span>
            </div>
            <div className="text-xs text-gray-600">💻 Total CPU</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  stats.totalCpu >= 90
                    ? 'bg-red-500'
                    : stats.totalCpu >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.totalCpu, 100)}%` }}
              />
            </div>
          </div>

          {/* RAM 사용률 */}
          <div
            className={`rounded-lg border p-2 ${getStatusBgColor(stats.totalRam)}`}
          >
            <div className="mb-1 flex items-center justify-between">
              <MemoryStick
                className={`h-4 w-4 ${getStatusColor(stats.totalRam)}`}
              />
              <span
                className={`text-lg font-bold ${getStatusColor(stats.totalRam)}`}
              >
                {formatPercentage(stats.totalRam)}
              </span>
            </div>
            <div className="text-xs text-gray-600">💾 Total RAM</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  stats.totalRam >= 90
                    ? 'bg-red-500'
                    : stats.totalRam >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.totalRam, 100)}%` }}
              />
            </div>
          </div>

          {/* Disk 사용률 */}
          <div
            className={`rounded-lg border p-2 ${getStatusBgColor(stats.totalDisk)}`}
          >
            <div className="mb-1 flex items-center justify-between">
              <HardDrive
                className={`h-4 w-4 ${getStatusColor(stats.totalDisk)}`}
              />
              <span
                className={`text-lg font-bold ${getStatusColor(stats.totalDisk)}`}
              >
                {formatPercentage(stats.totalDisk)}
              </span>
            </div>
            <div className="text-xs text-gray-600">💿 Total Disk</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
              <div
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  stats.totalDisk >= 90
                    ? 'bg-red-500'
                    : stats.totalDisk >= 70
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(stats.totalDisk, 100)}%` }}
              />
            </div>
          </div>

          {/* 네트워크 대역폭 */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-2">
            <div className="mb-1 flex items-center justify-between">
              <Wifi className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">
                {stats.bandwidth}MB
              </span>
            </div>
            <div className="text-xs text-gray-600">🌐 Bandwidth</div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-gray-200">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all duration-500"
                style={{
                  width: `${Math.min((stats.bandwidth / 1000) * 100, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
