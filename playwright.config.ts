import { defineConfig, devices } from '@playwright/test';

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
        // 최소한의 설정만 유지
        launchOptions: {
          args: ['--disable-web-security'], // CORS 문제 방지만
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

    // 환경변수 설정
    env: {
      NODE_ENV: 'test',
      PORT: '3000',
      SKIP_ENV_VALIDATION: 'true',
    },
  },

  // 전역 설정 파일 제거 (불필요한 복잡성 제거)
  // globalSetup과 globalTeardown은 실제로 필요할 때만 추가
});
