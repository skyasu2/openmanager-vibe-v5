/**
 * 🧠 LangGraph Thinking Display Component
 * 
 * LangGraph 스타일의 사고 과정 시각화 컴포넌트
 * - TraceBubble로 각 스텝 표시
 * - ReAct 프레임워크 흐름 시각화
 * - 실시간 애니메이션 효과
 * - 모바일 최적화
 */

'use client';

import { memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  type LogicStep, 
  type ReActStep, 
  type LogicStepType, 
  type ReActStepType 
} from '@/modules/ai-agent/core/LangGraphThinkingProcessor';

interface TraceBubbleProps {
  step: LogicStep;
  isActive?: boolean;
  showReActSteps?: boolean;
}

interface ReActBubbleProps {
  step: ReActStep;
  index: number;
}

interface LangGraphThinkingDisplayProps {
  steps: LogicStep[];
  reactSteps: ReActStep[];
  currentStep: LogicStep | null;
  isThinking: boolean;
  animate: boolean;
  showReActSteps?: boolean;
  compact?: boolean;
}

// 🎨 스텝 타입별 아이콘과 색상
const STEP_CONFIG: Record<LogicStepType, { icon: string; color: string; bgColor: string }> = {
  analysis: { icon: '🔍', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  query: { icon: '📊', color: 'text-green-600', bgColor: 'bg-green-50' },
  processing: { icon: '⚙️', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  prediction: { icon: '🔮', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  summary: { icon: '📋', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
  validation: { icon: '✅', color: 'text-emerald-600', bgColor: 'bg-emerald-50' }
};

const REACT_CONFIG: Record<ReActStepType, { icon: string; color: string; bgColor: string }> = {
  thought: { icon: '💭', color: 'text-slate-600', bgColor: 'bg-slate-50' },
  observation: { icon: '👀', color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  action: { icon: '⚡', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  answer: { icon: '✅', color: 'text-green-600', bgColor: 'bg-green-50' },
  reflection: { icon: '🔄', color: 'text-violet-600', bgColor: 'bg-violet-50' }
};

// 📱 TraceBubble 컴포넌트
const TraceBubble = memo<TraceBubbleProps>(({ step, isActive = false, showReActSteps = true }) => {
  const config = STEP_CONFIG[step.type];
  const progressPercent = step.progress || 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      className={`relative p-4 rounded-lg border-l-4 ${
        isActive ? 'border-l-blue-500 bg-blue-50/80' : 'border-l-gray-300 bg-white'
      } shadow-sm hover:shadow-md transition-all duration-200`}
    >
      {/* 스텝 헤더 */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className={`text-2xl ${config?.color || 'text-gray-500'}`}>
            {config?.icon || '📋'}
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 text-sm">
              Step {step.step}: {step.title}
            </h4>
            <p className="text-xs text-gray-600 mt-1">
              {step.description}
            </p>
          </div>
        </div>
        
        {/* 상태 표시 */}
        <div className="flex items-center space-x-2">
          {step.status === 'processing' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
            />
          )}
          {step.status === 'completed' && (
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
          )}
          {step.status === 'error' && (
            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✗</span>
            </div>
          )}
        </div>
      </div>

      {/* 진행률 바 */}
      {step.status === 'processing' && (
        <div className="mb-3">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <motion.div
              className="bg-blue-500 h-1.5 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      {/* 소요 시간 */}
      {step.duration && (
        <div className="text-xs text-gray-500 mb-2">
          ⏱️ {step.duration}ms
        </div>
      )}

      {/* ReAct 스텝들 */}
      {showReActSteps && step.react_steps && step.react_steps.length > 0 && (
        <div className="mt-3 pl-4 border-l-2 border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-2">ReAct Flow:</div>
          <div className="space-y-2">
            {step.react_steps.map((reactStep, index) => (
              <ReActBubble key={index} step={reactStep} index={index} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
});

// 🤖 ReAct Bubble 컴포넌트
const ReActBubble = memo<ReActBubbleProps>(({ step, index }) => {
  const config = REACT_CONFIG[step.type];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.2 }}
      className={`flex items-start space-x-2 p-2 rounded ${config?.bgColor || 'bg-gray-50'}`}
    >
      <span className="text-sm">{config?.icon || '🤖'}</span>
      <div className="flex-1">
        <div className={`text-xs font-medium ${config?.color || 'text-gray-600'}`}>
          {step.type.toUpperCase()}
        </div>
        <div className="text-xs text-gray-700 mt-1">
          {step.content}
        </div>
      </div>
    </motion.div>
  );
});

// 📊 메인 디스플레이 컴포넌트
export default function LangGraphThinkingDisplay({
  steps,
  reactSteps,
  currentStep,
  isThinking,
  animate,
  showReActSteps = true,
  compact = false
}: LangGraphThinkingDisplayProps) {
  
  // 현재 스텝 인덱스 계산
  const currentStepIndex = useMemo(() => {
    if (!currentStep) return -1;
    return steps.findIndex(step => step.id === currentStep.id);
  }, [steps, currentStep]);

  // 사고 중 애니메이션
  const thinkingIndicator = (
    <motion.div
      animate={animate ? { 
        scale: [1, 1.1, 1],
        opacity: [0.5, 1, 0.5]
      } : {}}
      transition={{ 
        duration: 2, 
        repeat: animate ? Infinity : 0,
        ease: 'easeInOut'
      }}
      className="flex items-center justify-center p-4"
    >
      <div className="flex items-center space-x-2 text-blue-600">
        <motion.div
          animate={{ rotate: animate ? 360 : 0 }}
          transition={{ 
            duration: 2, 
            repeat: animate ? Infinity : 0,
            ease: 'linear'
          }}
          className="text-2xl"
        >
          🧠
        </motion.div>
        <span className="text-sm font-medium">AI가 생각하고 있습니다...</span>
      </div>
    </motion.div>
  );

  return (
    <div className={`${compact ? 'max-h-96 overflow-y-auto' : ''} space-y-3`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🧠</span>
          <span className="font-semibold text-gray-900">LangGraph Thinking Flow</span>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-600">
          {isThinking && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Thinking...</span>
            </div>
          )}
          <span>{steps.length} steps</span>
          {showReActSteps && <span>{reactSteps.length} reactions</span>}
        </div>
      </div>

      {/* 사고 중 표시 */}
      {isThinking && steps.length === 0 && thinkingIndicator}

      {/* 스텝 목록 */}
      <AnimatePresence mode="popLayout">
        {steps.map((step, index) => (
          <TraceBubble
            key={step.id}
            step={step}
            isActive={currentStepIndex === index}
            showReActSteps={showReActSteps}
          />
        ))}
      </AnimatePresence>

      {/* 독립 ReAct 시퀀스 (옵션) */}
      {showReActSteps && reactSteps.length > 0 && steps.length === 0 && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">🤖 ReAct Sequence</h4>
          <div className="space-y-2">
            {reactSteps.map((step, index) => (
              <ReActBubble key={index} step={step} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* 완료 상태 */}
      {!isThinking && steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <div className="flex items-center space-x-2">
            <span className="text-xl">✅</span>
            <span className="font-medium text-green-800">사고 과정 완료</span>
          </div>
          <div className="text-sm text-green-700 mt-1">
            총 {steps.length}개 단계를 거쳐 분석을 완료했습니다.
          </div>
        </motion.div>
      )}
    </div>
  );
}

// 메모이제이션으로 성능 최적화
TraceBubble.displayName = 'TraceBubble';
ReActBubble.displayName = 'ReActBubble'; 