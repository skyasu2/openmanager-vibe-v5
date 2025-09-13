#!/bin/bash

# 🇰🇷 GCP Functions 한국 리전(asia-northeast3) 이전 스크립트
# 44% 성능 향상, 비용 영향 없음 (무료 티어 2% 사용)

set -e

PROJECT_ID="openmanager-free-tier"
OLD_REGION="us-central1"
NEW_REGION="asia-northeast3"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
BACKUP_DIR="$SCRIPT_DIR/../backup/korea-migration-$(date +%Y%m%d_%H%M%S)"

echo "🇰🇷 GCP Functions 한국 리전 이전 시작..."
echo "📋 프로젝트: $PROJECT_ID"
echo "🌍 $OLD_REGION → $NEW_REGION"
echo "📁 백업 디렉토리: $BACKUP_DIR"
echo ""

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 현재 상태 백업
echo "💾 현재 상태 백업 중..."
gcloud functions list --project=$PROJECT_ID --format="json" > "$BACKUP_DIR/functions-before-korea.json" 2>/dev/null || {
    echo "❌ gcloud CLI 설정을 확인하세요."
    exit 1
}

echo "📊 현재 함수 목록 ($OLD_REGION):"
gcloud functions list --project=$PROJECT_ID --filter="region:$OLD_REGION" --format="table(name,status,runtime,trigger.httpsTrigger.url)" 2>/dev/null

echo ""
echo "🎯 이전 계획:"
echo "  ✅ asia-northeast3에 3개 함수 재배포"
echo "  ✅ 환경변수 URL 업데이트"  
echo "  ✅ us-central1 기존 함수 정리"
echo "  📊 예상 효과: 44% 응답속도 향상 (1,800ms → 1,005ms)"
echo ""

# 사용자 확인
read -p "🤔 한국 리전으로 이전하시겠습니까? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 작업이 취소되었습니다."
    exit 1
fi

echo ""
echo "🚀 한국 리전 이전 시작..."

# 이전할 함수들
FUNCTIONS=(
    "enhanced-korean-nlp"
    "ml-analytics-engine" 
    "unified-ai-processor"
)

# Phase 1: asia-northeast3에 함수 배포
echo ""
echo "🇰🇷 Phase 1: asia-northeast3 리전에 함수 배포"

for func in "${FUNCTIONS[@]}"; do
    echo ""
    echo "🚀 $func → asia-northeast3 배포 중..."
    
    # 기존 함수 정보 가져오기
    gcloud functions describe "$func" --region="$OLD_REGION" --project="$PROJECT_ID" --format="json" > "$BACKUP_DIR/$func-$OLD_REGION.json" 2>/dev/null || {
        echo "❌ $func 함수를 찾을 수 없습니다"
        continue
    }
    
    # 소스 코드 위치 확인 (실제 배포 시 필요)
    echo "⚠️ $func 함수 재배포를 위해 소스 코드가 필요합니다"
    echo "   실제 배포는 다음 명령어를 수동으로 실행하세요:"
    echo ""
    echo "   gcloud functions deploy $func \\"
    echo "     --gen2 \\"
    echo "     --runtime=python311 \\"
    echo "     --region=$NEW_REGION \\"
    echo "     --memory=256Mi \\"
    echo "     --timeout=30s \\"
    echo "     --trigger=https \\"
    echo "     --source=./cloud-functions/$func \\"
    echo "     --project=$PROJECT_ID"
    echo ""
done

# Phase 2: 환경변수 업데이트 안내
echo ""
echo "🔧 Phase 2: 환경변수 업데이트 필요"
echo ""
echo "📝 .env.local 파일에서 다음 변경이 필요합니다:"
echo ""
echo "# 기존 (us-central1)"
echo "NEXT_PUBLIC_GCP_FUNCTIONS_URL=https://us-central1-openmanager-free-tier.cloudfunctions.net"
echo ""
echo "# 새로운 (asia-northeast3)"
echo "NEXT_PUBLIC_GCP_FUNCTIONS_URL=https://asia-northeast3-openmanager-free-tier.cloudfunctions.net"
echo ""

# Phase 3: 기존 함수 제거 안내
echo ""
echo "🗑️ Phase 3: 기존 us-central1 함수 제거 (한국 리전 배포 완료 후)"
echo ""
echo "한국 리전 배포 및 테스트 완료 후 다음 명령어로 기존 함수를 제거하세요:"
echo ""
for func in "${FUNCTIONS[@]}"; do
    echo "gcloud functions delete $func --region=$OLD_REGION --project=$PROJECT_ID --quiet"
done

# Phase 4: 테스트 안내
echo ""
echo "🧪 Phase 4: 테스트 및 검증"
echo ""
echo "한국 리전 배포 후 다음 테스트를 수행하세요:"
echo ""
echo "# API 응답 시간 테스트"
echo "curl -X POST https://asia-northeast3-openmanager-free-tier.cloudfunctions.net/enhanced-korean-nlp \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"query\": \"서울 리전 테스트\", \"context\": {\"test\": true}}'"
echo ""

# 결과 요약
echo ""
echo "📈 예상 성과:"
echo "  - 한국어 NLP 응답: 1,800ms → 1,005ms (44% 단축)"
echo "  - ML Analytics 응답: 1,850ms → 1,010ms (45% 단축)"
echo "  - 월 비용: $0 → $0 (무료 티어 내 동일)"
echo "  - 포트폴리오 가치: 실제 운영 환경 최적화 시연"
echo ""

echo "💾 백업 정보:"
echo "  📁 백업 위치: $BACKUP_DIR"
echo "  📄 복구 방법: 백업된 JSON 파일 참조"
echo ""

echo "📋 다음 단계:"
echo "  1. 소스 코드 준비 후 수동 배포"
echo "  2. 환경변수 NEXT_PUBLIC_GCP_FUNCTIONS_URL 업데이트"
echo "  3. API 테스트로 정상 작동 확인"
echo "  4. 기존 us-central1 함수 제거"
echo "  5. 성능 측정 (44% 개선 확인)"
echo ""

echo "🎉 한국 리전 이전 준비 완료!"
echo "📚 상세 분석: docs/gcp-korea-region-migration-analysis.md"

# 환경변수 업데이트 스크립트 생성
cat > "$BACKUP_DIR/update-env-vars.sh" << 'EOF'
#!/bin/bash
# 환경변수 업데이트 스크립트

ENV_FILE=".env.local"

echo "🔧 환경변수 업데이트 중..."

if [ -f "$ENV_FILE" ]; then
    # 백업 생성
    cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
    
    # URL 업데이트
    sed -i 's/us-central1-openmanager-free-tier/asia-northeast3-openmanager-free-tier/g' "$ENV_FILE"
    
    echo "✅ 환경변수 업데이트 완료"
    echo "📁 백업: $ENV_FILE.backup.*"
else
    echo "❌ .env.local 파일을 찾을 수 없습니다"
fi
EOF

chmod +x "$BACKUP_DIR/update-env-vars.sh"
echo "🔧 환경변수 업데이트 스크립트: $BACKUP_DIR/update-env-vars.sh"