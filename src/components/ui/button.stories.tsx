import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import {
  a11yLabels,
} from '../../stories/templates/StoryTemplate';
import { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  RefreshCw,
  Settings,
  Download,
  Upload,
  Edit3,
  Trash2,
  Eye,
  Server,
  Brain,
  Shield,
  LogOut,
  Github,
  Plus,
  Minus,
  Search,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

const meta = {
  title: 'UI Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '🎯 OpenManager Vibe v5의 핵심 버튼 컴포넌트입니다. 서버 제어, AI 상호작용, 시스템 관리 등 모든 작업의 시작점이 되는 중요한 컴포넌트입니다.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'ghost', 'link']
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon']
    },
    onClick: { action: 'clicked' }
  }
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// 🎨 기본 버튼들
export const Default: Story = {
  args: {
    children: '기본 버튼',
  },
  parameters: {
    docs: {
      description: {
        story: '가장 기본적인 primary 스타일 버튼입니다.',
      },
    },
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '보조 버튼',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: '삭제 버튼',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '외곽선 버튼',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '고스트 버튼',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: '링크 버튼',
  },
};

// 📏 크기별 버튼들
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">작은 버튼</Button>
      <Button size="default">기본 버튼</Button>
      <Button size="lg">큰 버튼</Button>
      <Button size="icon">
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '다양한 크기의 버튼들입니다. 화면 공간과 중요도에 따라 선택할 수 있습니다.',
      },
    },
  },
};

// 🖥️ 서버 제어 버튼들
export const ServerControlButtons: Story = {
  render: () => {
    const [serverState, setServerState] = useState<
      'online' | 'starting' | 'stopped'
    >('stopped');

    const handleServerControl = (action: 'start' | 'stop' | 'restart') => {
      if (action === 'start') {
        setServerState('starting');
        setTimeout(() => setServerState('online'), 2000);
      } else if (action === 'stop') {
        setServerState('stopped');
      } else if (action === 'restart') {
        setServerState('starting');
        setTimeout(() => setServerState('online'), 3000);
      }
    };

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            서버 제어 패널
            <Badge
              variant={
                serverState === 'online'
                  ? 'default'
                  : serverState === 'starting'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {serverState === 'online'
                ? '온라인'
                : serverState === 'starting'
                  ? '시작 중'
                  : '중단됨'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 메인 제어 버튼들 */}
          <div className="flex gap-2">
            <Button
              onClick={() => handleServerControl('start')}
              disabled={serverState === 'online' || serverState === 'starting'}
              className="flex-1"
            >
              <Play className="mr-1 h-4 w-4" />
              시작
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleServerControl('stop')}
              disabled={serverState === 'stopped'}
              className="flex-1"
            >
              <Square className="mr-1 h-4 w-4" />
              중지
            </Button>
            <Button
              variant="outline"
              onClick={() => handleServerControl('restart')}
              disabled={serverState === 'stopped' || serverState === 'starting'}
              className="flex-1"
            >
              <RefreshCw
                className={`mr-1 h-4 w-4 ${serverState === 'starting' ? 'animate-spin' : ''}`}
              />
              재시작
            </Button>
          </div>

          {/* 보조 기능 버튼들 */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="mr-1 h-4 w-4" />
              설정
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="mr-1 h-4 w-4" />
              로그
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '서버 모니터링 플랫폼의 핵심인 서버 제어 버튼들입니다. 상태에 따른 버튼 활성화/비활성화와 아이콘 애니메이션을 포함합니다.',
      },
    },
  },
};

