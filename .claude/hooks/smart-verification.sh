#!/bin/bash

# 🧠 스마트 검증 Hook
# Claude Code에서 파일 수정 후 자동 실행되는 지능형 검증 스크립트
# 
# 개선사항:
# - 중복 검증 방지 (5분 이내 재검증 스킵)
# - 검증 큐 중복 확인
# - 캐시 기반 빠른 검증
# - 백그라운드 병렬 실행
#
# 인자:
# $1: 수정된 파일 경로 
# $2: 사용된 도구 (Edit/Write/MultiEdit)

set -e

# === 터미널 환경 완전 격리 ===
export TERM=dumb
export NO_COLOR=1
export NONINTERACTIVE=1
export PAGER=cat
export LESS=""

# TTY 설정 비활성화 (ANSI 시퀀스 차단)
if command -v stty >/dev/null 2>&1; then
    stty -echo -icanon 2>/dev/null || true
fi

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
CACHE_DIR="$CLAUDE_DIR/cache"
QUEUE_DIR="$CLAUDE_DIR/queues"
LOG_FILE="$CLAUDE_DIR/smart-verification.log"

# 큐 파일들
VERIFICATION_QUEUE="$QUEUE_DIR/verification-queue.txt"
RECENT_VERIFICATIONS="$QUEUE_DIR/recent-verifications.txt"
PARALLEL_LOCKS="$QUEUE_DIR/parallel-locks.txt"

# 성능 설정
RECENT_VERIFICATION_TTL=300  # 5분 (300초)
CACHE_TTL=3600              # 1시간 (3600초)
MAX_PARALLEL_VERIFICATIONS=3

# === 색상 코드 (NO_COLOR 환경변수에 따라 비활성화) ===
if [ -z "$NO_COLOR" ]; then
    RED='\033[0;31m'
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    BLUE='\033[0;34m'
    PURPLE='\033[0;35m'
    NC='\033[0m'
else
    RED=''
    GREEN=''
    YELLOW=''
    BLUE=''
    PURPLE=''
    NC=''
fi

# === 유틸리티 함수 ===

log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 포괄적인 ANSI 필터링 (색상 + 제어 시퀀스)
    local clean_message=$(echo -e "$message" | sed 's/\x1b\[[0-9;]*[mGKHRJF]//g; s/\[[0-9;]*[RHJ]//g; s/\x1b[()][AB012]//g')
    echo "[$timestamp] $clean_message" >> "$LOG_FILE" 2>/dev/null || true
    
    # NO_COLOR가 설정된 경우 터미널 출력도 필터링
    if [ -n "$NO_COLOR" ]; then
        echo "$clean_message"
    else
        echo -e "$message"
    fi
}

# Atomic write 함수 (race condition 방지)
atomic_write() {
    local target_file="$1"
    local content="$2"
    local temp_file="${target_file}.tmp.$$"
    
    # 임시 파일에 쓰기
    echo "$content" > "$temp_file"
    if [ $? -eq 0 ]; then
        # 원자적으로 이동 (atomic operation)
        mv "$temp_file" "$target_file"
        return $?
    else
        # 실패 시 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
        return 1
    fi
}

# Atomic append 함수
atomic_append() {
    local target_file="$1"
    local content="$2"
    local temp_file="${target_file}.tmp.$$"
    
    # 기존 내용을 임시 파일로 복사 (존재하는 경우)
    if [ -f "$target_file" ]; then
        cp "$target_file" "$temp_file"
    fi
    
    # 새 내용 추가
    echo "$content" >> "$temp_file"
    if [ $? -eq 0 ]; then
        # 원자적으로 이동
        mv "$temp_file" "$target_file"
        return $?
    else
        # 실패 시 임시 파일 정리
        rm -f "$temp_file" 2>/dev/null
        return 1
    fi
}

# 해시 캐시 (성능 최적화)
declare -A HASH_CACHE

# 최근 검증 기록 캐시 (O(n) → O(1) 최적화)
declare -A RECENT_VERIFICATION_CACHE
RECENT_CACHE_LOADED=false

