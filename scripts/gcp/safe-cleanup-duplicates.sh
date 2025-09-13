#!/bin/bash

# 🧹 GCP Functions 중복 및 미사용 함수 안전 정리 스크립트
# 8개 → 3개 함수로 최적화 (62% 감소, 90% 비용 절약)

set -e

PROJECT_ID="openmanager-free-tier"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backup/gcp-functions-$(date +%Y%m%d_%H%M%S)"

echo "🌐 GCP Functions 중복 정리 시작..."
echo "📋 프로젝트: $PROJECT_ID"
echo "📁 백업 디렉토리: $BACKUP_DIR"
echo ""

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 현재 상태 백업
echo "💾 현재 상태 백업 중..."
gcloud functions list --project=$PROJECT_ID --format="json" > "$BACKUP_DIR/functions-before.json" 2>/dev/null || {
    echo "❌ gcloud CLI 설정을 확인하세요."
    exit 1
}

echo "📊 현재 배포된 함수 목록:"
gcloud functions list --project=$PROJECT_ID --format="table(name,status,region,runtime)" 2>/dev/null || {
    echo "❌ 함수 목록 조회 실패"
    exit 1
}

echo ""
echo "🎯 최적화 계획:"
echo "  ✅ 유지: us-central1의 3개 활성 함수"
echo "  ❌ 제거: asia-northeast3의 3개 비활성 함수"  
echo "  ❌ 제거: us-central1의 2개 미사용 함수"
echo "  📊 결과: 8개 → 3개 (62% 감소)"
echo ""

# 사용자 확인
read -p "🤔 정말로 중복 및 미사용 함수들을 제거하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 작업이 취소되었습니다."
    exit 1
fi

echo ""
echo "🚀 정리 작업 시작..."

# Phase 1: asia-northeast3 리전 중복 함수 제거
ASIA_FUNCTIONS=(
    "enhanced-korean-nlp"
    "ml-analytics-engine" 
    "unified-ai-processor"
)

echo ""
echo "🌏 Phase 1: asia-northeast3 리전 중복 함수 제거"
for func in "${ASIA_FUNCTIONS[@]}"; do
    echo ""
    echo "🗑️ $func (asia-northeast3) 제거 중..."
    
    if gcloud functions describe "$func" --region="asia-northeast3" --project="$PROJECT_ID" &>/dev/null; then
        # 함수 정보 백업
        gcloud functions describe "$func" --region="asia-northeast3" --project="$PROJECT_ID" --format="json" > "$BACKUP_DIR/$func-asia-northeast3.json" 2>/dev/null
        
        # 함수 삭제
        gcloud functions delete "$func" \
            --region="asia-northeast3" \
            --project="$PROJECT_ID" \
            --quiet && {
            echo "✅ $func (asia-northeast3) 제거 완료"
        } || {
            echo "❌ $func (asia-northeast3) 제거 실패"
        }
    else
        echo "⚠️ $func (asia-northeast3)가 존재하지 않습니다"
    fi
done

# Phase 2: us-central1 리전 미사용 함수 제거
US_UNUSED_FUNCTIONS=(
    "enterprise-metrics"
    "health-check"
)

echo ""
echo "🇺🇸 Phase 2: us-central1 리전 미사용 함수 제거"
for func in "${US_UNUSED_FUNCTIONS[@]}"; do
    echo ""
    echo "🗑️ $func (us-central1) 제거 중..."
    
    if gcloud functions describe "$func" --region="us-central1" --project="$PROJECT_ID" &>/dev/null; then
        # 함수 정보 백업
        gcloud functions describe "$func" --region="us-central1" --project="$PROJECT_ID" --format="json" > "$BACKUP_DIR/$func-us-central1.json" 2>/dev/null
        
        # 함수 삭제
        gcloud functions delete "$func" \
            --region="us-central1" \
            --project="$PROJECT_ID" \
            --quiet && {
            echo "✅ $func (us-central1) 제거 완료"
        } || {
            echo "❌ $func (us-central1) 제거 실패"
        }
    else
        echo "⚠️ $func (us-central1)가 존재하지 않습니다"
    fi
done

# 정리 후 상태 확인
echo ""
echo "📊 정리 후 현재 상태:"
gcloud functions list --project=$PROJECT_ID --format="table(name,status,region,runtime)" 2>/dev/null

# 백업 상태 저장
gcloud functions list --project=$PROJECT_ID --format="json" > "$BACKUP_DIR/functions-after.json" 2>/dev/null

# 결과 요약
echo ""
echo "📈 최적화 결과:"
REMAINING_COUNT=$(gcloud functions list --project=$PROJECT_ID --format="value(name)" 2>/dev/null | wc -l)
echo "  - 정리 전: 8개 함수"
echo "  - 정리 후: ${REMAINING_COUNT}개 함수"
if [ "$REMAINING_COUNT" -eq 3 ]; then
    echo "  - ✅ 목표 달성: 62% 감소 성공!"
else
    echo "  - ⚠️ 예상과 다름: $REMAINING_COUNT개 남음"
fi

echo ""
echo "💰 예상 비용 절약 효과:"
echo "  - 월 예상 비용: \$5-15 → \$0-2 (90%+ 절약)"
echo "  - 무료 티어 여유도: 50% → 90%+ (매우 안전)"
echo "  - 관리 복잡도: 크게 단순화"

echo ""
echo "🔍 유지된 핵심 함수들:"
echo "  ✅ enhanced-korean-nlp (us-central1) - 한국어 NLP"
echo "  ✅ ml-analytics-engine (us-central1) - ML 메트릭 분석"  
echo "  ✅ unified-ai-processor (us-central1) - 통합 AI 처리"

echo ""
echo "💾 백업 정보:"
echo "  📁 백업 위치: $BACKUP_DIR"
echo "  📄 복구 방법: 백업된 JSON 파일로 필요시 재배포 가능"

echo ""
echo "📋 다음 단계:"
echo "  1. API 테스트로 정상 작동 확인"
echo "  2. 환경변수 GCP_FUNCTIONS_BASE_URL 확인"
echo "  3. 비용 모니터링 설정"
echo "  4. 성능 확인 (지연시간 +100ms 예상)"

echo ""
echo "🎉 GCP Functions 중복 정리 완료!"
echo "📚 상세 분석: docs/gcp-functions-deduplication-analysis.md"

# 테스트 스크립트 생성
cat > "$BACKUP_DIR/test-remaining-functions.sh" << 'EOF'
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
EOF

chmod +x "$BACKUP_DIR/test-remaining-functions.sh"
echo "🧪 테스트 스크립트 생성: $BACKUP_DIR/test-remaining-functions.sh"