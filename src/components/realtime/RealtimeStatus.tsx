/**
 * 🔄 실시간 연결 상태 표시 컴포넌트
 *
 * Phase 7.3: 실시간 데이터 통합
 * - WebSocket 연결 상태 시각화
 * - 실시간 데이터 수신 표시
 * - 연결 문제 알림 및 재연결 버튼
 */

'use client';

import { useRealtimeData } from '@/hooks/api/useRealtimeQueries';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle, RefreshCw, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

interface RealtimeStatusProps {
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

export default function RealtimeStatus({
  compact = false,
  showDetails = true,
  className = '',
}: RealtimeStatusProps) {
  const {
    servers,
    predictions,
    overallStatus,
    reconnectAll,
    isFullyConnected,
  } = useRealtimeData();
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());
  const [showReconnectButton, setShowReconnectButton] = useState(false);

  // 📊 연결 상태별 스타일
  const getStatusConfig = () => {
    switch (overallStatus) {
      case 'connected':
        return {
          icon: CheckCircle,
          color: 'text-green-500',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          text: '실시간 연결됨',
          pulse: true,
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          text: '연결 중...',
          pulse: false,
          spin: true,
        };
      case 'disconnected':
        return {
          icon: WifiOff,
          color: 'text-red-500',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          text: '연결 끊김',
          pulse: false,
        };
      default:
        return {
          icon: AlertCircle,
          color: 'text-gray-500',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          text: '상태 불명',
          pulse: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  // 🔄 마지막 업데이트 시간 갱신
  useEffect(() => {
    if (isFullyConnected) {
      setLastUpdateTime(new Date());
      setShowReconnectButton(false);
      return undefined;
    } else {
      // 5초 후 재연결 버튼 표시
      const timer = setTimeout(() => setShowReconnectButton(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [isFullyConnected]);

  // 🎨 컴팩트 모드 렌더링
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className='relative'>
          <Icon
            className={`w-4 h-4 ${config.color} ${config.spin ? 'animate-spin' : ''}`}
          />
          {config.pulse && (
            <motion.div
              className='absolute inset-0 w-4 h-4 rounded-full bg-green-400 opacity-30'
              animate={{ scale: [1, 1.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}
        </div>
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${className}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center space-x-3'>
          <div className='relative'>
            <Icon
              className={`w-5 h-5 ${config.color} ${config.spin ? 'animate-spin' : ''}`}
            />
            {config.pulse && (
              <motion.div
                className='absolute inset-0 w-5 h-5 rounded-full bg-green-400 opacity-30'
                animate={{ scale: [1, 1.8, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${config.color}`}>실시간 모니터링</h3>
            <p className='text-sm text-gray-600'>{config.text}</p>
          </div>
        </div>

        {/* 재연결 버튼 */}
        <AnimatePresence>
          {showReconnectButton && !isFullyConnected && (
            <motion.button
              onClick={reconnectAll}
              className='px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              재연결
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* 상세 정보 */}
      {showDetails && (
        <div className='space-y-2'>
          {/* 연결 상태 세부사항 */}
          <div className='grid grid-cols-2 gap-4 text-sm'>
            <div className='flex items-center justify-between'>
              <span className='text-gray-600'>서버 모니터링:</span>
              <div className='flex items-center space-x-1'>
                {servers.isConnected ? (
                  <CheckCircle className='w-4 h-4 text-green-500' />
                ) : (
                  <WifiOff className='w-4 h-4 text-red-500' />
                )}
                <span
                  className={
                    servers.isConnected ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {servers.isConnected ? '연결됨' : '끊김'}
                </span>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-gray-600'>AI 예측:</span>
              <div className='flex items-center space-x-1'>
                {predictions.isConnected ? (
                  <CheckCircle className='w-4 h-4 text-green-500' />
                ) : (
                  <WifiOff className='w-4 h-4 text-red-500' />
                )}
                <span
                  className={
                    predictions.isConnected ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {predictions.isConnected ? '연결됨' : '끊김'}
                </span>
              </div>
            </div>
          </div>

          {/* 마지막 업데이트 시간 */}
          {isFullyConnected && (
            <div className='pt-2 border-t border-gray-200'>
              <div className='flex items-center justify-between text-xs text-gray-500'>
                <span>마지막 업데이트:</span>
                <span>{lastUpdateTime.toLocaleTimeString()}</span>
              </div>
            </div>
          )}

          {/* 재연결 시도 횟수 */}
          {servers.reconnectAttempts > 0 && (
            <div className='text-xs text-yellow-600'>
              재연결 시도: {servers.reconnectAttempts}/5
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// 🎯 플로팅 상태 표시기 (화면 우하단)
export function FloatingRealtimeStatus() {
  const [isMinimized, setIsMinimized] = useState(true);

  return (
    <motion.div
      className='fixed bottom-4 right-4 z-50'
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.5 }}
    >
      <AnimatePresence mode='wait'>
        {isMinimized ? (
          <motion.button
            key='minimized'
            onClick={() => setIsMinimized(false)}
            className='bg-white shadow-lg rounded-full p-3 hover:shadow-xl transition-all'
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <RealtimeStatus compact />
          </motion.button>
        ) : (
          <motion.div
            key='expanded'
            className='bg-white shadow-xl rounded-lg border'
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
          >
            <div className='flex items-center justify-between p-2 border-b'>
              <span className='text-sm font-medium text-gray-700'>
                실시간 상태
              </span>
              <button
                onClick={() => setIsMinimized(true)}
                className='text-gray-400 hover:text-gray-600'
                title='실시간 상태 최소화'
                aria-label='실시간 상태 최소화'
              >
                <svg
                  className='w-4 h-4'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                    clipRule='evenodd'
                  />
                </svg>
              </button>
            </div>
            <div className='p-4'>
              <RealtimeStatus compact={false} showDetails />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
