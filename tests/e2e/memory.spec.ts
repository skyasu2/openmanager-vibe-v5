
import { test, expect, Page } from '@playwright/test';
import { resetGuestState, guestLogin } from './helpers/guest';
import { ensureVercelBypassCookie } from './helpers/security';

test.describe('🧠 메모리 누수 감지', () => {
  
  test.beforeEach(async ({ page }) => {
    await resetGuestState(page);
    await ensureVercelBypassCookie(page);
  });

  test.afterEach(async ({ page }) => {
    await resetGuestState(page);
  });

  test('메모리 사용량 모니터링', async ({ page }) => {
    const initialMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
    
    await guestLogin(page);
    
    const aiButton = page.locator('[data-testid="ai-assistant"], button:has-text("AI")').first();
    if (await aiButton.count() > 0) {
      for (let i = 0; i < 5; i++) {
        await aiButton.click();
        await page.waitForTimeout(500);
        await aiButton.click();
        await page.waitForTimeout(500);
      }
    }
    
    const finalMemory = await page.evaluate(() => (performance as any).memory?.usedJSHeapSize);
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory;
      const increasePercent = (memoryIncrease / initialMemory) * 100;
      
      console.log('📊 최종 메모리 분석:', {
        증가량: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        증가율: `${increasePercent.toFixed(2)}%`,
      });
      
      expect(increasePercent).toBeLessThan(50);
      console.log('✅ 메모리 누수 검사 통과');
    } else {
      console.log('ℹ️ Memory API를 사용할 수 없어 테스트를 건너뜁니다.');
    }
  });

  test('DOM 노드 누수 감지', async ({ page }) => {
    await guestLogin(page);
    const initialNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    console.log(`📊 초기 DOM 노드 수: ${initialNodeCount}`);
    
    const aiButton = page.locator('[data-testid="ai-assistant"], button:has-text("AI")').first();
    if (await aiButton.count() > 0) {
      for (let i = 0; i < 5; i++) {
        await aiButton.click();
        await page.waitForTimeout(300);
        await aiButton.click();
        await page.waitForTimeout(300);
      }
    }
    
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    await page.waitForTimeout(1000);
    
    const finalNodeCount = await page.evaluate(() => document.querySelectorAll('*').length);
    const nodeIncrease = finalNodeCount - initialNodeCount;
    const increasePercent = (nodeIncrease / initialNodeCount) * 100;
    
    console.log('📊 DOM 노드 분석:', {
      초기: initialNodeCount,
      최종: finalNodeCount,
      증가: nodeIncrease,
      증가율: `${increasePercent.toFixed(2)}%`
    });
    
    expect(increasePercent).toBeLessThan(30);
    console.log('✅ DOM 노드 누수 검사 통과');
  });
});
