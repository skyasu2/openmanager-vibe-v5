# Claude Code 서브 에이전트 시스템 분석 요청

## 시스템 개요

- **총 13개 서브 에이전트**: 각각 명확한 전문 영역 담당
- **중앙 조율**: central-supervisor가 작업 분배 및 통합
- **MCP 서버**: 10개의 MCP(Model Context Protocol) 서버 활용
- **역할 분리 원칙**: 에이전트 간 책임 영역 명확히 분리

## 서브 에이전트 목록 및 역할

### 1. **central-supervisor** - 마스터 오케스트레이터

- **역할**: 복잡한 작업의 분해, 에이전트 조율, 결과 통합
- **사용 시기**: 3개 이상 도메인 관련 작업, 전체 프로젝트 최적화
- **MCP 활용**: 모든 MCP 서버 접근 가능

### 2. **ai-systems-engineer** - AI 시스템 아키텍처 전문가

- **역할**: AI 엔진 최적화, 모델 통합, 성능 개선
- **주요 MCP**: supabase, memory, sequential-thinking
- **전문 분야**: SimplifiedQueryEngine, UnifiedAIEngineRouter

### 3. **database-administrator** - DB 전담 관리자

- **역할**: Upstash Redis + Supabase PostgreSQL 최적화
- **주요 MCP**: supabase, filesystem, memory
- **전문 분야**: 캐싱 전략, RLS 정책, 쿼리 최적화, 인덱스 관리

### 4. **code-review-specialist** - 코드 품질 검토자

- **역할**: SOLID 원칙 검증, 코드 복잡도 분석, DRY 위반 탐지
- **주요 MCP**: filesystem, github, serena
- **전문 분야**: 타입 안전성, 리팩토링 제안

### 5. **security-auditor** - 보안 전문가

- **역할**: 취약점 탐지, OWASP 가이드라인 적용
- **주요 MCP**: filesystem, github, grep
- **전문 분야**: 인증/인가, SQL 인젝션, XSS 방지

### 6. **test-automation-specialist** - 테스트 자동화 전문가

- **역할**: Jest/Vitest/Playwright 테스트 작성 및 관리
- **주요 MCP**: filesystem, playwright, github
- **전문 분야**: TDD/BDD, E2E 테스트, 커버리지 관리

### 7. **doc-writer-researcher** - 문서 작성 전문가

- **역할**: 기술 문서 작성, API 문서화, 모범 사례 연구
- **주요 MCP**: tavily-mcp, context7, filesystem, time
- **전문 분야**: 웹 리서치, 문서 구조화

### 8. **doc-structure-guardian** - 문서 구조 관리자

- **역할**: JBGE 원칙 적용, 문서 정리 및 아카이빙
- **주요 MCP**: filesystem, github, memory
- **전문 분야**: 루트 파일 규칙 (4-6개 유지), DRY 원칙

### 9. **debugger-specialist** - 디버깅 전문가

- **역할**: 오류 분석, 스택 트레이스 해석, 최소 수정
- **주요 MCP**: sequential-thinking, github, filesystem
- **전문 분야**: 4단계 디버깅 프로세스

### 10. **issue-summary** - 플랫폼 모니터링 전문가

- **역할**: 24/7 DevOps 모니터링, 무료 티어 사용량 추적
- **주요 MCP**: supabase, filesystem, tavily-mcp
- **전문 분야**: Vercel/Redis/Supabase/GCP 상태 추적

### 11. **ux-performance-optimizer** - 프론트엔드 성능 전문가

- **역할**: Core Web Vitals 최적화, Lighthouse 점수 개선
- **주요 MCP**: filesystem, playwright, tavily-mcp
- **전문 분야**: Next.js 15 최적화, WCAG 준수

### 12. **mcp-server-admin** - MCP 인프라 관리자

- **역할**: MCP 서버 설정 관리, 충돌 해결, 상태 모니터링
- **주요 MCP**: filesystem, tavily-mcp, github
- **전문 분야**: CLI 기반 MCP 관리, 설정 검증

### 13. **gemini-cli-collaborator** - AI 협업 전문가

- **역할**: Claude-Gemini 협업, 교차 검증, 대안 관점 제시
- **주요 도구**: Bash, Read (Gemini CLI 연동)
- **전문 분야**: WSL 환경, echo/cat 파이핑

## MCP 서버 활용 매트릭스

### 현재 활성화된 MCP 서버 (10개)

1. **filesystem** - 파일 시스템 작업
2. **github** - GitHub 저장소 관리
3. **memory** - 지식 그래프 관리
4. **supabase** - 데이터베이스 작업
5. **context7** - 라이브러리 문서 검색
6. **tavily-mcp** - 웹 검색 및 크롤링
7. **sequential-thinking** - 복잡한 문제 해결
8. **playwright** - 브라우저 자동화
9. **serena** - 코드 분석 (LSP 기반)
10. **time** - 시간대 관리

## 체이닝 패턴

```
사용자 요청 → central-supervisor (작업 분석 및 분배)
  ├─ ai-systems-engineer (AI 기능 개발)
  ├─ database-administrator (DB 최적화)
  ├─ issue-summary (플랫폼 상태 확인)
  ├─ debugger-specialist (오류 분석)
  ├─ code-review-specialist (코드 검증)
  ├─ security-auditor (보안 검사)
  ├─ doc-structure-guardian (문서 정리)
  └─ doc-writer-researcher (문서 작성)
      └─ 모든 결과 → central-supervisor (통합 및 보고)
```

## 검증 포인트

1. **역할 완전성**: 누락된 기능이나 책임 영역이 있는가?
2. **역할 중복**: 서브 에이전트 간 책임이 겹치는 부분이 있는가?
3. **MCP 할당**: 각 에이전트의 MCP 서버 할당이 최적화되어 있는가?
4. **체이닝 효율성**: 에이전트 간 협업 패턴이 효율적인가?
5. **확장성**: 새로운 요구사항에 대응 가능한 구조인가?

## 성능 지표

- **병렬 처리**: 3개 에이전트 동시 실행으로 30-40% 시간 단축
- **자동 폴백**: AI 엔진 실패 시 200ms 이내 전환
- **캐싱 최적화**: 반복 쿼리 70-80% 시간 절약

## 개선 필요 영역

1. 에이전트 간 통신 오버헤드 최소화
2. MCP 서버 사용 빈도에 따른 재할당
3. 새로운 전문 영역 에이전트 필요성 검토
4. 기존 에이전트 통합 가능성 평가
