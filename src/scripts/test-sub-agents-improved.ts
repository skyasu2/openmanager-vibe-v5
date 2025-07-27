/**
 * 개선된 서브 에이전트 테스트 스크립트
 * TaskWrapper를 사용하여 MCP 활용률을 정확히 측정합니다.
 */

import { TaskWrapper } from '../services/agents/task-wrapper';
import { MCPUsageTracker } from '../services/agents/mcp-tracker';
import { MCPValidator } from '../services/agents/mcp-validator';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 개선된 테스트 케이스
interface ImprovedTestCase {
  agent: string;
  description: string;
  prompt: string;
  expectedMcp: string[];
  testType: 'basic' | 'advanced' | 'integration';
}

const improvedTestCases: ImprovedTestCase[] = [
  // 기본 테스트
  {
    agent: 'ai-systems-engineer',
    description: 'AI 시스템 기본 분석',
    prompt: `SimplifiedQueryEngine의 현재 구조를 분석하고 개선점을 제시하세요.
파일 시스템에서 관련 코드를 찾고, 메모리에 분석 결과를 저장하세요.`,
    expectedMcp: ['filesystem', 'memory'],
    testType: 'basic',
  },
  {
    agent: 'database-administrator',
    description: 'DB 스키마 최적화',
    prompt: `Supabase 데이터베이스의 테이블 목록을 확인하고,
인덱스 최적화가 필요한 테이블을 찾아 SQL로 개선안을 제시하세요.`,
    expectedMcp: ['supabase'],
    testType: 'basic',
  },

  // 고급 테스트
  {
    agent: 'code-review-specialist',
    description: '보안 취약점 스캔',
    prompt: `src/services 폴더의 코드를 검토하여 보안 취약점을 찾으세요.
GitHub에서 관련 이슈가 있는지 확인하고, Serena로 상세 분석을 수행하세요.`,
    expectedMcp: ['filesystem', 'github', 'serena'],
    testType: 'advanced',
  },
  {
    agent: 'ux-performance-optimizer',
    description: '성능 테스트 및 최적화',
    prompt: `홈페이지의 성능을 Playwright로 측정하고,
최적화가 필요한 부분을 파일 시스템에서 찾아 개선안을 제시하세요.
최신 웹 성능 기법을 Tavily로 검색하여 적용하세요.`,
    expectedMcp: ['playwright', 'filesystem', 'tavily-mcp'],
    testType: 'advanced',
  },

  // 통합 테스트
  {
    agent: 'central-supervisor',
    description: '전체 시스템 점검',
    prompt: `다음 작업을 순차적으로 수행하세요:
1. 파일 시스템에서 프로젝트 구조 파악
2. 메모리에 중요 정보 저장
3. Sequential thinking으로 개선 전략 수립
4. 각 전문 에이전트에게 작업 할당 계획 작성`,
    expectedMcp: ['filesystem', 'memory', 'sequential-thinking'],
    testType: 'integration',
  },
];

// 테스트 실행 함수
async function runImprovedTest(testCase: ImprovedTestCase): Promise<{
  success: boolean;
  mcpUsageRate: number;
  details: any;
}> {
  console.log(
    `\n🧪 [${testCase.testType.toUpperCase()}] ${testCase.description}`
  );
  console.log(`   에이전트: ${testCase.agent}`);

  try {
    const result = await TaskWrapper.callSubAgent(
      testCase.agent,
      testCase.description,
      testCase.prompt,
      {
        trackMCP: true,
        includeContext: true,
        enableRecovery: true,
        simulateOnly: true, // 개발 환경에서는 시뮬레이션
      }
    );

    // MCP 활용률 계산
    const expectedCount = testCase.expectedMcp.length;
    const usedCount = result.mcpToolsUsed?.length || 0;
    const usageRate = expectedCount > 0 ? (usedCount / expectedCount) * 100 : 0;

    console.log(`   ✅ 성공 (${result.executionTime}ms)`);
    console.log(`   MCP 사용: ${result.mcpToolsUsed?.join(', ') || '없음'}`);
    console.log(`   MCP 활용률: ${usageRate.toFixed(1)}%`);

    return {
      success: result.success,
      mcpUsageRate: usageRate,
      details: result,
    };
  } catch (error) {
    console.log(`   ❌ 실패: ${(error as Error).message}`);
    return {
      success: false,
      mcpUsageRate: 0,
      details: { error: (error as Error).message },
    };
  }
}

// 실제 Task 도구 호출 데모 (Claude Code 환경에서만 작동)
async function demoRealTaskCall(): Promise<void> {
  console.log('\n🚀 실제 Task 도구 호출 데모');
  console.log('━'.repeat(50));
  console.log('\n다음 명령어로 실제 서브 에이전트를 호출할 수 있습니다:\n');

  console.log(`Task({
  subagent_type: 'database-administrator',
  description: 'DB 성능 분석',
  prompt: \`다음 작업을 수행하세요:
1. mcp__supabase__list_tables로 테이블 목록 확인
2. mcp__supabase__execute_sql로 인덱스 현황 조회
3. 최적화 방안 제시\`
});\n`);

  console.log('이 명령은 Claude Code 환경에서 직접 실행해야 합니다.');
}

