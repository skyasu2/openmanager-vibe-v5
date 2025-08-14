#!/bin/bash
#
# GCP VM 서비스 설정 자동화 스크립트
# SSH 접속 후 실행: bash setup-vm-services.sh
# 작성일: 2025-08-14
#

set -e

echo "🚀 GCP VM 서비스 설정 시작"
echo "================================"

# 1. 시스템 업데이트
echo "📦 시스템 패키지 업데이트..."
sudo apt-get update -qq

# 2. Node.js 확인 및 설치
echo "🟢 Node.js 환경 확인..."
if ! command -v node &> /dev/null; then
    echo "Node.js 설치 중..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js 버전: $(node -v)"

# 3. PM2 설치 및 업데이트
echo "🔧 PM2 설치/업데이트..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2@latest
else
    sudo npm update -g pm2
fi
echo "PM2 버전: $(pm2 -v)"

# 4. 프로젝트 디렉토리 생성
echo "📁 프로젝트 디렉토리 설정..."
PROJECT_DIR="/home/$USER/mcp-server"
mkdir -p $PROJECT_DIR
mkdir -p $PROJECT_DIR/logs
cd $PROJECT_DIR

# 5. 서비스 파일 다운로드
echo "📥 서비스 파일 설정..."
cat > server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// CORS 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API 라우터
const apiRouter = express.Router();

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api',
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/status', (req, res) => {
  const os = require('os');
  res.json({
    status: 'online',
    hostname: os.hostname(),
    platform: os.platform(),
    uptime: os.uptime(),
    memory: {
      total: os.totalmem(),
      free: os.freemem()
    },
    timestamp: new Date().toISOString()
  });
});

apiRouter.get('/metrics', (req, res) => {
  res.json({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API 라우터 마운트
app.use('/api', apiRouter);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api/health`);
});
EOF

# 6. package.json 생성
echo "📝 package.json 생성..."
cat > package.json << 'EOF'
{
  "name": "mcp-server",
  "version": "1.0.0",
  "description": "OpenManager VIBE v5 MCP Server",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "pm2": "pm2 start ecosystem.config.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
EOF

# 7. PM2 ecosystem 설정
echo "⚙️ PM2 ecosystem 설정..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mcp-server',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 10000
    },
    max_memory_restart: '800M',
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false
  }]
};
EOF

# 8. 의존성 설치
echo "📦 의존성 설치..."
npm install express

# 9. PM2 프로세스 재시작
echo "🔄 PM2 프로세스 재시작..."
pm2 stop all || true
pm2 delete all || true
pm2 start ecosystem.config.js
pm2 save

# 10. 시작 스크립트 설정
echo "🚀 시작 스크립트 설정..."
pm2 startup systemd -u $USER --hp /home/$USER
pm2 save

# 11. 방화벽 설정
echo "🔥 방화벽 설정..."
sudo ufw allow 10000/tcp || true
sudo ufw allow 22/tcp || true
sudo ufw --force enable || true

# 12. 헬스체크 크론탭 설정
echo "⏰ 헬스체크 크론탭 설정..."
(crontab -l 2>/dev/null | grep -v 'health-check') | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * curl -f http://localhost:10000/health || pm2 restart all") | crontab -

# 13. 상태 확인
echo ""
echo "✅ 설정 완료! 현재 상태:"
echo "================================"
pm2 status
echo ""
echo "🔍 서비스 테스트:"
curl -s http://localhost:10000/health | jq . || curl -s http://localhost:10000/health
echo ""
curl -s http://localhost:10000/api/health | jq . || curl -s http://localhost:10000/api/health
echo ""
echo "================================"
echo "🎉 VM 서비스 설정 완료!"
echo "외부 접속: http://104.154.205.25:10000/health"
echo "API 접속: http://104.154.205.25:10000/api/health"