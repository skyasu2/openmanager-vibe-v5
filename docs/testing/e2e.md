---
id: e2e-testing
title: "E2E Testing Guide"
keywords: ["playwright", "e2e", "testing", "browser", "ui"]
priority: medium
ai_optimized: true
updated: "2025-09-09"
---

# ⚡ E2E Testing Guide

**Playwright v1.54.1** | **브라우저**: Chromium, Firefox, WebKit | **현재**: 2개 E2E 테스트 실행

## 🚀 빠른 실행

### 1단계: 개발 서버 시작 (별도 터미널)
```bash
npm run dev
# 또는 테스트 환경변수와 함께
NODE_ENV=test PORT=3000 npm run dev
```

### 2단계: E2E 테스트 실행
```bash
npm run test:e2e            # 모든 E2E 테스트
npx playwright test --ui    # UI 모드 (디버깅 최적)
npx playwright test --headed # 브라우저 화면 보기
npx playwright test --debug  # 디버그 모드
```

### 특정 테스트 실행
```bash
# 대시보드만
npx playwright test tests/e2e/dashboard.e2e.ts

# 특정 브라우저
npx playwright test --project=chromium-stable

# 모바일 테스트
npx playwright test --project=mobile-chrome
```

## 📁 테스트 구조

```
tests/e2e/
├── dashboard.e2e.ts               # 대시보드 기본 기능
├── system-state-transition.e2e.ts # 시스템 상태 전환
├── ui-modal-comprehensive.e2e.ts  # UI 모달 테스트
├── global-setup.ts                # 환경 설정
└── global-teardown.ts             # 정리
```

## 🎯 현재 구현된 테스트

### ✅ 기본 기능
- **페이지 로드**: 대시보드 정상 로드 (< 3초)
- **서버 카드**: 서버 메트릭 UI 표시
- **AI 기능**: AI 관련 UI 요소 존재 확인
- **반응형**: 데스크톱/태블릿/모바일 뷰

### ✅ 상호작용
- **네비게이션**: 기본 링크 동작
- **모달**: UI 모달 열기/닫기
- **상태 전환**: 시스템 상태 변경 흐름

## 🔧 Playwright 설정

### playwright.config.ts 핵심
```typescript
{
  baseURL: 'http://localhost:3000',
  testDir: './tests/e2e',
  timeout: 60 * 1000,           # 테스트 60초
  expect: { timeout: 5000 },    # 요소 대기 5초
  webServer: {
    command: 'npm run dev',
    port: 3000,
    timeout: 180 * 1000,        # 서버 시작 3분
    reuseExistingServer: true   # 기존 서버 재사용
  }
}
```

### 브라우저 프로젝트
- **chromium-stable**: 기본 데스크톱
- **firefox**: Firefox 호환성
- **webkit**: Safari 호환성
- **mobile-chrome**: 모바일 뷰

## 📊 리포트 & 디버깅

### 테스트 결과 확인
```bash
# HTML 리포트 열기
npx playwright show-report test-results/e2e-report

# JSON 결과 확인
cat e2e-results.json | jq '.suites[].specs[].title'
```

### 디버깅 도구
- **스크린샷**: 실패 시 자동 캡처
- **비디오**: 테스트 실행 과정 녹화
- **트레이스**: 상세 실행 추적 (`--trace on`)

## 🐛 WSL 환경 문제 해결

### 시스템 의존성 설치
```bash
# Playwright 의존성 설치
sudo npx playwright install-deps

# 수동 설치
sudo apt-get update
sudo apt-get install -y libnspr4 libnss3 libasound2t64
```

### 메모리 설정
```bash
# WSL 메모리 할당 확인 (최소 4GB 권장)
free -h
```

### 포트 충돌 해결
```bash
# 3000 포트 사용 확인
lsof -i :3000

# 프로세스 종료
kill -9 <PID>
```

## 💡 베스트 프랙티스

### Page Object Model
```typescript
// pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}
  
  async navigate() {
    await this.page.goto('/dashboard');
  }
  
  async getServerCards() {
    return this.page.locator('[data-testid="server-card"]');
  }
}
```

### 안정적인 셀렉터
```typescript
// ❌ 클래스명 의존 (불안정)
await page.locator('.server-card-title');

// ✅ 테스트 ID 사용 (안정)
await page.locator('[data-testid="server-card-title"]');

// ✅ 의미있는 텍스트 (안정)
await page.getByRole('button', { name: 'Login' });
```

### 적절한 대기 전략
```typescript
// ✅ 요소 나타날 때까지 대기
await page.waitForSelector('[data-testid="server-list"]');

// ✅ 네트워크 요청 완료 대기
await page.waitForLoadState('networkidle');

// ✅ API 응답 대기
await page.waitForResponse('/api/servers');
```

## 🔄 CI/CD 통합

### GitHub Actions 설정
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

## 🎯 확장 계획

### 추가 필요한 테스트
- [ ] 로그인/로그아웃 플로우
- [ ] API 응답 모킹 테스트
- [ ] 실시간 데이터 업데이트
- [ ] 에러 핸들링 시나리오
- [ ] 성능 메트릭 측정

**서브에이전트**: `Task test-automation-specialist "새로운 E2E 테스트 시나리오 구현"`