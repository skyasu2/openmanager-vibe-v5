'use client';

/**
 * WelcomePromptCards - AI 채팅 웰컴 화면 제안 프롬프트
 *
 * @description
 * - ChatGPT 스타일 제안 프롬프트 카드 컴포넌트
 * - 2x2 그리드 레이아웃
 * - EnhancedAIChat에서 분리하여 재사용 가능
 */

import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, Bot, FileText, Server, TrendingUp } from 'lucide-react';
import { memo } from 'react';

/**
 * 제안 프롬프트 타입
 */
export interface StarterPrompt {
  icon: LucideIcon;
  title: string;
  prompt: string;
  gradient: string;
}

/**
 * 기본 제안 프롬프트 목록
 * - 서버 모니터링 도메인에 최적화
 */
export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    icon: Server,
    title: '서버 상태 확인',
    prompt: '현재 모든 서버의 상태를 요약해줘',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: AlertTriangle,
    title: '장애 분석',
    prompt: 'CPU 사용률이 높은 서버를 찾아줘',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    icon: TrendingUp,
    title: '성능 예측',
    prompt: '다음 24시간 트래픽 패턴을 예측해줘',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: FileText,
    title: '보고서 생성',
    prompt: '오늘의 시스템 요약 보고서를 만들어줘',
    gradient: 'from-purple-500 to-pink-500',
  },
];

interface WelcomePromptCardsProps {
  /** 프롬프트 클릭 시 호출되는 핸들러 */
  onPromptClick: (prompt: string) => void;
  /** 커스텀 프롬프트 목록 (선택적) */
  prompts?: StarterPrompt[];
}

/**
 * 웰컴 화면 컴포넌트
 * - 빈 채팅 상태에서 표시
 * - 제안 프롬프트 카드 그리드
 */
export const WelcomePromptCards = memo(function WelcomePromptCards({
  onPromptClick,
  prompts = STARTER_PROMPTS,
}: WelcomePromptCardsProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center py-12">
      {/* 로고 및 인사말 */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-purple-500 to-blue-600 shadow-lg">
          <Bot className="h-8 w-8 text-white" aria-hidden="true" />
        </div>
        <h2 className="text-2xl font-semibold text-gray-900">
          무엇을 도와드릴까요?
        </h2>
        <p className="mt-2 text-gray-500">
          서버 모니터링, 장애 분석, 성능 예측을 도와드립니다
        </p>
      </div>

      {/* 제안 프롬프트 카드 2x2 그리드 */}
      <div className="grid max-w-xl grid-cols-1 gap-3 px-4 sm:grid-cols-2">
        {prompts.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.title}
              onClick={() => onPromptClick(card.prompt)}
              className="group rounded-xl border border-gray-200 bg-white p-4 text-left
                         shadow-sm transition-all hover:border-blue-300 hover:bg-blue-50/50
                         hover:shadow-md"
            >
              <div
                className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg
                            bg-linear-to-br ${card.gradient} shadow-sm`}
              >
                <Icon className="h-4 w-4 text-white" aria-hidden="true" />
              </div>
              <h4 className="font-medium text-gray-900 group-hover:text-blue-700">
                {card.title}
              </h4>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {card.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
});

WelcomePromptCards.displayName = 'WelcomePromptCards';

export default WelcomePromptCards;
