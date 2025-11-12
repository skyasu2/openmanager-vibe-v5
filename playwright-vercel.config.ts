import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * 🚀 Vercel 실제 환경용 Playwright 설정
 * Mock 없는 진짜 프로덕션 테스트
 */

const baseURL =
  process.env.TEST_BASE_URL ||
  process.env.VERCEL_PRODUCTION_URL ||
  'https://openmanager-vibe-v5.vercel.app';

const bypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
const extraHTTPHeaders = bypassSecret
  ? {
      'x-vercel-protection-bypass': bypassSecret,
    }
  : undefined;

export default defineConfig({
  globalSetup: require.resolve('./globalSetup'),
  testDir: './tests/e2e',

  /* 실제 환경 테스트를 위한 설정 */
  fullyParallel: false, // 실제 환경에서는 순차 실행
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // 실제 환경에서는 재시도 허용
  workers: process.env.CI ? 1 : 1, // 실제 환경에서는 단일 워커

  /* 실제 환경 대응 타임아웃 */
  timeout: 60000, // 60초 (실제 환경 고려)
  expect: {
    timeout: 15000, // 15초 (네트워크 지연 고려)
  },

  /* 리포터 설정 */
  reporter: [
    ['html', { outputFolder: 'test-results/vercel-e2e-report' }],
    ['json', { outputFile: 'test-results/vercel-e2e-results.json' }],
    ['list'],
  ],

  /* 실제 환경 전용 글로벌 설정 */
  use: {
    baseURL,
    extraHTTPHeaders,

    /* 실제 환경 네트워크 설정 */
    actionTimeout: 15000,
    navigationTimeout: 30000,

    /* 스크린샷 및 비디오 (실패 시만) */
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',

    /* 실제 사용자 시뮬레이션 */
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },

    /* 실제 환경 대응 */
    ignoreHTTPSErrors: false,
    acceptDownloads: true,
  },

  /* 실제 환경 테스트 브라우저 */
  projects: [
    {
      name: 'vercel-chromium',
      use: {
        ...devices['Desktop Chrome'],
        // 실제 환경에서 Chrome만 테스트 (안정성 우선)
      },
    },

    /* 필요시 추가 브라우저 테스트 */
    // {
    //   name: 'vercel-firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    /* 모바일 테스트 (실제 환경) */
    // {
    //   name: 'vercel-mobile-chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
  ],

  /* 실제 환경 서버 설정 (외부 서버 사용) */
  // webServer는 사용하지 않음 (외부 Vercel 서버 사용)

  /* 테스트 결과 저장 */
  outputDir: 'test-results/vercel-e2e-artifacts',
});
