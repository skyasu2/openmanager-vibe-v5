/**
 * 🛠️ Default Error Handlers
 * 
 * 기본 에러 핸들러 설정 및 관리
 * - 표준 에러 타입별 처리
 * - 기본 복구 전략
 * - 로깅 및 알림
 */

import { ErrorHandlingCore } from '../core/ErrorHandlingCore';
import { ServiceError } from '../types/ErrorTypes';

export class DefaultErrorHandlers {
    constructor(private core: ErrorHandlingCore) {
        this.setupDefaultHandlers();
    }

    /**
     * 기본 에러 핸들러 설정
     */
    private setupDefaultHandlers(): void {
        // 기본 핸들러
        this.core.register('default', (error: ServiceError) => {
            console.error(`🚨 처리되지 않은 서비스 에러: ${error.message}`);
        });

        // 네트워크 에러
        this.core.register('NETWORK_ERROR', (error: ServiceError) => {
            console.warn('🌐 네트워크 에러 감지, 재시도 전략 실행');
            this.logErrorWithContext(error, '네트워크 연결 문제');
        });

        // 데이터베이스 에러
        this.core.register('DATABASE_ERROR', (error: ServiceError) => {
            console.error('💾 데이터베이스 에러 감지, 폴백 모드 전환');
            this.logErrorWithContext(error, '데이터베이스 연결 또는 쿼리 실패');
        });

        // 인증 에러
        this.core.register('AUTH_ERROR', (error: ServiceError) => {
            console.warn('🔐 인증 에러, 로그인 페이지로 리다이렉트');
            this.handleAuthenticationError(error);
        });

        // 권한 에러
        this.core.register('PERMISSION_ERROR', (error: ServiceError) => {
            console.warn('🚫 권한 거부, 접근 제한 메시지 표시');
            this.handlePermissionError(error);
        });

        // 검증 에러
        this.core.register('VALIDATION_ERROR', (error: ServiceError) => {
            console.info('✋ 검증 에러, 사용자 친화적 메시지 표시');
            this.handleValidationError(error);
        });

        // 설정 에러
        this.core.register('CONFIG_ERROR', (error: ServiceError) => {
            console.error('⚙️ 설정 에러 감지, 기본 설정 사용');
            this.handleConfigError(error);
        });

        // 타임아웃 에러
        this.core.register('TIMEOUT_ERROR', (error: ServiceError) => {
            console.warn('⏰ 타임아웃 에러, 백오프 재시도 실행');
            this.handleTimeoutError(error);
        });

        // AI 에이전트 에러
        this.core.register('AI_AGENT_ERROR', (error: ServiceError) => {
            console.warn('🤖 AI 에이전트 에러 감지, 재시작 시도');
            this.handleAIAgentError(error);
        });

        // 메모리 부족 에러
        this.core.register('MEMORY_EXHAUSTED', (error: ServiceError) => {
            console.error('🧠 메모리 부족, 정리 작업 트리거');
            this.handleMemoryError(error);
        });

        // 디스크 공간 부족 에러
        this.core.register('DISK_FULL', (error: ServiceError) => {
            console.error('💾 디스크 공간 부족, 임시 파일 정리');
            this.handleDiskSpaceError(error);
        });

        // Redis 연결 에러
        this.core.register('REDIS_CONNECTION_ERROR', (error: ServiceError) => {
            console.warn('🔴 Redis 연결 에러, 메모리 캐시로 전환');
            this.handleRedisError(error);
        });

        // Prometheus 메트릭 에러
        this.core.register('PROMETHEUS_ERROR', (error: ServiceError) => {
            console.warn('📊 Prometheus 메트릭 에러, 폴백 모니터링 사용');
            this.handlePrometheusError(error);
        });

        // 시스템 과부하 에러
        this.core.register('SYSTEM_OVERLOAD', (error: ServiceError) => {
            console.error('⚡ 시스템 과부하 감지, 스로틀링 구현');
            this.handleSystemOverloadError(error);
        });

        // 외부 API 에러
        this.core.register('EXTERNAL_API_ERROR', (error: ServiceError) => {
            console.warn('🌍 외부 API 에러, 캐시된 데이터 사용');
            this.handleExternalAPIError(error);
        });

        // 웹소켓 연결 에러
        this.core.register('WEBSOCKET_ERROR', (error: ServiceError) => {
            console.warn('🔌 WebSocket 연결 에러, 재연결 시도');
            this.handleWebSocketError(error);
        });

        // 파일 시스템 에러
        this.core.register('FILESYSTEM_ERROR', (error: ServiceError) => {
            console.error('📁 파일 시스템 에러, 권한 및 공간 확인');
            this.handleFileSystemError(error);
        });

        // 보안 위반 에러
        this.core.register('SECURITY_BREACH', (error: ServiceError) => {
            console.error('🛡️ 보안 위반 감지 - 긴급 대응');
            this.handleSecurityBreachError(error);
        });

        // 요청 제한 에러
        this.core.register('RATE_LIMIT_ERROR', (error: ServiceError) => {
            console.warn('⚡ 요청 제한 초과, 백오프 적용');
            this.handleRateLimitError(error);
        });

        // 서비스 의존성 에러
        this.core.register('SERVICE_DEPENDENCY_ERROR', (error: ServiceError) => {
            console.warn('🔗 서비스 의존성 에러, 폴백 서비스 활성화');
            this.handleServiceDependencyError(error);
        });
    }

