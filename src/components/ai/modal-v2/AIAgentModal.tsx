'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Brain,
  MessageSquare,
  Lightbulb,
  Settings,
  Send,
  Loader2,
  AlertTriangle,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { Button } from '../../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
// import { useAIAgent } from '../../../modules/ai-agent/infrastructure/AIAgentProvider';

interface AIAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle?: () => void;
  className?: string;
  mode?: 'chat' | 'analysis' | 'monitoring';
  serverContext?: any;
}

interface AIMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    confidence?: number;
    sources?: string[];
    thinking?: string[];
  };
}

/**
 * 🤖 AIAgentModal Component v2.0
 * 
 * AI 에이전트와의 상호작용을 위한 모달 인터페이스:
 * - 실시간 채팅 인터페이스
 * - 시스템 분석 및 권장 사항
 * - AI 사고 과정 시각화
 * - 서버 컨텍스트 기반 대화
 */
export default function AIAgentModal({
  isOpen,
  onClose,
  onToggle,
  className,
  mode = 'chat',
  serverContext
}: AIAgentModalProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'thinking' | 'settings'>('chat');
  
  const modalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // AI Agent 상태 - 임시 기본값
  const isEnabled = true;
  const status = 'enabled';
  
  // 🔧 모달 열림 시 포커스 관리
  useEffect(() => {
    if (isOpen && !isMinimized) {
      // 약간의 지연 후 입력 필드에 포커스
      const timeoutId = setTimeout(() => {
        if (activeTab === 'chat' && inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen, isMinimized, activeTab]);

  // 🛡️ ESC 키 처리
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape, { capture: true });
    return () => document.removeEventListener('keydown', handleEscape, { capture: true });
  }, [isOpen, onClose]);

  // 🛡️ 외부 클릭 처리
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 약간의 지연을 두어 모달 열림과 충돌 방지
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // 🛡️ Body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 임시 sendMessage 함수
  const sendMessage = async (message: string, context?: any) => {
    // 실제 구현 시 AI 서비스와 연동
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      content: `AI 응답: "${message}"에 대한 분석을 완료했습니다. 현재 시스템 상태는 정상이며, 추가 정보가 필요하시면 언제든 문의해 주세요.`,
      confidence: 0.85,
      sources: ['system-analysis', 'knowledge-base'],
      thinking: ['질문 분석', '컨텍스트 파악', '응답 생성']
    };
  };

  // 초기 환영 메시지
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: 'welcome',
        type: 'ai',
        content: '안녕하세요! OpenManager AI 에이전트입니다. 시스템 분석, 서버 관리, 문제 해결에 도움을 드릴 수 있습니다. 무엇을 도와드릴까요?',
        timestamp: new Date(),
        metadata: {
          confidence: 1.0,
          sources: ['system']
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, messages.length]);

  // 메시지 전송 핸들러
  const handleSendMessage = useCallback(async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: AIMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // AI Agent에 메시지 전송
      const response = await sendMessage?.(inputMessage, {
        serverContext,
        conversationHistory: messages.slice(-5) // 최근 5개 메시지만 컨텍스트로 전달
      });

      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        type: 'ai',
        content: response?.content || '죄송합니다. 현재 응답을 생성할 수 없습니다.',
        timestamp: new Date(),
        metadata: {
          confidence: response?.confidence || 0.5,
          sources: response?.sources || [],
          thinking: response?.thinking || []
        }
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI 메시지 전송 오류:', error);
      
      const errorMessage: AIMessage = {
        id: `error-${Date.now()}`,
        type: 'system',
        content: '오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, isLoading, messages, sendMessage, serverContext]);

  // Enter 키 처리
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 모달 애니메이션
  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        duration: 0.5,
        bounce: 0.3
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: {
        duration: 0.3
      }
    }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.3 }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* 백드롭 */}
        <motion.div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* 모달 컨테이너 */}
        <motion.div
          className={`
            relative w-full max-w-4xl mx-4 bg-white dark:bg-gray-900 
            rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700
            ${isMinimized ? 'h-16' : 'h-[80vh]'}
            ${className}
          `}
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          ref={modalRef}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Brain className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  AI 에이전트
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  지능형 시스템 분석 및 지원
                </p>
              </div>
              {status && (
                <Badge 
                  variant={status === 'enabled' ? 'default' : 'secondary'}
                  className="ml-2"
                >
                  {status === 'enabled' ? '활성' : '비활성'}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 컨텐츠 */}
          {!isMinimized && (
            <div className="flex flex-col h-full">
              {/* 탭 네비게이션 */}
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1">
                <TabsList className="grid w-full grid-cols-3 p-1 m-4 mb-0">
                  <TabsTrigger value="chat" className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>채팅</span>
                  </TabsTrigger>
                  <TabsTrigger value="thinking" className="flex items-center space-x-2">
                    <Brain className="w-4 h-4" />
                    <span>AI 사고과정</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>설정</span>
                  </TabsTrigger>
                </TabsList>

                {/* 채팅 탭 */}
                <TabsContent value="chat" className="flex flex-col flex-1 p-4 pt-0">
                  {/* 메시지 영역 */}
                  <div className="flex-1 overflow-y-auto mb-4 space-y-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <AnimatePresence>
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          variants={messageVariants}
                          initial="hidden"
                          animate="visible"
                          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`
                              max-w-[80%] p-3 rounded-lg
                              ${message.type === 'user' 
                                ? 'bg-blue-500 text-white' 
                                : message.type === 'ai'
                                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600'
                                : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                              }
                            `}
                          >
                            <p className="text-sm">{message.content}</p>
                            {message.metadata?.confidence && (
                              <p className="text-xs opacity-70 mt-1">
                                신뢰도: {Math.round(message.metadata.confidence * 100)}%
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* 입력 영역 */}
                  <div className="flex space-x-2">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="AI 에이전트에게 질문하세요..."
                      className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      rows={2}
                      disabled={isLoading}
                      ref={inputRef}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || isLoading}
                      className="px-4"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </TabsContent>

                {/* AI 사고과정 탭 */}
                <TabsContent value="thinking" className="flex-1 p-4 pt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Brain className="w-5 h-5" />
                        <span>AI 추론 과정</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">
                        최근 대화에서 AI의 사고과정과 의사결정 단계를 확인할 수 있습니다.
                      </p>
                      {/* 여기에 AI 사고과정 시각화 컴포넌트 추가 */}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* 설정 탭 */}
                <TabsContent value="settings" className="flex-1 p-4 pt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Settings className="w-5 h-5" />
                        <span>AI 에이전트 설정</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 dark:text-gray-400">
                        AI 에이전트의 동작 방식과 응답 스타일을 조정할 수 있습니다.
                      </p>
                      {/* 여기에 설정 컴포넌트 추가 */}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 