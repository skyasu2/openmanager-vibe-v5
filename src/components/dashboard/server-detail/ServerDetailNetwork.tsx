'use client';

// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
import type { RealTimeMetrics } from '@/hooks/useRealTimeMetrics';

interface ServerDetailNetworkProps {
  realTimeMetrics: RealTimeMetrics | null;
}

const formatNumber = (num: number) => num.toLocaleString();

export function ServerDetailNetwork({
  realTimeMetrics,
}: ServerDetailNetworkProps) {
  const safeMetrics = realTimeMetrics || {
    activeConnections: 150,
    latency: 25,
    packetIO: { in: 1500, out: 1200 },
    networkThroughput: { in: 50.5, out: 35.2 },
  };

  // 타입 안전성을 위한 헬퍼 함수
  const getActiveConnections = (metrics: unknown) => {
    if (
      typeof metrics === 'object' &&
      metrics !== null &&
      'activeConnections' in metrics
    ) {
      const metricsData = metrics as { activeConnections?: number };
      return metricsData.activeConnections ?? 0;
    }
    return 0;
  };

  const getLatency = (metrics: unknown) => {
    if (
      typeof metrics === 'object' &&
      metrics !== null &&
      'latency' in metrics
    ) {
      const metricsData = metrics as { latency?: number };
      return metricsData.latency ?? 0;
    }
    return 0;
  };

  const getPacketIO = (metrics: unknown) => {
    if (
      typeof metrics === 'object' &&
      metrics !== null &&
      'packetIO' in metrics
    ) {
      const metricsData = metrics as { packetIO?: { in: number; out: number } };
      return metricsData.packetIO ?? { in: 0, out: 0 };
    }
    return { in: 0, out: 0 };
  };

  const getNetworkThroughput = (metrics: unknown) => {
    if (
      typeof metrics === 'object' &&
      metrics !== null &&
      'networkThroughput' in metrics
    ) {
      const metricsData = metrics as {
        networkThroughput?: { in: number; out: number };
      };
      return metricsData.networkThroughput ?? { in: 0, out: 0 };
    }
    return { in: 0, out: 0 };
  };

  const hasData = !!realTimeMetrics;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">
        네트워크 상세 정보
      </h3>

      {/* 네트워크 상세 카드들 */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="transform rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-green-100 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-emerald-600">
              활성 연결
            </div>
            <i className="fas fa-link text-emerald-500"></i>
          </div>
          <div className="mb-1 text-3xl font-bold text-emerald-700">
            {formatNumber(getActiveConnections(safeMetrics))}
          </div>
          {hasData && (
            <div className="flex items-center text-xs text-green-600">
              <span className="animate-pulse mr-2 h-2 w-2 rounded-full bg-green-400"></span>
              활성 연결
            </div>
          )}
        </div>

        <div className="transform rounded-xl border border-blue-200 bg-linear-to-br from-blue-50 to-cyan-100 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-blue-600">지연 시간</div>
            <i className="fas fa-clock text-blue-500"></i>
          </div>
          <div className="mb-1 text-3xl font-bold text-blue-700">
            {(getLatency(safeMetrics) || 0).toFixed(0)}
            <span className="text-lg font-normal">ms</span>
          </div>
          {hasData && (
            <div className="flex items-center text-xs text-blue-600">
              <span className="animate-pulse mr-2 h-2 w-2 rounded-full bg-blue-400"></span>
              평균 응답
            </div>
          )}
        </div>

        <div className="transform rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-violet-100 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-purple-600">패킷 In</div>
            <i className="fas fa-download text-purple-500"></i>
          </div>
          <div className="mb-1 text-3xl font-bold text-purple-700">
            {formatNumber(getPacketIO(safeMetrics).in || 0)}
          </div>
          {hasData && (
            <div className="flex items-center text-xs text-purple-600">
              <span className="animate-pulse mr-2 h-2 w-2 rounded-full bg-purple-400"></span>
              pkt/s
            </div>
          )}
        </div>

        <div className="transform rounded-xl border border-orange-200 bg-linear-to-br from-orange-50 to-amber-100 p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-sm font-medium text-orange-600">패킷 Out</div>
            <i className="fas fa-upload text-orange-500"></i>
          </div>
          <div className="mb-1 text-3xl font-bold text-orange-700">
            {formatNumber(getPacketIO(safeMetrics).out || 0)}
          </div>
          {hasData && (
            <div className="flex items-center text-xs text-orange-600">
              <span className="animate-pulse mr-2 h-2 w-2 rounded-full bg-orange-400"></span>
              pkt/s
            </div>
          )}
        </div>
      </div>

      {/* 네트워크 인터페이스 정보 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h4 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
          <i className="fas fa-ethernet mr-2 text-blue-600"></i>
          네트워크 인터페이스
        </h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  인터페이스
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  IP 주소
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  속도
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  수신/송신
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  eth0
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  192.168.1.100
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    활성
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  1 Gbps
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  ↓ {formatNumber(getNetworkThroughput(safeMetrics).in || 0)}{' '}
                  MB/s / ↑{' '}
                  {formatNumber(getNetworkThroughput(safeMetrics).out || 0)}{' '}
                  MB/s
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  lo
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  127.0.0.1
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                    활성
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  -
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                  ↓ 0.1 MB/s / ↑ 0.1 MB/s
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 포트 사용 현황 */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h4 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
          <i className="fas fa-door-open mr-2 text-green-600"></i>
          열린 포트
        </h4>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            { port: 22, service: 'SSH', protocol: 'TCP', status: 'LISTEN' },
            { port: 80, service: 'HTTP', protocol: 'TCP', status: 'LISTEN' },
            { port: 443, service: 'HTTPS', protocol: 'TCP', status: 'LISTEN' },
            { port: 3306, service: 'MySQL', protocol: 'TCP', status: 'LISTEN' },
            { port: 6379, service: 'Redis', protocol: 'TCP', status: 'LISTEN' },
            {
              port: 5432,
              service: 'PostgreSQL',
              protocol: 'TCP',
              status: 'LISTEN',
            },
          ].map((port, index) => (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-colors hover:border-blue-300"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="text-lg font-bold text-gray-900">
                  :{port.port}
                </div>
                <div className="rounded bg-green-100 px-2 py-1 text-xs text-green-800">
                  {port.status}
                </div>
              </div>
              <div className="text-sm text-gray-600">{port.service}</div>
              <div className="text-xs text-gray-500">{port.protocol}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 네트워크 통계 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h4 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <i className="fas fa-chart-line mr-2 text-blue-600"></i>
            트래픽 통계
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">총 수신</span>
              <span className="font-medium">1.2 TB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">총 송신</span>
              <span className="font-medium">856 GB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">패킷 손실률</span>
              <span className="font-medium text-green-600">0.01%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">평균 대역폭</span>
              <span className="font-medium">67%</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h4 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
            <i className="fas fa-shield-alt mr-2 text-red-600"></i>
            보안 정보
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">방화벽 상태</span>
              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                활성
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">차단된 연결</span>
              <span className="font-medium">23</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">DDoS 보호</span>
              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                활성
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">SSL 인증서</span>
              <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                유효
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
