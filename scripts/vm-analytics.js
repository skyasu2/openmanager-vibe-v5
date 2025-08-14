#!/usr/bin/env node

/**
 * VM Analytics Tool
 * PM2 로그 분석 및 패턴 감지 도구
 * 
 * 사용법:
 * node scripts/vm-analytics.js          # 기본 분석
 * node scripts/vm-analytics.js --deep   # 심화 분석
 * node scripts/vm-analytics.js --export # 결과를 파일로 저장
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
  reportDir: path.join(__dirname, '..', 'reports')
};

// 명령줄 인자 처리
const args = process.argv.slice(2);
const isDeep = args.includes('--deep');
const shouldExport = args.includes('--export');

// 리포트 디렉토리 생성
if (!fs.existsSync(CONFIG.reportDir)) {
  fs.mkdirSync(CONFIG.reportDir, { recursive: true });
}

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// API 요청 함수
function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.token}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

// 로그 분석 클래스
class LogAnalyzer {
  constructor() {
    this.patterns = {
      errors: [],
      warnings: [],
      restarts: [],
      memoryIssues: [],
      timeouts: []
    };
    this.timeline = [];
  }

  analyze(logs) {
    const lines = logs.split('\n');
    
    lines.forEach(line => {
      // 타임스탬프 추출
      const timestampMatch = line.match(/\[([\d-T:.Z]+)\]/);
      const timestamp = timestampMatch ? new Date(timestampMatch[1]) : null;

      // 에러 패턴
      if (/error|exception|fatal/i.test(line)) {
        this.patterns.errors.push({
          timestamp,
          line: line.substring(0, 200),
          type: this.classifyError(line)
        });
      }

      // 경고 패턴
      if (/warning|warn/i.test(line)) {
        this.patterns.warnings.push({
          timestamp,
          line: line.substring(0, 200)
        });
      }

      // 재시작 패턴
      if (/restart|restarting|reloading/i.test(line)) {
        this.patterns.restarts.push({
          timestamp,
          line: line.substring(0, 200)
        });
      }

      // 메모리 이슈
      if (/memory|heap|oom|out of memory/i.test(line)) {
        this.patterns.memoryIssues.push({
          timestamp,
          line: line.substring(0, 200)
        });
      }

      // 타임아웃
      if (/timeout|timed out/i.test(line)) {
        this.patterns.timeouts.push({
          timestamp,
          line: line.substring(0, 200)
        });
      }

      // 타임라인 생성
      if (timestamp) {
        this.timeline.push({
          timestamp,
          type: this.getEventType(line),
          summary: line.substring(0, 100)
        });
      }
    });

    return this.generateReport();
  }

  classifyError(line) {
    if (/EADDRINUSE/i.test(line)) return 'PORT_IN_USE';
    if (/ECONNREFUSED/i.test(line)) return 'CONNECTION_REFUSED';
    if (/ENOTFOUND/i.test(line)) return 'NOT_FOUND';
    if (/ENOMEM/i.test(line)) return 'OUT_OF_MEMORY';
    if (/uncaught/i.test(line)) return 'UNCAUGHT_EXCEPTION';
    return 'UNKNOWN';
  }

  getEventType(line) {
    if (/error/i.test(line)) return 'ERROR';
    if (/warning/i.test(line)) return 'WARNING';
    if (/restart/i.test(line)) return 'RESTART';
    if (/start/i.test(line)) return 'START';
    if (/stop/i.test(line)) return 'STOP';
    return 'INFO';
  }

  generateReport() {
    return {
      summary: {
        totalErrors: this.patterns.errors.length,
        totalWarnings: this.patterns.warnings.length,
        totalRestarts: this.patterns.restarts.length,
        memoryIssues: this.patterns.memoryIssues.length,
        timeouts: this.patterns.timeouts.length
      },
      patterns: this.patterns,
      timeline: this.timeline.slice(-20), // 최근 20개 이벤트
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.patterns.restarts.length > 5) {
      recommendations.push({
        level: 'HIGH',
        issue: 'Frequent restarts detected',
        solution: 'Check for memory leaks or uncaught exceptions'
      });
    }

    if (this.patterns.memoryIssues.length > 0) {
      recommendations.push({
        level: 'HIGH',
        issue: 'Memory issues detected',
        solution: 'Increase memory limit or optimize memory usage'
      });
    }

    const portErrors = this.patterns.errors.filter(e => e.type === 'PORT_IN_USE');
    if (portErrors.length > 0) {
      recommendations.push({
        level: 'CRITICAL',
        issue: 'Port conflict detected',
        solution: 'Check for duplicate processes or change port'
      });
    }

    if (this.patterns.timeouts.length > 3) {
      recommendations.push({
        level: 'MEDIUM',
        issue: 'Multiple timeouts detected',
        solution: 'Increase timeout limits or optimize slow operations'
      });
    }

    return recommendations;
  }
}

// PM2 프로세스 분석
class PM2Analyzer {
  analyze(processes) {
    const analysis = {
      processes: [],
      health: 'GOOD',
      issues: []
    };

    processes.forEach(proc => {
      const procAnalysis = {
        name: proc.name,
        status: proc.status,
        health: this.getProcessHealth(proc),
        metrics: {
          cpu: proc.cpu,
          memory: Math.round(proc.memory / 1048576) + 'MB',
          restarts: proc.restarts
        },
        issues: []
      };

      // 재시작 횟수 분석
      if (proc.restarts > 10) {
        procAnalysis.issues.push('High restart count');
        analysis.health = 'WARNING';
      }

      if (proc.restarts > 20) {
        procAnalysis.issues.push('Critical restart count');
        analysis.health = 'CRITICAL';
      }

      // 메모리 사용량 분석
      const memoryMB = proc.memory / 1048576;
      if (memoryMB > 200) {
        procAnalysis.issues.push('High memory usage');
      }

      // CPU 사용량 분석
      if (proc.cpu > 80) {
        procAnalysis.issues.push('High CPU usage');
      }

      analysis.processes.push(procAnalysis);

      if (procAnalysis.issues.length > 0) {
        analysis.issues.push({
          process: proc.name,
          issues: procAnalysis.issues
        });
      }
    });

    return analysis;
  }

  getProcessHealth(proc) {
    if (proc.status !== 'online') return 'OFFLINE';
    if (proc.restarts > 20) return 'CRITICAL';
    if (proc.restarts > 10) return 'WARNING';
    if (proc.restarts > 5) return 'UNSTABLE';
    return 'HEALTHY';
  }
}

// 시스템 메트릭 분석
class SystemAnalyzer {
  analyze(status, metrics) {
    const analysis = {
      memory: this.analyzeMemory(status.memory),
      uptime: this.analyzeUptime(status.uptime),
      performance: this.analyzePerformance(metrics),
      recommendations: []
    };

    // 메모리 권장사항
    if (analysis.memory.usagePercent > 80) {
      analysis.recommendations.push({
        type: 'MEMORY',
        message: 'Memory usage is high. Consider upgrading VM or optimizing applications.'
      });
    }

    // Uptime 권장사항
    if (analysis.uptime.minutes < 60) {
      analysis.recommendations.push({
        type: 'STABILITY',
        message: 'System was recently restarted. Monitor for stability issues.'
      });
    }

    return analysis;
  }

  analyzeMemory(memory) {
    const usagePercent = Math.round((memory.used / memory.total) * 100);
    return {
      total: memory.total + 'MB',
      used: memory.used + 'MB',
      free: memory.free + 'MB',
      usagePercent,
      status: usagePercent > 80 ? 'HIGH' : usagePercent > 60 ? 'MODERATE' : 'GOOD'
    };
  }

  analyzeUptime(uptimeMinutes) {
    const hours = Math.floor(uptimeMinutes / 60);
    const days = Math.floor(hours / 24);
    
    return {
      minutes: uptimeMinutes,
      formatted: `${days}d ${hours % 24}h ${uptimeMinutes % 60}m`,
      status: uptimeMinutes < 60 ? 'RECENT_RESTART' : uptimeMinutes < 1440 ? 'STABLE' : 'LONG_RUNNING'
    };
  }

  analyzePerformance(metrics) {
    return {
      processMemory: {
        rss: Math.round(metrics.memory.rss / 1048576) + 'MB',
        heap: Math.round(metrics.memory.heapUsed / 1048576) + 'MB',
        heapPercent: Math.round((metrics.memory.heapUsed / metrics.memory.heapTotal) * 100)
      },
      uptime: Math.round(metrics.uptime / 60) + ' minutes'
    };
  }
}

// 리포트 생성
function generateReport(data) {
  const report = {
    generated: new Date().toISOString(),
    host: `${CONFIG.host}:${CONFIG.port}`,
    summary: {
      overallHealth: determineOverallHealth(data),
      criticalIssues: countCriticalIssues(data),
      warnings: countWarnings(data)
    },
    ...data
  };

  return report;
}

function determineOverallHealth(data) {
  if (data.pm2Analysis && data.pm2Analysis.health === 'CRITICAL') return 'CRITICAL';
  if (data.logAnalysis && data.logAnalysis.summary.totalErrors > 10) return 'WARNING';
  if (data.systemAnalysis && data.systemAnalysis.memory.usagePercent > 80) return 'WARNING';
  return 'HEALTHY';
}

function countCriticalIssues(data) {
  let count = 0;
  if (data.logAnalysis) {
    data.logAnalysis.recommendations.forEach(r => {
      if (r.level === 'CRITICAL' || r.level === 'HIGH') count++;
    });
  }
  if (data.pm2Analysis && data.pm2Analysis.health === 'CRITICAL') count++;
  return count;
}

function countWarnings(data) {
  let count = 0;
  if (data.logAnalysis) {
    count += data.logAnalysis.summary.totalWarnings;
  }
  if (data.pm2Analysis && data.pm2Analysis.health === 'WARNING') count++;
  return count;
}

// 리포트 표시
function displayReport(report) {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📊 VM ANALYTICS REPORT${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`Generated: ${report.generated}`);
  console.log(`Host: ${report.host}`);
  console.log('='.repeat(70));

  // 전체 상태
  const healthColor = report.summary.overallHealth === 'HEALTHY' ? colors.green :
                      report.summary.overallHealth === 'WARNING' ? colors.yellow : colors.red;
  console.log(`\n${healthColor}Overall Health: ${report.summary.overallHealth}${colors.reset}`);
  console.log(`Critical Issues: ${report.summary.criticalIssues}`);
  console.log(`Warnings: ${report.summary.warnings}`);

  // 시스템 분석
  if (report.systemAnalysis) {
    console.log(`\n${colors.blue}📈 System Analysis:${colors.reset}`);
    console.log(`  Memory: ${report.systemAnalysis.memory.used}/${report.systemAnalysis.memory.total} (${report.systemAnalysis.memory.usagePercent}%)`);
    console.log(`  Status: ${report.systemAnalysis.memory.status}`);
    console.log(`  Uptime: ${report.systemAnalysis.uptime.formatted}`);
  }

  // PM2 분석
  if (report.pm2Analysis) {
    console.log(`\n${colors.magenta}🔄 PM2 Analysis:${colors.reset}`);
    report.pm2Analysis.processes.forEach(proc => {
      const healthColor = proc.health === 'HEALTHY' ? colors.green :
                         proc.health === 'WARNING' ? colors.yellow : colors.red;
      console.log(`  ${proc.name}: ${healthColor}${proc.health}${colors.reset}`);
      console.log(`    Restarts: ${proc.metrics.restarts}, Memory: ${proc.metrics.memory}, CPU: ${proc.metrics.cpu}%`);
      if (proc.issues.length > 0) {
        console.log(`    Issues: ${proc.issues.join(', ')}`);
      }
    });
  }

  // 로그 분석
  if (report.logAnalysis && isDeep) {
    console.log(`\n${colors.yellow}📝 Log Analysis:${colors.reset}`);
    console.log(`  Errors: ${report.logAnalysis.summary.totalErrors}`);
    console.log(`  Warnings: ${report.logAnalysis.summary.totalWarnings}`);
    console.log(`  Restarts: ${report.logAnalysis.summary.totalRestarts}`);
    console.log(`  Memory Issues: ${report.logAnalysis.summary.memoryIssues}`);
    console.log(`  Timeouts: ${report.logAnalysis.summary.timeouts}`);
  }

  // 권장사항
  const allRecommendations = [];
  
  if (report.logAnalysis && report.logAnalysis.recommendations) {
    allRecommendations.push(...report.logAnalysis.recommendations);
  }
  
  if (report.systemAnalysis && report.systemAnalysis.recommendations) {
    allRecommendations.push(...report.systemAnalysis.recommendations);
  }

  if (allRecommendations.length > 0) {
    console.log(`\n${colors.cyan}💡 Recommendations:${colors.reset}`);
    allRecommendations.forEach(rec => {
      const levelColor = rec.level === 'CRITICAL' ? colors.red :
                        rec.level === 'HIGH' ? colors.yellow : colors.blue;
      if (rec.level) {
        console.log(`  ${levelColor}[${rec.level}]${colors.reset} ${rec.issue}`);
        console.log(`    → ${rec.solution}`);
      } else {
        console.log(`  [${rec.type}] ${rec.message}`);
      }
    });
  }

  console.log('\n' + '='.repeat(70));
}

// 메인 분석 함수
async function analyze() {
  console.log(`${colors.cyan}🔍 Starting VM Analytics...${colors.reset}`);
  console.log(`Mode: ${isDeep ? 'Deep Analysis' : 'Basic Analysis'}`);
  
  const analysisData = {};

  try {
    // 1. 시스템 상태 분석
    console.log('\n📊 Fetching system status...');
    const statusResponse = await apiRequest('/api/status');
    const metricsResponse = await apiRequest('/api/metrics');
    
    if (statusResponse.statusCode === 200 && metricsResponse.statusCode === 200) {
      const systemAnalyzer = new SystemAnalyzer();
      analysisData.systemAnalysis = systemAnalyzer.analyze(
        statusResponse.data,
        metricsResponse.data
      );
      console.log('✅ System analysis complete');
    } else {
      console.log('❌ Failed to fetch system status');
    }

    // 2. PM2 프로세스 분석
    console.log('\n🔄 Analyzing PM2 processes...');
    const pm2Response = await apiRequest('/api/pm2');
    
    if (pm2Response.statusCode === 200 && pm2Response.data.processes) {
      const pm2Analyzer = new PM2Analyzer();
      analysisData.pm2Analysis = pm2Analyzer.analyze(pm2Response.data.processes);
      console.log('✅ PM2 analysis complete');
    } else {
      console.log('❌ Failed to fetch PM2 status');
    }

    // 3. 로그 분석 (Deep 모드)
    if (isDeep) {
      console.log('\n📝 Analyzing logs...');
      const logsResponse = await apiRequest('/api/logs?lines=500');
      
      if (logsResponse.statusCode === 200 && logsResponse.data.logs) {
        const logAnalyzer = new LogAnalyzer();
        analysisData.logAnalysis = logAnalyzer.analyze(logsResponse.data.logs);
        console.log('✅ Log analysis complete');
      } else {
        console.log('❌ Failed to fetch logs');
      }
    }

    // 리포트 생성
    const report = generateReport(analysisData);
    
    // 리포트 표시
    displayReport(report);

    // 파일로 저장
    if (shouldExport) {
      const filename = `vm-analytics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const filepath = path.join(CONFIG.reportDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
      console.log(`\n${colors.green}📄 Report saved to: ${filepath}${colors.reset}`);
    }

    // 종료 코드 결정
    if (report.summary.overallHealth === 'CRITICAL') {
      process.exit(2);
    } else if (report.summary.overallHealth === 'WARNING') {
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n${colors.red}❌ Analysis failed: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// 실행
analyze().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});