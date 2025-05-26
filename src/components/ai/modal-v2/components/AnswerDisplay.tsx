'use client';

import { useEffect, useRef, useState } from 'react';
import FeedbackButtons from '@/components/ai/FeedbackButtons';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';

// 생각 과정 단계들
const THINKING_STEPS = [
  { text: "서버 데이터를 분석하고 있습니다...", duration: 800 },
  { text: "패턴을 식별하고 있습니다...", duration: 600 },
  { text: "성능 메트릭을 검토하고 있습니다...", duration: 700 },
  { text: "최적의 답변을 생성하고 있습니다...", duration: 500 },
];

interface AnswerDisplayProps {
  question: string;
  answer: string;
  isLoading: boolean;
  metadata?: {
    intent?: string;
    confidence?: number;
    responseTime?: number;
    serverState?: any;
    sessionId?: string;
  };
}

export default function AnswerDisplay({
  question,
  answer,
  isLoading,
  metadata
}: AnswerDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [currentThinkingStep, setCurrentThinkingStep] = useState<number>(0);
  const [thinkingText, setThinkingText] = useState<string>('');

  // 생각 과정 시뮬레이션
  useEffect(() => {
    if (isLoading && question) {
      setCurrentThinkingStep(0);
      setThinkingText(THINKING_STEPS[0].text);
      
      let stepIndex = 0;
      const runThinkingSteps = () => {
        if (stepIndex < THINKING_STEPS.length - 1) {
          setTimeout(() => {
            stepIndex++;
            setCurrentThinkingStep(stepIndex);
            setThinkingText(THINKING_STEPS[stepIndex].text);
            runThinkingSteps();
          }, THINKING_STEPS[stepIndex].duration);
        }
      };
      
      runThinkingSteps();
    }
  }, [isLoading, question]);

  // 답변이 완료되면 상호작용 로깅
  useEffect(() => {
    if (answer && !isLoading && question) {
      const logInteraction = async () => {
        const logger = InteractionLogger.getInstance();
        const id = await logger.logInteraction({
          query: question,
          intent: metadata?.intent || 'general_query',
          confidence: metadata?.confidence || 0.5,
          response: answer,
          contextData: {
            serverState: metadata?.serverState || {},
            activeMetrics: [],
            timeOfDay: new Date().toLocaleTimeString(),
            userRole: 'user',
            sessionId: metadata?.sessionId || 'session_' + Date.now()
          },
          responseTime: metadata?.responseTime || 0
        });
        setInteractionId(id);
      };

      logInteraction();
      
      // 답변 완료 후 3초 뒤에 로그 페이지로 이동
      setTimeout(() => {
        console.log('AI 분석 완료 - 로그 페이지로 이동');
        // 실제로는 부모 컴포넌트에서 처리하거나 라우터 사용
        window.open('/logs/interactions', '_blank');
      }, 3000);
    }
  }, [answer, isLoading, question, metadata]);

  // 마크다운 서식 변환 (간단한 구현)
  const formatContent = (content: string) => {
    if (!content) return '';
    
    // 마크다운 스타일 간단 변환
    const formatted = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // **bold**
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // *italic*
      .replace(/^###\s(.*?)$/gm, '<h3 class="text-lg font-semibold text-gray-900 mt-3 mb-2">$1</h3>')  // ### 헤딩
      .replace(/^##\s(.*?)$/gm, '<h2 class="text-xl font-semibold text-gray-900 mt-4 mb-2">$1</h2>')   // ## 헤딩
      .replace(/^#\s(.*?)$/gm, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-3">$1</h1>')       // # 헤딩
      .replace(/^\-\s(.*?)$/gm, '<li class="ml-4">• $1</li>')  // - 리스트
      .replace(/^\d+\.\s(.*?)$/gm, '<li class="ml-4">$1</li>') // 1. 리스트
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-lg my-3 overflow-x-auto text-sm">$1</pre>') // 코드 블록
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>')  // 인라인 코드
      .replace(/\n\n/g, '<br><br>')  // 줄바꿈
      .replace(/\n/g, '<br>');       // 단일 줄바꿈

    return formatted;
  };

  return (
    <div className="animate-fade-in bg-white rounded-xl shadow-md overflow-hidden">
      {/* 질문 표시 헤더 */}
      <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
            <i className="fas fa-user"></i>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-700">{question}</div>
            <div className="text-xs text-gray-500 mt-1">
              {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* 답변 내용 */}
      <div className="px-6 py-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
            <i className="fas fa-robot"></i>
          </div>

          <div className="flex-1">
            {isLoading ? (
              // 생각 과정 표시 (드래그/복사 방지)
              <div className="select-none user-select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="relative">
                    <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 w-8 h-8 border border-purple-100 rounded-full animate-pulse"></div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-purple-700 mb-1">AI가 분석 중입니다</div>
                    <div className="text-xs text-gray-600">{thinkingText}</div>
                  </div>
                </div>
                
                {/* 진행 단계 표시 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                    <span>분석 단계</span>
                    <span>{currentThinkingStep + 1} / {THINKING_STEPS.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${((currentThinkingStep + 1) / THINKING_STEPS.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* 가짜 분석 프로세스 표시 */}
                <div className="space-y-3 text-sm text-gray-600">
                  {THINKING_STEPS.map((step, index) => (
                    <div 
                      key={index}
                      className={`flex items-center gap-2 transition-all duration-300 ${
                        index <= currentThinkingStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      {index < currentThinkingStep ? (
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <i className="fas fa-check text-white text-xs"></i>
                        </div>
                      ) : index === currentThinkingStep ? (
                        <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                      )}
                      <span className={index <= currentThinkingStep ? 'text-gray-800 font-medium' : 'text-gray-400'}>
                        {step.text}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* 하단 시스템 메시지 */}
                <div className="mt-6 p-3 bg-purple-50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-purple-700">
                    <i className="fas fa-info-circle"></i>
                    <span>실시간 서버 데이터를 기반으로 정확한 분석을 제공합니다</span>
                  </div>
                </div>
              </div>
            ) : (
              // 답변 표시
              <div>
                <div 
                  ref={contentRef}
                  className="text-gray-800 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formatContent(answer) }}
                />
                
                {/* AI 분석 정보는 개발자만 볼 수 있도록 숨김 */}
                {false && interactionId && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <FeedbackButtons 
                      responseId={interactionId || ''}
                      onFeedback={(feedback) => {
                        console.log('피드백 수신:', feedback);
                      }}
                    />
                  </div>
                )}

                {/* 답변 하단 작업 버튼 */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  
                  {/* 액션 버튼들 */}
                  <div className="flex items-center gap-2">
                    <ActionButton 
                      icon="fas fa-copy" 
                      title="복사" 
                      onClick={() => {
                        navigator.clipboard.writeText(answer);
                        console.log('답변이 클립보드에 복사되었습니다.');
                      }}
                    />
                    <ActionButton 
                      icon="fas fa-redo-alt" 
                      title="다시 생성" 
                      onClick={() => {
                        // TODO: 질문 재전송 로직
                        console.log('답변 재생성 요청');
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 액션 버튼 컴포넌트
function ActionButton({ icon, title, onClick }: { icon: string; title: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs text-gray-500 hover:text-purple-600 p-1.5 rounded hover:bg-purple-50 transition-colors"
      title={title}
    >
      <i className={icon}></i>
    </button>
  );
} 