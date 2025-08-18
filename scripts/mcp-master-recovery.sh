#!/bin/bash

# =============================================================================
# 🔧 MCP 마스터 복구 시스템 v3.0.0
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: 모든 MCP 복구 도구를 통합한 원클릭 복구 시스템
# 🛠️ 기능: 지능형 문제 감지 → 최적 복구 전략 선택 → 자동 실행
# 🔧 특징: 5개 서브 시스템 통합, 단계별 복구, 롤백 지원
# 
# 📦 통합된 서브 시스템:
# 1. mcp-recovery-complete.sh      - 종합 MCP 복구
# 2. mcp-env-recovery.sh           - 환경변수 복구
# 3. serena-auto-recovery.sh       - Serena SSE 복구
# 4. mcp-dependencies-installer.sh - 의존성 자동 설치
# 5. mcp-config-backup.sh          - 설정 백업/복구
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
readonly SCRIPT_VERSION="3.0.0"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="./logs/mcp-master-recovery-$(date +%Y%m%d_%H%M%S).log"
readonly RECOVERY_SESSION="recovery-session-$(date +%Y%m%d_%H%M%S)"

# 🔧 서브 스크립트 경로
readonly RECOVERY_COMPLETE="$SCRIPT_DIR/mcp-recovery-complete.sh"
readonly ENV_RECOVERY="$SCRIPT_DIR/mcp-env-recovery.sh"
readonly SERENA_RECOVERY="$SCRIPT_DIR/serena-auto-recovery.sh"
readonly DEPENDENCIES_INSTALLER="$SCRIPT_DIR/mcp-dependencies-installer.sh"
readonly CONFIG_BACKUP="$SCRIPT_DIR/mcp-config-backup.sh"

# 📊 복구 상태 추적
declare -A RECOVERY_STATUS=(
    ["system_check"]="pending"
    ["backup_config"]="pending"
    ["fix_dependencies"]="pending"
    ["fix_environment"]="pending"
    ["fix_serena"]="pending"
    ["verify_recovery"]="pending"
)

# 🔍 문제 유형 정의
declare -A PROBLEM_TYPES=(
    ["no_mcp_servers"]="MCP 서버 연결 없음"
    ["partial_mcp_failure"]="일부 MCP 서버 연결 실패"
    ["serena_timeout"]="Serena MCP 타임아웃"
    ["missing_dependencies"]="의존성 패키지 누락"
    ["env_vars_missing"]="환경변수 누락"
    ["config_corrupted"]="설정 파일 손상"
    ["claude_not_installed"]="Claude Code 설치 안됨"
)

print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}        🔧 MCP 마스터 복구 시스템 v${SCRIPT_VERSION}              ${CYAN}║${NC}"
    echo -e "${CYAN}╠══════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}║${YELLOW}           AI 기반 지능형 문제 진단 및 자동 복구              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$RECOVERY_SESSION] [$level] $message" >> "$LOG_FILE"
    
    case "$level" in
        "INFO")  echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "DEBUG") echo -e "${PURPLE}🔍 $message${NC}" ;;
        "RECOVERY") echo -e "${CYAN}🔧 $message${NC}" ;;
        "MASTER") echo -e "${WHITE}👑 $message${NC}" ;;
    esac
}

