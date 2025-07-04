#!/bin/bash

# 🏢 GCP Enterprise Metrics Functions 배포 스크립트
# 25개 핵심 메트릭 생성기 배포 자동화

set -e

echo "🚀 GCP Enterprise Metrics Functions 배포 시작..."

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ package.json이 없습니다. enterprise-metrics 폴더에서 실행하세요."
    exit 1
fi

# 의존성 설치
echo "📦 의존성 설치 중..."
npm ci

# 함수 배포
echo "☁️ GCP Functions 배포 중..."
gcloud functions deploy enterprise-metrics \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --memory 256MB \
  --timeout 30s \
  --region us-central1 \
  --source . \
  --entry-point enterpriseMetrics \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --quiet

# 배포 완료 확인
if [ $? -eq 0 ]; then
    echo "✅ 배포 완료!"
    echo "🌐 함수 URL: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/enterprise-metrics"
    echo "🔗 테스트 URL: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/enterprise-metrics?action=status"
    echo ""
    echo "📋 사용 가능한 액션:"
    echo "  - current: 현재 모든 서버 메트릭"
    echo "  - dashboard: 대시보드 요약"
    echo "  - status: 생성기 상태"
    echo ""
    echo "🔍 함수 로그 확인:"
    echo "  gcloud functions logs read enterprise-metrics --gen2 --region us-central1"
else
    echo "❌ 배포 실패"
    exit 1
fi 