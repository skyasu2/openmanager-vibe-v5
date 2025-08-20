#!/bin/bash

# =============================================================================
# 🤖 서브에이전트 복구 스크립트 v1.0.0
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: Claude Code 서브에이전트 파일 검증, 백업, 복구
# 📖 참조: .claude/agents/ 폴더의 19개 에이전트 관리
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
readonly SCRIPT_VERSION="1.0.0"
readonly AGENTS_DIR=".claude/agents"
readonly BACKUP_DIR=".claude/backup/agents-recovery"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# 19개 에이전트 목록 (최신)
readonly EXPECTED_AGENTS=(
    "central-supervisor"
    "ai-systems-specialist"
    "database-administrator"
    "dev-environment-manager"
    "gcp-vm-specialist"
    "mcp-server-administrator"
    "vercel-platform-specialist"
    "code-review-specialist"
    "debugger-specialist"
    "security-auditor"
    "test-automation-specialist"
    "quality-control-specialist"
    "documentation-manager"
    "git-cicd-specialist"
    "structure-refactor-specialist"
    "ux-performance-specialist"
    "codex-agent"
    "gemini-agent"
    "qwen-agent"
)

# 로깅 함수
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${BLUE}ℹ️  [$timestamp] $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ [$timestamp] $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  [$timestamp] $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ [$timestamp] $message${NC}" ;;
        "DEBUG") echo -e "${CYAN}🔍 [$timestamp] $message${NC}" ;;
    esac
}

# 헤더 출력
print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}        🤖 서브에이전트 복구 스크립트 v${SCRIPT_VERSION}              ${CYAN}║${NC}"
    echo -e "${CYAN}║${WHITE}        총 ${#EXPECTED_AGENTS[@]}개 에이전트 관리                              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# 디렉토리 확인 및 생성
ensure_directories() {
    cd "$PROJECT_ROOT" || {
        log "ERROR" "프로젝트 루트 디렉토리로 이동 실패: $PROJECT_ROOT"
        exit 1
    }
    
    if [[ ! -d "$AGENTS_DIR" ]]; then
        log "WARNING" "에이전트 디렉토리가 없습니다. 생성 중..."
        mkdir -p "$AGENTS_DIR"
        log "SUCCESS" "에이전트 디렉토리 생성됨: $AGENTS_DIR"
    fi
    
    mkdir -p "$BACKUP_DIR"
}

