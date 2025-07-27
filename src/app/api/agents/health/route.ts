/**
 * 서브 에이전트 상태 확인 API
 * GET /api/agents/health
 */

import { NextResponse } from 'next/server';
import { AgentHelper } from '@/services/agents/agent-helper';
import { MCPValidator } from '@/services/agents/mcp-validator';

export async function GET() {
  try {
    // 전체 시스템 상태 확인
    const systemHealth = await AgentHelper.checkSystemHealth();

    // 각 에이전트별 상태 확인
    const agents = [
      'ai-systems-engineer',
      'database-administrator',
      'mcp-server-admin',
      'issue-summary',
      'code-review-specialist',
      'doc-structure-guardian',
      'ux-performance-optimizer',
      'gemini-cli-collaborator',
      'test-automation-specialist',
      'central-supervisor',
    ];

    const agentStatuses = await Promise.all(
      agents.map(async agent => {
        const validation = MCPValidator.validateForAgent(agent);
        return {
          agent,
          ready: validation.valid,
          issues: [...validation.missing, ...validation.warnings],
        };
      })
    );

    // 전체 MCP 검증
    const mcpValidation = MCPValidator.validateEnvironment();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        healthy: systemHealth.healthy,
        recommendations: systemHealth.recommendations,
      },
      mcp: {
        valid: mcpValidation.valid,
        missing: mcpValidation.missing,
        warnings: mcpValidation.warnings,
      },
      agents: agentStatuses,
      usage: systemHealth.usageStats,
    });
  } catch (error) {
    console.error('Agent health check error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check agent health',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
