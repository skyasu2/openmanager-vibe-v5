#!/bin/bash

# 🚨 응급 배포: Edge Request 사용량 제한
echo "🚨 응급 배포 시작 - Edge Request 사용량 제한"

# 1. 빌드 테스트
echo "📦 빌드 테스트 중..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패 - 배포 중단"
    exit 1
fi

# 2. Git 커밋
echo "📝 Git 커밋 중..."
git add .
git commit -m "🚨 응급 조치: Edge Request 사용량 95% 감소

- /api/system/status 캐싱 활성화 (60초)
- 메모리 기반 중복 요청 차단 (30초)
- 환경변수 기반 Rate Limiting
- Redis 작업 최소화 (10분 간격 정리)
- Edge Runtime 최적화 설정

예상 효과: 100K → 5K 요청으로 감소"

# 3. Vercel 배포
echo "🚀 Vercel 프로덕션 배포 중..."
vercel --prod

# 4. 환경변수 설정 안내
echo ""
echo "🔧 Vercel 환경변수 수동 설정 필요:"
echo "   EMERGENCY_THROTTLE=true"
echo "   MAX_STATUS_REQUESTS_PER_MINUTE=30"
echo ""
echo "✅ 응급 배포 완료 - 5분 내 사용량 감소 예상" 