#!/bin/bash

# 🧠 수동 AI 검증 트리거 스크립트
# Claude Code에서 수동으로 AI 검증을 실행하기 위한 헬퍼 스크립트

set -e

PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
LOG_FILE="$CLAUDE_DIR/manual-verification.log"

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 로그 함수
log_message() {
    local message="$1"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "$message"
    echo "[$timestamp] $(echo -e "$message" | sed 's/\x1b\[[0-9;]*m//g')" >> "$LOG_FILE"
}

# 사용법 출력
usage() {
    echo -e "${BLUE}🧠 수동 AI 검증 도구${NC}"
    echo
    echo -e "${GREEN}사용법:${NC}"
    echo "  $0 <파일경로>                # 특정 파일 검증"
    echo "  $0 recent                    # 최근 수정 파일들 검증"  
    echo "  $0 modified                  # Git으로 수정된 파일들 검증"
    echo "  $0 api                       # API 라우트 파일들 검증"
    echo "  $0 config                    # 설정 파일들 검증"
    echo
    echo -e "${GREEN}예시:${NC}"
    echo "  $0 src/app/api/auth/route.ts"
    echo "  $0 recent"
    echo "  $0 modified"
    echo
    echo -e "${YELLOW}💡 이 스크립트는 Claude Code에게 명령어를 출력합니다.${NC}"
    echo -e "${YELLOW}   출력된 Task 명령어를 Claude Code에 복사/붙여넣기 하세요!${NC}"
}

# 파일 검증 레벨 결정
determine_level() {
    local file="$1"
    local size=0
    
    if [ -f "$file" ]; then
        size=$(wc -l "$file" 2>/dev/null | awk '{print $1}')
    fi
    
    # 중요 파일 패턴 (항상 Level 3)
    if [[ "$file" =~ /(api|auth|security|payment|middleware)/ ]] || \
       [[ "$file" =~ \.(config|env) ]] || \
       [[ "$file" =~ route\.ts$ ]] || \
       [[ "$file" =~ middleware\.ts$ ]]; then
        echo "3"
        return
    fi
    
    # 파일 크기 기반
    if [ "$size" -lt 50 ]; then
        echo "1"
    elif [ "$size" -lt 200 ]; then
        echo "2"
    else
        echo "3"
    fi
}

# AI 검증 명령어 생성
generate_verification_command() {
    local file="$1"
    local level=$(determine_level "$file")
    local filename=$(basename "$file")
    
    log_message "${BLUE}📝 파일: $filename (Level $level)${NC}"
    
    case "$level" in
        1)
            echo "Task external-ai-orchestrator \"Level 1 단일 AI 검증: $file\n- 빠른 코드 품질 검토\n- 기본적인 문제 확인\n- 간단한 개선사항 제안\""
            ;;
        2)
            echo "Task external-ai-orchestrator \"Level 2 병렬 AI 검증: $file\n- Claude + Gemini 병렬 검토\n- 아키텍처 패턴 검증\n- 타입 안전성 확인\n- 성능 최적화 제안\""
            ;;
        3)
            echo "Task external-ai-orchestrator \"Level 3 완전 교차 검증: $file\n- 4-AI 완전 교차 검토\n- 보안 취약점 스캔\n- 모든 엣지 케이스 검토\n- 프로덕션 배포 안전성 확인\n- 코드 품질 완전 검증\""
            ;;
    esac
}

# 특정 파일 검증
verify_file() {
    local file="$1"
    
    # 상대 경로를 절대 경로로 변환
    if [[ ! "$file" =~ ^/ ]]; then
        file="$PROJECT_ROOT/$file"
    fi
    
    if [ ! -f "$file" ]; then
        log_message "${RED}❌ 파일이 존재하지 않습니다: $file${NC}"
        return 1
    fi
    
    # 검증 명령어 생성 및 출력
    echo
    log_message "${GREEN}🔍 AI 검증 준비: $(basename "$file")${NC}"
    echo -e "${YELLOW}📋 다음 명령어를 Claude Code에 복사/붙여넣기 하세요:${NC}"
    echo
    echo -e "${PURPLE}$(generate_verification_command "$file")${NC}"
    echo
}

