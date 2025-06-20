import type { Meta, StoryObj } from '@storybook/nextjs';
import GeminiLearningDashboard from './GeminiLearningDashboard';

const meta: Meta<typeof GeminiLearningDashboard> = {
  title: 'AI Components/GeminiLearningDashboard',
  component: GeminiLearningDashboard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '🤖 Gemini 학습 엔진 대시보드 - 자동 컨텍스트 학습 및 개선 제안 시스템',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ActiveLearning: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai-agent/learning/gemini-status',
          method: 'get',
          status: 200,
          response: {
            success: true,
            status: {
              enabled: true,
              dailyRequestCount: 847,
              maxDailyRequests: 1500,
              remainingRequests: 653,
              pendingSuggestions: 12,
              lastReset: '2025-06-11T00:00:00Z',
              config: {
                batchSize: 10,
                requestInterval: 300000,
                confidenceThreshold: 0.8,
              },
            },
          },
        },
        {
          url: '/api/ai-agent/learning/suggestions',
          method: 'get',
          status: 200,
          response: {
            success: true,
            suggestions: [
              {
                id: 'suggestion-1',
                title: '서버 메모리 최적화 패턴',
                type: 'pattern',
                confidence: 0.94,
                priority: 'critical',
                estimatedImprovement: 25,
                sourceLogCount: 47,
                reasoning:
                  '최근 24시간 동안 메모리 부족으로 인한 장애가 빈번하게 발생. 메모리 사용 패턴을 분석하여 최적화 방안을 제시.',
                timestamp: '2025-06-11T15:30:00Z',
              },
              {
                id: 'suggestion-2',
                title: 'API 응답 시간 개선 템플릿',
                type: 'template',
                confidence: 0.87,
                priority: 'high',
                estimatedImprovement: 18,
                sourceLogCount: 32,
                reasoning:
                  'API 응답 시간이 점진적으로 증가하는 패턴 감지. 캐싱 전략 및 쿼리 최적화 템플릿 추가 필요.',
                timestamp: '2025-06-11T14:45:00Z',
              },
              {
                id: 'suggestion-3',
                title: 'Docker 컨테이너 모니터링 문서',
                type: 'document',
                confidence: 0.82,
                priority: 'medium',
                estimatedImprovement: 12,
                sourceLogCount: 18,
                reasoning:
                  '컨테이너 관련 문제 해결 시 참조할 수 있는 문서가 부족. 표준 모니터링 절차 문서화 필요.',
                timestamp: '2025-06-11T13:20:00Z',
              },
            ],
          },
        },
        {
          url: '/api/ai-agent/learning/history',
          method: 'get',
          status: 200,
          response: {
            success: true,
            history: [
              {
                success: true,
                message: '3개의 새로운 개선 제안을 분석했습니다.',
                suggestionsCount: 3,
                executionTime: 4250,
                suggestions: [],
                timestamp: '2025-06-11T15:00:00Z',
              },
              {
                success: true,
                message: '5개의 새로운 개선 제안을 분석했습니다.',
                suggestionsCount: 5,
                executionTime: 3890,
                suggestions: [],
                timestamp: '2025-06-11T10:00:00Z',
              },
            ],
          },
        },
      ],
    },
  },
};

export const LimitReached: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai-agent/learning/gemini-status',
          method: 'get',
          status: 200,
          response: {
            success: true,
            status: {
              enabled: true,
              dailyRequestCount: 1500,
              maxDailyRequests: 1500,
              remainingRequests: 0,
              pendingSuggestions: 0,
              lastReset: '2025-06-11T00:00:00Z',
              config: {
                batchSize: 10,
                requestInterval: 300000,
                confidenceThreshold: 0.8,
              },
            },
          },
        },
        {
          url: '/api/ai-agent/learning/suggestions',
          method: 'get',
          status: 200,
          response: {
            success: true,
            suggestions: [],
          },
        },
        {
          url: '/api/ai-agent/learning/history',
          method: 'get',
          status: 200,
          response: {
            success: true,
            history: [
              {
                success: false,
                message:
                  '일일 API 호출 한도에 도달했습니다. 내일 다시 시도해 주세요.',
                suggestionsCount: 0,
                executionTime: 150,
                suggestions: [],
                timestamp: '2025-06-11T23:45:00Z',
              },
            ],
          },
        },
      ],
    },
  },
};

export const DisabledState: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai-agent/learning/gemini-status',
          method: 'get',
          status: 200,
          response: {
            success: true,
            status: {
              enabled: false,
              dailyRequestCount: 0,
              maxDailyRequests: 1500,
              remainingRequests: 1500,
              pendingSuggestions: 0,
              lastReset: '2025-06-11T00:00:00Z',
              config: {
                batchSize: 10,
                requestInterval: 300000,
                confidenceThreshold: 0.8,
              },
            },
          },
        },
        {
          url: '/api/ai-agent/learning/suggestions',
          method: 'get',
          status: 200,
          response: {
            success: true,
            suggestions: [],
          },
        },
        {
          url: '/api/ai-agent/learning/history',
          method: 'get',
          status: 200,
          response: {
            success: true,
            history: [],
          },
        },
      ],
    },
  },
};

export const LoadingState: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai-agent/learning/gemini-status',
          method: 'get',
          delay: 3000,
          status: 200,
          response: {
            success: true,
            status: {
              enabled: true,
              dailyRequestCount: 500,
              maxDailyRequests: 1500,
              remainingRequests: 1000,
              pendingSuggestions: 5,
              lastReset: '2025-06-11T00:00:00Z',
              config: {
                batchSize: 10,
                requestInterval: 300000,
                confidenceThreshold: 0.8,
              },
            },
          },
        },
      ],
    },
  },
};

export const HighActivityPeriod: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai-agent/learning/gemini-status',
          method: 'get',
          status: 200,
          response: {
            success: true,
            status: {
              enabled: true,
              dailyRequestCount: 1350,
              maxDailyRequests: 1500,
              remainingRequests: 150,
              pendingSuggestions: 25,
              lastReset: '2025-06-11T00:00:00Z',
              config: {
                batchSize: 15,
                requestInterval: 180000,
                confidenceThreshold: 0.75,
              },
            },
          },
        },
        {
          url: '/api/ai-agent/learning/suggestions',
          method: 'get',
          status: 200,
          response: {
            success: true,
            suggestions: [
              {
                id: 'suggestion-urgent-1',
                title: '급격한 트래픽 증가 대응 패턴',
                type: 'pattern',
                confidence: 0.97,
                priority: 'critical',
                estimatedImprovement: 35,
                sourceLogCount: 89,
                reasoning:
                  '예상보다 3배 높은 트래픽이 감지됨. 자동 스케일링 및 로드 밸런싱 최적화 필요.',
                timestamp: '2025-06-11T16:45:00Z',
              },
            ],
          },
        },
      ],
    },
  },
};
