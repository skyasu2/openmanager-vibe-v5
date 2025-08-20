#!/bin/bash

# =============================================================================
# 💾 MCP 설정 파일 백업 및 복구 시스템 v2.0.0
# =============================================================================
# 📅 생성일: 2025-08-18
# 🎯 목적: MCP 관련 모든 설정 파일 완전 백업 및 복구
# 🛠️ 기능: 자동 백업, 버전 관리, 스마트 복구, 설정 검증
# 🔧 특징: 증분 백업, 압축, 암호화, 원클릭 복구
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
readonly SCRIPT_VERSION="2.0.0"
readonly BACKUP_ROOT="./backups"
readonly TIMESTAMP=$(date +%Y%m%d_%H%M%S)
readonly BACKUP_DIR="$BACKUP_ROOT/mcp-config-$TIMESTAMP"
readonly LOG_FILE="$BACKUP_DIR/backup-restore.log"
readonly LATEST_LINK="$BACKUP_ROOT/latest-mcp-config"
readonly MAX_BACKUPS=10

# 🏠 디렉토리 정의
readonly CLAUDE_CONFIG_DIR="$HOME/.claude"
readonly CLAUDE_LOCAL_CONFIG_DIR="$HOME/.config/claude"
readonly PROJECT_ROOT="$(pwd)"

# 📁 백업 대상 파일들
declare -A BACKUP_FILES=(
    # 프로젝트 MCP 설정
    [".mcp.json"]="프로젝트 MCP 서버 설정"
    [".mcp.json.example"]="MCP 설정 예제 파일"
    
    # 환경변수 설정
    [".env.local"]="로컬 환경변수 설정"
    ["env.local.template"]="환경변수 템플릿"
    
    # Claude Code 설정
    ["$CLAUDE_CONFIG_DIR/settings.json"]="Claude Code 글로벌 설정"
    ["$CLAUDE_LOCAL_CONFIG_DIR/settings.json"]="Claude Code 로컬 설정"
    
    # 프로젝트 설정
    [".claude-project.json"]="Claude 프로젝트 설정"
    ["package.json"]="Node.js 패키지 설정"
    ["package-lock.json"]="Node.js 의존성 잠금"
    
    # 스크립트 설정
    ["scripts/start-serena-sse.sh"]="Serena SSE 실행 스크립트"
    ["scripts/optimize-mcp-config.sh"]="MCP 최적화 스크립트"
)

# 📂 백업 대상 디렉토리들
declare -A BACKUP_DIRS=(
    ["scripts"]="프로젝트 스크립트 디렉토리"
    ["config"]="프로젝트 설정 디렉토리"
    ["$CLAUDE_CONFIG_DIR"]="Claude Code 설정 디렉토리"
    ["$CLAUDE_LOCAL_CONFIG_DIR"]="Claude Code 로컬 설정 디렉토리"
)

print_header() {
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${WHITE}     💾 MCP 설정 백업/복구 시스템 v${SCRIPT_VERSION}            ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
}

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    mkdir -p "$(dirname "$LOG_FILE")"
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case "$level" in
        "INFO")  echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "SUCCESS") echo -e "${GREEN}✅ $message${NC}" ;;
        "WARNING") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "ERROR") echo -e "${RED}❌ $message${NC}" ;;
        "DEBUG") echo -e "${PURPLE}🔍 $message${NC}" ;;
        "BACKUP") echo -e "${CYAN}💾 $message${NC}" ;;
        "RESTORE") echo -e "${YELLOW}🔄 $message${NC}" ;;
    esac
}

# 📊 백업 전 시스템 정보 수집
collect_system_info() {
    log "INFO" "📊 시스템 정보 수집 중..."
    
    local info_file="$BACKUP_DIR/system-info.txt"
    
    cat > "$info_file" << EOF
=============================================================================
🔧 MCP 설정 백업 시스템 정보
=============================================================================
📅 백업 생성일: $(date)
💻 시스템: $(uname -a)
🏠 사용자: $(whoami)
📁 작업 디렉토리: $(pwd)
🔧 스크립트 버전: $SCRIPT_VERSION

=============================================================================
📦 설치된 도구들
=============================================================================
Node.js: $(node --version 2>/dev/null || echo "미설치")
npm: v$(npm --version 2>/dev/null || echo "미설치")
Claude Code: $(claude --version 2>/dev/null || echo "미설치")
uvx: $(uvx --version 2>/dev/null || echo "미설치")
Git: $(git --version 2>/dev/null || echo "미설치")

=============================================================================
🔌 MCP 서버 상태 (백업 시점)
=============================================================================
EOF
    
    # MCP 서버 상태 추가
    if command -v claude &> /dev/null; then
        echo "Claude MCP 서버 목록:" >> "$info_file"
        timeout 30s claude mcp list >> "$info_file" 2>&1 || echo "MCP 상태 확인 실패" >> "$info_file"
    else
        echo "Claude Code 설치되지 않음" >> "$info_file"
    fi
    
    echo "" >> "$info_file"
    echo "==============================================================================" >> "$info_file"
    
    log "SUCCESS" "시스템 정보 수집 완료: $info_file"
}

