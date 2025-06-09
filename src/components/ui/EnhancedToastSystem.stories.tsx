import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import EnhancedToastSystem, { type ServerAlert } from './EnhancedToastSystem';

const meta: Meta<any> = {
  title: 'Components/UI/EnhancedToastSystem',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Shadcn UI 기반의 강화된 토스트 알림 시스템입니다. 서버 모니터링에 최적화된 다양한 알림 타입을 제공합니다.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className='min-h-screen bg-gray-50 p-8'>
        <Story />
        <Toaster />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 토스트 데모를 위한 컨테이너 컴포넌트
const ToastDemo = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className='bg-white rounded-lg shadow-md p-6 mb-6'>
    <h3 className='text-lg font-semibold text-gray-800 mb-4'>{title}</h3>
    <div className='flex flex-wrap gap-3'>{children}</div>
  </div>
);

const BasicToastsDemo = () => (
  <div className='space-y-6'>
    <ToastDemo title='기본 알림 타입'>
      <Button
        onClick={() =>
          EnhancedToastSystem.showSuccess(
            '성공!',
            '작업이 성공적으로 완료되었습니다.'
          )
        }
        className='bg-green-600 hover:bg-green-700'
      >
        성공 알림
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showError('오류 발생', '문제가 발생했습니다.')
        }
        variant='destructive'
      >
        오류 알림
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showWarning('주의', '주의가 필요한 상황입니다.')
        }
        className='bg-yellow-600 hover:bg-yellow-700'
      >
        경고 알림
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showInfo('정보', '참고할 정보입니다.')
        }
        className='bg-blue-600 hover:bg-blue-700'
      >
        정보 알림
      </Button>
    </ToastDemo>

    <ToastDemo title='서버 알림'>
      <Button
        onClick={() => {
          const alert: ServerAlert = {
            id: 'alert_001',
            serverId: 'srv_001',
            serverName: 'Web Server 01',
            type: 'cpu',
            severity: 'critical',
            message: 'CPU 사용률이 95%를 초과했습니다.',
            timestamp: new Date(),
            actionRequired: true,
          };
          EnhancedToastSystem.showServerAlert(alert);
        }}
        variant='destructive'
      >
        Critical 서버 알림
      </Button>
      <Button
        onClick={() => {
          const alert: ServerAlert = {
            id: 'alert_002',
            serverId: 'srv_002',
            serverName: 'DB Server 01',
            type: 'memory',
            severity: 'warning',
            message: '메모리 사용률이 80%를 초과했습니다.',
            timestamp: new Date(),
            actionRequired: false,
          };
          EnhancedToastSystem.showServerAlert(alert);
        }}
        className='bg-yellow-600 hover:bg-yellow-700'
      >
        Warning 서버 알림
      </Button>
      <Button
        onClick={() => {
          const alert: ServerAlert = {
            id: 'alert_003',
            serverId: 'srv_003',
            serverName: 'API Server 01',
            type: 'network',
            severity: 'info',
            message: '네트워크 상태가 정상입니다.',
            timestamp: new Date(),
            actionRequired: false,
          };
          EnhancedToastSystem.showServerAlert(alert);
        }}
        className='bg-blue-600 hover:bg-blue-700'
      >
        Info 서버 알림
      </Button>
    </ToastDemo>

    <ToastDemo title='서버 상태 변경'>
      <Button
        onClick={() =>
          EnhancedToastSystem.showServerStatusChange(
            'Web Server 01',
            'offline',
            'online',
            () => console.log('서버 상세 페이지로 이동')
          )
        }
        className='bg-green-600 hover:bg-green-700'
      >
        서버 복구 알림
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showServerStatusChange(
            'DB Server 02',
            'online',
            'warning',
            () => console.log('서버 상세 페이지로 이동')
          )
        }
        className='bg-yellow-600 hover:bg-yellow-700'
      >
        서버 경고 알림
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showServerStatusChange(
            'API Server 03',
            'warning',
            'offline',
            () => console.log('서버 상세 페이지로 이동')
          )
        }
        variant='destructive'
      >
        서버 다운 알림
      </Button>
    </ToastDemo>

    <ToastDemo title='성능 알림'>
      <Button
        onClick={() =>
          EnhancedToastSystem.showPerformanceAlert(
            'Web Server 01',
            'cpu',
            95,
            80,
            () => console.log('CPU 최적화 실행')
          )
        }
        variant='destructive'
      >
        CPU 임계치 초과
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showPerformanceAlert(
            'DB Server 01',
            'memory',
            85,
            80,
            () => console.log('메모리 최적화 실행')
          )
        }
        className='bg-yellow-600 hover:bg-yellow-700'
      >
        메모리 임계치 초과
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showPerformanceAlert(
            'File Server 01',
            'disk',
            92,
            90,
            () => console.log('디스크 정리 실행')
          )
        }
        variant='destructive'
      >
        디스크 임계치 초과
      </Button>
    </ToastDemo>

    <ToastDemo title='배치 알림 & AI 분석'>
      <Button
        onClick={() =>
          EnhancedToastSystem.showBatchAlert(
            '다중 서버 경고',
            ['Web Server 01', 'Web Server 02', 'API Server 01'],
            'warning',
            () => console.log('전체 서버 상태 확인')
          )
        }
        className='bg-yellow-600 hover:bg-yellow-700'
      >
        배치 경고 알림
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showBatchAlert(
            '시스템 전체 장애',
            ['DB Server 01', 'DB Server 02', 'Cache Server 01'],
            'critical',
            () => console.log('긴급 대응 프로세스 실행')
          )
        }
        variant='destructive'
      >
        배치 Critical 알림
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showAIAnalysisComplete(
            '성능 트렌드 분석',
            5,
            () => console.log('AI 분석 결과 확인')
          )
        }
        className='bg-purple-600 hover:bg-purple-700'
      >
        AI 분석 완료
      </Button>
    </ToastDemo>

    <ToastDemo title='액션 버튼이 있는 알림'>
      <Button
        onClick={() =>
          EnhancedToastSystem.showSuccess(
            '백업 완료',
            '데이터베이스 백업이 성공적으로 완료되었습니다.',
            {
              action: {
                label: '다운로드',
                onClick: () => console.log('백업 파일 다운로드'),
              },
            }
          )
        }
        className='bg-green-600 hover:bg-green-700'
      >
        액션 버튼 포함 성공
      </Button>
      <Button
        onClick={() =>
          EnhancedToastSystem.showError(
            '연결 실패',
            '데이터베이스 연결에 실패했습니다.',
            {
              action: {
                label: '재시도',
                onClick: () => console.log('데이터베이스 재연결 시도'),
              },
            }
          )
        }
        variant='destructive'
      >
        액션 버튼 포함 오류
      </Button>
    </ToastDemo>
  </div>
);

