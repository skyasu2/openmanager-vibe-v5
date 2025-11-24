# 📚 OpenManager VIBE v5 문서 인덱스

> **전체 문서 수**: 245개의 마크다운 파일  
> **최종 업데이트**: 2025-11-24

이 프로젝트의 문서는 주제별로 체계적으로 관리되고 있습니다. 아래 인덱스를 통해 필요한 정보를 빠르게 찾아보세요.

---

## 🚀 시작하기

프로젝트를 처음 시작하는 분들을 위한 필수 문서입니다.

| 문서                               | 설명                                | 중요도 |
| ---------------------------------- | ----------------------------------- | ------ |
| [QUICK-START.md](./QUICK-START.md) | 5분 만에 프로젝트 실행하기          | ⭐⭐⭐ |
| [DEVELOPMENT.md](./DEVELOPMENT.md) | 개발 환경 설정, AI 도구, WSL 가이드 | ⭐⭐⭐ |
| [README.md](../README.md)          | 프로젝트 메인 소개                  | ⭐⭐⭐ |

---

## 🏗️ 아키텍처 & 설계

시스템 구조와 설계 결정에 관한 문서입니다.

### 핵심 아키텍처

| 문서                                                                                         | 설명                      |
| -------------------------------------------------------------------------------------------- | ------------------------- |
| [architecture/SYSTEM-ARCHITECTURE-CURRENT.md](./architecture/SYSTEM-ARCHITECTURE-CURRENT.md) | 현재 시스템 전체 아키텍처 |
| [architecture/system-overview.md](./architecture/system-overview.md)                         | 시스템 개요               |
| [architecture/SYSTEM-ARCHITECTURE-REVIEW.md](./architecture/SYSTEM-ARCHITECTURE-REVIEW.md)   | 아키텍처 리뷰             |

### 설계 문서 (Design)

| 문서                                                                                                           | 설명                                     |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| [design/current/system-architecture-ai.md](./design/current/system-architecture-ai.md)                         | AI 시스템 아키텍처                       |
| [design/current/database-schema.md](./design/current/database-schema.md)                                       | Supabase 데이터베이스 스키마 (작성 예정) |
| [design/current/authentication-system-architecture.md](./design/current/authentication-system-architecture.md) | 인증 시스템 아키텍처                     |
| [design/current/realtime-monitoring-v5.71.0.md](./design/current/realtime-monitoring-v5.71.0.md)               | 실시간 모니터링 시스템                   |
| [design/current/test-automation-architecture.md](./design/current/test-automation-architecture.md)             | 테스트 자동화 아키텍처                   |

### 아키텍처 결정 기록 (ADR)

중요한 기술 결정 사항을 기록한 문서입니다.

| 문서                                                                                                                                                 | 설명                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| [architecture/decisions/adr-001-unified-ai-engine-cache-and-providers.md](./architecture/decisions/adr-001-unified-ai-engine-cache-and-providers.md) | 통합 AI 엔진 캐시 및 프로바이더 |
| [architecture/decisions/adr-002-server-card-rendering-strategy.md](./architecture/decisions/adr-002-server-card-rendering-strategy.md)               | 서버 카드 렌더링 전략           |

### API 명세

| 문서                                                             | 설명                |
| ---------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------ | --------- |
| [architecture/api/endpoints.md](./architecture/api/endpoints.md) | API 엔드포인트 목록 |
| [architecture/api/routes.md](./architecture/api/routes.md)       | 라우트 구조         |
| [architecture/api/schemas.md](./architecture/api/schemas.md)     | API 스키마          | [architecture/api/validation.md](./architecture/api/validation.md) | 요청 검증 |

### 데이터베이스

| 문서                                                                 | 설명                |
| -------------------------------------------------------------------- | ------------------- |
| [architecture/db/schema.md](./architecture/db/schema.md)             | 데이터베이스 스키마 |
| [architecture/db/queries.md](./architecture/db/queries.md)           | 주요 쿼리 패턴      |
| [architecture/db/optimization.md](./architecture/db/optimization.md) | DB 최적화 전략      |

---

## 🤖 AI 시스템

Google AI Unified Engine 및 관련 AI 기능에 대한 문서입니다.

