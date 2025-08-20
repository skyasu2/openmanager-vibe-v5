import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    name: 'dom',
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{dom,browser}.{js,ts,jsx,tsx}'],
    setupFiles: ['../../src/test/setup-dom.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../src'),
      '@/components': resolve(__dirname, '../../src/components'),
      '@/lib': resolve(__dirname, '../../src/lib'),
      '@/hooks': resolve(__dirname, '../../src/hooks'),
      '@/types': resolve(__dirname, '../../src/types'),
    },
  },
});