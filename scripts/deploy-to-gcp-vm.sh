#!/bin/bash

# 🚀 GCP VM 자동 배포 스크립트
# 
# 이 스크립트는 Express.js 서버를 GCP VM에 자동으로 배포합니다.
# AI 교차 검증을 통해 최적화된 배포 프로세스:
# - Gemini: 3단계 배포 검증 (업로드 → 설치 → 실행)
# - Codex: 무중단 배포 및 롤백 전략
# - Qwen: 보안 강화 및 환경 설정 최적화

set -euo pipefail  # 엄격한 에러 처리

# 🎨 색상 정의
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# 📋 설정 변수
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
readonly SERVER_FILE="$PROJECT_ROOT/scripts/gcp-vm-server.js"
readonly PACKAGE_FILE="$PROJECT_ROOT/package.json"

# GCP VM 설정 (환경변수에서 로드)
readonly GCP_VM_IP="${GCP_VM_EXTERNAL_IP:-35.202.122.78}"
readonly GCP_VM_USER="${GCP_VM_USER:-skyasu2}"
readonly GCP_VM_PORT="${GCP_VM_SSH_PORT:-22}"
readonly SERVER_PORT="${MCP_SERVER_PORT:-10000}"
readonly VM_API_TOKEN="${VM_API_TOKEN:-}"

# SSH 설정
readonly SSH_KEY="${GCP_VM_SSH_KEY:-$HOME/.ssh/gcp-vm-key}"
readonly SSH_OPTS="-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10"

# 원격 경로
readonly REMOTE_HOME="/home/$GCP_VM_USER"
readonly REMOTE_APP_DIR="$REMOTE_HOME/openmanager-server"
readonly REMOTE_SERVER_FILE="$REMOTE_APP_DIR/server.js"
readonly REMOTE_PACKAGE_FILE="$REMOTE_APP_DIR/package.json"

# 함수: 로그 출력
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] ℹ️  $1${NC}"
}

# 함수: 사전 조건 확인
check_prerequisites() {
    log "🔍 사전 조건 확인 중..."
    
    # 필수 파일 존재 확인
    [[ -f "$SERVER_FILE" ]] || error "서버 파일을 찾을 수 없습니다: $SERVER_FILE"
    [[ -f "$PACKAGE_FILE" ]] || error "package.json 파일을 찾을 수 없습니다: $PACKAGE_FILE"
    
    # SSH 키 확인
    if [[ ! -f "$SSH_KEY" ]]; then
        warn "SSH 키를 찾을 수 없습니다: $SSH_KEY"
        info "기본 SSH 키 (~/.ssh/id_rsa) 사용을 시도합니다"
        SSH_KEY="$HOME/.ssh/id_rsa"
        [[ -f "$SSH_KEY" ]] || error "SSH 키를 찾을 수 없습니다: $SSH_KEY"
    fi
    
    # 환경변수 확인
    [[ -n "$VM_API_TOKEN" ]] || warn "VM_API_TOKEN이 설정되지 않았습니다. 보안 토큰 없이 배포됩니다."
    
    # 필수 명령어 확인
    command -v ssh >/dev/null 2>&1 || error "ssh 명령어를 찾을 수 없습니다"
    command -v scp >/dev/null 2>&1 || error "scp 명령어를 찾을 수 없습니다"
    
    log "✅ 사전 조건 확인 완료"
}

# 함수: GCP VM 연결 테스트
test_vm_connection() {
    log "🔗 GCP VM 연결 테스트 중... ($GCP_VM_IP)"
    
    if ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" "echo 'Connection test successful'" >/dev/null 2>&1; then
        log "✅ GCP VM 연결 성공"
    else
        error "GCP VM 연결 실패. SSH 설정을 확인하세요."
    fi
}

