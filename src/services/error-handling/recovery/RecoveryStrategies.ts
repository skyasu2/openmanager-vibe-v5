/**
 * 🔄 복구 전략 구현
 */

import type {
  ServiceError,
  RecoveryStrategy,
  RecoveryConfig,
} from '../types/ErrorTypes';
import { ERROR_CODES } from '../types/ErrorTypes';

export class NetworkRecoveryStrategy implements RecoveryStrategy {
  private readonly config: RecoveryConfig;

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 3,
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 10000,
      backoffFactor: config.backoffFactor || 2,
      timeout: config.timeout || 30000,
    };
  }

  canRecover(error: ServiceError): boolean {
    return [
      ERROR_CODES.NETWORK_ERROR,
      ERROR_CODES.CONNECTION_TIMEOUT,
      ERROR_CODES.DNS_RESOLUTION_FAILED,
    ].includes(error.code as any);
  }

  async recover(error: ServiceError): Promise<boolean> {
    console.log(`🔄 네트워크 복구 시도: ${error.message}`);

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const delay = Math.min(
          this.config.baseDelay *
            Math.pow(this.config.backoffFactor, attempt - 1),
          this.config.maxDelay
        );

        if (attempt > 1) {
          console.log(
            `재시도 ${attempt}/${this.config.maxRetries} (${delay}ms 후)`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        // 네트워크 연결 테스트
        const isConnected = await this.testNetworkConnection();
        if (isConnected) {
          console.log('✅ 네트워크 복구 성공');
          return true;
        }
      } catch (recoveryError) {
        console.warn(`복구 시도 ${attempt} 실패:`, recoveryError);
      }
    }

    console.error('❌ 네트워크 복구 실패');
    return false;
  }

  private async testNetworkConnection(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class DatabaseRecoveryStrategy implements RecoveryStrategy {
  private readonly config: RecoveryConfig;

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 2,
      baseDelay: config.baseDelay || 2000,
      maxDelay: config.maxDelay || 15000,
      backoffFactor: config.backoffFactor || 2,
      timeout: config.timeout || 30000,
    };
  }

  canRecover(error: ServiceError): boolean {
    return [
      ERROR_CODES.DATABASE_ERROR,
      ERROR_CODES.DATABASE_CONNECTION_LOST,
      ERROR_CODES.QUERY_TIMEOUT,
    ].includes(error.code as any);
  }

  async recover(error: ServiceError): Promise<boolean> {
    console.log(`🔄 데이터베이스 복구 시도: ${error.message}`);

    // 1. 연결 풀 리셋 시도
    try {
      const resetResponse = await fetch('/api/database/reset-pool', {
        method: 'POST',
      });

      if (resetResponse.ok) {
        // 연결 테스트
        const testResponse = await fetch('/api/database/status');
        if (testResponse.ok) {
          console.log('✅ 데이터베이스 연결 풀 리셋 성공');
          return true;
        }
      }
    } catch (error) {
      console.warn('연결 풀 리셋 실패:', error);
    }

    // 2. 읽기 전용 모드로 폴백
    try {
      const fallbackResponse = await fetch('/api/database/readonly-mode', {
        method: 'POST',
      });

      if (fallbackResponse.ok) {
        console.log('⚠️ 읽기 전용 모드로 폴백');
        return true;
      }
    } catch (error) {
      console.warn('읽기 전용 모드 폴백 실패:', error);
    }

    console.error('❌ 데이터베이스 복구 실패');
    return false;
  }
}

export class WebSocketRecoveryStrategy implements RecoveryStrategy {
  private readonly config: RecoveryConfig;
  private reconnectAttempts = 0;

  constructor(config: Partial<RecoveryConfig> = {}) {
    this.config = {
      maxRetries: config.maxRetries || 5,
      baseDelay: config.baseDelay || 1000,
      maxDelay: config.maxDelay || 30000,
      backoffFactor: config.backoffFactor || 1.5,
      timeout: config.timeout || 10000,
    };
  }

  canRecover(error: ServiceError): boolean {
    return error.code === ERROR_CODES.WEBSOCKET_ERROR;
  }

  async recover(error: ServiceError): Promise<boolean> {
    console.log(`🔄 웹소켓 복구 시도: ${error.message}`);

    const result = await this.attemptReconnection();

    if (result.success) {
      await this.restoreSubscriptions();
      console.log('✅ 웹소켓 복구 완료');
      return true;
    } else {
      // 폴링 폴백 활성화
      await this.activatePollingFallback();
      console.log('⚠️ 웹소켓 복구 실패, 폴링 모드로 폴백');
      return true; // 폴백이므로 복구로 간주
    }
  }

