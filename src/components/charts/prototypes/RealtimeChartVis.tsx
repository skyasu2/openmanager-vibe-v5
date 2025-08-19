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
import {
  XYPlot,
  LineSeries,
  AreaSeries,
  XAxis,
  YAxis,
  HorizontalGridLines,
  VerticalGridLines,
  DiscreteColorLegend,
  Crosshair,
  Hint,
} from 'react-vis';
import 'react-vis/dist/style.css';

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
  const [data, setData] = useState<MetricSeries>({
    cpu: [],
    memory: [],
    network: [],
  });
  
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    dataPoints: 0,
    updateCount: 0,
  });
  
  const [crosshairValues, setCrosshairValues] = useState<DataPoint[]>([]);
  const [hintValue, setHintValue] = useState<DataPoint | null>(null);

  // 실시간 데이터 생성
  const generateRealtimeData = useCallback(() => {
    const now = Date.now();
    const timestamp = new Date(now);
    
    return {
      cpu: {
        x: now,
        y: Math.random() * 100,
        timestamp,
      },
      memory: {
        x: now,
        y: 40 + Math.random() * 40,
        timestamp,
      },
      network: {
        x: now,
        y: Math.random() * 100, // 0-100 범위로 정규화
        timestamp,
      },
    };
  }, []);

  // 메모리 사용량 측정
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024;
    }
    return 0;
  }, []);

  // 데이터 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      const renderStart = performance.now();
      
      setData(prevData => {
        const newDataPoint = generateRealtimeData();
        
        const updateSeries = (series: DataPoint[], newPoint: DataPoint) => {
          const updated = [...series, newPoint];
          return updated.length > maxDataPoints 
            ? updated.slice(-maxDataPoints) 
            : updated;
        };
        
        const newData = {
          cpu: updateSeries(prevData.cpu, newDataPoint.cpu),
          memory: updateSeries(prevData.memory, newDataPoint.memory),
          network: updateSeries(prevData.network, newDataPoint.network),
        };
        
        // 성능 메트릭 업데이트
        const renderTime = performance.now() - renderStart;
        const memoryUsage = measureMemoryUsage();
        const totalDataPoints = newData.cpu.length + newData.memory.length + newData.network.length;
        
        setPerformanceMetrics(prev => ({
          renderTime,
          memoryUsage,
          dataPoints: totalDataPoints,
          updateCount: prev.updateCount + 1,
        }));
        
        return newData;
      });
    }, updateInterval);

    return () => clearInterval(interval);
  }, [generateRealtimeData, maxDataPoints, updateInterval, measureMemoryUsage]);

  // 범례 데이터
  const legendItems = [
    { title: 'CPU %', color: '#3b82f6' },
    { title: 'Memory %', color: '#22c55e' },
    { title: 'Network %', color: '#a855f7' },
  ];

  // Crosshair 포맷터
  const formatCrosshairValue = (value: DataPoint) => ({
    title: '시간',
    value: new Date(value.x).toLocaleTimeString(),
  });

  // 호버 이벤트 핸들러
  const onNearestX = (value: DataPoint, { index }: { index: number }) => {
    setCrosshairValues([
      data.cpu[index],
      data.memory[index],
      data.network[index],
    ].filter(Boolean));
  };

  const onMouseLeave = () => {
    setCrosshairValues([]);
    setHintValue(null);
  };

  return (
    <div className="space-y-4">
      {/* 차트 */}
      <div className="overflow-hidden rounded-lg border bg-white p-6 shadow-sm dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          React-vis 실시간 서버 모니터링 - {serverId}
        </h3>
        
        <div className="mb-4">
          <DiscreteColorLegend
            items={legendItems}
            orientation="horizontal"
            style={{ display: 'flex', justifyContent: 'center' }}
          />
        </div>
        
        <XYPlot
          width={width}
          height={height}
          margin={{ left: 70, right: 50, top: 20, bottom: 60 }}
          onMouseLeave={onMouseLeave}
        >
          <HorizontalGridLines style={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
          <VerticalGridLines style={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
          
          {/* 배경 영역 */}
          <AreaSeries
            data={data.cpu}
            color="#3b82f6"
            opacity={0.2}
            stroke="transparent"
          />
          <AreaSeries
            data={data.memory}
            color="#22c55e"
            opacity={0.2}
            stroke="transparent"
          />
          <AreaSeries
            data={data.network}
            color="#a855f7"
            opacity={0.2}
            stroke="transparent"
          />
          
          {/* 라인 시리즈 */}
          <LineSeries
            data={data.cpu}
            color="#3b82f6"
            strokeWidth={2}
            onNearestX={onNearestX}
            animation={{ duration: 300 }}
          />
          <LineSeries
            data={data.memory}
            color="#22c55e"
            strokeWidth={2}
            animation={{ duration: 300 }}
          />
          <LineSeries
            data={data.network}
            color="#a855f7"
            strokeWidth={2}
            animation={{ duration: 300 }}
          />
          
          {/* 축 */}
          <XAxis
            title="시간"
            style={{
              line: { stroke: '#6b7280' },
              ticks: { stroke: '#6b7280' },
              text: { stroke: 'none', fill: '#6b7280', fontSize: 12 },
              title: { fill: '#374151', fontSize: 14 },
            }}
            tickFormat={(value) => new Date(value).toLocaleTimeString()}
            tickTotal={6}
          />
          <YAxis
            title="사용률 (%)"
            style={{
              line: { stroke: '#6b7280' },
              ticks: { stroke: '#6b7280' },
              text: { stroke: 'none', fill: '#6b7280', fontSize: 12 },
              title: { fill: '#374151', fontSize: 14 },
            }}
            domain={[0, 100]}
          />
          
          {/* Crosshair */}
          {crosshairValues.length > 0 && (
            <Crosshair values={crosshairValues}>
              <div className="rounded-lg bg-black bg-opacity-80 p-3 text-sm text-white shadow-lg">
                <div className="mb-2 font-semibold">
                  {new Date(crosshairValues[0]?.x).toLocaleTimeString()}
                </div>
                {crosshairValues.map((value, index) => {
                  const labels = ['CPU', 'Memory', 'Network'];
                  const colors = ['#3b82f6', '#22c55e', '#a855f7'];
                  return (
                    <div key={index} className="flex items-center space-x-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: colors[index] }}
                      />
                      <span>{labels[index]}: {value?.y?.toFixed(1)}%</span>
                    </div>
                  );
                })}
              </div>
            </Crosshair>
          )}
          
          {/* Hint */}
          {hintValue && (
            <Hint value={hintValue}>
              <div className="rounded bg-black bg-opacity-75 p-2 text-xs text-white">
                {hintValue.y.toFixed(1)}%
              </div>
            </Hint>
          )}
        </XYPlot>
      </div>
      
      {/* 성능 메트릭 */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
        <div className="space-y-2">
          <h4 className="font-semibold text-indigo-600">React-vis 성능</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>렌더링 시간:</span>
              <span className="font-mono">{performanceMetrics.renderTime.toFixed(2)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>업데이트 횟수:</span>
              <span className="font-mono">{performanceMetrics.updateCount}</span>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h4 className="font-semibold text-green-600">메모리 사용량</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>JS Heap:</span>
              <span className="font-mono">{performanceMetrics.memoryUsage.toFixed(1)}MB</span>
            </div>
            <div className="flex justify-between">
              <span>데이터 포인트:</span>
              <span className="font-mono">{performanceMetrics.dataPoints}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 특징 요약 */}
      <div className="rounded-lg bg-indigo-50 p-4 dark:bg-indigo-900/20">
        <h4 className="mb-2 font-semibold text-indigo-700 dark:text-indigo-300">React-vis 특징</h4>
        <ul className="space-y-1 text-sm text-indigo-600 dark:text-indigo-400">
          <li>✅ React 친화적 선언적 API</li>
          <li>✅ 컴포넌트 기반 구조</li>
          <li>✅ 내장 애니메이션과 인터랙션</li>
          <li>✅ 간편한 데이터 바인딩</li>
          <li>⚠️ 제한적인 차트 타입</li>
          <li>⚠️ 커스터마이징 옵션 부족</li>
        </ul>
      </div>
    </div>
  );
}