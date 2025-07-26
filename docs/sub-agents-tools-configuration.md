# 서브 에이전트 Tools 설정 가이드 🛠️

> 각 서브 에이전트에 적합한 도구 접근 권한 설정

## 📋 에이전트별 Tools 설정

### 1. agent-evolution-manager

```yaml
tools:
  - Read # 에이전트 파일 읽기
  - Write # 에이전트 설정 수정
  - Edit # 에이전트 코드 개선
  - Task # 다른 에이전트 성능 테스트
  - mcp__memory__create_entities
  - mcp__filesystem__read_multiple_files
  - mcp__github__list_commits
  - mcp__sequential-thinking__sequentialthinking
```

### 2. ai-systems-engineer

```yaml
tools:
  - Read # AI 설정 및 코드 파일 읽기
  - Write # AI 설정 파일 생성/수정
  - Edit # AI 시스템 코드 수정
  - Task # 다른 에이전트와 협업
  - WebSearch # AI 기술 최신 동향 검색
  - mcp__supabase__execute_sql
  - mcp__memory__create_entities
  - mcp__sequential-thinking__sequentialthinking
```

### 3. code-review-specialist

```yaml
tools:
  - Read # 코드 파일 읽기
  - Grep # 패턴 검색 및 분석
  - Task # 필요시 다른 에이전트 호출
  - mcp__filesystem__read_file
  - mcp__github__get_pull_request
  - mcp__serena__find_symbol
```

### 4. database-administrator

```yaml
tools:
  - Read # SQL 스크립트 및 스키마 파일 읽기
  - Write # 마이그레이션 파일 생성
  - Edit # 스키마 및 쿼리 수정
  - mcp__supabase__execute_sql
  - mcp__supabase__apply_migration
  - mcp__supabase__list_tables
  - mcp__filesystem__write_file
  - mcp__memory__create_entities
```

### 5. doc-structure-guardian

```yaml
tools:
  - Read # 문서 파일 읽기
  - Write # 문서 생성/이동
  - Edit # 문서 내용 수정
  - Bash # 파일 이동/삭제 명령
  - mcp__filesystem__move_file
  - mcp__filesystem__list_directory
  - mcp__github__create_or_update_file
  - mcp__memory__add_observations
```

### 6. gemini-cli-collaborator

```yaml
tools:
  - Read # 파일 읽기 (Gemini에 전달용)
  - Bash # Gemini CLI 실행
  - Task # 협업 전략 수립
  - mcp__filesystem__read_multiple_files
  - mcp__github__get_file_contents
  - mcp__sequential-thinking__sequentialthinking
  - mcp__memory__create_relations
```

### 7. issue-summary

```yaml
tools:
  - Read # 로그 파일 읽기
  - Write # 이슈 보고서 작성
  - WebFetch # 외부 서비스 상태 확인
  - mcp__supabase__get_logs
  - mcp__supabase__get_advisors
  - mcp__filesystem__write_file
  - mcp__tavily-mcp__tavily-search
  - mcp__memory__add_observations
```

### 8. mcp-server-admin

```yaml
tools:
  - Read # MCP 설정 파일 읽기
  - Write # MCP 설정 파일 수정
  - Edit # mcp.json 직접 편집
  - WebSearch # MCP 최신 정보 검색
  - Bash # npx 설치 명령
  - mcp__filesystem__edit_file
  - mcp__tavily-mcp__tavily-search
  - mcp__github__search_repositories
  - mcp__memory__create_entities
```

### 9. test-automation-specialist

```yaml
tools:
  - Read # 코드 파일 읽기
  - Write # 테스트 파일 생성
  - Edit # 테스트 코드 수정
  - Bash # 테스트 실행
  - mcp__filesystem__create_directory
  - mcp__playwright__browser_snapshot
  - mcp__github__create_pull_request
  - mcp__context7__get-library-docs
```

### 10. ux-performance-optimizer

```yaml
tools:
  - Read # 프론트엔드 코드 읽기
  - Edit # 성능 최적화 코드 수정
  - WebSearch # 최신 웹 성능 기법 검색
  - mcp__filesystem__read_file
  - mcp__playwright__browser_take_screenshot
  - mcp__playwright__browser_network_requests
  - mcp__tavily-mcp__tavily-search
  - mcp__context7__get-library-docs
```

## 🔒 보안 고려사항

### 읽기 전용 에이전트

- code-review-specialist: 코드 수정 불가
- gemini-cli-collaborator: 파일 수정 제한

### 제한적 쓰기 권한

- doc-structure-guardian: 문서 파일만
- issue-summary: 보고서 파일만

### 전체 권한 필요

- agent-evolution-manager: 에이전트 관리
- database-administrator: DB 작업
- mcp-server-admin: 시스템 설정

## 📝 구현 예시

```yaml
---
name: code-review-specialist
description: |
  보안 및 성능 전문가...
tools:
  - Read
  - Grep
  - Task
  - mcp__filesystem__read_file
  - mcp__github__get_pull_request
  - mcp__serena__find_symbol
recommended_mcp:
  primary:
    - filesystem
    - github
    - serena
---
```

## ✅ 적용 원칙

1. **최소 권한 원칙**: 필요한 도구만 부여
2. **역할 기반 접근**: 에이전트 목적에 맞는 도구
3. **MCP 통합**: 관련 MCP 도구 포함
4. **보안 우선**: 파괴적 작업은 신중히 부여
