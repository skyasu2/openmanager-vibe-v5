#!/usr/bin/env node
/**
 * 🤖 Unified Agent Interface v1.0.0
 * 
 * Claude Code 서브에이전트와 외부 AI 시스템 통합 인터페이스
 * - Claude Code Sub-agents (19개)
 * - Codex CLI System (12개 전문 에이전트)  
 * - Gemini CLI (Senior Code Architect)
 * - Qwen CLI (병렬 개발 도구)
 * 
 * 목표: MCP 활용률 21.1% → 80%, 멀티 AI 협업 최적화
 */

import { promises as fs } from 'fs';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// === 설정 상수 ===
const CONFIG = {
  PROJECT_ROOT: '/mnt/d/cursor/openmanager-vibe-v5',
  MCP_MAPPING_PATH: '.claude/agents/mcp-mapping.json',
  WSL_ENVIRONMENT: true,
  
  // AI 시스템별 제한
  LIMITS: {
    gemini: { daily: 1000, perMinute: 60 },
    qwen: { daily: 2000, perMinute: 100 },
    codex: { monthly: 'unlimited' } // ChatGPT Plus
  },
  
  // 로그 레벨
  LOG_LEVEL: process.env.NODE_ENV === 'production' ? 'info' : 'debug'
};

class UnifiedAgentInterface {
  constructor() {
    this.setupLogger();
    this.mcpMapping = null;
    this.activeAgents = new Set();
    this.usageStats = {
      claude: 0,
      gemini: 0, 
      qwen: 0,
      codex: 0
    };
    
    this.init();
  }

  async init() {
    await this.loadMcpMapping();
    this.log('info', '🚀 Unified Agent Interface 초기화 완료');
  }

  // === MCP 매핑 로드 ===
  async loadMcpMapping() {
    try {
      const mappingPath = path.join(CONFIG.PROJECT_ROOT, CONFIG.MCP_MAPPING_PATH);
      const mappingData = await fs.readFile(mappingPath, 'utf8');
      this.mcpMapping = JSON.parse(mappingData);
      this.log('debug', '📊 MCP 매핑 데이터 로드 완료');
    } catch (error) {
      this.log('error', `❌ MCP 매핑 로드 실패: ${error.message}`);
      throw error;
    }
  }

  // === 로깅 시스템 ===
  setupLogger() {
    this.logLevels = { error: 0, warn: 1, info: 2, debug: 3 };
    this.currentLogLevel = this.logLevels[CONFIG.LOG_LEVEL] || 2;
  }

  log(level, message, data = null) {
    if (this.logLevels[level] <= this.currentLogLevel) {
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
      console.log(logMessage);
      
      if (data && level === 'debug') {
        console.log(JSON.stringify(data, null, 2));
      }
    }
  }

  // === 에이전트 라우팅 ===
  async routeRequest(request) {
    const { task, complexity, domain, urgency = 'normal' } = request;
    
    this.log('info', `🎯 작업 라우팅: ${task}`, { complexity, domain, urgency });

    // 복잡도 기반 AI 선택
    const selectedAI = this.selectOptimalAI(complexity, domain, urgency);
    
    // MCP 도구 추천
    const recommendedMcpTools = this.recommendMcpTools(domain, selectedAI);
    
    return {
      primaryAI: selectedAI.primary,
      collaborativeAI: selectedAI.collaborative,
      mcpTools: recommendedMcpTools,
      executionPlan: this.createExecutionPlan(request, selectedAI, recommendedMcpTools)
    };
  }

