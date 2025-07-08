import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    maxConcurrency: 4,
    pool: 'forks',
    maxWorkers: 4,
    minWorkers: 2,
    silent: false,
    reporters: ['verbose', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.test.{js,ts,tsx}',
        'src/**/*.spec.{js,ts,tsx}',
        'src/**/*.d.ts',
        'src/**/*.config.{js,ts}',
      ],
    },
    // 🔧 동적 테스트 vs 정적 분석 분리 설정
    isolate: true,
    // 정적 분석 관련 설정
    typecheck: {
      enabled: false, // 별도 script로 실행
    },
    // 동적 테스트 설정
    testTimeout: 30000,
    hookTimeout: 10000,
    // 환경 변수 설정
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
      FORCE_EXIT: 'true',
      CI: 'true',
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/components': resolve(__dirname, 'src/components'),
      '@/lib': resolve(__dirname, 'src/lib'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/services': resolve(__dirname, 'src/services'),
      '@/core': resolve(__dirname, 'src/core'),
      '@/test': resolve(__dirname, 'src/test'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  },
});
