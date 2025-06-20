/**
 * 📚 NotificationToast Storybook Stories
 *
 * 실시간 알림 토스트 컴포넌트 문서화
 * - 시스템 이벤트 실시간 표시
 * - 심각도별 색상 구분
 * - 자동 사라짐 및 스택형 알림
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { NotificationToast } from './NotificationToast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AISidebar } from '../../presentation/ai-sidebar';

const meta: Meta<typeof NotificationToast> = {
  title: 'System/NotificationToast',
  component: NotificationToast,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
**🔔 NotificationToast Component**

실시간 시스템 이벤트를 표시하는 토스트 알림 컴포넌트입니다.

### 🚀 주요 기능
- **실시간 알림**: 시스템 이벤트 실시간 감지 및 표시
- **심각도별 스타일**: critical, warning, info 색상 구분
- **자동 사라짐**: 5초 후 자동 제거 (critical은 수동)
- **스택형 표시**: 여러 알림 겹쳐서 표시
- **사운드 효과**: 심각도별 다른 알림음
- **필터링 시스템**: 시스템 초기화 알림 자동 필터링

### 🎨 알림 유형
- **connection_change**: 연결 상태 변경
- **server_health**: 서버 상태 변경  
- **system_alert**: 시스템 알림
- **ai_analysis**: AI 분석 결과
- **data_sync**: 데이터 동기화

### 💡 사용법
\`\`\`tsx
<NotificationToast
  maxNotifications={5}
  autoHideDuration={5000}
  enableSound={true}
  position="top-right"
/>
\`\`\`
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    maxNotifications: {
      control: { type: 'number', min: 1, max: 10 },
      description: '최대 표시 알림 개수',
      defaultValue: 5,
    },
    autoHideDuration: {
      control: { type: 'number', min: 1000, max: 30000, step: 1000 },
      description: '자동 숨김 시간 (밀리초)',
      defaultValue: 5000,
    },
    enableSound: {
      control: 'boolean',
      description: '알림 사운드 활성화',
      defaultValue: true,
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      description: '알림 위치',
      defaultValue: 'top-right',
    },
  },
  decorators: [
    Story => (
      <div className='relative min-h-screen bg-gray-100'>
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='text-center p-8'>
            <h2 className='text-2xl font-bold text-gray-800 mb-4'>
              NotificationToast 테스트 환경
            </h2>
            <p className='text-gray-600 mb-8'>
              우측 상단에 실시간 알림이 표시됩니다.
              <br />
              아래 버튼들을 클릭하여 다양한 알림을 테스트해보세요.
            </p>

            <TestControls />
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof NotificationToast>;

// 테스트 컨트롤 컴포넌트
const TestControls: React.FC = () => {
  const [eventCount, setEventCount] = useState(0);

  const triggerEvent = (
    type: string,
    severity: 'info' | 'warning' | 'critical',
    message: string,
    metadata?: any
  ) => {
    const event = new CustomEvent('system-event', {
      detail: {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        severity,
        message,
        timestamp: new Date(),
        metadata,
      },
    });

    window.dispatchEvent(event);
    setEventCount(prev => prev + 1);
  };

  const triggerSequence = () => {
    // 연속적인 알림 시퀀스 시뮬레이션
    setTimeout(
      () =>
        triggerEvent('server_health', 'info', 'Web Server 01 연결 확인 중...'),
      100
    );
    setTimeout(
      () =>
        triggerEvent(
          'server_health',
          'warning',
          'Web Server 01 응답 시간 증가 감지'
        ),
      2000
    );
    setTimeout(
      () =>
        triggerEvent(
          'ai_analysis',
          'info',
          'AI 분석 시작: 성능 저하 패턴 감지'
        ),
      3500
    );
    setTimeout(
      () =>
        triggerEvent(
          'server_health',
          'critical',
          'Web Server 01 CPU 사용률 95% 초과!'
        ),
      5000
    );
    setTimeout(
      () => triggerEvent('system_alert', 'warning', '자동 스케일링 시작...'),
      6500
    );
    setTimeout(
      () => triggerEvent('server_health', 'info', 'Web Server 02 추가 시작'),
      8000
    );
    setTimeout(
      () =>
        triggerEvent(
          'system_alert',
          'info',
          'Load Balancer 설정 업데이트 완료'
        ),
      9500
    );
  };

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader>
        <CardTitle>🧪 알림 테스트 컨트롤</CardTitle>
        <p className='text-sm text-gray-600'>발생한 이벤트: {eventCount}개</p>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* 기본 알림 테스트 */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <Button
            onClick={() =>
              triggerEvent('system_alert', 'info', '시스템 정상 동작 중')
            }
            className='bg-blue-600 hover:bg-blue-700'
          >
            Info 알림
          </Button>
          <Button
            onClick={() =>
              triggerEvent(
                'server_health',
                'warning',
                'DB Server 메모리 사용률 80% 초과'
              )
            }
            className='bg-yellow-600 hover:bg-yellow-700'
          >
            Warning 알림
          </Button>
          <Button
            onClick={() =>
              triggerEvent(
                'server_health',
                'critical',
                'API Server 응답 없음 - 즉시 조치 필요!'
              )
            }
            variant='destructive'
          >
            Critical 알림
          </Button>
        </div>

        {/* 특수 시나리오 */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
          <Button
            onClick={() =>
              triggerEvent(
                'ai_analysis',
                'info',
                'AI 예측: 다음 2시간 내 트래픽 급증 예상',
                {
                  prediction: 'traffic_spike',
                  confidence: 0.87,
                  timeframe: '2h',
                }
              )
            }
            className='bg-purple-600 hover:bg-purple-700'
          >
            AI 분석 알림
          </Button>
          <Button
            onClick={() =>
              triggerEvent(
                'data_sync',
                'warning',
                '실시간 데이터 동기화 지연 발생',
                {
                  delay: '15s',
                  affected_metrics: ['cpu', 'memory'],
                }
              )
            }
            className='bg-orange-600 hover:bg-orange-700'
          >
            데이터 동기화 알림
          </Button>
        </div>

        {/* 연속 시나리오 */}
        <div className='border-t pt-4'>
          <Button
            onClick={triggerSequence}
            className='w-full bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700'
          >
            🎬 연속 장애 시나리오 실행
          </Button>
          <p className='text-xs text-gray-500 mt-2 text-center'>
            9초에 걸쳐 7개의 연속 알림이 발생합니다
          </p>
        </div>

        {/* 스팸 테스트 */}
        <div className='border-t pt-4'>
          <Button
            onClick={() => {
              for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                  triggerEvent(
                    'server_health',
                    i % 3 === 0 ? 'critical' : i % 3 === 1 ? 'warning' : 'info',
                    `서버 ${String.fromCharCode(65 + i)} 상태 업데이트 #${i + 1}`,
                    {
                      serverId: `srv_${String.fromCharCode(65 + i).toLowerCase()}`,
                    }
                  );
                }, i * 500);
              }
            }}
            variant='outline'
            className='w-full'
          >
            📊 대량 알림 테스트 (8개)
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// 기본 스토리
export const Default: Story = {
  args: {
    maxNotifications: 5,
    autoHideDuration: 5000,
    enableSound: true,
    position: 'top-right',
  },
};

