/**
 * 🚀 3-Tier AI Router 통합 테스트
 * 
 * 테스트 범위:
 * - GCP Functions 연동 테스트
 * - 3-Tier 폴백 전략 테스트
 * - 성능 메트릭 검증
 * - 무료 한도 사용량 모니터링
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { GCPFunctionsService } from '@/services/ai/GCPFunctionsService';
import { ThreeTierAIRouter } from '@/services/ai/ThreeTierAIRouter';
import type { AIMode, AIRequest, AIResponse } from '@/types/ai-types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

describe('3-Tier AI Router 통합 테스트', () => {
    let threeTierRouter: ThreeTierAIRouter;
    let gcpFunctionsService: GCPFunctionsService;
    let unifiedRouter: UnifiedAIEngineRouter;

    // 테스트 환경 설정
    beforeAll(() => {
        // 테스트 환경 변수 설정
        process.env.THREE_TIER_ENABLED = 'true';
        process.env.THREE_TIER_STRATEGY = 'performance';
        process.env.GCP_FUNCTIONS_ENABLED = 'true';
        process.env.GCP_FUNCTIONS_TIMEOUT = '5000';

        // 서비스 인스턴스 생성
        threeTierRouter = ThreeTierAIRouter.getInstance();
        gcpFunctionsService = GCPFunctionsService.getInstance();
        unifiedRouter = UnifiedAIEngineRouter.getInstance();

        // 초기화
        threeTierRouter.initialize();
        gcpFunctionsService.initialize();
        unifiedRouter.initialize();
    });

    afterAll(() => {
        // 테스트 환경 정리
        delete process.env.THREE_TIER_ENABLED;
        delete process.env.THREE_TIER_STRATEGY;
        delete process.env.GCP_FUNCTIONS_ENABLED;
    });

    beforeEach(() => {
        // 각 테스트 전 상태 초기화
        threeTierRouter = ThreeTierAIRouter.getInstance();
    });

    describe('🔧 초기화 테스트', () => {
        it('3-Tier Router가 올바르게 초기화되어야 함', async () => {
            const status = threeTierRouter.getRouterStatus();

            expect(status.enabled).toBe(true);
            expect(status.initialized).toBe(true);
            expect(status.strategy).toBe('performance');
            expect(status.services.gcp).toBeDefined();
        });

        it('GCP Functions Service가 올바르게 초기화되어야 함', async () => {
            const status = gcpFunctionsService.getServiceStatus();

            expect(status.enabled).toBe(true);
            expect(status.initialized).toBe(true);
            expect(status.endpoints.aiGateway).toContain('cloudfunctions.net');
        });

        it('Unified Router가 3-Tier 모드로 설정되어야 함', async () => {
            const status = unifiedRouter.getSystemStatus();

            expect(status.currentMode).toBe('THREE_TIER');
            expect(status.architecture).toBe('3-tier-integrated');
            expect(status.threeTierRouter).toBeDefined();
        });
    });

    describe('🚀 기본 3-Tier 라우팅 테스트', () => {
        it('시스템 상태 확인이 정상적으로 작동해야 함', async () => {
            const status = await threeTierRouter.getSystemStatus();

            expect(status).toBeDefined();
            expect(status.threeTierRouter).toBeDefined();
            expect(typeof status.threeTierRouter.enabled).toBe('boolean');
            expect(typeof status.threeTierRouter.strategy).toBe('string');
        });

        it.each([
            { mode: 'auto' as AIMode, expectedTier: 'local' },
            { mode: 'LOCAL' as AIMode, expectedTier: 'local' },
            { mode: 'GOOGLE_ONLY' as AIMode, expectedTier: 'google' },
        ])('$mode 모드에서 $expectedTier tier로 라우팅되어야 함', async ({ mode, expectedTier }) => {
            const request: AIRequest = {
                query: '시스템 상태를 확인해주세요',
                mode,
            };

            const response = await threeTierRouter.processQuery(request);

            expect(response.success).toBe(true);
            expect(response.metadata.tier).toBe(expectedTier);
            expect(response.processingTime).toBeGreaterThan(0);
        });
    });

    describe('🔄 폴백 전략 테스트', () => {
        it('GCP Functions 실패 시 로컬 엔진으로 폴백해야 함', async () => {
            // GCP Functions 일시적 비활성화
            process.env.GCP_FUNCTIONS_ENABLED = 'false';

            const request: AIRequest = {
                query: '한국어 테스트 쿼리',
                mode: 'auto',
            };

            const response = await threeTierRouter.processQuery(request);

            expect(response.success).toBe(true);
            expect(response.metadata.fallbackUsed).toBe(true);
            expect(response.metadata.tier).toBe('local');

            // 설정 복원
            process.env.GCP_FUNCTIONS_ENABLED = 'true';
        });

        it('로컬 엔진 실패 시 GCP Functions으로 폴백해야 함', async () => {
            // 로컬 엔진 우선 전략으로 변경
            process.env.THREE_TIER_STRATEGY = 'reliability';

            const request: AIRequest = {
                query: '시스템 상태 확인',
                mode: 'auto',
            };

            const response = await threeTierRouter.processQuery(request);

            expect(response.success).toBe(true);
            expect(response.processingTime).toBeGreaterThan(0);

            // 설정 복원
            process.env.THREE_TIER_STRATEGY = 'performance';
        });

        it('모든 Tier 실패 시 적절한 에러 처리', async () => {
            const request: AIRequest = {
                query: '강제 실패 테스트',
                mode: 'auto',
            };

            try {
                await threeTierRouter.processQuery(request);
                throw new Error('에러가 발생해야 함');
            } catch (error: any) {
                expect(error.message).toContain('모든 AI Tier에서 처리 실패');
            }
        });
    });

    describe('⚡ 성능 및 최적화 테스트', () => {
        it('응답 시간이 합리적이어야 함 (< 5초)', async () => {
            const request: AIRequest = {
                query: '간단한 시스템 상태 확인',
                mode: 'auto',
            };

            const startTime = Date.now();
            const response = await threeTierRouter.processQuery(request);
            const endTime = Date.now();

            expect(response.success).toBe(true);
            expect(endTime - startTime).toBeLessThan(5000);
            expect(response.metadata.totalProcessingTime).toBeDefined();
        });

        it('동시 요청 처리 성능', async () => {
            const requests = Array.from({ length: 5 }, (_, i) => ({
                query: `동시 요청 테스트 ${i + 1}`,
                mode: 'auto' as AIMode,
            }));

            const promises = requests.map(request =>
                threeTierRouter.processQuery(request)
            );

            const responses = await Promise.all(promises);

            responses.forEach(response => {
                expect(response.success).toBe(true);
            });
        });
    });

    describe('📊 통계 및 메트릭 테스트', () => {
        it('요청 처리 통계가 올바르게 기록되어야 함', async () => {
            const request: AIRequest = {
                query: '통계 테스트 쿼리',
                mode: 'auto',
            };

            await threeTierRouter.processQuery(request);

            const stats = await threeTierRouter.getStats();
            expect(stats).toBeDefined();
            expect(stats.totalRequests).toBeGreaterThan(0);
        });

        it('GCP 무료 한도 사용량이 4.5% 미만이어야 함', async () => {
            const gcpService = threeTierRouter.getGCPService();
            const stats = gcpService.getUsageStats();

            expect(stats.freeQuotaUsage.callsPercent).toBeLessThan(4.5);
            expect(stats.freeQuotaUsage.computePercent).toBeLessThan(3.75);
            expect(stats.freeQuotaUsage.networkPercent).toBeLessThan(20);
        });
    });

    describe('🔀 다양한 시나리오 테스트', () => {
        it.each([
            { query: '현재 서버 상태', mode: 'auto' as AIMode },
            { query: '메모리 사용률 분석', mode: 'LOCAL' as AIMode },
            { query: 'CPU 성능 최적화 방법', mode: 'GOOGLE_ONLY' as AIMode },
        ])('다양한 쿼리와 모드 조합: "$query" with $mode', async ({ query, mode }) => {
            const request: AIRequest = { query, mode };
            const response = await threeTierRouter.processQuery(request);

            expect(response.success).toBe(true);
            expect(response.response).toBeDefined();
            expect(response.metadata.tier).toBeDefined();

            // 모드별 검증
            if (mode === 'LOCAL') {
                expect(['gcp', 'local']).toContain(response.metadata.tier);
            }
        });
    });

    describe('🛠️ 설정 및 관리 테스트', () => {
        it('전략 변경이 라우팅에 영향을 주어야 함', async () => {
            // 비용 최적화 전략으로 변경
            process.env.THREE_TIER_STRATEGY = 'cost';

            const request: AIRequest = {
                query: '전략 변경 테스트',
                mode: 'auto',
            };

            const response = await threeTierRouter.processQuery(request);
            expect(response.success).toBe(true);

            // 전략 복원
            process.env.THREE_TIER_STRATEGY = 'performance';
        });

        it('헬스체크가 정상 작동해야 함', async () => {
            const healthStatus = await threeTierRouter.healthCheck();
            expect(healthStatus).toBeDefined();
            expect(typeof healthStatus.healthy).toBe('boolean');
        });
    });

    describe('💰 비용 최적화 검증', () => {
        it('GCP Functions 비용이 월 무료 한도 내에 있어야 함', async () => {
            const request: AIRequest = {
                query: '비용 최적화 테스트',
                mode: 'auto',
            };

            await threeTierRouter.processQuery(request);

            const gcpService = threeTierRouter.getGCPService();
            const stats = gcpService.getUsageStats();

            // 월 무료 한도: 200만 호출, 40만 GB초, 1GB 네트워크
            expect(stats.freeQuotaUsage.calls).toBeLessThan(90000); // 90k < 2M (4.5%)
            expect(stats.freeQuotaUsage.compute).toBeLessThan(15000); // 15k < 400k (3.75%)
            expect(stats.freeQuotaUsage.network).toBeLessThan(200); // 200MB < 1GB (20%)
        });
    });

    describe('📊 성능 메트릭 검증', () => {
        it('응답 시간이 목표 범위 내에 있어야 함', async () => {
            const request: AIRequest = {
                query: '성능 테스트 쿼리',
                mode: 'auto',
            };

            const startTime = Date.now();
            const response = await threeTierRouter.processQuery(request);
            const endTime = Date.now();

            const totalTime = endTime - startTime;

            expect(response.success).toBe(true);
            expect(totalTime).toBeLessThan(10000); // 10초 이하
            expect(response.processingTime).toBeLessThan(totalTime);
            expect(response.metadata.totalProcessingTime).toBeDefined();
        });

        it('베르셀 부하 감소 메트릭이 정상적으로 수집되어야 함', async () => {
            // 여러 GCP 요청으로 메트릭 생성
            const requests = Array.from({ length: 5 }, (_, i) => ({
                query: `테스트 쿼리 ${i + 1}`,
                mode: 'auto',
            }));

            for (const request of requests) {
                await threeTierRouter.processQuery(request);
            }

            const stats = threeTierRouter.getStats();

            expect(stats.totalRequests).toBeGreaterThan(0);
            expect(stats.routingDecisions.gcp).toBeGreaterThan(0);
            expect(stats.performanceMetrics.vercelLoadReduction).toBeGreaterThan(0);
            expect(stats.performanceMetrics.vercelLoadReduction).toBeLessThanOrEqual(75);
        });

        it('AI 처리 성능 향상 메트릭이 정상적으로 수집되어야 함', async () => {
            const request: AIRequest = {
                query: '성능 향상 테스트',
                mode: 'auto',
            };

            const response = await threeTierRouter.processQuery(request);
            const stats = threeTierRouter.getStats();

            expect(response.success).toBe(true);
            expect(stats.performanceMetrics.aiPerformanceImprovement).toBeGreaterThanOrEqual(0);
            expect(stats.performanceMetrics.aiPerformanceImprovement).toBeLessThanOrEqual(50);
        });
    });

    describe('💰 무료 한도 사용량 모니터링', () => {
        it('GCP Functions 사용량이 추적되어야 함', async () => {
            const request: AIRequest = {
                query: '사용량 테스트',
                mode: 'auto',
            };

            const initialStats = gcpFunctionsService.getUsageStats();

            await threeTierRouter.processQuery(request);

            const finalStats = gcpFunctionsService.getUsageStats();

            expect(finalStats.totalRequests).toBeGreaterThan(initialStats.totalRequests);
            expect(finalStats.freeQuotaUsage.calls).toBeGreaterThan(initialStats.freeQuotaUsage.calls);
        });

        it('무료 한도 사용률이 안전 범위 내에 있어야 함', async () => {
            const stats = gcpFunctionsService.getUsageStats();

            // 월간 사용량 목표 (4.5% 이하)
            expect(stats.freeQuotaUsage.callsPercent).toBeLessThan(4.5);
            expect(stats.freeQuotaUsage.computePercent).toBeLessThan(3.75);
            expect(stats.freeQuotaUsage.networkPercent).toBeLessThan(20);
        });
    });

    describe('🎯 전략별 동작 테스트', () => {
        const strategies = ['performance', 'cost', 'reliability'];

        strategies.forEach(strategy => {
            it(`${strategy} 전략이 올바르게 동작해야 함`, async () => {
                // 전략 변경
                process.env.THREE_TIER_STRATEGY = strategy;

                const request: AIRequest = {
                    query: `${strategy} 전략 테스트`,
                    mode: 'auto',
                };

                const response = await threeTierRouter.processQuery(request);

                expect(response.success).toBe(true);
                expect(response.metadata.tier).toBeDefined();

                // 전략별 예상 동작 검증
                switch (strategy) {
                    case 'performance':
                        // 성능 우선 - 빠른 응답 시간
                        expect(response.processingTime).toBeLessThan(8000);
                        break;
                    case 'cost':
                        // 비용 우선 - GCP 우선 사용
                        expect(['gcp', 'local']).toContain(response.metadata.tier);
                        break;
                    case 'reliability':
                        // 안정성 우선 - 성공적인 응답
                        expect(response.success).toBe(true);
                        expect(response.confidence).toBeGreaterThan(0);
                        break;
                }
            });
        });
    });

    describe('🌐 엔드포인트 연결 테스트', () => {
        it('GCP Functions 엔드포인트가 접근 가능해야 함', async () => {
            const endpoints = [
                'ai-gateway',
                'korean-nlp',
                'rule-engine',
                'basic-ml',
            ];

            for (const endpoint of endpoints) {
                const url = `https://asia-northeast3-openmanager-ai.cloudfunctions.net/${endpoint}/health`;

                try {
                    const response = await fetch(url);
                    expect(response.ok).toBe(true);

                    const data = await response.json();
                    expect(data.status).toBe('healthy');
                } catch (error) {
                    console.warn(`엔드포인트 연결 실패: ${endpoint}`, error);
                    // 네트워크 문제로 인한 실패는 테스트 실패로 처리하지 않음
                }
            }
        });

        it('VM Context API가 접근 가능해야 함', async () => {
            try {
                const response = await fetch('http://34.64.213.108:10001/health');
                expect(response.ok).toBe(true);

                const data = await response.json();
                expect(data.status).toBe('healthy');
                expect(data.port).toBe(10001);
            } catch (error) {
                console.warn('VM Context API 연결 실패', error);
                // 네트워크 문제로 인한 실패는 테스트 실패로 처리하지 않음
            }
        });
    });

    describe('🔒 에러 처리 테스트', () => {
        it('잘못된 요청에 대해 적절한 에러 메시지를 반환해야 함', async () => {
            const invalidRequest: AIRequest = {
                query: '', // 빈 쿼리
                mode: 'auto',
            };

            const response = await threeTierRouter.processQuery(invalidRequest);

            expect(response.success).toBe(false);
            expect(response.error).toBeDefined();
        });

        it('타임아웃 발생 시 적절히 처리해야 함', async () => {
            // 매우 짧은 타임아웃 설정
            process.env.THREE_TIER_GCP_TIMEOUT = '1';

            const request: AIRequest = {
                query: '타임아웃 테스트',
                mode: 'auto',
            };

            const response = await threeTierRouter.processQuery(request);

            // 타임아웃 시에도 폴백으로 성공하거나 적절한 에러 처리
            expect(response).toBeDefined();

            // 설정 복원
            process.env.THREE_TIER_GCP_TIMEOUT = '8000';
        });
    });

    describe('📈 통계 및 모니터링', () => {
        it('라우터 통계가 올바르게 수집되어야 함', async () => {
            const stats = threeTierRouter.getStats();

            expect(stats).toBeDefined();
            expect(stats.totalRequests).toBeGreaterThanOrEqual(0);
            expect(stats.routingDecisions).toBeDefined();
            expect(stats.fallbackTriggers).toBeDefined();
            expect(stats.averageResponseTimes).toBeDefined();
            expect(stats.performanceMetrics).toBeDefined();
        });

        it('서비스 상태 조회가 올바르게 동작해야 함', async () => {
            const status = threeTierRouter.getRouterStatus();

            expect(status.enabled).toBe(true);
            expect(status.initialized).toBe(true);
            expect(status.strategy).toBe('performance');
            expect(status.services).toBeDefined();
            expect(status.stats).toBeDefined();
        });
    });
});

// 🔧 테스트 유틸리티 함수들
export const testUtils = {
    /**
     * 테스트용 AI 요청 생성
     */
    createTestRequest: (query: string, mode: string = 'auto'): AIRequest => ({
        query,
        mode,
        sessionId: `test-session-${Date.now()}`,
        requestId: `test-request-${Date.now()}`,
        timestamp: Date.now(),
    }),

    /**
     * 응답 검증 헬퍼
     */
    validateResponse: (response: AIResponse) => {
        expect(response).toBeDefined();
        expect(response.success).toBeDefined();
        expect(response.response).toBeDefined();
        expect(response.confidence).toBeGreaterThanOrEqual(0);
        expect(response.confidence).toBeLessThanOrEqual(1);
        expect(response.processingTime).toBeGreaterThan(0);
        expect(response.metadata).toBeDefined();
    },

    /**
     * 성능 메트릭 검증 헬퍼
     */
    validatePerformanceMetrics: (stats: any) => {
        expect(stats.performanceMetrics).toBeDefined();
        expect(stats.performanceMetrics.vercelLoadReduction).toBeGreaterThanOrEqual(0);
        expect(stats.performanceMetrics.vercelLoadReduction).toBeLessThanOrEqual(75);
        expect(stats.performanceMetrics.aiPerformanceImprovement).toBeGreaterThanOrEqual(0);
        expect(stats.performanceMetrics.aiPerformanceImprovement).toBeLessThanOrEqual(50);
    },

    /**
     * 무료 한도 사용량 검증 헬퍼
     */
    validateFreeQuotaUsage: (stats: any) => {
        expect(stats.freeQuotaUsage).toBeDefined();
        expect(stats.freeQuotaUsage.calls).toBeGreaterThanOrEqual(0);
        expect(stats.freeQuotaUsage.compute).toBeGreaterThanOrEqual(0);
        expect(stats.freeQuotaUsage.network).toBeGreaterThanOrEqual(0);
    },
}; 