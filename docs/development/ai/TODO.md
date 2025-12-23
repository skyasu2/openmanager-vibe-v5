# AI Development TODO

**Last Updated**: 2025-12-23

## In Progress

### Multi-Agent Architecture (v5.83+)
- [x] Verifier Agent 구현 (Groq 기반 출력 검증)
- [x] Caching Layer 추가 (TTL: 1분/5분/10분)
- [x] AgentState 확장 (SharedContext)
- [x] PostgreSQL Context Table (세션 컨텍스트 저장)
- [ ] Unit Tests 추가 (verifier, cache-layer)
- [ ] Integration Tests (Supervisor → Verifier 흐름)
- [ ] Cache 히트율 모니터링 대시보드

### Prompt Optimization
- [x] Supervisor: 간결한 라우팅 규칙
- [x] NLQ Agent: 3줄 이내 요약 형식
- [x] Analyst Agent: 3섹션 의미 해석
- [x] Reporter Agent: 마크다운 템플릿
- [x] Anti-Timeout: 즉시 첫 바이트 전송
- [ ] Vercel timeout 테스트 (장시간 분석)
- [ ] Token 사용량 검증 (Groq/Gemini 대시보드)

## Backlog

### Async Job System
- [ ] `context-compression-design.md` 구현
- [ ] `job-queue-implementation-plan.md` 구현
- [ ] Redis 또는 Supabase Queue 선택

### Monitoring & Observability
- [ ] Agent 실행 시간 로깅
- [ ] 실패율 추적 (Circuit Breaker 통계)
- [ ] Cost 추적 (월별 토큰 사용량)

## Completed

| Task | Date | Notes |
|------|------|-------|
| Cloud Run AI Engine 배포 | 2025-12-16 | LangGraph Multi-Agent |
| Vercel LangGraph 제거 | 2025-12-17 | 번들 2MB 감소 |
| GraphRAG 하이브리드 검색 | 2025-12-18 | Vector + Text + Graph |
| Architecture Improvements | 2025-12-23 | 4 Tasks 완료 (Verifier/Cache/State/Context) |

---

_Related Docs:_
- `architecture-improvements-plan.md` - 아키텍처 개선 상세
- `async-job-architecture.md` - 비동기 작업 설계
- `job-queue-implementation-plan.md` - Job Queue 구현
