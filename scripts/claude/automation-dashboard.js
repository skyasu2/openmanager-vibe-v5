#!/usr/bin/env node
/**
 * Claude Code 자동화 대시보드 v1.0
 * 실시간 자동화 상태 모니터링 및 제어
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class AutomationDashboard {
  constructor() {
    this.configPath = '.claude/automation-config.json';
    this.logPath = '.claude/automation.log';
    this.reportPath = '.claude/quality-report.json';
    this.refreshInterval = 5000; // 5초
  }

  async loadConfig() {
    try {
      const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      return config;
    } catch (error) {
      console.error('❌ 설정 파일 로드 실패:', error.message);
      return {};
    }
  }

  async getSystemStatus() {
    const status = {
      timestamp: new Date().toISOString(),
      automation: await this.getAutomationStatus(),
      mcp: await this.getMCPStatus(),
      quality: await this.getQualityStatus(),
      performance: await this.getPerformanceMetrics(),
      issues: await this.getActiveIssues()
    };

    return status;
  }

  async getAutomationStatus() {
    try {
      // Node.js 프로세스에서 automation-engine 찾기
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV 2>nul || ps aux | grep automation-engine | grep -v grep');
      const processes = stdout.includes('automation-engine') ? 1 : 0;
      
      return {
        running: processes > 0,
        processes,
        uptime: processes > 0 ? 'Unknown' : 'Stopped',
        status: processes > 0 ? 'healthy' : 'stopped'
      };
    } catch {
      return { running: false, processes: 0, uptime: 'Stopped', status: 'error' };
    }
  }

  async getMCPStatus() {
    try {
      const { stdout } = await execAsync('claude mcp list');
      const lines = stdout.split('\n').filter(line => line.includes(':'));
      
      const servers = lines.map(line => {
        const [name, status] = line.split(':').map(s => s.trim());
        return {
          name,
          status: status.includes('connected') ? 'connected' : 'failed',
          healthy: !status.includes('failed') && !status.includes('error')
        };
      });

      const connected = servers.filter(s => s.healthy).length;
      const total = servers.length;

      return {
        servers,
        connected,
        total,
        healthScore: total > 0 ? Math.round((connected / total) * 100) : 0
      };
    } catch (error) {
      return {
        servers: [],
        connected: 0,
        total: 0,
        healthScore: 0,
        error: error.message
      };
    }
  }

  async getQualityStatus() {
    try {
      let report = { score: 0, timestamp: new Date().toISOString() };
      
      if (fs.existsSync(this.reportPath)) {
        report = JSON.parse(fs.readFileSync(this.reportPath, 'utf8'));
      }

      // 실시간 간단 품질 체크
      const quickChecks = await Promise.allSettled([
        this.checkTypeScriptErrors(),
        this.checkTestResults(),
        this.checkLintIssues()
      ]);

      const passed = quickChecks.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const currentScore = Math.round((passed / quickChecks.length) * 100);

      return {
        ...report,
        currentScore,
        checks: {
          typescript: quickChecks[0]?.value || { success: false },
          tests: quickChecks[1]?.value || { success: false },
          lint: quickChecks[2]?.value || { success: false }
        }
      };
    } catch {
      return { score: 0, currentScore: 0, timestamp: 'Unknown' };
    }
  }

  async getPerformanceMetrics() {
    try {
      // 파일 크기 통계
      const largeFiles = await this.findLargeFiles();
      
      // 빌드 시간 (마지막 빌드 시간 추정)
      const buildTime = await this.getLastBuildTime();
      
      return {
        largeFiles: largeFiles.length,
        avgFileSize: largeFiles.length > 0 ? Math.round(largeFiles.reduce((sum, f) => sum + f.lines, 0) / largeFiles.length) : 0,
        buildTime,
        cacheHitRate: 85 // 추정값
      };
    } catch {
      return { largeFiles: 0, avgFileSize: 0, buildTime: 'Unknown', cacheHitRate: 0 };
    }
  }

  async getActiveIssues() {
    const issues = [];
    
    try {
      // TypeScript 에러 수
      const tsErrors = await this.countTypeScriptErrors();
      if (tsErrors > 400) {
        issues.push({
          type: 'error',
          category: 'typescript',
          message: `${tsErrors}개 TypeScript 에러 (허용: 382개)`,
          action: 'npm run type-fix'
        });
      }

      // 대형 파일 검사
      const largeFiles = await this.findLargeFiles();
      const criticalFiles = largeFiles.filter(f => f.lines > 2000);
      if (criticalFiles.length > 0) {
        issues.push({
          type: 'warning',
          category: 'structure',
          message: `${criticalFiles.length}개 초대형 파일 (2000줄+)`,
          action: 'Task with structure-refactor-agent'
        });
      }

      // MCP 연결 문제
      const mcpStatus = await this.getMCPStatus();
      const failedMcp = mcpStatus.servers.filter(s => !s.healthy);
      if (failedMcp.length > 0) {
        issues.push({
          type: 'error',
          category: 'mcp',
          message: `${failedMcp.length}개 MCP 서버 연결 실패`,
          action: 'claude mcp restart'
        });
      }

    } catch (error) {
      issues.push({
        type: 'error',
        category: 'system',
        message: '시스템 상태 확인 실패',
        action: 'Check system health'
      });
    }

    return issues;
  }

  async checkTypeScriptErrors() {
    try {
      await execAsync('npm run type-check');
      return { success: true, errors: 0 };
    } catch (error) {
      const errorCount = (error.stdout?.match(/error TS/g) || []).length;
      return { success: errorCount <= 400, errors: errorCount };
    }
  }

  async checkTestResults() {
    try {
      const { stdout } = await execAsync('npm run test:quick');
      const passed = stdout.includes('PASS') || stdout.includes('✓');
      return { success: passed, message: 'Tests passing' };
    } catch {
      return { success: false, message: 'Tests failing' };
    }
  }

  async checkLintIssues() {
    try {
      await execAsync('npm run lint:quick');
      return { success: true, issues: 0 };
    } catch (error) {
      const issueCount = (error.stdout?.match(/✖/g) || []).length;
      return { success: issueCount <= 100, issues: issueCount };
    }
  }

  async findLargeFiles() {
    const largeFiles = [];
    
    const scanDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !file.startsWith('.')) {
            scanDir(filePath);
          } else if (filePath.match(/\.(ts|tsx|js|jsx)$/)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n').length;
            
            if (lines > 1500) {
              largeFiles.push({
                path: filePath,
                lines,
                size: stat.size
              });
            }
          }
        }
      } catch (error) {
        // 파일 접근 오류 무시
      }
    };

    scanDir('src');
    return largeFiles.sort((a, b) => b.lines - a.lines);
  }

  async countTypeScriptErrors() {
    try {
      const { stdout } = await execAsync('npm run type-check');
      return 0;
    } catch (error) {
      return (error.stdout?.match(/error TS/g) || []).length;
    }
  }

  async getLastBuildTime() {
    try {
      const stat = fs.statSync('.next');
      const buildAge = Date.now() - stat.mtime.getTime();
      return buildAge < 3600000 ? 'Recent' : 'Old';
    } catch {
      return 'Unknown';
    }
  }

  renderDashboard(status) {
    console.clear();
    
    // 헤더
    console.log('┌─────────────────────────────────────────────────────────────┐');
    console.log('│  🤖 Claude Code 자동화 대시보드 v1.0                        │');
    console.log('│  ⏰ ' + new Date().toLocaleString('ko-KR').padEnd(46) + '│');
    console.log('├─────────────────────────────────────────────────────────────┤');
    
    // 자동화 상태
    const autoIcon = status.automation.running ? '🟢' : '🔴';
    const autoStatus = status.automation.running ? 'RUNNING' : 'STOPPED';
    console.log(`│  ${autoIcon} 자동화 엔진: ${autoStatus.padEnd(35)} │`);
    
    // MCP 상태
    const mcpIcon = status.mcp.healthScore > 80 ? '🟢' : status.mcp.healthScore > 50 ? '🟡' : '🔴';
    console.log(`│  ${mcpIcon} MCP 서버: ${status.mcp.connected}/${status.mcp.total} 연결 (${status.mcp.healthScore}%)`.padEnd(59) + '│');
    
    // 품질 점수
    const qualityIcon = status.quality.currentScore > 80 ? '🟢' : status.quality.currentScore > 60 ? '🟡' : '🔴';
    console.log(`│  ${qualityIcon} 품질 점수: ${status.quality.currentScore}%`.padEnd(49) + '│');
    
    console.log('├─────────────────────────────────────────────────────────────┤');
    
    // 상세 정보
    console.log('│  📊 상세 상태:                                               │');
    console.log(`│     TypeScript: ${status.quality.checks.typescript.success ? '✅' : '❌'} ${status.quality.checks.typescript.errors || 0}개 에러`.padEnd(59) + '│');
    console.log(`│     테스트: ${status.quality.checks.tests.success ? '✅' : '❌'} ${status.quality.checks.tests.message || 'Unknown'}`.padEnd(59) + '│');
    console.log(`│     Lint: ${status.quality.checks.lint.success ? '✅' : '❌'} ${status.quality.checks.lint.issues || 0}개 이슈`.padEnd(59) + '│');
    console.log(`│     대형 파일: ${status.performance.largeFiles}개 (평균 ${status.performance.avgFileSize}줄)`.padEnd(59) + '│');
    
    console.log('├─────────────────────────────────────────────────────────────┤');
    
    // MCP 서버 상세
    console.log('│  🔧 MCP 서버:                                                │');
    if (status.mcp.servers.length > 0) {
      status.mcp.servers.slice(0, 5).forEach(server => {
        const icon = server.healthy ? '✅' : '❌';
        const name = server.name.padEnd(20);
        console.log(`│     ${icon} ${name} ${server.status}`.padEnd(59) + '│');
      });
      if (status.mcp.servers.length > 5) {
        console.log(`│     ... ${status.mcp.servers.length - 5}개 더`.padEnd(59) + '│');
      }
    } else {
      console.log('│     MCP 서버 정보 없음                                       │');
    }
    
    console.log('├─────────────────────────────────────────────────────────────┤');
    
    // 활성 이슈
    console.log('│  ⚠️  활성 이슈:                                               │');
    if (status.issues.length > 0) {
      status.issues.slice(0, 3).forEach(issue => {
        const icon = issue.type === 'error' ? '🔴' : '🟡';
        const message = issue.message.length > 45 ? issue.message.substring(0, 45) + '...' : issue.message;
        console.log(`│     ${icon} ${message}`.padEnd(59) + '│');
      });
      if (status.issues.length > 3) {
        console.log(`│     ... ${status.issues.length - 3}개 더`.padEnd(59) + '│');
      }
    } else {
      console.log('│     🎉 모든 시스템 정상!                                     │');
    }
    
    console.log('├─────────────────────────────────────────────────────────────┤');
    console.log('│  💡 명령어:                                                  │');
    console.log('│     r - 새로고침    q - 종료    s - 자동화 시작/중지          │');
    console.log('│     m - MCP 재시작  t - 테스트 실행  f - 문제 자동 수정       │');
    console.log('└─────────────────────────────────────────────────────────────┘');
  }

  async handleCommand(cmd) {
    switch (cmd.toLowerCase()) {
      case 'r':
        console.log('🔄 새로고침 중...');
        break;
      case 's':
        console.log('🔄 자동화 엔진 상태 변경 중...');
        try {
          const status = await this.getAutomationStatus();
          if (status.running) {
            await execAsync('powershell -ExecutionPolicy Bypass -File scripts/claude/start-automation.ps1 -Stop');
            console.log('🛑 자동화 엔진 중지됨');
          } else {
            await execAsync('powershell -ExecutionPolicy Bypass -File scripts/claude/start-automation.ps1 -Background');
            console.log('🚀 자동화 엔진 시작됨');
          }
        } catch (error) {
          console.log('❌ 자동화 엔진 제어 실패:', error.message);
        }
        setTimeout(() => {}, 2000);
        break;
      case 'm':
        console.log('🔄 MCP 서버 재시작 중...');
        try {
          await execAsync('claude api restart');
          console.log('✅ MCP 서버 재시작 완료');
        } catch (error) {
          console.log('❌ MCP 재시작 실패:', error.message);
        }
        setTimeout(() => {}, 2000);
        break;
      case 't':
        console.log('🧪 테스트 실행 중...');
        try {
          await execAsync('npm run test:quick');
          console.log('✅ 테스트 완료');
        } catch (error) {
          console.log('❌ 테스트 실패');
        }
        setTimeout(() => {}, 2000);
        break;
      case 'f':
        console.log('🔧 자동 수정 중...');
        try {
          await execAsync('npm run type-fix && npm run lint:fix');
          console.log('✅ 자동 수정 완료');
        } catch (error) {
          console.log('❌ 자동 수정 실패');
        }
        setTimeout(() => {}, 3000);
        break;
      case 'q':
        console.log('👋 대시보드를 종료합니다...');
        process.exit(0);
        break;
    }
  }

  async startInteractiveMode() {
    console.log('🎛️  대화형 대시보드 시작...');
    
    // stdin 설정
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const updateDashboard = async () => {
      try {
        const status = await this.getSystemStatus();
        this.renderDashboard(status);
      } catch (error) {
        console.error('대시보드 업데이트 실패:', error.message);
      }
    };

    // 초기 로드
    await updateDashboard();

    // 주기적 업데이트
    const interval = setInterval(updateDashboard, this.refreshInterval);

    // 키보드 입력 처리
    process.stdin.on('data', async (key) => {
      if (key === '\u0003') { // Ctrl+C
        clearInterval(interval);
        process.exit(0);
      }
      
      await this.handleCommand(key);
      await updateDashboard();
    });
  }

  async generateReport() {
    const status = await this.getSystemStatus();
    const report = {
      ...status,
      recommendations: this.generateRecommendations(status),
      generatedAt: new Date().toISOString()
    };

    // 파일로 저장
    fs.writeFileSync(this.reportPath, JSON.stringify(report, null, 2));
    console.log('📄 보고서 생성 완료:', this.reportPath);
    
    return report;
  }

  generateRecommendations(status) {
    const recommendations = [];

    if (!status.automation.running) {
      recommendations.push({
        priority: 'high',
        category: 'automation',
        message: '자동화 엔진이 중지됨',
        action: 'scripts/claude/start-automation.ps1 실행'
      });
    }

    if (status.mcp.healthScore < 80) {
      recommendations.push({
        priority: 'medium',
        category: 'mcp',
        message: 'MCP 서버 연결 불안정',
        action: 'claude api restart 실행'
      });
    }

    if (status.quality.currentScore < 70) {
      recommendations.push({
        priority: 'medium',
        category: 'quality',
        message: '코드 품질 점수 낮음',
        action: 'npm run type-fix && npm run lint:fix'
      });
    }

    if (status.performance.largeFiles > 5) {
      recommendations.push({
        priority: 'low',
        category: 'performance',
        message: '대형 파일 다수 존재',
        action: 'Task with structure-refactor-agent'
      });
    }

    return recommendations;
  }
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const dashboard = new AutomationDashboard();
  
  const mode = process.argv[2];
  
  if (mode === '--report') {
    dashboard.generateReport().then(() => {
      console.log('📊 보고서 생성 완료');
    });
  } else if (mode === '--status') {
    dashboard.getSystemStatus().then(status => {
      console.log(JSON.stringify(status, null, 2));
    });
  } else {
    dashboard.startInteractiveMode();
  }
}

export default AutomationDashboard;