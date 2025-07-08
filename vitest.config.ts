import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],

    // 🎯 실제 배포 코드 품질 확인을 위한 테스트만 실행
    // 외부 의존성이 있는 통합 테스트는 제거하고 단위 테스트와 정적 분석에 집중
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      // 필수 통합 테스트만 유지 (Mock 사용)
      'tests/integration/environment-integration.test.ts', // 환경 감지 로직 검증
      // 외부 API 의존성 테스트는 제거
      // 'tests/integration/gcp-real-data.test.ts', // GCP 실제 API 의존성 제거
      // 'tests/integration/ai-router.test.ts', // AI API 의존성 제거
      // 'tests/integration/korean-nlp.test.ts', // 외부 NLP API 의존성 제거
      // 'tests/integration/supabase-rag.test.ts', // Supabase API 의존성 제거
    ],

    // 🚫 레거시 테스트 및 불필요한 파일 완전 제외
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
      // 레거시 AI 엔진 테스트 제외
      'tests/**/*legacy*.test.ts',
      'tests/**/*deprecated*.test.ts',
      'tests/**/*sharp*.test.ts',
      'tests/**/*old*.test.ts',
      'tests/**/*unified-ai-engine-v1*.test.ts',
      'tests/**/*optimized-engine*.test.ts',
      // 외부 API 의존성 테스트 제외
      'tests/integration/gcp-real-data.test.ts',
      'tests/integration/ai-router.test.ts',
      'tests/integration/korean-nlp.test.ts',
      'tests/integration/supabase-rag.test.ts',
      'tests/integration/env-backup.test.ts',
      'tests/integration/real-server-generator.test.ts',
      'tests/integration/system-state-management.test.ts',
      'tests/integration/data-generation-on-off.test.ts',
      'tests/integration/mcp-analysis.test.ts',
      'tests/integration/on-demand-health-check.test.ts',
      // 스토리북 관련 제외
      '**/*.stories.ts',
      '**/*.stories.tsx',
      '**/storybook-static/**',
      '**/.storybook/**',
      // 로컬 환경 의존적 테스트 제외
      '**/babel.test.ts',
      '**/webpack.test.ts',
      '**/port-conflict.test.ts',
    ],

    // 🔧 격리 환경 강화 - 테스트 품질 보장
    pool: 'threads',
    poolOptions: {
      threads: {
        isolate: true,
        singleThread: false,
        useAtomics: true,
        minThreads: 1,
        maxThreads: 4,
      },
    },
    // ⏱️ 타임아웃 최적화 - 빠른 피드백
    testTimeout: 15000, // 30초 → 15초 단축 (외부 API 호출 제거로 가능)
    hookTimeout: 3000,  // 5초 → 3초 단축
    teardownTimeout: 2000, // 3초 → 2초 단축

    // 🛡️ 테스트 격리 및 안정성 - 품질 보장
    isolate: true,
    passWithNoTests: false, // 빈 테스트 케이스 허용 안 함
    bail: 5, // 3개 → 5개 실패 시 중단 (단위 테스트 위주로 변경)
    retry: 0, // 1회 → 0회 (빠른 피드백, 안정적인 테스트만 유지)

    // 🚨 강제 종료 설정
    forceRerunTriggers: ['**/package.json', '**/vitest.config.*', '**/vite.config.*'],
    maxConcurrency: 6, // 4 → 6 (외부 API 호출 제거로 동시성 증가 가능)

    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      // 🎯 실제 배포 코드만 커버리지 측정
      include: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.stories.{ts,tsx}',
        '!src/**/*.test.{ts,tsx}',
        '!src/**/*.spec.{ts,tsx}',
      ],
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
        '**/storybook-static/**',
        '**/.storybook/**',
        '**/stories/**',
        // 테스트 전용 파일 제외
        'src/**/*.mock.{ts,tsx}',
        'src/**/*.fixture.{ts,tsx}',
      ],
      // 🎯 높은 커버리지 목표 설정
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70,
        },
      },
    },
    reporters: ['default', 'json', 'html'],
    outputFile: {
      json: './test-results/results.json',
      html: './test-results/index.html',
    },
    // 🌍 테스트 환경 변수 최적화
    env: {
      NODE_ENV: 'test',
      VITEST: 'true',
      // 🎭 Mock 모드 활성화
      ENABLE_MOCK_DATA: 'true',
      AI_ENGINE_MODE: 'mock',
      SUPABASE_RAG_ENABLED: 'false', // 외부 API 비활성화
      GOOGLE_AI_ENABLED: 'false',    // 외부 API 비활성화
      KOREAN_NLP_ENABLED: 'false',   // 외부 API 비활성화
      // 테스트 격리 환경
      TEST_ISOLATION: 'true',
      // 🚨 강제 종료 플래그
      FORCE_EXIT: 'true',
      CI: 'true',
    },
  },

  // 🚀 성능 최적화 설정
  optimizeDeps: {
    include: [
      // 필수 모듈만 포함
      '@vercel/analytics',
      '@vercel/speed-insights',
      'vitest',
      '@vitest/runner',
    ],
    exclude: [
      // 테스트에서 불필요한 모듈 제외
      'puppeteer',
      'onnxruntime-node',
      'sharp',
      '@google/generative-ai',
      '@supabase/supabase-js',
    ],
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '~': path.resolve(__dirname, './'),
    },
  },
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.VITEST': '"true"',
    'process.env.ENABLE_MOCK_DATA': '"true"',
    'process.env.FORCE_EXIT': '"true"',
    'process.env.CI': '"true"',
  },
});