// 🤖 AI 인터랙션 버튼들
export const AIInteractionButtons: Story = {
  render: () => {
    const [aiState, setAiState] = useState<'ready' | 'thinking' | 'error'>(
      'ready'
    );
    const [conversation, setConversation] = useState<string[]>([]);

    const handleAIAction = (action: string) => {
      setAiState('thinking');
      setConversation((prev) => [...prev, `사용자: ${action} 요청`]);

      setTimeout(() => {
        setAiState('ready');
        setConversation((prev) => [
          ...prev,
          `AI: ${action} 작업을 완료했습니다.`,
        ]);
      }, 2000);
    };

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI 어시스턴트
            <Badge
              variant={
                aiState === 'ready'
                  ? 'default'
                  : aiState === 'thinking'
                    ? 'secondary'
                    : 'destructive'
              }
            >
              {aiState === 'ready'
                ? '준비됨'
                : aiState === 'thinking'
                  ? '처리 중'
                  : '오류'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* AI 액션 버튼들 */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={() => handleAIAction('서버 상태 분석')}
              disabled={aiState === 'thinking'}
              size="sm"
            >
              <Server className="mr-1 h-4 w-4" />
              상태 분석
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAIAction('성능 최적화')}
              disabled={aiState === 'thinking'}
              size="sm"
            >
              <RefreshCw
                className={`mr-1 h-4 w-4 ${aiState === 'thinking' ? 'animate-spin' : ''}`}
              />
              최적화
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAIAction('보안 검사')}
              disabled={aiState === 'thinking'}
              size="sm"
            >
              <Shield className="mr-1 h-4 w-4" />
              보안 검사
            </Button>
            <Button
              variant="outline"
              onClick={() => handleAIAction('로그 분석')}
              disabled={aiState === 'thinking'}
              size="sm"
            >
              <Search className="mr-1 h-4 w-4" />
              로그 분석
            </Button>
          </div>

          {/* 메인 AI 채팅 버튼 */}
          <Button
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={aiState === 'thinking'}
          >
            {aiState === 'thinking' ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                AI가 생각하고 있습니다...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                AI와 대화하기
              </>
            )}
          </Button>

          {/* 대화 로그 미리보기 */}
          {conversation.length > 0 && (
            <div className="max-h-20 overflow-y-auto text-xs text-muted-foreground">
              {conversation.slice(-2).map((msg, i) => (
                <div key={i} className="mb-1">
                  {msg}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'Multi-AI 엔진과의 상호작용을 위한 버튼들입니다. AI 상태에 따른 버튼 동작과 실시간 피드백을 제공합니다.',
      },
    },
  },
};

// 📋 액션 버튼 그룹들
export const ActionButtonGroups: Story = {
  render: () => (
    <div className="space-y-6">
      {/* 파일 관리 */}
      <div>
        <h4 className="mb-3 text-sm font-medium">파일 관리</h4>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-1 h-4 w-4" />
            다운로드
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="mr-1 h-4 w-4" />
            업로드
          </Button>
          <Button variant="outline" size="sm">
            <Edit3 className="mr-1 h-4 w-4" />
            편집
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="mr-1 h-4 w-4" />
            삭제
          </Button>
        </div>
      </div>

      {/* 인증 관리 */}
      <div>
        <h4 className="mb-3 text-sm font-medium">인증 관리</h4>
        <div className="flex gap-2">
          <Button>
            <Github className="mr-2 h-4 w-4" />
            GitHub으로 로그인
          </Button>
          <Button variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </div>

      {/* 네비게이션 */}
      <div>
        <h4 className="mb-3 text-sm font-medium">네비게이션</h4>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            대시보드
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm">
            서버 목록
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          <Button variant="link" size="sm">
            외부 링크
            <ExternalLink className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '실제 사용되는 다양한 액션 버튼 그룹들입니다. 파일 관리, 인증, 네비게이션 등 용도별로 구분됩니다.',
      },
    },
  },
};

// 🎨 아이콘 버튼들
export const IconButtons: Story = {
  render: () => (
    <div className="space-y-4">
      {/* 아이콘만 있는 버튼들 */}
      <div>
        <h4 className="mb-2 text-sm font-medium">아이콘 버튼</h4>
        <div className="flex gap-2">
          <Button size="icon" variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Minus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 텍스트와 아이콘 조합 */}
      <div>
        <h4 className="mb-2 text-sm font-medium">텍스트 + 아이콘 버튼</h4>
        <div className="flex flex-wrap gap-2">
          <Button size="sm">
            <Play className="mr-1 h-4 w-4" />
            실행
          </Button>
          <Button size="sm" variant="outline">
            <Pause className="mr-1 h-4 w-4" />
            일시정지
          </Button>
          <Button size="sm" variant="secondary">
            <Download className="mr-1 h-4 w-4" />
            내려받기
          </Button>
          <Button size="sm" variant="ghost">
            <Eye className="mr-1 h-4 w-4" />
            보기
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '아이콘이 포함된 버튼들입니다. 아이콘만 있는 버튼과 텍스트+아이콘 조합 버튼을 보여줍니다.',
      },
    },
  },
};

