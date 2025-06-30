/**
 * 🧪 TDD - SSE 최적화 테스트
 * 
 * @description
 * Test-Driven Development 방식으로 Server-Sent Events 
 * 최적화 기능을 테스트합니다.
 * 
 * @features 
 * - EventSource 최적화
 * - 실시간 데이터 스트리밍 개선
 * - 재연결 로직
 * - 메모리 누수 방지
 * - 에러 핸들링
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 테스트할 클래스들 (아직 구현되지 않음)
import { OptimizedSSEManager } from '@/services/sse/OptimizedSSEManager';
import { SSEConnectionPool } from '@/services/sse/SSEConnectionPool';
import { SSEHealthMonitor } from '@/services/sse/SSEHealthMonitor';

// Mock EventSource
class MockEventSource {
    public readyState: number = 0;
    public url: string;
    public withCredentials: boolean;
    public onopen: ((event: Event) => void) | null = null;
    public onmessage: ((event: MessageEvent) => void) | null = null;
    public onerror: ((event: Event) => void) | null = null;

    constructor(url: string, eventSourceInitDict?: EventSourceInit) {
        this.url = url;
        this.withCredentials = eventSourceInitDict?.withCredentials || false;
        setTimeout(() => {
            this.readyState = 1; // OPEN
            this.onopen?.(new Event('open'));
        }, 10);
    }

    close() {
        this.readyState = 2; // CLOSED
        // 즉시 error 이벤트 트리거하여 재연결 로직 테스트
        setTimeout(() => {
            if (this.onerror) {
                this.onerror(new Event('error'));
            }
        }, 1);
    }

    addEventListener(_type: string, _listener: EventListener) {
        // Mock implementation
    }

    removeEventListener(_type: string, _listener: EventListener) {
        // Mock implementation
    }

    dispatchEvent(_event: Event): boolean {
        return true;
    }
}

// Global EventSource mock
global.EventSource = MockEventSource as typeof EventSource;

describe('🧪 TDD - SSE 최적화', () => {
    let sseManager: OptimizedSSEManager;
    let connectionPool: SSEConnectionPool;
    let healthMonitor: SSEHealthMonitor;

    beforeEach(() => {
        vi.clearAllMocks();
        console.log('🧪 SSE 최적화 테스트 환경 초기화');
    });

    afterEach(() => {
        // 리소스 정리
        sseManager?.destroy();
        connectionPool?.destroy();
        healthMonitor?.destroy();
    });

    describe('🔴 Red Phase - OptimizedSSEManager', () => {
        describe('초기화 및 기본 기능', () => {
            it('SSE 매니저가 정상적으로 초기화되어야 함', () => {
                sseManager = new OptimizedSSEManager({
                    baseUrl: '/api/sse',
                    maxConnections: 5,
                    reconnectDelay: 1000,
                    heartbeatInterval: 30000,
                });

                expect(sseManager).toBeDefined();
                expect(sseManager.getStatus()).toEqual({
                    isConnected: false,
                    activeConnections: 0,
                    totalReconnects: 0,
                    lastHeartbeat: null,
                });
            });

            it('연결을 생성할 수 있어야 함', async () => {
                sseManager = new OptimizedSSEManager({
                    baseUrl: '/api/sse',
                });

                const connection = await sseManager.createConnection('test-channel');

                expect(connection).toBeDefined();
                expect(connection.channel).toBe('test-channel');

                // MockEventSource가 비동기로 readyState를 업데이트하므로 대기
                await new Promise(resolve => setTimeout(resolve, 20));
                expect(connection.readyState).toBe(1); // OPEN
            });

            it('여러 채널에 동시 연결할 수 있어야 함', async () => {
                sseManager = new OptimizedSSEManager({
                    maxConnections: 3,
                });

                const connections = await Promise.all([
                    sseManager.createConnection('channel-1'),
                    sseManager.createConnection('channel-2'),
                    sseManager.createConnection('channel-3'),
                ]);

                expect(connections).toHaveLength(3);
                expect(sseManager.getActiveConnectionCount()).toBe(3);
            });

            it('최대 연결 수를 초과하면 가장 오래된 연결을 종료해야 함', async () => {
                sseManager = new OptimizedSSEManager({
                    maxConnections: 2,
                });

                const conn1 = await sseManager.createConnection('channel-1');
                await new Promise(resolve => setTimeout(resolve, 10)); // 시간 차이 생성

                const conn2 = await sseManager.createConnection('channel-2');
                await new Promise(resolve => setTimeout(resolve, 10)); // 시간 차이 생성

                const conn3 = await sseManager.createConnection('channel-3');
                await new Promise(resolve => setTimeout(resolve, 20)); // 정리 처리 대기

                expect(conn1.readyState).toBe(2); // CLOSED
                expect(conn2.readyState).toBe(1); // OPEN  
                expect(conn3.readyState).toBe(1); // OPEN
                expect(sseManager.getActiveConnectionCount()).toBe(2);
            });
        });

        describe('재연결 로직', () => {
            it('연결이 끊어지면 자동으로 재연결해야 함', async () => {
                sseManager = new OptimizedSSEManager({
                    reconnectDelay: 100,
                    maxReconnectAttempts: 3,
                });

                const connection = await sseManager.createConnection('test-channel');
                const reconnectSpy = vi.spyOn(sseManager, 'reconnect');

                // 연결 강제 종료
                connection.close();

                // 재연결 시도 대기
                await new Promise(resolve => setTimeout(resolve, 150));

                expect(reconnectSpy).toHaveBeenCalled();
            });

            it('지수 백오프 재연결을 적용해야 함', async () => {
                sseManager = new OptimizedSSEManager({
                    reconnectDelay: 100,
                    maxReconnectAttempts: 3,
                    exponentialBackoff: true,
                });

                const delays = sseManager.getReconnectDelays();

                expect(delays).toEqual([100, 200, 400]); // 지수적 증가
            });

            it('최대 재연결 시도 후 포기해야 함', async () => {
                sseManager = new OptimizedSSEManager({
                    reconnectDelay: 50,
                    maxReconnectAttempts: 2,
                });

                const connection = await sseManager.createConnection('test-channel');
                const errorSpy = vi.fn();
                sseManager.on('maxReconnectReached', errorSpy);

                // 여러 번 연결 실패 시뮬레이션
                for (let i = 0; i < 3; i++) {
                    connection.close();
                    await new Promise(resolve => setTimeout(resolve, 60));
                }

                expect(errorSpy).toHaveBeenCalled();
            });
        });

        describe('메모리 누수 방지', () => {
            it('연결 종료 시 이벤트 리스너를 정리해야 함', async () => {
                sseManager = new OptimizedSSEManager();

                const connection = await sseManager.createConnection('test-channel');
                const removeEventListenerSpy = vi.spyOn(connection, 'removeEventListener');

                sseManager.closeConnection('test-channel');

                expect(removeEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));
                expect(removeEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
                expect(removeEventListenerSpy).toHaveBeenCalledWith('open', expect.any(Function));
            });

            it('destroy 호출 시 모든 리소스를 정리해야 함', async () => {
                sseManager = new OptimizedSSEManager();

                await sseManager.createConnection('channel-1');
                await sseManager.createConnection('channel-2');

                expect(sseManager.getActiveConnectionCount()).toBe(2);

                sseManager.destroy();

                expect(sseManager.getActiveConnectionCount()).toBe(0);
                expect(sseManager.getStatus().isConnected).toBe(false);
            });
        });

        describe('하트비트 및 건강 모니터링', () => {
            it('하트비트 메시지를 주기적으로 전송해야 함', async () => {
                sseManager = new OptimizedSSEManager({
                    heartbeatInterval: 100,
                });

                const heartbeatSpy = vi.fn();
                sseManager.on('heartbeat', heartbeatSpy);

                await sseManager.createConnection('test-channel');

                await new Promise(resolve => setTimeout(resolve, 250));

                expect(heartbeatSpy).toHaveBeenCalledTimes(2);
            });

            it('하트비트 실패 시 연결 상태를 업데이트해야 함', async () => {
                sseManager = new OptimizedSSEManager({
                    heartbeatInterval: 50,
                    heartbeatTimeout: 30,
                });

                await sseManager.createConnection('test-channel');

                // 하트비트 응답 지연 시뮬레이션
                vi.spyOn(sseManager, 'sendHeartbeat').mockImplementation(() =>
                    new Promise(resolve => setTimeout(resolve, 100))
                );

                await new Promise(resolve => setTimeout(resolve, 100));

                expect(sseManager.getStatus().lastHeartbeat).toBeDefined();
                expect(sseManager.isHealthy()).toBe(false);
            });
        });
    });

    describe('🔴 Red Phase - SSEConnectionPool', () => {
        describe('연결 풀 관리', () => {
            it('연결 풀이 정상적으로 초기화되어야 함', () => {
                connectionPool = new SSEConnectionPool({
                    maxPoolSize: 10,
                    idleTimeout: 30000,
                    cleanupInterval: 5000,
                });

                expect(connectionPool).toBeDefined();
                expect(connectionPool.getPoolSize()).toBe(0);
                expect(connectionPool.getActiveCount()).toBe(0);
            });

            it('연결을 풀에서 가져올 수 있어야 함', async () => {
                connectionPool = new SSEConnectionPool();

                const connection = await connectionPool.acquire('test-url');

                expect(connection).toBeDefined();
                expect(connectionPool.getActiveCount()).toBe(1);
            });

            it('연결을 풀에 반환할 수 있어야 함', async () => {
                connectionPool = new SSEConnectionPool();

                const connection = await connectionPool.acquire('test-url');
                connectionPool.release(connection);

                expect(connectionPool.getActiveCount()).toBe(0);
                expect(connectionPool.getPoolSize()).toBe(1);
            });

            it('유휴 연결을 자동으로 정리해야 함', async () => {
                connectionPool = new SSEConnectionPool({
                    idleTimeout: 100,
                    cleanupInterval: 50,
                });

                const connection = await connectionPool.acquire('test-url');
                connectionPool.release(connection);

                expect(connectionPool.getPoolSize()).toBe(1);

                await new Promise(resolve => setTimeout(resolve, 150));

                expect(connectionPool.getPoolSize()).toBe(0);
            });
        });
    });

    describe('🔴 Red Phase - SSEHealthMonitor', () => {
        describe('건강 상태 모니터링', () => {
            it('헬스 모니터가 정상적으로 초기화되어야 함', () => {
                healthMonitor = new SSEHealthMonitor({
                    checkInterval: 1000,
                    timeoutThreshold: 5000,
                    errorThreshold: 3,
                });

                expect(healthMonitor).toBeDefined();
                expect(healthMonitor.getHealthStatus()).toEqual({
                    isHealthy: true,
                    lastCheck: expect.any(Date),
                    errorCount: 0,
                    consecutiveErrors: 0,
                    uptime: 0,
                });
            });

            it('연결 상태를 주기적으로 확인해야 함', async () => {
                healthMonitor = new SSEHealthMonitor({
                    checkInterval: 50,
                });

                const checkSpy = vi.spyOn(healthMonitor, 'performHealthCheck');

                healthMonitor.startMonitoring();

                await new Promise(resolve => setTimeout(resolve, 120));

                expect(checkSpy).toHaveBeenCalledTimes(2);
            });

            it('오류 임계치 초과 시 비건강 상태로 마크해야 함', () => {
                healthMonitor = new SSEHealthMonitor({
                    errorThreshold: 2,
                });

                healthMonitor.recordError('Connection failed');
                healthMonitor.recordError('Timeout occurred');
                healthMonitor.recordError('Network error');

                const status = healthMonitor.getHealthStatus();
                expect(status.isHealthy).toBe(false);
                expect(status.errorCount).toBe(3);
            });

            it('연속 오류 수를 추적해야 함', () => {
                healthMonitor = new SSEHealthMonitor();

                healthMonitor.recordError('Error 1');
                healthMonitor.recordError('Error 2');
                healthMonitor.recordSuccess();
                healthMonitor.recordError('Error 3');

                const status = healthMonitor.getHealthStatus();
                expect(status.consecutiveErrors).toBe(1); // 성공 후 다시 시작
            });
        });
    });

    describe('🔴 Red Phase - 통합 테스트', () => {
        it('매니저, 풀, 모니터가 함께 작동해야 함', async () => {
            connectionPool = new SSEConnectionPool();
            healthMonitor = new SSEHealthMonitor();

            sseManager = new OptimizedSSEManager({
                connectionPool,
                healthMonitor,
            });

            const connection = await sseManager.createConnection('test-channel');

            expect(connection).toBeDefined();
            expect(connectionPool.getActiveCount()).toBe(1);
            expect(healthMonitor.getHealthStatus().isHealthy).toBe(true);
        });

        it('실제 SSE 스트림 데이터를 처리할 수 있어야 함', async () => {
            sseManager = new OptimizedSSEManager();

            const messages: any[] = [];
            const connection = await sseManager.createConnection('data-stream');

            sseManager.on('message', (data) => {
                messages.push(data);
            });

            // 메시지 시뮬레이션
            const mockMessage = new MessageEvent('message', {
                data: JSON.stringify({ type: 'server-update', payload: { cpu: 45 } }),
            });

            connection.onmessage?.(mockMessage);

            expect(messages).toHaveLength(1);
            expect(messages[0]).toEqual({
                type: 'server-update',
                payload: { cpu: 45 },
            });
        });
    });
}); 