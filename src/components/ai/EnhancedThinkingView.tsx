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

import { AnimatePresence, motion } from 'framer-motion';
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
      return <Database className='w-4 h-4 text-blue-400' />;
    case 'rag':
      return <Search className='w-4 h-4 text-green-400' />;
    case 'google-ai':
      return <Zap className='w-4 h-4 text-purple-400' />;
    case 'unified':
      return <Brain className='w-4 h-4 text-orange-400' />;
    default:
      return <Brain className='w-4 h-4 text-gray-400' />;
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
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);
      return () => clearTimeout(timer);
    }
    return;
  }, [currentIndex, text, speed]);

  return (
    <span className='inline-block'>
      {displayText}
      {currentIndex < text.length && (
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.8, repeat: Infinity }}
          className='inline-block w-0.5 h-4 bg-current ml-1'
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
        setVisibleSteps(prev => [...prev, steps[prev.length]]);
      }, 500);
      return () => clearTimeout(timer);
    }
    return;
  }, [steps.length, visibleSteps.length]);

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
      className={`bg-gray-900/50 border border-gray-700/50 rounded-lg overflow-hidden ${className}`}
    >
      {/* 헤더 - 접기/펼치기 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className='w-full flex items-center justify-between p-3 hover:bg-gray-800/30 transition-colors'
      >
        <div className='flex items-center gap-3'>
          <div className='w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center'>
            {isThinking ? (
              <Loader2 className='w-3 h-3 text-white animate-spin' />
            ) : (
              <CheckCircle className='w-3 h-3 text-white' />
            )}
          </div>
          <div className='text-left'>
            <h4 className='text-white text-sm font-medium'>
              {isThinking
                ? '🧠 AI가 생각하고 있습니다...'
                : '✅ 사고 과정 완료'}
            </h4>
            {currentQuestion && (
              <p className='text-gray-400 text-xs'>
                &quot;
                {currentQuestion.length > 40
                  ? currentQuestion.substring(0, 40) + '...'
                  : currentQuestion}
                &quot;
              </p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-2'>
          {visibleSteps.length > 0 && (
            <span className='text-xs text-gray-400'>
              {visibleSteps.length}단계
            </span>
          )}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className='w-4 h-4 text-gray-400' />
          </motion.div>
        </div>
      </button>

      {/* 사고 과정 내용 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className='border-t border-gray-700/50'
          >
            <div
              ref={scrollRef}
              className='max-h-48 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600 p-3 space-y-2'
            >
              <AnimatePresence>
                {visibleSteps.map((step, _index) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    className={`flex items-start gap-3 p-2.5 rounded-lg border ${getEngineColor(step.engine)}`}
                  >
                    {/* 엔진 아이콘 */}
                    <div className='flex-shrink-0 mt-0.5'>
                      {getEngineIcon(step.engine)}
                    </div>

                    {/* 사고 내용 */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className='text-xs font-medium text-white'>
                          {step.engine}
                        </span>
                        <span className='text-xs text-gray-400'>
                          {step.timestamp.toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                        {step.progress && (
                          <span className='text-xs text-gray-400'>
                            {Math.round(step.progress * 100)}%
                          </span>
                        )}
                      </div>

                      {/* 타이핑 애니메이션으로 사고 과정 표시 */}
                      <div className='text-sm text-gray-200 leading-relaxed'>
                        {step.type === 'completed' ? (
                          <span>{step.content}</span>
                        ) : (
                          <TypingText text={step.content} speed={25} />
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* 현재 처리 중 표시 */}
              {isThinking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className='flex items-center justify-center py-2'
                >
                  <div className='flex items-center gap-2 text-gray-400 text-sm'>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <div className='w-2 h-2 bg-blue-400 rounded-full' />
                    </motion.div>
                    <span>AI가 분석하고 있습니다...</span>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
