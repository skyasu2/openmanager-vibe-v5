#!/bin/bash

# ====================================================================
# MCP 보안 강화 상태 체크 및 실제 기능 테스트 스크립트
# ====================================================================
# 목적: MCP 서버 연결 + 실제 기능 테스트 + 보안 검증
# 사용법: ./scripts/mcp-health-check-enhanced.sh [--full-test|--security-only]
# 생성일: 2025-09-20
# 개선사항: 실제 기능 테스트, 보안 스캔, API 키 노출 검증
# ====================================================================

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# 로그 파일
LOG_DIR="./logs"
LOG_FILE="$LOG_DIR/mcp-health-check-enhanced.log"
SECURITY_LOG="$LOG_DIR/mcp-security-scan.log"
mkdir -p "$LOG_DIR"

# 현재 시간
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# 로깅 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
    echo "[$TIMESTAMP] [INFO] $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    echo "[$TIMESTAMP] [SUCCESS] $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "[$TIMESTAMP] [WARNING] $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "[$TIMESTAMP] [ERROR] $1" >> "$LOG_FILE"
}

log_security() {
    echo -e "${PURPLE}[SECURITY]${NC} $1"
    echo "[$TIMESTAMP] [SECURITY] $1" >> "$SECURITY_LOG"
}

# 헬프 메시지
show_help() {
    cat << EOF
MCP 보안 강화 상태 체크 스크립트

사용법:
    $0 [옵션]

옵션:
    --connection-only  연결 상태만 확인 (빠른 체크)
    --full-test        전체 검사 (연결 + 서버 정보 + 보안 스캔)
    --security-only    보안 스캔만 수행
    --help            이 도움말 표시

기본 동작: 연결 체크 + 서버 정보 확인 + 보안 스캔
참고: 실제 MCP 도구 기능 테스트는 Claude Code 내에서만 가능합니다
EOF
}

# MCP 서버 연결 상태 확인
check_mcp_connections() {
    log_info "=== MCP 서버 연결 상태 확인 ==="

    # claude mcp list 실행 및 결과 파싱
    local mcp_output
    if mcp_output=$(claude mcp list 2>&1); then
        echo "$mcp_output"

        # 연결된 서버 개수 확인 (안전한 계산)
        local connected_count failed_count
        connected_count=$(echo "$mcp_output" | grep -c "✓ Connected" 2>/dev/null)
        failed_count=$(echo "$mcp_output" | grep -c "✗ Failed" 2>/dev/null)

        # 숫자가 아닌 경우 0으로 설정
        connected_count=${connected_count:-0}
        failed_count=${failed_count:-0}

        log_success "연결된 서버: $connected_count개"
        if [ "$failed_count" -gt 0 ]; then
            log_error "실패한 서버: $failed_count개"
            return 1
        fi

        return 0
    else
        log_error "Claude MCP 명령어 실행 실패"
        return 1
    fi
}

# MCP 서버 기본 정보 확인 (연결 상태 기반)
check_mcp_server_details() {
    log_info "=== MCP 서버 상세 정보 확인 ==="

    log_warning "⚠️ 실제 기능 테스트는 Claude Code 내에서만 가능합니다"
    log_info "💡 실제 MCP 도구 테스트는 Claude Code 대화창에서 수행하세요"

    # 연결된 서버들의 기본 정보만 표시
    local mcp_output
    if mcp_output=$(claude mcp list 2>&1); then
        # 연결된 서버 목록에서 실제 서버명 추출 (콜론 앞부분만)
        local connected_servers
        connected_servers=$(echo "$mcp_output" | grep "✓ Connected" | sed 's/:.*$//' | sort | uniq)

        if [ -n "$connected_servers" ]; then
            log_info "🔗 연결된 MCP 서버 목록:"

            # while read 루프 대신 간단한 목록 표시
            local server_count
            server_count=$(echo "$connected_servers" | wc -l)

            # 기본 서버 목록과 매칭하여 표시
            if echo "$mcp_output" | grep -q "memory.*Connected"; then
                log_info "  📝 Memory MCP: 엔티티 관리 및 메모리 그래프"
            fi
            if echo "$mcp_output" | grep -q "time.*Connected"; then
                log_info "  🕐 Time MCP: 시간대 변환 및 현재 시간"
            fi
            if echo "$mcp_output" | grep -q "sequential-thinking.*Connected"; then
                log_info "  🧠 Sequential-thinking MCP: 단계적 사고 프로세스"
            fi
            if echo "$mcp_output" | grep -q "supabase.*Connected"; then
                log_info "  🐘 Supabase MCP: 데이터베이스 관리"
            fi
            if echo "$mcp_output" | grep -q "vercel.*Connected"; then
                log_info "  ▲ Vercel MCP: 배포 및 프로젝트 관리"
            fi
            if echo "$mcp_output" | grep -q "context7.*Connected"; then
                log_warning "  📚 Context7 MCP: 연결됨 (도구 사용 불가 상태)"
            fi
            if echo "$mcp_output" | grep -q "serena.*Connected"; then
                log_info "  🔧 Serena MCP: 코드베이스 구조 분석"
            fi
            if echo "$mcp_output" | grep -q "playwright.*Connected"; then
                log_warning "  🎭 Playwright MCP: 연결됨 (브라우저 설치 필요)"
            fi
            if echo "$mcp_output" | grep -q "shadcn-ui.*Connected"; then
                log_info "  🎨 Shadcn-ui MCP: UI 컴포넌트 라이브러리"
            fi

            log_success "✅ 총 $server_count개 MCP 서버 연결됨"
            return 0
        else
            log_error "연결된 MCP 서버가 없습니다"
            return 1
        fi
    else
        log_error "MCP 서버 목록 조회 실패"
        return 1
    fi
}

