/**
 * 🚀 실제 AI 사이드바 서비스 - 백엔드 API 연결
 */

import type {
    ChatMessage,
    AIResponse,
    SystemAlert,
    AIThinkingStep,
    QuickQuestion
} from '../types';

export class RealAISidebarService {
    private static instance: RealAISidebarService;
    private sessionId: string;

    private constructor() {
        this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static getInstance(): RealAISidebarService {
        if (!RealAISidebarService.instance) {
            RealAISidebarService.instance = new RealAISidebarService();
        }
        return RealAISidebarService.instance;
    }

    /**
     * 🔮 실제 MCP 시스템을 통한 AI 응답 생성
     */
    async generateResponse(
        question: string,
        thinkingSteps: AIThinkingStep[]
    ): Promise<AIResponse> {
        try {
            // MCP 쿼리 전송
            const mcpResponse = await fetch('/api/mcp/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: question,
                    context: {
                        sessionId: this.sessionId,
                        thinkingSteps: thinkingSteps.length,
                        timestamp: new Date().toISOString()
                    }
                })
            });

            if (!mcpResponse.ok) {
                throw new Error(`MCP 쿼리 실패: ${mcpResponse.status}`);
            }

            const mcpData = await mcpResponse.json();

            return {
                query: question,
                response: mcpData.response || '죄송합니다. 현재 AI 시스템에 문제가 있습니다.',
                confidence: mcpData.confidence || 0.5,
                processingTime: mcpData.responseTime || 1000,
                source: 'mcp' as const,
                thinkingSteps: thinkingSteps
            };

        } catch (error) {
            console.error('실제 AI 응답 생성 오류:', error);

            // 폴백 응답
            return {
                question,
                response: '죄송합니다. AI 시스템이 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요.',
                confidence: 0.1,
                responseTime: 100,
                sources: [],
                metadata: {
                    error: error.message,
                    fallback: true,
                    sessionId: this.sessionId
                }
            };
        }
    }

    /**
     * 🧠 실제 AI 사고 과정 스트리밍
     */
    async simulateThinkingProcess(question: string): Promise<AIThinkingStep[]> {
        try {
            // AI 인사이트 API에서 실시간 분석 과정 가져오기
            const analysisResponse = await fetch('/api/ai/smart-query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: question,
                    includeThinkingSteps: true
                })
            });

            if (analysisResponse.ok) {
                const analysisData = await analysisResponse.json();

                if (analysisData.thinkingSteps) {
                    return analysisData.thinkingSteps.map((step: any, index: number) => ({
                        content: step.description || `단계 ${index + 1}: ${step.action}`,
                        progress: step.progress || (index + 1) / analysisData.thinkingSteps.length,
                        metadata: {
                            stepType: step.type,
                            confidence: step.confidence,
                            realTime: true
                        }
                    }));
                }
            }

            // 폴백: 기본 사고 과정
            return this.getDefaultThinkingSteps(question);

        } catch (error) {
            console.warn('실시간 사고 과정 로딩 실패, 기본 과정 사용:', error);
            return this.getDefaultThinkingSteps(question);
        }
    }

    /**
     * 💬 메시지 생성
     */
    createMessage(
        content: string,
        role: 'user' | 'assistant',
        options: {
            isTyping?: boolean;
            typingSpeed?: TypingSpeed;
        } = {}
    ): Omit<ChatMessage, 'id' | 'timestamp'> {
        return {
            content,
            role,
            isTyping: options.isTyping || false,
            typingSpeed: options.typingSpeed || 'normal',
            metadata: {
                sessionId: this.sessionId,
                realTime: true
            }
        };
    }

    /**
     * 🚨 시스템 알림 생성
     */
    createSystemAlert(
        type: SystemAlert['type'],
        title: string,
        message: string,
        options: {
            autoClose?: number;
            isClosable?: boolean;
        } = {}
    ): Omit<SystemAlert, 'id' | 'timestamp'> {
        return {
            type,
            title,
            message,
            isClosable: options.isClosable ?? true,
            autoClose: options.autoClose ?? 0,
            metadata: {
                sessionId: this.sessionId,
                source: 'real-ai-service'
            }
        };
    }

    /**
     * 📋 빠른 질문 목록 가져오기
     */
    getQuickQuestions(): QuickQuestion[] {
        return [
            {
                id: 'server-status',
                question: '현재 서버 상태는 어떤가요?',
                description: '전체 서버 상태 요약',
                icon: 'Server',
                color: 'text-blue-600'
            },
            {
                id: 'performance-check',
                question: '성능 이슈가 있는 서버를 찾아주세요',
                description: '성능 문제 분석',
                icon: 'BarChart3',
                color: 'text-green-600'
            },
            {
                id: 'alert-summary',
                question: '최근 알림 현황을 요약해주세요',
                description: '알림 및 경고 현황',
                icon: 'AlertTriangle',
                color: 'text-yellow-600'
            },
            {
                id: 'optimization',
                question: '시스템 최적화 방안을 제안해주세요',
                description: '성능 최적화 권장사항',
                icon: 'Target',
                color: 'text-purple-600'
            }
        ];
    }

    /**
     * 🔍 질문 분석
     */
    analyzeQuestion(question: string) {
        return {
            intent: this.determineIntent(question),
            complexity: this.calculateComplexity(question),
            keywords: this.extractKeywords(question),
            category: this.categorizeQuestion(question)
        };
    }

    // === Private Helper Methods ===

    private getDefaultThinkingSteps(question: string): AIThinkingStep[] {
        return [
            {
                content: '질문을 분석하고 있습니다...',
                progress: 0.2,
                metadata: { step: 'analysis' }
            },
            {
                content: '관련 데이터를 검색하고 있습니다...',
                progress: 0.4,
                metadata: { step: 'search' }
            },
            {
                content: 'AI 모델이 응답을 생성하고 있습니다...',
                progress: 0.7,
                metadata: { step: 'generation' }
            },
            {
                content: '응답을 검증하고 최적화하고 있습니다...',
                progress: 0.9,
                metadata: { step: 'validation' }
            },
            {
                content: '응답이 준비되었습니다!',
                progress: 1.0,
                metadata: { step: 'complete' }
            }
        ];
    }

    private determineIntent(question: string): string {
        const lowerQuestion = question.toLowerCase();
        if (lowerQuestion.includes('상태') || lowerQuestion.includes('status')) return 'status';
        if (lowerQuestion.includes('성능') || lowerQuestion.includes('performance')) return 'performance';
        if (lowerQuestion.includes('오류') || lowerQuestion.includes('error')) return 'troubleshooting';
        if (lowerQuestion.includes('추천') || lowerQuestion.includes('제안')) return 'recommendation';
        return 'general';
    }

    private calculateComplexity(question: string): 'low' | 'medium' | 'high' {
        const length = question.length;
        const words = question.split(' ').length;

        if (length < 20 || words < 5) return 'low';
        if (length < 100 || words < 15) return 'medium';
        return 'high';
    }

    private extractKeywords(question: string): string[] {
        const stopWords = ['은', '는', '이', '가', '을', '를', '에', '에서', '로', '으로', '와', '과'];
        return question
            .split(' ')
            .filter(word => !stopWords.includes(word) && word.length > 1)
            .slice(0, 5);
    }

    private categorizeQuestion(question: string): string {
        const lowerQuestion = question.toLowerCase();
        if (lowerQuestion.includes('서버')) return 'server';
        if (lowerQuestion.includes('네트워크')) return 'network';
        if (lowerQuestion.includes('데이터베이스')) return 'database';
        if (lowerQuestion.includes('보안')) return 'security';
        return 'general';
    }
}
