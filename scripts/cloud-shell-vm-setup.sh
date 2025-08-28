#!/bin/bash

# 🌐 Cloud Shell에서 VM 직접 접근 및 서버 배포
# GCP Cloud Shell에서 실행하는 스크립트

echo "🌐 Cloud Shell VM 접근 스크립트"
echo "현재 위치: $(pwd)"
echo "프로젝트: $(gcloud config get-value project)"

# 1. VM SSH 접근 테스트
echo ""
echo "1️⃣ VM SSH 접근 테스트..."
if gcloud compute ssh mcp-server --zone=us-central1-a --command="echo '✅ SSH 연결 성공'" --quiet; then
    echo "✅ VM SSH 접근 가능"
    SSH_OK=true
else
    echo "❌ VM SSH 접근 실패"
    SSH_OK=false
fi

if [ "$SSH_OK" = true ]; then
    echo ""
    echo "2️⃣ VM에 Node.js 서버 설치 및 실행..."
    
    # VM에 서버 코드 업로드 및 실행
    cat > /tmp/vm-server.js << 'EOF'
const express = require('express');
const os = require('os');
const fs = require('fs');

const app = express();
const PORT = 8080; // GCP 기본 HTTP 포트

// CORS 설정
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// VM 시스템 정보 수집
function getVMData() {
    const loadavg = os.loadavg();
    const freemem = os.freemem();
    const totalmem = os.totalmem();
    
    return {
        timestamp: new Date().toISOString(),
        vm_info: {
            hostname: os.hostname(),
            platform: os.platform(),
            uptime: Math.floor(os.uptime()),
            loadavg: loadavg,
            memory: {
                total: Math.round(totalmem / 1024 / 1024), // MB
                free: Math.round(freemem / 1024 / 1024), // MB
                used: Math.round((totalmem - freemem) / 1024 / 1024), // MB
                usage_percent: Math.round(((totalmem - freemem) / totalmem) * 100)
            }
        },
        servers: [
            {
                id: "gcp-vm-001",
                name: "GCP e2-micro VM",
                type: "compute", 
                status: "online",
                metrics: {
                    cpu: Math.round(loadavg[0] * 20 + 10),
                    memory: Math.round(((totalmem - freemem) / totalmem) * 100),
                    disk: Math.round(Math.random() * 30 + 20),
                    network: Math.round(Math.random() * 15 + 5)
                },
                specs: {
                    cpu: "e2-micro (2 vCPU)",
                    memory: Math.round(totalmem / 1024 / 1024) + "MB",
                    location: "us-central1-a"
                },
                lastUpdated: new Date().toISOString()
            }
        ]
    };
}

// 라우트 설정
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/servers', (req, res) => {
    res.json(getVMData());
});

app.get('/', (req, res) => {
    const data = getVMData();
    res.json({
        message: '🚀 GCP VM API Server',
        endpoints: [
            '/health - 헬스체크',
            '/api/servers - 서버 데이터'
        ],
        ...data
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중...`);
    console.log(`🌐 내부 접근: http://$(hostname -I | cut -d' ' -f1):${PORT}/api/servers`);
});
EOF
    
    echo "📤 VM에 서버 코드 업로드..."
    gcloud compute scp /tmp/vm-server.js mcp-server:~/vm-server.js --zone=us-central1-a --quiet
    
    echo "📦 VM에 Node.js 설치 및 서버 실행..."
    gcloud compute ssh mcp-server --zone=us-central1-a --command="
        # Node.js 설치 확인
        if ! command -v node &> /dev/null; then
            echo '📦 Node.js 설치 중...'
            curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
            sudo apt-get install -y nodejs
        fi
        
        # Express 설치
        if [ ! -d node_modules ]; then
            echo '📦 Express 설치 중...'
            npm init -y
            npm install express
        fi
        
        # 기존 서버 중지
        pkill -f vm-server.js || true
        
        # 새 서버 실행 (백그라운드)
        echo '🚀 서버 시작 중...'
        nohup node vm-server.js > server.log 2>&1 &
        
        sleep 2
        echo '📋 서버 상태 확인...'
        ps aux | grep vm-server.js | grep -v grep || echo '⚠️ 서버 프로세스 없음'
        
        # 로컬 테스트
        curl -s http://localhost:8080/health | head -3 || echo '❌ 로컬 연결 실패'
    " --quiet
    
    echo ""
    echo "3️⃣ VM 내부 IP 확인..."
    INTERNAL_IP=$(gcloud compute instances describe mcp-server --zone=us-central1-a --format="value(networkInterfaces[0].networkIP)" 2>/dev/null || echo "unknown")
    echo "🌐 VM 내부 IP: $INTERNAL_IP"
    
    if [ "$INTERNAL_IP" != "unknown" ]; then
        echo ""
        echo "4️⃣ Cloud Shell에서 VM API 테스트..."
        curl -s "http://$INTERNAL_IP:8080/api/servers" | head -10 || echo "❌ 내부 네트워크 연결 실패"
        
        echo ""
        echo "✅ 설정 완료! VM 서버가 내부 네트워크에서 실행 중입니다."
        echo ""
        echo "🎯 VM API 접근 URL (Cloud Shell에서):"
        echo "   http://$INTERNAL_IP:8080/api/servers"
        echo ""
        echo "📋 Next.js 앱에서 사용하려면:"
        echo "   1. 이 URL을 serverConfig.ts에서 GCP_VM_ENDPOINT로 설정"
        echo "   2. 또는 GitHub Pages 방법으로 외부 접근 구현"
    fi
else
    echo ""
    echo "⚠️ VM SSH 접근이 필요합니다. 다음을 확인해주세요:"
    echo "   1. VM이 실행 중인지 확인"
    echo "   2. Cloud Shell에서 SSH 키 설정"
    echo "   3. 프로젝트 권한 확인"
fi