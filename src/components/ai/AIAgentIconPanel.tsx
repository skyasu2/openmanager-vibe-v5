/**
 * 🤖 AI 에이전트 기능 아이콘 패널
 *
 * 사이드바 오른쪽에 세로로 배치되는 AI 기능 아이콘들
 * - AI 채팅
 * - 자동 장애 보고서
 * - 장애 예측
 * - AI 고급 관리
 * - 패턴 분석
 * - 로그 분석
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  TrendingUp,
  Settings,
  BarChart3,
  ScrollText,
  Brain,
  Zap,
  Monitor,
  AlertTriangle,
} from 'lucide-react';

export type AIAgentFunction =
  | 'chat'
  | 'auto-report'
  | 'intelligent-monitoring'
  | 'thinking'
  | 'advanced-management';

interface AIAgentIcon {
  id: AIAgentFunction;
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  gradient: string;
}

// 🎯 간소화된 AI 기능 메뉴 - 최적화 기능 제거하여 프로필 설정으로 이동
const AI_AGENT_ICONS: AIAgentIcon[] = [
  // === 핵심 기능 (상단) ===
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'AI 채팅',
    description: '자연어로 시스템 질의 및 대화',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'intelligent-monitoring',
    icon: Monitor,
    label: '지능형 모니터링',
    description:
      '🧠 통합 AI 분석: 이상탐지→근본원인→예측모니터링 (예측분석, 패턴분석, 로그분석 통합)',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'auto-report',
    icon: FileText,
    label: '자동장애 보고서',
    description: 'AI 기반 시스템 장애 분석 보고서 생성',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    gradient: 'from-pink-500 to-rose-500',
  },

  // === 분석 및 관리 기능 ===
  {
    id: 'thinking',
    icon: Brain,
    label: 'AI 사고',
    description: '복잡한 문제 해결 과정 시각화',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'advanced-management',
    icon: Settings,
    label: 'AI 고급관리',
    description: '통합 AI 시스템 관리',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100',
    gradient: 'from-gray-500 to-slate-500',
  },
];

interface AIAgentIconPanelProps {
  selectedFunction: AIAgentFunction;
  onFunctionChange: (func: AIAgentFunction) => void;
  className?: string;
  isMobile?: boolean;
}

// 툴팁 위치 계산 유틸리티 추가
const getTooltipPosition = (index: number, total: number) => {
  const middle = Math.floor(total / 2);
  if (index < middle) {
    return 'top-0'; // 상단 아이템들은 위쪽 정렬
  } else if (index > middle) {
    return 'bottom-0'; // 하단 아이템들은 아래쪽 정렬
  } else {
    return 'top-1/2 transform -translate-y-1/2'; // 중간은 중앙 정렬
  }
};

export default function AIAgentIconPanel({
  selectedFunction,
  onFunctionChange,
  className = '',
  isMobile = false,
}: AIAgentIconPanelProps) {
  if (isMobile) {
    return (
      <div
        className={`flex flex-row space-x-2 overflow-x-auto pb-2 ${className}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {AI_AGENT_ICONS.map((item, index) => {
          const Icon = item.icon;
          const isSelected = selectedFunction === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onFunctionChange(item.id)}
              className={`
                flex-shrink-0 w-12 h-12 rounded-xl transition-all duration-200 group relative
                ${
                  isSelected
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-105`
                    : `${item.bgColor} ${item.color}`
                }
              `}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className='w-5 h-5 mx-auto' />

              {/* 모바일 툴팁 (상단 표시) */}
              <div
                className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 
                             bg-gray-900 text-white text-xs px-2 py-1 rounded 
                             opacity-0 group-hover:opacity-100 transition-opacity duration-200 
                             pointer-events-none whitespace-nowrap z-[60] shadow-lg'
              >
                {item.label}
                <div className='absolute top-full left-1/2 transform -translate-x-1/2'>
                  <div className='border-2 border-transparent border-t-gray-900'></div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col space-y-2 p-3 bg-white border-l border-gray-200 ${className}`}
    >
      {/* 헤더 */}
      <div className='text-center mb-2'>
        <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg mx-auto mb-1 flex items-center justify-center'>
          <Brain className='w-4 h-4 text-white' />
        </div>
        <p className='text-xs font-medium text-gray-600'>AI 기능</p>
      </div>

      {/* 아이콘 버튼들 */}
      <div className='space-y-1'>
        {AI_AGENT_ICONS.map((item, index) => {
          const Icon = item.icon;
          const isSelected = selectedFunction === item.id;

          return (
            <motion.button
              key={item.id}
              onClick={() => onFunctionChange(item.id)}
              className={`
                relative w-12 h-12 rounded-xl transition-all duration-200 group
                ${
                  isSelected
                    ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg scale-105`
                    : `${item.bgColor} ${item.color} hover:scale-105`
                }
              `}
              title={`${item.label}\n${item.description}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Icon className='w-5 h-5 mx-auto' />

              {/* 선택 표시 */}
              {isSelected && (
                <motion.div
                  className='absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full'
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.2 }}
                />
              )}

              {/* 호버 툴팁 - 왼쪽으로 위치 변경 */}
              <div
                className={`
                absolute right-full mr-3 ${getTooltipPosition(index, AI_AGENT_ICONS.length)}
                bg-gray-900 text-white text-xs px-3 py-2 rounded-lg 
                opacity-0 group-hover:opacity-100 transition-all duration-200 
                pointer-events-none whitespace-nowrap z-[60] shadow-lg
                min-w-max max-w-[200px]
              `}
              >
                <div className='font-medium'>{item.label}</div>
                <div className='text-gray-300 text-xs mt-1'>
                  {item.description}
                </div>

                {/* 툴팁 화살표 - 왼쪽 표시용으로 변경 */}
                <div className='absolute left-full top-1/2 transform -translate-y-1/2'>
                  <div className='border-4 border-transparent border-l-gray-900'></div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 하단 상태 표시 */}
      <div className='mt-4 pt-2 border-t border-gray-200'>
        <div className='text-center'>
          <div className='w-2 h-2 bg-green-400 rounded-full mx-auto mb-1 animate-pulse'></div>
          <p className='text-xs text-gray-500'>AI 활성</p>
        </div>
      </div>
    </div>
  );
}

export { AI_AGENT_ICONS };
export type { AIAgentIcon };
