/**
 * 서브 에이전트 헬퍼
 * 모든 에이전트 관련 기능을 통합하여 쉽게 사용할 수 있도록 제공
 */

import { MCPValidator } from './mcp-validator';
import { AgentContextProvider } from './context-provider';
import { AgentErrorRecovery } from './error-recovery';
import { MCPUsageTracker } from './mcp-tracker';

export interface AgentExecutionOptions {
  validateMCP?: boolean;
  includeContext?: boolean;
  trackUsage?: boolean;
  enableRecovery?: boolean;
  timeout?: number;
}

export interface AgentExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  context?: any;
  validationIssues?: string[];
  executionTime?: number;
}

export class AgentHelper {
  /**
   * 서브 에이전트 실행 전 준비 작업
   */
  static async prepareAgentExecution(
    agentType: string,
    options: AgentExecutionOptions = {}
  ): Promise<{ ready: boolean; issues: string[]; context?: any }> {
    const issues: string[] = [];

    // 1. MCP 환경변수 검증
    if (options.validateMCP !== false) {
      const validation = MCPValidator.validateForAgent(agentType);
      if (!validation.valid) {
        issues.push(...validation.missing.map(m => `Missing: ${m}`));
      }
      if (validation.warnings.length > 0) {
        issues.push(...validation.warnings.map(w => `Warning: ${w}`));
      }
    }

    // 2. 에이전트 컨텍스트 구축
    let context;
    if (options.includeContext !== false) {
      context = await AgentContextProvider.buildContext(agentType);
    }

    return {
      ready: issues.filter(i => i.startsWith('Missing:')).length === 0,
      issues,
      context,
    };
  }

  /**
   * 에이전트 작업 실행 래퍼
   */
  static async executeWithAgent(
    agentType: string,
    operation: string,
    task: () => Promise<any>,
    options: AgentExecutionOptions = {}
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const preparation = await this.prepareAgentExecution(agentType, options);

    // 준비가 안 되었으면 조기 종료
    if (!preparation.ready) {
      return {
        success: false,
        error: 'Agent not ready',
        validationIssues: preparation.issues,
      };
    }

    try {
      let result;

      // 에러 복구 활성화 여부에 따라 다르게 실행
      if (options.enableRecovery !== false) {
        // 복구 전략 가져오기
        const strategies = AgentErrorRecovery.getAgentRecoveryStrategies(
          agentType,
          operation
        );

        // 기본 작업을 첫 번째 전략으로 추가
        const allStrategies = [
          { name: 'Primary operation', handler: task },
          ...strategies,
        ];

        result = await AgentErrorRecovery.withMultipleStrategies(
          allStrategies,
          { agent: agentType, operation }
        );
      } else {
        // 단순 실행
        result = await task();
      }

      const executionTime = Date.now() - startTime;

      // 사용 추적
      if (options.trackUsage !== false) {
        // MCP 도구 사용을 감지했다고 가정 (실제로는 더 정교한 감지 로직 필요)
        MCPUsageTracker.track(agentType, 'unknown', true, executionTime);
      }

      return {
        success: true,
        result,
        context: preparation.context,
        validationIssues: preparation.issues,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = (error as Error).message;

      // 에러 추적
      if (options.trackUsage !== false) {
        MCPUsageTracker.track(
          agentType,
          'unknown',
          false,
          executionTime,
          errorMessage
        );
      }

      // 에러 로깅
      AgentErrorRecovery.logError(
        { agent: agentType, operation },
        error as Error
      );

      return {
        success: false,
        error: errorMessage,
        context: preparation.context,
        validationIssues: preparation.issues,
        executionTime,
      };
    }
  }

  /**
   * 서브 에이전트 프롬프트 생성
   */
  static async generateAgentPrompt(
    agentType: string,
    userPrompt: string,
    includeContext: boolean = true
  ): Promise<string> {
    let fullPrompt = '';

    if (includeContext) {
      const context = await AgentContextProvider.buildContext(agentType);
      fullPrompt += AgentContextProvider.formatContextForPrompt(context);
      fullPrompt += '\n\n';
    }

    fullPrompt += '## Task\n\n';
    fullPrompt += userPrompt;

    return fullPrompt;
  }

  /**
   * 전체 시스템 상태 체크
   */
  static async checkSystemHealth(): Promise<{
    healthy: boolean;
    mcpValidation: any;
    usageStats: any;
    recommendations: string[];
  }> {
    // 전체 MCP 검증
    const mcpValidation = MCPValidator.validateEnvironment();

    // 사용 통계 분석
    const usageStats = MCPUsageTracker.getUsageAnalysis();

    const recommendations: string[] = [];

    // MCP 설정 권장사항
    if (!mcpValidation.valid) {
      recommendations.push(
        '🔧 Configure missing environment variables in .env.local'
      );
    }

    // 사용률 기반 권장사항
    if (usageStats.overallSuccessRate < 80) {
      recommendations.push(
        '⚠️ Overall success rate is low. Check error logs and MCP configurations'
      );
    }

    if (usageStats.problematicPairs.length > 0) {
      recommendations.push(
        `🔍 ${usageStats.problematicPairs.length} agent-MCP combinations need attention`
      );
    }

    // MCP 사용률 권장사항
    if (usageStats.totalCalls === 0) {
      recommendations.push(
        '💡 No MCP usage tracked yet. Agents may not be utilizing MCP tools effectively'
      );
    }

    return {
      healthy: mcpValidation.valid && usageStats.overallSuccessRate >= 70,
      mcpValidation: MCPValidator.formatValidationResult(mcpValidation),
      usageStats,
      recommendations,
    };
  }

  /**
   * 에이전트 사용 보고서 생성
   */
  static generateUsageReport(): string {
    return MCPUsageTracker.generateMarkdownReport();
  }

  /**
   * 디버그 정보 출력
   */
  static async debugAgent(agentType: string): Promise<string> {
    let debug = `# Debug Information for ${agentType}\n\n`;

    // 1. 에이전트 정의 확인
    const context = await AgentContextProvider.buildContext(agentType);
    debug += `## Agent Definition\n`;
    debug += `- Name: ${context.agent.name}\n`;
    debug += `- Type: ${context.agent.type}\n`;
    debug += `- Description: ${context.agent.description}\n\n`;

    // 2. MCP 검증
    debug += `## MCP Validation\n`;
    const validation = MCPValidator.validateForAgent(agentType);
    debug += MCPValidator.formatValidationResult(validation);
    debug += '\n\n';

    // 3. 사용 통계
    debug += `## Usage Statistics\n`;
    const agentReports = MCPUsageTracker.getAgentReport(agentType);
    if (agentReports.length > 0) {
      agentReports.forEach(report => {
        debug += `- ${report.mcp}: ${report.stats.calls} calls, ${report.successRate.toFixed(1)}% success\n`;
      });
    } else {
      debug += 'No usage data available\n';
    }

    // 4. 복구 전략
    debug += `\n## Available Recovery Strategies\n`;
    const sampleStrategies = AgentErrorRecovery.getAgentRecoveryStrategies(
      agentType,
      'default'
    );
    sampleStrategies.forEach(strategy => {
      debug += `- ${strategy.name}\n`;
    });

    return debug;
  }
}
