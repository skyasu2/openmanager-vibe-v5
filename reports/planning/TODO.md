# TODO - OpenManager VIBE v5

**Last Updated**: 2026-01-07

## Active Tasks

_(현재 활성 작업 없음)_

### Completed (2026-01-07)
- [x] Agent SSOT 패턴 리팩토링 (agent-configs.ts 중앙화)
- [x] Langfuse 무료 티어 보호 시스템 구현 (10% 샘플링)
- [x] Cloud Run 무료 티어 최적화 (1 vCPU, 512Mi)
- [x] cloud-run-deploy Skill 추가 (토큰 65% 절감)
- [x] Provider 상태 캐싱 구현 (checkProviderStatus)

### Completed (2026-01-04)
- [x] AI Rate Limit 예측 전환 (Pre-emptive Fallback) 구현
- [x] Provider Quota Tracker 구현 (Vercel + Cloud Run)
- [x] Redis Distributed Circuit Breaker Store 구현
- [x] MCP 서버 전체 동작 검증 (9/9 정상)

### Completed (2025-12-28)
- [x] LangGraph → Vercel AI SDK 마이그레이션 (v5.92.0)
- [x] 멀티-에이전트 오케스트레이션 구현 (`@ai-sdk-tools/agents`)
- [x] AI Engine 아키텍처 문서 최신화

### Documentation Cleanup (2025-12-23)
- [x] 레거시 계획서 아카이브 이동
- [x] docs/development 구조 정리
- [x] 통합 TODO 생성 (`docs/development/ai/TODO.md`)
- [x] 중복 파일 정리

## Domain-Specific TODOs

| Domain | Location | Description |
|--------|----------|-------------|
| **AI Development** | `docs/guides/ai/TODO.md` | Multi-Agent, Prompt Optimization |
| **Analysis Reports** | `reports/planning/analysis/` | 점검 리포트 |

## Low Priority (Backlog)

| Task | Description | Status |
|------|-------------|--------|
| 게스트 모드 보안 복원 | 개발 bypass 비활성화 | 보류 (포트폴리오 시연용) |

## Completed Archive

| Task | Date | Notes |
|------|------|-------|
| **LangGraph → Vercel AI SDK Migration** | **2025-12-28** | v5.92.0 - `@ai-sdk-tools/agents` 기반 멀티-에이전트 |
| AI Testing & Monitoring | 2025-12-23 | Unit/Integration Tests + Cache Monitor |
| AI Architecture Improvements | 2025-12-23 | 4 Tasks (Verifier/Cache/State/Context) |
| GraphRAG 하이브리드 검색 | 2025-12-18 | Vector + Text + Graph |
| Cloud Run 하이브리드 아키텍처 | 2025-12-16 | LangGraph Multi-Agent |
| Vercel LangGraph 제거 | 2025-12-17 | 번들 2MB 감소 |
| 문서 구조 개선 Phase 1-4 | 2025-12-19 | kebab-case 통일 |
| Code Interpreter | 2025-12-18 | Browser-based Python |
| 스크립트 통합 최적화 | 2025-12-14 | 72% 감소 |
| React 19/Next.js 16 업그레이드 | 2025-12-10 | - |

---

_Legacy planning docs archived in: `reports/planning/archive/2025-12/`_
