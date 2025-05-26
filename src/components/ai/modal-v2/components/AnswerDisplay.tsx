'use client';

import { useEffect, useRef, useState } from 'react';
import FeedbackButtons from '@/components/ai/FeedbackButtons';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';

interface AnswerDisplayProps {
  question: string;
  answer: string;
  isLoading: boolean;
}

export default function AnswerDisplay({
  question,
  answer,
  isLoading
}: AnswerDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);

  // 답변이 완료되면 상호작용 로깅
  useEffect(() => {
    if (answer && !isLoading && question) {
      const logInteraction = async () => {
        const logger = InteractionLogger.getInstance();
        const id = await logger.logInteraction({
          query: question,
          intent: 'general_query', // TODO: 실제 의도 분류 결과로 대체
          confidence: 0.85, // TODO: 실제 신뢰도 점수로 대체
          response: answer,
          contextData: {
            serverState: {}, // TODO: 실제 서버 상태 데이터
            activeMetrics: [],
            timeOfDay: new Date().toLocaleTimeString(),
            userRole: 'user',
            sessionId: 'session_' + Date.now()
          },
          responseTime: 1500 // TODO: 실제 응답 시간 측정
        });
        setInteractionId(id);
      };

      logInteraction();
    }
  }, [answer, isLoading, question]);

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
              // 로딩 표시
              <div className="animate-pulse">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">AI가 답변을 생성 중입니다...</span>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
                
                {/* 피드백 버튼 */}
                {interactionId && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <FeedbackButtons 
                      responseId={interactionId}
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