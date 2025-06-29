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
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.{js,ts,jsx,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.stories.{js,ts,jsx,tsx}',
        'src/**/*.test.{js,ts,jsx,tsx}',
        'src/**/*.spec.{js,ts,jsx,tsx}',
        'src/test/**',
        'src/lib/environment/**',
        'src/app/layout.tsx',
        'src/app/page.tsx',
        'src/app/globals.css',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
      all: true,
      clean: true,
      cleanOnRerun: true,
    },

    // 리포터 및 출력 설정
    reporters: ['default', 'html'],

    // 성능 및 타임아웃 설정
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    retry: 2,

    // 테스트 환경 변수
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_STORYBOOK_MODE: 'false',
      VITEST_ENVIRONMENT: 'jsdom',
      // OpenManager 테스트 환경 변수
      DISABLE_CRON_JOBS: 'true',
      FORCE_MOCK_REDIS: 'true',
      FORCE_MOCK_GOOGLE_AI: 'true',
      REDIS_CONNECTION_DISABLED: 'true',
      DISABLE_HEALTH_CHECK: 'true',
      HEALTH_CHECK_CONTEXT: 'false',
      DISABLE_AUTO_ENV_INIT: 'true',
      DISABLE_AUTO_BACKUP: 'true',
    },

    // 목킹 설정
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },

  // Vite 설정
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '#': path.resolve(__dirname, './'),
    },
  },
});
