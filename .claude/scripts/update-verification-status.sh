#!/bin/bash

# 🔄 검증 상태 업데이트 스크립트
#
# 용도: verification-status.json 파일을 업데이트하여 실시간 모니터링 지원
# 실행: .claude/hooks/cross-verification.sh에서 자동 호출

set -e

# === 설정 ===
STATUS_FILE="/mnt/d/cursor/openmanager-vibe-v5/.claude/verification-status.json"
QUEUE_FILE="/mnt/d/cursor/openmanager-vibe-v5/.claude/cross-verification-queue.txt"
LOG_FILE="/mnt/d/cursor/openmanager-vibe-v5/.claude/cross-verification.log"
TEMP_FILE="/tmp/verification-status-temp.json"

# === 함수 정의 ===

# JSON 업데이트 함수
update_json() {
    local key="$1"
    local value="$2"
    
    if [ -f "$STATUS_FILE" ]; then
        jq "$key = $value" "$STATUS_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$STATUS_FILE"
    fi
}

# 펜딩 파일 목록 업데이트
update_pending_files() {
    local pending_array="[]"
    
    if [ -f "$QUEUE_FILE" ]; then
        while IFS=: read -r file level timestamp tool; do
            if [ -n "$file" ]; then
                pending_array=$(echo "$pending_array" | jq ". += [{
                    \"file\": \"$file\",
                    \"level\": \"$level\",
                    \"timestamp\": $timestamp,
                    \"tool\": \"$tool\"
                }]")
            fi
        done < "$QUEUE_FILE"
    fi
    
    update_json ".pending" "$pending_array"
}

# 통계 업데이트
update_statistics() {
    # 보안 이슈 카운트
    local security_count=$(grep -c "🔐 보안 위험 패턴 감지" "$LOG_FILE" 2>/dev/null || echo "0")
    
    # 대기 파일 수
    local pending_count=$(wc -l < "$QUEUE_FILE" 2>/dev/null || echo "0")
    
    # 완료된 검증 수 (훅 완료 메시지 카운트)
    local completed_count=$(grep -c "✅ 교차 검증 훅 완료" "$LOG_FILE" 2>/dev/null || echo "0")
    
    # 통계 업데이트
    update_json ".statistics.totalFiles" "$pending_count"
    update_json ".statistics.securityIssuesFound" "$security_count"
    update_json ".statistics.totalReviews" "$completed_count"
    
    # 레벨별 통계
    local level1_count=$(grep -c "Level 1:" "$LOG_FILE" 2>/dev/null || echo "0")
    local level2_count=$(grep -c "Level 2:" "$LOG_FILE" 2>/dev/null || echo "0")
    local level3_count=$(grep -c "Level 3:" "$LOG_FILE" 2>/dev/null || echo "0")
    
    update_json ".byLevel.LEVEL_1.count" "$level1_count"
    update_json ".byLevel.LEVEL_2.count" "$level2_count"
    update_json ".byLevel.LEVEL_3.count" "$level3_count"
}

# 최근 활동 업데이트
update_recent_activity() {
    local recent_array="[]"
    
    # 최근 10개 로그 항목 추출
    if [ -f "$LOG_FILE" ]; then
        tail -10 "$LOG_FILE" | while IFS= read -r line; do
            # ANSI 색상 코드 제거
            clean_line=$(echo "$line" | sed 's/\\033\[[0-9;]*m//g')
            
            if [ -n "$clean_line" ]; then
                # 타임스탬프 추출
                timestamp=$(echo "$clean_line" | grep -oP '\[\K[^\]]+' | head -1)
                # 메시지 추출
                message=$(echo "$clean_line" | sed 's/\[[^]]*\] //')
                
                recent_array=$(echo "$recent_array" | jq ". += [{
                    \"timestamp\": \"$timestamp\",
                    \"message\": \"$message\"
                }]")
            fi
        done
    fi
    
    update_json ".recentActivity" "$recent_array"
}

# 타임스탬프 업데이트
update_timestamp() {
    local current_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    update_json ".lastUpdated" "\"$current_time\""
}

# === 메인 로직 ===

# 상태 파일이 없으면 생략
if [ ! -f "$STATUS_FILE" ]; then
    echo "⚠️ 상태 파일이 없습니다: $STATUS_FILE"
    exit 0
fi

# 각 섹션 업데이트
update_timestamp
update_pending_files
update_statistics
update_recent_activity

echo "✅ 검증 상태 업데이트 완료: $(date)"