// 컴팩트 모드
export const Compact: Story = {
  args: {
    maxNotifications: 3,
    autoHideDuration: 3000,
    enableSound: false,
    position: 'top-right',
  },
  parameters: {
    docs: {
      description: {
        story: '**컴팩트 모드**: 최대 3개 알림, 3초 자동 숨김, 사운드 비활성화',
      },
    },
  },
};

// 왼쪽 상단 위치
export const TopLeft: Story = {
  args: {
    maxNotifications: 5,
    autoHideDuration: 5000,
    enableSound: true,
    position: 'top-left',
  },
  parameters: {
    docs: {
      description: {
        story: '**왼쪽 상단**: 알림이 화면 왼쪽 상단에 표시됩니다.',
      },
    },
  },
};

// 하단 위치
export const BottomRight: Story = {
  args: {
    maxNotifications: 4,
    autoHideDuration: 7000,
    enableSound: true,
    position: 'bottom-right',
  },
  parameters: {
    docs: {
      description: {
        story: '**우측 하단**: 알림이 화면 우측 하단에 표시됩니다.',
      },
    },
  },
};

// 긴 지속 시간
export const LongDuration: Story = {
  args: {
    maxNotifications: 6,
    autoHideDuration: 15000,
    enableSound: true,
    position: 'top-right',
  },
  parameters: {
    docs: {
      description: {
        story:
          '**긴 지속시간**: 15초 동안 알림이 유지되며, 최대 6개까지 표시됩니다.',
      },
    },
  },
};

