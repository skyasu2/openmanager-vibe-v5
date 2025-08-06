/**
 * 🏥 Health Check Router
 * 
 * VM 서버 상태 모니터링 엔드포인트
 */

import { Router } from 'express';
import os from 'os';
import { sessionManager, deepAnalyzer, streamProcessor, feedbackLearner, memoryCache } from '../index';

const router = Router();

/**
 * GET /api/health
 * 기본 헬스 체크
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    service: 'vm-ai-backend'
  });
});

/**
 * GET /api/health/detailed
 * 상세 시스템 상태
 */
router.get('/detailed', (req, res) => {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    system: {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      cpus: os.cpus().length,
      loadAverage: os.loadavg()
    },
    process: {
      pid: process.pid,
      version: process.version,
      memoryUsage: {
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      },
      cpuUsage: {
        user: Math.round(cpuUsage.user / 1000) + ' ms',
        system: Math.round(cpuUsage.system / 1000) + ' ms'
      }
    },
    services: {
      sessionManager: sessionManager.getStats(),
      deepAnalyzer: deepAnalyzer.getStats(),
      streamProcessor: streamProcessor.getStats(),
      feedbackLearner: feedbackLearner.getMetrics(),
      memoryCache: memoryCache.getStats()
    }
  });
});

/**
 * GET /api/health/readiness
 * 준비 상태 체크 (쿠버네티스 호환)
 */
router.get('/readiness', async (req, res) => {
  try {
    // 각 서비스 체크
    const checks = {
      sessionManager: sessionManager.getStats().totalSessions >= 0,
      deepAnalyzer: deepAnalyzer.getStats().totalJobs >= 0,
      streamProcessor: streamProcessor.getStats().activeStreams >= 0,
      feedbackLearner: feedbackLearner.getMetrics().totalFeedbacks >= 0,
      memoryCache: memoryCache.getStats().totalEntries >= 0
    };
    
    const allHealthy = Object.values(checks).every(check => check === true);
    
    if (allHealthy) {
      res.json({
        status: 'ready',
        checks,
        timestamp: new Date()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        checks,
        timestamp: new Date()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

/**
 * GET /api/health/liveness
 * 생존 상태 체크 (쿠버네티스 호환)
 */
router.get('/liveness', (req, res) => {
  // 기본적인 응답이 가능하면 살아있는 것으로 판단
  res.json({
    status: 'alive',
    timestamp: new Date()
  });
});

export const healthRouter = router;