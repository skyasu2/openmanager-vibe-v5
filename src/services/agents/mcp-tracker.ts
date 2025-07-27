/**
 * MCP 사용 추적 시스템
 * 서브 에이전트의 MCP 도구 사용 현황을 추적하고 분석
 */

export interface MCPUsageStats {
  calls: number;
  successes: number;
  failures: number;
  avgResponseTime: number;
  lastUsed: string;
  errors: string[];
}

export interface MCPUsageReport {
  agent: string;
  mcp: string;
  stats: MCPUsageStats;
  successRate: number;
  recommendation?: string;
}

export class MCPUsageTracker {
  private static usage = new Map<string, MCPUsageStats>();
  private static responseTimes = new Map<string, number[]>();

  /**
   * MCP 도구 사용 추적
   */
  static track(
    agentType: string,
    mcpTool: string,
    success: boolean,
    responseTime?: number,
    error?: string
  ): void {
    const key = `${agentType}:${mcpTool}`;
    const stats = this.usage.get(key) || {
      calls: 0,
      successes: 0,
      failures: 0,
      avgResponseTime: 0,
      lastUsed: new Date().toISOString(),
      errors: [],
    };

    // 통계 업데이트
    stats.calls++;
    if (success) {
      stats.successes++;
    } else {
      stats.failures++;
      if (error) {
        // 최근 10개의 에러만 보관
        stats.errors.push(error);
        if (stats.errors.length > 10) {
          stats.errors.shift();
        }
      }
    }
    stats.lastUsed = new Date().toISOString();

    // 응답 시간 추적
    if (responseTime !== undefined) {
      const times = this.responseTimes.get(key) || [];
      times.push(responseTime);
      // 최근 100개의 응답 시간만 보관
      if (times.length > 100) {
        times.shift();
      }
      this.responseTimes.set(key, times);

      // 평균 응답 시간 계산
      stats.avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
    }

    this.usage.set(key, stats);
  }

  /**
   * 전체 사용 보고서 생성
   */
  static getReport(): MCPUsageReport[] {
    const reports: MCPUsageReport[] = [];

    this.usage.forEach((stats, key) => {
      const [agent, mcp] = key.split(':');
      const successRate =
        stats.calls > 0 ? (stats.successes / stats.calls) * 100 : 0;

      const report: MCPUsageReport = {
        agent,
        mcp,
        stats,
        successRate,
      };

      // 권장사항 추가
      if (successRate < 50) {
        report.recommendation = `⚠️ Low success rate. Check ${mcp} configuration for ${agent}`;
      } else if (stats.avgResponseTime > 5000) {
        report.recommendation = `⏱️ Slow response time. Consider optimizing ${mcp} usage`;
      } else if (stats.failures > 10) {
        report.recommendation = `❌ High failure count. Review error patterns`;
      }

      reports.push(report);
    });

    // 에이전트별로 정렬
    return reports.sort((a, b) => {
      if (a.agent !== b.agent) return a.agent.localeCompare(b.agent);
      return a.mcp.localeCompare(b.mcp);
    });
  }

  /**
   * 특정 에이전트의 사용 통계
   */
  static getAgentReport(agentType: string): MCPUsageReport[] {
    return this.getReport().filter(report => report.agent === agentType);
  }

  /**
   * 특정 MCP의 사용 통계
   */
  static getMCPReport(mcpName: string): MCPUsageReport[] {
    return this.getReport().filter(report => report.mcp === mcpName);
  }

