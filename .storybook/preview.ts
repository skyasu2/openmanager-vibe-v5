import type { Preview } from '@storybook/nextjs';
import '../src/styles/globals.css';

// 🎭 스토리북용 목업 환경 설정
const mockEnvironment = () => {
  // 브라우저 환경에서 process.env 설정
  if (typeof window !== 'undefined') {
    (window as any).process = {
      env: {
        NODE_ENV: 'development',
        STORYBOOK: 'true',
        FORCE_MOCK_REDIS: 'true',
        FORCE_MOCK_GOOGLE_AI: 'true',
        NEXT_PUBLIC_APP_ENV: 'storybook',
      }
    };
  }
};

// 스토리북 시작 시 목업 환경 초기화
mockEnvironment();

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    docs: {
      toc: true,
      source: {
        state: 'open',
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#0a0a0a',
        },
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'gray',
          value: '#f5f5f5',
        },
      ],
    },
    // 접근성 테스트 설정
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-visible',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
      options: {
        checks: { 'color-contrast': { options: { noScroll: true } } },
        restoreScroll: true,
      },
    },
    // 뷰포트 설정
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
    // 다국어 지원 (한국어 우선)
    locale: 'ko',
    locales: {
      ko: { title: '한국어', right: '🇰🇷' },
      en: { title: 'English', right: '🇺🇸' },
    },
  },

  decorators: [
    (Story) => {
      // 각 스토리마다 목업 환경 재설정
      mockEnvironment();
      return Story();
    },
  ],

  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Global theme for components',
      defaultValue: 'dark',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
