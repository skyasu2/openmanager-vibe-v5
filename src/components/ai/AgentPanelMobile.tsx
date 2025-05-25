'use client';

import { useState, useRef, useEffect } from 'react';
import AgentQueryBox from './AgentQueryBox';
import AgentResponseView from './AgentResponseView';
import { usePowerStore } from '../../stores/powerStore';
import { smartAIAgent } from '../../services/aiAgent';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  serverId?: string;
}

interface AgentPanelMobileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentPanelMobile({ isOpen, onClose }: AgentPanelMobileProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 절전 모드 상태
  const { mode, updateActivity } = usePowerStore();
  const isSystemActive = mode === 'active' || mode === 'monitoring';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (query: string, serverId?: string) => {
    if (!query.trim()) return;

    // 활동 업데이트
    updateActivity();

    // 사용자 메시지 추가
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date(),
      serverId
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let aiResponse: string;
      
      if (isSystemActive) {
        // 스마트 AI 에이전트 응답 생성
        const smartResponse = smartAIAgent.generateSmartResponse(query);
        aiResponse = smartResponse.response;
      } else {
        // 절전 모드 응답
        aiResponse = '💤 시스템이 절전 모드입니다. 랜딩 페이지에서 시스템을 활성화해주세요.';
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
        serverId
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI 응답 오류:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '죄송합니다. 응답을 생성하는 중 오류가 발생했습니다.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 백드롭 */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />

      {/* 모바일 드로어 */}
      <div className="fixed inset-x-0 bottom-0 h-[80vh] bg-white z-50 flex flex-col rounded-t-2xl shadow-2xl">
        {/* 핸들 */}
        <div className="flex justify-center py-3">
          <div className="w-12 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <i className="fas fa-brain text-white text-sm"></i>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">AI 에이전트</h2>
              <p className="text-xs text-gray-500">OpenManager AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
              title="대화 내용 지우기"
            >
              <i className="fas fa-broom text-sm text-gray-600"></i>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
              title="패널 닫기"
            >
              <i className="fas fa-times text-sm text-gray-600"></i>
            </button>
          </div>
        </div>

        {/* 대화 내용 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-brain text-2xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI 에이전트에게 질문하세요</h3>
              <p className="text-sm text-gray-500 mb-4">서버 상태, 성능 분석, 문제 해결 등<br />무엇이든 물어보세요!</p>
              
              {/* 빠른 질문 버튼들 */}
              <div className="space-y-2">
                <button
                  onClick={() => handleSendMessage('전체 서버 상태는 어떤가요?')}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  💻 전체 서버 상태는 어떤가요?
                </button>
                <button
                  onClick={() => handleSendMessage('성능 이슈가 있는 서버를 찾아주세요')}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  ⚡ 성능 이슈가 있는 서버를 찾아주세요
                </button>
                <button
                  onClick={() => handleSendMessage('최근 에러 로그를 분석해주세요')}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  🔍 최근 에러 로그를 분석해주세요
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <AgentResponseView
              key={message.id}
              message={message}
              isLoading={false}
            />
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm">
                <i className="fas fa-brain"></i>
              </div>
              <div className="flex-1 bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm text-gray-500">분석 중...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        <div className="border-t border-gray-200 p-4">
          <AgentQueryBox
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="서버에 대해 질문해보세요..."
          />
        </div>
      </div>
    </>
  );
} 