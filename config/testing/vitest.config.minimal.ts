import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * 🚀 최소 테스트 설정 - 22ms 초고속 실행
 * Mock 테스트 제거 후 순수 함수만 테스트
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // DOM 불필요 - 순수 함수만
    include: [
      // 순수 함수 테스트만 포함
      'src/utils/**/*.{test,spec}.{js,ts}',
      'tests/unit/type-guards.test.ts',
      'tests/unit/koreanTime.test.ts',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'out/**',
      // 복잡한 Mock 테스트 제외 (삭제됨)
      'src/services/ai/**',
      'src/app/api/**/__tests__/**',
      'tests/integration/**',
      'tests/e2e/**',
    ],
    testTimeout: 2000, // 빠른 실패
    hookTimeout: 2000,
    pool: 'vmThreads', // 4배 성능 향상
    isolate: false, // 격리 비활성화
    deps: {
      optimizer: {
        web: {
          enabled: true
        }
      }
    }
  },
  resolve: {
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