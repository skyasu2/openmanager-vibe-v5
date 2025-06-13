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

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Brain,
    AlertTriangle,
    Server,
    BarChart3,
    Search,
    Target,
    Send,
    Loader2,
    Clock,
    MessageSquare
} from 'lucide-react';
import BasicTyping from '@/components/ui/BasicTyping';
import {
    useAISidebarStore,
    useAISidebarUI,
    useAIThinking,
    useAIChat,
    useAIAlerts,
    selectQuickQuestions
} from '../stores/useAISidebarStore';
import { QuickQuestion } from '../types';
import { RealAISidebarService } from '../services/RealAISidebarService';

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
    const {
        alerts,
        addAlert,
        removeAlert
    } = useAIAlerts();

    // UI 상태
    const [inputValue, setInputValue] = useState('');
    const [showWarning, setShowWarning] = useState(true);

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

        try {
            // 사용자 메시지 추가
            const userMessage = aiService.createChatMessage(question, 'user');
            addMessage(userMessage);

            // AI 사고 과정 스트리밍
            const thinkingGenerator = aiService.streamThinkingProcess(question);
            for await (const step of thinkingGenerator) {
                addThinkingStep(step);
            }

            // AI 응답 생성
            const response = await aiService.processQuery(question);
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

    /**
     * 경고 닫기 처리
     */
    const handleCloseWarning = () => {
        setShowWarning(false);
    };

    // 컴포넌트 마운트 시 시스템 알림 생성
    useEffect(() => {
        if (isOpen && showWarning) {
            aiService.createSystemAlert().then(alert => {
                addAlert(alert);
            }).catch(error => {
                console.error('시스템 알림 생성 오류:', error);
            });
        }
    }, [isOpen, showWarning, addAlert]);

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

                    {/* 시스템 알림 */}
                    <div className='mx-4 mt-4 space-y-2'>
                        {alerts.map((alert) => (
                            <motion.div
                                key={alert.id}
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`p-3 rounded-lg border ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                                    alert.type === 'error' ? 'bg-red-50 border-red-200' :
                                        alert.type === 'success' ? 'bg-green-50 border-green-200' :
                                            'bg-blue-50 border-blue-200'
                                    }`}
                            >
                                <div className='flex items-start gap-3'>
                                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${alert.type === 'warning' ? 'text-yellow-600' :
                                        alert.type === 'error' ? 'text-red-600' :
                                            alert.type === 'success' ? 'text-green-600' :
                                                'text-blue-600'
                                        }`} />
                                    <div className='flex-1'>
                                        <div className={`text-sm font-medium ${alert.type === 'warning' ? 'text-yellow-800' :
                                            alert.type === 'error' ? 'text-red-800' :
                                                alert.type === 'success' ? 'text-green-800' :
                                                    'text-blue-800'
                                            }`}>
                                            {alert.title}
                                        </div>
                                        <div className={`text-sm mt-1 ${alert.type === 'warning' ? 'text-yellow-700' :
                                            alert.type === 'error' ? 'text-red-700' :
                                                alert.type === 'success' ? 'text-green-700' :
                                                    'text-blue-700'
                                            }`}>
                                            {alert.message}
                                        </div>
                                        <div className={`text-xs mt-1 ${alert.type === 'warning' ? 'text-yellow-600' :
                                            alert.type === 'error' ? 'text-red-600' :
                                                alert.type === 'success' ? 'text-green-600' :
                                                    'text-blue-600'
                                            }`}>
                                            {alert.timestamp.toLocaleTimeString('ko-KR')}
                                        </div>
                                    </div>
                                    {alert.isClosable && (
                                        <button
                                            onClick={() => removeAlert(alert.id)}
                                            className={`${alert.type === 'warning' ? 'text-yellow-600 hover:text-yellow-800' :
                                                alert.type === 'error' ? 'text-red-600 hover:text-red-800' :
                                                    alert.type === 'success' ? 'text-green-600 hover:text-green-800' :
                                                        'text-blue-600 hover:text-blue-800'
                                                }`}
                                            title='알림 닫기'
                                            aria-label='알림 닫기'
                                        >
                                            <X className='w-4 h-4' />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* AI 사고 과정 */}
                    <div className='mx-4 mt-4'>
                        <div className='bg-gray-900 rounded-lg overflow-hidden'>
                            {/* 헤더 */}
                            <div className='bg-gray-800 px-4 py-3 border-b border-gray-700'>
                                <div className='flex items-center gap-2'>
                                    <Brain className='w-4 h-4 text-purple-400' />
                                    <span className='text-white text-sm font-medium'>AI 사고 과정</span>
                                    {isThinking && (
                                        <Loader2 className='w-4 h-4 text-purple-400 animate-spin' />
                                    )}
                                </div>
                            </div>

                            {/* 사고 과정 로그 */}
                            <div className='p-4 max-h-64 overflow-y-auto'>
                                {thinkingSteps.length > 0 ? (
                                    <div className='space-y-2'>
                                        {thinkingSteps.map((step, index) => (
                                            <motion.div
                                                key={step.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 }}
                                                className='text-sm'
                                            >
                                                <div className='flex items-center gap-2 text-gray-400'>
                                                    <Clock className='w-3 h-3' />
                                                    <span className='text-xs'>
                                                        {step.timestamp.toLocaleTimeString('ko-KR', {
                                                            hour12: false,
                                                            hour: '2-digit',
                                                            minute: '2-digit',
                                                            second: '2-digit',
                                                        })}
                                                    </span>
                                                    <span className='text-yellow-400'>●</span>
                                                </div>
                                                <div className='text-gray-300 mt-1 ml-5'>
                                                    <BasicTyping
                                                        text={step.content}
                                                        speed="fast"
                                                        showCursor={false}
                                                        delay={index * 0.5}
                                                    />
                                                </div>
                                                {step.progress && (
                                                    <div className='ml-5 mt-1'>
                                                        <div className='w-full bg-gray-700 rounded-full h-1'>
                                                            <motion.div
                                                                className='bg-purple-500 h-1 rounded-full'
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${step.progress * 100}%` }}
                                                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </motion.div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className='text-center text-gray-500 py-8'>
                                        <Brain className='w-8 h-8 mx-auto mb-2 opacity-50' />
                                        <p className='text-sm'>AI가 대기 중입니다...</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 채팅 메시지 */}
                    <div className='mx-4 mt-4 flex-1 overflow-y-auto'>
                        <div className='space-y-3'>
                            {messages.slice(-10).map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
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