### AI 개요

| 문서                                                                             | 설명                            |
| -------------------------------------------------------------------------------- | ------------------------------- |
| [ai/README.md](./ai/README.md)                                                   | AI 시스템 전체 개요 (작성 예정) |
| [AI-ENGINE-OPTIMIZATION-2025-11-20.md](./AI-ENGINE-OPTIMIZATION-2025-11-20.md)   | AI 엔진 최적화 보고서           |
| [ai-improvements-summary-2025-11-23.md](./ai-improvements-summary-2025-11-23.md) | AI 개선 사항 요약               |
| [unified-engine-refactoring-REVISED.md](./unified-engine-refactoring-REVISED.md) | AI 엔진 리팩토링 계획 (수정본)  |
| [unified-engine-refactoring.md](./unified-engine-refactoring.md)                 | AI 엔진 리팩토링 계획 (원본)    |

### AI 서브에이전트

| 문서                                                                     | 설명                       |
| ------------------------------------------------------------------------ | -------------------------- |
| [ai-sidebar-analysis-2025-11-20.md](./ai-sidebar-analysis-2025-11-20.md) | AI 사이드바 분석           |
| [serena-anti-pattern-detection.md](./serena-anti-pattern-detection.md)   | Serena 안티 패턴 탐지      |
| [weekly-subagent-reminder.md](./weekly-subagent-reminder.md)             | 서브에이전트 주간 리마인더 |

### AI 프롬프트 & 검증

| 디렉터리/문서                          | 설명                                |
| -------------------------------------- | ----------------------------------- |
| [ai/prompts/](./ai/prompts/)           | 시스템 프롬프트 및 전략 (22개 파일) |
| [ai/verification/](./ai/verification/) | AI 응답 정확도 검증 (작성 예정)     |

---

## 🧪 테스트 & 품질

### 테스트 전략

| 문서                                                                   | 설명                           |
| ---------------------------------------------------------------------- | ------------------------------ |
| [testing/README.md](./testing/README.md)                               | 테스트 전체 가이드 (작성 예정) |
| [testing/test-strategy-guide.md](./testing/test-strategy-guide.md)     | 테스트 전략 가이드             |
| [TEST-IMPROVEMENT-PLAN.md](./TEST-IMPROVEMENT-PLAN.md)                 | 테스트 개선 계획               |
| [testing/vercel-first-strategy.md](./testing/vercel-first-strategy.md) | Vercel 우선 테스트 전략        |

### E2E 테스트

| 문서                                                                             | 설명                          |
| -------------------------------------------------------------------------------- | ----------------------------- |
| [testing/e2e-testing-guide.md](./testing/e2e-testing-guide.md)                   | E2E 테스트 가이드             |
| [testing/e2e-playwright.md](./testing/e2e-playwright.md)                         | Playwright 테스트             |
| [testing/e2e-dom-structure-analysis.md](./testing/e2e-dom-structure-analysis.md) | DOM 구조 분석                 |
| [testing/guest-mode-e2e-test-report.md](./testing/guest-mode-e2e-test-report.md) | 게스트 모드 E2E 테스트 리포트 |

### Vercel 프로덕션 테스트

| 문서                                                                                         | 설명                          |
| -------------------------------------------------------------------------------------------- | ----------------------------- |
| [testing/README-vercel-production-testing.md](./testing/README-vercel-production-testing.md) | Vercel 프로덕션 테스트 가이드 |
| [testing/vercel-production-test-scenarios.md](./testing/vercel-production-test-scenarios.md) | 테스트 시나리오               |
| [testing/vercel-production-test-report.md](./testing/vercel-production-test-report.md)       | 테스트 리포트                 |
| [testing/vercel-manual-test-guide.md](./testing/vercel-manual-test-guide.md)                 | 수동 테스트 가이드            |
| [testing/vercel-ai-testing-guide.md](./testing/vercel-ai-testing-guide.md)                   | AI를 사용한 테스트 가이드     |

### 기타 테스트 문서

