#!/usr/bin/env bash
# Serena Pattern Validator - Standalone Script
# 용도: CI/CD 통합, 수동 검증, 프로젝트 전체 스캔

set -e

VERSION="1.0.0"
SCAN_DIR="${1:-.}"
REPORT_FILE="${2:-/tmp/serena-validation-report.txt}"

echo "🔍 Serena Anti-pattern Validator v$VERSION"
echo "📂 Scan Directory: $SCAN_DIR"
echo ""

# 검사 대상 파일 목록
FILES=$(find "$SCAN_DIR" -type f \( -name "*.md" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "⚠️  검사 대상 파일 없음"
  exit 0
fi

TOTAL_FILES=$(echo "$FILES" | wc -l)
ANTI_PATTERN_COUNT=0
REPORT=""

echo "📊 총 $TOTAL_FILES개 파일 검사 중..."
echo ""

# 안티패턴 1: Read() 남발
echo "1️⃣  Read() 남발 검사..."
READ_VIOLATIONS=0
while IFS= read -r FILE; do
  MATCHES=$(grep -n "Read(.*\/\/.*(500|1000|2000)줄" "$FILE" 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    READ_VIOLATIONS=$((READ_VIOLATIONS + 1))
    ANTI_PATTERN_COUNT=$((ANTI_PATTERN_COUNT + 1))
    REPORT+="❌ Read() 남발: $FILE\n"
    REPORT+="   $MATCHES\n"
    REPORT+="   → Serena get_symbols_overview() 사용 권장\n\n"
    echo "   ❌ $FILE"
  fi
done <<< "$FILES"
echo "   결과: $READ_VIOLATIONS개 위반"

# 안티패턴 2: recursive:true without skip_ignored_files
echo "2️⃣  recursive:true 검사..."
RECURSIVE_VIOLATIONS=0
while IFS= read -r FILE; do
  # grep -Pzo는 파일이 이진 파일로 인식될 수 있으므로 간단한 패턴 사용
  if grep -q "recursive:\s*true" "$FILE" 2>/dev/null; then
    if ! grep -q "skip_ignored_files:\s*true" "$FILE" 2>/dev/null; then
      RECURSIVE_VIOLATIONS=$((RECURSIVE_VIOLATIONS + 1))
      ANTI_PATTERN_COUNT=$((ANTI_PATTERN_COUNT + 1))
      REPORT+="❌ recursive:true without skip_ignored_files: $FILE\n"
      REPORT+="   → skip_ignored_files: true 추가 필수 (48배 빠름)\n\n"
      echo "   ❌ $FILE"
    fi
  fi
done <<< "$FILES"
echo "   결과: $RECURSIVE_VIOLATIONS개 위반"

# 안티패턴 3: 루트 디렉토리 스캔
echo "3️⃣  루트 디렉토리 스캔 검사..."
ROOT_VIOLATIONS=0
while IFS= read -r FILE; do
  MATCHES=$(grep -n 'list_dir.*relative_path.*["'"'"']\.['"'"'"]' "$FILE" 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    ROOT_VIOLATIONS=$((ROOT_VIOLATIONS + 1))
    ANTI_PATTERN_COUNT=$((ANTI_PATTERN_COUNT + 1))
    REPORT+="❌ 루트 디렉토리 스캔: $FILE\n"
    REPORT+="   $MATCHES\n"
    REPORT+="   → 특정 디렉토리로 제한 필수\n\n"
    echo "   ❌ $FILE"
  fi
done <<< "$FILES"
echo "   결과: $ROOT_VIOLATIONS개 위반"

# 안티패턴 4: 광범위한 패턴 검색 (간단한 휴리스틱)
echo "4️⃣  광범위한 패턴 검색 검사..."
PATTERN_VIOLATIONS=0
while IFS= read -r FILE; do
  # search_for_pattern에서 1-3자 패턴 사용 탐지
  MATCHES=$(grep -n 'search_for_pattern.*substring_pattern.*["'"'"'][^"'"'"']\{1,3\}["'"'"']' "$FILE" 2>/dev/null || true)
  if [ -n "$MATCHES" ]; then
    # relative_path 있는지 확인
    if ! grep -q "relative_path" "$FILE" 2>/dev/null; then
      PATTERN_VIOLATIONS=$((PATTERN_VIOLATIONS + 1))
      ANTI_PATTERN_COUNT=$((ANTI_PATTERN_COUNT + 1))
      REPORT+="❌ 광범위한 패턴 검색: $FILE\n"
      REPORT+="   $MATCHES\n"
      REPORT+="   → relative_path로 범위 제한 필수\n\n"
      echo "   ❌ $FILE"
    fi
  fi
done <<< "$FILES"
echo "   결과: $PATTERN_VIOLATIONS개 위반"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ANTI_PATTERN_COUNT -eq 0 ]; then
  echo "✅ 모든 검사 통과! ($TOTAL_FILES개 파일)"
  echo "✅ Serena 안티패턴 0개 발견"
  echo ""
  echo "📊 요약:"
  echo "   - Read() 남발: 0개"
  echo "   - recursive:true 누락: 0개"
  echo "   - 루트 디렉토리 스캔: 0개"
  echo "   - 광범위한 패턴 검색: 0개"
  exit 0
else
  echo "❌ 안티패턴 발견: 총 $ANTI_PATTERN_COUNT개"
  echo ""
  echo "📊 요약:"
  echo "   - Read() 남발: $READ_VIOLATIONS개"
  echo "   - recursive:true 누락: $RECURSIVE_VIOLATIONS개"
  echo "   - 루트 디렉토리 스캔: $ROOT_VIOLATIONS개"
  echo "   - 광범위한 패턴 검색: $PATTERN_VIOLATIONS개"
  echo ""
  echo "📝 상세 리포트: $REPORT_FILE"
  echo -e "$REPORT" > "$REPORT_FILE"
  
  echo ""
  echo "📚 참조 문서:"
  echo "   - docs/claude/environment/mcp/serena-tools-comprehensive-guide.md"
  echo "   - docs/claude/environment/mcp/mcp-priority-guide.md"
  echo ""
  echo "⚠️  컨텍스트 압축 방지 규칙:"
  echo "   1. Read() 대신 Serena get_symbols_overview() 사용 (500줄+)"
  echo "   2. list_dir + recursive:true 시 skip_ignored_files:true 필수"
  echo "   3. search_for_pattern 시 relative_path로 범위 제한"
  echo "   4. 루트 디렉토리(.) 스캔 금지"
  
  exit 1
fi
