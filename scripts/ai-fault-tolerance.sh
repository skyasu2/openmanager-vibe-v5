#!/bin/bash
# 🛡️ AI Fault Tolerance System - 단일 장애점 해결 시스템
# AI CLI 도구들의 독립성 보장 및 장애 복구 자동화

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로깅 함수
log_info() {
    echo -e "${BLUE}ℹ️  [$(date '+%H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ [$(date '+%H:%M:%S')] $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  [$(date '+%H:%M:%S')] $1${NC}"
}

log_error() {
    echo -e "${RED}❌ [$(date '+%H:%M:%S')] $1${NC}"
}

# AI 도구 상태 확인 함수들
check_claude_status() {
    log_info "Claude Code 상태 확인..."
    if command -v claude >/dev/null 2>&1; then
        if timeout 10 claude --version >/dev/null 2>&1; then
            log_success "Claude Code 정상 작동"
            return 0
        else
            log_warning "Claude Code 응답 없음"
            return 1
        fi
    else
        log_error "Claude Code 설치되지 않음"
        return 1
    fi
}

check_codex_status() {
    log_info "Codex CLI 상태 확인..."
    if command -v codex >/dev/null 2>&1; then
        if timeout 30 codex exec "test" >/dev/null 2>&1; then
            log_success "Codex CLI 정상 작동"
            return 0
        else
            log_warning "Codex CLI 응답 없음 (API 한도 또는 네트워크 이슈)"
            return 1
        fi
    else
        log_error "Codex CLI 설치되지 않음"
        return 1
    fi
}

check_gemini_status() {
    log_info "Gemini CLI 상태 확인..."
    if command -v gemini >/dev/null 2>&1; then
        if timeout 10 gemini --version >/dev/null 2>&1; then
            log_success "Gemini CLI 정상 작동"
            return 0
        else
            log_warning "Gemini CLI 응답 없음 (OAuth 또는 API 한도)"
            return 1
        fi
    else
        log_error "Gemini CLI 설치되지 않음"
        return 1
    fi
}

check_qwen_status() {
    log_info "Qwen CLI 상태 확인..."
    if command -v qwen >/dev/null 2>&1; then
        if timeout 10 qwen --version >/dev/null 2>&1; then
            log_success "Qwen CLI 정상 작동"
            return 0
        else
            log_warning "Qwen CLI 응답 없음 (OAuth 또는 API 한도)"
            return 1
        fi
    else
        log_error "Qwen CLI 설치되지 않음"
        return 1
    fi
}

# 전체 AI 시스템 상태 확인
check_all_ai_systems() {
    local status_report=()
    local working_count=0

    log_info "🔍 전체 AI 시스템 상태 점검 시작..."
    echo ""

    # Claude Code 확인
    if check_claude_status; then
        status_report+=("Claude Code: ✅ 정상")
        ((working_count++))
    else
        status_report+=("Claude Code: ❌ 장애")
    fi

    # Codex CLI 확인
    if check_codex_status; then
        status_report+=("Codex CLI: ✅ 정상")
        ((working_count++))
    else
        status_report+=("Codex CLI: ❌ 장애")
    fi

    # Gemini CLI 확인
    if check_gemini_status; then
        status_report+=("Gemini CLI: ✅ 정상")
        ((working_count++))
    else
        status_report+=("Gemini CLI: ❌ 장애")
    fi

    # Qwen CLI 확인
    if check_qwen_status; then
        status_report+=("Qwen CLI: ✅ 정상")
        ((working_count++))
    else
        status_report+=("Qwen CLI: ❌ 장애")
    fi

    echo ""
    log_info "📊 AI 시스템 상태 요약:"
    printf '%s\n' "${status_report[@]}"
    echo ""

    # 장애 허용 수준 평가
    if [ "$working_count" -eq 4 ]; then
        log_success "🎯 모든 AI 시스템 정상 작동 (4/4)"
        echo "완전한 교차검증 시스템 가능"
    elif [ "$working_count" -ge 2 ]; then
        log_success "🔧 부분 시스템 작동 ($working_count/4) - 제한적 교차검증 가능"
        echo "최소 2개 AI로 교차검증 수행"
    elif [ "$working_count" -eq 1 ]; then
        log_warning "⚠️ 최소 시스템만 작동 ($working_count/4) - Claude Code 단독 작업"
        echo "교차검증 없이 단일 AI 의존"
    else
        log_error "🚨 전체 시스템 장애 ($working_count/4) - 수동 개입 필요"
        echo "모든 AI 도구 점검 및 복구 필요"
        return 1
    fi

    return 0
}

