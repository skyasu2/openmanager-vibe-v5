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

  // 전역 설정 - 안정성 개선
  fullyParallel: false, // 순차 실행으로 안정성 향상
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // 재시도 횟수 증가
  workers: process.env.CI ? 1 : 2, // 워커 수 제한으로 안정성 확보

  // 전역 타임아웃 설정
  timeout: 60000, // 테스트당 최대 1분
  expect: {
    timeout: 15000, // expect 타임아웃 15초
  },

  // 리포터 설정
  reporter: [
    ['html', { open: 'never', outputFolder: 'test-results/e2e-report' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['list'],
    ['junit', { outputFile: 'test-results/e2e-results.xml' }],
  ],

  // 전역 설정 - 타임아웃 및 안정성 개선
  use: {
    // 기본 URL (로컬 개발 서버)
    baseURL: 'http://localhost:3002',

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

  // 프로젝트별 설정 - Chrome 중심으로 안정성 확보
  projects: [
    {
      name: 'chromium-stable',
      use: {
        ...devices['Desktop Chrome'],
        // Chrome 안정성 설정
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
          ],
        },
      },
    },
    // CI에서는 Chrome만 테스트 (안정성 우선)
    ...(process.env.CI
      ? []
      : [
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] },
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] },
        },
        // 모바일 테스트 (로컬에서만)
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
      ]
    ),
  ],

  // 개발 서버 설정 - 안정성 대폭 개선
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
    timeout: 180000, // 서버 시작 타임아웃 3분

    // 환경변수 설정
    env: {
      NODE_ENV: 'test',
      PORT: '3002',
      SKIP_ENV_VALIDATION: 'true',
    },
  },

  // 전역 설정 파일 - ES 모듈 호환성 수정
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
});
