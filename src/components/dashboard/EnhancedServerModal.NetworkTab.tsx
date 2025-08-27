import { type FC } from 'react';
/**
 * 🌐 Enhanced Server Modal Network Tab
 *
 * Network monitoring tab with comprehensive network analysis:
 * - Real-time network status with animated indicators
 * - Live traffic monitoring (inbound/outbound)
 * - Network latency visualization
 * - SVG-based traffic flow charts with gradients
 * - Server connection details and specifications
 */

'use client';

// React import C81cAc70 - Next.js 15 C790B3d9 JSX Transform C0acC6a9
import dynamic from 'next/dynamic';
import {
  ServerData,
  RealtimeData,
  NetworkStatus,
  NetworkData,
} from './EnhancedServerModal.types';
import { RealtimeChart } from './EnhancedServerModal.components';

// framer-motion을 동적 import로 처리
// framer-motion 제거됨

/**
 * Network Tab Props
 */
interface NetworkTabProps {
  /** 서버 데이터 */
  server: ServerData;
  /** 실시간 데이터 (네트워크 메트릭 포함) */
  realtimeData: RealtimeData;
}

/**
 * 🎨 네트워크 상태별 색상 및 표시 텍스트
 *
 * @param status - 네트워크 상태
 * @returns 상태 정보 객체
 */
const getNetworkStatusInfo = (status?: NetworkStatus) => {
  switch (status) {
    case 'excellent':
      return {
        color: 'bg-green-400 shadow-green-400/50',
        text: '최상',
        textColor: 'text-green-300',
      };
    case 'good':
      return {
        color: 'bg-yellow-400 shadow-yellow-400/50',
        text: '양호',
        textColor: 'text-yellow-300',
      };
    case 'poor':
      return {
        color: 'bg-red-400 shadow-red-400/50',
        text: '부족',
        textColor: 'text-red-300',
      };
    case 'offline':
      return {
        color: 'bg-blue-400 shadow-blue-400/50',
        text: '오프라인',
        textColor: 'text-blue-300',
      };
    default:
      return {
        color: 'bg-gray-400 shadow-gray-400/50',
        text: '알수없음',
        textColor: 'text-gray-300',
      };
  }
};

/**
 * 🌐 Network Tab Component
 *
 * 서버의 네트워크 상태를 실시간으로 모니터링하는 탭
 * - 네트워크 상태, 실시간 트래픽, 지연시간 카드
 * - 트래픽 흐름 SVG 차트 (인바운드/아웃바운드)
 * - 네트워크 연결 정보 및 서버 상세 사양
 */
