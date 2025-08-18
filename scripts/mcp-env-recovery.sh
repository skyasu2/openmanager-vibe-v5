#!/bin/bash

# =============================================================================
# 🌍 MCP 환경변수 복구 스크립트 v2.0.0
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: MCP 서버용 환경변수 완전 검증 및 자동 복구
# 🛠️ 기능: 누락된 환경변수 탐지 → 템플릿 제공 → 자동 설정
# =============================================================================

set -euo pipefail

# 🎨 색상 정의
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly WHITE='\033[1;37m'
readonly NC='\033[0m'

# 📋 전역 변수
readonly SCRIPT_VERSION="2.0.0"
readonly ENV_FILE=".env.local"
readonly ENV_TEMPLATE="env.local.template"
readonly BACKUP_ENV=".env.local.backup.$(date +%Y%m%d_%H%M%S)"

# 🔑 필수 환경변수 정의 (기존 EnhancedEnvCryptoManager 통합)
declare -A REQUIRED_VARS=(
    ["GITHUB_TOKEN"]="GitHub API 접근을 위한 개인 액세스 토큰"
    ["SUPABASE_ACCESS_TOKEN"]="Supabase 프로젝트 관리를 위한 액세스 토큰"
    ["SUPABASE_PROJECT_ID"]="Supabase 프로젝트 ID"
    ["TAVILY_API_KEY"]="Tavily 웹 검색 API 키"
    ["UPSTASH_REDIS_REST_URL"]="Upstash Redis REST API URL"
    ["UPSTASH_REDIS_REST_TOKEN"]="Upstash Redis REST API 토큰"
    ["GOOGLE_CLOUD_PROJECT"]="Google Cloud 프로젝트 ID (GCP MCP용)"
)

# 🔐 기존 암호화 시스템 통합
readonly CRYPTO_SCRIPT="scripts/core/env-manager.mjs"
readonly ENCRYPTED_CONFIG="config/encrypted-env-config.ts"

# 🔧 선택적 환경변수
declare -A OPTIONAL_VARS=(
    ["OPENAI_API_KEY"]="OpenAI API 키 (GPT 모델 사용시)"
    ["ANTHROPIC_API_KEY"]="Anthropic API 키 (Claude 모델 사용시)"
    ["VERCEL_TOKEN"]="Vercel 배포 자동화용 토큰"
    ["NEXTAUTH_SECRET"]="NextAuth.js 암호화 시크릿"
    ["NEXTAUTH_URL"]="NextAuth.js 콜백 URL"
)

print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}        🌍 MCP 환경변수 복구 시스템 v${SCRIPT_VERSION}              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

log() {
    local level="$1"
    shift
    local message="$*"
    
    case "$level" in
        "INFO")  echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "DEBUG") echo -e "${CYAN}🔍 $message${NC}" ;;
    esac
}

