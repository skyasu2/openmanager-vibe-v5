'use client';

import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Gauge,
  HardDrive,
  Info,
  MapPin,
  MemoryStick,
  Server as ServerIcon,
  Settings,
  Wifi,
  XCircle,
} from 'lucide-react';
import { Server } from '../../../types/server';

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
          icon: CheckCircle,
          text: '정상 운영',
          gradient: 'from-green-500 to-emerald-500',
        };
      case 'warning':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: AlertTriangle,
          text: '주의 필요',
          gradient: 'from-yellow-500 to-orange-500',
        };
      case 'critical':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: XCircle,
          text: '긴급 상황',
          gradient: 'from-red-500 to-pink-500',
        };
      case 'offline':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: XCircle,
          text: '오프라인',
          gradient: 'from-gray-500 to-slate-500',
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: Info,
          text: '알 수 없음',
          gradient: 'from-gray-500 to-slate-500',
        };
    }
  };

  const statusInfo = getStatusInfo(server.status);
  const StatusIcon = statusInfo.icon;

  // 🎯 알림 개수 안전하게 계산
  const alertCount =
    typeof server.alerts === 'number'
      ? server.alerts
      : Array.isArray(server.alerts)
        ? server.alerts.length
        : 0;

  // 🎯 리소스 사용률에 따른 색상과 상태
  const getResourceStatus = (value: number) => {
    if (value >= 90)
      return { color: 'text-red-600', bg: 'bg-red-100', status: '위험' };
    if (value >= 70)
      return { color: 'text-yellow-600', bg: 'bg-yellow-100', status: '주의' };
    if (value >= 50)
      return { color: 'text-blue-600', bg: 'bg-blue-100', status: '보통' };
    return { color: 'text-green-600', bg: 'bg-green-100', status: '양호' };
  };

  // 🎨 원형 진행률 바 컴포넌트
  const CircularProgress = ({
    value,
    size = 80,
    strokeWidth = 8,
    color = '#3b82f6',
  }: {
    value: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className='relative inline-flex items-center justify-center'>
        <svg width={size} height={size} className='transform -rotate-90'>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke='#e5e7eb'
            strokeWidth={strokeWidth}
            fill='transparent'
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill='transparent'
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap='round'
            className='transition-all duration-300 ease-in-out'
          />
        </svg>
        <div className='absolute inset-0 flex items-center justify-center'>
          <span className='text-lg font-bold text-gray-700'>{value}%</span>
        </div>
      </div>
    );
  };

  return (
    <div className='space-y-6'>
      {/* 🎯 서버 상태 요약 카드 */}
      <div
        className={`bg-gradient-to-r ${statusInfo.gradient} text-white rounded-xl p-6 shadow-lg`}
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='bg-white bg-opacity-20 rounded-lg p-3'>
              <StatusIcon className='w-8 h-8 text-white' />
            </div>
            <div>
              <h3 className='text-2xl font-bold'>{statusInfo.text}</h3>
              <p className='text-white text-opacity-90'>
                마지막 업데이트:{' '}
                {server.lastSeen
                  ? new Date(server.lastSeen).toLocaleString('ko-KR')
                  : '알 수 없음'}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <div className='text-white text-opacity-90 text-sm'>업타임</div>
            <div className='text-2xl font-bold'>{server.uptime || '0h 0m'}</div>
          </div>
        </div>
      </div>

      {/* 📊 리소스 사용률 - 원형 게이지 */}
      <div className='bg-white rounded-xl shadow-lg p-6'>
        <h3 className='text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2'>
          <Gauge className='w-5 h-5 text-blue-600' />
          실시간 리소스 모니터링
        </h3>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-6'>
          {/* CPU */}
          <div className='text-center'>
            <CircularProgress
              value={server.metrics?.cpu?.usage || server.cpu || 0}
              color={getResourceStatus(
                server.metrics?.cpu?.usage || server.cpu || 0
              ).color.replace('text-', '#')}
            />
            <div className='mt-3'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <Cpu className='w-4 h-4 text-gray-600' />
                <span className='font-semibold text-gray-900'>CPU</span>
              </div>
              <div className='text-sm text-gray-600'>
                {server.metrics?.cpu?.cores || 4}코어 •{' '}
                {server.metrics?.cpu?.temperature || 45}°C
              </div>
              <div
                className={`text-xs px-2 py-1 rounded-full mt-1 ${getResourceStatus(server.metrics?.cpu?.usage || server.cpu || 0).bg} ${getResourceStatus(server.metrics?.cpu?.usage || server.cpu || 0).color}`}
              >
                {
                  getResourceStatus(
                    server.metrics?.cpu?.usage || server.cpu || 0
                  ).status
                }
              </div>
            </div>
          </div>

          {/* 메모리 */}
          <div className='text-center'>
            <CircularProgress
              value={server.metrics?.memory?.usage || server.memory || 0}
              color={getResourceStatus(
                server.metrics?.memory?.usage || server.memory || 0
              ).color.replace('text-', '#')}
            />
            <div className='mt-3'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <MemoryStick className='w-4 h-4 text-gray-600' />
                <span className='font-semibold text-gray-900'>메모리</span>
              </div>
              <div className='text-sm text-gray-600'>
                {server.metrics?.memory?.used ||
                  Math.round(
                    ((server.specs?.memory_gb || 8) * (server.memory || 0)) /
                      100
                  )}
                GB /{' '}
                {server.metrics?.memory?.total || server.specs?.memory_gb || 8}
                GB
              </div>
              <div
                className={`text-xs px-2 py-1 rounded-full mt-1 ${getResourceStatus(server.metrics?.memory?.usage || server.memory || 0).bg} ${getResourceStatus(server.metrics?.memory?.usage || server.memory || 0).color}`}
              >
                {
                  getResourceStatus(
                    server.metrics?.memory?.usage || server.memory || 0
                  ).status
                }
              </div>
            </div>
          </div>

          {/* 디스크 */}
          <div className='text-center'>
            <CircularProgress
              value={server.metrics?.disk?.usage || server.disk || 0}
              color={getResourceStatus(
                server.metrics?.disk?.usage || server.disk || 0
              ).color.replace('text-', '#')}
            />
            <div className='mt-3'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <HardDrive className='w-4 h-4 text-gray-600' />
                <span className='font-semibold text-gray-900'>디스크</span>
              </div>
              <div className='text-sm text-gray-600'>
                {server.metrics?.disk?.used ||
                  Math.round(
                    ((server.specs?.disk_gb || 250) * (server.disk || 0)) / 100
                  )}
                GB /{' '}
                {server.metrics?.disk?.total || server.specs?.disk_gb || 250}GB
              </div>
              <div
                className={`text-xs px-2 py-1 rounded-full mt-1 ${getResourceStatus(server.metrics?.disk?.usage || server.disk || 0).bg} ${getResourceStatus(server.metrics?.disk?.usage || server.disk || 0).color}`}
              >
                {
                  getResourceStatus(
                    server.metrics?.disk?.usage || server.disk || 0
                  ).status
                }
              </div>
            </div>
          </div>

          {/* 네트워크 */}
          <div className='text-center'>
            <CircularProgress
              value={server.network || 0}
              color={getResourceStatus(server.network || 0).color.replace(
                'text-',
                '#'
              )}
            />
            <div className='mt-3'>
              <div className='flex items-center justify-center gap-1 mb-1'>
                <Wifi className='w-4 h-4 text-gray-600' />
                <span className='font-semibold text-gray-900'>네트워크</span>
              </div>
              <div className='text-sm text-gray-600'>
                {server.specs?.network_speed || '1Gbps'}
              </div>
              <div
                className={`text-xs px-2 py-1 rounded-full mt-1 ${getResourceStatus(server.network || 0).bg} ${getResourceStatus(server.network || 0).color}`}
              >
                {getResourceStatus(server.network || 0).status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 📋 서버 정보 그리드 */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* 기본 정보 */}
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <ServerIcon className='w-5 h-5 text-blue-600' />
            기본 정보
          </h3>
          <div className='space-y-4'>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>서버 ID</span>
              <span className='font-mono text-sm bg-gray-100 px-2 py-1 rounded'>
                {server.id}
              </span>
            </div>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>호스트명</span>
              <span className='font-medium'>
                {server.hostname || server.name}
              </span>
            </div>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>타입</span>
              <span className='capitalize bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm'>
                {server.type}
              </span>
            </div>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>환경</span>
              <span className='capitalize bg-green-100 text-green-800 px-2 py-1 rounded text-sm'>
                {server.environment || 'production'}
              </span>
            </div>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>위치</span>
              <span className='flex items-center gap-1'>
                <MapPin className='w-4 h-4 text-gray-500' />
                {server.location}
              </span>
            </div>
            <div className='flex justify-between items-center py-2'>
              <span className='text-gray-600 font-medium'>IP 주소</span>
              <span className='font-mono text-sm'>
                {server.ip || '192.168.1.100'}
              </span>
            </div>
          </div>
        </div>

        {/* 시스템 정보 */}
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Settings className='w-5 h-5 text-green-600' />
            시스템 정보
          </h3>
          <div className='space-y-4'>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>운영체제</span>
              <span className='font-medium'>
                {server.systemInfo?.os || server.os || 'Ubuntu 22.04 LTS'}
              </span>
            </div>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>프로세스</span>
              <span className='font-medium'>
                {server.systemInfo?.processes || '150'}개
              </span>
            </div>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>좀비 프로세스</span>
              <span className='font-medium text-red-600'>
                {server.systemInfo?.zombieProcesses || '0'}개
              </span>
            </div>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>부하 평균</span>
              <span className='font-mono text-sm'>
                {server.systemInfo?.loadAverage || '1.23, 1.45, 1.67'}
              </span>
            </div>
            <div className='flex justify-between items-center py-2 border-b border-gray-100'>
              <span className='text-gray-600 font-medium'>알림</span>
              <span
                className={`font-medium ${alertCount > 0 ? 'text-red-600' : 'text-green-600'}`}
              >
                {alertCount}개
              </span>
            </div>
            <div className='flex justify-between items-center py-2'>
              <span className='text-gray-600 font-medium'>공급자</span>
              <span className='font-medium'>{server.provider || 'AWS'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 🔧 실행 중인 서비스 */}
      {server.services && server.services.length > 0 && (
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Activity className='w-5 h-5 text-purple-600' />
            실행 중인 서비스 ({server.services.length}개)
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {server.services.map((service, index) => (
              <div
                key={index}
                className='flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:border-blue-300 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  <div
                    className={`w-3 h-3 rounded-full ${
                      service.status === 'running'
                        ? 'bg-green-500'
                        : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <div className='font-medium text-gray-900'>
                      {service.name}
                    </div>
                    <div className='text-sm text-gray-600'>
                      포트 :{service.port}
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
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

      {/* 📊 네트워크 정보 */}
      {server.networkInfo && (
        <div className='bg-white rounded-xl shadow-lg p-6'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Wifi className='w-5 h-5 text-orange-600' />
            네트워크 정보
          </h3>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-lg font-semibold text-gray-900'>
                {server.networkInfo.interface}
              </div>
              <div className='text-sm text-gray-600'>인터페이스</div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-lg font-semibold text-gray-900'>
                {server.networkInfo.receivedBytes}
              </div>
              <div className='text-sm text-gray-600'>수신 데이터</div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-lg font-semibold text-gray-900'>
                {server.networkInfo.sentBytes}
              </div>
              <div className='text-sm text-gray-600'>송신 데이터</div>
            </div>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-lg font-semibold text-gray-900'>
                {server.networkInfo.receivedErrors +
                  server.networkInfo.sentErrors}
              </div>
              <div className='text-sm text-gray-600'>총 오류</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
