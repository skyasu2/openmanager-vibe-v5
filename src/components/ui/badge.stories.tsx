import type { Meta, StoryObj } from '@storybook/react';
import { Badge } from './badge';
import {
  createStoryMeta,
  mockServerStates,
  storyTitles,
  a11yLabels,
} from '../../stories/templates/StoryTemplate';
import { Card, CardContent } from './card';

const meta = createStoryMeta(
  storyTitles.ui('Badge'),
  Badge,
  '🏷️ 상태 표시용 Badge 컴포넌트입니다. 서버 상태, AI 엔진 상태, 알림 등을 시각적으로 구분하여 표시합니다.'
);

export default meta;
type Story = StoryObj<typeof meta>;

// 🎨 기본 배지들
export const Default: Story = {
  args: {
    children: '기본 배지',
  },
  parameters: {
    docs: {
      description: {
        story: '가장 기본적인 배지 형태입니다.',
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '보조 배지',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '위험 배지',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '외곽선 배지',
  },
};

// 🖥️ 서버 상태 배지들
export const ServerStatusBadges: Story = {
  render: () => (
    <div className='flex flex-wrap gap-3'>
      <Badge variant='default' className='bg-green-600'>
        ✅ 온라인
      </Badge>
      <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
        🔄 시작 중
      </Badge>
      <Badge variant='destructive' className='bg-orange-600'>
        ⚠️ 경고
      </Badge>
      <Badge variant='destructive'>🔴 오프라인</Badge>
      <Badge variant='outline' className='border-yellow-300 text-yellow-700'>
        🔧 유지보수
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '서버 모니터링에서 사용되는 다양한 상태 배지들입니다. 이모지와 색상으로 상태를 직관적으로 표현합니다.',
      },
    },
  },
};

// 🤖 AI 엔진 상태 배지들
export const AIStatusBadges: Story = {
  render: () => (
    <div className='flex flex-wrap gap-3'>
      <Badge variant='default' className='bg-purple-600'>
        🧠 활성
      </Badge>
      <Badge variant='secondary' className='bg-purple-100 text-purple-800'>
        💭 처리 중
      </Badge>
      <Badge variant='outline' className='border-purple-300 text-purple-700'>
        💤 대기
      </Badge>
      <Badge variant='destructive'>❌ 오류</Badge>
      <Badge variant='secondary' className='bg-cyan-100 text-cyan-800'>
        🔄 학습 중
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Multi-AI 엔진의 다양한 상태를 표시하는 배지들입니다. MCP, RAG, Google AI 등의 상태를 시각화합니다.',
      },
    },
  },
};

// 📊 메트릭 레벨 배지들
export const MetricLevelBadges: Story = {
  render: () => (
    <div className='space-y-4'>
      {/* CPU 사용률 레벨 */}
      <div>
        <h4 className='text-sm font-medium mb-2'>CPU 사용률</h4>
        <div className='flex gap-2'>
          <Badge variant='default' className='bg-green-600'>
            낮음 (0-50%)
          </Badge>
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            보통 (50-75%)
          </Badge>
          <Badge variant='destructive' className='bg-orange-600'>
            높음 (75-90%)
          </Badge>
          <Badge variant='destructive'>위험 (90%+)</Badge>
        </div>
      </div>

      {/* 메모리 사용률 레벨 */}
      <div>
        <h4 className='text-sm font-medium mb-2'>메모리 사용률</h4>
        <div className='flex gap-2'>
          <Badge variant='default' className='bg-blue-600'>
            안전 (0-60%)
          </Badge>
          <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
            주의 (60-80%)
          </Badge>
          <Badge variant='destructive' className='bg-red-600'>
            경고 (80%+)
          </Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '서버 메트릭의 다양한 레벨을 시각적으로 구분하는 배지들입니다. 사용률에 따라 색상이 달라집니다.',
      },
    },
  },
};

// 🔔 알림 및 우선순위 배지들
export const AlertPriorityBadges: Story = {
  render: () => (
    <div className='space-y-4'>
      {/* 알림 종류 */}
      <div>
        <h4 className='text-sm font-medium mb-2'>알림 종류</h4>
        <div className='flex gap-2'>
          <Badge variant='destructive'>🚨 긴급</Badge>
          <Badge variant='destructive' className='bg-orange-600'>
            ⚠️ 경고
          </Badge>
          <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
            ℹ️ 정보
          </Badge>
          <Badge variant='outline' className='border-gray-300 text-gray-700'>
            📢 알림
          </Badge>
        </div>
      </div>

      {/* 우선순위 */}
      <div>
        <h4 className='text-sm font-medium mb-2'>작업 우선순위</h4>
        <div className='flex gap-2'>
          <Badge variant='destructive'>🔥 High</Badge>
          <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
            📋 Medium
          </Badge>
          <Badge variant='outline' className='border-green-300 text-green-700'>
            📝 Low
          </Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '시스템 알림과 작업 우선순위를 표시하는 배지들입니다. 긴급도에 따라 시각적 구분이 명확합니다.',
      },
    },
  },
};

