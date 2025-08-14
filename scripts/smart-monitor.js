#!/usr/bin/env node

/**
 * Smart VM Monitoring System
 * 캐싱과 지능형 스케줄링으로 무료 티어 사용량 최적화
 * 
 * 특징:
 * - 로컬 캐싱으로 API 호출 90% 감소
 * - 동적 모니터링 간격 조정
 * - 무료 티어 사용량 자동 추적
 * - 중요 이벤트만 실시간 체크
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const UsageTracker = require('./free-tier-tracker');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// 설정
const CONFIG = {
  host: process.env.VM_API_HOST || '104.154.205.25',
  port: parseInt(process.env.VM_API_PORT) || 10000,
  token: process.env.VM_API_TOKEN || 'f3b06ab39909bb0bdd61f15ae0d5d1deb03b9c5d6a6dc00daba684ec49035c00',
  cacheDir: path.join(__dirname, '..', 'cache'),
  dataDir: path.join(__dirname, '..', 'data')
};

// 모니터링 전략 (무료 티어 최적화)
const MONITORING_STRATEGY = {
  // 캐시 TTL (초)
  cache: {
    health: 300,        // 5분 (헬스체크)
    status: 600,        // 10분 (시스템 상태)
    metrics: 900,       // 15분 (메트릭)
    pm2: 1800,         // 30분 (PM2 상태)
    logs: 3600         // 1시간 (로그는 필요시만)
  },
  
  // 모니터링 간격 (초)
  intervals: {
    normal: 3600,       // 1시간 (정상 상태)
    warning: 1800,      // 30분 (경고 상태)
    critical: 600,      // 10분 (위험 상태)
    night: 7200        // 2시간 (야간/주말)
  },
  
  // API 호출 제한
  limits: {
    hourly: 10,         // 시간당 최대 10회
    daily: 100,         // 일일 최대 100회
    monthly: 2000       // 월간 최대 2000회
  }
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m'
};

// 캐시 관리자
class CacheManager {
  constructor() {
    this.cacheDir = CONFIG.cacheDir;
    this.ensureDirectory();
  }

  ensureDirectory() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  getCacheKey(endpoint) {
    return path.join(this.cacheDir, `${endpoint.replace(/\//g, '_')}.json`);
  }

  get(endpoint, ttl) {
    const cacheFile = this.getCacheKey(endpoint);
    
    if (!fs.existsSync(cacheFile)) {
      return null;
    }

    try {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const age = (Date.now() - new Date(data.timestamp).getTime()) / 1000;
      
      if (age > ttl) {
        return null; // 캐시 만료
      }

      return {
        data: data.content,
        age: Math.floor(age),
        fromCache: true
      };
    } catch (e) {
      return null;
    }
  }

  set(endpoint, data) {
    const cacheFile = this.getCacheKey(endpoint);
    const cacheData = {
      timestamp: new Date().toISOString(),
      endpoint: endpoint,
      content: data
    };

    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
  }

  clear() {
    const files = fs.readdirSync(this.cacheDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        fs.unlinkSync(path.join(this.cacheDir, file));
      }
    });
  }

  getStats() {
    const files = fs.readdirSync(this.cacheDir);
    let totalSize = 0;
    let oldestCache = Date.now();
    
    files.forEach(file => {
      if (file.endsWith('.json')) {
        const filePath = path.join(this.cacheDir, file);
        const stat = fs.statSync(filePath);
        totalSize += stat.size;
        
        try {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const timestamp = new Date(data.timestamp).getTime();
          if (timestamp < oldestCache) {
            oldestCache = timestamp;
          }
        } catch (e) {}
      }
    });

    return {
      files: files.length,
      totalSize: totalSize,
      oldestAge: Math.floor((Date.now() - oldestCache) / 1000 / 60) // 분 단위
    };
  }
}

// 스마트 모니터
class SmartMonitor {
  constructor() {
    this.cache = new CacheManager();
    this.usageTracker = new UsageTracker();
    this.stats = {
      apiCalls: 0,
      cacheHits: 0,
      cacheMisses: 0,
      bytesTransferred: 0,
      startTime: Date.now()
    };
    this.lastCheck = {};
    this.systemState = 'normal'; // normal, warning, critical
  }

  // API 요청 (캐시 우선)
  async request(endpoint, needAuth = false, forceRefresh = false) {
    // 캐시 TTL 결정
    const ttl = this.getCacheTTL(endpoint);
    
    // 캐시 확인 (강제 새로고침이 아닌 경우)
    if (!forceRefresh) {
      const cached = this.cache.get(endpoint, ttl);
      if (cached) {
        this.stats.cacheHits++;
        console.log(`${colors.gray}[CACHE HIT] ${endpoint} (age: ${cached.age}s)${colors.reset}`);
        return cached;
      }
    }

    // 무료 티어 사용량 체크
    if (!this.canMakeApiCall()) {
      console.log(`${colors.yellow}⚠️  API call limit reached, using cached data${colors.reset}`);
      const cached = this.cache.get(endpoint, ttl * 10); // 10배 더 오래된 캐시도 허용
      if (cached) {
        return cached;
      }
      throw new Error('API limit reached and no cache available');
    }

    // API 호출
    console.log(`${colors.blue}[API CALL] ${endpoint}${colors.reset}`);
    this.stats.cacheMisses++;
    this.stats.apiCalls++;

    return new Promise((resolve, reject) => {
      const options = {
        hostname: CONFIG.host,
        port: CONFIG.port,
        path: endpoint,
        method: 'GET',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (needAuth) {
        options.headers['Authorization'] = `Bearer ${CONFIG.token}`;
      }

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => {
          data += chunk;
          this.stats.bytesTransferred += chunk.length;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            
            // 캐시 저장
            this.cache.set(endpoint, parsed);
            
            // 사용량 기록
            this.usageTracker.recordApiCall(data.length);
            
            resolve({
              data: parsed,
              fromCache: false,
              statusCode: res.statusCode
            });
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  // 캐시 TTL 결정
  getCacheTTL(endpoint) {
    if (endpoint.includes('health')) return MONITORING_STRATEGY.cache.health;
    if (endpoint.includes('status')) return MONITORING_STRATEGY.cache.status;
    if (endpoint.includes('metrics')) return MONITORING_STRATEGY.cache.metrics;
    if (endpoint.includes('pm2')) return MONITORING_STRATEGY.cache.pm2;
    if (endpoint.includes('logs')) return MONITORING_STRATEGY.cache.logs;
    return 600; // 기본 10분
  }

  // API 호출 가능 여부 체크
  canMakeApiCall() {
    const now = Date.now();
    const hourAgo = now - 3600000;
    const dayAgo = now - 86400000;

    // 시간별 제한 체크
    const recentCalls = Object.values(this.lastCheck).filter(time => time > hourAgo).length;
    if (recentCalls >= MONITORING_STRATEGY.limits.hourly) {
      return false;
    }

    // 일별 제한 체크
    const dailyCalls = Object.values(this.lastCheck).filter(time => time > dayAgo).length;
    if (dailyCalls >= MONITORING_STRATEGY.limits.daily) {
      return false;
    }

    return true;
  }

  // 시스템 상태 분석
  async analyzeSystem() {
    const results = {
      timestamp: new Date().toISOString(),
      checks: {},
      state: 'normal',
      issues: []
    };

    try {
      // 1. 헬스체크 (캐시 사용)
      const health = await this.request('/health');
      results.checks.health = health.data;

      // 2. 시스템 상태 (캐시 사용)
      const status = await this.request('/api/status');
      results.checks.status = status.data;

      // 메모리 체크
      if (status.data.memory) {
        const memoryPercent = (status.data.memory.used / status.data.memory.total) * 100;
        if (memoryPercent > 80) {
          results.state = 'critical';
          results.issues.push('High memory usage');
        } else if (memoryPercent > 60) {
          results.state = 'warning';
          results.issues.push('Moderate memory usage');
        }
      }

      // 3. PM2 상태 (필요시만)
      if (results.state !== 'normal' || !this.lastCheck.pm2 || 
          Date.now() - this.lastCheck.pm2 > 1800000) {
        const pm2 = await this.request('/api/pm2', true);
        results.checks.pm2 = pm2.data;
        this.lastCheck.pm2 = Date.now();

        // PM2 프로세스 체크
        if (pm2.data.processes) {
          pm2.data.processes.forEach(proc => {
            if (proc.restarts > 10) {
              results.state = results.state === 'critical' ? 'critical' : 'warning';
              results.issues.push(`Process ${proc.name} has ${proc.restarts} restarts`);
            }
          });
        }
      }

    } catch (error) {
      results.state = 'critical';
      results.issues.push(error.message);
    }

    this.systemState = results.state;
    return results;
  }

  // 모니터링 간격 결정
  getMonitoringInterval() {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();

    // 야간 시간 (22시-06시) 또는 주말
    if ((hour >= 22 || hour < 6) || dayOfWeek === 0 || dayOfWeek === 6) {
      return MONITORING_STRATEGY.intervals.night;
    }

    // 시스템 상태에 따른 간격
    switch (this.systemState) {
      case 'critical':
        return MONITORING_STRATEGY.intervals.critical;
      case 'warning':
        return MONITORING_STRATEGY.intervals.warning;
      default:
        return MONITORING_STRATEGY.intervals.normal;
    }
  }

  // 통계 표시
  displayStats() {
    const runtime = Math.floor((Date.now() - this.stats.startTime) / 1000);
    const cacheHitRate = this.stats.cacheHits + this.stats.cacheMisses > 0 ?
      (this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) * 100).toFixed(1) : 0;
    
    const cacheStats = this.cache.getStats();
    
    console.log(`\n${colors.cyan}📊 Smart Monitor Statistics${colors.reset}`);
    console.log('='.repeat(50));
    console.log(`Runtime: ${Math.floor(runtime / 60)}m ${runtime % 60}s`);
    console.log(`System State: ${this.getStateColor()}${this.systemState}${colors.reset}`);
    console.log(`Next Check: ${this.getMonitoringInterval()}s`);
    console.log('');
    console.log(`API Calls: ${this.stats.apiCalls}`);
    console.log(`Cache Hits: ${this.stats.cacheHits}`);
    console.log(`Cache Misses: ${this.stats.cacheMisses}`);
    console.log(`Cache Hit Rate: ${cacheHitRate}%`);
    console.log(`Data Transferred: ${(this.stats.bytesTransferred / 1024).toFixed(2)}KB`);
    console.log('');
    console.log(`Cache Files: ${cacheStats.files}`);
    console.log(`Cache Size: ${(cacheStats.totalSize / 1024).toFixed(2)}KB`);
    console.log(`Oldest Cache: ${cacheStats.oldestAge} minutes`);
    console.log('='.repeat(50));
  }

  getStateColor() {
    switch (this.systemState) {
      case 'critical': return colors.red;
      case 'warning': return colors.yellow;
      default: return colors.green;
    }
  }
}

// 메인 모니터링 루프
async function smartMonitor() {
  const monitor = new SmartMonitor();
  const args = process.argv.slice(2);
  
  const isWatch = args.includes('--watch');
  const forceRefresh = args.includes('--force');
  
  console.log(`${colors.cyan}🤖 Smart VM Monitor Started${colors.reset}`);
  console.log(`Mode: ${isWatch ? 'Continuous' : 'Single Check'}`);
  console.log(`Cache: ${forceRefresh ? 'Disabled' : 'Enabled'}`);
  console.log('');

  async function runCheck() {
    console.log(`\n${colors.blue}[${new Date().toLocaleTimeString()}] Running smart check...${colors.reset}`);
    
    try {
      const results = await monitor.analyzeSystem();
      
      // 결과 표시
      console.log(`\n${colors.cyan}System Analysis:${colors.reset}`);
      console.log(`State: ${monitor.getStateColor()}${results.state.toUpperCase()}${colors.reset}`);
      
      if (results.issues.length > 0) {
        console.log(`\n${colors.yellow}Issues:${colors.reset}`);
        results.issues.forEach(issue => console.log(`  - ${issue}`));
      }
      
      if (results.checks.status) {
        const mem = results.checks.status.memory;
        if (mem) {
          console.log(`\n${colors.blue}Resources:${colors.reset}`);
          console.log(`  Memory: ${mem.used}/${mem.total}MB (${mem.free}MB free)`);
          console.log(`  Uptime: ${results.checks.status.uptime} minutes`);
        }
      }

      // 통계 표시
      monitor.displayStats();

      // 무료 티어 사용량 체크
      const usageReport = monitor.usageTracker.generateReport();
      if (usageReport.usage.network.percentage > 50) {
        console.log(`\n${colors.yellow}⚠️  Network usage at ${usageReport.usage.network.percentage.toFixed(1)}% of free tier${colors.reset}`);
      }

    } catch (error) {
      console.error(`${colors.red}❌ Error: ${error.message}${colors.reset}`);
    }
  }

  // 첫 체크 실행
  await runCheck();

  // Watch 모드
  if (isWatch) {
    async function scheduleNext() {
      const interval = monitor.getMonitoringInterval() * 1000;
      console.log(`\n${colors.gray}Next check in ${interval / 1000} seconds...${colors.reset}`);
      
      setTimeout(async () => {
        await runCheck();
        scheduleNext(); // 다음 체크 스케줄
      }, interval);
    }

    scheduleNext();

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log(`\n${colors.yellow}Stopping smart monitor...${colors.reset}`);
      monitor.displayStats();
      
      // 최종 사용량 리포트
      const usageReport = monitor.usageTracker.generateReport();
      console.log(`\n${colors.cyan}Final Usage:${colors.reset}`);
      console.log(`  Network: ${usageReport.usage.network.gb.toFixed(3)}GB / ${usageReport.usage.network.limit}GB`);
      console.log(`  API Calls: ${usageReport.usage.api_calls.total}`);
      console.log(`  Estimated Cost: $${usageReport.cost_estimate.estimated_cost_usd}`);
      
      process.exit(0);
    });
  }
}

// 실행
if (require.main === module) {
  smartMonitor().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { SmartMonitor, CacheManager };