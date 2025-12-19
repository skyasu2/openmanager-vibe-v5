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
  - 'docs/ops/testing/testing-philosophy-detailed.md'
  - 'docs/ops/testing/vitest-playwright-config-guide.md'
  - 'docs/ops/testing/co-location-guide.md'
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

## 📚 문서 인덱스 (19개 파일)

### 🎯 핵심 문서 (즉시 읽기)

1. ⭐ **e2e-testing-guide.md** - E2E 종합 가이드
2. ⭐ **vercel-first-strategy.md** - Vercel-First 전략
3. ⭐ **co-location-guide.md** - Unit 테스트 Co-location 패턴
4. **universal-vitals-setup-guide.md** - Web Vitals 모니터링

### 카테고리별 문서

- **Vercel 프로덕션**: vercel-first-strategy, vercel-ai-testing-guide, vercel-manual-test-guide
- **E2E 테스트**: e2e-testing-guide, 403-authentication-fix-v2
- **AI/서브에이전트**: subagent-testing-guide, subagent-integration-summary
- **설정 가이드**: vitest-playwright-config-guide, msw-guide, test-templates
- **철학/전략**: testing-philosophy-detailed, test-strategy-guide, local-test-limitations

**전체 목록**: `ls docs/ops/testing/` 명령어로 확인

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

### 서브에이전트 테스트

```bash
npm run subagent:test           # 빠른 테스트 (추천)
npm run subagent:test:thorough  # 철저한 검증
npm run subagent:history        # 테스트 히스토리
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

## 💡 베스트 프랙티스

**핵심 원칙**: "실제 Vercel 환경 테스트가 Mock보다 더 유효하다"

### 일상 워크플로우

1. **작업 중**: 관련 테스트 파일만 실행
2. **커밋 전**: `npm run test:quick` (22ms 초고속)
3. **PR 생성 전**: `npm run test:coverage` (커버리지 확인)

### 테스트 작성 가이드

- ✅ **순수 함수**: Unit Test 작성 (Co-located)
- ✅ **유틸리티**: Unit Test 작성 (Co-located)
- ⚠️ **UI 컴포넌트**: 간단한 테스트만
- ❌ **복잡한 AI/DB**: Skip 처리, 실제 환경 테스트

**상세**: [테스트 철학 가이드](./testing-philosophy-detailed.md)

## 🔗 관련 도구 & 문서

**서브에이전트**: `Task test-automation-specialist "E2E 테스트 최적화"`
**MCP 통합**: playwright, memory
**설정 가이드**: [Vitest & Playwright 설정](./vitest-playwright-config-guide.md)
**인프라 분석**: [TEST_INFRASTRUCTURE_ANALYSIS.md](../../reports/TEST_INFRASTRUCTURE_ANALYSIS.md)

---

**Last Updated**: 2025-12-19 by Claude Code
**핵심 철학**: "테스트는 도구일 뿐, 목적은 안정적인 프로덕션 서비스"
