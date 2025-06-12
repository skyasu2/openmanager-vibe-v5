import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { GoogleAIUnlock } from './GoogleAIUnlock';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Mock Google AI Manager for Storybook
const mockGoogleAIManager = {
  getKeyStatus: () => ({
    isAvailable: false,
    needsUnlock: true,
    source: 'team' as const,
  }),
};

// 전역 모킹
if (typeof window !== 'undefined') {
  (window as any).googleAIManager = mockGoogleAIManager;
}

const meta: Meta<typeof GoogleAIUnlock> = {
  title: 'Security/GoogleAIUnlock',
  component: GoogleAIUnlock,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Google AI 기능 잠금 해제 컴포넌트입니다. 

## 주요 특징
- 🔐 **보안 잠금**: 팀 비밀번호로 Google AI 기능 보호
- 🎯 **상태 관리**: 사용 가능/잠금/설정 필요 상태 자동 감지
- 🔑 **인증 플로우**: 안전한 비밀번호 인증 프로세스
- 💡 **사용자 가이드**: 설정 방법에 대한 명확한 안내
- 🚀 **자동 해제**: 인증 성공 시 자동으로 기능 활성화

## 사용 시나리오
1. **개인 환경변수**: 개발자가 직접 API 키 설정
2. **팀 설정**: 관리자가 제공한 비밀번호로 팀 전체 사용
3. **보안 제어**: 민감한 AI 기능에 대한 접근 제어
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onUnlocked: {
      description: '잠금 해제 성공 시 호출되는 콜백 함수',
      action: 'unlocked',
    },
    children: {
      description: '잠금 해제 후 표시할 컨텐츠',
      control: { type: 'text' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GoogleAIUnlock>;

// 기본 잠금 상태
export const Default: Story = {
  args: {
    onUnlocked: action('Google AI 잠금 해제됨'),
  },
  parameters: {
    docs: {
      description: {
        story:
          '기본 잠금 상태입니다. "Google AI 잠금 해제" 버튼을 클릭하여 모달을 열 수 있습니다.',
      },
    },
  },
};

// 설정이 필요한 상태 (환경변수 없음)
export const ConfigurationNeeded: Story = {
  args: {
    onUnlocked: action('Google AI 잠금 해제됨'),
  },
  parameters: {
    docs: {
      description: {
        story:
          '환경변수나 팀 설정이 없는 상태입니다. 설정 방법에 대한 가이드를 제공합니다.',
      },
    },
  },
  beforeEach: () => {
    // Mock for configuration needed state
    if (typeof window !== 'undefined') {
      (window as any).googleAIManager = {
        getKeyStatus: () => ({
          isAvailable: false,
          needsUnlock: false,
          source: 'none' as const,
        }),
      };
    }
  },
};

// 이미 사용 가능한 상태
export const AlreadyAvailable: Story = {
  args: {
    onUnlocked: action('Google AI 잠금 해제됨'),
    children: (
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            🤖 Google AI 활성화됨
          </CardTitle>
          <CardDescription>
            Google AI 기능이 정상적으로 사용 가능합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span>상태:</span>
              <span className='text-green-600 font-medium'>✅ 활성화</span>
            </div>
            <div className='flex justify-between'>
              <span>API 키:</span>
              <span className='font-mono text-xs'>AIza***...***vM</span>
            </div>
            <div className='flex justify-between'>
              <span>모델:</span>
              <span>Gemini Pro</span>
            </div>
          </div>
        </CardContent>
      </Card>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Google AI가 이미 사용 가능한 상태입니다. 잠금 해제 UI 없이 바로 children을 렌더링합니다.',
      },
    },
  },
  beforeEach: () => {
    // Mock for available state
    if (typeof window !== 'undefined') {
      (window as any).googleAIManager = {
        getKeyStatus: () => ({
          isAvailable: true,
          needsUnlock: false,
          source: 'env' as const,
        }),
      };
    }
  },
};

// 카드로 감싸진 버전
export const InCard: Story = {
  args: {
    onUnlocked: action('Google AI 잠금 해제됨'),
  },
  parameters: {
    docs: {
      description: {
        story: '카드 컴포넌트 안에서 사용되는 예시입니다.',
      },
    },
  },
  render: args => (
    <Card className='w-full max-w-md'>
      <CardHeader>
        <CardTitle>🔐 보안 기능</CardTitle>
        <CardDescription>
          고급 AI 기능을 사용하려면 인증이 필요합니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <GoogleAIUnlock {...args} />
      </CardContent>
    </Card>
  ),
};

// 대시보드 스타일
export const DashboardStyle: Story = {
  args: {
    onUnlocked: action('Google AI 잠금 해제됨'),
  },
  parameters: {
    docs: {
      description: {
        story: '관리자 대시보드에서 사용되는 스타일입니다.',
      },
    },
  },
  render: args => (
    <div className='space-y-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 rounded-lg'>
      <div className='text-center space-y-2'>
        <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
          🤖 AI 기능 센터
        </h2>
        <p className='text-gray-600 dark:text-gray-300'>
          고급 분석 및 예측 기능에 액세스하세요
        </p>
      </div>

      <div className='flex justify-center'>
        <GoogleAIUnlock {...args} />
      </div>

      <div className='grid grid-cols-3 gap-4 mt-6'>
        <div className='text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm'>
          <div className='text-2xl mb-1'>📊</div>
          <div className='text-sm font-medium'>예측 분석</div>
        </div>
        <div className='text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm'>
          <div className='text-2xl mb-1'>🔍</div>
          <div className='text-sm font-medium'>이상 탐지</div>
        </div>
        <div className='text-center p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm'>
          <div className='text-2xl mb-1'>💡</div>
          <div className='text-sm font-medium'>인사이트</div>
        </div>
      </div>
    </div>
  ),
};

// 인라인 사용 예시
export const InlineUsage: Story = {
  args: {
    onUnlocked: action('Google AI 잠금 해제됨'),
  },
  parameters: {
    docs: {
      description: {
        story: '다른 컴포넌트들과 함께 인라인으로 사용되는 예시입니다.',
      },
    },
  },
  render: args => (
    <div className='space-y-4 max-w-2xl'>
      <div className='flex items-center justify-between p-4 border rounded-lg'>
        <div>
          <h3 className='font-medium'>서버 성능 예측</h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            AI를 활용한 서버 부하 예측 분석
          </p>
        </div>
        <GoogleAIUnlock {...args} />
      </div>

      <div className='flex items-center justify-between p-4 border rounded-lg'>
        <div>
          <h3 className='font-medium'>이상 패턴 감지</h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            실시간 시스템 모니터링 및 이상 탐지
          </p>
        </div>
        <GoogleAIUnlock {...args} />
      </div>

      <div className='flex items-center justify-between p-4 border rounded-lg'>
        <div>
          <h3 className='font-medium'>스마트 알림</h3>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            지능형 알림 시스템 및 우선순위 분석
          </p>
        </div>
        <GoogleAIUnlock {...args} />
      </div>
    </div>
  ),
};

// 성공 상태 시뮬레이션
export const SuccessFlow: Story = {
  args: {
    onUnlocked: action('🎉 Google AI 성공적으로 잠금 해제됨!'),
    children: (
      <div className='text-center p-6 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800'>
        <div className='text-4xl mb-2'>🎉</div>
        <h3 className='text-lg font-semibold text-green-800 dark:text-green-200 mb-2'>
          잠금 해제 성공!
        </h3>
        <p className='text-green-600 dark:text-green-400 text-sm'>
          Google AI 기능을 자유롭게 사용하실 수 있습니다.
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          '잠금 해제 성공 후의 상태를 보여줍니다. 실제로는 API 인증 후 이 상태가 됩니다.',
      },
    },
  },
  beforeEach: () => {
    // Mock for success state
    if (typeof window !== 'undefined') {
      (window as any).googleAIManager = {
        getKeyStatus: () => ({
          isAvailable: true,
          needsUnlock: false,
          source: 'team' as const,
        }),
      };
    }
  },
};

// Interactive 예시 (다크 모드)
export const DarkMode: Story = {
  args: {
    onUnlocked: action('Google AI 잠금 해제됨'),
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story:
          '다크 모드에서의 모습입니다. 테마에 따라 자동으로 색상이 조정됩니다.',
      },
    },
  },
  render: args => (
    <div className='dark'>
      <div className='bg-gray-900 p-6 rounded-lg'>
        <GoogleAIUnlock {...args} />
      </div>
    </div>
  ),
};
