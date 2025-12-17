---
id: improvement-workplan-2025-12-18
title: "OpenManager Vibe v5.83.1 개선 작업 계획서"
keywords: ["workplan", "improvement", "bugfix", "migration", "tasks"]
priority: high
ai_optimized: true
sdd_phase: "3-tasks"
related_docs: ["./analysis/inspection-report-2025-12-18.md"]
created: "2025-12-18"
updated: "2025-12-18"
---

# 🎯 OpenManager Vibe v5.83.1 개선 작업 계획서

> **목적**: 2025-12-18 전체 점검에서 발견된 이슈 해결 및 시스템 안정화

## 📋 작업 개요

```yaml
workplan_summary:
  source: "inspection-report-2025-12-18.md"
  total_issues: 3
  priority_breakdown:
    critical: 1  # P0
    medium: 1    # P1
    low: 1       # P2
  estimated_total_effort: "3-5 hours"
```

---

## 🏗️ 작업 단계 (Phases)

### Phase 1: Critical 이슈 해결 (P0)

```yaml
phase_1_critical:
  priority: "Critical (P0)"
  dependencies: "None"
  blocking: true  # 다른 작업 전 필수 완료

  tasks:
    - id: "FIX-001"
      title: "incident_reports 테이블 생성"
      description: "Supabase에 incident_reports 테이블 마이그레이션 배포"
      severity: "Critical"

      root_cause: "마이그레이션 파일이 src/database/migrations/에만 존재, supabase/migrations/에 미배포"

      steps:
        - step: 1
          action: "마이그레이션 파일 검토"
          file: "src/database/migrations/003_create_incident_reports_table.sql"

        - step: 2
          action: "Supabase MCP로 마이그레이션 적용"
          command: "mcp__supabase__apply_migration"
          params:
            name: "create_incident_reports_table"

        - step: 3
          action: "테이블 생성 확인"
          command: "mcp__supabase__list_tables"
          expected: "incident_reports 테이블 존재"

        - step: 4
          action: "API 엔드포인트 재테스트"
          endpoint: "GET /api/ai/incident-report"
          expected: "HTTP 200 또는 빈 배열 반환"

      acceptance_criteria:
        - "incident_reports 테이블이 Supabase에 존재"
        - "RLS 정책이 올바르게 적용됨"
        - "GET /api/ai/incident-report API가 200 반환"
        - "POST /api/ai/incident-report로 보고서 생성 가능"

      rollback_plan:
        action: "DROP TABLE incident_reports CASCADE"
        trigger: "테이블 스키마 오류 또는 RLS 정책 충돌"
```

### Phase 2: UI 버그 수정 (P1)

```yaml
phase_2_ui_fixes:
  priority: "Medium (P1)"
  dependencies: ["phase_1_critical"]
  blocking: false

  tasks:
    - id: "FIX-002"
      title: "서버 모달 헤더 표시 버그 수정"
      description: "서버 상세 모달 헤더에 'APP-01 0%' 형태로 잘못 표시되는 문제 해결"
      severity: "Medium"

      investigation_needed:
        - "서버 모달 컴포넌트 위치 파악"
        - "헤더 렌더링 로직 분석"
        - "props 전달 경로 추적"

      probable_locations:
        - "src/components/dashboard/ServerDetailModal.tsx"
        - "src/components/servers/ServerModal.tsx"
        - "src/modules/dashboard/components/*.tsx"

      steps:
        - step: 1
          action: "모달 컴포넌트 파일 탐색"
          command: "Glob 또는 Grep으로 ServerModal, ServerDetail 검색"

        - step: 2
          action: "헤더 렌더링 코드 분석"
          target: "title 또는 header props 사용 부분"

        - step: 3
          action: "버그 원인 파악 및 수정"
          expected_fix: "서버명만 표시, CPU는 별도 영역에 표시"

        - step: 4
          action: "수정 후 UI 테스트"
          method: "Playwright snapshot 또는 수동 확인"

      acceptance_criteria:
        - "모달 헤더에 서버명만 표시 (예: 'APP-01')"
        - "CPU 사용률은 적절한 위치에 별도 표시"
        - "다른 UI 요소에 영향 없음"
```

### Phase 3: 미완성 기능 정리 (P2)

