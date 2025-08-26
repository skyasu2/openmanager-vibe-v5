import type { Meta, StoryObj } from '@storybook/react';;
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './card';
import { Button } from './button';
import { Badge } from './badge';
import {
  mockServerStates,
  a11yLabels,
} from '../../stories/templates/StoryTemplate';

const meta = {
  title: 'UI Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '🎨 OpenManager Vibe v5의 기본 카드 컴포넌트입니다. 서버 정보, AI 상태, 메트릭 표시 등 모든 UI의 기반이 되는 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    className: {
      control: 'text',
      description: '카드에 적용할 추가 클래스',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// 📋 기본 카드
export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>기본 카드</CardTitle>
        <CardDescription>
          OpenManager Vibe v5 기본 카드 컴포넌트입니다.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          카드 내용이 여기에 표시됩니다. 서버 정보, AI 상태, 메트릭 등을 담을 수
          있습니다.
        </p>
      </CardContent>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: '가장 기본적인 카드 형태입니다. Header, Content로 구성됩니다.',
      },
    },
  },
};

// 🖥️ 서버 상태 카드
export const ServerStatusCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="_animate-pulse h-3 w-3 rounded-full bg-green-500" />웹
          서버 01
        </CardTitle>
        <CardDescription>Seoul DC1 · Ubuntu 22.04 LTS</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">CPU:</span>
            <span className="ml-1 font-medium">45%</span>
          </div>
          <div>
            <span className="text-muted-foreground">메모리:</span>
            <span className="ml-1 font-medium">67%</span>
          </div>
          <div>
            <span className="text-muted-foreground">디스크:</span>
            <span className="ml-1 font-medium">23%</span>
          </div>
          <div>
            <span className="text-muted-foreground">네트워크:</span>
            <span className="ml-1 font-medium">89 MB/s</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="secondary">온라인</Badge>
          <span className="text-xs text-muted-foreground">15d 4h 23m</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          상세 보기
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'AI 모니터링 플랫폼의 핵심인 서버 상태를 표시하는 카드입니다. 실시간 메트릭과 상태 정보를 포함합니다.',
      },
    },
  },
};

// 🤖 AI 엔진 상태 카드
export const AIEngineCard: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="_animate-pulse h-3 w-3 rounded-full bg-purple-500" />
          Multi-AI 엔진
        </CardTitle>
        <CardDescription>통합 AI 처리 시스템</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>MCP 엔진</span>
            <Badge variant="default">활성</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>RAG 검색</span>
            <Badge variant="default">활성</Badge>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Google AI</span>
            <Badge variant="secondary">대기</Badge>
          </div>
        </div>
        <div className="border-t pt-2">
          <div className="text-xs text-muted-foreground">
            신뢰도: 92% · 응답시간: 1.2초
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button size="sm" className="w-full">
          AI 채팅 시작
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Multi-AI 엔진 상태를 표시하는 카드입니다. MCP, RAG, Google AI 등의 상태와 성능 지표를 포함합니다.',
      },
    },
  },
};

// ⚠️ 경고 상태 카드
export const WarningCard: Story = {
  render: () => (
    <Card className="w-80 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <div className="_animate-pulse h-3 w-3 rounded-full bg-orange-500" />
          DB 서버 02
        </CardTitle>
        <CardDescription className="text-orange-700">
          높은 메모리 사용률 감지
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">CPU:</span>
            <span className="ml-1 font-medium text-orange-600">85%</span>
          </div>
          <div>
            <span className="text-muted-foreground">메모리:</span>
            <span className="ml-1 font-medium text-red-600">92%</span>
          </div>
          <div>
            <span className="text-muted-foreground">디스크:</span>
            <span className="ml-1 font-medium">78%</span>
          </div>
          <div>
            <span className="text-muted-foreground">알림:</span>
            <span className="ml-1 font-medium text-orange-600">3개</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="destructive">경고</Badge>
          <span className="text-xs text-muted-foreground">2d 18h 45m</span>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          조치하기
        </Button>
        <Button variant="default" size="sm" className="flex-1">
          상세 보기
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '서버에 문제가 발생했을 때 표시되는 경고 상태 카드입니다. 시각적으로 주의를 끌도록 색상이 변경됩니다.',
      },
    },
  },
};

