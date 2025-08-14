#!/usr/bin/env node

/**
 * GCP VM Management API Server
 * SSH 없이 API로 VM을 관리하기 위한 서버
 * Node.js v12 호환 (Express 없이 내장 모듈만 사용)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const crypto = require('crypto');
const url = require('url');
const querystring = require('querystring');

const PORT = 10000;
const API_TOKEN = process.env.API_TOKEN || 'dev-token-2025'; // 프로덕션에서는 환경변수 사용

// 로그 파일 경로
const LOG_FILE = '/tmp/vm-api.log';
const SERVER_FILE = '/tmp/simple.js';

// 로깅 함수
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage);
}

// 요청 본문 파싱
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// API 토큰 검증
function validateToken(req) {
  const auth = req.headers['authorization'];
  if (!auth) return false;
  const token = auth.replace('Bearer ', '');
  return token === API_TOKEN;
}

// 명령 실행 함수
function executeCommand(command) {
  return new Promise((resolve, reject) => {
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
  // 기존 헬스체크 엔드포인트
  'GET /health': async (req, res) => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      port: PORT,
      version: '2.0'
    };
  },

  'GET /api/health': async (req, res) => {
    return {
      status: 'healthy',
      service: 'management-api',
      timestamp: new Date().toISOString()
    };
  },

  'GET /api/status': async (req, res) => {
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

  'GET /api/metrics': async (req, res) => {
    return {
      memory: process.memoryUsage(),
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    };
  },

  // 관리 API 엔드포인트
  'GET /api/logs': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    const parsedUrl = url.parse(req.url, true);
    const lines = parseInt(parsedUrl.query.lines) || 50;
    
    try {
      const result = await executeCommand(`tail -n ${lines} ${LOG_FILE}`);
      return {
        success: true,
        logs: result.stdout,
        lines: lines
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
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

    log(`Executing command: ${command}`);
    const result = await executeCommand(command);
    return result;
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

    const filepath = `/tmp/${filename}`;
    
    try {
      fs.writeFileSync(filepath, code);
      log(`Deployed code to ${filepath}`);
      
      // PM2로 재시작
      const result = await executeCommand(`pm2 restart ${filename} || pm2 start ${filepath} --name ${filename}`);
      
      return {
        success: true,
        filepath: filepath,
        pm2: result
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  'GET /api/files': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    const parsedUrl = url.parse(req.url, true);
    const dir = parsedUrl.query.dir || '/tmp';
    
    // 안전한 디렉토리만 허용
    const allowedDirs = ['/tmp', '/var/log'];
    if (!allowedDirs.some(d => dir.startsWith(d))) {
      res.writeHead(403);
      return { error: 'Directory not allowed' };
    }

    try {
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
    } catch (e) {
      return { success: false, error: e.message };
    }
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
  },

  'POST /api/update-server': async (req, res) => {
    if (!validateToken(req)) {
      res.writeHead(401);
      return { error: 'Unauthorized' };
    }

    const body = await parseBody(req);
    const { serverCode } = body;
    
    if (!serverCode) {
      res.writeHead(400);
      return { error: 'Server code required' };
    }

    try {
      // 백업 생성
      if (fs.existsSync(SERVER_FILE)) {
        fs.copyFileSync(SERVER_FILE, `${SERVER_FILE}.backup`);
      }
      
      // 새 코드 저장
      fs.writeFileSync(SERVER_FILE, serverCode);
      log('Server code updated');
      
      // PM2로 재시작
      const result = await executeCommand('pm2 restart simple');
      
      return {
        success: true,
        message: 'Server updated and restarted',
        pm2: result
      };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};

// HTTP 서버
const server = http.createServer(async (req, res) => {
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
  
  // 라우트 매칭
  const routeKey = `${req.method} ${url.parse(req.url).pathname}`;
  const handler = routes[routeKey];
  
  if (handler) {
    try {
      const result = await handler(req, res);
      if (!res.headersSent) {
        res.writeHead(res.statusCode || 200);
      }
      res.end(JSON.stringify(result, null, 2));
    } catch (error) {
      log(`Error: ${error.message}`);
      if (!res.headersSent) {
        res.writeHead(500);
      }
      res.end(JSON.stringify({ error: error.message }));
    }
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not Found', path: req.url }));
  }
  
  // 요청 로깅
  log(`${req.method} ${req.url} - ${res.statusCode}`);
});

// 서버 시작
server.listen(PORT, '0.0.0.0', () => {
  log(`Management API Server running on port ${PORT}`);
  console.log(`
  ========================================
  VM Management API Server v2.0
  ========================================
  Port: ${PORT}
  Token: ${API_TOKEN}
  
  Endpoints:
  - GET  /health           - Health check
  - GET  /api/status       - System status
  - GET  /api/logs         - View logs
  - POST /api/execute      - Execute command
  - POST /api/deploy       - Deploy code
  - GET  /api/files        - List files
  - POST /api/restart      - Restart services
  - GET  /api/pm2          - PM2 status
  - POST /api/update-server - Update server code
  ========================================
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('SIGTERM received, closing server...');
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  log('SIGINT received, closing server...');
  server.close(() => process.exit(0));
});