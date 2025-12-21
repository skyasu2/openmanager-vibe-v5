---
category: testing
purpose: cloud_native_testing_strategy_and_implementation
ai_optimized: true
query_triggers:
  - '테스트 전략'
  - 'Vercel 프로덕션 테스트'
  - 'Playwright E2E'
  - 'Vitest 설정'
related_docs:
  - 'docs/development/testing/testing-philosophy-detailed.md'
  - 'docs/development/testing/vitest-playwright-config-guide.md'
  - 'docs/development/testing/co-location-guide.md'
last_updated: '2025-12-19'
---

# 🧪 OpenManager VIBE 테스트 시스템 가이드

> **📝 상세 가이드**:
>
> - [테스트 철학 전체 가이드](./testing-philosophy-detailed.md) (Mock vs Reality, 복잡도 판단)
> - [Vitest & Playwright 설정](./vitest-playwright-config-guide.md) (성능 최적화, 문제 해결)
> - [Co-location 가이드](./co-location-guide.md) (Unit 테스트 배치 전략)

**클라우드 네이티브 환경을 위한 실용적 테스트 전략**

## 📊 현재 상태 (2025-12-19)

**전체 현황**: 65개 테스트 파일 | CI 최고속 2.2s (92 tests) | TypeScript 0 오류

### 테스트 분포

| 위치 | 파일 수 | 비율 |
|------|--------|------|
| `src/` Co-located | 35개 | 54% |
| `tests/` 폴더 | 30개 | 46% |
| **합계** | **65개** | 100% |

### 성능 지표

| 지표 | 목표 | 현재 |
|------|------|------|
| CI 최고속 | < 5s | ✅ 2.2s |
| Minimal 테스트 | < 100ms | ✅ 22ms |
| E2E Critical | < 2분 | ✅ ~1분 |

## 📚 문서 인덱스 (16개 파일)

### 🎯 핵심 문서 (즉시 읽기)

1. ⭐ **e2e-testing-guide.md** - E2E 종합 가이드
2. ⭐ **vercel-first-strategy.md** - Vercel-First 전략
3. ⭐ **co-location-guide.md** - Unit 테스트 Co-location 패턴
4. **universal-vitals-setup-guide.md** - Web Vitals 모니터링

### 카테고리별 문서

- **Vercel 프로덕션**: vercel-first-strategy, vercel-ai-testing-guide, vercel-manual-test-guide
- **E2E 테스트**: e2e-testing-guide, 403-authentication-fix-v2
- **AI 검증**: testing-philosophy-detailed, local-test-limitations
- **설정 가이드**: vitest-playwright-config-guide, msw-guide, test-templates
- **철학/전략**: testing-philosophy-detailed, test-strategy-guide, local-test-limitations

**전체 목록**: `ls docs/development/testing/` 명령어로 확인

## 🎯 빠른 실행 명령어

### 일상 개발

```bash
# 작업 중
npm run test:quick              # 커밋 전 초고속 (22ms)

# 커밋 전
npm test                        # 모든 테스트
npm run test:coverage           # 커버리지 확인

# E2E 테스트
npm run test:e2e                # Playwright E2E
npm run test:vercel:e2e         # Vercel E2E (권장)
npm run test:e2e:critical       # Critical E2E만 (~1분)
```

### AI 스킬 테스트

```bash
npm run test:ai                 # AI 개발 테스트
npm run test:vercel:e2e         # Vercel E2E (권장)
npm run test:super-fast         # 빠른 테스트 (11초)
```

## 📊 테스트 구성

**총 65개 테스트 파일**:

- **Co-located** (`src/`): 35개 (components, hooks, lib, utils, services)
- **Integration** (`tests/integration/`): 10개
- **E2E** (`tests/e2e/`): 8개
- **API** (`tests/api/`): 3개
- **기타** (`tests/`): 14개

**디렉터리 구조**:

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

## ⚡ **AI 엔진 아키텍처 v4.0 테스트 철학**

- **단일 통합 파이프라인**: Supabase RAG + Google Cloud Functions + Google AI SDK
- **Cloud Functions 우선**: Korean NLP, ML Analytics, Unified Processor를 기본 단계로 실행
- **직접 Google AI 호출**: Prompt SDK를 통한 저지연 응답, 모델은 `gemini-2.5-flash` 고정
- **캐싱 + 폴백 최소화**: 500ms 이내 응답 목표, 타임아웃 시 사용자 안내 반환

## 🛠️ 테스트 도구 스택

### 테스트 프레임워크

- **Vitest**: 메인 테스트 프레임워크 (Jest 대체)
- **Testing Library**: React 컴포넌트 테스트
- **Playwright**: E2E 테스트
- **MSW**: API 모킹

### 주요 테스트 대상

- **API Routes**: `/api/ai/*` 엔드포인트 통합 테스트
- **Cloud Run Integration**: AI 엔진 연동 테스트
- **Supabase RAG**: pgvector 기반 RAG 테스트

## 🔗 관련 도구 & 문서

**스킬**: `lint-smoke`, `validation-analysis`
**MCP 통합**: playwright, serena
**설정 가이드**: [Vitest & Playwright 설정](./vitest-playwright-config-guide.md)
**테스트 전략**: [Test Strategy Guide](./test-strategy-guide.md)

## 📦 아카이브 (Legacy)

- [403 Authentication Fix v2](../../archive/testing/403-authentication-fix-v2.md) - 인증 문제 해결 기록

---

**Last Updated**: 2025-12-19 by Claude Code
**핵심 철학**: "테스트는 도구일 뿐, 목적은 안정적인 프로덕션 서비스"
