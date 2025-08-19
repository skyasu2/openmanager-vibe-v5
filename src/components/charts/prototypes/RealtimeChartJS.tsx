'use client';

/**
 * 🚀 Chart.js 기반 실시간 차트 프로토타입
 * 
 * 특징:
 * - 빠른 구현과 설정 용이성
 * - 60fps 애니메이션 지원
 * - 메모리 효율적인 데이터 관리
 * - WebSocket 실시간 업데이트
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  ChartData,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Chart.js 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MetricData {
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
}

interface RealtimeChartJSProps {
  serverId: string;
  maxDataPoints?: number;
  updateInterval?: number;
  enableAnimations?: boolean;
}

// 성능 벤치마크를 위한 메트릭
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataPoints: number;
  fps: number;
}

export function RealtimeChartJS({
  serverId,
  maxDataPoints = 100,
  updateInterval = 1000,
  enableAnimations = true,
}: RealtimeChartJSProps) {
  const chartRef = useRef<ChartJS<'line', number[], string>>(null);
  const [data, setData] = useState<MetricData[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    dataPoints: 0,
    fps: 0,
  });
  
  const frameCountRef = useRef(0);
  const lastFPSUpdate = useRef(Date.now());
  const renderStartTime = useRef(0);

  // 실시간 데이터 생성 시뮬레이터 (WebSocket 대신)
  const generateRealtimeData = useCallback((): MetricData => {
    const now = Date.now();
    return {
      timestamp: now,
      cpu: Math.random() * 100,
      memory: 40 + Math.random() * 40, // 40-80% 범위
      network: Math.random() * 1000, // MB/s
    };
  }, []);

  // 메모리 사용량 측정
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }, []);

  // FPS 계산
  const updateFPS = useCallback(() => {
    frameCountRef.current++;
    const now = Date.now();
    const elapsed = now - lastFPSUpdate.current;
    
    if (elapsed >= 1000) {
      const fps = (frameCountRef.current * 1000) / elapsed;
      setPerformanceMetrics(prev => ({ ...prev, fps }));
      frameCountRef.current = 0;
      lastFPSUpdate.current = now;
    }
  }, []);

  // 데이터 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      renderStartTime.current = performance.now();
      
      setData(prevData => {
        const newData = generateRealtimeData();
        const updatedData = [...prevData, newData];
        
        // 최대 데이터 포인트 제한으로 메모리 관리
        if (updatedData.length > maxDataPoints) {
          return updatedData.slice(-maxDataPoints);
        }
        
        return updatedData;
      });
      
      // 성능 메트릭 업데이트
      const renderTime = performance.now() - renderStartTime.current;
      const memoryUsage = measureMemoryUsage();
      
      setPerformanceMetrics(prev => ({
        ...prev,
        renderTime,
        memoryUsage,
        dataPoints: data.length,
      }));
      
      updateFPS();
    }, updateInterval);

    return () => clearInterval(interval);
  }, [generateRealtimeData, maxDataPoints, updateInterval, measureMemoryUsage, updateFPS, data.length]);

  // Chart.js 데이터 포맷
  const chartData: ChartData<'line'> = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: [
      {
        label: 'CPU %',
        data: data.map(d => d.cpu),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Memory %',
        data: data.map(d => d.memory),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Network MB/s',
        data: data.map(d => d.network / 10), // 스케일 조정
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  // Chart.js 옵션 (성능 최적화)
  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: enableAnimations ? {
      duration: 750,
      easing: 'easeInOutQuart',
    } : false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `실시간 서버 모니터링 - ${serverId}`,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: '시간',
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: '사용률 (%)',
        },
        min: 0,
        max: 100,
      },
    },
    elements: {
      point: {
        radius: 0, // 성능 최적화
      },
    },
    // 성능 최적화 옵션
    parsing: false,
    normalized: true,
    spanGaps: false,
  };

  return (
    <div className="space-y-4">
      {/* 차트 */}
      <div className="h-96 w-full">
        <Line ref={chartRef} data={chartData} options={options} />
      </div>
      
      {/* 성능 메트릭 표시 */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4 text-sm dark:bg-gray-800">
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-600">Chart.js 성능</h4>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>렌더링 시간:</span>
              <span className="font-mono">{performanceMetrics.renderTime.toFixed(2)}ms</span>
            </div>
            <div className="flex justify-between">
              <span>FPS:</span>
              <span className="font-mono">{performanceMetrics.fps.toFixed(1)}</span>
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
      <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
        <h4 className="mb-2 font-semibold text-blue-700 dark:text-blue-300">Chart.js 특징</h4>
        <ul className="space-y-1 text-sm text-blue-600 dark:text-blue-400">
          <li>✅ 빠른 구현과 설정 용이성</li>
          <li>✅ 내장 애니메이션과 인터랙션</li>
          <li>✅ 반응형 디자인 자동 지원</li>
          <li>⚠️ 커스터마이징 제한</li>
          <li>⚠️ 대용량 데이터에서 성능 저하</li>
        </ul>
      </div>
    </div>
  );
}