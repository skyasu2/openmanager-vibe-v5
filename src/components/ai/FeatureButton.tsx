/**
 * 🎯 AI 에이전트 기능 전환 버튼 컴포넌트
 * 
 * - 아이콘 기반 기능 선택
 * - CSS 기반 툴팁 구현
 * - 활성/비활성 상태 표시
 * - 모바일 대응
 */

'use client';

import React, { useState } from 'react';
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
  tooltip,
  isActive,
  onClick,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => onClick(tab)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          relative w-12 h-12 rounded-xl flex items-center justify-center
          transition-all duration-200 text-xl
          hover:scale-105 active:scale-95
          border border-transparent
          ${isActive 
            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg border-purple-300/50' 
            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/70 hover:text-white'
          }
          ${className}
        `}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.95 }}
      >
        {/* 아이콘 */}
        <span className="text-lg font-medium">
          {icon}
        </span>
        
        {/* 활성 상태 인디케이터 */}
        {isActive && (
          <motion.div
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"
            initial={{ scale: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
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
      
      {/* 툴팁 */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 
                     bg-gray-900/95 border border-gray-700 rounded-lg px-3 py-2
                     text-white text-sm font-medium whitespace-nowrap
                     shadow-xl backdrop-blur-sm"
        >
          {tooltip}
          {/* 화살표 */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 
                         border-4 border-transparent border-r-gray-900/95" />
        </motion.div>
      )}
    </div>
  );
};

export default FeatureButton; 