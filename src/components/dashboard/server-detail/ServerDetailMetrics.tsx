'use client';

import React from 'react';
import { MetricsHistory } from '../../../types/server';
import { MetricsStats } from '../../../hooks/useServerMetrics';
import CircularGauge from './CircularGauge';

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
  return (
    <div className='space-y-6'>
      {/* 시간 범위 선택 */}
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold text-gray-900'>성능 메트릭</h3>
        <div className='flex bg-gray-100 rounded-lg p-1'>
          {(['1h', '6h', '24h', '7d'] as const).map(range => (
            <button
              key={range}
              onClick={() => onTimeRangeChange(range)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* 메트릭 게이지들 */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-6'>
        <CircularGauge
          value={metricsHistory[metricsHistory.length - 1]?.cpu || 0}
          label='CPU'
          color='#ef4444'
          size={150}
        />
        <CircularGauge
          value={metricsHistory[metricsHistory.length - 1]?.memory || 0}
          label='메모리'
          color='#3b82f6'
          size={150}
        />
        <CircularGauge
          value={metricsHistory[metricsHistory.length - 1]?.disk || 0}
          label='디스크'
          color='#8b5cf6'
          size={150}
        />
        <CircularGauge
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
          label='네트워크'
          color='#22c55e'
          size={150}
        />
      </div>

      {/* 통계 정보 */}
      {metricsStats && (
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
          <div className='bg-red-50 rounded-lg p-4 border border-red-200'>
            <div className='text-red-600 text-sm font-medium'>CPU 사용률</div>
            <div className='text-2xl font-bold text-red-700'>
              {metricsStats.cpuAvg}%
            </div>
            <div className='text-xs text-red-600'>
              평균 / 최대: {metricsStats.cpuMax}%
            </div>
          </div>
          <div className='bg-blue-50 rounded-lg p-4 border border-blue-200'>
            <div className='text-blue-600 text-sm font-medium'>
              메모리 사용률
            </div>
            <div className='text-2xl font-bold text-blue-700'>
              {metricsStats.memoryAvg}%
            </div>
            <div className='text-xs text-blue-600'>
              평균 / 최대: {metricsStats.memoryMax}%
            </div>
          </div>
          <div className='bg-purple-50 rounded-lg p-4 border border-purple-200'>
            <div className='text-purple-600 text-sm font-medium'>
              디스크 사용률
            </div>
            <div className='text-2xl font-bold text-purple-700'>
              {metricsStats.diskAvg}%
            </div>
            <div className='text-xs text-purple-600'>
              평균 / 최대: {metricsStats.diskMax}%
            </div>
          </div>
          <div className='bg-green-50 rounded-lg p-4 border border-green-200'>
            <div className='text-green-600 text-sm font-medium'>응답 시간</div>
            <div className='text-2xl font-bold text-green-700'>
              {metricsStats.responseTimeAvg}ms
            </div>
            <div className='text-xs text-green-600'>
              평균 / 최대: {metricsStats.responseTimeMax}ms
            </div>
          </div>
        </div>
      )}

      {/* 차트 */}
      <div className='bg-white rounded-xl p-6 border border-gray-200'>
        <h4 className='text-lg font-semibold text-gray-900 mb-4'>
          시간별 추이
        </h4>

        {isLoadingHistory ? (
          <div className='flex items-center justify-center h-64'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
          </div>
        ) : (
          <div className='relative'>
            {/* 범례 */}
            <div className='flex flex-wrap gap-4 mb-4 text-sm'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-red-500 rounded-full'></div>
                <span>CPU</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-blue-500 rounded-full'></div>
                <span>메모리</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-purple-500 rounded-full'></div>
                <span>디스크</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-green-500 rounded-full'></div>
                <span>네트워크</span>
              </div>
            </div>

            {/* Y축 라벨 */}
            <div className='absolute left-0 top-0 bottom-8 flex flex-col justify-between text-xs text-gray-500 w-8'>
              <span>100%</span>
              <span>75%</span>
              <span>50%</span>
              <span>25%</span>
              <span>0%</span>
            </div>

            {/* 차트 영역 */}
            <div className='ml-8 relative'>
              {metricsHistory.length > 0 && (
                <svg width='100%' height='160' className='overflow-visible'>
                  {/* 그리드 라인 */}
                  {[0, 25, 50, 75, 100].map(percent => (
                    <line
                      key={percent}
                      x1='0'
                      y1={140 - (percent / 100) * 140}
                      x2='100%'
                      y2={140 - (percent / 100) * 140}
                      stroke='#f3f4f6'
                      strokeWidth='1'
                    />
                  ))}

                  {/* CPU 영역 */}
                  <polygon
                    fill='rgba(239, 68, 68, 0.1)'
                    stroke='none'
                    points={`0,140 ${generateChartPoints(metricsHistory.map(m => m.cpu))} ${metricsHistory.length > 0 ? (metricsHistory.length - 1) * (100 / (metricsHistory.length - 1)) : 0},140`}
                  />
                  {/* CPU 라인 */}
                  <polyline
                    fill='none'
                    stroke='#ef4444'
                    strokeWidth='2'
                    points={generateChartPoints(metricsHistory.map(m => m.cpu))}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(239, 68, 68, 0.3))',
                    }}
                  />

                  {/* 메모리 영역 */}
                  <polygon
                    fill='rgba(59, 130, 246, 0.1)'
                    stroke='none'
                    points={`0,140 ${generateChartPoints(metricsHistory.map(m => m.memory))} ${metricsHistory.length > 0 ? (metricsHistory.length - 1) * (100 / (metricsHistory.length - 1)) : 0},140`}
                  />
                  {/* 메모리 라인 */}
                  <polyline
                    fill='none'
                    stroke='#3b82f6'
                    strokeWidth='2'
                    points={generateChartPoints(
                      metricsHistory.map(m => m.memory)
                    )}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(59, 130, 246, 0.3))',
                    }}
                  />

                  {/* 디스크 영역 */}
                  <polygon
                    fill='rgba(139, 92, 246, 0.1)'
                    stroke='none'
                    points={`0,140 ${generateChartPoints(metricsHistory.map(m => m.disk))} ${metricsHistory.length > 0 ? (metricsHistory.length - 1) * (100 / (metricsHistory.length - 1)) : 0},140`}
                  />
                  {/* 디스크 라인 */}
                  <polyline
                    fill='none'
                    stroke='#8b5cf6'
                    strokeWidth='2'
                    points={generateChartPoints(
                      metricsHistory.map(m => m.disk)
                    )}
                    style={{
                      filter: 'drop-shadow(0 2px 4px rgba(139, 92, 246, 0.3))',
                    }}
                  />

                  {/* 네트워크 영역 */}
                  <polygon
                    fill='rgba(34, 197, 94, 0.1)'
                    stroke='none'
                    points={`0,140 ${generateChartPoints(
                      metricsHistory.map(m => {
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
                    fill='none'
                    stroke='#22c55e'
                    strokeWidth='2'
                    points={generateChartPoints(
                      metricsHistory.map(m => {
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
                  {metricsHistory.slice(-1).map((metric, index) => {
                    const x = 300;
                    const cpuY = 140 - (metric.cpu / 100) * 140;
                    const memoryY = 140 - (metric.memory / 100) * 140;
                    const diskY = 140 - (metric.disk / 100) * 140;
                    const network = metric.network;
                    let networkValue = 0;
                    if (typeof network === 'number') {
                      networkValue = network;
                    } else if (network && typeof network === 'object') {
                      networkValue = Math.min(
                        ((network.bytesReceived || 0) / 1000000) * 2,
                        100
                      );
                    }
                    const networkY = 140 - (networkValue / 100) * 140;

                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={cpuY}
                          r='4'
                          fill='#ef4444'
                          stroke='white'
                          strokeWidth='2'
                        />
                        <circle
                          cx={x}
                          cy={memoryY}
                          r='4'
                          fill='#3b82f6'
                          stroke='white'
                          strokeWidth='2'
                        />
                        <circle
                          cx={x}
                          cy={diskY}
                          r='4'
                          fill='#8b5cf6'
                          stroke='white'
                          strokeWidth='2'
                        />
                        <circle
                          cx={x}
                          cy={networkY}
                          r='4'
                          fill='#22c55e'
                          stroke='white'
                          strokeWidth='2'
                        />
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>

            {/* X축 라벨 */}
            <div className='absolute bottom-0 left-8 right-0 flex justify-between text-xs text-gray-500 px-4 pb-2'>
              <span>
                {timeRange === '1h'
                  ? '1시간 전'
                  : timeRange === '6h'
                    ? '6시간 전'
                    : timeRange === '24h'
                      ? '24시간 전'
                      : '7일 전'}
              </span>
              <span>현재</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
