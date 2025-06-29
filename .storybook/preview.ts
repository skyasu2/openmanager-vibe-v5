import type { Preview } from '@storybook/react';
import '../src/app/globals.css';

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
    // Storybook 9.0 향상된 액션 설정
    actions: {
      argTypesRegex: '^on[A-Z].*',
    },

    // Storybook 9.0 새로운 controls 설정
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,
    },

    // Storybook 9.0 접근성 기본 설정
    a11y: {
      element: '#storybook-root',
      config: {},
      options: {},
      manual: true,
    },

    // Storybook 9.0 향상된 뷰포트 설정
    viewport: {
      viewports: {
        mobile1: {
          name: 'Mobile (320px)',
          styles: { width: '320px', height: '568px' },
          type: 'mobile',
        },
        mobile2: {
          name: 'Mobile (375px)',
          styles: { width: '375px', height: '667px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop',
          styles: { width: '1024px', height: '768px' },
          type: 'desktop',
        },
      },
    },

    // Storybook 9.0 배경 설정
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'dark', value: '#1a1a1a' },
        { name: 'gray', value: '#f5f5f5' },
      ],
    },

    // Storybook 9.0 문서 설정
    docs: {
      source: {
        state: 'open',
      },
    },

    // Storybook 9.0 레이아웃 설정
    layout: 'centered',
  },

  // Storybook 9.0 새로운 전역 설정
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },

  // Storybook 9.0 tags 설정
  tags: ['autodocs'],

  decorators: [
    (Story, context) => {
      mockEnvironment();
      return Story();
    },
  ],
};

export default preview;