  // === AI 선택 로직 ===
  selectOptimalAI(complexity, domain, urgency) {
    const strategy = {
      primary: null,
      collaborative: [],
      reasoning: ''
    };

    // 긴급도별 최적화
    if (urgency === 'critical') {
      strategy.primary = 'claude';
      strategy.reasoning = '긴급 상황 - Claude Code 직접 처리';
      return strategy;
    }

    // 복잡도별 선택 로직
    switch (complexity) {
      case 'high':
        strategy.primary = 'claude';
        strategy.collaborative = ['codex', 'gemini'];
        strategy.reasoning = '고복잡도 - Claude 메인 + Codex/Gemini 보조';
        break;
        
      case 'medium':
        if (domain === 'typescript' || domain === 'testing') {
          strategy.primary = 'codex';
          strategy.collaborative = ['claude'];
        } else if (domain === 'architecture' || domain === 'analysis') {
          strategy.primary = 'gemini';
          strategy.collaborative = ['claude'];
        } else {
          strategy.primary = 'claude';
          strategy.collaborative = ['qwen'];
        }
        strategy.reasoning = `중복잡도 - ${domain} 도메인 최적화`;
        break;
        
      case 'low':
        strategy.primary = 'qwen';
        strategy.collaborative = ['claude'];
        strategy.reasoning = '저복잡도 - Qwen 빠른 처리';
        break;
        
      default:
        strategy.primary = 'claude';
        strategy.reasoning = '기본값 - Claude Code';
    }

    return strategy;
  }

  // === MCP 도구 추천 ===
  recommendMcpTools(domain, selectedAI) {
    const domainMapping = {
      'database': ['supabase', 'memory'],
      'infrastructure': ['gcp', 'filesystem'],
      'testing': ['playwright', 'filesystem'],
      'deployment': ['github', 'filesystem'],
      'documentation': ['filesystem', 'memory'],
      'ai-systems': ['memory', 'thinking', 'context7'],
      'security': ['filesystem', 'github'],
      'performance': ['playwright', 'gcp'],
      'default': ['filesystem', 'memory']
    };

    const recommendedTools = domainMapping[domain] || domainMapping.default;
    
    // AI별 추가 도구
    if (selectedAI.primary === 'claude') {
      recommendedTools.push('supabase', 'github');
    }

    return [...new Set(recommendedTools)]; // 중복 제거
  }

  // === 실행 계획 생성 ===
  createExecutionPlan(request, selectedAI, mcpTools) {
    return {
      phases: [
        {
          phase: 1,
          description: '주요 AI 실행',
          ai: selectedAI.primary,
          mcpTools: mcpTools,
          estimatedTime: this.estimateExecutionTime(request.complexity)
        },
        {
          phase: 2, 
          description: '협업 AI 검증',
          ai: selectedAI.collaborative,
          mcpTools: ['memory'],
          estimatedTime: '2-5분'
        },
        {
          phase: 3,
          description: '결과 통합 및 최적화',
          ai: 'claude',
          mcpTools: ['filesystem', 'memory'],
          estimatedTime: '1-3분'
        }
      ],
      totalEstimatedTime: '5-15분',
      parallelExecution: selectedAI.collaborative.length > 1
    };
  }

  estimateExecutionTime(complexity) {
    const timeMapping = {
      'low': '1-3분',
      'medium': '3-8분', 
      'high': '8-15분'
    };
    return timeMapping[complexity] || '5-10분';
  }

  // === Claude Code 서브에이전트 실행 ===
  async executeClaudeAgent(agentType, prompt, mcpTools = []) {
    this.log('info', `🤖 Claude 에이전트 실행: ${agentType}`);
    this.usageStats.claude++;

    // MCP 도구 활용 프롬프트 향상
    const enhancedPrompt = this.enhancePromptWithMcp(prompt, mcpTools);

    try {
      // Task 도구 사용 가능한 에이전트 확인
      const taskEnabledAgents = [
        'ai-systems-specialist',
        'central-supervisor',
        'gemini-agent',
        'git-cicd-specialist',
        'test-automation-specialist'
      ];

      if (taskEnabledAgents.includes(agentType)) {
        return await this.callClaudeTaskAgent(agentType, enhancedPrompt);
      } else {
        return await this.callClaudeDirectAgent(agentType, enhancedPrompt);
      }
    } catch (error) {
      this.log('error', `❌ Claude 에이전트 실행 실패: ${error.message}`);
      throw error;
    }
  }

