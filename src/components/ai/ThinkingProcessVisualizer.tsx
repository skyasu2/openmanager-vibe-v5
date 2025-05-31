/**
 * ThinkingProcessVisualizer Component
 * 
 * 🧠 AI의 사고 과정을 실시간으로 시각화하는 컴포넌트
 * - 5단계 프로세스 (분석→추론→처리→생성→완료)
 * - 실시간 진행률 표시
 * - 애니메이션 효과
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Brain, 
  Cpu, 
  Edit3, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Clock,
  Zap,
  Activity
} from 'lucide-react';
import { AIThinkingStep, ThinkingProcessState, ErrorState } from '@/types/ai-thinking';

interface ThinkingProcessVisualizerProps {
  steps: AIThinkingStep[];
  isActive: boolean;
  onComplete?: () => void;
  onError?: (error: ErrorState) => void;
  className?: string;
  showProgress?: boolean;
  showSubSteps?: boolean;
  enableAnimations?: boolean;
}

export const ThinkingProcessVisualizer: React.FC<ThinkingProcessVisualizerProps> = ({
  steps,
  isActive,
  onComplete,
  onError,
  className = '',
  showProgress = true,
  showSubSteps = true,
  enableAnimations = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [processState, setProcessState] = useState<ThinkingProcessState>({
    steps: [],
    currentStepIndex: 0,
    isActive: false,
    totalDuration: 0,
    startTime: undefined,
    endTime: undefined
  });

  // 기본 사고 단계 정의
  const defaultSteps: AIThinkingStep[] = [
    {
      id: 'analyzing',
      timestamp: new Date().toISOString(),
      type: 'analyzing',
      title: '🔍 분석 중',
      description: '입력된 질문을 분석하고 있습니다...',
      progress: 0,
      icon: 'Search',
      subSteps: ['질문 구조 분석', '키워드 추출', '의도 파악']
    },
    {
      id: 'reasoning',
      timestamp: new Date().toISOString(),
      type: 'reasoning',
      title: '🧠 추론 중',
      description: '관련 정보를 조합하여 추론하고 있습니다...',
      progress: 0,
      icon: 'Brain',
      subSteps: ['데이터 연관성 분석', '패턴 인식', '논리적 추론']
    },
    {
      id: 'processing',
      timestamp: new Date().toISOString(),
      type: 'processing',
      title: '⚙️ 처리 중',
      description: '시스템 데이터를 처리하고 있습니다...',
      progress: 0,
      icon: 'Cpu',
      subSteps: ['메트릭 수집', '상태 확인', '데이터 정제']
    },
    {
      id: 'generating',
      timestamp: new Date().toISOString(),
      type: 'generating',
      title: '✍️ 생성 중',
      description: '응답을 생성하고 있습니다...',
      progress: 0,
      icon: 'Edit3',
      subSteps: ['응답 구조화', '내용 생성', '검증 수행']
    },
    {
      id: 'completed',
      timestamp: new Date().toISOString(),
      type: 'completed',
      title: '✅ 완료',
      description: '응답 생성이 완료되었습니다!',
      progress: 100,
      icon: 'CheckCircle',
      subSteps: ['최종 검토', '품질 확인', '응답 전달']
    }
  ];

  // 스텝 아이콘 매핑
  const getStepIcon = useCallback((iconName: string, isActive: boolean, isCompleted: boolean) => {
    const iconProps = {
      className: `w-5 h-5 transition-all duration-300 ${
        isCompleted ? 'text-green-400' : 
        isActive ? 'text-blue-400' : 'text-gray-400'
      }`,
      style: enableAnimations && isActive ? { 
        animation: 'pulse 2s infinite'
      } : {}
    };

    switch (iconName) {
      case 'Search': return <Search {...iconProps} />;
      case 'Brain': return <Brain {...iconProps} />;
      case 'Cpu': return <Cpu {...iconProps} />;
      case 'Edit3': return <Edit3 {...iconProps} />;
      case 'CheckCircle': return <CheckCircle {...iconProps} />;
      case 'AlertCircle': return <AlertCircle {...iconProps} />;
      default: return <Activity {...iconProps} />;
    }
  }, [enableAnimations]);

  // 프로세스 상태 업데이트
  useEffect(() => {
    if (isActive && steps.length > 0) {
      setProcessState(prev => ({
        ...prev,
        steps: steps.length > 0 ? steps : defaultSteps,
        isActive: true,
        startTime: prev.startTime || new Date()
      }));
    } else if (!isActive) {
      setProcessState(prev => ({
        ...prev,
        isActive: false,
        endTime: new Date()
      }));
    }
  }, [isActive, steps, defaultSteps]);

  // 단계 진행 시뮬레이션
  useEffect(() => {
    if (!isActive || processState.steps.length === 0) return;

    const currentSteps = steps.length > 0 ? steps : defaultSteps;
    
    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        const nextIndex = prev + 1;
        
        if (nextIndex >= currentSteps.length) {
          // 프로세스 완료
          setProcessState(state => ({
            ...state,
            isActive: false,
            endTime: new Date(),
            totalDuration: state.startTime ? Date.now() - state.startTime.getTime() : 0
          }));
          
          onComplete?.();
          return prev;
        }
        
        return nextIndex;
      });
    }, 2000); // 2초마다 다음 단계

    return () => clearInterval(interval);
  }, [isActive, processState.steps.length, steps, defaultSteps, onComplete]);

  // 진행률 계산
  const calculateProgress = useCallback(() => {
    if (!isActive || processState.steps.length === 0) return 0;
    
    const totalSteps = processState.steps.length;
    const completedSteps = currentStepIndex;
    
    return Math.min((completedSteps / totalSteps) * 100, 100);
  }, [isActive, processState.steps.length, currentStepIndex]);

  // 에러 처리
  const handleStepError = useCallback((stepId: string, error: string) => {
    const errorState: ErrorState = {
      hasError: true,
      errorType: 'processing',
      message: error,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3
    };

    onError?.(errorState);
    console.error(`🚨 AI Thinking Step Error [${stepId}]:`, error);
  }, [onError]);

  // 시간 포맷팅
  const formatDuration = useCallback((milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    }
    return `${seconds}초`;
  }, []);

  const currentSteps = steps.length > 0 ? steps : defaultSteps;
  const progress = calculateProgress();

  if (!isActive && processState.steps.length === 0) {
    return null;
  }

  return (
    <div className={`bg-slate-800/50 rounded-lg border border-purple-500/30 p-4 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-2 rounded-lg ${isActive ? 'bg-purple-600/20' : 'bg-gray-600/20'}`}>
            {isActive ? (
              <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 text-green-400" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">
              {isActive ? 'AI 사고 과정' : '분석 완료'}
            </h3>
            <p className="text-xs text-gray-400">
              {isActive ? '단계별 처리 중...' : `총 소요시간: ${formatDuration(processState.totalDuration)}`}
            </p>
          </div>
        </div>

        {showProgress && (
          <div className="text-right">
            <div className="text-xs text-gray-300 mb-1">
              {currentStepIndex + 1} / {currentSteps.length}
            </div>
            <div className="w-16 h-1 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 단계 목록 */}
      <div className="space-y-3">
        <AnimatePresence mode="wait">
          {currentSteps.map((step, index) => {
            const isActive = index === currentStepIndex && processState.isActive;
            const isCompleted = index < currentStepIndex || !processState.isActive;
            const isFuture = index > currentStepIndex;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: isFuture ? 0.4 : 1,
                  y: 0,
                  scale: isActive ? 1.02 : 1
                }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ 
                  duration: enableAnimations ? 0.3 : 0,
                  ease: 'easeInOut'
                }}
                className={`
                  flex items-start gap-3 p-3 rounded-lg transition-all duration-300
                  ${isActive ? 'bg-purple-600/10 border border-purple-500/30' : ''}
                  ${isCompleted ? 'bg-green-600/5 border border-green-500/20' : ''}
                  ${isFuture ? 'bg-gray-600/5' : ''}
                `}
              >
                {/* 아이콘 */}
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                  ${isCompleted ? 'bg-green-600/20' : 
                    isActive ? 'bg-purple-600/20' : 'bg-gray-600/20'}
                `}>
                  {getStepIcon(step.icon || 'Activity', isActive, isCompleted)}
                </div>

                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`text-sm font-medium ${
                      isCompleted ? 'text-green-300' :
                      isActive ? 'text-purple-300' : 'text-gray-300'
                    }`}>
                      {step.title}
                    </h4>
                    
                    {isActive && (
                      <div className="flex items-center gap-1 text-xs text-purple-400">
                        <Clock className="w-3 h-3" />
                        <motion.span
                          key={step.timestamp}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          처리 중...
                        </motion.span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mb-2">
                    {step.description}
                  </p>

                  {/* 세부 단계 */}
                  {showSubSteps && step.subSteps && isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-2 space-y-1"
                    >
                      {step.subSteps.map((subStep, subIndex) => (
                        <motion.div
                          key={subIndex}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ 
                            duration: 0.3, 
                            delay: subIndex * 0.1 
                          }}
                          className="flex items-center gap-2 text-xs text-gray-500"
                        >
                          <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
                          {subStep}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}

                  {/* 진행률 바 (개별 단계) */}
                  {isActive && step.progress !== undefined && (
                    <div className="mt-2">
                      <div className="w-full h-1 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-purple-400"
                          initial={{ width: 0 }}
                          animate={{ width: `${step.progress}%` }}
                          transition={{ duration: 0.5 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 전체 진행률 */}
      {showProgress && (
        <div className="mt-4 pt-3 border-t border-gray-700/50">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>전체 진행률</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-green-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// 기본 내보내기
export default ThinkingProcessVisualizer; 