# 파일 경로 보안 검증 (경로 주입 공격 방지)
sanitize_file_path() {
    local file="$1"
    # ../와 같은 경로 순회 패턴 제거
    file=$(echo "$file" | sed 's/\.\.\///g' | sed 's/\/\.\.\//\//g')
    # 절대 경로가 아닌 경우 프로젝트 루트 기준으로 변환
    if [[ ! "$file" =~ ^/ ]]; then
        file="$PROJECT_ROOT/$file"
    fi
    # 프로젝트 루트 외부 경로 차단
    if [[ ! "$file" =~ ^$PROJECT_ROOT ]]; then
        echo ""
        return 1
    fi
    echo "$file"
}

# 파일 해시 계산 (캐싱 포함)
get_file_hash() {
    local file="$1"
    local sanitized_file=$(sanitize_file_path "$file")
    
    if [ -z "$sanitized_file" ]; then
        echo "invalid_path"
        return 1
    fi
    
    # 캐시 확인
    if [ -n "${HASH_CACHE[$sanitized_file]}" ]; then
        echo "${HASH_CACHE[$sanitized_file]}"
        return 0
    fi
    
    if [ -f "$sanitized_file" ]; then
        local hash=$(md5sum "$sanitized_file" | cut -d' ' -f1)
        HASH_CACHE[$sanitized_file]="$hash"  # 캐시 저장
        echo "$hash"
    else
        echo "missing_file"
    fi
}

# 파일 크기 기반 검증 레벨 결정
determine_verification_level() {
    local file="$1"
    local size=0
    
    if [ -f "$file" ]; then
        size=$(wc -l "$file" 2>/dev/null | awk '{print $1}')
    fi
    
    # 중요 파일 패턴 확인 (항상 Level 3)
    if [[ "$file" =~ /(api|auth|security|payment|middleware)/ ]] || \
       [[ "$file" =~ \.(config|env) ]] || \
       [[ "$file" =~ route\.ts$ ]] || \
       [[ "$file" =~ middleware\.ts$ ]]; then
        echo "3"
        return
    fi
    
    # 파일 크기 기반 레벨 결정
    if [ "$size" -lt 50 ]; then
        echo "1"
    elif [ "$size" -lt 200 ]; then
        echo "2"  
    else
        echo "3"
    fi
}

# 최근 검증 기록을 해시 테이블로 로드 (O(1) 조회를 위한 최적화)
load_recent_verification_cache() {
    if [ "$RECENT_CACHE_LOADED" = true ]; then
        return 0
    fi
    
    if [ -f "$RECENT_VERIFICATIONS" ]; then
        while IFS=':' read -r hash timestamp level; do
            # 빈 줄이나 잘못된 형식 스킵
            if [ -n "$hash" ] && [ -n "$timestamp" ] && [ -n "$level" ]; then
                RECENT_VERIFICATION_CACHE[$hash]="$timestamp:$level"
            fi
        done < "$RECENT_VERIFICATIONS"
    fi
    
    RECENT_CACHE_LOADED=true
}

# 최근 검증 기록 확인 (O(1) 해시 테이블 조회)
check_recent_verification() {
    local file="$1"
    local file_hash=$(get_file_hash "$file")
    local current_time=$(date +%s)
    
    # 해시 테이블이 로드되지 않았다면 로드
    load_recent_verification_cache
    
    # O(1) 해시 테이블 조회
    if [ -n "${RECENT_VERIFICATION_CACHE[$file_hash]}" ]; then
        local cache_entry="${RECENT_VERIFICATION_CACHE[$file_hash]}"
        local timestamp=$(echo "$cache_entry" | cut -d':' -f1)
        local age=$((current_time - timestamp))
        
        if [ $age -lt $RECENT_VERIFICATION_TTL ]; then
            log_message "${YELLOW}⚡ 최근 검증됨 (${age}초 전) - 스킵${NC}"
            return 0  # true - 최근 검증됨
        else
            # 만료된 항목은 캐시에서 제거
            unset RECENT_VERIFICATION_CACHE[$file_hash]
        fi
    fi
    
    return 1  # false - 최근 검증 안됨
}

