#!/bin/bash

# 🔐 GCP 인증 및 VM AI 백엔드 배포 가이드
# 
# 사용자가 다음 명령어를 실행해야 합니다:

echo "🔐 GCP 인증 및 VM AI 백엔드 배포 가이드"
echo ""
echo "1️⃣ Google Cloud Shell 또는 로컬에서 실행하세요:"
echo ""
echo "   # GCP 인증 (이미 인증된 경우 스킵 가능)"
echo "   gcloud auth login"
echo ""
echo "   # 프로젝트 설정"
echo "   gcloud config set project openmanager-free-tier"
echo ""
echo "   # VM 상태 확인"
echo "   gcloud compute instances list"
echo ""
echo "2️⃣ VM이 실행 중이면 다음 명령어로 배포:"
echo ""
echo "   bash scripts/deploy-vm-backend.sh"
echo ""
echo "3️⃣ 또는 수동 배포 (Google Cloud Shell에서):"
echo ""

cat << 'EOF'
# VM에 직접 연결
gcloud compute ssh mcp-server --zone=us-central1-a

# VM 내부에서 실행:
sudo apt-get update
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 소스 코드 업로드 (로컬에서 실행)
cd /mnt/d/cursor/openmanager-vibe-v5
tar -czf vm-ai-backend.tar.gz vm-ai-backend/
gcloud compute scp vm-ai-backend.tar.gz mcp-server:~/ --zone=us-central1-a

# VM에서 서비스 시작
gcloud compute ssh mcp-server --zone=us-central1-a --command="
  tar -xzf vm-ai-backend.tar.gz
  cd vm-ai-backend
  npm install --production
  
  # 환경변수 설정
  cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
AI_ENABLE_SESSION_MANAGEMENT=true
AI_ENABLE_DEEP_ANALYSIS=true
AI_ENABLE_REAL_TIME_STREAMING=true
AI_ENABLE_FEEDBACK_LEARNING=true
LOG_LEVEL=info
DEBUG=false
ENVEOF
  
  # PM2로 서비스 시작
  pm2 delete ai-backend 2>/dev/null || true
  pm2 start dist/index.js --name ai-backend
  pm2 save
  pm2 startup
"

# 방화벽 규칙 생성
gcloud compute firewall-rules create allow-ai-backend-port \
    --allow tcp:3001 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow AI Backend service on port 3001"

EOF

echo ""
echo "4️⃣ 배포 완료 후 테스트:"
echo ""
echo "   curl http://104.154.205.25:3001/api/health"
echo ""
echo "📍 현재 상태:"
echo "   - VM IP: 104.154.205.25"
echo "   - 서비스 포트: 3001" 
echo "   - 환경변수: .env.local에 이미 설정됨"
echo ""
echo "💡 빠른 테스트 (인증 없이):"
echo ""
echo "   # 현재 VM 상태 직접 확인"
echo "   curl -m 5 http://104.154.205.25:3001/api/health"
echo "   curl -m 5 http://104.154.205.25:22"
echo ""