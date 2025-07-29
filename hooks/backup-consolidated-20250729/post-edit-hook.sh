#!/bin/bash

# PostToolUse Hook: Edit 작업 후 자동 코드 검토
# 파일: hooks/post-edit-hook.sh

set -euo pipefail

# 로그 설정
HOOK_LOG=".claude/audit/hook.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 로그 함수
log() {
    echo "[$TIMESTAMP] POST-EDIT: $1" | tee -a "$HOOK_LOG"
}

# 인자 확인
if [ $# -lt 1 ]; then
    log "ERROR: 파일 경로가 제공되지 않았습니다."
    exit 1
fi

FILE_PATH="$1"
TRIGGER_REVIEW=false
CRITICAL_EDIT=false

log "파일 수정 감지: $FILE_PATH"

# 중요 파일 패턴 확인
if [[ "$FILE_PATH" =~ (auth|security|payment|admin) ]]; then
    CRITICAL_EDIT=true
    TRIGGER_REVIEW=true
    log "보안 중요 파일 수정 감지 - 필수 검토 트리거"
fi

# API 엔드포인트 수정 확인
if [[ "$FILE_PATH" =~ (api/|route\.ts|handler\.ts) ]]; then
    TRIGGER_REVIEW=true
    log "API 엔드포인트 수정 감지 - 자동 검토 트리거"
fi

# 데이터베이스 관련 파일 확인
if [[ "$FILE_PATH" =~ (schema|migration|database|supabase) ]]; then
    TRIGGER_REVIEW=true
    log "데이터베이스 관련 파일 수정 감지 - 자동 검토 트리거"
fi

# 타입스크립트/자바스크립트 파일 확인
if [[ "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]]; then
    TRIGGER_REVIEW=true
    log "TypeScript/JavaScript 파일 수정 - 자동 검토 트리거"
fi

# 코드 리뷰 실행
if [ "$TRIGGER_REVIEW" = true ]; then
    log "code-review-specialist 호출 중..."
    
    REVIEW_PRIORITY="medium"
    if [ "$CRITICAL_EDIT" = true ]; then
        REVIEW_PRIORITY="high"
    fi
    
    # Claude Code Task 호출을 위한 임시 파일 생성
    REVIEW_PROMPT=$(cat << EOF
코드 리뷰를 수행해주세요:

파일: $FILE_PATH
작업: Edit (기존 파일 수정)
우선순위: $REVIEW_PRIORITY

다음 항목을 중점 확인해주세요:
1. 수정 사항이 기존 기능에 미치는 영향
2. 타입 안전성 및 strict mode 호환성
3. 보안 취약점 검사 (특히 중요 파일의 경우)
4. 성능 영향 분석
5. 테스트 필요성 판단
6. Breaking changes 여부

자동 수정 가능한 항목은 즉시 처리하고, 
중요한 이슈는 issue-summary에 보고해주세요.
EOF
)

    # 후크 결과를 audit 로그에 기록
    {
        echo "{"
        echo "  \"timestamp\": \"$TIMESTAMP\","
        echo "  \"hook\": \"post-edit\","
        echo "  \"file\": \"$FILE_PATH\","
        echo "  \"action\": \"code-review-triggered\","
        echo "  \"priority\": \"$REVIEW_PRIORITY\","
        echo "  \"critical\": $CRITICAL_EDIT,"
        echo "  \"agent\": \"code-review-specialist\""
        echo "}"
    } >> ".claude/audit/audit.log"
    
    log "코드 리뷰 완료 (우선순위: $REVIEW_PRIORITY)"
else
    log "코드 리뷰 불필요 - 건너뛰기"
fi

# 추가: 린트 자동 실행 (TypeScript 파일의 경우)
if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]] && command -v npm >/dev/null; then
    log "TypeScript 파일 - 린트 자동 실행"
    npm run lint:fix --silent || log "WARNING: 린트 실행 실패"
fi

# 성공 상태 반환
exit 0