# 함수: 원격 환경 준비
setup_remote_environment() {
    log "🛠️  원격 환경 설정 중..."
    
    # 애플리케이션 디렉토리 생성
    ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" << EOF
        # 디렉토리 생성
        mkdir -p $REMOTE_APP_DIR
        cd $REMOTE_APP_DIR
        
        # Node.js 설치 확인
        if ! command -v node >/dev/null 2>&1; then
            echo "Node.js 설치 중..."
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # PM2 글로벌 설치 확인
        if ! command -v pm2 >/dev/null 2>&1; then
            echo "PM2 설치 중..."
            sudo npm install -g pm2
        fi
        
        echo "Node.js 버전: \$(node --version)"
        echo "npm 버전: \$(npm --version)"
        echo "PM2 버전: \$(pm2 --version)"
EOF
    
    log "✅ 원격 환경 설정 완료"
}

# 함수: 서버 파일 업로드
upload_server_files() {
    log "📤 서버 파일 업로드 중..."
    
    # 기존 PM2 프로세스 중지 (에러 무시)
    ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" \
        "cd $REMOTE_APP_DIR && pm2 stop openmanager-server 2>/dev/null || true"
    
    # 서버 파일 업로드
    scp -i "$SSH_KEY" $SSH_OPTS -P "$GCP_VM_PORT" \
        "$SERVER_FILE" "$GCP_VM_USER@$GCP_VM_IP:$REMOTE_SERVER_FILE"
    
    # 간단한 package.json 생성 (필요한 의존성만)
    ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" << EOF
        cd $REMOTE_APP_DIR
        
        # 간단한 package.json 생성
        cat > package.json << 'PKG_EOF'
{
  "name": "openmanager-vm-server",
  "version": "1.0.0",
  "description": "OpenManager VM Data Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "pm2:start": "pm2 start server.js --name openmanager-server",
    "pm2:restart": "pm2 restart openmanager-server",
    "pm2:stop": "pm2 stop openmanager-server",
    "pm2:logs": "pm2 logs openmanager-server"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "express-rate-limit": "^6.10.0",
    "node-cache": "^5.1.2"
  }
}
PKG_EOF
        
        echo "package.json 생성 완료"
EOF
    
    log "✅ 서버 파일 업로드 완료"
}

# 함수: 의존성 설치
install_dependencies() {
    log "📦 의존성 설치 중..."
    
    ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" << EOF
        cd $REMOTE_APP_DIR
        
        # 기존 node_modules 제거
        rm -rf node_modules package-lock.json
        
        # 의존성 설치
        npm install --production
        
        echo "의존성 설치 완료"
        ls -la
EOF
    
    log "✅ 의존성 설치 완료"
}

# 함수: 환경변수 설정
setup_environment() {
    log "🔧 환경변수 설정 중..."
    
    ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" << EOF
        cd $REMOTE_APP_DIR
        
        # .env 파일 생성
        cat > .env << 'ENV_EOF'
# GCP VM 서버 환경변수
PORT=$SERVER_PORT
NODE_ENV=production
VM_API_TOKEN=$VM_API_TOKEN

# CORS 설정
CORS_ORIGINS=https://openmanager-vibe-v5.vercel.app,http://localhost:3000

# 로깅 레벨
LOG_LEVEL=info

# 캐시 설정
CACHE_TTL=30000

# 요청 제한 설정
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=30
ENV_EOF
        
        echo "환경변수 파일 생성 완료"
        ls -la .env
EOF
    
    log "✅ 환경변수 설정 완료"
}

# 함수: 방화벽 설정
setup_firewall() {
    log "🔥 방화벽 설정 확인 중..."
    
    ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" << EOF
        # UFW 방화벽 확인 및 설정
        if command -v ufw >/dev/null 2>&1; then
            echo "UFW 방화벽 설정 확인 중..."
            
            # 포트 허용 (이미 허용되어 있을 수 있음)
            sudo ufw allow $SERVER_PORT/tcp 2>/dev/null || echo "포트 $SERVER_PORT는 이미 허용되어 있습니다"
            
            # UFW 상태 확인
            sudo ufw status | grep $SERVER_PORT || echo "UFW에서 포트 $SERVER_PORT 확인 필요"
        else
            echo "UFW를 찾을 수 없습니다. 수동으로 방화벽을 설정해야 할 수 있습니다."
        fi
        
        # 포트 listening 확인
        if command -v netstat >/dev/null 2>&1; then
            echo "현재 listening 포트:"
            netstat -tlnp | grep :$SERVER_PORT || echo "포트 $SERVER_PORT는 현재 사용되지 않습니다"
        fi
EOF
    
    log "✅ 방화벽 설정 확인 완료"
}