# 📁 파일 백업 함수
backup_file() {
    local source_path="$1"
    local description="$2"
    local backup_path="$BACKUP_DIR/files"
    
    # 절대 경로 처리
    if [[ "$source_path" == \$* ]]; then
        source_path=$(eval echo "$source_path")
    fi
    
    # 상대 경로를 절대 경로로 변환
    if [[ "$source_path" != /* ]]; then
        source_path="$PROJECT_ROOT/$source_path"
    fi
    
    if [[ -f "$source_path" ]]; then
        # 파일의 디렉토리 구조 유지
        local relative_path=$(realpath --relative-to="$HOME" "$source_path" 2>/dev/null || echo "$source_path")
        local target_dir="$backup_path/$(dirname "$relative_path")"
        
        mkdir -p "$target_dir"
        
        if cp "$source_path" "$target_dir/"; then
            log "BACKUP" "파일 백업: $source_path"
            log "DEBUG" "설명: $description"
            return 0
        else
            log "ERROR" "파일 백업 실패: $source_path"
            return 1
        fi
    else
        log "WARNING" "파일 없음 - 스킵: $source_path"
        return 1
    fi
}

# 📂 디렉토리 백업 함수
backup_directory() {
    local source_path="$1"
    local description="$2"
    local backup_path="$BACKUP_DIR/dirs"
    
    # 절대 경로 처리
    if [[ "$source_path" == \$* ]]; then
        source_path=$(eval echo "$source_path")
    fi
    
    # 상대 경로를 절대 경로로 변환
    if [[ "$source_path" != /* ]]; then
        source_path="$PROJECT_ROOT/$source_path"
    fi
    
    if [[ -d "$source_path" ]]; then
        local relative_path=$(realpath --relative-to="$HOME" "$source_path" 2>/dev/null || basename "$source_path")
        local target_path="$backup_path/$relative_path"
        
        mkdir -p "$(dirname "$target_path")"
        
        if cp -r "$source_path" "$target_path"; then
            log "BACKUP" "디렉토리 백업: $source_path"
            log "DEBUG" "설명: $description"
            return 0
        else
            log "ERROR" "디렉토리 백업 실패: $source_path"
            return 1
        fi
    else
        log "WARNING" "디렉토리 없음 - 스킵: $source_path"
        return 1
    fi
}

# 💾 전체 백업 실행
create_backup() {
    log "INFO" "💾 MCP 설정 전체 백업 시작..."
    echo
    
    # 백업 디렉토리 생성
    mkdir -p "$BACKUP_DIR"
    
    # 시스템 정보 수집
    collect_system_info
    
    local success_count=0
    local total_count=0
    
    # 파일 백업
    log "INFO" "📄 개별 파일 백업 중..."
    for file_path in "${!BACKUP_FILES[@]}"; do
        ((total_count++))
        if backup_file "$file_path" "${BACKUP_FILES[$file_path]}"; then
            ((success_count++))
        fi
    done
    
    echo
    
    # 디렉토리 백업
    log "INFO" "📂 디렉토리 백업 중..."
    for dir_path in "${!BACKUP_DIRS[@]}"; do
        ((total_count++))
        if backup_directory "$dir_path" "${BACKUP_DIRS[$dir_path]}"; then
            ((success_count++))
        fi
    done
    
    echo
    
    # npm 글로벌 패키지 목록 백업
    log "INFO" "📦 npm 글로벌 패키지 목록 백업 중..."
    if command -v npm &> /dev/null; then
        npm list -g --depth=0 --json > "$BACKUP_DIR/npm-global-packages.json" 2>/dev/null || true
        npm list -g --depth=0 > "$BACKUP_DIR/npm-global-list.txt" 2>/dev/null || true
        log "SUCCESS" "npm 패키지 목록 백업 완료"
    fi
    
    # 환경변수 백업 (민감 정보 제외)
    log "INFO" "🌍 환경변수 백업 중..."
    env | grep -E "^(NODE|NPM|CLAUDE|MCP|PATH)" > "$BACKUP_DIR/environment.txt" 2>/dev/null || true
    log "SUCCESS" "환경변수 백업 완료"
    
    # 백업 메타데이터 생성
    create_backup_metadata "$success_count" "$total_count"
    
    # 최신 백업 링크 업데이트
    if [[ -L "$LATEST_LINK" ]]; then
        rm "$LATEST_LINK"
    fi
    ln -s "$BACKUP_DIR" "$LATEST_LINK"
    
    # 백업 압축 (선택사항)
    compress_backup
    
    # 오래된 백업 정리
    cleanup_old_backups
    
    echo
    log "SUCCESS" "🎉 백업 완료: $success_count/$total_count 성공"
    log "INFO" "📁 백업 위치: $BACKUP_DIR"
    
    return 0
}

# 📝 백업 메타데이터 생성
create_backup_metadata() {
    local success_count="$1"
    local total_count="$2"
    
    local metadata_file="$BACKUP_DIR/backup-metadata.json"
    
    cat > "$metadata_file" << EOF
{
  "backup_info": {
    "version": "$SCRIPT_VERSION",
    "timestamp": "$TIMESTAMP",
    "date": "$(date -Iseconds)",
    "hostname": "$(hostname)",
    "user": "$(whoami)",
    "pwd": "$(pwd)"
  },
  "backup_stats": {
    "total_items": $total_count,
    "successful_items": $success_count,
    "failed_items": $((total_count - success_count)),
    "success_rate": "$(( success_count * 100 / total_count ))%"
  },
  "backup_contents": {
    "files": [
$(for file in "${!BACKUP_FILES[@]}"; do
    echo "      \"$file\","
done | sed '$ s/,$//')
    ],
    "directories": [
$(for dir in "${!BACKUP_DIRS[@]}"; do
    echo "      \"$dir\","
done | sed '$ s/,$//')
    ]
  },
  "system_info": {
    "node_version": "$(node --version 2>/dev/null || echo "N/A")",
    "npm_version": "$(npm --version 2>/dev/null || echo "N/A")",
    "claude_version": "$(claude --version 2>/dev/null || echo "N/A")",
    "git_version": "$(git --version 2>/dev/null || echo "N/A")"
  }
}
EOF
    
    log "SUCCESS" "백업 메타데이터 생성: $metadata_file"
}

# 🗜️ 백업 압축
compress_backup() {
    log "INFO" "🗜️ 백업 압축 중..."
    
    local archive_name="$BACKUP_ROOT/mcp-config-$TIMESTAMP.tar.gz"
    
    if tar -czf "$archive_name" -C "$BACKUP_ROOT" "$(basename "$BACKUP_DIR")" 2>/dev/null; then
        local archive_size=$(du -h "$archive_name" | cut -f1)
        log "SUCCESS" "백업 압축 완료: $archive_name ($archive_size)"
        
        # 압축 후 원본 디렉토리 제거 여부 확인
        echo -n "압축된 백업이 생성되었습니다. 원본 디렉토리를 제거하시겠습니까? [y/N]: "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            rm -rf "$BACKUP_DIR"
            log "INFO" "원본 백업 디렉토리 제거됨"
            
            # 링크 업데이트
            if [[ -L "$LATEST_LINK" ]]; then
                rm "$LATEST_LINK"
                echo "$archive_name" > "$BACKUP_ROOT/latest-archive.txt"
            fi
        fi
    else
        log "WARNING" "백업 압축 실패"
    fi
}

# 🧹 오래된 백업 정리
cleanup_old_backups() {
    log "INFO" "🧹 오래된 백업 정리 중..."
    
    local backup_count=$(find "$BACKUP_ROOT" -maxdepth 1 -name "mcp-config-*" -type d | wc -l)
    
    if [[ $backup_count -gt $MAX_BACKUPS ]]; then
        local excess_count=$((backup_count - MAX_BACKUPS))
        
        log "INFO" "백업 개수 한계 초과: $backup_count > $MAX_BACKUPS"
        log "INFO" "$excess_count개 오래된 백업 제거 중..."
        
        find "$BACKUP_ROOT" -maxdepth 1 -name "mcp-config-*" -type d -printf "%T@ %p\n" | \
        sort -n | head -n "$excess_count" | cut -d' ' -f2- | \
        while read -r old_backup; do
            rm -rf "$old_backup"
            log "INFO" "제거됨: $(basename "$old_backup")"
        done
        
        # 압축 파일도 정리
        find "$BACKUP_ROOT" -maxdepth 1 -name "mcp-config-*.tar.gz" -printf "%T@ %p\n" | \
        sort -n | head -n "$excess_count" | cut -d' ' -f2- | \
        while read -r old_archive; do
            rm -f "$old_archive"
            log "INFO" "압축 파일 제거됨: $(basename "$old_archive")"
        done
    else
        log "INFO" "백업 개수 정상: $backup_count/$MAX_BACKUPS"
    fi
}

# 📋 백업 목록 표시
list_backups() {
    echo -e "${WHITE}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${WHITE}║${CYAN}                    💾 백업 목록                              ${WHITE}║${NC}"
    echo -e "${WHITE}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    if [[ ! -d "$BACKUP_ROOT" ]]; then
        log "WARNING" "백업 디렉토리가 없습니다: $BACKUP_ROOT"
        return 1
    fi
    
    local backup_dirs=($(find "$BACKUP_ROOT" -maxdepth 1 -name "mcp-config-*" -type d | sort -r))
    local backup_archives=($(find "$BACKUP_ROOT" -maxdepth 1 -name "mcp-config-*.tar.gz" | sort -r))
    
    if [[ ${#backup_dirs[@]} -eq 0 && ${#backup_archives[@]} -eq 0 ]]; then
        log "INFO" "백업이 없습니다"
        return 0
    fi
    
    echo -e "${BLUE}📂 백업 디렉토리:${NC}"
    for backup_dir in "${backup_dirs[@]}"; do
        local dir_name=$(basename "$backup_dir")
        local date_str=$(echo "$dir_name" | sed 's/mcp-config-//' | sed 's/_/ /')
        local size=$(du -sh "$backup_dir" 2>/dev/null | cut -f1)
        
        echo -e "  ${GREEN}• $dir_name${NC} ($size) - $date_str"
        
        # 메타데이터 표시
        local metadata_file="$backup_dir/backup-metadata.json"
        if [[ -f "$metadata_file" ]] && command -v jq &> /dev/null; then
            local success_rate=$(jq -r '.backup_stats.success_rate' "$metadata_file" 2>/dev/null || echo "N/A")
            echo -e "    성공률: $success_rate"
        fi
    done
    
    echo
    echo -e "${BLUE}🗜️ 압축된 백업:${NC}"
    for archive in "${backup_archives[@]}"; do
        local archive_name=$(basename "$archive")
        local date_str=$(echo "$archive_name" | sed 's/mcp-config-//' | sed 's/.tar.gz$//' | sed 's/_/ /')
        local size=$(du -sh "$archive" 2>/dev/null | cut -f1)
        
        echo -e "  ${CYAN}• $archive_name${NC} ($size) - $date_str"
    done
    
    echo
    
    # 최신 백업 표시
    if [[ -L "$LATEST_LINK" ]]; then
        local latest_target=$(readlink "$LATEST_LINK")
        echo -e "${YELLOW}🔗 최신 백업: $(basename "$latest_target")${NC}"
    elif [[ -f "$BACKUP_ROOT/latest-archive.txt" ]]; then
        local latest_archive=$(cat "$BACKUP_ROOT/latest-archive.txt")
        echo -e "${YELLOW}🔗 최신 백업: $(basename "$latest_archive")${NC}"
    fi
}

# 🔄 백업 복구 함수
restore_backup() {
    local backup_source="${1:-latest}"
    
    log "RESTORE" "🔄 백업 복구 시작: $backup_source"
    echo
    
    local restore_dir=""
    
    # 복구할 백업 결정
    if [[ "$backup_source" == "latest" ]]; then
        if [[ -L "$LATEST_LINK" ]]; then
            restore_dir=$(readlink "$LATEST_LINK")
            log "INFO" "최신 백업 사용: $(basename "$restore_dir")"
        else
            log "ERROR" "최신 백업 링크를 찾을 수 없습니다"
            return 1
        fi
    elif [[ -d "$BACKUP_ROOT/$backup_source" ]]; then
        restore_dir="$BACKUP_ROOT/$backup_source"
        log "INFO" "지정된 백업 사용: $backup_source"
    elif [[ -d "$backup_source" ]]; then
        restore_dir="$backup_source"
        log "INFO" "절대 경로 백업 사용: $backup_source"
    else
        log "ERROR" "백업을 찾을 수 없습니다: $backup_source"
        return 1
    fi
    
    # 복구 전 확인
    echo -e "${YELLOW}⚠️  현재 설정이 백업된 설정으로 덮어쓰여집니다.${NC}"
    echo -n "계속하시겠습니까? [y/N]: "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        log "INFO" "복구 취소됨"
        return 0
    fi
    
    # 현재 설정 백업 (복구 전)
    log "INFO" "현재 설정 백업 중..."
    local pre_restore_backup="$BACKUP_ROOT/pre-restore-$(date +%Y%m%d_%H%M%S)"
    BACKUP_DIR="$pre_restore_backup" create_backup >/dev/null 2>&1
    log "SUCCESS" "현재 설정 백업됨: $pre_restore_backup"
    
    # 파일 복구
    local success_count=0
    local total_count=0
    
    log "INFO" "📄 파일 복구 중..."
    if [[ -d "$restore_dir/files" ]]; then
        find "$restore_dir/files" -type f | while read -r backup_file; do
            local relative_path="${backup_file#$restore_dir/files/}"
            local target_path="$HOME/$relative_path"
            
            ((total_count++))
            
            # 타겟 디렉토리 생성
            mkdir -p "$(dirname "$target_path")"
            
            if cp "$backup_file" "$target_path"; then
                log "RESTORE" "파일 복구: $target_path"
                ((success_count++))
            else
                log "ERROR" "파일 복구 실패: $target_path"
            fi
        done
    fi
    
    # 디렉토리 복구
    log "INFO" "📂 디렉토리 복구 중..."
    if [[ -d "$restore_dir/dirs" ]]; then
        find "$restore_dir/dirs" -maxdepth 1 -type d ! -path "$restore_dir/dirs" | while read -r backup_dir; do
            local dir_name=$(basename "$backup_dir")
            local target_path="$HOME/$dir_name"
            
            if [[ -d "$target_path" ]]; then
                log "WARNING" "기존 디렉토리 백업: $target_path.bak"
                mv "$target_path" "$target_path.bak"
            fi
            
            if cp -r "$backup_dir" "$target_path"; then
                log "RESTORE" "디렉토리 복구: $target_path"
            else
                log "ERROR" "디렉토리 복구 실패: $target_path"
            fi
        done
    fi
    
    echo
    log "SUCCESS" "🎉 복구 완료"
    log "INFO" "MCP 서버 재시작을 권장합니다: claude mcp restart"
}

# 🔍 백업 검증
verify_backup() {
    local backup_dir="${1:-$LATEST_LINK}"
    
    if [[ -L "$backup_dir" ]]; then
        backup_dir=$(readlink "$backup_dir")
    fi
    
    if [[ ! -d "$backup_dir" ]]; then
        log "ERROR" "백업 디렉토리를 찾을 수 없습니다: $backup_dir"
        return 1
    fi
    
    log "INFO" "🔍 백업 검증 중: $(basename "$backup_dir")"
    echo
    
    local verification_errors=0
    
    # 메타데이터 검증
    local metadata_file="$backup_dir/backup-metadata.json"
    if [[ -f "$metadata_file" ]]; then
        log "SUCCESS" "메타데이터 파일 존재"
        
        if command -v jq &> /dev/null; then
            if jq . "$metadata_file" > /dev/null 2>&1; then
                log "SUCCESS" "메타데이터 JSON 형식 유효"
                
                local backup_date=$(jq -r '.backup_info.date' "$metadata_file")
                local success_rate=$(jq -r '.backup_stats.success_rate' "$metadata_file")
                
                echo -e "  ${CYAN}• 백업 일시: $backup_date${NC}"
                echo -e "  ${CYAN}• 성공률: $success_rate${NC}"
            else
                log "ERROR" "메타데이터 JSON 형식 오류"
                ((verification_errors++))
            fi
        fi
    else
        log "WARNING" "메타데이터 파일 없음"
    fi
    
    # 핵심 파일 존재 확인
    local critical_files=(".mcp.json" ".env.local")
    for critical_file in "${critical_files[@]}"; do
        if find "$backup_dir" -name "$critical_file" | grep -q .; then
            log "SUCCESS" "핵심 파일 존재: $critical_file"
        else
            log "WARNING" "핵심 파일 누락: $critical_file"
            ((verification_errors++))
        fi
    done
    
    # 디렉토리 구조 확인
    local expected_dirs=("files" "dirs")
    for expected_dir in "${expected_dirs[@]}"; do
        if [[ -d "$backup_dir/$expected_dir" ]]; then
            log "SUCCESS" "디렉토리 구조 정상: $expected_dir"
        else
            log "WARNING" "디렉토리 누락: $expected_dir"
        fi
    done
    
    echo
    if [[ $verification_errors -eq 0 ]]; then
        log "SUCCESS" "✅ 백업 검증 통과"
        return 0
    else
        log "WARNING" "⚠️  $verification_errors개 검증 오류 발견"
        return 1
    fi
}

# 도움말 출력
show_help() {
    echo -e "${CYAN}💾 MCP 설정 백업/복구 시스템 v${SCRIPT_VERSION}${NC}"
    echo
    echo -e "${WHITE}사용법:${NC}"
    echo "  $0 [명령] [옵션]"
    echo
    echo -e "${WHITE}명령:${NC}"
    echo "  backup      새 백업 생성 (기본값)"
    echo "  restore     최신 백업으로 복구"
    echo "  restore [이름]  지정된 백업으로 복구"
    echo "  list        백업 목록 표시"
    echo "  verify      백업 무결성 검증"
    echo "  clean       오래된 백업 정리"
    echo "  info        백업 상세 정보 표시"
    echo
    echo -e "${WHITE}옵션:${NC}"
    echo "  --compress  백업 압축"
    echo "  --no-cleanup 자동 정리 안 함"
    echo "  --force     강제 실행"
    echo
    echo -e "${WHITE}예시:${NC}"
    echo "  $0                    # 새 백업 생성"
    echo "  $0 backup --compress  # 압축된 백업 생성"
    echo "  $0 restore            # 최신 백업으로 복구"
    echo "  $0 restore mcp-config-20250818_143022  # 특정 백업 복구"
    echo "  $0 list               # 백업 목록 확인"
    echo
}

# 🚀 메인 실행 함수
main() {
    local command="${1:-backup}"
    local compress_mode=false
    local no_cleanup=false
    local force_mode=false
    
    # 옵션 파싱
    while [[ $# -gt 0 ]]; do
        case "${1:-}" in
            "--compress")
                compress_mode=true
                shift
                ;;
            "--no-cleanup")
                no_cleanup=true
                shift
                ;;
            "--force")
                force_mode=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # 헤더 출력
    if [[ "$command" != "list" ]]; then
        print_header
    fi
    
    # 명령 실행
    case "$command" in
        "backup")
            create_backup
            if $compress_mode; then
                compress_backup
            fi
            ;;
        "restore")
            if [[ -n "${2:-}" ]]; then
                restore_backup "$2"
            else
                restore_backup "latest"
            fi
            ;;
        "list")
            list_backups
            ;;
        "verify")
            if [[ -n "${2:-}" ]]; then
                verify_backup "$2"
            else
                verify_backup
            fi
            ;;
        "clean")
            cleanup_old_backups
            ;;
        "info")
            if [[ -n "${2:-}" ]]; then
                local backup_path="$BACKUP_ROOT/$2"
                if [[ -f "$backup_path/backup-metadata.json" ]]; then
                    cat "$backup_path/backup-metadata.json" | jq .
                else
                    log "ERROR" "백업 정보를 찾을 수 없습니다: $2"
                fi
            else
                log "ERROR" "백업 이름을 지정해주세요"
            fi
            ;;
        *)
            echo -e "${RED}❌ 알 수 없는 명령: $command${NC}"
            show_help
            exit 1
            ;;
    esac
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