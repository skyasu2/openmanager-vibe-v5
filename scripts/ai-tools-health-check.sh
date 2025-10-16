#!/bin/bash
# AI Tools Health Check
# 목적: Claude Code, Codex, Gemini, Qwen CLI 도구의 상태 확인
# 작성: 2025-10-16
# 사용: ./scripts/ai-tools-health-check.sh

set -eo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 로그 디렉토리 생성
LOG_DIR="logs/ai-tools-health"
mkdir -p "$LOG_DIR"

TODAY=$(date +%Y-%m-%d)
LOG_FILE="$LOG_DIR/$TODAY.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}🏥 AI Tools Health Check${NC}"
echo -e "${BLUE}========================${NC}"
echo "시작 시간: $TIMESTAMP"
echo ""

# 로그 파일 초기화
{
  echo "==================================="
  echo "AI Tools Health Check - $TIMESTAMP"
  echo "==================================="
  echo ""
} > "$LOG_FILE"

# ============================================================================
# 함수: 단일 도구 체크
# ============================================================================

check_tool() {
  local tool_name=$1
  local command_name=$2
  local version_cmd=$3
  local test_cmd=$4
  local color=$5

  echo -e "${color}📊 $tool_name${NC}"
  {
    echo "📊 $tool_name"
    echo ""
  } >> "$LOG_FILE"

  # 1. 설치 여부 확인
  if command -v "$command_name" &> /dev/null; then
    local install_path=$(which "$command_name" 2>&1 || echo "aliased")
    echo -e "  ✅ 설치됨: ${GREEN}$install_path${NC}"
    echo "  ✅ 설치됨: $install_path" >> "$LOG_FILE"

    # 2. 버전 확인
    if [ -n "$version_cmd" ]; then
      local version_output=$(eval "$version_cmd" 2>&1 | head -2)
      echo -e "  📌 버전: ${CYAN}$version_output${NC}"
      echo "  📌 버전: $version_output" >> "$LOG_FILE"
    fi

    # 3. 대화 테스트 (옵션)
    if [ -n "$test_cmd" ]; then
      echo -e "  🔍 대화 테스트 중..."
      if timeout 10 bash -c "$test_cmd" &> /dev/null; then
        echo -e "  ✅ 대화 테스트: ${GREEN}성공${NC}"
        echo "  ✅ 대화 테스트: 성공" >> "$LOG_FILE"
      else
        echo -e "  ⚠️  대화 테스트: ${YELLOW}실패 (타임아웃 또는 인증 필요)${NC}"
        echo "  ⚠️  대화 테스트: 실패 (타임아웃 또는 인증 필요)" >> "$LOG_FILE"
      fi
    fi

  else
    echo -e "  ❌ 미설치: ${RED}$command_name 명령어를 찾을 수 없음${NC}"
    echo "  ❌ 미설치: $command_name 명령어를 찾을 수 없음" >> "$LOG_FILE"
  fi

  echo ""
  echo "" >> "$LOG_FILE"
}

# ============================================================================
# 각 도구 체크
# ============================================================================

# Claude Code
check_tool \
  "Claude Code" \
  "claude" \
  "claude --version" \
  "" \
  "$BLUE"

# Codex CLI
check_tool \
  "Codex CLI" \
  "codex" \
  "codex --version" \
  'codex exec "hello" > /dev/null 2>&1' \
  "$RED"

# Gemini CLI
check_tool \
  "Gemini CLI" \
  "gemini" \
  "gemini --version" \
  'gemini "hello" > /dev/null 2>&1' \
  "$CYAN"

# Qwen CLI
check_tool \
  "Qwen CLI" \
  "qwen" \
  "qwen --version" \
  'qwen "hello" > /dev/null 2>&1' \
  "$GREEN"

# ============================================================================
# 업그레이드 가능 여부 확인
# ============================================================================

echo -e "${BLUE}📦 업그레이드 가능 패키지${NC}"
{
  echo "📦 업그레이드 가능 패키지"
  echo ""
} >> "$LOG_FILE"

# npm global packages 확인
if command -v npm &> /dev/null; then
  echo -e "  ${CYAN}npm 글로벌 패키지 확인 중...${NC}"

  # codex-cli 확인
  if npm list -g codex-cli &> /dev/null; then
    local current_codex=$(npm list -g codex-cli 2>&1 | grep codex-cli | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    local latest_codex=$(npm view codex-cli version 2>&1)

    if [ "$current_codex" != "$latest_codex" ]; then
      echo -e "  ⚠️  codex-cli: ${YELLOW}$current_codex → $latest_codex 업그레이드 가능${NC}"
      echo "  ⚠️  codex-cli: $current_codex → $latest_codex 업그레이드 가능" >> "$LOG_FILE"
      echo "     업그레이드: npm install -g codex-cli@latest" >> "$LOG_FILE"
    else
      echo -e "  ✅ codex-cli: ${GREEN}최신 버전 ($current_codex)${NC}"
      echo "  ✅ codex-cli: 최신 버전 ($current_codex)" >> "$LOG_FILE"
    fi
  fi

  # gemini-cli 확인
  if npm list -g gemini-cli &> /dev/null; then
    local current_gemini=$(npm list -g gemini-cli 2>&1 | grep gemini-cli | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    local latest_gemini=$(npm view gemini-cli version 2>&1)

    if [ "$current_gemini" != "$latest_gemini" ]; then
      echo -e "  ⚠️  gemini-cli: ${YELLOW}$current_gemini → $latest_gemini 업그레이드 가능${NC}"
      echo "  ⚠️  gemini-cli: $current_gemini → $latest_gemini 업그레이드 가능" >> "$LOG_FILE"
      echo "     업그레이드: npm install -g gemini-cli@latest" >> "$LOG_FILE"
    else
      echo -e "  ✅ gemini-cli: ${GREEN}최신 버전 ($current_gemini)${NC}"
      echo "  ✅ gemini-cli: 최신 버전 ($current_gemini)" >> "$LOG_FILE"
    fi
  fi

  # qwen-cli 확인
  if npm list -g qwen-cli &> /dev/null; then
    local current_qwen=$(npm list -g qwen-cli 2>&1 | grep qwen-cli | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    local latest_qwen=$(npm view qwen-cli version 2>&1)

    if [ "$current_qwen" != "$latest_qwen" ]; then
      echo -e "  ⚠️  qwen-cli: ${YELLOW}$current_qwen → $latest_qwen 업그레이드 가능${NC}"
      echo "  ⚠️  qwen-cli: $current_qwen → $latest_qwen 업그레이드 가능" >> "$LOG_FILE"
      echo "     업그레이드: npm install -g qwen-cli@latest" >> "$LOG_FILE"
    else
      echo -e "  ✅ qwen-cli: ${GREEN}최신 버전 ($current_qwen)${NC}"
      echo "  ✅ qwen-cli: 최신 버전 ($current_qwen)" >> "$LOG_FILE"
    fi
  fi
else
  echo -e "  ${YELLOW}npm이 설치되지 않음${NC}"
  echo "  npm이 설치되지 않음" >> "$LOG_FILE"
fi

echo ""
echo "" >> "$LOG_FILE"

# ============================================================================
# Claude Code 업그레이드 확인
# ============================================================================

echo -e "${BLUE}🔄 Claude Code 업그레이드 확인${NC}"
{
  echo "🔄 Claude Code 업그레이드 확인"
  echo ""
} >> "$LOG_FILE"

if command -v claude &> /dev/null; then
  echo -e "  ${CYAN}현재 버전:${NC} $(claude --version 2>&1 | head -1)"
  echo "  현재 버전: $(claude --version 2>&1 | head -1)" >> "$LOG_FILE"
  echo -e "  ${YELLOW}최신 버전 확인:${NC} https://github.com/anthropics/claude-code/releases"
  echo "  최신 버전 확인: https://github.com/anthropics/claude-code/releases" >> "$LOG_FILE"
  echo -e "  ${YELLOW}업그레이드:${NC} npm install -g @anthropic-ai/claude-code@latest"
  echo "  업그레이드: npm install -g @anthropic-ai/claude-code@latest" >> "$LOG_FILE"
else
  echo -e "  ${RED}Claude Code가 설치되지 않음${NC}"
  echo "  Claude Code가 설치되지 않음" >> "$LOG_FILE"
fi

echo ""
echo "" >> "$LOG_FILE"

# ============================================================================
# 요약
# ============================================================================

echo -e "${BLUE}📋 요약${NC}"
{
  echo "📋 요약"
  echo ""
} >> "$LOG_FILE"

TOTAL_TOOLS=4
INSTALLED_TOOLS=0

command -v claude &> /dev/null && ((INSTALLED_TOOLS++))
command -v codex &> /dev/null && ((INSTALLED_TOOLS++))
command -v gemini &> /dev/null && ((INSTALLED_TOOLS++))
command -v qwen &> /dev/null && ((INSTALLED_TOOLS++))

echo -e "  설치된 도구: ${GREEN}$INSTALLED_TOOLS${NC}/$TOTAL_TOOLS"
echo "  설치된 도구: $INSTALLED_TOOLS/$TOTAL_TOOLS" >> "$LOG_FILE"

if [ $INSTALLED_TOOLS -eq $TOTAL_TOOLS ]; then
  echo -e "  상태: ${GREEN}✅ 모든 도구 정상${NC}"
  echo "  상태: ✅ 모든 도구 정상" >> "$LOG_FILE"
elif [ $INSTALLED_TOOLS -ge 3 ]; then
  echo -e "  상태: ${YELLOW}⚠️  일부 도구 누락${NC}"
  echo "  상태: ⚠️  일부 도구 누락" >> "$LOG_FILE"
else
  echo -e "  상태: ${RED}❌ 다수 도구 누락${NC}"
  echo "  상태: ❌ 다수 도구 누락" >> "$LOG_FILE"
fi

echo ""
echo "" >> "$LOG_FILE"

# ============================================================================
# 권장 사항
# ============================================================================

if [ $INSTALLED_TOOLS -lt $TOTAL_TOOLS ]; then
  echo -e "${YELLOW}💡 권장 사항${NC}"
  {
    echo "💡 권장 사항"
    echo ""
  } >> "$LOG_FILE"

  ! command -v claude &> /dev/null && {
    echo -e "  ${YELLOW}→ Claude Code 설치:${NC} npm install -g @anthropic-ai/claude-code"
    echo "  → Claude Code 설치: npm install -g @anthropic-ai/claude-code" >> "$LOG_FILE"
  }

  ! command -v codex &> /dev/null && {
    echo -e "  ${YELLOW}→ Codex CLI 설치:${NC} npm install -g codex-cli"
    echo "  → Codex CLI 설치: npm install -g codex-cli" >> "$LOG_FILE"
  }

  ! command -v gemini &> /dev/null && {
    echo -e "  ${YELLOW}→ Gemini CLI 설치:${NC} npm install -g gemini-cli"
    echo "  → Gemini CLI 설치: npm install -g gemini-cli" >> "$LOG_FILE"
  }

  ! command -v qwen &> /dev/null && {
    echo -e "  ${YELLOW}→ Qwen CLI 설치:${NC} npm install -g qwen-cli"
    echo "  → Qwen CLI 설치: npm install -g qwen-cli" >> "$LOG_FILE"
  }

  echo ""
  echo "" >> "$LOG_FILE"
fi

# ============================================================================
# 종료
# ============================================================================

END_TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

echo -e "${BLUE}📁 로그 저장 위치:${NC} $LOG_FILE"
echo "종료 시간: $END_TIMESTAMP"
echo ""

{
  echo "📁 로그 저장 위치: $LOG_FILE"
  echo "종료 시간: $END_TIMESTAMP"
} >> "$LOG_FILE"

exit 0
