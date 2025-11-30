/**
 * 🚫 서버리스 호환: SSE 연결 풀 비활성화
 *
 * @description
 * 서버리스 환경에서는 지속적 연결이 불가능하므로
 * SSE 연결 풀 기능을 비활성화하고 Vercel 플랫폼 모니터링 사용 권장
 */

export interface SSEConnectionPoolConfig {
  maxPoolSize?: number;
  idleTimeout?: number;
  cleanupInterval?: number;
}

export interface PooledConnection extends EventSource {
  id: string;
  createdAt: Date;
  lastUsed: Date;
  isActive: boolean;
}

export class ServerlessSSEConnectionPool {
  // private config: Required<SSEConnectionPoolConfig>;

  constructor(_config: SSEConnectionPoolConfig = {}) {
    // this.config = {
    //   maxPoolSize: config.maxPoolSize || 10,
    //   idleTimeout: config.idleTimeout || 30000,
    //   cleanupInterval: config.cleanupInterval || 5000,
    // };

    console.warn('⚠️ SSE 연결 풀 비활성화 - 서버리스에서는 지속적 연결 불가');
    console.warn('📊 Vercel Dashboard: https://vercel.com/dashboard');
  }

  /**
   * 🚫 연결 획득 비활성화
   */
  async acquire(_url: string): Promise<PooledConnection | null> {
    console.warn('⚠️ SSE 연결 획득 무시됨 - 서버리스 환경');
    console.warn('📊 Vercel 실시간 모니터링 사용 권장');
    return null;
  }

  /**
   * 🚫 연결 반환 비활성화
   */
  release(_connection: PooledConnection): void {
    console.warn('⚠️ SSE 연결 반환 무시됨 - 서버리스 환경');
  }

  /**
   * 📊 풀 크기 조회 (항상 0)
   */
  getPoolSize(): number {
    return 0;
  }

  /**
   * 📈 활성 연결 수 조회 (항상 0)
   */
  getActiveCount(): number {
    return 0;
  }

  /**
   * 🚫 리소스 정리 비활성화
   */
  destroy(): void {
    console.warn('⚠️ SSE 리소스 정리 무시됨 - 서버리스에서는 자동 정리');
  }
}

/**
 * 🔧 서버리스 호환 팩토리 함수
 */
export function createSSEConnectionPool(
  config?: SSEConnectionPoolConfig
): ServerlessSSEConnectionPool {
  return new ServerlessSSEConnectionPool(config);
}

/**
 * 🚫 레거시 호환성 (사용 금지)
 * @deprecated 서버리스 환경에서는 createSSEConnectionPool() 사용
 */
export const SSEConnectionPool = ServerlessSSEConnectionPool;
