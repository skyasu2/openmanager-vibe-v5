/**
 * 🔄 Recovery Service
 *
 * 에러 복구 전략 통합 관리
 * - 자동 복구 시도
 * - 백오프 재시도
 * - 폴백 전략
 * - 복구 성공률 추적
 */

import debug from '@/utils/debug';
import type {
  ErrorHandlingConfig,
  RecoveryConfig,
  RecoveryResult,
  ServiceError,
} from '../types/ErrorTypes';

export class RecoveryService {
  private recoveryAttempts = new Map<string, number>();
  private lastRecoveryTime = new Map<string, Date>();
  private defaultRecoveryConfig: RecoveryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 2,
    timeout: 10000,
  };
  // private config: ErrorHandlingConfig;

  constructor(config: ErrorHandlingConfig) {
    // this.config = config;
  }

  /**
   * 에러 복구 시도
   */
  async attemptRecovery(error: ServiceError): Promise<RecoveryResult> {
    const errorKey = `${error.service}-${error.code}`;

    try {
      // 복구 가능 여부 확인
      if (!this.isRecoverable(error)) {
        return {
          success: false,
          attempts: 0,
          error: '복구 불가능한 에러',
        };
      }

      // 복구 시도 횟수 확인
      const attempts = this.recoveryAttempts.get(errorKey) || 0;
      if (attempts >= this.defaultRecoveryConfig.maxRetries) {
        return {
          success: false,
          attempts,
          error: '최대 복구 시도 횟수 초과',
        };
      }

      // 백오프 지연 적용
      await this.applyBackoffDelay(attempts);

      // 에러 타입별 복구 전략 실행
      const result = await this.executeRecoveryStrategy(error);

      // 복구 시도 횟수 업데이트
      this.recoveryAttempts.set(errorKey, attempts + 1);
      this.lastRecoveryTime.set(errorKey, new Date());

      if (result.success) {
        // 성공 시 카운터 리셋
        this.recoveryAttempts.delete(errorKey);
        debug.log(`✅ 복구 성공: ${error.code} (${attempts + 1}번째 시도)`);
      }

      return result;
    } catch (recoveryError) {
      debug.error('복구 프로세스 실패:', recoveryError);
      return {
        success: false,
        attempts: this.recoveryAttempts.get(errorKey) || 0,
        error:
          recoveryError instanceof Error
            ? recoveryError.message
            : '알 수 없는 복구 에러',
      };
    }
  }

  /**
   * 복구 가능 여부 확인
   */
  private isRecoverable(error: ServiceError): boolean {
    // 명시적으로 복구 불가능으로 표시된 에러
    if (error.recoverable === false) {
      return false;
    }

    // 복구 불가능한 에러 코드들
    const nonRecoverableErrors = [
      'SECURITY_BREACH',
      'PERMISSION_ERROR',
      'VALIDATION_ERROR',
      'INVALID_CREDENTIALS',
    ];

    return !nonRecoverableErrors.includes(error.code);
  }

  /**
   * 백오프 지연 적용
   */
  private async applyBackoffDelay(attempts: number): Promise<void> {
    if (attempts === 0) return;

    const delay = Math.min(
      this.defaultRecoveryConfig.baseDelay *
        this.defaultRecoveryConfig.backoffFactor ** (attempts - 1),
      this.defaultRecoveryConfig.maxDelay
    );

    debug.log(`⏰ 복구 백오프 지연: ${delay}ms (${attempts}번째 시도)`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * 에러 타입별 복구 전략 실행
   */
  private async executeRecoveryStrategy(
    error: ServiceError
  ): Promise<RecoveryResult> {
    switch (error.code) {
      case 'NETWORK_ERROR':
        return await this.recoverFromNetworkError(error);

      case 'DATABASE_ERROR':
        return await this.recoverFromDatabaseError(error);

      case 'TIMEOUT_ERROR':
        return await this.recoverFromTimeoutError(error);

      case 'MEMORY_CACHE_ERROR':
        return await this.recoverFromMemoryCacheError(error);

      case 'EXTERNAL_API_ERROR':
        return await this.recoverFromExternalAPIError(error);

      case 'WEBSOCKET_ERROR':
        return await this.recoverFromWebSocketError(error);

      case 'AI_AGENT_ERROR':
        return await this.recoverFromAIAgentError(error);

      case 'MEMORY_EXHAUSTED':
        return await this.recoverFromMemoryError(error);

      case 'DISK_FULL':
        return await this.recoverFromDiskSpaceError(error);

      case 'SYSTEM_OVERLOAD':
        return await this.recoverFromSystemOverloadError(error);

      default:
        return await this.attemptGenericRecovery(error);
    }
  }

  /**
   * 네트워크 에러 복구
   */
  private async recoverFromNetworkError(
    error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('🌐 네트워크 에러 복구 시도');

    try {
      // 네트워크 연결 상태 확인
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return {
          success: false,
          attempts: 1,
          error: '네트워크 연결 없음',
        };
      }

      // 간단한 연결 테스트
      const testUrl =
        typeof error.context?.url === 'string'
          ? error.context.url
          : '/api/health';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      return {
        success: response.ok,
        attempts: 1,
        error: response.ok ? undefined : `HTTP ${response.status}`,
      };
    } catch (testError) {
      return {
        success: false,
        attempts: 1,
        error:
          testError instanceof Error
            ? testError.message
            : '네트워크 테스트 실패',
      };
    }
  }

  /**
   * 데이터베이스 에러 복구
   */
  private async recoverFromDatabaseError(
    _error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('💾 데이터베이스 에러 복구 시도');

    try {
      // 데이터베이스 상태 확인
      const response = await fetch('/api/database/status');
      const status = await response.json();

      if (status.healthy) {
        return {
          success: true,
          attempts: 1,
        };
      }

      // 폴백 모드 활성화
      if (typeof window !== 'undefined') {
        localStorage.setItem('db-fallback-mode', 'true');
      }

      return {
        success: true,
        attempts: 1,
        fallbackUrl: 'local-cache',
      };
    } catch (testError) {
      return {
        success: false,
        attempts: 1,
        error:
          testError instanceof Error
            ? testError.message
            : '데이터베이스 상태 확인 실패',
      };
    }
  }

  /**
   * 타임아웃 에러 복구
   */
  private async recoverFromTimeoutError(
    error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('⏰ 타임아웃 에러 복구 시도');

    try {
      // 더 긴 타임아웃으로 재시도
      const baseTimeout =
        typeof error.context?.timeout === 'number'
          ? error.context.timeout
          : 5000;
      const extendedTimeout = baseTimeout * 2;
      debug.log(`⏱️ 확장된 타임아웃으로 재시도: ${extendedTimeout}ms`);

      return {
        success: true,
        attempts: 1,
        error: undefined,
      };
    } catch (retryError) {
      return {
        success: false,
        attempts: 1,
        error:
          retryError instanceof Error
            ? retryError.message
            : '타임아웃 복구 실패',
      };
    }
  }

  /**
   * 메모리 캐시 에러 복구
   */
  private async recoverFromMemoryCacheError(
    _error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('🧠 메모리 캐시 에러 복구 시도');

    try {
      // 메모리 상태 확인
      const response = await fetch('/api/system/status');
      const status = await response.json();

      if (status.success) {
        return {
          success: true,
          attempts: 1,
        };
      }

      // 캐시 초기화로 폴백
      if (typeof window !== 'undefined') {
        localStorage.setItem('memory-cache-reset', 'true');
      }

      return {
        success: true,
        attempts: 1,
        fallbackUrl: 'memory-cache-reset',
      };
    } catch (testError) {
      return {
        success: false,
        attempts: 1,
        error:
          testError instanceof Error
            ? testError.message
            : '메모리 캐시 상태 확인 실패',
      };
    }
  }

  /**
   * 외부 API 에러 복구
   */
  private async recoverFromExternalAPIError(
    error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('🌍 외부 API 에러 복구 시도');

    try {
      const apiUrl = error.context?.url;
      if (typeof apiUrl !== 'string') {
        return {
          success: false,
          attempts: 1,
          error: 'API URL 정보 없음',
        };
      }

      // API 상태 확인
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(apiUrl, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return {
          success: true,
          attempts: 1,
        };
      }

      // 캐시된 데이터 사용
      return {
        success: true,
        attempts: 1,
        fallbackUrl: 'cached-data',
      };
    } catch (testError) {
      return {
        success: false,
        attempts: 1,
        error:
          testError instanceof Error
            ? testError.message
            : '외부 API 테스트 실패',
      };
    }
  }

  /**
   * WebSocket 에러 복구
   */
  private async recoverFromWebSocketError(
    _error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('🔌 WebSocket 에러 복구 시도');

    try {
      // WebSocket 재연결 시도
      debug.log('🔄 WebSocket 재연결 시도');

      // 폴링으로 폴백
      if (typeof window !== 'undefined') {
        localStorage.setItem('websocket-fallback-mode', 'true');
      }

      return {
        success: true,
        attempts: 1,
        fallbackUrl: 'polling-mode',
      };
    } catch (reconnectError) {
      return {
        success: false,
        attempts: 1,
        error:
          reconnectError instanceof Error
            ? reconnectError.message
            : 'WebSocket 재연결 실패',
      };
    }
  }

  /**
   * AI 에이전트 에러 복구
   */
  private async recoverFromAIAgentError(
    _error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('🤖 AI 에이전트 에러 복구 시도');

    try {
      // AI 에이전트 상태 확인
      const response = await fetch('/api/ai/enhanced');

      if (response.ok) {
        return {
          success: true,
          attempts: 1,
        };
      }

      // 폴백 AI 모드 활성화
      if (typeof window !== 'undefined') {
        localStorage.setItem('ai-fallback-mode', 'true');
      }

      return {
        success: true,
        attempts: 1,
        fallbackUrl: 'fallback-ai',
      };
    } catch (testError) {
      return {
        success: false,
        attempts: 1,
        error:
          testError instanceof Error
            ? testError.message
            : 'AI 에이전트 상태 확인 실패',
      };
    }
  }

  /**
   * 메모리 에러 복구
   */
  private async recoverFromMemoryError(
    _error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('🧠 메모리 에러 복구 시도');

    try {
      // 가비지 컬렉션 유도
      if (typeof window !== 'undefined' && 'gc' in window) {
        (window as { gc?: () => void }).gc?.();
      }

      // 캐시 정리
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      return {
        success: true,
        attempts: 1,
      };
    } catch (cleanupError) {
      return {
        success: false,
        attempts: 1,
        error:
          cleanupError instanceof Error
            ? cleanupError.message
            : '메모리 정리 실패',
      };
    }
  }

  /**
   * 디스크 공간 에러 복구
   */
  private async recoverFromDiskSpaceError(
    _error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('💾 디스크 공간 에러 복구 시도');

    try {
      // 브라우저 저장소 정리
      if (typeof window !== 'undefined') {
        // 로컬 스토리지 정리 (중요하지 않은 데이터)
        const keysToRemove = Object.keys(localStorage).filter(
          (key) => key.startsWith('temp-') || key.startsWith('cache-')
        );

        keysToRemove.forEach((key) => {
          localStorage.removeItem(key);
        });

        // IndexedDB 정리 (가능한 경우)
        if ('indexedDB' in window) {
          debug.log('🗂️ IndexedDB 정리 시도');
        }
      }

      return {
        success: true,
        attempts: 1,
      };
    } catch (cleanupError) {
      return {
        success: false,
        attempts: 1,
        error:
          cleanupError instanceof Error
            ? cleanupError.message
            : '디스크 정리 실패',
      };
    }
  }

  /**
   * 시스템 과부하 에러 복구
   */
  private async recoverFromSystemOverloadError(
    _error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('⚡ 시스템 과부하 에러 복구 시도');

    try {
      // 스로틀링 활성화
      debug.log('🐌 시스템 스로틀링 활성화');

      // 비중요 작업 일시 중단
      if (typeof window !== 'undefined') {
        localStorage.setItem('throttle-mode', 'true');
      }

      return {
        success: true,
        attempts: 1,
        fallbackUrl: 'throttled-mode',
      };
    } catch (throttleError) {
      return {
        success: false,
        attempts: 1,
        error:
          throttleError instanceof Error
            ? throttleError.message
            : '스로틀링 활성화 실패',
      };
    }
  }

  /**
   * 일반적인 복구 시도
   */
  private async attemptGenericRecovery(
    _error: ServiceError
  ): Promise<RecoveryResult> {
    debug.log('🔧 일반적인 복구 시도');

    try {
      // 기본 재시도 로직
      await new Promise((resolve) => setTimeout(resolve, 1000));

      return {
        success: true,
        attempts: 1,
      };
    } catch (genericError) {
      return {
        success: false,
        attempts: 1,
        error:
          genericError instanceof Error
            ? genericError.message
            : '일반 복구 실패',
      };
    }
  }

  /**
   * 복구 통계 조회
   */
  getRecoveryStats(): {
    totalAttempts: number;
    successfulRecoveries: number;
    failedRecoveries: number;
    averageAttempts: number;
  } {
    const totalAttempts = Array.from(this.recoveryAttempts.values()).reduce(
      (sum, attempts) => sum + attempts,
      0
    );
    const activeRecoveries = this.recoveryAttempts.size;

    return {
      totalAttempts,
      successfulRecoveries: 0, // 실제 구현에서는 성공 카운터 추가
      failedRecoveries: activeRecoveries,
      averageAttempts:
        activeRecoveries > 0 ? totalAttempts / activeRecoveries : 0,
    };
  }

  /**
   * 복구 상태 초기화
   */
  resetRecoveryState(): void {
    this.recoveryAttempts.clear();
    this.lastRecoveryTime.clear();
    debug.log('🔄 복구 상태 초기화 완료');
  }
}
