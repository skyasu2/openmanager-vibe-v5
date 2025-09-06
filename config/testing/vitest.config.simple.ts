import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'simple',
    environment: 'jsdom',
    globals: true,
    
    // 가장 기본적인 테스트만 실행
    include: [
      'src/test-claude/**/*.test.{ts,tsx}',
      'src/test/**/*.test.{ts,tsx}',
    ],
    
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
    ],
    
    // 글로벌 셋업 제거 (서버 시작 없음)
    setupFiles: [resolve(process.cwd(), 'config/testing/vitest.setup.ts')],
    
    // 단순한 리포터
    reporters: [['default', { summary: false }]],
    
    // 성능 최적화
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 1,
      },
    },
    
    // 타임아웃 짧게 설정
    testTimeout: 5000,
    hookTimeout: 5000,
    
    // Mock 정리
    clearMocks: true,
    restoreMocks: true,
    
    // 기본 커버리지 설정
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/__tests__/**',
        'src/test/**',
        'src/test-claude/**',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },
  },
  
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
      '@/components': resolve(process.cwd(), 'src/components'),
      '@/lib': resolve(process.cwd(), 'src/lib'),
      '@/utils': resolve(process.cwd(), 'src/utils'),
      '@/types': resolve(process.cwd(), 'src/types'),
    },
  },
});