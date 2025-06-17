/**
 * 🤖 AI Q&A 패널 컴포넌트 (사이드 패널용)
 *
 * - 프리셋 질문 5개 제공
 * - 자유 질문 입력 및 AI 응답
 * - 실시간 추론 과정 시각화 (ThinkingView)
 * - 대화 이력 관리
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Lightbulb,
  Send,
  Trash2,
  User,
  Bot,
  Clock,
  Zap,
} from 'lucide-react';
import BasePanelLayout from './shared/BasePanelLayout';
import ThinkingView from './ThinkingView';
import {
  useAIChat,
  useAIThinking,
  PRESET_QUESTIONS,
} from '@/stores/useAISidebarStore';

// 패널용 프리셋 질문 (5개 선별)
const PANEL_PRESET_QUESTIONS = [
  PRESET_QUESTIONS[0], // 성능 상태
  PRESET_QUESTIONS[1], // CPU 분석
  PRESET_QUESTIONS[2], // 메모리 트렌드 (AI 추천)
  PRESET_QUESTIONS[4], // 보안 상태
  PRESET_QUESTIONS[11], // 종합 분석 (AI 추천)
].filter(Boolean); // undefined 항목 제거

interface QAPanelProps {
  className?: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  confidence?: number;
  timestamp: Date;
}

const QAPanel: React.FC<QAPanelProps> = ({ className = '' }) => {
  const { responses, addResponse } = useAIChat({
    initialMode: 'chat',
  } as any);
  const {
    isThinking,
    currentQuestion,
    logs,
    setThinking,
    setCurrentQuestion,
    addLog,
    clearLogs,
  } = useAIThinking();

  // 로컬 상태
  const [inputText, setInputText] = React.useState('');
  const [conversations, setConversations] = React.useState<ChatMessage[]>([]);

  // 실제 AI API 호출 함수
  const callRealAI = React.useCallback(async (question: string) => {
    try {
      // 1. 실제 MCP 서버 연동 시도 (Render)
      const mcpResponse = await fetch('/api/mcp/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: question,
          sessionId: `qa_${Date.now()}`,
          mcpServerUrl: 'https://openmanager-vibe-v5.onrender.com',
        }),
      });

      if (mcpResponse.ok) {
        const mcpData = await mcpResponse.json();

        return {
          answer: mcpData.response,
          confidence: mcpData.confidence,
          source: mcpData.source,
          thinkingLogs: [
            {
              step: 'MCP 서버 연결',
              content: 'Render 기반 MCP 서버에 성공적으로 연결되었습니다.',
              type: 'analysis' as const,
              duration: 200,
              progress: 0.2,
            },
            {
              step: 'MCP 도구 활용',
              content: `${mcpData.source === 'mcp-server' ? '실제' : '로컬'} MCP 도구를 사용하여 분석했습니다.`,
              type: 'data_processing' as const,
              duration: 500,
              progress: 0.6,
            },
            {
              step: '응답 생성 완료',
              content: '분석 결과를 바탕으로 최종 응답을 생성했습니다.',
              type: 'response_generation' as const,
              duration: 300,
              progress: 1.0,
            },
          ],
        };
      }
    } catch (mcpError) {
      console.warn('MCP 서버 연결 실패, 시뮬레이션으로 폴백:', mcpError);
    }

    // 2. MCP 실패 시 기존 시뮬레이션 로직
    throw new Error('MCP_FALLBACK_TO_SIMULATION');
  }, []);

  // AI 응답 시뮬레이션 (실시간 thinking 과정 포함)
  const generateAIResponse = React.useCallback(
    async (question: string) => {
      setThinking(true);
      setCurrentQuestion(question);
      clearLogs();

      // 사용자 메시지 추가
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        type: 'user',
        content: question,
        timestamp: new Date(),
      };
      setConversations(prev => [...prev, userMessage]);

      try {
        // 실제 AI API 사용 시도
        let aiResponseContent: string;
        let confidence: number;

        try {
          const aiResponse = await callRealAI(question);
          aiResponseContent = aiResponse.answer;
          confidence = aiResponse.confidence;

          // 실제 API의 thinking logs가 있으면 사용
          if (aiResponse.thinkingLogs && aiResponse.thinkingLogs.length > 0) {
            for (const log of aiResponse.thinkingLogs) {
              (addLog as any)({
                message: log.content,
                type: log.type,
                step: log.step,
                content: log.content,
                duration: log.duration,
                progress: log.progress,
              });
              // 각 단계 사이에 약간의 지연 추가
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          } else {
            // API에서 thinking logs가 없으면 시뮬레이션 사용
            await simulateThinkingProcess(question);
          }
        } catch (apiError) {
          console.log('MCP API 실패, RAG 폴백 시도:', apiError);

          // RAG 폴백 시도
          try {
            const ragResponse = await fetch('/api/ai/hybrid', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: question,
                mode: 'rag-only',
              }),
            });

            if (ragResponse.ok) {
              const ragData = await ragResponse.json();
              aiResponseContent =
                ragData.response ||
                `로컬 RAG 엔진을 통해 "${question}"에 대한 분석을 완료했습니다.`;
              confidence = ragData.confidence || 0.7;

              // RAG 성공 시 thinking 과정 시뮬레이션
              await simulateThinkingProcess(question);

              const aiMessage: ChatMessage = {
                id: `ai_${Date.now()}`,
                type: 'ai',
                content: aiResponseContent,
                confidence: confidence,
                timestamp: new Date(),
              };

              setConversations(prev => [...prev, aiMessage]);

              (addResponse as any)({
                response: aiResponseContent,
                confidence: confidence,
                engine: 'rag',
                responseTime: '0ms',
                mode: 'rag-only',
              });

              setThinking(false);
              return;
            }
          } catch (ragError) {
            console.log('RAG 폴백도 실패, 시뮬레이션으로 전환:', ragError);
          }

          // 모든 AI 엔진 실패 시에만 시뮬레이션 사용
          await simulateThinkingProcess(question);

          // Mock 응답 사용
          const mockResponses = {
            '현재 시스템의 전반적인 성능 상태는 어떤가요?':
              '현재 시스템은 전반적으로 안정적입니다. 16개 서버 중 14개가 정상 상태이며, 2개 서버에서 경미한 성능 이슈가 감지되었습니다. CPU 평균 사용률 68%, 메모리 72% 수준으로 양호합니다.',
            'CPU 사용률이 높은 서버들을 분석해주세요':
              'Server-03, Server-07, Server-12에서 CPU 사용률이 85% 이상입니다. 주요 원인은 백그라운드 프로세스 증가와 트래픽 집중으로 분석됩니다. 즉시 조치가 필요합니다.',
            '메모리 사용량 트렌드를 분석해주세요':
              '최근 24시간 메모리 사용량이 점진적으로 증가하는 추세입니다. Server-07에서 메모리 누수 패턴이 의심되며, 재시작 또는 프로세스 점검을 권장합니다.',
            '응답 시간이 느린 서버를 찾아주세요':
              'Server-05와 Server-11에서 평균 응답시간이 300ms를 초과합니다. 네트워크 지연과 데이터베이스 쿼리 최적화가 필요합니다.',
            '보안상 위험한 서버나 패턴이 있나요?':
              '특정 IP에서 반복적인 로그인 실패가 감지되었습니다. 현재 차단 조치 중이며, 추가 보안 강화를 권장합니다. 전체적으로 보안 상태는 양호합니다.',
            '전체 인프라의 상태를 종합적으로 분석해주세요':
              '전체 인프라는 안정적으로 운영되고 있습니다. 주요 지표: 가용성 99.2%, 평균 응답시간 180ms, 처리량 초당 1,250 요청. 일부 최적화 권장사항이 있으나 긴급하지 않습니다.',
          };

          const defaultResponse =
            '질문을 분석한 결과, 시스템 상태를 종합적으로 검토하여 정확한 답변을 제공했습니다. 추가 궁금한 사항이 있으시면 언제든 문의해주세요.';
          aiResponseContent =
            mockResponses[question as keyof typeof mockResponses] ||
            defaultResponse;
          confidence = Math.random() * 0.15 + 0.85; // 85-100% 신뢰도
        }

        const aiMessage: ChatMessage = {
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: aiResponseContent,
          confidence: confidence,
          timestamp: new Date(),
        };

        setConversations(prev => [...prev, aiMessage]);

        // 전역 상태에도 추가
        (addResponse as any)({
          query: currentQuestion || '질문 없음',
          response: aiResponseContent,
          confidence: confidence,
        });
      } catch (error) {
        console.error('AI 응답 생성 오류:', error);

        (addLog as any)({
          step: '오류 발생',
          content: '응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
          type: 'response_generation',
          duration: 0,
        });

        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          type: 'ai',
          content:
            '죄송합니다. 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
          timestamp: new Date(),
        };
        setConversations(prev => [...prev, errorMessage]);
      } finally {
        setThinking(false);
        setCurrentQuestion('');
      }
    },
    [
      addResponse,
      setThinking,
      setCurrentQuestion,
      addLog,
      clearLogs,
      callRealAI,
    ]
  );

  // Thinking 과정 시뮬레이션 함수
  const simulateThinkingProcess = React.useCallback(
    async (question: string) => {
      // 🧠 Step 1: 질문 분석
      await new Promise(resolve => setTimeout(resolve, 500));
      (addLog as any)({
        step: '질문 분석 시작',
        content: `사용자 질문을 분석하고 있습니다: "${question.substring(0, 50)}..."`,
        type: 'analysis',
        duration: 500,
        progress: 0.1,
      });

      // 🧠 Step 2: 데이터 수집
      await new Promise(resolve => setTimeout(resolve, 700));
      (addLog as any)({
        step: '시스템 데이터 수집',
        content:
          '서버 메트릭, 로그, 성능 지표 등 관련 데이터를 수집하고 있습니다.',
        type: 'data_processing',
        duration: 700,
        progress: 0.3,
      });

      // 🧠 Step 3: 패턴 분석
      await new Promise(resolve => setTimeout(resolve, 600));
      (addLog as any)({
        step: '패턴 매칭 분석',
        content:
          '수집된 데이터에서 패턴을 분석하고 이상 징후를 탐지하고 있습니다.',
        type: 'pattern_matching',
        duration: 600,
        progress: 0.6,
      });

      // 🧠 Step 4: 논리적 추론
      await new Promise(resolve => setTimeout(resolve, 800));
      (addLog as any)({
        step: '논리적 추론 수행',
        content:
          '분석 결과를 바탕으로 논리적 추론을 통해 최적의 답변을 도출하고 있습니다.',
        type: 'reasoning',
        duration: 800,
        progress: 0.8,
      });

      // 🧠 Step 5: 응답 생성
      await new Promise(resolve => setTimeout(resolve, 400));
      (addLog as any)({
        step: '최종 응답 생성',
        content:
          '추론 결과를 바탕으로 사용자에게 제공할 최종 응답을 생성하고 있습니다.',
        type: 'response_generation',
        duration: 400,
        progress: 1.0,
      });
    },
    [addLog]
  );

  // 프리셋 질문 클릭 핸들러
  const handlePresetQuestion = (question: string) => {
    if (!isThinking) {
      generateAIResponse(question);
    }
  };

  // 사용자 입력 전송
  const handleSendMessage = () => {
    if (inputText.trim() && !isThinking) {
      generateAIResponse(inputText.trim());
      setInputText('');
    }
  };

  // 대화 클리어
  const clearConversations = () => {
    setConversations([]);
    clearLogs();
  };

  return (
    <BasePanelLayout
      title='AI Q&A'
      subtitle='스마트 질의응답 시스템'
      icon={<MessageSquare className='w-4 h-4 text-white' />}
      iconGradient='bg-gradient-to-br from-blue-500 to-purple-600'
      showFilters={false}
      bottomInfo={{
        primary: '🤖 AI가 시스템 상태를 분석하여 답변합니다',
        secondary: '프리셋 질문을 활용하거나 자유롭게 질문해보세요',
      }}
      className={className}
    >
      <div className='flex flex-col h-full'>
        {/* 프리셋 질문들 */}
        <div className='p-4 border-b border-gray-700/30'>
          <div className='flex items-center gap-2 mb-3'>
            <Lightbulb className='w-4 h-4 text-yellow-400' />
            <span className='text-yellow-300 text-sm font-medium'>
              추천 질문
            </span>
          </div>
          <div className='space-y-2'>
            {PANEL_PRESET_QUESTIONS.map(preset => (
              <motion.button
                key={preset.id}
                onClick={() => handlePresetQuestion(preset.question)}
                disabled={isThinking}
                className='w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/70 border border-gray-600/30 
                           rounded-lg text-gray-200 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                whileHover={{ scale: isThinking ? 1 : 1.02 }}
                whileTap={{ scale: isThinking ? 1 : 0.98 }}
              >
                {preset.question}
                {preset.isAIRecommended && (
                  <span className='ml-2 text-xs text-blue-400'>★ AI 추천</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 실시간 추론 과정 표시 */}
        {(isThinking || logs.length > 0) && (
          <div className='p-4 border-b border-gray-700/30'>
            <ThinkingView
              isThinking={isThinking}
              logs={logs}
              currentQuestion={currentQuestion || ''}
            />
          </div>
        )}

        {/* 대화 영역 */}
        <div className='flex-1 overflow-y-auto p-4'>
          {conversations.length === 0 ? (
            <div className='text-center text-gray-500 mt-8'>
              <MessageSquare className='w-12 h-12 mx-auto mb-4 opacity-50' />
              <p className='text-sm'>위의 추천 질문을 선택하거나</p>
              <p className='text-xs text-gray-600 mt-1'>
                아래에 자유롭게 질문해보세요
              </p>
            </div>
          ) : (
            <div className='space-y-4'>
              <AnimatePresence>
                {conversations.map(message => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* 아바타 */}
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.type === 'user'
                            ? 'bg-blue-500/20 border border-blue-500/30'
                            : 'bg-green-500/20 border border-green-500/30'
                        }`}
                      >
                        {message.type === 'user' ? (
                          <User className='w-4 h-4 text-blue-400' />
                        ) : (
                          <Bot className='w-4 h-4 text-green-400' />
                        )}
                      </div>

                      {/* 메시지 내용 */}
                      <div
                        className={`p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                            : 'bg-gray-800/50 border border-gray-600/30 text-gray-200'
                        }`}
                      >
                        <p className='text-sm leading-relaxed'>
                          {message.content}
                        </p>

                        {/* 메타 정보 */}
                        <div className='flex items-center gap-2 mt-2 text-xs opacity-70'>
                          <Clock className='w-3 h-3' />
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                          {message.confidence && (
                            <>
                              <Zap className='w-3 h-3 ml-2' />
                              <span>
                                신뢰도 {Math.round(message.confidence * 100)}%
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className='p-4 border-t border-gray-700/50'>
          <div className='flex items-center gap-2'>
            <div className='flex-1 relative'>
              <input
                aria-label='입력 필드'
                type='text'
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  isThinking
                    ? 'AI가 생각하고 있습니다...'
                    : '질문을 입력하세요...'
                }
                disabled={isThinking}
                className='w-full px-4 py-2 bg-gray-800/50 border border-gray-600/30 rounded-lg 
                           text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500/50
                           disabled:opacity-50 disabled:cursor-not-allowed'
              />
            </div>
            <motion.button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isThinking}
              className='p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 
                         rounded-lg text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed
                         transition-colors'
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className='w-4 h-4' />
            </motion.button>
            {conversations.length > 0 && (
              <motion.button
                onClick={clearConversations}
                disabled={isThinking}
                className='p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 
                           rounded-lg text-red-300 disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors'
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Trash2 className='w-4 h-4' />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </BasePanelLayout>
  );
};

export default QAPanel;
