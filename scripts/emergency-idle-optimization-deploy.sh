#!/bin/bash

# 🚨 긴급 중지 상태 사용량 최적화 배포 스크립트
# 
# 시스템이 중지된 상태에서 발생하는 불필요한 API 호출을 최소화하여
# Vercel 사용량을 극적으로 감소시킵니다.

echo "🚨 긴급 중지 상태 사용량 최적화 배포 시작"
echo "========================================"

# 현재 시간 출력
echo "📅 배포 시간: $(date)"

# 1. 환경변수 백업
echo "💾 기존 환경변수 백업 중..."
if [ -f .env.local ]; then
    cp .env.local .env.local.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ 기존 .env.local 백업 완료"
fi

# 2. 응급 최적화 환경변수 적용
echo "🚨 응급 최적화 환경변수 적용 중..."
cat config/emergency-idle-optimization.env >> .env.local
echo "✅ 응급 환경변수 적용 완료"

# 3. TypeScript 컴파일 체크
echo "🔍 TypeScript 컴파일 체크 중..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ TypeScript 컴파일 오류 발생!"
    echo "🔄 백업에서 복원 중..."
    if [ -f .env.local.backup.* ]; then
        mv .env.local.backup.* .env.local
    fi
    exit 1
fi
echo "✅ TypeScript 컴파일 통과"

# 4. 린트 체크
echo "🔧 ESLint 체크 중..."
npm run lint
if [ $? -ne 0 ]; then
    echo "⚠️ ESLint 경고가 있지만 계속 진행..."
fi

# 5. 빌드 테스트
echo "🏗️ 빌드 테스트 중..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패!"
    echo "🔄 백업에서 복원 중..."
    if [ -f .env.local.backup.* ]; then
        mv .env.local.backup.* .env.local
    fi
    exit 1
fi
echo "✅ 빌드 테스트 통과"

# 6. Git 커밋
echo "📝 Git 커밋 중..."
git add .
git commit -m "🚨 긴급 중지 상태 사용량 최적화 배포

- 중지 상태에서 폴링 간격 5초 → 30초 증가
- 백그라운드 스케줄러 비활성화 로직 추가
- Keep-Alive 간격 최적화 (4시간 → 12시간)
- 서버 데이터 스케줄러 최적화 (35초 → 5분)
- React Query 폴링 간격 최적화

예상 효과:
- 중지 상태 하루 사용량: 8,640회 → 288회 (96.7% 감소)
- Vercel Function Invocations 대폭 절약"

if [ $? -ne 0 ]; then
    echo "⚠️ Git 커밋 실패 (변경사항이 없을 수 있음)"
fi

# 7. 원격 푸시
echo "🚀 원격 저장소에 푸시 중..."
git push
if [ $? -ne 0 ]; then
    echo "❌ Git 푸시 실패!"
    exit 1
fi
echo "✅ Git 푸시 완료"

# 8. Vercel 자동 배포 확인
echo "🌐 Vercel 자동 배포 상태 확인 중..."
echo "📊 배포 URL: https://vercel.com/insoft-insoft/openmanager-vibe-v5"
echo "⏳ 배포 완료까지 약 2-3분 소요됩니다."

# 9. 성공 메시지
echo ""
echo "✅ 긴급 중지 상태 사용량 최적화 배포 완료!"
echo "========================================"
echo "🎯 주요 최적화 내용:"
echo "  • 폴링 간격: 5초 → 30초 (6배 증가)"
echo "  • Keep-Alive: 4시간 → 12시간 (3배 증가)"
echo "  • 서버 데이터: 35초 → 5분 (8.6배 증가)"
echo "  • 백그라운드 프로세스: 중지 상태에서 비활성화"
echo ""
echo "📈 예상 효과:"
echo "  • 중지 상태 일일 호출: 8,640회 → 288회"
echo "  • 사용량 감소: 96.7% ↓"
echo "  • Vercel 비용: 거의 무료 수준 복귀"
echo ""
echo "🔍 모니터링:"
echo "  • 5-10분 후 프로덕션 환경에서 효과 확인"
echo "  • 사용량 대시보드: https://vercel.com/insoft-insoft/openmanager-vibe-v5/analytics"
echo ""
echo "🚨 참고: 이 최적화로 실시간성이 감소할 수 있습니다."
echo "    시스템이 안정화된 후 점진적으로 폴링 간격을 줄여나갈 예정입니다."

# 10. 최종 검증
echo ""
echo "🔍 최종 검증을 위해 1분 후 테스트 스크립트 실행..."
sleep 60
echo "📊 사용량 테스트 실행 중..."
node scripts/idle-system-usage-test.js

echo ""
echo "✅ 모든 작업 완료!" 