/**
 * 🧪 UnifiedAIEngineRouter 통합 테스트 (재통합 버전)
 *
 * 과도한 분리 해결 후 단일 클래스 테스트
 */

import { UnifiedAIEngineRouter } from '@/core/ai/engines/UnifiedAIEngineRouter';
import { AIMode, AIRequest } from '@/types/ai-types';
import { beforeEach, describe, expect, test, vi } from 'vitest';

// Vitest Mock 설정
vi.mock('@/services/ai/GoogleAIService');
vi.mock('@/services/ai/korean-ai-engine');
vi.mock('@/services/ai/transformers-engine');
vi.mock('@/services/ai/engines/OpenSourceEngines');
vi.mock('@/services/ai/engines/CustomEngines');
vi.mock('@/core/ai/context/MCPContextCollector');
vi.mock('@/core/ai/handlers/AIFallbackHandler');
vi.mock('@/lib/ml/supabase-rag-engine');

describe('UnifiedAIEngineRouter 통합 테스트', () => {
  let router: UnifiedAIEngineRouter;

  beforeEach(() => {
    router = UnifiedAIEngineRouter.getInstance();
  });

  describe('🏗️ 기본 기능', () => {
    test('싱글톤 인스턴스 생성', () => {
      const instance1 = UnifiedAIEngineRouter.getInstance();
      const instance2 = UnifiedAIEngineRouter.getInstance();
      expect(instance1).toBe(instance2);
    });

    test('초기 상태 확인', () => {
      const status = router.getStatus();
      expect(status.router).toBe('UnifiedAIEngineRouter');
      expect(status.version).toBe('3.1.0');
      expect(status.initialized).toBe(false);
    });
  });

  describe('🎯 모드별 처리', () => {
    const mockRequest: AIRequest = {
      query: '서버 상태 확인',
      category: 'monitoring',
      mode: 'LOCAL',
    };

    test('LOCAL 모드 처리', async () => {
      const result = await router.processQuery({
        ...mockRequest,
        mode: 'LOCAL',
      });
      expect(result.mode).toBe('LOCAL');
      expect(result.success).toBeDefined();
    });

    test('GOOGLE_AI 모드 처리', async () => {
      const result = await router.processQuery({
        ...mockRequest,
        mode: 'GOOGLE_AI',
      });
      expect(result.mode).toBe('GOOGLE_AI');
      expect(result.success).toBeDefined();
    });

    test('AUTO 모드 처리', async () => {
      const result = await router.processQuery({
        ...mockRequest,
        mode: 'AUTO',
      });
      expect(result.mode).toBe('AUTO');
      expect(result.success).toBeDefined();
    });

    test('잘못된 모드는 LOCAL로 정규화', async () => {
      const invalidRequest = {
        ...mockRequest,
        mode: 'INVALID_MODE' as AIMode,
      };
      const result = await router.processQuery(invalidRequest);
      expect(result.mode).toBe('LOCAL');
    });
  });

  describe('📊 통계 관리', () => {
    test('통계 초기화', () => {
      router.resetStats();
      const status = router.getStatus();
      expect(status.stats.totalRequests).toBe(0);
      expect(status.stats.successfulRequests).toBe(0);
      expect(status.stats.failedRequests).toBe(0);
    });

    test('모드 변경', () => {
      router.setMode('GOOGLE_AI');
      const status = router.getStatus();
      expect(status.mode).toBe('GOOGLE_AI');
    });
  });

  describe('🚀 통합 테스트', () => {
    test('전체 워크플로우 테스트', async () => {
      const request: AIRequest = {
        query: '메모리 사용량 확인',
        category: 'system',
        mode: 'AUTO',
      };

      const result = await router.processQuery(request);

      // 기본 응답 구조 검증
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('response');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('enginePath');
      expect(result).toHaveProperty('processingTime');
      expect(result).toHaveProperty('fallbacksUsed');
      expect(result).toHaveProperty('metadata');

      // 메타데이터 검증
      expect(result.metadata).toHaveProperty('mainEngine');
      expect(result.metadata).toHaveProperty('supportEngines');
      expect(result.metadata).toHaveProperty('ragUsed');
      expect(result.metadata).toHaveProperty('googleAIUsed');
      expect(result.metadata).toHaveProperty('mcpContextUsed');
      expect(result.metadata).toHaveProperty('subEnginesUsed');
    });

    test('에러 처리 테스트', async () => {
      // 빈 쿼리로 에러 유발
      const result = await router.processQuery({
        query: '',
        mode: 'LOCAL',
      });

      expect(result.success).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.processingTime).toBeDefined(); // 단순히 정의되어 있는지만 확인
      expect(typeof result.processingTime).toBe('number'); // 숫자 타입인지 확인
    });
  });

  describe('🔧 유틸리티 기능', () => {
    test('초기화 테스트', async () => {
      await router.initialize();
      const status = router.getStatus();
      expect(status.initialized).toBe(true);
    });

    test('상태 조회 완전성', () => {
      const status = router.getStatus();

      expect(status).toHaveProperty('router');
      expect(status).toHaveProperty('version');
      expect(status).toHaveProperty('mode');
      expect(status).toHaveProperty('initialized');
      expect(status).toHaveProperty('stats');
      expect(status).toHaveProperty('engines');
      expect(status).toHaveProperty('lastRequestContext');

      // 엔진 상태 검증
      expect(status.engines).toHaveProperty('supabaseRAG');
      expect(status.engines).toHaveProperty('googleAI');
      expect(status.engines).toHaveProperty('koreanEngine');
      expect(status.engines).toHaveProperty('transformersEngine');
      expect(status.engines).toHaveProperty('openSourceEngines');
      expect(status.engines).toHaveProperty('customEngines');
      expect(status.engines).toHaveProperty('mcpContextCollector');
      expect(status.engines).toHaveProperty('fallbackHandler');
    });
  });
});
