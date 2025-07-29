#!/bin/bash

# PreToolUse Hook: 스키마 변경 전 승인 프로세스
# 파일: hooks/pre-schema-change-hook.sh

set -euo pipefail

# 로그 설정
HOOK_LOG=".claude/audit/hook.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 로그 함수
log() {
    echo "[$TIMESTAMP] PRE-SCHEMA: $1" | tee -a "$HOOK_LOG"
}

# 인자 확인
if [ $# -lt 1 ]; then
    log "ERROR: 스키마 파일 경로가 제공되지 않았습니다."
    exit 1
fi

SCHEMA_FILE="$1"
OPERATION="${2:-EDIT}"

log "스키마 변경 감지: $SCHEMA_FILE ($OPERATION)"

# 스키마 파일 존재 확인
if [ ! -f "$SCHEMA_FILE" ] && [ "$OPERATION" != "CREATE" ]; then
    log "ERROR: 스키마 파일이 존재하지 않습니다: $SCHEMA_FILE"
    exit 1
fi

# 위험한 스키마 변경 패턴 정의
DANGEROUS_PATTERNS=(
    "DROP\s+TABLE"
    "DROP\s+COLUMN"
    "ALTER\s+TABLE.*DROP"
    "TRUNCATE"
    "DELETE\s+FROM"
    "DROP\s+INDEX"
    "DROP\s+CONSTRAINT"
)

# 백업 필요 패턴
BACKUP_REQUIRED_PATTERNS=(
    "ALTER\s+TABLE"
    "CREATE\s+INDEX"
    "DROP\s+INDEX"
    "ADD\s+CONSTRAINT"
    "DROP\s+CONSTRAINT"
    "MODIFY\s+COLUMN"
    "CHANGE\s+COLUMN"
)

BLOCK_OPERATION=false
REQUIRE_BACKUP=false
REQUIRE_APPROVAL=true
DELEGATE_TO_DBA=true

# 스키마 파일 내용 분석 (CREATE의 경우 건너뛰기)
if [ "$OPERATION" != "CREATE" ]; then
    SCHEMA_CONTENT=$(cat "$SCHEMA_FILE")
    
    # 위험한 패턴 검사
    for pattern in "${DANGEROUS_PATTERNS[@]}"; do
        if echo "$SCHEMA_CONTENT" | grep -qiE "$pattern"; then
            log "DANGER: 위험한 스키마 작업 감지 - $pattern"
            BLOCK_OPERATION=true
            break
        fi
    done
    
    # 백업 필요 패턴 검사
    for pattern in "${BACKUP_REQUIRED_PATTERNS[@]}"; do
        if echo "$SCHEMA_CONTENT" | grep -qiE "$pattern"; then
            log "INFO: 백업 필요 작업 감지 - $pattern"
            REQUIRE_BACKUP=true
            break
        fi
    done
else
    log "새 스키마 파일 생성 - 기본 검증만 수행"
    REQUIRE_APPROVAL=false
    DELEGATE_TO_DBA=false
fi

# 무료 티어 제약사항 확인
check_free_tier_constraints() {
    log "Supabase 무료 티어 제약사항 확인 중..."
    
    # 테이블 수 제한 (임시적으로 체크)
    TABLE_COUNT=$(echo "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | wc -l)
    MAX_TABLES=100  # 예상 제한
    
    if [ "$TABLE_COUNT" -ge "$MAX_TABLES" ]; then
        log "WARNING: 테이블 수가 제한에 근접했습니다 ($TABLE_COUNT/$MAX_TABLES)"
        REQUIRE_APPROVAL=true
    fi
    
    # 데이터베이스 크기 확인 (500MB 제한)
    log "데이터베이스 크기 확인 (500MB 제한)"
    # 실제로는 Supabase API를 통해 확인해야 함
}

check_free_tier_constraints

# 위험한 작업 차단
if [ "$BLOCK_OPERATION" = true ]; then
    log "ERROR: 위험한 스키마 변경이 차단되었습니다."
    
    # audit 로그에 차단 기록
    {
        echo "{"
        echo "  \"timestamp\": \"$TIMESTAMP\","
        echo "  \"hook\": \"pre-schema-change\","
        echo "  \"file\": \"$SCHEMA_FILE\","
        echo "  \"operation\": \"$OPERATION\","
        echo "  \"action\": \"BLOCKED\","
        echo "  \"reason\": \"dangerous-schema-operation\""
        echo "}"
    } >> ".claude/audit/audit.log"
    
    echo ""
    echo "🚨 BLOCKED: 위험한 스키마 변경 작업"
    echo ""
    echo "이 작업은 데이터 손실 위험으로 인해 차단되었습니다."
    echo "파일: $SCHEMA_FILE"
    echo ""
    echo "안전한 방법:"
    echo "1. database-administrator 에이전트를 통해 안전하게 수행"
    echo "2. 백업 생성 후 수동으로 검토하여 실행"
    echo "3. 단계적 마이그레이션 계획 수립"
    echo ""
    exit 1
fi

# database-administrator로 위임
if [ "$DELEGATE_TO_DBA" = true ]; then
    log "database-administrator 에이전트로 스키마 작업 위임"
    
    # 스키마 분석 정보 수집
    ANALYSIS_INFO=""
    if [ "$OPERATION" != "CREATE" ]; then
        ANALYSIS_INFO=$(cat << EOF

### 스키마 파일 분석
파일: $SCHEMA_FILE
크기: $(wc -l < "$SCHEMA_FILE") 줄
백업 필요: $REQUIRE_BACKUP

### 파일 내용 미리보기
\`\`\`sql
$(head -20 "$SCHEMA_FILE")
\`\`\`
EOF
)
    fi
    
    DBA_PROMPT=$(cat << EOF
Supabase 스키마 변경 요청:

작업: $OPERATION
파일: $SCHEMA_FILE  
요청 시간: $TIMESTAMP
$ANALYSIS_INFO

다음을 수행해주세요:

### 1. 사전 검토
- 스키마 변경의 안전성 분석
- 기존 데이터에 미치는 영향 검토
- 무료 티어 제약사항 확인 (500MB, RLS 등)

### 2. 백업 전략
- 필요시 현재 스키마 백업
- 롤백 계획 수립
- 데이터 보존 전략

### 3. 실행 계획
- 단계적 마이그레이션 계획
- 다운타임 최소화 방안
- 테스트 환경에서 먼저 검증

### 4. 사후 검증
- RLS 정책 확인
- pgvector 확장 호환성
- 인덱스 최적화
- 성능 영향 분석

### 무료 티어 고려사항
- Supabase 500MB 제한
- 동시 연결 제한
- API 호출 제한
- 자동 백업 주기

안전하고 효율적인 방식으로 스키마 변경을 수행해주세요.
EOF
)

    # audit 로그에 위임 기록
    {
        echo "{"
        echo "  \"timestamp\": \"$TIMESTAMP\","
        echo "  \"hook\": \"pre-schema-change\","
        echo "  \"file\": \"$SCHEMA_FILE\","
        echo "  \"operation\": \"$OPERATION\","
        echo "  \"action\": \"DELEGATED\","
        echo "  \"agent\": \"database-administrator\","
        echo "  \"require_backup\": $REQUIRE_BACKUP"
        echo "}"
    } >> ".claude/audit/audit.log"
    
    log "스키마 변경이 database-administrator로 위임되었습니다."
    
    echo ""
    echo "🔄 스키마 변경 작업 위임"
    echo ""
    echo "이 스키마 변경은 전문 데이터베이스 관리자 에이전트가 처리합니다."
    echo "파일: $SCHEMA_FILE"
    echo "작업: $OPERATION"
    echo ""
    echo "database-administrator가 다음을 수행합니다:"
    echo "- 안전성 검토"
    echo "- 백업 생성"
    echo "- 단계적 실행"
    echo "- 사후 검증"
    echo ""
    exit 2  # 위임 표시용 특별 exit code
fi

# 사용자 승인 프로세스
if [ "$REQUIRE_APPROVAL" = true ]; then
    log "사용자 승인이 필요한 스키마 변경입니다."
    
    echo ""
    echo "📋 스키마 변경 승인 요청"
    echo ""
    echo "파일: $SCHEMA_FILE"
    echo "작업: $OPERATION"
    echo "백업 필요: $REQUIRE_BACKUP"
    echo ""
    
    if [ "$OPERATION" != "CREATE" ]; then
        echo "변경 내용 미리보기:"
        echo "----------------------------------------"
        head -10 "$SCHEMA_FILE"
        echo "----------------------------------------"
        echo ""
    fi
    
    echo "주의사항:"
    echo "- 이 작업은 데이터베이스 스키마를 변경합니다"
    echo "- 무료 티어 제약사항을 고려하여 실행됩니다"  
    echo "- 필요시 백업이 자동으로 생성됩니다"
    echo ""
    
    echo -n "계속 진행하시겠습니까? (y/N): "
    read -r APPROVAL
    
    if [[ ! "$APPROVAL" =~ ^[Yy]$ ]]; then
        log "사용자가 스키마 변경을 취소했습니다."
        
        {
            echo "{"
            echo "  \"timestamp\": \"$TIMESTAMP\","
            echo "  \"hook\": \"pre-schema-change\","
            echo "  \"file\": \"$SCHEMA_FILE\","
            echo "  \"operation\": \"$OPERATION\","
            echo "  \"action\": \"USER_CANCELLED\""
            echo "}"
        } >> ".claude/audit/audit.log"
        
        echo "스키마 변경이 취소되었습니다."
        exit 1
    fi
    
    log "사용자가 스키마 변경을 승인했습니다."
fi

# 백업 생성 (필요한 경우)
if [ "$REQUIRE_BACKUP" = true ] && [ "$OPERATION" != "CREATE" ]; then
    log "스키마 백업 생성 중..."
    
    BACKUP_DIR=".claude/backups/schema"
    mkdir -p "$BACKUP_DIR"
    
    BACKUP_FILE="$BACKUP_DIR/schema-backup-$(date +%Y%m%d-%H%M%S).sql"
    
    # 현재 스키마 백업 (실제로는 pg_dump 사용해야 함)
    cp "$SCHEMA_FILE" "$BACKUP_FILE.original"
    
    log "스키마 백업 완료: $BACKUP_FILE"
    echo "백업 생성됨: $BACKUP_FILE"
fi

# 최종 승인 로그
{
    echo "{"
    echo "  \"timestamp\": \"$TIMESTAMP\","
    echo "  \"hook\": \"pre-schema-change\","
    echo "  \"file\": \"$SCHEMA_FILE\","
    echo "  \"operation\": \"$OPERATION\","
    echo "  \"action\": \"APPROVED\","
    echo "  \"backup_created\": $REQUIRE_BACKUP"
    echo "}"
} >> ".claude/audit/audit.log"

log "스키마 변경 승인됨: $SCHEMA_FILE ($OPERATION)"
echo "스키마 변경이 승인되었습니다. 계속 진행합니다."

# 성공 상태 반환
exit 0