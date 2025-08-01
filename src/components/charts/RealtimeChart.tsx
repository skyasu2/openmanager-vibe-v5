'use client';

/**
 * 📈 Realtime Chart Component v3.0
 *
 * 실시간 서버 메트릭 시각화 및 예측 표시
 * - Chart.js 기반 60fps 차트
 * - WebSocket 실시간 데이터 수신
 * - 예측 라인 오버레이
 * - 인터랙티브 줌/팬
 * - 이상 감지 마커
 */

import React from 'react';

interface RealtimeChartProps {
  serverId: string;
  metricType: 'cpu' | 'memory' | 'disk' | 'network';
  showPrediction?: boolean;
  height?: string;
  className?: string;
}

/**
 * 임시 차트 컴포넌트 - chart.js 의존성 설치 후 실제 구현으로 교체 필요
 */
export function RealtimeChart({
  serverId,
  metricType,
  showPrediction: _showPrediction = false,
  height = 'h-64',
  className = '',
}: RealtimeChartProps) {
  return (
    <div
      className={`${height} ${className} flex items-center justify-center rounded-lg bg-gray-100 p-4 dark:bg-gray-800`}
    >
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400">
          {metricType.toUpperCase()} Chart
        </p>
        <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
          Server: {serverId}
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-600">
          Chart.js 의존성 설치 필요
        </p>
      </div>
    </div>
  );
}

export default RealtimeChart;