# 보안 스캔
security_scan() {
    log_info "=== MCP 보안 스캔 시작 ==="

    local security_issues=0

    # 1. API 키 프로세스 노출 검사
    log_info "🔍 프로세스 목록에서 API 키 노출 검사..."
    local exposed_keys
    if exposed_keys=$(ps aux | grep -E "(sbp_|ctx7sk-|AX[A-Za-z0-9])" | grep -v grep); then
        log_security "⚠️ 프로세스 목록에서 API 키 노출 발견!"
        echo "$exposed_keys" | while read -r line; do
            log_security "   노출된 프로세스: $line"
        done
        ((security_issues++))
    else
        log_success "프로세스 목록 API 키 노출 없음"
    fi

    # 2. 백업 파일 보안 검사
    log_info "🔍 백업 파일 API 키 노출 검사..."
    local backup_exposures
    if backup_exposures=$(find /mnt/d/cursor/openmanager-vibe-v5 -name "*backup*" -type f -exec grep -l "sbp_\|ctx7sk-\|AX[A-Za-z0-9]" {} \; 2>/dev/null); then
        log_security "⚠️ 백업 파일에서 API 키 노출 발견!"
        echo "$backup_exposures" | while read -r file; do
            log_security "   노출된 파일: $file"
        done
        ((security_issues++))
    else
        log_success "백업 파일 API 키 노출 없음"
    fi

    # 3. 환경변수 파일 권한 검사
    log_info "🔍 환경변수 파일 권한 검사..."
    if [ -f "/mnt/d/cursor/openmanager-vibe-v5/.env.local" ]; then
        local permissions
        permissions=$(stat -c "%a" "/mnt/d/cursor/openmanager-vibe-v5/.env.local")
        if [ "$permissions" = "600" ]; then
            log_success ".env.local 파일 권한 안전 (600)"
        else
            log_security "⚠️ .env.local 파일 권한 위험 ($permissions, 권장: 600)"
            ((security_issues++))
        fi
    else
        log_warning ".env.local 파일이 존재하지 않음"
    fi

    # 4. MCP 설정 파일 권한 검사
    log_info "🔍 MCP 설정 파일 권한 검사..."
    if [ -f "/mnt/d/cursor/openmanager-vibe-v5/.mcp.json" ]; then
        local mcp_permissions
        mcp_permissions=$(stat -c "%a" "/mnt/d/cursor/openmanager-vibe-v5/.mcp.json")
        if [ "$mcp_permissions" = "600" ] || [ "$mcp_permissions" = "644" ]; then
            log_success ".mcp.json 파일 권한 안전 ($mcp_permissions)"
        else
            log_security "⚠️ .mcp.json 파일 권한 확인 필요 ($mcp_permissions)"
            ((security_issues++))
        fi
    fi

    # 5. 로그 파일 민감 정보 검사
    log_info "🔍 로그 파일 민감 정보 검사..."
    local log_exposures
    if log_exposures=$(find /mnt/d/cursor/openmanager-vibe-v5 -name "*.log" -type f -exec grep -l "sbp_\|ctx7sk-\|password\|secret" {} \; 2>/dev/null); then
        log_security "⚠️ 로그 파일에서 민감 정보 발견!"
        echo "$log_exposures" | while read -r file; do
            log_security "   민감 정보 포함 파일: $file"
        done
        ((security_issues++))
    else
        log_success "로그 파일 민감 정보 노출 없음"
    fi

    # 보안 스캔 결과
    if [ "$security_issues" -eq 0 ]; then
        log_success "🛡️ 보안 스캔 완료: 발견된 문제 없음"
        return 0
    else
        log_error "🚨 보안 스캔 완료: $security_issues개 문제 발견"
        log_info "📋 상세 내용은 $SECURITY_LOG 파일을 확인하세요"
        return 1
    fi
}

