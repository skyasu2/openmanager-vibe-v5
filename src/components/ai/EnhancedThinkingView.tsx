/**
 * 🧠 Enhanced AI 사고 과정 시각화 컴포넌트
 *
 * 현재 UI/UX 95% 유지하면서 개선된 기능:
 * - AI 엔진별 실제 처리 과정 표시
 * - 타이핑 애니메이션 효과 (3-4줄)
 * - 접기/펼치기 기능
 * - 실제 엔진 이름 표시
 */

'use client';

// framer-motion 제거 - CSS 애니메이션 사용
import {
  Brain,
  CheckCircle,
  ChevronDown,
  Database,
  Loader2,
  Search,
  Zap,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface EnhancedThinkingStep {
  id: string;
  engine: string; // 'MCP', 'RAG', 'Google-AI', 'Unified'
  type: 'analyzing' | 'processing' | 'searching' | 'generating' | 'completed';
  content: string;
  timestamp: Date;
  progress?: number;
}

interface EnhancedThinkingViewProps {
  isThinking: boolean;
  steps: EnhancedThinkingStep[];
  currentQuestion?: string;
  className?: string;
}

// 엔진별 아이콘 매핑
const getEngineIcon = (engine: string) => {
  switch (engine.toLowerCase()) {
    case 'mcp':
      return <Database className="h-4 w-4 text-blue-400" />;
    case 'rag':
      return <Search className="h-4 w-4 text-green-400" />;
    case 'google-ai':
      return <Zap className="h-4 w-4 text-purple-400" />;
    case 'unified':
      return <Brain className="h-4 w-4 text-orange-400" />;
    default:
      return <Brain className="h-4 w-4 text-gray-400" />;
  }
};

// 엔진별 색상 매핑
const getEngineColor = (engine: string) => {
  switch (engine.toLowerCase()) {
    case 'mcp':
      return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    case 'rag':
      return 'text-green-400 bg-green-500/10 border-green-500/20';
    case 'google-ai':
      return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    case 'unified':
      return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    default:
      return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  }
};

// 타이핑 애니메이션 컴포넌트
const TypingText: React.FC<{ text: string; speed?: number }> = ({
  text,
  speed = 30,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
    return;
  }, [currentIndex, text, speed]);

  return (
    <span className="inline-block">
      {displayText}
      {currentIndex < text.length && (
        <span
          className="ml-1 inline-block h-4 w-0.5 bg-current"
        />
      )}
    </span>
  );
};

export const EnhancedThinkingView: React.FC<EnhancedThinkingViewProps> = ({
  isThinking,
  steps,
  currentQuestion,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [visibleSteps, setVisibleSteps] = useState<EnhancedThinkingStep[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 단계별로 순차 표시
  useEffect(() => {
    if (steps.length > visibleSteps.length) {
      const timer = setTimeout(() => {
        setVisibleSteps((prev) => [...prev, steps[prev.length]]);
      }, 500);
      return () => clearTimeout(timer);
    }
    return;
  }, [steps, steps.length, visibleSteps.length]);

  // 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleSteps]);

  if (!isThinking && steps.length === 0) {
    return null;
  }

  return (
    <div
      className={`overflow-hidden rounded-lg border border-gray-700/50 bg-gray-900/50 ${className}`}
    >
      {/* 헤더 - 접기/펼치기 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-3 transition-colors hover:bg-gray-800/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-600">
            {isThinking ? (
              <Loader2 className="h-3 w-3 animate-spin text-white" />
            ) : (
              <CheckCircle className="h-3 w-3 text-white" />
            )}
          </div>
          <div className="text-left">
            <h4 className="text-sm font-medium text-white">
              {isThinking
                ? '🧠 AI가 생각하고 있습니다...'
                : '✅ 사고 과정 완료'}
            </h4>
            {currentQuestion && (
              <p className="text-xs text-gray-400">
                &quot;
                {currentQuestion.length > 40
                  ? currentQuestion.substring(0, 40) + '...'
                  : currentQuestion}
                &quot;
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {visibleSteps.length > 0 && (
            <span className="text-xs text-gray-400">
              {visibleSteps.length}단계
            </span>
          )}
          <div
          >
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      </button>

      {/* 사고 과정 내용 */}
      <React.Fragment>
        {isExpanded && (
          <div
            className="border-t border-gray-700/50"
          >
            <div
              ref={scrollRef}
              className="scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 max-h-48 space-y-2 overflow-y-auto p-3"
            >
              <React.Fragment>
                {visibleSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-3 rounded-lg border p-2.5 ${getEngineColor(step.engine)}`}
                  >
                    {/* 엔진 아이콘 */}
                    <div className="mt-0.5 flex-shrink-0">
                      {getEngineIcon(step.engine)}
                    </div>

                    {/* 사고 내용 */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-medium text-white">
                          {step.engine}
                        </span>
                        <span className="text-xs text-gray-400">
                          {step.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        {step.progress && (
                          <span className="text-xs text-gray-400">
                            {Math.round(step.progress * 100)}%
                          </span>
                        )}
                      </div>

                      {/* 타이핑 애니메이션으로 사고 과정 표시 */}
                      <div className="text-sm leading-relaxed text-gray-200">
                        {step.type === 'completed' ? (
                          <span>{step.content}</span>
                        ) : (
                          <TypingText text={step.content} speed={25} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </React.Fragment>

              {/* 현재 처리 중 표시 */}
              {isThinking && (
                <div
                  className="flex items-center justify-center py-2"
                >
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div
                    >
                      <div className="h-2 w-2 rounded-full bg-blue-400" />
                    </div>
                    <span>AI가 분석하고 있습니다...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </React.Fragment>
    </div>
  );
};
