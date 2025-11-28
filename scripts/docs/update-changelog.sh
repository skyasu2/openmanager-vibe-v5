#!/usr/bin/env bash

# ============================================================================
# CHANGELOG 자동 갱신 스크립트
# ============================================================================
# 설명: Git 커밋 메시지에서 CHANGELOG.md를 자동 업데이트
# 버전: 1.0.0
# 작성일: 2025-11-28
# ============================================================================

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 경로 (동적)
PROJECT_ROOT="$(git rev-parse --show-toplevel)"
CHANGELOG_FILE="$PROJECT_ROOT/CHANGELOG.md"

# 에러 트랩
trap 'echo -e "${RED}❌ 스크립트 실패 (라인: $LINENO, 명령어: $BASH_COMMAND)${NC}"; exit 1' ERR

echo -e "${GREEN}📝 CHANGELOG 자동 갱신 시작...${NC}"

# ============================================================================
# 1. 마지막 업데이트 날짜 확인
# ============================================================================
LAST_UPDATE_DATE=$(grep -oP '## \[\d+\.\d+\.\d+\] - \K\d{4}-\d{2}-\d{2}' "$CHANGELOG_FILE" | head -1 || echo "1970-01-01")
echo "  마지막 CHANGELOG 업데이트: $LAST_UPDATE_DATE"

# ============================================================================
# 2. 새로운 커밋 수집 (마지막 업데이트 이후)
# ============================================================================
NEW_COMMITS=$(git log --since="$LAST_UPDATE_DATE" --pretty=format:"%h|%s|%an|%ad" --date=short --no-merges)

if [[ -z "$NEW_COMMITS" ]]; then
  echo -e "${YELLOW}⚠️  새로운 커밋이 없습니다.${NC}"
  exit 0
fi

# ============================================================================
# 3. 커밋 분류 (Conventional Commits 기반)
# ============================================================================
declare -A CHANGELOG_SECTIONS
CHANGELOG_SECTIONS=(
  [feat]="### 🚀 Features"
  [fix]="### 🐛 Bug Fixes"
  [docs]="### 📚 Documentation"
  [style]="### 💅 Styles"
  [refactor]="### ♻️ Refactors"
  [perf]="### ⚡ Performance"
  [test]="### 🧪 Tests"
  [chore]="### 🔧 Chores"
)

# 임시 CHANGELOG 생성
TEMP_CHANGELOG=$(mktemp)
TODAY=$(date +%Y-%m-%d)

echo "## [Unreleased] - $TODAY" > "$TEMP_CHANGELOG"
echo "" >> "$TEMP_CHANGELOG"

# 각 섹션별로 커밋 수집
for TYPE in feat fix docs style refactor perf test chore; do
  SECTION_COMMITS=$(echo "$NEW_COMMITS" | grep "^[a-f0-9]*|${TYPE}:" || true)

  if [[ -n "$SECTION_COMMITS" ]]; then
    echo "${CHANGELOG_SECTIONS[$TYPE]}" >> "$TEMP_CHANGELOG"
    echo "" >> "$TEMP_CHANGELOG"

    while IFS='|' read -r HASH MSG AUTHOR DATE; do
      # 커밋 메시지에서 타입 prefix 제거
      CLEAN_MSG=$(echo "$MSG" | sed "s/^${TYPE}[:(] //")
      echo "- $CLEAN_MSG ([${HASH}](https://github.com/your-username/openmanager-vibe-v5/commit/${HASH}))" >> "$TEMP_CHANGELOG"
    done <<< "$SECTION_COMMITS"

    echo "" >> "$TEMP_CHANGELOG"
  fi
done

# ============================================================================
# 4. CHANGELOG.md에 병합
# ============================================================================
# 기존 CHANGELOG 내용 읽기
EXISTING_CHANGELOG=$(tail -n +11 "$CHANGELOG_FILE" 2>/dev/null || echo "")

# 새로운 CHANGELOG 생성
cat > "$CHANGELOG_FILE" <<EOF
# Changelog

> 📌 **참고**: 이전 버전들의 상세 변경 이력은 레거시 파일들을 참조하세요.
>
> - 현재 파일: **v5.80.0 이후** (2025-11-15 ~) - 최신 안정화 버전
> - [v5.78.0 ~ v5.79.1](./CHANGELOG-LEGACY-3.md) (2025-09-21 ~ 2025-10-03)
> - [v5.67.22 ~ v5.76.32](./CHANGELOG-LEGACY-1.md) (2025-08-17 ~ 2025-09-06)
> - [v5.66.40 ~ v5.67.21](./CHANGELOG-LEGACY-2.md) (2025-08-12 ~ 2025-08-17)
> - [v5.0.0 ~ v5.65.6](./CHANGELOG-LEGACY.md) (2025-05 ~ 2025-08)

$(cat "$TEMP_CHANGELOG")

---

$EXISTING_CHANGELOG
EOF

rm "$TEMP_CHANGELOG"

echo -e "${GREEN}✅ CHANGELOG 갱신 완료!${NC}"
echo "  새로운 커밋 수: $(echo "$NEW_COMMITS" | wc -l)"
echo "  업데이트 날짜: $TODAY"
