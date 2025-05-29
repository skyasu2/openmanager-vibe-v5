'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Brain, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble from './MessageBubble';
import DynamicPresets from './DynamicPresets';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'thinking';
  content: string;
  thinking?: ThinkingProcess;
  timestamp: Date;
}

interface ThinkingProcess {
  steps: string[];
  confidence: number;
  duration: number;
}

interface ChatSectionProps {
  serverMetrics?: any;
  onClose: () => void;
}

export default function ChatSection({ serverMetrics, onClose }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 메시지 추가 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);

    try {
      // AI 응답 시뮬레이션 (기존 로직과 연동 예정)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const thinking: ThinkingProcess = {
        steps: [
          '서버 메트릭스 분석 중...',
          '패턴 인식 및 이상 감지...',
          '최적화 방안 도출...',
          '응답 생성 중...'
        ],
        confidence: 0.85,
        duration: 1.8
      };

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `분석 완료했습니다. ${userMessage.content}에 대한 답변을 드리겠습니다. 현재 시스템 상태를 기반으로 분석한 결과입니다.`,
        thinking,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI 응답 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setInput(preset);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          AI 어시스턴트
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* 동적 프리셋 질문 - 최상단 고정 */}
        {messages.length === 0 && (
          <DynamicPresets serverMetrics={serverMetrics} onSelect={handlePresetSelect} />
        )}
        
        {/* 대화 내역 */}
        <AnimatePresence>
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </AnimatePresence>

        {/* 로딩 표시 */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-gray-500"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">AI가 생각하고 있습니다...</span>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* 입력 영역 */}
      <div className="border-t px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="질문을 입력하세요..."
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isProcessing}
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
} 