/**
 * 🎨 AI 사이드바 v2.0 - 도메인 분리 아키텍처
 * 
 * ✅ CSS 타이핑 효과 적용 (Vercel 안정형)
 * ✅ 도메인 주도 설계(DDD) 적용
 * ✅ 비즈니스 로직과 UI 로직 완전 분리
 * ✅ 성능 최적화 및 메모리 효율성
 * ✅ 타입 안전성 보장
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Brain,
    Server,
    BarChart3,
    Search,
    Target,
    Send,
    Loader2
} from 'lucide-react';
import BasicTyping from '@/components/ui/BasicTyping';
import {
    useAISidebarStore,
    useAISidebarUI,
    useAIThinking,
    useAIChat,
    selectQuickQuestions
} from '../stores/useAISidebarStore';
import { QuickQuestion } from '../types';
import { RealAISidebarService } from '../services/RealAISidebarService';
import { RealTimeThinkingViewer } from '@/components/ai/RealTimeThinkingViewer';
import { useRealTimeAILogs } from '@/hooks/useRealTimeAILogs';

interface AISidebarV2Props {
    isOpen: boolean;
    onClose: () => void;
    className?: string;
}

export const AISidebarV2: React.FC<AISidebarV2Props> = ({
    isOpen,
    onClose,
    className = '',
}) => {
    // 실제 AI 서비스 인스턴스
    const aiService = new RealAISidebarService();

    // 도메인 훅들 사용
    const { setOpen } = useAISidebarUI();
    const {
        isThinking,
        currentQuestion,
        thinkingSteps,
        clearThinkingSteps,
        addThinkingStep,
        setThinking
    } = useAIThinking();
    const {
        messages,
        sendMessage,
        addMessage,
        addResponse
    } = useAIChat();

    // UI 상태
    const [inputValue, setInputValue] = useState('');
    const [currentSessionId, setCurrentSessionId] = useState<string>('');

    // 스크롤 참조
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 실시간 AI 로그 훅
    const {
        logs: realTimeLogs,
        isConnected: isLogConnected,
        isProcessing: isRealTimeProcessing,
        currentEngine,
        techStack,
        connectionStatus
    } = useRealTimeAILogs({
        sessionId: currentSessionId,
        mode: 'sidebar',
        maxLogs: 30
    });

    // 메시지가 추가될 때마다 스크롤을 맨 아래로 이동
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // 빠른 질문 가져오기 (실제 서비스에서)
    const quickQuestions = aiService.getQuickQuestions();

    // 아이콘 매핑
    const getIcon = (iconName: string) => {
        const icons: Record<string, React.ComponentType<any>> = {
            Server,
            Search,
            BarChart3,
            Target
        };
        return icons[iconName] || Server;
    };

    /**
     * 질의 처리 (실제 백엔드 연동)
     */
    const handleQuestionSubmit = async (question: string) => {
        if (!question.trim() || isThinking) return;

        setInputValue('');
        setThinking(true);
        clearThinkingSteps();

        // 새로운 세션 ID 생성
        const sessionId = `ai-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        setCurrentSessionId(sessionId);

        try {
            // 사용자 메시지 추가
            const userMessage = aiService.createChatMessage(question, 'user');
            addMessage(userMessage);

            // AI 사고 과정 스트리밍 (실시간 로그와 연동)
            const thinkingGenerator = aiService.streamThinkingProcess(question, sessionId);
            for await (const step of thinkingGenerator) {
                addThinkingStep(step);
            }

            // AI 응답 생성
            const response = await aiService.processQuery(question, sessionId);
            addResponse(response);

            // AI 응답 메시지 추가
            const aiMessage = aiService.createChatMessage(response.response, 'assistant', true);
            addMessage(aiMessage);

        } catch (error) {
            console.error('질의 처리 오류:', error);

            // 오류 메시지 추가
            const errorMessage = aiService.createChatMessage(
                '죄송합니다. 현재 AI 시스템에 문제가 있습니다. 잠시 후 다시 시도해주세요.',
                'assistant'
            );
            addMessage(errorMessage);
        } finally {
            setThinking(false);
        }
    };

    /**
     * 빠른 질문 처리
     */
    const handleQuickQuestion = (question: QuickQuestion) => {
        setInputValue(question.question);
        handleQuestionSubmit(question.question);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col ${className}`}
                >
                    {/* 헤더 */}
                    <div className='flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50'>
                        <div className='flex items-center space-x-3'>
                            <div className='w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg flex items-center justify-center'>
                                <Brain className='w-5 h-5 text-white' />
                            </div>
                            <div>
                                <BasicTyping
                                    text="AI 어시스턴트"
                                    speed="fast"
                                    className="text-lg font-bold text-gray-800"
                                    showCursor={false}
                                />
                                <p className='text-sm text-gray-600'>AI와 자연어로 시스템 질의</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
                            title='사이드바 닫기'
                            aria-label='사이드바 닫기'
                        >
                            <X className='w-5 h-5 text-gray-500' />
                        </button>
                    </div>

                    {/* 실시간 AI 사고 과정 */}
                    <div className='mx-4 mt-4'>
                        <RealTimeThinkingViewer
                            sessionId={currentSessionId}
                            isExpanded={true}
                            showTechStack={true}
                            mode="sidebar"
                            className="w-full"
                        />
                    </div>

                    {/* 채팅 메시지 - 아래에서 위로 스크롤 */}
                    <div className='flex-1 flex flex-col mx-4 mt-4 min-h-0'>
                        <div className='flex-1 overflow-y-auto'>
                            <div className='space-y-3 flex flex-col'>
                                {messages.slice(-10).map((message, index) => (
                                    <motion.div
                                        key={message.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] p-3 rounded-lg ${message.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {message.isTyping ? (
                                                <BasicTyping
                                                    text={message.content}
                                                    speed={message.typingSpeed || 'normal'}
                                                    showCursor={true}
                                                    cursorColor={message.role === 'user' ? '#ffffff' : '#3b82f6'}
                                                />
                                            ) : (
                                                <div className='text-sm whitespace-pre-wrap'>
                                                    {message.content}
                                                </div>
                                            )}
                                            <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-200' : 'text-gray-500'
                                                }`}>
                                                {message.timestamp.toLocaleTimeString('ko-KR')}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                                {/* 스크롤 참조 포인트 */}
                                <div ref={messagesEndRef} />
                            </div>
                        </div>
                    </div>

                    {/* 빠른 질문 */}
                    <div className='mx-4 mt-4'>
                        <h3 className='text-sm font-medium text-gray-700 mb-3'>빠른 질문</h3>
                        <div className='grid grid-cols-2 gap-2'>
                            {quickQuestions.map((question, index) => {
                                const IconComponent = getIcon(question.icon);
                                return (
                                    <motion.button
                                        key={question.id}
                                        onClick={() => handleQuickQuestion(question)}
                                        disabled={isThinking}
                                        className='p-3 text-left bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-sm transition-colors disabled:opacity-50'
                                        whileHover={{ scale: isThinking ? 1 : 1.02 }}
                                        whileTap={{ scale: isThinking ? 1 : 0.98 }}
                                        title={question.description}
                                    >
                                        <div className='flex items-center gap-2'>
                                            <IconComponent className={`w-4 h-4 ${question.color}`} />
                                            <span className='text-gray-700 text-xs'>
                                                {question.question}
                                            </span>
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 질문 입력 */}
                    <div className='mt-auto p-4 border-t border-gray-200'>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleQuestionSubmit(inputValue);
                            }}
                            className='flex gap-2'
                        >
                            <input
                                type='text'
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder='AI에게 서버 관리에 대해 질문해보세요...'
                                disabled={isThinking}
                                className='flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50'
                            />
                            <button
                                type='submit'
                                disabled={!inputValue.trim() || isThinking}
                                className='px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                                title='메시지 전송'
                                aria-label='메시지 전송'
                            >
                                {isThinking ? (
                                    <Loader2 className='w-4 h-4 animate-spin' />
                                ) : (
                                    <Send className='w-4 h-4' />
                                )}
                            </button>
                        </form>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}; 