import type { Meta, StoryObj } from '@storybook/react';
import { AIEngineTest } from './AIEngineTest';

const meta: Meta<typeof AIEngineTest> = {
  title: 'AI Components/AIEngineTest',
  component: AIEngineTest,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '🧪 Enhanced Unified AI Engine 테스트 컴포넌트 - 14개 통합 AI 엔진의 상태, 성능, 사고과정 로그를 테스트합니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const EnhancedEngineSuccess: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        // Enhanced Unified AI Engine 헬스체크
        {
          url: '/api/analyze',
          method: 'get',
          status: 200,
          response: {
            success: true,
            status: 'healthy',
            version: '5.0.0-enhanced',
            engines: {
              unified: 'active',
              'google-ai': 'active',
              rag: 'active',
              mcp: 'active',
              'mcp-test': 'standby',
              hybrid: 'active',
              custom: 'active',
              anomaly: 'active',
              prediction: 'active',
              autoscaling: 'active',
              korean: 'active',
              enhanced: 'active',
              integrated: 'active',
              correlation: 'active',
            },
            timestamp: new Date().toISOString(),
          },
        },
        // 통합 분석 API
        {
          url: '/api/analyze',
          method: 'post',
          status: 200,
          response: {
            success: true,
            query: 'Enhanced AI 엔진 테스트 분석',
            intent: {
              primary: 'system_analysis',
              confidence: 0.95,
              category: 'monitoring',
              urgency: 'medium',
            },
            analysis: {
              summary:
                'Enhanced Unified AI Engine이 정상적으로 작동하고 있습니다.',
              details: [
                '14개 엔진 모두 정상 상태',
                '사고과정 로그 시스템 활성화',
                '지능형 캐싱 시스템 작동',
                '성능 최적화 완료',
              ],
              confidence: 0.97,
              processingTime: 245,
            },
            recommendations: [
              '모든 엔진이 최적 상태로 운영 중입니다.',
              '캐시 적중률이 85%로 우수합니다.',
              '메모리 사용량이 안정적입니다.',
            ],
            engines: {
              used: ['unified', 'google-ai', 'rag'],
              results: [
                { engine: 'unified', confidence: 0.95, responseTime: 120 },
                { engine: 'google-ai', confidence: 0.92, responseTime: 340 },
                { engine: 'rag', confidence: 0.88, responseTime: 180 },
              ],
              fallbacks: 0,
            },
            thinking_process: [
              {
                id: 'step-1',
                type: 'analyzing',
                title: '쿼리 분석 시작',
                description: '사용자 요청을 분석하고 있습니다.',
                timestamp: new Date().toISOString(),
                progress: 25,
                duration: 50,
              },
              {
                id: 'step-2',
                type: 'processing',
                title: '엔진 라우팅',
                description: '최적의 AI 엔진을 선택하고 있습니다.',
                timestamp: new Date().toISOString(),
                progress: 50,
                duration: 80,
              },
              {
                id: 'step-3',
                type: 'reasoning',
                title: '추론 수행',
                description: '선택된 엔진으로 추론을 수행하고 있습니다.',
                timestamp: new Date().toISOString(),
                progress: 75,
                duration: 120,
              },
              {
                id: 'step-4',
                type: 'completed',
                title: '분석 완료',
                description: '모든 분석이 성공적으로 완료되었습니다.',
                timestamp: new Date().toISOString(),
                progress: 100,
                duration: 245,
              },
            ],
            performance: {
              memoryUsage: { used: 156.8, total: 512.0 },
              cacheHit: true,
              memoryDelta: 2.4,
            },
            cache_hit: false,
            fallback_used: false,
            engine_used: 'unified',
            response_time: 245,
            timestamp: new Date().toISOString(),
          },
        },
      ],
    },
  },
};

