import path from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [],
    test: {
      globals: true,
      environment: 'node',
      setupFiles: ['./src/test/setup.ts'],

      // 🎯 성능 테스트만 실행
      include: [
        'src/**/*.perf.test.{ts,tsx}',
        'tests/**/*.perf.test.{ts,tsx}',
      ],

      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**',
        '**/build/**',
        '**/coverage/**',
      ],

      // 🎯 성능 테스트 최적화 설정
      maxConcurrency: 1, // 성능 테스트는 순차 실행
      pool: 'threads',
      poolOptions: {
        threads: {
          singleThread: true, // 성능 측정의 정확성을 위해 단일 스레드
          isolate: true, // 테스트 격리 활성화
        }
      },
      isolate: true,
      
      css: false,
      deps: {
        optimizer: {
          web: {
            enabled: true,
          }
        }
      },

      // 🎯 성능 테스트용 타임아웃 (더 길게)
      testTimeout: 60000, // 60초
      hookTimeout: 30000, // 30초  
      teardownTimeout: 10000, // 10초
      
      bail: false, // 모든 성능 테스트 실행

      // 📝 리포터 설정
      reporter: 'verbose',

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
      // 실제 서비스 사용을 위한 환경변수 전달
      'process.env.GOOGLE_AI_API_KEY': JSON.stringify(process.env.GOOGLE_AI_API_KEY),
      'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_URL),
      'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      'process.env.USE_REAL_SERVICES': JSON.stringify(process.env.USE_REAL_SERVICES),
      'process.env.FORCE_MOCK_GOOGLE_AI': JSON.stringify(process.env.FORCE_MOCK_GOOGLE_AI || 'false'),
      'process.env.FORCE_MOCK_SUPABASE': JSON.stringify(process.env.FORCE_MOCK_SUPABASE || 'false'),
    },

    // 🔧 환경변수 설정
    envPrefix: ['NEXT_PUBLIC_', 'VITEST_'],
  };
});