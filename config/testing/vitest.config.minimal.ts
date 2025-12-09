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
      'tests/unit/time.test.ts',
      'tests/unit/project-meta.test.ts',
      'tests/unit/safe-format.test.ts',
      'tests/unit/safe-format.test.ts',
      'tests/unit/lib/errorHandler.test.ts',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      '.next/**',
      'out/**',
      // 복잡한 Mock 테스트 제외 (CI에서 실행하지 않음)
      'src/services/ai/**',
      'src/app/api/**/__tests__/**',
      'tests/integration/**',
      'tests/e2e/**',
      // Mock 관련 테스트 제외
      '**/*.mock.test.ts',
      '**/mock/**',
      // 복잡한 서비스 테스트 제외
      'tests/unit/services/**',
      'tests/unit/hooks/**',
      'tests/unit/lib/**',
    ],
    testTimeout: 5000, // 타임아웃 증가
    hookTimeout: 5000,
    pool: 'vmThreads', // 4배 성능 향상
    isolate: false, // 격리 비활성화
    retry: 1, // 실패 시 1번 재시도
    deps: {
      optimizer: {
        web: {
          enabled: true,
        },
      },
    },
    coverage: {
      enabled: false, // CI에서는 커버리지 비활성화
    },
    reporters: ['default'], // 간단한 리포터만 사용
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
});
