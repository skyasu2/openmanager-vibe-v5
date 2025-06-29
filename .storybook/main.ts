import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-coverage', // Storybook 9.0 새로운 커버리지 애드온
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.mjs',
    },
  },

  // Storybook 9.0 새로운 기능: 태그 기반 조직화는 stories에서 설정

  typescript: {
    check: true,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },

  core: {
    disableTelemetry: true,
    disableWhatsNewNotifications: true,
  },

  docs: {},

  features: {
    experimentalRSC: true, // React Server Components 지원
  },

  staticDirs: ['../public'],

  env: config => ({
    ...config,
    STORYBOOK: 'true',
    NODE_ENV: 'development',
    DISABLE_CRON_JOBS: 'true',
    FORCE_MOCK_REDIS: 'true',
    FORCE_MOCK_GOOGLE_AI: 'true',
    REDIS_CONNECTION_DISABLED: 'true',
    DISABLE_HEALTH_CHECK: 'true',
    HEALTH_CHECK_CONTEXT: 'false',
    NEXT_PUBLIC_STORYBOOK_MODE: 'true',
    STORYBOOK_TEST_MODE: 'true',
    VITEST_STORYBOOK_INTEGRATION: 'true',
  }),

  webpackFinal: async config => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, '../src'),
      };

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default config;
