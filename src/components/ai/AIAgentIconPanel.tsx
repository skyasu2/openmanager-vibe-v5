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
  | 'prediction'
  | 'advanced-management'
  | 'pattern-analysis'
  | 'log-analysis'
  | 'thinking'
  | 'optimization'
  | 'infrastructure-overview'
  | 'system-alerts';

interface AIAgentIcon {
  id: AIAgentFunction;
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  gradient: string;
}

const AI_AGENT_ICONS: AIAgentIcon[] = [
  {
    id: 'chat',
    icon: MessageSquare,
    label: 'AI 채팅',
    description: '자연어로 시스템 질의',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'auto-report',
    icon: FileText,
    label: '자동 장애보고서',
    description: '실시간 장애 리포트 생성',
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    gradient: 'from-red-500 to-pink-500',
  },
  {
    id: 'prediction',
    icon: TrendingUp,
    label: '장애 예측',
    description: 'AI 기반 장애 예측 분석',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    gradient: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'infrastructure-overview',
    icon: Monitor,
    label: '인프라 전체현황',
    description: '전체 인프라 상태 및 통계',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    gradient: 'from-indigo-500 to-blue-500',
  },
  {
    id: 'system-alerts',
    icon: AlertTriangle,
    label: '실시간 알림',
    description: '실시간 시스템 알림 및 경고',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'advanced-management',
    icon: Settings,
    label: 'AI 고급관리',
    description: 'AI 엔진 설정 및 관리',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100',
    gradient: 'from-gray-500 to-slate-500',
  },
  {
    id: 'pattern-analysis',
    icon: BarChart3,
    label: '패턴 분석',
    description: '시스템 패턴 및 트렌드 분석',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'log-analysis',
    icon: ScrollText,
    label: '로그 분석',
    description: 'AI 추론 과정 로그 분석',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    gradient: 'from-orange-500 to-yellow-500',
  },
  {
    id: 'thinking',
    icon: Brain,
    label: 'AI 사고과정',
    description: '실시간 AI 사고 과정 시각화',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    id: 'optimization',
    icon: Zap,
    label: '성능 최적화',
    description: 'AI 기반 성능 최적화 제안',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 hover:bg-yellow-100',
    gradient: 'from-yellow-500 to-amber-500',
  },
];

interface AIAgentIconPanelProps {
  selectedFunction: AIAgentFunction;
  onFunctionChange: (func: AIAgentFunction) => void;
  className?: string;
}

export default function AIAgentIconPanel({
  selectedFunction,
  onFunctionChange,
  className = '',
}: AIAgentIconPanelProps) {
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

              {/* 호버 툴팁 */}
              <div className='absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50'>
                {item.label}
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
