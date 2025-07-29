# 훅 기능과 서브에이전트 연동 분석

## 📊 현재 연동 현황

### 1. 훅별 서브에이전트 호출 매핑

| 훅 파일 | 트리거 이벤트 | 호출되는 서브에이전트 | 용도 |
|---------|-------------|-------------------|-----|
| **post-edit-hook.sh** | PostToolUse (Edit) | code-review-specialist | 파일 수정 후 자동 코드 리뷰 |
| **post-write-hook.sh** | PostToolUse (Write) | code-review-specialist | 새 파일 작성 후 코드 리뷰 |
| **post-multi-edit-hook.sh** | PostToolUse (MultiEdit) | code-review-specialist | 다중 파일 수정 후 리뷰 |
| **post-security-edit-hook.sh** | PostToolUse (Edit) | security-auditor (권장) | 보안 관련 파일 수정 검사 |
| **post-security-write-hook.sh** | PostToolUse (Write) | security-auditor (권장) | 보안 관련 파일 작성 검사 |
| **pre-database-hook.sh** | PreToolUse (mcp__supabase__*) | database-administrator | DB 작업 전 검증 및 위임 |
| **pre-schema-change-hook.sh** | PreToolUse (Edit) | database-administrator | 스키마 변경 전 검증 |
| **post-commit-hook.sh** | PostToolUse (Bash) | issue-summary (간접) | 커밋 요약 이슈 생성 |
| **agent-completion-hook.sh** | SubagentStop | 모든 에이전트 | 에이전트 완료 시 결과 처리 |

### 2. 서브에이전트별 훅 활용도

| 서브에이전트 | 직접 호출 훅 | 간접 참조 훅 | 활용도 |
|-------------|------------|------------|-------|
| code-review-specialist | 3개 | 0개 | 높음 |
| database-administrator | 2개 | 0개 | 높음 |
| security-auditor | 0개 (권장) | 2개 | 중간 |
| issue-summary | 0개 | 3개 | 중간 |
| test-automation-specialist | 0개 | 1개 | 낮음 |
| ux-performance-optimizer | 0개 | 1개 | 낮음 |
| ai-systems-engineer | 0개 | 1개 | 낮음 |
| central-supervisor | 0개 | 1개 | 낮음 |
| **나머지 5개 에이전트** | 0개 | 0개 | 없음 |

### 3. 훅 작동 방식 분석

#### 자동 호출 패턴
1. **코드 리뷰**: Edit/Write 작업 시 자동으로 code-review-specialist 트리거
2. **DB 보호**: Supabase 작업 시 database-administrator로 자동 위임
3. **보안 검사**: 보안 파일 편집 시 security-auditor 권장 (자동 호출 아님)
4. **완료 추적**: 모든 에이전트 완료 시 자동으로 이슈 생성

#### Exit Code 활용
- `0`: 성공
- `1`: 차단/실패
- `2`: 에이전트 위임 (pre-database-hook.sh에서 사용)

## 🔍 문제점 및 개선 필요사항

### 1. 훅 연동이 없는 서브에이전트 (5개)
- debugger-specialist
- doc-structure-guardian
- doc-writer-researcher
- gemini-cli-collaborator
- mcp-server-admin

### 2. 중복 및 비효율성
- post-security-edit.sh와 post-security-write.sh가 거의 동일
- security-auditor를 권장만 하고 자동 호출하지 않음
- post-commit-hook.sh가 너무 복잡 (300줄 이상)

### 3. 누락된 훅 기능
- 테스트 실행 후 test-automation-specialist 자동 호출 없음
- 성능 문제 감지 시 ux-performance-optimizer 자동 호출 없음
- 문서 생성/수정 시 doc-writer-researcher 자동 호출 없음

## 🚀 개선 제안

### 1. 추가 필요한 훅

```json
{
  "PostToolUse": [
    {
      "matcher": "Bash(npm test|npm run test)",
      "hooks": [{
        "type": "command",
        "command": "./hooks/post-test-hook.sh"
      }]
    },
    {
      "matcher": "Write|Edit",
      "filter": "*.md",
      "hooks": [{
        "type": "command",
        "command": "./hooks/post-doc-hook.sh"
      }]
    }
  ],
  "PreToolUse": [
    {
      "matcher": "Bash(npm run build|vercel)",
      "hooks": [{
        "type": "command",
        "command": "./hooks/pre-deploy-hook.sh"
      }]
    }
  ]
}
```

### 2. 훅 통합 및 단순화
- post-security-*.sh 파일들을 하나로 통합
- 공통 로직을 shared-functions.sh로 추출
- Exit code를 표준화하여 일관성 확보

### 3. 서브에이전트 자동 호출 강화
- security-auditor를 권장이 아닌 자동 호출로 변경
- 테스트 실패 시 test-automation-specialist 자동 호출
- 빌드 시간이 길어지면 ux-performance-optimizer 자동 호출

### 4. 훅 체이닝 구현
```bash
# 예: 코드 수정 → 보안 검사 → 테스트 → 성능 검사
post-edit-hook.sh → security-check → test-run → performance-check
```