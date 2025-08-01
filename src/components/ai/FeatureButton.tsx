/**
 * 🎯 AI 에이전트 기능 전환 버튼 컴포넌트
 *
 * - 아이콘 기반 기능 선택
 * - CSS 기반 툴팁 구현
 * - 활성/비활성 상태 표시
 * - 모바일 대응
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';

export type FunctionTabType = 'qa' | 'report' | 'patterns' | 'logs' | 'context';

interface FeatureButtonProps {
  icon: string;
  tab: FunctionTabType;
  tooltip: string;
  isActive: boolean;
  onClick: (tab: FunctionTabType) => void;
  className?: string;
}

const FeatureButton: React.FC<FeatureButtonProps> = ({
  icon,
  tab,
  tooltip: _tooltip,
  isActive,
  onClick,
  className = '',
}) => {
  return (
    <div className="relative">
      <motion.button
        onClick={() => onClick(tab)}
        className={`relative flex h-12 w-12 items-center justify-center rounded-xl border border-transparent text-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
          isActive
            ? 'border-purple-300/50 bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg'
            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/70 hover:text-white'
        } ${className} `}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 아이콘 */}
        <span className="text-lg font-medium">{icon}</span>

        {/* 활성 상태 인디케이터 */}
        {isActive && (
          <motion.div
            className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-gray-900 bg-green-500"
            initial={{ scale: 0 }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* 호버 효과 */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-white/5 opacity-0"
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        />
      </motion.button>
    </div>
  );
};

export default FeatureButton;
