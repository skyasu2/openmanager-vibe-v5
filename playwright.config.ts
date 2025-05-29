import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E 테스트 설정
 * 
 * @description
 * OpenManager Vibe v5.11.0 E2E 테스트 환경 설정
 * Vercel 배포와 독립적으로 실행되는 테스트 환경
 */
export default defineConfig({
  // 테스트 디렉토리
  testDir: './e2e',
  
  // 테스트 파일 패턴
  testMatch: '**/*.e2e.{ts,js}',
  
  // 전역 설정
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // 리포터 설정
  reporter: [
    ['html', { open: 'never' }],
    ['json', { outputFile: 'e2e-results.json' }],
    ['list'],
  ],
  
  // 전역 설정
  use: {
    // 기본 URL (로컬 개발 서버)
    baseURL: 'http://localhost:3004',
    
    // 브라우저 설정
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // 타임아웃
    actionTimeout: 30000,
    navigationTimeout: 30000,
  },

  // 프로젝트별 설정 (다중 브라우저 테스트)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // 모바일 테스트
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  // 개발 서버 설정 (테스트 시 자동 시작)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3004',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
}); 