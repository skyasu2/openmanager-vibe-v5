import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'build', 'storybook-static'],
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    // 환경 변수 설정
    env: {
      NODE_ENV: 'test',
      JSDOM_CANVAS: 'mock',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  // Node.js 전용 모듈 처리
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs-node'],
    include: ['@tensorflow/tfjs'],
  },
});
