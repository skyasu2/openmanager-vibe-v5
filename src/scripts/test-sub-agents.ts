/**
 * 서브 에이전트 통합 테스트 스크립트
 * 각 에이전트를 Task 도구로 호출하고 MCP 활용을 확인합니다.
 */

import { AgentHelper } from '../services/agents/agent-helper';
import { MCPUsageTracker } from '../services/agents/mcp-tracker';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 에이전트별 테스트 케이스 정의
interface TestCase {
  agent: string;
  description: string;
  prompt: string;
  expectedMcp: string[];
  validateResult?: (result: any) => boolean;
}

const testCases: TestCase[] = [
  {
    agent: 'ai-systems-engineer',
    description: 'SimplifiedQueryEngine 분석 및 최적화 제안',
    prompt: `다음 작업을 수행해주세요:
1. SimplifiedQueryEngine의 현재 구조 분석
2. 성능 병목 지점 파악
3. 최적화 방안 3가지 제안
4. 구현 우선순위 제시`,
    expectedMcp: ['filesystem', 'sequential-thinking', 'memory'],
  },
  {
    agent: 'database-administrator',
    description: '데이터베이스 쿼리 성능 분석',
    prompt: `다음 작업을 수행해주세요:
1. 현재 프로젝트의 데이터베이스 스키마 분석
2. 인덱스 최적화 기회 찾기
3. 슬로우 쿼리 패턴 식별
4. 개선 방안 제시`,
    expectedMcp: ['supabase', 'filesystem', 'memory'],
  },
  {
    agent: 'code-review-specialist',
    description: '코드 품질 검토 및 개선',
    prompt: `src/services/agents/agent-helper.ts 파일을 검토하고:
1. DRY/SOLID 원칙 위반 사항 찾기
2. 타입 안전성 문제 확인
3. 보안 취약점 스캔
4. 리팩토링 제안`,
    expectedMcp: ['filesystem', 'serena'],
  },
  {
    agent: 'mcp-server-admin',
    description: 'MCP 서버 상태 및 설정 확인',
    prompt: `다음 작업을 수행해주세요:
1. 현재 활성화된 MCP 서버 목록 확인
2. 각 MCP 서버의 설정 상태 검증
3. 환경변수 설정 확인
4. 최적화 제안`,
    expectedMcp: ['filesystem', 'tavily-mcp'],
  },
  {
    agent: 'issue-summary',
    description: '시스템 상태 및 이슈 요약',
    prompt: `다음 작업을 수행해주세요:
1. 최근 24시간 시스템 상태 요약
2. 주요 에러 패턴 분석
3. 성능 메트릭 확인
4. 개선 우선순위 제시`,
    expectedMcp: ['supabase', 'filesystem', 'tavily-mcp'],
  },
  {
    agent: 'doc-structure-guardian',
    description: '문서 구조 분석 및 정리',
    prompt: `docs/ 폴더의 문서 구조를 분석하고:
1. 중복 문서 확인
2. 30일 이상 미사용 문서 식별
3. 문서 구조 개선안 제시
4. AI 친화적 구조 제안`,
    expectedMcp: ['filesystem', 'memory'],
  },
  {
    agent: 'ux-performance-optimizer',
    description: '프론트엔드 성능 분석',
    prompt: `다음 작업을 수행해주세요:
1. 현재 프로젝트의 Core Web Vitals 예상치 분석
2. 번들 크기 최적화 기회 찾기
3. 렌더링 성능 개선점 식별
4. Next.js 15 최적화 제안`,
    expectedMcp: ['filesystem', 'playwright', 'tavily-mcp'],
  },
  {
    agent: 'gemini-cli-collaborator',
    description: 'AI 협업을 통한 코드 분석',
    prompt: `다음 작업을 수행해주세요:
1. 현재 프로젝트의 AI 시스템 아키텍처 분석
2. Gemini CLI를 활용한 개선점 탐색
3. Claude와 Gemini의 시너지 방안 제시
4. 구현 로드맵 작성`,
    expectedMcp: ['filesystem', 'sequential-thinking'],
  },
  {
    agent: 'test-automation-specialist',
    description: '테스트 커버리지 분석 및 개선',
    prompt: `다음 작업을 수행해주세요:
1. 현재 프로젝트의 테스트 커버리지 확인
2. 테스트가 부족한 주요 컴포넌트 식별
3. E2E 테스트 시나리오 제안
4. 테스트 자동화 전략 수립`,
    expectedMcp: ['filesystem', 'playwright'],
  },
  {
    agent: 'central-supervisor',
    description: '복합 작업 조율 및 실행',
    prompt: `다음 복합 작업을 조율해주세요:
1. 시스템 전체 헬스 체크 (issue-summary 활용)
2. 주요 성능 병목 지점 분석 (database-administrator, ux-performance-optimizer 활용)
3. 코드 품질 종합 평가 (code-review-specialist 활용)
4. 개선 로드맵 작성 및 우선순위 설정`,
    expectedMcp: ['filesystem', 'memory', 'sequential-thinking'],
  },
];