| 문서                                                                                 | 설명                    |
| ------------------------------------------------------------------------------------ | ----------------------- |
| [testing/universal-vitals-setup-guide.md](./testing/universal-vitals-setup-guide.md) | Universal Vitals 설정   |
| [testing/test-templates.md](./testing/test-templates.md)                             | 테스트 템플릿           |
| [testing/admin-mode-manual-test-guide.md](./testing/admin-mode-manual-test-guide.md) | 관리자 모드 수동 테스트 |
| [testing/local-test-limitations.md](./testing/local-test-limitations.md)             | 로컬 테스트 제한 사항   |

---

## ☁️ 배포 & 운영

### 배포 가이드

| 문서                                                                                                                      | 설명                    |
| ------------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| [deploy/README.md](./deploy/README.md)                                                                                    | 배포 가이드 (작성 예정) |
| [deploy/vercel.md](./deploy/vercel.md)                                                                                    | Vercel 배포             |
| [gcp-deployment-guide.md](./gcp-deployment-guide.md)                                                                      | GCP 배포 가이드         |
| [deploy/free-tier.md](./deploy/free-tier.md)                                                                              | 무료 티어 운영          |
| [deploy/zero-cost-operations.md](./deploy/zero-cost-operations.md)                                                        | 제로 비용 운영 전략     |
| [archive/reports-2025-09/deployment-status-report.md](./archive/reports-2025-09/deployment-status-report.md) (아카이브됨) | 배포 상태 리포트        |

### Vercel 최적화

| 문서                                                                     | 설명                 |
| ------------------------------------------------------------------------ | -------------------- |
| [deploy/vercel-optimization.md](./deploy/vercel-optimization.md)         | Vercel 최적화 가이드 |
| [deploy/vercel-specialist-guide.md](./deploy/vercel-specialist-guide.md) | Vercel 전문가 가이드 |
| [deploy/warnings.md](./deploy/warnings.md)                               | 배포 시 주의사항     |

### 모니터링

| 문서                                                                                                   | 설명                        |
| ------------------------------------------------------------------------------------------------------ | --------------------------- |
| [monitoring/README.md](./monitoring/README.md)                                                         | 모니터링 시스템 (작성 예정) |
| [monitoring/monitoring-system-integration-plan.md](./monitoring/monitoring-system-integration-plan.md) | 모니터링 시스템 통합 계획   |

---

## 🔧 개발 가이드

개발 환경 설정 및 도구 사용법입니다.

### 개발 환경

| 문서                                                                       | 설명                         |
| -------------------------------------------------------------------------- | ---------------------------- |
| [development/README.md](./development/README.md)                           | 개발 가이드 개요 (작성 예정) |
| [development/wsl-optimization.md](./development/wsl-optimization.md)       | WSL 최적화 가이드            |
| [development/build-test-strategy.md](./development/build-test-strategy.md) | 빌드 & 테스트 전략           |

### AI 도구 & Claude Code

| 문서                                                                                                     | 설명                        |
| -------------------------------------------------------------------------------------------------------- | --------------------------- |
| [development/ai-tools-setup.md](./development/ai-tools-setup.md)                                         | AI 도구 설정                |
| [development/ai-systems-distinction.md](./development/ai-systems-distinction.md)                         | AI 시스템 구분              |
| [development/claude-code-v2.0.31-best-practices.md](./development/claude-code-v2.0.31-best-practices.md) | Claude Code 베스트 프랙티스 |
| [development/claude-code-hooks-guide.md](./development/claude-code-hooks-guide.md)                       | Claude Code Hooks 가이드    |
| [development/claude-workflow-guide.md](./development/claude-workflow-guide.md)                           | Claude 워크플로우 가이드    |

### MCP (Model Context Protocol)

| 문서                                                                                     | 설명                 |
| ---------------------------------------------------------------------------------------- | -------------------- |
| [development/mcp/README.md](./development/mcp/README.md)                                 | MCP 개요 (작성 예정) |
| [development/mcp/setup-guide.md](./development/mcp/setup-guide.md)                       | MCP 설정 가이드      |
| [development/mcp/mcp-configuration.md](./development/mcp/mcp-configuration.md)           | MCP 설정             |
| [development/mcp/mcp-priority-guide.md](./development/mcp/mcp-priority-guide.md)         | MCP 우선순위 가이드  |
| [development/mcp/integration.md](./development/mcp/integration.md)                       | MCP 통합             |
| [development/mcp/servers.md](./development/mcp/servers.md)                               | MCP 서버             |
| [development/mcp/tools.md](./development/mcp/tools.md)                                   | MCP 도구             |
| [development/mcp/advanced.md](./development/mcp/advanced.md)                             | 고급 MCP             |
| [development/playwright-mcp-setup-guide.md](./development/playwright-mcp-setup-guide.md) | Playwright MCP 설정  |

