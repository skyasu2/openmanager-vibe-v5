/**
 * 🧠 AI 에이전트 실시간 추론 과정 시각화 컴포넌트
 *
 * - 사용자 질문에 AI가 응답하는 동안 추론 과정을 실시간 표시
 * - 단계별 thinking logs 시각화
 * - 진행률 및 현재 단계 강조 표시
 * - 부드러운 애니메이션과 사용자 친화적 UX
 * - 🕐 30초씩 단계별 대기, 전체 1분 타임아웃 (사용자 요청)
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
  AlertTriangle,
} from 'lucide-react';
import { AgentLog } from '@/stores/useAISidebarStore';

// 타이핑 애니메이션 컴포넌트
const TypingText: React.FC<{ text: string; speed?: number }> = ({
  text,
  speed = 25,
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text, speed]);

  useEffect(() => {
    setDisplayedText('');
    setCurrentIndex(0);
  }, [text]);

  return (
    <span>
      {displayedText}
      {currentIndex < text.length && (
        <span className='animate-pulse text-blue-400'>|</span>
      )}
    </span>
  );
};

interface ThinkingViewProps {
  isThinking: boolean;
  logs: AgentLog[];
  currentQuestion?: string;
  className?: string;
  // 🕐 타임아웃 설정 추가
  stepTimeout?: number; // 기본 30초
  totalTimeout?: number; // 기본 60초
}

// 단계별 아이콘 매핑 (AI 엔진별 구분 추가)
const getStepIcon = (type: any, engine?: string) => {
  // 엔진별 아이콘 우선 적용
  if (engine) {
    switch (engine.toLowerCase()) {
      case 'mcp':
        return <Search className='w-4 h-4 text-blue-400' />;
      case 'rag':
        return <Target className='w-4 h-4 text-green-400' />;
      case 'google-ai':
        return <Zap className='w-4 h-4 text-purple-400' />;
      case 'unified':
        return <Brain className='w-4 h-4 text-orange-400' />;
      case 'local':
        return <Cog className='w-4 h-4 text-gray-400' />;
    }
  }

  // 기존 타입별 아이콘
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

// 단계별 색상 매핑 (AI 엔진별 구분 추가)
const getStepColor = (type: any, engine?: string) => {
  // 엔진별 색상 우선 적용
  if (engine) {
    switch (engine.toLowerCase()) {
      case 'mcp':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'rag':
        return 'text-green-400 bg-green-500/10 border-green-500/20';
      case 'google-ai':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'unified':
        return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'local':
        return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
    }
  }

  // 기존 타입별 색상
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
  stepTimeout = 30000, // 🕐 30초 기본값
  totalTimeout = 60000, // 🕐 1분 기본값
}) => {
  const [visibleLogs, setVisibleLogs] = useState<AgentLog[]>([]);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [thinkingStartTime, setThinkingStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isTimeout, setIsTimeout] = useState<boolean>(false);

  // 경과 시간 추적
  useEffect(() => {
    if (isThinking) {
      if (thinkingStartTime === 0) {
        setThinkingStartTime(Date.now());
      }

      const timer = setInterval(() => {
        const elapsed = Date.now() - (thinkingStartTime || Date.now());
        setElapsedTime(elapsed);

        // 전체 타임아웃 체크 (1분)
        if (elapsed >= totalTimeout) {
          setIsTimeout(true);
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    } else {
      setThinkingStartTime(0);
      setElapsedTime(0);
      setIsTimeout(false);
    }
  }, [isThinking, thinkingStartTime, totalTimeout]);

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

  // 시간 포맷팅 함수
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    return `${seconds}초`;
  };

  // 진행률 계산 (전체 타임아웃 기준)
  const progressPercentage = Math.min((elapsedTime / totalTimeout) * 100, 100);

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
          {isTimeout ? (
            <AlertTriangle className='w-4 h-4 text-yellow-300' />
          ) : isThinking ? (
            <Loader2 className='w-4 h-4 text-white animate-spin' />
          ) : (
            <CheckCircle className='w-4 h-4 text-white' />
          )}
        </div>
        <div className='flex-1'>
          <div className='flex items-center justify-between'>
            <h3 className='text-white font-medium'>
              {isTimeout
                ? 'AI 응답 타임아웃 (폴백 처리됨)'
                : isThinking
                  ? 'AI가 생각하고 있습니다...'
                  : '추론 과정 완료'}
            </h3>
            {isThinking && (
              <div className='flex items-center gap-2 text-sm text-gray-400'>
                <Clock className='w-3 h-3' />
                <span>
                  {formatTime(elapsedTime)} / {formatTime(totalTimeout)}
                </span>
              </div>
            )}
          </div>
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

      {/* 진행률 바 (전체 타임아웃 기준) */}
      {isThinking && (
        <div className='mb-4'>
          <div className='flex items-center justify-between text-xs text-gray-400 mb-1'>
            <span>전체 진행률</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className='w-full bg-gray-700 rounded-full h-2'>
            <div
              className={`h-2 rounded-full transition-all duration-1000 ${
                progressPercentage > 80
                  ? 'bg-gradient-to-r from-yellow-500 to-red-500'
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* 현재 진행 단계 */}
      {isThinking && currentStep && !isTimeout && (
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
            <div className='ml-auto text-xs text-purple-400'>
              최대 {formatTime(stepTimeout)} 대기
            </div>
          </div>
        </motion.div>
      )}

      {/* 타임아웃 경고 */}
      {isTimeout && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className='mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-red-500/20 border border-yellow-500/30 rounded-lg'
        >
          <div className='flex items-center gap-2'>
            <AlertTriangle className='w-4 h-4 text-yellow-400' />
            <span className='text-yellow-300 text-sm font-medium'>
              응답 시간이 {formatTime(totalTimeout)}를 초과하여 폴백
              처리되었습니다
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
              className={`flex items-start gap-3 p-2.5 rounded-lg border ${getStepColor(log.type, (log as any).engine)}`}
            >
              {/* 단계 아이콘 */}
              <div className='flex-shrink-0 mt-0.5'>
                {getStepIcon(log.type, (log as any).engine)}
              </div>

              {/* 로그 내용 */}
              <div className='flex-1 min-w-0'>
                <div className='flex items-center gap-2 mb-1'>
                  {(log as any).engine && (
                    <span className='text-xs font-medium text-white bg-gray-700/50 px-2 py-0.5 rounded'>
                      {(log as any).engine}
                    </span>
                  )}
                  <h4 className='text-sm font-medium text-white'>
                    {getStepName(log.type)}: {(log as any).step}
                  </h4>
                  {(log as any).progress && (
                    <div className='text-xs text-gray-400'>
                      {Math.round((log as any).progress * 100)}%
                    </div>
                  )}
                </div>

                {/* 타이핑 애니메이션으로 사고 과정 표시 */}
                <div className='text-sm text-gray-200 leading-relaxed'>
                  <TypingText
                    text={(log as any).content || log.message}
                    speed={25}
                  />
                </div>

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
                  {/* 단계별 타임아웃 표시 */}
                  {isThinking && index === visibleLogs.length - 1 && (
                    <div className='flex items-center gap-1 text-purple-400'>
                      <AlertTriangle className='w-3 h-3' />
                      <span>최대 {formatTime(stepTimeout)}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 로딩 인디케이터 (로그가 없을 때) */}
      {isThinking && visibleLogs.length === 0 && !isTimeout && (
        <div className='flex items-center justify-center py-8'>
          <div className='flex items-center gap-3 text-gray-400'>
            <Loader2 className='w-5 h-5 animate-spin' />
            <span className='text-sm'>
              AI가 질문을 분석하고 있습니다... (최대 {formatTime(totalTimeout)}{' '}
              대기)
            </span>
          </div>
        </div>
      )}

      {/* 완료 상태 요약 */}
      {!isThinking && visibleLogs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`mt-4 p-3 rounded-lg ${
            isTimeout
              ? 'bg-yellow-500/20 border border-yellow-500/30'
              : 'bg-green-500/20 border border-green-500/30'
          }`}
        >
          <div
            className={`flex items-center gap-2 ${
              isTimeout ? 'text-yellow-300' : 'text-green-300'
            }`}
          >
            {isTimeout ? (
              <AlertTriangle className='w-4 h-4' />
            ) : (
              <CheckCircle className='w-4 h-4' />
            )}
            <span className='text-sm font-medium'>
              {isTimeout
                ? `타임아웃 처리 완료 - ${visibleLogs.length}단계 처리됨 (${formatTime(elapsedTime)})`
                : `추론 완료 - ${visibleLogs.length}단계 처리됨 (${formatTime(elapsedTime)})`}
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ThinkingView;
