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
  Filler,
  TooltipItem,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useWebSocket } from '@/hooks/useWebSocket';
import { timerManager } from '../../utils/TimerManager';

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

// 🎯 타입 정의
interface RealtimeChartProps {
  metrics: string[]; // ['cpu', 'memory', 'disk']
  serverId?: string;
  timeWindow?: number; // 표시할 시간 범위 (분)
  predictions?: boolean; // 예측 라인 표시 여부
  interactions?: boolean; // 인터랙티브 기능
  anomalies?: boolean; // 이상 감지 마커
  autoScale?: boolean; // 자동 스케일링
  height?: number;
  refreshInterval?: number; // 밀리초
}

interface ChartDataPoint {
  timestamp: string;
  value: number;
  predicted?: boolean;
  anomaly?: boolean;
  confidence?: [number, number];
}

interface MetricData {
  [metric: string]: ChartDataPoint[];
}

export default function RealtimeChart({
  metrics = ['cpu'],
  serverId = 'default',
  timeWindow = 60, // 60분
  predictions = true,
  interactions = true,
  anomalies = true,
  autoScale = true,
  height = 300,
  refreshInterval = 20000, // 20초로 통일
}: RealtimeChartProps) {
  // 🔄 상태 관리
  const [chartData, setChartData] = useState<MetricData>({});
  const [predictionData, setPredictionData] = useState<MetricData>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [chartOptions, setChartOptions] = useState<any>(null);

  // 🔗 WebSocket 연결
  const { isConnected, serverMetrics, latestMetric, subscribe } = useWebSocket({
    autoConnect: true,
    debug: true,
  });

  // 📊 차트 참조
  const chartRef = useRef<ChartJS<'line'> | null>(null);

  /**
   * 📊 차트 옵션 초기화
   */
  const initializeChartOptions = useCallback(() => {
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart' as const,
      },
      interaction: interactions
        ? {
            mode: 'index' as const,
            intersect: false,
          }
        : undefined,
      plugins: {
        title: {
          display: true,
          text: `실시간 서버 메트릭 (${metrics.join(', ').toUpperCase()})`,
          color: '#fff',
          font: {
            size: 16,
            weight: 'bold' as const,
          },
        },
        legend: {
          position: 'top' as const,
          labels: {
            color: '#fff',
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#fff',
          bodyColor: '#fff',
          borderColor: '#4ade80',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: function (context: TooltipItem<'line'>) {
              const dataset = context.dataset;
              const value = context.parsed.y;
              const isPrediction = dataset.label?.includes('예측');
              const prefix = isPrediction ? '🔮 ' : '📊 ';

              return `${prefix}${dataset.label}: ${value.toFixed(1)}%`;
            },
            afterBody: function (tooltipItems: TooltipItem<'line'>[]) {
              const currentItem = tooltipItems[0];
              if (currentItem && predictions) {
                return ['', '💡 팁: 마우스 휠로 줌, 드래그로 이동 가능'];
              }
              return [];
            },
          },
        },
      },
      scales: {
        x: {
          type: 'category' as const,
          display: true,
          title: {
            display: true,
            text: '시간',
            color: '#9ca3af',
          },
          grid: {
            color: 'rgba(75, 85, 99, 0.3)',
          },
          ticks: {
            color: '#9ca3af',
            maxTicksLimit: 10,
            callback: function (value: any, index: number): string {
              const label = (this as any).getLabelForValue
                ? (this as any).getLabelForValue(value)
                : value?.toString() || '';
              if (typeof label === 'string' && label.includes(':')) {
                return label.split(' ')[1] || label; // 시간 부분만 표시
              }
              return label;
            },
          },
        },
        y: {
          type: 'linear' as const,
          display: true,
          title: {
            display: true,
            text: '사용률 (%)',
            color: '#9ca3af',
          },
          min: autoScale ? undefined : 0,
          max: autoScale ? undefined : 100,
          grid: {
            color: 'rgba(75, 85, 99, 0.3)',
          },
          ticks: {
            color: '#9ca3af',
            callback: function (value: any) {
              return value + '%';
            },
          },
        },
      },
      elements: {
        point: {
          radius: 3,
          hoverRadius: 6,
          borderWidth: 2,
        },
        line: {
          borderWidth: 2,
          tension: 0.4, // 부드러운 곡선
        },
      },
    };

    setChartOptions(options);
  }, [metrics, interactions, predictions, autoScale]);

  /**
   * 🎨 메트릭별 색상 반환
   */
  const getMetricColor = useCallback((metric: string, isPrediction = false) => {
    const colors = {
      cpu: isPrediction ? '#fbbf24' : '#ef4444', // 빨강/노랑
      memory: isPrediction ? '#a78bfa' : '#8b5cf6', // 보라/연보라
      disk: isPrediction ? '#34d399' : '#10b981', // 초록/연초록
      network: isPrediction ? '#60a5fa' : '#3b82f6', // 파랑/연파랑
    };

    return colors[metric as keyof typeof colors] || '#6b7280';
  }, []);

  /**
   * 📊 실시간 데이터 처리
   */
  const processRealtimeData = useCallback(() => {
    if (serverMetrics.length === 0) return;

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - timeWindow * 60 * 1000);

    // 시간 윈도우 내의 데이터만 필터링
    const recentMetrics = serverMetrics.filter(
      metric => new Date(metric.timestamp) >= cutoffTime
    );

    // 메트릭별로 데이터 정리
    const newChartData: MetricData = {};

    metrics.forEach(metricType => {
      const metricData = recentMetrics
        .filter(m => m.data[metricType] !== undefined)
        .map(m => ({
          timestamp: format(new Date(m.timestamp), 'MM-dd HH:mm'),
          value: m.data[metricType] || 0,
          predicted: false,
          anomaly: m.priority === 'critical' && anomalies,
        }))
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      newChartData[metricType] = metricData;
    });

    setChartData(newChartData);
    setLastUpdate(new Date());
    setIsLoading(false);
  }, [serverMetrics, metrics, timeWindow, anomalies]);

  /**
   * 🔮 예측 데이터 생성
   */
  const generatePredictionData = useCallback(async () => {
    if (!predictions || Object.keys(chartData).length === 0) return;

    try {
      const newPredictionData: MetricData = {};

      for (const metric of metrics) {
        if (!chartData[metric] || chartData[metric].length < 10) continue;

        // API 호출로 예측 데이터 가져오기
        const response = await fetch('/api/ai/prediction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metric,
            horizon: 30, // 30분 예측
            confidence: 0.95,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          const prediction = result.prediction;

          // 예측 포인트 생성 (현재 시간부터 30분 후까지)
          const predictionPoints: ChartDataPoint[] = [];
          const lastDataPoint = chartData[metric][chartData[metric].length - 1];

          for (let i = 1; i <= 6; i++) {
            // 5분 간격으로 6개 포인트
            const futureTime = new Date();
            futureTime.setMinutes(futureTime.getMinutes() + i * 5);

            // 선형 보간으로 중간값들 계산
            const progress = i / 6;
            const currentValue = lastDataPoint.value;
            const targetValue = prediction.predicted_value;
            const interpolatedValue =
              currentValue + (targetValue - currentValue) * progress;

            predictionPoints.push({
              timestamp: format(futureTime, 'MM-dd HH:mm'),
              value: interpolatedValue,
              predicted: true,
              confidence: prediction.confidence_interval,
            });
          }

          newPredictionData[metric] = predictionPoints;
        }
      }

      setPredictionData(newPredictionData);
    } catch (error) {
      console.warn('⚠️ 예측 데이터 생성 실패:', error);
    }
  }, [predictions, chartData, metrics]);

  /**
   * 📈 차트 데이터 구성
   */
  const buildChartData = useCallback(() => {
    const datasets: any[] = [];

    // 실제 데이터 데이터셋
    metrics.forEach(metric => {
      if (chartData[metric]) {
        datasets.push({
          label: `${metric.toUpperCase()} 실제`,
          data: chartData[metric].map(point => point.value),
          borderColor: getMetricColor(metric, false),
          backgroundColor: getMetricColor(metric, false) + '20',
          fill: false,
          tension: 0.4,
          pointBackgroundColor: chartData[metric].map(point =>
            point.anomaly ? '#f59e0b' : getMetricColor(metric, false)
          ),
          pointBorderColor: '#fff',
          pointRadius: chartData[metric].map(point => (point.anomaly ? 6 : 3)),
        });
      }
    });

    // 예측 데이터 데이터셋
    if (predictions) {
      metrics.forEach(metric => {
        if (predictionData[metric]) {
          datasets.push({
            label: `${metric.toUpperCase()} 예측`,
            data: [
              ...Array(chartData[metric]?.length || 0).fill(null),
              ...predictionData[metric].map(point => point.value),
            ],
            borderColor: getMetricColor(metric, true),
            backgroundColor: getMetricColor(metric, true) + '10',
            borderDash: [5, 5],
            fill: false,
            tension: 0.4,
            pointStyle: 'triangle',
            pointRadius: 4,
          });
        }
      });
    }

    // 라벨 생성 (실제 + 예측 시간)
    const labels: string[] = [];

    if (chartData[metrics[0]]) {
      labels.push(...chartData[metrics[0]].map(point => point.timestamp));
    }

    if (predictions && predictionData[metrics[0]]) {
      labels.push(...predictionData[metrics[0]].map(point => point.timestamp));
    }

    return { labels, datasets };
  }, [chartData, predictionData, metrics, predictions, getMetricColor]);

  // 🎬 초기화 및 이벤트 리스너
  useEffect(() => {
    initializeChartOptions();
  }, [initializeChartOptions]);

  useEffect(() => {
    if (isConnected) {
      subscribe('server-metrics');
    }
  }, [isConnected, subscribe]);

  useEffect(() => {
    processRealtimeData();
  }, [processRealtimeData]);

  useEffect(() => {
    if (predictions && Object.keys(chartData).length > 0) {
      generatePredictionData();
    }
  }, [generatePredictionData, chartData]);

  // 🔄 주기적 업데이트
  useEffect(() => {
    timerManager.register({
      id: 'realtime-chart-update',
      callback: processRealtimeData,
      interval: refreshInterval,
      priority: 'medium',
      enabled: true,
    });

    return () => {
      timerManager.unregister('realtime-chart-update');
    };
  }, [processRealtimeData, refreshInterval]);

  if (isLoading) {
    return (
      <motion.div
        className='flex items-center justify-center h-64 bg-gray-800 rounded-lg'
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4'></div>
          <p className='text-gray-300'>실시간 차트 로딩 중...</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className='bg-gray-800 rounded-lg p-4 shadow-lg'
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* 📊 헤더 */}
      <div className='flex justify-between items-center mb-4'>
        <div className='flex items-center space-x-3'>
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
          />
          <h3 className='text-lg font-semibold text-white'>
            실시간 메트릭 차트
          </h3>
          {lastUpdate && (
            <span className='text-sm text-gray-400'>
              {format(lastUpdate, 'HH:mm:ss')} 업데이트
            </span>
          )}
        </div>

        <div className='flex items-center space-x-2 text-sm text-gray-400'>
          {predictions && (
            <span className='flex items-center'>
              <div className='w-2 h-2 bg-yellow-400 rounded-full mr-1' />
              예측 표시
            </span>
          )}
          {anomalies && (
            <span className='flex items-center'>
              <div className='w-2 h-2 bg-orange-400 rounded-full mr-1' />
              이상 감지
            </span>
          )}
        </div>
      </div>

      {/* 📈 차트 */}
      <div style={{ height: `${height}px` }}>
        {chartOptions && (
          <Line ref={chartRef} data={buildChartData()} options={chartOptions} />
        )}
      </div>

      {/* 📊 통계 정보 */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm'>
        {metrics.map(metric => {
          const data = chartData[metric];
          const latestValue =
            data && data.length > 0 ? data[data.length - 1].value : 0;
          const predValue =
            predictionData[metric] && predictionData[metric].length > 0
              ? predictionData[metric][predictionData[metric].length - 1].value
              : null;

          return (
            <div key={metric} className='bg-gray-700 rounded p-3'>
              <div className='flex items-center justify-between'>
                <span className='text-gray-300 uppercase text-xs'>
                  {metric}
                </span>
                <div
                  className='w-3 h-3 rounded-full'
                  style={{ backgroundColor: getMetricColor(metric) }}
                />
              </div>
              <div className='mt-1'>
                <div className='text-white font-semibold'>
                  {latestValue.toFixed(1)}%
                </div>
                {predictions && predValue && (
                  <div className='text-yellow-400 text-xs'>
                    예측: {predValue.toFixed(1)}%
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
