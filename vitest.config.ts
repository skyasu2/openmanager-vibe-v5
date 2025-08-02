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

      // 🎯 핵심 테스트만 실행
      include: [
        'src/test/**/*.test.{ts,tsx}', // 환경 설정 테스트
        'src/**/__tests__/**/*.{test,spec}.{ts,tsx}', // 모든 __tests__ 디렉토리
        'tests/unit/**/*.test.{ts,tsx}',
        'tests/integration/**/*.test.{ts,tsx}',
        'tests/e2e/**/*.test.{ts,tsx}', // E2E 테스트 추가
        'tests/performance/**/*.test.{ts,tsx}',
        'tests/api/**/*.test.{ts,tsx}', // API 테스트 추가
      ],

      // 🚫 제거된 기능들 테스트 제외
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/build/**',
        '**/coverage/**',
        // 제거된 기능들
        'tests/unit/distributed-data-manager.test.ts',
        'tests/unit/natural-language-query-cache.test.ts',
        'tests/unit/natural-language-unifier.test.ts',
      ],

      // 🎯 테스트 실행 최적화 (리소스 경합 방지)
      threads: true,
      maxConcurrency: 3, // 6 → 3으로 감소
      minThreads: 1,
      maxThreads: 2, // 4 → 2로 감소
      pool: 'forks', // threads → forks (더 안정적)

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

      // 🎯 성능 최적화 - 환경별 타임아웃 설정
      testTimeout: (() => {
        const base = 45000; // 기본 45초로 증가
        const multiplier = parseFloat(process.env.TIMEOUT_MULTIPLIER || '1');
        const isCI = process.env.CI === 'true';
        const isDev = process.env.NODE_ENV === 'development';
        
        // CI: 기본값, 개발: 1.5배, 환경변수로 추가 조절
        let timeout = base;
        if (isDev && !isCI) timeout *= 1.5; // 개발환경 67.5초
        if (isCI) timeout *= 0.8; // CI환경 36초
        
        return Math.round(timeout * multiplier);
      })(),
      hookTimeout: 60000, // 10초 → 60초로 증가
      teardownTimeout: 30000, // 10초 → 30초로 증가

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
