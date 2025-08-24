/**
 * 📊 Enhanced Server Modal Metrics Tab
 *
 * Real-time metrics monitoring tab:
 * - Real-time performance charts (CPU, Memory, Disk, Network)
 * - Interactive real-time controls
 * - Color-coded status visualization
 * - Responsive grid layout
 */

'use client';

import React from 'react';
import { Pause, Play } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  ServerData,
  RealtimeData,
  ChartData,
} from './EnhancedServerModal.types';
import { getMetricColorByStatus } from './EnhancedServerModal.utils';
import { RealtimeChart } from './EnhancedServerModal.components';

// framer-motion 제거 - CSS 애니메이션 사용

/**
 * Metrics Tab Props
 */
interface MetricsTabProps {
  /** 서버 데이터 */
  server: ServerData;
  /** 실시간 데이터 */
  realtimeData: RealtimeData;
  /** 실시간 모니터링 활성화 여부 */
  isRealtime: boolean;
  /** 실시간 모니터링 토글 함수 */
  onToggleRealtime: () => void;
}

/**
 * 📈 Metrics Tab Component
 *
 * 서버의 실시간 메트릭을 시각화하는 탭
 * - CPU, Memory, Disk, Network 실시간 차트
 * - 실시간 모니터링 제어
 * - 상태별 색상 구분
 */
export const MetricsTab: React.FC<MetricsTabProps> = ({
  server,
  realtimeData,
  isRealtime,
  onToggleRealtime,
}) => {
  // 차트 데이터 구성
  const chartConfigs: ChartData[] = [
    {
      data: realtimeData.cpu,
      color: getMetricColorByStatus(server.cpu, 'cpu', server.status).color,
      label: 'CPU 사용률',
      icon: '🔥',
      gradient: getMetricColorByStatus(server.cpu, 'cpu', server.status)
        .gradient,
    },
    {
      data: realtimeData.memory,
      color: getMetricColorByStatus(server.memory, 'memory', server.status)
        .color,
      label: '메모리 사용률',
      icon: '💾',
      gradient: getMetricColorByStatus(server.memory, 'memory', server.status)
        .gradient,
    },
    {
      data: realtimeData.disk,
      color: getMetricColorByStatus(server.disk, 'disk', server.status).color,
      label: '디스크 사용률',
      icon: '💿',
      gradient: getMetricColorByStatus(server.disk, 'disk', server.status)
        .gradient,
    },
    {
      data: realtimeData.network.map((n) =>
        Math.min(
          100,
          Math.max(0, typeof n === 'number' ? n : (n.in + n.out) / 2)
        )
      ),
      color: getMetricColorByStatus(
        server.network || 0,
        'network',
        server.status
      ).color,
      label: '네트워크 사용률',
      icon: '🌐',
      gradient: getMetricColorByStatus(
        server.network || 0,
        'network',
        server.status
      ).gradient,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        {/* 헤더 섹션 */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-2xl font-bold text-transparent">
            실시간 메트릭 모니터링
          </h3>

          {/* 실시간 제어 버튼 */}
          <button
            onClick={onToggleRealtime}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold shadow-lg transition-all hover:scale-105 active:scale-95 ${
              isRealtime
                ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white hover:from-red-600 hover:to-pink-600'
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
            }`}
          >
            {isRealtime ? (
              <>
                <Pause className="h-4 w-4" />
                일시정지
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                시작하기
              </>
            )}
          </button>
        </div>

        {/* 메트릭 차트 그리드 */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {chartConfigs.map((chart, idx) => (
            <div
              key={idx}
              className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all hover:shadow-2xl hover:-translate-y-1 animate-fade-in"
              style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
            >
              {/* 배경 그라데이션 */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${chart.gradient} opacity-5`}
              />

              <div className="relative">
                {/* 차트 헤더 */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{chart.icon}</span>
                    <h4 className="font-bold text-gray-800">{chart.label}</h4>
                  </div>

                  {/* 현재 값 표시 */}
                  <div
                    className={`bg-gradient-to-r text-2xl font-bold ${chart.gradient} bg-clip-text text-transparent`}
                  >
                    {chart.data[chart.data.length - 1]?.toFixed(1) || '0'}%
                  </div>
                </div>

                {/* 실시간 차트 */}
                <RealtimeChart data={chart.data} color={chart.color} label="" />
              </div>

              {/* 상태 표시기 */}
              <div className="absolute right-4 top-4">
                <div className="flex items-center gap-1">
                  <div
                    className="h-2 w-2 animate-pulse rounded-full"
                    style={{ backgroundColor: chart.color }}
                  />
                  <span className="text-xs text-gray-500">실시간</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 메트릭 요약 정보 */}
        <div
          className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4 animate-fade-in"
          style={{ animationDelay: '0.6s' }}
        >
          {chartConfigs.map((chart, idx) => {
            const currentValue = chart.data[chart.data.length - 1] || 0;
            const avgValue =
              chart.data.length > 0
                ? chart.data.reduce((sum, val) => sum + val, 0) /
                  chart.data.length
                : 0;

            return (
              <div
                key={idx}
                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-lg">{chart.icon}</span>
                  <span className="text-xs font-medium text-gray-600">
                    {chart.label.split(' ')[0]}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">현재</span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: chart.color }}
                    >
                      {currentValue.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">평균</span>
                    <span className="text-sm text-gray-700">
                      {avgValue.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
