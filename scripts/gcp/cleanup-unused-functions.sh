#!/bin/bash

# 🧹 GCP Cloud Functions 정리 스크립트
# 사용하지 않는 Cloud Functions를 안전하게 제거

set -e

PROJECT_ID="openmanager-free-tier"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"

echo "🌐 GCP Cloud Functions 정리 시작..."
echo "📋 프로젝트: $PROJECT_ID"
echo "⚠️ 이 작업은 되돌릴 수 없습니다!"

# 현재 배포된 함수 목록 확인
echo ""
echo "📊 현재 배포된 Cloud Functions:"
gcloud functions list --project=$PROJECT_ID --format="table(name,status,trigger.httpsTrigger.url,runtime)" 2>/dev/null || {
    echo "❌ gcloud CLI 설정을 확인하세요."
    exit 1
}

echo ""
read -p "🤔 정말로 불필요한 함수들을 제거하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 작업이 취소되었습니다."
    exit 1
fi

# 제거할 함수 목록 (Mock으로 대체됨)
FUNCTIONS_TO_DELETE=(
    "enhanced-korean-nlp:asia-northeast3"
    "enhanced-korean-nlp:us-central1"
    "ml-analytics-engine:asia-northeast3"
    "ml-analytics-engine:us-central1"
    "unified-ai-processor:asia-northeast3"
    "unified-ai-processor:us-central1"
)

# 조건부 제거 함수 (사용자 확인 필요)
CONDITIONAL_FUNCTIONS=(
    "enterprise-metrics:us-central1"
)

# 유지할 함수 (실제 사용 중)
KEEP_FUNCTIONS=(
    "health-check:us-central1"
)

echo ""
echo "🗑️ 제거할 함수들:"
for func in "${FUNCTIONS_TO_DELETE[@]}"; do
    IFS=':' read -r name region <<< "$func"
    echo "  - $name ($region)"
done

echo ""
echo "⚠️ 검토 필요한 함수들:"
for func in "${CONDITIONAL_FUNCTIONS[@]}"; do
    IFS=':' read -r name region <<< "$func"
    echo "  - $name ($region)"
done

echo ""
echo "✅ 유지할 함수들:"
for func in "${KEEP_FUNCTIONS[@]}"; do
    IFS=':' read -r name region <<< "$func"
    echo "  - $name ($region)"
done

echo ""
echo "🚀 제거 작업 시작..."

# 확실히 제거할 함수들 삭제
for func in "${FUNCTIONS_TO_DELETE[@]}"; do
    IFS=':' read -r name region <<< "$func"
    
    echo ""
    echo "🗑️ $name ($region) 제거 중..."
    
    if gcloud functions describe "$name" --region="$region" --project="$PROJECT_ID" &>/dev/null; then
        gcloud functions delete "$name" \
            --region="$region" \
            --project="$PROJECT_ID" \
            --quiet && {
            echo "✅ $name ($region) 제거 완료"
        } || {
            echo "❌ $name ($region) 제거 실패"
        }
    else
        echo "⚠️ $name ($region) 함수가 존재하지 않습니다"
    fi
done

# 조건부 함수들에 대해 개별 확인
echo ""
echo "🤔 조건부 제거 함수 검토:"
for func in "${CONDITIONAL_FUNCTIONS[@]}"; do
    IFS=':' read -r name region <<< "$func"
    
    echo ""
    echo "📊 $name ($region) 함수 정보:"
    if gcloud functions describe "$name" --region="$region" --project="$PROJECT_ID" &>/dev/null; then
        # 최근 사용량 확인
        echo "📈 최근 사용량 확인 중..."
        gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=$name" \
            --project="$PROJECT_ID" \
            --limit=5 \
            --format="value(timestamp)" 2>/dev/null | head -3 || {
            echo "📊 사용량 정보를 가져올 수 없습니다"
        }
        
        echo ""
        read -p "🗑️ $name ($region)을 제거하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            gcloud functions delete "$name" \
                --region="$region" \
                --project="$PROJECT_ID" \
                --quiet && {
                echo "✅ $name ($region) 제거 완료"
            } || {
                echo "❌ $name ($region) 제거 실패"
            }
        else
            echo "⚠️ $name ($region) 유지됨"
        fi
    else
        echo "⚠️ $name ($region) 함수가 존재하지 않습니다"
    fi
done

echo ""
echo "📊 정리 후 현재 상태:"
gcloud functions list --project=$PROJECT_ID --format="table(name,status,trigger.httpsTrigger.url,runtime)" 2>/dev/null

echo ""
echo "💰 비용 절약 예상 효과:"
echo "  - Cloud Functions 호출 비용: $15-30/월 → $1-2/월"
echo "  - 리소스 관리 부담: 8개 함수 → 1-2개 함수"
echo "  - 복잡도 감소: Circuit Breaker + Fallback → 직접 호출"

echo ""
echo "📋 다음 단계:"
echo "  1. 코드에서 GCP Functions 호출 제거"
echo "  2. Mock 시스템으로 완전 전환"
echo "  3. Google AI API 직접 활용 검토"
echo "  4. API 라우트 단순화"

echo ""
echo "🎉 GCP Cloud Functions 정리 완료!"
echo "📚 상세 보고서: docs/gcp-analysis-report.md"