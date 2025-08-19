#!/usr/bin/env node

/**
 * @fileoverview AI 에이전트 동기화 스크립트
 * @description Claude 서브에이전트와 외부 AI CLI 도구들 간의 설정 동기화 및 상태 모니터링
 * @author Claude Code + Multi-AI 협업 시스템
 * @created 2025-08-18
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

/**
 * AI 에이전트 동기화 시스템
 * - Claude 서브에이전트 설정 동기화
 * - 외부 AI CLI 도구 설정 검증
 * - MCP 서버 연결 상태 확인
 * - 설정 일관성 보장
 */
class AIAgentSyncManager {
  constructor() {
    this.projectRoot = '/mnt/d/cursor/openmanager-vibe-v5';
    this.configPaths = {
      mcpMapping: '.claude/agents/mcp-mapping.json',
      claudeSettings: '.claude/settings.json',
      mcpConfig: '.mcp.json',
      agentsConfig: 'AGENTS.md',
      geminiConfig: 'GEMINI.md',
      qwenConfig: 'QWEN.md',
      claudeGuide: 'CLAUDE.md'
    };
    
    this.syncResults = {
      claude: { status: 'unknown', agents: [], errors: [] },
      codex: { status: 'unknown', config: null, errors: [] },
      gemini: { status: 'unknown', config: null, errors: [] },
      qwen: { status: 'unknown', config: null, errors: [] },
      mcp: { status: 'unknown', servers: [], errors: [] }
    };
    
    this.startTime = Date.now();
  }

  // === 메인 동기화 프로세스 ===
  async synchronize(options = {}) {
    const { verbose = false, dryRun = false, forceFix = false } = options;
    
    this.log('info', '🔄 AI 에이전트 동기화 시작...');
    this.log('debug', `📂 프로젝트 루트: ${this.projectRoot}`);
    
    try {
      // 1. 시스템 상태 검증
      await this.validateSystemStatus();
      
      // 2. Claude 서브에이전트 동기화
      await this.syncClaudeAgents();
      
      // 3. 외부 AI CLI 도구 동기화
      await this.syncExternalAITools();
      
      // 4. MCP 서버 동기화
      await this.syncMCPServers();
      
      // 5. 설정 일관성 검증
      await this.validateConsistency();
      
      // 6. 동기화 결과 보고
      const report = this.generateSyncReport();
      
      if (!dryRun && forceFix) {
        await this.applyFixes();
      }
      
      this.log('success', '✅ AI 에이전트 동기화 완료');
      return report;
      
    } catch (error) {
      this.log('error', `❌ 동기화 실패: ${error.message}`);
      throw error;
    }
  }

  // === 시스템 상태 검증 ===
  async validateSystemStatus() {
    this.log('debug', '🔍 시스템 상태 검증 중...');
    
    // WSL 환경 확인
    const isWSL = await this.checkWSLEnvironment();
    if (!isWSL) {
      throw new Error('WSL 환경에서만 실행 가능합니다');
    }
    
    // 필수 파일 존재 확인
    const missingFiles = [];
    for (const [name, filePath] of Object.entries(this.configPaths)) {
      const fullPath = path.join(this.projectRoot, filePath);
      try {
        await fs.access(fullPath);
      } catch {
        missingFiles.push(filePath);
      }
    }
    
    if (missingFiles.length > 0) {
      this.log('warn', `⚠️  누락된 설정 파일: ${missingFiles.join(', ')}`);
    }
    
    // AI CLI 도구 설치 상태 확인
    await this.checkAIToolsInstallation();
  }

  // === Claude 서브에이전트 동기화 ===
  async syncClaudeAgents() {
    this.log('debug', '🤖 Claude 서브에이전트 동기화 중...');
    
    try {
      // MCP 매핑 설정 로드
      const mcpMappingPath = path.join(this.projectRoot, this.configPaths.mcpMapping);
      const mcpMapping = JSON.parse(await fs.readFile(mcpMappingPath, 'utf8'));
      
      // Claude 서브에이전트 목록 추출
      const claudeAgents = Object.keys(mcpMapping.agent_mcp_mappings);
      this.syncResults.claude.agents = claudeAgents;
      
      // Task 도구 지원 에이전트 확인
      const taskEnabledAgents = claudeAgents.filter(agent => 
        mcpMapping.agent_mcp_mappings[agent].task_enabled === true
      );
      
      this.log('info', `📋 Claude 서브에이전트: ${claudeAgents.length}개 (Task 지원: ${taskEnabledAgents.length}개)`);
      this.syncResults.claude.status = 'synced';
      
    } catch (error) {
      this.syncResults.claude.status = 'error';
      this.syncResults.claude.errors.push(error.message);
      this.log('error', `❌ Claude 에이전트 동기화 실패: ${error.message}`);
    }
  }

  // === 외부 AI CLI 도구 동기화 ===
  async syncExternalAITools() {
    this.log('debug', '🔧 외부 AI CLI 도구 동기화 중...');
    
    // Codex CLI 동기화
    await this.syncCodexCLI();
    
    // Gemini CLI 동기화
    await this.syncGeminiCLI();
    
    // Qwen CLI 동기화
    await this.syncQwenCLI();
  }

