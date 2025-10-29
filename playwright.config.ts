import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Explicitly load .env file to ensure environment variables are available
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Validate critical environment variables
if (!process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
  console.error('❌ VERCEL_AUTOMATION_BYPASS_SECRET not loaded from .env file');
  throw new Error(
    'Environment variable validation failed: VERCEL_AUTOMATION_BYPASS_SECRET is required'
  );
}

console.log('✅ Environment variables loaded from .env');
console.log(
  `📍 VERCEL_AUTOMATION_BYPASS_SECRET: ${process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.substring(0, 10)}...`
);

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL:
      process.env.PLAYWRIGHT_BASE_URL ||
      'https://openmanager-vibe-v5-skyasus-projects.vercel.app',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    /* Phase 17.1: 'retain-on-failure'로 변경 - 실패 시 항상 trace 생성 (로컬 환경에서도) */
    trace: 'retain-on-failure',

    /* 타임아웃 설정 최적화 (2025-09-28) */
    actionTimeout: 30000, // 30초 (기존 15초에서 증가)
    navigationTimeout: 60000, // 60초 (네트워크 지연 고려)
  },

  /* 전역 타임아웃 설정 */
  timeout: 120000, // 2분 (전체 테스트 타임아웃)
  expect: {
    timeout: 10000, // assertion 타임아웃 10초
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Playwright 자체 최신 Chromium 사용 (자동 선택)
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },

    /* Firefox, WebKit 제거 (2025-10-12 WSL 환경 최적화)
     * 이유:
     * - Chromium/Chrome 프로덕션 점유율 90%+
     * - Firefox/WebKit ROI 낮음 (3% 이하)
     * - 테스트 속도 3배 향상
     * - 디스크 공간 1.6GB 절약
     * - WSL 환경에서 Chromium 헤드리스 최적화
     * - MCP 통합 (Playwright + Serena 모두 Chromium 사용)
     */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* 베르셀 프로덕션 환경 사용으로 로컬 서버 시작 비활성화 */
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000, // 2분 타임아웃
  // },
});
