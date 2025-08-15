#!/bin/bash

# 🚀 MCP 환경변수 설정 자동화 스크립트
# OpenManager Vibe v5 - Claude Code MCP 서버 환경 설정

set -e

echo "🔧 MCP 환경변수 설정 시작..."
echo "================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 필요한 API 키 목록
declare -A required_apis=(
    ["GITHUB_PERSONAL_ACCESS_TOKEN"]="GitHub Personal Access Token (ghp_...)"
    ["SUPABASE_ACCESS_TOKEN"]="Supabase Service Key (sbp_...)"
    ["TAVILY_API_KEY"]="Tavily Search API Key (tvly-...)"
    ["UPSTASH_REDIS_REST_URL"]="Upstash Redis REST URL (https://...)"
    ["UPSTASH_REDIS_REST_TOKEN"]="Upstash Redis REST Token"
)

# 고정 환경변수
SUPABASE_PROJECT_ID="vnswjnltnhpsueosfhmw"

# API 키 발급 방법 안내
show_api_key_guide() {
    log_info "필요한 API 키 발급 방법:"
    echo
    echo "1. 📱 GitHub Personal Access Token:"
    echo "   - 방문: https://github.com/settings/tokens"
    echo "   - 'Generate new token (classic)' 클릭"
    echo "   - 권한: repo, read:org 선택"
    echo "   - 형태: ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    echo
    echo "2. 🔐 Supabase Service Key:"
    echo "   - 방문: https://supabase.com/dashboard/account/tokens"
    echo "   - 'Generate new token' 클릭"
    echo "   - 형태: sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    echo
    echo "3. 🔍 Tavily Search API Key:"
    echo "   - 방문: https://tavily.com/"
    echo "   - 회원가입 후 API 키 발급"
    echo "   - 무료: 1000회 검색/월"
    echo "   - 형태: tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
    echo
    echo "4. 📦 Upstash Redis (선택사항):"
    echo "   - 방문: https://console.upstash.com/redis"
    echo "   - Redis 데이터베이스 생성"
    echo "   - REST URL과 Token 복사"
    echo "   - 무료: 10MB + 10,000 요청/일"
    echo
}

# 현재 환경변수 확인
check_current_env() {
    log_info "현재 환경변수 상태 확인..."
    
    local all_set=true
    for key in "${!required_apis[@]}"; do
        if [[ -n "${!key}" && "${!key}" != "dummy_"* ]]; then
            log_success "$key 설정됨"
        else
            log_warning "$key 누락 또는 더미값"
            all_set=false
        fi
    done
    
    if [[ "$all_set" == true ]]; then
        log_success "모든 환경변수가 설정되어 있습니다!"
        return 0
    else
        return 1
    fi
}

# 대화형 API 키 입력
interactive_setup() {
    log_info "대화형 API 키 설정 시작..."
    echo
    
    # 임시 환경변수 저장
    local temp_env_file="/tmp/mcp_env_$$"
    
    # 고정값 먼저 설정
    echo "export SUPABASE_PROJECT_ID=\"$SUPABASE_PROJECT_ID\"" >> "$temp_env_file"
    
    for key in "${!required_apis[@]}"; do
        local description="${required_apis[$key]}"
        local current_value="${!key}"
        
        echo -e "\n${BLUE}$key${NC} 설정:"
        echo "설명: $description"
        
        if [[ -n "$current_value" && "$current_value" != "dummy_"* ]]; then
            echo "현재값: ${current_value:0:20}..."
            read -p "새 값을 입력하거나 Enter로 현재값 유지: " new_value
            if [[ -n "$new_value" ]]; then
                echo "export $key=\"$new_value\"" >> "$temp_env_file"
            else
                echo "export $key=\"$current_value\"" >> "$temp_env_file"
            fi
        else
            read -p "API 키 입력 (건너뛰려면 Enter): " new_value
            if [[ -n "$new_value" ]]; then
                echo "export $key=\"$new_value\"" >> "$temp_env_file"
            else
                echo "export $key=\"dummy_${key,,}\"" >> "$temp_env_file"
            fi
        fi
    done
    
    echo "$temp_env_file"
}

# 환경변수를 .bashrc에 저장
save_to_bashrc() {
    local temp_env_file="$1"
    
    log_info ".bashrc에 환경변수 저장 중..."
    
    # 기존 MCP 환경변수 제거
    if grep -q "# MCP 서버 환경변수" ~/.bashrc; then
        log_info "기존 MCP 환경변수 제거 중..."
        sed -i '/# MCP 서버 환경변수/,/# MCP 환경변수 끝/d' ~/.bashrc
    fi
    
    # 새 환경변수 추가
    cat >> ~/.bashrc << 'EOF'

# MCP 서버 환경변수 (OpenManager Vibe v5)
# ==========================================
EOF
    
    cat "$temp_env_file" >> ~/.bashrc
    
    cat >> ~/.bashrc << 'EOF'

# MCP 편의 명령어
alias mcp-status="claude mcp list"
alias mcp-env="env | grep -E '(GITHUB|SUPABASE|TAVILY|UPSTASH)' | sort"
alias mcp-restart="pkill claude 2>/dev/null; claude"

# MCP 환경변수 끝
EOF
    
    # 권한 설정
    chmod 600 ~/.bashrc
    
    log_success ".bashrc에 환경변수 저장 완료"
}

# 환경변수 적용 및 확인
apply_and_verify() {
    log_info "환경변수 적용 중..."
    
    # 현재 세션에 적용
    source ~/.bashrc
    
    # 확인
    echo
    log_info "설정된 MCP 환경변수:"
    env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)" | sort | while read line; do
        key=$(echo "$line" | cut -d'=' -f1)
        value=$(echo "$line" | cut -d'=' -f2-)
        if [[ "$value" == "dummy_"* ]]; then
            echo -e "  ${YELLOW}$key${NC}=${YELLOW}$value${NC} (더미값)"
        else
            echo -e "  ${GREEN}$key${NC}=${value:0:20}..."
        fi
    done
}

# 메인 실행 함수
main() {
    echo "🚀 OpenManager Vibe v5 - MCP 환경변수 설정"
    echo "============================================="
    echo
    
    # 현재 상태 확인
    if check_current_env; then
        read -p "이미 설정된 환경변수가 있습니다. 다시 설정하시겠습니까? (y/N): " confirm
        if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
            log_info "환경변수 설정을 건너뜁니다."
            return 0
        fi
    fi
    
    # API 키 발급 방법 안내
    show_api_key_guide
    
    read -p "API 키를 준비했으면 Enter를 눌러 계속 진행하세요..."
    
    # 대화형 설정
    local temp_env_file
    temp_env_file=$(interactive_setup)
    
    # .bashrc에 저장
    save_to_bashrc "$temp_env_file"
    
    # 임시 파일 정리
    rm -f "$temp_env_file"
    
    # 적용 및 확인
    apply_and_verify
    
    echo
    log_success "🎉 MCP 환경변수 설정 완료!"
    echo
    log_info "다음 단계:"
    echo "1. Claude Code 재시작 (새 터미널에서 실행)"
    echo "2. /mcp 명령으로 연결 상태 확인"
    echo "3. 각 MCP 서버 기능 테스트"
    echo
    log_warning "⚠️  주의: 실제 API 키를 사용하지 않으면 일부 서버가 작동하지 않을 수 있습니다."
}

# 스크립트 실행
main "$@"