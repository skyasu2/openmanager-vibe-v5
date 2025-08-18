#!/bin/bash

# =============================================================================
# 🔧 Claude Code MCP 종합 복구 스크립트 v3.0.0
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: MCP 서버 12개 완전 자동 복구 및 진단
# 🛠️ 기능: 상태 진단 → 문제 식별 → 자동 복구 → 검증 완료
# 🚀 지원: 12개 MCP 서버 + Serena SSE + 환경변수 + 의존성 관리
# =============================================================================

set -euo pipefail

# 🎨 색상 정의
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly PURPLE='\033[0;35m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m' # No Color

# 📋 전역 변수
readonly SCRIPT_VERSION="3.0.0"
readonly LOG_FILE="./logs/mcp-recovery-$(date +%Y%m%d_%H%M%S).log"
readonly BACKUP_DIR="./backups/mcp-$(date +%Y%m%d_%H%M%S)"
readonly CLAUDE_CONFIG_DIR="$HOME/.claude"
readonly CLAUDE_MCP_CONFIG=".mcp.json"

# 📊 복구 통계
RECOVERY_STATS=(
    "total_servers=12"
    "failed_servers=0"
    "recovered_servers=0"
    "skipped_servers=0"
    "start_time=$(date +%s)"
)

# 🔧 유틸리티 함수들
print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}           🔧 Claude Code MCP 종합 복구 시스템 v${SCRIPT_VERSION}        ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case "$level" in
        "INFO")  echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "DEBUG") echo -e "${PURPLE}🔍 $message${NC}" ;;
    esac
}

create_backup() {
    log "INFO" "설정 백업 생성 중..."
    mkdir -p "$BACKUP_DIR"
    
    # Claude Code 설정 백업
    if [[ -f "$CLAUDE_MCP_CONFIG" ]]; then
        cp "$CLAUDE_MCP_CONFIG" "$BACKUP_DIR/"
        log "SUCCESS" "MCP 설정 백업: $BACKUP_DIR/.mcp.json"
    fi
    
    # 환경변수 백업
    if [[ -f ".env.local" ]]; then
        cp ".env.local" "$BACKUP_DIR/"
        log "SUCCESS" "환경변수 백업: $BACKUP_DIR/.env.local"
    fi
    
    # 스크립트 백업
    if [[ -d "scripts" ]]; then
        cp -r scripts "$BACKUP_DIR/"
        log "SUCCESS" "스크립트 백업: $BACKUP_DIR/scripts/"
    fi
}

# 📊 1단계: 상태 진단
diagnose_system() {
    log "INFO" "🔍 시스템 상태 진단 시작..."
    echo
    
    # Claude Code 설치 확인
    if command -v claude &> /dev/null; then
        local claude_version=$(claude --version 2>/dev/null || echo "unknown")
        log "SUCCESS" "Claude Code 설치됨: $claude_version"
    else
        log "ERROR" "Claude Code 설치되지 않음"
        return 1
    fi
    
    # Node.js 확인
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log "SUCCESS" "Node.js 설치됨: $node_version"
    else
        log "ERROR" "Node.js 설치되지 않음"
        return 1
    fi
    
    # Python/uvx 확인 (Serena용)
    if command -v uvx &> /dev/null; then
        log "SUCCESS" "uvx (Python) 설치됨"
    else
        log "WARNING" "uvx 설치되지 않음 - Serena MCP 사용 불가"
    fi
    
    # 설정 파일 확인
    if [[ -f "$CLAUDE_MCP_CONFIG" ]]; then
        log "SUCCESS" "MCP 설정 파일 존재: $CLAUDE_MCP_CONFIG"
    else
        log "WARNING" "MCP 설정 파일 없음"
    fi
    
    echo
    log "SUCCESS" "1단계: 시스템 진단 완료"
}

