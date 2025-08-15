#!/bin/bash
# GCP VM에 Management API 서버 배포 스크립트
# 실행: Cloud Shell에서 실행

set -e

echo "🚀 VM Management API v2.0 배포 시작..."
echo "==================================="

# 환경 변수
export API_TOKEN="f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00"
export VM_ZONE="us-central1-a"
export VM_NAME="mcp-server"

# 1. VM에 SSH 접속하여 배포
echo "📦 VM에 Management API 배포 중..."

gcloud compute ssh $VM_NAME --zone=$VM_ZONE --command="
# 기존 서버 백업
echo '백업 생성 중...'
if [ -f /tmp/simple.js ]; then
  cp /tmp/simple.js /tmp/simple.js.backup-\$(date +%Y%m%d-%H%M%S)
fi

# Management API 서버 코드 생성
echo 'Management API 서버 생성 중...'
cat > /tmp/management-api.js << 'SERVEREOF'
#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const url = require('url');

const PORT = 10000;
const API_TOKEN = process.env.API_TOKEN || '$API_TOKEN';

// 로그 파일
const LOG_FILE = '/tmp/vm-api.log';
const SERVER_FILE = '/tmp/simple.js';

// 로깅 함수
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = \`[\${timestamp}] \${message}\\n\`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage);
}

// 요청 본문 파싱
function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
  });
}

// API 토큰 검증
function validateToken(req) {
  const auth = req.headers['authorization'];
  if (!auth) return false;
  const token = auth.replace('Bearer ', '');
  return token === API_TOKEN;
}

// 명령 실행
function executeCommand(command) {
  return new Promise((resolve) => {
    exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: error.message, stderr });
      } else {
        resolve({ success: true, stdout, stderr });
      }
    });
  });
}

// API 라우터
const routes = {
  'GET /health': async () => ({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT,
    version: '2.0'
  }),

  'GET /api/health': async () => ({
    status: 'healthy',
    service: 'management-api',
    timestamp: new Date().toISOString()
  }),

  'GET /api/status': async () => {
    const os = require('os');
    return {
      status: 'online',
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem(),
        percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      timestamp: new Date().toISOString()
    };
  },

  'GET /api/metrics': async () => ({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }),

  'GET /api/logs': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    const parsedUrl = url.parse(req.url, true);
    const lines = parseInt(parsedUrl.query.lines) || 50;
    
    const result = await executeCommand(\`tail -n \${lines} \${LOG_FILE} 2>/dev/null || echo 'No logs yet'\`);
    return {
      success: true,
      logs: result.stdout,
      lines: lines
    };
  },

  'POST /api/execute': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    const body = await parseBody(req);
    const { command } = body;
    
    if (!command) {
      res.writeHead(400);
      return { error: 'Command required' };
    }

    // 위험한 명령어 차단
    const dangerous = ['rm -rf /', 'mkfs', 'dd if=', ':(){ :|:& };:'];
    if (dangerous.some(d => command.includes(d))) {
      res.writeHead(403);
      return { error: 'Dangerous command blocked' };
    }

    log(\`Executing: \${command}\`);
    return await executeCommand(command);
  },

  'POST /api/deploy': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    const body = await parseBody(req);
    const { code, filename = 'deployed.js' } = body;
    
    if (!code) {
      res.writeHead(400);
      return { error: 'Code required' };
    }

    const filepath = \`/tmp/\${filename}\`;
    
    fs.writeFileSync(filepath, code);
    log(\`Deployed to \${filepath}\`);
    
    const result = await executeCommand(\`pm2 restart \${filename} || pm2 start \${filepath} --name \${filename}\`);
    
    return {
      success: true,
      filepath: filepath,
      pm2: result
    };
  },

  'GET /api/files': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    const parsedUrl = url.parse(req.url, true);
    const dir = parsedUrl.query.dir || '/tmp';
    
    const allowedDirs = ['/tmp', '/var/log'];
    if (!allowedDirs.some(d => dir.startsWith(d))) {
      res.writeHead(403);
      return { error: 'Directory not allowed' };
    }

    const files = fs.readdirSync(dir).map(file => {
      const filepath = path.join(dir, file);
      const stats = fs.statSync(filepath);
      return {
        name: file,
        path: filepath,
        size: stats.size,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    });
    
    return {
      success: true,
      directory: dir,
      files: files
    };
  },

  'POST /api/restart': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    log('Restarting PM2 services...');
    const result = await executeCommand('pm2 restart all');
    
    return {
      success: true,
      result: result
    };
  },

  'GET /api/pm2': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    const result = await executeCommand('pm2 jlist');
    
    try {
      const processes = JSON.parse(result.stdout || '[]');
      return {
        success: true,
        processes: processes.map(p => ({
          name: p.name,
          status: p.pm2_env.status,
          cpu: p.monit.cpu,
          memory: p.monit.memory,
          uptime: Date.now() - p.pm2_env.created_at,
          restarts: p.pm2_env.restart_time
        }))
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

// HTTP 서버
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const routeKey = \`\${req.method} \${url.parse(req.url).pathname}\`;
  const handler = routes[routeKey];
  
  if (handler) {
    try {
      const result = await handler(req, res);
      if (!res.headersSent) {
        res.writeHead(res.statusCode || 200);
      }
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      log(\`Error: \${error.message}\`);
      if (!res.headersSent) {
        res.writeHead(500);
      }
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found', path: req.url }));
  }
  
  log(\`\${req.method} \${req.url} - \${res.statusCode}\`);
});

server.listen(PORT, '0.0.0.0', () => {
  log(\`Management API Server v2.0 running on port \${PORT}\`);
  console.log('Management API v2.0 started successfully');
});

process.on('SIGTERM', () => {
  log('SIGTERM received');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  log('SIGINT received');
  server.close(() => process.exit(0));
});
SERVEREOF

# PM2 환경변수 설정 및 재시작
echo 'PM2 설정 중...'
export API_TOKEN='$API_TOKEN'

# PM2로 전환
pm2 stop simple 2>/dev/null || true
pm2 delete simple 2>/dev/null || true
pm2 start /tmp/management-api.js --name management-api --env API_TOKEN='$API_TOKEN'
pm2 save

echo '✅ 배포 완료!'
"

# 2. 테스트
echo ""
echo "🧪 API 테스트 중..."
echo "==================================="

# 헬스체크
echo "1. 기본 헬스체크:"
curl -s http://104.154.205.25:10000/health | python3 -m json.tool || curl -s http://104.154.205.25:10000/health

echo ""
echo "2. API 상태 (인증 필요):"
curl -s -H "Authorization: Bearer $API_TOKEN" http://104.154.205.25:10000/api/status | python3 -m json.tool || curl -s -H "Authorization: Bearer $API_TOKEN" http://104.154.205.25:10000/api/status

echo ""
echo "3. PM2 상태 (인증 필요):"
curl -s -H "Authorization: Bearer $API_TOKEN" http://104.154.205.25:10000/api/pm2 | python3 -m json.tool || curl -s -H "Authorization: Bearer $API_TOKEN" http://104.154.205.25:10000/api/pm2

echo ""
echo "==================================="
echo "🎉 Management API v2.0 배포 완료!"
echo "==================================="
echo ""
echo "📝 중요 정보:"
echo "- API 엔드포인트: http://104.154.205.25:10000"
echo "- API 토큰: $API_TOKEN"
echo ""
echo "로컬에서 사용하려면 .env.local에 추가하세요:"
echo "VM_API_TOKEN=$API_TOKEN"
echo ""