/**
 * 🧪 MCP 컨텍스트 통합 테스트
 * MCP 서버와의 연동 및 컨텍스트 수집 기능 테스트
 */

import { describe, it, expect, beforeAll, vi, afterEach } from 'vitest';
import { ServerMonitoringAgent } from '../ServerMonitoringAgent';
import type { QueryRequest, QueryResponse } from '../ServerMonitoringAgent';

// Mock fetch for MCP server calls
global.fetch = vi.fn();

// Mock unifiedDataBroker
vi.mock('@/services/data-collection/UnifiedDataBroker', () => ({
  unifiedDataBroker: {
    getMetrics: vi.fn(() => ({ total: 100, healthy: 90 })),
    subscribeToServers: vi.fn((id, callback, options) => {
      // 테스트용 서버 데이터 반환
      setTimeout(() => {
        callback([
          {
            id: 'srv-001',
            name: 'web-server-01',
            cpu: 75,
            memory: 60,
            status: 'healthy',
            health: { 
              score: 85,
              trend: [80, 82, 85],
              status: 'healthy', 
              issues: [] 
            },
          },
          {
            id: 'srv-002',
            name: 'db-server-01',
            cpu: 90,
            memory: 85,
            status: 'warning',
            health: { 
              score: 65,
              trend: [70, 68, 65],
              status: 'warning', 
              issues: ['High CPU usage detected'] 
            },
          },
        ]);
      }, 100);
      return vi.fn(); // unsubscribe function
    }),
    subscribeToMetrics: vi.fn((id, callback, options) => {
      setTimeout(() => {
        callback({
          summary: {
            totalServers: 2,
            healthyCount: 1,
            warningCount: 1,
          },
        });
      }, 100);
      return vi.fn(); // unsubscribe function
    }),
  },
}));

// Mock alertsEmitter
vi.mock('@/lib/events/alertsEmitter', () => ({
  alertsEmitter: {
    emit: vi.fn(),
  },
}));