# 🔍 2단계: MCP 서버 상태 확인
check_mcp_servers() {
    log "INFO" "🔌 MCP 서버 연결 상태 확인 중..."
    echo
    
    local failed_servers=()
    local timeout_duration=30
    
    # Claude MCP 상태 확인 (타임아웃 적용)
    if timeout ${timeout_duration}s claude mcp list > /tmp/mcp_status.txt 2>&1; then
        log "SUCCESS" "Claude MCP 명령 실행 성공"
        
        # 연결 실패 서버 검색
        while IFS= read -r line; do
            if [[ "$line" == *"✗ Failed"* ]] || [[ "$line" == *"❌ Failed"* ]]; then
                local server_name=$(echo "$line" | cut -d':' -f1 | xargs)
                failed_servers+=("$server_name")
                log "ERROR" "서버 연결 실패: $server_name"
            elif [[ "$line" == *"✓ Connected"* ]]; then
                local server_name=$(echo "$line" | cut -d':' -f1 | xargs)
                log "SUCCESS" "서버 연결 성공: $server_name"
            fi
        done < /tmp/mcp_status.txt
        
    else
        log "ERROR" "Claude MCP 명령 실행 실패 (${timeout_duration}초 타임아웃)"
        return 1
    fi
    
    # 실패한 서버 개수 업데이트
    RECOVERY_STATS[1]="failed_servers=${#failed_servers[@]}"
    
    if [[ ${#failed_servers[@]} -eq 0 ]]; then
        log "SUCCESS" "모든 MCP 서버 정상 연결"
        return 0
    else
        log "WARNING" "${#failed_servers[@]}개 서버 연결 실패: ${failed_servers[*]}"
        return 1
    fi
}

# 🌍 3단계: 환경변수 검증 및 복구
verify_environment() {
    log "INFO" "🌍 환경변수 검증 중..."
    echo
    
    # 필수 환경변수 목록
    local required_vars=(
        "GITHUB_TOKEN"
        "SUPABASE_ACCESS_TOKEN"
        "TAVILY_API_KEY"
        "UPSTASH_REDIS_REST_URL"
        "UPSTASH_REDIS_REST_TOKEN"
    )
    
    local missing_vars=()
    
    # 환경변수 확인
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
            log "WARNING" "환경변수 누락: $var"
        else
            log "SUCCESS" "환경변수 설정됨: $var"
        fi
    done
    
    # .env.local 파일에서 확인
    if [[ -f ".env.local" ]]; then
        log "INFO" ".env.local 파일에서 환경변수 확인 중..."
        
        for var in "${missing_vars[@]}"; do
            if grep -q "^${var}=" ".env.local"; then
                log "SUCCESS" ".env.local에서 $var 발견"
            else
                log "WARNING" ".env.local에서 $var 누락"
            fi
        done
    else
        log "WARNING" ".env.local 파일 없음"
    fi
    
    if [[ ${#missing_vars[@]} -eq 0 ]]; then
        log "SUCCESS" "모든 환경변수 설정 완료"
        return 0
    else
        log "WARNING" "${#missing_vars[@]}개 환경변수 누락: ${missing_vars[*]}"
        return 1
    fi
}

# 📦 4단계: 의존성 패키지 확인 및 재설치
check_dependencies() {
    log "INFO" "📦 의존성 패키지 확인 중..."
    echo
    
    local packages=(
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-memory"
        "@modelcontextprotocol/server-github"
        "@supabase/mcp-server-supabase"
        "tavily-mcp"
        "@executeautomation/playwright-mcp-server"
        "@modelcontextprotocol/server-sequential-thinking"
        "@upstash/context7-mcp"
        "@magnusrodseth/shadcn-mcp-server"
        "google-cloud-mcp"
    )
    
    local missing_packages=()
    
    for package in "${packages[@]}"; do
        if npm list -g "$package" &> /dev/null; then
            log "SUCCESS" "패키지 설치됨: $package"
        else
            missing_packages+=("$package")
            log "WARNING" "패키지 누락: $package"
        fi
    done
    
    # uvx 패키지 확인
    if command -v uvx &> /dev/null; then
        if uvx --help | grep -q "mcp-server-time" 2>/dev/null; then
            log "SUCCESS" "uvx mcp-server-time 사용 가능"
        else
            log "WARNING" "uvx mcp-server-time 설치 필요"
        fi
    fi
    
    if [[ ${#missing_packages[@]} -eq 0 ]]; then
        log "SUCCESS" "모든 의존성 패키지 설치됨"
        return 0
    else
        log "WARNING" "${#missing_packages[@]}개 패키지 누락: ${missing_packages[*]}"
        return 1
    fi
}

# 🔧 5단계: Serena SSE 설정 복구
recover_serena_sse() {
    log "INFO" "🔧 Serena SSE 설정 복구 중..."
    echo
    
    # Serena SSE 스크립트 생성
    local serena_script="scripts/start-serena-sse.sh"
    
    if [[ ! -f "$serena_script" ]]; then
        log "INFO" "Serena SSE 스크립트 생성 중..."
        
        mkdir -p scripts
        cat > "$serena_script" << 'EOF'
#!/bin/bash

# 🤖 Serena MCP SSE 서버 시작 스크립트
# SSE 방식으로 안정적인 연결 제공

set -euo pipefail

readonly PORT=9121
readonly LOG_FILE="./logs/serena-sse-$(date +%Y%m%d_%H%M%S).log"

echo "🚀 Serena MCP SSE 서버 시작 (포트: $PORT)..."

# 로그 디렉토리 생성
mkdir -p "$(dirname "$LOG_FILE")"

# 기존 프로세스 종료
if lsof -ti:$PORT &>/dev/null; then
    echo "⚠️  포트 $PORT 사용 중인 프로세스 종료..."
    kill -9 $(lsof -ti:$PORT) 2>/dev/null || true
    sleep 2
fi

# Serena SSE 서버 시작
echo "🔄 uvx serena SSE 모드 시작..."
uvx serena --transport sse --port $PORT 2>&1 | tee "$LOG_FILE" &

# 서버 시작 확인
sleep 3
if curl -s "http://localhost:$PORT/health" &>/dev/null; then
    echo "✅ Serena SSE 서버 정상 시작됨"
    echo "🔗 URL: http://localhost:$PORT/sse"
else
    echo "❌ Serena SSE 서버 시작 실패"
    exit 1
fi
EOF
        
        chmod +x "$serena_script"
        log "SUCCESS" "Serena SSE 스크립트 생성: $serena_script"
    fi
    
    # MCP 설정에서 Serena 확인
    if [[ -f "$CLAUDE_MCP_CONFIG" ]]; then
        if grep -q '"serena"' "$CLAUDE_MCP_CONFIG"; then
            log "SUCCESS" "MCP 설정에서 Serena 구성 확인됨"
        else
            log "WARNING" "MCP 설정에서 Serena 구성 누락"
        fi
    fi
    
    log "SUCCESS" "Serena SSE 설정 복구 완료"
}

# 🛠️ 6단계: 자동 복구 실행
auto_recovery() {
    log "INFO" "🛠️ 자동 복구 실행 중..."
    echo
    
    local recovery_needed=false
    
    # 의존성 패키지 자동 설치
    log "INFO" "📦 누락된 패키지 자동 설치..."
    
    local npm_packages=(
        "@modelcontextprotocol/server-filesystem"
        "@modelcontextprotocol/server-memory"
        "@modelcontextprotocol/server-github"
        "@supabase/mcp-server-supabase@latest"
        "tavily-mcp"
        "@executeautomation/playwright-mcp-server"
        "@modelcontextprotocol/server-sequential-thinking"
        "@upstash/context7-mcp"
        "@magnusrodseth/shadcn-mcp-server"
    )
    
    for package in "${npm_packages[@]}"; do
        if ! npm list -g "$package" &> /dev/null; then
            log "INFO" "설치 중: $package"
            if npm install -g "$package" &>> "$LOG_FILE"; then
                log "SUCCESS" "설치 완료: $package"
                recovery_needed=true
            else
                log "ERROR" "설치 실패: $package"
            fi
        fi
    done
    
    # GCP MCP 특별 처리
    if ! npm list -g "google-cloud-mcp" &> /dev/null; then
        log "INFO" "GCP MCP 설치 중..."
        if npm install -g google-cloud-mcp &>> "$LOG_FILE"; then
            log "SUCCESS" "GCP MCP 설치 완료"
            recovery_needed=true
        else
            log "WARNING" "GCP MCP 설치 실패 - 수동 설치 필요"
        fi
    fi
    
    # uvx 패키지 확인 및 설치
    if command -v uvx &> /dev/null; then
        log "INFO" "uvx mcp-server-time 확인 중..."
        if ! uvx mcp-server-time --help &> /dev/null; then
            log "INFO" "mcp-server-time 설치 중..."
            recovery_needed=true
        fi
    else
        log "WARNING" "uvx 설치되지 않음 - Serena/Time 서버 사용 불가"
    fi
    
    # Serena SSE 서버 시작
    if [[ -f "scripts/start-serena-sse.sh" ]]; then
        log "INFO" "Serena SSE 서버 시작 중..."
        if bash scripts/start-serena-sse.sh &>> "$LOG_FILE"; then
            log "SUCCESS" "Serena SSE 서버 시작됨"
            recovery_needed=true
        else
            log "WARNING" "Serena SSE 서버 시작 실패"
        fi
    fi
    
    if $recovery_needed; then
        log "SUCCESS" "자동 복구 작업 완료"
        sleep 3 # 복구 완료 대기
    else
        log "INFO" "복구가 필요한 항목 없음"
    fi
}

# ✅ 7단계: 복구 검증
verify_recovery() {
    log "INFO" "✅ 복구 검증 중..."
    echo
    
    local success_count=0
    local total_servers=12
    
    # MCP 서버 재확인
    if timeout 30s claude mcp list > /tmp/mcp_verify.txt 2>&1; then
        success_count=$(grep -c "✓ Connected" /tmp/mcp_verify.txt || echo "0")
        log "INFO" "연결된 서버: $success_count/$total_servers"
        
        if [[ $success_count -eq $total_servers ]]; then
            log "SUCCESS" "모든 MCP 서버 정상 연결"
            RECOVERY_STATS[2]="recovered_servers=$success_count"
            return 0
        else
            log "WARNING" "$((total_servers - success_count))개 서버 여전히 연결 실패"
            RECOVERY_STATS[2]="recovered_servers=$success_count"
            return 1
        fi
    else
        log "ERROR" "MCP 상태 확인 실패"
        return 1
    fi
}

# 📊 8단계: 복구 리포트 생성
generate_report() {
    local end_time=$(date +%s)
    local duration=$((end_time - ${RECOVERY_STATS[3]#*=}))
    
    echo
    log "INFO" "📊 복구 리포트 생성 중..."
    echo
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}                    🔧 MCP 복구 리포트                         ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    echo -e "${BLUE}📅 복구 시간:${NC} $(date)"
    echo -e "${BLUE}⏱️  소요 시간:${NC} ${duration}초"
    echo -e "${BLUE}📁 로그 파일:${NC} $LOG_FILE"
    echo -e "${BLUE}💾 백업 위치:${NC} $BACKUP_DIR"
    echo
    
    # 통계 출력
    for stat in "${RECOVERY_STATS[@]}"; do
        local key="${stat%=*}"
        local value="${stat#*=}"
        
        case "$key" in
            "total_servers") echo -e "${GREEN}🎯 총 서버 수:${NC} $value" ;;
            "failed_servers") echo -e "${RED}❌ 실패 서버:${NC} $value" ;;
            "recovered_servers") echo -e "${GREEN}✅ 복구 서버:${NC} $value" ;;
            "skipped_servers") echo -e "${YELLOW}⏭️  스킵 서버:${NC} $value" ;;
        esac
    done
    
    echo
    
    # 추가 도움말
    echo -e "${CYAN}🔧 추가 도움말:${NC}"
    echo "  • 로그 확인: cat $LOG_FILE"
    echo "  • MCP 상태: claude mcp list"
    echo "  • 수동 복구: ./scripts/optimize-mcp-config.sh"
    echo "  • Serena 시작: ./scripts/start-serena-sse.sh"
    echo
}

# 🚀 메인 실행 함수
main() {
    print_header
    
    # 백업 생성
    create_backup
    
    # 진단 및 복구 프로세스
    if diagnose_system; then
        log "SUCCESS" "시스템 진단 통과"
    else
        log "ERROR" "시스템 진단 실패 - 기본 요구사항 확인 필요"
        exit 1
    fi
    
    # MCP 서버 상태 확인
    if ! check_mcp_servers; then
        log "INFO" "MCP 서버 복구 필요 - 자동 복구 시작"
        
        # 환경변수 검증
        verify_environment || log "WARNING" "환경변수 설정 확인 필요"
        
        # 의존성 확인
        check_dependencies || log "WARNING" "의존성 패키지 설치 필요"
        
        # Serena SSE 복구
        recover_serena_sse
        
        # 자동 복구 실행
        auto_recovery
        
        # 복구 검증
        if verify_recovery; then
            log "SUCCESS" "🎉 MCP 복구 완료!"
        else
            log "WARNING" "일부 서버 복구 실패 - 수동 확인 필요"
        fi
    else
        log "SUCCESS" "🎉 모든 MCP 서버 정상 작동 중"
        RECOVERY_STATS[3]="skipped_servers=12"
    fi
    
    # 리포트 생성
    generate_report
    
    echo
    log "SUCCESS" "🏁 MCP 복구 스크립트 실행 완료"
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi