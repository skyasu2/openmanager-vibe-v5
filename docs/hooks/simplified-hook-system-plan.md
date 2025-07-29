# 🎯 훅 & 서브에이전트 시스템 간소화 계획

## 현재 문제점
- 훅이 너무 많고 자주 트리거됨 (11개 훅)
- 서브에이전트 자동 호출이 과도함
- 시스템이 복잡해 유지보수 어려움
- 개발 흐름을 방해하는 불필요한 개입

## 🚀 간소화 전략

### 1. 핵심 훅만 유지 (11개 → 3개)

#### ✅ 유지할 필수 훅

| 훅 이름 | 목적 | 트리거 조건 |
|--------|------|------------|
| **pre-database-hook.sh** | DB 보호 | DROP, TRUNCATE, DELETE 명령만 |
| **post-security-hook.sh** | 보안 검사 | auth/payment 파일만 (권장만) |
| **agent-completion-hook.sh** | 결과 추적 | 모든 서브에이전트 완료 시 |

#### ❌ 제거할 훅

- post-edit-hook.sh, post-write-hook.sh, post-multi-edit-hook.sh
- post-test-hook.sh
- post-doc-hook.sh
- pre-performance-check.sh
- pre-schema-change-hook.sh
- post-commit-hook.sh

### 2. 서브에이전트 사용 원칙 변경

#### Before: 자동 트리거 (너무 빈번)
```bash
# ❌ 모든 코드 수정 시 자동 실행
if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
    delegate_to_subagent "code-review-specialist" "코드 리뷰"
fi
```

#### After: 명시적 호출 권장
```bash
# ✅ 위험한 작업만 경고, 나머지는 권장
if [[ "$DANGEROUS_OPERATION" = true ]]; then
    echo "⚠️ 위험한 작업 감지. 다음 명령으로 검토하세요:"
    echo "Task(subagent_type='database-administrator', ...)"
    exit 1  # 차단
else
    echo "💡 권장: code-review-specialist를 사용하여 검토 가능"
    # 차단하지 않고 계속 진행
fi
```

### 3. 간소화된 훅 구현

#### pre-database-hook.sh (최소화)
```bash
#!/bin/bash
# 정말 위험한 DB 작업만 차단

OPERATION="$1"
QUERY="$2"

# 치명적 작업만 차단
if [[ "$QUERY" =~ (DROP TABLE|DROP DATABASE|TRUNCATE) ]]; then
    echo "🚨 위험한 DB 작업 차단됨"
    echo "database-administrator 에이전트 사용을 권장합니다"
    exit 1
fi

# 나머지는 경고만
if [[ "$QUERY" =~ (DELETE|UPDATE.*WHERE) ]]; then
    echo "⚠️ 주의: 데이터 변경 작업입니다"
fi

exit 0
```

#### post-security-hook.sh (권장만)
```bash
#!/bin/bash
# 보안 파일 수정 시 권장사항만 제시

FILE_PATH="$1"

if [[ "$FILE_PATH" =~ (auth|payment|admin) ]]; then
    echo "🔐 보안 관련 파일 수정 감지"
    echo "💡 security-auditor 사용을 권장합니다"
    # 차단하지 않음
fi

exit 0
```

### 4. 설정 파일 단순화

#### .claude/settings.local.json
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "mcp__supabase__.*",
        "hooks": [{
          "type": "command",
          "command": "./hooks/pre-database-hook.sh"
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "filter": "(auth|payment|admin)",
        "hooks": [{
          "type": "command",
          "command": "./hooks/post-security-hook.sh"
        }]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "*",
        "hooks": [{
          "type": "command",
          "command": "./hooks/agent-completion-hook.sh"
        }]
      }
    ]
  }
}
```

### 5. 서브에이전트 트리거 완화

#### 변경 전
- **Use PROACTIVELY when**: 자동으로 많은 상황에서 트리거

#### 변경 후
- **Use ON REQUEST when**: 사용자가 명시적으로 요청하거나 정말 필요한 경우만

### 6. 중복 에이전트 통합

| 통합 전 | 통합 후 | 역할 |
|---------|---------|------|
| debugger-specialist + code-review-specialist | **code-specialist** | 코드 분석 통합 |
| doc-structure-guardian + doc-writer-researcher | **doc-specialist** | 문서 관리 통합 |
| issue-summary + 일부 central-supervisor | **monitor-specialist** | 모니터링 통합 |

**결과**: 13개 → 8개 서브에이전트

## 📊 예상 효과

| 지표 | 현재 | 개선 후 | 개선율 |
|-----|------|---------|--------|
| 훅 파일 수 | 11개 | 3개 | 73% 감소 |
| 자동 트리거 빈도 | 매우 높음 | 낮음 | 80% 감소 |
| 서브에이전트 수 | 13개 | 8개 | 38% 감소 |
| 시스템 복잡도 | 높음 | 낮음 | 크게 개선 |

## 🔧 실행 계획

### Phase 1: 즉시 (오늘)
1. [ ] 불필요한 훅 백업 후 비활성화
2. [ ] 핵심 3개 훅만 유지
3. [ ] 자동 트리거를 권장으로 변경

### Phase 2: 이번 주
1. [ ] 중복 서브에이전트 통합
2. [ ] 트리거 조건 "ON REQUEST" 위주로 변경
3. [ ] 설정 파일 간소화

### Phase 3: 검증
1. [ ] 개발 흐름 방해 없는지 확인
2. [ ] 정말 필요한 보호 기능만 작동하는지 검증
3. [ ] 사용자 피드백 수집

## 💡 핵심 원칙

1. **최소 개입**: 정말 위험한 작업만 차단
2. **권장 위주**: 자동 실행보다 권장 메시지
3. **명시적 호출**: 사용자가 필요할 때만 서브에이전트 사용
4. **단순함**: 복잡한 로직 제거, 핵심만 유지

---

**목표**: 개발 흐름을 방해하지 않으면서 필수 보호 기능만 제공하는 균형잡힌 시스템