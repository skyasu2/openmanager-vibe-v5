'use client';

/**
 * ⚛️ React-vis 기반 실시간 차트 프로토타입
 * 
 * 특징:
 * - React 친화적 선언적 API
 * - 컴포넌트 기반 구조
 * - 내장 애니메이션과 인터랙션
 * - 간편한 데이터 바인딩
 */

import React, { useState, useEffect, useCallback } from 'react';
// react-vis 제거됨 - React 18 호환성 문제로 임시 비활성화
// import {
//   XYPlot,
//   LineSeries,
//   AreaSeries,
//   XAxis,
//   YAxis,
//   HorizontalGridLines,
//   VerticalGridLines,
//   DiscreteColorLegend,
//   Crosshair,
//   Hint,
// } from 'react-vis';
// import 'react-vis/dist/style.css';

interface DataPoint {
  x: number;
  y: number;
  timestamp: Date;
}

interface MetricSeries {
  cpu: DataPoint[];
  memory: DataPoint[];
  network: DataPoint[];
}

interface RealtimeChartVisProps {
  serverId: string;
  maxDataPoints?: number;
  updateInterval?: number;
  width?: number;
  height?: number;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataPoints: number;
  updateCount: number;
}

export function RealtimeChartVis({
  serverId,
  maxDataPoints = 100,
  updateInterval = 1000,
  width = 800,
  height = 400,
}: RealtimeChartVisProps) {
  // 🚨 react-vis 호환성 문제로 임시 비활성화
  // React 18과 호환되지 않음 (react-vis는 React 16.8.3만 지원)
  
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          React-vis 실시간 서버 모니터링 - {serverId}
        </h3>
        
        <div className="rounded-lg bg-yellow-50 p-6 text-center dark:bg-yellow-900/20">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h4 className="mb-2 text-lg font-semibold text-yellow-700 dark:text-yellow-300">
            컴포넌트 임시 비활성화
          </h4>
          <p className="text-sm text-yellow-600 dark:text-yellow-400">
            react-vis 라이브러리가 React 18과 호환되지 않아 임시로 비활성화되었습니다.
            <br />
            향후 Recharts 또는 Chart.js로 교체될 예정입니다.
          </p>
        </div>
        
        {/* 기존 특징 요약은 유지 */}
        <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
          <h4 className="mb-2 font-semibold text-indigo-700 dark:text-indigo-300">React-vis 특징</h4>
          <ul className="space-y-1 text-sm text-indigo-600 dark:text-indigo-400">
            <li>✅ React 친화적 선언적 API</li>
            <li>✅ 컴포넌트 기반 구조</li>
            <li>✅ 내장 애니메이션과 인터랙션</li>
            <li>✅ 간편한 데이터 바인딩</li>
            <li>❌ React 18 호환성 부족 (현재 문제)</li>
            <li>⚠️ 제한적인 차트 타입</li>
            <li>⚠️ 커스터마이징 옵션 부족</li>
          </ul>
        </div>
      </div>
    </div>
  );
}