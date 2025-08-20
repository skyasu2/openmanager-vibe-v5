#!/bin/bash

# =============================================================================
# 📦 MCP 의존성 패키지 자동 설치 시스템 v2.0.0
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: 12개 MCP 서버 의존성 완전 자동 설치 및 관리
# 🛠️ 기능: npm + Python + 시스템 패키지 통합 관리
# 🔧 특징: 버전 관리, 오류 복구, 성능 최적화, 병렬 설치
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
readonly NC='\033[0m'

# 📋 전역 변수
readonly SCRIPT_VERSION="2.0.0"
readonly LOG_FILE="./logs/mcp-dependencies-$(date +%Y%m%d_%H%M%S).log"
readonly BACKUP_DIR="./backups/npm-global-$(date +%Y%m%d_%H%M%S)"
readonly MAX_RETRY_ATTEMPTS=3
readonly PARALLEL_JOBS=4

# 📊 설치 통계
declare -A INSTALL_STATS=(
    ["npm_total"]=0
    ["npm_success"]=0
    ["npm_failed"]=0
    ["python_total"]=0
    ["python_success"]=0
    ["python_failed"]=0
    ["system_total"]=0
    ["system_success"]=0
    ["system_failed"]=0
)

# 📦 NPM 패키지 정의 (12개 MCP 서버용)
declare -A NPM_PACKAGES=(
    # Core MCP 서버들
    ["@modelcontextprotocol/server-filesystem"]="파일시스템 MCP 서버"
    ["@modelcontextprotocol/server-memory"]="메모리 MCP 서버"
    ["@modelcontextprotocol/server-github"]="GitHub MCP 서버"
    ["@modelcontextprotocol/server-sequential-thinking"]="Thinking MCP 서버"
    
    # 외부 서비스 MCP 서버들
    ["@supabase/mcp-server-supabase@latest"]="Supabase MCP 서버"
    ["tavily-mcp"]="Tavily 웹검색 MCP 서버"
    ["@executeautomation/playwright-mcp-server"]="Playwright 자동화 MCP 서버"
    ["@upstash/context7-mcp"]="Context7 문서검색 MCP 서버"
    ["@magnusrodseth/shadcn-mcp-server"]="ShadCN UI MCP 서버"
    
    # 클라우드 MCP 서버들
    ["google-cloud-mcp"]="Google Cloud Platform MCP 서버"
)

# 🐍 Python 패키지 정의 (uvx 기반)
declare -A PYTHON_PACKAGES=(
    ["mcp-server-time"]="시간대 변환 MCP 서버"
    ["serena"]="Serena 코드 분석 MCP 서버"
)

# 🔧 시스템 패키지 정의 (필요시)
declare -A SYSTEM_PACKAGES=(
    ["curl"]="HTTP 요청 도구"
    ["jq"]="JSON 프로세서"
    ["netstat"]="네트워크 상태 확인"
    ["lsof"]="프로세스-포트 매핑"
)

print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}     📦 MCP 의존성 자동 설치 시스템 v${SCRIPT_VERSION}           ${CYAN}║${NC}"
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
        "INSTALL") echo -e "${CYAN}📦 $message${NC}" ;;
    esac
}

# 🔍 시스템 환경 진단
diagnose_system() {
    log "INFO" "🔍 시스템 환경 진단 중..."
    echo
    
    # Node.js 확인
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        log "SUCCESS" "Node.js: $node_version"
    else
        log "ERROR" "Node.js 설치되지 않음"
        return 1
    fi
    
    # npm 확인
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        log "SUCCESS" "npm: v$npm_version"
    else
        log "ERROR" "npm 설치되지 않음"
        return 1
    fi
    
    # Python/uvx 확인
    if command -v uvx &> /dev/null; then
        local uvx_version=$(uvx --version 2>/dev/null || echo "unknown")
        log "SUCCESS" "uvx: $uvx_version"
    else
        log "WARNING" "uvx 설치되지 않음 - Python MCP 서버 사용 불가"
    fi
    
    # 시스템 도구 확인
    local missing_tools=()
    for tool in curl jq; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log "WARNING" "누락된 시스템 도구: ${missing_tools[*]}"
    else
        log "SUCCESS" "필수 시스템 도구 설치됨"
    fi
    
    # 글로벌 npm 패키지 디렉토리 확인
    local npm_global_dir=$(npm config get prefix 2>/dev/null || echo "")
    if [[ -n "$npm_global_dir" && -d "$npm_global_dir" ]]; then
        log "SUCCESS" "npm 글로벌 디렉토리: $npm_global_dir"
    else
        log "WARNING" "npm 글로벌 디렉토리 확인 필요"
    fi
    
    echo
    log "SUCCESS" "시스템 환경 진단 완료"
}

