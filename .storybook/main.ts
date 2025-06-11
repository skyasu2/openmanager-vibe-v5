import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    '@storybook/addon-docs',
    '@storybook/addon-controls',
    '@storybook/addon-viewport',
  ],

  framework: {
    name: '@storybook/nextjs',
    options: {
      nextConfigPath: '../next.config.ts',
    },
  },

  docs: {
    autodocs: 'tag',
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

  webpackFinal: async config => {
    // 절대 경로 import 지원
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '../src',
      '@tensorflow/tfjs-node': false,
      '@tensorflow/tfjs-node-gpu': false,
      '@tensorflow/tfjs': false,
    };

    // TensorFlow 관련 모듈 완전 무시
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@tensorflow/tfjs-node': false,
      '@tensorflow/tfjs-node-gpu': false,
      '@tensorflow/tfjs': false,
      fs: false,
      path: false,
      os: false,
    };

    // IgnorePlugin으로 TensorFlow 모듈 완전 차단
    const webpack = await import('webpack');
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.default.IgnorePlugin({
        resourceRegExp: /@tensorflow/,
      })
    );

    return config;
  },
};

export default config;
