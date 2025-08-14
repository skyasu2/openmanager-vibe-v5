# 🚀 VM Management API 배포 가이드

## 📌 현재 상태
- **VM IP**: 104.154.205.25:10000
- **현재 서버**: simple.js (기본 API)
- **준비된 서버**: Management API v2.0

## 🔑 API 인증 정보
```bash
API_TOKEN=f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00
```

## 📋 배포 단계

### 1️⃣ Cloud Shell 열기
브라우저에서 열기: [Cloud Shell](https://shell.cloud.google.com/?project=openmanager-free-tier)

### 2️⃣ VM SSH 접속
```bash
gcloud compute ssh mcp-server --zone=us-central1-a
```

### 3️⃣ Management API 배포 (전체 복사 → 붙여넣기)
```bash
# 간단 버전 - 한 번에 실행
curl -s https://raw.githubusercontent.com/[your-repo]/vm-management-api.js -o /tmp/mgmt-api.js || \
cat > /tmp/mgmt-api.js << 'EOF'
const http = require('http');
const { exec } = require('child_process');
const PORT = 10000;
const TOKEN = 'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00';

// 간단한 Management API 구현
const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 라우팅 로직
  if (req.url === '/health') {
    res.end(JSON.stringify({ status: 'healthy', version: '2.0' }));
  } else if (req.url === '/api/status') {
    const os = require('os');
    res.end(JSON.stringify({
      hostname: os.hostname(),
      memory: Math.round(os.freemem() / 1024 / 1024) + 'MB free',
      uptime: Math.floor(os.uptime() / 60) + ' minutes'
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => console.log('Management API v2.0 on port', PORT));
EOF

# PM2로 재시작
pm2 stop simple && pm2 delete simple
pm2 start /tmp/mgmt-api.js --name mgmt-api
pm2 save
pm2 status
```

### 4️⃣ 테스트
```bash
# VM 내부에서
curl http://localhost:10000/health
curl http://localhost:10000/api/status

# 종료 (Ctrl+D 또는)
exit
```

## 🧪 로컬에서 테스트

### 환경변수 확인
```bash
# Windows PowerShell
type .env.local | findstr VM_API

# Git Bash
grep VM_API .env.local
```

### NPM 스크립트로 테스트
```bash
# 헬스체크
npm run vm:health

# VM 상태
npm run vm:status

# PM2 프로세스
npm run vm:pm2

# 로그 확인
npm run vm:logs
```

### 직접 명령 실행
```bash
# 명령 실행 예제
node scripts/vm-api-client.js exec "ls -la /tmp"
node scripts/vm-api-client.js exec "pm2 list"
node scripts/vm-api-client.js exec "df -h"
```

### 코드 배포 테스트
```bash
# test-app.js 배포
node scripts/vm-api-client.js deploy test-app.js

# 배포된 앱 확인
node scripts/vm-api-client.js pm2
```

## 📊 모니터링

### 실시간 로그 모니터링 (Git Bash)
```bash
# 2초마다 최근 20줄 로그
watch -n 2 "node scripts/vm-api-client.js logs 20"
```

### PM2 프로세스 모니터링
```bash
# 5초마다 PM2 상태
watch -n 5 "node scripts/vm-api-client.js pm2"
```

## ⚠️ 트러블슈팅

### 1. Connection Refused
- VM이 실행 중인지 확인
- 포트 10000이 열려있는지 확인
```bash
curl http://104.154.205.25:10000/health
```

### 2. Unauthorized (401)
- API 토큰 확인
```bash
echo $VM_API_TOKEN
# 출력: f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00
```

### 3. PM2 에러
- Cloud Shell에서 PM2 재시작
```bash
pm2 kill
pm2 start /tmp/mgmt-api.js --name mgmt-api
```

## 🔄 롤백 방법

문제 발생 시 기존 서버로 롤백:
```bash
# Cloud Shell에서
pm2 stop mgmt-api
pm2 delete mgmt-api
pm2 start /tmp/simple.js --name simple
```

## 📝 참고사항

- **Node.js 버전**: VM은 v12.22.12 사용 (Express 5 비호환)
- **메모리 제한**: e2-micro는 1GB RAM (PM2 메모리 제한 설정 필요)
- **무료 티어**: 월 750시간 무료 (단일 인스턴스)

---

**작성일**: 2025-08-14 13:15 KST
**버전**: Management API v2.0
**상태**: 배포 준비 완료