'use client';

import { useState, useEffect, useRef } from 'react';

interface ThinkingStep {
  timestamp: string;
  step: string;
  content: string;
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  duration?: number;
  progress?: number;
}

interface ThinkingProcessProps {
  isActive: boolean;
  onComplete: (steps: ThinkingStep[]) => void;
  query: string;
  serverData: any[];
}

export default function ThinkingProcess({ isActive, onComplete, query, serverData }: ThinkingProcessProps) {
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [totalSteps, setTotalSteps] = useState(0);
  const [isRealLog, setIsRealLog] = useState<boolean>(false);
  const stepRef = useRef<HTMLDivElement>(null);

  // 타이핑 애니메이션 컴포넌트
  const TypewriterText = ({ text, onComplete, speed = 30 }: { text: string; onComplete?: () => void; speed?: number }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
      if (currentIndex < text.length) {
        const timer = setTimeout(() => {
          setDisplayText(prev => prev + text[currentIndex]);
          setCurrentIndex(prev => prev + 1);
        }, speed);
        return () => clearTimeout(timer);
      } else if (onComplete) {
        onComplete();
      }
    }, [currentIndex, text, speed, onComplete]);

    return (
      <span className="text-gray-200">
        {displayText}
        {currentIndex < text.length && (
          <span className="inline-block w-2 h-5 bg-purple-400 ml-1 animate-pulse" />
        )}
      </span>
    );
  };

    // 실제 AI 엔진 사고 과정 호출
  const fetchRealThinkingProcess = async (userQuery: string, servers: any[]) => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/ai-agent/thinking-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: userQuery,
          serverData: servers,
          context: {
            requestId: `thinking_${Date.now()}`,
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setSessionId(result.data.sessionId);
        setTotalSteps(result.data.totalSteps);
        
        // 실제 로그인지 폴백인지 표시
        const isReal = result.data.metadata?.isRealLog || false;
        setIsRealLog(isReal);
        
        if (isReal) {
          console.log('🧠 Real AI engine logs received');
        } else {
          console.log('🔄 Fallback simulation logs received');
        }
        
        return result.data.steps;
      } else {
        throw new Error(result.error || 'Failed to get thinking process');
      }
    } catch (error) {
      console.error('Error fetching thinking process:', error);
      
      // 폴백: 기본 에러 처리 단계
      return [{
        timestamp: new Date().toISOString(),
        step: "⚠️ 연결 오류",
        content: `AI 엔진 연결에 실패했습니다.\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}\n\n기본 분석 모드로 전환합니다...`,
        type: 'analysis' as const,
        duration: 500
      }];
    } finally {
      setIsLoading(false);
    }
  };

    // 실제 AI 엔진 실행
  useEffect(() => {
    if (!isActive || isCompleted) return;

    const executeRealAnalysis = async () => {
      setSteps([]);
      setIsCompleted(false);
      setCurrentProgress(0);
      setCurrentStep(0);

      // 실제 AI 엔진에서 사고 과정 가져오기
      const realSteps = await fetchRealThinkingProcess(query, serverData);
      
      // 단계별로 순차 표시 (실제 처리 시뮬레이션)
      for (let i = 0; i < realSteps.length; i++) {
        const step = realSteps[i];
        setCurrentStep(i);
        
        // 단계 시작 시간
        const startTime = Date.now();
        
        // 진행률 애니메이션
        for (let progress = 0; progress <= 100; progress += 10) {
          setCurrentProgress(progress);
          await new Promise(resolve => setTimeout(resolve, step.duration ? step.duration / 10 : 50));
        }

        // 실제 단계 완료 시간 계산
        const actualDuration = Date.now() - startTime;
        
        const processedStep: ThinkingStep = {
          ...step,
          duration: actualDuration,
          progress: 100
        };

        setSteps(prev => [...prev, processedStep]);
        
        // 단계 간 지연
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setIsCompleted(true);
      setCurrentProgress(100);
      onComplete(steps);
    };

    executeRealAnalysis();
  }, [isActive, query, serverData, isCompleted, onComplete]);

  // 자동 스크롤
  useEffect(() => {
    if (stepRef.current) {
      stepRef.current.scrollTop = stepRef.current.scrollHeight;
    }
  }, [steps]);

  const getStepIcon = (type: ThinkingStep['type'], isProcessing: boolean) => {
    const icons = {
      analysis: <i className="fas fa-search text-green-500" />,
      reasoning: <i className="fas fa-lightbulb text-yellow-500" />,
      data_processing: <i className="fas fa-database text-blue-500" />,
      pattern_matching: <i className="fas fa-project-diagram text-orange-500" />,
      response_generation: <i className="fas fa-pen text-indigo-500" />
    };

    if (isProcessing) {
      return (
        <div className="relative">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" />
        </div>
      );
    }

    return (
      <div className="w-4 h-4 flex items-center justify-center">
        {icons[type]}
      </div>
    );
  };

  if (!isActive && steps.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-slate-900 to-gray-900 text-gray-100 rounded-xl overflow-hidden shadow-2xl border border-gray-700">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-slate-800 to-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm font-medium text-gray-300">
            {isRealLog ? '🧠 AI Engine - Real Processing Logs' : '🔄 AI Engine - Simulation Mode'}
          </span>
          <div className="ml-auto flex items-center gap-3">
            {sessionId && (
              <span className="text-xs text-gray-500 font-mono">
                {sessionId.slice(-8)}
              </span>
            )}
            {!isCompleted ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-400">
                  {isLoading ? 'Connecting...' : `Processing ${currentStep + 1}/${totalSteps || '?'}`}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-xs text-gray-400">Analysis Complete</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 사고 과정 표시 */}
      <div
        ref={stepRef}
        className="h-64 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-gray-900 to-slate-900"
        style={{ scrollbarWidth: 'thin' }}
      >
        {steps.map((step, index) => (
          <div key={`${step.timestamp}-${index}`} className="border-l-2 border-gray-600 pl-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              {getStepIcon(step.type, false)}
              <span className="text-sm font-medium text-gray-200">{step.step}</span>
              {step.duration && (
                <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">
                  {step.duration}ms
                </span>
              )}
              <span className="text-xs text-gray-500">
                {new Date(step.timestamp).toLocaleTimeString('ko-KR')}
              </span>
            </div>
            <div className="text-xs font-mono text-gray-300 bg-gray-800/50 p-3 rounded border border-gray-700 leading-relaxed whitespace-pre-line">
              <TypewriterText text={step.content} speed={15} />
            </div>
          </div>
        ))}
        
        {!isCompleted && (
          <div className="border-l-2 border-blue-500 pl-4 pb-3 animate-pulse">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-blue-300">
                {isLoading ? 'Initializing AI Engine...' : 'Processing...'}
              </span>
            </div>
            <div className="text-xs text-gray-400 bg-gray-800/30 p-3 rounded border border-gray-700">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <span>
                  {isLoading 
                    ? 'Connecting to AI reasoning engine...' 
                    : `Step ${currentStep + 1} of ${totalSteps}: Real-time analysis in progress...`
                  }
                </span>
              </div>
              <div className="mt-2 bg-gray-700 rounded-full h-1 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 transition-all duration-300"
                  style={{ width: `${totalSteps > 0 ? ((currentStep + 1) / totalSteps) * 100 : currentProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 상태바 */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {totalSteps > 0 ? `Steps: ${steps.length}/${totalSteps}` : `Steps: ${steps.length}`}
          </span>
          <div className="flex items-center gap-3">
            {sessionId && (
              <span className="font-mono">Session: {sessionId.slice(-8)}</span>
            )}
            <span>
              {isCompleted 
                ? (isRealLog ? 'Real engine analysis complete' : 'Simulation analysis complete')
                : (isRealLog ? 'Real-time engine processing...' : 'Simulation processing...')
              }
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 