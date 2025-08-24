import { defineConfig } from 'vitest/config';

// 최소한의 CI 테스트 설정 - 빠른 실행을 위한 단순화
export default defineConfig({
  test: {
    name: 'ci-minimal',
    environment: 'node', // jsdom 대신 node 사용으로 빠른 실행
    include: ['tests/unit/type-guards.test.ts'],
    exclude: ['**/node_modules/**', '**/.backups/**'],
    globals: true,
    testTimeout: 3000,
    passWithNoTests: true,
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks: 1,
      },
    },
  },
});