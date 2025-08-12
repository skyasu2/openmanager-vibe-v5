 
'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  ServerIcon,
  ExclamationTriangleIcon,
  SignalIcon,
  ClockIcon,
  MapPinIcon,
  CpuChipIcon,
  CircleStackIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/button';
import type { Server } from '@/types/server';

// 📱 모바일 서버 상세 시트 컴포넌트
interface MobileServerSheetProps {
  server: Server | null;
  isOpen: boolean;
  onClose: () => void;
}

// 상태별 색상 매핑
const statusColors = {
  online: 'text-green-600 bg-green-50',
  warning: 'text-yellow-600 bg-yellow-50', 
  offline: 'text-red-600 bg-red-50',
  healthy: 'text-blue-600 bg-blue-50',
  critical: 'text-red-600 bg-red-50',
} as const;

// 메트릭 카테고리별 색상
const metricColors = {
  cpu: 'text-blue-600 bg-blue-50',
  memory: 'text-green-600 bg-green-50',
  disk: 'text-purple-600 bg-purple-50',
  network: 'text-orange-600 bg-orange-50',
} as const;

export default function MobileServerSheet({
  server,
  isOpen,
  onClose,
}: MobileServerSheetProps) {
  // 🔄 메트릭 데이터 처리
  const metrics = useMemo(() => {
    if (!server) return [];

    return [
      {
        label: 'CPU 사용률',
        value: server.cpu,
        unit: '%',
        icon: CpuChipIcon,
        color: metricColors.cpu,
        status: server.cpu > 80 ? 'warning' : server.cpu > 60 ? 'medium' : 'good',
      },
      {
        label: '메모리 사용률',
        value: server.memory,
        unit: '%',
        icon: CircleStackIcon,
        color: metricColors.memory,
        status:
          server.memory > 85 ? 'warning' : server.memory > 70 ? 'medium' : 'good',
      },
      {
        label: '디스크 사용률',
        value: server.disk,
        unit: '%',
        icon: BuildingOffice2Icon,
        color: metricColors.disk,
        status: server.disk > 90 ? 'warning' : server.disk > 75 ? 'medium' : 'good',
      },
      {
        label: '네트워크',
        value: server.network || 0,
        unit: 'Mbps',
        icon: SignalIcon,
        color: metricColors.network,
        status: 'good',
      },
    ];
  }, [server]);

  // 🎨 애니메이션 변형
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const sheetVariants = {
    hidden: { y: '100%' },
    visible: { y: 0 },
    exit: { y: '100%' },
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  if (!server) return null;

  const alertCount = Array.isArray(server.alerts) ? server.alerts.length : (typeof server.alerts === 'number' ? server.alerts : 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className='fixed inset-0 z-50 lg:hidden'>
          {/* 배경 오버레이 */}
          <motion.div
            className='absolute inset-0 bg-black/50 backdrop-blur-sm'
            variants={backdropVariants}
            initial='hidden'
            animate='visible'
            exit='hidden'
            onClick={onClose}
          />

          {/* 시트 컨테이너 */}
          <motion.div
            className='absolute bottom-0 left-0 right-0 max-h-[90vh] overflow-hidden rounded-t-2xl bg-white shadow-2xl'
            variants={sheetVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300,
            }}
          >
            {/* 드래그 핸들 */}
            <div className='flex justify-center p-2'>
              <div className='h-1 w-12 rounded-full bg-gray-300' />
            </div>

            {/* 스크롤 가능한 콘텐츠 */}
            <div className='max-h-[calc(90vh-3rem)] overflow-y-auto'>
              <motion.div
                className='px-6 pb-8'
                variants={contentVariants}
                initial='hidden'
                animate='visible'
              >
                {/* 헤더 */}
                <motion.div
                  className='flex items-center justify-between border-b border-gray-100 pb-4'
                  variants={itemVariants}
                >
                  <div className='flex items-center space-x-3'>
                    <div
                      className={`rounded-lg p-2 ${
                        statusColors[server.status] || statusColors.offline
                      }`}
                    >
                      <ServerIcon className='h-6 w-6' />
                    </div>
                    <div>
                      <h2 className='text-xl font-bold text-gray-900'>
                        {server.name}
                      </h2>
                      <p className='text-sm text-gray-500'>
                        {server.hostname || server.id}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={onClose}
                    className='rounded-full p-2 hover:bg-gray-100'
                  >
                    <XMarkIcon className='h-5 w-5' />
                  </Button>
                </motion.div>

                {/* 서버 상태 */}
                <motion.div
                  className='mt-6 rounded-lg bg-gray-50 p-4'
                  variants={itemVariants}
                >
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium text-gray-700'>상태</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        statusColors[server.status] || statusColors.offline
                      }`}
                    >
                      {server.status === 'online' && '온라인'}
                      {server.status === 'warning' && '경고'}
                      {server.status === 'offline' && '오프라인'}
                      {server.status === 'healthy' && '정상'}
                      {server.status === 'critical' && '위험'}
                    </span>
                  </div>
                </motion.div>

                {/* 기본 정보 */}
                <motion.div
                  className='mt-6 grid grid-cols-2 gap-4'
                  variants={itemVariants}
                >
                  <div className='rounded-lg bg-gray-50 p-4'>
                    <div className='flex items-center space-x-3'>
                      <ClockIcon className='h-5 w-5 text-gray-500' />
                      <div>
                        <div className='text-sm font-medium text-gray-700'>
                          업타임
                        </div>
                        <div className='text-lg font-semibold text-gray-900'>
                          {typeof server.uptime === 'string'
                            ? server.uptime
                            : `${Math.floor(server.uptime / 24)}d ${Math.floor(
                                (server.uptime % 24) / 1
                              )}h`}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className='rounded-lg bg-gray-50 p-4'>
                    <div className='flex items-center space-x-3'>
                      <MapPinIcon className='h-5 w-5 text-gray-500' />
                      <div>
                        <div className='text-sm font-medium text-gray-700'>
                          위치
                        </div>
                        <div className='text-lg font-semibold text-gray-900'>
                          {server.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* 메트릭 카드들 */}
                <motion.div
                  className='mt-6 space-y-4'
                  variants={itemVariants}
                >
                  <h3 className='text-lg font-semibold text-gray-900'>
                    시스템 메트릭
                  </h3>
                  <div className='grid grid-cols-2 gap-4'>
                    {metrics.map((metric, index) => (
                      <motion.div
                        key={metric.label}
                        className='rounded-lg bg-white border border-gray-200 p-4 shadow-sm'
                        variants={itemVariants}
                        transition={{ delay: index * 0.05 }}
                      >
                        <div className='flex items-center space-x-3'>
                          <div className={`rounded-lg p-2 ${metric.color}`}>
                            <metric.icon className='h-5 w-5' />
                          </div>
                          <div className='flex-1'>
                            <div className='text-sm font-medium text-gray-700'>
                              {metric.label}
                            </div>
                            <div className='text-xl font-bold text-gray-900'>
                              {metric.value}
                              <span className='text-sm font-normal text-gray-500'>
                                {metric.unit}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 프로그레스 바 */}
                        <div className='mt-3'>
                          <div className='h-2 rounded-full bg-gray-200'>
                            <div
                              className={`h-2 rounded-full ${
                                metric.status === 'warning'
                                  ? 'bg-red-500'
                                  : metric.status === 'medium'
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(metric.value, 100)}%` }}
                            />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* 알림 정보 */}
                {alertCount > 0 && (
                  <motion.div
                    className='mt-6 rounded-lg bg-red-50 p-4'
                    variants={itemVariants}
                  >
                    <div className='flex items-center space-x-3'>
                      <ExclamationTriangleIcon className='h-5 w-5 text-red-500' />
                      <div>
                        <div className='text-sm font-medium text-red-700'>
                          활성 알림
                        </div>
                        <div className='text-lg font-semibold text-red-900'>
                          {alertCount}개
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 서비스 상태 */}
                {server.services && server.services.length > 0 && (
                  <motion.div
                    className='mt-6 space-y-4'
                    variants={itemVariants}
                  >
                    <h3 className='text-lg font-semibold text-gray-900'>
                      실행 중인 서비스
                    </h3>
                    <div className='space-y-3'>
                      {server.services.map((service, index) => (
                        <motion.div
                          key={`${service.name}-${service.port}`}
                          className='flex items-center justify-between rounded-lg bg-white border border-gray-200 p-3'
                          variants={itemVariants}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div>
                            <div className='font-medium text-gray-900'>
                              {service.name}
                            </div>
                            <div className='text-sm text-gray-500'>
                              포트: {service.port}
                            </div>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              service.status === 'running'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {service.status === 'running' ? '실행 중' : '중지됨'}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 최근 로그 */}
                {server.logs && server.logs.length > 0 && (
                  <motion.div
                    className='mt-6 space-y-4'
                    variants={itemVariants}
                  >
                    <h3 className='text-lg font-semibold text-gray-900'>
                      최근 로그
                    </h3>
                    <div className='space-y-2'>
                      {server.logs.slice(0, 5).map((log, index) => (
                        <motion.div
                          key={index}
                          className='rounded-lg bg-gray-50 p-3'
                          variants={itemVariants}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className='flex items-center justify-between'>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                                log.level === 'ERROR'
                                  ? 'bg-red-100 text-red-800'
                                  : log.level === 'WARN'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : log.level === 'INFO'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {log.level}
                            </span>
                            <span className='text-xs text-gray-500'>
                              {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className='mt-2 text-sm text-gray-700'>
                            {log.message}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 액션 버튼들 */}
                <motion.div
                  className='mt-8 space-y-3'
                  variants={itemVariants}
                >
                  <Button className='w-full' size='lg'>
                    상세 정보 보기
                  </Button>
                  <Button variant='outline' className='w-full' size='lg'>
                    로그 다운로드
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}