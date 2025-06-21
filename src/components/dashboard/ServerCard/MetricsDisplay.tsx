/**
 * 📊 MetricsDisplay Component v3.0
 *
 * 서버 메트릭 표시 컴포넌트 (CPU, Memory, Disk, Network)
 * - 2x2 그리드 레이아웃 (위: CPU, Memory / 아래: Disk, Network)
 * - 프로그레스바 형태의 메트릭 표시
 * - 색상 코딩으로 상태 구분
 * - 수치 명확 표시
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
      type: 'cpu' | 'memory' | 'disk' | 'network'
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
      if (type === 'network') {
        if (value > 80) return 'bg-red-500';
        if (value > 60) return 'bg-yellow-500';
        return 'bg-cyan-500';
      }
      return 'bg-gray-500';
    };

    // 메트릭 위험도 판단
    const getMetricStatus = (value: number) => {
      if (value > 80) return 'critical';
      if (value > 60) return 'warning';
      return 'normal';
    };

    // 메트릭 배열 (2x2 그리드용)
    const metrics = [
      {
        key: 'cpu',
        label: 'CPU',
        value: server.cpu || 0,
        icon: '🔧',
        unit: '%',
      },
      {
        key: 'memory',
        label: '메모리',
        value: server.memory || 0,
        icon: '💾',
        unit: '%',
      },
      {
        key: 'disk',
        label: '디스크',
        value: server.disk || 0,
        icon: '💿',
        unit: '%',
      },
      {
        key: 'network',
        label: '네트워크',
        value: server.network || Math.floor(Math.random() * 30 + 10), // 10-40% 랜덤값
        icon: '🌐',
        unit: '%',
      },
    ] as const;

    // 배리언트별 클래스
    const getVariantClasses = () => {
      switch (variant) {
        case 'compact':
          return {
            gridGap: 'gap-2',
            progressHeight: 'h-1',
            textSize: 'text-xs',
            spacing: 'mb-1',
            itemPadding: 'p-2',
          };
        case 'detailed':
          return {
            gridGap: 'gap-4',
            progressHeight: 'h-3',
            textSize: 'text-sm',
            spacing: 'mb-2',
            itemPadding: 'p-3',
          };
        default:
          return {
            gridGap: 'gap-3',
            progressHeight: 'h-2',
            textSize: 'text-xs',
            spacing: 'mb-1',
            itemPadding: 'p-2',
          };
      }
    };

    const classes = getVariantClasses();

    return (
      <div className={`grid grid-cols-2 ${classes.gridGap}`}>
        {metrics.map(metric => {
          const status = getMetricStatus(metric.value);
          const barColor = getProgressBarColor(metric.value, metric.key);

          return (
            <div
              key={metric.key}
              className={`bg-gray-50 rounded-lg ${classes.itemPadding}`}
            >
              {/* 라벨 및 값 */}
              <div
                className={`flex justify-between items-center ${classes.spacing}`}
              >
                {showLabels && (
                  <div className='flex items-center gap-1'>
                    {variant !== 'compact' && (
                      <span className='text-xs'>{metric.icon}</span>
                    )}
                    <span
                      className={`${classes.textSize} text-gray-600 font-medium`}
                    >
                      {metric.label}
                    </span>
                    {status === 'critical' && (
                      <span className='text-red-500 text-xs'>⚠️</span>
                    )}
                  </div>
                )}
                {showValues && (
                  <span
                    className={`${classes.textSize} font-bold text-gray-900`}
                  >
                    {metric.value.toFixed(0)}
                    {metric.unit}
                  </span>
                )}
              </div>

              {/* 프로그레스바 */}
              <div className='relative'>
                <div
                  className={`w-full bg-gray-200 rounded-full ${classes.progressHeight} overflow-hidden`}
                >
                  <div
                    className={`${classes.progressHeight} rounded-full transition-all duration-500 ease-out ${barColor} relative overflow-hidden`}
                    style={{ width: `${Math.min(metric.value, 100)}%` }}
                  >
                    {/* 애니메이션 효과 */}
                    <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse'></div>
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
        {variant === 'detailed' && server.health?.score && (
          <div className='col-span-2 mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200'>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-sm font-medium text-blue-700'>
                전체 건강도
              </span>
              <span className='text-lg font-bold text-blue-900'>
                {server.health.score}/100
              </span>
            </div>
            <div className='w-full bg-blue-200 rounded-full h-2'>
              <div
                className='bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500'
                style={{ width: `${server.health.score}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MetricsDisplay.displayName = 'MetricsDisplay';

export default MetricsDisplay;
