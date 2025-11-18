/**
 * 🧠 ThinkingProcessVisualizer Component
 * AI 사고 과정을 실시간으로 시각화하는 컴포넌트
 */

import React, { Fragment, useEffect, useState, ComponentType, FC } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import {
  Brain,
  Activity,
  Cpu,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  Zap,
  ChevronRight,
} from 'lucide-react';
import type { ThinkingStep as AIThinkingStep } from '@/domains/ai-sidebar/types/ai-sidebar-types';

interface ThinkingProcessVisualizerProps {
  steps: AIThinkingStep[];
  isActive?: boolean;
  className?: string;
}

// 단계 status별 스타일 매핑
const stepStatusConfig: Record<
  NonNullable<AIThinkingStep['status']>,
  {
    icon: ComponentType<{ className?: string }>;
    color: string;
    label: string;
  }
> = {
  pending: {
    icon: Loader2,
    color: 'text-gray-500 bg-gray-50',
    label: '대기 중',
  },
  processing: {
    icon: Cpu,
    color: 'text-purple-500 bg-purple-50',
    label: '처리 중',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500 bg-green-50',
    label: '완료',
  },
};

export const ThinkingProcessVisualizer: FC<ThinkingProcessVisualizerProps> = ({
  steps,
  isActive = false,
  className = '',
}: ThinkingProcessVisualizerProps) => {
  const [visibleSteps, setVisibleSteps] = useState<AIThinkingStep[]>([]);

  useEffect(() => {
    // 새로운 단계가 추가될 때 애니메이션
    if (steps.length > visibleSteps.length) {
      const timer = setTimeout(() => {
        setVisibleSteps(steps);
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined; // 명시적 반환
  }, [steps, visibleSteps.length]);

  // 최근 3개 단계만 표시 (스크롤 방지)
  const displaySteps = visibleSteps.slice(-3);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 헤더 */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            AI 사고 과정
          </span>
        </div>
        {isActive && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
      </div>

      {/* 사고 단계 리스트 */}
      <div className="space-y-2">
        <Fragment>
          {displaySteps.map((step, stepIndex) => {
            const config = stepStatusConfig[step.status || 'pending'];
            const Icon = config.icon as FC<{ className?: string }>;
            const isCurrentStep = stepIndex === displaySteps.length - 1;

            return (
              <div
                key={step.id}
                className={`relative ${isCurrentStep && isActive ? 'z-10' : ''}`}
              >
                <div
                  className={`flex items-start space-x-3 rounded-lg border p-3 ${
                    isCurrentStep && isActive
                      ? 'border-blue-300 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* 아이콘 */}
                  <div
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${config.color}`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>

                  {/* 콘텐츠 */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-800">
                          {step.title}
                        </h4>
                        <p className="mt-0.5 text-xs text-gray-600">
                          {step.description}
                        </p>
                      </div>
                      <span className="ml-2 text-xs text-gray-400">
                        {config.label}
                      </span>
                    </div>

                    {/* 진행률 표시 */}
                    {step.progress &&
                      step.progress > 0 &&
                      step.progress < 100 && (
                        <div className="mt-2">
                          <div className="h-1 w-full rounded-full bg-gray-200">
                            <div className="h-1 rounded-full bg-blue-500" />
                          </div>
                        </div>
                      )}

                    {/* 소요 시간 */}
                    {step.duration && (
                      <div className="mt-1 flex items-center text-xs text-gray-400">
                        <ChevronRight className="mr-1 h-3 w-3" />
                        {(step.duration / 1000).toFixed(1)}초
                      </div>
                    )}

                    {/* 세부 단계 */}
                    {step.subSteps && step.subSteps.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {step.subSteps.map((subStep, subIndex) => (
                          <div
                            key={subIndex}
                            className="flex items-center border-l-2 border-current border-opacity-20 pl-2 text-xs text-gray-500"
                          >
                            <Eye className="mr-1 h-3 w-3 opacity-50" />
                            {subStep}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 메타데이터 */}
                    {step.metadata && Object.keys(step.metadata).length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                          상세 정보
                        </summary>
                        <div className="mt-1 rounded bg-white bg-opacity-30 p-2 text-xs text-gray-500">
                          {Object.entries(step.metadata).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{key}:</span>
                              <span>
                                {typeof value === 'string' ||
                                typeof value === 'number' ||
                                typeof value === 'boolean'
                                  ? String(value)
                                  : JSON.stringify(value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </Fragment>
      </div>

      {/* 활성 상태 인디케이터 */}
      {isActive && (
        <div className="flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 p-3">
          <Zap className="mr-2 h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-700">
            AI가 사고 중입니다...
          </span>
          <div className="ml-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
          </div>
        </div>
      )}
    </div>
  );
};

// 기본 내보내기
export default ThinkingProcessVisualizer;
