/**
 * 🤖 AI Q&A 패널 컴포넌트 (사이드 패널용)
 *
 * - 프리셋 질문 5개 제공
 * - 자유 질문 입력 및 AI 응답
 * - 실시간 추론 과정 시각화 (ThinkingView)
 * - 대화 이력 관리
 */

'use client';

import {
  PRESET_QUESTIONS,
  useAIChat,
  useAIThinking,
} from '@/stores/useAISidebarStore';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Clock,
  Lightbulb,
  MessageSquare,
  Send,
  Trash2,
  User,
  Zap,
} from 'lucide-react';
import React from 'react';
import BasePanelLayout from './shared/BasePanelLayout';
import ThinkingView from './ThinkingView';

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
        // 🚀 실제 AI 응답 API 호출
        const response = await fetch('/api/ai/adaptive-query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: question,
            mode: 'LOCAL',
            context: 'qa-panel'
          }),
        });

        if (!response.ok) {
          throw new Error(`AI 응답 API 오류: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.response) {
          const aiResponseContent = data.response;
          const confidence = data.confidence || 0.7;

          // 실제 API의 thinking logs가 있으면 사용
          if (data.thinkingLogs && data.thinkingLogs.length > 0) {
            for (const log of data.thinkingLogs) {
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
        } else {
          throw new Error(data.error || 'AI 응답 생성 실패');
        }
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${message.type === 'user'
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
                        className={`p-3 rounded-lg ${message.type === 'user'
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
