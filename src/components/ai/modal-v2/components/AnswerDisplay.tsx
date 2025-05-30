'use client';

import { useEffect, useRef, useState } from 'react';
import FeedbackButtons from '@/components/ai/FeedbackButtons';
import { InteractionLogger } from '@/services/ai-agent/logging/InteractionLogger';
import ThinkingProcess from './ThinkingProcess';
import ThinkingLogViewer from './ThinkingLogViewer';

interface ThinkingStep {
  timestamp: string;
  step: string;
  content: string;
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  duration?: number;
}

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
  onBackToPresets?: () => void;
}

export default function AnswerDisplay({
  question,
  answer,
  isLoading,
  metadata,
  onBackToPresets
}: AnswerDisplayProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [interactionId, setInteractionId] = useState<string | null>(null);
  const [thinkingLogs, setThinkingLogs] = useState<ThinkingStep[]>([]);

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
        window.open('/logs', '_blank');
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
    <div className="animate-fade-in bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
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

      {/* AI 사고 과정 로그 - 질문과 답변 사이에 위치 */}
      {!isLoading && thinkingLogs.length > 0 && (
        <div className="px-6">
          <ThinkingLogViewer 
            thinkingLogs={thinkingLogs}
            question={question}
          />
        </div>
      )}

      {/* 답변 내용 */}
      <div className="px-6 py-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0 mt-1">
            <i className="fas fa-robot"></i>
          </div>

          <div className="flex-1">
            {isLoading ? (
              // 로딩 중 - AI 사고 과정 표시
              <div className="space-y-4">
                <div className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-700 font-medium text-sm mb-2">
                    <i className="fas fa-lightbulb animate-pulse"></i>
                    <span>AI가 질문을 분석하고 있습니다</span>
                  </div>
                  <div className="text-xs text-indigo-600 mb-3">
                    실제 ChatGPT-o1과 같은 방식으로 단계별 사고 과정을 보여드립니다
                  </div>
                  <ThinkingProcess
                    isActive={isLoading}
                    onComplete={(logs) => setThinkingLogs(logs)}
                    query={question}
                    serverData={metadata?.serverState?.servers || []}
                  />
                </div>
              </div>
            ) : (
              // 답변 표시
              <div>
                {/* 서버 상태 리포트 카드 (질문에 따라 표시) */}
                {(question.includes('서버') || question.includes('상태') || question.includes('분석')) && metadata?.serverState && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <i className="fas fa-chart-bar text-blue-600"></i>
                      <span className="text-sm font-medium text-blue-800">서버 상태 요약</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-green-600">
                              {metadata.serverState.healthyServers || 8}
                            </div>
                            <div className="text-xs text-gray-600">정상 서버</div>
                          </div>
                          <i className="fas fa-check-circle text-green-500"></i>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-yellow-600">
                              {metadata.serverState.warningServers || 2}
                            </div>
                            <div className="text-xs text-gray-600">경고 서버</div>
                          </div>
                          <i className="fas fa-exclamation-triangle text-yellow-500"></i>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-red-600">
                              {metadata.serverState.criticalServers || 0}
                            </div>
                            <div className="text-xs text-gray-600">위험 서버</div>
                          </div>
                          <i className="fas fa-times-circle text-red-500"></i>
                        </div>
                      </div>
                      <div className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-lg font-bold text-blue-600">
                              {metadata.serverState.totalServers || 10}
                            </div>
                            <div className="text-xs text-gray-600">전체 서버</div>
                          </div>
                          <i className="fas fa-server text-blue-500"></i>
                        </div>
                      </div>
                    </div>
                    {/* 간단한 성능 지표 */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">평균 CPU 사용률</span>
                        <span className="font-medium text-gray-800">{metadata.serverState.avgCpu || '45'}%</span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-600">평균 메모리 사용률</span>
                        <span className="font-medium text-gray-800">{metadata.serverState.avgMemory || '62'}%</span>
                      </div>
                    </div>
                  </div>
                )}

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
                  <div className="flex items-center gap-1">
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

                {/* 프리셋으로 돌아가기 버튼 */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={onBackToPresets}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 font-medium shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <i className="fas fa-arrow-left"></i>
                    <span>다른 기능 선택하기</span>
                  </button>
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
      className="text-xs text-gray-500 hover:text-purple-600 p-2 rounded-lg hover:bg-purple-50 transition-all duration-200 hover:shadow-sm"
      title={title}
    >
      <i className={icon}></i>
    </button>
  );
} 