### 성능 최적화

| 문서                                                                                                                   | 설명                         |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| [development/performance-optimization-guide.md](./development/performance-optimization-guide.md)                       | 성능 최적화 가이드           |
| [development/centralized-configuration-migration-guide.md](./development/centralized-configuration-migration-guide.md) | 중앙집중식 설정 마이그레이션 |
| [development/progressive-lint-guide.md](./development/progressive-lint-guide.md)                                       | 점진적 린트 가이드           |

### 기타 개발 문서

| 문서                                                                                               | 설명                         |
| -------------------------------------------------------------------------------------------------- | ---------------------------- |
| [development/zustand-migration-phase2-report.md](./development/zustand-migration-phase2-report.md) | Zustand 마이그레이션 Phase 2 |

---

## 🎯 성능 최적화

성능 분석 및 최적화 관련 문서입니다.

| 문서                                                                                                         | 설명                         |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| [performance/README.md](./performance/README.md)                                                             | 성능 최적화 개요 (작성 예정) |
| [performance/bundle.md](./performance/bundle.md)                                                             | 번들 최적화                  |
| [performance/charts.md](./performance/charts.md)                                                             | 차트 성능                    |
| [performance/cache-improvement-analysis.md](./performance/cache-improvement-analysis.md)                     | 캐시 개선 분석               |
| [performance/ip-whitelist-optimization.md](./performance/ip-whitelist-optimization.md)                       | IP 화이트리스트 최적화       |
| [performance/performance-analysis-portfolio-level.md](./performance/performance-analysis-portfolio-level.md) | 포트폴리오 수준 성능 분석    |

---

## 🔒 보안

보안 정책 및 가이드입니다.

| 문서                                                                                             | 설명                         |
| ------------------------------------------------------------------------------------------------ | ---------------------------- |
| [security/README.md](./security/README.md)                                                       | 보안 가이드 개요 (작성 예정) |
| [security/github-oauth.md](./security/github-oauth.md)                                           | GitHub OAuth                 |
| [security/supabase-security-issues-analysis.md](./security/supabase-security-issues-analysis.md) | Supabase 보안 이슈 분석      |

---

## 📋 분석 문서

프로젝트 분석 관련 문서입니다.

| 문서                                                                                                     | 설명                         |
| -------------------------------------------------------------------------------------------------------- | ---------------------------- |
| [analysis/README.md](./analysis/README.md)                                                               | 분석 문서 개요 (작성 예정)   |
| [analysis/GCP-INTEGRATION-METHOD.md](./analysis/GCP-INTEGRATION-METHOD.md)                               | GCP 통합 방법 분석           |
| [analysis/MEMORY-REQUIREMENTS.md](./analysis/MEMORY-REQUIREMENTS.md)                                     | 메모리 요구사항              |
| [analysis/mock-simulation.md](./analysis/mock-simulation.md)                                             | 목 시뮬레이션 분석           |
| [analysis/type-system-consistency.md](./analysis/type-system-consistency.md)                             | 타입 시스템 일관성           |
| [analysis/typescript-any-removal-project-report.md](./analysis/typescript-any-removal-project-report.md) | TypeScript any 제거 프로젝트 |

---

## 📖 가이드

각종 사용 가이드 및 튜토리얼입니다.

