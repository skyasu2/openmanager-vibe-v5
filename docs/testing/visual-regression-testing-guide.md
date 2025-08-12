# Visual Regression Testing 가이드

## 🎯 개요

Visual Regression Testing은 UI 컴포넌트의 시각적 변경사항을 자동으로 감지하는 테스트 방법입니다.

## 🆓 무료 티어 옵션 비교

### 1. **Chromatic** (부분 무료)
- ✅ 월 5,000 스냅샷 무료
- ✅ Storybook과 완벽 통합
- ❌ 대규모 프로젝트에는 제한적

### 2. **Percy** (부분 무료)
- ✅ 월 5,000 스냅샷 무료
- ✅ GitHub 통합
- ❌ 추가 설정 필요

### 3. **Storybook Test Runner + Playwright** (완전 무료) ⭐ 추천
- ✅ 로컬에서 무제한 실행
- ✅ CI/CD 통합 가능
- ✅ 스크린샷 비교 가능
- ❌ 클라우드 대시보드 없음

## 📦 설치 방법 (Storybook Test Runner)

```bash
# 필요한 패키지 설치
npm install --save-dev @storybook/test-runner playwright
```

## 🔧 설정

### 1. `.storybook/test-runner.js` 생성
```javascript
const { getStoryContext } = require('@storybook/test-runner');

module.exports = {
  async postVisit(page, context) {
    // 스크린샷 캡처
    const storyContext = await getStoryContext(page, context);
    await page.screenshot({
      path: `screenshots/${storyContext.id}.png`,
      fullPage: true,
    });
  },
};
```

### 2. `package.json` 스크립트 추가
```json
{
  "scripts": {
    "test:storybook": "test-storybook",
    "test:storybook:ci": "test-storybook --ci",
    "test:visual": "test-storybook --screenshot"
  }
}
```

## 🏃 실행 방법

### 로컬 테스트
```bash
# Storybook 실행 (별도 터미널)
npm run storybook

# 테스트 실행 (다른 터미널)
npm run test:storybook
```

### CI 환경
```bash
# 빌드 후 테스트
npm run build-storybook
npx http-server storybook-static -p 6006 &
npm run test:storybook:ci
```

## 🖼️ 스크린샷 비교 워크플로우

### 1. 기준 스크린샷 생성
```bash
npm run test:visual
git add screenshots/
git commit -m "chore: 기준 스크린샷 업데이트"
```

### 2. 변경사항 확인
```bash
npm run test:visual
# Git diff로 변경사항 확인
git diff screenshots/
```

## 🎨 고급 설정

### 반응형 테스트
```javascript
// test-runner.js
module.exports = {
  async postVisit(page, context) {
    const viewports = [
      { width: 375, height: 667 },  // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1920, height: 1080 }, // Desktop
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.screenshot({
        path: `screenshots/${context.id}-${viewport.width}x${viewport.height}.png`,
      });
    }
  },
};
```

### 애니메이션 대기
```javascript
// 애니메이션 완료 대기
await page.waitForTimeout(500);
await page.screenshot({ path: `screenshots/${context.id}.png` });
```

## 🚀 GitHub Actions 통합

`.github/workflows/visual-tests.yml`:
```yaml
name: Visual Tests
on: [push, pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build Storybook
        run: npm run build-storybook
      
      - name: Run visual tests
        run: |
          npx http-server storybook-static -p 6006 &
          npm run test:storybook:ci
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: screenshots/
```

## 💡 베스트 프랙티스

1. **선택적 테스트**: 중요한 컴포넌트만 스크린샷 테스트
2. **격리된 스토리**: 각 스토리는 독립적으로 테스트 가능해야 함
3. **안정적인 데이터**: 랜덤 데이터 대신 고정된 목업 사용
4. **적절한 대기**: 애니메이션이나 비동기 작업 완료 대기

## 🔍 트러블슈팅

### 스크린샷이 다른 경우
- OS별 폰트 렌더링 차이 → Docker 사용
- 애니메이션 타이밍 → `prefers-reduced-motion` 설정
- 날짜/시간 → 고정된 값 사용

### 테스트가 느린 경우
- 병렬 실행: `test-storybook --maxWorkers=4`
- 특정 스토리만 테스트: `test-storybook --grep="Button"`

## 📊 비용 효율적인 전략

1. **로컬 우선**: 개발 중에는 로컬에서 테스트
2. **CI 최적화**: PR에서만 전체 테스트 실행
3. **선택적 캡처**: 중요 컴포넌트만 스크린샷
4. **캐시 활용**: 변경되지 않은 스토리는 건너뛰기