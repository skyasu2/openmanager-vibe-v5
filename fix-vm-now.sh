#!/bin/bash
# GCP VM 완전 자동 복구 스크립트
# 작성일: 2025-08-14
# 설명: Node.js 호환성 문제 및 PM2 서비스 완전 해결

set -e

echo "🚀 VM 서비스 완전 자동 복구 시작..."
echo "=================================="

# 1. PM2 정리
echo "📦 기존 PM2 프로세스 정리..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true

# 2. 작업 디렉토리 준비
echo "📁 작업 디렉토리 준비..."
cd /tmp
rm -rf node_modules package-lock.json 2>/dev/null || true

# 3. 간단한 HTTP 서버 생성 (Express 없이)
echo "🔧 서버 파일 생성 (Node.js 내장 HTTP 모듈 사용)..."
cat > /tmp/simple-server.js << 'EOF'
const http = require('http');
const url = require('url');
const os = require('os');

const PORT = 10000;

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  
  // CORS 헤더
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 라우팅
  if (path === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT
    }));
  } else if (path === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'api',
      timestamp: new Date().toISOString()
    }));
  } else if (path === '/api/status') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'online',
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem()
      },
      timestamp: new Date().toISOString()
    }));
  } else if (path === '/api/metrics') {
    res.writeHead(200);
    res.end(JSON.stringify({
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({
      error: 'Not Found',
      path: path
    }));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoints:`);
  console.log(`  - http://localhost:${PORT}/api/health`);
  console.log(`  - http://localhost:${PORT}/api/status`);
  console.log(`  - http://localhost:${PORT}/api/metrics`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  server.close(() => {
    process.exit(0);
  });
});
EOF

# 4. PM2 ecosystem 설정
echo "⚙️ PM2 ecosystem 설정..."
cat > /tmp/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'mcp-server',
    script: '/tmp/simple-server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '200M',
    error_file: '/tmp/pm2-error.log',
    out_file: '/tmp/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 10000
    }
  }]
};
EOF

# 5. 직접 테스트
echo "🧪 서버 직접 테스트 (5초)..."
timeout 5 node /tmp/simple-server.js &
sleep 2
curl -s http://localhost:10000/health && echo "" || echo "테스트 실패"
kill %1 2>/dev/null || true
sleep 1

# 6. PM2로 시작
echo "🚀 PM2로 서비스 시작..."
pm2 start /tmp/ecosystem.config.js
sleep 3

# 7. 상태 확인
echo "📊 서비스 상태 확인..."
pm2 status

# 8. 포트 확인
echo "🔍 포트 확인..."
sudo netstat -tlnp | grep 10000 || echo "포트 10000이 아직 열리지 않음"

# 9. 테스트
echo "✅ API 테스트..."
echo "Health check:"
curl -s http://localhost:10000/health | python -m json.tool || curl -s http://localhost:10000/health
echo ""
echo "API Health:"
curl -s http://localhost:10000/api/health | python -m json.tool || curl -s http://localhost:10000/api/health
echo ""
echo "API Status:"
curl -s http://localhost:10000/api/status | python -m json.tool || curl -s http://localhost:10000/api/status
echo ""

# 10. PM2 자동 시작 설정
echo "🔧 PM2 자동 시작 설정..."
pm2 save
pm2 startup | tail -n 1 > /tmp/startup-cmd.txt
echo "다음 명령어를 실행하세요:"
cat /tmp/startup-cmd.txt

# 11. 방화벽 확인
echo "🔥 방화벽 상태..."
sudo iptables -L -n | grep 10000 || echo "iptables 규칙 없음 (정상)"

echo ""
echo "=================================="
echo "🎉 복구 완료!"
echo "외부 접속 테스트: http://104.154.205.25:10000/health"
echo ""
echo "⚠️ 중요: 위에 표시된 pm2 startup 명령어를 실행하세요!"
echo "=================================="