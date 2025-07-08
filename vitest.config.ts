import path from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],

      // 🎯 핵심 테스트만 실행 (불필요한 테스트 제거 후)
      include: [
        'src/test/**/*.test.{ts,tsx}',
        'tests/unit/**/*.test.{ts,tsx}',
        'tests/integration/**/*.test.{ts,tsx}',
        'tests/components/**/*.test.{ts,tsx}',
        'tests/gcp/**/*.test.{ts,tsx}',
      ],

      // 🚫 제거된 기능들 테스트 제외
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/build/**',
        '**/coverage/**',
        // 제거된 기능들 (더 이상 존재하지 않는 디렉토리)
        'tests/redis/**',
        'tests/health-check/**',
        'tests/monitoring/**',
        'tests/cleanup/**',
        // 제거된 AI 모드 관련 테스트
        'tests/integration/three-tier-router.test.ts',
        'tests/**/auto-mode/**',
        'tests/**/fallback-system/**',
      ],

      // 🎯 테스트 실행 최적화
      threads: true,
      maxConcurrency: 6,
      minThreads: 1,
      maxThreads: 4,

      // 📊 커버리지 설정 (핵심 기능만)
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'coverage/**',
          'dist/**',
          'packages/*/test{,s}/**',
          '**/*.d.ts',
          '**/*.test.{ts,tsx}',
          '**/*.spec.{ts,tsx}',
          '**/*.config.{ts,js}',
          'src/test/**',
          'tests/**',
          // 제거된 기능들 제외
          'src/services/health-check/**',
          'src/services/monitoring/**',
          'src/services/redis/**',
          'src/components/health-check/**',
          'src/components/monitoring/**',
        ],
        // 핵심 기능 커버리지 임계값
        thresholds: {
          branches: 75,
          functions: 75,
          lines: 80,
          statements: 80,
        },
      },

      // 🔄 Watch 모드 설정 (moved to root level)

      // 🎯 성능 최적화
      testTimeout: 30000,
      hookTimeout: 10000,
      teardownTimeout: 10000,

      // 📝 리포터 설정
      reporter: process.env.CI ? 'github-actions' : 'verbose',
      outputFile: {
        json: './test-results/results.json',
        html: './test-results/index.html',
      },

      // 🔧 Mock 설정
      mockReset: true,
      clearMocks: true,
      restoreMocks: true,
    },

    // 📦 Vite 설정
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@/components': path.resolve(__dirname, './src/components'),
        '@/lib': path.resolve(__dirname, './src/lib'),
        '@/utils': path.resolve(__dirname, './src/utils'),
        '@/types': path.resolve(__dirname, './src/types'),
        '@/services': path.resolve(__dirname, './src/services'),
        '@/core': path.resolve(__dirname, './src/core'),
        '@/modules': path.resolve(__dirname, './src/modules'),
        '@/test': path.resolve(__dirname, './src/test'),
        '~': path.resolve(__dirname, './'),
      },
    },

    // 🎯 빌드 최적화
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'test'),
      'process.env.VITEST': JSON.stringify('true'),
    },

    // 🔄 Watch 모드 설정
    server: {
      watch: {
        ignored: [
          '**/node_modules/**',
          '**/dist/**',
          '**/.next/**',
          '**/coverage/**',
        ],
      },
    },

    // 🔧 환경변수 설정
    envPrefix: ['NEXT_PUBLIC_', 'VITEST_'],
  };
});
