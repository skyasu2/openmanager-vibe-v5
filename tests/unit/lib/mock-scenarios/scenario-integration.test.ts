/**
 * 🧪 Mock 시나리오 통합 테스트
 * 
 * Mock 시나리오가 실제 Mock 시스템과 올바르게 통합되는지 검증
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockScenarioManager, generateRealisticServerMetrics } from '@/lib/mock-scenarios';
import { DevMockGoogleAI } from '@/lib/ai/dev-mock-google-ai';
import { DevMockSupabase } from '@/lib/supabase/dev-mock-supabase';
import { DevMockGCPFunctions } from '@/lib/gcp/dev-mock-gcp-functions';

describe('Mock 시나리오 통합', () => {
  let scenarioManager: MockScenarioManager;
  let mockGoogleAI: DevMockGoogleAI;
  let mockSupabase: DevMockSupabase;
  let mockGCPFunctions: DevMockGCPFunctions;

  beforeEach(() => {
    scenarioManager = new MockScenarioManager();
    mockGoogleAI = new DevMockGoogleAI({ enableLogging: false });
    mockSupabase = new DevMockSupabase({ enableLogging: false });
    mockGCPFunctions = new DevMockGCPFunctions({ enableLogging: false });

    // Mock 인스턴스 등록
    scenarioManager.registerMockInstance('googleAI', mockGoogleAI);
    scenarioManager.registerMockInstance('supabase', mockSupabase);
    scenarioManager.registerMockInstance('gcpFunctions', mockGCPFunctions);
  });

  afterEach(() => {
    scenarioManager.stopAllScenarios();
  });

  describe('서버 모니터링 시나리오', () => {
    it('캐스케이딩 장애 시나리오를 시작할 수 있어야 함', () => {
      scenarioManager.startServerScenario('cascadingFailure');
      
      const activeScenarios = scenarioManager.getActiveScenarios();
      expect(activeScenarios.server).toBeTruthy();
      expect(activeScenarios.server.id).toBe('cascading-failure');
      expect(activeScenarios.server.name).toBe('캐스케이딩 장애');
    });

    it('시나리오 진행에 따라 서버 상태가 변경되어야 함', async () => {
      // 타이머 모킹
      vi.useFakeTimers();
      
      scenarioManager.startServerScenario('cascadingFailure');
      
      // 초기 상태 확인
      let scenarios = scenarioManager.getActiveScenarios();
      expect(scenarios.server.currentState.elapsedTime).toBe(0);
      
      // 60초 후 (DB 서버 장애 시점)
      vi.advanceTimersByTime(60000);
      scenarios = scenarioManager.getActiveScenarios();
      
      const dbServer = scenarios.server.currentState.servers.get('db-prd-01');
      expect(dbServer).toBeTruthy();
      expect(dbServer.status).toBe('critical');
      
      vi.useRealTimers();
    });
  });

  describe('Korean NLP 시나리오', () => {
    it('기술 용어 혼용 케이스를 처리할 수 있어야 함', async () => {
      const results = await scenarioManager.testKoreanNLPScenarios('technical');
      
      expect(results).toBeTruthy();
      expect(results.length).toBeGreaterThan(0);
      
      // 첫 번째 결과 확인
      const firstResult = results[0];
      expect(firstResult.scenario.category).toBe('technical');
      expect(firstResult.result.success).toBe(true);
    });

    it('비즈니스 컨텍스트 케이스를 처리할 수 있어야 함', async () => {
      const results = await scenarioManager.testKoreanNLPScenarios('business');
      
      expect(results).toBeTruthy();
      const businessResults = results.filter(r => r.scenario.category === 'business');
      expect(businessResults.length).toBeGreaterThan(0);
    });

    it('엣지 케이스를 처리할 수 있어야 함', async () => {
      const results = await scenarioManager.testKoreanNLPScenarios('edge-case');
      
      expect(results).toBeTruthy();
      const edgeCaseResults = results.filter(r => r.scenario.category === 'edge-case');
      expect(edgeCaseResults.length).toBeGreaterThan(0);
      
      // 욕설 필터링 케이스 확인
      const profanityCase = edgeCaseResults.find(r => r.scenario.id === 'edge-1');
      if (profanityCase) {
        expect(profanityCase.result.success).toBe(true);
      }
    });
  });

  describe('ML Analytics 패턴', () => {
    it('웹 서버 패턴을 적용할 수 있어야 함', () => {
      scenarioManager.applyMLAnalyticsPattern('web');
      
      const activeScenarios = scenarioManager.getActiveScenarios();
      expect(activeScenarios.ml).toBeTruthy();
      expect(activeScenarios.ml.serverType).toBe('web');
    });

    it('서버 타입별로 다른 패턴을 적용해야 함', () => {
      const serverTypes = ['web', 'api', 'database', 'cache', 'ml'] as const;
      
      serverTypes.forEach(serverType => {
        scenarioManager.applyMLAnalyticsPattern(serverType);
        const activeScenarios = scenarioManager.getActiveScenarios();
        expect(activeScenarios.ml.serverType).toBe(serverType);
      });
    });
  });

  describe('랜덤 시나리오', () => {
    it('랜덤 시나리오를 시작할 수 있어야 함', () => {
      scenarioManager.startRandomScenario();
      
      const activeScenarios = scenarioManager.getActiveScenarios();
      const hasActiveScenario = 
        activeScenarios.server || 
        activeScenarios.ml || 
        activeScenarios.nlp;
      
      expect(hasActiveScenario).toBe(true);
    });
  });

  describe('메트릭 생성', () => {
    it('서버 타입별로 현실적인 메트릭을 생성해야 함', () => {
      const serverTypes = ['web', 'api', 'database', 'cache'] as const;
      const timeOfDay = 14; // 오후 2시
      
      serverTypes.forEach(serverType => {
        const metrics = generateRealisticServerMetrics(serverType, timeOfDay);
        
        expect(metrics).toBeTruthy();
        expect(metrics.cpu).toBeGreaterThanOrEqual(0);
        expect(metrics.cpu).toBeLessThanOrEqual(100);
        expect(metrics.memory).toBeGreaterThanOrEqual(0);
        expect(metrics.memory).toBeLessThanOrEqual(100);
        expect(metrics.responseTime).toBeGreaterThan(0);
      });
    });

    it('시간대별로 다른 메트릭을 생성해야 함', () => {
      const metrics9am = generateRealisticServerMetrics('web', 9);
      const metrics3am = generateRealisticServerMetrics('web', 3);
      
      // 오전 9시가 새벽 3시보다 일반적으로 더 높은 부하
      expect(metrics9am.cpu).toBeGreaterThan(metrics3am.cpu * 0.8);
    });
  });

  describe('Mock 인스턴스 통합', () => {
    it('Mock 인스턴스가 정상적으로 등록되어야 함', () => {
      const newManager = new MockScenarioManager();
      
      expect(() => {
        newManager.registerMockInstance('googleAI', mockGoogleAI);
        newManager.registerMockInstance('supabase', mockSupabase);
        newManager.registerMockInstance('gcpFunctions', mockGCPFunctions);
      }).not.toThrow();
    });

    it('시나리오 중지가 정상 동작해야 함', () => {
      scenarioManager.startServerScenario('peakLoad');
      
      let activeScenarios = scenarioManager.getActiveScenarios();
      expect(Object.keys(activeScenarios).length).toBeGreaterThan(0);
      
      scenarioManager.stopAllScenarios();
      
      activeScenarios = scenarioManager.getActiveScenarios();
      expect(Object.keys(activeScenarios).length).toBe(0);
    });
  });

  describe('시나리오 조합', () => {
    it('여러 시나리오를 동시에 실행할 수 있어야 함', () => {
      scenarioManager.startServerScenario('memoryLeak');
      scenarioManager.applyMLAnalyticsPattern('api');
      
      const activeScenarios = scenarioManager.getActiveScenarios();
      expect(activeScenarios.server).toBeTruthy();
      expect(activeScenarios.ml).toBeTruthy();
      expect(activeScenarios.server.id).toBe('memory-leak');
      expect(activeScenarios.ml.serverType).toBe('api');
    });
  });
});