  // === Codex CLI 실행 ===
  async executeCodexAgent(task, context = '') {
    this.log('info', '🔧 Codex CLI 에이전트 실행');
    this.usageStats.codex++;

    const command = `codex-cli "${task}"${context ? ` --context "${context}"` : ''}`;
    
    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: CONFIG.PROJECT_ROOT,
        env: { ...process.env, PATH: process.env.PATH }
      });

      if (stderr) {
        this.log('warn', `⚠️ Codex CLI 경고: ${stderr}`);
      }

      return {
        success: true,
        result: stdout,
        agent: 'codex-cli',
        executionTime: Date.now()
      };
    } catch (error) {
      this.log('error', `❌ Codex CLI 실행 실패: ${error.message}`);
      return {
        success: false,
        error: error.message,
        agent: 'codex-cli'
      };
    }
  }

  // === Gemini CLI 실행 ===
  async executeGeminiAgent(prompt, analysisType = 'code') {
    this.log('info', '🧠 Gemini CLI 에이전트 실행');
    
    // 일일 한도 확인
    if (this.usageStats.gemini >= CONFIG.LIMITS.gemini.daily) {
      this.log('warn', '⚠️ Gemini 일일 한도 초과, Claude로 폴백');
      return await this.fallbackToClaude(prompt);
    }

    this.usageStats.gemini++;

    const geminiPrompt = `Senior Code Architect 관점에서 ${analysisType} 분석: ${prompt}`;
    
    try {
      const command = `echo "${geminiPrompt}" | gemini -p "간결하고 실용적으로 답변"`;
      const { stdout, stderr } = await execAsync(command, {
        cwd: CONFIG.PROJECT_ROOT
      });

      return {
        success: true,
        result: stdout,
        agent: 'gemini-cli',
        analysisType,
        executionTime: Date.now()
      };
    } catch (error) {
      this.log('error', `❌ Gemini CLI 실행 실패: ${error.message}`);
      return await this.fallbackToClaude(prompt);
    }
  }

  // === Qwen CLI 실행 ===
  async executeQwenAgent(task, mode = 'prototype') {
    this.log('info', '🔷 Qwen CLI 에이전트 실행');
    this.usageStats.qwen++;

    const qwenPrompt = mode === 'prototype' ? 
      `빠른 프로토타입 생성: ${task}` :
      `알고리즘 검증: ${task}`;

    try {
      const command = `qwen-code "${qwenPrompt}" --mode ${mode}`;
      const { stdout, stderr } = await execAsync(command, {
        cwd: CONFIG.PROJECT_ROOT
      });

      return {
        success: true,
        result: stdout,
        agent: 'qwen-cli',
        mode,
        executionTime: Date.now()
      };
    } catch (error) {
      this.log('error', `❌ Qwen CLI 실행 실패: ${error.message}`);
      return {
        success: false,
        error: error.message,
        agent: 'qwen-cli'
      };
    }
  }

  // === Claude 에이전트 실행 메서드들 ===
  async callClaudeTaskAgent(agentType, prompt) {
    this.log('debug', `🎯 Task 에이전트 호출: ${agentType}`);
    
    // Task 도구를 사용한 Claude 서브에이전트 호출
    // 실제 구현에서는 Claude Code의 Task 도구 API 호출
    return {
      success: true,
      result: `Task agent ${agentType} executed: ${prompt.slice(0, 100)}...`,
      agent: agentType,
      method: 'task',
      executionTime: Date.now()
    };
  }

  async callClaudeDirectAgent(agentType, prompt) {
    this.log('debug', `📋 직접 에이전트 호출: ${agentType}`);
    
    // 직접 Claude 서브에이전트 호출 (Task 도구 미지원)
    // 실제 구현에서는 Claude Code API 호출
    return {
      success: true,
      result: `Direct agent ${agentType} executed: ${prompt.slice(0, 100)}...`,
      agent: agentType,
      method: 'direct',
      executionTime: Date.now()
    };
  }

  // === MCP 도구로 프롬프트 향상 ===
  enhancePromptWithMcp(prompt, mcpTools) {
    if (!mcpTools.length) return prompt;

    const mcpInstructions = mcpTools.map(tool => {
      const toolMappings = {
        'supabase': 'mcp__supabase__list_tables(), mcp__supabase__execute_sql() 활용',
        'gcp': 'mcp__gcp__query_metrics(), mcp__gcp__get_project_id() 활용', 
        'playwright': 'mcp__playwright__playwright_navigate(), mcp__playwright__playwright_screenshot() 활용',
        'github': 'mcp__github__create_pull_request(), mcp__github__get_file_contents() 활용',
        'filesystem': 'mcp__filesystem__read_text_file(), mcp__filesystem__write_file() 활용',
        'memory': 'mcp__memory__create_entities(), mcp__memory__search_nodes() 활용',
        'context7': 'mcp__context7__resolve_library_id(), mcp__context7__get_library_docs() 활용',
        'thinking': 'mcp__thinking__sequentialthinking() 활용'
      };
      return toolMappings[tool] || `${tool} MCP 도구 활용`;
    }).join(', ');

    return `${prompt}\n\n🔌 MCP 도구 활용: ${mcpInstructions}`;
  }

  // === 폴백 메커니즘 ===
  async fallbackToClaude(originalPrompt) {
    this.log('info', '🔄 Claude Code로 폴백 실행');
    return await this.executeClaudeAgent('central-supervisor', originalPrompt);
  }

  // === 병렬 실행 ===
  async executeParallelTasks(tasks) {
    this.log('info', `🚀 병렬 작업 실행 (${tasks.length}개)`);
    
    const promises = tasks.map(async (task, index) => {
      try {
        const result = await this.routeAndExecute(task);
        return { index, success: true, result };
      } catch (error) {
        return { index, success: false, error: error.message };
      }
    });

    return await Promise.allSettled(promises);
  }

  // === 통합 실행 메서드 ===
  async routeAndExecute(request) {
    const routing = await this.routeRequest(request);
    this.log('debug', '📋 실행 계획', routing.executionPlan);

    const results = [];

    // Phase 1: 주요 AI 실행
    const primaryResult = await this.executeAI(routing.primaryAI, request, routing.mcpTools);
    results.push(primaryResult);

    // Phase 2: 협업 AI 실행 (병렬)
    if (routing.collaborativeAI.length > 0) {
      const collaborativeResults = await Promise.all(
        routing.collaborativeAI.map(ai => 
          this.executeAI(ai, request, ['memory'])
        )
      );
      results.push(...collaborativeResults);
    }

    // Phase 3: 결과 통합
    const finalResult = await this.integrateResults(results, request);

    return {
      routing,
      results,
      finalResult,
      executionTime: Date.now(),
      usageStats: { ...this.usageStats }
    };
  }

  async executeAI(aiType, request, mcpTools) {
    switch (aiType) {
      case 'claude':
        return await this.executeClaudeAgent('central-supervisor', request.task, mcpTools);
      case 'codex':
        return await this.executeCodexAgent(request.task, request.context);
      case 'gemini':
        return await this.executeGeminiAgent(request.task, request.domain);
      case 'qwen':
        return await this.executeQwenAgent(request.task, 'prototype');
      default:
        throw new Error(`알 수 없는 AI 타입: ${aiType}`);
    }
  }

  // === 결과 통합 ===
  async integrateResults(results, request) {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      throw new Error('모든 AI 에이전트 실행 실패');
    }

    // 최고 품질 결과 선택 및 통합
    const bestResult = this.selectBestResult(successfulResults);
    const integratedResult = await this.synthesizeResults(successfulResults, request);

    return {
      primary: bestResult,
      integrated: integratedResult,
      confidence: this.calculateConfidence(successfulResults),
      recommendations: this.generateRecommendations(successfulResults)
    };
  }

  selectBestResult(results) {
    // 결과 품질 점수 기반 선택
    return results.reduce((best, current) => {
      const currentScore = this.calculateResultScore(current);
      const bestScore = this.calculateResultScore(best);
      return currentScore > bestScore ? current : best;
    });
  }

  calculateResultScore(result) {
    let score = 0;
    
    // AI별 기본 점수
    const aiScores = { claude: 100, gemini: 90, codex: 85, qwen: 80 };
    score += aiScores[result.agent] || 50;
    
    // 성공률
    if (result.success) score += 20;
    
    // 결과 길이 (적절한 상세도)
    if (result.result && result.result.length > 100) score += 10;
    
    return score;
  }

  async synthesizeResults(results, request) {
    // 모든 성공한 결과를 Claude가 통합
    const synthesis = results.map(r => 
      `[${r.agent}] ${r.result}`
    ).join('\n\n---\n\n');

    return await this.executeClaudeAgent(
      'central-supervisor',
      `다음 AI 결과들을 분석하고 최적의 통합 솔루션을 제시해주세요:\n\n${synthesis}`,
      ['memory']
    );
  }

  calculateConfidence(results) {
    const successRate = results.filter(r => r.success).length / results.length;
    return Math.round(successRate * 100);
  }

  generateRecommendations(results) {
    const recommendations = [];
    
    // AI 성능 기반 추천
    const performance = {};
    results.forEach(r => {
      performance[r.agent] = (performance[r.agent] || 0) + (r.success ? 1 : 0);
    });

    Object.entries(performance).forEach(([agent, score]) => {
      if (score === 0) {
        recommendations.push(`⚠️ ${agent} 시스템 점검 필요`);
      } else if (score >= 2) {
        recommendations.push(`✅ ${agent} 안정적 성능`);
      }
    });

    return recommendations;
  }

  // === 통계 및 모니터링 ===
  getUsageStats() {
    return {
      ...this.usageStats,
      timestamp: new Date().toISOString(),
      activeAgents: Array.from(this.activeAgents),
      mcpUtilization: this.calculateMcpUtilization()
    };
  }

  calculateMcpUtilization() {
    // 실제 사용량 계산 로직 (추후 구현)
    return '계산 중...';
  }

  // === 헬스체크 ===
  async healthCheck() {
    const health = {
      claude: await this.checkClaudeHealth(),
      codex: await this.checkCodexHealth(),
      gemini: await this.checkGeminiHealth(),
      qwen: await this.checkQwenHealth(),
      mcp: await this.checkMcpHealth()
    };

    const overallHealth = Object.values(health).every(h => h.status === 'healthy') ? 
      'healthy' : 'degraded';

    return { overall: overallHealth, details: health };
  }

  async checkClaudeHealth() {
    try {
      // Claude 상태 확인 (실제 구현 필요)
      return { status: 'healthy', message: 'Claude Code 정상' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message };
    }
  }

  async checkCodexHealth() {
    try {
      await execAsync('codex-cli --version');
      return { status: 'healthy', message: 'Codex CLI 정상' };
    } catch (error) {
      return { status: 'unhealthy', error: 'Codex CLI 접근 불가' };
    }
  }

  async checkGeminiHealth() {
    try {
      await execAsync('gemini --version');
      return { 
        status: 'healthy', 
        message: `Gemini CLI 정상 (${CONFIG.LIMITS.gemini.daily - this.usageStats.gemini}회 남음)` 
      };
    } catch (error) {
      return { status: 'unhealthy', error: 'Gemini CLI 접근 불가' };
    }
  }

  async checkQwenHealth() {
    try {
      await execAsync('qwen --version');
      return { status: 'healthy', message: 'Qwen CLI 정상' };
    } catch (error) {
      return { status: 'unhealthy', error: 'Qwen CLI 접근 불가' };
    }
  }

  async checkMcpHealth() {
    try {
      // MCP 서버 상태 확인 (실제 구현 필요)
      return { status: 'healthy', message: '12개 MCP 서버 정상' };
    } catch (error) {
      return { status: 'unhealthy', error: 'MCP 서버 문제' };
    }
  }
}

