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
          '🧪 AI 엔진 테스트 컴포넌트 - 다양한 AI 엔진들의 상태와 성능을 테스트합니다.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithMockAPISuccess: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        // AI 엔진 헬스체크 API 모킹
        {
          url: '/api/analyze',
          method: 'get',
          status: 200,
          response: {
            success: true,
            status: 'healthy',
            version: '2.0.1',
            engines: {
              internal: 'active',
              fallback: 'standby',
            },
            timestamp: new Date().toISOString(),
          },
        },
        // 내부 AI 엔진 테스트 API 모킹
        {
          url: '/api/v3/ai',
          method: 'get',
          status: 200,
          response: {
            success: true,
            engine: 'internal',
            status: 'operational',
            performance: {
              avgResponseTime: '250ms',
              successRate: '99.2%',
              uptime: '99.8%',
            },
          },
        },
        // 분석 API POST 모킹
        {
          url: '/api/analyze',
          method: 'post',
          status: 200,
          response: {
            success: true,
            analysis: {
              query: 'AI 엔진 테스트 분석',
              result: {
                confidence: 0.95,
                insights: [
                  'AI 엔진이 정상적으로 작동하고 있습니다.',
                  '모든 메트릭이 정상 범위 내에 있습니다.',
                  '응답 시간이 최적화되어 있습니다.',
                ],
                metrics: {
                  processingTime: 245,
                  accuracy: 0.97,
                  reliability: 0.99,
                },
              },
              engines: {
                primary: 'active',
                fallback: 'ready',
              },
            },
            timestamp: new Date().toISOString(),
          },
        },
      ],
    },
  },
};

export const WithMockAPIErrors: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        // AI 엔진 헬스체크 실패
        {
          url: '/api/analyze',
          method: 'get',
          status: 503,
          response: {
            success: false,
            error: 'AI 엔진 서비스를 사용할 수 없습니다.',
            status: 'unavailable',
          },
        },
        // 내부 AI 엔진 테스트 실패
        {
          url: '/api/v3/ai',
          method: 'get',
          status: 500,
          response: {
            success: false,
            error: '내부 서버 오류가 발생했습니다.',
          },
        },
        // 분석 API 실패
        {
          url: '/api/analyze',
          method: 'post',
          status: 429,
          response: {
            success: false,
            error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
            retryAfter: 60,
          },
        },
      ],
    },
  },
};

export const WithMixedResults: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        // 헬스체크 성공
        {
          url: '/api/analyze',
          method: 'get',
          status: 200,
          response: {
            success: true,
            status: 'healthy',
            version: '2.0.1',
          },
        },
        // 내부 엔진 경고
        {
          url: '/api/v3/ai',
          method: 'get',
          status: 200,
          response: {
            success: true,
            engine: 'internal',
            status: 'degraded',
            warning: '성능이 일시적으로 저하되었습니다.',
            performance: {
              avgResponseTime: '850ms',
              successRate: '94.5%',
              uptime: '99.1%',
            },
          },
        },
        // 분석 API 부분 성공
        {
          url: '/api/analyze',
          method: 'post',
          status: 200,
          response: {
            success: true,
            analysis: {
              query: 'AI 엔진 테스트 분석',
              result: {
                confidence: 0.78,
                insights: [
                  '일부 AI 엔진에서 성능 저하가 감지되었습니다.',
                  '전반적인 시스템은 안정적입니다.',
                  '모니터링이 필요합니다.',
                ],
                warnings: [
                  '응답 시간이 평소보다 느립니다.',
                  '폴백 시스템이 일부 활성화되었습니다.',
                ],
              },
            },
          },
        },
      ],
    },
  },
};

export const LoadingStates: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        // 모든 API에 지연 추가
        {
          url: '/api/analyze',
          method: 'get',
          delay: 3000,
          status: 200,
          response: { success: true, status: 'healthy' },
        },
        {
          url: '/api/v3/ai',
          method: 'get',
          delay: 2000,
          status: 200,
          response: { success: true, engine: 'internal' },
        },
        {
          url: '/api/analyze',
          method: 'post',
          delay: 4000,
          status: 200,
          response: { success: true, analysis: {} },
        },
      ],
    },
  },
};
