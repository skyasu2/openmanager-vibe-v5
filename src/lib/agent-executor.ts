/**
 * 🎯 에이전트 실행 래퍼
 *
 * 타임아웃, 에러 처리, 진행률 보고를 포함한 실행 관리
 */

import { progressTracker } from './agent-progress-tracker';
import type {
  AgentTask,
  AgentTaskOptions,
  AgentExecutionContext,
  ExecutionResult,
  Checkpoint,
  SubAgentType,
} from '@/types/agent-types';
import { AGENT_TIMEOUTS } from '@/types/agent-types';

// 실제 환경에서는 Task 도구가 제공됨

// 에이전트 실행기
export class AgentExecutor {
  private activeContexts: Map<string, AgentExecutionContext> = new Map();

  /**
   * 단일 에이전트 작업 실행
   */
  async executeTask(
    agentType: SubAgentType,
    prompt: string,
    options?: AgentTaskOptions
  ): Promise<ExecutionResult> {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // 작업 생성
    const task: AgentTask = {
      id: taskId,
      agentType,
      prompt,
      options,
      status: 'pending',
      progress: {
        percentage: 0,
        currentStep: '작업 대기 중...',
      },
      checkpoints: [],
      logs: [],
      startTime: new Date(),
    };

    // 진행률 추적기에 등록
    progressTracker.registerTask(task);

    // 실행 컨텍스트 생성
    const context: AgentExecutionContext = {
      task,
      onProgress: (updatedTask) => {
        progressTracker.updateTask(taskId, updatedTask);
      },
      onCheckpoint: async (checkpoint) => {
        progressTracker.addCheckpoint(taskId, checkpoint);

        if (checkpoint.requiresConfirmation) {
          console.log(progressTracker.displayCheckpoint(checkpoint));
          // 실제 환경에서는 사용자 입력 대기
          return true;
        }
        return true;
      },
      onLog: (entry) => {
        progressTracker.addLog(taskId, entry);
      },
    };

    this.activeContexts.set(taskId, context);

    try {
      // 작업 시작
      await this.updateTaskStatus(taskId, 'starting', '작업 초기화 중...');

      // 타임아웃 설정
      const timeout =
        options?.maxExecutionTime || AGENT_TIMEOUTS[agentType] || 180;
      const timeoutPromise = this.createTimeout(taskId, timeout);

      // 실제 작업 실행
      const executionPromise = this.runAgentTask(context);

      // 타임아웃과 실행 경쟁
      const result = await Promise.race([executionPromise, timeoutPromise]);

      // 성공 처리
      progressTracker.completeTask(taskId, result);

      return {
        taskId,
        agentType,
        success: true,
        result,
        duration: Date.now() - task.startTime!.getTime(),
        checkpoints: task.checkpoints,
        logs: task.logs,
      };
    } catch (error) {
      // 실패 처리
      const err = error as Error;
      progressTracker.failTask(taskId, err);

      return {
        taskId,
        agentType,
        success: false,
        error: err,
        duration: Date.now() - task.startTime!.getTime(),
        checkpoints: task.checkpoints,
        logs: task.logs,
      };
    } finally {
      this.activeContexts.delete(taskId);
    }
  }

