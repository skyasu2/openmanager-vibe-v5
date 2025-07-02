/**
 * 🤖 AI 강화 채팅 컴포넌트
 * 
 * 기능:
 * - AI 엔진 선택
 * - 메시지 주고받기
 * - 생각 과정 시각화
 * - 자동 장애 보고서 연동
 */

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
    Bot,
    ChevronDown,
    Clock,
    FileText,
    Send,
    Sparkles,
    User,
} from 'lucide-react';
import React, { useEffect, useRef } from 'react';

// Types
export interface ChatMessage {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    thinking?: ThinkingStep[];
    engine?: string;
    confidence?: number;
}

export interface ThinkingStep {
    id: string;
    step: number;
    title: string;
    description: string;
    status: 'pending' | 'processing' | 'completed';
    duration?: number;
}

export interface AIEngine {
    id: string;
    name: string;
    description: string;
    icon: React.ComponentType<any>;
    color: string;
    bgColor: string;
    features: string[];
    usage?: {
        used: number;
        limit: number;
        resetTime?: string;
    };
    status: 'ready' | 'loading' | 'error' | 'disabled';
}

interface AIEnhancedChatProps {
    selectedEngine: string;
    onEngineChange: (engine: string) => void;
    chatMessages: ChatMessage[];
    isGenerating: boolean;
    autoReportTrigger: {
        shouldGenerate: boolean;
        lastQuery?: string;
        severity?: 'low' | 'medium' | 'high' | 'critical';
    };
    onAutoReportGenerate: () => void;
    onAutoReportDismiss: () => void;
    onSendMessage: () => void;
    onStopGeneration: () => void;
    onRegenerateResponse: (messageId: string) => void;
    inputValue: string;
    onInputChange: (value: string) => void;
    showPresets: boolean;
    onTogglePresets: () => void;
    currentPresetIndex: number;
    onPresetQuestion: (question: string) => void;
    onPreviousPresets: () => void;
    onNextPresets: () => void;
    canGoPrevious: boolean;
    canGoNext: boolean;
    className?: string;
}

