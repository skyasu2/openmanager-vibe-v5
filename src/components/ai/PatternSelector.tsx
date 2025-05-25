'use client';

import { useState } from 'react';

export interface PatternOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  active: boolean;
}

interface PatternSelectorProps {
  patterns: PatternOption[];
  onPatternChange: (patternId: string) => void;
  className?: string;
}

export default function PatternSelector({ patterns, onPatternChange, className = '' }: PatternSelectorProps) {
  const [isChanging, setIsChanging] = useState<string | null>(null);

  const handlePatternChange = async (patternId: string) => {
    setIsChanging(patternId);
    try {
      await onPatternChange(patternId);
    } finally {
      setIsChanging(null);
    }
  };

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
          <i className="fas fa-cogs text-white text-sm"></i>
        </div>
        <div>
          <h3 className="font-bold text-gray-900">시스템 패턴</h3>
          <p className="text-sm text-gray-500">데이터 생성 패턴을 선택하세요</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => handlePatternChange(pattern.id)}
            disabled={isChanging === pattern.id}
            className={`relative p-4 rounded-xl border-2 transition-all duration-300 text-left group ${
              pattern.active
                ? `${pattern.color} border-current shadow-lg scale-105`
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            } ${isChanging === pattern.id ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}`}
          >
            {/* 활성 상태 표시 */}
            {pattern.active && (
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-check text-white text-xs"></i>
              </div>
            )}

            {/* 로딩 스피너 */}
            {isChanging === pattern.id && (
              <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                pattern.active ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                <i className={`${pattern.icon} text-lg ${
                  pattern.active ? 'text-white' : 'text-gray-600'
                }`}></i>
              </div>
              <div className="flex-1">
                <h4 className={`font-semibold ${
                  pattern.active ? 'text-white' : 'text-gray-900'
                }`}>
                  {pattern.name}
                </h4>
              </div>
            </div>

            <p className={`text-sm leading-relaxed ${
              pattern.active ? 'text-white/90' : 'text-gray-600'
            }`}>
              {pattern.description}
            </p>

            {/* 호버 효과 */}
            {!pattern.active && (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            )}
          </button>
        ))}
      </div>

      {/* 패턴 설명 */}
      <div className="mt-4 p-3 bg-gray-50 rounded-xl">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="fas fa-info-circle"></i>
          <span>패턴 변경 시 실시간 데이터 생성 방식이 즉시 적용됩니다.</span>
        </div>
      </div>
    </div>
  );
} 