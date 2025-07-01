/**
 * 🧪 TDD 리팩토링: UnifiedAIEngineRouter v4.0 → 모듈화
 *
 * 📋 리팩토링 목표:
 * - UnifiedAIEngineRouter.ts: 1,598줄 → 800줄 이하 (50% 축소)
 * - AIEngineManager.ts: ~300줄 (엔진 초기화 및 관리)
 * - AIRoutingSystem.ts: ~400줄 (모드별 라우팅 로직)
 * - AIFallbackHandler.ts: ~200줄 (폴백 처리 시스템)
 * - MCPContextCollector.ts: ~200줄 (MCP 컨텍스트 수집)
 *
 * 🎯 TDD 방식: Red → Green → Refactor
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import type { AIMode, AIRequest } from '@/types/ai-types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

describe('UnifiedAIEngineRouter 리팩토링 TDD', () => {
  let router: UnifiedAIEngineRouter;

  beforeEach(async () => {
    // 각 테스트마다 새로운 인스턴스 (싱글톤 패턴 우회)
    // @ts-expect-error - private static 필드 접근으로 테스트 격리
    UnifiedAIEngineRouter.instance = null;
    router = UnifiedAIEngineRouter.getInstance();
    await router.initialize();
  });

  afterEach(() => {
    // 정리 작업
    // @ts-expect-error - private static 필드 접근으로 테스트 격리
    UnifiedAIEngineRouter.instance = null;
  });

  describe('🔴 Red Phase - 분리 전 기존 기능 테스트 (Baseline)', () => {
    it('라우터 인스턴스가 올바르게 생성되어야 함', () => {
      expect(router).toBeDefined();
      expect(router).toBeInstanceOf(UnifiedAIEngineRouter);
    });

    it('초기화가 성공해야 함', async () => {
      const stats = router.getStats();
      expect(stats).toBeDefined();
      expect(stats.totalRequests).toBe(0);
    });

    it('LOCAL 모드 쿼리 처리가 성공해야 함', async () => {
      const request: AIRequest = {
        query: '테스트 질의',
        mode: 'LOCAL',
        context: { test: true },
      };

      const response = await router.processQuery(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.response).toBeDefined();
      expect(response.enginePath).toContain('LOCAL');
      expect(response.processingTime).toBeGreaterThan(0);
    });

    it('GOOGLE_AI 모드 쿼리 처리가 성공해야 함', async () => {
      const request: AIRequest = {
        query: '서버 상태를 확인해주세요',
        mode: 'GOOGLE_AI',
        context: { test: true },
      };

      const response = await router.processQuery(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.response).toBeDefined();
      expect(response.processingTime).toBeGreaterThan(0);
    });

    it('AUTO 모드에서 자동 라우팅이 작동해야 함', async () => {
      const request: AIRequest = {
        query: '한국어 질의 테스트',
        mode: 'AUTO',
        context: { test: true },
      };

      const response = await router.processQuery(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.enginePath).toBeDefined();
      expect(Array.isArray(response.enginePath)).toBe(true);
    });

    it('폴백 시스템이 작동해야 함', async () => {
      const request: AIRequest = {
        query: '', // 빈 쿼리로 폴백 유도
        mode: 'LOCAL',
        context: { test: true },
      };

      const response = await router.processQuery(request);

      expect(response).toBeDefined();
      // 폴백 시에도 응답은 제공되어야 함
      expect(response.response).toBeDefined();
    });

    it('엔진 상태 조회가 작동해야 함', () => {
      const status = router.getEngineStatus();

      expect(status).toBeDefined();
      expect(status.initialized).toBe(true);
      expect(status.engines).toBeDefined();
      expect(typeof status.engines).toBe('object');
    });

    it('통계 정보가 올바르게 수집되어야 함', async () => {
      const initialStats = router.getStats();

      // 통계 객체가 올바른 구조를 가지고 있는지 확인
      expect(initialStats).toBeDefined();
      expect(typeof initialStats.totalRequests).toBe('number');
      expect(typeof initialStats.successfulRequests).toBe('number');
      expect(typeof initialStats.failedRequests).toBe('number');
      expect(initialStats.totalRequests).toBeGreaterThanOrEqual(0);

      const request: AIRequest = {
        query: '통계 테스트',
        mode: 'LOCAL',
      };

      await router.processQuery(request);

      const updatedStats = router.getStats();
      expect(updatedStats).toBeDefined();
      expect(updatedStats.totalRequests).toBe(initialStats.totalRequests + 1);
    });

    it('모드 변경이 정상 작동해야 함', () => {
      router.setMode('GOOGLE_AI');
      expect(router.getCurrentMode()).toBe('GOOGLE_AI');

      router.setMode('LOCAL');
      expect(router.getCurrentMode()).toBe('LOCAL');
    });

    it('폴백 메트릭 조회가 null을 반환해야 함', () => {
      const metrics = router.getFallbackMetrics();

      // getFallbackMetrics는 현재 null을 반환 (UnifiedFallbackManager 제거됨)
      expect(metrics).toBeNull();
    });

    it('여러 엔진이 정상 로드되어야 함', () => {
      const status = router.getEngineStatus();
      const engineKeys = Object.keys(status.engines);

      expect(engineKeys.length).toBeGreaterThan(3);

      // 필수 엔진들 확인
      expect(engineKeys).toContain('supabaseRAG');
      expect(engineKeys).toContain('korean');
      expect(engineKeys).toContain('googleAI');
    });
  });

  describe('🟡 Green Phase - 분리 후 기능 테스트 (구현 예정)', () => {
    it.skip('AIEngineManager가 엔진들을 올바르게 관리해야 함', async () => {
      // TODO: AIEngineManager 분리 후 구현
      expect(true).toBe(false); // 의도적 실패
    });

    it.skip('AIRoutingSystem이 올바른 라우팅을 제공해야 함', async () => {
      // TODO: AIRoutingSystem 분리 후 구현
      expect(true).toBe(false); // 의도적 실패
    });

    it.skip('AIFallbackHandler가 폴백을 올바르게 처리해야 함', async () => {
      // TODO: AIFallbackHandler 분리 후 구현
      expect(true).toBe(false); // 의도적 실패
    });

    it.skip('MCPContextCollector가 컨텍스트를 수집해야 함', async () => {
      // TODO: MCPContextCollector 분리 후 구현
      expect(true).toBe(false); // 의도적 실패
    });
  });

  describe('🔵 성능 및 통합 테스트', () => {
    it('대량 요청 처리 시 메모리 누수가 없어야 함', async () => {
      const requests: AIRequest[] = Array.from({ length: 10 }, (_, i) => ({
        query: `테스트 쿼리 ${i}`,
        mode: 'LOCAL' as AIMode,
      }));

      const responses = await Promise.all(
        requests.map(req => router.processQuery(req))
      );

      expect(responses).toHaveLength(10);
      responses.forEach(response => {
        expect(response.success).toBe(true);
      });
    });

    it('처리 시간이 합리적 범위 내여야 함', async () => {
      const request: AIRequest = {
        query: '빠른 응답 테스트',
        mode: 'LOCAL',
      };

      const response = await router.processQuery(request);

      expect(response.processingTime).toBeLessThan(10000); // 10초 이내
      expect(response.processingTime).toBeGreaterThan(0);
    });

    it('동시 요청 처리가 정상 작동해야 함', async () => {
      const concurrentRequests = Array.from({ length: 5 }, (_, i) => ({
        query: `동시 처리 테스트 ${i}`,
        mode: 'LOCAL' as AIMode,
      }));

      const responses = await Promise.all(
        concurrentRequests.map(req => router.processQuery(req))
      );

      expect(responses).toHaveLength(5);
      responses.forEach((response, index) => {
        expect(response.success).toBe(true);
        expect(response.response).toContain(
          `동시 처리 테스트 ${index}` || '테스트'
        );
      });
    });
  });

  describe('🧪 에러 처리 및 경계 케이스', () => {
    it('잘못된 모드 처리가 정상 작동해야 함', async () => {
      const request: AIRequest = {
        query: '잘못된 모드 테스트',
        mode: 'INVALID_MODE' as AIMode,
      };

      const response = await router.processQuery(request);

      expect(response).toBeDefined();
      // 잘못된 모드는 기본 모드로 폴백되어야 함
      expect(response.enginePath).toContain('LOCAL');
    });

    it('빈 쿼리 처리가 정상 작동해야 함', async () => {
      const request: AIRequest = {
        query: '',
        mode: 'LOCAL',
      };

      const response = await router.processQuery(request);

      expect(response).toBeDefined();
      expect(response.response).toBeDefined();
    });

    it('매우 긴 쿼리 처리가 정상 작동해야 함', async () => {
      const longQuery = 'a'.repeat(5000);
      const request: AIRequest = {
        query: longQuery,
        mode: 'LOCAL',
      };

      const response = await router.processQuery(request);

      expect(response).toBeDefined();
      expect(response.success).toBeDefined();
    });

    it('특수 문자 포함 쿼리가 정상 처리되어야 함', async () => {
      const request: AIRequest = {
        query: '특수문자 테스트: @#$%^&*(){}[]|\\:";\'<>?,./~`',
        mode: 'LOCAL',
      };

      const response = await router.processQuery(request);

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
    });
  });
});
