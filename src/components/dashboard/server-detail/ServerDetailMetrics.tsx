'use client';

import type { MetricsStats } from '../../../hooks/useServerMetrics';
import type { MetricsHistory } from '../../../types/server';
import { ServerModalGauge } from '../../shared/UnifiedCircularGauge';

interface ServerDetailMetricsProps {
  metricsHistory: MetricsHistory[];
  metricsStats: MetricsStats | null;
  isLoadingHistory: boolean;
  timeRange: '1h' | '6h' | '24h' | '7d';
  onTimeRangeChange: (range: '1h' | '6h' | '24h' | '7d') => void;
  generateChartPoints: (data: number[], maxHeight?: number) => string;
}

export function ServerDetailMetrics({
  metricsHistory,
  metricsStats,
  isLoadingHistory,
  timeRange,
  onTimeRangeChange,
  generateChartPoints,
}: ServerDetailMetricsProps) {
  if (isLoadingHistory) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 시간 범위 선택 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">성능 메트릭</h3>
        <select
          value={timeRange}
          onChange={(e) =>
            onTimeRangeChange(e.target.value as '1h' | '6h' | '24h' | '7d')
          }
          className="rounded-lg border border-gray-300 bg-white px-3 py-2"
        >
          <option value="1h">최근 1시간</option>
          <option value="6h">최근 6시간</option>
          <option value="24h">최근 24시간</option>
          <option value="7d">최근 7일</option>
        </select>
      </div>

      {/* 원형 게이지들 - 통합 컴포넌트 사용 */}
      <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
        <ServerModalGauge
          value={metricsHistory[metricsHistory.length - 1]?.cpu || 0}
          label="CPU"
          type="cpu"
          size={150}
        />
        <ServerModalGauge
          value={metricsHistory[metricsHistory.length - 1]?.memory || 0}
          label="메모리"
          type="memory"
          size={150}
        />
        <ServerModalGauge
          value={metricsHistory[metricsHistory.length - 1]?.disk || 0}
          label="디스크"
          type="disk"
          size={150}
        />
        <ServerModalGauge
          value={(() => {
            const lastMetric = metricsHistory[metricsHistory.length - 1];
            if (!lastMetric) return 0;

            const network = lastMetric.network;
            if (typeof network === 'number') {
              return network;
            } else if (network && typeof network === 'object') {
              return Math.min(
                ((network.bytesReceived || 0) / 1000000) * 2,
                100
              );
            }
            return 0;
          })()}
          label="네트워크"
          type="network"
          size={150}
        />
      </div>

      {/* 통계 정보 */}
      {metricsStats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="text-sm font-medium text-red-600">CPU 사용률</div>
            <div className="text-2xl font-bold text-red-700">
              {metricsStats.cpuAvg}%
            </div>
            <div className="text-xs text-red-600">
              평균 / 최대: {metricsStats.cpuMax}%
            </div>
          </div>
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="text-sm font-medium text-blue-600">
              메모리 사용률
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {metricsStats.memoryAvg}%
            </div>
            <div className="text-xs text-blue-600">
              평균 / 최대: {metricsStats.memoryMax}%
            </div>
          </div>
          <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
            <div className="text-sm font-medium text-purple-600">
              디스크 사용률
            </div>
            <div className="text-2xl font-bold text-purple-700">
              {metricsStats.diskAvg}%
            </div>
            <div className="text-xs text-purple-600">
              평균 / 최대: {metricsStats.diskMax}%
            </div>
          </div>
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="text-sm font-medium text-green-600">응답 시간</div>
            <div className="text-2xl font-bold text-green-700">
              {metricsStats.responseTimeAvg}ms
            </div>
            <div className="text-xs text-green-600">
              평균 / 최대: {metricsStats.responseTimeMax}ms
            </div>
          </div>
        </div>
      )}

      {/* 차트 */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="mb-4 text-lg font-semibold text-gray-900">
          시간별 추이 ({timeRange})
        </h4>

        {metricsHistory.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-gray-500">
            데이터가 없습니다
          </div>
        ) : (
          <div className="relative">
            {/* 범례 */}
            <div className="mb-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-red-500"></div>
                <span className="text-sm text-gray-600">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-blue-500"></div>
                <span className="text-sm text-gray-600">메모리</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-purple-500"></div>
                <span className="text-sm text-gray-600">디스크</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-green-500"></div>
                <span className="text-sm text-gray-600">네트워크</span>
              </div>
            </div>

            <div className="relative ml-8">
              {metricsHistory.length > 0 && (
                <svg
                  width="100%"
                  height="160"
                  className="overflow-visible"
                  role="img"
                  aria-label="서버 메트릭 시계열 차트"
                >
                  {/* 그리드 라인 */}
                  {[0, 25, 50, 75, 100].map((percent) => (
                    <line
                      key={percent}
                      x1="0"
                      y1={140 - (percent / 100) * 140}
                      x2="100%"
                      y2={140 - (percent / 100) * 140}
                      stroke="#f3f4f6"
                      strokeWidth="1"
                    />
                  ))}

                  {/* CPU 영역 */}
                  <polygon
                    fill="rgba(239, 68, 68, 0.1)"
                    stroke="none"
                    points={`0,140 ${generateChartPoints(metricsHistory.map((m) => m.cpu))} ${metricsHistory.length > 0 ? (metricsHistory.length - 1) * (100 / (metricsHistory.length - 1)) : 0},140`}
                  />
                  {/* CPU 라인 */}
                  <polyline
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    points={generateChartPoints(
                      metricsHistory.map((m) => m.cpu)
                    )}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))',
                    }}
                  />

                  {/* 메모리 영역 */}
                  <polygon
                    fill="rgba(59, 130, 246, 0.1)"
                    stroke="none"
                    points={`0,140 ${generateChartPoints(metricsHistory.map((m) => m.memory))} ${metricsHistory.length > 0 ? (metricsHistory.length - 1) * (100 / (metricsHistory.length - 1)) : 0},140`}
                  />
                  {/* 메모리 라인 */}
                  <polyline
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    points={generateChartPoints(
                      metricsHistory.map((m) => m.memory)
                    )}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
                    }}
                  />

                  {/* 디스크 영역 */}
                  <polygon
                    fill="rgba(139, 92, 246, 0.1)"
                    stroke="none"
                    points={`0,140 ${generateChartPoints(metricsHistory.map((m) => m.disk))} ${metricsHistory.length > 0 ? (metricsHistory.length - 1) * (100 / (metricsHistory.length - 1)) : 0},140`}
                  />
                  {/* 디스크 라인 */}
                  <polyline
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="2"
                    points={generateChartPoints(
                      metricsHistory.map((m) => m.disk)
                    )}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))',
                    }}
                  />

                  {/* 네트워크 영역 */}
                  <polygon
                    fill="rgba(34, 197, 94, 0.1)"
                    stroke="none"
                    points={`0,140 ${generateChartPoints(
                      metricsHistory.map((m) => {
                        const network = m.network;
                        if (typeof network === 'number') {
                          return network;
                        } else if (network && typeof network === 'object') {
                          return Math.min(
                            ((network.bytesReceived || 0) / 1000000) * 2,
                            100
                          );
                        }
                        return 0;
                      })
                    )} ${metricsHistory.length > 0 ? (metricsHistory.length - 1) * (100 / (metricsHistory.length - 1)) : 0},140`}
                  />
                  {/* 네트워크 라인 */}
                  <polyline
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    points={generateChartPoints(
                      metricsHistory.map((m) => {
                        const network = m.network;
                        if (typeof network === 'number') {
                          return network;
                        } else if (network && typeof network === 'object') {
                          return Math.min(
                            ((network.bytesReceived || 0) / 1000000) * 2,
                            100
                          );
                        }
                        return 0;
                      })
                    )}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(34, 197, 94, 0.3))',
                    }}
                  />

                  {/* 데이터 포인트 표시 */}
                  {metricsHistory.map((_, index) => {
                    const x =
                      (index / Math.max(metricsHistory.length - 1, 1)) * 100;
                    return (
                      <g key={index}>
                        <circle
                          cx={`${x}%`}
                          cy={
                            140 -
                            ((metricsHistory[index]?.cpu ?? 0) / 100) * 140
                          }
                          r="2"
                          fill="#ef4444"
                        />
                        <circle
                          cx={`${x}%`}
                          cy={
                            140 -
                            ((metricsHistory[index]?.memory ?? 0) / 100) * 140
                          }
                          r="2"
                          fill="#3b82f6"
                        />
                        <circle
                          cx={`${x}%`}
                          cy={
                            140 -
                            ((metricsHistory[index]?.disk ?? 0) / 100) * 140
                          }
                          r="2"
                          fill="#8b5cf6"
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Y축 라벨 */}
              <div className="absolute left-0 top-0 -ml-8 flex h-40 flex-col justify-between text-xs text-gray-500">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
