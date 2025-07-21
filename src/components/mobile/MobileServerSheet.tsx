'use client';

import { motion } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { Drawer } from 'vaul';
import { useState } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CpuChipIcon,
  ServerIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import type { Server } from '../../types/server';
import { safeFormatUptime } from '../../utils/safeFormat';

interface MobileServerSheetProps {
  server: Server | null;
  servers: Server[];
  isOpen: boolean;
  onClose: () => void;
  onSwipeNext?: () => void;
  onSwipePrev?: () => void;
}

export default function MobileServerSheet({
  server,
  servers,
  isOpen,
  onClose,
  onSwipeNext,
  onSwipePrev,
}: MobileServerSheetProps) {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(
    null
  );

  // 현재 서버의 인덱스 찾기
  const currentIndex = server ? servers.findIndex(s => s.id === server.id) : -1;
  const hasNext = currentIndex < servers.length - 1;
  const hasPrev = currentIndex > 0;

  // 스와이프 제스처 처리
  const bind = useGesture({
    onDrag: ({ direction: [xDir], velocity: [xVel], active }) => {
      if (!active && Math.abs(xVel) > 0.5) {
        if (xDir > 0 && hasPrev && onSwipePrev) {
          setSwipeDirection('right');
          setTimeout(() => {
            onSwipePrev();
            setSwipeDirection(null);
          }, 150);
        } else if (xDir < 0 && hasNext && onSwipeNext) {
          setSwipeDirection('left');
          setTimeout(() => {
            onSwipeNext();
            setSwipeDirection(null);
          }, 150);
        }
      }
    },
  });

  if (!server) return null;

  // 서버 상태에 따른 색상
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'green';
      case 'warning':
        return 'yellow';
      case 'offline':
        return 'red';
      default:
        return 'gray';
    }
  };

  const statusColor = getStatusColor(server.status);

  return (
    <Drawer.Root open={isOpen} onOpenChange={open => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className='fixed inset-0 bg-black/40 z-[998]' />
        <Drawer.Content className='bg-white flex flex-col rounded-t-[10px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-[999] outline-none'>
          <div
            {...(bind as any)()}
            className='flex-1 overflow-hidden touch-pan-x'
          >
            <motion.div
              className='h-full'
              animate={{
                x:
                  swipeDirection === 'left'
                    ? -20
                    : swipeDirection === 'right'
                      ? 20
                      : 0,
                opacity: swipeDirection ? 0.7 : 1,
              }}
              transition={{ duration: 0.15 }}
            >
              {/* 드래그 핸들 */}
              <div className='flex justify-center p-4'>
                <div className='w-12 h-1.5 bg-gray-300 rounded-full'></div>
              </div>

              {/* 헤더 */}
              <div className='flex items-center justify-between px-4 pb-4'>
                <div className='flex items-center space-x-3'>
                  <div
                    className={`w-4 h-4 rounded-full bg-${statusColor}-500`}
                  ></div>
                  <div>
                    <h2 className='text-xl font-bold text-gray-900'>
                      {server.name}
                    </h2>
                    <p className='text-sm text-gray-500'>{server.location}</p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  {/* 네비게이션 버튼 */}
                  <button
                    onClick={onSwipePrev}
                    disabled={!hasPrev}
                    className='p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed'
                  >
                    <ChevronLeftIcon className='h-5 w-5' />
                  </button>

                  <span className='text-xs text-gray-500 px-2'>
                    {currentIndex + 1} / {servers.length}
                  </span>

                  <button
                    onClick={onSwipeNext}
                    disabled={!hasNext}
                    className='p-2 rounded-full hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed'
                  >
                    <ChevronRightIcon className='h-5 w-5' />
                  </button>

                  <button
                    onClick={onClose}
                    className='p-2 rounded-full hover:bg-gray-100'
                  >
                    <XMarkIcon className='h-5 w-5' />
                  </button>
                </div>
              </div>

              {/* 메트릭 카드들 */}
              <div className='px-4 pb-4'>
                <div className='grid grid-cols-3 gap-3 mb-6'>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className='bg-blue-50 rounded-lg p-4 text-center'
                  >
                    <CpuChipIcon className='h-6 w-6 text-blue-500 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-blue-600'>
                      {server.cpu}%
                    </div>
                    <div className='text-xs text-blue-500'>CPU 사용률</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className='bg-purple-50 rounded-lg p-4 text-center'
                  >
                    <ServerIcon className='h-6 w-6 text-purple-500 mx-auto mb-2' />
                    <div className='text-2xl font-bold text-purple-600'>
                      {server.memory}%
                    </div>
                    <div className='text-xs text-purple-500'>메모리</div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className='bg-orange-50 rounded-lg p-4 text-center'
                  >
                    <div className='w-6 h-6 mx-auto mb-2'>
                      <svg
                        className='w-6 h-6 text-orange-500'
                        fill='currentColor'
                        viewBox='0 0 20 20'
                      >
                        <path
                          fillRule='evenodd'
                          d='M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12z'
                          clipRule='evenodd'
                        />
                      </svg>
                    </div>
                    <div className='text-2xl font-bold text-orange-600'>
                      {server.disk}%
                    </div>
                    <div className='text-xs text-orange-500'>디스크</div>
                  </motion.div>
                </div>

                {/* 상세 정보 */}
                <div className='space-y-4'>
                  {/* 가동 시간 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className='bg-gray-50 rounded-lg p-4'
                  >
                    <div className='flex items-center space-x-3'>
                      <ClockIcon className='h-5 w-5 text-gray-500' />
                      <div>
                        <div className='text-sm font-medium text-gray-700'>
                          가동 시간
                        </div>
                        <div className='text-lg font-semibold text-gray-900'>
                          {safeFormatUptime(server.uptime)}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* 알림 */}
                  {(() => {
                    const alertCount =
                      typeof server.alerts === 'number'
                        ? server.alerts
                        : Array.isArray(server.alerts)
                          ? server.alerts.length
                          : 0;
                    return alertCount > 0;
                  })() && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 }}
                      className='bg-red-50 border border-red-200 rounded-lg p-4'
                    >
                      <div className='flex items-center space-x-3'>
                        <ExclamationTriangleIcon className='h-5 w-5 text-red-500' />
                        <div>
                          <div className='text-sm font-medium text-red-700'>
                            활성 알림
                          </div>
                          <div className='text-lg font-semibold text-red-900'>
                            {server.alerts}개
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 서비스 상태 */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className='bg-white border border-gray-200 rounded-lg p-4'
                  >
                    <h3 className='text-sm font-medium text-gray-700 mb-3'>
                      실행 중인 서비스
                    </h3>
                    <div className='space-y-2'>
                      {server.services?.map((service, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between'
                        >
                          <div className='flex items-center space-x-2'>
                            <div
                              className={`w-2 h-2 rounded-full ${
                                service.status === 'running'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`}
                            ></div>
                            <span className='text-sm text-gray-700'>
                              {service.name}
                            </span>
                          </div>
                          <div className='text-xs text-gray-500'>
                            {service.port > 0 ? `:${service.port}` : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* 스와이프 힌트 */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 }}
                    className='text-center py-4'
                  >
                    <p className='text-xs text-gray-400'>
                      ← 스와이프하여 다른 서버 보기 →
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
