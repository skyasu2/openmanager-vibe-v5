#!/bin/bash
# AI Tools Health Check (Deprecated Wrapper)
#
# ⚠️ 이 스크립트는 Deprecated 되었습니다!
#
# AI 도구 관리는 dev-environment-manager 서브에이전트로 이관되었습니다.
# 서브에이전트를 사용하면 더 강력한 기능을 이용할 수 있습니다:
# - 자동 업그레이드
# - OAuth 재인증 감지
# - 구조적 환경 관리
# - 메모리 기반 이력 관리
#
# 사용 방법:
#   Claude Code에서: "dev-environment-manager야, AI 도구 헬스 체크해줘"
#   또는 Task dev-environment-manager "AI CLI 도구 상태 확인"
#
# 레거시 지원을 위해 기본 체크만 유지합니다.

set -eo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}⚠️  Deprecated: 이 스크립트는 dev-environment-manager 서브에이전트로 이관되었습니다${NC}"
echo ""
echo -e "${BLUE}권장 사용 방법:${NC}"
echo '  Claude Code: "dev-environment-manager야, AI 도구 헬스 체크해줘"'
echo '  또는: Task dev-environment-manager "AI CLI 도구 상태 확인"'
echo ""
echo -e "${YELLOW}레거시 지원 모드로 기본 체크를 실행합니다...${NC}"
echo ""

# 기본 체크만 수행
echo -e "${BLUE}📊 AI Tools 설치 상태${NC}"
echo ""

check_simple() {
  local name=$1
  local cmd=$2

  if command -v "$cmd" &> /dev/null; then
    local version=$($cmd --version 2>&1 | head -1)
    echo -e "  ✅ ${GREEN}$name${NC}: $version"
  else
    echo -e "  ❌ ${RED}$name${NC}: 미설치"
  fi
}

check_simple "Claude Code" "claude"
check_simple "Codex CLI" "codex"
check_simple "Gemini CLI" "gemini"
check_simple "Qwen CLI" "qwen"

echo ""
echo -e "${BLUE}💡 더 많은 기능은 dev-environment-manager 서브에이전트를 사용하세요!${NC}"
echo ""

exit 0
