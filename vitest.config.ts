/// <reference types="vitest" />
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],

  test: {
    // 기본 설정
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],

    // 테스트 환경변수 설정
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_APP_NAME: 'OpenManager Vibe v5',
      NEXT_PUBLIC_APP_VERSION: '5.44.5',
      REDIS_URL: 'https://test-redis.upstash.io',
      UPSTASH_REDIS_REST_URL: 'https://test-redis.upstash.io',
      DISABLE_CRON_JOBS: 'true',
      FORCE_MOCK_REDIS: 'true',
      FORCE_MOCK_GOOGLE_AI: 'true',
      HEALTH_CHECK_CONTEXT: 'false',
      MAINTENANCE_MODE: 'false',
    },

    // 테스트 파일 포함/제외
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,ts,jsx,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'coverage/**',
      '.storybook/**',
      'src/test/setup.ts',
    ],

    // 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      exclude: [
        'node_modules/',
        'src/test/setup.ts',
        '.next/',
        'storybook-static/',
        'coverage/',
        '.storybook/',
      ],
    },

    // 리포터 설정
    reporters: ['default', 'html'],
    outputFile: {
      html: './html/index.html',
    },

    // 타임아웃 설정
    testTimeout: 10000,
    hookTimeout: 10000,

    // 병렬 실행 설정
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
        minThreads: 2,
      },
    },

    // 모킹 설정
    clearMocks: true,
    restoreMocks: true,
    deps: {
      inline: ['@testing-library/react'],
    },

    // 재시도 설정
    retry: 2,
    bail: 0,

    // 성능 최적화
    isolate: true,
    passWithNoTests: true,

    // Watch 모드 설정
    watch: false,
  },

  // Vite 설정
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/services': path.resolve(__dirname, './src/services'),
    },
  },
});
