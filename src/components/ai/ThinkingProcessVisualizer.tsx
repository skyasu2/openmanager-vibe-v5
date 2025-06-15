/**
 * ThinkingProcessVisualizer Component
 *
 * 🧠 AI 사고 과정 실시간 시각화 컴포넌트
 * - 단계별 진행 상황 표시
 * - 실시간 로그 스트림
 * - 애니메이션 효과
 */

/* eslint-disable */
// @ts-nocheck

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Search,
  Cpu,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Clock,
  Zap,
  Eye,
} from 'lucide-react';
import { AIThinkingStep, ThinkingProcessState } from '@/types/ai-thinking';

interface ThinkingProcessVisualizerProps {
  thinkingState: ThinkingProcessState;
  isActive: boolean;
  onStepComplete?: (step: AIThinkingStep) => void;
  showSubSteps?: boolean;
  animate?: boolean;
}

const stepIcons = {
  analyzing: Search,
  processing: Cpu,
  reasoning: Brain,
  generating: FileText,
  completed: CheckCircle,
  error: AlertTriangle,
};

const stepColors = {
  analyzing: 'text-blue-500 bg-blue-50',
  processing: 'text-purple-500 bg-purple-50',
  reasoning: 'text-green-500 bg-green-50',
  generating: 'text-orange-500 bg-orange-50',
  completed: 'text-emerald-500 bg-emerald-50',
  error: 'text-red-500 bg-red-50',
};

export const ThinkingProcessVisualizer: React.FC<
  ThinkingProcessVisualizerProps
