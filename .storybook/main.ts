import type { StorybookConfig } from '@storybook/nextjs';

const config: StorybookConfig = {
  // 특정 디렉토리만 스캔하여 성능 개선
  stories: [
    '../src/components/**/*.stories.@(ts|tsx)',
    '../src/stories/**/*.stories.@(ts|tsx)',
  ],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    // onboarding 제거 - 불필요
  ],
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  staticDirs: ['../public'],
  // 성능 최적화 기능 활성화
  features: {
    buildStoriesJson: true, // 스토리 인덱싱 최적화
    storyStoreV7: true, // 새로운 스토리 스토어 사용
  },
  // Next.js 15와의 호환성을 위한 webpack 설정
  webpackFinal: async (config) => {
    // Next.js 15 ESM 호환성 문제 해결
    config.resolve = {
      ...config.resolve,
      extensionAlias: {
        '.js': ['.js', '.ts', '.tsx'],
        '.mjs': ['.mjs', '.mts'],
      },
    };

    // 캐시 설정으로 재빌드 속도 향상
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };

    // 성능 최적화 설정
    config.optimization = {
      ...config.optimization,
      minimize: false, // 개발 환경에서는 미니파이 비활성화
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // 벤더 라이브러리 분리
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // 공통 모듈 분리
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };

    return config;
  },
  // TypeScript 설정
  typescript: {
    check: false, // 빌드 속도를 위해 타입 체크 비활성화
    reactDocgen: false, // 필요시에만 활성화
  },
  // 코어 설정
  core: {
    disableTelemetry: true, // 텔레메트리 비활성화
  },
};
export default config;