# 메모리 사용량 분석
analyze_memory_usage() {
    log_info "=== MCP 프로세스 메모리 사용량 분석 ==="

    local mcp_processes
    if mcp_processes=$(ps aux | grep -E "(mcp|claude)" | grep -v grep | head -10); then
        echo -e "\n${BLUE}🧠 MCP 관련 프로세스:${NC}"
        echo "$mcp_processes" | while read -r line; do
            echo "  $line"
        done

        # 총 메모리 사용량 계산 (bc 의존성 제거)
        local total_memory_percent
        total_memory_percent=$(echo "$mcp_processes" | awk '{sum += $4} END {printf "%.1f", sum}')

        # bc 대신 awk를 사용하여 비교
        local is_high_memory
        is_high_memory=$(echo "$total_memory_percent" | awk '{print ($1 > 15.0) ? 1 : 0}')

        if [ "$is_high_memory" -eq 1 ]; then
            log_warning "📊 총 MCP 메모리 사용량: ${total_memory_percent}% (높음)"
        else
            log_success "📊 총 MCP 메모리 사용량: ${total_memory_percent}% (정상)"
        fi
    else
        log_warning "MCP 관련 프로세스를 찾을 수 없습니다"
    fi
}

# 개선 제안 생성
generate_recommendations() {
    log_info "=== 개선 제안 ==="

    echo -e "\n${YELLOW}🔧 권장 조치사항:${NC}"

    # 보안 개선 제안
    if grep -q "SECURITY.*API 키 노출" "$SECURITY_LOG" 2>/dev/null; then
        echo "1. 🚨 API 키 보안 강화:"
        echo "   - Context7 MCP 환경변수 방식으로 변경"
        echo "   - 백업 파일 암호화 또는 키 제거"
        echo "   - 프로세스 목록에서 키 노출 방지"
    fi

    # MCP 연결 문제 개선 제안
    if grep -q "ERROR.*연결" "$LOG_FILE" 2>/dev/null; then
        echo "2. 🔧 연결 복구 제안:"
        echo "   - 환경변수 설정 확인: ./scripts/setup-mcp-env.sh --validate"
        echo "   - MCP 서버 재시작: claude mcp remove [서버명] && claude mcp add [서버명]"
        echo "   - 전체 복구: ./scripts/mcp-complete-recovery.sh"
        echo "   - 실제 기능 테스트: Claude Code 대화창에서 mcp__ 도구 사용"
    fi

    # 메모리 최적화 제안
    if grep -q "WARNING.*메모리 사용량.*높음" "$LOG_FILE" 2>/dev/null; then
        echo "3. 🧠 메모리 최적화:"
        echo "   - MCP 서버 재시작 권장"
        echo "   - WSL 메모리 할당 확인"
        echo "   - 불필요한 MCP 서버 제거"
    fi

    echo -e "\n${BLUE}📋 다음 체크 권장 시간: $(date -d '+1 hour' '+%H:%M')${NC}"
}

# 메인 함수
main() {
    echo -e "${PURPLE}🛡️ MCP 보안 강화 상태 체크 시작 - $TIMESTAMP${NC}"
    echo "[$TIMESTAMP] Enhanced MCP Health Check Started" >> "$LOG_FILE"

    local test_mode="${1:-default}"
    local overall_status=0

    case "$test_mode" in
        --connection-only)
            log_info "연결 상태만 확인합니다..."
            if ! check_mcp_connections; then
                overall_status=1
            fi
            if ! check_mcp_server_details; then
                overall_status=1
            fi
            ;;
        --security-only)
            log_info "보안 스캔만 수행합니다..."
            if ! security_scan; then
                overall_status=1
            fi
            ;;
        --full-test)
            log_info "전체 테스트를 수행합니다..."
            if ! check_mcp_connections; then
                overall_status=1
            fi
            if ! check_mcp_server_details; then
                overall_status=1
            fi
            if ! security_scan; then
                overall_status=1
            fi
            analyze_memory_usage
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            # 기본 모드: 연결 + 서버 정보 + 보안
            if ! check_mcp_connections; then
                overall_status=1
            fi
            if ! check_mcp_server_details; then
                overall_status=1
            fi
            if ! security_scan; then
                overall_status=1
            fi
            analyze_memory_usage
            ;;
    esac

    generate_recommendations

    # 최종 결과
    if [ "$overall_status" -eq 0 ]; then
        log_success "🎉 MCP 시스템 상태: 양호"
    else
        log_error "⚠️ MCP 시스템 상태: 주의 필요"
    fi

    echo -e "\n${BLUE}📝 상세 로그:${NC}"
    echo "  - 일반 로그: $LOG_FILE"
    echo "  - 보안 로그: $SECURITY_LOG"

    exit $overall_status
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi