#!/bin/bash

# ====================================================================
# MCP 환경변수 및 토큰 관리 자동화 스크립트
# ====================================================================
# 목적: MCP 서버 인증 토큰 설정 및 관리 자동화
# 사용법: ./scripts/setup-mcp-env.sh [--interactive|--validate|--backup|--load]
# 생성일: 2025-09-20
# 업데이트: WSL 재설치 후 MCP 복구 과정 자동화를 위한 종합 토큰 관리
# ====================================================================

set -euo pipefail

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env.local"
ENV_BACKUP="${PROJECT_ROOT}/.env.local.backup-$(date +%Y%m%d-%H%M%S)"

# 로그 함수들
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

# 헬프 메시지
show_help() {
    cat << EOF
MCP 환경변수 및 토큰 관리 스크립트

사용법:
    $0 [옵션]

옵션:
    --interactive      대화형 토큰 설정
    --validate         기존 토큰 검증
    --backup           환경변수 백업 (보안 강화)
    --restore          환경변수 복원
    --load             환경변수 로드 (기본 동작)
    --security-check   보안 검사 및 취약점 스캔
    --cleanup          오래된 백업 파일 정리
    --help             이 도움말 표시

예시:
    $0 --interactive      # 새로운 토큰 설정
    $0 --validate         # 현재 토큰 검증
    $0 --security-check   # 보안 취약점 검사
    $0 --cleanup          # 오래된 백업 정리
EOF
}

# 토큰 형식 검증 함수
validate_token_format() {
    local token_type="$1"
    local token_value="$2"

    case "$token_type" in
        "SUPABASE_ACCESS_TOKEN")
            if [[ $token_value =~ ^sbp_[a-zA-Z0-9]{40,}$ ]]; then
                return 0
            else
                log_error "Supabase 토큰 형식이 올바르지 않습니다. (예: sbp_xxxxxxxxxxxxxxxx)"
                return 1
            fi
            ;;
        "UPSTASH_REDIS_REST_TOKEN")
            if [[ $token_value =~ ^A[a-zA-Z0-9]{20,}$ ]]; then
                return 0
            else
                log_error "Upstash Redis 토큰 형식이 올바르지 않습니다. (예: AXXXXXXxxxxxxxxxxxxxxx)"
                return 1
            fi
            ;;
        "CONTEXT7_API_KEY")
            if [[ $token_value =~ ^ctx7sk-[a-zA-Z0-9]{32,}$ ]]; then
                return 0
            else
                log_error "Context7 API 키 형식이 올바르지 않습니다. (예: ctx7sk-xxxxxxxxxxxxxxxx)"
                return 1
            fi
            ;;
        *)
            log_warning "알 수 없는 토큰 타입: $token_type"
            return 1
            ;;
    esac
}

# 토큰 연결 테스트 함수
test_token_connection() {
    local token_type="$1"
    local token_value="$2"

    log_info "토큰 연결 테스트 중: $token_type"

    case "$token_type" in
        "SUPABASE_ACCESS_TOKEN")
            # Supabase 연결 테스트 (간단한 projects 조회)
            if command -v curl &> /dev/null; then
                local response=$(curl -s -w "%{http_code}" \
                    -H "Authorization: Bearer $token_value" \
                    -H "Content-Type: application/json" \
                    https://api.supabase.com/v1/projects 2>/dev/null || echo "000")

                if [[ "$response" == *"200" ]]; then
                    log_success "Supabase 토큰 연결 성공"
                    return 0
                else
                    log_error "Supabase 토큰 연결 실패 (HTTP: ${response})"
                    return 1
                fi
            else
                log_warning "curl이 설치되지 않아 연결 테스트를 건너뜁니다"
                return 0
            fi
            ;;
        "UPSTASH_REDIS_REST_TOKEN")
            log_info "Upstash Redis 토큰은 URL과 함께 사용되므로 연결 테스트를 건너뜁니다"
            return 0
            ;;
        "CONTEXT7_API_KEY")
            log_info "Context7 API 키 연결 테스트를 건너뜁니다"
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

