'use client';

import React from 'react';
import { Server } from '../../../types/server';
import { safeFormatUptime } from '../../../utils/safeFormat';

interface ServerDetailOverviewProps {
  server: Server;
}

export function ServerDetailOverview({ server }: ServerDetailOverviewProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'online':
      case 'healthy':
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
                  {server.lastSeen
                    ? new Date(server.lastSeen).toLocaleString('ko-KR')
                    : '알 수 없음'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='space-y-4'>
          <div className='bg-white rounded-lg border p-4'>
            <h3 className='text-lg font-semibold text-gray-900 mb-3'>
              현재 리소스 사용률
            </h3>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {server.metrics?.cpu?.usage || server.cpu}%
                </div>
                <div className='text-sm text-gray-600'>CPU</div>
                <div className='text-xs text-gray-500'>
                  {server.metrics?.cpu?.cores || 4}코어
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {server.metrics?.memory?.usage || server.memory}%
                </div>
                <div className='text-sm text-gray-600'>메모리</div>
                <div className='text-xs text-gray-500'>
                  {server.metrics?.memory?.total || 16}GB
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {server.metrics?.disk?.usage || server.disk}%
                </div>
                <div className='text-sm text-gray-600'>디스크</div>
                <div className='text-xs text-gray-500'>
                  {server.metrics?.disk?.total || 500}GB
                </div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-orange-600'>
                  {server.network || 0}%
                </div>
                <div className='text-sm text-gray-600'>네트워크</div>
                <div className='text-xs text-gray-500'>1Gbps</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 서비스 상태 */}
      {server.services && server.services.length > 0 && (
        <div className='bg-white rounded-lg border p-4'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            실행 중인 서비스
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
            {server.services.map((service, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
              >
                <div>
                  <div className='font-medium'>{service.name}</div>
                  <div className='text-sm text-gray-600'>
                    포트 {service.port}
                  </div>
                </div>
                <div
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    service.status === 'running'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {service.status === 'running' ? '실행중' : '중지됨'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 시스템 정보 */}
      {server.systemInfo && (
        <div className='bg-white rounded-lg border p-4'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>
            시스템 정보
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>
                {server.systemInfo.os}
              </div>
              <div className='text-sm text-gray-600'>운영체제</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>
                {server.systemInfo.processes}
              </div>
              <div className='text-sm text-gray-600'>프로세스</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>
                {server.systemInfo.loadAverage}
              </div>
              <div className='text-sm text-gray-600'>부하 평균</div>
            </div>
            <div className='text-center'>
              <div className='text-lg font-semibold text-gray-900'>
                {server.systemInfo.uptime}
              </div>
              <div className='text-sm text-gray-600'>가동 시간</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
