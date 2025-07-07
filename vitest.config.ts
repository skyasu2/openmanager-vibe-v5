import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],

    // 🎯 현재 아키텍처에 맞는 테스트만 실행
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/ai-router.test.ts',
      'tests/integration/korean-nlp.test.ts',
      'tests/integration/supabase-rag.test.ts',
      'tests/integration/env-backup.test.ts',
      // E2E 테스트는 Playwright로 실행하므로 Vitest 실행 대상에서 제외합니다.
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

    // 🔧 격리 환경 강화
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
    // ⏱️ 타임아웃 최적화 - 테스트 종료 문제 해결
    testTimeout: 30000, // 60초 → 30초 단축
    hookTimeout: 5000,  // 10초 → 5초 단축
    teardownTimeout: 3000, // 5초 → 3초 단축

    // 🛡️ 테스트 격리 및 안정성 - 강제 종료 설정 추가
    isolate: true,
    passWithNoTests: false, // 빈 테스트 케이스 허용 안 함
    bail: 3, // 5개 → 3개 실패 시 중단
    retry: 1, // 2회 → 1회 재시도로 단축

    // 🚨 강제 종료 설정 추가
    forceRerunTriggers: ['**/package.json', '**/vitest.config.*', '**/vite.config.*'],
    maxConcurrency: 4, // 동시 실행 테스트 수 제한

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
        '**/storybook-static/**',
        '**/.storybook/**',
        '**/stories/**',
      ],
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
      // AI 엔진 테스트 모드
      AI_ENGINE_MODE: 'test',
      SUPABASE_RAG_ENABLED: 'true',
      GOOGLE_AI_ENABLED: 'false',
      KOREAN_NLP_ENABLED: 'true',
      // 테스트 격리 환경
      TEST_ISOLATION: 'true',
      // 🚨 강제 종료 플래그 추가
      FORCE_EXIT: 'true',
      CI: 'true', // CI 환경으로 간주하여 더 빠른 종료
    },
  },

  // 🚀 현대화된 의존성 최적화 설정
  optimizeDeps: {
    include: [
      // 현재 아키텍처에 필요한 모듈만
      '@vercel/analytics',
      '@vercel/speed-insights',
    ],
    exclude: [
      // 제외할 모듈들
      'puppeteer',
      'onnxruntime-node',
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
    'process.env.FORCE_EXIT': '"true"',
    'process.env.CI': '"true"',
  },
});
