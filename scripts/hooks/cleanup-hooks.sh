#!/bin/bash

echo "🧹 불필요한 훅 파일 정리"
echo ""

# 백업 디렉토리 생성
mkdir -p hooks/archive/removed-hooks

# Ultra-minimal 시스템에서 필요한 훅만 남기고 나머지 이동
echo "1. 불필요한 훅 파일 이동 중..."

# 필요한 훅들 (유지)
KEEP_HOOKS=(
    "pre-database-hook-ultra-minimal.sh"
    "shared-functions.sh"  # 혹시 사용할 수도 있으므로
)

# 모든 훅 파일 확인
for hook in hooks/*.sh; do
    filename=$(basename "$hook")
    
    # 유지할 훅인지 확인
    keep=false
    for keeper in "${KEEP_HOOKS[@]}"; do
        if [[ "$filename" == "$keeper" ]]; then
            keep=true
            break
        fi
    done
    
    # 유지하지 않을 훅은 archive로 이동
    if [[ "$keep" == false ]]; then
        echo "   이동: $filename"
        mv "$hook" "hooks/archive/removed-hooks/" 2>/dev/null || true
    else
        echo "   유지: $filename"
    fi
done

echo ""
echo "2. 현재 남은 훅 파일:"
ls -la hooks/*.sh 2>/dev/null | grep -v archive || echo "   (거의 없음 - 좋습니다!)"

echo ""
echo "3. 권한 설정..."
chmod +x hooks/pre-database-hook-ultra-minimal.sh 2>/dev/null || true

echo ""
echo "✅ 정리 완료!"
echo ""
echo "📋 결과:"
echo "- 필수 훅만 유지: pre-database-hook-ultra-minimal.sh"
echo "- 나머지는 hooks/archive/removed-hooks/로 이동"
echo "- Claude Code가 완전한 자율성을 가지게 됨"
echo ""
echo "💡 팁: 이전 시스템으로 복원하려면:"
echo "   mv hooks/archive/removed-hooks/*.sh hooks/"
echo "   cp .claude/settings.local.json.backup .claude/settings.local.json"