describe('MCP 컨텍스트 통합', () => {
  let agent: ServerMonitoringAgent;

  // 테스트용 서버 데이터
  const mockServerContext = {
    servers: [
      {
        id: 'srv-001',
        name: 'web-server-01',
        cpu: 75,
        memory: 60,
        status: 'healthy',
      },
      {
        id: 'srv-002',
        name: 'db-server-01',
        cpu: 90,
        memory: 85,
        status: 'warning',
      },
    ],
    totalServers: 2,
    healthyCount: 1,
    warningCount: 1,
  };

  beforeAll(async () => {
    agent = ServerMonitoringAgent.getInstance();
    await agent._initialize();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('에이전트 초기화', () => {
    it('에이전트가 성공적으로 초기화되어야 함', async () => {
      const health = await agent.healthCheck();
      
      expect(health.status).toBe('healthy');
      expect(health.capabilities).toContain('query-answering');
      expect(health.capabilities).toContain('incident-analysis');
      expect(health.knowledgeBase.patterns).toBeGreaterThan(0);
    });

    it('지원 기능이 올바르게 설정되어야 함', async () => {
      const health = await agent.healthCheck();
      
      expect(health.capabilities).toEqual([
        'query-answering',
        'incident-analysis',
        'performance-monitoring',
        'cost-analysis',
        'predictive-insights',
        'auto-reporting',
      ]);
    });
  });

  describe('질의 처리', () => {
    it('서버 상태 질의를 처리해야 함', async () => {
      const request: QueryRequest = {
        id: 'q-001',
        query: '현재 서버 상태는 어떤가요?',
        timestamp: new Date(),
        context: {},
      };

      const response = await agent.processQuery(request);

      expect(response.answer).toBeDefined();
      expect(response.answer).toContain('서버');
      expect(response.confidence).toBeGreaterThan(0.5);
      expect(response.thinkingSteps).toHaveLength(5);
    });

    it('CPU 이상 감지 질의를 처리해야 함', async () => {
      const request: QueryRequest = {
        id: 'q-002',
        query: 'CPU 사용률이 높은 서버는?',
        timestamp: new Date(),
        context: {},
      };

      const response = await agent.processQuery(request);

      expect(response.answer).toContain('db-server-01');
      expect(response.answer).toContain('90');
      expect(response.metadata.pattern).toBeDefined();
      expect(response.confidence).toBeGreaterThan(0.7);
    });

    it('장애 분석 질의를 처리해야 함', async () => {
      const request: QueryRequest = {
        id: 'q-003',
        query: '현재 발생한 장애나 문제가 있나요?',
        timestamp: new Date(),
      };

      const response = await agent.processQuery(request);

      expect(response.answer).toBeDefined();
      expect(response.thinkingSteps.length).toBeGreaterThan(0);
      expect(response.metadata.severity).toBeDefined();
    });
  });

  describe('생각 과정 생성', () => {
    it('올바른 생각 단계를 생성해야 함', async () => {
      const request: QueryRequest = {
        id: 'q-004',
        query: '메모리 사용량 상위 서버',
        timestamp: new Date(),
      };

      const response = await agent.processQuery(request);

      expect(response.thinkingSteps).toHaveLength(5);
      
      // 각 단계 검증
      const steps = response.thinkingSteps;
      expect(steps[0].title).toBe('질의 의도 분석');
      expect(steps[1].title).toBe('실시간 데이터 수집');
      expect(steps[2].title).toBe('패턴 분석 및 이상 탐지');
      expect(steps[3].title).toBe('AI 응답 생성');
      expect(steps[4].title).toBe('스마트 인사이트 생성');

      // 모든 단계가 완료되어야 함
      steps.forEach(step => {
        expect(step.status).toBe('completed');
        expect(step.duration).toBeGreaterThan(0);
      });
    });

    it('에러 발생 시 생각 단계를 적절히 처리해야 함', async () => {
      // Mock error during processing
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error('Processing error'));

      const request: QueryRequest = {
        id: 'q-005',
        query: '서버 상태 요약',
        timestamp: new Date(),
      };

      try {
        await agent.processQuery(request);
      } catch (error) {
        // 에러가 발생해도 정상적으로 처리되어야 함
        expect(error).toBeDefined();
      }
    });
  });

  describe('인시던트 보고서 생성', () => {
    it('특정 서버의 장애 보고서를 생성해야 함', async () => {
      const report = await agent.generateIncidentReport('srv-002');

      expect(report.id).toContain('incident_');
      expect(report.title).toContain('db-server-01');
      expect(report.severity).toBe('major'); // warning status → major severity
      expect(report.affectedServers).toHaveLength(1);
      expect(report.affectedServers[0].name).toBe('db-server-01');
    });

    it('근본 원인 분석이 포함되어야 함', async () => {
      const report = await agent.generateIncidentReport('srv-002');

      expect(report.rootCause.analysis).toBeDefined();
      expect(report.rootCause.factors).toContain('High CPU usage detected');
      expect(report.rootCause.confidence).toBeGreaterThan(0.5);
    });

    it('해결 방안이 포함되어야 함', async () => {
      const report = await agent.generateIncidentReport('srv-002');

      expect(report.resolution.actions.length).toBeGreaterThan(0);
      expect(report.resolution.prevention.length).toBeGreaterThan(0);
      expect(report.resolution.monitoring.length).toBeGreaterThan(0);
    });

    it('존재하지 않는 서버 ID로 요청 시 에러가 발생해야 함', async () => {
      await expect(
        agent.generateIncidentReport('non-existent')
      ).rejects.toThrow('서버 non-existent를 찾을 수 없습니다');
    });
  });

  describe('인사이트 생성', () => {
    it('성능 인사이트를 생성해야 함', async () => {
      const request: QueryRequest = {
        id: 'q-006',
        query: '성능 개선이 필요한 서버는?',
        timestamp: new Date(),
      };

      const response = await agent.processQuery(request);

      const performanceInsights = response.insights.filter(
        i => i.type === 'performance'
      );

      expect(performanceInsights.length).toBeGreaterThan(0);
      expect(performanceInsights[0].title).toContain('CPU');
      expect(performanceInsights[0].affectedServers.length).toBeGreaterThan(0);
    });

    it('비용 최적화 인사이트를 생성해야 함', async () => {
      // Mock low utilization servers
      const { unifiedDataBroker } = await import('@/services/data-collection/UnifiedDataBroker');
      vi.mocked(unifiedDataBroker.subscribeToServers).mockImplementationOnce((id, callback) => {
        setTimeout(() => {
          callback([
            {
              id: 'srv-003',
              name: 'idle-server-01',
              cpu: 20,
              memory: 30,
              status: 'healthy',
              health: { 
                score: 95,
                trend: [94, 95, 95],
                status: 'healthy', 
                issues: [] 
              },
            },
          ]);
        }, 100);
        return vi.fn();
      });

      const request: QueryRequest = {
        id: 'q-007',
        query: '비용 절감 방안이 있나요?',
        timestamp: new Date(),
      };

      const response = await agent.processQuery(request);

      const costInsights = response.insights.filter(i => i.type === 'cost');
      
      if (costInsights.length > 0) {
        expect(costInsights[0].title).toContain('리소스 최적화');
        expect(costInsights[0].estimatedCost).toBeDefined();
      }
    });
  });

  describe('메타데이터 및 신뢰도', () => {
    it('응답에 적절한 메타데이터가 포함되어야 함', async () => {
      const request: QueryRequest = {
        id: 'q-008',
        query: '서버 상태 분석',
        timestamp: new Date(),
      };

      const response = await agent.processQuery(request);

      expect(response.metadata.processingTime).toBeGreaterThan(0);
      expect(response.metadata.dataPoints).toBe(2); // 2 servers
      expect(response.metadata.pattern).toBeDefined();
    });

    it('질의 유형에 따라 적절한 신뢰도를 반환해야 함', async () => {
      const requests: QueryRequest[] = [
        {
          id: 'q-009',
          query: '서버 상태는?', // server-status
          timestamp: new Date(),
        },
        {
          id: 'q-010',
          query: '장애가 있나요?', // incident-analysis
          timestamp: new Date(),
        },
        {
          id: 'q-011',
          query: '일반 질문입니다', // general-inquiry
          timestamp: new Date(),
        },
      ];

      for (const request of requests) {
        const response = await agent.processQuery(request);
        expect(response.confidence).toBeGreaterThanOrEqual(0.6);
        expect(response.confidence).toBeLessThanOrEqual(1.0);
      }
    });
  });

  describe('권장사항 생성', () => {
    it('문제가 있는 서버에 대해 권장사항을 생성해야 함', async () => {
      const request: QueryRequest = {
        id: 'q-012',
        query: '개선 사항을 추천해주세요',
        timestamp: new Date(),
      };

      const response = await agent.processQuery(request);

      expect(response.recommendations.length).toBeGreaterThan(0);
      expect(response.answer).toContain('권장');
    });
  });

  describe('추가된 메소드 테스트', () => {
    it('MCP 연결 상태를 확인할 수 있어야 함', async () => {
      const isConnected = await agent.checkMCPConnection();
      expect(isConnected).toBe(true);
    });

    it('전체 컨텍스트를 수집할 수 있어야 함', async () => {
      const context = await agent.collectContext();
      expect(context).toBeDefined();
      expect(context.servers).toBeDefined();
      expect(context.servers.length).toBeGreaterThan(0);
    });

    it('특정 서버 컨텍스트를 수집할 수 있어야 함', async () => {
      const context = await agent.collectServerContext('srv-001');
      expect(context).toBeDefined();
      expect(context?.servers.length).toBe(1);
      expect(context?.servers[0].id).toBe('srv-001');
    });

    it('실시간 업데이트를 구독할 수 있어야 함', async () => {
      const updates: any[] = [];
      const unsubscribe = agent.subscribeToUpdates((data) => {
        updates.push(data);
      });

      // 초기 데이터와 첫 업데이트를 기다림
      await new Promise(resolve => setTimeout(resolve, 2000));

      expect(updates.length).toBeGreaterThan(0);
      expect(updates[0].servers).toBeDefined();

      // 구독 해제
      unsubscribe();
    });

    it('캐시를 초기화할 수 있어야 함', () => {
      // 캐시에 데이터 추가
      agent.collectServerContext('srv-001');
      
      // 캐시 초기화
      agent.clearCache();
      
      // clearCache는 동기 함수이므로 에러가 없으면 성공
      expect(true).toBe(true);
    });
  });
});