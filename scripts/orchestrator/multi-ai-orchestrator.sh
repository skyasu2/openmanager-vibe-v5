#!/bin/bash

# Multi-AI Cross-Verification Orchestrator - 5-Phase Workflow
# 버전: v1.0.0
# 날짜: 2025-11-08
# 목적: 3-AI 병렬 실행 및 Decision Log 자동 생성

set -euo pipefail

# 프로젝트 루트 자동 결정 (포터블)
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 로그 디렉터리
LOG_DIR="${PROJECT_ROOT}/logs/orchestrator"
LOG_FILE="${LOG_DIR}/orchestrator-$(date +%F-%H-%M-%S).log"
mkdir -p "$LOG_DIR"

# Temporary files for AI results
TEMP_DIR="/tmp/multi-ai-$$"
CODEX_OUTPUT="${TEMP_DIR}/codex_result.txt"
GEMINI_OUTPUT="${TEMP_DIR}/gemini_result.txt"
QWEN_OUTPUT="${TEMP_DIR}/qwen_result.txt"

# Wrapper scripts
CODEX_WRAPPER="${PROJECT_ROOT}/scripts/ai-subagents/codex-wrapper.sh"
GEMINI_WRAPPER="${PROJECT_ROOT}/scripts/ai-subagents/gemini-wrapper.sh"
QWEN_WRAPPER="${PROJECT_ROOT}/scripts/ai-subagents/qwen-wrapper.sh"
DECISION_GENERATOR="${PROJECT_ROOT}/scripts/orchestrator/generate-decision-log.sh"

# 로그 함수
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1" >> "$LOG_FILE"
}

log_phase() {
    echo -e "${MAGENTA}🔄 $1${NC}"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] PHASE: $1" >> "$LOG_FILE"
}

