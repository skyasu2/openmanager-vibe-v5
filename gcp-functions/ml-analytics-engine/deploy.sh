#!/bin/bash

# 🚀 ML Analytics Engine Function 배포 스크립트
# GCP Functions 최적화 설정으로 배포

echo "🚀 ML Analytics Engine Function 배포 시작..."

# 설정 변수
FUNCTION_NAME="ml-analytics-engine"
PROJECT_ID="openmanager-free-tier"
REGION="us-central1"
RUNTIME="python311"
MEMORY="1GB"
TIMEOUT="300s"
MAX_INSTANCES="10"

# 현재 디렉토리 확인
if [ ! -f "main.py" ] || [ ! -f "requirements.txt" ]; then
    echo "❌ main.py 또는 requirements.txt 파일이 없습니다."
    echo "현재 위치: $(pwd)"
    exit 1
fi

echo "📦 배포 설정:"
echo "  함수명: $FUNCTION_NAME"
echo "  프로젝트: $PROJECT_ID"
echo "  리전: $REGION"
echo "  런타임: $RUNTIME"
echo "  메모리: $MEMORY"
echo "  타임아웃: $TIMEOUT"
echo "  최대 인스턴스: $MAX_INSTANCES"
echo ""

# gcloud 설정 확인
echo "🔍 gcloud 설정 확인..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ gcloud 인증이 필요합니다:"
    echo "  gcloud auth login"
    exit 1
fi

if ! gcloud config get-value project 2>/dev/null | grep -q "$PROJECT_ID"; then
    echo "⚙️ 프로젝트 설정 중..."
    gcloud config set project $PROJECT_ID
fi

# Cloud Functions API 활성화 확인
echo "🔧 필요한 API 활성화 확인..."
gcloud services enable cloudfunctions.googleapis.com --quiet
gcloud services enable cloudbuild.googleapis.com --quiet

# 함수 배포
echo "🚀 GCP Functions 배포 시작..."
gcloud functions deploy $FUNCTION_NAME \
    --runtime=$RUNTIME \
    --trigger-http \
    --entry-point=ml_analytics_engine \
    --memory=$MEMORY \
    --timeout=$TIMEOUT \
    --max-instances=$MAX_INSTANCES \
    --region=$REGION \
    --allow-unauthenticated \
    --set-env-vars="GCP_PROJECT=$PROJECT_ID,ENVIRONMENT=production" \
    --source=. \
    --no-gen2 \
    --quiet

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 배포 성공!"
    echo ""
    
    # 함수 URL 가져오기
    FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME \
        --region=$REGION \
        --format='value(httpsTrigger.url)')
    
    echo "🌐 함수 URL: $FUNCTION_URL"
    echo ""
    
    # 간단한 테스트
    echo "🧪 배포 테스트 중..."
    curl -X POST "$FUNCTION_URL" \
        -H "Content-Type: application/json" \
        -d '{"query": "웹서버 CPU 사용률 확인"}' \
        --silent --show-error | head -3
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ 테스트 성공! 함수가 정상적으로 작동합니다."
    else
        echo ""
        echo "⚠️ 테스트 실패. 함수 로그를 확인해주세요:"
        echo "  gcloud functions logs read $FUNCTION_NAME --region=$REGION"
    fi
    
    echo ""
    echo "📊 함수 정보:"
    gcloud functions describe $FUNCTION_NAME --region=$REGION \
        --format='table(name,status,httpsTrigger.url,runtime,availableMemoryMb,timeout)'
        
else
    echo ""
    echo "❌ 배포 실패!"
    echo "로그를 확인해주세요:"
    echo "  gcloud functions logs read $FUNCTION_NAME --region=$REGION"
    exit 1
fi

echo ""
echo "🎯 다음 단계:"
echo "1. Vercel API Gateway 연동 설정"
echo "2. 성능 테스트 실행"
echo "3. 추가 Functions 배포"