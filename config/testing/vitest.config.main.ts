import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://mock-supabase-url.local',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-anon-key-for-testing',
      GOOGLE_AI_API_KEY: 'mock-google-ai-key-for-testing',
    },
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,ts,tsx}',
      'tests/**/*.{test,spec}.{js,ts,tsx}', // 🆕 tests/ 디렉토리 테스트 파일 포함
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'out/**',
      'gcp-functions/**',
      'tests/archive/**', // ✅ 아카이브된 테스트 제외 (jsdom 한계로 개선 불가능)
      'tests/e2e/**', // ✅ E2E 테스트 제외 (Playwright 전용, Vitest에서 실행 금지)
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        'src/**/*.stories.*',
        'src/**/*.test.*',
        'src/**/*.spec.*',
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
    pool: 'threads',
    isolate: true, // ✅ Enable test isolation to prevent state pollution
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 2,
        maxThreads: 4,
        useAtomics: true,
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'], // ✅ Auto-resolve .ts files in node environment
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@/components': path.resolve(__dirname, '../../src/components'),
      '@/lib': path.resolve(__dirname, '../../src/lib'),
      '@/services': path.resolve(__dirname, '../../src/services'),
      '@/utils': path.resolve(__dirname, '../../src/utils'),
      '@/types': path.resolve(__dirname, '../../src/types'),
      '@/app': path.resolve(__dirname, '../../src/app'),
      '@/hooks': path.resolve(__dirname, '../../src/hooks'),
      '@/domains': path.resolve(__dirname, '../../src/domains'),
      '@/schemas': path.resolve(__dirname, '../../src/schemas'),
    },
  },
  esbuild: {
    target: 'node14',
  },
});
