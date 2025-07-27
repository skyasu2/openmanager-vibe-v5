#!/bin/bash
# 통합 환경 설정 스크립트
# 프로젝트 환경 변수 설정 및 관리

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 프로젝트 루트
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
ENV_FILE="$PROJECT_ROOT/.env.local"
ENV_EXAMPLE="$PROJECT_ROOT/.env.local.example"

echo -e "${BLUE}🔧 환경 설정 시작${NC}"
echo "========================"

# 환경 변수 카테고리
declare -A env_categories=(
    ["Google AI"]="GOOGLE_AI_API_KEY"
    ["Supabase"]="SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY"
    ["Redis"]="UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN"
    ["GitHub"]="GITHUB_TOKEN"
    ["Tavily"]="TAVILY_API_KEY"
    ["Next.js"]="NEXT_PUBLIC_APP_URL NEXT_PUBLIC_SESSION_PASSWORD"
)

# 1. 환경 파일 확인
check_env_file() {
    echo -e "\n${YELLOW}1. 환경 파일 확인${NC}"
    
    if [ -f "$ENV_FILE" ]; then
        echo -e "${GREEN}✅ .env.local 파일 존재${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  .env.local 파일이 없습니다${NC}"
        
        if [ -f "$ENV_EXAMPLE" ]; then
            echo -e "${BLUE}📝 .env.local.example에서 복사 중...${NC}"
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            echo -e "${GREEN}✅ .env.local 파일 생성됨${NC}"
            return 0
        else
            echo -e "${RED}❌ .env.local.example 파일도 없습니다${NC}"
            return 1
        fi
    fi
}

# 2. 환경 변수 상태 확인
check_env_status() {
    echo -e "\n${YELLOW}2. 환경 변수 상태 확인${NC}"
    
    # 환경 변수 로드
    if [ -f "$ENV_FILE" ]; then
        set -a
        source <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
        set +a
    fi
    
    local missing_vars=()
    local configured_vars=()
    
    for category in "${!env_categories[@]}"; do
        echo -e "\n${BLUE}[$category]${NC}"
        
        for var in ${env_categories[$category]}; do
            if [ -n "${!var}" ]; then
                echo -e "  ${GREEN}✅ $var${NC}"
                configured_vars+=("$var")
            else
                echo -e "  ${RED}❌ $var (미설정)${NC}"
                missing_vars+=("$var")
            fi
        done
    done
    
    echo -e "\n${BLUE}📊 요약:${NC}"
    echo -e "  설정됨: ${#configured_vars[@]}개"
    echo -e "  미설정: ${#missing_vars[@]}개"
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        echo -e "\n${YELLOW}⚠️  미설정 환경 변수:${NC}"
        printf '%s\n' "${missing_vars[@]}"
        return 1
    else
        echo -e "\n${GREEN}✅ 모든 환경 변수가 설정되었습니다${NC}"
        return 0
    fi
}

# 3. 대화형 설정
interactive_setup() {
    echo -e "\n${YELLOW}3. 대화형 환경 설정${NC}"
    echo -e "${BLUE}필요한 환경 변수를 입력해주세요${NC}"
    
    local updated=false
    
    for category in "${!env_categories[@]}"; do
        echo -e "\n${BLUE}=== $category ===${NC}"
        
        for var in ${env_categories[$category]}; do
            if [ -z "${!var}" ]; then
                echo -n "$var: "
                read -r value
                
                if [ -n "$value" ]; then
                    # .env.local 파일에 추가
                    if grep -q "^$var=" "$ENV_FILE"; then
                        # 기존 값 업데이트
                        sed -i "s|^$var=.*|$var=$value|" "$ENV_FILE"
                    else
                        # 새 값 추가
                        echo "$var=$value" >> "$ENV_FILE"
                    fi
                    updated=true
                    echo -e "${GREEN}✅ $var 설정됨${NC}"
                fi
            fi
        done
    done
    
    if [ "$updated" = true ]; then
        echo -e "\n${GREEN}✅ 환경 변수 업데이트 완료${NC}"
    fi
}

