/**
 * 🚀 MCP 서버 Wake-up 상태 표시 컴포넌트
 *
 * Render 무료 플랜의 Cold Start 과정을 사용자에게 시각적으로 표시
 * - 실시간 진행상황 표시
 * - 예상 소요시간 안내
 * - 단계별 상태 표시
 */

'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  Loader2,
  Server,
  Wifi,
  XCircle,
} from 'lucide-react';

interface MCPWakeupProgress {
  stage: 'connecting' | 'waking' | 'ready' | 'timeout' | 'error';
  message: string;
  progress: number;
  elapsedTime: number;
  estimatedRemaining?: number;
}

interface MCPWakeupStatusProps {
  wakeupStatus: {
    isInProgress: boolean;
    stage: MCPWakeupProgress['stage'] | null;
    message: string;
    progress: number;
    elapsedTime: number;
    estimatedRemaining?: number;
  };
  className?: string;
}

export function MCPWakeupStatus({
  wakeupStatus,
  className = '',
}: MCPWakeupStatusProps) {
  const {
    isInProgress,
    stage,
    message,
    progress,
    elapsedTime,
    estimatedRemaining,
  } = wakeupStatus;

  // Wake-up이 진행 중이 아니면 표시하지 않음
  if (!isInProgress && !stage) {
    return null;
  }

  // 단계별 아이콘 매핑
  const getStageIcon = () => {
    switch (stage) {
      case 'connecting':
        return <Wifi className='w-5 h-5 text-blue-400' />;
      case 'waking':
        return <Loader2 className='w-5 h-5 text-yellow-400 animate-spin' />;
      case 'ready':
        return <CheckCircle className='w-5 h-5 text-green-400' />;
      case 'timeout':
      case 'error':
        return <XCircle className='w-5 h-5 text-red-400' />;
      default:
        return <Server className='w-5 h-5 text-gray-400' />;
    }
  };

  // 단계별 색상 매핑
  const getStageColor = () => {
    switch (stage) {
      case 'connecting':
        return 'from-blue-500 to-blue-600';
      case 'waking':
        return 'from-yellow-500 to-orange-500';
      case 'ready':
        return 'from-green-500 to-emerald-500';
      case 'timeout':
      case 'error':
        return 'from-red-500 to-red-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  // 시간 포맷팅
  const formatTime = (ms: number) => {
    const seconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}분 ${remainingSeconds}초`;
    }
    return `${seconds}초`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg p-4 ${className}`}
    >
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-3'>
        <div className='flex items-center space-x-2'>
          {getStageIcon()}
          <span className='text-white font-medium'>MCP 서버 Wake-up</span>
        </div>

        {/* 경과 시간 */}
        <div className='flex items-center space-x-1 text-gray-400 text-sm'>
          <Clock className='w-4 h-4' />
          <span>{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* 진행률 바 */}
      <div className='mb-3'>
        <div className='flex justify-between items-center mb-1'>
          <span className='text-sm text-gray-300'>진행률</span>
          <span className='text-sm text-gray-300'>{Math.round(progress)}%</span>
        </div>

        <div className='w-full bg-gray-700 rounded-full h-2'>
          <motion.div
            className={`h-2 rounded-full bg-gradient-to-r ${getStageColor()}`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* 상태 메시지 */}
      <div className='mb-3'>
        <p className='text-sm text-gray-300'>{message}</p>
      </div>

      {/* 예상 남은 시간 (진행 중일 때만) */}
      {isInProgress && estimatedRemaining && estimatedRemaining > 0 && (
        <div className='flex items-center justify-between text-xs text-gray-400'>
          <span>예상 남은 시간:</span>
          <span>{formatTime(estimatedRemaining)}</span>
        </div>
      )}

      {/* 단계별 안내 메시지 */}
      {stage === 'waking' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='mt-3 p-2 bg-yellow-900/20 border border-yellow-700/30 rounded text-xs text-yellow-300'
        >
          💡 Render 무료 플랜의 Cold Start로 인해 최대 3분까지 소요될 수
          있습니다.
        </motion.div>
      )}

      {/* 에러 상태 안내 */}
      {(stage === 'timeout' || stage === 'error') && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='mt-3 p-2 bg-red-900/20 border border-red-700/30 rounded text-xs text-red-300'
        >
          ⚠️ MCP 서버 연결에 실패했지만 로컬 모드로 계속 진행됩니다.
        </motion.div>
      )}

      {/* 성공 상태 안내 */}
      {stage === 'ready' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='mt-3 p-2 bg-green-900/20 border border-green-700/30 rounded text-xs text-green-300'
        >
          ✅ MCP 서버가 성공적으로 활성화되었습니다!
        </motion.div>
      )}
    </motion.div>
  );
}

export default MCPWakeupStatus;
