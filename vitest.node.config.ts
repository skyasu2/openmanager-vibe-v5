import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Node 환경에서는 브라우저 모킹을 사용하지 않음
    setupFiles: [],
    include: [
      'tests/unit/koreanTime.test.ts',
      'src/utils/**/*.test.ts',
      'tests/unit/**/*.node.test.ts',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/utils': path.resolve(__dirname, './src/utils'),
    },
  },
});