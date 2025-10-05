import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'forks', // 안정적인 프로세스 격리 (Tinypool 워커 종료 문제 해결)
    poolOptions: {
      forks: {
        singleFork: false,
      }
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'tests/**',
        '**/*.config.ts',
        '**/*.d.ts'
      ]
    }
  }
});