// 테스트 실행 함수
async function runTest(testCase: TestCase): Promise<{
  success: boolean;
  result?: any;
  error?: string;
  mcpUsed: string[];
  executionTime: number;
}> {
  console.log(`\n🧪 테스트: ${testCase.description}`);
  console.log(`   에이전트: ${testCase.agent}`);

  const startTime = Date.now();

  try {
    // 실제로는 Task 도구를 직접 호출해야 하지만,
    // 현재는 AgentHelper를 통해 시뮬레이션
    const result = await AgentHelper.executeWithAgent(
      testCase.agent,
      'test-operation',
      async () => {
        // Task 도구 호출을 시뮬레이션
        console.log(`   프롬프트: ${testCase.prompt.substring(0, 50)}...`);

        // 여기서 실제 Task 도구를 호출해야 함
        // 현재는 시뮬레이션으로 대체
        return {
          completed: true,
          response: `${testCase.agent}가 작업을 완료했습니다.`,
          mockData: true,
        };
      },
      {
        validateMCP: true,
        includeContext: true,
        trackUsage: true,
        enableRecovery: true,
      }
    );

    const executionTime = Date.now() - startTime;

    // MCP 사용 통계 가져오기
    const agentReports = MCPUsageTracker.getAgentReport(testCase.agent);
    const mcpUsed = agentReports.map(r => r.mcp);

    console.log(`   ✅ 성공 (${executionTime}ms)`);
    console.log(`   MCP 사용: ${mcpUsed.join(', ') || '없음'}`);

    return {
      success: result.success,
      result: result.result,
      mcpUsed,
      executionTime,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.log(`   ❌ 실패 (${executionTime}ms)`);
    console.log(`   에러: ${(error as Error).message}`);

    return {
      success: false,
      error: (error as Error).message,
      mcpUsed: [],
      executionTime,
    };
  }
}

// 테스트 결과 요약
interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  mcpUsageRate: number;
  avgExecutionTime: number;
  problemAgents: string[];
  detailedResults: any[];
}

// 메인 테스트 실행 함수
async function runAllTests(): Promise<TestSummary> {
  console.log('🚀 서브 에이전트 통합 테스트 시작\n');
  console.log(`총 ${testCases.length}개 에이전트 테스트 예정\n`);

  const results = [];
  let passed = 0;
  let totalMcpExpected = 0;
  let totalMcpUsed = 0;
  let totalTime = 0;

  // 순차적으로 테스트 실행
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({
      ...testCase,
      ...result,
    });

    if (result.success) passed++;
    totalMcpExpected += testCase.expectedMcp.length;
    totalMcpUsed += result.mcpUsed.length;
    totalTime += result.executionTime;

    // 잠시 대기 (API 제한 방지)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // MCP 활용률 계산
  const mcpUsageRate =
    totalMcpExpected > 0 ? (totalMcpUsed / totalMcpExpected) * 100 : 0;

  // 문제 있는 에이전트 식별
  const problemAgents = results
    .filter(r => !r.success || r.mcpUsed.length === 0)
    .map(r => r.agent);

  const summary: TestSummary = {
    totalTests: testCases.length,
    passed,
    failed: testCases.length - passed,
    mcpUsageRate,
    avgExecutionTime: totalTime / testCases.length,
    problemAgents,
    detailedResults: results,
  };

  return summary;
}

