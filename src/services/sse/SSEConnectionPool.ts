/**
 * 🟢 TDD Green - SSE 연결 풀
 * 
 * @description
 * 테스트를 통과하는 최소한의 SSE 연결 풀 관리자
 * 연결 재사용과 리소스 최적화를 담당합니다.
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

export class SSEConnectionPool {
    private config: Required<SSEConnectionPoolConfig>;
    private pool = new Map<string, PooledConnection>();
    private activeConnections = new Set<string>();
    private cleanupInterval?: NodeJS.Timeout;

    constructor(config: SSEConnectionPoolConfig = {}) {
        this.config = {
            maxPoolSize: config.maxPoolSize || 10,
            idleTimeout: config.idleTimeout || 30000,
            cleanupInterval: config.cleanupInterval || 5000,
        };

        this.startCleanupTimer();
    }

    /**
     * 🔌 연결 획득
     */
    async acquire(url: string): Promise<PooledConnection> {
        // 기존 연결 찾기
        const existingConnection = this.findAvailableConnection(url);
        if (existingConnection) {
            this.markAsActive(existingConnection.id);
            return existingConnection;
        }

        // 새 연결 생성
        const connection = new EventSource(url) as PooledConnection;
        connection.id = this.generateId();
        connection.createdAt = new Date();
        connection.lastUsed = new Date();
        connection.isActive = true;

        this.pool.set(connection.id, connection);
        this.activeConnections.add(connection.id);

        return connection;
    }

    /**
     * 🔄 연결 반환
     */
    release(connection: PooledConnection): void {
        connection.lastUsed = new Date();
        connection.isActive = false;
        this.activeConnections.delete(connection.id);
    }

    /**
     * 📊 풀 크기 조회
     */
    getPoolSize(): number {
        return this.pool.size;
    }

    /**
     * 📈 활성 연결 수 조회
     */
    getActiveCount(): number {
        return this.activeConnections.size;
    }

    /**
     * 🗑️ 리소스 정리
     */
    destroy(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        for (const connection of this.pool.values()) {
            connection.close();
        }

        this.pool.clear();
        this.activeConnections.clear();
    }

    /**
     * 🔍 사용 가능한 연결 찾기
     */
    private findAvailableConnection(url: string): PooledConnection | null {
        for (const connection of this.pool.values()) {
            if (!connection.isActive && connection.url === url) {
                return connection;
            }
        }
        return null;
    }

    /**
     * ✅ 활성 상태로 마킹
     */
    private markAsActive(connectionId: string): void {
        const connection = this.pool.get(connectionId);
        if (connection) {
            connection.isActive = true;
            connection.lastUsed = new Date();
            this.activeConnections.add(connectionId);
        }
    }

    /**
     * 🆔 고유 ID 생성
     */
    private generateId(): string {
        return `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 🗑️ 유휴 연결 정리 타이머 시작
     */
    private startCleanupTimer(): void {
        this.cleanupInterval = setInterval(() => {
            this.cleanupIdleConnections();
        }, this.config.cleanupInterval);
    }

    /**
     * 🗑️ 유휴 연결 정리
     */
    private cleanupIdleConnections(): void {
        const now = Date.now();
        const toRemove: string[] = [];

        for (const [id, connection] of this.pool) {
            if (!connection.isActive) {
                const idleTime = now - connection.lastUsed.getTime();
                if (idleTime > this.config.idleTimeout) {
                    toRemove.push(id);
                }
            }
        }

        for (const id of toRemove) {
            const connection = this.pool.get(id);
            if (connection) {
                connection.close();
                this.pool.delete(id);
                this.activeConnections.delete(id);
            }
        }

        if (toRemove.length > 0) {
            console.log(`🗑️ 유휴 SSE 연결 ${toRemove.length}개 정리 완료`);
        }
    }
} 