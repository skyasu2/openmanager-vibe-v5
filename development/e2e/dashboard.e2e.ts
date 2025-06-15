import { test, expect } from '@playwright/test';

/**
 * 대시보드 E2E 테스트
 * 
 * @description
 * OpenManager Vibe v5.11.0 대시보드 핵심 기능 E2E 테스트
 * 실제 사용자 시나리오를 시뮬레이션
 */

test.describe('📊 Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 대시보드 페이지로 이동
    await page.goto('/');
    
    // 페이지 로딩 완료 대기
    await page.waitForLoadState('networkidle');
  });

  test('🏠 대시보드 메인 페이지 로딩 테스트', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/OpenManager Vibe/);
    
    // 메인 헤더 존재 확인
    await expect(page.locator('header')).toBeVisible();
    
    // OpenManager 브랜드 확인 (더 구체적인 선택자 사용)
    await expect(page.locator('h1').filter({ hasText: 'OpenManager' })).toBeVisible();
    
    // AI 서버 모니터링 텍스트 확인
    await expect(page.getByText('AI 서버 모니터링')).toBeVisible();
    
    console.log('✅ 대시보드 메인 페이지 로딩 성공');
  });

  test('📈 서버 통계 표시 테스트', async ({ page }) => {
    // 데스크탑 뷰포트로 설정 (서버 통계는 md: 이상에서만 표시)
    await page.setViewportSize({ width: 1200, height: 800 });
    
    // 서버 통계 컨테이너 확인
    const statsContainer = page.locator('[role="status"][aria-label="서버 통계"]');
    await expect(statsContainer).toBeVisible();
    
    // 전체 서버 수 표시 확인
    await expect(page.getByText('전체 서버')).toBeVisible();
    
    // 온라인 서버 표시 확인
    await expect(page.getByText('온라인')).toBeVisible();
    
    // 경고 상태 서버 표시 확인
    await expect(page.getByText('경고')).toBeVisible();
    
    // 오프라인 서버 표시 확인
    await expect(page.getByText('오프라인')).toBeVisible();
    
    console.log('✅ 서버 통계 표시 확인 완료');
  });

  test('🤖 AI 에이전트 토글 테스트', async ({ page }) => {
    // AI 에이전트 버튼 찾기
    const agentButton = page.getByRole('button', { name: /ai 에이전트/i });
    await expect(agentButton).toBeVisible();
    
    // 초기 상태 확인 (닫힌 상태)
    await expect(agentButton).toHaveAttribute('aria-pressed', 'false');
    
    // AI 에이전트 열기
    await agentButton.click();
    
    // 열린 상태 확인
    await expect(agentButton).toHaveAttribute('aria-pressed', 'true');
    
    // 다시 클릭하여 닫기
    await agentButton.click();
    
    // 닫힌 상태 확인
    await expect(agentButton).toHaveAttribute('aria-pressed', 'false');
    
    console.log('✅ AI 에이전트 토글 동작 확인 완료');
  });

  test('🏠 홈 버튼 네비게이션 테스트', async ({ page }) => {
    // 홈 버튼 찾기 (aria-label로 더 구체적 선택)
    const homeButton = page.getByRole('button', { name: '홈으로 이동' });
    await expect(homeButton).toBeVisible();
    
    // 홈 버튼 클릭
    await homeButton.click();
    
    // 페이지가 홈으로 이동했는지 확인 (URL 체크)
    await expect(page).toHaveURL('/');
    
    console.log('✅ 홈 버튼 네비게이션 확인 완료');
  });

  test('📱 반응형 디자인 테스트', async ({ page }) => {
    // 데스크탑 뷰 (기본) - 서버 통계가 보여야 함
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[role="status"][aria-label="서버 통계"]')).toBeVisible();
    
    // 태블릿 뷰 - 서버 통계가 여전히 보여야 함
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // 애니메이션 대기
    await expect(page.locator('[role="status"][aria-label="서버 통계"]')).toBeVisible();
    
    // 모바일 뷰 - 서버 통계가 숨겨져야 함 (hidden md:flex)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500); // 애니메이션 대기
    
    // 모바일에서 메인 요소들이 여전히 보이는지 확인
    await expect(page.locator('h1').filter({ hasText: 'OpenManager' })).toBeVisible();
    await expect(page.getByRole('button', { name: /ai 에이전트/i })).toBeVisible();
    
    console.log('✅ 반응형 디자인 확인 완료');
  });

  test('⚡ 페이지 성능 테스트', async ({ page }) => {
    // 페이지 로딩 시작 시간 측정
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const endTime = Date.now();
    const loadTime = endTime - startTime;
    
    // 로딩 시간이 10초 이내인지 확인 (개발 환경 고려)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`✅ 페이지 로딩 시간: ${loadTime}ms`);
  });

  test('♿ 접근성 기본 테스트', async ({ page }) => {
    // 헤더 요소의 역할 확인
    await expect(page.locator('header')).toBeVisible();
    
    // 홈 버튼 접근성 확인
    const homeButton = page.getByRole('button', { name: '홈으로 이동' });
    await expect(homeButton).toHaveAttribute('aria-label');
    
    // AI 에이전트 버튼 접근성 확인
    const agentButton = page.getByRole('button', { name: /ai 에이전트/i });
    await expect(agentButton).toHaveAttribute('aria-label');
    await expect(agentButton).toHaveAttribute('aria-pressed');
    
    // 데스크탑에서 서버 통계의 role 확인
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('[role="status"][aria-label="서버 통계"]')).toBeVisible();
    
    console.log('✅ 접근성 기본 요소 확인 완료');
  });
}); 