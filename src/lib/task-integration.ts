/**
 * 🔗 Task 도구 통합 레이어
 * 
 * 기존 Task 도구와 새로운 진행률 시스템 연결
 */

import { agentExecutor } from './agent-executor';
import { progressTracker } from './agent-progress-tracker';
import type {
  SubAgentType,
  AgentTaskOptions,
  ExecutionResult,
  Checkpoint,
} from '@/types/agent-types';

// Task 도구의 기존 인터페이스
interface LegacyTaskParams {
  subagent_type: string;
  description: string;
  prompt: string;
}

// 개선된 Task 인터페이스
interface ImprovedTaskParams extends LegacyTaskParams {
  options?: AgentTaskOptions;
  onProgress?: (percentage: number, message: string) => void;
  onCheckpoint?: (checkpoint: Checkpoint) => Promise<boolean>;
}

/**
 * 개선된 Task 함수
 * 
 * 기존 Task 도구를 래핑하여 진행률 추적 기능 추가
 */
export async function ImprovedTask(params: ImprovedTaskParams): Promise<any> {
  const { subagent_type, description, prompt, options, onProgress, onCheckpoint } = params;
  
  // 타입 검증
  if (!isValidAgentType(subagent_type)) {
    throw new Error(`Invalid agent type: ${subagent_type}`);
  }
  
  // 옵션 병합
  const mergedOptions: AgentTaskOptions = {
    reportProgress: true,
    streamOutput: process.env.VERBOSE === 'true',
    ...options,
  };
  
  try {
    // 실행 시작 로그
    console.log(`\n🚀 ${subagent_type} 작업 시작: ${description}\n`);
    
    // 에이전트 실행
    const result = await agentExecutor.executeTask(
      subagent_type as SubAgentType,
      prompt,
      mergedOptions
    );
    
    // 결과 처리
    if (result.success) {
      console.log(`\n✅ ${subagent_type} 작업 완료\n`);
      return result.result;
    } else {
      console.error(`\n❌ ${subagent_type} 작업 실패: ${result.error?.message}\n`);
      throw result.error;
    }
  } catch (error) {
    console.error(`\n❌ 작업 실행 중 오류 발생: ${error}\n`);
    throw error;
  }
}

/**
 * 병렬 Task 실행
 * 
 * 여러 에이전트를 동시에 실행하고 진행 상황 모니터링
 */
export async function ParallelTasks(
  tasks: Array<{
    subagent_type: string;
    description: string;
    prompt: string;
    options?: AgentTaskOptions;
  }>
): Promise<ExecutionResult[]> {
  console.log(`\n🚀 ${tasks.length}개 에이전트 병렬 실행 시작\n`);
  
  // 타입 검증 및 변환
  const validatedTasks = tasks.map(task => {
    if (!isValidAgentType(task.subagent_type)) {
      throw new Error(`Invalid agent type: ${task.subagent_type}`);
    }
    
    return {
      agentType: task.subagent_type as SubAgentType,
      prompt: task.prompt,
      options: {
        reportProgress: true,
        streamOutput: process.env.VERBOSE === 'true',
        ...task.options,
      },
    };
  });
  
  // 병렬 실행
  const results = await agentExecutor.executeParallel(validatedTasks);
  
  // 결과 요약
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`\n📊 병렬 실행 완료: 성공 ${successCount}개, 실패 ${failureCount}개\n`);
  
  return results;
}

/**
 * 기존 Task 도구를 개선된 버전으로 마이그레이션
 * 
 * 사용 예시:
 * ```typescript
 * // 기존 방식
 * Task({
 *   subagent_type: 'database-administrator',
 *   description: 'DB 최적화',
 *   prompt: 'Upstash Redis 최적화'
 * });
 * 
 * // 개선된 방식
 * await ImprovedTask({
 *   subagent_type: 'database-administrator',
 *   description: 'DB 최적화',
 *   prompt: 'Upstash Redis 최적화',
 *   options: {
 *     reportProgress: true,
 *     checkpointInterval: 30
 *   }
 * });
 * ```
 */
export function migrateToImprovedTask(legacyTask: LegacyTaskParams): ImprovedTaskParams {
  return {
    ...legacyTask,
    options: {
      reportProgress: true,
      checkpointInterval: 30,
      streamOutput: process.env.VERBOSE === 'true',
    },
  };
}

/**
 * 진행 상황 모니터링 헬퍼
 */
export function monitorTaskProgress(taskId: string): void {
  const interval = setInterval(() => {
    const task = (progressTracker as any).tasks.get(taskId);
    if (!task) {
      clearInterval(interval);
      return;
    }
    
    if (task.status === 'in_progress') {
      console.log(
        `[${task.agentType}] ${progressTracker.createProgressBar(task.progress.percentage)} ${task.progress.currentStep}`
      );
    }
    
    if (['completed', 'failed', 'timeout', 'cancelled'].includes(task.status)) {
      clearInterval(interval);
    }
  }, 2000);
}

/**
 * 현재 실행 중인 모든 작업 표시
 */
export function showAllRunningTasks(): void {
  console.log(progressTracker.displayCurrentStatus());
}

/**
 * 병렬 작업 대시보드 표시
 */
export function showParallelDashboard(): void {
  console.log(progressTracker.getParallelDashboard());
}

// 유틸리티 함수

function isValidAgentType(type: string): boolean {
  const validTypes: SubAgentType[] = [
    'central-supervisor',
    'code-review-specialist',
    'security-auditor',
    'database-administrator',
    'ux-performance-optimizer',
    'test-automation-specialist',
    'ai-systems-engineer',
    'doc-structure-guardian',
    'doc-writer-researcher',
    'debugger-specialist',
    'vercel-monitor',
    'mcp-server-admin',
    'gemini-cli-collaborator',
    'agent-coordinator',
    'backend-gcp-specialist',
    'git-cicd-specialist',
    'execution-tracker',
  ];
  
  return validTypes.includes(type as SubAgentType);
}

// 글로벌 Task 함수 오버라이드 (선택적)
if (typeof global !== 'undefined' && process.env.USE_IMPROVED_TASK === 'true') {
  (global as any).Task = ImprovedTask;
  (global as any).ParallelTasks = ParallelTasks;
  console.log('✅ Task 도구가 개선된 버전으로 업그레이드되었습니다.');
}