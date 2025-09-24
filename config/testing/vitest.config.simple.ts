import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * 📊 커버리지 테스트 설정 - Mock 제거 후 단순화
 * 순수 함수와 유틸리티 중심의 커버리지 측정
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'src/utils/**/*.{test,spec}.{js,ts}',
      'tests/unit/**/*.{test,spec}.{js,ts}',
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
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/**/*.{js,ts}',
        'src/lib/**/*.{js,ts}',
        'src/types/**/*.{js,ts}',
      ],
      exclude: [
        'node_modules/**',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.*',
        'src/**/*.stories.*',
        'src/**/*.test.*',
        'src/**/*.spec.*',
        // Mock이 복잡한 서비스들 제외
        'src/services/ai/**',
        'src/app/api/**',
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    testTimeout: 5000,
    hookTimeout: 5000,
    pool: 'vmThreads',
    isolate: false,
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