# 최근 수정 파일들 검증
verify_recent() {
    log_message "${BLUE}🕒 최근 수정 파일들 검증${NC}"
    
    # 최근 30분 내 수정된 파일들 찾기
    local recent_files=$(find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
        xargs ls -t | \
        head -5)
    
    if [ -z "$recent_files" ]; then
        log_message "${YELLOW}⚠️ 최근 수정된 파일이 없습니다${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🔍 최근 수정된 파일들:${NC}"
    echo "$recent_files" | while read -r file; do
        echo "  - $(basename "$file")"
    done
    echo
    
    # 각 파일에 대한 검증 명령어 생성
    echo "$recent_files" | while read -r file; do
        verify_file "$file"
    done
}

# Git으로 수정된 파일들 검증  
verify_modified() {
    log_message "${BLUE}📊 Git 수정 파일들 검증${NC}"
    
    # Git으로 수정된 파일들 (staged + unstaged)
    local modified_files=$(cd "$PROJECT_ROOT" && git diff --name-only HEAD~1 2>/dev/null | grep -E '\.(ts|tsx|js|jsx)$' | head -10)
    
    if [ -z "$modified_files" ]; then
        log_message "${YELLOW}⚠️ Git에서 수정된 파일이 없습니다${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🔍 Git으로 수정된 파일들:${NC}"
    echo "$modified_files" | while read -r file; do
        echo "  - $file"
    done
    echo
    
    # 각 파일에 대한 검증 명령어 생성
    echo "$modified_files" | while read -r file; do
        verify_file "$PROJECT_ROOT/$file"
    done
}

# API 라우트 파일들 검증
verify_api() {
    log_message "${BLUE}🛡️ API 라우트 파일들 검증${NC}"
    
    local api_files=$(find "$PROJECT_ROOT/src/app/api" -name "route.ts" 2>/dev/null)
    
    if [ -z "$api_files" ]; then
        log_message "${YELLOW}⚠️ API 라우트 파일이 없습니다${NC}"
        return 1
    fi
    
    echo -e "${GREEN}🔍 API 라우트 파일들:${NC}"
    echo "$api_files" | while read -r file; do
        echo "  - $(basename "$(dirname "$file")")/route.ts"
    done
    echo
    
    # 각 파일에 대한 검증 명령어 생성 (모두 Level 3)
    echo "$api_files" | while read -r file; do
        verify_file "$file"
    done
}

# 설정 파일들 검증
verify_config() {
    log_message "${BLUE}⚙️ 설정 파일들 검증${NC}"
    
    local config_files=(
        "$PROJECT_ROOT/next.config.mjs"
        "$PROJECT_ROOT/tsconfig.json"
        "$PROJECT_ROOT/package.json"
        "$PROJECT_ROOT/tailwind.config.ts"
    )
    
    echo -e "${GREEN}🔍 설정 파일들:${NC}"
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            echo "  - $(basename "$file")"
        fi
    done
    echo
    
    # 각 파일에 대한 검증 명령어 생성
    for file in "${config_files[@]}"; do
        if [ -f "$file" ]; then
            verify_file "$file"
        fi
    done
}

# 메인 함수
main() {
    case "${1:-}" in
        ""|"-h"|"--help"|"help")
            usage
            ;;
        "recent")
            verify_recent
            ;;
        "modified")
            verify_modified
            ;;
        "api")
            verify_api
            ;;
        "config")
            verify_config
            ;;
        *)
            # 특정 파일 검증
            verify_file "$1"
            ;;
    esac
}

# 디렉토리 생성
mkdir -p "$CLAUDE_DIR"

# 실행
main "$@"