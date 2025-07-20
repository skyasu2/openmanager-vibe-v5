/**
 * 🎯 AI 모드 선택기 컴포넌트
 *
 * 기본: LOCAL 모드 (로컬 AI 엔진)
 * 자연어 질의 시: GOOGLE_AI 모드 선택 가능
 *
 * 사용자가 쉽게 모드를 전환할 수 있는 토글 UI 제공
 */

'use client';

import type { AIMode } from '@/types/ai-types';
import { motion } from 'framer-motion';
import { Brain, Cpu, Zap } from 'lucide-react';
import React, { useState } from 'react';

interface AiModeSelectorProps {
  selectedMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  disabled?: boolean;
  className?: string;
}

const AI_MODE_CONFIG = {
  LOCAL: {
    label: '로컬 AI',
    description: '빠른 응답, 기본 모드',
    icon: Cpu,
    color: 'blue',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
    selectedBg: 'bg-blue-500',
  },
  GOOGLE_ONLY: {
    label: 'Google AI',
    description: '고급 추론, 자연어 질의',
    icon: Brain,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    selectedBg: 'bg-emerald-500',
  },
} as const;

export const AIModeSelector: React.FC<AiModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
  className = '',
}) => {
  const [isChanging, setIsChanging] = useState(false);

  const handleModeChange = async (newMode: AIMode) => {
    if (disabled || isChanging || newMode === selectedMode) return;

    setIsChanging(true);
    try {
      onModeChange(newMode);
      console.log(`🔧 AI 모드 변경: ${selectedMode} → ${newMode}`);
    } catch (error) {
      console.error('❌ AI 모드 변경 실패:', error);
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* 헤더 */}
      <div className='flex items-center space-x-2 text-sm font-medium text-gray-700'>
        <Zap className='w-4 h-4' />
        <span>AI 모드 선택</span>
      </div>

      {/* 모드 선택 토글 */}
      <div className='relative bg-gray-100 rounded-lg p-1'>
        <motion.div
          className={`absolute top-1 bottom-1 rounded-md shadow-sm ${selectedMode === 'LOCAL'
            ? AI_MODE_CONFIG.LOCAL.selectedBg
            : AI_MODE_CONFIG.GOOGLE_ONLY.selectedBg
            }`}
          initial={false}
          animate={{
            left: selectedMode === 'LOCAL' ? '4px' : 'calc(50% + 2px)',
            width: 'calc(50% - 4px)',
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />

        <div className='relative grid grid-cols-2 gap-1'>
          {(Object.keys(AI_MODE_CONFIG) as AIMode[]).map(mode => {
            const config = AI_MODE_CONFIG[mode];
            const Icon = config.icon;
            const isSelected = selectedMode === mode;
            const isDisabled = disabled || isChanging;

            return (
              <motion.button
                key={mode}
                onClick={() => !isDisabled && handleModeChange(mode)}
                disabled={isDisabled}
                className={`
                  relative px-3 py-2 rounded-md text-xs font-medium transition-colors
                  ${isSelected
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-800'
                  }
                  ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                whileHover={!isDisabled ? { scale: 1.02 } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
              >
                <div className='flex items-center justify-center space-x-1.5'>
                  <Icon className='w-3.5 h-3.5' />
                  <span>{config.label}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 선택된 모드 설명 */}
      <motion.div
        key={selectedMode}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`
          px-3 py-2 rounded-lg border text-xs
          ${AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.bgColor || 'bg-gray-50'}
          ${AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.borderColor || 'border-gray-200'}
          ${AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.textColor || 'text-gray-700'}
        `}
      >
        <div className='flex items-center space-x-2'>
          <div className='flex items-center space-x-1'>
            {React.createElement(AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.icon || Zap, {
              className: 'w-3.5 h-3.5',
            })}
            <span className='font-medium'>
              {AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.label || selectedMode}
            </span>
          </div>
          <span className='text-gray-500'>•</span>
          <span>{AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.description || '설명 없음'}</span>
        </div>

        {/* 추가 정보 */}
        {selectedMode === 'GOOGLE_ONLY' && (
          <div className='mt-1 text-xs text-gray-500'>
            💡 복잡한 질문이나 자연어 대화에 최적화
          </div>
        )}
        {selectedMode === 'LOCAL' && (
          <div className='mt-1 text-xs text-gray-500'>
            ⚡ 빠른 응답과 기본적인 시스템 질의에 최적화
          </div>
        )}
      </motion.div>

      {/* 사용량 표시 (Google AI인 경우) */}
      {selectedMode === 'GOOGLE_ONLY' && (
        <div className='px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg'>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-amber-700 font-medium'>Google AI 사용량</span>
            <span className='text-amber-600'>45 / 300 요청</span>
          </div>
          <div className='mt-1'>
            <div className='w-full bg-amber-200 rounded-full h-1.5'>
              <div
                className='bg-amber-500 h-1.5 rounded-full transition-all duration-300'
                style={{ width: '15%' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIModeSelector;
