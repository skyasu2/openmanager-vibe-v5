#!/bin/bash

# =============================================================================
# 🔍 Claude Code 폴더 구조 검증 스크립트
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: .claude 폴더가 Claude Code 공식 표준을 준수하는지 검증
# 📖 참조: https://docs.anthropic.com/en/docs/claude-code/settings
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
readonly CLAUDE_DIR=".claude"
readonly SCRIPT_VERSION="1.0.0"

print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}        🔍 Claude Code 폴더 구조 검증 v${SCRIPT_VERSION}              ${CYAN}║${NC}"
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
    esac
}

# 📁 기본 폴더 구조 검증
validate_folder_structure() {
    log "INFO" "📁 기본 폴더 구조 검증 중..."
    echo
    
    local errors=0
    
    # .claude 폴더 존재 확인
    if [[ ! -d "$CLAUDE_DIR" ]]; then
        log "ERROR" ".claude 폴더가 존재하지 않습니다"
        return 1
    fi
    
    # 필수 구조 확인
    local required_items=(
        "$CLAUDE_DIR/agents:directory"
        "$CLAUDE_DIR/settings.json:file"
    )
    
    for item in "${required_items[@]}"; do
        local path="${item%:*}"
        local type="${item#*:}"
        
        if [[ "$type" == "directory" ]]; then
            if [[ -d "$path" ]]; then
                log "SUCCESS" "필수 디렉토리 존재: $path"
            else
                log "ERROR" "필수 디렉토리 누락: $path"
                ((errors++))
            fi
        elif [[ "$type" == "file" ]]; then
            if [[ -f "$path" ]]; then
                log "SUCCESS" "필수 파일 존재: $path"
            else
                log "WARNING" "설정 파일 누락: $path (자동 생성됨)"
            fi
        fi
    done
    
    # 선택적 파일 확인
    if [[ -f "$CLAUDE_DIR/settings.local.json" ]]; then
        log "SUCCESS" "개인 설정 파일 존재: settings.local.json"
    else
        log "INFO" "개인 설정 파일 없음: settings.local.json (필요시 생성됨)"
    fi
    
    echo
    return $errors
}

# 🚫 잘못된 구조 감지
detect_wrong_structure() {
    log "INFO" "🚫 잘못된 구조 감지 중..."
    echo
    
    local warnings=0
    
    # subagents 폴더 확인 (공식 구조 아님)
    if [[ -d "$CLAUDE_DIR/subagents" ]]; then
        log "ERROR" "잘못된 폴더 발견: $CLAUDE_DIR/subagents"
        log "INFO" "  📖 공식 구조는 'agents' 폴더만 사용합니다"
        log "INFO" "  🔧 해결: ./scripts/validate-claude-structure.sh --fix"
        ((warnings++))
    fi
    
    # 중복 에이전트 파일 확인
    if [[ -d "$CLAUDE_DIR/agents" && -d "$CLAUDE_DIR/subagents" ]]; then
        log "WARNING" "중복 에이전트 폴더 감지 - 데이터 불일치 가능성"
        ((warnings++))
    fi
    
    echo
    return $warnings
}

