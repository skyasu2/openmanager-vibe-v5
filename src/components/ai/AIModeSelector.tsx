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
// framer-motion 제거 - CSS 애니메이션 사용
import { Brain, Cpu, Zap } from 'lucide-react';
import React, { useState, createElement, type FC } from 'react';

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
  GOOGLE_AI: {
    label: 'Google AI',
    description: '고급 추론, 자연어 질의',
    icon: Brain,
    color: 'emerald',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    textColor: 'text-emerald-700',
    selectedBg: 'bg-emerald-500',
  },
  UNIFIED: {
    label: '통합 AI',
    description: 'RAG + Google AI 통합',
    icon: Zap,
    color: 'purple',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
    selectedBg: 'bg-purple-500',
  },
  AUTO: {
    label: '자동 선택',
    description: '상황에 맞게 자동',
    icon: Brain,
    color: 'gray',
    bgColor: 'bg-gray-50',
    borderColor: 'border-gray-200',
    textColor: 'text-gray-700',
    selectedBg: 'bg-gray-500',
  },
} as const;

export const AIModeSelector: FC<AiModeSelectorProps> = ({
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
      <div className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <Zap className="h-4 w-4" />
        <span>AI 모드 선택</span>
      </div>

      {/* 모드 선택 토글 */}
      <div className="relative rounded-lg bg-gray-100 p-1">
        <div
          className={`absolute bottom-1 top-1 rounded-md shadow-sm transition-all duration-300 ease-in-out ${
            selectedMode === 'LOCAL'
              ? AI_MODE_CONFIG.LOCAL.selectedBg
              : AI_MODE_CONFIG.GOOGLE_AI.selectedBg
          }`}
          style={{
            left: selectedMode === 'LOCAL' ? '4px' : 'calc(50% + 2px)',
            width: 'calc(50% - 4px)',
          }}
        />

        <div className="relative grid grid-cols-2 gap-1">
          {(Object.keys(AI_MODE_CONFIG) as AIMode[]).map((mode) => {
            const config = AI_MODE_CONFIG[mode];
            const Icon = config.icon;
            const isSelected = selectedMode === mode;
            const isDisabled = disabled || isChanging;

            return (
              <button
                key={mode}
                onClick={() => !isDisabled && handleModeChange(mode)}
                disabled={isDisabled}
                className={`relative rounded-md px-3 py-2 text-xs font-medium transition-all duration-200 hover:scale-102 active:scale-98 ${
                  isSelected
                    ? 'text-white'
                    : 'text-gray-600 hover:text-gray-800'
                } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} `}
              >
                <div className="flex items-center justify-center space-x-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  <span>{config.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 모드 설명 */}
      <div
        key={selectedMode}
        className={`rounded-lg border px-3 py-2 text-xs animate-fade-in ${AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.bgColor || 'bg-gray-50'} ${AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.borderColor || 'border-gray-200'} ${AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]?.textColor || 'text-gray-700'} `}
      >
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            {createElement(
              AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]
                ?.icon || Zap,
              {
                className: 'w-3.5 h-3.5',
              }
            )}
            <span className="font-medium">
              {AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]
                ?.label || selectedMode}
            </span>
          </div>
          <span className="text-gray-500">•</span>
          <span>
            {AI_MODE_CONFIG[selectedMode as keyof typeof AI_MODE_CONFIG]
              ?.description || '설명 없음'}
          </span>
        </div>

        {/* 추가 정보 */}
        {selectedMode === 'GOOGLE_AI' && (
          <div className="mt-1 text-xs text-gray-500">
            💡 복잡한 질문이나 자연어 대화에 최적화
          </div>
        )}
        {selectedMode === 'LOCAL' && (
          <div className="mt-1 text-xs text-gray-500">
            ⚡ 빠른 응답과 기본적인 시스템 질의에 최적화
          </div>
        )}
      </div>

      {/* 사용량 표시 (Google AI인 경우) */}
      {selectedMode === 'GOOGLE_AI' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-amber-700">Google AI 사용량</span>
            <span className="text-amber-600">45 / 300 요청</span>
          </div>
          <div className="mt-1">
            <div className="h-1.5 w-full rounded-full bg-amber-200">
              <div
                className="h-1.5 rounded-full bg-amber-500 transition-all duration-300"
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
