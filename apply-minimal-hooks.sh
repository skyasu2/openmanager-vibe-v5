#!/bin/bash

# 훅 시스템 간소화 적용 스크립트

echo "🎯 훅 시스템 간소화 시작..."
echo ""

# 1. 기존 훅 백업
echo "1. 기존 훅 백업 중..."
mkdir -p hooks/backup/full-version
cp hooks/*.sh hooks/backup/full-version/ 2>/dev/null || true

# 2. 간소화된 훅에 실행 권한 부여
echo "2. 간소화된 훅 설정 중..."
chmod +x hooks/pre-database-hook-minimal.sh
chmod +x hooks/post-security-hook-minimal.sh  
chmod +x hooks/agent-completion-hook-minimal.sh

# 3. 설정 파일 백업 및 교체
echo "3. 설정 파일 업데이트 중..."
if [ -f ".claude/settings.local.json" ]; then
    cp .claude/settings.local.json .claude/settings.local.json.backup
fi
cp .claude/settings.minimal.json .claude/settings.local.json

# 4. 불필요한 디렉토리 정리 (선택사항)
echo "4. 임시 파일 정리 중..."
rm -rf .claude/issues/commit-summary-* 2>/dev/null || true
rm -rf .claude/issues/agent-completion-* 2>/dev/null || true

# 5. 간단한 테스트
echo ""
echo "5. 간소화된 시스템 테스트..."
echo ""

# DB 훅 테스트
echo "📍 DB 보호 테스트:"
./hooks/pre-database-hook-minimal.sh "delete" "DELETE FROM users WHERE id=1"
echo ""

# 보안 훅 테스트  
echo "📍 보안 파일 테스트:"
./hooks/post-security-hook-minimal.sh "src/auth/login.ts"
echo ""

# 완료 메시지
echo "✅ 훅 시스템 간소화 완료!"
echo ""
echo "변경사항:"
echo "  - 훅 수: 11개 → 3개"
echo "  - 자동 트리거: 최소화"
echo "  - 개발 흐름: 방해 최소화"
echo ""
echo "💡 사용 방법:"
echo "  - 평소: 훅이 조용히 백그라운드에서 작동"
echo "  - 필요시: Task(subagent_type='...') 로 명시적 호출"
echo ""
echo "🔄 원래대로 되돌리려면:"
echo "  cp .claude/settings.local.json.backup .claude/settings.local.json"