#!/bin/bash

# 🚀 Google Cloud Functions 엔터프라이즈 메트릭 배포 스크립트
# OpenManager Vibe v5 - Vercel 대체

echo "🏢 엔터프라이즈 메트릭 Google Cloud Functions 배포 시작..."

# 📋 설정 변수
PROJECT_ID="openmanager-vibe-v5"
FUNCTION_NAME="enterpriseMetrics"
REGION="us-central1"
RUNTIME="nodejs20"
MEMORY="1GB"
TIMEOUT="540s"

# 🔧 프로젝트 설정
echo "🔧 GCP 프로젝트 설정: $PROJECT_ID"
gcloud config set project $PROJECT_ID

# 🌟 Firebase Functions 배포
echo "🌟 Firebase Functions 배포 시작..."
gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --runtime=$RUNTIME \
  --region=$REGION \
  --source=. \
  --entry-point=$FUNCTION_NAME \
  --trigger-http \
  --allow-unauthenticated \
  --memory=$MEMORY \
  --timeout=$TIMEOUT \
  --set-env-vars="NODE_ENV=production" \
  --max-instances=10 \
  --min-instances=0

# ✅ 배포 확인
if [ $? -eq 0 ]; then
    echo "✅ 배포 성공!"
    echo "🌐 엔드포인트: https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME"
    echo "🎯 테스트 URL: https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME?action=status"
    
    # 📊 배포 상태 확인
    echo "📊 배포 상태 확인 중..."
    gcloud functions describe $FUNCTION_NAME --region=$REGION
    
    # 🧪 간단한 테스트
    echo "🧪 엔드포인트 테스트 중..."
    curl -s "https://$REGION-$PROJECT_ID.cloudfunctions.net/$FUNCTION_NAME?action=status" | jq '.'
    
else
    echo "❌ 배포 실패"
    exit 1
fi

echo "🎉 엔터프라이즈 메트릭 Google Cloud Functions 배포 완료!" 