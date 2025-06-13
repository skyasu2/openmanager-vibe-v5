/**
 * 🏪 AI 사이드바 도메인 스토어 - 분리된 아키텍처
 * 
 * 도메인 주도 설계(DDD) 적용
 * - 비즈니스 로직과 UI 로직 완전 분리
 * - 타입 안전성 보장
 * - 테스트 용이성 향상
 * - 재사용성 극대화
 */

'use client';

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
    AISidebarStore,
    AIThinkingStep,
    ChatMessage,
    AIResponse,
    SystemAlert
} from '../types';
import { AISidebarService } from '../services/AISidebarService';

// 서비스 인스턴스
const aiSidebarService = AISidebarService.getInstance();

// 초기 상태
const initialState = {
    // UI 상태
    isOpen: false,
    isMinimized: false,
    activeTab: 'chat' as const,

    // AI 상태
    isThinking: false,
    currentQuestion: null,
    thinkingSteps: [],

    // 채팅 상태
    messages: [],
    responses: [],

    // 알림 상태
    alerts: [],

    // 설정
    settings: {
        typingSpeed: 'normal' as const,
        showThinkingProcess: true,
        autoCloseAlerts: true,
        soundEnabled: false,
    }
};

export const useAISidebarStore = create<AISidebarStore>()(
    devtools(
        persist(
            (set, get) => ({
                ...initialState,

                // UI 액션들
                setOpen: (open: boolean) => {
                    set((state) => ({
                        isOpen: open,
                        isMinimized: open ? false : state.isMinimized
                    }), false, 'setOpen');
                },

                setMinimized: (minimized: boolean) => {
                    set({ isMinimized: minimized }, false, 'setMinimized');
                },

                setActiveTab: (tab) => {
                    set({ activeTab: tab }, false, 'setActiveTab');
                },

                // AI 액션들
                setThinking: (thinking: boolean) => {
                    set({ isThinking: thinking }, false, 'setThinking');
                },

                setCurrentQuestion: (question: string | null) => {
                    set({ currentQuestion: question }, false, 'setCurrentQuestion');
                },

                addThinkingStep: (stepData) => {
                    set((state) => ({
                        thinkingSteps: [...state.thinkingSteps.slice(-19), {
                            ...stepData,
                            id: `thinking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            timestamp: new Date()
                        }]
                    }), false, 'addThinkingStep');
                },

                clearThinkingSteps: () => {
                    set({ thinkingSteps: [] }, false, 'clearThinkingSteps');
                },

                // 채팅 액션들
                sendMessage: async (content: string) => {
                    const {
                        setThinking,
                        setCurrentQuestion,
                        addMessage,
                        addResponse,
                        clearThinkingSteps,
                        settings
                    } = get();

                    try {
                        // 사용자 메시지 추가
                        const userMessage = aiSidebarService.createMessage(content, 'user');
                        addMessage(userMessage);

                        // AI 처리 시작
                        setThinking(true);
                        setCurrentQuestion(content);
                        clearThinkingSteps();

                        // 질문 분석
                        const analysis = aiSidebarService.analyzeQuestion(content);

                        // 사고 과정 시뮬레이션
                        const thinkingSteps = await aiSidebarService.simulateThinkingProcess(content);

                        // 각 단계를 실시간으로 추가
                        for (const step of thinkingSteps) {
                            get().addThinkingStep(step);
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }

                        // AI 응답 생성
                        const aiResponse = await aiSidebarService.generateResponse(content, thinkingSteps);
                        addResponse(aiResponse);

                        // AI 메시지 추가 (타이핑 효과 포함)
                        const assistantMessage = aiSidebarService.createMessage(
                            aiResponse.response,
                            'assistant',
                            {
                                isTyping: true,
                                typingSpeed: settings.typingSpeed
                            }
                        );
                        addMessage(assistantMessage);

                    } catch (error) {
                        console.error('AI 메시지 처리 오류:', error);

                        // 에러 알림 추가
                        get().addAlert({
                            type: 'error',
                            title: 'AI 처리 오류',
                            message: 'AI 응답 생성 중 오류가 발생했습니다. 다시 시도해주세요.',
                            isClosable: true,
                            autoClose: 5
                        });
                    } finally {
                        setThinking(false);
                        setCurrentQuestion(null);
                    }
                },

                addMessage: (messageData) => {
                    set((state) => ({
                        messages: [...state.messages.slice(-49), {
                            ...messageData,
                            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            timestamp: new Date()
                        }]
                    }), false, 'addMessage');
                },

                addResponse: (responseData) => {
                    set((state) => ({
                        responses: [...state.responses.slice(-19), {
                            ...responseData,
                            id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                            timestamp: new Date()
                        }]
                    }), false, 'addResponse');
                },

                clearMessages: () => {
                    set({ messages: [] }, false, 'clearMessages');
                },

                // 알림 액션들
                addAlert: (alertData) => {
                    const alert = aiSidebarService.createSystemAlert(
                        alertData.type,
                        alertData.title,
                        alertData.message,
                        {
                            autoClose: alertData.autoClose,
                            isClosable: alertData.isClosable
                        }
                    );

                    set((state) => ({
                        alerts: [...state.alerts.slice(-9), alert]
                    }), false, 'addAlert');

                    // 자동 닫기 설정
                    if (alert.autoClose && get().settings.autoCloseAlerts) {
                        setTimeout(() => {
                            get().removeAlert(alert.id);
                        }, alert.autoClose * 1000);
                    }
                },

                removeAlert: (id: string) => {
                    set((state) => ({
                        alerts: state.alerts.filter(alert => alert.id !== id)
                    }), false, 'removeAlert');
                },

                clearAlerts: () => {
                    set({ alerts: [] }, false, 'clearAlerts');
                },

                // 설정 액션들
                updateSettings: (newSettings) => {
                    set((state) => ({
                        settings: { ...state.settings, ...newSettings }
                    }), false, 'updateSettings');
                },

                // 전체 리셋
                reset: () => {
                    set(initialState, false, 'reset');
                }
            }),
            {
                name: 'ai-sidebar-store',
                partialize: (state) => ({
                    // 지속성이 필요한 상태만 저장
                    settings: state.settings,
                    messages: state.messages.slice(-20), // 최근 20개만 저장
                    responses: state.responses.slice(-10), // 최근 10개만 저장
                }),
                version: 1,
                migrate: (persistedState: any, version: number) => {
                    // 버전 마이그레이션 로직
                    if (version === 0) {
                        // v0에서 v1로 마이그레이션
                        return {
                            ...initialState,
                            ...persistedState,
                            settings: {
                                ...initialState.settings,
                                ...persistedState.settings
                            }
                        };
                    }
                    return persistedState;
                }
            }
        ),
        {
            name: 'ai-sidebar-store',
            enabled: process.env.NODE_ENV === 'development'
        }
    )
);

// 🎯 선택자 함수들 (성능 최적화)
export const selectIsAIActive = (state: AISidebarStore) =>
    state.isOpen && state.isThinking;

export const selectLatestMessage = (state: AISidebarStore) =>
    state.messages[state.messages.length - 1];

export const selectLatestResponse = (state: AISidebarStore) =>
    state.responses[state.responses.length - 1];

export const selectRecentThinkingSteps = (state: AISidebarStore) =>
    state.thinkingSteps.slice(-10);

export const selectActiveAlerts = (state: AISidebarStore) =>
    state.alerts.filter(alert => !alert.autoClose ||
        (Date.now() - alert.timestamp.getTime()) < (alert.autoClose * 1000));

export const selectQuickQuestions = () =>
    aiSidebarService.getQuickQuestions();

// 🔧 유틸리티 훅들
export const useAISidebarUI = () => {
    const store = useAISidebarStore();
    return {
        isOpen: store.isOpen,
        isMinimized: store.isMinimized,
        activeTab: store.activeTab,
        setOpen: store.setOpen,
        setMinimized: store.setMinimized,
        setActiveTab: store.setActiveTab
    };
};

export const useAIThinking = () => {
    const store = useAISidebarStore();
    return {
        isThinking: store.isThinking,
        currentQuestion: store.currentQuestion,
        thinkingSteps: store.thinkingSteps,
        setThinking: store.setThinking,
        setCurrentQuestion: store.setCurrentQuestion,
        addThinkingStep: store.addThinkingStep,
        clearThinkingSteps: store.clearThinkingSteps
    };
};

export const useAIChat = () => {
    const store = useAISidebarStore();
    return {
        messages: store.messages,
        responses: store.responses,
        sendMessage: store.sendMessage,
        addMessage: store.addMessage,
        addResponse: store.addResponse,
        clearMessages: store.clearMessages
    };
};

export const useAIAlerts = () => {
    const store = useAISidebarStore();
    return {
        alerts: store.alerts,
        addAlert: store.addAlert,
        removeAlert: store.removeAlert,
        clearAlerts: store.clearAlerts
    };
};

export const useAISettings = () => {
    const store = useAISidebarStore();
    return {
        settings: store.settings,
        updateSettings: store.updateSettings
    };
}; 