  private async attemptReconnection(): Promise<{
    success: boolean;
    attempts: number;
  }> {
    this.reconnectAttempts = 0;

    while (this.reconnectAttempts < this.config.maxRetries) {
      this.reconnectAttempts++;

      try {
        const delay = Math.min(
          this.config.baseDelay *
            Math.pow(this.config.backoffFactor, this.reconnectAttempts - 1),
          this.config.maxDelay
        );

        if (this.reconnectAttempts > 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        const wsUrl = this.getWebSocketUrl();
        const connected = await this.testWebSocketConnection(wsUrl);

        if (connected) {
          return { success: true, attempts: this.reconnectAttempts };
        }
      } catch (error) {
        console.warn(
          `웹소켓 재연결 실패 (시도 ${this.reconnectAttempts}):`,
          error
        );
      }
    }

    return { success: false, attempts: this.reconnectAttempts };
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/websocket/servers`;
  }

  private async testWebSocketConnection(url: string): Promise<boolean> {
    return new Promise(resolve => {
      const ws = new WebSocket(url);
      const timeout = setTimeout(() => {
        ws.close();
        resolve(false);
      }, this.config.timeout);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve(true);
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        resolve(false);
      };
    });
  }

  private async restoreSubscriptions(): Promise<void> {
    const subscriptions = [
      'server-metrics',
      'alert-notifications',
      'system-health',
    ];

    try {
      const response = await fetch('/api/websocket/restore-subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptions }),
      });

      if (response.ok) {
        console.log('웹소켓 구독 복원 완료');
      }
    } catch (error) {
      console.warn('웹소켓 구독 복원 실패:', error);
    }
  }

  private async activatePollingFallback(): Promise<void> {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('polling_fallback_active', 'true');
      localStorage.setItem('polling_interval', '5000');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('activate-polling-fallback'));
    }
  }
}

export class SystemRecoveryStrategy implements RecoveryStrategy {
  canRecover(error: ServiceError): boolean {
    return [
      ERROR_CODES.MEMORY_EXHAUSTED,
      ERROR_CODES.DISK_FULL,
      ERROR_CODES.SYSTEM_OVERLOAD,
    ].includes(error.code as any);
  }

  async recover(error: ServiceError): Promise<boolean> {
    console.log(`🔄 시스템 복구 시도: ${error.message}`);

    switch (error.code) {
      case ERROR_CODES.MEMORY_EXHAUSTED:
        return await this.handleMemoryExhaustion();

      case ERROR_CODES.DISK_FULL:
        return await this.handleDiskSpaceFull();

      case ERROR_CODES.SYSTEM_OVERLOAD:
        return await this.handleSystemOverload();

      default:
        return false;
    }
  }

  private async handleMemoryExhaustion(): Promise<boolean> {
    try {
      // 메모리 정리 요청
      const response = await fetch('/api/system/cleanup-memory', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('✅ 메모리 정리 완료');
        return true;
      }
    } catch (error) {
      console.warn('메모리 정리 실패:', error);
    }

    return false;
  }

  private async handleDiskSpaceFull(): Promise<boolean> {
    try {
      // 임시 파일 정리
      const response = await fetch('/api/system/cleanup-disk', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('✅ 디스크 공간 정리 완료');
        return true;
      }
    } catch (error) {
      console.warn('디스크 정리 실패:', error);
    }

    return false;
  }

  private async handleSystemOverload(): Promise<boolean> {
    try {
      // 요청 제한 활성화
      const response = await fetch('/api/system/enable-throttling', {
        method: 'POST',
      });

      if (response.ok) {
        console.log('✅ 시스템 부하 제한 활성화');
        return true;
      }
    } catch (error) {
      console.warn('부하 제한 활성화 실패:', error);
    }

    return false;
  }
}

/**
 * 복구 전략 매니저
 */
export class RecoveryManager {
  private strategies: RecoveryStrategy[] = [];

  constructor() {
    this.strategies = [
      new NetworkRecoveryStrategy(),
      new DatabaseRecoveryStrategy(),
      new WebSocketRecoveryStrategy(),
      new SystemRecoveryStrategy(),
    ];
  }

  /**
   * 에러에 대한 복구 시도
   */
  async attemptRecovery(error: ServiceError): Promise<boolean> {
    for (const strategy of this.strategies) {
      if (strategy.canRecover(error)) {
        try {
          const recovered = await strategy.recover(error);
          if (recovered) {
            return true;
          }
        } catch (strategyError) {
          console.error('복구 전략 실행 실패:', strategyError);
        }
      }
    }

    return false;
  }

  /**
   * 커스텀 복구 전략 추가
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
  }

  /**
   * 복구 전략 제거
   */
  removeStrategy(strategy: RecoveryStrategy): void {
    const index = this.strategies.indexOf(strategy);
    if (index > -1) {
      this.strategies.splice(index, 1);
    }
  }
}
