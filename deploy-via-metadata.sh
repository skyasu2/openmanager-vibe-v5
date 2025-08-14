#!/bin/bash
# VM 메타데이터를 통한 배포 스크립트

cat > startup-script-deploy.sh << 'SCRIPT_EOF'
#!/bin/bash
# Management API 자동 배포 스크립트

# 로그 파일
LOG="/var/log/mgmt-api-deploy.log"
echo "$(date): Deployment started" >> $LOG

# Management API 생성
cat > /tmp/mgmt-api.js << 'API_EOF'
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const url = require('url');
const PORT = 10000;
const TOKEN = 'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00';

function validateToken(req) {
  const auth = req.headers['authorization'];
  return auth && auth.replace('Bearer ', '') === TOKEN;
}

function executeCmd(cmd) {
  return new Promise(r => {
    exec(cmd, (err, stdout, stderr) => {
      r({ success: !err, stdout: stdout || '', stderr: stderr || '' });
    });
  });
}

const routes = {
  '/health': () => ({ status: 'healthy', version: '2.0', port: PORT }),
  '/api/status': () => {
    const os = require('os');
    return {
      hostname: os.hostname(),
      memory: { free: os.freemem(), total: os.totalmem() },
      uptime: Math.floor(os.uptime() / 60)
    };
  },
  '/api/logs': async (req) => {
    if (!validateToken(req)) return { error: 'Unauthorized' };
    const result = await executeCmd('tail -50 /tmp/vm-api.log 2>/dev/null || echo "No logs"');
    return { logs: result.stdout };
  },
  '/api/pm2': async (req) => {
    if (!validateToken(req)) return { error: 'Unauthorized' };
    const result = await executeCmd('pm2 jlist');
    try {
      return { processes: JSON.parse(result.stdout || '[]') };
    } catch(e) {
      return { error: 'Failed to parse' };
    }
  },
  '/api/execute': async (req, body) => {
    if (!validateToken(req)) return { error: 'Unauthorized' };
    if (!body || !body.command) return { error: 'Command required' };
    return await executeCmd(body.command);
  }
};

const server = http.createServer(async (req, res) => {
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
        const parsed = body ? JSON.parse(body) : {};
        result = await handler(req, parsed);
        if (result.error === 'Unauthorized') status = 401;
      } catch(e) {
        result = { error: e.message };
        status = 500;
      }
    } else {
      result = { error: 'Not found' };
      status = 404;
    }
    
    res.writeHead(status);
    res.end(JSON.stringify(result));
    
    fs.appendFileSync('/tmp/vm-api.log', 
      `[${new Date().toISOString()}] ${req.method} ${path} - ${status}\n`);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('Management API v2.0 on port', PORT);
});
API_EOF

# PM2로 시작
cd /tmp
if command -v pm2 &> /dev/null; then
  pm2 stop simple 2>/dev/null || true
  pm2 delete simple 2>/dev/null || true
  pm2 start /tmp/mgmt-api.js --name mgmt-api
  pm2 save
  echo "$(date): PM2 started mgmt-api" >> $LOG
else
  echo "$(date): PM2 not found" >> $LOG
fi

echo "$(date): Deployment completed" >> $LOG
SCRIPT_EOF

echo "스크립트 생성됨: startup-script-deploy.sh"