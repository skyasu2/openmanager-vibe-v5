#!/bin/bash
# GCP VM 스타트업 스크립트 - API 라우팅 수정

# 로그 파일
LOG_FILE="/var/log/startup-script.log"
echo "$(date): Starting startup script" >> $LOG_FILE

# Node.js 서버 파일 생성
cat > /tmp/server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 10000;

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), port: PORT });
});

// API routes
const api = express.Router();
api.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'api', timestamp: new Date().toISOString() });
});
api.get('/status', (req, res) => {
  const os = require('os');
  res.json({
    status: 'online',
    hostname: os.hostname(),
    uptime: os.uptime(),
    memory: { total: os.totalmem(), free: os.freemem() },
    timestamp: new Date().toISOString()
  });
});
api.get('/metrics', (req, res) => {
  res.json({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use('/api', api);

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# PM2 설치 확인
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

# Express 설치
cd /tmp
npm init -y
npm install express

# PM2로 서비스 시작
pm2 stop all
pm2 delete all
pm2 start /tmp/server.js --name mcp-server
pm2 save
pm2 startup

echo "$(date): Startup script completed" >> $LOG_FILE