# 🔍 1단계: 종합 시스템 진단
comprehensive_diagnosis() {
    log "MASTER" "🔍 종합 시스템 진단 시작..."
    echo
    
    local detected_problems=()
    local diagnosis_score=0
    local max_score=100
    
    # Claude Code 설치 확인
    if ! command -v claude &> /dev/null; then
        detected_problems+=("claude_not_installed")
        log "ERROR" "Claude Code 설치되지 않음"
    else
        log "SUCCESS" "Claude Code 설치됨"
        ((diagnosis_score += 20))
    fi
    
    # Node.js 환경 확인
    if command -v node &> /dev/null && command -v npm &> /dev/null; then
        log "SUCCESS" "Node.js 환경 정상"
        ((diagnosis_score += 15))
    else
        log "ERROR" "Node.js 환경 문제"
        detected_problems+=("missing_dependencies")
    fi
    
    # MCP 서버 상태 확인
    local mcp_status_result=""
    if command -v claude &> /dev/null; then
        if timeout 30s claude mcp list > /tmp/mcp_diagnosis.txt 2>&1; then
            local connected_count=$(grep -c "✓ Connected" /tmp/mcp_diagnosis.txt || echo "0")
            local failed_count=$(grep -c "✗ Failed\|❌ Failed" /tmp/mcp_diagnosis.txt || echo "0")
            
            if [[ $connected_count -eq 12 ]]; then
                log "SUCCESS" "모든 MCP 서버 정상 (12/12)"
                ((diagnosis_score += 25))
            elif [[ $connected_count -gt 0 ]]; then
                log "WARNING" "일부 MCP 서버 연결 실패 ($connected_count/12)"
                detected_problems+=("partial_mcp_failure")
                ((diagnosis_score += 10))
            else
                log "ERROR" "MCP 서버 연결 없음"
                detected_problems+=("no_mcp_servers")
            fi
            
            # Serena 특별 확인
            if grep -q "serena.*✗\|serena.*❌" /tmp/mcp_diagnosis.txt; then
                detected_problems+=("serena_timeout")
                log "ERROR" "Serena MCP 연결 실패 감지"
            fi
        else
            log "ERROR" "MCP 상태 확인 실패"
            detected_problems+=("no_mcp_servers")
        fi
    fi
    
    # 환경변수 확인
    local missing_env_vars=()
    local required_vars=("GITHUB_TOKEN" "SUPABASE_ACCESS_TOKEN" "TAVILY_API_KEY")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_env_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_env_vars[@]} -gt 0 ]]; then
        detected_problems+=("env_vars_missing")
        log "WARNING" "누락된 환경변수: ${missing_env_vars[*]}"
        ((diagnosis_score += 5))
    else
        log "SUCCESS" "필수 환경변수 설정됨"
        ((diagnosis_score += 15))
    fi
    
    # 설정 파일 확인
    local config_files=(".mcp.json" ".env.local")
    local missing_configs=()
    
    for config_file in "${config_files[@]}"; do
        if [[ ! -f "$config_file" ]]; then
            missing_configs+=("$config_file")
        fi
    done
    
    if [[ ${#missing_configs[@]} -gt 0 ]]; then
        detected_problems+=("config_corrupted")
        log "WARNING" "누락된 설정 파일: ${missing_configs[*]}"
    else
        log "SUCCESS" "설정 파일 존재"
        ((diagnosis_score += 10))
    fi
    
    # 의존성 패키지 확인
    local critical_packages=("@modelcontextprotocol/server-filesystem" "@supabase/mcp-server-supabase")
    local missing_packages=()
    
    for package in "${critical_packages[@]}"; do
        if ! npm list -g "$package" &> /dev/null; then
            missing_packages+=("$package")
        fi
    done
    
    if [[ ${#missing_packages[@]} -gt 0 ]]; then
        detected_problems+=("missing_dependencies")
        log "WARNING" "누락된 패키지: ${missing_packages[*]}"
    else
        log "SUCCESS" "핵심 패키지 설치됨"
        ((diagnosis_score += 15))
    fi
    
    echo
    
    # 진단 결과 요약
    local health_percentage=$((diagnosis_score * 100 / max_score))
    log "MASTER" "📊 시스템 건강도: $health_percentage% ($diagnosis_score/$max_score)"
    
    if [[ ${#detected_problems[@]} -eq 0 ]]; then
        log "SUCCESS" "🎉 문제 없음 - 시스템 정상"
        return 0
    else
        log "WARNING" "🔍 감지된 문제: ${#detected_problems[@]}개"
        for problem in "${detected_problems[@]}"; do
            log "WARNING" "  • ${PROBLEM_TYPES[$problem]}"
        done
        echo
        return 1
    fi
}

# 🧠 2단계: 지능형 복구 전략 결정
determine_recovery_strategy() {
    log "MASTER" "🧠 지능형 복구 전략 결정 중..."
    echo
    
    local recovery_plan=()
    local estimated_time=0
    
    # 문제 심각도에 따른 우선순위 결정
    
    # 1. 기본 환경 문제 (최우선)
    if grep -q "claude_not_installed\|missing_dependencies" <<< "${detected_problems[*]}" 2>/dev/null; then
        recovery_plan+=("dependencies")
        log "RECOVERY" "1순위: 의존성 설치 및 기본 환경 구성"
        ((estimated_time += 180)) # 3분
    fi
    
    # 2. 설정 백업 (안전장치)
    recovery_plan+=("backup")
    log "RECOVERY" "2순위: 현재 설정 백업 (안전장치)"
    ((estimated_time += 30)) # 30초
    
    # 3. 환경변수 문제
    if grep -q "env_vars_missing" <<< "${detected_problems[*]}" 2>/dev/null; then
        recovery_plan+=("environment")
        log "RECOVERY" "3순위: 환경변수 설정 복구"
        ((estimated_time += 60)) # 1분
    fi
    
    # 4. Serena 특별 처리
    if grep -q "serena_timeout" <<< "${detected_problems[*]}" 2>/dev/null; then
        recovery_plan+=("serena")
        log "RECOVERY" "4순위: Serena SSE 복구"
        ((estimated_time += 120)) # 2분
    fi
    
    # 5. 종합 복구 (마무리)
    recovery_plan+=("comprehensive")
    log "RECOVERY" "5순위: 종합 MCP 시스템 복구"
    ((estimated_time += 90)) # 1.5분
    
    # 6. 최종 검증
    recovery_plan+=("verification")
    log "RECOVERY" "6순위: 복구 결과 검증"
    ((estimated_time += 30)) # 30초
    
    local estimated_minutes=$((estimated_time / 60))
    local estimated_seconds=$((estimated_time % 60))
    
    echo
    log "MASTER" "📋 복구 계획: ${#recovery_plan[@]}단계, 예상 소요시간: ${estimated_minutes}분 ${estimated_seconds}초"
    echo
    
    # 사용자 확인
    echo -e "${YELLOW}📋 실행될 복구 단계:${NC}"
    local step_num=1
    for step in "${recovery_plan[@]}"; do
        case "$step" in
            "dependencies") echo -e "  ${step_num}. 📦 의존성 패키지 자동 설치" ;;
            "backup") echo -e "  ${step_num}. 💾 현재 설정 백업" ;;
            "environment") echo -e "  ${step_num}. 🌍 환경변수 복구" ;;
            "serena") echo -e "  ${step_num}. 🤖 Serena SSE 복구" ;;
            "comprehensive") echo -e "  ${step_num}. 🔧 종합 MCP 복구" ;;
            "verification") echo -e "  ${step_num}. ✅ 복구 검증" ;;
        esac
        ((step_num++))
    done
    
    echo
    echo -n "복구를 시작하시겠습니까? [y/N]: "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log "INFO" "복구 취소됨"
        return 1
    fi
    
    # 전역 변수에 복구 계획 저장
    recovery_steps=("${recovery_plan[@]}")
    return 0
}

# 🔧 3단계: 서브 시스템 실행
execute_subsystem() {
    local system="$1"
    local description="$2"
    local script_path="$3"
    shift 3
    local args=("$@")
    
    log "RECOVERY" "🔧 $description 실행 중..."
    
    if [[ ! -f "$script_path" ]]; then
        log "ERROR" "서브 시스템 스크립트 없음: $script_path"
        RECOVERY_STATUS["$system"]="failed"
        return 1
    fi
    
    if [[ ! -x "$script_path" ]]; then
        chmod +x "$script_path"
        log "INFO" "실행 권한 부여: $script_path"
    fi
    
    local start_time=$(date +%s)
    
    if timeout 300s "$script_path" "${args[@]}" >> "$LOG_FILE" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        log "SUCCESS" "$description 완료 (${duration}초 소요)"
        RECOVERY_STATUS["$system"]="success"
        return 0
    else
        local exit_code=$?
        log "ERROR" "$description 실패 (종료 코드: $exit_code)"
        RECOVERY_STATUS["$system"]="failed"
        return 1
    fi
}

# 🚀 4단계: 단계별 복구 실행
execute_recovery_plan() {
    log "MASTER" "🚀 단계별 복구 실행 시작..."
    echo
    
    local total_steps=${#recovery_steps[@]}
    local current_step=1
    local failed_steps=()
    
    for step in "${recovery_steps[@]}"; do
        echo -e "${CYAN}╭─ 단계 $current_step/$total_steps: $(echo "$step" | tr '[:lower:]' '[:upper:]') ─╮${NC}"
        
        case "$step" in
            "dependencies")
                execute_subsystem "fix_dependencies" "📦 의존성 자동 설치" "$DEPENDENCIES_INSTALLER" "install" || failed_steps+=("dependencies")
                ;;
            "backup")
                execute_subsystem "backup_config" "💾 설정 백업" "$CONFIG_BACKUP" "backup" || failed_steps+=("backup")
                ;;
            "environment")
                execute_subsystem "fix_environment" "🌍 환경변수 복구" "$ENV_RECOVERY" "--auto" || failed_steps+=("environment")
                ;;
            "serena")
                execute_subsystem "fix_serena" "🤖 Serena SSE 복구" "$SERENA_RECOVERY" "restart" "--force" || failed_steps+=("serena")
                ;;
            "comprehensive")
                execute_subsystem "system_check" "🔧 종합 MCP 복구" "$RECOVERY_COMPLETE" || failed_steps+=("comprehensive")
                ;;
            "verification")
                verify_final_recovery || failed_steps+=("verification")
                ;;
        esac
        
        echo -e "${CYAN}╰──────────────────────────────────────────────────────────────╯${NC}"
        echo
        
        ((current_step++))
        
        # 중간 단계에서 잠시 대기 (시스템 안정화)
        if [[ $current_step -le $total_steps ]]; then
            sleep 2
        fi
    done
    
    # 실행 결과 요약
    local success_count=$((total_steps - ${#failed_steps[@]}))
    
    echo
    log "MASTER" "📊 복구 실행 결과: $success_count/$total_steps 성공"
    
    if [[ ${#failed_steps[@]} -eq 0 ]]; then
        log "SUCCESS" "🎉 모든 복구 단계 성공"
        return 0
    else
        log "WARNING" "⚠️  실패한 단계: ${failed_steps[*]}"
        
        # 실패한 단계에 대한 수동 복구 가이드 제공
        echo
        log "RECOVERY" "📋 수동 복구 가이드:"
        for failed_step in "${failed_steps[@]}"; do
            case "$failed_step" in
                "dependencies")
                    echo "  • npm install -g <package-name> 수동 실행"
                    ;;
                "environment")
                    echo "  • .env.local 파일 수동 편집"
                    ;;
                "serena")
                    echo "  • uvx 설치 후 Serena 재시작"
                    ;;
                *)
                    echo "  • $failed_step 관련 로그 확인: $LOG_FILE"
                    ;;
            esac
        done
        
        return 1
    fi
}

# ✅ 5단계: 최종 복구 검증
verify_final_recovery() {
    log "RECOVERY" "✅ 최종 복구 검증 중..."
    
    RECOVERY_STATUS["verify_recovery"]="in_progress"
    
    local verification_score=0
    local max_verification_score=100
    
    # MCP 서버 재확인
    if command -v claude &> /dev/null; then
        if timeout 30s claude mcp list > /tmp/mcp_final_check.txt 2>&1; then
            local connected_count=$(grep -c "✓ Connected" /tmp/mcp_final_check.txt || echo "0")
            
            if [[ $connected_count -eq 12 ]]; then
                log "SUCCESS" "MCP 서버 연결: 12/12 완벽"
                ((verification_score += 40))
            elif [[ $connected_count -ge 10 ]]; then
                log "SUCCESS" "MCP 서버 연결: $connected_count/12 양호"
                ((verification_score += 30))
            elif [[ $connected_count -ge 6 ]]; then
                log "WARNING" "MCP 서버 연결: $connected_count/12 보통"
                ((verification_score += 15))
            else
                log "ERROR" "MCP 서버 연결: $connected_count/12 불량"
            fi
        else
            log "ERROR" "MCP 서버 상태 확인 실패"
        fi
    else
        log "ERROR" "Claude Code 여전히 설치되지 않음"
    fi
    
    # 환경변수 재확인
    local env_vars_ok=true
    local required_vars=("GITHUB_TOKEN" "SUPABASE_ACCESS_TOKEN" "TAVILY_API_KEY")
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            env_vars_ok=false
            break
        fi
    done
    
    if $env_vars_ok; then
        log "SUCCESS" "환경변수 설정 완료"
        ((verification_score += 20))
    else
        log "WARNING" "일부 환경변수 여전히 누락"
    fi
    
    # 핵심 패키지 재확인
    local packages_ok=true
    local critical_packages=("@modelcontextprotocol/server-filesystem" "@supabase/mcp-server-supabase")
    
    for package in "${critical_packages[@]}"; do
        if ! npm list -g "$package" &> /dev/null; then
            packages_ok=false
            break
        fi
    done
    
    if $packages_ok; then
        log "SUCCESS" "핵심 패키지 설치 확인"
        ((verification_score += 20))
    else
        log "WARNING" "일부 패키지 여전히 누락"
    fi
    
    # Serena 특별 확인
    if timeout 10s curl -s "http://localhost:9121/health" &> /dev/null; then
        log "SUCCESS" "Serena SSE 서버 정상 동작"
        ((verification_score += 20))
    else
        log "WARNING" "Serena SSE 서버 응답 없음"
    fi
    
    local final_percentage=$((verification_score * 100 / max_verification_score))
    
    echo
    log "MASTER" "🎯 최종 검증 점수: $final_percentage% ($verification_score/$max_verification_score)"
    
    if [[ $final_percentage -ge 80 ]]; then
        log "SUCCESS" "✅ 복구 검증 통과 - 시스템 정상"
        RECOVERY_STATUS["verify_recovery"]="success"
        return 0
    elif [[ $final_percentage -ge 60 ]]; then
        log "WARNING" "⚠️  부분 복구 성공 - 추가 작업 필요"
        RECOVERY_STATUS["verify_recovery"]="partial"
        return 1
    else
        log "ERROR" "❌ 복구 실패 - 수동 개입 필요"
        RECOVERY_STATUS["verify_recovery"]="failed"
        return 2
    fi
}

# 📊 6단계: 최종 리포트 생성
generate_master_report() {
    echo
    log "MASTER" "📊 최종 복구 리포트 생성 중..."
    echo
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}               🔧 MCP 마스터 복구 완료 리포트                  ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # 복구 세션 정보
    echo -e "${BLUE}📋 복구 세션:${NC} $RECOVERY_SESSION"
    echo -e "${BLUE}⏰ 완료 시간:${NC} $(date)"
    echo -e "${BLUE}📁 로그 파일:${NC} $LOG_FILE"
    echo
    
    # 복구 단계별 결과
    echo -e "${BLUE}📊 복구 단계별 결과:${NC}"
    for step in "${!RECOVERY_STATUS[@]}"; do
        local status="${RECOVERY_STATUS[$step]}"
        case "$status" in
            "success") echo -e "  ${GREEN}✅ $step: 성공${NC}" ;;
            "failed") echo -e "  ${RED}❌ $step: 실패${NC}" ;;
            "partial") echo -e "  ${YELLOW}⚠️  $step: 부분 성공${NC}" ;;
            "pending") echo -e "  ${GRAY}⏸️  $step: 실행 안됨${NC}" ;;
            *) echo -e "  ${BLUE}❓ $step: $status${NC}" ;;
        esac
    done
    
    echo
    
    # 시스템 현재 상태
    echo -e "${BLUE}🔧 시스템 현재 상태:${NC}"
    
    # MCP 서버 상태
    if command -v claude &> /dev/null; then
        if timeout 15s claude mcp list > /tmp/mcp_final_status.txt 2>&1; then
            local connected=$(grep -c "✓ Connected" /tmp/mcp_final_status.txt || echo "0")
            echo -e "  ${GREEN}• MCP 서버: $connected/12 연결됨${NC}"
        else
            echo -e "  ${RED}• MCP 서버: 상태 확인 불가${NC}"
        fi
    else
        echo -e "  ${RED}• Claude Code: 설치되지 않음${NC}"
    fi
    
    # 환경변수 상태
    local env_count=0
    for var in "GITHUB_TOKEN" "SUPABASE_ACCESS_TOKEN" "TAVILY_API_KEY"; do
        if [[ -n "${!var:-}" ]]; then
            ((env_count++))
        fi
    done
    echo -e "  ${GREEN}• 환경변수: $env_count/3 설정됨${NC}"
    
    # Serena 상태
    if timeout 5s curl -s "http://localhost:9121/health" &> /dev/null; then
        echo -e "  ${GREEN}• Serena SSE: 정상 동작${NC}"
    else
        echo -e "  ${YELLOW}• Serena SSE: 응답 없음${NC}"
    fi
    
    echo
    
    # 다음 단계 안내
    echo -e "${BLUE}🔧 권장 다음 단계:${NC}"
    
    if [[ "${RECOVERY_STATUS[verify_recovery]}" == "success" ]]; then
        echo "  1. 애플리케이션 테스트: npm run dev"
        echo "  2. MCP 기능 테스트: 개발 도구에서 MCP 사용"
        echo "  3. 정기 백업 설정: cron 등록"
    elif [[ "${RECOVERY_STATUS[verify_recovery]}" == "partial" ]]; then
        echo "  1. 실패한 단계 수동 복구"
        echo "  2. 로그 파일 상세 확인: cat $LOG_FILE"
        echo "  3. 개별 복구 스크립트 실행"
    else
        echo "  1. 수동 문제 해결 필요"
        echo "  2. 기술 지원 요청 시 로그 첨부"
        echo "  3. 시스템 초기화 고려"
    fi
    
    echo
    
    # 복구 도구 목록
    echo -e "${BLUE}🛠️ 개별 복구 도구:${NC}"
    echo "  • 종합 복구: ./scripts/mcp-recovery-complete.sh"
    echo "  • 환경변수: ./scripts/mcp-env-recovery.sh"
    echo "  • Serena SSE: ./scripts/serena-auto-recovery.sh"
    echo "  • 의존성: ./scripts/mcp-dependencies-installer.sh"
    echo "  • 설정 백업: ./scripts/mcp-config-backup.sh"
    
    echo
    log "SUCCESS" "🏁 마스터 복구 시스템 실행 완료"
}