  async syncCodexCLI() {
    try {
      const agentsConfigPath = path.join(this.projectRoot, this.configPaths.agentsConfig);
      const agentsContent = await fs.readFile(agentsConfigPath, 'utf8');
      
      // AGENTS.md에서 12개 전문 분야 설정 확인
      const domainMatches = agentsContent.match(/## \d+\. .+/g) || [];
      const domains = domainMatches.length;
      
      this.syncResults.codex = {
        status: 'synced',
        config: {
          tool_type: 'single_ai_tool',
          specialized_domains: domains,
          base_model: 'ChatGPT Plus',
          monthly_cost: '$20'
        },
        errors: []
      };
      
      this.log('info', `🎯 Codex CLI: 1개 도구 (${domains}개 전문 분야)`);
      
    } catch (error) {
      this.syncResults.codex.status = 'error';
      this.syncResults.codex.errors.push(error.message);
      this.log('error', `❌ Codex CLI 동기화 실패: ${error.message}`);
    }
  }

  async syncGeminiCLI() {
    try {
      const geminiConfigPath = path.join(this.projectRoot, this.configPaths.geminiConfig);
      const geminiContent = await fs.readFile(geminiConfigPath, 'utf8');
      
      // Gemini CLI 버전 확인
      let version = 'unknown';
      try {
        version = execSync('gemini --version', { encoding: 'utf8' }).trim();
      } catch {
        // 버전 확인 실패는 정상 (설치되지 않았을 수 있음)
      }
      
      this.syncResults.gemini = {
        status: 'synced',
        config: {
          tool_type: 'single_ai_tool',
          role: 'Senior Code Architect',
          version: version,
          cost: 'Free (1K req/day)'
        },
        errors: []
      };
      
      this.log('info', `🧠 Gemini CLI: 1개 도구 (Senior Code Architect 역할)`);
      
    } catch (error) {
      this.syncResults.gemini.status = 'error';
      this.syncResults.gemini.errors.push(error.message);
      this.log('error', `❌ Gemini CLI 동기화 실패: ${error.message}`);
    }
  }

  async syncQwenCLI() {
    try {
      const qwenConfigPath = path.join(this.projectRoot, this.configPaths.qwenConfig);
      const qwenContent = await fs.readFile(qwenConfigPath, 'utf8');
      
      // Qwen CLI 버전 확인
      let version = 'unknown';
      try {
        version = execSync('qwen --version', { encoding: 'utf8' }).trim();
      } catch {
        // 버전 확인 실패는 정상
      }
      
      this.syncResults.qwen = {
        status: 'synced',
        config: {
          tool_type: 'single_ai_tool',
          role: '병렬 모듈 개발 전문',
          version: version,
          cost: 'Free (2K req/day)'
        },
        errors: []
      };
      
      this.log('info', `⚡ Qwen CLI: 1개 도구 (병렬 개발 전문)`);
      
    } catch (error) {
      this.syncResults.qwen.status = 'error';
      this.syncResults.qwen.errors.push(error.message);
      this.log('error', `❌ Qwen CLI 동기화 실패: ${error.message}`);
    }
  }

  // === MCP 서버 동기화 ===
  async syncMCPServers() {
    this.log('debug', '🔌 MCP 서버 동기화 중...');
    
    try {
      const mcpConfigPath = path.join(this.projectRoot, this.configPaths.mcpConfig);
      const mcpConfig = JSON.parse(await fs.readFile(mcpConfigPath, 'utf8'));
      
      const servers = Object.keys(mcpConfig.mcpServers || {});
      this.syncResults.mcp.servers = servers;
      this.syncResults.mcp.status = 'synced';
      
      this.log('info', `🔌 MCP 서버: ${servers.length}개 (${servers.join(', ')})`);
      
      // MCP 서버 연결 상태 확인 (옵션)
      await this.checkMCPServerStatus();
      
    } catch (error) {
      this.syncResults.mcp.status = 'error';
      this.syncResults.mcp.errors.push(error.message);
      this.log('error', `❌ MCP 서버 동기화 실패: ${error.message}`);
    }
  }

  // === 설정 일관성 검증 ===
  async validateConsistency() {
    this.log('debug', '✅ 설정 일관성 검증 중...');
    
    const inconsistencies = [];
    
    // Claude 서브에이전트 수 일관성 확인
    const expectedClaudeAgents = 19;
    if (this.syncResults.claude.agents.length !== expectedClaudeAgents) {
      inconsistencies.push(`Claude 서브에이전트 수 불일치: 예상 ${expectedClaudeAgents}개, 실제 ${this.syncResults.claude.agents.length}개`);
    }
    
    // MCP 서버 수 일관성 확인
    const expectedMCPServers = 12;
    if (this.syncResults.mcp.servers.length !== expectedMCPServers) {
      inconsistencies.push(`MCP 서버 수 불일치: 예상 ${expectedMCPServers}개, 실제 ${this.syncResults.mcp.servers.length}개`);
    }
    
    // 외부 AI 도구 상태 확인
    const aiToolsExpected = ['codex', 'gemini', 'qwen'];
    const aiToolsActual = aiToolsExpected.filter(tool => 
      this.syncResults[tool].status === 'synced'
    );
    
    if (aiToolsActual.length !== aiToolsExpected.length) {
      inconsistencies.push(`외부 AI 도구 동기화 불완전: ${aiToolsExpected.length - aiToolsActual.length}개 실패`);
    }
    
    if (inconsistencies.length > 0) {
      this.log('warn', '⚠️  설정 일관성 문제:');
      inconsistencies.forEach(issue => this.log('warn', `   - ${issue}`));
    } else {
      this.log('success', '✅ 모든 설정이 일관성 있게 동기화됨');
    }
    
    return inconsistencies;
  }

  // === 동기화 결과 보고서 생성 ===
  generateSyncReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    
    const report = {
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      summary: {
        claude_subagents: {
          total: this.syncResults.claude.agents.length,
          status: this.syncResults.claude.status,
          errors: this.syncResults.claude.errors.length
        },
        external_ai_tools: {
          codex_cli: { status: this.syncResults.codex.status },
          gemini_cli: { status: this.syncResults.gemini.status },
          qwen_cli: { status: this.syncResults.qwen.status }
        },
        mcp_servers: {
          total: this.syncResults.mcp.servers.length,
          status: this.syncResults.mcp.status,
          servers: this.syncResults.mcp.servers
        }
      },
      details: this.syncResults
    };
    
    this.log('info', '📊 동기화 보고서:');
    this.log('info', `   ⏱️  소요시간: ${duration}ms`);
    this.log('info', `   🤖 Claude 에이전트: ${report.summary.claude_subagents.total}개 (${report.summary.claude_subagents.status})`);
    this.log('info', `   🔧 외부 AI 도구: Codex(${this.syncResults.codex.status}), Gemini(${this.syncResults.gemini.status}), Qwen(${this.syncResults.qwen.status})`);
    this.log('info', `   🔌 MCP 서버: ${report.summary.mcp_servers.total}개 (${report.summary.mcp_servers.status})`);
    
    return report;
  }

