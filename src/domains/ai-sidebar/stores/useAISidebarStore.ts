/**
 * 🔄 AI 사이드바 도메인 스토어 - 통합 버전 래퍼
 * 
 * 통합된 메인 스토어를 사용하도록 리다이렉트
 * - 하위 호환성 보장
 * - 도메인 아키텍처 유지
 * - 중복 코드 제거
 */

'use client';

// 통합된 메인 스토어에서 모든 기능 가져오기
export {
    // 타입들
    type AgentLog,
    type AIThinkingStep,
    type ChatMessage,
    type AIResponse,
    type SystemAlert,
    type PresetQuestion,
    type AISidebarSettings,

    // 상수들
    PRESET_QUESTIONS,

    // 메인 스토어
    useAISidebarStore,

    // 선택자 함수들
    selectIsAIActive,
    selectLatestMessage,
    selectLatestResponse,
    selectRecentLogs,
    selectRecentThinkingSteps,
    selectActiveAlerts,
    selectQuickQuestions,

    // 커스텀 훅들
    useAISidebarUI,
    useAIThinking,
    useAIChat,
    useAIAlerts,
    useAISettings,
    useAIContext,
} from '../../../stores/useAISidebarStore';

// 내부 사용을 위한 임포트
import {
    PRESET_QUESTIONS,
    selectQuickQuestions
} from '../../../stores/useAISidebarStore';

// 도메인별 타입 별칭 (하위 호환성)
import type {
    AgentLog as AIThinkingStep_Legacy,
    SystemAlert,
    ChatMessage,
    AIResponse
} from '../../../stores/useAISidebarStore';

export interface AISidebarStore {
    // UI 상태
    isOpen: boolean;
    isMinimized: boolean;
    activeTab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions';

    // AI 상태
    isThinking: boolean;
    currentQuestion: string | null;
    thinkingSteps: AIThinkingStep_Legacy[];

    // 채팅 상태
    messages: ChatMessage[];
    responses: AIResponse[];

    // 알림 상태
    alerts: SystemAlert[];

    // 설정
    settings: {
        typingSpeed: 'slow' | 'normal' | 'fast';
        showThinkingProcess: boolean;
        autoCloseAlerts: boolean;
        soundEnabled: boolean;
    };

    // 액션들 (통합 스토어와 동일)
    setOpen: (open: boolean) => void;
    setMinimized: (minimized: boolean) => void;
    setActiveTab: (tab: 'chat' | 'presets' | 'thinking' | 'settings' | 'functions') => void;
    setThinking: (thinking: boolean) => void;
    setCurrentQuestion: (question: string | null) => void;
    addThinkingStep: (step: Omit<AIThinkingStep_Legacy, 'id' | 'timestamp'>) => void;
    clearThinkingSteps: () => void;
    sendMessage: (content: string) => Promise<void>;
    addMessage: (message: Omit<ChatMessage, 'id'>) => void;
    addResponse: (response: Omit<AIResponse, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;
    addAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
    removeAlert: (id: string) => void;
    clearAlerts: () => void;
    updateSettings: (settings: Partial<AISidebarStore['settings']>) => void;
    reset: () => void;
}

/**
 * 🏗️ 도메인 서비스 호환성 레이어
 * 
 * 기존 도메인 서비스 패턴을 유지하면서
 * 통합 스토어의 기능을 활용
 */
export class AISidebarService {
    private static instance: AISidebarService;

    static getInstance(): AISidebarService {
        if (!AISidebarService.instance) {
            AISidebarService.instance = new AISidebarService();
        }
        return AISidebarService.instance;
    }

    createMessage(content: string, role: 'user' | 'assistant', options?: any): Omit<ChatMessage, 'id'> {
        return {
            content,
            role,
            timestamp: new Date().toISOString(),
            ...options
        };
    }

    analyzeQuestion(content: string) {
        // 질문 분석 로직 (통합 스토어에서 처리)
        return {
            category: content.includes('성능') ? 'performance' : 'general',
            complexity: 'medium',
            requiresThinking: true
        };
    }

    async simulateThinkingProcess(content: string) {
        // 통합 스토어의 시뮬레이션 로직 사용
        return [
            { step: '질문 분석', content: `"${content}" 분석 중...`, type: 'analysis' as const, progress: 25 },
            { step: '데이터 수집', content: '관련 데이터 수집 중...', type: 'data_processing' as const, progress: 50 },
            { step: '패턴 매칭', content: '패턴 분석 중...', type: 'pattern_matching' as const, progress: 75 },
            { step: '응답 생성', content: '응답 생성 중...', type: 'response_generation' as const, progress: 100 }
        ];
    }

    async generateResponse(content: string, steps: any[]): Promise<Omit<AIResponse, 'id' | 'timestamp'>> {
        return {
            query: content,
            response: `"${content}"에 대한 분석이 완료되었습니다.`,
            confidence: 0.85,
            context: `${steps.length}단계 분석 완료`
        };
    }

    createSystemAlert(
        type: SystemAlert['type'],
        title: string,
        message: string,
        options?: any
    ): Omit<SystemAlert, 'id' | 'timestamp'> {
        return {
            type,
            title,
            message,
            isClosable: true,
            autoClose: type === 'error' ? undefined : 5,
            ...options
        };
    }

    getQuickQuestions() {
        // 통합 스토어에서 프리셋 질문들을 가져옴
        return selectQuickQuestions();
    }
} 