export const NetworkTab: FC<NetworkTabProps> = ({
  server,
  realtimeData,
}) => {
  const networkStatusInfo = getNetworkStatusInfo(server.networkStatus);
  const latestNetwork = realtimeData.network[
    realtimeData.network.length - 1
  ] || { in: 0, out: 0 };
  const latestLatency =
    realtimeData.latency[realtimeData.latency.length - 1] || 0;

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <div
      >
        <div className="mb-6 flex items-center justify-between">
          <h3 className="bg-gradient-to-r from-emerald-600 to-teal-700 bg-clip-text text-2xl font-bold text-transparent">
            🌐 네트워크 실시간 모니터링
          </h3>
          <div className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-50 to-teal-50 px-3 py-1">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">
              실시간 업데이트
            </span>
          </div>
        </div>
      </div>

      {/* 네트워크 상태 카드들 */}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {/* 네트워크 상태 카드 */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 shadow-xl"
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-bold text-white">네트워크 상태</h4>
              <span className="text-2xl">🌍</span>
            </div>
            <div className="mb-4 flex items-center gap-3">
              <div
                className={`h-4 w-4 rounded-full ${networkStatusInfo.color} shadow-lg`}
              />
              <span className="text-xl font-bold text-white">
                {networkStatusInfo.text}
              </span>
            </div>
            <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
              <div className="mb-1 text-xs text-white/80">네트워크 속도</div>
              <div className="text-2xl font-bold text-white">
                {server.specs?.network_speed || '1 Gbps'}
              </div>
            </div>
          </div>
        </div>

        {/* 실시간 트래픽 카드 */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 shadow-xl"
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-bold text-white">실시간 트래픽</h4>
              <span className="text-2xl">📊</span>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">⬇️ 인바운드</span>
                  <div
                    className="text-xl font-bold text-green-300"
                  >
                    {latestNetwork.in.toFixed(1)} MB/s
                  </div>
                </div>
              </div>
              <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">⬆️ 아웃바운드</span>
                  <div
                    className="text-xl font-bold text-cyan-300"
                  >
                    {latestNetwork.out.toFixed(1)} MB/s
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 지연시간 카드 */}
        <div
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 p-6 shadow-xl"
        >
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
          <div className="relative z-10">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-bold text-white">응답 시간</h4>
              <span className="text-2xl">⚡</span>
            </div>
            <div
              className="mb-2 text-4xl font-bold text-white"
            >
              {latestLatency.toFixed(1)} ms
            </div>
            <div className="rounded-lg bg-white/20 p-3 backdrop-blur-sm">
              <div className="text-sm text-white/80">평균 지연시간</div>
              <div className="mt-1 text-xs text-white/60">
                최적 상태 &lt; 50ms
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 네트워크 트래픽 차트 */}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {/* 트래픽 흐름 차트 */}
        <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 p-6 shadow-lg transition-shadow hover:shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-lg font-bold text-transparent">
              네트워크 트래픽 흐름
            </h4>
            <span className="text-xl">📈</span>
          </div>
          <div className="relative h-40 rounded-xl bg-white p-2">
            <svg
              className="h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                {/* 인바운드 그라데이션 */}
                <linearGradient
                  id="network-in-gradient-modern"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.05" />
                </linearGradient>
                {/* 아웃바운드 그라데이션 */}
                <linearGradient
                  id="network-out-gradient-modern"
                  x1="0%"
                  y1="0%"
                  x2="0%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                </linearGradient>
              </defs>

              {/* 그리드 라인 */}
              {[20, 40, 60, 80].map((y) => (
                <line
                  key={y}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                />
              ))}

              {/* 인바운드 영역 */}
              <path
                d={`M0,100 ${realtimeData.network
                  .map((data: NetworkData, index: number) => {
                    const x =
                      (index / Math.max(realtimeData.network.length - 1, 1)) *
                      100;
                    const y =
                      100 - Math.max(0, Math.min(100, (data.in / 600) * 100));
                    return `L${x},${y}`;
                  })
                  .join(' ')} L100,100 Z`}
                fill="url(#network-in-gradient-modern)"
              />

              {/* 인바운드 라인 */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                points={realtimeData.network
                  .map((data: NetworkData, index: number) => {
                    const x =
                      (index / Math.max(realtimeData.network.length - 1, 1)) *
                      100;
                    const y =
                      100 - Math.max(0, Math.min(100, (data.in / 600) * 100));
                    return `${x},${y}`;
                  })
                  .join(' ')}
                vectorEffect="non-scaling-stroke"
              />

              {/* 아웃바운드 영역 */}
              <path
                d={`M0,100 ${realtimeData.network
                  .map((data: NetworkData, index: number) => {
                    const x =
                      (index / Math.max(realtimeData.network.length - 1, 1)) *
                      100;
                    const y =
                      100 - Math.max(0, Math.min(100, (data.out / 400) * 100));
                    return `L${x},${y}`;
                  })
                  .join(' ')} L100,100 Z`}
                fill="url(#network-out-gradient-modern)"
              />

              {/* 아웃바운드 라인 */}
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                points={realtimeData.network
                  .map((data: NetworkData, index: number) => {
                    const x =
                      (index / Math.max(realtimeData.network.length - 1, 1)) *
                      100;
                    const y =
                      100 - Math.max(0, Math.min(100, (data.out / 400) * 100));
                    return `${x},${y}`;
                  })
                  .join(' ')}
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            {/* 범례 */}
            <div className="absolute right-3 top-3 flex gap-3 rounded-lg bg-white/90 px-2 py-1 backdrop-blur-sm">
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500"></div>
                <span className="text-xs font-medium">인바운드</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
                <span className="text-xs font-medium">아웃바운드</span>
              </div>
            </div>
          </div>
        </div>

        {/* 지연시간 차트 */}
        <RealtimeChart
          data={realtimeData.latency}
          color="#8b5cf6"
          label="네트워크 지연시간 (ms)"
        />
      </div>

      {/* 네트워크 연결 정보 */}
      <div
        className="rounded-2xl bg-gradient-to-br from-slate-50 to-gray-100 p-6 shadow-xl transition-shadow hover:shadow-2xl"
      >
        <div className="mb-6 flex items-center justify-between">
          <h4 className="bg-gradient-to-r from-slate-700 to-gray-900 bg-clip-text text-xl font-bold text-transparent">
            🔗 네트워크 연결 상세 정보
          </h4>
          <div className="rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1">
            <span className="text-xs font-medium text-green-700">연결됨</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 왼쪽 컬럼 */}
          <div className="space-y-4">
            <div
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <span>🌐</span> IP 주소
              </span>
              <span className="font-mono font-bold text-gray-900">
                {server.ip || '192.168.1.100'}
              </span>
            </div>
            <div
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <span>💻</span> 호스트명
              </span>
              <span className="font-medium text-gray-900">
                {server.hostname}
              </span>
            </div>
            <div
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <span>📍</span> 위치
              </span>
              <span className="font-medium text-gray-900">
                {server.location}
              </span>
            </div>
          </div>

          {/* 오른쪽 컬럼 */}
          <div className="space-y-4">
            <div
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <span>☁️</span> 프로바이더
              </span>
              <span className="font-medium text-gray-900">
                {server.provider}
              </span>
            </div>
            <div
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <span>🔧</span> 환경
              </span>
              <span className="font-medium capitalize text-gray-900">
                {server.environment}
              </span>
            </div>
            <div
              className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex items-center gap-2 text-sm text-gray-600">
                <span>🖥️</span> 서버 타입
              </span>
              <span className="font-medium capitalize text-gray-900">
                {server.type || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