| 문서                                                                                     | 설명                        |
| ---------------------------------------------------------------------------------------- | --------------------------- |
| [guides/README.md](./guides/README.md)                                                   | 가이드 개요 (작성 예정)     |
| [guides/mock-system.md](./guides/mock-system.md)                                         | 목 시스템 가이드            |
| [guides/simulation.md](./guides/simulation.md)                                           | 시뮬레이션 가이드           |
| [guides/types.md](./guides/types.md)                                                     | 타입 가이드                 |
| [guides/utils.md](./guides/utils.md)                                                     | 유틸리티 가이드             |
| [guides/side-effects-optimization-guide.md](./guides/side-effects-optimization-guide.md) | 사이드 이펙트 최적화 가이드 |

---

## 📐 표준 & 컨벤션

코딩 표준 및 컨벤션 문서입니다.

| 문서                                                                             | 설명                      |
| -------------------------------------------------------------------------------- | ------------------------- |
| [standards/commit-conventions.md](./standards/commit-conventions.md)             | 커밋 메시지 컨벤션        |
| [standards/file-organization.md](./standards/file-organization.md)               | 파일 구조 표준            |
| [standards/git-hooks-best-practices.md](./standards/git-hooks-best-practices.md) | Git Hooks 베스트 프랙티스 |
| [standards/health-check-policy.md](./standards/health-check-policy.md)           | 헬스 체크 정책            |
| [standards/typescript-rules.md](./standards/typescript-rules.md)                 | TypeScript 규칙           |

---

## 📜 스펙 (Specifications)

기능 명세 및 계획 문서입니다.

| 문서                                                                             | 설명                     |
| -------------------------------------------------------------------------------- | ------------------------ |
| [specs/ai-engine-refactoring-plan.md](./specs/ai-engine-refactoring-plan.md)     | AI 엔진 리팩토링 계획    |
| [specs/lint-cleanup-next-phase-spec.md](./specs/lint-cleanup-next-phase-spec.md) | 린트 정리 다음 단계 스펙 |
| [specs/lint-cleanup-phase3-plan.md](./specs/lint-cleanup-phase3-plan.md)         | 린트 정리 Phase 3 계획   |

---

## 🐛 문제 해결

트러블슈팅 및 문제 해결 가이드입니다.

| 문서                                                                                                                 | 설명                              |
| -------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [troubleshooting/README.md](./troubleshooting/README.md)                                                             | 문제 해결 가이드 (작성 예정)      |
| [troubleshooting/common.md](./troubleshooting/common.md)                                                             | 일반적인 문제                     |
| [troubleshooting/build.md](./troubleshooting/build.md)                                                               | 빌드 문제                         |
| [troubleshooting/claude-400-invalid-json.md](./troubleshooting/claude-400-invalid-json.md)                           | Claude 400 에러                   |
| [troubleshooting/github-actions-analysis.md](./troubleshooting/github-actions-analysis.md)                           | GitHub Actions 문제 분석          |
| [troubleshooting/playwright-mcp-recovery-guide.md](./troubleshooting/playwright-mcp-recovery-guide.md)               | Playwright MCP 복구 가이드        |
| [troubleshooting/playwright-mcp-side-effects-analysis.md](./troubleshooting/playwright-mcp-side-effects-analysis.md) | Playwright MCP 사이드 이펙트 분석 |
| [troubleshooting/system-recovery-guide-2025.md](./troubleshooting/system-recovery-guide-2025.md)                     | 시스템 복구 가이드 2025           |
| [troubleshooting/wsl-monitoring-guide.md](./troubleshooting/wsl-monitoring-guide.md)                                 | WSL 모니터링 가이드               |

---

## 💼 권장사항 & 계획

프로젝트 개선 권장사항 및 향후 계획입니다.

| 문서                                                                                                                                                                                     | 설명                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ |
| [recommendations/server-card-rendering-strategy-optimization-actionable-recommendations.md](./recommendations/server-card-rendering-strategy-optimization-actionable-recommendations.md) | 서버 카드 렌더링 최적화 권장사항     |
| [improvement-plan.md](./improvement-plan.md)                                                                                                                                             | 개선 계획                            |
| [planning/2025-11-claude-code-skills-adoption.md](./planning/2025-11-claude-code-skills-adoption.md)                                                                                     | 2025-11 Claude Code Skills 도입 계획 |

---

## 📊 상태 & 리포트

프로젝트 상태 및 각종 리포트입니다.

