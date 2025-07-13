import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: [
    '../src/**/*.mdx',
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'
  ],
  
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
  ],
  
  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.mjs',
    },
  },

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
  },

  staticDirs: ['../public'],

  env: config => ({
    ...config,
    // 🎭 AI 모니터링 플랫폼용 스토리북 환경
    STORYBOOK: 'true',
    NODE_ENV: 'development',
    
    // 🚫 외부 서비스 목업 (안전한 격리)
    DISABLE_CRON_JOBS: 'true',
    FORCE_MOCK_REDIS: 'true',
    FORCE_MOCK_GOOGLE_AI: 'true',
    REDIS_CONNECTION_DISABLED: 'true',
    DISABLE_HEALTH_CHECK: 'true',
    HEALTH_CHECK_CONTEXT: 'false',
    NEXT_PUBLIC_STORYBOOK_MODE: 'true',
    
    // 🤖 AI 엔진 목업 설정
    AI_ENGINE_PRIORITY: 'mock_mode',
    DISABLE_LOCAL_RAG: 'true',
    PREFER_MOCK_AI: 'true',
  }),
};

export default config;