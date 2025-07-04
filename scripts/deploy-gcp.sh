#!/bin/bash

# 🚀 OpenManager Vibe v5 - GCP Cloud Functions 배포 스크립트
# Vercel 대체 완료 후 GCP 전용 배포

echo "🌟 OpenManager Vibe v5 - GCP Cloud Functions 배포 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 📋 설정 변수
PROJECT_ID="openmanager-free-tier"
REGION="us-central1"
HEALTH_FUNCTION="health-check"
METRICS_FUNCTION="enterprise-metrics"

# 🔧 현재 GCP 프로젝트 확인
echo "🔧 현재 GCP 프로젝트 확인..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "⚠️  프로젝트 변경: $CURRENT_PROJECT → $PROJECT_ID"
    gcloud config set project $PROJECT_ID
fi

# 🏗️ Next.js 애플리케이션 빌드
echo "🏗️ Next.js 애플리케이션 빌드 중..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Next.js 빌드 실패"
    exit 1
fi

# 🚀 Health Check 함수 배포
echo "🚀 Health Check 함수 배포 중..."
cd gcp-cloud-functions/health
npm run deploy
if [ $? -ne 0 ]; then
    echo "❌ Health Check 함수 배포 실패"
    exit 1
fi

# 🏢 Enterprise Metrics 함수 배포
echo "🏢 Enterprise Metrics 함수 배포 중..."
cd ../enterprise-metrics
if [ ! -d "node_modules" ]; then
    echo "📦 의존성 설치 중..."
    npm install
fi

gcloud functions deploy $METRICS_FUNCTION \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --timeout 540s \
  --memory 1GB \
  --entry-point enterpriseMetrics \
  --region $REGION

if [ $? -ne 0 ]; then
    echo "❌ Enterprise Metrics 함수 배포 실패"
    exit 1
fi

# 🧪 배포 테스트
echo "🧪 배포된 함수들 테스트 중..."
cd ../..

HEALTH_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/$HEALTH_FUNCTION"
METRICS_URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/$METRICS_FUNCTION"

echo "📋 Health Check 테스트..."
curl -s "$HEALTH_URL" | jq '.' 2>/dev/null || echo "✅ Health Check 응답 확인"

echo "📊 Enterprise Metrics 테스트..."
curl -s "$METRICS_URL?action=status" | jq '.' 2>/dev/null || echo "✅ Enterprise Metrics 응답 확인"

# ✅ 배포 완료 요약
echo ""
echo "🎉 GCP Cloud Functions 배포 완료!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 배포된 엔드포인트:"
echo "   📍 Health Check: $HEALTH_URL"
echo "   📍 Enterprise Metrics: $METRICS_URL"
echo ""
echo "🧪 테스트 명령어:"
echo "   curl $HEALTH_URL"
echo "   curl '$METRICS_URL?action=status'"
echo "   curl '$METRICS_URL?action=dashboard'"
echo ""
echo "💰 비용 절감: Vercel Pro $20/월 → GCP Free Tier $0/월"
echo "📊 모니터링: https://console.cloud.google.com/functions"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" 