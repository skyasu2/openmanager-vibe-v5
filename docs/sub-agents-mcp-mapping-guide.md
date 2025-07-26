# 서브 에이전트 MCP 매핑 가이드

## 📋 개요

각 서브 에이전트가 효과적으로 작업을 수행하기 위한 추천 MCP 서버 매핑 가이드입니다.
모든 10개 서브 에이전트는 정상 동작 상태이며, 작업 특성에 따라 최적의 MCP 조합을 사용합니다.

## 🎯 서브 에이전트별 MCP 매핑

### 1. AI Systems Engineer (ai-systems-engineer)

- **주요 MCP**:
  - `supabase` - AI 모델 데이터 및 설정 관리
  - `memory` - AI 학습 데이터 및 컨텍스트 저장
  - `sequential-thinking` - 복잡한 AI 시스템 설계
  - `filesystem` - 코드 및 설정 파일 관리
- **보조 MCP**:
  - `tavily-mcp` - AI 관련 최신 정보 검색
  - `context7` - AI/ML 라이브러리 문서 참조
- **사용 예시**: AI 듀얼 모드 시스템 설계, NLP 파이프라인 최적화

### 2. MCP Server Admin (mcp-server-admin)

- **주요 MCP**:
  - `filesystem` - mcp.json 설정 파일 직접 편집
  - `tavily-mcp` - 최신 MCP 정보 웹 검색
  - `github` - MCP 관련 GitHub 저장소 탐색
- **보조 MCP**:
  - `memory` - MCP 설정 및 사용 이력 저장
  - `sequential-thinking` - 복잡한 MCP 문제 해결
- **사용 예시**: 새 MCP 서버 추가, 기존 MCP 설정 최적화

### 3. Issue Summary (issue-summary)

- **주요 MCP**:
  - `supabase` - 서비스 상태 및 로그 데이터 조회
  - `filesystem` - 이슈 보고서 생성 및 저장
  - `tavily-mcp` - 외부 서비스 상태 페이지 확인
- **보조 MCP**:
  - `memory` - 이슈 패턴 및 해결 이력 저장
  - `sequential-thinking` - 복잡한 이슈 근본 원인 분석
- **사용 예시**: 시스템 헬스 체크, 인시던트 보고서 생성

### 4. Database Administrator (database-administrator)

- **주요 MCP**:
  - `supabase` - PostgreSQL 스키마 및 쿼리 관리
  - `filesystem` - SQL 스크립트 및 마이그레이션 파일 관리
  - `memory` - 쿼리 최적화 패턴 저장
- **보조 MCP**:
  - `context7` - PostgreSQL/Redis 문서 참조
  - `sequential-thinking` - 복잡한 쿼리 최적화 전략
- **사용 예시**: DB 스키마 설계, 인덱스 최적화, 쿼리 성능 개선

### 5. Code Review Specialist (code-review-specialist)

- **주요 MCP**:
  - `filesystem` - 코드 파일 읽기 및 분석
  - `github` - PR 및 diff 검토
  - `serena` - 코드 품질 분석 도구 활용
- **보조 MCP**:
  - `context7` - 코딩 표준 및 베스트 프랙티스 참조
  - `sequential-thinking` - 복잡한 코드 로직 분석
- **사용 예시**: PR 리뷰, 보안 취약점 스캔, 코드 품질 개선

### 6. Doc Structure Guardian (doc-structure-guardian)

- **주요 MCP**:
  - `filesystem` - 문서 파일 관리 및 이동
  - `github` - 문서 변경사항 추적 및 커밋
  - `memory` - 문서 구조 규칙 및 이력 저장
- **보조 MCP**:
  - `sequential-thinking` - 문서 구조 재설계
- **사용 예시**: 문서 구조 정리, 중복 문서 제거, 버전 관리

### 7. UX Performance Optimizer (ux-performance-optimizer)

- **주요 MCP**:
  - `filesystem` - 프론트엔드 코드 최적화
  - `playwright` - 성능 테스트 및 UX 검증
  - `tavily-mcp` - 최신 웹 성능 기법 검색
- **보조 MCP**:
  - `context7` - Next.js/React 최적화 문서
  - `memory` - 성능 메트릭 및 개선 이력
- **사용 예시**: Lighthouse 점수 개선, Core Web Vitals 최적화

### 8. Gemini CLI Collaborator (gemini-cli-collaborator)

- **주요 MCP**:
  - `filesystem` - 파일 내용을 Gemini에 전달
  - `github` - git diff를 Gemini로 분석
  - `sequential-thinking` - Gemini와 협업 전략 수립
- **보조 MCP**:
  - `memory` - Gemini 대화 이력 및 인사이트 저장
  - `tavily-mcp` - Gemini CLI 사용법 검색
- **사용 예시**: 복잡한 문제 해결, 코드 리뷰 세컨드 오피니언

### 9. Test Automation Specialist (test-automation-specialist)

