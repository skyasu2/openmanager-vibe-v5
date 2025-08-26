import type { Meta, StoryObj } from '@storybook/react';;
import { Input } from './input';
import { Button } from './button';
import { Label } from './label';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { a11yLabels } from '../../stories/templates/StoryTemplate';
import { useState } from 'react';
import { Search, Server, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';

const meta = {
  title: 'UI Components/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '📝 사용자 입력을 받는 Input 컴포넌트입니다. 서버 검색, AI 질의, 설정 값 입력 등 다양한 용도로 사용됩니다. 한국어 입력 최적화가 적용되어 있습니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'number', 'search', 'tel', 'url'],
      description: '입력 필드의 타입',
    },
    placeholder: {
      control: 'text',
      description: '플레이스홀더 텍스트',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// 📝 기본 입력 필드
export const Default: Story = {
  args: {
    type: 'text',
    placeholder: '텍스트를 입력하세요...',
  },
  parameters: {
    docs: {
      description: {
        story: '가장 기본적인 텍스트 입력 필드입니다.',
      },
    },
  },
};

// 🔍 서버 검색 입력
export const ServerSearch: Story = {
  render: () => {
    const [searchTerm, setSearchTerm] = useState('');

    return (
      <div className="w-80 space-y-4">
        <Label htmlFor="server-search" className="text-sm font-medium">
          서버 검색
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            id="server-search"
            type="text"
            placeholder="서버명, IP 또는 태그로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            aria-label={a11yLabels.server.online}
          />
        </div>
        {searchTerm && (
          <div className="text-xs text-muted-foreground">
            '{searchTerm}'에 대한 검색 결과를 표시합니다.
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '서버를 검색할 때 사용되는 입력 필드입니다. 아이콘과 실시간 검색 기능이 포함되어 있습니다.',
      },
    },
  },
};

// 🤖 AI 질의 입력
export const AIQueryInput: Story = {
  render: () => {
    const [query, setQuery] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = () => {
      setIsProcessing(true);
      setTimeout(() => setIsProcessing(false), 2000);
    };

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="_animate-pulse h-3 w-3 rounded-full bg-purple-500" />
            AI 어시스턴트
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ai-query" className="text-sm font-medium">
              질문하기
            </Label>
            <Input
              id="ai-query"
              type="text"
              placeholder="서버 상태에 대해 질문해보세요..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isProcessing}
              aria-label={a11yLabels.ai.ready}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!query.trim() || isProcessing}
            className="w-full"
          >
            {isProcessing ? '🤔 처리 중...' : '🚀 질문하기'}
          </Button>
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          'AI 어시스턴트에게 질문할 때 사용되는 입력 필드입니다. 처리 상태에 따른 UI 변화를 포함합니다.',
      },
    },
  },
};

// 🔐 인증 입력 필드들
export const AuthInputs: Story = {
  render: () => {
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
      email: '',
      password: '',
    });

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 이메일 입력 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              이메일
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="pl-10"
                aria-label="이메일 주소 입력"
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              비밀번호
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="pl-10 pr-10"
                aria-label="비밀번호 입력"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button className="w-full">로그인</Button>
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '사용자 인증에 사용되는 이메일과 비밀번호 입력 필드들입니다. 비밀번호 표시/숨김 기능이 포함되어 있습니다.',
      },
    },
  },
};