// 🔄 로딩 및 상태 버튼들
export const LoadingAndStates: Story = {
  render: () => {
    const [loadingStates, setLoadingStates] = useState({
      save: false,
      download: false,
      upload: false,
      analyze: false,
    });

    const handleAction = (action: keyof typeof loadingStates) => {
      setLoadingStates((prev) => ({ ...prev, [action]: true }));
      setTimeout(() => {
        setLoadingStates((prev) => ({ ...prev, [action]: false }));
      }, 3000);
    };

    return (
      <div className="space-y-4">
        {/* 로딩 상태 버튼들 */}
        <div>
          <h4 className="mb-2 text-sm font-medium">로딩 상태</h4>
          <div className="flex gap-2">
            <Button
              onClick={() => handleAction('save')}
              disabled={loadingStates.save}
            >
              {loadingStates.save ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                '저장하기'
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => handleAction('download')}
              disabled={loadingStates.download}
            >
              {loadingStates.download ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  다운로드 중...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  다운로드
                </>
              )}
            </Button>
          </div>
        </div>

        {/* 비활성화 상태 */}
        <div>
          <h4 className="mb-2 text-sm font-medium">비활성화 상태</h4>
          <div className="flex gap-2">
            <Button disabled>비활성화된 버튼</Button>
            <Button variant="outline" disabled>
              <Settings className="mr-2 h-4 w-4" />
              사용할 수 없음
            </Button>
            <Button variant="destructive" disabled>
              권한 없음
            </Button>
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '로딩 상태와 비활성화 상태의 버튼들입니다. 사용자에게 현재 작업 진행 상황을 명확히 전달합니다.',
      },
    },
  },
};

// 📱 모바일 최적화 버튼들
export const MobileOptimized: Story = {
  render: () => (
    <div className="max-w-sm space-y-4">
      {/* 풀 너비 버튼들 */}
      <div>
        <h4 className="mb-2 text-sm font-medium">모바일 액션 버튼</h4>
        <div className="space-y-2">
          <Button className="w-full">
            <Server className="mr-2 h-4 w-4" />
            서버 상태 확인
          </Button>
          <Button variant="outline" className="w-full">
            <Brain className="mr-2 h-4 w-4" />
            AI 어시스턴트 열기
          </Button>
          <Button variant="destructive" className="w-full">
            <Square className="mr-2 h-4 w-4" />
            긴급 정지
          </Button>
        </div>
      </div>

      {/* 인라인 버튼들 */}
      <div>
        <h4 className="mb-2 text-sm font-medium">인라인 액션</h4>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1">
            승인
          </Button>
          <Button size="sm" variant="outline" className="flex-1">
            거부
          </Button>
        </div>
      </div>

      {/* 플로팅 액션 버튼 스타일 */}
      <div>
        <h4 className="mb-2 text-sm font-medium">FAB 스타일</h4>
        <div className="flex justify-end">
          <Button size="icon" className="h-12 w-12 rounded-full shadow-lg">
            <Plus className="h-6 w-6" />
          </Button>
        </div>
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
          '모바일 화면에 최적화된 버튼들입니다. 터치 인터페이스와 화면 크기를 고려한 디자인입니다.',
      },
    },
  },
};

// 🌙 다크모드 버튼들
export const DarkMode: Story = {
  render: () => (
    <div className="rounded-lg bg-gray-900 p-6">
      <div className="space-y-4">
        <h4 className="mb-3 text-sm font-medium text-white">다크모드 버튼들</h4>

        {/* 기본 variant들 */}
        <div className="flex gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>

        {/* 실제 사용 예시 */}
        <Card className="border-gray-700 bg-gray-800">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h5 className="font-medium text-white">서버 액션</h5>
              <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                다크모드
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button size="sm">
                <Play className="mr-1 h-4 w-4" />
                시작
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Settings className="mr-1 h-4 w-4" />
                설정
              </Button>
              <Button size="sm" variant="destructive">
                <Square className="mr-1 h-4 w-4" />
                중지
              </Button>
            </div>
          </CardContent>
        </Card>
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
          '다크모드에서의 버튼 모양을 확인할 수 있습니다. 색상 대비와 가독성을 검증합니다.',
      },
    },
  },
};

// 🎭 모든 variant 조합 그리드
export const AllVariantsGrid: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Variant별 정리 */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Default</h4>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Secondary</h4>
          <Button variant="secondary" size="sm">
            Small
          </Button>
          <Button variant="secondary">Default</Button>
          <Button variant="secondary" size="lg">
            Large
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Outline</h4>
          <Button variant="outline" size="sm">
            Small
          </Button>
          <Button variant="outline">Default</Button>
          <Button variant="outline" size="lg">
            Large
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Destructive</h4>
          <Button variant="destructive" size="sm">
            Small
          </Button>
          <Button variant="destructive">Default</Button>
          <Button variant="destructive" size="lg">
            Large
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Ghost</h4>
          <Button variant="ghost" size="sm">
            Small
          </Button>
          <Button variant="ghost">Default</Button>
          <Button variant="ghost" size="lg">
            Large
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">Link</h4>
          <Button variant="link" size="sm">
            Small
          </Button>
          <Button variant="link">Default</Button>
          <Button variant="link" size="lg">
            Large
          </Button>
        </div>
      </div>

      {/* 아이콘 크기들 */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Icon Buttons</h4>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline">
            <Settings className="h-4 w-4" />
          </Button>
          <Button size="icon">
            <Play className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        story:
          '모든 variant와 size 조합을 한눈에 비교할 수 있는 그리드입니다. 디자인 시스템의 일관성을 확인할 수 있습니다.',
      },
    },
  },
};

