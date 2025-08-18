#!/bin/bash

# Serena MCP SSE 모드 자동 설정 스크립트
# SSE 하트비트 문제 해결을 위한 완전 자동화 설정

set -e

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
LOG_FILE="/tmp/serena-sse-setup.log"
MCP_CONFIG="$PROJECT_ROOT/.mcp.json"
WRAPPER_PORT=9122
SERENA_PORT=9121

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 로그 함수들
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
}

# 헤더 출력
print_header() {
    echo
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}        🚀 Serena MCP SSE 모드 자동 설정 스크립트 v1.0         ${NC}"
    echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
    echo
}

# 진행률 표시
show_progress() {
    local current=$1
    local total=$2
    local step_name=$3
    local percent=$((current * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    printf "\r${BLUE}[%s%s] %d%% ${NC}%s" \
        "$(printf '█%.0s' $(seq 1 $filled))" \
        "$(printf '░%.0s' $(seq 1 $empty))" \
        "$percent" "$step_name"
}

# 단계별 진행
execute_step() {
    local step_num=$1
    local total_steps=$2
    local step_name=$3
    local step_func=$4
    
    show_progress $step_num $total_steps "$step_name"
    
    if $step_func >> "$LOG_FILE" 2>&1; then
        echo
        log_success "$step_name 완료"
        return 0
    else
        echo
        log_error "$step_name 실패"
        return 1
    fi
}

# 1. 환경 검증
validate_environment() {
    # Node.js 확인
    if ! command -v node > /dev/null; then
        log_error "Node.js가 설치되지 않았습니다"
        return 1
    fi
    
    # uvx 확인
    if ! command -v /home/skyasu/.local/bin/uvx > /dev/null; then
        log_error "uvx가 설치되지 않았습니다"
        return 1
    fi
    
    # 프로젝트 디렉토리 확인
    if [ ! -d "$PROJECT_ROOT" ]; then
        log_error "프로젝트 디렉토리가 존재하지 않습니다: $PROJECT_ROOT"
        return 1
    fi
    
    log_info "환경 검증 완료: Node.js $(node --version), uvx 사용 가능"
    return 0
}

# 2. 기존 설정 백업
backup_existing_config() {
    if [ -f "$MCP_CONFIG" ]; then
        cp "$MCP_CONFIG" "$MCP_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
        log_info "기존 MCP 설정 백업 완료"
    fi
    return 0
}

# 3. 래퍼 스크립트 실행 권한 설정
setup_wrapper_permissions() {
    local wrapper_script="$PROJECT_ROOT/scripts/serena-sse-heartbeat-wrapper.mjs"
    
    if [ -f "$wrapper_script" ]; then
        chmod +x "$wrapper_script"
        log_info "래퍼 스크립트 실행 권한 설정 완료"
    else
        log_error "래퍼 스크립트를 찾을 수 없습니다: $wrapper_script"
        return 1
    fi
    return 0
}

# 4. MCP 설정 업데이트
update_mcp_config() {
    local temp_config=$(mktemp)
    
    # jq가 있는지 확인
    if command -v jq > /dev/null; then
        # jq로 JSON 업데이트
        jq --arg port "$WRAPPER_PORT" '.mcpServers.serena = {
            "command": "node",
            "args": ["/mnt/d/cursor/openmanager-vibe-v5/scripts/serena-sse-heartbeat-wrapper.mjs"],
            "env": {
                "PROJECT_ROOT": "/mnt/d/cursor/openmanager-vibe-v5",
                "WRAPPER_PORT": $port,
                "SERENA_PORT": "9121"
            }
        }' "$MCP_CONFIG" > "$temp_config"
        
        mv "$temp_config" "$MCP_CONFIG"
        log_info "MCP 설정 업데이트 완료 (jq 사용)"
    else
        # jq가 없으면 수동으로 업데이트
        update_mcp_config_manual
    fi
    
    return 0
}

# 5. 수동 MCP 설정 업데이트
update_mcp_config_manual() {
    log_info "jq를 찾을 수 없습니다. 수동으로 MCP 설정을 업데이트합니다."
    
    # 기존 serena 설정 제거 (있다면)
    if grep -q '"serena"' "$MCP_CONFIG" 2>/dev/null; then
        sed -i '/^ *"serena": *{/,/^ *}/d' "$MCP_CONFIG"
        # 마지막 } 전에 콤마 제거
        sed -i '$ s/,$//' "$MCP_CONFIG"
    fi
    
    # 새 serena 설정 추가
    local new_serena_config='    "serena": {
      "command": "node",
      "args": [
        "/mnt/d/cursor/openmanager-vibe-v5/scripts/serena-sse-heartbeat-wrapper.mjs"
      ],
      "env": {
        "PROJECT_ROOT": "/mnt/d/cursor/openmanager-vibe-v5",
        "WRAPPER_PORT": "'$WRAPPER_PORT'",
        "SERENA_PORT": "'$SERENA_PORT'"
      }
    }'
    
    # 마지막 } 직전에 새 설정 삽입
    sed -i '/^  }$/i\
,\
'"$new_serena_config"'' "$MCP_CONFIG"
    
    log_info "수동 MCP 설정 업데이트 완료"
    return 0
}

