/**
 * 서브 에이전트 사용 예시
 * 개선된 에이전트 시스템 활용 방법
 */

import { AgentHelper } from '../agent-helper';
import { MCPUsageTracker } from '../mcp-tracker';

// 1. 서브 에이전트 실행 예시
export async function exampleAgentExecution() {
  console.log('=== 서브 에이전트 실행 예시 ===\n');

  // AI 시스템 엔지니어 에이전트 실행
  const result = await AgentHelper.executeWithAgent(
    'ai-systems-engineer',
    'optimize-query-engine',
    async () => {
      // 실제 작업 로직
      console.log('SimplifiedQueryEngine 최적화 중...');
      // 여기에 실제 Task 호출이 들어갈 것
      return {
        optimized: true,
        improvements: ['캐싱 개선', '쿼리 병렬화', '인덱스 최적화'],
      };
    },
    {
      validateMCP: true,
      includeContext: true,
      trackUsage: true,
      enableRecovery: true,
    }
  );

  console.log('실행 결과:', JSON.stringify(result, null, 2));
}

// 2. 프롬프트 생성 예시
export async function examplePromptGeneration() {
  console.log('\n=== 프롬프트 생성 예시 ===\n');

  const prompt = await AgentHelper.generateAgentPrompt(
    'database-administrator',
    `다음 작업을 수행해주세요:
1. 슬로우 쿼리 분석
2. 인덱스 최적화 제안
3. 쿼리 성능 개선안 작성`,
    true
  );

  console.log('생성된 프롬프트:\n', prompt);
}

// 3. 시스템 상태 체크 예시
export async function exampleSystemHealthCheck() {
  console.log('\n=== 시스템 상태 체크 ===\n');

  const health = await AgentHelper.checkSystemHealth();

  console.log('시스템 상태:', health.healthy ? '✅ 정상' : '❌ 문제 있음');
  console.log('\nMCP 검증 결과:\n', health.mcpValidation);
  console.log('\n사용 통계:', health.usageStats);
  console.log('\n권장사항:');
  health.recommendations.forEach(rec => console.log(`  - ${rec}`));
}

// 4. 에이전트 디버그 예시
export async function exampleAgentDebug() {
  console.log('\n=== 에이전트 디버그 ===\n');

  const debugInfo = await AgentHelper.debugAgent('mcp-server-admin');
  console.log(debugInfo);
}

// 5. 병렬 에이전트 실행 예시
export async function exampleParallelExecution() {
  console.log('\n=== 병렬 에이전트 실행 ===\n');

  // 성능 문제 분석을 위한 병렬 실행
  const [frontendResult, backendResult] = await Promise.all([
    AgentHelper.executeWithAgent(
      'ux-performance-optimizer',
      'analyze-frontend-performance',
      async () => {
        console.log('프론트엔드 성능 분석 중...');
        return { LCP: '2.1s', CLS: '0.08', FID: '95ms' };
      }
    ),
    AgentHelper.executeWithAgent(
      'database-administrator',
      'analyze-query-performance',
      async () => {
        console.log('데이터베이스 쿼리 성능 분석 중...');
        return {
          slowQueries: 3,
          recommendations: ['인덱스 추가', '쿼리 최적화'],
        };
      }
    ),
  ]);

  console.log('프론트엔드 분석:', frontendResult);
  console.log('백엔드 분석:', backendResult);
}

// 6. 사용 보고서 생성 예시
export async function exampleUsageReport() {
  console.log('\n=== 사용 보고서 ===\n');

  // 테스트를 위한 몇 가지 추적 데이터 추가
  MCPUsageTracker.track('ai-systems-engineer', 'supabase', true, 250);
  MCPUsageTracker.track('ai-systems-engineer', 'supabase', true, 300);
  MCPUsageTracker.track(
    'ai-systems-engineer',
    'memory',
    false,
    5000,
    'Timeout'
  );
  MCPUsageTracker.track('database-administrator', 'supabase', true, 150);
  MCPUsageTracker.track('mcp-server-admin', 'github', false, 0, 'Auth failed');

  const report = AgentHelper.generateUsageReport();
  console.log(report);
}

// 7. 실제 Task 호출 통합 예시
export async function exampleRealTaskIntegration() {
  console.log('\n=== 실제 Task 호출 예시 ===\n');

  // 준비 단계
  const preparation = await AgentHelper.prepareAgentExecution(
    'code-review-specialist',
    { validateMCP: true, includeContext: true }
  );

  if (!preparation.ready) {
    console.error('에이전트 준비 실패:', preparation.issues);
    return;
  }

  // 프롬프트 생성
  const prompt = await AgentHelper.generateAgentPrompt(
    'code-review-specialist',
    'src/components/home/FeatureCardsGrid.tsx 파일의 코드 품질을 검토하고 개선점을 제안해주세요.',
    true
  );

  console.log('Task 호출을 위한 프롬프트 준비 완료');
  console.log('다음과 같이 호출하면 됩니다:');
  console.log(`
Task({
  subagent_type: 'code-review-specialist',
  description: 'Code quality review',
  prompt: \`${prompt}\`
});
  `);
}

// 8. 통합 실행 함수
export async function runAllExamples() {
  try {
    await exampleSystemHealthCheck();
    await exampleAgentExecution();
    await examplePromptGeneration();
    await exampleParallelExecution();
    await exampleUsageReport();
    await exampleAgentDebug();
    await exampleRealTaskIntegration();
  } catch (error) {
    console.error('예시 실행 중 오류:', error);
  }
}

// CLI에서 직접 실행할 경우
if (require.main === module) {
  runAllExamples().then(() => {
    console.log('\n모든 예시 실행 완료!');
  });
}
