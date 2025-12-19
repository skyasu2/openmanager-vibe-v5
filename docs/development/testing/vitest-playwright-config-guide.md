# 🔧 Vitest & Playwright 설정 가이드

**OpenManager VIBE 테스트 도구 설정 전문 가이드**

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

- **메인**: `vitest.config.main.ts` (일반 테스트, jsdom 환경)
- **최소**: `vitest.config.minimal.ts` (22ms 초고속, node 환경)
- **간단**: `vitest.config.simple.ts` (커버리지 측정용)

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

### Playwright 설정

- **URL**: http://localhost:3000
- **브라우저**: Chromium only (성능 최적화)
- **타임아웃**: 테스트 120초, 서버 시작 3분
- **리포터**: HTML, JSON

### 현재 구현된 테스트

- 대시보드 로드 및 서버 카드 표시
- 시스템 상태 전환 테스트
- UI 모달 종합 테스트
- 반응형 디자인 검증

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

## 🎭 Playwright MCP 설정

**WSL 환경 전용 설정 가이드**: [@docs/development/playwright-mcp-setup-guide.md](../development/playwright-mcp-setup-guide.md)

---

**상세 도구 참고**:

- **서브에이전트**: `Task test-automation-specialist "E2E 테스트 최적화"`
- **MCP 통합**: playwright (브라우저 자동화), memory (테스트 히스토리)