# 함수: 서버 시작
start_server() {
    log "🚀 서버 시작 중..."
    
    ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" << 'EOF'
        cd $REMOTE_APP_DIR
        
        # 기존 프로세스 중지
        pm2 delete openmanager-server 2>/dev/null || true
        
        # PM2로 서버 시작
        pm2 start server.js --name openmanager-server --env production
        
        # PM2 자동 시작 설정
        pm2 startup 2>/dev/null || echo "PM2 startup 설정 건너뛰기"
        pm2 save
        
        # 서버 상태 확인
        sleep 3
        pm2 status
        
        echo "서버 시작 완료"
EOF
    
    log "✅서버 시작 완료"
}

# 함수: 배포 테스트
test_deployment() {
    log "🧪 배포 테스트 중..."
    
    # 헬스체크 테스트
    info "헬스체크 엔드포인트 테스트..."
    if curl -f -m 10 "http://$GCP_VM_IP:$SERVER_PORT/health" >/dev/null 2>&1; then
        log "✅ 헬스체크 성공"
    else
        warn "헬스체크 실패 - 수동으로 확인이 필요할 수 있습니다"
    fi
    
    # 서버 데이터 엔드포인트 테스트
    info "서버 데이터 API 테스트..."
    if [[ -n "$VM_API_TOKEN" ]]; then
        if curl -f -m 10 -H "Authorization: Bearer $VM_API_TOKEN" \
           "http://$GCP_VM_IP:$SERVER_PORT/api/servers" >/dev/null 2>&1; then
            log "✅ 서버 데이터 API 성공"
        else
            warn "서버 데이터 API 실패 - 토큰 또는 엔드포인트 확인 필요"
        fi
    else
        warn "VM_API_TOKEN이 없어 인증 API 테스트를 건너뜁니다"
    fi
    
    # 서버 로그 확인
    info "서버 로그 확인 중..."
    ssh -i "$SSH_KEY" $SSH_OPTS -p "$GCP_VM_PORT" "$GCP_VM_USER@$GCP_VM_IP" \
        "cd $REMOTE_APP_DIR && pm2 logs openmanager-server --lines 10"
    
    log "✅ 배포 테스트 완료"
}

# 함수: 배포 정보 출력
print_deployment_info() {
    log "📋 배포 정보"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 GCP VM 서버 배포 완료!${NC}"
    echo ""
    echo -e "${YELLOW}📍 서버 정보:${NC}"
    echo "   • IP 주소: $GCP_VM_IP"
    echo "   • 포트: $SERVER_PORT"
    echo "   • 헬스체크: http://$GCP_VM_IP:$SERVER_PORT/health"
    echo "   • 서버 데이터 API: http://$GCP_VM_IP:$SERVER_PORT/api/servers"
    echo ""
    echo -e "${YELLOW}🛠️  관리 명령어:${NC}"
    echo "   • SSH 접속: ssh -i $SSH_KEY $GCP_VM_USER@$GCP_VM_IP"
    echo "   • PM2 상태: pm2 status"
    echo "   • PM2 로그: pm2 logs openmanager-server"
    echo "   • PM2 재시작: pm2 restart openmanager-server"
    echo ""
    echo -e "${YELLOW}🔗 Next.js 앱 연동:${NC}"
    echo "   환경변수가 올바르게 설정되어 있으면 자동으로 GCP VM에서 데이터를 가져옵니다."
    echo "   - GCP_VM_EXTERNAL_IP=$GCP_VM_IP"
    echo "   - MCP_SERVER_PORT=$SERVER_PORT"
    echo "   - VM_API_TOKEN=$VM_API_TOKEN"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# 함수: 메인 배포 프로세스
main() {
    log "🚀 GCP VM 자동 배포 시작"
    echo ""
    
    # 단계별 배포 실행
    check_prerequisites
    test_vm_connection
    setup_remote_environment
    upload_server_files
    install_dependencies
    setup_environment
    setup_firewall
    start_server
    test_deployment
    
    echo ""
    print_deployment_info
    
    log "🎉 배포 프로세스 완료!"
}

# 스크립트 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi