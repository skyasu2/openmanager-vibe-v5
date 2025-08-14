# GCP Cloud Shell로 VM 접속하기

## 🌐 브라우저에서 Cloud Shell 열기

### 1. Cloud Shell 직접 링크 (클릭)
[Cloud Shell 열기](https://shell.cloud.google.com/?project=openmanager-free-tier&cloudshell_git_repo=&cloudshell_tutorial=)

또는 URL 복사:
```
https://shell.cloud.google.com/?project=openmanager-free-tier
```

### 2. Cloud Shell에서 실행할 명령어

```bash
# VM SSH 접속
gcloud compute ssh mcp-server --zone=us-central1-a

# SSH 접속 후 실행
# 1. 현재 프로세스 확인
ps aux | grep node
pm2 status

# 2. Node.js 서버 파일 생성
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
  console.log(`Health: http://localhost:${PORT}/health`);
  console.log(`API: http://localhost:${PORT}/api/health`);
});
EOF

# 3. 필요한 패키지 설치
cd /tmp
npm init -y
npm install express

# 4. PM2로 서비스 시작
pm2 stop all
pm2 delete all
pm2 start /tmp/server.js --name mcp-server
pm2 save

# 5. 상태 확인
pm2 status
curl http://localhost:10000/health
curl http://localhost:10000/api/health
```

### 3. 확인 방법

로컬에서 확인:
```bash
curl http://104.154.205.25:10000/health
curl http://104.154.205.25:10000/api/health
curl http://104.154.205.25:10000/api/status
curl http://104.154.205.25:10000/api/metrics
```

## 🎯 예상 소요 시간: 5분

1. Cloud Shell 열기: 30초
2. VM SSH 접속: 30초
3. 서버 파일 생성: 1분
4. 패키지 설치: 2분
5. PM2 시작 및 확인: 1분

---

**작성 시간**: 2025-08-14 08:35 KST