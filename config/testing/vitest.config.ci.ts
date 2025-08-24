import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'ci',
    environment: 'jsdom',
    include: [
      'src/**/*.test.{ts,tsx}', 
      'src/**/__tests__/**/*.test.{ts,tsx}', 
      'tests/unit/**/*.test.{ts,tsx}', 
      'tests/**/*.test.{ts,tsx}'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/.backups/**', // 백업 폴더 제외
      '**/backups/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*'
    ],
    globals: true,
    reporters: ['verbose'],
    pool: 'threads',
    poolOptions: {
      threads: {
        minThreads: 1,
        maxThreads: 2,
      },
    },
    setupFiles: [resolve(process.cwd(), 'config/testing/vitest.setup.ts')],
    // CI 환경에서는 globalSetup 제거 (테스트 서버 불필요)
    testTimeout: 10000, // 10초 타임아웃
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      '@': resolve(process.cwd(), 'src'),
      '@/components': resolve(process.cwd(), 'src/components'),
      '@/lib': resolve(process.cwd(), 'src/lib'),
      '@/hooks': resolve(process.cwd(), 'src/hooks'),
      '@/types': resolve(process.cwd(), 'src/types'),
    },
  },
});