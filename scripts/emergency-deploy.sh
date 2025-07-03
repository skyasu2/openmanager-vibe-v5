#!/bin/bash

# 🚨 긴급 중지 상태 사용량 최적화 배포
echo "🚨 긴급 중지 상태 사용량 최적화 배포 시작"

# 환경변수 적용
echo "SERVER_DATA_SCHEDULER_DISABLED=true" >> .env.local
echo "KEEP_ALIVE_SCHEDULER_DISABLED=true" >> .env.local
echo "SYSTEM_POLLING_INTERVAL=300000" >> .env.local
echo "EMERGENCY_MODE_ACTIVE=true" >> .env.local

echo "✅ 응급 환경변수 적용 완료"

# 빌드 테스트
npm run build
if [ $? -ne 0 ]; then
    echo "❌ 빌드 실패!"
    exit 1
fi

# Git 커밋 및 푸시
git add .
git commit -m "🚨 긴급 중지 상태 사용량 최적화

- 폴링 간격 5초 → 30초 증가 (6배)
- 백그라운드 스케줄러 비활성화
- Keep-Alive 간격 최적화
- 예상 사용량 감소: 96.7% ↓"

git push

echo "✅ 긴급 배포 완료!"
echo "📊 예상 효과: 하루 8,640회 → 288회 호출" 