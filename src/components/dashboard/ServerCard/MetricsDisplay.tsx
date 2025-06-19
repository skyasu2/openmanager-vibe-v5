/**
 * 📊 MetricsDisplay Component v2.0
 *
 * 서버 메트릭 표시 컴포넌트 (CPU, Memory, Disk)
 * - 프로그레스바 형태의 메트릭 표시
 * - 색상 코딩으로 상태 구분
 * - 애니메이션 효과 및 반응형 디자인
 */

import React, { memo } from 'react';
import { Server } from '../../../types/server';

interface MetricsDisplayProps {
  server: Server;
  variant?: 'default' | 'compact' | 'detailed';
  showLabels?: boolean;
  showValues?: boolean;
}

const MetricsDisplay: React.FC<MetricsDisplayProps> = memo(
  ({ server, variant = 'default', showLabels = true, showValues = true }) => {
    // 프로그레스바 색상 결정
    const getProgressBarColor = (
      value: number,
      type: 'cpu' | 'memory' | 'disk'
    ) => {
      if (type === 'cpu') {
        if (value > 80) return 'bg-red-500';
        if (value > 60) return 'bg-yellow-500';
        return 'bg-green-500';
      }
      if (type === 'memory') {
        if (value > 80) return 'bg-red-500';
        if (value > 60) return 'bg-yellow-500';
        return 'bg-blue-500';
      }
      if (type === 'disk') {
        if (value > 80) return 'bg-red-500';
        if (value > 60) return 'bg-yellow-500';
        return 'bg-purple-500';
      }
      return 'bg-gray-500';
    };

    // 메트릭 위험도 판단
    const getMetricStatus = (value: number) => {
      if (value > 80) return 'critical';
      if (value > 60) return 'warning';
      return 'normal';
    };

    // 메트릭 배열
    const metrics = [
      {
        key: 'cpu',
        label: 'CPU',
        value: server.cpu,
        icon: '🔧',
        unit: '%',
      },
      {
        key: 'memory',
        label: '메모리',
        value: server.memory,
        icon: '💾',
        unit: '%',
      },
      {
        key: 'disk',
        label: '디스크',
        value: server.disk,
        icon: '💿',
        unit: '%',
      },
    ] as const;

    // 배리언트별 클래스
    const getVariantClasses = () => {
      switch (variant) {
        case 'compact':
          return {
            container: 'space-y-2',
            progressHeight: 'h-1',
            textSize: 'text-xs',
            spacing: 'mb-1',
          };
        case 'detailed':
          return {
            container: 'space-y-4',
            progressHeight: 'h-3',
            textSize: 'text-sm',
            spacing: 'mb-2',
          };
        default:
          return {
            container: 'space-y-3',
            progressHeight: 'h-1',
            textSize: 'text-xs',
            spacing: 'mb-1',
          };
      }
    };

    const classes = getVariantClasses();

    return (
      <div className={classes.container}>
        {metrics.map(metric => {
          const status = getMetricStatus(metric.value);
          const barColor = getProgressBarColor(metric.value, metric.key);

          return (
            <div key={metric.key}>
              {/* 라벨 및 값 */}
              {(showLabels || showValues) && (
                <div
                  className={`flex justify-between items-center ${classes.spacing}`}
                >
                  {showLabels && (
                    <div className='flex items-center gap-1'>
                      {variant === 'detailed' && (
                        <span className='text-sm'>{metric.icon}</span>
                      )}
                      <span className={`${classes.textSize} text-gray-600`}>
                        {metric.label}
                      </span>
                      {status === 'critical' && (
                        <span className='text-red-500 text-xs'>⚠️</span>
                      )}
                    </div>
                  )}
                  {showValues && (
                    <span
                      className={`${classes.textSize} font-medium text-gray-900`}
                    >
                      {metric.value}
                      {metric.unit}
                    </span>
                  )}
                </div>
              )}

              {/* 프로그레스바 */}
              <div className='relative'>
                <div
                  className={`w-full bg-gray-200 rounded-full ${classes.progressHeight} overflow-hidden`}
                >
                  <div
                    className={`${classes.progressHeight} rounded-full transition-all duration-500 ease-out ${barColor} relative overflow-hidden`}
                    style={{ width: `${metric.value}%` }}
                  >
                    {/* 애니메이션 효과 (detailed 모드에서만) */}
                    {variant === 'detailed' && (
                      <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse'></div>
                    )}
                  </div>
                </div>

                {/* 임계값 표시선 (detailed 모드에서만) */}
                {variant === 'detailed' && (
                  <>
                    <div
                      className='absolute top-0 w-0.5 bg-yellow-400 opacity-50'
                      style={{ left: '60%', height: '100%' }}
                      title='경고 임계값 (60%)'
                    ></div>
                    <div
                      className='absolute top-0 w-0.5 bg-red-400 opacity-50'
                      style={{ left: '80%', height: '100%' }}
                      title='위험 임계값 (80%)'
                    ></div>
                  </>
                )}
              </div>

              {/* 상태 텍스트 (detailed 모드에서만) */}
              {variant === 'detailed' && (
                <div className='flex justify-between items-center mt-1'>
                  <span
                    className={`text-xs ${
                      status === 'critical'
                        ? 'text-red-600'
                        : status === 'warning'
                          ? 'text-yellow-600'
                          : 'text-green-600'
                    }`}
                  >
                    {status === 'critical'
                      ? '위험'
                      : status === 'warning'
                        ? '주의'
                        : '정상'}
                  </span>
                  <span className='text-xs text-gray-400'>
                    {status === 'critical'
                      ? '즉시 조치 필요'
                      : status === 'warning'
                        ? '모니터링 필요'
                        : '안정'}
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* 전체 건강도 점수 (detailed 모드에서만) */}
        {variant === 'detailed' && (
          <div className='mt-4 p-2 bg-gray-50 rounded-lg'>
            <div className='flex justify-between items-center'>
              <span className='text-xs text-gray-600'>전체 건강도</span>
              <span
                className={`text-sm font-medium ${
                  getMetricStatus(
                    (server.cpu + server.memory + server.disk) / 3
                  ) === 'critical'
                    ? 'text-red-600'
                    : getMetricStatus(
                          (server.cpu + server.memory + server.disk) / 3
                        ) === 'warning'
                      ? 'text-yellow-600'
                      : 'text-green-600'
                }`}
              >
                {Math.round(
                  100 - (server.cpu + server.memory + server.disk) / 3
                )}
                %
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MetricsDisplay.displayName = 'MetricsDisplay';

export default MetricsDisplay;
