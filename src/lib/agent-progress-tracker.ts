/**
 * 📊 에이전트 진행 상황 추적 시스템
 *
 * 실시간 진행률 모니터링 및 병렬 작업 추적
 */

import type {
  AgentTask,
  ProgressInfo,
  Checkpoint,
  LogEntry,
  ParallelExecutionGroup,
} from '@/types/agent-types';

// 진행률 바 생성
export function createProgressBar(
  percentage: number,
  width: number = 20
): string {
  const filled = Math.floor((percentage / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);
  return `[${bar}] ${percentage}%`;
}

// 상태별 색상 및 아이콘
const STATUS_CONFIG = {
  pending: { icon: '⏳', color: '\x1b[33m' }, // 노란색
  starting: { icon: '🚀', color: '\x1b[36m' }, // 청록색
  in_progress: { icon: '🔄', color: '\x1b[34m' }, // 파란색
  checkpoint: { icon: '⏸️', color: '\x1b[35m' }, // 마젠타
  completed: { icon: '✅', color: '\x1b[32m' }, // 초록색
  failed: { icon: '❌', color: '\x1b[31m' }, // 빨간색
  timeout: { icon: '⏰', color: '\x1b[31m' }, // 빨간색
  cancelled: { icon: '🚫', color: '\x1b[90m' }, // 회색
};

const RESET_COLOR = '\x1b[0m';

// 에이전트 진행 상황 추적기
export class AgentProgressTracker {
  private tasks: Map<string, AgentTask> = new Map();
  private parallelGroups: Map<string, ParallelExecutionGroup> = new Map();
  private updateInterval?: NodeJS.Timeout;
  private displayMode: 'simple' | 'detailed' = 'simple';

  constructor() {
    this.startUpdateLoop();
  }

  // 작업 등록
  registerTask(task: AgentTask): void {
    this.tasks.set(task.id, task);
    this.logTaskEvent(task, 'Task registered');
  }

  // 작업 업데이트
  updateTask(taskId: string, updates: Partial<AgentTask>): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    Object.assign(task, updates);
    this.tasks.set(taskId, task);
  }

  // 진행률 업데이트
  updateProgress(taskId: string, progress: Partial<ProgressInfo>): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.progress = { ...task.progress, ...progress };
    this.tasks.set(taskId, task);
  }

  // 체크포인트 추가
  addCheckpoint(taskId: string, checkpoint: Checkpoint): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.checkpoints.push(checkpoint);
    task.status = 'checkpoint';
    this.tasks.set(taskId, task);
  }

  // 로그 추가
  addLog(taskId: string, entry: LogEntry): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.logs.push(entry);
    this.tasks.set(taskId, task);
  }

  // 병렬 그룹 생성
  createParallelGroup(tasks: AgentTask[]): string {
    const groupId = `group-${Date.now()}`;
    const group: ParallelExecutionGroup = {
      id: groupId,
      tasks,
      status: 'pending',
      startTime: new Date(),
    };

    this.parallelGroups.set(groupId, group);
    tasks.forEach((task) => this.registerTask(task));

    return groupId;
  }

  // 현재 상태 표시
  displayCurrentStatus(): string {
    const output: string[] = [];

    // 헤더
    output.push('\n' + '='.repeat(80));
    output.push('🚀 서브에이전트 작업 현황');
    output.push('='.repeat(80));

    // 진행 중인 작업
    const activeTasks = Array.from(this.tasks.values()).filter((task) =>
      ['starting', 'in_progress', 'checkpoint'].includes(task.status)
    );

    if (activeTasks.length > 0) {
      output.push('\n### 진행 중인 작업 (' + activeTasks.length + '개)');
      output.push('');

      activeTasks.forEach((task, index) => {
        const config = STATUS_CONFIG[task.status];
        const duration = task.startTime
          ? this.formatDuration(new Date().getTime() - task.startTime.getTime())
          : '0초';

        output.push(
          `${index + 1}. ${config.color}${config.icon} ${task.agentType}${RESET_COLOR} ${createProgressBar(task.progress.percentage)}`
        );
        output.push(`   - 상태: ${task.progress.currentStep}`);
        output.push(`   - 시작: ${duration} 전`);

        if (task.progress.estimatedTimeLeft) {
          output.push(
            `   - 예상 완료: ${this.formatDuration(task.progress.estimatedTimeLeft * 1000)} 후`
          );
        }
        output.push('');
      });
    }

    // 대기 중인 작업
    const pendingTasks = Array.from(this.tasks.values()).filter(
      (task) => task.status === 'pending'
    );

    if (pendingTasks.length > 0) {
      output.push('\n### 대기 중인 작업 (' + pendingTasks.length + '개)');
      pendingTasks.forEach((task) => {
        output.push(`- ${task.agentType}`);
      });
    }

    // 완료된 작업
    const completedTasks = Array.from(this.tasks.values()).filter((task) =>
      ['completed', 'failed', 'timeout'].includes(task.status)
    );

    if (completedTasks.length > 0 && this.displayMode === 'detailed') {
      output.push('\n### 완료된 작업 (' + completedTasks.length + '개)');
      completedTasks.forEach((task) => {
        const config = STATUS_CONFIG[task.status];
        const duration =
          task.startTime && task.endTime
            ? this.formatDuration(
                task.endTime.getTime() - task.startTime.getTime()
              )
            : 'N/A';

        output.push(`${config.icon} ${task.agentType} - ${duration}`);
      });
    }

    output.push('='.repeat(80));

    return output.join('\n');
  }

  // 스트리밍 로그 출력 (조건부)
  streamLog(task: AgentTask, message: string): void {
    // WSL 환경에서는 중요한 메시지만 출력
    if (
      process.env.WSL_DISTRO_NAME &&
      !message.includes('완료') &&
      !message.includes('실패')
    ) {
      return;
    }

    const config = STATUS_CONFIG[task.status];
    const timestamp = new Date().toLocaleTimeString('ko-KR');

    console.log(
      `${config.color}[${task.agentType}]${RESET_COLOR} ${config.icon} ${message} (${timestamp})`
    );
  }

  // 체크포인트 표시
  displayCheckpoint(checkpoint: Checkpoint): string {
    const output: string[] = [];

    output.push('\n' + '─'.repeat(60));
    output.push('⏸️  작업 체크포인트');
    output.push('─'.repeat(60));
    output.push('');
    output.push(checkpoint.message);
    output.push('');

    if (checkpoint.completedTasks.length > 0) {
      output.push('✅ 완료된 작업:');
      checkpoint.completedTasks.forEach((task) => {
        output.push(`   - ${task}`);
      });
      output.push('');
    }

    if (checkpoint.nextTasks.length > 0) {
      output.push('📋 다음 작업:');
      checkpoint.nextTasks.forEach((task) => {
        output.push(`   - ${task}`);
      });
      output.push('');
    }

    if (checkpoint.requiresConfirmation) {
      output.push('❓ 계속 진행하시겠습니까? [Y/n]');
    }

    output.push('─'.repeat(60));

    return output.join('\n');
  }

  // 병렬 작업 대시보드
  getParallelDashboard(): string {
    const output: string[] = [];
    const groups = Array.from(this.parallelGroups.values()).filter(
      (group) => group.status === 'running'
    );

    if (groups.length === 0) return '';

    output.push('\n📊 병렬 작업 대시보드');
    output.push('─'.repeat(60));

    groups.forEach((group) => {
      const completedCount = group.tasks.filter(
        (t) => t.status === 'completed'
      ).length;
      const totalCount = group.tasks.length;
      const percentage = Math.round((completedCount / totalCount) * 100);

      output.push(
        `\n그룹 ${group.id}: ${createProgressBar(percentage)} (${completedCount}/${totalCount})`
      );

      group.tasks.forEach((task) => {
        const config = STATUS_CONFIG[task.status];
        const progress =
          task.status === 'in_progress'
            ? ` - ${task.progress.percentage}%`
            : '';
        output.push(`  ${config.icon} ${task.agentType}${progress}`);
      });
    });

    return output.join('\n');
  }

  // 작업 완료
  completeTask(taskId: string, result?: any): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'completed';
    task.endTime = new Date();
    task.result = result;
    task.progress.percentage = 100;

    this.tasks.set(taskId, task);
    this.logTaskEvent(task, 'Task completed');
  }

  // 작업 실패
  failTask(taskId: string, error: Error): void {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status = 'failed';
    task.endTime = new Date();
    task.error = error;

    this.tasks.set(taskId, task);
    this.logTaskEvent(task, `Task failed: ${error.message}`);
  }

  // 정리
  cleanup(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    this.tasks.clear();
    this.parallelGroups.clear();
  }

  // Public getters for type safety
  public getTasks(): AgentTask[] {
    return Array.from(this.tasks.values());
  }

  public getTask(taskId: string): AgentTask | undefined {
    return this.tasks.get(taskId);
  }

  public getParallelGroups(): ParallelExecutionGroup[] {
    return Array.from(this.parallelGroups.values());
  }

  // Private 메서드들
  private startUpdateLoop(): void {
    // WSL 호환성을 위해 console.clear() 제거
    // 5초마다 진행 상황만 업데이트 (전체 화면 다시 그리기 대신)
    this.updateInterval = setInterval(() => {
      // 진행 중인 작업이 있을 때만 업데이트
      const hasActiveTasks = Array.from(this.tasks.values()).some((task) =>
        ['starting', 'in_progress'].includes(task.status)
      );

      if (hasActiveTasks && process.env.VERBOSE === 'true') {
        // console.clear() 제거 - WSL에서 화면 깜빡임 방지
        // 대신 진행 중인 작업만 간단히 표시
        const activeTasks = Array.from(this.tasks.values()).filter((task) =>
          ['starting', 'in_progress'].includes(task.status)
        );

        if (activeTasks.length > 0) {
          console.log('\n--- 진행 중인 작업 ---');
          activeTasks.forEach((task) => {
            const percentage = task.progress.percentage;
            console.log(
              `[${task.agentType}] ${createProgressBar(percentage)} ${task.progress.currentStep}`
            );
          });
        }
      }
    }, 5000); // 5초로 변경하여 업데이트 빈도 감소
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}시간 ${minutes % 60}분`;
    } else if (minutes > 0) {
      return `${minutes}분 ${seconds % 60}초`;
    } else {
      return `${seconds}초`;
    }
  }

  private logTaskEvent(task: AgentTask, message: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date(),
      level: 'info',
      agentType: task.agentType,
      message,
    };

    this.addLog(task.id, logEntry);

    if (process.env.VERBOSE === 'true') {
      this.streamLog(task, message);
    }
  }
}

// 싱글톤 인스턴스
export const progressTracker = new AgentProgressTracker();
