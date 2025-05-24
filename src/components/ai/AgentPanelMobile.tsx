'use client';

import { useState, useRef, useEffect } from 'react';
import AgentQueryBox from './AgentQueryBox';
import AgentResponseView from './AgentResponseView';

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
  initialQuery?: string;
  initialServerId?: string;
}

export default function AgentPanelMobile({ isOpen, onClose, initialQuery, initialServerId }: AgentPanelMobileProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (initialQuery && isOpen) {
      handleSendMessage(initialQuery, initialServerId);
    }
  }, [initialQuery, isOpen]);

  const handleSendMessage = async (query: string, serverId?: string) => {
    if (!query.trim()) return;

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
      await new Promise(resolve => setTimeout(resolve, 1000));
      const aiResponse = await simulateAIResponse(query, serverId);
      
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

  const simulateAIResponse = async (query: string, serverId?: string): Promise<string> => {
    const lowerQuery = query.toLowerCase();
    
    if (serverId) {
      if (lowerQuery.includes('분석') || lowerQuery.includes('상태')) {
        return `🔍 **${serverId} 서버 분석**

**현재 상태:** 정상 운영 중
**주의사항:** CPU/메모리 사용률 높음

**권장사항:**
- 프로세스 최적화
- 메모리 정리
- 로드밸런싱 검토`;
      }
    }
    
    if (lowerQuery.includes('서버') && lowerQuery.includes('상태')) {
      return `📊 **전체 서버 현황**

**온라인:** 4대 (67%)
**경고:** 1대 (17%) 
**오프라인:** 1대 (17%)

**주의 서버:**
- DB-EU-002: 리소스 높음
- CACHE-US-004: 연결 끊김`;
    }

    return `안녕하세요! 🤖 OpenManager AI입니다.

**도움이 가능한 항목:**
- 서버 상태 분석
- 성능 최적화 제안  
- 로그 분석
- 문제 해결 방안

구체적인 질문을 해주세요!`;
  };

  const clearChat = () => {
    setMessages([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      ></div>

      {/* 드로어 */}
      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* 드래그 핸들 */}
        <div className="flex justify-center py-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i className="fas fa-brain text-white text-sm"></i>
            </div>
            <div>
              <h2 className="font-semibold">AI 에이전트</h2>
              <p className="text-xs opacity-90">OpenManager AI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
              title="대화 내용 지우기"
            >
              <i className="fas fa-broom text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 hover:bg-gray-100 rounded-lg flex items-center justify-center transition-colors"
              title="패널 닫기"
            >
              <i className="fas fa-times text-sm bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
            </button>
          </div>
        </div>

        {/* 대화 내용 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-brain text-xl bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent"></i>
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-2">AI에게 질문하세요</h3>
              <p className="text-sm text-gray-500 mb-4">서버 관련 모든 것을 도와드립니다</p>
              
              {/* 빠른 질문 버튼들 */}
              <div className="space-y-2 px-4">
                <button
                  onClick={() => handleSendMessage('전체 서버 상태는?')}
                  className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  💻 전체 서버 상태는?
                </button>
                <button
                  onClick={() => handleSendMessage('성능 이슈 찾아줘')}
                  className="w-full text-left p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm transition-colors"
                >
                  ⚡ 성능 이슈 찾아줘
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
        <div className="border-t border-gray-200 p-4 bg-white rounded-t-3xl">
          <AgentQueryBox
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
            placeholder="질문을 입력하세요..."
          />
        </div>
      </div>
    </div>
  );
} 