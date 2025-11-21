#!/usr/bin/env bash
# Automatic Temporary Files Cleanup Script
# Version: 1.0.0
# Last Updated: 2025-11-22
# Purpose: 임시 파일 및 빌드 결과물 자동 정리

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 확인
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

# 로그 디렉터리
LOG_DIR="logs/maintenance"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/cleanup-$(date +%Y-%m-%d-%H-%M-%S).log"

# 정리 통계
declare -i TOTAL_FILES=0
declare -i TOTAL_SIZE=0

log() {
    echo -e "${GREEN}[$(date +%Y-%m-%d\ %H:%M:%S)]${NC} $*" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $*" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" | tee -a "$LOG_FILE"
}

# 파일 크기 계산 (KB)
get_size() {
    local path="$1"
    if [[ -d "$path" ]]; then
        du -sk "$path" 2>/dev/null | cut -f1 || echo "0"
    else
        echo "0"
    fi
}

# 디렉터리 정리 함수
cleanup_directory() {
    local dir="$1"
    local desc="$2"
    local exclude_pattern="${3:-}"
    
    if [[ ! -d "$dir" ]]; then
        warn "$desc 디렉터리가 존재하지 않음: $dir"
        return 0
    fi
    
    local size_before=$(get_size "$dir")
    local count_before=$(find "$dir" -type f 2>/dev/null | wc -l)
    
    log "정리 시작: $desc ($dir)"
    
    if [[ -n "$exclude_pattern" ]]; then
        find "$dir" -type f ! -path "$exclude_pattern" -delete 2>/dev/null || true
    else
        find "$dir" -type f -delete 2>/dev/null || true
    fi
    
    # 빈 디렉터리 정리
    find "$dir" -type d -empty -delete 2>/dev/null || true
    
    local size_after=$(get_size "$dir")
    local count_after=$(find "$dir" -type f 2>/dev/null | wc -l)
    local files_deleted=$((count_before - count_after))
    local size_freed=$((size_before - size_after))
    
    TOTAL_FILES=$((TOTAL_FILES + files_deleted))
    TOTAL_SIZE=$((TOTAL_SIZE + size_freed))
    
    log "  ✅ 삭제된 파일: $files_deleted 개"
    log "  ✅ 확보된 공간: $size_freed KB"
}

# 메인 정리 프로세스
main() {
    log "========================================="
    log "임시 파일 자동 정리 시작"
    log "프로젝트: $PROJECT_ROOT"
    log "========================================="
    
    # 1. tmp/ 디렉터리 정리 (중요 파일 제외)
    cleanup_directory "tmp" "임시 파일" "*/vercel-env-setup.sh"
    
    # 2. 테스트 결과 정리
    cleanup_directory "test-results" "Playwright 테스트 결과"
    cleanup_directory "playwright-report" "Playwright 리포트"
    
    # 3. 빌드 결과 정리
    cleanup_directory "out" "Next.js 빌드 출력"
    cleanup_directory ".next/cache" "Next.js 캐시"
    
    # 4. 백업 파일 정리
    log "정리 시작: 백업 파일 (*.bak)"
    local bak_count=$(find . -name "*.bak" -type f 2>/dev/null | wc -l)
    if [[ $bak_count -gt 0 ]]; then
        find . -name "*.bak" -type f -delete 2>/dev/null || true
        log "  ✅ 삭제된 .bak 파일: $bak_count 개"
        TOTAL_FILES=$((TOTAL_FILES + bak_count))
    else
        log "  ℹ️  .bak 파일 없음"
    fi
    
    # 5. 오래된 로그 파일 정리 (30일 이상)
    log "정리 시작: 오래된 로그 파일 (30일 이상)"
    local old_logs=$(find logs -name "*.log" -type f -mtime +30 2>/dev/null | wc -l)
    if [[ $old_logs -gt 0 ]]; then
        find logs -name "*.log" -type f -mtime +30 -delete 2>/dev/null || true
        log "  ✅ 삭제된 로그 파일: $old_logs 개"
        TOTAL_FILES=$((TOTAL_FILES + old_logs))
    else
        log "  ℹ️  30일 이상 된 로그 파일 없음"
    fi
    
    # 최종 통계
    log "========================================="
    log "정리 완료"
    log "총 삭제된 파일: $TOTAL_FILES 개"
    log "총 확보된 공간: $TOTAL_SIZE KB ($(echo "scale=2; $TOTAL_SIZE/1024" | bc) MB)"
    log "로그 파일: $LOG_FILE"
    log "========================================="
}

# 스크립트 실행
main "$@"
