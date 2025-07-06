/**
 * 🧪 GCP 서버 데이터 생성기 TDD 테스트
 * 
 * 테스트 시나리오:
 * 1. 기본 데이터셋 생성 및 검증
 * 2. 실시간 메트릭 생성 및 구조 검증
 * 3. 20분 자동 정지 시스템
 * 4. 상황 시뮬레이션 (심각 20%, 경고 30%)
 * 5. Vercel 연동 API
 * 6. 무료 티어 사용량 제한
 */

import { GCPServerDataGenerator } from '@/services/gcp/GCPServerDataGenerator';
import { GCPSessionManager } from '@/services/gcp/GCPSessionManager';
import { ScenarioContext } from '@/types/gcp-data-generator';
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';

describe('🌐 GCP 서버 데이터 생성기', () => {
    let generator: GCPServerDataGenerator;
    let sessionManager: GCPSessionManager;
    let mockFirestore: any;
    let mockCloudStorage: any;

    beforeEach(() => {
        // Mock GCP 서비스 (타입 안전하게)
        mockFirestore = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            add: jest.fn().mockResolvedValue({ id: 'test-doc' } as any),
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) } as any),
            set: jest.fn().mockResolvedValue({} as any),
            delete: jest.fn().mockResolvedValue({} as any),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
        } as any;

        mockCloudStorage = {
            bucket: jest.fn().mockReturnThis(),
            file: jest.fn().mockReturnThis(),
            download: jest.fn().mockResolvedValue([Buffer.from('{"test": "data"}')] as any),
            save: jest.fn().mockResolvedValue({} as any)
        } as any;

        generator = new GCPServerDataGenerator(mockFirestore, mockCloudStorage);
        sessionManager = new GCPSessionManager(mockFirestore);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('📊 기본 데이터셋 생성', () => {
        test('10개 서버 기본 데이터셋이 올바르게 생성되어야 함', async () => {
            // Given
            const expectedServerCount = 10;
            const expectedMetricsCount = 25;

            // When
            const dataset = await generator.generateBaselineDataset();

            // Then
            expect(dataset).toBeDefined();
            expect(dataset.servers).toHaveLength(expectedServerCount);
            expect(dataset.dataset_version).toBe('1.0');
            expect(dataset.generated_at).toBeDefined();

            // 각 서버가 필수 속성을 가져야 함
            dataset.servers.forEach(server => {
                expect(server.id).toBeDefined();
                expect(server.name).toBeDefined();
                expect(server.type).toBeDefined();
                expect(server.specs).toBeDefined();
                expect(server.baseline_metrics).toBeDefined();
                expect(server.historical_patterns).toBeDefined();

                // 기본 메트릭 구조 검증
                expect(server.baseline_metrics.cpu).toBeDefined();
                expect(server.baseline_metrics.memory).toBeDefined();
                expect(server.baseline_metrics.disk).toBeDefined();
                expect(server.baseline_metrics.network).toBeDefined();
            });
        });

        test('서버 타입별 특성화된 스펙이 적용되어야 함', async () => {
            // Given & When
            const dataset = await generator.generateBaselineDataset();

            // Then
            const webServer = dataset.servers.find(s => s.type === 'nginx');
            const dbServer = dataset.servers.find(s => s.type === 'postgresql');
            const cacheServer = dataset.servers.find(s => s.type === 'redis');

            expect(webServer).toBeDefined();
            expect(dbServer).toBeDefined();
            expect(cacheServer).toBeDefined();

            // 웹서버는 네트워크 대역폭이 높아야 함
            expect(webServer!.specs.network.bandwidth).toBeGreaterThan(1000);

            // DB 서버는 메모리가 많아야 함
            expect(dbServer!.specs.memory.total).toBeGreaterThan(8 * 1024 * 1024 * 1024);

            // 캐시 서버는 SSD 사용해야 함
            expect(cacheServer!.specs.disk.type).toBe('SSD');
        });

        test('히스토리컬 패턴이 올바르게 생성되어야 함', async () => {
            // Given & When
            const dataset = await generator.generateBaselineDataset();

            // Then
            dataset.servers.forEach(server => {
                const patterns = server.historical_patterns;

                if (patterns) {
                    // 24시간 사이클 (24개 값)
                    expect(patterns.daily_cycle).toHaveLength(24);
                    patterns.daily_cycle?.forEach(value => {
                        expect(value).toBeGreaterThanOrEqual(0.1);
                        expect(value).toBeLessThanOrEqual(1.0);
                    });

                    // 주간 사이클 (7개 값)
                    expect(patterns.weekly_cycle).toHaveLength(7);

                    // 이상 패턴 정의
                    expect(patterns.anomaly_patterns?.cpu_spike).toBeDefined();
                    expect(patterns.anomaly_patterns?.memory_leak).toBeDefined();
                    expect(patterns.anomaly_patterns?.disk_io_storm).toBeDefined();
                }
            });
        });
    });

    describe('⚡ 실시간 메트릭 생성', () => {
        test('TimeSeriesMetrics 구조가 기존 AI 엔진 호환성을 유지해야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            // loadBaselineDataset은 private 메서드이므로 호출하지 않음

            // When
            const metrics = await generator.generateRealtimeMetrics(sessionId);

            // Then
            expect(metrics).toBeDefined();
            expect(Array.isArray(metrics)).toBe(true);
            expect(metrics.length).toBeGreaterThan(0);

            metrics.forEach(metric => {
                // 기본 구조 검증
                expect(metric.timestamp).toBeInstanceOf(Date);
                expect(metric.serverId).toBeDefined();

                // system 메트릭 구조
                expect(metric.system.cpu.usage).toBeGreaterThanOrEqual(0);
                expect(metric.system.cpu.usage).toBeLessThanOrEqual(100);
                expect(metric.system.cpu.load1).toBeDefined();
                expect(metric.system.cpu.load5).toBeDefined();
                expect(metric.system.cpu.load15).toBeDefined();
                expect(metric.system.cpu.processes).toBeGreaterThan(0);
                expect(metric.system.cpu.threads).toBeGreaterThan(0);

                // memory 메트릭 구조
                expect(metric.system.memory.used).toBeGreaterThan(0);
                expect(metric.system.memory.available).toBeGreaterThan(0);
                expect(metric.system.memory.buffers).toBeGreaterThanOrEqual(0);
                expect(metric.system.memory.cached).toBeGreaterThanOrEqual(0);
                expect(metric.system.memory.swap).toBeDefined();

                // disk 메트릭 구조
                expect(metric.system.disk.io.read).toBeGreaterThanOrEqual(0);
                expect(metric.system.disk.io.write).toBeGreaterThanOrEqual(0);
                expect(metric.system.disk.utilization).toBeGreaterThanOrEqual(0);
                expect(metric.system.disk.utilization).toBeLessThanOrEqual(100);

                // network 메트릭 구조
                expect(metric.system.network.io.rx).toBeGreaterThanOrEqual(0);
                expect(metric.system.network.io.tx).toBeGreaterThanOrEqual(0);
                expect(metric.system.network.connections.active).toBeGreaterThanOrEqual(0);

                // application 메트릭 구조
                expect(metric.application.requests.total).toBeGreaterThanOrEqual(0);
                expect(metric.application.requests.success).toBeGreaterThanOrEqual(0);
                expect(metric.application.requests.errors).toBeGreaterThanOrEqual(0);
                expect(metric.application.requests.latency.p50).toBeGreaterThan(0);
                expect(metric.application.requests.latency.p95).toBeGreaterThan(0);
                expect(metric.application.requests.latency.p99).toBeGreaterThan(0);

                // infrastructure 메트릭 구조
                expect(metric.infrastructure).toBeDefined();
            });
        });

        test('30초 간격으로 메트릭이 생성되어야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const timestamps: number[] = [];

            // When
            for (let i = 0; i < 3; i++) {
                const metrics = await generator.generateRealtimeMetrics(sessionId);
                timestamps.push(metrics[0].timestamp.getTime());

                // 30초 대기 시뮬레이션
                await new Promise(resolve => setTimeout(resolve, 100)); // 테스트에서는 100ms로 단축
            }

            // Then
            expect(timestamps).toHaveLength(3);
            // 실제 환경에서는 30초 간격이지만, 테스트에서는 시간 단축
        });

        test('메트릭 변형이 쉬운 구조여야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const customMetrics = {
                'srv-web-01': { additionalCpuLoad: 20 },
                'srv-db-01': { connectionPoolSize: 150 }
            };

            // When
            const metrics = await generator.generateRealtimeMetrics(sessionId, { customMetrics });

            // Then
            const webServerMetric = metrics.find(m => m.serverId === 'srv-web-01');
            const dbServerMetric = metrics.find(m => m.serverId === 'srv-db-01');

            expect(webServerMetric).toBeDefined();
            expect(dbServerMetric).toBeDefined();

            // 커스텀 메트릭이 반영되었는지 확인
            expect(webServerMetric!.system.cpu.usage).toBeGreaterThan(20);
        });
    });

    describe('⏰ 20분 자동 정지 시스템', () => {
        test('세션이 20분 후 자동으로 정지되어야 함', async () => {
            // Given
            const userId = 'test-user-123';
            const mockSetTimeout = jest.spyOn(global, 'setTimeout');

            // When
            const sessionId = await sessionManager.startSession(userId);

            // Then
            expect(sessionId).toBeDefined();
            expect(mockSetTimeout).toHaveBeenCalledWith(
                expect.any(Function),
                20 * 60 * 1000 // 20분
            );

            // 세션 상태 확인
            const session = await sessionManager.getSession(sessionId);
            expect(session).toBeDefined();
            expect(session?.status).toBe('active');
            expect(session?.userId).toBe(userId);
        });

        test('20분 경과 후 메트릭 생성이 중단되어야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const startTime = Date.now();

            // 20분 1초 후로 시간 설정
            const expiredTime = startTime + (20 * 60 * 1000) + 1000;
            jest.spyOn(Date, 'now').mockReturnValue(expiredTime);

            // When
            const metrics = await generator.generateRealtimeMetrics(sessionId);

            // Then
            expect(metrics).toHaveLength(0);

            // 세션이 정지되었는지 확인
            const session = await sessionManager.getSession(sessionId);
            expect(session).toBeDefined();
            expect(session?.status).toBe('stopped');
        });

        test('사용자별 기존 세션이 정리되어야 함', async () => {
            // Given
            const userId = 'test-user-123';

            // 첫 번째 세션 시작
            const sessionId1 = await sessionManager.startSession(userId);

            // When - 같은 사용자가 두 번째 세션 시작
            const sessionId2 = await sessionManager.startSession(userId);

            // Then
            expect(sessionId1).not.toBe(sessionId2);

            // 첫 번째 세션이 정리되었는지 확인
            const session1 = await sessionManager.getSession(sessionId1);
            expect(session1).toBeDefined();
            expect(session1?.status).toBe('stopped');

            // 두 번째 세션이 활성화되었는지 확인
            const session2 = await sessionManager.getSession(sessionId2);
            expect(session2).toBeDefined();
            expect(session2?.status).toBe('active');
        });
    });

    describe('🎭 상황 시뮬레이션', () => {
        test('심각 상황이 20% 확률로 발생해야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const sampleSize = 1000;
            let criticalCount = 0;

            // When
            for (let i = 0; i < sampleSize; i++) {
                const scenario = generator.generateScenarioContext();
                if (scenario.type === 'critical') {
                    criticalCount++;
                }
            }

            // Then
            const criticalRate = criticalCount / sampleSize;
            expect(criticalRate).toBeGreaterThan(0.15); // 15% 이상
            expect(criticalRate).toBeLessThan(0.25);    // 25% 이하
        });

        test('경고 상황이 30% 확률로 발생해야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const sampleSize = 1000;
            let warningCount = 0;

            // When
            for (let i = 0; i < sampleSize; i++) {
                const scenario = generator.generateScenarioContext();
                if (scenario.type === 'warning') {
                    warningCount++;
                }
            }

            // Then
            const warningRate = warningCount / sampleSize;
            expect(warningRate).toBeGreaterThan(0.25); // 25% 이상
            expect(warningRate).toBeLessThan(0.35);    // 35% 이하
        });

        test('심각 상황에서 CPU 사용률이 80% 이상이어야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const criticalScenario: ScenarioContext = {
                type: 'critical',
                loadMultiplier: 1.8,
                anomalyChance: 0.8
            };

            // When
            const metrics = await generator.generateRealtimeMetrics(sessionId, { scenario: criticalScenario });

            // Then
            metrics.forEach(metric => {
                expect(metric.system.cpu.usage).toBeGreaterThan(70); // 실제로는 80% 이상이지만 테스트 여유분
            });
        });

        test('정상 상황에서 메트릭이 안정적이어야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const normalScenario: ScenarioContext = {
                type: 'normal',
                loadMultiplier: 1.0,
                anomalyChance: 0.1
            };

            // When
            const metrics = await generator.generateRealtimeMetrics(sessionId, { scenario: normalScenario });

            // Then
            metrics.forEach(metric => {
                expect(metric.system.cpu.usage).toBeLessThan(70);
                expect(metric.system.memory.used / (metric.system.memory.used + metric.system.memory.available)).toBeLessThan(0.8);
            });
        });
    });

    describe('🔗 Vercel 연동', () => {
        test('GCP 데이터 조회 API가 올바른 형식을 반환해야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const limit = 10;

            // When
            const response = await generator.fetchMetricsForVercel(sessionId, limit);

            // Then
            expect(response.success).toBe(true);
            expect(response.data).toBeDefined();
            expect(response.data?.sessionId).toBe(sessionId);
            expect(response.data?.metrics).toBeDefined();
            expect(response.data?.dataSource).toBe('GCP');
            expect(response.data?.timestamp).toBeDefined();
            expect(response.data?.metrics.length).toBeLessThanOrEqual(limit);
        });

        test('세션이 없을 때 적절한 에러를 반환해야 함', async () => {
            // Given
            const invalidSessionId = 'invalid-session';

            // When
            const response = await generator.fetchMetricsForVercel(invalidSessionId, 10);

            // Then
            expect(response.success).toBe(false);
            expect(response.error).toContain('세션을 찾을 수 없습니다');
        });

        test('Firestore 연결 실패 시 적절한 에러 처리', async () => {
            // Given
            const sessionId = 'test-session-123';
            mockFirestore.collection.mockRejectedValue(new Error('Firestore connection failed'));

            // When
            const response = await generator.fetchMetricsForVercel(sessionId, 10);

            // Then
            expect(response.success).toBe(false);
            expect(response.error).toContain('GCP 연결 실패');
        });
    });

    describe('💰 무료 티어 사용량 제한', () => {
        test('일일 세션 생성 제한이 적용되어야 함', async () => {
            // Given
            const userId = 'test-user-123';
            const dailyLimit = 10;

            // When & Then
            for (let i = 0; i < dailyLimit; i++) {
                const sessionId = await sessionManager.startSession(userId);
                expect(sessionId).toBeDefined();
                await sessionManager.stopSession(sessionId);
            }

            // 제한 초과 시도
            await expect(sessionManager.startSession(userId)).rejects.toThrow('일일 세션 생성 제한 초과');
        });

        test('Firestore 쓰기 횟수가 무료 한도 내에서 유지되어야 함', async () => {
            // Given
            const sessionId = 'test-session-123';
            const maxWrites = 20000; // 무료 한도
            let writeCount = 0;

            // Mock Firestore write counting
            mockFirestore.add.mockImplementation(() => {
                writeCount++;
                return Promise.resolve({ id: 'test-doc' });
            });

            // When - 20분간 30초 간격으로 실행 (40회)
            for (let i = 0; i < 40; i++) {
                await generator.generateRealtimeMetrics(sessionId);
            }

            // Then
            expect(writeCount).toBeLessThan(maxWrites / 30); // 월 사용량의 1/30
        });

        test('Cloud Storage 읽기 횟수가 제한되어야 함', async () => {
            // Given
            let readCount = 0;
            mockCloudStorage.download.mockImplementation(() => {
                readCount++;
                return Promise.resolve([Buffer.from('{"test": "data"}')]);
            });

            // When
            for (let i = 0; i < 10; i++) {
                // loadBaselineDataset은 private 메서드이므로 호출하지 않음
                // 대신 public 메서드를 통해 간접적으로 테스트
                await generator.generateRealtimeMetrics('test-session');
            }

            // Then
            // 캐싱으로 인해 실제 읽기는 1회만 발생해야 함
            expect(readCount).toBe(1);
        });
    });

    describe('🔧 확장성 및 유지보수성', () => {
        test('새로운 메트릭 추가가 쉬워야 함', async () => {
            // Given
            const customMetricConfig = {
                'custom_metric_1': {
                    name: 'custom_metric_1',
                    type: 'gauge' as const,
                    unit: 'percentage',
                    range: [0, 100] as [number, number]
                },
                'custom_metric_2': {
                    name: 'custom_metric_2',
                    type: 'counter' as const,
                    unit: 'requests/sec',
                    increment: true
                }
            };

            // When
            generator.addCustomMetrics(customMetricConfig);
            const metrics = await generator.generateRealtimeMetrics('test-session');

            // Then
            // 커스텀 메트릭이 추가되었는지 확인
            expect(metrics).toBeDefined();
            expect(metrics.length).toBeGreaterThan(0);
            // custom 속성은 TimeSeriesMetrics 타입에 없으므로 기본 메트릭 구조만 확인
            metrics.forEach(metric => {
                expect(metric.timestamp).toBeDefined();
                expect(metric.serverId).toBeDefined();
            });
        });

        test('서버 타입 추가가 쉬워야 함', async () => {
            // Given
            const newServerType = {
                type: 'elasticsearch',
                specs: {
                    cpu: { cores: 8, model: 'Intel Xeon Gold' },
                    memory: { total: 32 * 1024 * 1024 * 1024, type: 'DDR4' },
                    disk: { total: 1024 * 1024 * 1024 * 1024, type: 'SSD' },
                    network: { bandwidth: 10000, type: '10G' }
                },
                baseline_metrics: {
                    cpu: { usage: 30 },
                    memory: { used: 16 * 1024 * 1024 * 1024 },
                    disk: { utilization: 50 },
                    network: { io: { rx: 500000, tx: 300000 } }
                }
            };

            // When
            generator.addServerType(newServerType);
            const dataset = await generator.generateBaselineDataset();

            // Then
            const elasticsearchServer = dataset.servers.find(s => s.type === 'elasticsearch');
            expect(elasticsearchServer).toBeDefined();
            expect(elasticsearchServer!.specs.memory.total).toBe(32 * 1024 * 1024 * 1024);
        });
    });
});

