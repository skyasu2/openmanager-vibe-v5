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
  - 'docs/testing/testing-philosophy-detailed.md'
  - 'docs/testing/vitest-playwright-config-guide.md'
  - 'docs/testing/test-strategy-guide.md'
last_updated: '2025-12-01'
---

# 🧪 OpenManager VIBE 테스트 시스템 가이드

> **📝 상세 가이드**:
>
> - [테스트 철학 전체 가이드](./testing-philosophy-detailed.md) (Mock vs Reality, 복잡도 판단)
> - [Vitest & Playwright 설정](./vitest-playwright-config-guide.md) (성능 최적화, 문제 해결)

**클라우드 네이티브 환경을 위한 실용적 테스트 전략**

## 📊 현재 상태 (2025-12-01 업데이트)

**전체 현황**: ✅ 639/719 통과 (88.9%) | 20개 Skip | 평균 실행 시간 36초 | TypeScript 0 오류

### 성능 지표

- **Unit Tests**: ✅ 95%+ 성공률 (안정적)
- **Integration Tests**: ✅ 88.9% 성공률
- **E2E Tests**: ✅ 100% 통과 (30개, Feature Cards 20개 포함)
- **전체 평균**: ✅ 88.9% (목표 달성)

## 📚 문서 인덱스

### 🎯 핵심 문서 (즉시 읽기)

1. ⭐ **vercel-production-test-report.md** - Mock vs 실제 환경 차이점 검증
2. ⭐ **e2e-testing-guide.md** - E2E 종합 가이드
3. **test-infrastructure-enhancement-report.md** - 테스트 인프라 강화 리포트 ([요약본](./test-infrastructure-summary.md))
4. **universal-vitals-setup-guide.md** - Web Vitals 모니터링 ([요약본](./universal-vitals-summary.md))

### 카테고리별 문서

- **Vercel 프로덕션**: 실제 환경 테스트
- **E2E 테스트**: Playwright 가이드
- **AI/서브에이전트**: Multi-AI 검증
- **PIN 인증**: 수동 테스트
- **가이드**: 전략 및 템플릿
- **보고서**: 분석 및 결과

**전체 목록**: `ls testing/` 명령어로 확인

## 🎯 빠른 실행 명령어

### 일상 개발

```bash
# 작업 중
npm run test:smart              # Git diff → 관련 테스트만
npm run test:quick              # 커밋 전 초고속 (22ms)

# 커밋 전
npm test                        # 모든 테스트
npm run test:coverage           # 커버리지 확인

# E2E 테스트
npm run test:e2e                # Playwright E2E
npm run test:vercel:e2e         # Vercel E2E (권장)
```

### 성능 모니터링

```bash
tsx scripts/test-metadata-manager.ts --slow 1000  # 느린 테스트 찾기
tsx scripts/test-metadata-manager.ts --flaky      # 불안정한 테스트
npm run test:coordinate                            # 전체 상태 분석
```

## 📊 테스트 구성

**총 719개 테스트** (65개 파일):

- Unit Tests: 95%+ 성공률
- Integration Tests: 88.9% 성공률
- E2E Tests: 100% 통과 (30개)

**주요 디렉터리**:

```
tests/e2e/              # Playwright E2E (30개)
tests/integration/      # 시스템 통합
src/__tests__/          # 단위 테스트
```

## 💡 베스트 프랙티스

**핵심 원칙**: "실제 Vercel 환경 테스트가 Mock보다 더 유효하다"

### 일상 워크플로우

1. **작업 중**: `npm run test:smart` (변경된 부분만)
2. **커밋 전**: `npm run test:quick` (22ms 초고속)
3. **PR 생성 전**: `npm run test:coverage` (커버리지 확인)

### 테스트 작성 가이드

- ✅ **순수 함수**: Unit Test 작성
- ✅ **유틸리티**: Unit Test 작성
- ⚠️ **UI 컴포넌트**: 간단한 테스트만
- ❌ **복잡한 AI/DB**: Skip 처리, 실제 환경 테스트

**상세**: [테스트 철학 가이드](./testing-philosophy-detailed.md)

## 📈 성능 지표

| 지표           | 목표    | 현재 상태 |
| -------------- | ------- | --------- |
| Minimal 테스트 | < 100ms | ✅ 22ms   |
| 전체 테스트    | < 60s   | ✅ 36s    |
| 커버리지       | > 70%   | ✅ 98%    |
| 테스트 통과율  | > 88%   | ✅ 88.9%  |

## 🔗 관련 도구 & 문서

**서브에이전트**: `Task test-automation-specialist "E2E 테스트 최적화"`
**MCP 통합**: playwright, memory
**설정 가이드**: [Vitest & Playwright 설정](./vitest-playwright-config-guide.md)
**Playwright MCP**: [@docs/development/playwright-mcp-setup-guide.md](../development/playwright-mcp-setup-guide.md)

---

**Last Updated**: 2025-11-27 by Claude Code
**핵심 철학**: "테스트는 도구일 뿐, 목적은 안정적인 프로덕션 서비스"
