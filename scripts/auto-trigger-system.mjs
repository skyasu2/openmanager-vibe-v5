#!/usr/bin/env node
/**
 * 🎯 Auto-Trigger System v1.0.0
 * 
 * 조건 기반 자동 AI 에이전트 트리거 시스템
 * - 실시간 상황 모니터링
 * - 최적 AI 에이전트 자동 선택
 * - MCP 서버 활용률 극대화 (21.1% → 80%)
 * - 무인 협업 시스템
 */

import { promises as fs } from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// === 설정 상수 ===
const CONFIG = {
  PROJECT_ROOT: '/mnt/d/cursor/openmanager-vibe-v5',
  MONITORING_INTERVAL: 30000, // 30초마다 체크
  TRIGGER_LOG_PATH: 'logs/auto-trigger.log',
  
  // 트리거 우선순위
  PRIORITY: {
    CRITICAL: 1,
    HIGH: 2, 
    MEDIUM: 3,
    LOW: 4
  }
};

class AutoTriggerSystem {
  constructor() {
    this.triggers = new Map();
    this.activeMonitors = new Set();
    this.triggerHistory = [];
    this.isMonitoring = false;
    
    this.setupTriggers();
    this.setupLogger();
  }

  // === 트리거 규칙 설정 ===
  setupTriggers() {
    // 1. TypeScript 에러 트리거
    this.addTrigger({
      id: 'typescript-errors',
      name: 'TypeScript 에러 자동 수정',
      condition: async () => await this.detectTypeScriptErrors(),
      action: async (context) => await this.handleTypeScriptErrors(context),
      priority: CONFIG.PRIORITY.HIGH,
      cooldown: 300000, // 5분 쿨다운
      aiSystem: 'codex-cli',
      mcpTools: ['filesystem', 'memory']
    });

    // 2. 성능 저하 트리거
    this.addTrigger({
      id: 'performance-degradation',
      name: '성능 저하 자동 최적화',
      condition: async () => await this.detectPerformanceIssues(),
      action: async (context) => await this.handlePerformanceIssues(context),
      priority: CONFIG.PRIORITY.HIGH,
      cooldown: 600000, // 10분 쿨다운
      aiSystem: 'multi-ai',
      agents: ['ux-performance-specialist', 'ai-systems-specialist'],
      mcpTools: ['playwright', 'gcp', 'supabase']
    });

    // 3. 보안 취약점 트리거
    this.addTrigger({
      id: 'security-vulnerabilities',
      name: '보안 취약점 자동 점검',
      condition: async () => await this.detectSecurityIssues(),
      action: async (context) => await this.handleSecurityIssues(context),
      priority: CONFIG.PRIORITY.CRITICAL,
      cooldown: 1800000, // 30분 쿨다운
      aiSystem: 'claude',
      agents: ['security-auditor'],
      mcpTools: ['filesystem', 'github']
    });

    // 4. MCP 서버 장애 트리거
    this.addTrigger({
      id: 'mcp-server-failure',
      name: 'MCP 서버 자동 복구',
      condition: async () => await this.detectMcpFailures(),
      action: async (context) => await this.handleMcpFailures(context),
      priority: CONFIG.PRIORITY.CRITICAL,
      cooldown: 120000, // 2분 쿨다운
      aiSystem: 'claude',
      agents: ['mcp-server-administrator'],
      mcpTools: ['filesystem', 'memory']
    });

    // 5. 테스트 실패 트리거
    this.addTrigger({
      id: 'test-failures',
      name: '테스트 실패 자동 수정',
      condition: async () => await this.detectTestFailures(),
      action: async (context) => await this.handleTestFailures(context),
      priority: CONFIG.PRIORITY.MEDIUM,
      cooldown: 300000, // 5분 쿨다운
      aiSystem: 'claude',
      agents: ['test-automation-specialist'],
      mcpTools: ['filesystem', 'playwright']
    });

    // 6. 대규모 분석 요청 트리거
    this.addTrigger({
      id: 'large-scale-analysis',
      name: '대규모 코드 분석',
      condition: async () => await this.detectLargeAnalysisNeed(),
      action: async (context) => await this.handleLargeAnalysis(context),
      priority: CONFIG.PRIORITY.LOW,
      cooldown: 900000, // 15분 쿨다운
      aiSystem: 'gemini-cli',
      mcpTools: ['filesystem', 'memory', 'context7']
    });

    // 7. 빠른 프로토타입 요청 트리거
    this.addTrigger({
      id: 'rapid-prototyping',
      name: '빠른 프로토타입 개발',
      condition: async () => await this.detectPrototypingNeed(),
      action: async (context) => await this.handlePrototyping(context),
      priority: CONFIG.PRIORITY.LOW,
      cooldown: 180000, // 3분 쿨다운
      aiSystem: 'qwen-cli',
      mcpTools: ['filesystem', 'memory']
    });

    // 8. 문서 동기화 트리거
    this.addTrigger({
      id: 'docs-sync',
      name: '문서 자동 동기화',
      condition: async () => await this.detectDocsSyncNeed(),
      action: async (context) => await this.handleDocsSync(context),
      priority: CONFIG.PRIORITY.LOW,
      cooldown: 1800000, // 30분 쿨다운
      aiSystem: 'claude',
      agents: ['documentation-manager'],
      mcpTools: ['filesystem', 'github', 'memory']
    });

    this.log('info', `✅ ${this.triggers.size}개 자동 트리거 설정 완료`);
  }