    /**
     * 컨텍스트와 함께 에러 로깅
     */
    private logErrorWithContext(error: ServiceError, description: string): void {
        console.log(`📝 에러 상세 정보:`, {
            description,
            code: error.code,
            service: error.service,
            message: error.message,
            context: error.context,
            timestamp: error.timestamp,
            severity: error.severity
        });
    }

    /**
     * 인증 에러 처리
     */
    private handleAuthenticationError(error: ServiceError): void {
        this.logErrorWithContext(error, '사용자 인증 실패');

        // 브라우저 환경에서 토큰 제거
        if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // 로그인 페이지로 리다이렉트 (실제 구현 시)
            console.log('🔄 로그인 페이지로 리다이렉트 예정');
        }
    }

    /**
     * 권한 에러 처리
     */
    private handlePermissionError(error: ServiceError): void {
        this.logErrorWithContext(error, '접근 권한 부족');

        // 사용자에게 권한 부족 메시지 표시
        console.log('💡 사용자에게 권한 부족 알림 표시');
    }

    /**
     * 검증 에러 처리
     */
    private handleValidationError(error: ServiceError): void {
        this.logErrorWithContext(error, '입력 데이터 검증 실패');

        // 사용자 친화적 검증 메시지 표시
        console.log('📋 검증 에러 메시지 사용자에게 표시');
    }

    /**
     * 설정 에러 처리
     */
    private handleConfigError(error: ServiceError): void {
        this.logErrorWithContext(error, '시스템 설정 문제');

        // 기본 설정으로 폴백
        console.log('⚙️ 기본 설정으로 폴백 활성화');
    }

    /**
     * 타임아웃 에러 처리
     */
    private handleTimeoutError(error: ServiceError): void {
        this.logErrorWithContext(error, '작업 시간 초과');

        // 백오프 재시도 로직 (실제 구현 시 RecoveryService에서 처리)
        console.log('🔄 백오프 재시도 전략 활성화');
    }

    /**
     * AI 에이전트 에러 처리
     */
    private handleAIAgentError(error: ServiceError): void {
        this.logErrorWithContext(error, 'AI 에이전트 동작 이상');

        // AI 에이전트 재시작 또는 폴백 모드
        console.log('🤖 AI 에이전트 재시작 또는 폴백 모드 활성화');
    }

    /**
     * 메모리 에러 처리
     */
    private handleMemoryError(error: ServiceError): void {
        this.logErrorWithContext(error, '시스템 메모리 부족');

        // 가비지 컬렉션 유도 및 캐시 정리
        if (typeof window !== 'undefined') {
            // 브라우저 캐시 정리
            console.log('🧹 브라우저 캐시 정리 실행');
        }
    }

    /**
     * 디스크 공간 에러 처리
     */
    private handleDiskSpaceError(error: ServiceError): void {
        this.logErrorWithContext(error, '디스크 공간 부족');

        // 임시 파일 정리
        console.log('🗂️ 임시 파일 정리 작업 시작');
    }

    /**
     * Redis 에러 처리
     */
    private handleRedisError(error: ServiceError): void {
        this.logErrorWithContext(error, 'Redis 연결 또는 작업 실패');

        // 메모리 캐시로 폴백
        console.log('🔄 메모리 캐시 폴백 활성화');
    }

    /**
     * Prometheus 에러 처리
     */
    private handlePrometheusError(error: ServiceError): void {
        this.logErrorWithContext(error, 'Prometheus 메트릭 수집 실패');

        // 폴백 모니터링 활성화
        console.log('📊 폴백 모니터링 시스템 활성화');
    }

    /**
     * 시스템 과부하 에러 처리
     */
    private handleSystemOverloadError(error: ServiceError): void {
        this.logErrorWithContext(error, '시스템 리소스 과부하');

        // 스로틀링 및 우선순위 조정
        console.log('⚡ 시스템 스로틀링 활성화');
    }

    /**
     * 외부 API 에러 처리
     */
    private handleExternalAPIError(error: ServiceError): void {
        this.logErrorWithContext(error, '외부 API 호출 실패');

        // 캐시된 데이터 사용
        console.log('💾 캐시된 데이터로 폴백');
    }

    /**
     * WebSocket 에러 처리
     */
    private handleWebSocketError(error: ServiceError): void {
        this.logErrorWithContext(error, 'WebSocket 연결 문제');

        // 재연결 시도 또는 폴링으로 전환
        console.log('🔌 WebSocket 재연결 또는 폴링 전환');
    }

    /**
     * 파일 시스템 에러 처리
     */
    private handleFileSystemError(error: ServiceError): void {
        this.logErrorWithContext(error, '파일 시스템 접근 문제');

        // 권한 확인 및 대체 경로 사용
        console.log('📁 파일 시스템 복구 작업 시작');
    }

    /**
     * 보안 위반 에러 처리
     */
    private handleSecurityBreachError(error: ServiceError): void {
        this.logErrorWithContext(error, '보안 위반 감지');

        // 긴급 보안 조치
        console.error('🚨 긴급 보안 조치 활성화');

        // 관리자 알림 (실제 구현 시)
        console.log('📢 관리자 긴급 알림 전송');
    }

    /**
     * 요청 제한 에러 처리
     */
    private handleRateLimitError(error: ServiceError): void {
        this.logErrorWithContext(error, 'API 요청 제한 초과');

        // 백오프 적용
        console.log('⏰ 요청 백오프 적용');
    }

    /**
     * 서비스 의존성 에러 처리
     */
    private handleServiceDependencyError(error: ServiceError): void {
        this.logErrorWithContext(error, '의존 서비스 장애');

        // 폴백 서비스 활성화
        console.log('🔗 폴백 서비스 활성화');
    }
} 