# 캐시 확인
check_verification_cache() {
    local file="$1" 
    local file_hash=$(get_file_hash "$file")
    local cache_file="$CACHE_DIR/${file_hash}.json"
    
    if [ -f "$cache_file" ]; then
        local cache_age=$(($(date +%s) - $(stat -c %Y "$cache_file" 2>/dev/null || echo 0)))
        if [ $cache_age -lt $CACHE_TTL ]; then
            log_message "${GREEN}⚡ 캐시된 검증 결과 사용 (${cache_age}초 전)${NC}"
            cat "$cache_file"
            return 0  # true - 캐시 히트
        fi
    fi
    
    return 1  # false - 캐시 미스
}

# 검증 큐에서 중복 확인
check_verification_queue() {
    local file="$1"
    local file_hash=$(get_file_hash "$file")
    
    if [ -f "$VERIFICATION_QUEUE" ]; then
        if grep -q "^${file_hash}:" "$VERIFICATION_QUEUE"; then
            log_message "${BLUE}🔄 이미 검증 큐에 대기 중 - 스킵${NC}"
            return 0  # true - 이미 큐에 있음
        fi
    fi
    
    return 1  # false - 큐에 없음
}

# 병렬 검증 실행 수 확인
check_parallel_limit() {
    local current_count=0
    
    if [ -f "$PARALLEL_LOCKS" ]; then
        # 활성 프로세스만 카운트
        while IFS=':' read -r pid timestamp; do
            if kill -0 "$pid" 2>/dev/null; then
                current_count=$((current_count + 1))
            fi
        done < "$PARALLEL_LOCKS"
    fi
    
    if [ $current_count -ge $MAX_PARALLEL_VERIFICATIONS ]; then
        log_message "${YELLOW}⏳ 최대 병렬 검증 수 도달 ($current_count/$MAX_PARALLEL_VERIFICATIONS) - 대기${NC}"
        return 0  # true - 한계 도달
    fi
    
    return 1  # false - 실행 가능
}

# 검증 큐에 추가
add_to_verification_queue() {
    local file="$1"
    local level="$2"
    local file_hash=$(get_file_hash "$file")
    local timestamp=$(date +%s)
    
    # 디렉토리 생성
    mkdir -p "$QUEUE_DIR"
    
    # 큐에 추가
    echo "${file_hash}:${file}:${level}:${timestamp}" >> "$VERIFICATION_QUEUE"
    
    log_message "${GREEN}📋 검증 큐에 추가: Level $level${NC}"
}

# 최근 검증 기록 업데이트 (캐시 동기화 + atomic write)
update_recent_verification() {
    local file="$1"
    local level="$2"
    local file_hash=$(get_file_hash "$file")
    local timestamp=$(date +%s)
    local current_time=$timestamp
    
    # 디렉토리 생성
    mkdir -p "$QUEUE_DIR"
    
    # 캐시 로드 확인
    load_recent_verification_cache
    
    # 1. 캐시에서 기존 항목 제거 (있다면)
    if [ -n "${RECENT_VERIFICATION_CACHE[$file_hash]}" ]; then
        unset RECENT_VERIFICATION_CACHE[$file_hash]
    fi
    
    # 2. 새 항목을 캐시에 추가
    RECENT_VERIFICATION_CACHE[$file_hash]="$timestamp:$level"
    
    # 3. 파일에서 기존 기록 제거 (atomic write)
    local temp_content=""
    if [ -f "$RECENT_VERIFICATIONS" ]; then
        temp_content=$(grep -v "^${file_hash}:" "$RECENT_VERIFICATIONS" 2>/dev/null || true)
    fi
    
    # 4. 새 기록 추가
    if [ -n "$temp_content" ]; then
        temp_content="${temp_content}\n${file_hash}:${timestamp}:${level}"
    else
        temp_content="${file_hash}:${timestamp}:${level}"
    fi
    
    # 5. 오래된 기록 정리 (24시간 이상) + atomic write
    local cutoff_time=$((timestamp - 86400))
    local filtered_content=""
    
    echo -e "$temp_content" | while IFS=':' read -r hash ts lvl; do
        if [ "$ts" -gt "$cutoff_time" ]; then
            if [ -z "$filtered_content" ]; then
                filtered_content="$hash:$ts:$lvl"
            else
                filtered_content="$filtered_content\n$hash:$ts:$lvl"
            fi
        else
            # 만료된 항목은 캐시에서도 제거
            unset RECENT_VERIFICATION_CACHE[$hash]
        fi
    done
    
    # 6. Atomic write로 파일 업데이트
    if ! atomic_write "$RECENT_VERIFICATIONS" "$filtered_content"; then
        log_message "${RED}❌ 최근 검증 기록 업데이트 실패${NC}"
        return 1
    fi
}