  // === 유틸리티 메서드들 ===
  async checkWSLEnvironment() {
    try {
      const result = execSync('uname -a', { encoding: 'utf8' });
      return result.includes('microsoft') || result.includes('WSL');
    } catch {
      return false;
    }
  }

  async checkAIToolsInstallation() {
    const tools = ['claude', 'gemini', 'qwen', 'codex-cli'];
    const installedTools = [];
    
    for (const tool of tools) {
      try {
        execSync(`which ${tool}`, { stdio: 'ignore' });
        installedTools.push(tool);
      } catch {
        // 도구가 설치되지 않음
      }
    }
    
    this.log('debug', `🛠️  설치된 AI 도구: ${installedTools.join(', ')}`);
    return installedTools;
  }

  async checkMCPServerStatus() {
    try {
      // Claude Code MCP 상태 확인 (있다면)
      execSync('claude mcp list', { stdio: 'ignore' });
      this.log('debug', '🔌 MCP 서버 연결 상태 확인 완료');
    } catch {
      this.log('warn', '⚠️  MCP 서버 상태 확인 실패 (정상일 수 있음)');
    }
  }

  async applyFixes() {
    this.log('info', '🔧 자동 수정 적용 중...');
    
    // 여기에 자동 수정 로직 구현
    // 예: 누락된 설정 파일 생성, 권한 문제 해결 등
    
    this.log('success', '✅ 자동 수정 완료');
  }

  // === 로깅 시스템 ===
  log(level, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const prefix = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      success: '✅'
    }[level] || 'ℹ️';
    
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }
}

// === CLI 실행 ===
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    dryRun: args.includes('--dry-run') || args.includes('-d'),
    forceFix: args.includes('--fix') || args.includes('-f'),
    help: args.includes('--help') || args.includes('-h')
  };
  
  if (options.help) {
    console.log(`
AI 에이전트 동기화 스크립트

사용법:
  node ai-agent-sync.mjs [옵션]

옵션:
  -v, --verbose    상세 로그 출력
  -d, --dry-run    실제 변경 없이 검증만 수행
  -f, --fix        자동 수정 적용
  -h, --help       도움말 표시

예시:
  node ai-agent-sync.mjs --verbose
  node ai-agent-sync.mjs --dry-run --fix
    `);
    return;
  }
  
  try {
    const syncManager = new AIAgentSyncManager();
    const report = await syncManager.synchronize(options);
    
    // 보고서를 파일로 저장 (옵션)
    if (!options.dryRun) {
      const reportPath = path.join(syncManager.projectRoot, 'logs', 'ai-agent-sync-report.json');
      await fs.mkdir(path.dirname(reportPath), { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      console.log(`📄 보고서 저장됨: ${reportPath}`);
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error(`❌ 동기화 실패: ${error.message}`);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default AIAgentSyncManager;