# 📝 에이전트 파일 형식 검증
validate_agent_format() {
    log "INFO" "📝 에이전트 파일 형식 검증 중..."
    echo
    
    if [[ ! -d "$CLAUDE_DIR/agents" ]]; then
        log "WARNING" "agents 폴더가 없어 형식 검증을 건너뜁니다"
        echo
        return 0
    fi
    
    local format_errors=0
    local agent_count=0
    
    for agent_file in "$CLAUDE_DIR/agents"/*.md; do
        [[ -f "$agent_file" ]] || continue
        ((agent_count++))
        
        local filename=$(basename "$agent_file")
        
        # YAML frontmatter 확인
        if head -1 "$agent_file" | grep -q "^---$"; then
            log "SUCCESS" "올바른 형식: $filename"
            
            # 필수 필드 확인
            local has_name=$(grep -q "^name:" "$agent_file" && echo "true" || echo "false")
            local has_desc=$(grep -q "^description:" "$agent_file" && echo "true" || echo "false")
            
            if [[ "$has_name" == "true" && "$has_desc" == "true" ]]; then
                log "SUCCESS" "  필수 필드 완비: name, description"
            else
                log "WARNING" "  필수 필드 누락: $filename"
                ((format_errors++))
            fi
        else
            log "ERROR" "잘못된 형식: $filename (YAML frontmatter 누락)"
            log "INFO" "  올바른 형식: https://docs.anthropic.com/en/docs/claude-code/sub-agents"
            ((format_errors++))
        fi
    done
    
    echo
    log "INFO" "📊 에이전트 파일 현황: $agent_count개"
    
    if [[ $format_errors -eq 0 ]]; then
        log "SUCCESS" "모든 에이전트 파일이 올바른 형식입니다"
    else
        log "WARNING" "$format_errors개 파일에 형식 문제가 있습니다"
    fi
    
    echo
    return $format_errors
}

# 🔧 자동 수정
auto_fix() {
    log "INFO" "🔧 자동 수정 모드 실행 중..."
    echo
    
    if [[ -d "$CLAUDE_DIR/subagents" ]]; then
        local backup_dir="$CLAUDE_DIR/backup/auto-fix-$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$backup_dir"
        
        log "INFO" "subagents 폴더를 백업으로 이동 중..."
        mv "$CLAUDE_DIR/subagents" "$backup_dir/subagents-backup"
        log "SUCCESS" "백업 완료: $backup_dir/subagents-backup"
    fi
    
    # 기본 설정 파일 생성 (없는 경우)
    if [[ ! -f "$CLAUDE_DIR/settings.json" ]]; then
        log "INFO" "기본 settings.json 생성 중..."
        cat > "$CLAUDE_DIR/settings.json" << 'EOF'
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline",
    "padding": 0
  }
}
EOF
        log "SUCCESS" "기본 설정 파일 생성됨"
    fi
    
    echo
    log "SUCCESS" "자동 수정 완료"
}

# 📊 상세 리포트 생성
generate_report() {
    echo
    log "INFO" "📊 상세 리포트 생성 중..."
    echo
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}                📁 .claude 폴더 구조 리포트                     ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # 폴더 구조
    echo -e "${BLUE}📁 현재 구조:${NC}"
    if command -v tree >/dev/null 2>&1; then
        tree "$CLAUDE_DIR" -I "backup|downloads|projects|shell-snapshots|statsig|todos|.claude.json|.credentials.json|consolidation-*.log|trusted-workspaces.json" 2>/dev/null || ls -la "$CLAUDE_DIR"
    else
        ls -la "$CLAUDE_DIR"
    fi
    echo
    
    # 에이전트 목록
    if [[ -d "$CLAUDE_DIR/agents" ]]; then
        echo -e "${BLUE}🤖 에이전트 목록:${NC}"
        ls "$CLAUDE_DIR/agents"/*.md 2>/dev/null | while read -r file; do
            local name=$(basename "$file" .md)
            local description=""
            if grep -q "^description:" "$file"; then
                description=$(grep "^description:" "$file" | cut -d' ' -f2- | sed 's/^//')
            fi
            echo "  • $name: $description"
        done | head -10
        echo
    fi
    
    # 설정 파일 상태
    echo -e "${BLUE}⚙️  설정 파일 상태:${NC}"
    for config_file in settings.json settings.local.json; do
        if [[ -f "$CLAUDE_DIR/$config_file" ]]; then
            local size=$(wc -c < "$CLAUDE_DIR/$config_file")
            echo "  ✅ $config_file (${size} bytes)"
        else
            echo "  ❌ $config_file (없음)"
        fi
    done
    echo
    
    # 권장 사항
    echo -e "${CYAN}💡 권장 사항:${NC}"
    echo "  1. 정기적으로 이 스크립트 실행: ./scripts/validate-claude-structure.sh"
    echo "  2. 새 에이전트 추가 시 올바른 형식 사용"
    echo "  3. settings.local.json은 Git에 커밋하지 마세요"
    echo "  4. 공식 문서 참조: https://docs.anthropic.com/en/docs/claude-code/settings"
    echo
}

# 🚀 메인 실행 함수
main() {
    print_header
    
    local mode="${1:-validate}"
    local total_errors=0
    
    case "$mode" in
        "--fix"|"-f")
            log "INFO" "🔧 자동 수정 모드로 실행"
            auto_fix
            mode="validate"  # 수정 후 검증
            ;;
        "--report"|"-r")
            log "INFO" "📊 리포트 생성 모드로 실행"
            ;;
        "--validate"|"-v"|*)
            log "INFO" "🔍 검증 모드로 실행"
            ;;
    esac
    
    if [[ "$mode" != "--report" && "$mode" != "-r" ]]; then
        # 검증 실행
        validate_folder_structure || ((total_errors++))
        detect_wrong_structure || ((total_errors++))
        validate_agent_format || ((total_errors++))
        
        if [[ $total_errors -eq 0 ]]; then
            log "SUCCESS" "🎉 모든 검증 통과! Claude Code 공식 표준 준수"
        else
            log "WARNING" "⚠️  $total_errors개 문제 발견 - 자동 수정: $0 --fix"
        fi
    fi
    
    # 리포트 생성
    generate_report
    
    echo
    log "SUCCESS" "🏁 검증 완료"
    return $total_errors
}

# 도움말 출력
show_help() {
    echo -e "${CYAN}🔍 Claude Code 폴더 구조 검증 스크립트 v${SCRIPT_VERSION}${NC}"
    echo
    echo -e "${WHITE}사용법:${NC}"
    echo "  $0 [옵션]"
    echo
    echo -e "${WHITE}옵션:${NC}"
    echo "  --validate, -v    검증 모드 (기본값)"
    echo "  --fix, -f         자동 수정 모드"
    echo "  --report, -r      상세 리포트만 출력"
    echo "  --help, -h        이 도움말 출력"
    echo
    echo -e "${WHITE}예시:${NC}"
    echo "  $0                # 기본 검증"
    echo "  $0 --fix          # 문제 자동 수정"
    echo "  $0 --report       # 상세 리포트"
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