# 🔧 권한 설정 및 스크립트 준비
prepare_scripts() {
    log "MASTER" "🔧 서브 스크립트 권한 설정 중..."
    
    local scripts=("$RECOVERY_COMPLETE" "$ENV_RECOVERY" "$SERENA_RECOVERY" "$DEPENDENCIES_INSTALLER" "$CONFIG_BACKUP")
    local missing_scripts=()
    
    for script in "${scripts[@]}"; do
        if [[ -f "$script" ]]; then
            chmod +x "$script"
            log "DEBUG" "실행 권한 설정: $(basename "$script")"
        else
            missing_scripts+=("$(basename "$script")")
            log "WARNING" "스크립트 없음: $(basename "$script")"
        fi
    done
    
    if [[ ${#missing_scripts[@]} -gt 0 ]]; then
        log "ERROR" "누락된 스크립트: ${missing_scripts[*]}"
        echo -e "${YELLOW}💡 누락된 스크립트를 생성하거나 올바른 디렉토리에서 실행하세요.${NC}"
        return 1
    fi
    
    log "SUCCESS" "모든 서브 스크립트 준비 완료"
    return 0
}

# 📋 복구 상태 표시
show_recovery_status() {
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}                    🔧 복구 상태 모니터                        ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    for step in "${!RECOVERY_STATUS[@]}"; do
        local status="${RECOVERY_STATUS[$step]}"
        local step_name=""
        
        case "$step" in
            "system_check") step_name="시스템 진단" ;;
            "backup_config") step_name="설정 백업" ;;
            "fix_dependencies") step_name="의존성 설치" ;;
            "fix_environment") step_name="환경변수 복구" ;;
            "fix_serena") step_name="Serena SSE 복구" ;;
            "verify_recovery") step_name="복구 검증" ;;
            *) step_name="$step" ;;
        esac
        
        case "$status" in
            "success") echo -e "  ${GREEN}✅ $step_name${NC}" ;;
            "failed") echo -e "  ${RED}❌ $step_name${NC}" ;;
            "in_progress") echo -e "  ${YELLOW}🔄 $step_name (진행 중)${NC}" ;;
            "pending") echo -e "  ${BLUE}⏸️  $step_name (대기 중)${NC}" ;;
            *) echo -e "  ${PURPLE}❓ $step_name ($status)${NC}" ;;
        esac
    done
    echo
}

