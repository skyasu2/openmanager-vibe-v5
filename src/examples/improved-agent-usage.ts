/**
 * 📘 개선된 에이전트 시스템 사용 예시
 * 
 * 병렬 작업 가시성이 개선된 새로운 방식
 */

import {
  executeAgent,
  executeAgentsInParallel,
  executeAgentWithStream,
} from '@/lib/agent-executor';
import { progressTracker } from '@/lib/agent-progress-tracker';
import type { AgentTaskOptions } from '@/types/agent-types';

// ===== 1. 단일 에이전트 실행 (진행률 표시) =====
async function example1_singleAgentWithProgress() {
  console.log('\n📋 예시 1: 단일 에이전트 실행 (진행률 표시)\n');
  
  const result = await executeAgent(
    'database-administrator',
    'Upstash Redis와 Supabase 성능을 분석하고 최적화 방안을 제시해주세요.',
    {
      reportProgress: true,
      checkpointInterval: 30,
      maxExecutionTime: 180,
    }
  );
  
  console.log('\n실행 결과:', result);
}

// ===== 2. 스트리밍 출력과 함께 실행 =====
async function example2_streamingOutput() {
  console.log('\n📋 예시 2: 실시간 스트리밍 출력\n');
  
  const result = await executeAgentWithStream(
    'debugger-specialist',
    'TypeError: Cannot read property of undefined 오류를 분석하고 해결해주세요.',
    {
      checkpointInterval: 20,
    }
  );
  
  // 출력 예시:
  // [debugger-specialist] 🔍 스택 트레이스 분석 시작... (09:15:30)
  // [debugger-specialist] 📍 오류 위치: src/api/servers/route.ts:45 (09:15:32)
  // [debugger-specialist] 💡 원인: undefined 속성 접근 (09:15:35)
  // [debugger-specialist] 🛠️ 수정 방안 생성 중... (09:15:38)
}

// ===== 3. 체크포인트와 사용자 확인 =====
async function example3_checkpointConfirmation() {
  console.log('\n📋 예시 3: 중간 체크포인트 확인\n');
  
  const result = await executeAgent(
    'ai-systems-engineer',
    'SimplifiedQueryEngine을 UnifiedAIEngineRouter로 마이그레이션해주세요.',
    {
      reportProgress: true,
      requireConfirmation: true, // 주요 단계에서 확인
      checkpointInterval: 60,
    }
  );
  
  // 체크포인트 예시:
  // ─────────────────────────────────────────────────────────────
  // ⏸️  작업 체크포인트
  // ─────────────────────────────────────────────────────────────
  // 
  // 마이그레이션 계획이 수립되었습니다.
  // 
  // ✅ 완료된 작업:
  //    - 기존 SimplifiedQueryEngine 분석
  //    - UnifiedAIEngineRouter 구조 파악
  //    - 호환성 검토
  // 
  // 📋 다음 작업:
  //    - 인터페이스 변환
  //    - 테스트 코드 수정
  //    - 문서 업데이트
  // 
  // ❓ 계속 진행하시겠습니까? [Y/n]
  // ─────────────────────────────────────────────────────────────
}

// ===== 4. 병렬 작업 실행 (대시보드) =====
async function example4_parallelExecution() {
  console.log('\n📋 예시 4: 병렬 작업 실행\n');
  
  const tasks = [
    {
      agentType: 'vercel-monitor' as const,
      prompt: 'Vercel 배포 상태 및 무료 티어 사용량 확인',
      options: { reportProgress: true }
    },
    {
      agentType: 'database-administrator' as const,
      prompt: 'Upstash Redis 메모리 사용량 분석',
      options: { reportProgress: true }
    },
    {
      agentType: 'ux-performance-optimizer' as const,
      prompt: 'Core Web Vitals 측정 및 개선점 도출',
      options: { reportProgress: true, maxExecutionTime: 240 }
    },
    {
      agentType: 'security-auditor' as const,
      prompt: '보안 취약점 스캔',
      options: { reportProgress: true, maxExecutionTime: 300 }
    }
  ];
  
  const results = await executeAgentsInParallel(tasks);
  
  // 병렬 대시보드 출력 예시:
  // 📊 병렬 작업 대시보드
  // ──────────────────────────────────────────────────────────
  // 
  // 그룹 group-1234567890: [████████░░] 80% (3/4)
  //   ✅ vercel-monitor
  //   ✅ database-administrator
  //   🔄 ux-performance-optimizer - 75%
  //   ✅ security-auditor
  
  console.log('\n모든 작업 완료:', results.length, '개');
}

