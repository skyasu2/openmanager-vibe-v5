import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'dist', 'build', 'storybook-static'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
      SUPABASE_JWT_SECRET: 'test-jwt-secret',
      REDIS_URL: 'redis://localhost:6379',
      FORCE_MOCK_REDIS: 'true',
      FORCE_MOCK_GOOGLE_AI: 'true',
      GOOGLE_AI_ENABLED: 'false',
      GOOGLE_AI_QUOTA_PROTECTION: 'true',
      SLACK_WEBHOOK_URL: 'https://hooks.slack.com/test',
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    isolate: true,
    maxConcurrency: 1,
    reporters: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        'packages/*/test{,s}/**',
        '**/*.d.ts',
        'cypress/**',
        'test{,s}/**',
        'test{,-*}.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}test.{js,cjs,mjs,ts,tsx,jsx}',
        '**/*{.,-}spec.{js,cjs,mjs,ts,tsx,jsx}',
        '**/__tests__/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
        '**/.{eslint,mocha,prettier}rc.{js,cjs,yml}',
        'storybook-static/**',
        '.storybook/**',
        'src/stories/**',
        '**/*.stories.{js,jsx,ts,tsx}',
        '**/mocks/**',
        '**/__mocks__/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        }
      }
    },
    mockReset: true,
    clearMocks: true,
    restoreMocks: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './'),
    },
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': '"test"',
    'process.env.NEXT_PUBLIC_SUPABASE_URL': '"http://localhost:54321"',
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': '"test-key"',
    'process.env.FORCE_MOCK_REDIS': '"true"',
    'process.env.FORCE_MOCK_GOOGLE_AI': '"true"',
  },
  optimizeDeps: {
    include: ['@testing-library/jest-dom'],
  },
});
