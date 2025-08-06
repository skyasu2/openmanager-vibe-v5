#!/bin/bash

# 🚀 OpenManager VIBE v5 - GCP VM AI Backend 배포 스크립트
# VM 인스턴스에 AI 백엔드 서비스를 배포합니다.

set -e

# 색상 설정
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 프로젝트 정보
PROJECT_ID="openmanager-free-tier"
VM_NAME="mcp-server"
VM_ZONE="us-central1-a"
VM_IP="104.154.205.25"
SERVICE_PORT=10000

echo -e "${BLUE}🚀 VM AI Backend 배포를 시작합니다...${NC}"
echo -e "${CYAN}📋 배포 정보:${NC}"
echo "  - Project ID: $PROJECT_ID"
echo "  - VM Name: $VM_NAME"
echo "  - Zone: $VM_ZONE"
echo "  - External IP: $VM_IP"
echo "  - Service Port: $SERVICE_PORT"
echo ""

# 1. VM 상태 확인
echo -e "${YELLOW}🖥️ VM 인스턴스 상태 확인...${NC}"
VM_STATUS=$(gcloud compute instances describe $VM_NAME --zone=$VM_ZONE --format="value(status)" 2>/dev/null || echo "NOT_FOUND")

if [ "$VM_STATUS" != "RUNNING" ]; then
    echo -e "${RED}❌ VM 인스턴스가 실행 중이 아닙니다. 상태: $VM_STATUS${NC}"
    echo -e "${YELLOW}💡 VM을 시작하려면: gcloud compute instances start $VM_NAME --zone=$VM_ZONE${NC}"
    exit 1
fi

echo -e "${GREEN}✅ VM 인스턴스가 실행 중입니다.${NC}"

# 2. 방화벽 규칙 확인/생성
echo -e "${YELLOW}🔥 방화벽 규칙 확인...${NC}"
FIREWALL_EXISTS=$(gcloud compute firewall-rules describe allow-ai-backend-port-10000 --format="value(name)" 2>/dev/null || echo "")

if [ -z "$FIREWALL_EXISTS" ]; then
    echo -e "${YELLOW}🔧 포트 $SERVICE_PORT 방화벽 규칙을 생성합니다...${NC}"
    gcloud compute firewall-rules create allow-ai-backend-port-10000 \
        --allow tcp:$SERVICE_PORT \
        --source-ranges 0.0.0.0/0 \
        --description "Allow AI Backend service on port $SERVICE_PORT (mcp-server)"
    echo -e "${GREEN}✅ 방화벽 규칙이 생성되었습니다.${NC}"
else
    echo -e "${GREEN}✅ 방화벽 규칙이 이미 존재합니다.${NC}"
fi

# 3. VM AI Backend 소스 코드 압축
echo -e "${YELLOW}📦 AI Backend 소스 코드를 압축합니다...${NC}"
cd "$(dirname "$0")/.."
tar -czf vm-ai-backend.tar.gz -C . vm-ai-backend/

# 4. VM에 소스 코드 업로드
echo -e "${YELLOW}📤 VM에 소스 코드를 업로드합니다...${NC}"
gcloud compute scp vm-ai-backend.tar.gz $VM_NAME:~/ --zone=$VM_ZONE

# 5. VM에서 배포 스크립트 실행
echo -e "${YELLOW}🔧 VM에서 AI Backend를 설치하고 실행합니다...${NC}"
gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
    # 시스템 업데이트
    sudo apt-get update -qq
    
    # Node.js 18+ 설치 (이미 있다면 스킷)
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    # 소스 코드 압축 해제
    tar -xzf vm-ai-backend.tar.gz
    cd vm-ai-backend
    
    # 의존성 설치
    npm install --production
    
    # PM2 전역 설치
    sudo npm install -g pm2
    
    # 환경변수 파일 생성
    cat > .env << EOF
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
    
    # PM2로 서비스 시작
    pm2 delete ai-backend 2>/dev/null || true
    pm2 start dist/index.js --name ai-backend
    pm2 save
    pm2 startup
    
    echo '✅ AI Backend 서비스가 시작되었습니다!'
"

# 6. 정리
rm -f vm-ai-backend.tar.gz

# 7. 서비스 상태 확인
echo -e "${YELLOW}🔍 서비스 상태를 확인합니다...${NC}"
sleep 5

# HTTP 헬스 체크
if curl -m 5 --connect-timeout 3 "http://$VM_IP:$SERVICE_PORT/api/health" &>/dev/null; then
    echo -e "${GREEN}✅ HTTP API 서비스가 정상적으로 실행 중입니다!${NC}"
else
    echo -e "${YELLOW}⚠️ HTTP API 연결을 확인 중... 잠시 후 다시 시도해주세요.${NC}"
fi

# WebSocket 연결 확인 (간단한 텔넷 테스트)
if timeout 3 bash -c "</dev/tcp/$VM_IP/$SERVICE_PORT" 2>/dev/null; then
    echo -e "${GREEN}✅ WebSocket 포트($SERVICE_PORT)가 열려있습니다!${NC}"
else
    echo -e "${YELLOW}⚠️ WebSocket 포트 확인 중... 방화벽이나 서비스를 확인해주세요.${NC}"
fi

echo ""
echo -e "${GREEN}🎉 VM AI Backend 배포가 완료되었습니다!${NC}"
echo ""
echo -e "${CYAN}📋 연결 정보:${NC}"
echo "  - HTTP API: http://$VM_IP:$SERVICE_PORT/api"
echo "  - WebSocket: ws://$VM_IP:$SERVICE_PORT/ws"
echo "  - Health Check: http://$VM_IP:$SERVICE_PORT/api/health"
echo ""
echo -e "${CYAN}🔧 관리 명령어:${NC}"
echo "  - 서비스 상태: gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command='pm2 status'"
echo "  - 로그 확인: gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command='pm2 logs ai-backend'"
echo "  - 서비스 재시작: gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command='pm2 restart ai-backend'"
echo "  - 서비스 중지: gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command='pm2 stop ai-backend'"
echo ""
echo -e "${YELLOW}💡 다음 단계:${NC}"
echo "  1. 프론트엔드 재시작: npm run dev"
echo "  2. AI 사이드바에서 VM 백엔드 연결 테스트"
echo "  3. WebSocket 실시간 스트리밍 테스트"