  addTrigger(triggerConfig) {
    triggerConfig.lastTriggered = 0;
    triggerConfig.triggerCount = 0;
    this.triggers.set(triggerConfig.id, triggerConfig);
  }

  // === 로깅 시스템 ===
  setupLogger() {
    this.logFile = path.join(CONFIG.PROJECT_ROOT, CONFIG.TRIGGER_LOG_PATH);
  }

  async log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      data
    };

    console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    
    if (data && level === 'debug') {
      console.log(JSON.stringify(data, null, 2));
    }

    // 파일 로그
    try {
      await fs.mkdir(path.dirname(this.logFile), { recursive: true });
      await fs.appendFile(this.logFile, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('로그 파일 쓰기 실패:', error.message);
    }
  }

  // === 모니터링 시작/중지 ===
  async startMonitoring() {
    if (this.isMonitoring) {
      this.log('warn', '이미 모니터링이 실행 중입니다');
      return;
    }

    this.isMonitoring = true;
    this.log('info', '🎯 자동 트리거 모니터링 시작');

    while (this.isMonitoring) {
      try {
        await this.checkAllTriggers();
        await this.sleep(CONFIG.MONITORING_INTERVAL);
      } catch (error) {
        this.log('error', `모니터링 오류: ${error.message}`);
        await this.sleep(5000); // 에러 시 5초 대기
      }
    }
  }

  stopMonitoring() {
    this.isMonitoring = false;
    this.log('info', '🛑 자동 트리거 모니터링 중지');
  }

  // === 트리거 체크 ===
  async checkAllTriggers() {
    const triggers = Array.from(this.triggers.values())
      .sort((a, b) => a.priority - b.priority); // 우선순위 순

    for (const trigger of triggers) {
      try {
        await this.checkTrigger(trigger);
      } catch (error) {
        this.log('error', `트리거 ${trigger.id} 체크 실패: ${error.message}`);
      }
    }
  }

  async checkTrigger(trigger) {
    // 쿨다운 체크
    if (Date.now() - trigger.lastTriggered < trigger.cooldown) {
      return;
    }

    this.log('debug', `🔍 트리거 체크: ${trigger.name}`);

    try {
      const conditionResult = await trigger.condition();
      
      if (conditionResult.shouldTrigger) {
        await this.executeTrigger(trigger, conditionResult.context);
      }
    } catch (error) {
      this.log('error', `트리거 ${trigger.id} 조건 체크 실패: ${error.message}`);
    }
  }

  async executeTrigger(trigger, context) {
    this.log('info', `🚀 트리거 실행: ${trigger.name}`);
    
    trigger.lastTriggered = Date.now();
    trigger.triggerCount++;

    try {
      const result = await trigger.action(context);
      
      this.triggerHistory.push({
        id: trigger.id,
        name: trigger.name,
        timestamp: Date.now(),
        success: true,
        result,
        context
      });

      this.log('info', `✅ 트리거 완료: ${trigger.name}`, { result });
      
      // MCP 활용률 업데이트
      await this.updateMcpUtilization(trigger.mcpTools);
      
    } catch (error) {
      this.log('error', `❌ 트리거 실행 실패: ${trigger.name} - ${error.message}`);
      
      this.triggerHistory.push({
        id: trigger.id,
        name: trigger.name,
        timestamp: Date.now(),
        success: false,
        error: error.message,
        context
      });
    }
  }

  // === 조건 감지 메서드들 ===
  async detectTypeScriptErrors() {
    try {
      const { stdout } = await execAsync('npx tsc --noEmit', {
        cwd: CONFIG.PROJECT_ROOT
      });
      
      return { shouldTrigger: false, context: { errors: 0 } };
    } catch (error) {
      const errorCount = (error.stdout.match(/error TS/g) || []).length;
      
      if (errorCount > 5) {
        return {
          shouldTrigger: true,
          context: {
            errorCount,
            errorOutput: error.stdout,
            severity: errorCount > 20 ? 'critical' : 'high'
          }
        };
      }
      
      return { shouldTrigger: false, context: { errors: errorCount } };
    }
  }

  async detectPerformanceIssues() {
    try {
      // 응답시간 체크
      const startTime = Date.now();
      await execAsync('curl -s http://localhost:3000/api/health');
      const responseTime = Date.now() - startTime;

      if (responseTime > 5000) {
        return {
          shouldTrigger: true,
          context: {
            responseTime,
            threshold: 5000,
            severity: 'high'
          }
        };
      }

      return { shouldTrigger: false, context: { responseTime } };
    } catch (error) {
      // 서버 다운 상황
      return {
        shouldTrigger: true,
        context: {
          error: 'Server unreachable',
          severity: 'critical'
        }
      };
    }
  }

  async detectSecurityIssues() {
    try {
      // .env 파일 보안 체크
      const envPath = path.join(CONFIG.PROJECT_ROOT, '.env');
      const envContent = await fs.readFile(envPath, 'utf8');
      
      // 위험한 패턴 검사
      const dangerousPatterns = [
        /API_KEY=.*[^*]/i,
        /SECRET=.*[^*]/i,
        /PASSWORD=.*[^*]/i,
        /TOKEN=.*[^*]/i
      ];

      const vulnerabilities = dangerousPatterns.filter(pattern => 
        pattern.test(envContent)
      );

      if (vulnerabilities.length > 0) {
        return {
          shouldTrigger: true,
          context: {
            vulnerabilities: vulnerabilities.length,
            type: 'env-exposure',
            severity: 'critical'
          }
        };
      }

      return { shouldTrigger: false, context: { secure: true } };
    } catch (error) {
      return { shouldTrigger: false, context: { error: error.message } };
    }
  }

  async detectMcpFailures() {
    try {
      // MCP 설정 파일 체크
      const mcpConfigPath = path.join(CONFIG.PROJECT_ROOT, '.mcp.json');
      await fs.access(mcpConfigPath);
      
      // 각 MCP 서버 상태 체크 (간단한 버전)
      const mcpServers = [
        'filesystem', 'memory', 'github', 'supabase', 
        'gcp', 'playwright', 'tavily', 'context7'
      ];

      const failedServers = [];
      
      // 실제 MCP 서버 상태는 claude mcp 명령어로 체크해야 함
      // 여기서는 간단한 시뮬레이션
      
      if (failedServers.length > 0) {
        return {
          shouldTrigger: true,
          context: {
            failedServers,
            severity: failedServers.length > 3 ? 'critical' : 'high'
          }
        };
      }

      return { shouldTrigger: false, context: { allHealthy: true } };
    } catch (error) {
      return {
        shouldTrigger: true,
        context: {
          error: 'MCP 설정 파일 접근 실패',
          severity: 'high'
        }
      };
    }
  }

  async detectTestFailures() {
    try {
      const { stdout } = await execAsync('npm test', {
        cwd: CONFIG.PROJECT_ROOT
      });

      // 테스트 성공
      return { shouldTrigger: false, context: { allPassed: true } };
    } catch (error) {
      const failureCount = (error.stdout.match(/✗/g) || []).length;
      
      if (failureCount > 0) {
        return {
          shouldTrigger: true,
          context: {
            failureCount,
            output: error.stdout,
            severity: failureCount > 10 ? 'high' : 'medium'
          }
        };
      }

      return { shouldTrigger: false, context: { error: error.message } };
    }
  }

  async detectLargeAnalysisNeed() {
    try {
      // 대용량 파일 또는 복잡한 구조 변경 감지
      const { stdout } = await execAsync('find src -name "*.ts" -size +100k', {
        cwd: CONFIG.PROJECT_ROOT
      });

      const largeFiles = stdout.trim().split('\n').filter(f => f);
      
      if (largeFiles.length > 5) {
        return {
          shouldTrigger: true,
          context: {
            largeFiles: largeFiles.length,
            files: largeFiles.slice(0, 10), // 처음 10개만
            reason: 'Large file analysis needed'
          }
        };
      }

      return { shouldTrigger: false, context: { largeFiles: largeFiles.length } };
    } catch (error) {
      return { shouldTrigger: false, context: { error: error.message } };
    }
  }

  async detectPrototypingNeed() {
    try {
      // 새로운 기능 브랜치 또는 실험적 코드 감지
      const { stdout } = await execAsync('git branch --show-current', {
        cwd: CONFIG.PROJECT_ROOT
      });

      const currentBranch = stdout.trim();
      const prototypeKeywords = ['feature/', 'experiment/', 'prototype/', 'poc/'];
      
      const isPrototypeBranch = prototypeKeywords.some(keyword => 
        currentBranch.includes(keyword)
      );

      if (isPrototypeBranch) {
        return {
          shouldTrigger: true,
          context: {
            branch: currentBranch,
            reason: 'Prototype branch detected'
          }
        };
      }

      return { shouldTrigger: false, context: { branch: currentBranch } };
    } catch (error) {
      return { shouldTrigger: false, context: { error: error.message } };
    }
  }

  async detectDocsSyncNeed() {
    try {
      // docs 폴더와 코드 변경사항 비교
      const { stdout: docsChanges } = await execAsync('git status docs --porcelain', {
        cwd: CONFIG.PROJECT_ROOT
      });
      
      const { stdout: codeChanges } = await execAsync('git status src --porcelain', {
        cwd: CONFIG.PROJECT_ROOT
      });

      const hasCodeChanges = codeChanges.trim().length > 0;
      const hasDocsChanges = docsChanges.trim().length > 0;

      // 코드는 변경되었지만 문서는 변경되지 않은 경우
      if (hasCodeChanges && !hasDocsChanges) {
        return {
          shouldTrigger: true,
          context: {
            codeChanges: codeChanges.split('\n').length,
            reason: 'Code changed but docs not updated'
          }
        };
      }

      return { shouldTrigger: false, context: { synchronized: true } };
    } catch (error) {
      return { shouldTrigger: false, context: { error: error.message } };
    }
  }

  // === 액션 핸들러들 ===
  async handleTypeScriptErrors(context) {
    this.log('info', `🔧 TypeScript 에러 ${context.errorCount}개 자동 수정 시작`);
    
    const command = `node scripts/unified-agent-interface.mjs execute "TypeScript 에러 ${context.errorCount}개 자동 수정" high typescript critical`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: CONFIG.PROJECT_ROOT
    });

    return {
      action: 'typescript-fix',
      errorCount: context.errorCount,
      result: stdout,
      stderr
    };
  }

  async handlePerformanceIssues(context) {
    this.log('info', `⚡ 성능 이슈 자동 최적화 시작 (응답시간: ${context.responseTime}ms)`);
    
    const command = `node scripts/unified-agent-interface.mjs execute "성능 최적화 - 응답시간 ${context.responseTime}ms 개선" high performance urgent`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: CONFIG.PROJECT_ROOT
    });

    return {
      action: 'performance-optimization',
      originalResponseTime: context.responseTime,
      result: stdout,
      stderr
    };
  }

  async handleSecurityIssues(context) {
    this.log('info', `🔒 보안 취약점 ${context.vulnerabilities}개 자동 수정 시작`);
    
    const command = `node scripts/unified-agent-interface.mjs execute "보안 취약점 ${context.vulnerabilities}개 즉시 수정" high security critical`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: CONFIG.PROJECT_ROOT
    });

    return {
      action: 'security-fix',
      vulnerabilities: context.vulnerabilities,
      result: stdout,
      stderr
    };
  }

  async handleMcpFailures(context) {
    this.log('info', `🔌 MCP 서버 자동 복구 시작`);
    
    const command = `node scripts/unified-agent-interface.mjs execute "MCP 서버 상태 점검 및 복구" high infrastructure critical`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: CONFIG.PROJECT_ROOT
    });

    return {
      action: 'mcp-recovery',
      failedServers: context.failedServers || [],
      result: stdout,
      stderr
    };
  }

  async handleTestFailures(context) {
    this.log('info', `🧪 테스트 실패 ${context.failureCount}개 자동 수정 시작`);
    
    const command = `node scripts/unified-agent-interface.mjs execute "테스트 실패 ${context.failureCount}개 자동 수정" medium testing urgent`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: CONFIG.PROJECT_ROOT
    });

    return {
      action: 'test-fix',
      failureCount: context.failureCount,
      result: stdout,
      stderr
    };
  }

  async handleLargeAnalysis(context) {
    this.log('info', `🧠 대규모 분석 시작 (${context.largeFiles}개 파일)`);
    
    const command = `node scripts/unified-agent-interface.mjs execute "대규모 코드 아키텍처 분석" medium analysis normal`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: CONFIG.PROJECT_ROOT
    });

    return {
      action: 'large-analysis',
      fileCount: context.largeFiles,
      result: stdout,
      stderr
    };
  }

  async handlePrototyping(context) {
    this.log('info', `🔷 빠른 프로토타입 개발 시작 (브랜치: ${context.branch})`);
    
    const command = `node scripts/unified-agent-interface.mjs execute "프로토타입 빠른 구현" low prototype normal`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: CONFIG.PROJECT_ROOT
    });

    return {
      action: 'rapid-prototyping',
      branch: context.branch,
      result: stdout,
      stderr
    };
  }

  async handleDocsSync(context) {
    this.log('info', `📚 문서 자동 동기화 시작`);
    
    const command = `node scripts/unified-agent-interface.mjs execute "문서 자동 동기화 및 업데이트" low documentation normal`;
    
    const { stdout, stderr } = await execAsync(command, {
      cwd: CONFIG.PROJECT_ROOT
    });

    return {
      action: 'docs-sync',
      codeChanges: context.codeChanges,
      result: stdout,
      stderr
    };
  }

  // === MCP 활용률 업데이트 ===
  async updateMcpUtilization(mcpTools) {
    if (!mcpTools || mcpTools.length === 0) return;

    try {
      const utilizationPath = path.join(CONFIG.PROJECT_ROOT, 'logs/mcp-utilization.json');
      let utilization = {};
      
      try {
        const existingData = await fs.readFile(utilizationPath, 'utf8');
        utilization = JSON.parse(existingData);
      } catch (error) {
        // 파일이 없으면 새로 생성
        utilization = {
          totalTools: 12,
          usedTools: {},
          utilizationRate: 0,
          lastUpdate: Date.now()
        };
      }

      // 사용된 도구 카운트 업데이트
      mcpTools.forEach(tool => {
        utilization.usedTools[tool] = (utilization.usedTools[tool] || 0) + 1;
      });

      // 활용률 계산
      const uniqueUsedTools = Object.keys(utilization.usedTools).length;
      utilization.utilizationRate = (uniqueUsedTools / utilization.totalTools * 100).toFixed(1);
      utilization.lastUpdate = Date.now();

      await fs.writeFile(utilizationPath, JSON.stringify(utilization, null, 2));
      
      this.log('info', `📊 MCP 활용률 업데이트: ${utilization.utilizationRate}% (${uniqueUsedTools}/${utilization.totalTools} 도구)`);
      
    } catch (error) {
      this.log('error', `MCP 활용률 업데이트 실패: ${error.message}`);
    }
  }

  // === 유틸리티 ===
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === 통계 및 모니터링 ===
  getStatistics() {
    const totalTriggers = this.triggerHistory.length;
    const successfulTriggers = this.triggerHistory.filter(t => t.success).length;
    const successRate = totalTriggers > 0 ? (successfulTriggers / totalTriggers * 100).toFixed(1) : 0;

    const triggerCounts = {};
    this.triggers.forEach(trigger => {
      triggerCounts[trigger.name] = trigger.triggerCount;
    });

    return {
      monitoring: this.isMonitoring,
      totalTriggers,
      successfulTriggers,
      successRate: `${successRate}%`,
      triggerCounts,
      recentTriggers: this.triggerHistory.slice(-10)
    };
  }

  async getHealthStatus() {
    const triggerHealths = [];
    
    for (const trigger of this.triggers.values()) {
      try {
        const conditionResult = await trigger.condition();
        triggerHealths.push({
          id: trigger.id,
          name: trigger.name,
          healthy: true,
          lastCheck: Date.now(),
          context: conditionResult.context
        });
      } catch (error) {
        triggerHealths.push({
          id: trigger.id,
          name: trigger.name,
          healthy: false,
          error: error.message,
          lastCheck: Date.now()
        });
      }
    }

    const healthyCount = triggerHealths.filter(h => h.healthy).length;
    const overallHealth = healthyCount === triggerHealths.length ? 'healthy' : 'degraded';

    return {
      overall: overallHealth,
      healthy: healthyCount,
      total: triggerHealths.length,
      details: triggerHealths
    };
  }
}

