#!/bin/bash

# 🔐 하드코딩된 토큰 제거 스크립트
# OpenManager Vibe v5 - 보안 취약점 수정

echo "🔐 하드코딩된 토큰 제거를 시작합니다..."
echo ""

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 제거할 토큰들
OLD_TOKEN="SENSITIVE_INFO_REMOVED"
OLD_HOST="your_redis_host_here"

# 1. 토큰이 포함된 파일 찾기
echo -e "${YELLOW}🔍 하드코딩된 토큰을 포함한 파일 검색 중...${NC}"
FILES_WITH_TOKEN=$(grep -r "$OLD_TOKEN" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next | cut -d: -f1 | sort | uniq)
FILES_WITH_HOST=$(grep -r "$OLD_HOST" . --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next | cut -d: -f1 | sort | uniq)

# 중복 제거
ALL_FILES=$(echo -e "$FILES_WITH_TOKEN\n$FILES_WITH_HOST" | sort | uniq)

echo ""
echo "영향받은 파일들:"
echo "$ALL_FILES"
echo ""

# 2. 사용자 확인
read -p "위 파일들을 수정하시겠습니까? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "작업이 취소되었습니다."
    exit 1
fi

# 3. 백업 디렉토리 생성
BACKUP_DIR=".backup/security-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo -e "${GREEN}✅ 백업 디렉토리 생성: $BACKUP_DIR${NC}"

# 4. 파일 백업 및 수정
echo ""
echo "파일 수정 중..."

for file in $ALL_FILES; do
    # 스크립트 자신은 제외
    if [[ "$file" == "./scripts/remove-hardcoded-tokens.sh" ]]; then
        continue
    fi
    
    # 백업
    cp "$file" "$BACKUP_DIR/"
    
    # 토큰 치환
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s|$OLD_TOKEN|process.env.UPSTASH_REDIS_PASSWORD|g" "$file"
        sed -i '' "s|'$OLD_HOST'|process.env.UPSTASH_REDIS_HOST|g" "$file"
    else
        # Linux
        sed -i "s|$OLD_TOKEN|process.env.UPSTASH_REDIS_PASSWORD|g" "$file"
        sed -i "s|'$OLD_HOST'|process.env.UPSTASH_REDIS_HOST|g" "$file"
    fi
    
    echo -e "${GREEN}✅ 수정됨: $file${NC}"
done

# 5. 환경변수 파일 업데이트
echo ""
echo -e "${YELLOW}📝 환경변수 파일 업데이트 중...${NC}"

# .env.example 업데이트
if ! grep -q "UPSTASH_REDIS_HOST" .env.example 2>/dev/null; then
    cat >> .env.example << 'EOF'

# ==============================================
# 🔐 Upstash Redis (보안 업데이트)
# ==============================================
# Upstash 콘솔에서 새 토큰 생성 필요
# https://console.upstash.com
UPSTASH_REDIS_HOST=your-redis-instance.upstash.io
UPSTASH_REDIS_PASSWORD=your-new-redis-password
KV_REST_API_URL=https://your-redis-instance.upstash.io
KV_REST_API_TOKEN=your-new-api-token
EOF
    echo -e "${GREEN}✅ .env.example 업데이트됨${NC}"
fi

# 6. Git 상태 확인
echo ""
echo -e "${YELLOW}📊 Git 상태:${NC}"
git status --short

# 7. 권장사항 출력
echo ""
echo -e "${RED}⚠️  중요 작업이 남아있습니다:${NC}"
echo ""
echo "1. Upstash 콘솔에서 Redis 비밀번호 재설정:"
echo "   https://console.upstash.com"
echo ""
echo "2. .env.local 파일에 새 인증 정보 추가:"
echo "   UPSTASH_REDIS_HOST=your_redis_host_here"
echo "   UPSTASH_REDIS_PASSWORD=새로운_비밀번호"
echo "   KV_REST_API_URL=https://your_redis_host_here"
echo "   KV_REST_API_TOKEN=새로운_API_토큰"
echo ""
echo "3. Git 기록에서 민감한 정보 제거 (선택사항):"
echo "   git filter-branch 또는 BFG Repo-Cleaner 사용"
echo ""
echo "4. 변경사항 커밋:"
echo "   git add ."
echo "   git commit -m '🔐 보안: 하드코딩된 Redis 토큰 제거'"
echo ""
echo -e "${GREEN}✅ 스크립트 완료! 백업은 $BACKUP_DIR 에 저장되었습니다.${NC}"