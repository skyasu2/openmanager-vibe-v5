#!/usr/bin/env node
/**
 * Claude Code 자동화 엔진 v3.0
 * Claude Code CLI의 hooks 미지원 문제 해결을 위한 대안 시스템
 * 
 * 기능:
 * - 파일 변경 감지 및 자동 대응
 * - MCP 서버 상태 모니터링 
 * - 코드 품질 자동 검사
 * - 성능 최적화 제안
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const execAsync = promisify(exec);

class ClaudeAutomationEngine extends EventEmitter {
  constructor() {
    super();
    this.projectRoot = process.cwd();
    this.lastCheck = new Date();
    this.ruleCache = new Map();
    this.isRunning = false;
    
    console.log('🤖 Claude 자동화 엔진 v3.0 시작');
    console.log('📂 프로젝트: ' + this.projectRoot);
  }

  /**
   * 자동화 규칙 정의 (settings.json의 hooks를 대체)
   */
  getAutomationRules() {
    return {
      // PostToolUse 대체: 파일 변경 후 자동 처리
      fileModified: [
        {
          name: '테스트 파일 자동 검증',
          pattern: /\.(test|spec)\.(ts|tsx|js|jsx)$/,
          condition: (file) => this.isTestFile(file),
          action: async (file) => {
            console.log('🧪 테스트 파일 변경 감지:', file);
            await this.runTestAutomation(file);
          }
        },
        {
          name: '대형 파일 모듈화 경고',
          pattern: /\.(ts|tsx|js|jsx)$/,
          condition: (file) => this.getFileLines(file) > 1500,
          action: async (file) => {
            console.log('⚠️  대형 파일 감지:', file);
            await this.suggestModularization(file);
          }
        },
        {
          name: 'DB 스키마 변경 감지',
          pattern: /supabase\/migrations\/.*\.sql$/,
          condition: () => true,
          action: async (file) => {
            console.log('🗄️  DB 스키마 변경:', file);
            await this.updateDatabaseTypes();
          }
        }
      ],

      // PreToolUse 대체: 파일 수정 전 검사
      beforeModify: [
        {
          name: '보안 민감 코드 검사',
          pattern: /(auth|payment|api\/private|credentials)/,
          condition: (file) => this.isSecuritySensitive(file),
          action: async (file) => {
            console.log('🔒 보안 검사:', file);
            await this.securityAudit(file);
          }
        }
      ],

      // UserPromptSubmit 대체: 복잡한 요청 분해
      complexRequest: [
        {
          name: '복잡한 작업 분해',
          condition: (prompt) => this.isComplexRequest(prompt),
          action: async (prompt) => {
            console.log('🧠 복잡한 요청 분해:', prompt.substring(0, 50));
            await this.decomposeRequest(prompt);
          }
        }
      ]
    };
  }

  /**
   * 파일 변경 감지 및 자동 처리
   */
  async watchFileChanges() {
    const chokidar = await import('chokidar');
    
    const watcher = chokidar.watch([
      'src/**/*',
      'tests/**/*', 
      'supabase/**/*',
      '.claude/**/*'
    ], {
      ignored: /(^|[\/\\])\../, // 숨김 파일 제외
      persistent: true,
      ignoreInitial: true
    });

    const rules = this.getAutomationRules();

    watcher.on('change', async (filePath) => {
      console.log(`📝 파일 변경: ${filePath}`);
      
      // PostToolUse 규칙 실행
      for (const rule of rules.fileModified) {
        if (rule.pattern.test(filePath) && rule.condition(filePath)) {
          try {
            await rule.action(filePath);
          } catch (error) {
            console.error(`❌ 규칙 실행 실패 [${rule.name}]:`, error.message);
          }
        }
      }
    });

    console.log('👀 파일 변경 감시 시작');
    return watcher;
  }

  /**
   * MCP 서버 상태 모니터링
   */
  async monitorMCPServers() {
    setInterval(async () => {
      try {
        const { stdout } = await execAsync('claude mcp list');
        const mcpStatus = this.parseMCPStatus(stdout);
        
        if (mcpStatus.failed.length > 0) {
          console.log('🚨 MCP 서버 오류 감지:', mcpStatus.failed);
          await this.fixMCPServers(mcpStatus.failed);
        }
      } catch (error) {
        console.error('❌ MCP 모니터링 실패:', error.message);
      }
    }, 30000); // 30초마다 체크

    console.log('🔄 MCP 서버 모니터링 시작');
  }

  /**
   * 자동 코드 품질 검사
   */
  async runQualityChecks() {
    const checks = [
      this.checkTypeScriptErrors(),
      this.checkLintIssues(),
      this.checkTestCoverage(),
      this.checkFileSize(),
      this.checkSecurityVulnerabilities()
    ];

    const results = await Promise.allSettled(checks);
    const report = this.generateQualityReport(results);
    
    console.log('📊 품질 검사 완료:', report);
    return report;
  }

  /**
   * 파일별 자동화 액션
   */
  async runTestAutomation(testFile) {
    console.log(`🧪 테스트 자동화: ${testFile}`);
    
    try {
      // 1. 해당 테스트만 실행
      const { stdout } = await execAsync(`npm run test ${testFile}`);
      console.log('✅ 테스트 통과');
      
      // 2. 커버리지 확인
      if (stdout.includes('Coverage')) {
        const coverage = this.extractCoverage(stdout);
        if (coverage < 70) {
          console.log(`⚠️  낮은 커버리지: ${coverage}%`);
          await this.suggestTestImprovements(testFile);
        }
      }
    } catch (error) {
      console.log('❌ 테스트 실패:', error.message);
      await this.analyzeTestFailure(testFile, error);
    }
  }

  async suggestModularization(file) {
    const lines = this.getFileLines(file);
    console.log(`📏 파일 크기: ${lines}줄 (권장: 500줄, 한계: 1500줄)`);
    
    if (lines > 2000) {
      console.log('🚨 긴급: 즉시 모듈화 필요');
      await this.createModularizationPlan(file);
    } else {
      console.log('💡 리팩토링 권장');
    }
  }

  async updateDatabaseTypes() {
    console.log('🔄 TypeScript 타입 업데이트 중...');
    
    try {
      await execAsync('npx supabase gen types typescript --project-id=your-project > src/types/database.ts');
      console.log('✅ 데이터베이스 타입 업데이트 완료');
    } catch (error) {
      console.error('❌ 타입 업데이트 실패:', error.message);
    }
  }

  async securityAudit(file) {
    console.log(`🔒 보안 감사: ${file}`);
    
    const content = fs.readFileSync(file, 'utf8');
    const vulnerabilities = this.scanVulnerabilities(content);
    
    if (vulnerabilities.length > 0) {
      console.log('🚨 보안 취약점 발견:', vulnerabilities);
      await this.generateSecurityReport(file, vulnerabilities);
    } else {
      console.log('✅ 보안 검사 통과');
    }
  }

  async decomposeRequest(prompt) {
    console.log('🧠 복잡한 요청 분해 중...');
    
    const tasks = this.analyzePromptComplexity(prompt);
    const plan = this.createExecutionPlan(tasks);
    
    console.log('📋 실행 계획:', plan);
    return plan;
  }

  /**
   * 유틸리티 메서드들
   */
  isTestFile(file) {
    return /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(file);
  }

  getFileLines(file) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      return content.split('\n').length;
    } catch {
      return 0;
    }
  }

  isSecuritySensitive(file) {
    const sensitivePatterns = [
      /auth/i, /payment/i, /credential/i, 
      /token/i, /secret/i, /private/i
    ];
    return sensitivePatterns.some(pattern => pattern.test(file));
  }

  isComplexRequest(prompt) {
    const complexity = prompt.split('&&').length + 
                      (prompt.match(/전체|모든|모두|완전/g) || []).length +
                      (prompt.match(/리팩토링|최적화|구현|개발/g) || []).length;
    return complexity > 3;
  }

  parseMCPStatus(output) {
    const lines = output.split('\n');
    const failed = lines.filter(line => 
      line.includes('failed') || line.includes('error') || line.includes('disconnected')
    );
    return { failed, total: lines.length };
  }

  async fixMCPServers(failedServers) {
    console.log('🔧 MCP 서버 복구 시도...');
    
    for (const server of failedServers) {
      try {
        await execAsync(`claude mcp remove ${server} && claude mcp add ${server}`);
        console.log(`✅ ${server} 복구 완료`);
      } catch (error) {
        console.error(`❌ ${server} 복구 실패:`, error.message);
      }
    }
  }

  generateQualityReport(results) {
    const passed = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return {
      timestamp: new Date().toISOString(),
      passed,
      failed,
      total: results.length,
      score: Math.round((passed / results.length) * 100)
    };
  }

  async checkTypeScriptErrors() {
    const { stdout } = await execAsync('npm run type-check');
    return stdout.includes('error') ? { errors: true } : { errors: false };
  }

  async checkLintIssues() {
    try {
      await execAsync('npm run lint:quick');
      return { issues: 0 };
    } catch (error) {
      const issues = (error.stdout.match(/✖/g) || []).length;
      return { issues };
    }
  }

  async checkTestCoverage() {
    try {
      const { stdout } = await execAsync('npm run test:coverage');
      const coverage = this.extractCoverage(stdout);
      return { coverage };
    } catch {
      return { coverage: 0 };
    }
  }

  async checkFileSize() {
    const largeFiles = [];
    const scanDir = (dir) => {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          if (!file.startsWith('.')) scanDir(filePath);
        } else if (this.getFileLines(filePath) > 1500) {
          largeFiles.push(filePath);
        }
      }
    };
    
    scanDir('src');
    return { largeFiles };
  }

  async checkSecurityVulnerabilities() {
    try {
      await execAsync('npm audit --audit-level=high');
      return { vulnerabilities: 0 };
    } catch (error) {
      const count = (error.stdout.match(/high|critical/gi) || []).length;
      return { vulnerabilities: count };
    }
  }

  extractCoverage(output) {
    const match = output.match(/All files\s+\|\s+(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  }

  scanVulnerabilities(content) {
    const patterns = [
      /password\s*=\s*['"].*['"]/gi,
      /api[_-]?key\s*=\s*['"].*['"]/gi,
      /secret\s*=\s*['"].*['"]/gi,
      /eval\s*\(/gi,
      /dangerouslySetInnerHTML/gi
    ];
    
    const vulnerabilities = [];
    patterns.forEach((pattern, index) => {
      if (pattern.test(content)) {
        vulnerabilities.push(`security-rule-${index + 1}`);
      }
    });
    
    return vulnerabilities;
  }

  analyzePromptComplexity(prompt) {
    const tasks = [];
    
    if (prompt.includes('리팩토링')) tasks.push('refactoring');
    if (prompt.includes('테스트')) tasks.push('testing');
    if (prompt.includes('최적화')) tasks.push('optimization');
    if (prompt.includes('구현')) tasks.push('implementation');
    if (prompt.includes('문서')) tasks.push('documentation');
    
    return tasks;
  }

  createExecutionPlan(tasks) {
    return {
      priority: 'high',
      estimated_time: tasks.length * 15, // 15분 per task
      parallel_possible: tasks.length > 2,
      recommended_agents: this.mapTasksToAgents(tasks),
      steps: tasks.map((task, index) => ({
        step: index + 1,
        task,
        estimated_duration: '15min'
      }))
    };
  }

  mapTasksToAgents(tasks) {
    const mapping = {
      'refactoring': 'structure-refactor-agent',
      'testing': 'test-automation-specialist', 
      'optimization': 'performance-optimizer',
      'implementation': 'central-supervisor',
      'documentation': 'documentation-manager'
    };
    
    return tasks.map(task => mapping[task] || 'central-supervisor');
  }

  /**
   * 메인 실행 함수
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  이미 실행 중입니다');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Claude 자동화 엔진 시작');

    try {
      // 1. 파일 변경 감시
      await this.watchFileChanges();
      
      // 2. MCP 서버 모니터링
      await this.monitorMCPServers();
      
      // 3. 주기적 품질 검사 (1시간마다)
      setInterval(() => {
        this.runQualityChecks();
      }, 3600000);

      // 4. 초기 상태 체크
      const initialReport = await this.runQualityChecks();
      console.log('📊 초기 품질 점수:', initialReport.score + '%');

      console.log('✅ 자동화 엔진 초기화 완료');
      console.log('💡 종료하려면 Ctrl+C를 누르세요');

    } catch (error) {
      console.error('❌ 자동화 엔진 시작 실패:', error);
      this.isRunning = false;
    }
  }

  async stop() {
    this.isRunning = false;
    console.log('🛑 자동화 엔진 정지');
  }
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  const engine = new ClaudeAutomationEngine();
  
  process.on('SIGINT', async () => {
    await engine.stop();
    process.exit(0);
  });
  
  engine.start().catch(console.error);
}

export default ClaudeAutomationEngine;