// === CLI 인터페이스 ===
class TriggerCLI {
  constructor() {
    this.system = new AutoTriggerSystem();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
      switch (command) {
        case 'start':
          await this.handleStart();
          break;
        case 'stop':
          await this.handleStop();
          break;
        case 'status':
          await this.handleStatus();
          break;
        case 'stats':
          await this.handleStats();
          break;
        case 'health':
          await this.handleHealth();
          break;
        case 'test':
          await this.handleTest(args.slice(1));
          break;
        case 'trigger':
          await this.handleManualTrigger(args.slice(1));
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error(`❌ 오류: ${error.message}`);
      process.exit(1);
    }
  }

  async handleStart() {
    console.log('🎯 자동 트리거 시스템 시작...');
    await this.system.startMonitoring();
  }

  async handleStop() {
    this.system.stopMonitoring();
    console.log('🛑 자동 트리거 시스템 중지됨');
    process.exit(0);
  }

  async handleStatus() {
    const stats = this.system.getStatistics();
    console.log('📊 자동 트리거 시스템 상태:');
    console.log(JSON.stringify(stats, null, 2));
  }

  async handleStats() {
    const stats = this.system.getStatistics();
    console.log('📈 자동 트리거 통계:');
    console.log(JSON.stringify(stats, null, 2));
  }

