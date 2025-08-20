import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'node',
    environment: 'node',
    include: ['**/*.{test,spec}.{node,server}.{js,ts}'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/*.d.ts',
      '**/*.browser.*',
      '**/*.dom.*',
    ],
    globals: true,
    reporters: ['verbose', 'json'],
    outputFile: {
      json: '../../coverage/node-test-results.json',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json'],
      include: ['../../src/**/*.{ts,js}'],
      exclude: [
        '../../src/components/**', // 브라우저 컴포넌트 제외
        '../../src/app/**',        // Next.js 페이지 제외
        '../../src/test/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@/lib': resolve(__dirname, '../../src/lib'),
      '@/utils': resolve(__dirname, '../../src/utils'),
      '@/types': resolve(__dirname, '../../src/types'),
    },
  },
});