export const Default: Story = {
  render: () => <BasicToastsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          '다양한 타입의 토스트 알림을 테스트할 수 있습니다. 버튼을 클릭하여 각 알림을 확인하세요.',
      },
    },
  },
};

export const ServerAlerts: Story = {
  render: () => (
    <div className='space-y-6'>
      <ToastDemo title='서버 모니터링 알림 시뮬레이션'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full'>
          <Button
            onClick={() => {
              // 연속적인 알림 시뮬레이션
              setTimeout(() => {
                const alert1: ServerAlert = {
                  id: 'alert_sim_001',
                  serverId: 'srv_web_01',
                  serverName: 'Web Server 01',
                  type: 'cpu',
                  severity: 'warning',
                  message: 'CPU 사용률 상승 감지',
                  timestamp: new Date(),
                  actionRequired: false,
                };
                EnhancedToastSystem.showServerAlert(alert1);
              }, 500);

              setTimeout(() => {
                const alert2: ServerAlert = {
                  id: 'alert_sim_002',
                  serverId: 'srv_web_01',
                  serverName: 'Web Server 01',
                  type: 'cpu',
                  severity: 'critical',
                  message: 'CPU 사용률이 95%를 초과했습니다!',
                  timestamp: new Date(),
                  actionRequired: true,
                };
                EnhancedToastSystem.showServerAlert(alert2);
              }, 2000);

              setTimeout(() => {
                EnhancedToastSystem.showServerStatusChange(
                  'Web Server 01',
                  'critical',
                  'warning'
                );
              }, 4000);

              setTimeout(() => {
                EnhancedToastSystem.showSuccess(
                  '자동 복구 완료',
                  'Web Server 01이 정상 상태로 복구되었습니다.'
                );
              }, 6000);
            }}
            className='bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-600 hover:to-red-700'
          >
            서버 장애 시나리오
          </Button>
        </div>
      </ToastDemo>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '실제 서버 모니터링 상황을 시뮬레이션한 연속적인 알림을 보여줍니다.',
      },
    },
  },
};

export const CustomDurations: Story = {
  render: () => (
    <div className='space-y-6'>
      <ToastDemo title='다양한 지속 시간'>
        <Button
          onClick={() =>
            EnhancedToastSystem.showInfo('짧은 알림', '2초 후 사라집니다.', {
              duration: 2000,
            })
          }
          size='sm'
        >
          2초 (짧음)
        </Button>
        <Button
          onClick={() =>
            EnhancedToastSystem.showWarning('보통 알림', '5초 후 사라집니다.', {
              duration: 5000,
            })
          }
          size='sm'
        >
          5초 (보통)
        </Button>
        <Button
          onClick={() =>
            EnhancedToastSystem.showError('긴 알림', '10초 후 사라집니다.', {
              duration: 10000,
            })
          }
          size='sm'
        >
          10초 (김)
        </Button>
        <Button
          onClick={() =>
            EnhancedToastSystem.showError(
              '영구 알림',
              '수동으로 닫아야 합니다.',
              { duration: 0 }
            )
          }
          size='sm'
          variant='destructive'
        >
          영구 (수동 닫기)
        </Button>
      </ToastDemo>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '다양한 지속 시간을 가진 토스트 알림들을 테스트할 수 있습니다.',
      },
    },
  },
};