// ⚙️ 설정 입력 필드들
export const SettingsInputs: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      serverName: 'WEB-SERVER-01',
      ipAddress: '192.168.1.100',
      port: '3000',
      refreshInterval: '5',
    });

    return (
      <Card className="w-96">
        <CardHeader>
          <CardTitle>서버 설정</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 서버 이름 */}
          <div className="space-y-2">
            <Label htmlFor="server-name" className="text-sm font-medium">
              서버 이름
            </Label>
            <div className="relative">
              <Server className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <Input
                id="server-name"
                type="text"
                placeholder="서버 이름을 입력하세요"
                value={settings.serverName}
                onChange={(e) =>
                  setSettings({ ...settings, serverName: e.target.value })
                }
                className="pl-10"
                aria-label="서버 이름 설정"
              />
            </div>
          </div>

          {/* IP 주소 */}
          <div className="space-y-2">
            <Label htmlFor="ip-address" className="text-sm font-medium">
              IP 주소
            </Label>
            <Input
              id="ip-address"
              type="text"
              placeholder="192.168.1.100"
              value={settings.ipAddress}
              onChange={(e) =>
                setSettings({ ...settings, ipAddress: e.target.value })
              }
              pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$"
              aria-label="서버 IP 주소 설정"
            />
          </div>

          {/* 포트 번호 */}
          <div className="space-y-2">
            <Label htmlFor="port" className="text-sm font-medium">
              포트 번호
            </Label>
            <Input
              id="port"
              type="number"
              placeholder="3000"
              value={settings.port}
              onChange={(e) =>
                setSettings({ ...settings, port: e.target.value })
              }
              min="1"
              max="65535"
              aria-label="서버 포트 번호 설정"
            />
          </div>

          {/* 새로고침 간격 */}
          <div className="space-y-2">
            <Label htmlFor="refresh-interval" className="text-sm font-medium">
              새로고침 간격 (초)
            </Label>
            <Input
              id="refresh-interval"
              type="number"
              placeholder="5"
              value={settings.refreshInterval}
              onChange={(e) =>
                setSettings({ ...settings, refreshInterval: e.target.value })
              }
              min="1"
              max="300"
              aria-label="데이터 새로고침 간격 설정"
            />
          </div>

          <Button className="w-full">설정 저장</Button>
        </CardContent>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '서버 모니터링 설정에 사용되는 다양한 입력 필드들입니다. 유효성 검증과 타입별 제한이 적용되어 있습니다.',
      },
    },
  },
};

// ❌ 오류 상태 입력
export const ErrorStates: Story = {
  render: () => {
    return (
      <div className="w-80 space-y-6">
        {/* 필수 필드 오류 */}
        <div className="space-y-2">
          <Label htmlFor="required-field" className="text-sm font-medium">
            서버 이름 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="required-field"
            type="text"
            placeholder="서버 이름을 입력하세요"
            className="border-red-300 focus:border-red-500 focus:ring-red-500"
            aria-invalid="true"
            aria-describedby="required-error"
          />
          <p id="required-error" className="text-xs text-red-600">
            서버 이름은 필수 입력 항목입니다.
          </p>
        </div>

        {/* 형식 오류 */}
        <div className="space-y-2">
          <Label htmlFor="format-error" className="text-sm font-medium">
            IP 주소
          </Label>
          <Input
            id="format-error"
            type="text"
            value="192.168.1"
            className="border-red-300 focus:border-red-500 focus:ring-red-500"
            aria-invalid="true"
            aria-describedby="format-error-text"
          />
          <p id="format-error-text" className="text-xs text-red-600">
            올바른 IP 주소 형식이 아닙니다. (예: 192.168.1.100)
          </p>
        </div>

        {/* 범위 오류 */}
        <div className="space-y-2">
          <Label htmlFor="range-error" className="text-sm font-medium">
            포트 번호
          </Label>
          <Input
            id="range-error"
            type="number"
            value="99999"
            className="border-red-300 focus:border-red-500 focus:ring-red-500"
            aria-invalid="true"
            aria-describedby="range-error-text"
          />
          <p id="range-error-text" className="text-xs text-red-600">
            포트 번호는 1~65535 범위여야 합니다.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '다양한 오류 상태를 표시하는 입력 필드들입니다. 접근성을 고려한 오류 메시지와 시각적 피드백을 제공합니다.',
      },
    },
  },
};

