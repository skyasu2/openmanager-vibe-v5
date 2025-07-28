#!/bin/bash

# 🚀 OpenManager VIBE v5 전체 최적화 스크립트
# 작성일: 2025-07-28

set -e

echo "🎯 OpenManager VIBE v5 전체 최적화 시작"
echo "================================"

# 1. GCP Functions 프로젝트 ID 수정 및 재배포
echo "1️⃣ GCP Functions 재배포 중..."
cd gcp-functions/deployment
sed -i 's/openmanager-ai/openmanager-free-tier/g' deploy-all.sh
./deploy-all.sh

# 2. 무료티어 최적화
echo "2️⃣ 무료티어 최적화 중..."
cd ../..
# API 호출 간격 5초 → 30초
find src -name "*.ts" -o -name "*.tsx" | xargs sed -i 's/refetchInterval: 5000/refetchInterval: 30000/g'
# 캐싱 TTL 5분 → 30분
find src -name "*.ts" | xargs sed -i 's/ttl: 300/ttl: 1800/g'

# 3. 방화벽 규칙 추가
echo "3️⃣ 방화벽 규칙 설정 중..."
gcloud compute firewall-rules create allow-mcp-server \
  --allow tcp:10000 \
  --source-ranges 0.0.0.0/0 \
  --target-tags mcp-server \
  --project openmanager-free-tier \
  --quiet || echo "방화벽 규칙 이미 존재"

# 4. 환경변수 업데이트
echo "4️⃣ 환경변수 확인 중..."
if ! grep -q "GCP_PROJECT_ID=openmanager-free-tier" .env.local; then
  echo "GCP_PROJECT_ID=openmanager-free-tier" >> .env.local
fi

# 5. 빌드 및 배포
echo "5️⃣ Vercel 재배포 중..."
npm run build
npm run deploy

echo "================================"
echo "✅ 최적화 완료!"
echo ""
echo "📊 다음 단계:"
echo "1. GCP Functions 상태 확인: gcloud functions list"
echo "2. Vercel 배포 확인: npx vercel ls"
echo "3. 모니터링 대시보드 확인: http://localhost:3000/admin"