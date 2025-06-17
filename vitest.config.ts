import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'build', 'storybook-static'],
    testTimeout: 30000,
    hookTimeout: 15000,
    teardownTimeout: 5000,
    env: {
      NODE_ENV: 'test',
      JSDOM_CANVAS: 'mock',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true,
      },
    },
    isolate: true,
    maxConcurrency: 1,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@tensorflow/tfjs-node', 'ioredis'],
    include: [
      '@tensorflow/tfjs',
      '@testing-library/react',
      '@testing-library/jest-dom',
    ],
  },
});
