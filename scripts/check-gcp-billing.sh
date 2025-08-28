#!/bin/bash

# GCP 청구 활성화 확인 스크립트
# 청구 활성화 후 이 스크립트 실행으로 확인

echo "🔍 GCP 청구 계정 상태 확인..."

# 1. 인증 확인
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo "❌ GCP 인증 실패 - gcloud auth login 필요"
    exit 1
fi

ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")
PROJECT=$(gcloud config get-value project)

echo "✅ 인증됨: $ACCOUNT"
echo "📋 프로젝트: $PROJECT"

# 2. 청구 활성화 테스트
echo ""
echo "🔄 청구 계정 활성화 상태 테스트 중..."

if gcloud compute zones list --limit=1 > /dev/null 2>&1; then
    echo "✅ 청구 계정 활성화 완료!"
    echo ""
    echo "🎯 다음 단계:"
    echo "   1. Compute Engine API 활성화:"
    echo "      https://console.cloud.google.com/apis/library/compute.googleapis.com?project=$PROJECT"
    echo ""
    echo "   2. VM 배포 실행:"
    echo "      ./scripts/deploy-to-gcp-vm.sh"
    echo ""
    echo "💰 무료 티어 크레딧 정보:"
    gcloud billing accounts list 2>/dev/null || echo "   청구 계정 정보 로딩 중..."
else
    echo "❌ 청구 계정 아직 미활성화"
    echo ""
    echo "🔗 청구 활성화 링크:"
    echo "   https://console.developers.google.com/billing/enable?project=$PROJECT"
    echo ""
    echo "⏱️ 청구 활성화 후 5-10분 대기 후 재시도하세요."
fi