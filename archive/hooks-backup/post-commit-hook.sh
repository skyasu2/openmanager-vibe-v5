#!/bin/bash

# PostToolUse Hook: Git Commit 후 자동 이슈 요약 등록
# 파일: hooks/post-commit-hook.sh

set -euo pipefail

# 로그 설정
HOOK_LOG=".claude/audit/hook.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
FORMATTED_DATE=$(date '+%Y-%m-%d-%H-%M')

# 로그 함수
log() {
    echo "[$TIMESTAMP] POST-COMMIT: $1" | tee -a "$HOOK_LOG"
}

log "Git Commit 감지 - 자동 이슈 요약 등록 시작"

# Git 정보 수집
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    log "ERROR: Git 저장소가 아닙니다."
    exit 1
fi

COMMIT_HASH=$(git rev-parse HEAD)
COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
COMMIT_AUTHOR=$(git log -1 --pretty=format:"%an")
COMMIT_DATE=$(git log -1 --pretty=format:"%ci")

# 변경된 파일 정보 수집
CHANGED_FILES=$(git diff-tree --no-commit-id --name-only -r HEAD)
CHANGED_COUNT=$(echo "$CHANGED_FILES" | wc -l)
ADDED_LINES=$(git diff --numstat HEAD~1 HEAD | awk '{added += $1} END {print added+0}')
DELETED_LINES=$(git diff --numstat HEAD~1 HEAD | awk '{deleted += $2} END {print deleted+0}')

log "커밋 정보: $COMMIT_HASH (파일 $CHANGED_COUNT 개)"

# 커밋 유형 분석
COMMIT_TYPE="general"
PRIORITY="medium"
ISSUE_CATEGORY="development"

# 커밋 메시지 패턴 분석
if [[ "$COMMIT_MESSAGE" =~ ^(feat|feature) ]]; then
    COMMIT_TYPE="feature"
    PRIORITY="medium"
    ISSUE_CATEGORY="feature"
elif [[ "$COMMIT_MESSAGE" =~ ^(fix|hotfix) ]]; then
    COMMIT_TYPE="bugfix"
    PRIORITY="high"
    ISSUE_CATEGORY="bugfix"
elif [[ "$COMMIT_MESSAGE" =~ ^(security|sec) ]]; then
    COMMIT_TYPE="security"
    PRIORITY="critical"
    ISSUE_CATEGORY="security"
elif [[ "$COMMIT_MESSAGE" =~ ^(perf|performance) ]]; then
    COMMIT_TYPE="performance"
    PRIORITY="medium"
    ISSUE_CATEGORY="optimization"
elif [[ "$COMMIT_MESSAGE" =~ ^(refactor|refact) ]]; then
    COMMIT_TYPE="refactor"
    PRIORITY="low"
    ISSUE_CATEGORY="maintenance"
elif [[ "$COMMIT_MESSAGE" =~ ^(docs|doc) ]]; then
    COMMIT_TYPE="documentation"
    PRIORITY="low"
    ISSUE_CATEGORY="documentation"
elif [[ "$COMMIT_MESSAGE" =~ ^(test|spec) ]]; then
    COMMIT_TYPE="test"
    PRIORITY="medium"
    ISSUE_CATEGORY="testing"
fi

# 변경 규모 분석
SCALE="small"
if [ "$CHANGED_COUNT" -ge 10 ]; then
    SCALE="large"
    PRIORITY="high"
elif [ "$CHANGED_COUNT" -ge 5 ]; then
    SCALE="medium"
fi

# 중요 파일 변경 감지
CRITICAL_CHANGES=false
CRITICAL_FILES=()

while IFS= read -r file; do
    if [[ "$file" =~ (auth|security|payment|admin|api/.*route|database|schema) ]]; then
        CRITICAL_FILES+=("$file")
        CRITICAL_CHANGES=true
        PRIORITY="high"
    elif [[ "$file" =~ (package\.json|tsconfig\.json|\.env|config) ]]; then
        CRITICAL_FILES+=("$file")
        CRITICAL_CHANGES=true
    fi
