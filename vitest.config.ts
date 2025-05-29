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
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      'e2e',
      '**/*.stories.{js,ts,jsx,tsx}', // Storybook 파일 제외
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/testing/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.stories.*',
        'src/app/layout.tsx', // Layout 파일 제외
        'src/app/page.tsx', // 메인 페이지 제외 (통합 테스트에서 다룸)
        'src/lib/react-query.ts', // 설정 파일 제외
      ],
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