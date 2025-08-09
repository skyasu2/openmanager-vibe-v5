# 서브에이전트 & 훅 시스템 개선 계획

## 🎯 핵심 개선 목표

1. **커버리지 향상**: 모든 서브에이전트가 적절한 훅과 연동
2. **중복 제거**: 유사한 기능의 훅 통합
3. **자동화 강화**: 권장사항을 자동 실행으로 전환
4. **성능 최적화**: 훅 실행 시간 단축

## 📋 즉시 적용 가능한 개선사항

### 1. 누락된 훅 추가

#### post-test-hook.sh (새로 생성)

```bash
#!/bin/bash
# PostToolUse Hook: 테스트 실행 후 자동 분석
# 트리거: npm test, npm run test:*, vitest, jest

set -euo pipefail

TEST_COMMAND="$1"
TEST_RESULTS="$2"

# 테스트 실패 시 test-automation-specialist 자동 호출
if [[ "$TEST_RESULTS" =~ (FAIL|Error|failed) ]]; then
    echo "테스트 실패 감지 - test-automation-specialist 호출"
    # Task 도구로 서브에이전트 호출 권장
fi

# 커버리지가 80% 미만이면 경고
if [[ "$TEST_RESULTS" =~ "Coverage: ([0-9]+)" ]]; then
    COVERAGE="${BASH_REMATCH[1]}"
    if [ "$COVERAGE" -lt 80 ]; then
        echo "⚠️ 테스트 커버리지 ${COVERAGE}% - 목표 80% 미달"
    fi
fi
```

#### post-doc-hook.sh (새로 생성)

```bash
#!/bin/bash
# PostToolUse Hook: 문서 작성/수정 후 구조 검증
# 트리거: *.md 파일 Write/Edit

set -euo pipefail

FILE_PATH="$1"

# 루트 디렉토리 .md 파일이 6개 초과 시 documentation-manager 호출
ROOT_MD_COUNT=$(find . -maxdepth 1 -name "*.md" | wc -l)
if [ "$ROOT_MD_COUNT" -gt 6 ]; then
    echo "📚 루트에 ${ROOT_MD_COUNT}개 .md 파일 - documentation-manager 권장"
fi

# 새 문서 생성 시 documentation-manager로 내용 보강 제안
if [[ ! -s "$FILE_PATH" ]]; then
    echo "📝 새 문서 생성 - documentation-manager로 내용 보강 가능"
fi
```

#### pre-performance-check.sh (새로 생성)

```bash
#!/bin/bash
# PreToolUse Hook: 빌드/배포 전 성능 체크
# 트리거: npm run build, vercel deploy

set -euo pipefail

# 번들 크기 체크
BUNDLE_SIZE=$(du -sh dist/ 2>/dev/null | cut -f1 || echo "0")
echo "📦 번들 크기: $BUNDLE_SIZE"

# 빌드 시간이 60초 초과 시 ux-performance-optimizer 권장
BUILD_START=$(date +%s)
# ... 빌드 실행 ...
BUILD_END=$(date +%s)
BUILD_TIME=$((BUILD_END - BUILD_START))

if [ "$BUILD_TIME" -gt 60 ]; then
    echo "⏱️ 빌드 시간 ${BUILD_TIME}초 - ux-performance-optimizer 권장"
fi
```

### 2. 기존 훅 개선

#### 보안 훅 통합

```bash
# post-security-hook.sh (통합 버전)
#!/bin/bash
# 기존 post-security-edit.sh와 post-security-write.sh를 통합

set -euo pipefail

FILE_PATH="$1"
OPERATION="$2"  # "edit" or "write"

# 보안 관련 파일 패턴
if [[ "$FILE_PATH" =~ (auth|security|payment|admin|api/.*/(route|handler)) ]]; then
    # security-auditor 자동 호출 (권장이 아닌 자동으로 변경)
    echo "🔒 보안 중요 파일 ${OPERATION} - security-auditor 자동 실행"

    # Exit code 2로 서브에이전트 위임 표시
    exit 2
fi
```

#### agent-completion-hook.sh 간소화

```bash
# 중복 코드를 함수로 추출
create_issue_report() {
    local agent_name="$1"
    local status="$2"
    local priority="$3"

    # 공통 이슈 리포트 생성 로직
    ...
}

# 에이전트별 처리를 배열로 관리
declare -A AGENT_PRIORITIES=(
    ["code-review-specialist"]="high"
    ["database-administrator"]="high"
    ["central-supervisor"]="high"
    ["security-auditor"]="high"
    ["test-automation-specialist"]="medium"
    ["ux-performance-optimizer"]="medium"
    ["ai-systems-engineer"]="medium"
    ["debugger-specialist"]="medium"
    ["documentation-manager"]="medium"
    ["gemini-cli-collaborator"]="low"
    ["mcp-server-admin"]="low"
    ["issue-summary"]="low"
)
```

### 3. 훅 체이닝 구현

#### hooks/shared-functions.sh (공통 함수)

```bash
#!/bin/bash
# 모든 훅에서 사용하는 공통 함수

# 다음 훅 트리거
trigger_next_hook() {
    local next_hook="$1"
    shift
    if [ -x "hooks/$next_hook" ]; then
        "hooks/$next_hook" "$@"
    fi
}

# 서브에이전트 호출 권장
suggest_subagent() {
    local agent="$1"
    local reason="$2"
    echo "💡 권장: $agent - $reason"
}

# 자동 서브에이전트 위임
delegate_to_subagent() {
    local agent="$1"
    echo "🤖 자동 위임: $agent"
    exit 2  # 특별한 exit code로 위임 표시
}
```

### 4. 훅 설정 업데이트

#### .claude/settings.local.json 개선

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "filter": "\\.(ts|tsx|js|jsx)$",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/post-code-hook.sh"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "filter": "\\.(md)$",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/post-doc-hook.sh"
          }
        ]
      },
      {
        "matcher": "Bash",
        "filter": "npm (run )?test",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/post-test-hook.sh"
          }
        ]
      },
      {
        "matcher": "Write|Edit",
        "filter": "(auth|security|payment|admin)",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/post-security-hook.sh",
            "blocking": true
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "filter": "(build|deploy|vercel)",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/pre-performance-check.sh"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/agent-completion-hook.sh",
            "args": ["${agent_name}", "${status}", "${result}"]
          }
        ]
      }
    ]
  }
}
```

## 🚀 단계별 구현 계획

### Phase 1: 즉시 적용 (1일)

1. ✅ 누락된 훅 파일 생성
2. ✅ 보안 훅 통합
3. ✅ shared-functions.sh 생성
4. ✅ settings.local.json 업데이트

### Phase 2: 테스트 및 검증 (2일)

1. 각 훅의 개별 테스트
2. 체이닝 시나리오 테스트
3. 서브에이전트 자동 호출 검증
4. 성능 측정 및 최적화

### Phase 3: 고도화 (3일)

1. 훅 실행 메트릭 수집
2. 머신러닝 기반 자동 트리거
3. 훅 간 데이터 공유 메커니즘
4. 실시간 모니터링 대시보드

## 📊 예상 효과

1. **커버리지**: 5개 → 13개 서브에이전트 훅 연동 (160% 증가)
2. **자동화**: 권장사항의 70%를 자동 실행으로 전환
3. **효율성**: 중복 제거로 훅 코드 30% 감소
4. **성능**: 체이닝 최적화로 실행 시간 20% 단축

## ⚠️ 주의사항

1. **하위 호환성**: 기존 훅 동작 유지하며 점진적 개선
2. **성능 영향**: 훅 실행이 메인 작업을 방해하지 않도록 주의
3. **순환 참조**: 훅 체이닝 시 무한 루프 방지
4. **에러 처리**: 훅 실패가 전체 작업을 중단시키지 않도록 설계