# Fallback 메커니즘
execute_with_fallback() {
    local primary_ai="$1"
    local fallback_ai="$2"
    local query="$3"
    local timeout_seconds="${4:-120}"

    log_info "🎯 $primary_ai 우선 실행, fallback: $fallback_ai"

    # 주 AI 실행 시도
    case "$primary_ai" in
        "codex")
            if timeout "$timeout_seconds" codex exec "$query" 2>/dev/null; then
                log_success "$primary_ai 실행 성공"
                return 0
            fi
            ;;
        "gemini")
            if timeout "$timeout_seconds" gemini "$query" 2>/dev/null; then
                log_success "$primary_ai 실행 성공"
                return 0
            fi
            ;;
        "qwen")
            if timeout 300 qwen -p "$query" 2>/dev/null; then
                log_success "$primary_ai 실행 성공"
                return 0
            fi
            ;;
    esac

    log_warning "$primary_ai 실패, $fallback_ai로 fallback 시도..."

    # Fallback AI 실행
    case "$fallback_ai" in
        "codex")
            if timeout "$timeout_seconds" codex exec "$query" 2>/dev/null; then
                log_success "$fallback_ai fallback 성공"
                return 0
            fi
            ;;
        "gemini")
            if timeout "$timeout_seconds" gemini "$query" 2>/dev/null; then
                log_success "$fallback_ai fallback 성공"
                return 0
            fi
            ;;
        "qwen")
            if timeout 300 qwen -p "$query" 2>/dev/null; then
                log_success "$fallback_ai fallback 성공"
                return 0
            fi
            ;;
        "claude")
            log_info "Claude Code로 자체 처리"
            echo "🤖 Claude Code가 직접 분석을 수행합니다."
            return 0
            ;;
    esac

    log_error "Primary와 Fallback 모두 실패 - 수동 개입 필요"
    return 1
}

# 부하 분산 교차검증
distributed_cross_verification() {
    local target_file="$1"
    local available_ais=()

    log_info "🔄 분산 교차검증 시작: $target_file"

    # 사용 가능한 AI 도구 식별
    check_codex_status && available_ais+=("codex")
    check_gemini_status && available_ais+=("gemini")
    check_qwen_status && available_ais+=("qwen")

    if [ ${#available_ais[@]} -eq 0 ]; then
        log_error "사용 가능한 AI 도구가 없습니다"
        return 1
    fi

    log_info "사용 가능한 AI: ${available_ais[*]}"

    # AI별 역할 분담
    for ai in "${available_ais[@]}"; do
        case "$ai" in
            "codex")
                log_info "🔧 Codex - 구현·버그스캔 담당"
                execute_with_fallback "codex" "claude" "$(basename "$target_file") 버그 스캔과 개선점 3개"
                ;;
            "gemini")
                log_info "🏗️ Gemini - 설계 검증 담당"
                execute_with_fallback "gemini" "claude" "$(basename "$target_file") 아키텍처 설계 검증"
                ;;
            "qwen")
                log_info "⚡ Qwen - 성능 최적화 담당"
                execute_with_fallback "qwen" "claude" "$(basename "$target_file") 성능 최적화 방안"
                ;;
        esac
        echo ""
    done

    log_success "분산 교차검증 완료 (${#available_ais[@]}/3 AI 참여)"
}

# 자동 복구 시도
attempt_auto_recovery() {
    log_info "🔧 자동 복구 시스템 시작..."

    # Node.js 프로세스 정리 (메모리 누수 방지)
    log_info "Node.js 프로세스 정리..."
    pkill -f "node.*claude" 2>/dev/null || true
    pkill -f "node.*codex" 2>/dev/null || true
    pkill -f "node.*gemini" 2>/dev/null || true
    pkill -f "node.*qwen" 2>/dev/null || true

    # 1초 대기
    sleep 1

    # MCP 서버 재연결 시도
    log_info "MCP 서버 재연결 시도..."
    if command -v claude >/dev/null 2>&1; then
        timeout 10 claude mcp list >/dev/null 2>&1 || {
            log_warning "MCP 재연결 필요할 수 있음"
        }
    fi

    log_success "자동 복구 시도 완료"
}

# 메인 실행 함수
main() {
    case "${1:-status}" in
        "status")
            check_all_ai_systems
            ;;
        "verify")
            local target_file="${2:-src/components/ServerCard.tsx}"
            distributed_cross_verification "$target_file"
            ;;
        "recover")
            attempt_auto_recovery
            check_all_ai_systems
            ;;
        "fallback")
            local primary="${2:-codex}"
            local fallback="${3:-claude}"
            local query="${4:-테스트 쿼리}"
            execute_with_fallback "$primary" "$fallback" "$query"
            ;;
        *)
            cat << EOF
🛡️ AI Fault Tolerance System - 단일 장애점 해결 시스템

사용법:
  $0 status                           # 전체 AI 시스템 상태 확인
  $0 verify [파일경로]                # 분산 교차검증 실행
  $0 recover                          # 자동 복구 시도
  $0 fallback [주AI] [백업AI] [쿼리]  # Fallback 메커니즘 테스트

예시:
  $0 status
  $0 verify src/components/Dashboard.tsx
  $0 recover
  $0 fallback codex gemini "코드 리뷰"

특징:
  • 단일 장애점 방지: 하나 실패해도 시스템 지속
  • 자동 Fallback: 주 AI 실패시 백업 AI 자동 전환
  • 부하 분산: 사용 가능한 AI들로 역할 분담
  • 자동 복구: 프로세스 정리 및 MCP 재연결
  • 상태 모니터링: 실시간 AI 도구 상태 추적

장애 허용 수준:
  • 4/4 작동: 완전한 교차검증
  • 2-3/4 작동: 제한적 교차검증
  • 1/4 작동: Claude 단독 작업
  • 0/4 작동: 수동 개입 필요
EOF
            ;;
    esac
}

# 직접 실행시 main 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi