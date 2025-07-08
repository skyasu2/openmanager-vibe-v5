/**
 * 🚨 자연어 질의 에러 핸들러
 * 
 * 2가지 모드별 세분화된 에러 처리:
 * - LOCAL 모드 에러 처리
 * - GOOGLE_AI 모드 에러 처리
 * - 폴백 실패 에러 처리
 * - 사용자 친화적 에러 메시지 생성
 */

import { NaturalLanguageMode } from './NaturalLanguageModeProcessor';

// 에러 코드 정의
export enum NLErrorCode {
    // 입력 검증 에러
    INVALID_QUERY = 'INVALID_QUERY',
    INVALID_MODE = 'INVALID_MODE',
    EMPTY_QUERY = 'EMPTY_QUERY',

    // 로컬 모드 에러
    KOREAN_AI_UNAVAILABLE = 'KOREAN_AI_UNAVAILABLE',
    MCP_CONNECTION_FAILED = 'MCP_CONNECTION_FAILED',
    RAG_INDEX_ERROR = 'RAG_INDEX_ERROR',
    ALL_LOCAL_ENGINES_FAILED = 'ALL_LOCAL_ENGINES_FAILED',

    // Google AI 모드 에러
    GOOGLE_AI_API_KEY_MISSING = 'GOOGLE_AI_API_KEY_MISSING',
    GOOGLE_AI_QUOTA_EXCEEDED = 'GOOGLE_AI_QUOTA_EXCEEDED',
    GOOGLE_AI_NETWORK_ERROR = 'GOOGLE_AI_NETWORK_ERROR',
    GOOGLE_AI_UNAVAILABLE = 'GOOGLE_AI_UNAVAILABLE',

    // 폴백 에러
    FALLBACK_DISABLED = 'FALLBACK_DISABLED',
    ALL_FALLBACKS_FAILED = 'ALL_FALLBACKS_FAILED',

    // 시스템 에러
    SYSTEM_TIMEOUT = 'SYSTEM_TIMEOUT',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    PROCESSOR_NOT_INITIALIZED = 'PROCESSOR_NOT_INITIALIZED',
}

// 에러 심각도 레벨
export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical',
}

// 에러 정보 인터페이스
export interface NLErrorInfo {
    code: NLErrorCode;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    suggestions: string[];
    retryable: boolean;
    metadata?: any;
}

// 폴백 시나리오 정의
export interface FallbackScenario {
    mode: NaturalLanguageMode;
    primaryEngine: string;
    fallbackEngines: string[];
    failedEngines: string[];
    finalError: string;
}

/**
 * 🚨 자연어 에러 핸들러
 */
export class NaturalLanguageErrorHandler {
    private static instance: NaturalLanguageErrorHandler;

    private constructor() { }

    public static getInstance(): NaturalLanguageErrorHandler {
        if (!NaturalLanguageErrorHandler.instance) {
            NaturalLanguageErrorHandler.instance = new NaturalLanguageErrorHandler();
        }
        return NaturalLanguageErrorHandler.instance;
    }

    /**
     * 🔍 에러 분석 및 분류
     */
    public analyzeError(error: any, mode: NaturalLanguageMode, context?: any): NLErrorInfo {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // 입력 검증 에러
        if (this.isValidationError(errorMessage)) {
            return this.handleValidationError(errorMessage);
        }

        // 모드별 에러 분석
        switch (mode) {
            case 'LOCAL':
                return this.analyzeLocalModeError(errorMessage, context);
            case 'GOOGLE_AI':
                return this.analyzeGoogleAIModeError(errorMessage, context);
            default:
                return this.createGenericError(errorMessage);
        }
    }

    /**
     * 🏠 로컬 모드 에러 분석
     */
    private analyzeLocalModeError(errorMessage: string, context?: any): NLErrorInfo {
        const lowerMessage = errorMessage.toLowerCase();

        // Korean AI 관련 에러
        if (lowerMessage.includes('korean ai') || lowerMessage.includes('한국어')) {
            return {
                code: NLErrorCode.KOREAN_AI_UNAVAILABLE,
                severity: ErrorSeverity.MEDIUM,
                message: 'Korean AI 엔진 사용 불가',
                userMessage: '한국어 AI 엔진에 일시적인 문제가 발생했습니다. MCP 또는 RAG 엔진으로 처리를 시도합니다.',
                suggestions: [
                    'MCP 엔진을 사용해보세요',
                    'RAG 검색을 통해 답변을 찾아보세요',
                    '질문을 더 간단하게 바꿔보세요',
                ],
                retryable: true,
                metadata: { originalError: errorMessage },
            };
        }

        // MCP 관련 에러
        if (lowerMessage.includes('mcp') || lowerMessage.includes('연결')) {
            return {
                code: NLErrorCode.MCP_CONNECTION_FAILED,
                severity: ErrorSeverity.MEDIUM,
                message: 'MCP 엔진 연결 실패',
                userMessage: 'MCP 시스템 컨텍스트 엔진에 연결할 수 없습니다. RAG 엔진으로 처리를 시도합니다.',
                suggestions: [
                    'RAG 지식 베이스에서 답변을 찾아보세요',
                    '네트워크 연결을 확인해주세요',
                    '시스템 관리자에게 문의하세요',
                ],
                retryable: true,
                metadata: { originalError: errorMessage },
            };
        }

        // RAG 관련 에러
        if (lowerMessage.includes('rag') || lowerMessage.includes('인덱스') || lowerMessage.includes('검색')) {
            return {
                code: NLErrorCode.RAG_INDEX_ERROR,
                severity: ErrorSeverity.MEDIUM,
                message: 'RAG 엔진 인덱스 오류',
                userMessage: 'RAG 지식 베이스에 일시적인 문제가 발생했습니다.',
                suggestions: [
                    '잠시 후 다시 시도해주세요',
                    '질문을 다르게 표현해보세요',
                    '더 구체적인 키워드를 사용해보세요',
                ],
                retryable: true,
                metadata: { originalError: errorMessage },
            };
        }

        // 모든 로컬 엔진 실패
        if (lowerMessage.includes('모든') && lowerMessage.includes('로컬')) {
            return {
                code: NLErrorCode.ALL_LOCAL_ENGINES_FAILED,
                severity: ErrorSeverity.HIGH,
                message: '모든 로컬 AI 엔진 실패',
                userMessage: '현재 모든 로컬 AI 엔진에 문제가 발생했습니다. 시스템 관리자에게 문의하세요.',
                suggestions: [
                    'Google AI 모드를 시도해보세요',
                    '시스템 상태를 확인해주세요',
                    '관리자에게 장애 신고를 해주세요',
                ],
                retryable: false,
                metadata: { originalError: errorMessage },
            };
        }

        return this.createGenericError(errorMessage);
    }

    /**
     * 🌐 Google AI 모드 에러 분석
     */
    private analyzeGoogleAIModeError(errorMessage: string, context?: any): NLErrorInfo {
        const lowerMessage = errorMessage.toLowerCase();

        // API 키 관련 에러
        if (lowerMessage.includes('api key') || lowerMessage.includes('api 키') || lowerMessage.includes('인증')) {
            return {
                code: NLErrorCode.GOOGLE_AI_API_KEY_MISSING,
                severity: ErrorSeverity.CRITICAL,
                message: 'Google AI API 키 누락',
                userMessage: 'Google AI 서비스 인증에 실패했습니다. 관리자가 API 키를 설정해야 합니다.',
                suggestions: [
                    'LOCAL 모드를 사용해보세요',
                    '시스템 관리자에게 API 키 설정을 요청하세요',
                    '계정 설정을 확인해주세요',
                ],
                retryable: false,
                metadata: { originalError: errorMessage },
            };
        }

        // 쿼터 초과 에러
        if (lowerMessage.includes('quota') || lowerMessage.includes('limit') || lowerMessage.includes('한도')) {
            return {
                code: NLErrorCode.GOOGLE_AI_QUOTA_EXCEEDED,
                severity: ErrorSeverity.HIGH,
                message: 'Google AI 쿼터 초과',
                userMessage: 'Google AI 서비스의 일일 사용 한도를 초과했습니다. 내일 다시 시도하거나 로컬 모드를 사용하세요.',
                suggestions: [
                    'LOCAL 모드로 전환하세요',
                    '내일 다시 시도해보세요',
                    '사용량 모니터링을 확인하세요',
                ],
                retryable: false,
                metadata: { originalError: errorMessage },
            };
        }

        // 네트워크 관련 에러
        if (lowerMessage.includes('network') || lowerMessage.includes('timeout') || lowerMessage.includes('연결')) {
            return {
                code: NLErrorCode.GOOGLE_AI_NETWORK_ERROR,
                severity: ErrorSeverity.MEDIUM,
                message: 'Google AI 네트워크 오류',
                userMessage: 'Google AI 서비스에 연결할 수 없습니다. 네트워크 상태를 확인하고 다시 시도하세요.',
                suggestions: [
                    '네트워크 연결을 확인해주세요',
                    'LOCAL 모드를 시도해보세요',
                    '잠시 후 다시 시도해주세요',
                ],
                retryable: true,
                metadata: { originalError: errorMessage },
            };
        }

        // Google AI 일반 사용 불가
        if (lowerMessage.includes('google ai') || lowerMessage.includes('처리 실패')) {
            return {
                code: NLErrorCode.GOOGLE_AI_UNAVAILABLE,
                severity: ErrorSeverity.HIGH,
                message: 'Google AI 서비스 사용 불가',
                userMessage: 'Google AI 서비스에 일시적인 문제가 발생했습니다. 로컬 모드로 폴백하거나 잠시 후 다시 시도하세요.',
                suggestions: [
                    'LOCAL 모드로 전환하세요',
                    '폴백 옵션을 활성화하세요',
                    '잠시 후 다시 시도해주세요',
                ],
                retryable: true,
                metadata: { originalError: errorMessage },
            };
        }

        return this.createGenericError(errorMessage);
    }

