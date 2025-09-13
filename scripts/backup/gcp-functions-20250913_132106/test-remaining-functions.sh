#!/bin/bash
# 정리 후 함수 동작 테스트 스크립트

PROJECT_ID="openmanager-free-tier"
REGION="us-central1"

echo "🧪 남은 GCP Functions 동작 테스트..."

# 테스트할 함수들
FUNCTIONS=("enhanced-korean-nlp" "ml-analytics-engine" "unified-ai-processor")

for func in "${FUNCTIONS[@]}"; do
    echo ""
    echo "🔍 $func 테스트 중..."
    
    # 함수 상태 확인
    if gcloud functions describe "$func" --region="$REGION" --project="$PROJECT_ID" --format="value(status)" 2>/dev/null | grep -q "ACTIVE"; then
        echo "✅ $func: ACTIVE 상태 확인"
    else
        echo "❌ $func: 비정상 상태"
    fi
done

echo ""
echo "📊 최종 함수 목록:"
gcloud functions list --project=$PROJECT_ID --format="table(name,status,region,runtime)"