# Cleanup function
cleanup() {
    log_info "🧹 Phase 5: Cleanup - 임시 파일 제거"
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
        log_success "임시 디렉토리 제거 완료: $TEMP_DIR"
    fi
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# 도움말
usage() {
    cat << EOF
${CYAN}🤖 Multi-AI Cross-Verification Orchestrator v1.0.0${NC}

${YELLOW}5-Phase Workflow:${NC}
  Phase 1: Summary 생성 (컨텍스트 준비)
  Phase 2: 3-AI 병렬 실행 (Codex, Gemini, Qwen)
  Phase 3: 결과 수집 및 검증
  Phase 4: Decision Log 자동 생성
  Phase 5: 임시 파일 정리

${YELLOW}사용 방법:${NC}
  $0 --query "질문" --topic "주제" --context "상황" [옵션]

${YELLOW}필수 파라미터:${NC}
  --query QUERY          3-AI에게 전달할 공통 질문
  --topic TOPIC          Decision Log 주제
  --context CONTEXT      Decision Log 상황 설명

${YELLOW}선택 파라미터:${NC}
  --output OUTPUT        Decision Log 출력 경로 (기본: logs/ai-decisions/)
  --dry-run             Decision Log 미리보기만 (저장 안함)
  --skip-codex          Codex 실행 건너뛰기
  --skip-gemini         Gemini 실행 건너뛰기
  --skip-qwen           Qwen 실행 건너뛰기
  -h, --help            이 도움말 표시

${YELLOW}예시:${NC}
  # 기본 사용 (3-AI 모두 실행)
  $0 --query "Node.js v24 vs v22 비교" \\
     --topic "Node.js 버전 선택" \\
     --context "프로젝트에서 v24 사용 중 호환성 문제 발견"

  # 특정 AI만 실행
  $0 --query "성능 최적화 방안" \\
     --topic "알고리즘 성능" \\
     --context "대용량 데이터 처리 속도 개선 필요" \\
     --skip-gemini

  # 미리보기 모드
  $0 --query "타입스크립트 any 사용" \\
     --topic "타입 안전성" \\
     --context "any 타입 사용으로 인한 런타임 에러 발생" \\
     --dry-run

${YELLOW}출력 파일:${NC}
  - AI 결과: /tmp/multi-ai-\$\$/[codex|gemini|qwen]_result.txt (자동 삭제)
  - Decision Log: logs/ai-decisions/YYYY-MM-DD-HH-MM-topic-slug.md
  - 실행 로그: logs/orchestrator/orchestrator-YYYY-MM-DD-HH-MM-SS.log

${YELLOW}특징:${NC}
  ✅ 3-AI 병렬 실행 (최대 속도)
  ✅ 타임아웃 보호 (Codex/Qwen 600s, Gemini 600s)
  ✅ 실패 시 부분 결과 사용 가능
  ✅ TEMPLATE.md 형식 Decision Log 자동 생성
  ✅ 자동 cleanup (임시 파일 제거)

${YELLOW}요구사항:${NC}
  - Bash 4.0+ (set -euo pipefail)
  - Codex/Gemini/Qwen CLI 설치 및 인증
  - Wrapper scripts: scripts/ai-subagents/[codex|gemini|qwen]-wrapper.sh
  - Decision Log generator: scripts/orchestrator/generate-decision-log.sh
EOF
    exit 0
}

# Phase 1: Context Preparation
phase1_prepare_context() {
    log_phase "Phase 1: 컨텍스트 준비 시작"
    
    # Create temp directory
    mkdir -p "$TEMP_DIR"
    log_success "임시 디렉토리 생성: $TEMP_DIR"
    
    # Validate query
    if [ -z "$QUERY" ]; then
        log_error "질문(--query)이 비어있습니다"
        return 1
    fi
    
    # Validate topic and context for Decision Log
    if [ -z "$DECISION_TOPIC" ]; then
        log_error "주제(--topic)가 비어있습니다"
        return 1
    fi
    
    if [ -z "$DECISION_CONTEXT" ]; then
        log_error "상황(--context)이 비어있습니다"
        return 1
    fi
    
    log_info "질문: $QUERY"
    log_info "주제: $DECISION_TOPIC"
    log_info "상황: $DECISION_CONTEXT"
    log_success "Phase 1 완료: 컨텍스트 준비 완료"
}

# Phase 2: Parallel AI Execution
phase2_execute_ais() {
    log_phase "Phase 2: 3-AI 병렬 실행 시작"
    
    local pids=()
    
    # Execute Codex in background
    if [ "$SKIP_CODEX" = false ]; then
        log_info "🤖 Codex 실행 중..."
        (
            if "$CODEX_WRAPPER" "$QUERY" > "$CODEX_OUTPUT" 2>&1; then
                echo "[CODEX_SUCCESS]" >> "$CODEX_OUTPUT"
            else
                echo "[CODEX_FAILED: $?]" >> "$CODEX_OUTPUT"
            fi
        ) &
        pids+=($!)
    else
        log_warning "Codex 실행 건너뜀 (--skip-codex)"
    fi
    
    # Execute Gemini in background
    if [ "$SKIP_GEMINI" = false ]; then
        log_info "🟢 Gemini 실행 중..."
        (
            if "$GEMINI_WRAPPER" "$QUERY" > "$GEMINI_OUTPUT" 2>&1; then
                echo "[GEMINI_SUCCESS]" >> "$GEMINI_OUTPUT"
            else
                echo "[GEMINI_FAILED: $?]" >> "$GEMINI_OUTPUT"
            fi
        ) &
        pids+=($!)
    else
        log_warning "Gemini 실행 건너뜀 (--skip-gemini)"
    fi
    
    # Execute Qwen in background
    if [ "$SKIP_QWEN" = false ]; then
        log_info "🟡 Qwen 실행 중..."
        (
            if "$QWEN_WRAPPER" "$QUERY" > "$QWEN_OUTPUT" 2>&1; then
                echo "[QWEN_SUCCESS]" >> "$QWEN_OUTPUT"
            else
                echo "[QWEN_FAILED: $?]" >> "$QWEN_OUTPUT"
            fi
        ) &
        pids+=($!)
    else
        log_warning "Qwen 실행 건너뜀 (--skip-qwen)"
    fi
    
    # Wait for all background jobs
    log_info "⏳ 3-AI 실행 대기 중... (PID: ${pids[*]})"
    local failed_count=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            ((failed_count++))
        fi
    done
    
    if [ "$failed_count" -gt 0 ]; then
        log_warning "일부 AI 실행 실패 ($failed_count/${#pids[@]}), 부분 결과 사용"
    else
        log_success "Phase 2 완료: 3-AI 병렬 실행 성공"
    fi
}

# Phase 3: Aggregate Results
phase3_aggregate_results() {
    log_phase "Phase 3: 결과 수집 및 검증 시작"
    
    local success_count=0
    
    # Check Codex output
    if [ "$SKIP_CODEX" = false ]; then
        if [ -f "$CODEX_OUTPUT" ] && grep -q "CODEX_SUCCESS" "$CODEX_OUTPUT" 2>/dev/null; then
            log_success "Codex 결과 수집 완료 ($(wc -l < "$CODEX_OUTPUT") 줄)"
            ((success_count++))
        else
            log_error "Codex 결과 없음 또는 실패"
        fi
    fi
    
    # Check Gemini output
    if [ "$SKIP_GEMINI" = false ]; then
        if [ -f "$GEMINI_OUTPUT" ] && grep -q "GEMINI_SUCCESS" "$GEMINI_OUTPUT" 2>/dev/null; then
            log_success "Gemini 결과 수집 완료 ($(wc -l < "$GEMINI_OUTPUT") 줄)"
            ((success_count++))
        else
            log_error "Gemini 결과 없음 또는 실패"
        fi
    fi
    
    # Check Qwen output
    if [ "$SKIP_QWEN" = false ]; then
        if [ -f "$QWEN_OUTPUT" ] && grep -q "QWEN_SUCCESS" "$QWEN_OUTPUT" 2>/dev/null; then
            log_success "Qwen 결과 수집 완료 ($(wc -l < "$QWEN_OUTPUT") 줄)"
            ((success_count++))
        else
            log_error "Qwen 결과 없음 또는 실패"
        fi
    fi
    
    if [ "$success_count" -eq 0 ]; then
        log_error "모든 AI 실행 실패 - Decision Log 생성 불가"
        return 1
    fi
    
    log_success "Phase 3 완료: $success_count 개 AI 결과 수집"
}

# Phase 4: Generate Decision Log
phase4_generate_decision_log() {
    log_phase "Phase 4: Decision Log 생성 시작"
    
    # Prepare generator arguments
    local generator_args=(
        "--topic" "$DECISION_TOPIC"
        "--context" "$DECISION_CONTEXT"
    )
    
    # Add AI output files if they exist and succeeded
    if [ "$SKIP_CODEX" = false ] && [ -f "$CODEX_OUTPUT" ] && grep -q "CODEX_SUCCESS" "$CODEX_OUTPUT" 2>/dev/null; then
        generator_args+=("--codex" "$CODEX_OUTPUT")
    fi
    
    if [ "$SKIP_GEMINI" = false ] && [ -f "$GEMINI_OUTPUT" ] && grep -q "GEMINI_SUCCESS" "$GEMINI_OUTPUT" 2>/dev/null; then
        generator_args+=("--gemini" "$GEMINI_OUTPUT")
    fi
    
    if [ "$SKIP_QWEN" = false ] && [ -f "$QWEN_OUTPUT" ] && grep -q "QWEN_SUCCESS" "$QWEN_OUTPUT" 2>/dev/null; then
        generator_args+=("--qwen" "$QWEN_OUTPUT")
    fi
    
    # Add optional output path
    if [ -n "$OUTPUT_PATH" ]; then
        generator_args+=("--output" "$OUTPUT_PATH")
    fi
    
    # Add dry-run flag if requested
    if [ "$DRY_RUN" = true ]; then
        generator_args+=("--dry-run")
    fi
    
    # Execute Decision Log generator
    log_info "📝 Decision Log 생성 중..."
    log_info "실행: $DECISION_GENERATOR ${generator_args[*]}"
    
    if "$DECISION_GENERATOR" "${generator_args[@]}"; then
        log_success "Phase 4 완료: Decision Log 생성 성공"
    else
        log_error "Decision Log 생성 실패"
        return 1
    fi
}

# Main execution
main() {
    # Default values
    QUERY=""
    DECISION_TOPIC=""
    DECISION_CONTEXT=""
    OUTPUT_PATH=""
    DRY_RUN=false
    SKIP_CODEX=false
    SKIP_GEMINI=false
    SKIP_QWEN=false
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --query)
                QUERY="$2"
                shift 2
                ;;
            --topic)
                DECISION_TOPIC="$2"
                shift 2
                ;;
            --context)
                DECISION_CONTEXT="$2"
                shift 2
                ;;
            --output)
                OUTPUT_PATH="$2"
                shift 2
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --skip-codex)
                SKIP_CODEX=true
                shift
                ;;
            --skip-gemini)
                SKIP_GEMINI=true
                shift
                ;;
            --skip-qwen)
                SKIP_QWEN=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                echo "알 수 없는 옵션: $1" >&2
                usage
                ;;
        esac
    done
    
    # Banner
    echo ""
    log_info "🚀 Multi-AI Orchestrator v1.0.0 시작"
    echo ""
    
    # Execute 5-phase workflow
    phase1_prepare_context || exit 1
    phase2_execute_ais || exit 1
    phase3_aggregate_results || exit 1
    phase4_generate_decision_log || exit 1
    # Phase 5 (cleanup) is handled by trap EXIT
    
    echo ""
    log_success "✅ 전체 워크플로우 완료"
    log_info "로그 파일: $LOG_FILE"
    echo ""
}

# Run main
main "$@"