# 에이전트 파일 검증
validate_agent_file() {
    local agent_name="$1"
    local file_path="$AGENTS_DIR/${agent_name}.md"
    local errors=0
    
    if [[ ! -f "$file_path" ]]; then
        log "ERROR" "에이전트 파일 누락: $agent_name"
        return 1
    fi
    
    # YAML frontmatter 확인
    if ! head -1 "$file_path" | grep -q "^---$"; then
        log "ERROR" "YAML frontmatter 누락: $agent_name"
        ((errors++))
    fi
    
    # 필수 필드 확인
    local required_fields=("name:" "description:" "tools:")
    for field in "${required_fields[@]}"; do
        if ! grep -q "^$field" "$file_path"; then
            log "WARNING" "필수 필드 누락 ($field): $agent_name"
            ((errors++))
        fi
    done
    
    # name 필드가 파일명과 일치하는지 확인 (YAML frontmatter 내에서만)
    local name_in_file=$(sed -n '1,/^---$/p' "$file_path" | grep "^name:" | head -1 | cut -d':' -f2- | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//')
    if [[ -n "$name_in_file" && "$name_in_file" != "$agent_name" ]]; then
        log "WARNING" "name 필드 불일치: $agent_name (파일: $name_in_file)"
        ((errors++))
    fi
    
    if [[ $errors -eq 0 ]]; then
        log "SUCCESS" "검증 통과: $agent_name"
    else
        log "ERROR" "검증 실패: $agent_name ($errors개 문제)"
    fi
    
    return $errors
}

# 전체 에이전트 검증
validate_all_agents() {
    log "INFO" "🔍 전체 에이전트 검증 시작..."
    echo
    
    local total_errors=0
    local missing_agents=()
    local corrupt_agents=()
    
    for agent in "${EXPECTED_AGENTS[@]}"; do
        if validate_agent_file "$agent"; then
            log "DEBUG" "✓ $agent"
        else
            if [[ ! -f "$AGENTS_DIR/${agent}.md" ]]; then
                missing_agents+=("$agent")
            else
                corrupt_agents+=("$agent")
            fi
            ((total_errors++))
        fi
    done
    
    echo
    log "INFO" "📊 검증 결과 요약:"
    echo "  - 총 에이전트: ${#EXPECTED_AGENTS[@]}개"
    echo "  - 정상: $((${#EXPECTED_AGENTS[@]} - total_errors))개"
    echo "  - 누락: ${#missing_agents[@]}개"
    echo "  - 손상: ${#corrupt_agents[@]}개"
    
    if [[ ${#missing_agents[@]} -gt 0 ]]; then
        echo
        log "WARNING" "누락된 에이전트들:"
        printf '  • %s\n' "${missing_agents[@]}"
    fi
    
    if [[ ${#corrupt_agents[@]} -gt 0 ]]; then
        echo
        log "WARNING" "손상된 에이전트들:"
        printf '  • %s\n' "${corrupt_agents[@]}"
    fi
    
    echo
    return $total_errors
}

# 백업 생성
create_backup() {
    log "INFO" "📦 에이전트 백업 생성 중..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/agents-backup-$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    if [[ -d "$AGENTS_DIR" && "$(ls -A $AGENTS_DIR 2>/dev/null)" ]]; then
        cp -r "$AGENTS_DIR"/* "$backup_path/" 2>/dev/null || true
        
        # 압축 백업
        cd "$BACKUP_DIR"
        tar -czf "agents-backup-$backup_timestamp.tar.gz" "agents-backup-$backup_timestamp"
        rm -rf "agents-backup-$backup_timestamp"
        
        log "SUCCESS" "백업 완료: $BACKUP_DIR/agents-backup-$backup_timestamp.tar.gz"
        
        # 오래된 백업 정리 (10개 이상 시)
        local backup_count=$(ls -1 agents-backup-*.tar.gz 2>/dev/null | wc -l)
        if [[ $backup_count -gt 10 ]]; then
            ls -1t agents-backup-*.tar.gz | tail -n +11 | xargs rm -f
            log "INFO" "오래된 백업 파일 정리됨"
        fi
    else
        log "WARNING" "백업할 에이전트 파일이 없습니다"
    fi
    
    cd "$PROJECT_ROOT"
}

# 에이전트 템플릿 생성
generate_agent_template() {
    local agent_name="$1"
    local description="$2"
    local tools="$3"
    
    cat << EOF
---
name: $agent_name
description: $description
tools: $tools
---

# $(echo "$agent_name" | tr '-' ' ' | sed 's/\b\w/\U&/g')

## 핵심 역할
이 에이전트는 $description 전문가입니다.

## 주요 책임
1. **핵심 기능**
   - 전문 영역에서의 작업 수행
   - 품질 보증 및 최적화
   - 다른 에이전트와의 협업

2. **작업 방식**
   - 효율적인 리소스 활용
   - 명확한 결과 제공
   - 지속적인 개선

## 참조 문서
- \`/docs/\` 디렉토리의 관련 문서들
- 프로젝트 설정 파일들

## 작업 기준
- 프로젝트 품질 기준 준수
- 무료 티어 제약사항 고려
- WSL 환경 최적화
EOF
}

# 누락된 에이전트 복구
recover_missing_agents() {
    log "INFO" "🔧 누락된 에이전트 복구 중..."
    
    local recovered=0
    
    # 에이전트별 기본 정보
    declare -A agent_descriptions=(
        ["central-supervisor"]="서브에이전트 오케스트레이터. 복잡한 작업을 분해하고 전문 에이전트들에게 분배"
        ["ai-systems-specialist"]="AI 시스템 설계 및 최적화 전문가. UnifiedAIEngineRouter, Google AI, RAG 시스템 관리"
        ["database-administrator"]="Supabase PostgreSQL 전문 관리자. 데이터베이스 최적화, 쿼리 성능 개선, RLS 정책 관리"
        ["dev-environment-manager"]="개발 환경 관리 전문가. WSL 최적화, Node.js 버전 관리, 도구 통합"
        ["gcp-vm-specialist"]="GCP VM 백엔드 관리 전문가. VM 인스턴스 관리, Cloud Functions 배포, 비용 최적화"
        ["mcp-server-administrator"]="MCP 서버 인프라 관리 전문가. 12개 MCP 서버 설치, 설정, 문제 해결"
        ["vercel-platform-specialist"]="Vercel 플랫폼 최적화 전문가. Edge Functions, 배포 설정, 무료 티어 관리"
        ["code-review-specialist"]="코드 품질 검토 전문가. SOLID 원칙 검증, 코드 스멜 탐지, 리팩토링 제안"
        ["debugger-specialist"]="디버깅 및 근본 원인 분석 전문가. 복잡한 버그 해결, 스택 트레이스 분석, 성능 문제 진단"
        ["security-auditor"]="보안 검사 자동화 전문가. 취약점 스캔, 인증/인가 검증, 보안 정책 적용"
        ["test-automation-specialist"]="테스트 자동화 전문가. Vitest, Playwright E2E, 테스트 커버리지 관리"
        ["quality-control-specialist"]="프로젝트 규칙 감시자. 코딩 컨벤션, 파일 크기 제한, 테스트 커버리지 확인"
        ["documentation-manager"]="문서 관리 전문가. docs 폴더 + 루트 문서 관리, JBGE 원칙"
        ["git-cicd-specialist"]="Git 워크플로우 및 CI/CD 전문가. PR 관리, 자동 배포, GitHub Actions 최적화"
        ["structure-refactor-specialist"]="구조 설계 및 리팩토링 전문가. 아키텍처 패턴, 모듈화, 의존성 관리"
        ["ux-performance-specialist"]="프론트엔드 성능 최적화 전문가. Core Web Vitals, 렌더링 최적화, 번들 크기 관리"
        ["codex-agent"]="Codex CLI 도구 통합 전문가. Codex 환경 설정, 한국어 개발 지원, 프로젝트 구조 관리"
        ["gemini-agent"]="Gemini CLI 완전 활용 전문가. Google AI 통합, 1M 토큰 처리, 멀티모달 분석"
        ["qwen-agent"]="Qwen Code 병렬 개발 전문가. 256K-1M 토큰, 70% 빠른 병렬 개발, 오픈소스 활용"
    )
    
    declare -A agent_tools=(
        ["central-supervisor"]="Read, Write, Edit, MultiEdit, Bash, Glob, Grep, LS, TodoWrite, Task"
        ["ai-systems-specialist"]="Read, Write, Edit, Bash, Grep, TodoWrite, Task"
        ["database-administrator"]="Read, Write, Edit, Bash, Grep, mcp__supabase__execute_sql, mcp__supabase__list_tables, mcp__supabase__list_migrations, mcp__supabase__apply_migration, mcp__supabase__get_logs, mcp__supabase__get_advisors, mcp__supabase__generate_typescript_types"
        ["dev-environment-manager"]="Read, Write, Edit, Bash, Glob, LS"
        ["gcp-vm-specialist"]="Read, Write, Edit, Bash, Grep, mcp__gcp__query-logs, mcp__gcp__list-spanner-instances, mcp__gcp__query-metrics, mcp__gcp__get-project-id, mcp__gcp__set-project-id"
        ["mcp-server-administrator"]="Read, Write, Edit, Bash, Glob, LS, mcp__filesystem__read_text_file, mcp__filesystem__write_file, mcp__memory__read_graph, mcp__memory__create_entities, mcp__github__search_repositories, mcp__supabase__execute_sql, mcp__supabase__list_tables, mcp__gcp__get_project_id, mcp__tavily__tavily_search, mcp__playwright__playwright_navigate, mcp__thinking__sequentialthinking, mcp__context7__resolve_library_id, mcp__shadcn__list_components, mcp__serena__activate_project, mcp__time__get_current_time"
        ["vercel-platform-specialist"]="Read, Write, Edit, Bash, Grep, mcp__filesystem__read_text_file, mcp__filesystem__write_file, mcp__filesystem__search_files, mcp__github__create_pull_request, mcp__github__list_commits, mcp__github__get_pull_request_status"
        ["code-review-specialist"]="Read, Grep, Glob"
        ["debugger-specialist"]="Read, Grep, Bash, LS, Glob"
        ["security-auditor"]="Read, Grep, Bash, Glob"
        ["test-automation-specialist"]="Read, Write, Edit, Bash, Glob, Grep, Task"
        ["quality-control-specialist"]="Read, Grep, Glob, Bash"
        ["documentation-manager"]="Read, Write, Edit, MultiEdit, Glob, Grep, LS"
        ["git-cicd-specialist"]="Read, Write, Edit, Bash, Glob, Task"
        ["structure-refactor-specialist"]="Read, Write, Edit, MultiEdit, Glob, Grep, TodoWrite"
        ["ux-performance-specialist"]="Read, Write, Edit, Bash, Glob"
        ["codex-agent"]="Read, Write, Edit, MultiEdit, Bash, Glob, Grep, LS, TodoWrite"
        ["gemini-agent"]="Read, Write, Bash, Grep"
        ["qwen-agent"]="Read, Write, Edit, MultiEdit, Bash"
    )
    
    for agent in "${EXPECTED_AGENTS[@]}"; do
        local file_path="$AGENTS_DIR/${agent}.md"
        
        if [[ ! -f "$file_path" ]]; then
            log "INFO" "복구 중: $agent"
            
            local description="${agent_descriptions[$agent]:-"$agent 전문가"}"
            local tools="${agent_tools[$agent]:-"Read, Write, Edit, Bash"}"
            
            generate_agent_template "$agent" "$description" "$tools" > "$file_path"
            
            log "SUCCESS" "복구 완료: $agent"
            ((recovered++))
        fi
    done
    
    if [[ $recovered -gt 0 ]]; then
        log "SUCCESS" "총 $recovered개 에이전트 복구 완료"
    else
        log "INFO" "복구할 에이전트가 없습니다"
    fi
}

# 손상된 에이전트 수정
repair_corrupt_agents() {
    log "INFO" "🔨 손상된 에이전트 수정 중..."
    
    local repaired=0
    
    for agent in "${EXPECTED_AGENTS[@]}"; do
        local file_path="$AGENTS_DIR/${agent}.md"
        
        if [[ -f "$file_path" ]]; then
            local needs_repair=false
            
            # YAML frontmatter 확인
            if ! head -1 "$file_path" | grep -q "^---$"; then
                log "WARNING" "YAML frontmatter 수정 필요: $agent"
                needs_repair=true
            fi
            
            # name 필드 확인
            if ! grep -q "^name: $agent$" "$file_path"; then
                log "WARNING" "name 필드 수정 필요: $agent"
                needs_repair=true
            fi
            
            if [[ "$needs_repair" == true ]]; then
                # 백업 생성
                cp "$file_path" "${file_path}.backup"
                
                # 기본 내용 추출 (YAML frontmatter 제외)
                local content=""
                if grep -q "^---$" "$file_path"; then
                    content=$(sed '1,/^---$/d' "$file_path")
                else
                    content=$(cat "$file_path")
                fi
                
                # description과 tools 추출 시도
                local description="$agent 전문가"
                local tools="Read, Write, Edit, Bash"
                
                if grep -q "^description:" "$file_path"; then
                    description=$(grep "^description:" "$file_path" | cut -d' ' -f2-)
                fi
                
                if grep -q "^tools:" "$file_path"; then
                    tools=$(grep "^tools:" "$file_path" | cut -d' ' -f2-)
                fi
                
                # 새 파일 생성
                {
                    echo "---"
                    echo "name: $agent"
                    echo "description: $description"
                    echo "tools: $tools"
                    echo "---"
                    echo "$content"
                } > "$file_path"
                
                log "SUCCESS" "수정 완료: $agent"
                ((repaired++))
            fi
        fi
    done
    
    if [[ $repaired -gt 0 ]]; then
        log "SUCCESS" "총 $repaired개 에이전트 수정 완료"
    else
        log "INFO" "수정할 에이전트가 없습니다"
    fi
}

# MCP 매핑 검증
verify_mcp_mapping() {
    log "INFO" "🔌 MCP 도구 매핑 검증 중..."
    
    local mcp_tools_count=0
    local task_tools_count=0
    
    for agent in "${EXPECTED_AGENTS[@]}"; do
        local file_path="$AGENTS_DIR/${agent}.md"
        
        if [[ -f "$file_path" ]]; then
            # MCP 도구 확인
            if grep -q "mcp__" "$file_path"; then
                ((mcp_tools_count++))
                log "DEBUG" "MCP 도구 보유: $agent"
            fi
            
            # Task 도구 확인
            if grep -q "Task" "$file_path"; then
                ((task_tools_count++))
                log "DEBUG" "Task 도구 보유: $agent"
            fi
        fi
    done
    
    echo
    log "INFO" "📊 MCP 매핑 결과:"
    echo "  - MCP 도구 보유: $mcp_tools_count/${#EXPECTED_AGENTS[@]}개"
    echo "  - Task 도구 보유: $task_tools_count/${#EXPECTED_AGENTS[@]}개"
    echo
}

# 전체 복구 실행
full_recovery() {
    log "INFO" "🚀 전체 복구 프로세스 시작..."
    echo
    
    # 1. 백업 생성
    create_backup
    echo
    
    # 2. 누락 에이전트 복구
    recover_missing_agents
    echo
    
    # 3. 손상 에이전트 수정
    repair_corrupt_agents
    echo
    
    # 4. 최종 검증
    if validate_all_agents; then
        log "SUCCESS" "🎉 전체 복구 완료!"
    else
        log "WARNING" "일부 문제가 남아있습니다"
    fi
    echo
    
    # 5. MCP 매핑 검증
    verify_mcp_mapping
}

# 상태 리포트 생성
generate_status_report() {
    echo
    log "INFO" "📊 상태 리포트 생성 중..."
    echo
    
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}                📁 서브에이전트 상태 리포트                     ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    # 파일 존재 확인
    echo -e "${BLUE}📁 에이전트 파일 현황:${NC}"
    local existing_count=0
    for agent in "${EXPECTED_AGENTS[@]}"; do
        if [[ -f "$AGENTS_DIR/${agent}.md" ]]; then
            echo "  ✅ $agent"
            ((existing_count++))
        else
            echo "  ❌ $agent (누락)"
        fi
    done
    echo "  📊 총 $existing_count/${#EXPECTED_AGENTS[@]}개 존재"
    echo
    
    # 디스크 사용량
    if [[ -d "$AGENTS_DIR" ]]; then
        local dir_size=$(du -sh "$AGENTS_DIR" 2>/dev/null | cut -f1)
        echo -e "${BLUE}💾 디스크 사용량:${NC}"
        echo "  📁 에이전트 폴더: $dir_size"
    fi
    
    # 백업 현황
    if [[ -d "$BACKUP_DIR" ]]; then
        local backup_count=$(ls -1 "$BACKUP_DIR"/agents-backup-*.tar.gz 2>/dev/null | wc -l)
        echo "  📦 백업 파일: $backup_count개"
    fi
    echo
    
    # 권장 사항
    echo -e "${CYAN}💡 권장 사항:${NC}"
    echo "  1. 정기적으로 이 스크립트 실행: ./scripts/subagent-recovery.sh --check"
    echo "  2. 에이전트 수정 전 백업: ./scripts/subagent-recovery.sh --backup"
    echo "  3. Claude Code 연결 테스트: claude /agents"
    echo "  4. 공식 문서 참조: docs/claude/sub-agents-complete-guide.md"
    echo
}

# 도움말 출력
show_help() {
    echo -e "${CYAN}🤖 서브에이전트 복구 스크립트 v${SCRIPT_VERSION}${NC}"
    echo
    echo -e "${WHITE}사용법:${NC}"
    echo "  $0 [옵션]"
    echo
    echo -e "${WHITE}옵션:${NC}"
    echo "  --check, -c       에이전트 상태 검증 (기본값)"
    echo "  --backup, -b      백업만 생성"
    echo "  --recover, -r     누락된 에이전트만 복구"
    echo "  --repair          손상된 에이전트만 수정"
    echo "  --full, -f        전체 복구 (백업 + 복구 + 수정)"
    echo "  --report          상세 상태 리포트"
    echo "  --mcp             MCP 매핑 검증"
    echo "  --help, -h        이 도움말 출력"
    echo
    echo -e "${WHITE}예시:${NC}"
    echo "  $0                # 기본 상태 검증"
    echo "  $0 --full         # 전체 복구"
    echo "  $0 --backup       # 백업만 생성"
    echo "  $0 --report       # 상세 리포트"
    echo
}

# 메인 실행 함수
main() {
    print_header
    ensure_directories
    
    local mode="${1:-check}"
    
    case "$mode" in
        "--check"|"-c"|"check")
            log "INFO" "🔍 에이전트 상태 검증 모드"
            validate_all_agents
            ;;
        "--backup"|"-b"|"backup")
            log "INFO" "📦 백업 생성 모드"
            create_backup
            ;;
        "--recover"|"-r"|"recover")
            log "INFO" "🔧 누락 에이전트 복구 모드"
            recover_missing_agents
            ;;
        "--repair"|"repair")
            log "INFO" "🔨 손상 에이전트 수정 모드"
            repair_corrupt_agents
            ;;
        "--full"|"-f"|"full")
            log "INFO" "🚀 전체 복구 모드"
            full_recovery
            ;;
        "--report"|"report")
            log "INFO" "📊 상태 리포트 모드"
            validate_all_agents > /dev/null
            generate_status_report
            ;;
        "--mcp"|"mcp")
            log "INFO" "🔌 MCP 매핑 검증 모드"
            verify_mcp_mapping
            ;;
        "--help"|"-h"|"help")
            show_help
            ;;
        *)
            log "ERROR" "알 수 없는 옵션: $mode"
            show_help
            exit 1
            ;;
    esac
    
    echo
    log "SUCCESS" "🏁 작업 완료"
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi