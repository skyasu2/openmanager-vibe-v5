'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, BarChart3, Activity, AlertTriangle } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  relatedServers?: string[];
  hasChart?: boolean;
  actionButtons?: string[];
}

interface AIChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
  isTyping?: boolean;
}

const TypingIndicator = () => (
  <motion.div
    className="flex items-center space-x-2 p-3 bg-white rounded-lg shadow-sm"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <Bot className="w-5 h-5 text-blue-500" />
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2
          }}
        />
      ))}
    </div>
  </motion.div>
);

const MessageBubble = ({ message }: { message: ChatMessage }) => {
  const isUser = message.type === 'user';
  
  return (
    <motion.div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className={`max-w-xs lg:max-w-md ${isUser ? 'order-2' : 'order-1'}`}>
        <div
          className={`
            px-4 py-3 rounded-lg shadow-sm
            ${isUser 
              ? 'bg-blue-600 text-white ml-auto' 
              : 'bg-white text-gray-800 border border-gray-200'
            }
          `}
        >
          {/* 메시지 헤더 */}
          <div className="flex items-center space-x-2 mb-2">
            {isUser ? (
              <User className="w-4 h-4" />
            ) : (
              <Bot className="w-4 h-4 text-blue-500" />
            )}
            <span className={`text-xs font-medium ${isUser ? 'text-blue-100' : 'text-gray-600'}`}>
              {isUser ? 'You' : 'OpenManager AI'}
            </span>
            <span className={`text-xs ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>

          {/* 메시지 내용 */}
          <div className="whitespace-pre-wrap text-sm">
            {message.content}
          </div>

          {/* 차트 표시 */}
          {message.hasChart && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-gray-700">분석 차트</span>
              </div>
              <div className="h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded flex items-center justify-center">
                <span className="text-xs text-gray-600">실시간 메트릭 차트</span>
              </div>
            </div>
          )}

          {/* 액션 버튼 */}
          {message.actionButtons && message.actionButtons.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.actionButtons.map((button, index) => (
                <motion.button
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {button}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function AIChatPanel({ messages, onSendMessage, isTyping = false }: AIChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickQuestions = [
    "현재 시스템 상태는?",
    "CPU 사용률이 높은 서버는?",
    "경고 상태인 서버 분석",
    "전체 서버 성능 리포트"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-blue-600 via-purple-600 to-purple-700">
      {/* 헤더 */}
      <div className="p-4 border-b border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-white font-semibold">OpenManager AI</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white/80 text-sm">온라인</span>
            </div>
          </div>
        </div>
      </div>

      {/* 메시지 리스트 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* 빠른 질문 버튼 */}
      <div className="p-4 border-t border-white/20">
        <div className="mb-3">
          <span className="text-white/80 text-sm font-medium mb-2 block">빠른 질문:</span>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <motion.button
                key={index}
                className="px-3 py-1 bg-white/20 text-white text-xs rounded-lg hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onSendMessage(question)}
              >
                {question}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 입력창 */}
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="서버에 대해 무엇이든 물어보세요..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 resize-none focus:outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-sm"
              rows={2}
            />
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="px-4 py-3 bg-white text-blue-600 rounded-lg hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>

      {/* 시스템 상태 표시 */}
      <div className="p-3 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between text-white/70 text-xs">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>실시간 모니터링</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4" />
            <span>4개 활성 알림</span>
          </div>
        </div>
      </div>
    </div>
  );
} 