- **주요 MCP**:
  - `filesystem` - 테스트 코드 생성 및 관리
  - `playwright` - E2E 테스트 자동화
  - `github` - 테스트 결과 PR 생성
- **보조 MCP**:
  - `context7` - 테스트 프레임워크 문서
  - `memory` - 테스트 패턴 및 커버리지 이력
- **사용 예시**: 테스트 스위트 생성, 실패 테스트 분석

### 10. Agent Evolution Manager (agent-evolution-manager)

- **주요 MCP**:
  - `memory` - 에이전트 성능 이력 및 개선 패턴 저장
  - `filesystem` - 에이전트 설정 파일 분석 및 수정
  - `sequential-thinking` - 복잡한 성능 문제 진단 및 개선안 도출
  - `github` - 에이전트 코드 변경사항 추적 및 관리
- **보조 MCP**:
  - `tavily-mcp` - 최신 AI/ML 트렌드 및 모범 사례 검색
  - `supabase` - 성능 메트릭 데이터베이스 관리
- **사용 예시**: 에이전트 자동 성능 개선, 실패 패턴 분석, 주간 성능 리뷰

## 🚀 활용 가이드

### 서브 에이전트 호출 시 MCP 지정 예시

```bash
# AI Systems Engineer를 호출하면서 필요한 MCP 명시
Task(
  subagent_type="ai-systems-engineer",
  description="AI 듀얼 모드 시스템 최적화",
  prompt="""
  SimplifiedQueryEngine의 성능을 개선하고 Google AI와 Local AI 간
  전환 로직을 최적화해주세요.

  사용 가능한 MCP:
  - supabase: AI 설정 데이터 관리
  - memory: 성능 메트릭 저장
  - sequential-thinking: 복잡한 최적화 전략 수립
  """
)
```

### MCP 조합 전략

1. **주요 MCP**: 해당 에이전트의 핵심 작업에 필수적인 도구
2. **보조 MCP**: 특정 상황에서 유용한 추가 도구
3. **공통 MCP**: 모든 에이전트가 기본적으로 사용하는 filesystem

### 성능 최적화 팁

- 필요한 MCP만 명시하여 컨텍스트 효율성 향상
- 작업 특성에 맞는 MCP 조합 사용
- 복잡한 작업은 sequential-thinking MCP 활용

## 📊 MCP 사용 빈도 매트릭스

| 서브 에이전트 | filesystem | github | supabase | memory | tavily | context7 | playwright | serena | sequential |
| ------------- | ---------- | ------ | -------- | ------ | ------ | -------- | ---------- | ------ | ---------- |
| AI Systems    | ⭐⭐⭐     | ⭐     | ⭐⭐⭐   | ⭐⭐⭐ | ⭐⭐   | ⭐⭐     | -          | -      | ⭐⭐⭐     |
| MCP Admin     | ⭐⭐⭐     | ⭐⭐   | -        | ⭐⭐   | ⭐⭐⭐ | -        | -          | -      | ⭐⭐       |
| Issue Summary | ⭐⭐⭐     | -      | ⭐⭐⭐   | ⭐⭐   | ⭐⭐   | -        | -          | -      | ⭐⭐       |
| Database      | ⭐⭐⭐     | -      | ⭐⭐⭐   | ⭐⭐⭐ | -      | ⭐⭐     | -          | -      | ⭐⭐       |
| Code Review   | ⭐⭐⭐     | ⭐⭐⭐ | -        | -      | -      | ⭐⭐     | -          | ⭐⭐⭐ | ⭐⭐       |
| Doc Guardian  | ⭐⭐⭐     | ⭐⭐   | -        | ⭐⭐   | -      | -        | -          | -      | ⭐         |
| UX Optimizer  | ⭐⭐⭐     | -      | -        | ⭐⭐   | ⭐⭐   | ⭐⭐     | ⭐⭐⭐     | -      | -          |
| Gemini Collab | ⭐⭐⭐     | ⭐⭐   | -        | ⭐⭐   | ⭐     | -        | -          | -      | ⭐⭐⭐     |
| Test Auto     | ⭐⭐⭐     | ⭐⭐   | -        | ⭐⭐   | -      | ⭐⭐     | ⭐⭐⭐     | -      | -          |
| Agent Evolve  | ⭐⭐⭐     | ⭐⭐⭐ | ⭐⭐     | ⭐⭐⭐ | ⭐⭐   | -        | -          | -      | ⭐⭐⭐     |

⭐⭐⭐: 필수 사용 | ⭐⭐: 자주 사용 | ⭐: 가끔 사용 | -: 사용 안함

## 🔄 업데이트 이력

- 2025-07-26: Agent Evolution Manager 추가로 10개 서브 에이전트로 확장
- 2025-07-26: 초기 버전 생성
- 모든 10개 서브 에이전트 정상 동작 확인
- MCP 서버별 최적 매핑 정의