    /**
     * ✅ 입력 검증 에러 확인
     */
    private isValidationError(errorMessage: string): boolean {
        const validationKeywords = [
            'query', '질의', '입력', 'parameter', '파라미터',
            'mode', '모드', 'invalid', '유효하지',
        ];

        return validationKeywords.some(keyword =>
            errorMessage.toLowerCase().includes(keyword)
        );
    }

    /**
     * 📝 입력 검증 에러 처리
     */
    private handleValidationError(errorMessage: string): NLErrorInfo {
        const lowerMessage = errorMessage.toLowerCase();

        if (lowerMessage.includes('query') || lowerMessage.includes('질의') || lowerMessage.includes('빈')) {
            return {
                code: NLErrorCode.EMPTY_QUERY,
                severity: ErrorSeverity.LOW,
                message: '빈 질의',
                userMessage: '질문을 입력해주세요.',
                suggestions: [
                    '구체적인 질문을 입력하세요',
                    '예: "서버 상태는 어떻게 확인하나요?"',
                    '시스템 관련 질문을 해보세요',
                ],
                retryable: true,
                metadata: { originalError: errorMessage },
            };
        }

        if (lowerMessage.includes('mode') || lowerMessage.includes('모드')) {
            return {
                code: NLErrorCode.INVALID_MODE,
                severity: ErrorSeverity.LOW,
                message: '잘못된 모드',
                userMessage: '올바른 모드를 선택해주세요 (LOCAL 또는 GOOGLE_AI).',
                suggestions: [
                    'LOCAL 모드: 로컬 AI 엔진 사용',
                    'GOOGLE_AI 모드: Google AI 우선 사용',
                    '기본값은 LOCAL 모드입니다',
                ],
                retryable: true,
                metadata: { originalError: errorMessage },
            };
        }

        return {
            code: NLErrorCode.INVALID_QUERY,
            severity: ErrorSeverity.LOW,
            message: '잘못된 입력',
            userMessage: '입력 형식이 올바르지 않습니다.',
            suggestions: [
                '입력 내용을 다시 확인해주세요',
                'API 문서를 참조하세요',
                '예시를 참고해서 입력하세요',
            ],
            retryable: true,
            metadata: { originalError: errorMessage },
        };
    }

    /**
     * 🔄 폴백 시나리오 분석
     */
    public analyzeFallbackScenario(scenario: FallbackScenario): NLErrorInfo {
        const { mode, primaryEngine, fallbackEngines, failedEngines, finalError } = scenario;

        // 폴백이 완전히 실패한 경우
        if (failedEngines.length === fallbackEngines.length + 1) { // +1 for primary
            return {
                code: NLErrorCode.ALL_FALLBACKS_FAILED,
                severity: ErrorSeverity.CRITICAL,
                message: '모든 폴백 엔진 실패',
                userMessage: `${mode} 모드의 모든 AI 엔진에서 처리에 실패했습니다. 시스템에 심각한 문제가 있을 수 있습니다.`,
                suggestions: [
                    mode === 'LOCAL' ? 'GOOGLE_AI 모드를 시도해보세요' : 'LOCAL 모드를 시도해보세요',
                    '시스템 관리자에게 즉시 문의하세요',
                    '나중에 다시 시도해주세요',
                ],
                retryable: false,
                metadata: {
                    mode,
                    primaryEngine,
                    fallbackEngines,
                    failedEngines,
                    finalError,
                },
            };
        }

        // 부분적 폴백 실패
        return {
            code: NLErrorCode.FALLBACK_DISABLED,
            severity: ErrorSeverity.MEDIUM,
            message: '폴백 처리 제한',
            userMessage: `${primaryEngine} 엔진이 실패했지만 폴백 처리가 제한되어 있습니다.`,
            suggestions: [
                '폴백 옵션을 활성화하세요',
                '다른 모드를 시도해보세요',
                '질문을 단순화해보세요',
            ],
            retryable: true,
            metadata: {
                mode,
                primaryEngine,
                fallbackEngines,
                failedEngines,
                finalError,
            },
        };
    }

