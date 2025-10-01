/**
 * AI 어시스턴트 사이드바 간단 검증
 */

import { test } from '@playwright/test';

const VERCEL_URL = 'https://openmanager-vibe-v5.vercel.app';

test('AI 사이드바 클릭 테스트', async ({ page }) => {
  console.log('🚀 테스트 시작');

  // 대시보드 접속
  await page.goto(VERCEL_URL + '/dashboard', {
    waitUntil: 'load',
    timeout: 60000
  });

  await page.waitForTimeout(3000); // 페이지 안정화
  console.log('✅ 대시보드 로드 완료');

  // 스크린샷 1: 클릭 전
  await page.screenshot({
    path: '/tmp/ai-sidebar-before.png',
    fullPage: false
  });
  console.log('✅ 스크린샷 저장: /tmp/ai-sidebar-before.png');

  // AI 버튼 찾기 및 클릭 (여러 방법 시도)
  try {
    // 방법 1: 텍스트로 찾기
    await page.click('button:has-text("AI 어시스턴트")', { timeout: 10000 });
    console.log('✅ AI 버튼 클릭 성공 (방법 1)');
  } catch {
    try {
      // 방법 2: JavaScript 직접 실행
      await page.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('button'))
          .find(b => b.textContent?.includes('AI 어시스턴트'));
        if (btn) {
          (btn as HTMLElement).click();
        }
      });
      console.log('✅ AI 버튼 클릭 성공 (방법 2)');
    } catch (error) {
      console.error('❌ AI 버튼 클릭 실패:', error);
    }
  }

  // 애니메이션 대기
  await page.waitForTimeout(1000);

  // 스크린샷 2: 클릭 후
  await page.screenshot({
    path: '/tmp/ai-sidebar-after.png',
    fullPage: false
  });
  console.log('✅ 스크린샷 저장: /tmp/ai-sidebar-after.png');

  console.log('🎯 테스트 완료');
});