# 📊 현재 환경변수 상태 진단
diagnose_environment() {
    log "INFO" "🔍 환경변수 상태 진단 중..."
    echo
    
    local missing_required=()
    local missing_optional=()
    local found_required=()
    local found_optional=()
    
    # 필수 환경변수 확인
    for var in "${!REQUIRED_VARS[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            found_required+=("$var")
            log "SUCCESS" "필수 변수 설정됨: $var"
        else
            missing_required+=("$var")
            log "ERROR" "필수 변수 누락: $var"
        fi
    done
    
    echo
    
    # 선택적 환경변수 확인
    for var in "${!OPTIONAL_VARS[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            found_optional+=("$var")
            log "SUCCESS" "선택적 변수 설정됨: $var"
        else
            missing_optional+=("$var")
            log "WARNING" "선택적 변수 누락: $var"
        fi
    done
    
    echo
    log "INFO" "📊 진단 결과:"
    echo -e "  ${GREEN}• 필수 변수: ${#found_required[@]}/${#REQUIRED_VARS[@]} 설정됨${NC}"
    echo -e "  ${YELLOW}• 선택적 변수: ${#found_optional[@]}/${#OPTIONAL_VARS[@]} 설정됨${NC}"
    
    if [[ ${#missing_required[@]} -gt 0 ]]; then
        echo -e "  ${RED}• 누락된 필수 변수: ${missing_required[*]}${NC}"
        return 1
    else
        log "SUCCESS" "모든 필수 환경변수 설정 완료"
        return 0
    fi
}

# 📄 .env.local 파일 분석
analyze_env_file() {
    log "INFO" "📄 .env.local 파일 분석 중..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log "WARNING" ".env.local 파일이 존재하지 않습니다"
        return 1
    fi
    
    local file_vars=()
    local commented_vars=()
    local empty_vars=()
    
    while IFS= read -r line; do
        # 주석 처리된 변수
        if [[ "$line" =~ ^#.*= ]]; then
            local var_name=$(echo "$line" | sed 's/^#\s*//' | cut -d'=' -f1)
            commented_vars+=("$var_name")
        # 빈 값 변수
        elif [[ "$line" =~ ^[A-Z_]+=\s*$ ]]; then
            local var_name=$(echo "$line" | cut -d'=' -f1)
            empty_vars+=("$var_name")
        # 정상 변수
        elif [[ "$line" =~ ^[A-Z_]+=.+ ]]; then
            local var_name=$(echo "$line" | cut -d'=' -f1)
            file_vars+=("$var_name")
        fi
    done < "$ENV_FILE"
    
    log "SUCCESS" ".env.local 분석 완료"
    echo -e "  ${GREEN}• 설정된 변수: ${#file_vars[@]}개${NC}"
    echo -e "  ${YELLOW}• 주석 처리된 변수: ${#commented_vars[@]}개${NC}"
    echo -e "  ${RED}• 빈 값 변수: ${#empty_vars[@]}개${NC}"
    
    if [[ ${#commented_vars[@]} -gt 0 ]]; then
        echo -e "  ${YELLOW}주석 처리된 변수: ${commented_vars[*]}${NC}"
    fi
    
    if [[ ${#empty_vars[@]} -gt 0 ]]; then
        echo -e "  ${RED}빈 값 변수: ${empty_vars[*]}${NC}"
    fi
    
    echo
}

# 📝 환경변수 템플릿 생성
create_env_template() {
    log "INFO" "📝 환경변수 템플릿 생성 중..."
    
    cat > "$ENV_TEMPLATE" << 'EOF'
# =============================================================================
# 🌍 OpenManager VIBE v5 - 환경변수 설정
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: MCP 서버 12개 완전 지원을 위한 환경변수
# 📝 사용법: 값을 입력 후 .env.local로 복사
# =============================================================================

# ==================== 🔑 필수 환경변수 ====================

# 🐙 GitHub MCP 서버용
# 발급: https://github.com/settings/tokens
# 권한: repo, user, admin:org
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 🐘 Supabase MCP 서버용
# 발급: Supabase Dashboard > Settings > API > Project API keys
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_PROJECT_ID=your-project-id

# 🔍 Tavily 웹 검색 MCP 서버용
# 발급: https://tavily.com/ > API Keys
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 📦 Upstash Redis MCP 서버용 (Context7 및 캐싱)
# 발급: https://upstash.com/ > Redis > Database > REST API
UPSTASH_REDIS_REST_URL=https://xxxxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ☁️ Google Cloud Platform MCP 서버용
# 설정: gcloud auth login 후 프로젝트 ID 입력
GOOGLE_CLOUD_PROJECT=your-gcp-project-id

# ==================== 🔧 선택적 환경변수 ====================

# 🤖 OpenAI API (GPT 모델 사용시)
# OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 🧠 Anthropic API (Claude 모델 직접 사용시)
# ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ▲ Vercel 배포 자동화용
# VERCEL_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 🔐 NextAuth.js 설정 (인증 시스템용)
# NEXTAUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# NEXTAUTH_URL=http://localhost:3000

# ==================== 🚀 개발환경 설정 ====================

# 🔧 Node.js 환경 설정
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# 🎭 Mock 모드 설정 (개발시 유용)
# MOCK_MODE=dev  # off: 실서버, dev: 하이브리드, force: 완전Mock

# ==================== 📊 모니터링 & 로깅 ====================

# 🔍 디버그 모드
# DEBUG=*  # 모든 디버그 로그 활성화

# 📈 성능 모니터링
# ANALYZE=true  # 번들 분석 활성화

# =============================================================================
# 📝 설치 가이드:
# 
# 1. 이 파일을 .env.local로 복사
# 2. 각 서비스에서 API 키 발급
# 3. 위의 xxxxxxxxx 부분을 실제 값으로 교체
# 4. npm run dev 실행
# 
# 🔗 상세 가이드: docs/mcp/mcp-complete-installation-guide-2025.md
# =============================================================================
EOF

    log "SUCCESS" "환경변수 템플릿 생성: $ENV_TEMPLATE"
    echo -e "  ${CYAN}• 파일 크기: $(wc -l < "$ENV_TEMPLATE") 줄${NC}"
    echo -e "  ${CYAN}• 위치: $(pwd)/$ENV_TEMPLATE${NC}"
}

# 🔧 .env.local 파일 백업 및 복구
backup_env_file() {
    if [[ -f "$ENV_FILE" ]]; then
        cp "$ENV_FILE" "$BACKUP_ENV"
        log "SUCCESS" "환경변수 백업: $BACKUP_ENV"
        return 0
    else
        log "WARNING" "백업할 .env.local 파일이 없습니다"
        return 1
    fi
}

# 🔨 누락된 환경변수 자동 추가
auto_fix_env() {
    log "INFO" "🔨 누락된 환경변수 자동 복구 중..."
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log "INFO" ".env.local 파일 생성 중..."
        touch "$ENV_FILE"
    else
        backup_env_file
    fi
    
    local added_count=0
    
    # 필수 환경변수 확인 및 추가
    for var in "${!REQUIRED_VARS[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
            echo "" >> "$ENV_FILE"
            echo "# ${REQUIRED_VARS[$var]}" >> "$ENV_FILE"
            echo "${var}=" >> "$ENV_FILE"
            log "SUCCESS" "환경변수 추가: $var"
            ((added_count++))
        fi
    done
    
    # 선택적 환경변수도 주석으로 추가
    for var in "${!OPTIONAL_VARS[@]}"; do
        if ! grep -q "^${var}=" "$ENV_FILE" && ! grep -q "^#.*${var}=" "$ENV_FILE" 2>/dev/null; then
            echo "" >> "$ENV_FILE"
            echo "# ${OPTIONAL_VARS[$var]}" >> "$ENV_FILE"
            echo "# ${var}=" >> "$ENV_FILE"
            log "INFO" "선택적 변수 추가 (주석): $var"
        fi
    done
    
    if [[ $added_count -gt 0 ]]; then
        log "SUCCESS" "$added_count개 환경변수 자동 추가 완료"
        echo -e "  ${YELLOW}⚠️  각 변수에 실제 값을 설정해주세요${NC}"
    else
        log "INFO" "추가할 환경변수 없음"
    fi
}

# 🔐 기존 암호화 시스템에서 환경변수 로드
load_encrypted_environment() {
    log "INFO" "🔐 암호화된 환경변수 로드 중..."
    
    if [[ -f "$CRYPTO_SCRIPT" ]]; then
        log "INFO" "기존 암복호화 시스템 발견: $CRYPTO_SCRIPT"
        
        # 암호화된 환경변수 복호화 시도
        if node "$CRYPTO_SCRIPT" decrypt 2>/dev/null; then
            log "SUCCESS" "암호화된 환경변수 복호화 완료"
            return 0
        else
            log "WARNING" "암호화된 환경변수 복호화 실패 - 수동 설정 필요"
            return 1
        fi
    else
        log "WARNING" "암복호화 시스템을 찾을 수 없음: $CRYPTO_SCRIPT"
        return 1
    fi
}

# 🧪 환경변수 테스트 (보안 강화)
test_environment() {
    log "INFO" "🧪 환경변수 연결 테스트 중..."
    echo
    
    # 기존 암호화 시스템에서 로드 시도
    load_encrypted_environment || log "WARNING" "암호화 시스템 로드 실패"
    
    local test_results=()
    
    # GitHub API 테스트 (토큰 노출 방지)
    if [[ -n "${GITHUB_TOKEN:-}" ]]; then
        if curl -s -H "Authorization: Bearer $GITHUB_TOKEN" https://api.github.com/user > /dev/null 2>&1; then
            log "SUCCESS" "GitHub API 연결 성공"
            test_results+=("github:success")
        else
            log "ERROR" "GitHub API 연결 실패 - 토큰 확인 필요"
            test_results+=("github:failed")
        fi
    else
        log "WARNING" "GitHub 토큰 미설정 - 테스트 스킵"
        test_results+=("github:skipped")
    fi
    
    # Supabase 테스트 (프로젝트 ID 노출 방지)
    if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" && -n "${SUPABASE_PROJECT_ID:-}" ]]; then
        # 마스킹된 프로젝트 ID 표시
        local masked_id="${SUPABASE_PROJECT_ID:0:4}****${SUPABASE_PROJECT_ID: -4}"
        log "SUCCESS" "Supabase 환경변수 설정됨 (ID: $masked_id)"
        test_results+=("supabase:success")
    else
        log "WARNING" "Supabase 환경변수 미설정"
        test_results+=("supabase:failed")
    fi
    
    # Tavily API 테스트
    if [[ -n "${TAVILY_API_KEY:-}" ]]; then
        log "SUCCESS" "Tavily API 키 설정됨"
        test_results+=("tavily:success")
    else
        log "WARNING" "Tavily API 키 미설정"
        test_results+=("tavily:failed")
    fi
    
    # Upstash Redis 테스트 (URL 마스킹)
    if [[ -n "${UPSTASH_REDIS_REST_URL:-}" && -n "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
        if curl -s -H "Authorization: Bearer $UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_URL/ping" > /dev/null 2>&1; then
            log "SUCCESS" "Upstash Redis 연결 성공"
            test_results+=("upstash:success")
        else
            log "WARNING" "Upstash Redis 연결 실패"
            test_results+=("upstash:failed")
        fi
    else
        log "WARNING" "Upstash Redis 환경변수 미설정"
        test_results+=("upstash:failed")
    fi
    
    # 테스트 결과 요약
    local success_count=$(printf '%s\n' "${test_results[@]}" | grep -c ":success" || echo "0")
    local total_tests=${#test_results[@]}
    
    echo
    log "INFO" "📊 테스트 결과: $success_count/$total_tests 성공"
    
    if [[ $success_count -eq $total_tests ]]; then
        log "SUCCESS" "모든 환경변수 테스트 통과"
        return 0
    else
        log "WARNING" "일부 환경변수 설정 필요 - 기존 암호화 시스템 활용 권장"
        return 1
    fi
}

# 📋 대화형 환경변수 설정 가이드
interactive_setup() {
    log "INFO" "📋 대화형 환경변수 설정 시작..."
    echo
    
    echo -e "${CYAN}🔧 환경변수 설정 가이드${NC}"
    echo -e "${WHITE}필요한 API 키들을 순서대로 설정하겠습니다.${NC}"
    echo -e "${YELLOW}Enter 키만 누르면 해당 변수를 건너뜁니다.${NC}"
    echo
    
    for var in "${!REQUIRED_VARS[@]}"; do
        echo -e "${BLUE}📝 $var 설정${NC}"
        echo -e "${CYAN}   설명: ${REQUIRED_VARS[$var]}${NC}"
        
        # 현재 값 표시
        if [[ -n "${!var:-}" ]]; then
            local masked_value=$(echo "${!var}" | sed 's/./*/g')
            echo -e "${GREEN}   현재 값: $masked_value (설정됨)${NC}"
        else
            echo -e "${RED}   현재 값: (미설정)${NC}"
        fi
        
        echo -n "   새 값 입력: "
        read -r new_value
        
        if [[ -n "$new_value" ]]; then
            # .env.local 파일에 추가/업데이트
            if grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
                sed -i "s/^${var}=.*/${var}=${new_value}/" "$ENV_FILE"
            else
                echo "${var}=${new_value}" >> "$ENV_FILE"
            fi
            log "SUCCESS" "$var 설정 완료"
        else
            log "INFO" "$var 건너뜀"
        fi
        echo
    done
    
    log "SUCCESS" "대화형 설정 완료"
}

# 📊 상세 리포트 생성
generate_report() {
    echo
    log "INFO" "📊 환경변수 상태 리포트 생성 중..."
    echo
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}                🌍 환경변수 상태 리포트                        ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # 파일 정보
    if [[ -f "$ENV_FILE" ]]; then
        local file_size=$(wc -c < "$ENV_FILE")
        local line_count=$(wc -l < "$ENV_FILE")
        echo -e "${BLUE}📄 .env.local 파일:${NC} 존재 (${file_size} bytes, ${line_count} 줄)"
    else
        echo -e "${RED}📄 .env.local 파일:${NC} 없음"
    fi
    
    if [[ -f "$ENV_TEMPLATE" ]]; then
        echo -e "${BLUE}📝 템플릿 파일:${NC} $ENV_TEMPLATE"
    fi
    
    if [[ -f "$BACKUP_ENV" ]]; then
        echo -e "${BLUE}💾 백업 파일:${NC} $BACKUP_ENV"
    fi
    
    echo
    
    # 환경변수 상태
    local set_required=0
    local set_optional=0
    
    for var in "${!REQUIRED_VARS[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            ((set_required++))
        fi
    done
    
    for var in "${!OPTIONAL_VARS[@]}"; do
        if [[ -n "${!var:-}" ]]; then
            ((set_optional++))
        fi
    done
    
    echo -e "${GREEN}✅ 설정된 필수 변수:${NC} $set_required/${#REQUIRED_VARS[@]}"
    echo -e "${YELLOW}⚙️  설정된 선택 변수:${NC} $set_optional/${#OPTIONAL_VARS[@]}"
    
    # 다음 단계 안내
    echo
    echo -e "${CYAN}🔧 다음 단계:${NC}"
    
    if [[ $set_required -lt ${#REQUIRED_VARS[@]} ]]; then
        echo "  1. 기존 암호화 시스템 활용: node scripts/core/env-manager.mjs decrypt"
        echo "  2. 수동 설정: ./scripts/mcp-env-recovery.sh --interactive"
        echo "  3. MCP 서버 재시작: claude mcp restart"
        echo "  4. 참고 문서: docs/mcp/mcp-complete-installation-guide-2025.md"
    else
        echo "  1. MCP 서버 테스트: claude mcp list"
        echo "  2. 애플리케이션 시작: npm run dev"
        echo "  3. 추가 복구 도구: ./scripts/mcp-recovery-complete.sh"
        echo "  4. 암호화 백업: node scripts/core/env-manager.mjs encrypt"
    fi
    
    echo
}

# 🚀 메인 실행 함수
main() {
    print_header
    
    local mode="${1:-auto}"
    
    case "$mode" in
        "--interactive"|"-i")
            log "INFO" "🎯 대화형 모드로 실행"
            diagnose_environment || true
            analyze_env_file || true
            create_env_template
            interactive_setup
            ;;
        "--test"|"-t")
            log "INFO" "🧪 테스트 모드로 실행"
            diagnose_environment || true
            test_environment || true
            ;;
        "--template"|"-T")
            log "INFO" "📝 템플릿 생성 모드"
            create_env_template
            ;;
        "--auto"|"-a"|*)
            log "INFO" "🤖 자동 복구 모드로 실행"
            diagnose_environment || true
            analyze_env_file || true
            create_env_template
            auto_fix_env
            ;;
    esac
    
    # 최종 진단 및 리포트
    echo
    diagnose_environment || log "WARNING" "일부 환경변수 설정 필요"
    generate_report
    
    echo
    log "SUCCESS" "🏁 환경변수 복구 스크립트 실행 완료"
}

# 도움말 출력
show_help() {
    echo -e "${CYAN}🌍 MCP 환경변수 복구 스크립트 v${SCRIPT_VERSION}${NC}"
    echo
    echo -e "${WHITE}사용법:${NC}"
    echo "  $0 [옵션]"
    echo
    echo -e "${WHITE}옵션:${NC}"
    echo "  --auto, -a      자동 복구 모드 (기본값)"
    echo "  --interactive, -i  대화형 설정 모드"
    echo "  --test, -t      환경변수 테스트만 실행"
    echo "  --template, -T  템플릿 파일만 생성"
    echo "  --help, -h      이 도움말 출력"
    echo
    echo -e "${WHITE}예시:${NC}"
    echo "  $0                    # 자동 복구"
    echo "  $0 --interactive      # 대화형 설정"
    echo "  $0 --test            # 연결 테스트"
    echo
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