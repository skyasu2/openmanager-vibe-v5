import type { Preview } from '@storybook/react';
import '../src/styles/globals.css';

// 🎭 스토리북용 목업 환경 설정
const mockEnvironment = () => {
  if (typeof window !== 'undefined') {
    (window as any).process = {
      env: {
        NODE_ENV: 'development',
        STORYBOOK: 'true',
        DISABLE_CRON_JOBS: 'true',
        FORCE_MOCK_REDIS: 'true',
        FORCE_MOCK_GOOGLE_AI: 'true',
        REDIS_CONNECTION_DISABLED: 'true',
        UPSTASH_REDIS_DISABLED: 'true',
        DISABLE_HEALTH_CHECK: 'true',
        NEXT_PUBLIC_APP_ENV: 'storybook',
        NEXT_PUBLIC_STORYBOOK_MODE: 'true',
      },
    };
  }
};

// 스토리북 시작 시 목업 환경 초기화
mockEnvironment();

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
    },
    docs: {
      toc: true,
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
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f3f4f6' },
      ],
    },
    layout: 'centered',
  },

  globalTypes: {
    systemState: {
      description: '시스템 상태',
      defaultValue: 'active',
      toolbar: {
        title: 'System',
        icon: 'circlehollow',
        items: [
          { value: 'active', title: '🟢 Active' },
          { value: 'inactive', title: '🔴 Inactive' },
          { value: 'maintenance', title: '🟡 Maintenance' },
        ],
      },
    },
  },

  decorators: [
    (Story, context) => {
      mockEnvironment();
      return Story();
    },
  ],
};

export default preview;
