/**
 * 🖥️ VM Context API Server
 *
 * 포트 10001에서 동작하는 경량 컨텍스트 수집 API
 * 기존 MCP Server와 함께 동작 (포트 10000은 그대로 유지)
 */

const express = require('express');
const cors = require('cors');
const os = require('os');
const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = 10001;

// 미들웨어 설정
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// 기본 로깅
const log = message => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
};

// 시스템 정보 수집
async function getSystemInfo() {
  const startTime = Date.now();

  try {
    const systemInfo = {
      hostname: os.hostname(),
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg(),
      timestamp: Date.now(),
      responseTime: 0,
    };

    // 메모리 사용률 계산
    systemInfo.memoryUsage = {
      used: systemInfo.totalMemory - systemInfo.freeMemory,
      usedPercent:
        ((systemInfo.totalMemory - systemInfo.freeMemory) /
          systemInfo.totalMemory) *
        100,
      total: systemInfo.totalMemory,
      free: systemInfo.freeMemory,
    };

    // CPU 사용률 (간단한 로드 평균 기반)
    const load1min = systemInfo.loadAverage[0];
    systemInfo.cpuUsage = {
      loadAverage1m: load1min,
      loadPercent: Math.min((load1min / systemInfo.cpus) * 100, 100),
      cores: systemInfo.cpus,
    };

    systemInfo.responseTime = Date.now() - startTime;
    return systemInfo;
  } catch (error) {
    return {
      error: error.message,
      timestamp: Date.now(),
      responseTime: Date.now() - startTime,
    };
  }
}

// MCP 서버 상태 확인
async function getMCPStatus() {
  return new Promise(resolve => {
    exec(
      'curl -s http://localhost:10000/health || echo "MCP_OFFLINE"',
      (error, stdout, stderr) => {
        if (error || stdout.includes('MCP_OFFLINE')) {
          resolve({
            status: 'offline',
            port: 10000,
            error: error?.message || 'Connection failed',
          });
        } else {
          try {
            const response = JSON.parse(stdout);
            resolve({
              status: 'online',
              port: 10000,
              health: response,
            });
          } catch (parseError) {
            resolve({
              status: 'unknown',
              port: 10000,
              rawResponse: stdout.substring(0, 200),
            });
          }
        }
      }
    );
  });
}

// 간단한 메트릭 수집
async function getSimpleMetrics() {
  const metrics = {
    timestamp: Date.now(),
    system: {},
    process: {},
    disk: {},
  };

  try {
    // 프로세스 메트릭
    const processUsage = process.memoryUsage();
    metrics.process = {
      pid: process.pid,
      uptime: process.uptime(),
      memory: {
        rss: processUsage.rss,
        heapTotal: processUsage.heapTotal,
        heapUsed: processUsage.heapUsed,
        external: processUsage.external,
      },
      cpu: process.cpuUsage(),
    };

    // 디스크 사용량 (간단한 /tmp 체크)
    try {
      const stats = await fs.stat('/tmp');
      metrics.disk.tmp = {
        accessible: true,
        modified: stats.mtime,
      };
    } catch (diskError) {
      metrics.disk.tmp = {
        accessible: false,
        error: diskError.message,
      };
    }

    return metrics;
  } catch (error) {
    return {
      timestamp: Date.now(),
      error: error.message,
    };
  }
}

// API 엔드포인트들

// 기본 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'vm-context-api',
    port: PORT,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  });
});

// 시스템 컨텍스트
app.get('/context/system', async (req, res) => {
  try {
    log('System context requested');
    const systemInfo = await getSystemInfo();

    res.json({
      success: true,
      context: 'system',
      data: systemInfo,
      collectedAt: new Date().toISOString(),
    });
  } catch (error) {
    log(`System context error: ${error.message}`);
    res.status(500).json({
      success: false,
      context: 'system',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// MCP 컨텍스트
app.get('/context/mcp', async (req, res) => {
  try {
    log('MCP context requested');
    const mcpStatus = await getMCPStatus();

    res.json({
      success: true,
      context: 'mcp',
      data: mcpStatus,
      collectedAt: new Date().toISOString(),
    });
  } catch (error) {
    log(`MCP context error: ${error.message}`);
    res.status(500).json({
      success: false,
      context: 'mcp',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 메트릭 컨텍스트
app.get('/context/metrics', async (req, res) => {
  try {
    log('Metrics context requested');
    const metrics = await getSimpleMetrics();

    res.json({
      success: true,
      context: 'metrics',
      data: metrics,
      collectedAt: new Date().toISOString(),
    });
  } catch (error) {
    log(`Metrics context error: ${error.message}`);
    res.status(500).json({
      success: false,
      context: 'metrics',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 통합 컨텍스트 (모든 정보를 한 번에)
app.get('/context/all', async (req, res) => {
  try {
    log('All context requested');

    const [systemInfo, mcpStatus, metrics] = await Promise.all([
      getSystemInfo(),
      getMCPStatus(),
      getSimpleMetrics(),
    ]);

    res.json({
      success: true,
      context: 'all',
      data: {
        system: systemInfo,
        mcp: mcpStatus,
        metrics: metrics,
      },
      collectedAt: new Date().toISOString(),
    });
  } catch (error) {
    log(`All context error: ${error.message}`);
    res.status(500).json({
      success: false,
      context: 'all',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// 에러 핸들링
app.use((error, req, res, next) => {
  log(`Unhandled error: ${error.message}`);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: error.message,
    timestamp: new Date().toISOString(),
  });
});

// 404 핸들링
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} not found`,
    available: [
      'GET /health',
      'GET /context/system',
      'GET /context/mcp',
      'GET /context/metrics',
      'GET /context/all',
    ],
    timestamp: new Date().toISOString(),
  });
});

// 서버 시작
app.listen(PORT, '0.0.0.0', () => {
  log(`🚀 VM Context API Server started`);
  log(`📡 Listening on port ${PORT}`);
  log(`🔗 MCP Server: http://localhost:10000`);
  log(`🆔 Context API: http://localhost:${PORT}`);
  log(
    `💾 Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
  );

  // 시작 시 MCP 서버 상태 확인
  setTimeout(async () => {
    const mcpStatus = await getMCPStatus();
    log(`🔍 MCP Server: ${mcpStatus.status}`);
  }, 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('📴 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('📴 SIGINT received, shutting down gracefully');
  process.exit(0);
});
