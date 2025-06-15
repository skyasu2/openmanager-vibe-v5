import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import {
  SlackNotificationPanel,
  useSlackNotifications,
} from './SlackNotificationPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

// Mock API 응답
const mockSlackAPI = (success: boolean = true, delay: number = 1000) => {
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = async (
      url: string | URL | Request,
      options?: RequestInit
    ) => {
      if (url.toString().includes('/api/slack/send')) {
        await new Promise(resolve => setTimeout(resolve, delay));

        if (success) {
          return new Response(
            JSON.stringify({
              success: true,
              messageId: `msg_${Date.now()}`,
              channel: '#server-alerts',
            }),
            {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        } else {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Slack 웹훅 연결 실패',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
      }
      return originalFetch(url, options);
    };
  }
};

const meta: Meta<typeof SlackNotificationPanel> = {
  title: 'Notifications/SlackNotificationPanel',
  component: SlackNotificationPanel,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Slack 알림 패널 컴포넌트입니다. 

## 주요 특징
- 🔔 **실시간 알림**: #server-alerts 채널로 즉시 전송
- 🎯 **심각도 분류**: critical, high, medium, low 4단계 구분
- ⚡ **빠른 전송**: 15초 타임아웃으로 안정적 전송
- 🔄 **상태 추적**: 전송중/성공/실패 상태 실시간 표시
- 🎨 **시각적 피드백**: 애니메이션과 색상으로 직관적 UX
- 📱 **반응형 UI**: 모바일 및 데스크톱 최적화

## 사용 시나리오
1. **서버 장애 알림**: 긴급한 시스템 이슈 즉시 전파
2. **성능 경고**: 임계치 초과 시 자동 알림
3. **배포 알림**: CI/CD 파이프라인 상태 공유
4. **모니터링 알림**: 실시간 시스템 상태 알림
        `,
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'>
        <div className='container mx-auto p-4'>
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SlackNotificationPanel>;

// 기본 패널
export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '기본 Slack 알림 패널입니다. 다양한 심각도의 테스트 알림을 전송할 수 있습니다.',
      },
    },
  },
  beforeEach: () => {
    mockSlackAPI(true, 800);
  },
};

// 성공적인 알림 전송
export const SuccessfulNotifications: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '알림이 성공적으로 전송되는 시나리오입니다. Slack에 정상적으로 연결되어 있는 상태입니다.',
      },
    },
  },
  beforeEach: () => {
    mockSlackAPI(true, 500);
  },
};

// 전송 실패 시나리오
export const FailedNotifications: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Slack 전송이 실패하는 시나리오입니다. 웹훅 URL이 잘못되었거나 네트워크 오류가 있는 상태입니다.',
      },
    },
  },
  beforeEach: () => {
    mockSlackAPI(false, 800);
  },
};

// 느린 네트워크 시나리오
export const SlowNetwork: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '네트워크가 느린 상황에서의 동작입니다. 로딩 상태가 길게 유지됩니다.',
      },
    },
  },
  beforeEach: () => {
    mockSlackAPI(true, 3000);
  },
};

// 인터랙티브 테스트 패널
export const InteractiveDemo: Story = {
  parameters: {
    docs: {
      description: {
        story:
          '다양한 심각도의 알림을 직접 테스트해볼 수 있는 인터랙티브 데모입니다.',
      },
    },
  },
  render: () => {
    const TestPanel = () => {
      const { notifications, sendSlackNotification, removeNotification } =
        useSlackNotifications();
      const [isLoading, setIsLoading] = useState(false);

      const testAlerts = [
        {
          severity: 'critical' as const,
          message: '🚨 프로덕션 서버 다운! 즉시 확인 필요',
          description: '가장 높은 우선순위 알림',
          emoji: '🚨',
        },
        {
          severity: 'high' as const,
          message: '⚠️ CPU 사용률 90% 초과 - 스케일링 필요',
          description: '높은 우선순위 알림',
          emoji: '⚠️',
        },
        {
          severity: 'medium' as const,
          message: '📊 배포 완료 - 버전 v2.1.0 프로덕션 배포됨',
          description: '중간 우선순위 알림',
          emoji: '📊',
        },
        {
          severity: 'low' as const,
          message: '💡 정기 백업 완료 - 오늘 오전 3시 백업 성공',
          description: '낮은 우선순위 알림',
          emoji: '💡',
        },
      ];

      const handleSendTest = async (alert: (typeof testAlerts)[0]) => {
        setIsLoading(true);
        action(`${alert.severity} 알림 전송`)(alert.message);

        try {
          await sendSlackNotification({
            message: alert.message,
            severity: alert.severity,
          });
        } catch (error) {
          console.error('테스트 알림 전송 실패:', error);
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <div className='space-y-6'>
          {/* 테스트 버튼들 */}
          <Card className='bg-slate-800/50 border-slate-700'>
            <CardHeader>
              <CardTitle className='text-white flex items-center gap-2'>
                🧪 알림 테스트 센터
              </CardTitle>
              <CardDescription className='text-slate-300'>
                다양한 심각도의 Slack 알림을 테스트해보세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {testAlerts.map(alert => (
                  <Button
                    key={alert.severity}
                    onClick={() => handleSendTest(alert)}
                    disabled={isLoading}
                    variant='outline'
                    className={`h-auto p-4 flex-col items-start space-y-2 ${
                      alert.severity === 'critical'
                        ? 'border-red-500 hover:bg-red-500/10'
                        : alert.severity === 'high'
                          ? 'border-orange-500 hover:bg-orange-500/10'
                          : alert.severity === 'medium'
                            ? 'border-blue-500 hover:bg-blue-500/10'
                            : 'border-gray-500 hover:bg-gray-500/10'
                    }`}
                  >
                    <div className='text-2xl'>{alert.emoji}</div>
                    <div className='text-sm font-medium text-left'>
                      {alert.description}
                    </div>
                    <div className='text-xs text-slate-400 text-left'>
                      {alert.message.substring(0, 50)}...
                    </div>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 실제 알림 패널 */}
          <div className='relative'>
            <SlackNotificationPanel />

            {/* 현재 활성 알림 카운터 */}
            {notifications.length > 0 && (
              <Card className='mt-4 bg-purple-900/30 border-purple-500'>
                <CardContent className='pt-4'>
                  <div className='flex items-center justify-between text-purple-200'>
                    <span>활성 알림: {notifications.length}개</span>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={() =>
                        notifications.forEach(n => removeNotification(n.id))
                      }
                      className='text-purple-200 border-purple-500 hover:bg-purple-500/20'
                    >
                      모두 제거
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      );
    };

    return <TestPanel />;
  },
  beforeEach: () => {
    mockSlackAPI(true, 1000);
  },
};

// 카드 내부에서 사용
export const InCard: Story = {
  parameters: {
    docs: {
      description: {
        story: '다른 컴포넌트의 일부로 사용되는 예시입니다.',
      },
    },
  },
  render: () => (
    <Card className='bg-slate-800/50 border-slate-700'>
      <CardHeader>
        <CardTitle className='text-white flex items-center gap-2'>
          🔔 알림 센터
        </CardTitle>
        <CardDescription className='text-slate-300'>
          Slack 채널로 실시간 알림을 전송합니다
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SlackNotificationPanel />
      </CardContent>
    </Card>
  ),
  beforeEach: () => {
    mockSlackAPI(true, 800);
  },
};

// 대시보드 통합 예시
export const DashboardIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story: '관리자 대시보드에 통합된 모습입니다.',
      },
    },
  },
  render: () => (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='text-center space-y-2'>
        <h1 className='text-3xl font-bold text-white'>
          📊 시스템 모니터링 대시보드
        </h1>
        <p className='text-slate-300'>실시간 서버 상태 및 알림 관리</p>
      </div>

      {/* 통계 카드들 */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
        <Card className='bg-green-900/30 border-green-500'>
          <CardContent className='pt-4'>
            <div className='text-center'>
              <div className='text-2xl text-green-400 mb-2'>✅</div>
              <div className='text-green-200 font-medium'>정상 서버</div>
              <div className='text-2xl font-bold text-green-400'>28</div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-yellow-900/30 border-yellow-500'>
          <CardContent className='pt-4'>
            <div className='text-center'>
              <div className='text-2xl text-yellow-400 mb-2'>⚠️</div>
              <div className='text-yellow-200 font-medium'>경고 상태</div>
              <div className='text-2xl font-bold text-yellow-400'>2</div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-red-900/30 border-red-500'>
          <CardContent className='pt-4'>
            <div className='text-center'>
              <div className='text-2xl text-red-400 mb-2'>🚨</div>
              <div className='text-red-200 font-medium'>장애 서버</div>
              <div className='text-2xl font-bold text-red-400'>0</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 알림 패널 */}
      <Card className='bg-slate-800/50 border-slate-700'>
        <CardHeader>
          <CardTitle className='text-white flex items-center gap-2'>
            🔔 Slack 알림 센터
          </CardTitle>
          <CardDescription className='text-slate-300'>
            #server-alerts 채널로 실시간 알림을 전송하고 관리합니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SlackNotificationPanel />
        </CardContent>
      </Card>
    </div>
  ),
  beforeEach: () => {
    mockSlackAPI(true, 1200);
  },
};

// 모바일 버전
export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: '모바일 화면에서의 표시 모습입니다. 반응형 디자인이 적용됩니다.',
      },
    },
  },
  beforeEach: () => {
    mockSlackAPI(true, 600);
  },
};
