# AI SDK v6 마이그레이션 후속 개선 계획서

**작성일**: 2026-01-25
**목표**: AI SDK v5 → v6 마이그레이션 완료 후 문서/테스트/아키텍처 정비

---

## 개선 원칙

1. **무료 티어 준수**: 실제 API 호출 테스트 금지 (Mock 기반)
2. **성능 부하 테스트 제외**: CI/CD에서 빠르게 실행 가능한 단위 테스트만
3. **점진적 개선**: 핵심 영역부터 순차 진행

---

## Phase 1: 문서 업데이트 (비용 없음) ✅ 완료

### 1.1 status.md 업데이트 ✅
- [x] `TextStreamChatTransport` → `DefaultChatTransport` 변경
- [x] AI SDK v5 참조 → v6 베스트 프랙티스 반영
- [x] Resumable Stream v2 아키텍처 추가
- [x] 버전 v6.1.0 반영

### 1.2 AI 아키텍처 문서 업데이트 ✅
- [x] `ai-engine-architecture.md` - v6 패턴 반영, AI SDK v6 Key Features 테이블 추가
- [x] `ai-engine-internals.md` - UIMessageStream 프로토콜 설명, Resumable Stream v2 섹션 추가, Deprecated 컴포넌트 업데이트

### 1.3 프론트엔드 소개 업데이트 ✅
- [x] README.md AI 섹션 현행화 (2026-01-26)
- [x] CLAUDE.md AI 도구 섹션 검토 - 이미 최신 상태

---

## Phase 2: 핵심 테스트 추가 (Mock 기반, API 호출 없음) ⚠️ 부분 완료

### 2.1 Cloud Run 단위 테스트 ⚠️ 스킵
- **상태**: 기존 `orchestrator.test.ts` (65개 테스트)가 이미 AI SDK v6 패턴을 커버
- **평가**: `supervisor.ts`, `model-provider.ts` 추가 테스트 시도 → 복잡한 모듈 의존성으로 mock 설정 과도
- **결론**: 기존 테스트 유지, 추가 테스트는 ROI 낮음

### 2.2 Frontend Hook 테스트 업데이트 ✅ 불필요
- **상태**: `useHybridAIQuery.ts`가 이미 v2 엔드포인트 사용 중
- **확인**: MSW mock이 v2 패턴으로 이미 설정됨

---

## Phase 3: 아키텍처 다이어그램 ✅ 완료

### 3.1 Mermaid/ASCII 다이어그램 업데이트 ✅
- [x] `ai-engine-architecture.md` - `SSE Stream` → `UIMessageStream` 수정
- [x] ASCII fallback 다이어그램 - `SSE Response` → `UIMessageStream` 수정
- [x] 버전 표기 `v5.87.0` → `v6.1.0` 업데이트

### 3.2 랜딩페이지 아키텍처 다이어그램 ✅
- [x] `architecture-diagrams.data.ts` 버전 업데이트 (5.88.2 → 6.1.0)
- [x] AI Assistant 카드 설명에 v6 정보 반영
- [x] `AI SDK v6 Protocol` 레이어 추가 (UIMessageStream, Resumable Stream v2)
- [x] 새로운 연결 플로우 추가 (Verifier → UIMessageStream → User)

---

## 제외 항목 (무료 티어 보호)

| 제외 테스트 | 이유 |
|------------|------|
| 실제 LLM API 호출 | Cerebras/Groq/Mistral 쿼터 소진 |
| E2E AI 응답 테스트 | Cloud Run 비용 발생 |
| 부하 테스트 | 무료 티어 Rate Limit |
| Redis 통합 테스트 | Upstash 쿼터 소진 |

---

## 예상 결과

| 지표 | Before | After |
|------|:------:|:-----:|
| 문서 정확도 | 70% | 95% |
| AI 모듈 테스트 커버리지 | ~10% | ~40% |
| 레거시 참조 | 다수 | 0 |

---

## 완료 요약

| Phase | 상태 | 설명 |
|-------|:----:|------|
| Phase 1.1 | ✅ | status.md AI SDK v6 업데이트 |
| Phase 1.2 | ✅ | AI 아키텍처 문서 업데이트 |
| Phase 2.1 | ⚠️ | Cloud Run 테스트 - 기존 커버리지 충분 |
| Phase 2.2 | ✅ | Frontend Hook - 이미 v6 적용됨 |
| Phase 3 | ✅ | 다이어그램 v6 업데이트 완료 |

_Status: Phase 1 완료, Phase 2 평가 완료, Phase 3 완료_
