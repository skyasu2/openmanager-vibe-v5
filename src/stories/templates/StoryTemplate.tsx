/**
 * 🎨 OpenManager Vibe v5 스토리 템플릿
 * AI 모니터링 플랫폼 특성에 맞는 공통 스토리 구조
 */

import type { Meta, StoryObj } from '@storybook/react';

// 🎯 서버 상태 목업 데이터
export const mockServerStates = {
  online: {
    status: 'online' as const,
    cpu: 45,
    memory: 67,
    disk: 23,
    network: 89,
    uptime: '15d 4h 23m',
    lastUpdate: new Date(),
    alerts: 0,
  },
  warning: {
    status: 'warning' as const,
    cpu: 85,
    memory: 92,
    disk: 78,
    network: 156,
    uptime: '2d 18h 45m',
    lastUpdate: new Date(),
    alerts: 3,
  },
  offline: {
    status: 'offline' as const,
    cpu: 0,
    memory: 0,
    disk: 0,
    network: 0,
    uptime: '0m',
    lastUpdate: new Date(Date.now() - 300000), // 5분 전
    alerts: 8,
  },
  maintenance: {
    status: 'maintenance' as const,
    cpu: 15,
    memory: 25,
    disk: 45,
    network: 12,
    uptime: '0h 15m',
    lastUpdate: new Date(),
    alerts: 0,
  },
};

// 🤖 AI 엔진 상태 목업
export const mockAIStates = {
  active: {
    mode: 'LOCAL' as const,
    isThinking: false,
    engines: {
      mcp: { status: 'active', confidence: 92, responseTime: 1200 },
      rag: { status: 'active', confidence: 88, responseTime: 800 },
      googleAI: { status: 'active', confidence: 95, responseTime: 1500 },
    },
  },
  processing: {
    mode: 'LOCAL' as const,
    isThinking: true,
    engines: {
      mcp: { status: 'processing', confidence: 0, responseTime: 0 },
      rag: { status: 'processing', confidence: 0, responseTime: 0 },
      googleAI: { status: 'idle', confidence: 0, responseTime: 0 },
    },
  },
  error: {
    mode: 'GOOGLE_ONLY' as const,
    isThinking: false,
    engines: {
      mcp: { status: 'error', confidence: 0, responseTime: 0 },
      rag: { status: 'error', confidence: 0, responseTime: 0 },
      googleAI: { status: 'active', confidence: 85, responseTime: 2000 },
    },
  },
};

// 👤 사용자 권한 목업
export const mockUserStates = {
  github: {
    isAuthenticated: true,
    provider: 'github',
    name: 'GitHub 사용자',
    email: 'user@github.com',
    avatar: 'https://github.com/identicons/user.png',
    permissions: ['read', 'write', 'admin'],
  },
  guest: {
    isAuthenticated: false,
    provider: 'guest',
    name: '게스트',
    email: null,
    avatar: null,
    permissions: ['read'],
  },
};

// 🎨 테마 설정
export const mockThemes = {
  light: {
    mode: 'light',
    background: '#ffffff',
    foreground: '#000000',
  },
  dark: {
    mode: 'dark',
    background: '#0a0a0a',
    foreground: '#ffffff',
  },
};

// 📱 뷰포트 설정
export const viewportSizes = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1440, height: 900 },
  wide: { width: 1920, height: 1080 },
};

// 🎯 공통 스토리 메타 템플릿
export const createStoryMeta = <T extends React.ComponentType<unknown>>(
  title: string,
  component: T,
  description?: string
): Meta<T> => ({
  title,
  component,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: description || '컴포넌트 설명이 필요합니다.',
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'system', value: '#f3f4f6' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: { width: '375px', height: '667px' },
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1440px', height: '900px' },
        },
      },
      defaultViewport: 'desktop',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
    onSubmit: { action: 'submitted' },
    onChange: { action: 'changed' },
  },
});

// 🎭 글로벌 데코레이터 (모든 스토리에 적용)
export const withAIContext = (Story: unknown, context: unknown) => {
  return (
    <div data-testid='ai-monitoring-context' className='storybook-ai-context'>
      <Story />
    </div>
  );
};

// 📝 스토리 타입 헬퍼
export type StoryType<T> = StoryObj<Meta<T>>;

// 🚀 서버 메트릭 생성기
export const generateServerMetrics = (
  baseValues?: Partial<typeof mockServerStates.online>
) => ({
  ...mockServerStates.online,
  ...baseValues,
  cpu: Math.max(
    0,
    Math.min(100, (baseValues?.cpu ?? 45) + (Math.random() - 0.5) * 10)
  ),
  memory: Math.max(
    0,
    Math.min(100, (baseValues?.memory ?? 67) + (Math.random() - 0.5) * 10)
  ),
  network: Math.max(
    0,
    (baseValues?.network ?? 89) + (Math.random() - 0.5) * 50
  ),
  lastUpdate: new Date(),
});

// 🎨 스토리 제목 헬퍼
export const storyTitles = {
  ui: (name: string) => `UI Components/${name}`,
  ai: (name: string) => `AI Components/${name}`,
  dashboard: (name: string) => `Dashboard/${name}`,
  system: (name: string) => `System/${name}`,
  pages: (name: string) => `Pages/${name}`,
};

// 💡 한국어 접근성 레이블
export const a11yLabels = {
  server: {
    online: '서버 온라인 상태',
    offline: '서버 오프라인 상태',
    warning: '서버 경고 상태',
    maintenance: '서버 유지보수 상태',
  },
  ai: {
    thinking: 'AI가 처리 중입니다',
    ready: 'AI가 준비되었습니다',
    error: 'AI 오류가 발생했습니다',
  },
  metrics: {
    cpu: 'CPU 사용률',
    memory: '메모리 사용률',
    disk: '디스크 사용률',
    network: '네트워크 사용률',
  },
};
