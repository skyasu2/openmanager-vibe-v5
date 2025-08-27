/**
 * AI 사고 과정 표시 컴포넌트
 * 실시간 사고 과정 및 완료된 사고 과정 표시
 */

// React import 제거 - Next.js 15 자동 JSX Transform 사용
// framer-motion 제거 - CSS 애니메이션 사용
import {
  Brain,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { Fragment } from 'react';
import type { ThinkingStep } from '../types/ai-sidebar-types';
import type { CompletedThinking } from '../hooks/useAIThinking';

interface AIThinkingDisplayProps {
  // 실시간 사고 과정
  isThinking: boolean;
  currentSteps: ThinkingStep[];
  isExpanded: boolean;
  startTime: Date | null;
  onToggleExpanded: () => void;

  // 완료된 사고 과정
  completedThinking?: CompletedThinking;
  onToggleCompleted?: () => void;
}

export const AIThinkingDisplay: FC<AIThinkingDisplayProps> = ({
  isThinking,
  currentSteps,
  isExpanded,
  startTime,
  onToggleExpanded,
  completedThinking,
  onToggleCompleted,
}) => {
  // 경과 시간 계산
  const getElapsedTime = () => {
    if (!startTime) return '0.0';
    const elapsed = (new Date().getTime() - startTime.getTime()) / 1000;
    return elapsed.toFixed(1);
  };

  // 실시간 사고 과정 표시
  if (isThinking && currentSteps.length > 0) {
    return (
      <Fragment>
        <div
          className="overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
        >
          <button
            onClick={onToggleExpanded}
            className="flex w-full items-center justify-between px-3 py-2 transition-colors hover:bg-blue-100/50"
          >
            <div className="flex items-center space-x-2">
              <Brain className="h-4 w-4 animate-pulse text-blue-600" />
              <span className="text-xs font-medium text-blue-800">
                AI가 생각하는 중...
              </span>
              <span className="text-xs text-blue-600">
                ({getElapsedTime()}초)
              </span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-3 w-3 text-blue-600" />
            ) : (
              <ChevronDown className="h-3 w-3 text-blue-600" />
            )}
          </button>

          <Fragment>
            {isExpanded && (
              <div
                className="px-3 pb-2"
              >
                <div className="mt-2 space-y-1.5">
                  {currentSteps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-start space-x-2"
                    >
                      <div className="mt-0.5">
                        {step.status === 'completed' ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : step.status === 'processing' ? (
                          <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                        ) : (
                          <div className="h-3 w-3 rounded-full border border-gray-300" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-medium text-gray-800">
                          {step.title}
                        </h4>
                        <p className="text-xs text-gray-600">
                          {step.description}
                        </p>
                        {step.duration && (
                          <span className="text-xs text-gray-500">
                            {(step.duration / 1000).toFixed(1)}초
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Fragment>
        </div>
      </Fragment>
    );
  }

  // 완료된 사고 과정 표시
  if (completedThinking && onToggleCompleted) {
    return (
      <div
        className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
      >
        <button
          onClick={onToggleCompleted}
          className="flex w-full items-center justify-between px-3 py-2 transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center space-x-2">
            <Brain className="h-3 w-3 text-gray-500" />
            <span className="text-xs text-gray-600">AI 사고 과정</span>
            <span className="text-xs text-gray-500">
              ({(completedThinking.processingTime / 1000).toFixed(1)}초)
            </span>
          </div>
          {completedThinking.isExpanded ? (
            <ChevronUp className="h-3 w-3 text-gray-500" />
          ) : (
            <ChevronDown className="h-3 w-3 text-gray-500" />
          )}
        </button>

        <Fragment>
          {completedThinking.isExpanded && (
            <div
              className="px-3 pb-2"
            >
              <div className="mt-2 space-y-1">
                {completedThinking.steps.map((step) => (
                  <div key={step.id} className="flex items-start space-x-2">
                    <CheckCircle className="mt-0.5 h-3 w-3 text-green-500" />
                    <div className="flex-1">
                      <span className="text-xs text-gray-700">
                        {step.title}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 border-t border-gray-200 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">
                    엔진: {completedThinking.engine}
                  </span>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>
                      {(completedThinking.processingTime / 1000).toFixed(1)}초
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Fragment>
      </div>
    );
  }

  return null;
};