export const AIEnhancedChat: React.FC<AIEnhancedChatProps> = ({
    selectedEngine,
    onEngineChange,
    chatMessages,
    isGenerating,
    autoReportTrigger,
    onAutoReportGenerate,
    onAutoReportDismiss,
    onSendMessage,
    onStopGeneration,
    onRegenerateResponse,
    inputValue,
    onInputChange,
    showPresets,
    onTogglePresets,
    currentPresetIndex,
    onPresetQuestion,
    onPreviousPresets,
    onNextPresets,
    canGoPrevious,
    canGoNext,
    className = '',
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [showEngineInfo, setShowEngineInfo] = React.useState(false);
    const [expandedThinking, setExpandedThinking] = React.useState<string | null>(null);

    // 메시지 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isGenerating) {
            onSendMessage();
            onInputChange?.('');
        }
    };

    const selectedEngineData = chatMessages.find(e => e.type === 'ai');

    return (
        <div className={`flex flex-col h-full bg-gradient-to-br from-slate-50 to-blue-50 ${className}`}>
            {/* 헤더 - 모델 선택 */}
            <div className='p-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm'>
                <div className='flex items-center justify-between mb-3'>
                    <div className='flex items-center space-x-3'>
                        <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
                            <Bot className='w-4 h-4 text-white' />
                        </div>
                        <div>
                            <h3 className='text-sm font-bold text-gray-800'>자연어 질의</h3>
                            <p className='text-xs text-gray-600'>AI 기반 대화형 인터페이스</p>
                        </div>
                    </div>

                    {/* 모델 선택 드롭다운 */}
                    {chatMessages.length > 0 && (
                        <div className='relative'>
                            <button
                                onClick={() => setShowEngineInfo(!showEngineInfo)}
                                className='flex items-center space-x-2 px-2 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs'
                            >
                                {selectedEngineData && React.createElement(
                                    selectedEngineData.icon,
                                    {
                                        className: `w-3 h-3 ${selectedEngineData.color}`,
                                    }
                                )}
                                <span className='font-medium'>
                                    {selectedEngineData?.content || '엔진 선택'}
                                </span>
                                <ChevronDown className='w-3 h-3 text-gray-500' />
                            </button>

                            {/* 엔진 선택 드롭다운 */}
                            <AnimatePresence>
                                {showEngineInfo && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className='absolute top-full right-0 mt-2 w-60 sm:w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-50'
                                    >
                                        <div className='p-3 border-b border-gray-100'>
                                            <h4 className='text-xs font-semibold text-gray-800'>
                                                AI 모델 선택
                                            </h4>
                                            <p className='text-xs text-gray-600'>
                                                용도에 맞는 AI 엔진을 선택하세요
                                            </p>
                                        </div>

                                        <div className='max-h-48 overflow-y-auto'>
                                            {chatMessages.map(engine => (
                                                <button
                                                    key={engine.id}
                                                    onClick={() => {
                                                        onEngineChange?.(engine.id);
                                                        setShowEngineInfo(false);
                                                    }}
                                                    className={`w-full p-2 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${selectedEngine === engine.id ? 'bg-blue-50' : ''
                                                        }`}
                                                >
                                                    <div className='flex items-start space-x-2'>
                                                        <div
                                                            className={`w-6 h-6 rounded ${engine.bgColor} flex items-center justify-center`}
                                                        >
                                                            {React.createElement(engine.icon, {
                                                                className: `w-3 h-3 ${engine.color}`,
                                                            })}
                                                        </div>
                                                        <div className='flex-1'>
                                                            <div className='flex items-center space-x-2'>
                                                                <h5 className='text-xs font-medium text-gray-800'>
                                                                    {engine.content}
                                                                </h5>
                                                                {engine.usage && (
                                                                    <span className='text-xs text-gray-500'>
                                                                        {engine.usage.used}/{engine.usage.limit}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className='text-xs text-gray-600 mt-1'>
                                                                {engine.description}
                                                            </p>
                                                            <div className='flex flex-wrap gap-1 mt-1'>
                                                                {engine.features
                                                                    .slice(0, 2)
                                                                    .map((feature, idx) => (
                                                                        <span
                                                                            key={idx}
                                                                            className='text-xs px-1 py-0.5 bg-gray-100 text-gray-600 rounded'
                                                                        >
                                                                            {feature}
                                                                        </span>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* 메시지 영역 */}
            <div className='flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4' data-testid="ai-chat-messages">
                {/* 자동장애보고서 알림 */}
                {autoReportTrigger?.shouldGenerate && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-3'
                    >
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center space-x-2'>
                                <FileText className='w-4 h-4 text-red-600' />
                                <div>
                                    <h4 className='text-sm font-medium text-red-800'>
                                        자동장애보고서 생성 준비
                                    </h4>
                                    <p className='text-xs text-red-600'>
                                        "{autoReportTrigger.lastQuery}"에서{' '}
                                        {autoReportTrigger.severity} 수준의 이슈가 감지되었습니다.
                                    </p>
                                </div>
                            </div>
                            <div className='flex space-x-2'>
                                <button
                                    onClick={onAutoReportGenerate}
                                    className='px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors'
                                >
                                    생성
                                </button>
                                <button
                                    onClick={onAutoReportDismiss}
                                    className='px-3 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors'
                                >
                                    무시
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 환영 메시지 */}
                {chatMessages.length === 0 && (
                    <div className='text-center py-8'>
                        <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-3'>
                            <Sparkles className='w-6 h-6 text-white' />
                        </div>
                        <h4 className='text-sm font-semibold text-gray-800 mb-2'>
                            자연어 질의에 오신 것을 환영합니다!
                        </h4>
                        <p className='text-xs text-gray-600 mb-4'>
                            아래 프리셋 질문을 선택하거나 직접 질문을 입력해보세요.
                        </p>
                    </div>
                )}

                {/* 메시지 목록 */}
                {chatMessages.map((message) => (
                    <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex items-start space-x-2 max-w-[90%] sm:max-w-[85%] ${message.type === 'user'
                                ? 'flex-row-reverse space-x-reverse'
                                : ''
                                }`}
                        >
                            {/* 아바타 */}
                            <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                                    }`}
                            >
                                {message.type === 'user' ? (
                                    <User className='w-3 h-3' />
                                ) : (
                                    <Bot className='w-3 h-3' />
                                )}
                            </div>

                            {/* 메시지 내용 */}
                            <div
                                className={`rounded-lg px-3 py-2 ${message.type === 'user'
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-white border border-gray-200 text-gray-800'
                                    }`}
                            >
                                <p className='text-sm whitespace-pre-wrap'>{message.content}</p>

                                {/* 메타데이터 */}
                                <div className='flex items-center justify-between mt-2 text-xs opacity-70'>
                                    <span>
                                        {message.timestamp.toLocaleTimeString('ko-KR', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </span>
                                    {message.engine && (
                                        <span className='ml-2'>
                                            {message.engine}
                                        </span>
                                    )}
                                </div>

                                {/* 생각 과정 표시 */}
                                {message.thinking && message.thinking.length > 0 && (
                                    <div className='mt-2 border-t border-gray-200 pt-2'>
                                        <button
                                            onClick={() => setExpandedThinking(
                                                expandedThinking === message.id ? null : message.id
                                            )}
                                            className='flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-800'
                                        >
                                            <Clock className='w-3 h-3' />
                                            <span>생각 과정 보기</span>
                                        </button>

                                        {expandedThinking === message.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className='mt-2 space-y-1'
                                            >
                                                {message.thinking.map((step) => (
                                                    <div key={step.id} className='flex items-center space-x-2 text-xs'>
                                                        <div className={`w-2 h-2 rounded-full ${step.status === 'completed' ? 'bg-green-500' :
                                                            step.status === 'processing' ? 'bg-yellow-500' :
                                                                'bg-gray-300'
                                                            }`} />
                                                        <span>{step.title}</span>
                                                        {step.duration && (
                                                            <span className='text-gray-500'>({step.duration}ms)</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </motion.div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* 로딩 애니메이션 */}
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='flex justify-start'
                        data-testid="ai-thinking-animation"
                    >
                        <div className='flex items-start space-x-2 max-w-[85%]'>
                            <div className='w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center flex-shrink-0'>
                                <Bot className='w-3 h-3' />
                            </div>
                            <div className='bg-white border border-gray-200 rounded-lg px-3 py-2'>
                                <div className='flex space-x-1'>
                                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' />
                                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.1s' }} />
                                    <div className='w-2 h-2 bg-gray-400 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* 입력 영역 */}
            <div className='p-4 border-t border-gray-200 bg-white/80 backdrop-blur-sm'>
                <form onSubmit={handleSubmit} className='flex space-x-2'>
                    <input
                        ref={inputRef}
                        type='text'
                        value={inputValue}
                        onChange={(e) => onInputChange?.(e.target.value)}
                        placeholder='질문을 입력하세요...'
                        className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm'
                        disabled={isGenerating}
                        data-testid="ai-chat-input"
                    />
                    <button
                        type='submit'
                        disabled={!inputValue.trim() || isGenerating}
                        className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                        data-testid="ai-chat-send-button"
                    >
                        <Send className='w-4 h-4' />
                    </button>
                </form>
            </div>
        </div>
    );
};