# 6. Serena 캐시 사전 준비
prepare_serena_cache() {
    log_info "Serena 캐시 준비 중..."
    
    # Serena 명령어가 캐시되어 있는지 확인
    if timeout 30s /home/skyasu/.local/bin/uvx --from git+https://github.com/oraios/serena serena-mcp-server --help > /dev/null 2>&1; then
        log_info "Serena 캐시 준비 완료"
    else
        log_warn "Serena 캐시 준비 실패 (타임아웃), 첫 실행 시 지연될 수 있습니다"
    fi
    
    return 0
}

# 7. 포트 가용성 확인
check_port_availability() {
    if ss -tuln | grep -q ":$WRAPPER_PORT"; then
        log_warn "포트 $WRAPPER_PORT 이미 사용 중"
        WRAPPER_PORT=$((WRAPPER_PORT + 1))
        log_info "대체 포트 사용: $WRAPPER_PORT"
    fi
    
    if ss -tuln | grep -q ":$SERENA_PORT"; then
        log_warn "포트 $SERENA_PORT 이미 사용 중"
        SERENA_PORT=$((SERENA_PORT + 1))
        log_info "대체 포트 사용: $SERENA_PORT"
    fi
    
    return 0
}

# 8. 설정 검증
validate_configuration() {
    if [ -f "$MCP_CONFIG" ]; then
        if grep -q '"serena"' "$MCP_CONFIG"; then
            log_info "MCP 설정에서 Serena 구성 확인됨"
        else
            log_error "MCP 설정에 Serena 구성이 없습니다"
            return 1
        fi
    else
        log_error "MCP 설정 파일을 찾을 수 없습니다: $MCP_CONFIG"
        return 1
    fi
    
    # 래퍼 스크립트 존재 확인
    if [ ! -f "$PROJECT_ROOT/scripts/serena-sse-heartbeat-wrapper.mjs" ]; then
        log_error "래퍼 스크립트를 찾을 수 없습니다"
        return 1
    fi
    
    return 0
}

# 9. 시작 스크립트 생성
create_start_script() {
    local start_script="$PROJECT_ROOT/scripts/start-serena-sse.sh"
    
    cat > "$start_script" << EOF
#!/bin/bash

# Serena SSE 모드 시작 스크립트
# 자동 생성됨: $(date)

cd "$PROJECT_ROOT"

echo "🚀 Serena SSE 하트비트 래퍼 시작 중..."
node scripts/serena-sse-heartbeat-wrapper.mjs
EOF

    chmod +x "$start_script"
    log_info "시작 스크립트 생성 완료: $start_script"
    return 0
}

# 10. Claude Code 재시작 안내
show_final_instructions() {
    echo
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    🎉 설정 완료! 다음 단계                      ${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo
    echo -e "${YELLOW}1. Serena SSE 모드 시작:${NC}"
    echo "   ./scripts/start-serena-sse.sh"
    echo
    echo -e "${YELLOW}2. Claude Code 재시작:${NC}"
    echo "   claude api restart"
    echo
    echo -e "${YELLOW}3. MCP 연결 확인:${NC}"
    echo "   claude mcp list"
    echo
    echo -e "${CYAN}📊 모니터링 URL:${NC}"
    echo "   http://localhost:$WRAPPER_PORT/status"
    echo
    echo -e "${CYAN}📋 로그 파일:${NC}"
    echo "   $LOG_FILE"
    echo
    echo -e "${PURPLE}💡 주요 개선사항:${NC}"
    echo "   • SSE 하트비트로 5분 타임아웃 해결"
    echo "   • 자동 재연결 및 상태 모니터링"
    echo "   • 30초마다 keep-alive 메시지 전송"
    echo
    echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
    echo
}

# 메인 실행 함수
main() {
    print_header
    
    # 로그 파일 초기화
    > "$LOG_FILE"
    log_info "설정 스크립트 시작: $(date)"
    
    # 총 10단계 실행
    local total_steps=10
    local current_step=0
    
    # 단계별 실행
    execute_step $((++current_step)) $total_steps "환경 검증" validate_environment || exit 1
    execute_step $((++current_step)) $total_steps "기존 설정 백업" backup_existing_config || exit 1
    execute_step $((++current_step)) $total_steps "포트 가용성 확인" check_port_availability || exit 1
    execute_step $((++current_step)) $total_steps "래퍼 스크립트 권한 설정" setup_wrapper_permissions || exit 1
    execute_step $((++current_step)) $total_steps "MCP 설정 업데이트" update_mcp_config || exit 1
    execute_step $((++current_step)) $total_steps "Serena 캐시 준비" prepare_serena_cache || exit 1
    execute_step $((++current_step)) $total_steps "설정 검증" validate_configuration || exit 1
    execute_step $((++current_step)) $total_steps "시작 스크립트 생성" create_start_script || exit 1
    
    log_success "모든 설정 단계 완료!"
    
    # 최종 안내사항 출력
    show_final_instructions
}

# 시그널 핸들러
trap 'log_error "설정 스크립트 중단됨"; exit 130' INT TERM

# 메인 실행
main "$@"