// 사운드 비활성화
export const NoSound: Story = {
  args: {
    maxNotifications: 5,
    autoHideDuration: 5000,
    enableSound: false,
    position: 'top-right',
  },
  parameters: {
    docs: {
      description: {
        story: '**사운드 비활성화**: 알림 사운드가 재생되지 않습니다.',
      },
    },
  },
};

// 대량 알림 처리
export const HighVolume: Story = {
  args: {
    maxNotifications: 8,
    autoHideDuration: 4000,
    enableSound: false, // 대량 알림 시 사운드 비활성화 권장
    position: 'top-right',
  },
  parameters: {
    docs: {
      description: {
        story: '**대량 알림**: 최대 8개 알림을 동시에 처리할 수 있습니다.',
      },
    },
  },
};

/**
 * ✨ AI 사이드바 개선 기능 스토리
 *
 * - 재질문 기능 테스트
 * - 실제 로그 표시 테스트
 * - 접기/펴기 애니메이션 테스트
 * - 사고과정 단계별 로그 표시 테스트
 */

// ✨ AI 사이드바 테스트 래퍼 컴포넌트
const AISidebarTestWrapper = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className='relative w-full h-screen bg-gray-100'>
      <div className='p-4'>
        <h1 className='text-2xl font-bold text-gray-900 mb-4'>
          AI 사이드바 개선 기능 테스트
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors'
        >
          {isOpen ? '사이드바 닫기' : '사이드바 열기'}
        </button>

        <div className='mt-4 space-y-2 text-sm text-gray-600'>
          <p>
            🔍 <strong>테스트 기능:</strong>
          </p>
          <ul className='list-disc list-inside space-y-1 ml-4'>
            <li>프리셋 질문 클릭 → 사고과정 및 실제 로그 표시</li>
            <li>사고과정 접기/펴기 애니메이션</li>
            <li>단계별 로그 표시 토글</li>
            <li>재질문 버튼 클릭</li>
            <li>처리 중일 때 클릭 방지</li>
          </ul>
        </div>
      </div>

      <AISidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </div>
  );
};

// ✨ 새로운 스토리 추가
export const AISidebarImproved: StoryObj<typeof AISidebarTestWrapper> = {
  name: '🤖 AI 사이드바 개선 기능',
  render: () => <AISidebarTestWrapper />,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story: `
### 🎯 AI 사이드바 개선 사항

**주요 개선 기능:**
1. **재질문 기능**: 완료된 질문에 재질문 버튼 추가
2. **실제 로그 표시**: 시스템 로그를 질문 유형에 따라 생성 및 표시
3. **접기/펴기 애니메이션**: 사고과정과 로그 영역을 접을 수 있음
4. **단계별 로그**: 각 사고 단계별로 관련 로그를 분류해서 표시
5. **처리 상태 개선**: 처리 중일 때 클릭 방지 및 상태 표시

**테스트 방법:**
1. 프리셋 질문 중 하나를 클릭
2. 사고과정이 단계별로 진행되는 것 확인
3. 완료 후 재질문 버튼 클릭
4. 사고과정 헤더 클릭으로 접기/펴기 테스트
5. 각 단계의 로그 토글 버튼 테스트
        `,
      },
    },
  },
};
