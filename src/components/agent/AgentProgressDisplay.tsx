/**
 * 🎯 에이전트 진행률 표시 컴포넌트
 *
 * 실시간 진행 상황을 시각적으로 표시
 */

import { useEffect, useState } from 'react';
import { progressTracker } from '@/lib/agent-progress-tracker';
import type {
  AgentTask,
  TaskStatus,
  Checkpoint,
  ParallelExecutionGroup,
} from '@/types/agent-types';

// 상태별 색상
const STATUS_COLORS: Record<TaskStatus, string> = {
  pending: 'bg-yellow-500',
  starting: 'bg-cyan-500',
  in_progress: 'bg-blue-500',
  checkpoint: 'bg-purple-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  timeout: 'bg-red-600',
  cancelled: 'bg-gray-500',
};

// 상태별 아이콘
const STATUS_ICONS: Record<TaskStatus, string> = {
  pending: '⏳',
  starting: '🚀',
  in_progress: '🔄',
  checkpoint: '⏸️',
  completed: '✅',
  failed: '❌',
  timeout: '⏰',
  cancelled: '🚫',
};

interface AgentProgressDisplayProps {
  taskIds?: string[];
  showCompleted?: boolean;
  compact?: boolean;
}

export function AgentProgressDisplay({
  taskIds,
  showCompleted = false,
  compact = false,
}: AgentProgressDisplayProps) {
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    // 1초마다 업데이트
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // progressTracker에서 작업 가져오기
    const allTasks = progressTracker.getTasks();

    let filteredTasks = allTasks;

    // 특정 작업만 필터링
    if (taskIds && taskIds.length > 0) {
      filteredTasks = filteredTasks.filter((task) => taskIds.includes(task.id));
    }

    // 완료된 작업 표시 여부
    if (!showCompleted) {
      filteredTasks = filteredTasks.filter(
        (task) =>
          !['completed', 'failed', 'timeout', 'cancelled'].includes(task.status)
      );
    }

    // 상태별로 정렬 (진행 중 > 대기 중 > 완료)
    filteredTasks.sort((a, b) => {
      const statusOrder = {
        in_progress: 0,
        checkpoint: 1,
        starting: 2,
        pending: 3,
        completed: 4,
        failed: 5,
        timeout: 6,
        cancelled: 7,
      };

      return statusOrder[a.status] - statusOrder[b.status];
    });

    setTasks(filteredTasks);
  }, [taskIds, showCompleted, updateTrigger]);

  if (tasks.length === 0) {
    return null;
  }

  if (compact) {
    return <CompactProgressDisplay tasks={tasks} />;
  }

  return (
    <div className="space-y-4 rounded-lg bg-gray-900 p-4">
      <h3 className="flex items-center gap-2 text-lg font-semibold text-white">
        🚀 서브에이전트 작업 현황
        <span className="text-sm text-gray-400">
          ({tasks.filter((t) => t.status === 'in_progress').length} 진행 중)
        </span>
      </h3>

      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskProgressCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

function TaskProgressCard({ task }: { task: AgentTask }) {
  const isActive = ['starting', 'in_progress', 'checkpoint'].includes(
    task.status
  );
  const duration = task.startTime
    ? formatDuration(Date.now() - task.startTime.getTime())
    : null;

  return (
    <div
      className={`rounded-lg border p-4 ${
        isActive ? 'border-blue-500 bg-blue-950' : 'border-gray-700 bg-gray-800'
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{STATUS_ICONS[task.status]}</span>
          <h4 className="font-medium text-white">{task.agentType}</h4>
          <span
            className={`rounded px-2 py-1 text-xs text-white ${STATUS_COLORS[task.status]}`}
          >
            {task.status}
          </span>
        </div>
        {duration && <span className="text-sm text-gray-400">{duration}</span>}
      </div>

      {isActive && (
        <>
          <div className="mb-2">
            <div className="mb-1 flex justify-between text-sm text-gray-300">
              <span>{task.progress.currentStep}</span>
              <span>{task.progress.percentage}%</span>
            </div>
            <ProgressBar percentage={task.progress.percentage} />
          </div>

          {task.progress.estimatedTimeLeft && (
            <p className="text-xs text-gray-400">
              예상 완료:{' '}
              {formatDuration(task.progress.estimatedTimeLeft * 1000)} 후
            </p>
          )}
        </>
      )}

      {task.status === 'checkpoint' && task.checkpoints.length > 0 && (
        <CheckpointDisplay
          checkpoint={task.checkpoints[task.checkpoints.length - 1]}
        />
      )}

      {task.error && (
        <p className="mt-2 text-sm text-red-400">❌ {task.error.message}</p>
      )}
    </div>
  );
}

function CompactProgressDisplay({ tasks }: { tasks: AgentTask[] }) {
  const activeTasks = tasks.filter((t) =>
    ['starting', 'in_progress', 'checkpoint'].includes(t.status)
  );

  return (
    <div className="flex items-center gap-4 rounded bg-gray-900 p-2">
      {activeTasks.map((task) => (
        <div key={task.id} className="flex items-center gap-2">
          <span>{STATUS_ICONS[task.status]}</span>
          <span className="text-sm text-gray-300">{task.agentType}</span>
          <div className="h-1 w-20 overflow-hidden rounded-full bg-gray-700">
            <div
              className={`h-full ${STATUS_COLORS[task.status]} transition-all duration-300`}
              style={{ width: `${task.progress.percentage}%` }}
            />
          </div>
          <span className="text-xs text-gray-400">
            {task.progress.percentage}%
          </span>
        </div>
      ))}
    </div>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-700">
      <div
        className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

function CheckpointDisplay({ checkpoint }: { checkpoint: Checkpoint }) {
  return (
    <div className="mt-3 rounded border border-purple-500 bg-purple-950 p-3">
      <p className="mb-2 text-sm text-purple-200">{checkpoint.message}</p>

      {checkpoint.completedTasks.length > 0 && (
        <div className="mb-2">
          <p className="mb-1 text-xs text-purple-300">✅ 완료:</p>
          <ul className="ml-4 text-xs text-gray-400">
            {checkpoint.completedTasks.map((task: string, i: number) => (
              <li key={i}>• {task}</li>
            ))}
          </ul>
        </div>
      )}

      {checkpoint.requiresConfirmation && (
        <p className="mt-2 text-xs text-yellow-400">
          ⚠️ 사용자 확인 대기 중...
        </p>
      )}
    </div>
  );
}

function formatDuration(ms: number): string {
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

// 병렬 작업 대시보드
export function ParallelTaskDashboard() {
  const [groups, setGroups] = useState<any[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setUpdateTrigger((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // progressTracker에서 병렬 그룹 가져오기
    const allGroups = progressTracker.getParallelGroups();
    const activeGroups = allGroups.filter(
      (group) => group.status === 'running'
    );
    setGroups(activeGroups);
  }, [updateTrigger]);

  if (groups.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg bg-gray-900 p-4">
      <h3 className="mb-4 text-lg font-semibold text-white">
        📊 병렬 작업 대시보드
      </h3>

      {groups.map((group) => (
        <ParallelGroupDisplay key={group.id} group={group} />
      ))}
    </div>
  );
}

function ParallelGroupDisplay({ group }: { group: ParallelExecutionGroup }) {
  const completedCount = group.tasks.filter(
    (t: AgentTask) => t.status === 'completed'
  ).length;
  const totalCount = group.tasks.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-300">그룹 {group.id}</h4>
        <span className="text-sm text-gray-400">
          {completedCount}/{totalCount} 완료
        </span>
      </div>

      <ProgressBar percentage={percentage} />

      <div className="mt-2 grid grid-cols-2 gap-2">
        {group.tasks.map((task: AgentTask) => (
          <div
            key={task.id}
            className="flex items-center gap-2 text-xs text-gray-400"
          >
            <span>{STATUS_ICONS[task.status]}</span>
            <span>{task.agentType}</span>
            {task.status === 'in_progress' && (
              <span className="text-blue-400">
                ({task.progress.percentage}%)
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
