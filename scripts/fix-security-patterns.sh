#!/bin/bash

# 🔧 보안 패턴 일괄 수정 스크립트
# 예제 및 테스트 파일의 플레이스홀더를 안전한 형태로 변경

echo "🔧 보안 패턴 일괄 수정 중..."

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# 1. 남은 문서 파일들 정리
echo -e "${YELLOW}📄 문서 파일들 정리 중...${NC}"
find docs/ -name "*.md" -exec sed -i \
  -e 's/YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER/YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER/g' \
  -e 's/YOUR_API_KEY_PLACEHOLDER/YOUR_API_KEY_PLACEHOLDER/g' \
  -e 's/your_token_here/YOUR_TOKEN_PLACEHOLDER/g' \
  -e 's/your_[a-z_]*_here/YOUR_PLACEHOLDER/g' \
  {} \; 2>/dev/null || true

# 2. 스크립트 파일들 수정
echo -e "${YELLOW}📜 스크립트 파일들 수정 중...${NC}"
find scripts/ \( -name "*.sh" -o -name "*.js" -o -name "*.mjs" -o -name "*.cjs" \) -exec sed -i \
  -e 's/YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER/YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER/g' \
  -e 's/YOUR_API_KEY_PLACEHOLDER/YOUR_API_KEY_PLACEHOLDER/g' \
  -e 's/MOCK_API_KEY/MOCK_API_KEY/g' \
  -e 's/MOCK_SECRET_KEY/MOCK_SECRET_KEY/g' \
  {} \; 2>/dev/null || true

# 3. 기타 설정 파일들
echo -e "${YELLOW}⚙️ 설정 파일들 수정 중...${NC}"
for file in scripts/verify-env.cjs scripts/setup-env-interactive.sh scripts/security-cleanup.mjs; do
  if [ -f "$file" ]; then
    sed -i \
      -e 's/your_[a-z_]*_here/YOUR_PLACEHOLDER/g' \
      -e 's/test_[a-z_]*/MOCK_VALUE/g' \
      "$file" 2>/dev/null || true
  fi
done

# 4. 특수 패턴 제거 (GitHub Actions에서 문제가 되는 패턴들)
echo -e "${YELLOW}🔍 특수 패턴 제거 중...${NC}"
# redis:// 패턴을 안전하게 변경
find . -type f \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./.next/*" \
  -not -name "*.lock" \
  -exec grep -l "redis://default:" {} \; | while read -r file; do
    echo "수정 중: $file"
    sed -i 's|redis://default:YOUR_REDIS_TOKEN_PLACEHOLDER@]*@|redis://default:YOUR_REDIS_TOKEN_PLACEHOLDER@|g' "$file" 2>/dev/null || true
done

# postgresql:// 패턴을 안전하게 변경
find . -type f \
  -not -path "./node_modules/*" \
  -not -path "./.git/*" \
  -not -path "./.next/*" \
  -not -name "*.lock" \
  -exec grep -l "postgresql://postgres:" {} \; | while read -r file; do
    echo "수정 중: $file"
    sed -i 's|postgresql://postgres:YOUR_PASSWORD_PLACEHOLDER@]*@|postgresql://postgres:YOUR_PASSWORD_PLACEHOLDER@|g' "$file" 2>/dev/null || true
done

# 5. 결과 확인
echo -e "\n${GREEN}✅ 보안 패턴 수정 완료!${NC}"
echo "다음 명령어로 보안 검사를 실행할 수 있습니다:"
echo "  ./scripts/check-hardcoded-secrets.sh"

# 6. 수정된 파일 목록 표시
echo -e "\n${YELLOW}📋 수정된 파일들:${NC}"
git status --porcelain | grep "^ M" | cut -c4-

echo -e "\n${GREEN}완료!${NC}"