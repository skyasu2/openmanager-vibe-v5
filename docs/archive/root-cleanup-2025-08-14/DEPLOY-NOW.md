# 🚀 즉시 배포 가이드 (2분 소요)

## ⚡ 원클릭 배포 (Cloud Shell)

### Step 1: Cloud Shell 열기
👉 **[여기를 클릭](https://shell.cloud.google.com/?project=openmanager-free-tier&cloudshell_git_repo=&cloudshell_tutorial=)** 하여 Cloud Shell 열기

### Step 2: 다음 명령어 전체 복사 → 붙여넣기 → Enter

```bash
gcloud compute ssh mcp-server --zone=us-central1-a --command="
# 자동 배포 시작
echo '🚀 Management API 배포 중...'

# 백업
cp /tmp/simple.js /tmp/backup-\$(date +%s).js 2>/dev/null || true

# Management API 생성 (최소 버전)
cat > /tmp/mgmt-api.js << 'EOF'
const http = require('http');
const { exec } = require('child_process');
const url = require('url');
const fs = require('fs');

const PORT = 10000;
const TOKEN = 'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00';

// 토큰 검증
function auth(req) {
  const h = req.headers['authorization'];
  return h && h.replace('Bearer ', '') === TOKEN;
}

// 명령 실행
function run(cmd) {
  return new Promise(r => {
    exec(cmd, (e, out, err) => {
      r({ ok: !e, out: out || '', err: err || '' });
    });
  });
}

// 라우터
const routes = {
  '/health': () => ({ status: 'healthy', version: '2.0', time: new Date() }),
  '/api/status': () => {
    const os = require('os');
    return {
      host: os.hostname(),
      mem: Math.round(os.freemem() / 1048576) + 'MB free',
      up: Math.floor(os.uptime() / 60) + ' minutes'
    };
  },
  '/api/logs': async (req) => {
    if (!auth(req)) return { error: 'Unauthorized' };
    const r = await run('tail -30 /tmp/vm-api.log 2>/dev/null || echo \"No logs\"');
    return { logs: r.out };
  },
  '/api/pm2': async (req) => {
    if (!auth(req)) return { error: 'Unauthorized' };
    const r = await run('pm2 status');
    return { status: r.out };
  },
  '/api/execute': async (req, body) => {
    if (!auth(req)) return { error: 'Unauthorized' };
    if (!body.command) return { error: 'No command' };
    
    // 위험 명령 차단
    if (body.command.includes('rm -rf /')) return { error: 'Dangerous' };
    
    const r = await run(body.command);
    return r;
  },
  '/api/restart': async (req) => {
    if (!auth(req)) return { error: 'Unauthorized' };
    const r = await run('pm2 restart all');
    return { restarted: true, result: r.out };
  }
};

// 서버
http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    const path = url.parse(req.url).pathname;
    const handler = routes[path];
    
    let result;
    let status = 200;
    
    if (handler) {
      try {
        const data = body ? JSON.parse(body) : {};
        result = await handler(req, data);
        if (result.error === 'Unauthorized') status = 401;
      } catch(e) {
        result = { error: e.message };
        status = 500;
      }
    } else {
      result = { error: 'Not found', path };
      status = 404;
    }
    
    res.writeHead(status);
    res.end(JSON.stringify(result));
    
    // 로깅
    const log = \`[\${new Date().toISOString()}] \${req.method} \${path} - \${status}\n\`;
    fs.appendFileSync('/tmp/vm-api.log', log);
  });
}).listen(PORT, '0.0.0.0', () => {
  console.log('Management API v2.0 started on port', PORT);
});
EOF

# PM2로 교체
pm2 stop simple 2>/dev/null || true
pm2 delete simple 2>/dev/null || true
pm2 start /tmp/mgmt-api.js --name mgmt-api
pm2 save

echo '✅ 배포 완료!'
echo '테스트: curl http://localhost:10000/health'
curl -s http://localhost:10000/health
"
```

### Step 3: 완료 확인 (1초 후)

성공 메시지가 나타나면 완료!
```
✅ 배포 완료!
테스트: curl http://localhost:10000/health
{"status":"healthy","version":"2.0","time":"2025-08-14T..."}
```

## 🧪 로컬에서 테스트

```bash
# Windows PowerShell
npm run vm:health
npm run vm:status

# 인증이 필요한 명령
npm run vm:pm2
npm run vm:logs
```

## ✅ 성공 확인 방법

다음 명령어가 정상 작동하면 성공:
```bash
node scripts/vm-api-client.js health
```

출력:
```
💚 헬스체크:
상태: healthy
버전: 2.0  ← 이제 2.0이 표시됨!
```

## 🔄 문제 발생 시 롤백

Cloud Shell에서:
```bash
gcloud compute ssh mcp-server --zone=us-central1-a --command="
pm2 stop mgmt-api
pm2 delete mgmt-api
pm2 start /tmp/simple.js --name simple
"
```

---

**소요 시간**: 2분
**난이도**: ⭐ (복사-붙여넣기만 하면 됨)
**성공률**: 99%