// 보고서 생성 함수
function generateReport(summary: TestSummary): string {
  let report = `# 서브 에이전트 테스트 보고서

생성 시간: ${new Date().toLocaleString()}

## 📊 전체 요약

- **전체 테스트**: ${summary.totalTests}개
- **성공**: ${summary.passed}개 (${((summary.passed / summary.totalTests) * 100).toFixed(1)}%)
- **실패**: ${summary.failed}개
- **MCP 활용률**: ${summary.mcpUsageRate.toFixed(1)}%
- **평균 실행 시간**: ${summary.avgExecutionTime.toFixed(0)}ms

## ⚠️ 문제 에이전트

${
  summary.problemAgents.length > 0
    ? summary.problemAgents.map(a => `- ${a}`).join('\n')
    : '문제 에이전트 없음 ✅'
}

## 📋 상세 결과

| 에이전트 | 상태 | MCP 활용 | 실행 시간 | 비고 |
|---------|------|---------|----------|------|
`;

  summary.detailedResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const mcpStatus =
      result.mcpUsed.length > 0 ? `${result.mcpUsed.length}개` : '❌ 없음';
    const note =
      result.error || (result.mcpUsed.length === 0 ? 'MCP 미사용' : '정상');

    report += `| ${result.agent} | ${status} | ${mcpStatus} | ${result.executionTime}ms | ${note} |\n`;
  });

  // MCP 사용 통계 추가
  report += `\n## 📈 MCP 사용 통계\n\n`;
  report += MCPUsageTracker.generateMarkdownReport();

  // 권장사항 추가
  report += `\n## 💡 권장사항\n\n`;

  if (summary.mcpUsageRate < 50) {
    report += `- ⚠️ MCP 활용률이 ${summary.mcpUsageRate.toFixed(1)}%로 낮습니다. Task 도구와 MCP 통합을 확인하세요.\n`;
  }

  if (summary.problemAgents.length > 0) {
    report += `- ❌ ${summary.problemAgents.length}개 에이전트에 문제가 있습니다. 환경변수와 권한을 확인하세요.\n`;
  }

  if (summary.avgExecutionTime > 5000) {
    report += `- ⏱️ 평균 실행 시간이 ${summary.avgExecutionTime.toFixed(0)}ms로 느립니다. 성능 최적화가 필요합니다.\n`;
  }

  return report;
}

// 메인 실행 함수
async function main() {
  try {
    // 환경변수 검증 먼저 실행
    console.log('🔍 환경변수 검증 중...\n');
    const envCheck = spawnSync(
      'npx',
      ['tsx', 'src/scripts/verify-env-for-agents.ts'],
      {
        stdio: 'inherit',
      }
    );

    if (envCheck.status !== 0) {
      console.error(
        '\n❌ 환경변수 검증 실패. 위의 가이드를 참고하여 설정 후 다시 시도하세요.'
      );
      process.exit(1);
    }

    console.log('\n✅ 환경변수 검증 완료\n');

    // 테스트 실행
    const summary = await runAllTests();

    // 보고서 생성
    const report = generateReport(summary);
    console.log('\n' + report);

    // 보고서 파일 저장
    const reportPath = path.join(process.cwd(), 'sub-agents-test-report.md');
    fs.writeFileSync(reportPath, report);
    console.log(`\n📄 테스트 보고서가 ${reportPath}에 저장되었습니다.`);

    // 테스트 결과 JSON 저장
    const jsonPath = path.join(process.cwd(), 'sub-agents-test-results.json');
    fs.writeFileSync(jsonPath, JSON.stringify(summary, null, 2));
    console.log(`📄 테스트 결과가 ${jsonPath}에 저장되었습니다.`);

    // 종료 코드 설정
    process.exit(summary.failed === 0 ? 0 : 1);
  } catch (error) {
    console.error('테스트 실행 중 오류:', error);
    process.exit(1);
  }
}

// 실행
main().catch(console.error);