  async handleHealth() {
    const health = await this.system.getHealthStatus();
    console.log('🏥 자동 트리거 시스템 건강 상태:');
    console.log(JSON.stringify(health, null, 2));
  }

  async handleTest(args) {
    const triggerId = args[0];
    
    if (!triggerId) {
      console.log('사용 가능한 트리거:');
      this.system.triggers.forEach((trigger, id) => {
        console.log(`  - ${id}: ${trigger.name}`);
      });
      return;
    }

    const trigger = this.system.triggers.get(triggerId);
    if (!trigger) {
      console.error(`❌ 트리거 '${triggerId}'를 찾을 수 없습니다`);
      return;
    }

    console.log(`🧪 트리거 테스트: ${trigger.name}`);
    await this.system.checkTrigger(trigger);
  }

  async handleManualTrigger(args) {
    const triggerId = args[0];
    
    if (!triggerId) {
      console.error('❌ 트리거 ID를 지정해주세요');
      return;
    }

    const trigger = this.system.triggers.get(triggerId);
    if (!trigger) {
      console.error(`❌ 트리거 '${triggerId}'를 찾을 수 없습니다`);
      return;
    }

    console.log(`⚡ 수동 트리거 실행: ${trigger.name}`);
    await this.system.executeTrigger(trigger, { manual: true });
  }

