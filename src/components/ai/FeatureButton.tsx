/**
 * 🎯 AI 에이전트 기능 전환 버튼 컴포넌트
 *
 * - 아이콘 기반 기능 선택
 * - CSS 기반 툴팁 구현
 * - 활성/비활성 상태 표시
 * - 모바일 대응
 */

'use client';

// React import 추가 - FC 타입을 위해 필요
// framer-motion 제거 - CSS 애니메이션 사용
import React, { type FC } from 'react';

export type FunctionTabType = 'qa' | 'report' | 'patterns' | 'logs' | 'context';

interface FeatureButtonProps {
  icon: string;
  tab: FunctionTabType;
  tooltip: string;
  isActive: boolean;
  onClick: (tab: FunctionTabType) => void;
  className?: string;
}

const FeatureButton: FC<FeatureButtonProps> = ({
  icon,
  tab,
  tooltip: _tooltip,
  isActive,
  onClick,
  className = '',
}) => {
  return (
    <div className="relative">
      <button
        onClick={() => onClick(tab)}
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl border border-transparent text-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
          isActive
            ? 'border-purple-300/50 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/70 hover:text-white'
        } ${className} `}
      >
        {/* 아이콘 */}
        <span className="text-lg font-medium">{icon}</span>

        {/* 활성 상태 인디케이터 */}
        {isActive && (
          <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-green-500 animate-pulse" />
        )}

        {/* 호버 효과 */}
        <div className="absolute inset-0 rounded-xl bg-white/5 opacity-0 transition-opacity hover:opacity-100" />
      </button>
    </div>
  );
};

export default FeatureButton;
