#!/bin/bash

# PreToolUse Hook: Supabase DB 작업 전 가드레일
# 파일: hooks/pre-database-hook.sh

set -euo pipefail

# 로그 설정
HOOK_LOG=".claude/audit/hook.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 로그 함수
log() {
    echo "[$TIMESTAMP] PRE-DATABASE: $1" | tee -a "$HOOK_LOG"
}

# 인자 확인
OPERATION="$1"
PARAMETERS="${2:-}"

log "데이터베이스 작업 요청: $OPERATION"

# 위험한 작업 패턴 정의
DANGEROUS_PATTERNS=(
    "DROP TABLE"
    "DROP DATABASE"
    "DELETE FROM.*WHERE.*=.*"
    "TRUNCATE"
    "ALTER TABLE.*DROP"
    "UPDATE.*SET.*WHERE.*=.*"
)

# 스키마 변경 패턴
SCHEMA_PATTERNS=(
    "CREATE TABLE"
    "ALTER TABLE"
    "CREATE INDEX"
    "DROP INDEX"
    "ADD COLUMN"
    "DROP COLUMN"
)

BLOCK_OPERATION=false
REQUIRE_APPROVAL=false
DELEGATE_TO_DBA=false

# 위험한 작업 확인
for pattern in "${DANGEROUS_PATTERNS[@]}"; do
    if [[ "$PARAMETERS" =~ $pattern ]]; then
        log "CRITICAL: 위험한 데이터베이스 작업 감지 - $pattern"
        BLOCK_OPERATION=true
        break
    fi
done

# 스키마 변경 확인
for pattern in "${SCHEMA_PATTERNS[@]}"; do
    if [[ "$PARAMETERS" =~ $pattern ]]; then
        log "INFO: 스키마 변경 작업 감지 - $pattern"
        DELEGATE_TO_DBA=true
        REQUIRE_APPROVAL=true
        break
    fi
done

# 무료 티어 리소스 사용량 확인
check_free_tier_limits() {
    log "무료 티어 한계 확인 중..."
    
    # Supabase 500MB 한계 확인 (임시적으로 90% 경고)
    CURRENT_USAGE=$(echo "450" | bc) # MB 단위로 가정
    LIMIT_MB=500
    USAGE_PERCENT=$(echo "scale=2; $CURRENT_USAGE * 100 / $LIMIT_MB" | bc)
    
    if (( $(echo "$USAGE_PERCENT > 90" | bc -l) )); then
        log "WARNING: Supabase 사용량 ${USAGE_PERCENT}% - 90% 초과"
        REQUIRE_APPROVAL=true
    fi
}

check_free_tier_limits

# 작업 차단 처리
if [ "$BLOCK_OPERATION" = true ]; then
    log "ERROR: 위험한 데이터베이스 작업이 차단되었습니다."
    
    # audit 로그에 차단 기록
    {
        echo "{"
        echo "  \"timestamp\": \"$TIMESTAMP\","
        echo "  \"hook\": \"pre-database\","
        echo "  \"operation\": \"$OPERATION\","
        echo "  \"action\": \"BLOCKED\","
        echo "  \"reason\": \"dangerous-operation\","
        echo "  \"parameters\": \"$PARAMETERS\""
        echo "}"
    } >> ".claude/audit/audit.log"
    
    echo "데이터베이스 작업이 보안상의 이유로 차단되었습니다."
    echo "필요시 database-administrator 에이전트를 통해 안전한 방식으로 수행하세요."
    exit 1
fi

# database-administrator 에이전트로 위임
if [ "$DELEGATE_TO_DBA" = true ]; then
    log "database-administrator 에이전트로 작업 위임"
    
    DBA_PROMPT=$(cat << EOF
Supabase 데이터베이스 작업 요청:

작업: $OPERATION
매개변수: $PARAMETERS
원래 요청 시간: $TIMESTAMP

다음을 수행해주세요:
1. 작업의 안전성 검토
2. 무료 티어 한계 고려 (현재 Supabase 500MB 중 90% 사용)
3. 백업 및 롤백 계획 수립
4. 성능 영향 분석
5. 안전한 방식으로 작업 실행

특히 주의사항:
- RLS (Row Level Security) 정책 확인
- pgvector 확장 관련 영향 검토
- 인덱스 전략 최적화
- 쿼리 성능 영향 분석
EOF
)

    # audit 로그에 위임 기록
    {
        echo "{"
        echo "  \"timestamp\": \"$TIMESTAMP\","
        echo "  \"hook\": \"pre-database\","
        echo "  \"operation\": \"$OPERATION\","
        echo "  \"action\": \"DELEGATED\","
        echo "  \"agent\": \"database-administrator\","
        echo "  \"parameters\": \"$PARAMETERS\""
        echo "}"
    } >> ".claude/audit/audit.log"
    
    log "데이터베이스 작업이 database-administrator로 위임되었습니다."
    echo "데이터베이스 작업이 전문 에이전트로 위임되었습니다."
    echo "database-administrator가 안전하게 작업을 수행할 예정입니다."
    exit 2  # 특별한 exit code로 위임 표시
fi

# 승인 필요한 경우
if [ "$REQUIRE_APPROVAL" = true ]; then
    log "사용자 승인 필요한 작업입니다."
    
    {
        echo "{"
        echo "  \"timestamp\": \"$TIMESTAMP\","
        echo "  \"hook\": \"pre-database\","
        echo "  \"operation\": \"$OPERATION\","
        echo "  \"action\": \"APPROVAL_REQUIRED\","
        echo "  \"parameters\": \"$PARAMETERS\""
        echo "}"
    } >> ".claude/audit/audit.log"
    
    echo "이 데이터베이스 작업은 승인이 필요합니다:"
    echo "작업: $OPERATION"
    echo "매개변수: $PARAMETERS"
    echo ""
    echo "계속하시겠습니까? (y/N): "
    read -r APPROVAL
    
    if [[ ! "$APPROVAL" =~ ^[Yy]$ ]]; then
        log "사용자가 데이터베이스 작업을 취소했습니다."
        echo "작업이 취소되었습니다."
        exit 1
    fi
fi

log "데이터베이스 작업 승인됨: $OPERATION"

# 성공 상태 반환
exit 0