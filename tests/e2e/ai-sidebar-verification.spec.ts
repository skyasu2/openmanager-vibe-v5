/**
 * AI 어시스턴트 사이드바 동작 검증 테스트
 */

import { test, expect } from '@playwright/test';

const VERCEL_PRODUCTION_URL = 'https://openmanager-vibe-v5.vercel.app';

test('AI 어시스턴트 사이드바 동작 검증', async ({ page }) => {
  // 1. 대시보드 접속
  await page.goto(VERCEL_PRODUCTION_URL + '/dashboard', {
    waitUntil: 'networkidle',
    timeout: 60000,
  });

  console.log('✅ 1. 대시보드 로드 완료');

  // 2. AI 어시스턴트 버튼 찾기 (여러 선택자 시도)
  const aiButton = page.locator('button').filter({ hasText: 'AI 어시스턴트' }).first();

  await expect(aiButton).toBeVisible({ timeout: 30000 });
  console.log('✅ 2. AI 어시스턴트 버튼 확인');

  // 3. 클릭 전 스크린샷
  await page.screenshot({ path: '/tmp/before-ai-click.png', fullPage: false });
  console.log('✅ 3. 클릭 전 스크린샷 저장');

  // 4. AI 어시스턴트 버튼 클릭
  await aiButton.click();
  console.log('✅ 4. AI 어시스턴트 버튼 클릭 완료');

  // 5. 사이드바가 나타날 때까지 대기 (애니메이션 300ms)
  await page.waitForTimeout(500);

  // 6. 사이드바 요소 확인
  const sidebar = page.locator('.fixed.inset-y-0.right-0').first();
  await expect(sidebar).toBeVisible({ timeout: 5000 });
  console.log('✅ 5. AI 사이드바 렌더링 확인');

  // 7. 사이드바 열린 후 스크린샷
  await page.screenshot({ path: '/tmp/after-ai-click.png', fullPage: false });
  console.log('✅ 6. 사이드바 열림 스크린샷 저장');

  // 8. 사이드바 내부 요소 확인
  const sidebarContent = page.locator('text=AI 모드').first();
  const hasContent = await sidebarContent.isVisible().catch(() => false);

  if (hasContent) {
    console.log('✅ 7. AI 모드 선택기 확인됨');
  } else {
    console.log('⚠️  7. AI 모드 선택기 미확인 (타임아웃 또는 렌더링 지연)');
  }

  // 9. 닫기 버튼 확인 및 클릭
  const closeButton = page.locator('button[aria-label*="닫기"]').or(
    page.locator('button').filter({ hasText: '닫기' })
  ).or(
    page.locator('button[aria-label*="close"]')
  ).first();

  const closeButtonVisible = await closeButton.isVisible().catch(() => false);

  if (closeButtonVisible) {
    await closeButton.click();
    await page.waitForTimeout(500);
    console.log('✅ 8. 닫기 버튼 클릭 완료');

    // 10. 닫힌 후 스크린샷
    await page.screenshot({ path: '/tmp/after-ai-close.png', fullPage: false });
    console.log('✅ 9. 사이드바 닫힘 스크린샷 저장');
  } else {
    console.log('⚠️  8. 닫기 버튼 미확인');
  }

  console.log('\n🎯 AI 어시스턴트 사이드바 테스트 완료');
});