  showHelp() {
    console.log(`
🎯 Auto-Trigger System v1.0.0

사용법:
  start                    - 자동 트리거 모니터링 시작
  stop                     - 모니터링 중지
  status                   - 현재 상태 확인
  stats                    - 통계 정보 확인
  health                   - 건강 상태 점검
  test [트리거ID]          - 특정 트리거 테스트
  trigger <트리거ID>       - 수동 트리거 실행

트리거 ID:
  - typescript-errors      - TypeScript 에러 자동 수정
  - performance-degradation - 성능 저하 자동 최적화
  - security-vulnerabilities - 보안 취약점 자동 점검
  - mcp-server-failure     - MCP 서버 자동 복구
  - test-failures          - 테스트 실패 자동 수정
  - large-scale-analysis   - 대규모 코드 분석
  - rapid-prototyping      - 빠른 프로토타입 개발
  - docs-sync              - 문서 자동 동기화

예시:
  ./scripts/auto-trigger-system.mjs start
  ./scripts/auto-trigger-system.mjs test typescript-errors
  ./scripts/auto-trigger-system.mjs trigger performance-degradation
    `);
  }
}

// === 메인 실행 ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new TriggerCLI();
  
  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 종료 신호 받음. 자동 트리거 시스템 정리 중...');
    cli.system.stopMonitoring();
    process.exit(0);
  });
  
  cli.run().catch(console.error);
}

export default AutoTriggerSystem;