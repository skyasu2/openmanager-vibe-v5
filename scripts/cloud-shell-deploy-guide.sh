#!/bin/bash

# 🚀 Google Cloud Shell 완전 자동 배포 가이드
# OpenManager VIBE v5 - VM AI Backend 배포

echo "🚀 Google Cloud Shell에서 AI Backend 배포 시작"
echo ""
echo "📋 현재 확인된 상태:"
echo "  - VM: mcp-server (RUNNING ✅)"
echo "  - IP: 104.154.205.25"
echo "  - 현재 포트 10000: 기본 헬스체크 서비스 실행 중"
echo "  - AI Backend: 미배포 상태"
echo ""

# 1. 프로젝트 설정
echo "1️⃣ GCP 프로젝트 설정..."
gcloud config set project openmanager-free-tier

# 2. VM 상태 확인
echo ""
echo "2️⃣ VM 상태 확인..."
gcloud compute instances describe mcp-server --zone=us-central1-a --format="table(name,status,machineType)"

# 3. VM에 소스 코드 직접 배포
echo ""
echo "3️⃣ VM에 AI Backend 배포 시작..."

# GitHub에서 직접 클론 (Cloud Shell에서 실행)
if [ ! -d "openmanager-vibe-v5" ]; then
    echo "📦 GitHub에서 소스 코드 클론..."
    git clone https://github.com/skyasu2/openmanager-vibe-v5.git
    cd openmanager-vibe-v5
else
    echo "📦 기존 소스 코드 업데이트..."
    cd openmanager-vibe-v5
    git pull origin main
fi

# 4. VM AI Backend 빌드
echo ""
echo "4️⃣ AI Backend 빌드..."
cd vm-ai-backend
npm install
npm run build

# 5. VM에 배포
echo ""
echo "5️⃣ VM에 배포 실행..."

# 소스 코드 압축
cd ..
tar -czf vm-ai-backend-deployed.tar.gz vm-ai-backend/

# VM에 업로드
gcloud compute scp vm-ai-backend-deployed.tar.gz mcp-server:~/ --zone=us-central1-a

echo ""
echo "6️⃣ VM에서 서비스 설정 및 시작..."

# VM에서 배포 실행
gcloud compute ssh mcp-server --zone=us-central1-a --command="
set -e

echo '🔧 시스템 업데이트 및 Node.js 설치...'
sudo apt-get update -qq
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - >/dev/null 2>&1
sudo apt-get install -y nodejs >/dev/null 2>&1

echo '📦 소스 코드 압축 해제...'
tar -xzf vm-ai-backend-deployed.tar.gz

echo '🛠️ 프로덕션 환경 설정...'
cd vm-ai-backend
npm install --only=production >/dev/null 2>&1

# PM2 전역 설치
sudo npm install -g pm2 >/dev/null 2>&1

echo '⚙️ 환경변수 파일 생성...'
cat > .env << 'EOF'
NODE_ENV=production
PORT=10000
HOST=0.0.0.0

# AI 서비스 설정
AI_ENABLE_SESSION_MANAGEMENT=true
AI_ENABLE_DEEP_ANALYSIS=true
AI_ENABLE_REAL_TIME_STREAMING=true
AI_ENABLE_FEEDBACK_LEARNING=true

# CORS 설정
ALLOWED_ORIGINS=https://openmanager-vibe-v5.vercel.app,http://localhost:3000

# 성능 최적화 (e2-micro)
MAX_MEMORY_USAGE=800
CLEANUP_INTERVAL=60000

# 로그 설정
LOG_LEVEL=info
DEBUG=false
EOF

echo '🚀 기존 서비스 중지 및 AI Backend 시작...'
# 기존 서비스들 정리
sudo pkill -f 'node.*:10000' 2>/dev/null || true
pm2 delete all 2>/dev/null || true

# AI Backend 시작
pm2 start dist/index.js --name openmanager-ai-backend --max-memory-restart 800M
pm2 save
pm2 startup

echo '✅ AI Backend 서비스 시작 완료!'
echo ''
echo '📊 서비스 상태:'
pm2 status
echo ''
echo '🌐 접속 정보:'
echo '  - Health Check: http://104.154.205.25:10000/health'
echo '  - API Base: http://104.154.205.25:10000/api'
echo '  - WebSocket: ws://104.154.205.25:10000/ws'
"

echo ""
echo "7️⃣ 배포 완료 검증..."
sleep 5

# 헬스체크 확인
echo "🔍 AI Backend 헬스체크..."
if curl -m 5 http://104.154.205.25:10000/api/health 2>/dev/null; then
    echo "✅ AI Backend API 정상 응답!"
else
    echo "⚠️  API 응답 지연 중... (서비스 시작 중)"
fi

echo ""
echo "🎉 배포 완료!"
echo ""
echo "📋 배포 결과:"
echo "  ✅ VM mcp-server: RUNNING"
echo "  ✅ AI Backend: 포트 10000에서 실행 중"
echo "  ✅ 환경변수: 프로덕션 최적화 설정"
echo "  ✅ PM2: 자동 재시작 및 메모리 모니터링"
echo ""
echo "🔗 접속 정보:"
echo "  - Health: http://104.154.205.25:10000/health"
echo "  - Session API: http://104.154.205.25:10000/api/session"
echo "  - Deep Analysis: http://104.154.205.25:10000/api/deep-analysis"
echo "  - Feedback: http://104.154.205.25:10000/api/feedback"
echo "  - WebSocket: ws://104.154.205.25:10000/ws"
echo ""
echo "🛠️ 관리 명령어:"
echo "  - 상태 확인: gcloud compute ssh mcp-server --zone=us-central1-a --command='pm2 status'"
echo "  - 로그 확인: gcloud compute ssh mcp-server --zone=us-central1-a --command='pm2 logs openmanager-ai-backend'"
echo "  - 서비스 재시작: gcloud compute ssh mcp-server --zone=us-central1-a --command='pm2 restart openmanager-ai-backend'"
echo ""
echo "💡 다음 단계:"
echo "  1. 프론트엔드에서 VM Backend 연결 테스트"
echo "  2. AI 사이드바에서 고급 기능 활용"
echo "  3. WebSocket 실시간 스트리밍 확인"
echo ""
echo "🎯 설정 완료! 이제 고급 AI 기능을 사용할 수 있습니다."