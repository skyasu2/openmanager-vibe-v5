import path from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

/**
 * DOM 테스트 전용 설정 (컴포넌트 테스트)
 * happy-dom 사용으로 성능 개선
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [],
    test: {
      globals: true,
      environment: 'happy-dom', // jsdom보다 빠른 happy-dom 사용
      setupFiles: ['./src/test/setup.ts'],

      // 🎯 컴포넌트 테스트만 포함
      include: [
        'src/components/**/*.test.{ts,tsx}',
        'src/components/**/*.spec.{ts,tsx}',
        'tests/unit/components/**/*.test.{ts,tsx}',
      ],

      // 🚫 제외
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/build/**',
        '**/coverage/**',
      ],

      // 🎯 테스트 실행 최적화
      maxConcurrency: 10,
      pool: 'threads', // DOM 테스트는 threads가 더 적합
      isolate: true, // DOM 테스트는 격리 필요
      
      // 🚀 성능 최적화
      css: true, // 컴포넌트 테스트는 CSS 필요
      deps: {
        optimizer: {
          web: {
            enabled: true,
          }
        }
      },

      // 타임아웃 설정
      testTimeout: 5000, // DOM 테스트는 좀 더 긴 타임아웃
      hookTimeout: 2000,
      teardownTimeout: 2000,
      bail: 1,

      // 리포터 설정
      reporter: process.env.CI ? 'github-actions' : 'default',

      // Mock 설정
      mockReset: true,
      clearMocks: true,
      restoreMocks: true,
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
        '@/core': path.resolve(__dirname, './src/core'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/test': path.resolve(__dirname, './src/test'),
        '~': path.resolve(__dirname, './'),
      },
    },

    // 빌드 최적화
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'test'),
      'process.env.VITEST': JSON.stringify('true'),
    },

    // 환경변수 설정
    envPrefix: ['NEXT_PUBLIC_', 'VITEST_'],
  };
});