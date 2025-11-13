/**
 * 🎯 Cursor AI 스타일 컴팩트 모드 선택기
 * 
 * 기능:
 * - 입력창 하단에 배치되는 미니멀한 드롭다운
 * - 현재 모드 표시 + 클릭 시 선택 옵션 표시
 * - 공간 효율성 극대화
 * - 키보드 접근성 완전 지원
 */

'use client';

import React, { useState, useRef, useEffect, useCallback, type FC } from 'react';
import { ChevronUp, ChevronDown, Brain, Cpu, Zap, Check } from 'lucide-react';
import type { AIMode } from '../../types/ai-types';

interface CompactModeSelectorProps {
  selectedMode: AIMode;
  onModeChange: (mode: AIMode) => void;
  disabled?: boolean;
  className?: string;
}

const AI_MODES = {
  LOCAL: {
    id: 'LOCAL' as const,
    label: '로컬 AI',
    shortLabel: 'Local',
    icon: Cpu,
    color: 'text-blue-600',
    description: '빠른 응답',
  },
  GOOGLE_AI: {
    id: 'GOOGLE_AI' as const,
    label: 'Google AI',
    shortLabel: 'Google',
    icon: Brain,
    color: 'text-emerald-600',
    description: '고급 추론',
  },
  UNIFIED: {
    id: 'UNIFIED' as const,
    label: '통합 AI',
    shortLabel: 'Unified',
    icon: Zap,
    color: 'text-purple-600',
    description: 'RAG + Google AI',
  },
  AUTO: {
    id: 'AUTO' as const,
    label: '자동 선택',
    shortLabel: 'Auto',
    icon: Zap,
    color: 'text-gray-600',
    description: '자동',
  },
} as const;

export const CompactModeSelector: FC<CompactModeSelectorProps> = ({
  selectedMode,
  onModeChange,
  disabled = false,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentMode = AI_MODES[selectedMode];
  const CurrentIcon = currentMode?.icon || Zap;

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [isOpen]);

  // 키보드 네비게이션
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  }, [isOpen, disabled]);

  // 모드 변경 핸들러
  const handleModeSelect = useCallback(async (mode: AIMode) => {
    if (disabled || isChanging || mode === selectedMode) {
      setIsOpen(false);
      return;
    }

    setIsChanging(true);
    try {
      onModeChange(mode);
      setIsOpen(false);
      buttonRef.current?.focus();
    } catch (error) {
      console.error('❌ 모드 변경 실패:', error);
    } finally {
      setIsChanging(false);
    }
  }, [selectedMode, onModeChange, disabled, isChanging]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {/* 메인 버튼 */}
      <button
        ref={buttonRef}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`
          flex h-7 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2 py-1 
          text-xs transition-all duration-200 hover:border-gray-300 hover:bg-gray-50
          focus:border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          ${isOpen ? 'border-blue-300 bg-blue-50' : ''}
        `}
        title={`현재 모드: ${currentMode?.label || selectedMode}`}
        aria-label={`AI 모드 선택: 현재 ${currentMode?.label || selectedMode}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        {/* 현재 모드 아이콘 */}
        <CurrentIcon className={`h-3 w-3 ${currentMode?.color || 'text-gray-500'}`} />
        
        {/* 현재 모드 라벨 */}
        <span className="font-medium text-gray-700 min-w-0">
          {currentMode?.shortLabel || selectedMode}
        </span>

        {/* 드롭다운 화살표 */}
        {isOpen ? (
          <ChevronUp className="h-3 w-3 text-gray-400" />
        ) : (
          <ChevronDown className="h-3 w-3 text-gray-400" />
        )}

        {/* 변경 중 로딩 */}
        {isChanging && (
          <div className="h-2 w-2 animate-spin rounded-full border border-gray-400 border-t-transparent" />
        )}
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <div 
          className="absolute bottom-full left-0 z-50 mb-1 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          role="listbox"
        >
          {Object.values(AI_MODES).map((mode) => {
            const Icon = mode.icon;
            const isSelected = selectedMode === mode.id;
            const isDisabled = disabled || isChanging;

            return (
              <button
                key={mode.id}
                onClick={() => handleModeSelect(mode.id)}
                disabled={isDisabled}
                className={`
                  flex w-full items-center justify-between px-3 py-2 text-left text-xs
                  transition-colors duration-150
                  ${isSelected 
                    ? 'bg-blue-50 text-blue-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                  }
                  ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                `}
                role="option"
                aria-selected={isSelected}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`h-3 w-3 flex-shrink-0 ${mode.color}`} />
                  <div className="min-w-0">
                    <div className="font-medium truncate">{mode.label}</div>
                    <div className="text-gray-500 truncate">{mode.description}</div>
                  </div>
                </div>

                {/* 선택 표시 */}
                {isSelected && (
                  <Check className="h-3 w-3 flex-shrink-0 text-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};