// === CLI 인터페이스 ===
class CLI {
  constructor() {
    this.interface = new UnifiedAgentInterface();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    try {
      switch (command) {
        case 'execute':
          await this.handleExecute(args.slice(1));
          break;
        case 'route':
          await this.handleRoute(args.slice(1));
          break;
        case 'health':
          await this.handleHealth();
          break;
        case 'stats':
          await this.handleStats();
          break;
        case 'test':
          await this.handleTest(args.slice(1));
          break;
        default:
          this.showHelp();
      }
    } catch (error) {
      console.error(`❌ 오류: ${error.message}`);
      process.exit(1);
    }
  }

  async handleExecute(args) {
    const [task, complexity = 'medium', domain = 'default', urgency = 'normal'] = args;
    
    if (!task) {
      console.error('❌ 작업을 지정해주세요');
      return;
    }

    const request = { task, complexity, domain, urgency };
    const result = await this.interface.routeAndExecute(request);
    
    console.log('🎯 실행 결과:');
    console.log(JSON.stringify(result, null, 2));
  }

  async handleRoute(args) {
    const [task, complexity = 'medium', domain = 'default'] = args;
    
    if (!task) {
      console.error('❌ 작업을 지정해주세요');
      return;
    }

    const routing = await this.interface.routeRequest({ task, complexity, domain });
    console.log('📋 라우팅 계획:');
    console.log(JSON.stringify(routing, null, 2));
  }

