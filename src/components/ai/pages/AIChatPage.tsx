/**
 * 💬 AI 채팅 페이지 컴포넌트
 *
 * 자연어로 시스템 질의 및 AI 응답
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
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

    setLocalMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // AI 응답 시뮬레이션
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: `현재 시스템 상태를 분석한 결과, 8개 서버 중 7개가 정상 작동 중입니다. CPU 사용률은 평균 45%이며, 메모리 사용률은 68%입니다. 특별한 이상 징후는 발견되지 않았습니다.`,
        timestamp: new Date(),
      };
      setLocalMessages(prev => [...prev, aiMessage]);
    }, 2000);
  };

  const handleQuickQuestion = (question: string) => {
    setInputValue(question);
  };

  return (
    <div className='flex flex-col h-full bg-gradient-to-br from-blue-50 to-cyan-50'>
      {/* 헤더 */}
      <div className='p-4 border-b border-blue-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center'>
            <Bot className='w-5 h-5 text-white' />
          </div>
          <div>
            <h2 className='text-lg font-bold text-gray-800'>AI 채팅</h2>
            <p className='text-sm text-gray-600'>자연어로 시스템 질의</p>
          </div>
        </div>
      </div>

      {/* 빠른 질문 */}
      {localMessages.length === 0 && (
        <div className='p-4 border-b border-blue-200'>
          <h3 className='text-sm font-medium text-gray-700 mb-2'>빠른 질문</h3>
          <div className='grid grid-cols-1 gap-2'>
            {QUICK_QUESTIONS.map((question, index) => (
              <motion.button
                key={index}
                onClick={() => handleQuickQuestion(question)}
                className='text-left p-3 bg-white rounded-lg border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {question}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* 메시지 영역 */}
      <div className='flex-1 overflow-y-auto p-4 space-y-4'>
        {localMessages.map(message => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex items-start space-x-2 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                }`}
              >
                {message.type === 'user' ? (
                  <User className='w-4 h-4' />
                ) : (
                  <Bot className='w-4 h-4' />
                )}
              </div>
              <div
                className={`p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <p className='text-sm'>{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* AI 사고 과정 */}
        {isThinking && (
          <div className='flex justify-start'>
            <div className='flex items-start space-x-2 max-w-[80%]'>
              <div className='w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center'>
                <Sparkles className='w-4 h-4 text-white animate-pulse' />
              </div>
              <div className='bg-white border border-gray-200 rounded-lg p-3'>
                {/* <ThinkingView isThinking={true} logs={[]} /> */}
                <div className='text-center text-gray-500 py-4'>
                  AI가 생각하고 있습니다...
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className='p-4 border-t border-blue-200 bg-white/80 backdrop-blur-sm'>
        <div className='flex space-x-2'>
          <input
            type='text'
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
            placeholder='시스템에 대해 질문해보세요...'
            className='flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          />
          <motion.button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className='w-4 h-4' />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
