/**
 * 🧠 ThinkingProcessVisualizer Component
 * AI 사고 과정을 실시간으로 시각화하는 컴포넌트
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Activity,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Zap,
  ChevronRight,
} from 'lucide-react';
import { AIThinkingStep } from '@/types/ai-thinking';

interface ThinkingProcessVisualizerProps {
  steps: AIThinkingStep[];
  isActive?: boolean;
  className?: string;
}

// 단계 타입별 스타일 매핑
const stepTypeConfig: Record<
  AIThinkingStep['type'],
  { icon: React.ComponentType<any>; color: string; label: string }
> = {
  analyzing: {
    icon: Eye,
    color: 'text-blue-500 bg-blue-50',
    label: '분석 중',
  },
  processing: {
    icon: Cpu,
    color: 'text-purple-500 bg-purple-50',
    label: '처리 중',
  },
  reasoning: {
    icon: Brain,
    color: 'text-indigo-500 bg-indigo-50',
    label: '추론 중',
  },
  generating: {
    icon: Sparkles,
    color: 'text-yellow-500 bg-yellow-50',
    label: '생성 중',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500 bg-green-50',
    label: '완료',
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-500 bg-red-50',
    label: '오류',
  },
};

export const ThinkingProcessVisualizer: React.FC<
  ThinkingProcessVisualizerProps
> = ({ steps, isActive = false, className = '' }) => {
  const [visibleSteps, setVisibleSteps] = useState<AIThinkingStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // 새로운 단계가 추가될 때 애니메이션
    if (steps.length > visibleSteps.length) {
      const timer = setTimeout(() => {
        setVisibleSteps(steps);
        setCurrentStepIndex(steps.length - 1);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined; // 명시적 반환
  }, [steps, visibleSteps.length]);

  // 최근 3개 단계만 표시 (스크롤 방지)
  const displaySteps = visibleSteps.slice(-3);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 헤더 */}
      <div className='flex items-center justify-between mb-2'>
        <div className='flex items-center space-x-2'>
          <Activity className='w-4 h-4 text-gray-500' />
          <span className='text-sm font-medium text-gray-700'>
            AI 사고 과정
          </span>
        </div>
        {isActive && (
          <Loader2 className='w-4 h-4 text-blue-500 animate-spin' />
        )}
      </div>

      {/* 사고 단계 리스트 */}
      <div className='space-y-2'>
        <AnimatePresence mode='sync'>
          {displaySteps.map((step, stepIndex) => {
            const config = stepTypeConfig[step.type];
            const Icon = config.icon;
            const isCurrentStep = stepIndex === displaySteps.length - 1;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className={`relative ${isCurrentStep && isActive ? 'z-10' : ''}`}
              >
                <div
                  className={`flex items-start space-x-3 p-3 rounded-lg border ${
                    isCurrentStep && isActive
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* 아이콘 */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${config.color}`}
                  >
                    <Icon className='w-4 h-4' />
                  </div>

                  {/* 콘텐츠 */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <h4 className='text-sm font-medium text-gray-800'>
                          {step.title}
                        </h4>
                        <p className='text-xs text-gray-600 mt-0.5'>
                          {step.description}
                        </p>
                      </div>
                      <span className='text-xs text-gray-400 ml-2'>
                        {config.label}
                      </span>
                    </div>

                    {/* 진행률 표시 */}
                    {step.progress > 0 && step.progress < 100 && (
                      <div className='mt-2'>
                        <div className='w-full bg-gray-200 rounded-full h-1'>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${step.progress}%` }}
                            transition={{ duration: 0.3 }}
                            className='bg-blue-500 h-1 rounded-full'
                          />
                        </div>
                      </div>
                    )}

                    {/* 소요 시간 */}
                    {step.duration && (
                      <div className='flex items-center mt-1 text-xs text-gray-400'>
                        <ChevronRight className='w-3 h-3 mr-1' />
                        {(step.duration / 1000).toFixed(1)}초
                      </div>
                    )}

                    {/* 세부 단계 */}
                    {step.subSteps && step.subSteps.length > 0 && (
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
                    {step.metadata &&
                      Object.keys(step.metadata).length > 0 && (
                        <details className='mt-2'>
                          <summary className='text-xs text-gray-400 cursor-pointer hover:text-gray-600'>
                            상세 정보
                          </summary>
                          <div className='mt-1 text-xs text-gray-500 bg-white bg-opacity-30 p-2 rounded'>
                            {Object.entries(step.metadata).map(
                              ([key, value]) => (
                                <div key={key} className='flex justify-between'>
                                  <span className='font-medium'>{key}:</span>
                                  <span>{String(value)}</span>
                                </div>
                              )
                            )}
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