/**
 * AI 사고 과정 표시 컴포넌트
 * 실시간 사고 과정 및 완료된 사고 과정 표시
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronDown, ChevronUp, CheckCircle, Loader2, Clock } from 'lucide-react';
import type { ThinkingStep } from '../types/ai-sidebar-types';
import type { CompletedThinking } from '../hooks/useAIThinking';

interface AIThinkingDisplayProps {
  // 실시간 사고 과정
  isThinking: boolean;
  currentSteps: ThinkingStep[];
  isExpanded: boolean;
  startTime: Date | null;
  onToggleExpanded: () => void;
  
  // 완료된 사고 과정
  completedThinking?: CompletedThinking;
  onToggleCompleted?: () => void;
}

export const AIThinkingDisplay: React.FC<AIThinkingDisplayProps> = ({
  isThinking,
  currentSteps,
  isExpanded,
  startTime,
  onToggleExpanded,
  completedThinking,
  onToggleCompleted,
}) => {
  // 경과 시간 계산
  const getElapsedTime = () => {
    if (!startTime) return '0.0';
    const elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
    return elapsed.toFixed(1);
  };

  // 실시간 사고 과정 표시
  if (isThinking && currentSteps.length > 0) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className='bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg overflow-hidden'
        >
          <button
            onClick={onToggleExpanded}
            className='w-full px-3 py-2 flex items-center justify-between hover:bg-blue-100/50 transition-colors'
          >
            <div className='flex items-center space-x-2'>
              <Brain className='w-4 h-4 text-blue-600 animate-pulse' />
              <span className='text-xs font-medium text-blue-800'>
                AI가 생각하는 중...
              </span>
              <span className='text-xs text-blue-600'>
                ({getElapsedTime()}초)
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp className='w-3 h-3 text-blue-600' />
            ) : (
              <ChevronDown className='w-3 h-3 text-blue-600' />
            )}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className='px-3 pb-2'
              >
                <div className='space-y-1.5 mt-2'>
                  {currentSteps.map((step) => (
                    <motion.div
                      key={step.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className='flex items-start space-x-2'
                    >
                      <div className='mt-0.5'>
                        {step.status === 'completed' ? (
                          <CheckCircle className='w-3 h-3 text-green-500' />
                        ) : step.status === 'processing' ? (
                          <Loader2 className='w-3 h-3 text-blue-500 animate-spin' />
                        ) : (
                          <div className='w-3 h-3 rounded-full border border-gray-300' />
                        )}
                      </div>
                      <div className='flex-1'>
                        <h4 className='text-xs font-medium text-gray-800'>
                          {step.title}
                        </h4>
                        <p className='text-xs text-gray-600'>
                          {step.description}
                        </p>
                        {step.duration && (
                          <span className='text-xs text-gray-500'>
                            {(step.duration / 1000).toFixed(1)}초
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    );
  }

  // 완료된 사고 과정 표시
  if (completedThinking && onToggleCompleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className='bg-gray-50 border border-gray-200 rounded-lg overflow-hidden'
      >
        <button
          onClick={onToggleCompleted}
          className='w-full px-3 py-2 flex items-center justify-between hover:bg-gray-100 transition-colors'
        >
          <div className='flex items-center space-x-2'>
            <Brain className='w-3 h-3 text-gray-500' />
            <span className='text-xs text-gray-600'>
              AI 사고 과정
            </span>
            <span className='text-xs text-gray-500'>
              ({(completedThinking.processingTime / 1000).toFixed(1)}초)
            </span>
          </div>
          {completedThinking.isExpanded ? (
            <ChevronUp className='w-3 h-3 text-gray-500' />
          ) : (
            <ChevronDown className='w-3 h-3 text-gray-500' />
          )}
        </button>

        <AnimatePresence>
          {completedThinking.isExpanded && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className='px-3 pb-2'
            >
              <div className='space-y-1 mt-2'>
                {completedThinking.steps.map((step) => (
                  <div
                    key={step.id}
                    className='flex items-start space-x-2'
                  >
                    <CheckCircle className='w-3 h-3 text-green-500 mt-0.5' />
                    <div className='flex-1'>
                      <span className='text-xs text-gray-700'>
                        {step.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className='mt-2 pt-2 border-t border-gray-200'>
                <div className='flex items-center justify-between text-xs'>
                  <span className='text-gray-500'>
                    엔진: {completedThinking.engine}
                  </span>
                  <div className='flex items-center space-x-1 text-gray-500'>
                    <Clock className='w-3 h-3' />
                    <span>
                      {(completedThinking.processingTime / 1000).toFixed(1)}초
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
};