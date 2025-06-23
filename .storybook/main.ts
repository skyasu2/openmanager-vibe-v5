import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
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

  docs: {
    autodocs: 'tag',
  },

  staticDirs: ['../public'],

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
