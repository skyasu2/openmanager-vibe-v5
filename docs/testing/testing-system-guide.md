# 🧪 테스트 시스템 가이드

**작성일**: 2025년 8월 3일  
**버전**: v1.0

## 📋 개요

OpenManager VIBE v5의 테스트 시스템은 3단계 전략을 통해 빠른 피드백과 안정성을 모두 달성합니다.

## 🎯 3단계 테스트 전략

### 1️⃣ Minimal 테스트 (22ms)

- **목적**: 커밋/푸시 전 초고속 검증
- **범위**: 환경변수, 핵심 파일, TypeScript 설정, 의존성
- **실행**: `npm run test:quick` 또는 `npm run test:minimal`
- **특징**: 캐싱 활용, 파일 시스템 검증, 타입 체크

### 2️⃣ Smart 테스트 (변경 기반)

- **목적**: 변경된 파일에만 영향받는 테스트 실행
- **범위**: Git 변경사항 분석 → 의존성 그래프 → 관련 테스트만
- **실행**: `npm run test:smart`
- **옵션**:
  - `--branch`: 브랜치 전체 변경사항
  - `--dry-run`: 실행할 테스트 미리보기

### 3️⃣ Full 테스트 (전체)

- **목적**: CI/CD, 릴리즈 전 전체 검증
- **범위**: 모든 단위, 통합, E2E 테스트
- **실행**: `npm test` 또는 `npm run test:coverage`
- **커버리지 목표**: 70%+

## 📊 테스트 구성 현황

### 파일 분포

```
총 40개 테스트 파일 (이전 204개에서 최적화)
├── src/app/api/            # API 라우트 테스트 (6개)
├── src/services/ai/        # AI 엔진 테스트 (11개)
├── src/services/mcp/       # MCP 통합 테스트 (1개)
├── src/test/               # 설정 테스트 (2개)
├── tests/api/              # API 통합 테스트 (3개)
├── tests/e2e/              # E2E 테스트 (2개)
└── tests/integration/      # 시스템 통합 테스트 (15개)
```

### 테스트 유형별 분류

- **단위 테스트**: 28개 (70%)
- **통합 테스트**: 10개 (25%)
- **E2E 테스트**: 2개 (5%)

## 🤖 자동화 도구

### 1. 스마트 테스트 선택기

```typescript
// scripts/smart-test-runner.ts
- Git diff 분석
- 의존성 그래프 생성
- 영향받는 테스트만 실행
- 평균 80% 시간 절약
```

### 2. 테스트 메타데이터 관리

```typescript
// scripts/test-metadata-manager.ts
- 실행 시간 추적
- 성공률 모니터링
- Flakiness 감지
- 우선순위 자동 조정
```

### 3. TDD 자동화

```typescript
// scripts/tdd-cleanup.ts
- @tdd-red 태그 감지
- RED → GREEN 전환 추적
- 7일 이상 RED 테스트 알림
- 자동 태그 정리
```

### 4. 서브 에이전트 협업

```typescript
// scripts/sub-agent-coordinator.ts
- 테스트 상태 분석
- 적절한 에이전트 추천
- Memory MCP 통합
- 실시간 모니터링
```

## 📝 테스트 스크립트 참조

### 기본 테스트

```bash
npm test                    # Vitest 전체 실행
npm run test:watch          # 감시 모드
npm run test:coverage       # 커버리지 리포트
npm run test:unit           # 단위 테스트만
```

### 성능 최적화 테스트

```bash
npm run test:quick          # 초고속 검증 (22ms)
npm run test:minimal        # 최소 설정 vitest
npm run test:dom            # DOM 테스트만
npm run test:smart          # 스마트 선택
npm run test:smart:branch   # 브랜치 변경사항
```

### 워크플로우 테스트

```bash
npm run test:pre-push       # 푸시 전 검증
npm run test:ci             # CI 파이프라인용
npm run test:e2e            # Playwright E2E
```

### 테스트 관리

```bash
npm run test:metadata       # 메타데이터 리포트
npm run test:tdd-cleanup    # TDD 태그 정리
npm run test:tdd-check      # TDD 상태 확인
npm run test:coordinate     # 서브에이전트 분석
npm run test:monitor        # 실시간 모니터링
```

## 🔧 Vitest 설정

### 메인 설정 (vitest.config.ts)

```typescript
{
  environment: 'node',      // DOM 불필요시 node 사용
  pool: 'vmThreads',        // 4x 성능 향상
  isolate: false,           // 격리 비활성화로 속도 향상
  testTimeout: 2000,        // 빠른 실패
  deps: {
    optimizer: {
      web: { enabled: true },
      ssr: { enabled: true }
    }
  }
}
```

### 최소 설정 (vitest.config.minimal.ts)

- 최소한의 테스트만 실행
- 격리 완전 비활성화
- 1초 타임아웃

### DOM 설정 (vitest.config.dom.ts)

- happy-dom 사용 (jsdom보다 빠름)
- React 컴포넌트 테스트
- 브라우저 환경 시뮬레이션

## 💡 베스트 프랙티스

### 1. 일상 개발

```bash
# 작업 중 변경사항 테스트
npm run test:smart

# 커밋 전 검증
npm run test:quick

# PR 생성 전
npm run test:smart:branch
```

### 2. TDD 워크플로우

```typescript
// 1. RED: 실패하는 테스트 작성
it('@tdd-red @created-date:2025-08-03 should implement new feature', () => {
  expect(newFeature()).toBe(expectedResult);
});

// 2. GREEN: 구현
// 3. 자동 정리: npm run test:tdd-cleanup
```

### 3. 성능 모니터링

```bash
# 느린 테스트 찾기
tsx scripts/test-metadata-manager.ts --slow 1000

# 불안정한 테스트 찾기
tsx scripts/test-metadata-manager.ts --flaky

# 전체 분석
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

### 캐시 문제

```bash
rm -rf node_modules/.vitest
npm run clean
```

## 📈 성능 지표

| 지표           | 목표    | 현재    |
| -------------- | ------- | ------- |
| Minimal 테스트 | < 100ms | 22ms ✅ |
| Smart 테스트   | < 10s   | ~5s ✅  |
| 전체 테스트    | < 60s   | ~45s ✅ |
| 커버리지       | > 70%   | 72% ✅  |

## 🔗 관련 문서

- [테스트 개선 보고서](/.claude/issues/test-system-improvement-report-2025-08-02.md)
- [Vitest 공식 문서](https://vitest.dev)
- [Testing Library 가이드](https://testing-library.com)