# 4. 환경 변수 백업
backup_env() {
    echo -e "\n${YELLOW}4. 환경 변수 백업${NC}"
    
    if [ -f "$ENV_FILE" ]; then
        local backup_dir="$PROJECT_ROOT/.env.backups"
        mkdir -p "$backup_dir"
        
        local backup_file="$backup_dir/.env.local.$(date +%Y%m%d_%H%M%S)"
        cp "$ENV_FILE" "$backup_file"
        
        echo -e "${GREEN}✅ 백업 완료: $backup_file${NC}"
        
        # 오래된 백업 정리 (30일 이상)
        find "$backup_dir" -name ".env.local.*" -mtime +30 -delete
        echo -e "${GREEN}✅ 30일 이상 된 백업 파일 정리됨${NC}"
    fi
}

# 5. 환경 검증
validate_env() {
    echo -e "\n${YELLOW}5. 환경 검증${NC}"
    
    # API 키 형식 검증
    validate_api_key() {
        local key_name=$1
        local key_value=$2
        local pattern=$3
        
        if [[ $key_value =~ $pattern ]]; then
            echo -e "${GREEN}✅ $key_name 형식 유효${NC}"
            return 0
        else
            echo -e "${RED}❌ $key_name 형식 오류${NC}"
            return 1
        fi
    }
    
    # Google AI API Key 검증
    if [ -n "$GOOGLE_AI_API_KEY" ]; then
        validate_api_key "GOOGLE_AI_API_KEY" "$GOOGLE_AI_API_KEY" "^AIza[0-9A-Za-z_-]{35}$"
    fi
    
    # GitHub Token 검증
    if [ -n "$GITHUB_TOKEN" ]; then
        validate_api_key "GITHUB_TOKEN" "$GITHUB_TOKEN" "^(ghp_|github_pat_)[0-9A-Za-z_]{36,}$"
    fi
    
    # URL 형식 검증
    if [ -n "$SUPABASE_URL" ]; then
        if [[ $SUPABASE_URL =~ ^https://[a-zA-Z0-9-]+\.supabase\.co$ ]]; then
            echo -e "${GREEN}✅ SUPABASE_URL 형식 유효${NC}"
        else
            echo -e "${RED}❌ SUPABASE_URL 형식 오류${NC}"
        fi
    fi
}

# 6. 환경별 설정
setup_by_environment() {
    echo -e "\n${YELLOW}6. 환경별 설정${NC}"
    
    echo "환경을 선택하세요:"
    echo "1) Development (로컬 개발)"
    echo "2) Staging (스테이징)"
    echo "3) Production (프로덕션)"
    
    read -r -p "선택 (1-3): " env_choice
    
    case $env_choice in
        1)
            echo -e "${BLUE}개발 환경 설정 적용${NC}"
            echo "NODE_ENV=development" >> "$ENV_FILE"
            echo "NEXT_PUBLIC_APP_URL=http://localhost:3000" >> "$ENV_FILE"
            ;;
        2)
            echo -e "${BLUE}스테이징 환경 설정 적용${NC}"
            echo "NODE_ENV=staging" >> "$ENV_FILE"
            ;;
        3)
            echo -e "${BLUE}프로덕션 환경 설정 적용${NC}"
            echo "NODE_ENV=production" >> "$ENV_FILE"
            ;;
        *)
            echo -e "${YELLOW}기본 개발 환경으로 설정${NC}"
            echo "NODE_ENV=development" >> "$ENV_FILE"
            ;;
    esac
}

# 메인 실행
main() {
    echo "환경 설정 옵션:"
    echo "1) 전체 설정 (권장)"
    echo "2) 상태 확인만"
    echo "3) 대화형 설정"
    echo "4) 백업만"
    
    read -r -p "선택 (1-4): " choice
    
    case $choice in
        1)
            check_env_file
            check_env_status || interactive_setup
            backup_env
            validate_env
            setup_by_environment
            ;;
        2)
            check_env_status
            ;;
        3)
            interactive_setup
            ;;
        4)
            backup_env
            ;;
        *)
            echo -e "${RED}잘못된 선택입니다${NC}"
            exit 1
            ;;
    esac
    
    echo -e "\n${GREEN}✅ 환경 설정 완료!${NC}"
    echo -e "${YELLOW}💡 변경사항 적용을 위해 터미널을 재시작하거나 'source ~/.bashrc'를 실행하세요${NC}"
}

# 스크립트 실행
main "$@"