done <<< "$CHANGED_FILES"

if [ "$CRITICAL_CHANGES" = true ]; then
    log "중요 파일 변경 감지: ${#CRITICAL_FILES[@]} 개"
fi

# issue-summary를 위한 이슈 파일 생성
ISSUE_FILE=".claude/issues/commit-summary-${COMMIT_HASH:0:7}-${FORMATTED_DATE}.md"
mkdir -p "$(dirname "$ISSUE_FILE")"

# 이슈 리포트 생성
cat > "$ISSUE_FILE" << EOF
# 📦 커밋 요약 보고서

**커밋 해시**: \`$COMMIT_HASH\`  
**시간**: $COMMIT_DATE  
**작성자**: $COMMIT_AUTHOR  
**유형**: $COMMIT_TYPE  
**우선순위**: $PRIORITY  
**규모**: $SCALE  

## 커밋 메시지

\`\`\`
$COMMIT_MESSAGE
\`\`\`

## 변경 통계

- **변경된 파일**: $CHANGED_COUNT 개
- **추가된 라인**: $ADDED_LINES 줄
- **삭제된 라인**: $DELETED_LINES 줄
- **순 변경**: $((ADDED_LINES - DELETED_LINES)) 줄

EOF

# 중요 파일 변경사항 추가
if [ "$CRITICAL_CHANGES" = true ]; then
    echo "## 🔴 중요 파일 변경" >> "$ISSUE_FILE"
    echo "" >> "$ISSUE_FILE"
    for file in "${CRITICAL_FILES[@]}"; do
        echo "- \`$file\`" >> "$ISSUE_FILE"
    done
    echo "" >> "$ISSUE_FILE"
fi

# 변경된 파일 목록 추가
echo "## 변경된 파일" >> "$ISSUE_FILE"
echo "" >> "$ISSUE_FILE"
echo "\`\`\`" >> "$ISSUE_FILE"
echo "$CHANGED_FILES" >> "$ISSUE_FILE"
echo "\`\`\`" >> "$ISSUE_FILE"
echo "" >> "$ISSUE_FILE"

# 커밋 타입별 권장사항 추가
echo "## 권장 조치" >> "$ISSUE_FILE"
echo "" >> "$ISSUE_FILE"

case "$COMMIT_TYPE" in
    "feature")
        echo "- 새 기능 테스트 실행 필요" >> "$ISSUE_FILE"
        echo "- 문서 업데이트 고려" >> "$ISSUE_FILE"
        echo "- 무료 티어 리소스 사용량 모니터링" >> "$ISSUE_FILE"
        ;;
    "bugfix")
        echo "- 관련 테스트 케이스 추가 권장" >> "$ISSUE_FILE"
        echo "- 유사 버그 패턴 검토" >> "$ISSUE_FILE"
        echo "- 프로덕션 배포 전 충분한 테스트" >> "$ISSUE_FILE"
        ;;
    "security")
        echo "- 🔒 보안 테스트 필수 실행" >> "$ISSUE_FILE"
        echo "- 코드 리뷰 필수" >> "$ISSUE_FILE"
        echo "- 보안 스캔 도구 실행" >> "$ISSUE_FILE"
        echo "- 의존성 취약점 검사" >> "$ISSUE_FILE"
        ;;
    "performance")
        echo "- 성능 벤치마크 테스트 실행" >> "$ISSUE_FILE"
        echo "- Lighthouse 점수 확인" >> "$ISSUE_FILE"
        echo "- 메모리 사용량 모니터링" >> "$ISSUE_FILE"
        ;;
    "refactor")
        echo "- 전체 테스트 스위트 실행" >> "$ISSUE_FILE"
        echo "- 기능 회귀 테스트" >> "$ISSUE_FILE"
        echo "- 코드 품질 메트릭 확인" >> "$ISSUE_FILE"
        ;;
esac

# 대규모 변경의 경우 추가 주의사항
if [ "$SCALE" = "large" ]; then
    echo "" >> "$ISSUE_FILE"
    echo "### 🚨 대규모 변경 주의사항" >> "$ISSUE_FILE"
    echo "" >> "$ISSUE_FILE"
    echo "- 단계적 배포 권장" >> "$ISSUE_FILE"
    echo "- 롤백 계획 준비" >> "$ISSUE_FILE"
    echo "- 모니터링 강화" >> "$ISSUE_FILE"
    echo "- 사용자 영향도 분석" >> "$ISSUE_FILE"
fi

# 메타데이터 추가
echo "" >> "$ISSUE_FILE"
echo "---" >> "$ISSUE_FILE"
echo "" >> "$ISSUE_FILE"
echo "**자동 생성**: post-commit-hook  " >> "$ISSUE_FILE"
echo "**생성 시간**: $TIMESTAMP  " >> "$ISSUE_FILE"
echo "**분류**: $ISSUE_CATEGORY  " >> "$ISSUE_FILE"

# audit 로그에 커밋 기록
{
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"hook\": \"post-commit\","
    echo "  \"commit_hash\": \"$COMMIT_HASH\","
    echo "  \"commit_type\": \"$COMMIT_TYPE\","
    echo "  \"priority\": \"$PRIORITY\","
    echo "  \"scale\": \"$SCALE\","
    echo "  \"changed_files\": $CHANGED_COUNT,"
    echo "  \"critical_changes\": $CRITICAL_CHANGES,"
    echo "  \"added_lines\": $ADDED_LINES,"
    echo "  \"deleted_lines\": $DELETED_LINES,"
    echo "  \"issue_file\": \"$ISSUE_FILE\","
    echo "  \"author\": \"$COMMIT_AUTHOR\""
    echo "}"
} >> ".claude/audit/audit.log"

# 중요한 커밋의 경우 즉시 알림 생성
if [ "$PRIORITY" = "critical" ] || [ "$PRIORITY" = "high" ]; then
    ALERT_FILE=".claude/issues/HIGH-PRIORITY-commit-${COMMIT_HASH:0:7}-${FORMATTED_DATE}.md"
    
    cat > "$ALERT_FILE" << EOF
# 🔥 HIGH PRIORITY: 중요 커밋 알림

**커밋**: \`$COMMIT_HASH\`  
**우선순위**: $PRIORITY  
**유형**: $COMMIT_TYPE  

## 즉시 확인 필요

이 커밋은 높은 우선순위로 분류되었습니다.

**메시지**: $COMMIT_MESSAGE  
**변경 파일**: $CHANGED_COUNT 개  

## 권장 조치

1. 즉시 코드 리뷰 실행
2. 보안/성능 테스트 실행  
3. 배포 전 충분한 검증

---
자동 생성됨 - post-commit-hook
EOF
    
    log "HIGH PRIORITY 커밋 알림 생성: $ALERT_FILE"
fi

# 성능 메트릭 기록
METRICS_FILE=".claude/metrics/commit-metrics-${FORMATTED_DATE}.json"
mkdir -p "$(dirname "$METRICS_FILE")"

{
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"commit_hash\": \"$COMMIT_HASH\","
    echo "  \"type\": \"$COMMIT_TYPE\","
    echo "  \"priority\": \"$PRIORITY\","
    echo "  \"scale\": \"$SCALE\","
    echo "  \"files_changed\": $CHANGED_COUNT,"
    echo "  \"lines_added\": $ADDED_LINES,"
    echo "  \"lines_deleted\": $DELETED_LINES,"
    echo "  \"critical_files\": ${#CRITICAL_FILES[@]}"
    echo "}"
} >> "$METRICS_FILE"

log "커밋 요약 이슈 등록 완료: $ISSUE_FILE"
echo "커밋 요약이 issue-summary에 등록되었습니다."
echo "이슈 파일: $ISSUE_FILE"

# 성공 상태 반환
exit 0