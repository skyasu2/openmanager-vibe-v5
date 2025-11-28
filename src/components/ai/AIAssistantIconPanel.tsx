/**
 * 🤖 AI 어시스턴트 기능 아이콘 패널
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

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Brain,
  FileText,
  MessageSquare,
  Monitor,
  Settings,
  Activity,
} from 'lucide-react';
import type { ComponentType } from 'react';
// React import 제거 - Next.js 15 자동 JSX Transform 사용

export type AIAssistantFunction =
  | 'chat'
  | 'auto-report'
  | 'intelligent-monitoring'
  | 'advanced-management'
  | 'free-tier-monitor';

interface AIAssistantIcon {
  id: AIAssistantFunction;
  icon: ComponentType<{ className?: string }>;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  gradient: string;
}

// 🎯 간소화된 AI 기능 메뉴 - AI 사고 제거, 순서 조정
const AI_ASSISTANT_ICONS: AIAssistantIcon[] = [
  // === 핵심 기능 (상단) ===
  {
    id: 'chat',
    icon: MessageSquare,
    label: '자연어 질의',
    description: '자연어로 시스템 질의 및 대화',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    gradient: 'from-blue-500 to-cyan-500',
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
  {
    id: 'intelligent-monitoring',
    icon: Monitor,
    label: '이상감지/예측',
    description:
      '🧠 통합 AI 분석: 이상탐지→근본원인→예측모니터링→AI인사이트 (자동분석)',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100',
    gradient: 'from-emerald-500 to-teal-500',
  },

  // === 관리 기능 ===
  {
    id: 'advanced-management',
    icon: Settings,
    label: 'AI 고급관리',
    description: 'ML 학습 기능 및 AI 시스템 관리',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 hover:bg-gray-100',
    gradient: 'from-gray-500 to-slate-500',
  },
  {
    id: 'free-tier-monitor',
    icon: Activity,
    label: '무료 티어 모니터',
    description: 'Vercel, Supabase, Google AI 무료 티어 사용량 추적',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
    gradient: 'from-indigo-500 to-purple-500',
  },
];

interface AIAssistantIconPanelProps {
  selectedFunction: AIAssistantFunction;
  onFunctionChange: (func: AIAssistantFunction) => void;
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

export default function AIAssistantIconPanel({
  selectedFunction,
  onFunctionChange,
  className = '',
  isMobile = false,
}: AIAssistantIconPanelProps) {
  if (isMobile) {
    return (
      <div
        className={`flex flex-row space-x-2 overflow-x-auto pb-2 ${className}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {AI_ASSISTANT_ICONS.map((item) => {
          const Icon = item.icon;
          const isSelected = selectedFunction === item.id;

          return (
            <button
              key={item.id}
              data-testid={`ai-function-${item.id}`}
              onClick={() => onFunctionChange(item.id)}
              className={`group relative h-12 w-12 flex-shrink-0 rounded-xl transition-all duration-200 active:scale-95 ${
                isSelected
                  ? `bg-gradient-to-r ${item.gradient} scale-105 text-white shadow-lg`
                  : `${item.bgColor} ${item.color}`
              } `}
            >
              <Icon className="mx-auto h-5 w-5" />

              {/* 모바일 툴팁 (상단 표시) */}
              <div className="pointer-events-none absolute bottom-full left-1/2 z-[60] mb-2 -translate-x-1/2 transform whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                {item.label}
                <div className="absolute left-1/2 top-full -translate-x-1/2 transform">
                  <div className="border-2 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col space-y-2 border-l border-gray-200 bg-white p-3 ${className}`}
    >
      {/* 헤더 */}
      <div className="mb-2 text-center">
        <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-blue-500">
          <Brain className="h-4 w-4 text-white" />
        </div>
        <p className="text-xs font-medium text-gray-600">AI 기능</p>
      </div>

      {/* 아이콘 버튼들 */}
      <div className="space-y-1">
        {AI_ASSISTANT_ICONS.map((item, index) => {
          const Icon = item.icon;
          const isSelected = selectedFunction === item.id;

          return (
            <button
              key={item.id}
              data-testid={`ai-function-${item.id}`}
              onClick={() => onFunctionChange(item.id)}
              className={`animate-fade-in group relative h-12 w-12 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${
                isSelected
                  ? `bg-gradient-to-r ${item.gradient} scale-105 text-white shadow-lg`
                  : `${item.bgColor} ${item.color}`
              } `}
              title={`${item.label}\n${item.description}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Icon className="mx-auto h-5 w-5" />

              {/* 선택 표시 */}
              {isSelected && (
                <div className="animate-scale-y absolute -left-1 top-1/2 h-6 w-1 -translate-y-1/2 transform rounded-r-full bg-white" />
              )}

              {/* 호버 툴팁 - 왼쪽으로 위치 변경 */}
              <div
                className={`absolute right-full mr-3 ${getTooltipPosition(index, AI_ASSISTANT_ICONS.length)} pointer-events-none z-[60] min-w-max max-w-[200px] whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-all duration-200 group-hover:opacity-100`}
              >
                <div className="font-medium">{item.label}</div>
                <div className="mt-1 text-xs text-gray-300">
                  {item.description}
                </div>

                {/* 툴팁 화살표 - 왼쪽 표시용으로 변경 */}
                <div className="absolute left-full top-1/2 -translate-y-1/2 transform">
                  <div className="border-4 border-transparent border-l-gray-900"></div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 하단 상태 표시 */}
      <div className="mt-4 border-t border-gray-200 pt-2">
        <div className="text-center">
          <div className="_animate-pulse mx-auto mb-1 h-2 w-2 rounded-full bg-green-400"></div>
          <p className="text-xs text-gray-500">AI 활성</p>
        </div>
      </div>
    </div>
  );
}

export { AI_ASSISTANT_ICONS };
export type { AIAssistantIcon };
