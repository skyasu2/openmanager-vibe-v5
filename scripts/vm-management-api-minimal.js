#!/usr/bin/env node
// Minimal Management API for GCP VM (Node.js v12 compatible)
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const url = require('url');

const PORT = 10000;
const TOKEN = 'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00';
const LOG_FILE = '/tmp/vm-api.log';

function log(msg) {
  const entry = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(entry);
  fs.appendFileSync(LOG_FILE, entry);
}

function validateToken(req) {
  const auth = req.headers['authorization'];
  return auth && auth.replace('Bearer ', '') === TOKEN;
}

function executeCmd(cmd) {
  return new Promise(resolve => {
    exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
      resolve({ success: !err, stdout: stdout || '', stderr: stderr || '', error: err?.message });
    });
  });
}

async function parseBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); }
      catch(e) { resolve({}); }
    });
  });
}

const routes = {
  'GET /health': async () => ({ 
    status: 'healthy', 
    version: '2.0', 
    port: PORT,
    timestamp: new Date().toISOString()
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
      memory: {
        free: os.freemem(),
        total: os.totalmem(),
        percentage: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
      },
      uptime: Math.floor(os.uptime() / 60),
      timestamp: new Date().toISOString()
    };
  },
  
  'GET /api/metrics': async () => ({
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }),
  
  'GET /api/logs': async (req) => {
    if (!validateToken(req)) return { error: 'Unauthorized', code: 401 };
    const parsed = url.parse(req.url, true);
    const lines = parseInt(parsed.query.lines) || 50;
    const result = await executeCmd(`tail -n ${lines} ${LOG_FILE} 2>/dev/null || echo "No logs"`);
    return { success: true, logs: result.stdout, lines };
  },
  
  'POST /api/execute': async (req) => {
    if (!validateToken(req)) return { error: 'Unauthorized', code: 401 };
    const body = await parseBody(req);
    if (!body.command) return { error: 'Command required', code: 400 };
    
    const dangerous = ['rm -rf /', 'mkfs', 'dd if='];
    if (dangerous.some(d => body.command.includes(d))) {
      return { error: 'Dangerous command blocked', code: 403 };
    }
    
    log(`Executing: ${body.command}`);
    return await executeCmd(body.command);
  },
  
  'POST /api/deploy': async (req) => {
    if (!validateToken(req)) return { error: 'Unauthorized', code: 401 };
    const body = await parseBody(req);
    if (!body.code) return { error: 'Code required', code: 400 };
    
    const filename = body.filename || 'deployed.js';
    const filepath = `/tmp/${filename}`;
    
    fs.writeFileSync(filepath, body.code);
    log(`Deployed to ${filepath}`);
    
    const result = await executeCmd(`pm2 restart ${filename} || pm2 start ${filepath} --name ${filename}`);
    return { success: true, filepath, pm2: result };
  },
  
  'GET /api/pm2': async (req) => {
    if (!validateToken(req)) return { error: 'Unauthorized', code: 401 };
    const result = await executeCmd('pm2 jlist');
    try {
      const procs = JSON.parse(result.stdout || '[]');
      return {
        success: true,
        processes: procs.map(p => ({
          name: p.name,
          status: p.pm2_env?.status,
          cpu: p.monit?.cpu,
          memory: p.monit?.memory,
          uptime: p.pm2_env?.created_at ? Date.now() - p.pm2_env.created_at : 0,
          restarts: p.pm2_env?.restart_time || 0
        }))
      };
    } catch(e) {
      return { success: false, error: 'Failed to parse PM2 list' };
    }
  },
  
  'POST /api/restart': async (req) => {
    if (!validateToken(req)) return { error: 'Unauthorized', code: 401 };
    log('Restarting all PM2 services...');
    const result = await executeCmd('pm2 restart all');
    return { success: true, result };
  },
  
  'GET /api/files': async (req) => {
    if (!validateToken(req)) return { error: 'Unauthorized', code: 401 };
    const parsed = url.parse(req.url, true);
    const dir = parsed.query.dir || '/tmp';
    
    const allowedDirs = ['/tmp', '/var/log'];
    if (!allowedDirs.some(d => dir.startsWith(d))) {
      return { error: 'Directory not allowed', code: 403 };
    }
    
    try {
      const files = fs.readdirSync(dir).map(file => {
        const filepath = require('path').join(dir, file);
        const stats = fs.statSync(filepath);
        return {
          name: file,
          path: filepath,
          size: stats.size,
          modified: stats.mtime,
          isDirectory: stats.isDirectory()
        };
      });
      return { success: true, directory: dir, files };
    } catch(e) {
      return { success: false, error: e.message };
    }
  }
};

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
  
  const routeKey = `${req.method} ${url.parse(req.url).pathname}`;
  const handler = routes[routeKey];
  
  let result;
  let statusCode = 200;
  
  if (handler) {
    try {
      result = await handler(req);
      if (result.code) {
        statusCode = result.code;
        delete result.code;
      }
    } catch(e) {
      result = { error: e.message };
      statusCode = 500;
    }
  } else {
    result = { error: 'Not found', path: req.url };
    statusCode = 404;
  }
  
  res.writeHead(statusCode);
  res.end(JSON.stringify(result, null, 2));
  
  log(`${req.method} ${req.url} - ${statusCode}`);
});

server.listen(PORT, '0.0.0.0', () => {
  log(`Management API v2.0 started on port ${PORT}`);
  console.log(`
========================================
VM Management API v2.0
========================================
Port: ${PORT}
Token: ${TOKEN.substring(0, 8)}...
Endpoints:
  GET  /health         - Health check
  GET  /api/status     - System status
  GET  /api/logs       - View logs
  POST /api/execute    - Execute command
  POST /api/deploy     - Deploy code
  GET  /api/files      - List files
  POST /api/restart    - Restart services
  GET  /api/pm2        - PM2 status
========================================
  `);
});

process.on('SIGTERM', () => {
  log('SIGTERM received');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  log('SIGINT received');
  server.close(() => process.exit(0));
});