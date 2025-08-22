import { defineConfig, devices } from '@playwright/test';
import { config } from 'dotenv';

// 환경 변수 파일 로드 (.env.test 우선, .env.local 폴백)
config({ path: '.env.test' });
config({ path: '.env.local', override: false });

/**
 * Playwright E2E 테스트 설정 - v5.44.0 개선판
 *
 * @description
 * OpenManager Vibe v5 E2E 테스트 환경 설정
 * - 서버 타임아웃 해결
 * - 안정성 향상
 * - CI/CD 최적화
 */
export default defineConfig({
  // 테스트 디렉토리
  testDir: './tests/e2e',

  // 테스트 파일 패턴
  testMatch: '**/*.e2e.{ts,js}',

  // 전역 설정 - 단순화
  fullyParallel: true, // 병렬 실행으로 속도 향상
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0, // 로컬에서는 재시도 없음
  workers: 2, // 적절한 워커 수

  // 전역 타임아웃 설정
  timeout: 60000, // 테스트당 최대 1분
  expect: {
    timeout: 15000, // expect 타임아웃 15초
  },

  // 리포터 설정
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }],
    ['list'],
    ['junit', { outputFile: 'playwright-report/junit.xml' }],
  ],

  // 전역 설정 - 타임아웃 및 안정성 개선
  use: {
    // 기본 URL (로컬 개발 서버)
    baseURL: 'http://localhost:3000',

    // 브라우저 설정
    trace: 'retain-on-failure', // 실패 시 트레이스 보관
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // 타임아웃 대폭 증가 (서버 안정화 대기)
    actionTimeout: 45000, // 액션 타임아웃 45초
    navigationTimeout: 60000, // 네비게이션 타임아웃 1분

    // 네트워크 안정성 개선
    ignoreHTTPSErrors: true,
    bypassCSP: true,

    // 추가 안정성 설정
    launchOptions: {
      slowMo: process.env.CI ? 100 : 0, // CI에서 느린 실행
    },
  },

  // 프로젝트별 설정 - 단순화
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // MutationObserver 에러 방지를 위한 브라우저 최적화
        launchOptions: {
          args: [
            '--disable-web-security', // CORS 문제 방지
            '--disable-extensions', // 브라우저 확장 비활성화
            '--disable-dev-shm-usage', // /dev/shm 사용 비활성화
            '--no-sandbox', // 샌드박스 비활성화 (CI/CD 환경)
            '--disable-gpu', // GPU 가속 비활성화
            '--disable-background-timer-throttling', // 백그라운드 타이머 제한 비활성화
            '--disable-backgrounding-occluded-windows', // 백그라운드 창 제한 비활성화
            '--disable-renderer-backgrounding', // 렌더러 백그라운드 제한 비활성화
            '--disable-features=TranslateUI,VizDisplayCompositor', // 불필요한 기능 비활성화
          ],
          headless: true, // 헤드리스 모드 강제
        },
      },
    },
  ],

  // 개발 서버 설정 - 간소화 및 최적화
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true, // 항상 기존 서버 재사용
    timeout: 60000, // 서버 시작 타임아웃 1분으로 단축

    // 환경변수 설정 - dotenv로 로드된 환경변수 확인 및 전달
    env: {
      NODE_ENV: 'development', // instrumentation.ts 호환성을 위해 development 사용
      PORT: '3000',
      SKIP_ENV_VALIDATION: 'true',
      
      // Next.js devtools 비활성화 관련 환경변수들
      __NEXT_DISABLE_DEVTOOLS: 'true',
      NEXT_PRIVATE_STANDALONE: 'true', 
      __NEXT_TEST_MODE: 'true',
      NEXT_DISABLE_DEVTOOLS: 'true',
      NEXT_PRIVATE_DEBUG: 'false',
      NEXT_PRIVATE_REPORT_SIZE: 'false',
      
      // dotenv로 로드된 환경변수를 명시적으로 전달 (빈 문자열 대신 실제 값 확인)
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET!,
      
      // GitHub OAuth
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID!,
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET!,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      
      // Mock 설정 (테스트 안정성)
      MOCK_MODE: 'hybrid',
      FORCE_MOCK_SUPABASE: 'false',
      USE_REAL_SERVICES: 'true',
    },
  },

  // 전역 설정 파일 제거 (불필요한 복잡성 제거)
  // globalSetup과 globalTeardown은 실제로 필요할 때만 추가
});
