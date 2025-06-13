/**
 * 🎯 AI 사이드바 도메인 서비스
 * 
 * 비즈니스 로직 중앙화
 * - AI 질의 처리
 * - 사고 과정 시뮬레이션
 * - 응답 생성
 * - 알림 관리
 */

import {
    AIThinkingStep,
    ChatMessage,
    AIResponse,
    SystemAlert,
    QuickQuestion,
    QUICK_QUESTIONS
} from '../types';

export class AISidebarService {
    private static instance: AISidebarService;

    public static getInstance(): AISidebarService {
        if (!AISidebarService.instance) {
            AISidebarService.instance = new AISidebarService();
        }
        return AISidebarService.instance;
    }

    /**
     * 🤖 AI 사고 과정 시뮬레이션
     */
    async simulateThinkingProcess(question: string): Promise<AIThinkingStep[]> {
        const steps: Omit<AIThinkingStep, 'id' | 'timestamp'>[] = [
            {
                step: '질문 분석 시작',
                content: `사용자 질문을 분석하고 있습니다: "${question.substring(0, 50)}..."`,
                type: 'analysis',
                duration: 500,
                progress: 0.1,
                confidence: 0.9
            },
            {
                step: '시스템 데이터 수집',
                content: '서버 메트릭, 로그, 성능 지표 등 관련 데이터를 수집하고 있습니다.',
                type: 'data_processing',
                duration: 700,
                progress: 0.3,
                confidence: 0.85
            },
            {
                step: '패턴 매칭 분석',
                content: '수집된 데이터에서 패턴을 분석하고 이상 징후를 탐지하고 있습니다.',
                type: 'pattern_matching',
                duration: 600,
                progress: 0.6,
                confidence: 0.88
            },
            {
                step: '논리적 추론 수행',
                content: '분석 결과를 바탕으로 논리적 추론을 통해 최적의 답변을 도출하고 있습니다.',
                type: 'reasoning',
                duration: 800,
                progress: 0.8,
                confidence: 0.92
            },
            {
                step: '최종 응답 생성',
                content: '추론 결과를 바탕으로 사용자에게 제공할 최종 응답을 생성하고 있습니다.',
                type: 'response_generation',
                duration: 400,
                progress: 1.0,
                confidence: 0.95
            }
        ];

        const thinkingSteps: AIThinkingStep[] = [];

        for (const step of steps) {
            await new Promise(resolve => setTimeout(resolve, step.duration));

            const thinkingStep: AIThinkingStep = {
                ...step,
                id: `thinking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date()
            };

            thinkingSteps.push(thinkingStep);
        }

        return thinkingSteps;
    }

    /**
     * 💬 AI 응답 생성
     */
    async generateResponse(question: string, thinkingSteps: AIThinkingStep[]): Promise<AIResponse> {
        const startTime = Date.now();

        // 실제 AI 처리 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 1000));

        const processingTime = Date.now() - startTime;

        // 질문 유형에 따른 응답 생성
        let response = '';
        let confidence = 0.8;
        let source: AIResponse['source'] = 'local';

        if (question.includes('서버') || question.includes('상태')) {
            response = `현재 시스템에는 16개의 서버가 운영 중이며, 전체적으로 안정적인 상태입니다. 
      
📊 **서버 상태 요약:**
- 정상 운영: 14개 서버 (87.5%)
- 주의 필요: 2개 서버 (12.5%)
- 장애 상태: 0개 서버

⚠️ **주의사항:**
- Server-07: CPU 사용률 85% (임계치 근접)
- Server-12: 메모리 사용률 78% (모니터링 필요)

💡 **권장사항:**
1. Server-07의 프로세스 최적화 검토
2. Server-12의 메모리 증설 고려
3. 주간 성능 리포트 확인`;
            confidence = 0.92;
            source = 'hybrid';
        } else if (question.includes('로그') || question.includes('수집')) {
            response = `최근 24시간 동안의 시스템 로그를 분석했습니다.

📋 **로그 분석 결과:**
- 총 로그 엔트리: 1,247,892개
- 에러 로그: 23개 (0.002%)
- 경고 로그: 156개 (0.013%)
- 정보 로그: 1,247,713개 (99.985%)

🔍 **주요 발견사항:**
- 03:15 - Database connection timeout (해결됨)
- 07:42 - SSL certificate renewal 알림
- 14:23 - Backup process 완료

✅ **시스템 상태:** 정상`;
            confidence = 0.89;
            source = 'local';
        } else if (question.includes('분석') || question.includes('패턴')) {
            response = `데이터 패턴 분석을 완료했습니다.

📈 **성능 트렌드:**
- CPU 사용률: 평균 45% (지난 주 대비 -3%)
- 메모리 사용률: 평균 62% (지난 주 대비 +2%)
- 네트워크 트래픽: 안정적 (피크 시간: 14:00-16:00)

🎯 **예측 분석:**
- 향후 7일간 안정적 운영 예상
- 메모리 사용률 증가 추세 모니터링 필요
- 주말 트래픽 감소 예상 (-15%)

🔧 **최적화 제안:**
1. 캐시 정책 재검토
2. 불필요한 백그라운드 프로세스 정리
3. 데이터베이스 인덱스 최적화`;
            confidence = 0.87;
            source = 'google_ai';
        } else {
            response = `질문을 이해했습니다. 

현재 시간: ${new Date().toLocaleString('ko-KR')}

🤖 **AI 분석 결과:**
- 질문 복잡도: 중간
- 처리 방식: 로컬 분석
- 신뢰도: ${Math.round(confidence * 100)}%

더 구체적인 정보가 필요하시면 다음과 같이 질문해주세요:
- "서버 상태는 어떤가요?"
- "시스템 로그를 확인해주세요"
- "성능 데이터를 분석해주세요"`;
            confidence = 0.75;
        }

        return {
            id: `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            query: question,
            response,
            confidence,
            timestamp: new Date(),
            thinkingSteps,
            processingTime,
            source
        };
    }

    /**
     * 🚨 시스템 알림 생성
     */
    createSystemAlert(type: SystemAlert['type'], title: string, message: string, options?: {
        autoClose?: number;
        isClosable?: boolean;
    }): SystemAlert {
        return {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            title,
            message,
            timestamp: new Date(),
            isClosable: options?.isClosable ?? true,
            autoClose: options?.autoClose
        };
    }

    /**
     * 🎯 빠른 질문 가져오기
     */
    getQuickQuestions(): readonly QuickQuestion[] {
        return QUICK_QUESTIONS;
    }

    /**
     * 📝 메시지 생성
     */
    createMessage(content: string, role: ChatMessage['role'], options?: {
        isTyping?: boolean;
        typingSpeed?: ChatMessage['typingSpeed'];
    }): ChatMessage {
        return {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            content,
            role,
            timestamp: new Date(),
            isTyping: options?.isTyping ?? false,
            typingSpeed: options?.typingSpeed ?? 'normal'
        };
    }

    /**
     * 🔍 질문 분석
     */
    analyzeQuestion(question: string): {
        category: QuickQuestion['category'];
        complexity: 'simple' | 'medium' | 'complex';
        estimatedTime: number;
        confidence: number;
    } {
        const lowerQuestion = question.toLowerCase();

        let category: QuickQuestion['category'] = 'server';
        let complexity: 'simple' | 'medium' | 'complex' = 'medium';
        let estimatedTime = 3000; // 기본 3초
        let confidence = 0.8;

        // 카테고리 분석
        if (lowerQuestion.includes('서버') || lowerQuestion.includes('상태')) {
            category = 'server';
            complexity = 'simple';
            estimatedTime = 2000;
            confidence = 0.9;
        } else if (lowerQuestion.includes('로그') || lowerQuestion.includes('검색')) {
            category = 'logs';
            complexity = 'medium';
            estimatedTime = 3500;
            confidence = 0.85;
        } else if (lowerQuestion.includes('분석') || lowerQuestion.includes('패턴')) {
            category = 'analysis';
            complexity = 'complex';
            estimatedTime = 5000;
            confidence = 0.75;
        } else if (lowerQuestion.includes('예측') || lowerQuestion.includes('미래')) {
            category = 'prediction';
            complexity = 'complex';
            estimatedTime = 6000;
            confidence = 0.7;
        }

        return {
            category,
            complexity,
            estimatedTime,
            confidence
        };
    }

    /**
     * 🎨 응답 포맷팅
     */
    formatResponse(response: string): string {
        // 마크다운 스타일 포맷팅
        return response
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    /**
     * 🔄 상태 검증
     */
    validateState(state: any): boolean {
        try {
            // 필수 필드 검증
            if (typeof state.isOpen !== 'boolean') return false;
            if (typeof state.isThinking !== 'boolean') return false;
            if (!Array.isArray(state.messages)) return false;
            if (!Array.isArray(state.thinkingSteps)) return false;
            if (!Array.isArray(state.alerts)) return false;

            return true;
        } catch (error) {
            console.error('상태 검증 실패:', error);
            return false;
        }
    }
} 