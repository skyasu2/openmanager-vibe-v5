/**
 * 🎯 AI 사이드바 도메인 타입 정의
 * 
 * 도메인 주도 설계(DDD)에 따른 타입 분리
 * - 비즈니스 로직과 UI 로직 분리
 * - 타입 안전성 보장
 * - 재사용성 향상
 */

// 🤖 AI 사고 과정 관련 타입
export interface AIThinkingStep {
    id: string;
    step: string;
    content: string;
    type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
    timestamp: Date;
    duration?: number;
    progress?: number;
    confidence?: number;
}

// 💬 채팅 메시지 타입
export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    isTyping?: boolean;
    typingSpeed?: 'slow' | 'normal' | 'fast';
}

// 🚨 시스템 알림 타입
export interface SystemAlert {
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    isClosable: boolean;
    autoClose?: number; // 자동 닫기 시간 (초)
}

// 🎯 빠른 질문 템플릿 타입
export interface QuickQuestion {
    id: string;
    question: string;
    category: 'server' | 'logs' | 'analysis' | 'prediction';
    icon: string;
    color: string;
    description?: string;
}

// 🔧 AI 응답 타입
export interface AIResponse {
    id: string;
    query: string;
    response: string;
    confidence: number;
    timestamp: Date;
    thinkingSteps: AIThinkingStep[];
    processingTime: number;
    source: 'local' | 'google_ai' | 'mcp' | 'hybrid';
}

// 📊 AI 사이드바 상태 타입
export interface AISidebarState {
    // UI 상태
    isOpen: boolean;
    isMinimized: boolean;
    activeTab: 'chat' | 'thinking' | 'alerts' | 'settings';

    // AI 상태
    isThinking: boolean;
    currentQuestion: string | null;
    thinkingSteps: AIThinkingStep[];

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
}

// 🎮 AI 사이드바 액션 타입
export interface AISidebarActions {
    // UI 액션
    setOpen: (open: boolean) => void;
    setMinimized: (minimized: boolean) => void;
    setActiveTab: (tab: AISidebarState['activeTab']) => void;

    // AI 액션
    setThinking: (thinking: boolean) => void;
    setCurrentQuestion: (question: string | null) => void;
    addThinkingStep: (step: Omit<AIThinkingStep, 'id' | 'timestamp'>) => void;
    clearThinkingSteps: () => void;

    // 채팅 액션
    sendMessage: (content: string) => Promise<void>;
    addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    addResponse: (response: Omit<AIResponse, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;

    // 알림 액션
    addAlert: (alert: Omit<SystemAlert, 'id' | 'timestamp'>) => void;
    removeAlert: (id: string) => void;
    clearAlerts: () => void;

    // 설정 액션
    updateSettings: (settings: Partial<AISidebarState['settings']>) => void;

    // 전체 리셋
    reset: () => void;
}

// 🏪 통합 스토어 타입
export type AISidebarStore = AISidebarState & AISidebarActions;

// 📝 빠른 질문 상수
export const QUICK_QUESTIONS: readonly QuickQuestion[] = [
    {
        id: 'server-status',
        question: '서버 상태는 어떤가요?',
        category: 'server',
        icon: 'Server',
        color: 'text-blue-500',
        description: '전체 서버 상태 확인'
    },
    {
        id: 'log-collection',
        question: '시스템 로그 수집',
        category: 'logs',
        icon: 'Search',
        color: 'text-green-500',
        description: '최근 로그 분석'
    },
    {
        id: 'data-analysis',
        question: '데이터 패턴 분석',
        category: 'analysis',
        icon: 'BarChart3',
        color: 'text-purple-500',
        description: '성능 패턴 분석'
    },
    {
        id: 'ai-thinking',
        question: 'AI가 생각하고 있습니다...',
        category: 'prediction',
        icon: 'Target',
        color: 'text-orange-500',
        description: '예측 분석 실행'
    }
] as const;

// 🎨 UI 테마 타입
export interface UITheme {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    border: string;
}

// 🔄 애니메이션 설정 타입
export interface AnimationConfig {
    duration: number;
    easing: string;
    delay?: number;
    stagger?: number;
} 