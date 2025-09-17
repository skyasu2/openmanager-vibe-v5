/**
 * 💬 AI 채팅 페이지 컴포넌트
 *
 * 자연어로 시스템 질의 및 AI 응답
 */

'use client';

import { useState, useRef, useEffect } from 'react';
// framer-motion 제거 - CSS 애니메이션 사용
import { Send, User, Bot, Sparkles, AlertCircle } from 'lucide-react';
import { useAIThinking } from '@/stores/useAISidebarStore';
import debug from '@/utils/debug';
import type { GoogleAIGenerateResponse } from '@/schemas/api.ai.schema';
// import ThinkingView from '../ThinkingView'; // 백업됨

interface Message {
  id: string;
  type: 'user' | 'ai' | 'error';
  content: string;
  timestamp: Date;
  metadata?: {
    processingTime?: number;
    [key: string]: any;
  };
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

  // Google AI API 호출 함수
  const callGoogleAI = async (prompt: string): Promise<GoogleAIGenerateResponse> => {
    const response = await fetch('/api/ai/google-ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-AI-Assistant': 'true',
        'X-AI-Mode': 'google-ai',
      },
      body: JSON.stringify({
        prompt,
        temperature: 0.7,
        maxTokens: 1000,
        model: 'gemini-1.5-flash'
      })
    });

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status}`);
    }

    return await response.json();
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setLocalMessages((prev) => [...prev, userMessage]);
    const currentPrompt = inputValue;
    setInputValue('');

    try {
      debug.log('🤖 Google AI 요청 시작:', currentPrompt);
      
      // AI 응답 처리
      const startTime = Date.now();
      const apiResponse = await callGoogleAI(currentPrompt);
      const processingTime = Date.now() - startTime;

      if (apiResponse.success && (apiResponse.response || apiResponse.text)) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: apiResponse.response || apiResponse.text || '응답을 받을 수 없습니다.',
          timestamp: new Date(),
          metadata: {
            ...apiResponse.metadata,
            processingTime
          }
        };
        
        setLocalMessages((prev) => [...prev, aiMessage]);
        debug.log(`✅ Google AI 응답 성공: ${processingTime}ms`);
      } else {
        throw new Error('message' in apiResponse ? String(apiResponse.message) : 'AI 응답에서 오류가 발생했습니다.');
      }
    } catch (error) {
      debug.error('❌ Google AI 오류:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'error',
        content: `죄송합니다. AI 서비스에 일시적인 문제가 발생했습니다. ${error instanceof Error ? error.message : '알 수 없는 오류'}가 발생했습니다. 잠시 후 다시 시도해 주세요.`,
        timestamp: new Date(),
      };
      setLocalMessages((prev) => [...prev, errorMessage]);
    }
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
                    : message.type === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}
              >
                {message.type === 'user' ? (
                  <User className="h-4 w-4" />
                ) : message.type === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={`rounded-lg p-3 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.type === 'error'
                    ? 'border border-red-200 bg-red-50 text-red-800'
                    : 'border border-gray-200 bg-white text-gray-800'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p
                    className={`text-xs ${
                      message.type === 'user' 
                        ? 'text-blue-100' 
                        : message.type === 'error'
                        ? 'text-red-500'
                        : 'text-gray-500'
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                  {message.metadata?.processingTime && (
                    <p className="text-xs text-gray-400">
                      {message.metadata.processingTime}ms
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* AI 사고 과정 */}
        {isThinking && (
          <div className="flex justify-start">
            <div className="flex max-w-[80%] items-start space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500">
                <Sparkles className="animate-pulse h-4 w-4 text-white" />
              </div>
              <div className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500"></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500" style={{animationDelay: '0.1s'}}></div>
                  <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500" style={{animationDelay: '0.2s'}}></div>
                  <span className="text-sm text-gray-500 ml-2">Google AI가 질의를 분석하고 있습니다...</span>
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
            disabled={!inputValue.trim() || isThinking}
            className="rounded-lg bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isThinking ? (
              <Sparkles className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
