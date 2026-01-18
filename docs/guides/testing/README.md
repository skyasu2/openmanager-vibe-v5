# Testing Documentation

> **최종 갱신**: 2026-01-18
> **문서 수**: 3개 (테스트 핵심 문서)

---

## Quick Start

```bash
npm run test              # Unit tests (Vitest)
npm run test:e2e          # E2E tests (Playwright)
npm run validate:all      # 전체 검증
```

---

## Current Status

**전체 현황**: 65개 테스트 파일 | CI 최고속 2.2s | TypeScript 0 오류

| 지표 | 목표 | 현재 |
|------|------|------|
| CI 최고속 | < 5s | 2.2s |
| Minimal 테스트 | < 100ms | 22ms |
| E2E Critical | < 2분 | ~1분 |

---

## Document Index

### Strategy (전략)

| 문서 | 설명 |
|------|------|
| [test-strategy.md](./test-strategy.md) | 테스트 전략 + 철학 (통합) |

### Unit Testing (단위 테스트)

| 문서 | 설명 |
|------|------|
| [react-component-testing-guide.md](./react-component-testing-guide.md) | React 컴포넌트 테스트 |
| [type-level-testing-guide.md](./type-level-testing-guide.md) | TypeScript 타입 테스트 |

### Integration Testing (통합 테스트)

| 문서 | 설명 |
|------|------|
| [msw-guide.md](./msw-guide.md) | Mock Service Worker |
| [supertest-integration-guide.md](./supertest-integration-guide.md) | Supertest API 테스트 |

### E2E Testing (E2E 테스트)

| 문서 | 설명 |
|------|------|
| [e2e-testing-guide.md](./e2e-testing-guide.md) | Playwright E2E 가이드 |
| [universal-vitals-setup-guide.md](./universal-vitals-setup-guide.md) | Web Vitals 측정 |

### AI Testing (AI 테스트)

| 문서 | 설명 |
|------|------|
| [vercel-ai-testing-guide.md](./vercel-ai-testing-guide.md) | Vercel AI SDK 테스트 |

### Templates

| 문서 | 설명 |
|------|------|
| [test-templates.md](./test-templates.md) | 테스트 템플릿 모음 |

---

## Test Structure

```
src/                    # Co-located Unit Tests (35개)
├── components/**/*.test.tsx
├── hooks/**/*.test.ts
├── lib/**/*.test.ts
└── utils/**/*.test.ts

tests/                  # 통합/E2E/API Tests (30개)
├── e2e/               # Playwright E2E
├── integration/       # 시스템 통합
└── api/               # API Contract
```

---

## Common Commands

```bash
# 일상 개발
npm run test:quick       # 커밋 전 초고속 (22ms)
npm test                 # 모든 테스트
npm run test:coverage    # 커버리지 확인

# E2E 테스트
npm run test:e2e         # Playwright E2E
npm run test:vercel:e2e  # Vercel 프로덕션 E2E (권장)
```

---

## Archived Documents

통합된 문서들은 `docs/archive/testing/`으로 이동:

- `test-strategy-guide.md` → `test-strategy.md`로 통합
- `testing-philosophy-detailed.md` → `test-strategy.md`로 통합
- `vercel-first-strategy.md` → `test-strategy.md`로 통합
- `local-test-limitations.md` → 아카이브
- `co-location-guide.md` → 아카이브
- `vitest-playwright-config-guide.md` → 아카이브

---

## Related

- [DEVELOPMENT.md](../../DEVELOPMENT.md)
- [Test Strategy](./test-strategy.md)

---

**핵심 철학**: "테스트는 도구일 뿐, 목적은 안정적인 프로덕션 서비스"
