import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    globals: true,
    css: true,
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      '.next/**/*',
      'e2e',
      'build',
      'coverage',
      '**/*.stories.{js,ts,jsx,tsx}', // Storybook 파일 제외
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov'], // HTML 리포터 제거하여 긴 파일명 문제 방지
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        '.next/',
        '.next/**/*',
        'dist/',
        'build/',
        'coverage/',
        'src/testing/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.stories.*',
        'src/app/layout.tsx', // Layout 파일 제외
        'src/app/page.tsx', // 메인 페이지 제외 (통합 테스트에서 다룸)
        'src/lib/react-query.ts', // 설정 파일 제외
        'src/components/ui/button.tsx', // UI 컴포넌트 라이브러리 제외
        'src/components/ui/card.tsx',
        'src/components/ui/tabs.tsx',
        'src/types/**/*', // 타입 정의 파일 제외
        'src/interfaces/**/*', // 인터페이스 파일 제외
      ],
      // 🚀 Windows 경로 제한 문제 해결
      include: [
        'src/**/*.{js,ts,jsx,tsx}',
        '!src/**/*.{test,spec}.{js,ts,jsx,tsx}',
        '!src/**/*.stories.{js,ts,jsx,tsx}',
      ],
      // 커버리지 임계값 설정
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    },
    // 병렬 테스트 설정
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    // 타임아웃 설정
    testTimeout: 10000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}); 