// 종합 보고서 생성
function generateImprovedReport(results: any[]): string {
  const totalTests = results.length;
  const successCount = results.filter(r => r.success).length;
  const totalMcpUsage = results.reduce((sum, r) => sum + r.mcpUsageRate, 0);
  const avgMcpUsage = totalMcpUsage / totalTests;

  // 테스트 타입별 분석
  const byType = {
    basic: results.filter((_, i) => improvedTestCases[i].testType === 'basic'),
    advanced: results.filter(
      (_, i) => improvedTestCases[i].testType === 'advanced'
    ),
    integration: results.filter(
      (_, i) => improvedTestCases[i].testType === 'integration'
    ),
  };

  let report = `# 개선된 서브 에이전트 테스트 보고서

생성 시간: ${new Date().toLocaleString()}

## 📊 전체 요약

- **전체 테스트**: ${totalTests}개
- **성공**: ${successCount}개 (${((successCount / totalTests) * 100).toFixed(1)}%)
- **평균 MCP 활용률**: ${avgMcpUsage.toFixed(1)}% (목표: 70%)

## 📈 테스트 타입별 분석

### 기본 테스트
- 테스트 수: ${byType.basic.length}개
- 성공률: ${((byType.basic.filter(r => r.success).length / byType.basic.length) * 100).toFixed(1)}%
- 평균 MCP 활용률: ${(byType.basic.reduce((sum, r) => sum + r.mcpUsageRate, 0) / byType.basic.length).toFixed(1)}%

### 고급 테스트  
- 테스트 수: ${byType.advanced.length}개
- 성공률: ${((byType.advanced.filter(r => r.success).length / byType.advanced.length) * 100).toFixed(1)}%
- 평균 MCP 활용률: ${(byType.advanced.reduce((sum, r) => sum + r.mcpUsageRate, 0) / byType.advanced.length).toFixed(1)}%

### 통합 테스트
- 테스트 수: ${byType.integration.length}개
- 성공률: ${((byType.integration.filter(r => r.success).length / byType.integration.length) * 100).toFixed(1)}%
- 평균 MCP 활용률: ${(byType.integration.reduce((sum, r) => sum + r.mcpUsageRate, 0) / byType.integration.length).toFixed(1)}%

## 🎯 MCP 서버별 활용 통계

`;

  // MCP 서버별 사용 횟수 집계
  const mcpUsage = new Map<string, number>();
  results.forEach(r => {
    r.details.mcpToolsUsed?.forEach((tool: string) => {
      const [, server] = tool.split('__');
      mcpUsage.set(server, (mcpUsage.get(server) || 0) + 1);
    });
  });

  report += '| MCP 서버 | 사용 횟수 | 활용도 |\n';
  report += '|----------|-----------|--------|\n';

  const sortedMcp = Array.from(mcpUsage.entries()).sort((a, b) => b[1] - a[1]);
  sortedMcp.forEach(([server, count]) => {
    const usage = count > 5 ? '⭐ 높음' : count > 2 ? '✅ 보통' : '⚠️ 낮음';
    report += `| ${server} | ${count} | ${usage} |\n`;
  });

  // 개선 권고사항
  report += `\n## 💡 권고사항\n\n`;

  if (avgMcpUsage < 50) {
    report +=
      '- ⚠️ MCP 활용률이 50% 미만입니다. 프롬프트에 MCP 도구 사용을 명시적으로 포함하세요.\n';
  }
  if (successCount < totalTests * 0.8) {
    report +=
      '- ❌ 20% 이상의 테스트가 실패했습니다. 에러 로그를 확인하세요.\n';
  }

  const unusedMcp = ['context7', 'playwright', 'serena'].filter(
    mcp => !mcpUsage.has(mcp)
  );
  if (unusedMcp.length > 0) {
    report += `- 💤 사용되지 않은 MCP: ${unusedMcp.join(', ')}\n`;
  }

  // 에이전트별 MCP 통계
  report += '\n## 📊 에이전트별 MCP 도구 통계\n\n';
  const agentStats = TaskWrapper.generateAgentMCPStats();

  Object.entries(agentStats).forEach(([agent, stats]) => {
    report += `### ${agent}\n`;
    report += `- MCP 서버: ${stats.mcpServers}개\n`;
    report += `- 사용 가능 도구: ${stats.totalTools}개\n`;
    report += `- 주요 MCP: ${stats.primaryMCP}\n\n`;
  });

  return report;
}

// 메인 실행 함수
async function main() {
  console.log('🚀 개선된 서브 에이전트 테스트 시작\n');

  // 환경변수 검증
  const envValidation = MCPValidator.validateEnvironment();
  if (!envValidation.valid) {
    console.error('❌ 환경변수 검증 실패:', envValidation.missing);
    console.log('\n💡 다음 명령어로 환경변수를 확인하세요:');
    console.log('   npm run agents:verify-env\n');
    return;
  }

  console.log('✅ 환경변수 검증 완료\n');

  // 테스트 실행
  const results = [];
  for (const testCase of improvedTestCases) {
    const result = await runImprovedTest(testCase);
    results.push(result);

    // API 제한 방지를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 실제 Task 호출 데모
  await demoRealTaskCall();

  // 보고서 생성
  const report = generateImprovedReport(results);
  console.log('\n' + report);

  // 파일로 저장
  const reportPath = path.join(process.cwd(), 'sub-agents-improved-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 개선된 테스트 보고서가 ${reportPath}에 저장되었습니다.`);

  // MCP 사용 통계
  const mcpReport = MCPUsageTracker.generateMarkdownReport();
  const mcpReportPath = path.join(
    process.cwd(),
    'mcp-usage-improved-report.md'
  );
  fs.writeFileSync(mcpReportPath, mcpReport);
  console.log(`📄 MCP 사용 통계가 ${mcpReportPath}에 저장되었습니다.`);
}

// 실행
main().catch(console.error);
