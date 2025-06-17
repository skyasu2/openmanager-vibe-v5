/**
 * 🧠 AI 에이전트 실시간 추론 과정 시각화 컴포넌트
 *
 * - 사용자 질문에 AI가 응답하는 동안 추론 과정을 실시간 표시
 * - 단계별 thinking logs 시각화
 * - 진행률 및 현재 단계 강조 표시
 * - 부드러운 애니메이션과 사용자 친화적 UX
 */

'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  Cog,
  Target,
  MessageSquare,
  CheckCircle,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';
import { AgentLog } from '@/stores/useAISidebarStore';

interface ThinkingViewProps {
  isThinking: boolean;
  logs: AgentLog[];
  currentQuestion?: string;
  className?: string;
}

// 단계별 아이콘 매핑
const getStepIcon = (type: any) => {
  switch (type) {
    case 'analysis':
      return <Search className='w-4 h-4' />;
    case 'reasoning':
      return <Brain className='w-4 h-4' />;
    case 'data_processing':
      return <Cog className='w-4 h-4' />;
    case 'pattern_matching':
      return <Target className='w-4 h-4' />;
    case 'response_generation':
      return <MessageSquare className='w-4 h-4' />;
    default:
      return <Brain className='w-4 h-4' />;
  }
};

// 단계별 색상 매핑
const getStepColor = (type: any) => {
  switch (type) {
    case 'analysis':
      return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
    case 'reasoning':
      return 'text-purple-400 bg-purple-500/20 border-purple-500/30';
    case 'data_processing':
      return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'pattern_matching':
      return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    case 'response_generation':
      return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
    default:
      return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  }
};

// 단계명 한국어 매핑
const getStepName = (type: any) => {
  switch (type) {
    case 'analysis':
      return '상황 분석';
    case 'reasoning':
      return '논리적 추론';
    case 'data_processing':
      return '데이터 처리';
    case 'pattern_matching':
      return '패턴 매칭';
    case 'response_generation':
      return '응답 생성';
    default:
      return '처리 중';
  }
};

const ThinkingView: React.FC<ThinkingViewProps> = ({
  isThinking,
  logs,
  currentQuestion,
  className = '',
}) => {
  const [visibleLogs, setVisibleLogs] = useState<AgentLog[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');

  // 로그가 추가될 때마다 순차적으로 표시
  useEffect(() => {
    if (logs.length === 0) {
      setVisibleLogs([]);
      setCurrentStep('');
      return;
    }

    const timer = setTimeout(() => {
      setVisibleLogs(logs);
      const latestLog = logs[logs.length - 1];
      if (latestLog) {
        setCurrentStep((latestLog as any).step || '');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [logs]);

  if (!isThinking && logs.length === 0) {
    return null;
  }

  return (
    <div
      className={`bg-gray-900/50 border border-gray-700/50 rounded-lg p-4 ${className}`}
    >
      {/* 헤더 */}
      <div className='flex items-center gap-3 mb-4'>
        <div className='w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center'>
          {isThinking ? (
            <Loader2 className='w-4 h-4 text-white animate-spin' />
          ) : (
            <CheckCircle className='w-4 h-4 text-white' />
          )}
        </div>
        <div>
          <h3 className='text-white font-medium'>
            {isThinking ? 'AI가 생각하고 있습니다...' : '추론 과정 완료'}
          </h3>
          {currentQuestion && (
            <p className='text-gray-400 text-sm'>
              &ldquo;
              {currentQuestion.length > 50
                ? currentQuestion.substring(0, 50) + '...'
                : currentQuestion}
              &rdquo;
            </p>
          )}
        </div>
      </div>

      {/* 현재 진행 단계 */}
      {isThinking && currentStep && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='mb-4 p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg'
        >
          <div className='flex items-center gap-2'>
            <Loader2 className='w-4 h-4 text-purple-400 animate-spin' />
            <span className='text-purple-300 text-sm font-medium'>
              현재 단계: {currentStep}
            </span>
          </div>
        </motion.div>
      )}

      {/* 추론 로그 목록 */}
      <div className='space-y-2 max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600'>
        <AnimatePresence>
          {visibleLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getStepColor(log.type)}`}
            >
              {/* 단계 아이콘 */}
              <div className='flex-shrink-0 mt-0.5'>
                {getStepIcon(log.type)}
              </div>

              {/* 로그 내용 */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  <h4 className='text-sm font-medium text-white'>
                    {getStepName(log.type)}: {(log as any).step}
                  </h4>
                  {(log as any).progress && (
                    <div className='text-xs text-gray-400'>
                      {Math.round((log as any).progress * 100)}%
                    </div>
                  )}
                </div>

                <p className='text-sm text-gray-200 leading-relaxed'>
                  {(log as any).content || log.message}
                </p>

                {/* 메타데이터 */}
                <div className='flex items-center gap-3 mt-2 text-xs text-gray-400'>
                  <div className='flex items-center gap-1'>
                    <Clock className='w-3 h-3' />
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  {(log as any).duration && (
                    <div className='flex items-center gap-1'>
                      <Zap className='w-3 h-3' />
                      <span>
                        {(log as any).duration < 1000
                          ? `${(log as any).duration}ms`
                          : `${((log as any).duration / 1000).toFixed(1)}s`}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 로딩 인디케이터 (로그가 없을 때) */}
      {isThinking && visibleLogs.length === 0 && (
        <div className='flex items-center justify-center py-8'>
          <div className='flex items-center gap-3 text-gray-400'>
            <Loader2 className='w-5 h-5 animate-spin' />
            <span className='text-sm'>AI가 질문을 분석하고 있습니다...</span>
          </div>
        </div>
      )}

      {/* 완료 상태 요약 */}
      {!isThinking && visibleLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='mt-4 p-3 bg-green-500/20 border border-green-500/30 rounded-lg'
        >
          <div className='flex items-center gap-2 text-green-300'>
            <CheckCircle className='w-4 h-4' />
            <span className='text-sm font-medium'>
              추론 완료 - {visibleLogs.length}단계 처리됨
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ThinkingView;