```yaml
phase_3_cleanup:
  priority: "Low (P2)"
  dependencies: ["phase_2_ui_fixes"]
  blocking: false

  tasks:
    - id: "FIX-003"
      title: "AI 상태관리 패널 처리"
      description: "미구현 'AI 상태관리' 탭에 대한 적절한 처리"
      severity: "Low"

      options:
        option_a:
          name: "탭 비활성화/숨김"
          effort: "Low"
          description: "구현 예정 표시 또는 탭 제거"

        option_b:
          name: "기본 상태 표시 구현"
          effort: "Medium"
          description: "AI 엔진 health 상태, 마지막 응답 시간 등 표시"

      recommended: "option_a"
      reason: "MVP 범위 외, 추후 백로그로 관리"

      steps:
        - step: 1
          action: "AI 사이드바 탭 구성 파일 확인"
          file: "src/stores/useAISidebarStore.ts 또는 관련 컴포넌트"

        - step: 2
          action: "탭 비활성화 또는 Coming Soon 표시 추가"

        - step: 3
          action: "백로그에 기능 구현 태스크 등록"
          location: "docs/planning/TODO.md"

      acceptance_criteria:
        - "사용자에게 혼란 주지 않는 UI 상태"
        - "에러 없이 탭 클릭 처리"
```

---

## 📝 세부 작업 목록

### 🗄️ Database 작업

```yaml
database_tasks:
  migrations:
    - task: "incident_reports 테이블 생성"
      id: "FIX-001"
      source_file: "src/database/migrations/003_create_incident_reports_table.sql"
      target: "Supabase Production"
      method: "MCP apply_migration"

      schema_overview:
        table: "incident_reports"
        columns:
          - "id: UUID PRIMARY KEY"
          - "title: TEXT NOT NULL"
          - "severity: VARCHAR(20) CHECK IN ('critical','high','medium','low')"
          - "pattern: VARCHAR(50)"
          - "affected_servers: TEXT[]"
          - "anomalies: JSONB"
          - "root_cause_analysis: JSONB"
          - "recommendations: JSONB"
          - "timeline: JSONB"
          - "created_at: TIMESTAMPTZ"
          - "updated_at: TIMESTAMPTZ"

        rls_policies:
          - "Enable RLS"
          - "SELECT: authenticated users"
          - "INSERT: authenticated users"
          - "UPDATE: authenticated users (own reports)"

  verification:
    - task: "테이블 존재 확인"
      command: "mcp__supabase__list_tables"

    - task: "테이블 구조 확인"
      command: "mcp__supabase__execute_sql"
      query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'incident_reports'"
```

### 🎨 Frontend 작업

```yaml
frontend_tasks:
  bug_fixes:
    - task: "서버 모달 헤더 수정"
      id: "FIX-002"
      investigation:
        - "ServerDetailModal 또는 유사 컴포넌트 탐색"
        - "title/header props 렌더링 로직 분석"

  ui_cleanup:
    - task: "AI 상태관리 탭 처리"
      id: "FIX-003"
      files:
        - "src/stores/useAISidebarStore.ts"
        - "src/components/ai-sidebar/*.tsx"
      action: "탭 비활성화 또는 Coming Soon 표시"
```

### ⚙️ Backend 작업

```yaml
backend_tasks:
  api_verification:
    - task: "incident-report API 재테스트"
      after: "FIX-001 완료 후"
      endpoints:
        - method: "GET"
          path: "/api/ai/incident-report"
          expected: "200 OK with empty array or reports"
        - method: "POST"
          path: "/api/ai/incident-report"
          expected: "201 Created with report data"
```

---

## 🧪 테스트 계획

### 검증 체크리스트

```yaml
testing_tasks:
  unit_tests:
    - scope: "incident_reports 관련 타입/유틸"
      status: "Optional (기존 코드에 따름)"

  integration_tests:
    - scope: "incident-report API 엔드포인트"
      method: "curl 또는 Playwright API 테스트"
      cases:
        - "빈 테이블에서 GET 요청 -> 200 + []"
        - "POST로 보고서 생성 -> 201 + report object"
        - "생성 후 GET -> 200 + [report]"

  e2e_tests:
    - scope: "AI 사이드바 자동장애 보고서 패널"
      tool: "Playwright MCP"
      scenarios:
        - "패널 클릭 -> 에러 없이 로딩"
        - "보고서 생성 테스트 (가능한 경우)"
```

### 회귀 테스트

```yaml
regression_tests:
  after_fix_001:
    - "기존 AI Chat 기능 정상 작동 확인"
    - "이상감지/예측 패널 정상 작동 확인"
    - "다른 Supabase 테이블 영향 없음 확인"

  after_fix_002:
    - "서버 목록 정상 표시"
    - "서버 카드 클릭 -> 모달 정상 표시"
    - "모달 내 다른 정보 정상 표시"
```