# 도움말 출력
show_help() {
    echo -e "${CYAN}🔧 MCP 마스터 복구 시스템 v${SCRIPT_VERSION}${NC}"
    echo
    echo -e "${WHITE}사용법:${NC}"
    echo "  $0 [명령] [옵션]"
    echo
    echo -e "${WHITE}명령:${NC}"
    echo "  auto        자동 진단 및 복구 (기본값)"
    echo "  diagnose    시스템 진단만 실행"
    echo "  status      현재 복구 상태 표시"
    echo "  force       강제 전체 복구"
    echo "  rollback    이전 설정으로 롤백"
    echo "  clean       로그 및 임시 파일 정리"
    echo
    echo -e "${WHITE}옵션:${NC}"
    echo "  --interactive  대화형 모드"
    echo "  --verbose     상세 로그 출력"
    echo "  --dry-run     실제 실행 없이 계획만 표시"
    echo "  --skip-backup 백업 단계 건너뛰기"
    echo
    echo -e "${WHITE}예시:${NC}"
    echo "  $0                    # 자동 진단 및 복구"
    echo "  $0 diagnose           # 진단만 실행"
    echo "  $0 auto --interactive # 대화형 복구"
    echo "  $0 force              # 강제 전체 복구"
    echo
    echo -e "${WHITE}서브 시스템:${NC}"
    echo "  • mcp-recovery-complete.sh    - 종합 MCP 복구"
    echo "  • mcp-env-recovery.sh         - 환경변수 복구"
    echo "  • serena-auto-recovery.sh     - Serena SSE 복구"
    echo "  • mcp-dependencies-installer.sh - 의존성 설치"
    echo "  • mcp-config-backup.sh        - 설정 백업/복구"
    echo
}

