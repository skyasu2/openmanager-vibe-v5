#!/bin/bash
# AI 도구 자동 업데이트 스크립트
# 사용법: ./scripts/ai/health/ai-tools-auto-update.sh [--yes]

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# nvm과 충돌하는 npm_config_prefix 제거
if [[ -n "${npm_config_prefix:-}" ]]; then
    echo -e "${YELLOW}⚠️  npm_config_prefix(${npm_config_prefix}) 감지 → unset 처리${NC}"
    unset npm_config_prefix
fi

# NVM 환경 로드
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 자동 승인 플래그
AUTO_YES=false
if [[ "${1:-}" == "--yes" ]] || [[ "${1:-}" == "-y" ]]; then
    AUTO_YES=true
fi

echo "🔄 AI 도구 업데이트 스크립트"
echo "=================================="
echo ""

# 업데이트할 패키지 목록
declare -A PACKAGES=(
    ["@anthropic-ai/claude-code"]="claude"
    ["@openai/codex"]="codex"
    ["@google/gemini-cli"]="gemini"
    ["@qwen-code/qwen-code"]="qwen"
)

# 업데이트 가능한 패키지 확인
UPDATES_AVAILABLE=()

for package in "${!PACKAGES[@]}"; do
    name=${PACKAGES[$package]}

    # 현재 버전
    current=$($name --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "unknown")

    # 최신 버전
    latest=$(npm view "$package" version 2>/dev/null || echo "unknown")

    if [[ "$current" != "$latest" ]] && [[ "$latest" != "unknown" ]]; then
        echo -e "${YELLOW}⚠️  $name: $current → $latest (업데이트 가능)${NC}"
        UPDATES_AVAILABLE+=("$package")
    else
        echo -e "${GREEN}✅ $name: $current (최신)${NC}"
    fi
done

echo ""

# 업데이트할 항목이 없으면 종료
if [[ ${#UPDATES_AVAILABLE[@]} -eq 0 ]]; then
    echo -e "${GREEN}✅ 모든 AI 도구가 최신 버전입니다.${NC}"
    exit 0
fi

# 확인 프롬프트
if [[ "$AUTO_YES" == false ]]; then
    echo -e "${YELLOW}📋 ${#UPDATES_AVAILABLE[@]}개의 패키지를 업데이트하시겠습니까?${NC}"
    echo "   ${UPDATES_AVAILABLE[*]}"
    echo ""
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 업데이트가 취소되었습니다."
        exit 0
    fi
fi

echo ""
echo "🚀 업데이트 시작..."
echo ""

# 업데이트 실행
SUCCESS_COUNT=0
FAIL_COUNT=0

for package in "${UPDATES_AVAILABLE[@]}"; do
    name=${PACKAGES[$package]}
    echo "📦 $package 업데이트 중..."

    if npm update -g "$package" 2>&1 | grep -q "changed"; then
        new_version=$($name --version 2>&1 | grep -oP '\d+\.\d+\.\d+' | head -1 || echo "unknown")
        echo -e "${GREEN}✅ $name 업데이트 완료: $new_version${NC}"
        ((SUCCESS_COUNT++))
    else
        echo -e "${RED}❌ $name 업데이트 실패${NC}"
        ((FAIL_COUNT++))
    fi
    echo ""
done

# 결과 요약
echo "=================================="
echo "📊 업데이트 결과:"
echo "   ✅ 성공: $SUCCESS_COUNT"
echo "   ❌ 실패: $FAIL_COUNT"
echo ""

if [[ $SUCCESS_COUNT -gt 0 ]]; then
    echo -e "${YELLOW}💡 다음 단계:${NC}"
    echo "   1. docs/status.md의 버전 정보를 업데이트하세요"
    echo "   2. 업데이트된 도구들의 변경 사항을 확인하세요"
    echo ""
fi

# 실패가 있으면 종료 코드 1
if [[ $FAIL_COUNT -gt 0 ]]; then
    exit 1
fi

exit 0