| 문서                                                                 | 설명                    |
| -------------------------------------------------------------------- | ----------------------- |
| [status.md](./status.md)                                             | 프로젝트 전체 상태      |
| [FEATURE-CARDS-REVIEW.md](./FEATURE-CARDS-REVIEW.md)                 | 기능 카드 리뷰          |
| [FEATURE-CARDS-UPDATE-SUMMARY.md](./FEATURE-CARDS-UPDATE-SUMMARY.md) | 기능 카드 업데이트 요약 |

---

## 🗄️ 아카이브

더 이상 사용하지 않거나 참고용 레거시 문서입니다.

| 디렉터리/문서                                                              | 설명                             |
| -------------------------------------------------------------------------- | -------------------------------- |
| [archive/README.md](./archive/README.md)                                   | 아카이브 개요                    |
| [archive/DOCS-CLEANUP-2025-11-20.md](./archive/DOCS-CLEANUP-2025-11-20.md) | 문서 정리 기록                   |
| [archive/ai-verifications/](./archive/ai-verifications/)                   | AI 검증 아카이브 (15개 파일)     |
| [archive/lint-reports-2025-11/](./archive/lint-reports-2025-11/)           | Lint 리포트 아카이브 (17개 파일) |
| [archive/reports-2025-09/](./archive/reports-2025-09/)                     | 2025-09월 리포트 아카이브 (3개)  |
| [archive/refactoring-plans/](./archive/refactoring-plans/)                 | 완료된 리팩토링 계획 (2개)       |
| [archive/reports/](./archive/reports/)                                     | 기타 리포트                      |
| [archive/subagent-analysis/](./archive/subagent-analysis/)                 | 서브에이전트 분석                |
| [archive/testing/](./archive/testing/)                                     | 테스트 관련 아카이브             |

---

## 🔄 워크플로우

자동화된 워크플로우 문서입니다.

| 문서                                                             | 설명                      |
| ---------------------------------------------------------------- | ------------------------- |
| [workflows/auto-code-review.md](./workflows/auto-code-review.md) | 자동 코드 리뷰 워크플로우 |

---

## 📌 임시 문서

진행 중이거나 임시로 작성된 문서입니다.

| 문서                                                                             | 설명                       |
| -------------------------------------------------------------------------------- | -------------------------- |
| [temp/ai-engine-cleanup-summary.md](./temp/ai-engine-cleanup-summary.md)         | AI 엔진 정리 요약          |
| [temp/lint-warning-improvement-plan.md](./temp/lint-warning-improvement-plan.md) | Lint 경고 개선 계획        |
| [temp/project-analysis-2025-11-14.md](./temp/project-analysis-2025-11-14.md)     | 프로젝트 분석 (2025-11-14) |

---

## 🔍 문서 검색 팁

### VS Code에서 검색

```
Ctrl + P → 파일명 검색
Ctrl + Shift + F → 전체 문서 내용 검색
```

### 커맨드라인에서 검색

```bash
# 파일명으로 검색
find docs -name "*keyword*.md"

# 내용으로 검색
grep -r "keyword" docs/
```

### 주요 키워드 맵핑

- **Vercel**: deploy/, testing/vercel-\*
- **AI**: ai/, development/ai-_, AI-ENGINE-_
- **테스트**: testing/, TEST-\*
- **보안**: security/, standards/
- **성능**: performance/, development/performance-\*
- **MCP**: development/mcp/
- **트러블슈팅**: troubleshooting/

---

## 📝 문서 기여 가이드

새로운 문서를 추가하실 때는 다음 가이드라인을 따라주세요:

1. **위치 선택**: 위 카테고리 중 적절한 폴더에 배치
2. **네이밍**: `kebab-case.md` 형식 사용
3. **헤더**: 문서 최상단에 제목(# )과 간단한 설명 추가
4. **인덱스 업데이트**: 이 README.md 파일에 새 문서 링크 추가
5. **날짜 포함**: 시간 민감한 문서는 파일명에 날짜 포함 (예: `report-2025-11-24.md`)

---

## 📮 연락처 & 지원

문서 관련 질문이나 개선 제안은 프로젝트 이슈 트래커를 이용해주세요.

**Happy Coding! 🚀**
