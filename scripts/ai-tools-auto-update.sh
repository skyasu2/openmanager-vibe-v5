#!/bin/bash
# AI 도구 자동 업데이트 스크립트
# 실행: ./scripts/ai-tools-auto-update.sh
# 크론: 0 9 * * * /mnt/d/cursor/openmanager-vibe-v5/scripts/ai-tools-auto-update.sh

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 디렉토리
LOG_DIR="/mnt/d/cursor/openmanager-vibe-v5/logs/ai-tools-updates"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/update-$(date +%Y-%m-%d).log"

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +%H:%M:%S)] ✅ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +%H:%M:%S)] ⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +%H:%M:%S)] ❌ $1${NC}" | tee -a "$LOG_FILE"
}

# 업데이트 확인 함수
check_and_update() {
    local package=$1
    local current_version=$2

    log "📦 $package 확인 중..."

    # 최신 버전 조회
    local latest_version=$(npm view "$package" version 2>/dev/null || echo "unknown")

    if [[ "$latest_version" == "unknown" ]]; then
        log_error "$package 버전 조회 실패"
        return 1
    fi

    log "   현재: $current_version → 최신: $latest_version"

    # 버전 비교
    if [[ "$current_version" == "$latest_version" ]]; then
        log_success "$package 이미 최신 버전"
        return 0
    fi

    # 업데이트 실행
    log_warning "$package 업데이트 시작..."
    if npm install -g "$package@latest" >> "$LOG_FILE" 2>&1; then
        log_success "$package 업데이트 완료: $current_version → $latest_version"

        # 중요 업데이트 알림 (메이저 버전)
        local current_major=$(echo "$current_version" | cut -d. -f1)
        local latest_major=$(echo "$latest_version" | cut -d. -f1)
        if [[ "$current_major" != "$latest_major" ]]; then
            log_warning "🔥 메이저 업데이트! 변경사항 확인 필요: $package"
            echo "$package: $current_version → $latest_version (메이저)" >> "$LOG_DIR/major-updates.txt"
        fi
        return 0
    else
        log_error "$package 업데이트 실패"
        return 1
    fi
}

# NVM 환경 로드
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 메인 실행
log "🚀 AI 도구 자동 업데이트 시작"
log "=================================================="

# 1. Claude Code
CLAUDE_VERSION=$(claude --version 2>&1 | grep -oP '\d+\.\d+\.\d+' || echo "unknown")
check_and_update "@anthropic-ai/claude-code" "$CLAUDE_VERSION"

# 2. Codex CLI
CODEX_VERSION=$(codex --version 2>&1 | grep -oP '\d+\.\d+\.\d+' || echo "unknown")
check_and_update "@openai/codex" "$CODEX_VERSION"

# 3. Gemini CLI
GEMINI_VERSION=$(gemini --version 2>&1 | grep -oP '\d+\.\d+\.\d+' || echo "unknown")
check_and_update "@google/gemini-cli" "$GEMINI_VERSION"

# 4. Qwen CLI
QWEN_VERSION=$(qwen --version 2>&1 | grep -oP '\d+\.\d+\.\d+' || echo "unknown")
check_and_update "@qwen-code/qwen-code" "$QWEN_VERSION"

log "=================================================="
log_success "AI 도구 업데이트 완료"

# MCP 서버 재시작 (필요 시)
if pgrep -f "claude-code" > /dev/null; then
    log_warning "Claude Code 실행 중 - MCP 재시작 권장"
fi

# 요약 출력
echo ""
log "📊 업데이트 요약:"
tail -n 20 "$LOG_FILE" | grep -E "✅|⚠️|❌" || true

# 메이저 업데이트 알림
if [[ -f "$LOG_DIR/major-updates.txt" ]] && [[ $(wc -l < "$LOG_DIR/major-updates.txt") -gt 0 ]]; then
    echo ""
    log_warning "🔥 메이저 업데이트 감지:"
    cat "$LOG_DIR/major-updates.txt"
fi
