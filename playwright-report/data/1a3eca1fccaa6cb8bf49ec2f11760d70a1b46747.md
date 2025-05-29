# Test info

- Name: 📊 Dashboard E2E Tests >> 📈 서버 통계 표시 테스트
- Location: D:\cursor\openmanager-vibe-v5\openmanager-vibe-v5\e2e\dashboard.e2e.ts:36:7

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('[role="status"][aria-label="서버 통계"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('[role="status"][aria-label="서버 통계"]')

    at D:\cursor\openmanager-vibe-v5\openmanager-vibe-v5\e2e\dashboard.e2e.ts:42:34
```

# Page snapshot

```yaml
- main:
  - link "OpenManager AI 서버 모니터링":
    - /url: /
    - heading "OpenManager" [level=2]
    - paragraph: AI 서버 모니터링
  - 'button "관리자 AI: 비활성화됨"'
  - heading "OpenManager AI" [level=1]
  - heading "지능형 AI 에이전트" [level=3]
  - paragraph:
    - strong: 지능형 AI 에이전트로 서버 관리를 혁신합니다
    - strong: 자연어 질의, 지능형 분석, 예측 알림으로
    - strong: IT 운영을 완전히 자동화합니다
  - text: 시스템 종료됨
  - paragraph:
    - text: 모든 서비스가 중지되었습니다.
    - strong: 아래 버튼을 눌러 시스템을 다시 시작하세요.
  - text: 👉
  - button "🚀 시스템 시작"
  - paragraph:
    - strong: "통합 시스템 시작:"
    - text: 서버 시딩 → 시뮬레이션 → 데이터 생성 → AI 에이전트 모든 서비스가 자동으로 순차 시작됩니다 (60분간 활성화)
  - heading "자연어 AI 에이전트" [level=3]
  - paragraph: 지능형 AI 엔진 기반으로 자연어 질의를 실시간 분석하여 서버 상태를 즉시 응답합니다.
  - heading "지능형 분석 시스템" [level=3]
  - paragraph: 근본원인 분석기, 예측 알림, 솔루션 추천 엔진으로 서버 문제를 사전에 예방하고 해결합니다.
  - heading "자동 보고서 생성" [level=3]
  - paragraph: AI가 서버 데이터를 분석하여 상세한 보고서를 자동 생성하고 맞춤형 권장사항을 제공합니다.
  - text: Vibe Coding
  - paragraph:
    - text: GPT/Claude + Cursor AI 협업으로 개발된 차세대 AI 에이전트 시스템
    - strong: 경량화 AI (No LLM Cost)
    - text: •
    - strong: 도메인 특화
    - text: •
    - strong: 확장 가능
  - paragraph: Copyright(c) 저작자. All rights reserved.
- button "Open Tanstack query devtools":
  - img
- alert
- button "Open Next.js Dev Tools":
  - img
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 |
   3 | /**
   4 |  * 대시보드 E2E 테스트
   5 |  * 
   6 |  * @description
   7 |  * OpenManager Vibe v5.11.0 대시보드 핵심 기능 E2E 테스트
   8 |  * 실제 사용자 시나리오를 시뮬레이션
   9 |  */
   10 |
   11 | test.describe('📊 Dashboard E2E Tests', () => {
   12 |   test.beforeEach(async ({ page }) => {
   13 |     // 각 테스트 전에 대시보드 페이지로 이동
   14 |     await page.goto('/');
   15 |     
   16 |     // 페이지 로딩 완료 대기
   17 |     await page.waitForLoadState('networkidle');
   18 |   });
   19 |
   20 |   test('🏠 대시보드 메인 페이지 로딩 테스트', async ({ page }) => {
   21 |     // 페이지 제목 확인
   22 |     await expect(page).toHaveTitle(/OpenManager Vibe/);
   23 |     
   24 |     // 메인 헤더 존재 확인
   25 |     await expect(page.locator('header')).toBeVisible();
   26 |     
   27 |     // OpenManager 브랜드 확인 (더 구체적인 선택자 사용)
   28 |     await expect(page.locator('h1').filter({ hasText: 'OpenManager' })).toBeVisible();
   29 |     
   30 |     // AI 서버 모니터링 텍스트 확인
   31 |     await expect(page.getByText('AI 서버 모니터링')).toBeVisible();
   32 |     
   33 |     console.log('✅ 대시보드 메인 페이지 로딩 성공');
   34 |   });
   35 |
   36 |   test('📈 서버 통계 표시 테스트', async ({ page }) => {
   37 |     // 데스크탑 뷰포트로 설정 (서버 통계는 md: 이상에서만 표시)
   38 |     await page.setViewportSize({ width: 1200, height: 800 });
   39 |     
   40 |     // 서버 통계 컨테이너 확인
   41 |     const statsContainer = page.locator('[role="status"][aria-label="서버 통계"]');
>  42 |     await expect(statsContainer).toBeVisible();
      |                                  ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
   43 |     
   44 |     // 전체 서버 수 표시 확인
   45 |     await expect(page.getByText('전체 서버')).toBeVisible();
   46 |     
   47 |     // 온라인 서버 표시 확인
   48 |     await expect(page.getByText('온라인')).toBeVisible();
   49 |     
   50 |     // 경고 상태 서버 표시 확인
   51 |     await expect(page.getByText('경고')).toBeVisible();
   52 |     
   53 |     // 오프라인 서버 표시 확인
   54 |     await expect(page.getByText('오프라인')).toBeVisible();
   55 |     
   56 |     console.log('✅ 서버 통계 표시 확인 완료');
   57 |   });
   58 |
   59 |   test('🤖 AI 에이전트 토글 테스트', async ({ page }) => {
   60 |     // AI 에이전트 버튼 찾기
   61 |     const agentButton = page.getByRole('button', { name: /ai 에이전트/i });
   62 |     await expect(agentButton).toBeVisible();
   63 |     
   64 |     // 초기 상태 확인 (닫힌 상태)
   65 |     await expect(agentButton).toHaveAttribute('aria-pressed', 'false');
   66 |     
   67 |     // AI 에이전트 열기
   68 |     await agentButton.click();
   69 |     
   70 |     // 열린 상태 확인
   71 |     await expect(agentButton).toHaveAttribute('aria-pressed', 'true');
   72 |     
   73 |     // 다시 클릭하여 닫기
   74 |     await agentButton.click();
   75 |     
   76 |     // 닫힌 상태 확인
   77 |     await expect(agentButton).toHaveAttribute('aria-pressed', 'false');
   78 |     
   79 |     console.log('✅ AI 에이전트 토글 동작 확인 완료');
   80 |   });
   81 |
   82 |   test('🏠 홈 버튼 네비게이션 테스트', async ({ page }) => {
   83 |     // 홈 버튼 찾기 (aria-label로 더 구체적 선택)
   84 |     const homeButton = page.getByRole('button', { name: '홈으로 이동' });
   85 |     await expect(homeButton).toBeVisible();
   86 |     
   87 |     // 홈 버튼 클릭
   88 |     await homeButton.click();
   89 |     
   90 |     // 페이지가 홈으로 이동했는지 확인 (URL 체크)
   91 |     await expect(page).toHaveURL('/');
   92 |     
   93 |     console.log('✅ 홈 버튼 네비게이션 확인 완료');
   94 |   });
   95 |
   96 |   test('📱 반응형 디자인 테스트', async ({ page }) => {
   97 |     // 데스크탑 뷰 (기본) - 서버 통계가 보여야 함
   98 |     await page.setViewportSize({ width: 1200, height: 800 });
   99 |     await expect(page.locator('[role="status"][aria-label="서버 통계"]')).toBeVisible();
  100 |     
  101 |     // 태블릿 뷰 - 서버 통계가 여전히 보여야 함
  102 |     await page.setViewportSize({ width: 768, height: 1024 });
  103 |     await page.waitForTimeout(500); // 애니메이션 대기
  104 |     await expect(page.locator('[role="status"][aria-label="서버 통계"]')).toBeVisible();
  105 |     
  106 |     // 모바일 뷰 - 서버 통계가 숨겨져야 함 (hidden md:flex)
  107 |     await page.setViewportSize({ width: 375, height: 667 });
  108 |     await page.waitForTimeout(500); // 애니메이션 대기
  109 |     
  110 |     // 모바일에서 메인 요소들이 여전히 보이는지 확인
  111 |     await expect(page.locator('h1').filter({ hasText: 'OpenManager' })).toBeVisible();
  112 |     await expect(page.getByRole('button', { name: /ai 에이전트/i })).toBeVisible();
  113 |     
  114 |     console.log('✅ 반응형 디자인 확인 완료');
  115 |   });
  116 |
  117 |   test('⚡ 페이지 성능 테스트', async ({ page }) => {
  118 |     // 페이지 로딩 시작 시간 측정
  119 |     const startTime = Date.now();
  120 |     
  121 |     await page.goto('/');
  122 |     await page.waitForLoadState('networkidle');
  123 |     
  124 |     const endTime = Date.now();
  125 |     const loadTime = endTime - startTime;
  126 |     
  127 |     // 로딩 시간이 10초 이내인지 확인 (개발 환경 고려)
  128 |     expect(loadTime).toBeLessThan(10000);
  129 |     
  130 |     console.log(`✅ 페이지 로딩 시간: ${loadTime}ms`);
  131 |   });
  132 |
  133 |   test('♿ 접근성 기본 테스트', async ({ page }) => {
  134 |     // 헤더 요소의 역할 확인
  135 |     await expect(page.locator('header')).toBeVisible();
  136 |     
  137 |     // 홈 버튼 접근성 확인
  138 |     const homeButton = page.getByRole('button', { name: '홈으로 이동' });
  139 |     await expect(homeButton).toHaveAttribute('aria-label');
  140 |     
  141 |     // AI 에이전트 버튼 접근성 확인
  142 |     const agentButton = page.getByRole('button', { name: /ai 에이전트/i });
```