# 📋 현재 설치된 패키지 확인
check_installed_packages() {
    log "INFO" "📋 설치된 패키지 확인 중..."
    echo
    
    local npm_installed=()
    local npm_missing=()
    local python_installed=()
    local python_missing=()
    
    # NPM 패키지 확인
    log "DEBUG" "NPM 글로벌 패키지 확인 중..."
    for package in "${!NPM_PACKAGES[@]}"; do
        local package_name="${package%@*}"  # @latest 제거
        if npm list -g "$package_name" &> /dev/null; then
            npm_installed+=("$package")
            log "SUCCESS" "NPM 설치됨: $package"
        else
            npm_missing+=("$package")
            log "WARNING" "NPM 누락: $package"
        fi
    done
    
    echo
    
    # Python 패키지 확인 (uvx 사용)
    if command -v uvx &> /dev/null; then
        log "DEBUG" "Python 패키지 확인 중..."
        for package in "${!PYTHON_PACKAGES[@]}"; do
            if uvx --help | grep -q "$package" 2>/dev/null || uvx "$package" --help &> /dev/null; then
                python_installed+=("$package")
                log "SUCCESS" "Python 설치됨: $package"
            else
                python_missing+=("$package")
                log "WARNING" "Python 누락: $package"
            fi
        done
    else
        log "WARNING" "uvx 없음 - Python 패키지 확인 불가"
        for package in "${!PYTHON_PACKAGES[@]}"; do
            python_missing+=("$package")
        done
    fi
    
    echo
    
    # 통계 업데이트
    INSTALL_STATS["npm_total"]=${#NPM_PACKAGES[@]}
    INSTALL_STATS["npm_success"]=${#npm_installed[@]}
    INSTALL_STATS["npm_failed"]=${#npm_missing[@]}
    INSTALL_STATS["python_total"]=${#PYTHON_PACKAGES[@]}
    INSTALL_STATS["python_success"]=${#python_installed[@]}
    INSTALL_STATS["python_failed"]=${#python_missing[@]}
    
    log "INFO" "📊 패키지 상태 요약:"
    echo -e "  ${GREEN}• NPM: ${#npm_installed[@]}/${#NPM_PACKAGES[@]} 설치됨${NC}"
    echo -e "  ${GREEN}• Python: ${#python_installed[@]}/${#PYTHON_PACKAGES[@]} 설치됨${NC}"
    
    if [[ ${#npm_missing[@]} -gt 0 ]]; then
        echo -e "  ${RED}• NPM 누락: ${npm_missing[*]}${NC}"
    fi
    
    if [[ ${#python_missing[@]} -gt 0 ]]; then
        echo -e "  ${RED}• Python 누락: ${python_missing[*]}${NC}"
    fi
    
    echo
}

# 💾 npm 글로벌 패키지 백업
backup_npm_global() {
    log "INFO" "💾 npm 글로벌 패키지 백업 중..."
    
    mkdir -p "$BACKUP_DIR"
    
    # 설치된 패키지 목록 백업
    if npm list -g --depth=0 --json > "$BACKUP_DIR/npm-global-packages.json" 2>/dev/null; then
        log "SUCCESS" "npm 글로벌 패키지 목록 백업: $BACKUP_DIR/npm-global-packages.json"
    else
        log "WARNING" "npm 글로벌 패키지 목록 백업 실패"
    fi
    
    # package.json 스타일 백업
    npm list -g --depth=0 | grep -E '^\S' | sed 's/^[└├─│ ]*//g' | grep -v '^npm@' > "$BACKUP_DIR/npm-global-list.txt" 2>/dev/null || true
    
    log "SUCCESS" "npm 백업 완료: $BACKUP_DIR"
}

# 📦 NPM 패키지 설치 함수
install_npm_package() {
    local package="$1"
    local description="$2"
    local retry_count=0
    
    log "INSTALL" "NPM 설치 중: $package"
    log "DEBUG" "설명: $description"
    
    while [[ $retry_count -lt $MAX_RETRY_ATTEMPTS ]]; do
        if npm install -g "$package" >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "NPM 설치 완료: $package"
            return 0
        else
            ((retry_count++))
            log "WARNING" "NPM 설치 실패 (시도 $retry_count/$MAX_RETRY_ATTEMPTS): $package"
            
            if [[ $retry_count -lt $MAX_RETRY_ATTEMPTS ]]; then
                log "INFO" "3초 후 재시도..."
                sleep 3
            fi
        fi
    done
    
    log "ERROR" "NPM 설치 최종 실패: $package"
    return 1
}

# 🐍 Python 패키지 설치 함수
install_python_package() {
    local package="$1"
    local description="$2"
    local retry_count=0
    
    if ! command -v uvx &> /dev/null; then
        log "ERROR" "uvx 설치되지 않음 - $package 설치 불가"
        return 1
    fi
    
    log "INSTALL" "Python 설치 중: $package"
    log "DEBUG" "설명: $description"
    
    while [[ $retry_count -lt $MAX_RETRY_ATTEMPTS ]]; do
        # uvx는 첫 실행 시 자동으로 패키지를 설치함
        if uvx "$package" --help >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "Python 설치 완료: $package"
            return 0
        else
            ((retry_count++))
            log "WARNING" "Python 설치 실패 (시도 $retry_count/$MAX_RETRY_ATTEMPTS): $package"
            
            if [[ $retry_count -lt $MAX_RETRY_ATTEMPTS ]]; then
                log "INFO" "5초 후 재시도..."
                sleep 5
            fi
        fi
    done
    
    log "ERROR" "Python 설치 최종 실패: $package"
    return 1
}

# 🔧 시스템 패키지 설치 함수
install_system_package() {
    local package="$1"
    local description="$2"
    
    if command -v "$package" &> /dev/null; then
        log "SUCCESS" "시스템 패키지 이미 설치됨: $package"
        return 0
    fi
    
    log "INSTALL" "시스템 패키지 설치 중: $package"
    log "DEBUG" "설명: $description"
    
    # 배포판별 설치 명령어
    if command -v apt-get &> /dev/null; then
        if sudo apt-get update >> "$LOG_FILE" 2>&1 && sudo apt-get install -y "$package" >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "시스템 패키지 설치 완료: $package"
            return 0
        fi
    elif command -v yum &> /dev/null; then
        if sudo yum install -y "$package" >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "시스템 패키지 설치 완료: $package"
            return 0
        fi
    elif command -v brew &> /dev/null; then
        if brew install "$package" >> "$LOG_FILE" 2>&1; then
            log "SUCCESS" "시스템 패키지 설치 완료: $package"
            return 0
        fi
    fi
    
    log "ERROR" "시스템 패키지 설치 실패: $package"
    return 1
}

# 🚀 병렬 NPM 패키지 설치
install_npm_packages_parallel() {
    log "INFO" "🚀 NPM 패키지 병렬 설치 시작..."
    echo
    
    local pids=()
    local success_count=0
    local total_packages=${#NPM_PACKAGES[@]}
    
    # 백업 생성
    backup_npm_global
    
    # 병렬 설치 시작
    for package in "${!NPM_PACKAGES[@]}"; do
        local description="${NPM_PACKAGES[$package]}"
        
        # 이미 설치된 패키지 스킵
        local package_name="${package%@*}"
        if npm list -g "$package_name" &> /dev/null; then
            log "INFO" "이미 설치됨 - 스킵: $package"
            ((success_count++))
            continue
        fi
        
        # 병렬 작업 수 제한
        while [[ ${#pids[@]} -ge $PARALLEL_JOBS ]]; do
            for i in "${!pids[@]}"; do
                if ! kill -0 "${pids[$i]}" 2>/dev/null; then
                    wait "${pids[$i]}"
                    local exit_code=$?
                    if [[ $exit_code -eq 0 ]]; then
                        ((success_count++))
                    fi
                    unset "pids[$i]"
                fi
            done
            pids=("${pids[@]}")  # 배열 재정렬
            sleep 1
        done
        
        # 백그라운드에서 설치
        install_npm_package "$package" "$description" &
        pids+=($!)
    done
    
    # 모든 작업 완료 대기
    for pid in "${pids[@]}"; do
        wait "$pid"
        local exit_code=$?
        if [[ $exit_code -eq 0 ]]; then
            ((success_count++))
        fi
    done
    
    echo
    log "INFO" "📊 NPM 설치 결과: $success_count/$total_packages 성공"
    
    if [[ $success_count -eq $total_packages ]]; then
        log "SUCCESS" "모든 NPM 패키지 설치 완료"
        return 0
    else
        log "WARNING" "$((total_packages - success_count))개 NPM 패키지 설치 실패"
        return 1
    fi
}

# 🐍 Python 패키지 설치 실행
install_python_packages() {
    log "INFO" "🐍 Python 패키지 설치 시작..."
    echo
    
    if ! command -v uvx &> /dev/null; then
        log "ERROR" "uvx 설치되지 않음 - Python 패키지 설치 불가"
        echo -e "${CYAN}💡 uvx 설치 방법:${NC}"
        echo "  curl -LsSf https://astral.sh/uv/install.sh | sh"
        echo "  source ~/.bashrc"
        return 1
    fi
    
    local success_count=0
    local total_packages=${#PYTHON_PACKAGES[@]}
    
    for package in "${!PYTHON_PACKAGES[@]}"; do
        local description="${PYTHON_PACKAGES[$package]}"
        
        if install_python_package "$package" "$description"; then
            ((success_count++))
        fi
    done
    
    echo
    log "INFO" "📊 Python 설치 결과: $success_count/$total_packages 성공"
    
    if [[ $success_count -eq $total_packages ]]; then
        log "SUCCESS" "모든 Python 패키지 설치 완료"
        return 0
    else
        log "WARNING" "$((total_packages - success_count))개 Python 패키지 설치 실패"
        return 1
    fi
}

# 🔧 시스템 패키지 설치 실행
install_system_packages() {
    log "INFO" "🔧 시스템 패키지 확인 중..."
    echo
    
    local missing_packages=()
    
    # 누락된 패키지 확인
    for package in "${!SYSTEM_PACKAGES[@]}"; do
        if ! command -v "$package" &> /dev/null; then
            missing_packages+=("$package")
        fi
    done
    
    if [[ ${#missing_packages[@]} -eq 0 ]]; then
        log "SUCCESS" "모든 시스템 패키지 설치됨"
        return 0
    fi
    
    log "INFO" "누락된 시스템 패키지: ${missing_packages[*]}"
    
    local success_count=0
    
    for package in "${missing_packages[@]}"; do
        local description="${SYSTEM_PACKAGES[$package]}"
        
        if install_system_package "$package" "$description"; then
            ((success_count++))
        fi
    done
    
    echo
    log "INFO" "📊 시스템 패키지 설치 결과: $success_count/${#missing_packages[@]} 성공"
    
    if [[ $success_count -eq ${#missing_packages[@]} ]]; then
        log "SUCCESS" "모든 시스템 패키지 설치 완료"
        return 0
    else
        log "WARNING" "$((${#missing_packages[@]} - success_count))개 시스템 패키지 설치 실패"
        return 1
    fi
}

# 🧪 설치 검증
verify_installation() {
    log "INFO" "🧪 설치 검증 중..."
    echo
    
    local npm_verified=0
    local python_verified=0
    local total_npm=${#NPM_PACKAGES[@]}
    local total_python=${#PYTHON_PACKAGES[@]}
    
    # NPM 패키지 검증
    for package in "${!NPM_PACKAGES[@]}"; do
        local package_name="${package%@*}"
        if npm list -g "$package_name" &> /dev/null; then
            ((npm_verified++))
            log "SUCCESS" "NPM 검증 통과: $package"
        else
            log "ERROR" "NPM 검증 실패: $package"
        fi
    done
    
    # Python 패키지 검증
    if command -v uvx &> /dev/null; then
        for package in "${!PYTHON_PACKAGES[@]}"; do
            if uvx "$package" --help &> /dev/null; then
                ((python_verified++))
                log "SUCCESS" "Python 검증 통과: $package"
            else
                log "ERROR" "Python 검증 실패: $package"
            fi
        done
    else
        log "WARNING" "uvx 없음 - Python 패키지 검증 불가"
    fi
    
    echo
    log "INFO" "📊 검증 결과:"
    echo -e "  ${GREEN}• NPM: $npm_verified/$total_npm 검증됨${NC}"
    echo -e "  ${GREEN}• Python: $python_verified/$total_python 검증됨${NC}"
    
    local total_expected=$((total_npm + total_python))
    local total_verified=$((npm_verified + python_verified))
    
    if [[ $total_verified -eq $total_expected ]]; then
        log "SUCCESS" "모든 패키지 검증 통과"
        return 0
    else
        log "WARNING" "$((total_expected - total_verified))개 패키지 검증 실패"
        return 1
    fi
}

# 📊 최종 리포트 생성
generate_final_report() {
    echo
    log "INFO" "📊 설치 완료 리포트 생성 중..."
    echo
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}               📦 MCP 의존성 설치 완료 리포트                  ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # 설치 통계
    echo -e "${BLUE}📊 설치 통계:${NC}"
    echo -e "  ${GREEN}• NPM 패키지: ${INSTALL_STATS[npm_success]}/${INSTALL_STATS[npm_total]} 성공${NC}"
    echo -e "  ${GREEN}• Python 패키지: ${INSTALL_STATS[python_success]}/${INSTALL_STATS[python_total]} 성공${NC}"
    echo -e "  ${GREEN}• 시스템 패키지: ${INSTALL_STATS[system_success]}/${INSTALL_STATS[system_total]} 성공${NC}"
    
    # 파일 정보
    echo
    echo -e "${BLUE}📁 생성된 파일:${NC}"
    echo -e "  ${CYAN}• 로그 파일: $LOG_FILE${NC}"
    if [[ -d "$BACKUP_DIR" ]]; then
        echo -e "  ${CYAN}• 백업 디렉토리: $BACKUP_DIR${NC}"
    fi
    
    # 다음 단계
    echo
    echo -e "${BLUE}🔧 다음 단계:${NC}"
    echo "  1. MCP 서버 상태 확인: claude mcp list"
    echo "  2. 전체 복구 실행: ./scripts/mcp-recovery-complete.sh"
    echo "  3. 환경변수 설정: ./scripts/mcp-env-recovery.sh"
    echo "  4. Serena SSE 시작: ./scripts/serena-auto-recovery.sh start"
    
    # 문제 해결
    if [[ ${INSTALL_STATS[npm_failed]} -gt 0 || ${INSTALL_STATS[python_failed]} -gt 0 ]]; then
        echo
        echo -e "${YELLOW}⚠️  설치 실패 패키지가 있습니다:${NC}"
        echo "  • 로그 확인: cat $LOG_FILE | grep ERROR"
        echo "  • 수동 재시도: npm install -g <package-name>"
        echo "  • 권한 문제: sudo chown -R $(whoami) ~/.npm"
    fi
    
    echo
}

# 📋 패키지 목록 출력
list_packages() {
    echo -e "${CYAN}📦 MCP 의존성 패키지 목록${NC}"
    echo
    
    echo -e "${WHITE}NPM 패키지 (${#NPM_PACKAGES[@]}개):${NC}"
    for package in "${!NPM_PACKAGES[@]}"; do
        echo -e "  ${BLUE}• $package${NC}: ${NPM_PACKAGES[$package]}"
    done
    
    echo
    echo -e "${WHITE}Python 패키지 (${#PYTHON_PACKAGES[@]}개):${NC}"
    for package in "${!PYTHON_PACKAGES[@]}"; do
        echo -e "  ${BLUE}• $package${NC}: ${PYTHON_PACKAGES[$package]}"
    done
    
    echo
    echo -e "${WHITE}시스템 패키지 (${#SYSTEM_PACKAGES[@]}개):${NC}"
    for package in "${!SYSTEM_PACKAGES[@]}"; do
        echo -e "  ${BLUE}• $package${NC}: ${SYSTEM_PACKAGES[$package]}"
    done
    echo
}

# 도움말 출력
show_help() {
    echo -e "${CYAN}📦 MCP 의존성 자동 설치 시스템 v${SCRIPT_VERSION}${NC}"
    echo
    echo -e "${WHITE}사용법:${NC}"
    echo "  $0 [명령] [옵션]"
    echo
    echo -e "${WHITE}명령:${NC}"
    echo "  install     모든 의존성 패키지 설치 (기본값)"
    echo "  npm         NPM 패키지만 설치"
    echo "  python      Python 패키지만 설치"
    echo "  system      시스템 패키지만 설치"
    echo "  check       설치된 패키지 확인"
    echo "  list        설치할 패키지 목록 출력"
    echo "  verify      설치 검증"
    echo "  clean       캐시 및 임시 파일 정리"
    echo
    echo -e "${WHITE}옵션:${NC}"
    echo "  --force     강제 재설치"
    echo "  --no-backup 백업 생성 안 함"
    echo "  --verbose   상세 로그 출력"
    echo "  --parallel N 병렬 작업 수 (기본값: 4)"
    echo
    echo -e "${WHITE}예시:${NC}"
    echo "  $0                    # 모든 패키지 설치"
    echo "  $0 npm                # NPM 패키지만 설치"
    echo "  $0 check              # 설치 상태 확인"
    echo "  $0 install --force    # 강제 재설치"
    echo
}

# 🚀 메인 실행 함수
main() {
    local command="${1:-install}"
    local force_mode=false
    local no_backup=false
    local verbose_mode=false
    
    # 옵션 파싱
    while [[ $# -gt 0 ]]; do
        case "${1:-}" in
            "--force")
                force_mode=true
                shift
                ;;
            "--no-backup")
                no_backup=true
                shift
                ;;
            "--verbose")
                verbose_mode=true
                shift
                ;;
            "--parallel")
                PARALLEL_JOBS="${2:-4}"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # 헤더 출력
    if [[ "$command" != "list" ]]; then
        print_header
    fi
    
    # 명령 실행
    case "$command" in
        "install")
            diagnose_system
            check_installed_packages
            install_system_packages
            install_npm_packages_parallel
            install_python_packages
            verify_installation
            generate_final_report
            ;;
        "npm")
            diagnose_system
            install_npm_packages_parallel
            ;;
        "python")
            diagnose_system
            install_python_packages
            ;;
        "system")
            diagnose_system
            install_system_packages
            ;;
        "check")
            diagnose_system
            check_installed_packages
            ;;
        "list")
            list_packages
            ;;
        "verify")
            verify_installation
            ;;
        "clean")
            log "INFO" "캐시 및 임시 파일 정리 중..."
            npm cache clean --force &>/dev/null || true
            rm -f /tmp/npm-* 2>/dev/null || true
            log "SUCCESS" "정리 완료"
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 명령: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    case "${1:-}" in
        "--help"|"-h")
            show_help
            ;;
        *)
            main "$@"
            ;;
    esac
fi