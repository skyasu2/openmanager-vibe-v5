import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
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

  docs: {},

  staticDirs: ['../public'],

  env: config => ({
    ...config,
    // 스토리북 환경에서는 안전한 목업 모드 사용
    STORYBOOK: 'true',
    NODE_ENV: 'development',
    DISABLE_CRON_JOBS: 'true',
    FORCE_MOCK_REDIS: 'true',
    FORCE_MOCK_GOOGLE_AI: 'true',
    REDIS_CONNECTION_DISABLED: 'true',
    DISABLE_HEALTH_CHECK: 'true',
    HEALTH_CHECK_CONTEXT: 'false',
    NEXT_PUBLIC_STORYBOOK_MODE: 'true',
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
      };
    }

    // 🚀 번들 크기 최적화 설정
    if (config.optimization) {
      config.optimization = {
        ...config.optimization,
        // 코드 스플리팅 최적화
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // React 관련 라이브러리 별도 청크
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: 'react-vendor',
              chunks: 'all',
              priority: 20,
            },
            // UI 라이브러리 별도 청크
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|clsx|class-variance-authority)[\\/]/,
              name: 'ui-vendor',
              chunks: 'all',
              priority: 15,
            },
            // 기타 vendor 라이브러리
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              chunks: 'all',
              priority: 10,
            },
          },
        },
        // 트리 셰이킹 활성화
        usedExports: true,
        sideEffects: false,
      };
    }

    // 🎯 성능 최적화 설정
    config.performance = {
      hints: 'warning',
      maxAssetSize: 250000, // 250KB
      maxEntrypointSize: 250000, // 250KB
    };

    return config;
  },
};

export default config;