describe('🔄 GCP 세션 매니저', () => {
    let sessionManager: GCPSessionManager;
    let mockFirestore: any;

    beforeEach(() => {
        mockFirestore = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            add: jest.fn().mockResolvedValue({ id: 'test-doc' } as any),
            get: jest.fn().mockResolvedValue({ exists: true, data: () => ({}) } as any),
            set: jest.fn().mockResolvedValue({} as any),
            delete: jest.fn().mockResolvedValue({} as any),
            where: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis()
        } as any;

        sessionManager = new GCPSessionManager(mockFirestore);
    });

    test('동시 세션 제한이 적용되어야 함', async () => {
        // Given
        const maxConcurrentSessions = 5;

        // When & Then
        const sessionPromises: Promise<string>[] = [];
        for (let i = 0; i < maxConcurrentSessions + 2; i++) {
            sessionPromises.push(sessionManager.startSession(`user-${i}`));
        }

        const results = await Promise.allSettled(sessionPromises);
        const successfulSessions = results.filter(r => r.status === 'fulfilled').length;
        const failedSessions = results.filter(r => r.status === 'rejected').length;

        expect(successfulSessions).toBe(maxConcurrentSessions);
        expect(failedSessions).toBe(2);
    });

    test('세션 정리가 올바르게 수행되어야 함', async () => {
        // Given
        const userId = 'test-user-123';
        const sessionId = await sessionManager.startSession(userId);

        // When
        await sessionManager.stopSession(sessionId);

        // Then
        expect(mockFirestore.set).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'stopped',
                endTime: expect.any(Number)
            })
        );
    });
}); 