---
id: testing-guide
title: "Testing System Guide"
keywords: ["testing", "vitest", "playwright", "e2e", "tdd", "coverage"]
priority: high
ai_optimized: true
related_docs: ["../README.md", "../ai/workflow.md", "../performance/README.md", "e2e.md", "../ui/components.md"]
updated: "2025-09-09"
---

# 🧪 Testing System Guide

**현재 상태**: ✅ 54/55 테스트 통과 (98.2%) | 커버리지 98.2% | 평균 실행 속도 6ms

## 🎯 3단계 테스트 전략

### Level 1: Minimal (22ms)
```bash
npm run test:quick      # 커밋 전 초고속 검증
npm run test:minimal    # 환경변수 + 타입 체크만
```

### Level 2: Smart (변경 기반)
```bash
npm run test:smart             # Git diff → 관련 테스트만
npm run test:smart:branch      # 브랜치 전체 변경사항
npm run test:smart --dry-run   # 실행할 테스트 미리보기
```

### Level 3: Full (전체)
```bash
npm test                    # 모든 테스트 실행
npm run test:coverage       # 커버리지 리포트
npm run test:e2e           # Playwright E2E
```

## 📊 테스트 구성

**총 55개 테스트 파일** (최적화 완료):
- 단위 테스트: 38개 (70%)
- 통합 테스트: 15개 (27%)
- E2E 테스트: 2개 (3%)

**주요 디렉토리**:
```
src/app/api/            # API 라우트 테스트 (6개)
src/services/ai/        # AI 엔진 테스트 (11개)
tests/e2e/              # Playwright E2E (2개)
tests/integration/      # 시스템 통합 (15개)
```

## 🤖 TDD 워크플로우

### Type-First + TDD 사이클
```typescript
// 1. RED: 실패 테스트 작성
it('@tdd-red should implement auth', () => {
  expect(authenticate(token)).toBe(true);
});

// 2. GREEN: 최소 구현
// 3. REFACTOR: 개선
// 4. 자동 정리: npm run test:tdd-cleanup
```

### 자동화 스크립트
```bash
npm run test:tdd-check      # TDD 상태 확인
npm run test:tdd-cleanup    # @tdd-red 태그 정리
npm run test:metadata       # 실행 시간/성공률 추적
```

## 🔧 Vitest 설정

### 성능 최적화 설정
```typescript
// vitest.config.ts
{
  environment: 'node',      // DOM 불필요시 node
  pool: 'vmThreads',        // 4배 성능 향상
  isolate: false,           // 격리 비활성화
  testTimeout: 2000,        // 빠른 실패
  deps: { optimizer: { web: { enabled: true }}}
}
```

### 설정별 용도
- **메인**: `vitest.config.ts` (일반 테스트)
- **최소**: `vitest.config.minimal.ts` (22ms 초고속)
- **DOM**: `vitest.config.dom.ts` (React 컴포넌트)

## ⚡ E2E 테스트 (Playwright)

### 빠른 실행
```bash
# 1. 개발 서버 시작 (별도 터미널)
npm run dev

# 2. E2E 테스트 실행
npm run test:e2e            # 모든 E2E 테스트
npx playwright test --ui    # UI 모드 (디버깅)
npx playwright test --headed # 브라우저 보이게
```

### 현재 구현된 테스트
- 대시보드 로드 및 서버 카드 표시
- 시스템 상태 전환 테스트
- UI 모달 종합 테스트
- 반응형 디자인 검증

### Playwright 설정
- **URL**: http://localhost:3000
- **브라우저**: Chromium, Firefox, WebKit
- **타임아웃**: 테스트 60초, 서버 시작 3분
- **리포터**: HTML, JSON, JUnit

## 💡 베스트 프랙티스

### 일상 개발 워크플로우
```bash
# 작업 중
npm run test:smart

# 커밋 전
npm run test:quick

# PR 생성 전
npm run test:smart:branch
npm run test:coverage
```

### 성능 모니터링
```bash
# 느린 테스트 찾기 (1초 이상)
tsx scripts/test-metadata-manager.ts --slow 1000

# 불안정한 테스트 찾기
tsx scripts/test-metadata-manager.ts --flaky

# 전체 테스트 상태 분석
npm run test:coordinate
```

## 🚨 문제 해결

### Vitest 타임아웃
1. vmThreads pool 사용 확인
2. isolate: false 설정 확인
3. testTimeout 조정 (기본 2초)

### 메모리 부족
```bash
NODE_OPTIONS='--max-old-space-size=4096' npm test
```

### Playwright 브라우저 실행 실패
```bash
# WSL 환경: 시스템 의존성 설치
sudo npx playwright install-deps
sudo apt-get install -y libnspr4 libnss3 libasound2t64
```

## 📈 성능 지표

| 지표 | 목표 | 현재 상태 |
|------|------|-----------|
| Minimal 테스트 | < 100ms | ✅ 22ms |
| Smart 테스트 | < 10s | ✅ ~5s |
| 전체 테스트 | < 60s | ✅ ~45s |
| 커버리지 | > 70% | ✅ 98.2% |
| 테스트 통과율 | > 95% | ✅ 98.2% |

## 🔗 관련 도구

**서브에이전트 활용**: `Task test-automation-specialist "E2E 테스트 최적화"`
**MCP 통합**: playwright (브라우저 자동화), memory (테스트 히스토리)
**AI 교차검증**: Level 2 (50-200줄 테스트 코드)