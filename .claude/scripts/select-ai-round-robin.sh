#!/bin/bash

# 🎯 라운드 로빈 방식 AI 선택 스크립트
# Level 1에서 Gemini, Codex, Qwen을 균등하게 분배
#
# 사용법: ./select-ai-round-robin.sh [LEVEL]
# 반환값: 선택된 AI 이름 (gemini/codex/qwen)

set -e

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
MATRIX_FILE="$CLAUDE_DIR/ai-assignment-matrix.json"
USAGE_FILE="$CLAUDE_DIR/ai-usage-tracker.json"

# === 함수 정의 ===

# 사용량 추적 파일 초기화
init_usage_tracker() {
    if [ ! -f "$USAGE_FILE" ]; then
        cat > "$USAGE_FILE" << EOF
{
  "updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "daily_usage": {
    "gemini": {
      "count": 0,
      "limit": 1000,
      "last_used": null
    },
    "codex": {
      "count": 0,
      "limit": -1,
      "last_used": null
    },
    "qwen": {
      "count": 0,
      "limit": 2000,
      "last_used": null
    }
  },
  "round_robin": {
    "last_selected": null,
    "sequence": ["gemini", "codex", "qwen"],
    "current_index": 0
  },
  "statistics": {
    "total_selections": 0,
    "selection_distribution": {
      "gemini": 0,
      "codex": 0,
      "qwen": 0
    }
  }
}
EOF
    fi
}

# 일일 사용량 리셋 (자정 체크)
reset_daily_usage_if_needed() {
    local last_update=$(jq -r '.updated' "$USAGE_FILE")
    local last_date=$(date -d "$last_update" +%Y%m%d 2>/dev/null || echo "0")
    local current_date=$(date +%Y%m%d)
    
    if [ "$last_date" != "$current_date" ]; then
        # 새로운 날 - 사용량 리셋
        jq '.daily_usage.gemini.count = 0 |
            .daily_usage.codex.count = 0 |
            .daily_usage.qwen.count = 0 |
            .updated = "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"' \
            "$USAGE_FILE" > "$USAGE_FILE.tmp" && mv "$USAGE_FILE.tmp" "$USAGE_FILE"
    fi
}

# AI 사용 가능 여부 확인
is_ai_available() {
    local ai="$1"
    local count=$(jq -r ".daily_usage.$ai.count" "$USAGE_FILE")
    local limit=$(jq -r ".daily_usage.$ai.limit" "$USAGE_FILE")
    
    # limit이 -1이면 무제한
    if [ "$limit" == "-1" ]; then
        echo "true"
        return
    fi
    
    # 사용량 체크
    if [ "$count" -lt "$limit" ]; then
        echo "true"
    else
        echo "false"
    fi
}

# 라운드 로빈 방식으로 AI 선택
select_ai_round_robin() {
    local level="$1"
    
    # Level 1이 아니면 기본 로직 사용
    if [ "$level" != "LEVEL_1" ]; then
        case "$level" in
            LEVEL_2)
                echo "gemini,codex"  # Level 2는 항상 2개 AI 병렬
                ;;
            LEVEL_3|LEVEL_3_CRITICAL)
                echo "gemini,codex,qwen"  # Level 3는 모든 AI
                ;;
            *)
                echo "gemini"  # 기본값
                ;;
        esac
        return
    fi
    
    # Level 1: 라운드 로빈 선택
    local sequence=($(jq -r '.round_robin.sequence[]' "$USAGE_FILE"))
    local current_index=$(jq -r '.round_robin.current_index' "$USAGE_FILE")
    local attempts=0
    local selected_ai=""
    
    # 랜덤 시작점 (더 균등한 분배를 위해)
    if [ "$current_index" == "0" ] && [ "$(jq -r '.statistics.total_selections' "$USAGE_FILE")" == "0" ]; then
        current_index=$((RANDOM % 3))
    fi
    
    # 사용 가능한 AI 찾기
    while [ $attempts -lt 3 ]; do
        local candidate="${sequence[$current_index]}"
        
        if [ "$(is_ai_available "$candidate")" == "true" ]; then
            selected_ai="$candidate"
            break
        fi
        
        # 다음 AI로 이동
        current_index=$(( (current_index + 1) % 3 ))
        attempts=$((attempts + 1))
    done
    
    # 모든 AI가 제한에 도달한 경우 무제한 AI (codex) 사용
    if [ -z "$selected_ai" ]; then
        selected_ai="codex"
    fi
    
    # 사용량 업데이트
    local new_index=$(( (current_index + 1) % 3 ))
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    jq --arg ai "$selected_ai" \
       --arg idx "$new_index" \
       --arg ts "$timestamp" \
       '.round_robin.last_selected = $ai |
        .round_robin.current_index = ($idx | tonumber) |
        .daily_usage[$ai].count += 1 |
        .daily_usage[$ai].last_used = $ts |
        .statistics.total_selections += 1 |
        .statistics.selection_distribution[$ai] += 1 |
        .updated = $ts' \
        "$USAGE_FILE" > "$USAGE_FILE.tmp" && mv "$USAGE_FILE.tmp" "$USAGE_FILE"
    
    echo "$selected_ai"
}

# 사용량 통계 표시
show_usage_stats() {
    echo "=== AI 사용량 통계 ==="
    echo "$(jq -r '
        .daily_usage | to_entries | .[] | 
        "\(.key): \(.value.count)/\(if .value.limit == -1 then "unlimited" else .value.limit end)"
    ' "$USAGE_FILE")"
    
    echo ""
    echo "=== 선택 분포 ==="
    echo "$(jq -r '
        .statistics.selection_distribution | to_entries | .[] |
        "\(.key): \(.value)회"
    ' "$USAGE_FILE")"
    
    echo ""
    echo "마지막 선택: $(jq -r '.round_robin.last_selected' "$USAGE_FILE")"
}

# === 메인 로직 ===

LEVEL="${1:-LEVEL_1}"
SHOW_STATS="${2:-}"

# 사용량 추적 파일 초기화
init_usage_tracker

# 일일 사용량 리셋 체크
reset_daily_usage_if_needed

# AI 선택
SELECTED_AI=$(select_ai_round_robin "$LEVEL")

# 결과 출력
echo "$SELECTED_AI"

# 통계 표시 (옵션)
if [ "$SHOW_STATS" == "--stats" ]; then
    echo ""
    show_usage_stats >&2
fi

exit 0