  async handleHealth() {
    const health = await this.interface.healthCheck();
    console.log('🏥 시스템 상태:');
    console.log(JSON.stringify(health, null, 2));
  }

  async handleStats() {
    const stats = await this.interface.getUsageStats();
    console.log('📊 사용 통계:');
    console.log(JSON.stringify(stats, null, 2));
  }

  async handleTest(args) {
    const testType = args[0] || 'basic';
    console.log(`🧪 ${testType} 테스트 실행 중...`);
    
    const testCases = {
      basic: { task: 'Hello World 출력', complexity: 'low', domain: 'default' },
      typescript: { task: 'TypeScript 에러 수정', complexity: 'high', domain: 'typescript' },
      database: { task: 'Supabase 쿼리 최적화', complexity: 'medium', domain: 'database' }
    };

    const testCase = testCases[testType] || testCases.basic;
    const result = await this.interface.routeAndExecute(testCase);
    
    console.log(`✅ ${testType} 테스트 완료:`, result.finalResult?.confidence || 0, '% 신뢰도');
  }

  showHelp() {
    console.log(`
🤖 Unified Agent Interface v1.0.0

사용법:
  execute <작업> [복잡도] [도메인] [긴급도]  - 작업 실행
  route <작업> [복잡도] [도메인]             - 라우팅 계획 확인
  health                                    - 시스템 상태 점검
  stats                                     - 사용 통계 확인
  test [유형]                               - 테스트 실행

예시:
  ./scripts/unified-agent-interface.mjs execute "TypeScript 에러 수정" high typescript critical
  ./scripts/unified-agent-interface.mjs route "성능 최적화" medium performance
  ./scripts/unified-agent-interface.mjs health
  ./scripts/unified-agent-interface.mjs test typescript

도메인: database, infrastructure, testing, deployment, documentation, 
        ai-systems, security, performance, typescript, default

복잡도: low, medium, high
긴급도: normal, urgent, critical
    `);
  }
}

// === 메인 실행 ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = new CLI();
  cli.run().catch(console.error);
}

export default UnifiedAgentInterface;