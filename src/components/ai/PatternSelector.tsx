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

export default function PatternSelector({
  patterns,
  onPatternChange,
  className = '',
}: PatternSelectorProps) {
  const [isChanging, setIsChanging] = useState<string | null>(null);

  const handlePatternChange = async (patternId: string) => {
    setIsChanging(patternId);
    try {
      onPatternChange(patternId);
    } finally {
      setIsChanging(null);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-4 shadow-lg ${className}`}
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-indigo-600">
          <i className="fas fa-cogs text-sm text-white"></i>
        </div>
        <div>
          <h3 className="font-bold text-gray-900">시스템 패턴</h3>
          <p className="text-sm text-gray-500">데이터 생성 패턴을 선택하세요</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {patterns.map((pattern) => (
          <button
            key={pattern.id}
            onClick={() => {
              void handlePatternChange(pattern.id);
            }}
            disabled={isChanging === pattern.id}
            className={`group relative rounded-xl border-2 p-4 text-left transition-all duration-300 ${
              pattern.active
                ? `${pattern.color} scale-105 border-current shadow-lg`
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            } ${isChanging === pattern.id ? 'cursor-not-allowed opacity-50' : 'hover:scale-102'}`}
          >
            {/* 활성 상태 표시 */}
            {pattern.active && (
              <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 shadow-lg">
                <i className="fas fa-check text-xs text-white"></i>
              </div>
            )}

            {/* 로딩 스피너 */}
            {isChanging === pattern.id && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
              </div>
            )}

            <div className="mb-2 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  pattern.active ? 'bg-white/20' : 'bg-gray-100'
                }`}
              >
                <i
                  className={`${pattern.icon} text-lg ${
                    pattern.active ? 'text-white' : 'text-gray-600'
                  }`}
                ></i>
              </div>
              <div className="flex-1">
                <h4
                  className={`font-semibold ${
                    pattern.active ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {pattern.name}
                </h4>
              </div>
            </div>

            <p
              className={`text-sm leading-relaxed ${
                pattern.active ? 'text-white/90' : 'text-gray-600'
              }`}
            >
              {pattern.description}
            </p>

            {/* 호버 효과 */}
            {!pattern.active && (
              <div className="absolute inset-0 rounded-xl bg-linear-to-r from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            )}
          </button>
        ))}
      </div>

      {/* 패턴 설명 */}
      <div className="mt-4 rounded-xl bg-gray-50 p-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <i className="fas fa-info-circle"></i>
          <span>패턴 변경 시 실시간 데이터 생성 방식이 즉시 적용됩니다.</span>
        </div>
      </div>
    </div>
  );
}
