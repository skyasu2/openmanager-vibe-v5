/**
 * GCP VM API 라우팅 수정 스크립트
 * VM에 SSH 접속 후 실행하세요
 * 작성일: 2025-08-14
 */

const express = require('express');
const app = express();
const PORT = process.env.PORT || 10000;

// CORS 설정
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON 파싱
app.use(express.json());

// 기본 헬스체크 (현재 작동 중)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// API 라우터 설정
const apiRouter = express.Router();

// API 헬스체크
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 시스템 상태
apiRouter.get('/status', (req, res) => {
  const os = require('os');
  res.json({
    status: 'online',
    system: {
      hostname: os.hostname(),
      platform: os.platform(),
      uptime: os.uptime(),
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      cpu: os.cpus()
    },
    timestamp: new Date().toISOString()
  });
});

// 메트릭 엔드포인트
apiRouter.get('/metrics', (req, res) => {
  const os = require('os');
  res.json({
    cpu: {
      usage: process.cpuUsage(),
      cores: os.cpus().length
    },
    memory: {
      heapUsed: process.memoryUsage().heapUsed,
      heapTotal: process.memoryUsage().heapTotal,
      external: process.memoryUsage().external,
      rss: process.memoryUsage().rss
    },
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// PM2 상태 (PM2 API 사용 시)
apiRouter.get('/pm2', (req, res) => {
  try {
    const pm2 = require('pm2');
    pm2.list((err, list) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({
        processes: list.map(proc => ({
          name: proc.name,
          status: proc.pm2_env.status,
          cpu: proc.monit.cpu,
          memory: proc.monit.memory,
          uptime: proc.pm2_env.pm_uptime,
          restarts: proc.pm2_env.restart_time
        })),
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    res.json({
      error: 'PM2 not available',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Google AI MCP 서버 프록시
apiRouter.post('/ai/chat', async (req, res) => {
  try {
    // 여기에 Google AI API 호출 로직 추가
    res.json({
      status: 'success',
      message: 'AI endpoint configured',
      request: req.body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// API 라우터 마운트 (중요!)
app.use('/api', apiRouter);

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// 에러 핸들러
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: err.message,
    timestamp: new Date().toISOString()
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MCP Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`✅ API Health: http://localhost:${PORT}/api/health`);
  console.log(`✅ API Status: http://localhost:${PORT}/api/status`);
  console.log(`✅ API Metrics: http://localhost:${PORT}/api/metrics`);
  console.log(`✅ API PM2: http://localhost:${PORT}/api/pm2`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});