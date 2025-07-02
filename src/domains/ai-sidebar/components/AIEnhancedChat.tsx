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
    Brain,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Database,
    FileText,
    Globe,
    RotateCcw,
    Send,
    Sparkles,
    StopCircle,
    User,
    Zap,
} from 'lucide-react';
import React, { useState } from 'react';

// 타입 임포트
import {
    AIEngine,
    AutoReportTrigger,
    ChatMessage
} from '../types/ai-sidebar-types';

// 사용 가능한 AI 엔진 목록
const availableEngines: AIEngine[] = [
    {
        id: 'auto',
        name: 'AUTO 모드',
        description: '상황에 맞는 최적의 AI 엔진을 자동 선택',
        icon: Brain,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100',
        features: ['자동 선택', '최적화', '균형'],
        status: 'ready',
    },
    {
        id: 'google-ai',
        name: 'Google AI',
        description: 'Gemini 기반 고성능 추론 및 분석',
        icon: Zap,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        features: ['고급 추론', '빠른 응답'],
        usage: { used: 45, limit: 100 },
        status: 'ready',
    },
    {
        id: 'local-rag',
        name: 'Local RAG',
        description: '로컬 벡터 DB 기반 컨텍스트 검색',
        icon: Database,
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        features: ['프라이버시', '오프라인'],
        status: 'ready',
    },
    {
        id: 'web-search',
        name: 'Web Search',
        description: '실시간 웹 검색 및 정보 수집',
        icon: Globe,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        features: ['실시간', '최신 정보'],
        status: 'ready',
    },
];

interface AIEnhancedChatProps {
    selectedEngine: string;
    onEngineChange: (engine: string) => void;
    chatMessages: ChatMessage[];
    isGenerating: boolean;
    autoReportTrigger: AutoReportTrigger;
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
    const [showEngineInfo, setShowEngineInfo] = useState(false);

