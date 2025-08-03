import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * 최소한의 Vitest 설정 - 초고속 테스트 실행용
 * Pre-push 및 빠른 검증용
 */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // 순수 Node 환경으로 최대 속도
    setupFiles: [], // setup 파일 비활성화로 초기화 시간 제거
    
    // 가장 중요한 테스트만 포함
    include: [
      'src/test/env.test.ts',
      'src/test/config.test.ts',
      // tests/unit/core 디렉토리가 없으므로 제거
    ],
    
    // 웹 검색 기반 최적 설정 (4x 성능 향상)
    maxConcurrency: 20,
    pool: 'threads', // threads로 변경 (vmThreads는 isolate: false와 호환 불가)
    poolOptions: {
      threads: {
        singleThread: false, // 멀티 스레드로 성능 향상
        isolate: false, // 스레드 격리 비활성화
      }
    },
    isolate: false, // 격리 비활성화로 성능 극대화
    
    // 성능 최적화 추가 옵션
    css: false,
    deps: {
      optimizer: {
        web: {
          enabled: true,
        }
      }
    },
    
    // 극도로 짧은 타임아웃
    testTimeout: 1000, // 1초
    hookTimeout: 500, // 0.5초
    teardownTimeout: 500,
    bail: 1, // 첫 실패 시 즉시 중단
    
    // 리포터 최소화
    reporters: ['default'],
    
    // Mock 비활성화
    mockReset: false,
    clearMocks: false,
    restoreMocks: false,
  },
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/test': path.resolve(__dirname, './src/test'),
    },
  },
});