// 🧪 접근성 테스트 버튼들
export const AccessibilityTest: Story = {
  render: () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">접근성 고려 버튼들</h4>

      {/* 명확한 라벨 */}
      <div className="space-y-2">
        <Button aria-label={a11yLabels.server.online}>
          <Play className="mr-2 h-4 w-4" />
          시작
        </Button>
        <Button
          variant="destructive"
          aria-label="서버를 완전히 종료합니다. 이 작업은 되돌릴 수 없습니다."
        >
          <Square className="mr-2 h-4 w-4" />
          종료
        </Button>
      </div>

      {/* 키보드 네비게이션 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Tab 키로 포커스 이동, Enter/Space로 활성화
        </p>
        <div className="flex gap-2">
          <Button tabIndex={1}>첫 번째 (Tab순서 1)</Button>
          <Button tabIndex={3}>세 번째 (Tab순서 3)</Button>
          <Button tabIndex={2}>두 번째 (Tab순서 2)</Button>
        </div>
      </div>

      {/* 상태 표시 */}
      <div className="space-y-2">
        <Button aria-pressed="true" variant="secondary">
          선택됨 (aria-pressed)
        </Button>
        <Button aria-expanded="false" variant="outline">
          메뉴 닫힘 (aria-expanded)
        </Button>
        <Button disabled aria-label={a11yLabels.ai.error}>
          권한 없음
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '접근성을 고려한 버튼들입니다. 스크린 리더, 키보드 네비게이션, 상태 전달 등을 테스트할 수 있습니다.',
      },
    },
  },
};

// 🇰🇷 한국어 접근성 레이블 검증
export const KoreanA11yLabels: Story = {
  render: () => (
    <div className="space-y-6">
      <h4 className="text-sm font-medium">한국어 접근성 레이블 활용</h4>

      {/* 서버 상태 버튼들 */}
      <div className="space-y-3">
        <h5 className="text-xs font-medium text-muted-foreground">서버 상태</h5>
        <div className="flex gap-2">
          <Button variant="default" aria-label={a11yLabels.server.online}>
            <Server className="mr-1 h-4 w-4" />
            온라인
          </Button>
          <Button variant="destructive" aria-label={a11yLabels.server.offline}>
            <Square className="mr-1 h-4 w-4" />
            오프라인
          </Button>
          <Button variant="secondary" aria-label={a11yLabels.server.warning}>
            <RefreshCw className="mr-1 h-4 w-4" />
            경고
          </Button>
          <Button variant="outline" aria-label={a11yLabels.server.maintenance}>
            <Settings className="mr-1 h-4 w-4" />
            유지보수
          </Button>
        </div>
      </div>

      {/* AI 상태 버튼들 */}
      <div className="space-y-3">
        <h5 className="text-xs font-medium text-muted-foreground">AI 상태</h5>
        <div className="flex gap-2">
          <Button variant="default" aria-label={a11yLabels.ai.ready}>
            <Brain className="mr-1 h-4 w-4" />
            준비됨
          </Button>
          <Button
            variant="secondary"
            aria-label={a11yLabels.ai.thinking}
            disabled
          >
            <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
            처리중
          </Button>
          <Button variant="destructive" aria-label={a11yLabels.ai.error}>
            <Brain className="mr-1 h-4 w-4" />
            오류
          </Button>
        </div>
      </div>

      {/* 메트릭 관련 버튼들 */}
      <div className="space-y-3">
        <h5 className="text-xs font-medium text-muted-foreground">
          시스템 메트릭
        </h5>
        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            aria-label={a11yLabels.metrics.cpu}
          >
            CPU 사용률
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={a11yLabels.metrics.memory}
          >
            메모리 사용률
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={a11yLabels.metrics.disk}
          >
            디스크 사용률
          </Button>
          <Button
            size="sm"
            variant="outline"
            aria-label={a11yLabels.metrics.network}
          >
            네트워크 사용률
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'StoryTemplate.tsx의 a11yLabels를 활용한 한국어 접근성 레이블 검증입니다. 스크린 리더가 한국어로 올바르게 읽을 수 있는지 확인할 수 있습니다.',
      },
    },
    a11y: {
      // 이 스토리에서는 한국어 접근성 특화 검사
      config: {
        rules: [
          { id: 'label', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'aria-label', enabled: true },
        ],
      },
    },
  },
};
