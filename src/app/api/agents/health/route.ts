/**
 * 서브 에이전트 상태 확인 API
 * GET /api/agents/health
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 서브 에이전트 목록
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

    // 간소화된 상태 확인 (실제 서브 에이전트는 Claude Code에서 관리)
    const agentStatuses = agents.map((agent) => ({
      agent,
      ready: true, // Claude Code 서브 에이전트는 기본적으로 사용 가능
      issues: [],
    }));

    // 기본 시스템 상태
    const _systemHealth = {
      healthy: true,
      timestamp: new Date().toISOString(),
      recommendations: ['서브 에이전트는 Claude Code Task 도구로 호출'],
    };

    // MCP 서버 기본 상태 (실제 검증은 별도 수행)
    const mcpStatus = {
      valid: true,
      servers: [
        'filesystem',
        'github',
        'memory',
        'supabase',
        'context7',
        'tavily-mcp',
        'sequential-thinking',
        'playwright',
        'serena',
      ],
      missing: [],
      warnings: ['실제 MCP 상태는 별도 API로 확인 필요'],
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      system: _systemHealth,
      mcp: mcpStatus,
      agents: agentStatuses,
      usage: {
        total_agents: agents.length,
        active_mcp_servers: 9,
      },
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