// ===== 5. 타임아웃 처리 =====
async function example5_timeoutHandling() {
  console.log('\n📋 예시 5: 타임아웃 처리\n');
  
  const result = await executeAgent(
    'test-automation-specialist',
    '모든 E2E 테스트를 실행하고 커버리지 리포트를 생성해주세요.',
    {
      reportProgress: true,
      maxExecutionTime: 60, // 60초 제한
    }
  );
  
  if (!result.success && result.error?.message.includes('타임아웃')) {
    console.log('⏰ 작업이 시간 초과되었습니다.');
    console.log('부분 결과:', result.checkpoints);
  }
}

// ===== 6. 복잡한 작업 조율 (central-supervisor) =====
async function example6_complexCoordination() {
  console.log('\n📋 예시 6: 복잡한 작업 조율\n');
  
  const result = await executeAgent(
    'central-supervisor',
    `
    다음 작업들을 조율해서 실행해주세요:
    1. 전체 코드베이스 보안 감사
    2. 성능 병목 지점 분석
    3. 테스트 커버리지 개선
    4. 문서 업데이트
    
    30초마다 진행 상황을 보고하고, 중요 결정 시 확인 요청해주세요.
    `,
    {
      reportProgress: true,
      checkpointInterval: 30,
      requireConfirmation: true,
      streamOutput: true,
    }
  );
  
  // central-supervisor가 자동으로 하위 에이전트들을 조율하여 실행
}

// ===== 7. 진행률 모니터링 (별도 프로세스) =====
async function example7_progressMonitoring() {
  console.log('\n📋 예시 7: 별도 진행률 모니터링\n');
  
  // 작업 시작
  const taskPromise = executeAgentsInParallel([
    {
      agentType: 'backend-gcp-specialist',
      prompt: 'GCP Functions 배포 및 최적화',
      options: { reportProgress: true }
    },
    {
      agentType: 'git-cicd-specialist',
      prompt: 'CI/CD 파이프라인 설정',
      options: { reportProgress: true }
    }
  ]);
  
  // 별도로 진행 상황 모니터링
  const monitorInterval = setInterval(() => {
    console.clear();
    console.log(progressTracker.displayCurrentStatus());
  }, 1000);
  
  try {
    await taskPromise;
  } finally {
    clearInterval(monitorInterval);
  }
}

// ===== 8. 실패 복구 및 재시도 =====
async function example8_failureRecovery() {
  console.log('\n📋 예시 8: 실패 복구 및 재시도\n');
  
  const options: AgentTaskOptions = {
    reportProgress: true,
    retryOnFailure: true,
    maxRetries: 3,
  };
  
  const result = await executeAgent(
    'mcp-server-admin',
    'MCP 서버 연결 상태를 확인하고 문제가 있으면 재시작해주세요.',
    options
  );
  
  if (!result.success) {
    console.log('❌ 최종 실패:', result.error?.message);
    console.log('재시도 횟수:', options.maxRetries);
  }
}

// ===== 실행 예시 선택 =====
export async function runImprovedAgentExamples() {
  console.log('🚀 개선된 에이전트 시스템 예시\n');
  console.log('다음 중 실행할 예시를 선택하세요:');
  console.log('1. 단일 에이전트 실행 (진행률 표시)');
  console.log('2. 스트리밍 출력');
  console.log('3. 체크포인트와 사용자 확인');
  console.log('4. 병렬 작업 실행');
  console.log('5. 타임아웃 처리');
  console.log('6. 복잡한 작업 조율');
  console.log('7. 진행률 모니터링');
  console.log('8. 실패 복구 및 재시도');
  
  // 실제로는 사용자 입력을 받아 실행
  // 여기서는 예시 4번 실행
  await example4_parallelExecution();
}

// ===== React 컴포넌트에서 사용하는 예시 =====
export function AgentExecutionExample() {
  // React 컴포넌트에서는 AgentProgressDisplay 사용
  /*
  import { AgentProgressDisplay } from '@/components/agent/AgentProgressDisplay';
  
  function MyComponent() {
    const [taskIds, setTaskIds] = useState<string[]>([]);
    
    const handleExecute = async () => {
      const result = await executeAgent('database-administrator', '...', {
        reportProgress: true
      });
      setTaskIds([result.taskId]);
    };
    
    return (
      <div>
        <button onClick={handleExecute}>작업 실행</button>
        <AgentProgressDisplay taskIds={taskIds} />
      </div>
    );
  }
  */
}