export const GracefulDegradation: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        // 부분 장애 상황
        {
          url: '/api/analyze',
          method: 'get',
          status: 200,
          response: {
            success: true,
            status: 'degraded',
            version: '5.0.0-enhanced',
            engines: {
              unified: 'active',
              'google-ai': 'error',
              rag: 'active',
              mcp: 'degraded',
              'mcp-test': 'disabled',
              hybrid: 'active',
              custom: 'active',
              anomaly: 'active',
              prediction: 'degraded',
              autoscaling: 'active',
              korean: 'active',
              enhanced: 'active',
              integrated: 'active',
              correlation: 'active',
            },
            systemStatus: {
              tier: 'core_only',
              availableComponents: ['unified', 'rag', 'hybrid', 'custom'],
              degradationLevel: 'moderate',
              recommendation:
                'Google AI와 MCP 엔진에 문제가 있어 핵심 엔진만 사용 중입니다.',
            },
          },
        },
        {
          url: '/api/analyze',
          method: 'post',
          status: 200,
          response: {
            success: true,
            query: '장애 상황 분석',
            analysis: {
              summary: 'Graceful Degradation 모드로 동작 중입니다.',
              details: [
                'Google AI 엔진 일시 중단',
                'MCP 엔진 성능 저하',
                '핵심 엔진으로 폴백 완료',
                '서비스 연속성 유지',
              ],
              confidence: 0.78,
              processingTime: 450,
            },
            thinking_process: [
              {
                id: 'step-1',
                type: 'analyzing',
                title: '시스템 상태 확인',
                description: '사용 가능한 엔진을 확인하고 있습니다.',
                timestamp: new Date().toISOString(),
                progress: 30,
                duration: 100,
              },
              {
                id: 'step-2',
                type: 'processing',
                title: '폴백 전략 실행',
                description: '장애 엔진을 우회하여 처리합니다.',
                timestamp: new Date().toISOString(),
                progress: 60,
                duration: 200,
              },
              {
                id: 'step-3',
                type: 'completed',
                title: '폴백 완료',
                description: '핵심 엔진으로 성공적으로 처리되었습니다.',
                timestamp: new Date().toISOString(),
                progress: 100,
                duration: 450,
              },
            ],
            fallback_used: true,
            engine_used: 'unified-fallback',
            response_time: 450,
          },
        },
      ],
    },
  },
};

export const ThinkingProcessDemo: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/analyze',
          method: 'post',
          status: 200,
          response: {
            success: true,
            query: '사고과정 로그 데모',
            thinking_process: [
              {
                id: 'step-1',
                type: 'analyzing',
                title: '입력 분석',
                description: '사용자 쿼리의 의도와 컨텍스트를 분석합니다.',
                timestamp: new Date(Date.now() - 4000).toISOString(),
                progress: 20,
                duration: 150,
                metadata: { engine: 'korean', confidence: 0.9 },
              },
              {
                id: 'step-2',
                type: 'processing',
                title: '엔진 선택',
                description: '14개 엔진 중 최적의 조합을 선택합니다.',
                timestamp: new Date(Date.now() - 3000).toISOString(),
                progress: 40,
                duration: 200,
                metadata: {
                  selectedEngines: ['unified', 'rag', 'correlation'],
                },
              },
              {
                id: 'step-3',
                type: 'reasoning',
                title: '병렬 추론',
                description: '선택된 엔진들이 병렬로 추론을 수행합니다.',
                timestamp: new Date(Date.now() - 2000).toISOString(),
                progress: 70,
                duration: 800,
                subSteps: [
                  'Unified Engine: 통합 분석 수행',
                  'RAG Engine: 지식 검색 및 증강',
                  'Correlation Engine: 상관관계 분석',
                ],
              },
              {
                id: 'step-4',
                type: 'generating',
                title: '결과 생성',
                description:
                  '각 엔진의 결과를 종합하여 최종 응답을 생성합니다.',
                timestamp: new Date(Date.now() - 1000).toISOString(),
                progress: 90,
                duration: 300,
              },
              {
                id: 'step-5',
                type: 'completed',
                title: '완료',
                description: '모든 처리가 완료되어 결과를 반환합니다.',
                timestamp: new Date().toISOString(),
                progress: 100,
                duration: 1450,
              },
            ],
            performance: {
              memoryUsage: { used: 234.5, total: 512.0 },
              cacheHit: false,
              memoryDelta: 45.2,
            },
            engine_used: 'multi-engine',
            response_time: 1450,
          },
        },
      ],
    },
  },
};