    // 선택된 엔진 데이터 찾기
    const selectedEngineData = availableEngines.find(engine => engine.id === selectedEngine);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && !isGenerating) {
            onSendMessage();
        }
    };

    return (
        <div className={`flex flex-col h-full bg-gray-50 ${className}`} data-testid="ai-enhanced-chat">
            {/* 헤더 */}
            <div className='flex-shrink-0 p-3 sm:p-4 bg-white border-b border-gray-200'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                        <div className='w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center'>
                            <Sparkles className='w-4 h-4 text-white' />
                        </div>
                        <div>
                            <h3 className='text-sm font-semibold text-gray-800'>
                                자연어 질의
                            </h3>
                            <p className='text-xs text-gray-600'>
                                AI와 대화하며 시스템을 관리하세요
                            </p>
                        </div>
                    </div>

                    {/* 엔진 선택 버튼 */}
                    {selectedEngineData && (
                        <div className='relative'>
                            <button
                                onClick={() => setShowEngineInfo(!showEngineInfo)}
                                className='flex items-center space-x-2 px-2 py-1 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-xs'
                            >
                                {React.createElement(
                                    selectedEngineData.icon,
                                    {
                                        className: `w-3 h-3 ${selectedEngineData.color}`,
                                    }
                                )}
                                <span className='font-medium'>
                                    {selectedEngineData.name || '엔진 선택'}
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
                                            {availableEngines.map(engine => (
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
                                                                    {engine.name}
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
                                        [{autoReportTrigger.lastQuery}] 쿼리에서{' '}
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
                                    <div className='mt-2 p-2 bg-gray-50 rounded border'>
                                        <div className='text-xs font-medium text-gray-700 mb-1'>
                                            💭 생각 과정
                                        </div>
                                        <div className='space-y-1'>
                                            {message.thinking.map((step) => (
                                                <div key={step.id} className='flex items-center space-x-2'>
                                                    <div
                                                        className={`w-2 h-2 rounded-full ${step.status === 'completed'
                                                            ? 'bg-green-500'
                                                            : step.status === 'processing'
                                                                ? 'bg-blue-500 animate-pulse'
                                                                : 'bg-gray-300'
                                                            }`}
                                                    />
                                                    <span className='text-xs text-gray-600'>
                                                        {step.title}
                                                    </span>
                                                    {step.duration && (
                                                        <span className='text-xs text-gray-500'>
                                                            ({step.duration}ms)
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* AI 메시지 액션 버튼 */}
                                {message.type === 'ai' && (
                                    <div className='flex items-center space-x-2 mt-2'>
                                        <button
                                            onClick={() => onRegenerateResponse(message.id)}
                                            className='flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors'
                                        >
                                            <RotateCcw className='w-3 h-3' />
                                            <span>재생성</span>
                                        </button>
                                        {message.confidence && (
                                            <span className='text-xs text-gray-500'>
                                                신뢰도: {Math.round(message.confidence * 100)}%
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {/* 생성 중 표시 */}
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className='flex justify-start'
                    >
                        <div className='flex items-start space-x-2 max-w-[85%]'>
                            <div className='w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0'>
                                <Bot className='w-3 h-3 text-white' />
                            </div>
                            <div className='bg-white border border-gray-200 rounded-lg px-3 py-2'>
                                <div className='flex items-center space-x-2'>
                                    <div className='flex space-x-1'>
                                        <div className='w-2 h-2 bg-purple-500 rounded-full animate-bounce'></div>
                                        <div className='w-2 h-2 bg-purple-500 rounded-full animate-bounce' style={{ animationDelay: '0.1s' }}></div>
                                        <div className='w-2 h-2 bg-purple-500 rounded-full animate-bounce' style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className='text-xs text-gray-600'>생각하는 중...</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* 프리셋 질문 영역 */}
            {showPresets && (
                <div className='flex-shrink-0 p-3 sm:p-4 bg-white border-t border-gray-200'>
                    <div className='flex items-center justify-between mb-2'>
                        <h4 className='text-xs font-semibold text-gray-800'>
                            💡 추천 질문
                        </h4>
                        <div className='flex items-center space-x-2'>
                            <button
                                onClick={onPreviousPresets}
                                disabled={!canGoPrevious}
                                className='p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                title="이전 프리셋 질문"
                            >
                                <ChevronLeft className='w-4 h-4' />
                            </button>
                            <span className='text-xs text-gray-500'>
                                {currentPresetIndex + 1}
                            </span>
                            <button
                                onClick={onNextPresets}
                                disabled={!canGoNext}
                                className='p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                                title="다음 프리셋 질문"
                            >
                                <ChevronRight className='w-4 h-4' />
                            </button>
                        </div>
                    </div>
                    {/* 프리셋 질문 버튼들은 부모 컴포넌트에서 처리 */}
                </div>
            )}

            {/* 입력 영역 */}
            <div className='flex-shrink-0 p-3 sm:p-4 bg-white border-t border-gray-200'>
                <form onSubmit={handleSubmit} className='flex items-end space-x-2'>
                    <div className='flex-1'>
                        <textarea
                            value={inputValue}
                            onChange={(e) => onInputChange(e.target.value)}
                            placeholder='질문을 입력하세요... (Shift+Enter로 줄바꿈)'
                            className='w-full px-3 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm'
                            rows={1}
                            style={{ minHeight: '40px', maxHeight: '120px' }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                            disabled={isGenerating}
                        />
                    </div>
                    <div className='flex space-x-2'>
                        <button
                            type='button'
                            onClick={onTogglePresets}
                            className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${showPresets
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            💡
                        </button>
                        {isGenerating ? (
                            <button
                                type='button'
                                onClick={onStopGeneration}
                                className='px-3 py-2 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-1'
                            >
                                <StopCircle className='w-3 h-3' />
                                <span>중지</span>
                            </button>
                        ) : (
                            <button
                                type='submit'
                                disabled={!inputValue.trim()}
                                className='px-3 py-2 bg-purple-500 text-white text-xs font-medium rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-1'
                            >
                                <Send className='w-3 h-3' />
                                <span>전송</span>
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};
