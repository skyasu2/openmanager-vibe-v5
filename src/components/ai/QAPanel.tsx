/**
 * 💬 AI Q&A 패널 컴포넌트 (사이드 패널용)
 * 
 * - 프리셋 질문 및 자유 입력
 * - AI 응답 생성 시뮬레이션
 * - 대화 이력 관리
 * - 최적화된 UI/UX
 */

'use client';

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  User, 
  Bot, 
  Lightbulb, 
  Clock,
  CheckCircle,
  Zap
} from 'lucide-react';
import BasePanelLayout from './shared/BasePanelLayout';
import { useAIChat } from '@/stores/useAISidebarStore';
import { PRESET_QUESTIONS } from '@/stores/useAISidebarStore';

interface QAPanelProps {
  className?: string;
}

// 프리셋 질문들 (5개 핵심 질문)
const PANEL_PRESET_QUESTIONS = PRESET_QUESTIONS.slice(0, 5);

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  confidence?: number;
  timestamp: Date;
}

const QAPanel: React.FC<QAPanelProps> = ({ className = '' }) => {
  const { responses, addResponse } = useAIChat();
  
  // 로컬 상태
  const [inputText, setInputText] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [conversations, setConversations] = React.useState<ChatMessage[]>([]);

  // AI 응답 시뮬레이션
  const generateAIResponse = React.useCallback(async (question: string) => {
    setIsProcessing(true);
    
    // 사용자 메시지 추가
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: question,
      timestamp: new Date()
    };
    setConversations(prev => [...prev, userMessage]);
    
    try {
      // 2초 지연으로 실제 AI 호출 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI 응답 생성
      const responses = {
        '현재 시스템의 전반적인 성능 상태는 어떤가요?': 
          '현재 시스템은 전반적으로 안정적입니다. 16개 서버 중 14개가 정상 상태이며, 2개 서버에서 경미한 성능 이슈가 감지되었습니다. CPU 평균 사용률 68%, 메모리 72% 수준으로 양호합니다.',
        'CPU 사용률이 높은 서버들을 분석해주세요':
          'Server-03, Server-07, Server-12에서 CPU 사용률이 85% 이상입니다. 주요 원인은 백그라운드 프로세스 증가와 트래픽 집중으로 분석됩니다. 즉시 조치가 필요합니다.',
        '메모리 사용량 트렌드를 분석해주세요':
          '최근 24시간 메모리 사용량이 점진적으로 증가하는 추세입니다. Server-07에서 메모리 누수 패턴이 의심되며, 재시작 또는 프로세스 점검을 권장합니다.',
        '응답 시간이 느린 서버를 찾아주세요':
          'Server-05와 Server-11에서 평균 응답시간이 300ms를 초과합니다. 네트워크 지연과 데이터베이스 쿼리 최적화가 필요합니다.',
        '보안상 위험한 서버나 패턴이 있나요?':
          '특정 IP에서 반복적인 로그인 실패가 감지되었습니다. 현재 차단 조치 중이며, 추가 보안 강화를 권장합니다. 전체적으로 보안 상태는 양호합니다.'
      };
      
      const defaultResponse = '질문을 분석 중입니다. 시스템 상태를 종합적으로 검토하여 정확한 답변을 제공하겠습니다.';
      const aiResponseContent = responses[question as keyof typeof responses] || defaultResponse;
      const confidence = Math.random() * 0.15 + 0.85; // 85-100% 신뢰도
      
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        type: 'ai',
        content: aiResponseContent,
        confidence: confidence,
        timestamp: new Date()
      };
      
      setConversations(prev => [...prev, aiMessage]);
      
      // 전역 상태에도 추가
      addResponse({
        content: aiResponseContent,
        confidence: confidence
      });
      
    } catch (error) {
      console.error('AI 응답 생성 오류:', error);
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: '죄송합니다. 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
        timestamp: new Date()
      };
      setConversations(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
    }
  }, [addResponse]);

  // 프리셋 질문 클릭 핸들러
  const handlePresetQuestion = (question: string) => {
    generateAIResponse(question);
  };

  // 사용자 입력 전송
  const handleSendMessage = () => {
    if (inputText.trim() && !isProcessing) {
      generateAIResponse(inputText.trim());
      setInputText('');
    }
  };

  // 대화 클리어
  const clearConversations = () => {
    setConversations([]);
  };

  return (
    <BasePanelLayout
      title="AI Q&A"
      subtitle="스마트 질의응답 시스템"
      icon={<MessageSquare className="w-4 h-4 text-white" />}
      iconGradient="bg-gradient-to-br from-blue-500 to-purple-600"
      showFilters={false}
      bottomInfo={{
        primary: '🤖 AI가 시스템 상태를 분석하여 답변합니다',
        secondary: '프리셋 질문을 활용하거나 자유롭게 질문해보세요'
      }}
      className={className}
    >
      <div className="flex flex-col h-full">
        {/* 프리셋 질문들 */}
        <div className="p-4 border-b border-gray-700/30">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-300 text-sm font-medium">추천 질문</span>
          </div>
          <div className="space-y-2">
            {PANEL_PRESET_QUESTIONS.map((preset) => (
              <motion.button
                key={preset.id}
                onClick={() => handlePresetQuestion(preset.question)}
                disabled={isProcessing}
                className="w-full text-left p-3 bg-gray-800/50 hover:bg-gray-700/70 border border-gray-600/30 
                           rounded-lg text-gray-200 text-sm transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {preset.question}
                {preset.isAIRecommended && (
                  <span className="ml-2 text-xs text-blue-400">★ AI 추천</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 대화 영역 */}
        <div className="flex-1 overflow-y-auto p-4">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">위의 추천 질문을 선택하거나</p>
              <p className="text-xs text-gray-600 mt-1">아래에 자유롭게 질문해보세요</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {conversations.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* 아바타 */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' 
                          ? 'bg-blue-500/20 border border-blue-500/30' 
                          : 'bg-green-500/20 border border-green-500/30'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-blue-400" />
                        ) : (
                          <Bot className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      
                      {/* 메시지 내용 */}
                      <div className={`p-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-blue-500/20 border border-blue-500/30 text-blue-200'
                          : 'bg-gray-800/50 border border-gray-600/30 text-gray-200'
                      }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        
                        {/* 메타 정보 */}
                        <div className="flex items-center gap-2 mt-2 text-xs opacity-70">
                          <Clock className="w-3 h-3" />
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                          {message.confidence && (
                            <>
                              <Zap className="w-3 h-3 ml-2" />
                              <span>신뢰도 {Math.round(message.confidence * 100)}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* 로딩 인디케이터 */}
              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="bg-gray-800/50 border border-gray-600/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                      <span>AI가 분석 중입니다...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* 입력 영역 */}
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="질문을 입력하세요..."
              disabled={isProcessing}
              className="flex-1 px-3 py-2 bg-gray-800/50 border border-gray-600/30 rounded-lg text-gray-200 
                         text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500/50 
                         disabled:opacity-50 transition-colors"
            />
            <motion.button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isProcessing}
              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 
                         rounded-lg text-blue-300 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
          
          {conversations.length > 0 && (
            <motion.button
              onClick={clearConversations}
              className="mt-2 text-xs text-gray-500 hover:text-gray-400 transition-colors"
              whileHover={{ scale: 1.02 }}
            >
              대화 내용 지우기
            </motion.button>
          )}
        </div>
      </div>
    </BasePanelLayout>
  );
};

export default QAPanel; 