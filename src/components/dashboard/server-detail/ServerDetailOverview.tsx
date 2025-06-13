'use client';

import React from 'react';
import { Server } from '../../../types/unified-server';
import { safeFormatUptime } from '../../../utils/safeFormat';

interface ServerDetailOverviewProps {
  server: Server;
  realTimeMetrics: {
    processes: number;
    loadAverage: string;
    temperature: number;
    networkThroughput: {
      in: number;
      out: number;
    };
  } | null;
}

export default function ServerDetailOverview({
  server,
  realTimeMetrics,
}: ServerDetailOverviewProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'online':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: '🟢',
          text: '정상 운영',
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: '🟡',
          text: '주의 필요',
        };
      case 'critical':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: '🔴',
          text: '긴급 상황',
        };
      case 'offline':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '⚫',
          text: '오프라인',
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: '❓',
          text: '알 수 없음',
        };
    }
  };

  const statusInfo = getStatusInfo(server.status);

  return (
    <div className='space-y-6'>
      {/* 서버 기본 정보 */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <div className='space-y-4'>
          <div className='bg-white rounded-lg border p-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-3'>
              기본 정보
            </h3>
            <div className='space-y-3'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>서버 ID:</span>
                <span className='font-mono text-sm'>{server.id}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>서버명:</span>
                <span className='font-medium'>{server.name}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>타입:</span>
                <span className='capitalize'>{server.type}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>위치:</span>
                <span>{server.location}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>상태:</span>
                <div
                  className={`flex items-center gap-2 px-2 py-1 rounded-full text-sm ${statusInfo.bgColor} ${statusInfo.borderColor} border`}
                >
                  <span>{statusInfo.icon}</span>
                  <span className={statusInfo.color}>{statusInfo.text}</span>
                </div>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>마지막 확인:</span>
                <span className='text-sm'>
                  {new Date(server.lastSeen).toLocaleString('ko-KR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='bg-white rounded-lg border p-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-3'>
              실시간 상태
            </h3>
            {realTimeMetrics ? (
              <div className='space-y-3'>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>실행 중인 프로세스:</span>
                  <span className='font-medium'>
                    {realTimeMetrics.processes}개
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>시스템 부하:</span>
                  <span className='font-medium'>
                    {realTimeMetrics.loadAverage}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>CPU 온도:</span>
                  <span className='font-medium'>
                    {realTimeMetrics.temperature}°C
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-gray-600'>네트워크 처리량:</span>
                  <div className='text-right'>
                    <div className='text-sm text-green-600'>
                      ↓{' '}
                      {(realTimeMetrics.networkThroughput.in / 1024).toFixed(1)}{' '}
                      KB/s
                    </div>
                    <div className='text-sm text-blue-600'>
                      ↑{' '}
                      {(realTimeMetrics.networkThroughput.out / 1024).toFixed(
                        1
                      )}{' '}
                      KB/s
                    </div>
                  </div>
                </div>
                {server.metrics.uptime && (
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>가동 시간:</span>
                    <span className='font-medium'>
                      {safeFormatUptime(server.metrics.uptime)}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className='text-gray-500 text-center py-4'>
                실시간 데이터 로딩 중...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 현재 메트릭 요약 */}
      <div className='bg-white rounded-lg border p-4'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>
          현재 리소스 사용률
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          <div className='text-center'>
            <div className='text-2xl font-bold text-blue-600'>
              {server.metrics.cpu.usage}%
            </div>
            <div className='text-sm text-gray-600'>CPU</div>
            <div className='text-xs text-gray-500'>
              {server.metrics.cpu.cores}코어
            </div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-green-600'>
              {server.metrics.memory.usage}%
            </div>
            <div className='text-sm text-gray-600'>메모리</div>
            <div className='text-xs text-gray-500'>
              {(server.metrics.memory.used / 1024 / 1024 / 1024).toFixed(1)}GB /
              {(server.metrics.memory.total / 1024 / 1024 / 1024).toFixed(1)}GB
            </div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-purple-600'>
              {server.metrics.disk.usage}%
            </div>
            <div className='text-sm text-gray-600'>디스크</div>
            <div className='text-xs text-gray-500'>
              {(server.metrics.disk.used / 1024 / 1024 / 1024).toFixed(1)}GB /
              {(server.metrics.disk.total / 1024 / 1024 / 1024).toFixed(1)}GB
            </div>
          </div>
          <div className='text-center'>
            <div className='text-2xl font-bold text-orange-600'>
              {(
                (server.metrics.network.bytesIn +
                  server.metrics.network.bytesOut) /
                1024 /
                1024
              ).toFixed(1)}
            </div>
            <div className='text-sm text-gray-600'>네트워크</div>
            <div className='text-xs text-gray-500'>MB/s</div>
          </div>
        </div>
      </div>

      {/* 알림 정보 */}
      {server.alerts && server.alerts.length > 0 && (
        <div className='bg-white rounded-lg border p-4'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            활성 알림 ({server.alerts.length}개)
          </h3>
          <div className='space-y-2'>
            {server.alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.type === 'critical'
                    ? 'bg-red-50 border-red-400'
                    : alert.type === 'warning'
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-blue-50 border-blue-400'
                }`}
              >
                <div className='flex justify-between items-start'>
                  <div>
                    <div className='font-medium text-gray-900'>
                      {alert.title}
                    </div>
                    <div className='text-sm text-gray-600 mt-1'>
                      {alert.message}
                    </div>
                  </div>
                  <div className='text-xs text-gray-500'>
                    {new Date(alert.timestamp).toLocaleString('ko-KR')}
                  </div>
                </div>
              </div>
            ))}
            {server.alerts.length > 5 && (
              <div className='text-center text-sm text-gray-500 pt-2'>
                +{server.alerts.length - 5}개 더 보기
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