// ✅ 성공 상태 입력
export const SuccessState: Story = {
  render: () => {
    return (
      <div className="w-80 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="success-field" className="text-sm font-medium">
            서버 연결 테스트
          </Label>
          <Input
            id="success-field"
            type="text"
            value="192.168.1.100:3000"
            className="border-green-300 focus:border-green-500 focus:ring-green-500"
            aria-describedby="success-message"
            readOnly
          />
          <p
            id="success-message"
            className="flex items-center gap-1 text-xs text-green-600"
          >
            ✅ 서버 연결이 성공적으로 확인되었습니다.
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '성공 상태를 표시하는 입력 필드입니다. 연결 테스트 성공 등의 피드백을 제공합니다.',
      },
    },
  },
};

// 🔄 로딩 상태 입력
export const LoadingState: Story = {
  render: () => {
    return (
      <div className="w-80 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="loading-field" className="text-sm font-medium">
            서버 상태 확인 중...
          </Label>
          <Input
            id="loading-field"
            type="text"
            value="192.168.1.100"
            disabled
            className="_animate-pulse"
            aria-describedby="loading-message"
          />
          <p
            id="loading-message"
            className="flex items-center gap-1 text-xs text-blue-600"
          >
            🔄 서버 연결을 확인하고 있습니다...
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          '로딩 상태를 표시하는 입력 필드입니다. 서버 연결 확인 등의 비동기 작업 중에 사용됩니다.',
      },
    },
  },
};

// 📱 모바일 최적화 입력
export const MobileOptimized: Story = {
  render: () => {
    return (
      <div className="w-72 space-y-4">
        {/* 검색 입력 */}
        <div className="space-y-2">
          <Label htmlFor="mobile-search" className="text-sm font-medium">
            서버 검색
          </Label>
          <Input
            id="mobile-search"
            type="search"
            placeholder="검색..."
            className="text-base" // 모바일에서 zoom 방지
            aria-label="모바일 서버 검색"
          />
        </div>

        {/* 숫자 입력 */}
        <div className="space-y-2">
          <Label htmlFor="mobile-port" className="text-sm font-medium">
            포트
          </Label>
          <Input
            id="mobile-port"
            type="number"
            placeholder="3000"
            inputMode="numeric" // 모바일 숫자 키패드
            className="text-base"
            aria-label="서버 포트 번호"
          />
        </div>

        {/* URL 입력 */}
        <div className="space-y-2">
          <Label htmlFor="mobile-url" className="text-sm font-medium">
            서버 URL
          </Label>
          <Input
            id="mobile-url"
            type="url"
            placeholder="https://example.com"
            inputMode="url" // 모바일 URL 키패드
            className="text-base"
            aria-label="서버 URL 주소"
          />
        </div>
      </div>
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
    docs: {
      description: {
        story:
          '모바일 환경에 최적화된 입력 필드들입니다. 적절한 inputMode와 키패드 타입이 설정되어 있습니다.',
      },
    },
  },
};

// 🌙 다크모드 입력
export const DarkMode: Story = {
  render: () => {
    return (
      <div className="rounded-lg bg-gray-900 p-6">
        <Card className="w-96 border-gray-700 bg-gray-800">
          <CardHeader>
            <CardTitle className="text-white">다크모드 입력</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="dark-input"
                className="text-sm font-medium text-gray-200"
              >
                서버 이름
              </Label>
              <Input
                id="dark-input"
                type="text"
                placeholder="서버 이름을 입력하세요..."
                className="border-gray-600 bg-gray-700 text-white placeholder:text-gray-400 focus:border-gray-500"
                aria-label="다크모드 서버 이름 입력"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="dark-search"
                className="text-sm font-medium text-gray-200"
              >
                검색
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
                <Input
                  id="dark-search"
                  type="search"
                  placeholder="검색어를 입력하세요..."
                  className="border-gray-600 bg-gray-700 pl-10 text-white placeholder:text-gray-400 focus:border-gray-500"
                  aria-label="다크모드 검색"
                />
              </div>
            </div>

            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              확인
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story:
          '다크모드에서의 입력 필드 모양을 확인할 수 있습니다. 색상 대비와 가독성을 고려한 디자인입니다.',
      },
    },
  },
};
