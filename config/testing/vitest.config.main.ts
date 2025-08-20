import path from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [],
    test: {
      globals: true,
      environment: 'node', // jsdom → node로 변경하여 성능 향상 (DOM 테스트는 별도 설정 사용)
      setupFiles: ['./src/test/setup.ts'],

      // 🎯 핵심 테스트만 실행
      include: [
        'src/test/**/*.test.{ts,tsx}', // 환경 설정 테스트
        'src/test-claude/**/*.test.{ts,tsx}', // TDD 테스트 파일 (Claude Code 전용)
        'src/**/__tests__/**/*.{test,spec}.{ts,tsx}', // 모든 __tests__ 디렉토리
        'tests/unit/**/*.test.{ts,tsx}',
        'tests/integration/**/*.test.{ts,tsx}',
        // E2E 테스트는 Playwright로 별도 실행
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
        // 성능 테스트 (별도 실행: npm run test:performance)
        '**/*.perf.test.{ts,tsx}',
        // E2E 테스트 (Playwright로 별도 실행: npm run test:e2e)
        '**/*.e2e.{ts,tsx}',
        '**/*.e2e.test.{ts,tsx}',
        '**/*.playwright.test.{ts,tsx}',
        'tests/e2e/**/*',
        // 제거된 기능들
        'tests/unit/distributed-data-manager.test.ts',
        'tests/unit/natural-language-query-cache.test.ts',
        'tests/unit/natural-language-unifier.test.ts',
      ],

      // 🎯 테스트 실행 최적화 - 개선된 설정
      maxConcurrency: 20, // 병렬 실행 증가
      pool: 'threads', // threads 사용
      poolOptions: {
        threads: {
          isolate: true, // 테스트 격리 활성화 (안정성 향상)
          minThreads: 2,
          maxThreads: 4, // CPU 코어에 맞게 조정
        }
      },
      isolate: true, // 테스트 격리 활성화로 안정성 향상
      
      // 🚀 성능 최적화 추가 옵션
      css: false, // CSS 처리 비활성화
      deps: {
        optimizer: {
          web: {
            enabled: true, // 의존성 최적화 활성화
          }
        }
      },

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

      // 🎯 성능 최적화 - 타임아웃 개선
      testTimeout: 15000, // 15초로 증가 (타임아웃 문제 해결)
      hookTimeout: 10000, // 10초 유지
      teardownTimeout: 10000, // 10초로 증가 (정리 작업 안정성)
      
      // 개별 테스트 타임아웃 설정
      bail: 1, // 첫 번째 실패에서 중단

      // 📝 리포터 설정 - Hanging 프로세스 감지 추가
      reporters: process.env.CI 
        ? ['github-actions'] 
        : ['default', 'hanging-process'],
      outputFile: {
        json: './test-results/results.json',
        html: './test-results/index.html',
      },

      // 🔧 Mock 설정 - 완전한 정리 강화
      mockReset: true,
      clearMocks: true,
      restoreMocks: true,
      unstubEnvs: true, // 환경변수 stub 정리
      unstubGlobals: true, // 글로벌 stub 정리
    },

    // 📦 Vite 설정
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../../src'),
        '@/components': path.resolve(__dirname, '../../src/components'),
        '@/lib': path.resolve(__dirname, '../../src/lib'),
        '@/utils': path.resolve(__dirname, '../../src/utils'),
        '@/types': path.resolve(__dirname, '../../src/types'),
        '@/services': path.resolve(__dirname, '../../src/services'),
        '@/core': path.resolve(__dirname, '../../src/core'),
        '@/modules': path.resolve(__dirname, '../../src/modules'),
        '@/test': path.resolve(__dirname, '../../src/test'),
        '~': path.resolve(__dirname, '../../'),
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
