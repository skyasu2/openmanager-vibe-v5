import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'performance',
    environment: 'node',
    include: ['**/*.{test,spec}.{perf,performance}.{js,ts}'],
    testTimeout: 30000, // 성능 테스트는 더 긴 시간 필요
    hookTimeout: 10000,
    globals: true,
    reporters: ['verbose'],
    outputFile: {
      json: './coverage/performance-test-results.json',
    },
    benchmark: {
      include: ['**/*.{bench,benchmark}.{js,ts}'],
      exclude: ['node_modules'],
      reporters: ['verbose'],
      outputFile: {
        json: './coverage/benchmark-results.json',
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@/lib': resolve(__dirname, '../../src/lib'),
      '@/utils': resolve(__dirname, '../../src/utils'),
      '@/performance': resolve(__dirname, '../../src/performance'),
    },
  },
  esbuild: {
    target: 'node18',
  },
});