    /**
     * ⚠️ 일반 에러 생성
     */
    private createGenericError(errorMessage: string): NLErrorInfo {
        return {
            code: NLErrorCode.INTERNAL_ERROR,
            severity: ErrorSeverity.MEDIUM,
            message: '시스템 내부 오류',
            userMessage: '예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            suggestions: [
                '잠시 후 다시 시도해주세요',
                '질문을 다르게 표현해보세요',
                '시스템 관리자에게 문의하세요',
            ],
            retryable: true,
            metadata: { originalError: errorMessage },
        };
    }

    /**
     * 📊 에러 통계 및 패턴 분석
     */
    public analyzeErrorPattern(errors: NLErrorInfo[]): {
        mostCommonError: NLErrorCode;
        severityDistribution: Record<ErrorSeverity, number>;
        retryablePercentage: number;
        recommendations: string[];
    } {
        if (errors.length === 0) {
            return {
                mostCommonError: NLErrorCode.INTERNAL_ERROR,
                severityDistribution: {
                    [ErrorSeverity.LOW]: 0,
                    [ErrorSeverity.MEDIUM]: 0,
                    [ErrorSeverity.HIGH]: 0,
                    [ErrorSeverity.CRITICAL]: 0,
                },
                retryablePercentage: 0,
                recommendations: ['데이터가 없습니다'],
            };
        }

        // 가장 흔한 에러 코드
        const errorCounts = errors.reduce((acc, error) => {
            acc[error.code] = (acc[error.code] || 0) + 1;
            return acc;
        }, {} as Record<NLErrorCode, number>);

        const mostCommonError = Object.entries(errorCounts)
            .sort(([, a], [, b]) => b - a)[0][0] as NLErrorCode;

        // 심각도 분포
        const severityDistribution = errors.reduce((acc, error) => {
            acc[error.severity]++;
            return acc;
        }, {
            [ErrorSeverity.LOW]: 0,
            [ErrorSeverity.MEDIUM]: 0,
            [ErrorSeverity.HIGH]: 0,
            [ErrorSeverity.CRITICAL]: 0,
        });

        // 재시도 가능 비율
        const retryableCount = errors.filter(e => e.retryable).length;
        const retryablePercentage = (retryableCount / errors.length) * 100;

        // 권장사항 생성
        const recommendations = this.generateRecommendations(mostCommonError, severityDistribution);

        return {
            mostCommonError,
            severityDistribution,
            retryablePercentage,
            recommendations,
        };
    }

    /**
     * 💡 권장사항 생성
     */
    private generateRecommendations(
        mostCommonError: NLErrorCode,
        severityDistribution: Record<ErrorSeverity, number>
    ): string[] {
        const recommendations: string[] = [];

        // 심각도 기반 권장사항
        if (severityDistribution[ErrorSeverity.CRITICAL] > 0) {
            recommendations.push('긴급: 시스템 관리자에게 즉시 연락하세요');
        }

        if (severityDistribution[ErrorSeverity.HIGH] > severityDistribution[ErrorSeverity.LOW]) {
            recommendations.push('높은 심각도 에러가 많습니다. 시스템 점검이 필요합니다');
        }

        // 가장 흔한 에러 기반 권장사항
        switch (mostCommonError) {
            case NLErrorCode.GOOGLE_AI_QUOTA_EXCEEDED:
                recommendations.push('Google AI 사용량 모니터링을 강화하세요');
                break;
            case NLErrorCode.KOREAN_AI_UNAVAILABLE:
                recommendations.push('Korean AI 엔진 안정성을 점검하세요');
                break;
            case NLErrorCode.MCP_CONNECTION_FAILED:
                recommendations.push('MCP 서버 연결 상태를 확인하세요');
                break;
            default:
                recommendations.push('시스템 전반적인 헬스체크를 수행하세요');
        }

        return recommendations;
    }
} 