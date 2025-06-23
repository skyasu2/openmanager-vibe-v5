import type { Preview } from '@storybook/nextjs';
import '../src/styles/globals.css';

// 🎭 스토리북용 목업 환경 설정 (크론 제거 + 시스템 온오프 구조)
const mockEnvironment = () => {
  // 브라우저 환경에서 process.env 설정
  if (typeof window !== 'undefined') {
    (window as any).process = {
      env: {
        NODE_ENV: 'development',
        STORYBOOK: 'true',

        // 🚫 크론 작업 완전 비활성화
        DISABLE_CRON_JOBS: 'true',

        // 🔄 시스템 온오프 제어
        FORCE_SYSTEM_OFF: 'false', // 기본적으로 시스템 활성화
        SYSTEM_MAINTENANCE: 'false',

        // 🛡️ 안전한 목업 환경
        FORCE_MOCK_REDIS: 'true',
        FORCE_MOCK_GOOGLE_AI: 'true',
        REDIS_CONNECTION_DISABLED: 'true',
        UPSTASH_REDIS_DISABLED: 'true',
        DISABLE_HEALTH_CHECK: 'true',

        // 📱 앱 환경 설정
        NEXT_PUBLIC_APP_ENV: 'storybook',
        NEXT_PUBLIC_STORYBOOK_MODE: 'true',
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
      description: {
        component: '크론 제거 + 시스템 온오프 구조에 최적화된 컴포넌트입니다.',
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0a0a0a',
        },
        {
          name: 'system-off',
          value: '#f3f4f6',
        },
        {
          name: 'maintenance',
          value: '#fef3c7',
        },
      ],
    },
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
        ultrawide: {
          name: 'Ultra Wide',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'autocomplete-valid',
            enabled: false,
          },
          {
            id: 'button-name',
            enabled: true,
          },
          {
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
  globalTypes: {
    locale: {
      description: 'Internationalization locale',
      defaultValue: 'ko',
      toolbar: {
        icon: 'globe',
        items: [
          { value: 'ko', title: '한국어' },
          { value: 'en', title: 'English' },
        ],
      },
    },
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
    systemState: {
      description: '시스템 온오프 상태 (스토리북 전용)',
      defaultValue: 'active',
      toolbar: {
        title: 'System State',
        icon: 'power',
        items: [
          { value: 'active', title: '🟢 시스템 활성' },
          { value: 'off', title: '🔴 시스템 비활성' },
          { value: 'maintenance', title: '🟡 유지보수 모드' },
        ],
      },
    },
  },
  decorators: [
    (Story, context) => {
      // 각 스토리마다 목업 환경 재설정
      mockEnvironment();

      // 시스템 상태에 따른 환경변수 동적 설정
      const systemState = context.globals.systemState;
      if (typeof window !== 'undefined' && (window as any).process) {
        switch (systemState) {
          case 'off':
            (window as any).process.env.FORCE_SYSTEM_OFF = 'true';
            (window as any).process.env.SYSTEM_MAINTENANCE = 'false';
            break;
          case 'maintenance':
            (window as any).process.env.FORCE_SYSTEM_OFF = 'false';
            (window as any).process.env.SYSTEM_MAINTENANCE = 'true';
            break;
          default:
            (window as any).process.env.FORCE_SYSTEM_OFF = 'false';
            (window as any).process.env.SYSTEM_MAINTENANCE = 'false';
        }
      }

      return Story();
    },
  ],
};

export default preview;