  /**
   * 병렬 작업 실행
   */
  async executeParallel(
    tasks: Array<{
      agentType: SubAgentType;
      prompt: string;
      options?: AgentTaskOptions;
    }>
  ): Promise<ExecutionResult[]> {
    console.log(`\n🚀 ${tasks.length}개 에이전트 병렬 실행 시작\n`);

    // 모든 작업을 병렬로 시작
    const promises = tasks.map(({ agentType, prompt, options }) =>
      this.executeTask(agentType, prompt, options)
    );

    // 진행 상황 모니터링 시작
    const monitorInterval = setInterval(() => {
      console.log(progressTracker.getParallelDashboard());
    }, 2000);

    try {
      // 모든 작업 완료 대기
      const results = await Promise.allSettled(promises);

      // 결과 정리
      return results.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          // Promise.allSettled에서 실패한 경우
          return {
            taskId: `failed-${index}`,
            agentType: tasks[index].agentType,
            success: false,
            error: result.reason,
            duration: 0,
            checkpoints: [],
            logs: [],
          };
        }
      });
    } finally {
      clearInterval(monitorInterval);
    }
  }

  /**
   * 스트리밍 출력과 함께 작업 실행
   */
  async executeWithStreaming(
    agentType: SubAgentType,
    prompt: string,
    options?: AgentTaskOptions
  ): Promise<ExecutionResult> {
    const enhancedOptions: AgentTaskOptions = {
      ...options,
      streamOutput: true,
      reportProgress: true,
    };

    return this.executeTask(agentType, prompt, enhancedOptions);
  }

  // Private 메서드들

  private async runAgentTask(context: AgentExecutionContext): Promise<any> {
    const { task } = context;

    // 진행 중 상태로 업데이트
    await this.updateTaskStatus(task.id, 'in_progress', '작업 실행 중...');

    // 진행률 시뮬레이션 (실제 환경에서는 Task 도구에서 콜백)
    if (task.options?.reportProgress) {
      this.simulateProgress(context);
    }

    // 실제 Task 도구 호출 (모의)
    // 실제 환경에서는:
    // const result = await Task({
    //   subagent_type: task.agentType,
    //   prompt: task.prompt,
    //   description: `${task.agentType} 작업 실행`,
    //   options: task.options
    // });

    // 모의 실행
    const result = await this.mockTaskExecution(task);

    return result;
  }

  private async mockTaskExecution(task: AgentTask): Promise<any> {
    // 실제 환경에서는 이 부분이 Task 도구 호출로 대체됨
    const steps = [
      '환경 설정 확인 중...',
      '필요한 파일 분석 중...',
      '작업 계획 수립 중...',
      '실행 중...',
      '결과 검증 중...',
    ];

    for (let i = 0; i < steps.length; i++) {
      await this.updateTaskProgress(task.id, {
        percentage: (i + 1) * 20,
        currentStep: steps[i],
        currentStepNumber: i + 1,
        totalSteps: steps.length,
        estimatedTimeLeft: (steps.length - i - 1) * 10,
      });

      // 체크포인트 시뮬레이션
      if (i === 2 && task.options?.requireConfirmation) {
        const checkpoint: Checkpoint = {
          id: `cp-${Date.now()}`,
          timestamp: new Date(),
          message: '작업 계획이 수립되었습니다.',
          completedTasks: steps.slice(0, i + 1),
          nextTasks: steps.slice(i + 1),
          requiresConfirmation: true,
        };

        const shouldContinue = await this.activeContexts
          .get(task.id)
          ?.onCheckpoint?.(checkpoint);
        if (!shouldContinue) {
          throw new Error('사용자가 작업을 취소했습니다.');
        }
      }

      // 스트리밍 출력
      if (task.options?.streamOutput) {
        progressTracker.streamLog(task, steps[i]);
      }

      // 모의 지연
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    return {
      success: true,
      message: `${task.agentType} 작업이 성공적으로 완료되었습니다.`,
      data: { mockResult: true },
    };
  }

  private simulateProgress(_context: AgentExecutionContext): void {
    // 실제 환경에서는 Task 도구에서 진행률 콜백을 호출
    // 여기서는 시뮬레이션을 위한 코드
  }

  private async updateTaskStatus(
    taskId: string,
    status: AgentTask['status'],
    currentStep: string
  ): Promise<void> {
    progressTracker.updateTask(taskId, { status });
    progressTracker.updateProgress(taskId, { currentStep });

    const task = progressTracker['tasks'].get(taskId);
    if (task && task.options?.streamOutput) {
      progressTracker.streamLog(task, currentStep);
    }
  }

  private async updateTaskProgress(
    taskId: string,
    progress: Partial<AgentTask['progress']>
  ): Promise<void> {
    progressTracker.updateProgress(taskId, progress);
  }

  private createTimeout(taskId: string, seconds: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        progressTracker.updateTask(taskId, { status: 'timeout' });
        reject(new Error(`작업이 ${seconds}초 타임아웃에 도달했습니다.`));
      }, seconds * 1000);
    });
  }

  /**
   * 작업 취소
   */
  cancelTask(taskId: string): void {
    const context = this.activeContexts.get(taskId);
    if (context) {
      progressTracker.updateTask(taskId, {
        status: 'cancelled',
        endTime: new Date(),
      });

      // AbortSignal을 통한 취소
      // 참고: signal은 읽기 전용이며, 취소는 AbortController에서 처리해야 함
    }
  }

  /**
   * 모든 활성 작업 취소
   */
  cancelAll(): void {
    this.activeContexts.forEach((_, taskId) => {
      this.cancelTask(taskId);
    });
  }
}

// 싱글톤 인스턴스
export const agentExecutor = new AgentExecutor();

// 편의 함수들

/**
 * 단일 에이전트 실행
 */
export async function executeAgent(
  agentType: SubAgentType,
  prompt: string,
  options?: AgentTaskOptions
): Promise<ExecutionResult> {
  return agentExecutor.executeTask(agentType, prompt, options);
}

/**
 * 병렬 에이전트 실행
 */
export async function executeAgentsInParallel(
  tasks: Array<{
    agentType: SubAgentType;
    prompt: string;
    options?: AgentTaskOptions;
  }>
): Promise<ExecutionResult[]> {
  return agentExecutor.executeParallel(tasks);
}

/**
 * 스트리밍 출력과 함께 실행
 */
export async function executeAgentWithStream(
  agentType: SubAgentType,
  prompt: string,
  options?: AgentTaskOptions
): Promise<ExecutionResult> {
  return agentExecutor.executeWithStreaming(agentType, prompt, options);
}