// 🔴 오프라인 카드
export const OfflineCard: Story = {
  render: () => (
    <Card className="w-80 border-red-200 bg-red-50 opacity-75">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <div className="h-3 w-3 rounded-full bg-red-500" />
          백업 서버 03
        </CardTitle>
        <CardDescription className="text-red-700">
          연결할 수 없음 · 5분 전 마지막 응답
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm opacity-60">
          <div>
            <span className="text-muted-foreground">CPU:</span>
            <span className="ml-1 font-medium">-</span>
          </div>
          <div>
            <span className="text-muted-foreground">메모리:</span>
            <span className="ml-1 font-medium">-</span>
          </div>
          <div>
            <span className="text-muted-foreground">디스크:</span>
            <span className="ml-1 font-medium">-</span>
          </div>
          <div>
            <span className="text-muted-foreground">알림:</span>
            <span className="ml-1 font-medium text-red-600">8개</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="destructive">오프라인</Badge>
          <span className="text-xs text-muted-foreground">0m</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="destructive" size="sm" className="w-full">
          재연결 시도
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '서버가 오프라인 상태일 때 표시되는 카드입니다. 전체적으로 비활성화된 시각적 표현을 제공합니다.',
      },
    },
  },
};

// 📱 모바일 카드
export const MobileCard: Story = {
  render: () => (
    <Card className="w-72">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">모바일 서버 카드</CardTitle>
        <CardDescription className="text-sm">
          모바일 최적화 버전
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium">웹서버</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            온라인
          </Badge>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>CPU: 45%</div>
          <div>메모리: 67%</div>
        </div>
      </CardContent>
    </Card>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story:
          '모바일 화면에 최적화된 카드입니다. 정보 밀도를 조정하고 터치 인터페이스를 고려합니다.',
      },
    },
  },
};

// 🌙 다크모드 카드
export const DarkModeCard: Story = {
  render: () => (
    <div className="rounded-lg bg-gray-900 p-6">
      <Card className="w-80 border-gray-700 bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <div className="_animate-pulse h-3 w-3 rounded-full bg-green-400" />
            다크모드 서버
          </CardTitle>
          <CardDescription className="text-gray-400">
            다크 테마 지원 확인
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <span className="text-gray-400">CPU:</span>
              <span className="ml-1 font-medium text-white">45%</span>
            </div>
            <div>
              <span className="text-gray-400">메모리:</span>
              <span className="ml-1 font-medium text-white">67%</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="secondary" className="bg-gray-700 text-gray-300">
              온라인
            </Badge>
            <span className="text-xs text-gray-400">15d 4h 23m</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            상세 보기
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story:
          '다크모드에서의 카드 모양을 확인할 수 있습니다. 색상 대비와 가독성을 검증합니다.',
      },
    },
  },
};

// 🎭 모든 상태 그리드
export const AllStatesGrid: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 온라인 상태 */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="_animate-pulse h-2 w-2 rounded-full bg-green-500" />
            웹서버 01
          </CardTitle>
          <CardDescription className="text-sm">정상 운영 중</CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary">온라인</Badge>
        </CardContent>
      </Card>

      {/* 경고 상태 */}
      <Card className="w-full border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-orange-800">
            <div className="_animate-pulse h-2 w-2 rounded-full bg-orange-500" />
            DB서버 02
          </CardTitle>
          <CardDescription className="text-sm text-orange-700">
            높은 사용률
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="destructive">경고</Badge>
        </CardContent>
      </Card>

      {/* 오프라인 상태 */}
      <Card className="w-full border-red-200 bg-red-50 opacity-75">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-red-800">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            백업서버 03
          </CardTitle>
          <CardDescription className="text-sm text-red-700">
            연결 끊김
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Badge variant="destructive">오프라인</Badge>
        </CardContent>
      </Card>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        story:
          '서버의 모든 상태(온라인, 경고, 오프라인)를 한눈에 비교할 수 있는 그리드 뷰입니다.',
      },
    },
  },
};