# 환경변수 백업 함수 (보안 강화)
backup_env_file() {
    if [[ -f "$ENV_FILE" ]]; then
        # 원본 백업
        cp "$ENV_FILE" "$ENV_BACKUP"

        # 민감한 정보 제거된 백업 생성
        local secure_backup="${ENV_BACKUP}.secure"
        sed -E 's/(sbp_|ctx7sk-|AX[A-Za-z0-9]+)[A-Za-z0-9_-]+/\1***REDACTED***/g' "$ENV_FILE" > "$secure_backup"

        # 원본 백업 파일 권한 강화
        chmod 600 "$ENV_BACKUP"
        chmod 644 "$secure_backup"

        log_success "환경변수 백업 완료: $ENV_BACKUP"
        log_success "보안 백업 생성: $secure_backup (민감 정보 제거됨)"
    else
        log_warning ".env.local 파일이 존재하지 않습니다"
    fi
}

# 대화형 토큰 설정 함수
interactive_setup() {
    log_info "=== MCP 토큰 대화형 설정 ==="

    # 기존 파일 백업
    backup_env_file

    # 환경변수 파일 초기화 또는 읽기
    declare -A env_vars
    if [[ -f "$ENV_FILE" ]]; then
        log_info "기존 .env.local 파일을 읽는 중..."
        while IFS='=' read -r key value; do
            if [[ $key && $value && ! $key =~ ^[[:space:]]*# ]]; then
                env_vars["$key"]="$value"
            fi
        done < "$ENV_FILE"
    fi

    # Supabase 설정
    echo ""
    log_info "📊 Supabase 설정"
    echo "Supabase Dashboard → Settings → API → Service Role Key"
    read -p "Supabase Access Token (sbp_...): " -r supabase_token

    if [[ -n "$supabase_token" ]]; then
        if validate_token_format "SUPABASE_ACCESS_TOKEN" "$supabase_token"; then
            env_vars["SUPABASE_ACCESS_TOKEN"]="$supabase_token"

            read -p "Supabase Project ID: " -r supabase_project_id
            if [[ -n "$supabase_project_id" ]]; then
                env_vars["SUPABASE_PROJECT_ID"]="$supabase_project_id"
            fi
        fi
    fi

    # Upstash Redis 설정
    echo ""
    log_info "🔗 Upstash Redis 설정 (Context7 MCP 용)"
    echo "Upstash Console → Redis → Create Database"
    read -p "Upstash Redis REST URL: " -r upstash_url
    read -p "Upstash Redis REST Token (A...): " -r upstash_token

    if [[ -n "$upstash_url" && -n "$upstash_token" ]]; then
        if validate_token_format "UPSTASH_REDIS_REST_TOKEN" "$upstash_token"; then
            env_vars["UPSTASH_REDIS_REST_URL"]="$upstash_url"
            env_vars["UPSTASH_REDIS_REST_TOKEN"]="$upstash_token"
        fi
    fi

    # Context7 API 키 설정
    echo ""
    log_info "🔑 Context7 API 키 설정 (선택사항)"
    read -p "Context7 API Key (ctx7sk-...): " -r context7_key

    if [[ -n "$context7_key" ]]; then
        if validate_token_format "CONTEXT7_API_KEY" "$context7_key"; then
            env_vars["CONTEXT7_API_KEY"]="$context7_key"
        fi
    fi

    # 환경변수 파일 생성
    log_info "환경변수 파일 생성 중..."
    cat > "$ENV_FILE" << EOF
# MCP 환경변수 설정
# 생성일: $(date '+%Y-%m-%d %H:%M:%S')
# 스크립트: setup-mcp-env.sh

# Supabase 설정
EOF

    for key in "${!env_vars[@]}"; do
        echo "${key}=${env_vars[$key]}" >> "$ENV_FILE"
    done

    # 권한 설정 (보안)
    chmod 600 "$ENV_FILE"

    log_success ".env.local 파일이 성공적으로 생성되었습니다"

    # 연결 테스트
    echo ""
    log_info "=== 토큰 연결 테스트 ==="

    for key in "${!env_vars[@]}"; do
        if [[ "$key" =~ TOKEN|KEY ]]; then
            test_token_connection "$key" "${env_vars[$key]}" || true
        fi
    done
}

# 토큰 검증 함수
validate_existing_tokens() {
    log_info "=== 기존 토큰 검증 ==="

    if [[ ! -f "$ENV_FILE" ]]; then
        log_error ".env.local 파일이 존재하지 않습니다"
        return 1
    fi

    local validation_success=true

    # 환경변수 로드
    source "$ENV_FILE"

    # Supabase 토큰 검증
    if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
        if validate_token_format "SUPABASE_ACCESS_TOKEN" "$SUPABASE_ACCESS_TOKEN"; then
            test_token_connection "SUPABASE_ACCESS_TOKEN" "$SUPABASE_ACCESS_TOKEN" || validation_success=false
        else
            validation_success=false
        fi
    else
        log_warning "SUPABASE_ACCESS_TOKEN이 설정되지 않았습니다"
    fi

    # Upstash 토큰 검증
    if [[ -n "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
        if validate_token_format "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN"; then
            test_token_connection "UPSTASH_REDIS_REST_TOKEN" "$UPSTASH_REDIS_REST_TOKEN" || validation_success=false
        else
            validation_success=false
        fi
    else
        log_warning "UPSTASH_REDIS_REST_TOKEN이 설정되지 않았습니다"
    fi

    # Context7 API 키 검증
    if [[ -n "${CONTEXT7_API_KEY:-}" ]]; then
        if validate_token_format "CONTEXT7_API_KEY" "$CONTEXT7_API_KEY"; then
            test_token_connection "CONTEXT7_API_KEY" "$CONTEXT7_API_KEY" || validation_success=false
        else
            validation_success=false
        fi
    else
        log_info "CONTEXT7_API_KEY는 선택사항입니다"
    fi

    if $validation_success; then
        log_success "모든 토큰 검증이 완료되었습니다"
        return 0
    else
        log_error "일부 토큰 검증에 실패했습니다"
        return 1
    fi
}

# 환경변수 복원 함수
restore_env_file() {
    log_info "=== 환경변수 복원 ==="

    # 백업 파일 목록 표시
    local backup_files=($(find "$PROJECT_ROOT" -name ".env.local.backup-*" -type f | sort -r))

    if [[ ${#backup_files[@]} -eq 0 ]]; then
        log_error "복원 가능한 백업 파일이 없습니다"
        return 1
    fi

    echo "복원 가능한 백업 파일:"
    for i in "${!backup_files[@]}"; do
        local backup_file="${backup_files[$i]}"
        local backup_date=$(basename "$backup_file" | sed 's/.env.local.backup-//')
        echo "  $((i+1)). $backup_date ($(stat -c%y "$backup_file" | cut -d' ' -f1))"
    done

    read -p "복원할 백업 파일 번호를 선택하세요 (1-${#backup_files[@]}): " -r choice

    if [[ "$choice" =~ ^[0-9]+$ ]] && [[ "$choice" -ge 1 ]] && [[ "$choice" -le ${#backup_files[@]} ]]; then
        local selected_backup="${backup_files[$((choice-1))]}"

        # 현재 파일 백업
        if [[ -f "$ENV_FILE" ]]; then
            backup_env_file
        fi

        # 백업 파일 복원
        cp "$selected_backup" "$ENV_FILE"
        chmod 600 "$ENV_FILE"

        log_success "환경변수 파일이 복원되었습니다: $(basename "$selected_backup")"

        # 복원된 토큰 검증
        validate_existing_tokens
    else
        log_error "잘못된 선택입니다"
        return 1
    fi
}

# 환경변수 로드 함수 (기존 기능 유지)
load_env_variables() {
    if [[ ! -f "$ENV_FILE" ]]; then
        log_warning ".env.local 파일이 없습니다. --interactive 옵션으로 설정해주세요"
        return 1
    fi

    log_info "=== MCP 환경변수 로드 ==="

    # 환경변수 로드
    source "$ENV_FILE"

    # Context7 API 키 로드
    if [[ -n "${CONTEXT7_API_KEY:-}" ]]; then
        export CONTEXT7_API_KEY="$CONTEXT7_API_KEY"
        log_success "CONTEXT7_API_KEY 설정됨"
    fi

    # Upstash Redis 설정
    if [[ -n "${UPSTASH_REDIS_REST_URL:-}" ]]; then
        export UPSTASH_REDIS_REST_URL="$UPSTASH_REDIS_REST_URL"
        log_success "UPSTASH_REDIS_REST_URL 설정됨"
    fi

    if [[ -n "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
        export UPSTASH_REDIS_REST_TOKEN="$UPSTASH_REDIS_REST_TOKEN"
        log_success "UPSTASH_REDIS_REST_TOKEN 설정됨"
    fi

    # Supabase 설정
    if [[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
        export SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN"
        log_success "SUPABASE_ACCESS_TOKEN 설정됨"
    fi

    if [[ -n "${SUPABASE_PROJECT_ID:-}" ]]; then
        export SUPABASE_PROJECT_ID="$SUPABASE_PROJECT_ID"
        log_success "SUPABASE_PROJECT_ID 설정됨"
    fi

    # 추가 MCP 관련 환경변수 설정
    export MCP_TIMEOUT=300000
    export UV_THREADPOOL_SIZE=16
    export NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=8192"
    log_success "MCP 타임아웃 및 성능 설정 완료"

    # .bashrc에 자동 로드 설정 추가
    local bashrc_file="$HOME/.bashrc"
    local mcp_env_loader="# OpenManager VIBE v5 - MCP 환경변수 자동 로드
if [ -f \"$PROJECT_ROOT/scripts/setup-mcp-env.sh\" ]; then
    source \"$PROJECT_ROOT/scripts/setup-mcp-env.sh\" --load > /dev/null 2>&1
fi"

    if ! grep -q "OpenManager VIBE v5 - MCP 환경변수" "$bashrc_file"; then
        echo "" >> "$bashrc_file"
        echo "$mcp_env_loader" >> "$bashrc_file"
        log_success ".bashrc에 자동 로드 설정 추가됨"
    fi
}

# 보안 검사 함수 (신규)
security_check() {
    log_info "=== MCP 환경변수 보안 검사 ==="

    local security_issues=0

    # 1. 프로세스 목록에서 API 키 노출 검사
    log_info "🔍 프로세스 목록 API 키 노출 검사..."
    local exposed_processes
    if exposed_processes=$(ps aux | grep -E "(sbp_|ctx7sk-|AX[A-Za-z0-9])" | grep -v grep); then
        log_error "⚠️ 프로세스 목록에서 API 키 노출 발견!"
        echo "$exposed_processes" | while read -r line; do
            log_error "   노출된 프로세스: $(echo "$line" | sed -E 's/(sbp_|ctx7sk-|AX[A-Za-z0-9]+)[A-Za-z0-9_-]+/\1***HIDDEN***/g')"
        done
        ((security_issues++))
    else
        log_success "프로세스 목록 API 키 노출 없음"
    fi

    # 2. 백업 파일에서 API 키 노출 검사
    log_info "🔍 백업 파일 API 키 노출 검사..."
    local backup_files
    if backup_files=$(find "$PROJECT_ROOT" -name "*backup*" -type f -exec grep -l "sbp_\|ctx7sk-\|AX[A-Za-z0-9]" {} \; 2>/dev/null); then
        log_warning "⚠️ 백업 파일에서 API 키 발견"
        echo "$backup_files" | while read -r file; do
            log_warning "   API 키 포함 파일: $file"
        done
        ((security_issues++))

        # 자동 정리 옵션 제공
        read -p "백업 파일의 API 키를 자동으로 마스킹하시겠습니까? (y/N): " -r auto_clean
        if [[ $auto_clean =~ ^[Yy]$ ]]; then
            echo "$backup_files" | while read -r file; do
                if [[ -f "$file" ]]; then
                    # 원본 파일 백업
                    cp "$file" "${file}.original"
                    # API 키 마스킹
                    sed -E 's/(sbp_|ctx7sk-|AX[A-Za-z0-9]+)[A-Za-z0-9_-]+/\1***REDACTED***/g' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
                    log_success "API 키 마스킹 완료: $file"
                fi
            done
        fi
    else
        log_success "백업 파일 API 키 노출 없음"
    fi

    # 3. 환경변수 파일 권한 검사
    log_info "🔍 환경변수 파일 권한 검사..."
    if [[ -f "$ENV_FILE" ]]; then
        local permissions
        permissions=$(stat -c "%a" "$ENV_FILE")
        if [[ "$permissions" == "600" ]]; then
            log_success ".env.local 파일 권한 안전 (600)"
        else
            log_warning "⚠️ .env.local 파일 권한 조정 권장 (현재: $permissions, 권장: 600)"
            chmod 600 "$ENV_FILE"
            log_success ".env.local 파일 권한을 600으로 수정했습니다"
        fi
    fi

    # 4. MCP 설정에서 보안 문제 검사
    log_info "🔍 MCP 설정 보안 검사..."
    if command -v claude &> /dev/null; then
        if claude mcp list | grep -q "api-key"; then
            log_error "⚠️ MCP 설정에서 API 키가 명령줄 인수로 노출됨"
            log_info "💡 환경변수 방식으로 변경을 권장합니다"
            ((security_issues++))
        else
            log_success "MCP 설정 API 키 노출 없음"
        fi
    fi

    # 보안 검사 결과
    if [[ "$security_issues" -eq 0 ]]; then
        log_success "🛡️ 보안 검사 완료: 발견된 문제 없음"
        return 0
    else
        log_error "🚨 보안 검사 완료: $security_issues개 문제 발견"
        log_info "💡 개선 조치를 권장합니다"
        return 1
    fi
}

# 기존 백업 파일 정리 함수 (신규)
cleanup_old_backups() {
    log_info "=== 기존 백업 파일 정리 ==="

    # 7일 이상 된 백업 파일 찾기
    local old_backups
    if old_backups=$(find "$PROJECT_ROOT" -name ".env.local.backup-*" -type f -mtime +7 2>/dev/null); then
        if [[ -n "$old_backups" ]]; then
            echo "7일 이상 된 백업 파일:"
            echo "$old_backups"

            read -p "오래된 백업 파일을 삭제하시겠습니까? (y/N): " -r delete_old
            if [[ $delete_old =~ ^[Yy]$ ]]; then
                echo "$old_backups" | xargs rm -f
                log_success "오래된 백업 파일 삭제 완료"
            fi
        else
            log_info "삭제할 오래된 백업 파일이 없습니다"
        fi
    fi
}

# 메인 함수
main() {
    case "${1:-}" in
        --interactive)
            interactive_setup
            ;;
        --validate)
            validate_existing_tokens
            ;;
        --backup)
            backup_env_file
            ;;
        --restore)
            restore_env_file
            ;;
        --load)
            load_env_variables
            ;;
        --security-check)
            security_check
            ;;
        --cleanup)
            cleanup_old_backups
            ;;
        --help)
            show_help
            ;;
        "")
            # 기본 동작: 환경변수 로드
            load_env_variables
            ;;
        *)
            log_error "알 수 없는 옵션: $1"
            show_help
            exit 1
            ;;
    esac
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi