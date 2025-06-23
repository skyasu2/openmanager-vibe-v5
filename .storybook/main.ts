import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-a11y',
    '@storybook/addon-docs',
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.mjs',
    },
  },

  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: prop =>
        prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
    },
  },

  core: {
    disableTelemetry: true,
  },

  docs: {},

  staticDirs: ['../public'],

  env: config => ({
    ...config,
    // 스토리북 환경에서는 안전한 목업 모드 사용
    DISABLE_CRON_JOBS: 'true',
    FORCE_MOCK_REDIS: 'true',
    FORCE_MOCK_GOOGLE_AI: 'true',
    REDIS_CONNECTION_DISABLED: 'true',
    DISABLE_HEALTH_CHECK: 'true',
    HEALTH_CHECK_CONTEXT: 'false',
  }),

  webpackFinal: async config => {
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': require('path').resolve(__dirname, '../src'),
      };
    }
    return config;
  },
};

export default config;