// 👤 사용자 권한 배지들
export const UserRoleBadges: Story = {
  render: () => (
    <div className='flex flex-wrap gap-3'>
      <Badge variant='default' className='bg-purple-600'>
        👑 관리자
      </Badge>
      <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
        🔧 운영자
      </Badge>
      <Badge variant='outline' className='border-green-300 text-green-700'>
        👤 사용자
      </Badge>
      <Badge variant='outline' className='border-gray-300 text-gray-500'>
        👻 게스트
      </Badge>
      <Badge variant='secondary' className='bg-amber-100 text-amber-800'>
        🎯 GitHub 인증
      </Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '사용자의 권한과 인증 상태를 표시하는 배지들입니다. GitHub OAuth 등 인증 방식도 구분합니다.',
      },
    },
  },
};

// 📅 시간 관련 배지들
export const TimeBadges: Story = {
  render: () => (
    <div className='flex flex-wrap gap-3'>
      <Badge variant='default' className='bg-green-600'>
        📅 실시간
      </Badge>
      <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
        🕐 1분 전
      </Badge>
      <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
        ⏰ 5분 전
      </Badge>
      <Badge variant='destructive' className='bg-orange-600'>
        ⚠️ 10분 전
      </Badge>
      <Badge variant='destructive'>🔴 연결 끊김</Badge>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '데이터의 최신성을 표시하는 시간 관련 배지들입니다. 실시간성이 중요한 모니터링 시스템에서 활용됩니다.',
      },
    },
  },
};

// 📱 작은 크기 배지들 (모바일)
export const SmallBadges: Story = {
  render: () => (
    <div className='space-y-3'>
      <div className='flex gap-2'>
        <Badge variant='default' className='text-xs px-1.5 py-0.5'>
          온라인
        </Badge>
        <Badge variant='destructive' className='text-xs px-1.5 py-0.5'>
          오프라인
        </Badge>
        <Badge variant='secondary' className='text-xs px-1.5 py-0.5'>
          처리중
        </Badge>
      </div>
      <div className='text-xs text-muted-foreground'>
        모바일 환경에서 사용되는 작은 크기의 배지들
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story:
          '모바일 화면에서 사용되는 작은 크기의 배지들입니다. 공간 효율성을 고려한 디자인입니다.',
      },
    },
  },
};

// 🎭 실제 사용 예시 (카드 내에서)
export const InContextUsage: Story = {
  render: () => (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl'>
      {/* 서버 카드 예시 */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold'>웹 서버 01</h3>
            <Badge variant='default' className='bg-green-600'>
              ✅ 온라인
            </Badge>
          </div>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span>CPU 사용률:</span>
              <Badge variant='secondary' className='bg-blue-100 text-blue-800'>
                45%
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span>메모리:</span>
              <Badge
                variant='secondary'
                className='bg-yellow-100 text-yellow-800'
              >
                67%
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span>알림:</span>
              <Badge variant='outline' className='border-gray-300'>
                0개
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI 엔진 카드 예시 */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='font-semibold'>Multi-AI 엔진</h3>
            <Badge variant='default' className='bg-purple-600'>
              🧠 활성
            </Badge>
          </div>
          <div className='space-y-2 text-sm'>
            <div className='flex justify-between'>
              <span>MCP 엔진:</span>
              <Badge variant='default' className='bg-green-600'>
                활성
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span>RAG 검색:</span>
              <Badge
                variant='secondary'
                className='bg-purple-100 text-purple-800'
              >
                처리중
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span>Google AI:</span>
              <Badge
                variant='outline'
                className='border-purple-300 text-purple-700'
              >
                대기
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        story:
          '실제 서버 카드와 AI 엔진 카드에서 배지가 어떻게 사용되는지 보여주는 실사용 예시입니다.',
      },
    },
  },
};

// 🌙 다크모드 배지들
export const DarkModeBadges: Story = {
  render: () => (
    <div className='bg-gray-900 p-6 rounded-lg space-y-4'>
      <div>
        <h4 className='text-white text-sm font-medium mb-2'>
          서버 상태 (다크모드)
        </h4>
        <div className='flex gap-2'>
          <Badge variant='default' className='bg-green-600'>
            온라인
          </Badge>
          <Badge variant='destructive' className='bg-orange-600'>
            경고
          </Badge>
          <Badge variant='destructive'>오프라인</Badge>
          <Badge variant='secondary' className='bg-gray-700 text-gray-200'>
            유지보수
          </Badge>
        </div>
      </div>

      <div>
        <h4 className='text-white text-sm font-medium mb-2'>
          AI 엔진 상태 (다크모드)
        </h4>
        <div className='flex gap-2'>
          <Badge variant='default' className='bg-purple-600'>
            활성
          </Badge>
          <Badge
            variant='secondary'
            className='bg-purple-800/50 text-purple-200'
          >
            처리중
          </Badge>
          <Badge
            variant='outline'
            className='border-purple-400 text-purple-300'
          >
            대기
          </Badge>
        </div>
      </div>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story:
          '다크모드에서의 배지 모양을 확인할 수 있습니다. 색상 대비와 가독성을 검증합니다.',
      },
    },
  },
};
