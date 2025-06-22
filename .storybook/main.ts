import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-docs',
      options: {
        csfPluginOptions: null,
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [],
          },
        },
      },
    },
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.ts',
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
    builder: '@storybook/builder-webpack5',
  },

  webpackFinal: async config => {
    // 절대 경로 import 지원
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '../src',
      // 불필요한 모듈들 제거
      '@tensorflow/tfjs-node': false,
      '@tensorflow/tfjs-node-gpu': false,
      '@tensorflow/tfjs': false,
      ioredis: false,
      redis: false,
    };

    // Node.js 전용 모듈들과 Redis 관련 모듈 fallback 설정
    config.resolve.fallback = {
      ...config.resolve.fallback,
      // TensorFlow 관련 모듈
      '@tensorflow/tfjs-node': false,
      '@tensorflow/tfjs-node-gpu': false,
      '@tensorflow/tfjs': false,
      // Node.js 네트워크 모듈들 (Redis에서 사용)
      dns: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      util: false,
      url: false,
      querystring: false,
      // Redis 관련 모듈
      ioredis: false,
      redis: false,
      // 기타 Node.js 모듈들
      fs: false,
      path: false,
      os: false,
      child_process: false,
      cluster: false,
      dgram: false,
      http: false,
      https: false,
      zlib: false,
    };

    // 성능 최적화 설정
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      },
    };

    // IgnorePlugin으로 문제되는 모듈들 완전 차단
    const webpack = await import('webpack');
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.default.IgnorePlugin({
        resourceRegExp: /@tensorflow|ioredis|redis|systeminformation/,
      }),
      // Redis 관련 모듈들을 더 구체적으로 차단
      new webpack.default.IgnorePlugin({
        resourceRegExp: /^(dns|net|tls|crypto|stream|util|url|querystring)$/,
      })
    );

    return config;
  },
};

export default config;
