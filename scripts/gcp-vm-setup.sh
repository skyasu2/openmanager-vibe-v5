#!/bin/bash

# 🚀 GCP VM AI 백엔드 자동 설정 스크립트

set -e

echo "🌟 GCP VM AI Backend 설정을 시작합니다..."

# 설정 변수 (실제 프로젝트 정보)
PROJECT_ID="${GCP_PROJECT_ID:-openmanager-free-tier}"
VM_NAME="${VM_NAME:-openmanager-ai-backend}"
ZONE="${GCP_ZONE:-asia-northeast3-a}"  # 서울 리전
MACHINE_TYPE="e2-micro"  # 무료 티어
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"

echo "📋 설정 정보:"
echo "  - Project ID: $PROJECT_ID"
echo "  - VM Name: $VM_NAME"
echo "  - Zone: $ZONE"
echo "  - Machine Type: $MACHINE_TYPE"

# GCP 프로젝트 설정
echo "🔧 GCP 프로젝트 설정..."
gcloud config set project $PROJECT_ID

# VM 인스턴스 생성 (무료 티어)
echo "🖥️ VM 인스턴스 생성 중..."
gcloud compute instances create $VM_NAME \
  --zone=$ZONE \
  --machine-type=$MACHINE_TYPE \
  --network-interface=network-tier=PREMIUM,subnet=default \
  --maintenance-policy=MIGRATE \
  --provisioning-model=STANDARD \
  --service-account=$(gcloud iam service-accounts list --format="value(email)" --filter="displayName:Compute Engine default service account") \
  --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \
  --tags=ai-backend-server \
  --create-disk=auto-delete=yes,boot=yes,device-name=$VM_NAME,image=projects/$IMAGE_PROJECT/global/images/family/$IMAGE_FAMILY,mode=rw,size=30,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-standard \
  --no-shielded-secure-boot \
  --shielded-vtpm \
  --shielded-integrity-monitoring \
  --labels=env=production,service=ai-backend \
  --reservation-affinity=any

# 방화벽 규칙 생성
echo "🔥 방화벽 규칙 생성..."
gcloud compute firewall-rules create allow-ai-backend \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:3001 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=ai-backend-server \
  --description="Allow AI Backend server on port 3001" \
  || echo "방화벽 규칙이 이미 존재합니다."

# 외부 IP 가져오기
echo "🌐 외부 IP 주소 가져오는 중..."
VM_EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)")

echo "✅ VM 인스턴스가 성공적으로 생성되었습니다!"
echo "🌐 External IP: $VM_EXTERNAL_IP"
echo "🔗 WebSocket URL: ws://$VM_EXTERNAL_IP:3001/ws"

# 환경변수 템플릿 생성
cat > .env.vm.template << EOF
# 🚀 VM AI Backend Environment Variables

# VM AI Backend WebSocket
WEBSOCKET_URL=ws://$VM_EXTERNAL_IP:3001/ws
WEBSOCKET_ENABLED=true
WEBSOCKET_RECONNECT_ATTEMPTS=5
WEBSOCKET_RECONNECT_DELAY=1000
WEBSOCKET_HEARTBEAT_INTERVAL=30000

# VM AI Backend REST API
VM_AI_BACKEND_URL=http://$VM_EXTERNAL_IP:3001/api
VM_AI_BACKEND_ENABLED=true

# GCP VM 정보
GCP_VM_NAME=$VM_NAME
GCP_VM_ZONE=$ZONE
GCP_VM_EXTERNAL_IP=$VM_EXTERNAL_IP
GCP_PROJECT_ID=$PROJECT_ID

# AI Backend 기능 설정
AI_ENABLE_SESSION_MANAGEMENT=true
AI_ENABLE_DEEP_ANALYSIS=true
AI_ENABLE_REAL_TIME_STREAMING=true
AI_ENABLE_FEEDBACK_LEARNING=true
EOF

echo "📄 환경변수 템플릿이 생성되었습니다: .env.vm.template"

# 배포 스크립트 생성
cat > scripts/deploy-vm-backend.sh << 'EOF'
#!/bin/bash

# 🚀 VM AI Backend 배포 스크립트

set -e

VM_NAME="${VM_NAME:-openmanager-ai-backend}"
ZONE="${GCP_ZONE:-asia-northeast3-a}"

echo "📦 VM AI Backend 배포 시작..."

# 소스 코드 압축
echo "📁 소스 코드 압축 중..."
tar -czf vm-ai-backend.tar.gz vm-ai-backend/

# VM에 파일 복사
echo "📤 파일을 VM에 복사 중..."
gcloud compute scp vm-ai-backend.tar.gz $VM_NAME:~/ --zone=$ZONE

# VM에 배포 명령 실행
echo "🔧 VM에서 설치 및 실행..."
gcloud compute ssh $VM_NAME --zone=$ZONE --command="
  # 시스템 업데이트
  sudo apt update && sudo apt upgrade -y

  # Node.js 설치 (18.x LTS)
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs

  # PM2 설치
  sudo npm install -g pm2

  # 기존 프로세스 정리
  pm2 stop all || true
  pm2 delete all || true

  # 소스 코드 압축 해제
  tar -xzf vm-ai-backend.tar.gz
  cd vm-ai-backend

  # 환경변수 설정
  cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=3001
HOST=0.0.0.0
ALLOWED_ORIGINS=https://openmanager-vibe-v5.vercel.app,http://localhost:3000
LOG_LEVEL=info
ENVEOF

  # 의존성 설치
  npm install --production

  # 빌드
  npm run build

  # PM2로 실행
  pm2 start dist/index.js --name vm-ai-backend

  # PM2 상태 확인
  pm2 list
  pm2 logs vm-ai-backend --lines 10
"

echo "✅ VM AI Backend 배포 완료!"
EOF

chmod +x scripts/deploy-vm-backend.sh

echo ""
echo "🎉 GCP VM 설정이 완료되었습니다!"
echo ""
echo "📋 다음 단계:"
echo "  1. .env.vm.template 내용을 .env.local에 추가"
echo "  2. scripts/deploy-vm-backend.sh 실행하여 백엔드 배포"
echo "  3. 프론트엔드에서 WebSocket 연결 테스트"
echo ""
echo "💡 유용한 명령어:"
echo "  gcloud compute instances list"
echo "  gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "  gcloud compute instances stop $VM_NAME --zone=$ZONE"
echo "  gcloud compute instances start $VM_NAME --zone=$ZONE"
echo ""