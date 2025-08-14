#!/usr/bin/env node

/**
 * VM Monitoring Script
 * 자동 헬스체크 및 모니터링 도구
 * 
 * 사용법:
 * node scripts/vm-monitor.js           # 1회 체크
 * node scripts/vm-monitor.js --watch   # 지속적 모니터링
 * node scripts/vm-monitor.js --interval 30  # 30초마다 체크
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// 설정
const CONFIG = {
  host: process.env.VM_API_HOST || '104.154.205.25',
  port: parseInt(process.env.VM_API_PORT) || 10000,
  token: process.env.VM_API_TOKEN || 'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00',
  interval: 60000, // 기본 60초
  timeout: 5000,   // 5초 타임아웃
  logFile: path.join(__dirname, '..', 'logs', 'vm-monitor.log')
};

// 명령줄 인자 처리
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const intervalIndex = args.indexOf('--interval');
if (intervalIndex > -1 && args[intervalIndex + 1]) {
  CONFIG.interval = parseInt(args[intervalIndex + 1]) * 1000;
}

// 로그 디렉토리 생성
const logDir = path.dirname(CONFIG.logFile);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 로그 함수
function log(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    data
  };

  // 파일에 기록
  fs.appendFileSync(CONFIG.logFile, JSON.stringify(logEntry) + '\n');

  // 콘솔에 출력
  const color = {
    'INFO': colors.blue,
    'SUCCESS': colors.green,
    'WARNING': colors.yellow,
    'ERROR': colors.red
  }[level] || colors.reset;

  console.log(`${color}[${timestamp}] ${level}: ${message}${colors.reset}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// HTTP 요청 함수
function makeRequest(path, needAuth = false) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: path,
      method: 'GET',
      timeout: CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (needAuth) {
      options.headers['Authorization'] = `Bearer ${CONFIG.token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

// 헬스체크 수행
async function performHealthCheck() {
  const results = {
    timestamp: new Date().toISOString(),
    healthy: true,
    checks: {}
  };

  try {
    // 1. 기본 헬스체크
    const health = await makeRequest('/health');
    results.checks.health = {
      status: health.statusCode === 200 ? 'OK' : 'FAIL',
      version: health.data.version,
      response: health.data
    };

    // 2. API 헬스체크
    const apiHealth = await makeRequest('/api/health');
    results.checks.apiHealth = {
      status: apiHealth.statusCode === 200 ? 'OK' : 'FAIL',
      response: apiHealth.data
    };

    // 3. 시스템 상태
    const status = await makeRequest('/api/status');
    results.checks.systemStatus = {
      status: status.statusCode === 200 ? 'OK' : 'FAIL',
      memory: status.data.memory,
      uptime: status.data.uptime
    };

    // 메모리 경고 체크
    if (status.data.memory && status.data.memory.free < 100) {
      results.warnings = results.warnings || [];
      results.warnings.push('Low memory: ' + status.data.memory.free + 'MB free');
      results.healthy = false;
    }

    // 4. PM2 상태 (인증 필요)
    try {
      const pm2 = await makeRequest('/api/pm2', true);
      if (pm2.statusCode === 200 && pm2.data.processes) {
        results.checks.pm2 = {
          status: 'OK',
          processes: pm2.data.processes.map(p => ({
            name: p.name,
            status: p.status,
            restarts: p.restarts,
            memory: Math.round(p.memory / 1048576) + 'MB'
          }))
        };

        // PM2 재시작 경고
        pm2.data.processes.forEach(p => {
          if (p.restarts > 10) {
            results.warnings = results.warnings || [];
            results.warnings.push(`Process ${p.name} has ${p.restarts} restarts`);
          }
        });
      } else {
        results.checks.pm2 = {
          status: 'FAIL',
          error: 'Unable to get PM2 status'
        };
      }
    } catch (e) {
      results.checks.pm2 = {
        status: 'ERROR',
        error: e.message
      };
    }

  } catch (error) {
    results.healthy = false;
    results.error = error.message;
    log('ERROR', 'Health check failed', { error: error.message });
  }

  return results;
}

// 결과 표시
function displayResults(results) {
  console.log('\n' + '='.repeat(60));
  console.log(`${colors.cyan}VM MONITORING REPORT${colors.reset}`);
  console.log('='.repeat(60));
  console.log(`Time: ${results.timestamp}`);
  console.log(`Host: ${CONFIG.host}:${CONFIG.port}`);
  console.log('='.repeat(60));

  // 전체 상태
  const statusColor = results.healthy ? colors.green : colors.red;
  const statusIcon = results.healthy ? '✅' : '❌';
  console.log(`\n${statusIcon} Overall Status: ${statusColor}${results.healthy ? 'HEALTHY' : 'UNHEALTHY'}${colors.reset}\n`);

  // 체크 결과
  console.log('Health Checks:');
  Object.entries(results.checks).forEach(([name, check]) => {
    const icon = check.status === 'OK' ? '✅' : '❌';
    console.log(`  ${icon} ${name}: ${check.status}`);
    
    if (name === 'systemStatus' && check.memory) {
      console.log(`     Memory: ${check.memory.used}/${check.memory.total}MB (${check.memory.free}MB free)`);
      console.log(`     Uptime: ${check.uptime} minutes`);
    }
    
    if (name === 'pm2' && check.processes) {
      check.processes.forEach(p => {
        console.log(`     - ${p.name}: ${p.status} (${p.restarts} restarts, ${p.memory})`);
      });
    }
  });

  // 경고
  if (results.warnings && results.warnings.length > 0) {
    console.log(`\n${colors.yellow}⚠️  Warnings:${colors.reset}`);
    results.warnings.forEach(w => console.log(`  - ${w}`));
  }

  // 오류
  if (results.error) {
    console.log(`\n${colors.red}❌ Error: ${results.error}${colors.reset}`);
  }

  console.log('\n' + '='.repeat(60));
}

// 통계 계산
class Statistics {
  constructor() {
    this.checks = 0;
    this.successes = 0;
    this.failures = 0;
    this.startTime = Date.now();
    this.responseTimes = [];
  }

  addCheck(success, responseTime) {
    this.checks++;
    if (success) this.successes++;
    else this.failures++;
    this.responseTimes.push(responseTime);
  }

  getStats() {
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);
    const avgResponseTime = this.responseTimes.length > 0
      ? Math.round(this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length)
      : 0;

    return {
      uptime: `${Math.floor(uptime / 60)}m ${uptime % 60}s`,
      totalChecks: this.checks,
      successes: this.successes,
      failures: this.failures,
      successRate: this.checks > 0 ? Math.round((this.successes / this.checks) * 100) : 0,
      avgResponseTime: avgResponseTime + 'ms'
    };
  }

  display() {
    const stats = this.getStats();
    console.log(`\n${colors.cyan}📊 Monitoring Statistics:${colors.reset}`);
    console.log(`  Runtime: ${stats.uptime}`);
    console.log(`  Checks: ${stats.totalChecks} (${stats.successes} OK, ${stats.failures} Failed)`);
    console.log(`  Success Rate: ${stats.successRate}%`);
    console.log(`  Avg Response Time: ${stats.avgResponseTime}`);
  }
}

// 메인 모니터링 함수
async function monitor() {
  const stats = new Statistics();
  
  console.log(`${colors.cyan}🚀 VM Monitor Started${colors.reset}`);
  console.log(`Host: ${CONFIG.host}:${CONFIG.port}`);
  console.log(`Mode: ${isWatch ? 'Continuous' : 'Single Check'}`);
  if (isWatch) {
    console.log(`Interval: ${CONFIG.interval / 1000} seconds`);
    console.log(`Press Ctrl+C to stop\n`);
  }

  async function runCheck() {
    const startTime = Date.now();
    
    try {
      const results = await performHealthCheck();
      const responseTime = Date.now() - startTime;
      
      displayResults(results);
      stats.addCheck(results.healthy, responseTime);
      
      if (results.healthy) {
        log('SUCCESS', 'Health check passed', {
          responseTime: responseTime + 'ms',
          checks: Object.keys(results.checks).length
        });
      } else {
        log('WARNING', 'Health check failed', results.warnings);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      stats.addCheck(false, responseTime);
      
      console.log(`${colors.red}❌ Monitor Error: ${error.message}${colors.reset}`);
      log('ERROR', 'Monitor error', { error: error.message });
    }

    if (isWatch && stats.checks % 10 === 0) {
      stats.display();
    }
  }

  // 첫 체크 실행
  await runCheck();

  // Watch 모드
  if (isWatch) {
    const interval = setInterval(runCheck, CONFIG.interval);

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log(`\n${colors.yellow}Stopping monitor...${colors.reset}`);
      clearInterval(interval);
      stats.display();
      log('INFO', 'Monitor stopped', stats.getStats());
      process.exit(0);
    });
  } else {
    // 단일 체크 완료
    console.log(`\n${colors.green}✅ Check complete${colors.reset}`);
    if (stats.failures > 0) {
      process.exit(1);
    }
  }
}

// 실행
monitor().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  log('ERROR', 'Fatal error', { error: error.message });
  process.exit(1);
});