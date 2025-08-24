/**
 * 💬 AI 채팅 페이지 컴포넌트
 *
 * 자연어로 시스템 질의 및 AI 응답
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { Send, User, Bot, Sparkles } from 'lucide-react';
import { useAIThinking } from '@/stores/useAISidebarStore';
// import ThinkingView from '../ThinkingView'; // 백업됨

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

const QUICK_QUESTIONS = [
  '현재 서버 상태는 어떤가요?',
  'CPU 사용률이 높은 서버를 찾아주세요',
  '메모리 부족 경고가 있나요?',
  '네트워크 지연이 발생하고 있나요?',
];

export default function AIChatPage() {
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isThinking } = useAIThinking();

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `현재 시스템 상태를 분석한 결과, 8개 서버 중 7개가 정상 작동 중입니다. CPU 사용률은 평균 45%이며, 메모리 사용률은 68%입니다. 특별한 이상 징후는 발견되지 않았습니다.`,
        timestamp: new Date(),
      };
      setLocalMessages((prev) => [...prev, aiMessage]);
    }, 2000);
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-blue-50 to-cyan-50">
      {/* 헤더 */}
      <div className="border-b border-blue-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">AI 채팅</h2>
            <p className="text-sm text-gray-600">자연어로 시스템 질의</p>
          </div>
        </div>
      </div>

      {/* 빠른 질문 */}
      {localMessages.length === 0 && (
        <div className="border-b border-blue-200 p-4">
          <h3 className="mb-2 text-sm font-medium text-gray-700">빠른 질문</h3>
          <div className="grid grid-cols-1 gap-2">
            {QUICK_QUESTIONS.map((question, index) => (
              <button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className="rounded-lg border border-blue-200 bg-white p-3 text-left text-sm transition-colors hover:border-blue-300 hover:bg-blue-50"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {localMessages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[80%] items-start space-x-2 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'border border-gray-200 bg-white text-gray-800'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`mt-1 text-xs ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* AI 사고 과정 */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] items-start space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                <Sparkles className="_animate-pulse h-4 w-4 text-white" />
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                {/* <ThinkingView isThinking={true} logs={[]} /> */}
                <div className="py-4 text-center text-gray-500">
                  AI가 생각하고 있습니다...
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t border-blue-200 bg-white/80 p-4 backdrop-blur-sm">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="시스템에 대해 질문해보세요..."
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