> = ({
  thinkingState,
  isActive,
  onStepComplete,
  showSubSteps = true,
  animate = true,
}) => {
  const [visibleSteps, setVisibleSteps] = useState<AIThinkingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // 단계 업데이트 처리
  useEffect(() => {
    if (thinkingState.steps.length > visibleSteps.length) {
      const newSteps = thinkingState.steps.slice(visibleSteps.length);

      newSteps.forEach((step, index) => {
        setTimeout(() => {
          setVisibleSteps(prev => [...prev, step]);
          if (onStepComplete) {
            onStepComplete(step);
          }
        }, index * 500); // 0.5초 간격으로 단계적 표시
      });
    }
  }, [thinkingState.steps, visibleSteps.length, onStepComplete]);

  // 현재 단계 인덱스 업데이트
  useEffect(() => {
    setCurrentStepIndex(thinkingState.currentStepIndex);
  }, [thinkingState.currentStepIndex]);

  // 진행률 계산
  const overallProgress =
    thinkingState.steps.length > 0
      ? Math.round((currentStepIndex / thinkingState.steps.length) * 100)
      : 0;

  // 단계 애니메이션 설정
  const stepVariants = {
    hidden: {
      opacity: 0,
      x: -20,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      },
    },
    completed: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        yoyo: 1,
      },
    },
  };

  // 진행률 바 애니메이션
  const progressVariants = {
    initial: { width: 0 },
    animate: {
      width: `${overallProgress}%`,
      transition: {
        duration: 0.8,
        ease: 'easeInOut',
      },
    },
  };

  // 펄스 애니메이션 (활성 단계용)
  const pulseVariants = {
    pulse: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const formatDuration = useCallback((ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }, []);

  if (!isActive && visibleSteps.length === 0) {
    return (
      <div className='flex items-center justify-center p-8 text-gray-500 text-sm'>
        <Brain className='w-5 h-5 mr-2' />
        AI 사고 과정을 시작해주세요
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 전체 진행률 헤더 */}
      <div className='space-y-3'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center space-x-2'>
            <Brain className='w-5 h-5 text-indigo-600' />
            <span className='font-medium text-gray-900'>AI 사고 과정</span>
            {isActive && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className='w-4 h-4 text-blue-500' />
              </motion.div>
            )}
          </div>
          <div className='text-sm text-gray-600'>
            {currentStepIndex}/{thinkingState.steps.length} 단계
          </div>
        </div>

        {/* 전체 진행률 바 */}
        <div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
          <motion.div
            className='h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full'
            variants={progressVariants}
            initial='initial'
            animate='animate'
          />
        </div>

        <div className='flex justify-between text-xs text-gray-500'>
          <span>진행률: {overallProgress}%</span>
          {thinkingState.startTime && (
            <span>
              <Clock className='w-3 h-3 inline mr-1' />
              {formatDuration(Date.now() - thinkingState.startTime.getTime())}
            </span>
          )}
        </div>
      </div>

      {/* 단계별 상세 표시 */}
      <div className='space-y-3 max-h-96 overflow-y-auto'>
        <AnimatePresence>
          {visibleSteps.map((step, index) => {
            const StepIcon = stepIcons[step.type] || Brain;
            const isCurrentStep = index === currentStepIndex && isActive;
            const isCompleted =
              step.type === 'completed' || index < currentStepIndex;

            return (
              <motion.div
                key={step.id}
                variants={stepVariants}
                initial='hidden'
                animate={isCompleted ? 'completed' : 'visible'}
                exit='hidden'
                className={`p-3 rounded-lg border ${stepColors[step.type] || 'text-gray-500 bg-gray-50'} 
                  ${isCurrentStep ? 'ring-2 ring-indigo-200 ring-opacity-50' : ''}`}
              >
                <div className='flex items-start space-x-3'>
                  <motion.div
                    variants={isCurrentStep ? pulseVariants : {}}
                    animate={isCurrentStep ? 'pulse' : ''}
                    className={`p-2 rounded-full ${stepColors[step.type]}`}
                  >
                    <StepIcon className='w-4 h-4' />
                  </motion.div>

                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between mb-1'>
                      <h4 className='font-medium text-sm text-gray-900'>
                        {step.title}
                      </h4>
                      {step.duration && (
                        <span className='text-xs text-gray-500'>
                          {formatDuration(step.duration)}
                        </span>
                      )}
                    </div>

                    <p className='text-sm text-gray-600 mb-2'>
                      {step.description}
                    </p>

                    {/* 단계별 진행률 */}
                    <div className='w-full bg-white bg-opacity-50 rounded-full h-1.5 mb-2'>
                      <motion.div
                        className='h-full bg-current rounded-full opacity-70'
                        initial={{ width: 0 }}
                        animate={{ width: `${step.progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>

                    {/* 서브 스텝 */}
                    {showSubSteps &&
                      step.subSteps &&
                      step.subSteps.length > 0 && (
                        <div className='mt-2 space-y-1'>
                          {step.subSteps.map((subStep, subIndex) => (
                            <motion.div
                              key={subIndex}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              transition={{ delay: subIndex * 0.1 }}
                              className='text-xs text-gray-500 flex items-center pl-2 border-l-2 border-current border-opacity-20'
                            >
                              <Eye className='w-3 h-3 mr-1 opacity-50' />
                              {subStep}
                            </motion.div>
                          ))}
                        </div>
                      )}

                    {/* 메타데이터 */}
                    {step.metadata && Object.keys(step.metadata).length > 0 && (
                      <details className='mt-2'>
                        <summary className='text-xs text-gray-400 cursor-pointer hover:text-gray-600'>
                          상세 정보
                        </summary>
                        <div className='mt-1 text-xs text-gray-500 bg-white bg-opacity-30 p-2 rounded'>
                          {Object.entries(step.metadata).map(([key, value]) => (
                            <div key={key} className='flex justify-between'>
                              <span className='font-medium'>{key}:</span>
                              <span>{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 활성 상태 인디케이터 */}
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className='flex items-center justify-center p-3 bg-blue-50 rounded-lg border border-blue-200'
        >
          <Zap className='w-4 h-4 text-blue-500 mr-2' />
          <span className='text-sm text-blue-700 font-medium'>
            AI가 사고 중입니다...
          </span>
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className='ml-2'
          >
            <div className='w-2 h-2 bg-blue-500 rounded-full' />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

// 기본 내보내기
export default ThinkingProcessVisualizer;