---

## 📊 진행률 추적

### 마일스톤

```yaml
milestones:
  - name: "Critical 이슈 해결"
    target: "FIX-001 완료"
    criteria:
      - "incident_reports 테이블 생성됨"
      - "API 200 반환 확인"

  - name: "UI 버그 수정"
    target: "FIX-002 완료"
    criteria:
      - "모달 헤더 정상 표시"

  - name: "전체 개선 완료"
    target: "FIX-001 ~ FIX-003 완료"
    criteria:
      - "모든 acceptance criteria 충족"
      - "회귀 테스트 통과"
```

### 작업 상태 추적

```yaml
task_status:
  FIX-001:
    status: "Completed"
    assignee: "Claude Code (Opus 4.5)"
    priority: "P0"
    completed_date: "2025-12-18"

  FIX-002:
    status: "Completed"
    assignee: "Claude Code (Opus 4.5)"
    priority: "P1"
    completed_date: "2025-12-18"

  FIX-003:
    status: "Completed"
    assignee: "Claude Code (Opus 4.5)"
    priority: "P2"
    completed_date: "2025-12-18"
```

---

## 🔄 리스크 관리

### 위험 요소 및 대응책

```yaml
risks:
  technical:
    - risk: "마이그레이션 적용 시 기존 데이터 영향"
      probability: "Low"
      impact: "Low"
      mitigation: "신규 테이블 생성이므로 기존 데이터 영향 없음"

    - risk: "RLS 정책 충돌"
      probability: "Medium"
      impact: "Medium"
      mitigation: "정책 적용 전 테스트 환경 확인, 롤백 SQL 준비"

  schedule:
    - risk: "UI 버그 원인 파악 지연"
      probability: "Medium"
      impact: "Low"
      mitigation: "컴포넌트 탐색 도구 활용, 패턴 기반 검색"
```

---

## 🔧 도구 및 자원

### 사용 도구

```yaml
development_tools:
  mcp_servers:
    - "Supabase MCP: 마이그레이션 적용, 테이블 조회"
    - "Playwright MCP: E2E 테스트"
    - "Serena MCP: 코드베이스 탐색"

  cli_tools:
    - "Claude Code: 코드 분석 및 수정"
    - "curl: API 테스트"
    - "Git: 버전 관리"

  verification:
    - "Vercel Dashboard: 배포 상태 확인"
    - "Supabase Dashboard: 테이블 직접 확인 (백업)"
```

---

## ✅ 완료 기준 (Definition of Done)

### 각 작업별 완료 기준

```yaml
completion_criteria:
  FIX-001:
    - "[x] incident_reports 테이블 Supabase에 존재"
    - "[x] RLS 정책 정상 작동"
    - "[x] GET /api/ai/incident-report -> 200"
    - "[x] POST /api/ai/incident-report -> 201"
    - "[x] UI에서 자동장애 보고서 패널 에러 없음"

  FIX-002:
    - "[x] 모달 헤더에 서버명만 표시"
    - "[x] CPU 사용률 별도 영역에 표시 (해당 배지 제거됨)"
    - "[x] 회귀 테스트 통과"

  FIX-003:
    - "[x] AI 상태관리 탭 적절히 처리 (Coming Soon 표시)"
    - "[x] 사용자 혼란 없는 UI 상태"
```

### 전체 완료 기준

```yaml
overall_done:
  - "[x] 모든 Critical 이슈 해결"
  - "[x] 모든 Medium 이슈 해결"
  - "[x] 회귀 테스트 전체 통과"
  - "[x] 문서 업데이트 완료"
```

---

## 🔄 다음 단계

```yaml
next_steps:
  immediate:
    - action: "FIX-001 실행 (incident_reports 테이블 생성)"
      method: "Supabase MCP apply_migration"

  after_fixes:
    - action: "점검 리포트 업데이트"
      file: "docs/planning/analysis/inspection-report-2025-12-18.md"
      update: "이슈 상태를 'Resolved'로 변경"

    - action: "버전 릴리즈 고려"
      version: "5.83.2 (버그 수정)"
      changelog: "incident_reports 테이블 추가, UI 버그 수정"
```

---

**작성일**: 2025-12-18
**작성자**: Claude Code (Opus 4.5)
**관련 문서**: `inspection-report-2025-12-18.md`
