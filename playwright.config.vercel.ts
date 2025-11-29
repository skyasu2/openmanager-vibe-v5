import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env.e2e') });

/**
 * Playwright E2E 테스트 설정 (Vercel Production 전용)
 *
 * webServer 설정 제거 - 외부 Vercel URL만 테스트
 *
 * @see https://playwright.dev/docs/test-configuration
 */
const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders = bypassSecret
  ? {
      'x-vercel-protection-bypass': bypassSecret,
    }
  : undefined;

export default defineConfig({
  // Load environment variables globally before any tests run
  globalSetup: require.resolve('./tests/support/globalSetup'),
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
      'https://openmanager-vibe-v5.vercel.app',
    extraHTTPHeaders,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',

    /* 타임아웃 설정 최적화 */
    actionTimeout: 30000, // 30초
    navigationTimeout: 60000, // 60초
  },

  /* 전역 타임아웃 설정 */
  timeout: 120000, // 2분
  expect: {
    timeout: 10000, // assertion 타임아웃 10초
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
          ],
        },
      },
    },
  ],

  /* webServer 설정 제거 - Vercel URL 직접 테스트 */
});