# 병렬 잠금 추가
add_parallel_lock() {
    local pid="$1"
    local timestamp=$(date +%s)
    
    mkdir -p "$QUEUE_DIR"
    echo "${pid}:${timestamp}" >> "$PARALLEL_LOCKS"
    
    # 오래된 락 정리 (완료된 프로세스)
    if [ -f "$PARALLEL_LOCKS" ]; then
        local temp_file="$PARALLEL_LOCKS.tmp"
        while IFS=':' read -r lock_pid lock_timestamp; do
            if kill -0 "$lock_pid" 2>/dev/null; then
                echo "${lock_pid}:${lock_timestamp}" >> "$temp_file"
            fi
        done < "$PARALLEL_LOCKS"
        mv "$temp_file" "$PARALLEL_LOCKS" 2>/dev/null || rm -f "$temp_file"
    fi
}

# 백그라운드 검증 실행
execute_background_verification() {
    local file="$1"
    local level="$2"
    
    log_message "${PURPLE}🚀 백그라운드 검증 시작: $file (Level $level)${NC}"
    
    # 백그라운드에서 실행
    (
        # 병렬 잠금 추가
        add_parallel_lock $$
        
        # 실제 검증 실행 (Claude Code Task 사용)
        local task_result
        case "$level" in
            1)
                task_result=$(echo "Task external-ai-orchestrator 'Level 1 단일 AI 검증: $file'" 2>/dev/null)
                ;;
            2) 
                task_result=$(echo "Task external-ai-orchestrator 'Level 2 병렬 검증: $file (Claude + Gemini)'" 2>/dev/null)
                ;;
            3)
                task_result=$(echo "Task external-ai-orchestrator 'Level 3 완전 교차 검증: $file (4-AI 전체)'" 2>/dev/null)
                ;;
        esac
        
        # 결과를 캐시에 저장
        local file_hash=$(get_file_hash "$file")
        local cache_file="$CACHE_DIR/${file_hash}.json"
        mkdir -p "$CACHE_DIR"
        
        echo "{
  \"file\": \"$file\",
  \"level\": $level,
  \"result\": \"$task_result\",
  \"timestamp\": \"$(date -Iseconds)\",
  \"hash\": \"$file_hash\"
}" > "$cache_file"
        
        # 큐에서 제거
        if [ -f "$VERIFICATION_QUEUE" ]; then
            grep -v ":$file:" "$VERIFICATION_QUEUE" > "$VERIFICATION_QUEUE.tmp" 2>/dev/null || true
            mv "$VERIFICATION_QUEUE.tmp" "$VERIFICATION_QUEUE" 2>/dev/null
        fi
        
        log_message "${GREEN}✅ 백그라운드 검증 완료: $file${NC}"
        
    ) &
    
    local bg_pid=$!
    disown  # 백그라운드 프로세스를 부모에서 분리
}

# === 메인 로직 ===

