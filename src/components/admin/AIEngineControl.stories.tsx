import type { Meta, StoryObj } from '@storybook/react';
import AIEngineControl from './AIEngineControl';

const meta: Meta<typeof AIEngineControl> = {
  title: 'Admin Components/AIEngineControl',
  component: AIEngineControl,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '🤖 AI 엔진 제어 컴포넌트 - MCP와 RAG 모드 간 전환 및 상태 모니터링',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const MCPMode: Story = {
  parameters: {
    docs: {
      description: {
        story: 'MCP (Model Context Protocol) 모드가 활성화된 상태입니다.',
      },
    },
  },
};

export const RAGMode: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'RAG (Retrieval-Augmented Generation) 모드가 활성화된 상태입니다.',
      },
    },
  },
};

export const AutoMode: Story = {
  parameters: {
    docs: {
      description: {
        story: '자동 모드에서 상황에 따라 최적의 AI 엔진을 선택합니다.',
      },
    },
  },
};

export const HealthySystem: Story = {
  parameters: {
    docs: {
      description: {
        story: '모든 시스템이 정상적으로 작동하는 상태입니다.',
      },
    },
  },
};

export const DegradedPerformance: Story = {
  parameters: {
    docs: {
      description: {
        story: '성능이 저하된 상태로 폴백 시스템이 동작할 수 있습니다.',
      },
    },
  },
};

export const OperationalState: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai/engines/status',
          method: 'get',
          status: 200,
          response: {
            success: true,
            engines: {
              masterAI: {
                status: 'operational',
                version: 'v4.0.0',
                uptime: '99.8%',
                lastResponse: '125ms',
                memory: '68MB',
                fallbackReady: true,
              },
              openAI: {
                status: 'operational',
                version: 'gpt-4',
                uptime: '99.9%',
                lastResponse: '850ms',
                requests: 1024,
                fallbackReady: true,
              },
              claude: {
                status: 'operational',
                version: 'claude-3',
                uptime: '99.7%',
                lastResponse: '720ms',
                requests: 856,
                fallbackReady: true,
              },
              gemini: {
                status: 'operational',
                version: 'gemini-pro',
                uptime: '99.5%',
                lastResponse: '650ms',
                requests: 642,
                fallbackReady: true,
              },
            },
            metrics: {
              totalRequests: 3247,
              avgResponseTime: '612ms',
              errorRate: '0.2%',
              fallbackActivations: 5,
            },
          },
        },
      ],
    },
  },
};

export const PartialDegradation: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai/engines/status',
          method: 'get',
          status: 200,
          response: {
            success: true,
            engines: {
              masterAI: {
                status: 'operational',
                version: 'v4.0.0',
                uptime: '99.8%',
                lastResponse: '125ms',
                memory: '68MB',
                fallbackReady: true,
              },
              openAI: {
                status: 'degraded',
                version: 'gpt-4',
                uptime: '94.2%',
                lastResponse: '2.1s',
                requests: 1024,
                error: '응답 시간 초과가 자주 발생하고 있습니다.',
                fallbackReady: true,
              },
              claude: {
                status: 'error',
                version: 'claude-3',
                uptime: '85.3%',
                lastResponse: 'timeout',
                requests: 856,
                error: 'API 키 문제로 연결할 수 없습니다.',
                fallbackReady: false,
              },
              gemini: {
                status: 'operational',
                version: 'gemini-pro',
                uptime: '99.5%',
                lastResponse: '650ms',
                requests: 642,
                fallbackReady: true,
              },
            },
            metrics: {
              totalRequests: 3247,
              avgResponseTime: '1.2s',
              errorRate: '12.8%',
              fallbackActivations: 47,
            },
            warnings: [
              'Claude API 연결 실패',
              'OpenAI 응답 시간 증가',
              '폴백 시스템이 활발히 작동 중',
            ],
          },
        },
      ],
    },
  },
};

export const MaintenanceMode: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai/engines/status',
          method: 'get',
          status: 200,
          response: {
            success: true,
            engines: {
              masterAI: {
                status: 'maintenance',
                version: 'v4.0.0',
                message: '정기 점검을 위해 일시 중단되었습니다.',
                scheduledEnd: '2025-06-12T02:00:00Z',
              },
              openAI: {
                status: 'disabled',
                version: 'gpt-4',
                message: '관리자에 의해 비활성화되었습니다.',
                fallbackReady: false,
              },
              claude: {
                status: 'operational',
                version: 'claude-3',
                uptime: '99.7%',
                lastResponse: '720ms',
                requests: 856,
                fallbackReady: true,
                note: '현재 주 엔진으로 작동 중',
              },
              gemini: {
                status: 'standby',
                version: 'gemini-pro',
                message: '폴백 대기 모드',
                fallbackReady: true,
              },
            },
            metrics: {
              totalRequests: 3247,
              avgResponseTime: '720ms',
              errorRate: '0.1%',
              fallbackActivations: 0,
            },
            maintenanceInfo: {
              isActive: true,
              reason: '성능 최적화 및 보안 업데이트',
              estimatedEnd: '2025-06-12T02:00:00Z',
              affectedEngines: ['masterAI', 'openAI'],
            },
          },
        },
      ],
    },
  },
};

export const EmergencyFallback: Story = {
  parameters: {
    mockingIsEnabled: true,
    msw: {
      handlers: [
        {
          url: '/api/ai/engines/status',
          method: 'get',
          status: 200,
          response: {
            success: true,
            emergency: true,
            engines: {
              masterAI: {
                status: 'error',
                version: 'v4.0.0',
                error: '심각한 시스템 오류 발생',
                lastResponse: 'N/A',
                fallbackReady: false,
              },
              openAI: {
                status: 'error',
                version: 'gpt-4',
                error: 'API 서비스 장애',
                fallbackReady: false,
              },
              claude: {
                status: 'error',
                version: 'claude-3',
                error: '네트워크 연결 실패',
                fallbackReady: false,
              },
              gemini: {
                status: 'fallback_active',
                version: 'gemini-pro',
                uptime: '99.5%',
                lastResponse: '1.2s',
                requests: 89,
                message: '긴급 폴백 모드로 모든 요청 처리 중',
                fallbackReady: true,
              },
            },
            metrics: {
              totalRequests: 156,
              avgResponseTime: '1.2s',
              errorRate: '75.2%',
              fallbackActivations: 156,
            },
            emergencyInfo: {
              startTime: '2025-06-11T15:30:00Z',
              reason: '다중 엔진 동시 장애',
              severity: 'critical',
              activeCountermeasures: [
                'Gemini 단독 운영',
                '응답 시간 완화',
                '자동 복구 시도 중',
              ],
            },
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
          url: '/api/ai/engines/status',
          method: 'get',
          delay: 3000,
          status: 200,
          response: {
            success: true,
            engines: {},
          },
        },
      ],
    },
  },
};