# 🚀 메인 실행 함수
main() {
    local command="${1:-auto}"
    local interactive_mode=false
    local verbose_mode=false
    local dry_run=false
    local skip_backup=false
    
    # 옵션 파싱
    while [[ $# -gt 0 ]]; do
        case "${1:-}" in
            "--interactive")
                interactive_mode=true
                shift
                ;;
            "--verbose")
                verbose_mode=true
                shift
                ;;
            "--dry-run")
                dry_run=true
                shift
                ;;
            "--skip-backup")
                skip_backup=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # 헤더 출력
    if [[ "$command" != "status" && "$command" != "clean" ]]; then
        print_header
    fi
    
    # 서브 스크립트 준비
    if [[ "$command" != "status" && "$command" != "clean" ]]; then
        if ! prepare_scripts; then
            log "ERROR" "서브 스크립트 준비 실패"
            exit 1
        fi
    fi
    
    # 명령 실행
    case "$command" in
        "auto")
            log "MASTER" "🚀 자동 진단 및 복구 모드 시작"
            
            if comprehensive_diagnosis; then
                log "MASTER" "✅ 시스템 정상 - 복구 불필요"
                return 0
            fi
            
            if determine_recovery_strategy; then
                if $dry_run; then
                    log "INFO" "Dry-run 모드 - 실제 실행하지 않음"
                else
                    execute_recovery_plan
                    generate_master_report
                fi
            fi
            ;;
        "diagnose")
            comprehensive_diagnosis
            ;;
        "status")
            show_recovery_status
            ;;
        "force")
            log "MASTER" "🔥 강제 전체 복구 시작"
            # 모든 복구 단계 강제 실행
            recovery_steps=("backup" "dependencies" "environment" "serena" "comprehensive" "verification")
            execute_recovery_plan
            generate_master_report
            ;;
        "rollback")
            log "MASTER" "🔄 이전 설정으로 롤백"
            if [[ -x "$CONFIG_BACKUP" ]]; then
                "$CONFIG_BACKUP" restore
            else
                log "ERROR" "백업 스크립트를 찾을 수 없습니다"
            fi
            ;;
        "clean")
            log "MASTER" "🧹 로그 및 임시 파일 정리"
            rm -f /tmp/mcp_*.txt
            find ./logs -name "mcp-master-recovery-*.log" -mtime +7 -delete 2>/dev/null || true
            log "SUCCESS" "정리 완료"
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 명령: $command${NC}"
            show_help
            exit 1
            ;;
    esac
}

# 전역 변수 초기화
declare -a recovery_steps
declare -a detected_problems

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