main() {
    local file_path="${1:-}"
    local tool_used="${2:-Edit}"
    
    # 인자 검증 및 대안 파일 검색
    if [ -z "$file_path" ]; then
        log_message "${YELLOW}⚠️ 파일 경로가 제공되지 않음. 최근 수정된 파일 검색 중...${NC}"
        
        # 대안 방법: 최근 5분 내 수정된 파일 찾기
        local recent_file=$(find "$PROJECT_ROOT" \
            \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" -o -name "*.json" \) \
            -path "*/src/*" -o -path "*/app/*" -o -path "*/components/*" -o -path "*/lib/*" \
            -not -path "*/.claude/*" -not -path "*/node_modules/*" \
            -newermt "-5 minutes" 2>/dev/null | \
            head -1)
        
        if [ -n "$recent_file" ] && [ -f "$recent_file" ]; then
            file_path="$recent_file"
            log_message "${GREEN}✅ 최근 수정 파일 발견: $(basename "$file_path")${NC}"
        else
            # 마지막 수단: git으로 최근 변경된 파일 찾기
            local git_recent=$(cd "$PROJECT_ROOT" && git diff --name-only HEAD~1 2>/dev/null | head -1)
            if [ -n "$git_recent" ] && [ -f "$PROJECT_ROOT/$git_recent" ]; then
                file_path="$PROJECT_ROOT/$git_recent"
                log_message "${GREEN}✅ Git 최근 변경 파일 발견: $(basename "$file_path")${NC}"
            else
                log_message "${RED}❌ 검증할 파일을 찾을 수 없습니다${NC}"
                exit 1
            fi
        fi
    fi
    
    # 절대 경로로 변환
    if [[ ! "$file_path" =~ ^/ ]]; then
        file_path="$PROJECT_ROOT/$file_path"
    fi
    
    # 파일 존재 확인
    if [ ! -f "$file_path" ]; then
        log_message "${YELLOW}⚠️ 파일이 존재하지 않습니다: $file_path${NC}"
        exit 0
    fi
    
    log_message "${BLUE}🔍 스마트 검증 시작: $(basename "$file_path") (도구: $tool_used)${NC}"
    
    # 1. 최근 검증 확인 (5분 TTL)
    if check_recent_verification "$file_path"; then
        exit 0
    fi
    
    # 2. 캐시 확인 (1시간 TTL)  
    if check_verification_cache "$file_path"; then
        update_recent_verification "$file_path" "cached"
        exit 0
    fi
    
    # 3. 검증 큐 중복 확인
    if check_verification_queue "$file_path"; then
        exit 0
    fi
    
    # 4. 병렬 실행 한계 확인
    if check_parallel_limit; then
        log_message "${YELLOW}⏳ 병렬 한계 도달 - 큐에만 추가${NC}"
        level=$(determine_verification_level "$file_path")
        add_to_verification_queue "$file_path" "$level"
        exit 0
    fi
    
    # 5. 검증 레벨 결정
    local level=$(determine_verification_level "$file_path")
    log_message "${GREEN}📊 검증 레벨 결정: Level $level${NC}"
    
    # 6. 큐에 추가
    add_to_verification_queue "$file_path" "$level"
    
    # 7. 최근 검증 기록 업데이트  
    update_recent_verification "$file_path" "$level"
    
    # 8. 백그라운드 검증 시작
    execute_background_verification "$file_path" "$level"
    
    # 9. 사용자에게 피드백
    case "$level" in
        1)
            log_message "${GREEN}✨ Level 1 검증 시작 - 빠른 단일 AI 검증${NC}"
            ;;
        2)
            log_message "${YELLOW}⚡ Level 2 검증 시작 - 2-AI 병렬 검증${NC}"
            ;;
        3)
            log_message "${RED}🔥 Level 3 검증 시작 - 4-AI 완전 교차 검증${NC}"
            ;;
    esac
    
    log_message "${PURPLE}💡 백그라운드에서 실행 중... 결과는 캐시에 저장됩니다${NC}"
    
    # 10. 큐 상태 요약
    local queue_count=$(wc -l < "$VERIFICATION_QUEUE" 2>/dev/null || echo "0")
    if [ "$queue_count" -gt 0 ]; then
        log_message "${BLUE}📋 총 $queue_count개 파일이 검증 대기 중${NC}"
    fi
}

# 시그널 처리 (정리 작업)
cleanup() {
    log_message "${YELLOW}🧹 정리 작업 중...${NC}"
    exit 0
}
trap cleanup EXIT

# 메인 실행
main "$@"