  /**
   * 사용률 분석
   */
  static getUsageAnalysis(): {
    totalCalls: number;
    overallSuccessRate: number;
    mostUsedMCP: { name: string; calls: number };
    leastUsedMCP: { name: string; calls: number };
    problematicPairs: Array<{ agent: string; mcp: string; issue: string }>;
  } {
    const reports = this.getReport();

    let totalCalls = 0;
    let totalSuccesses = 0;
    let mostUsed = { name: '', calls: 0 };
    let leastUsed = { name: '', calls: Infinity };
    const problematicPairs: Array<{
      agent: string;
      mcp: string;
      issue: string;
    }> = [];

    // MCP별 총 사용량 계산
    const mcpTotals = new Map<string, number>();

    reports.forEach(report => {
      totalCalls += report.stats.calls;
      totalSuccesses += report.stats.successes;

      // MCP별 집계
      const current = mcpTotals.get(report.mcp) || 0;
      mcpTotals.set(report.mcp, current + report.stats.calls);

      // 문제 있는 조합 찾기
      if (report.successRate < 70) {
        problematicPairs.push({
          agent: report.agent,
          mcp: report.mcp,
          issue: `Low success rate: ${report.successRate.toFixed(1)}%`,
        });
      }
      if (report.stats.avgResponseTime > 3000) {
        problematicPairs.push({
          agent: report.agent,
          mcp: report.mcp,
          issue: `Slow response: ${report.stats.avgResponseTime.toFixed(0)}ms`,
        });
      }
    });

    // 가장 많이/적게 사용된 MCP 찾기
    mcpTotals.forEach((calls, mcp) => {
      if (calls > mostUsed.calls) {
        mostUsed = { name: mcp, calls };
      }
      if (calls < leastUsed.calls && calls > 0) {
        leastUsed = { name: mcp, calls };
      }
    });

    return {
      totalCalls,
      overallSuccessRate:
        totalCalls > 0 ? (totalSuccesses / totalCalls) * 100 : 0,
      mostUsedMCP: mostUsed,
      leastUsedMCP:
        leastUsed.calls === Infinity ? { name: 'none', calls: 0 } : leastUsed,
      problematicPairs,
    };
  }

  /**
   * 사용 통계 초기화
   */
  static reset(): void {
    this.usage.clear();
    this.responseTimes.clear();
  }

  /**
   * 마크다운 형식의 보고서 생성
   */
  static generateMarkdownReport(): string {
    const analysis = this.getUsageAnalysis();
    const reports = this.getReport();

    let markdown = `# MCP Usage Report

Generated: ${new Date().toLocaleString()}

## Summary

- **Total API Calls**: ${analysis.totalCalls}
- **Overall Success Rate**: ${analysis.overallSuccessRate.toFixed(1)}%
- **Most Used MCP**: ${analysis.mostUsedMCP.name} (${analysis.mostUsedMCP.calls} calls)
- **Least Used MCP**: ${analysis.leastUsedMCP.name} (${analysis.leastUsedMCP.calls} calls)

## Problematic Combinations

`;

    if (analysis.problematicPairs.length > 0) {
      markdown += '| Agent | MCP | Issue |\n|-------|-----|-------|\n';
      analysis.problematicPairs.forEach(pair => {
        markdown += `| ${pair.agent} | ${pair.mcp} | ${pair.issue} |\n`;
      });
    } else {
      markdown += 'No problematic combinations detected ✅\n';
    }

    markdown += '\n## Detailed Usage by Agent\n\n';

    // 에이전트별로 그룹화
    const byAgent = new Map<string, MCPUsageReport[]>();
    reports.forEach(report => {
      const current = byAgent.get(report.agent) || [];
      current.push(report);
      byAgent.set(report.agent, current);
    });

    byAgent.forEach((agentReports, agent) => {
      markdown += `### ${agent}\n\n`;
      markdown += '| MCP | Calls | Success Rate | Avg Response | Status |\n';
      markdown += '|-----|-------|--------------|--------------|--------|\n';

      agentReports.forEach(report => {
        const status =
          report.successRate >= 90
            ? '✅'
            : report.successRate >= 70
              ? '⚠️'
              : '❌';
        markdown += `| ${report.mcp} | ${report.stats.calls} | ${report.successRate.toFixed(1)}% | ${report.stats.avgResponseTime.toFixed(0)}ms | ${status} |\n`;
      });

      markdown += '\n';
    });

    return markdown;
  }
}
