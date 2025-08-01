/**
 * 🤖 서브에이전트 타입 정의
 * 
 * 병렬 작업 가시성 개선을 위한 타입 시스템
 */

// 에이전트 타입
export type SubAgentType = 
  | 'central-supervisor'
  | 'code-review-specialist'
  | 'security-auditor'
  | 'database-administrator'
  | 'ux-performance-optimizer'
  | 'test-automation-specialist'
  | 'ai-systems-engineer'
  | 'doc-structure-guardian'
  | 'doc-writer-researcher'
  | 'debugger-specialist'
  | 'vercel-monitor'
  | 'mcp-server-admin'
  | 'gemini-cli-collaborator'
  | 'agent-coordinator'
  | 'backend-gcp-specialist'
  | 'git-cicd-specialist'
  | 'execution-tracker';

// 작업 상태
export type TaskStatus = 
  | 'pending'      // 대기 중
  | 'starting'     // 시작 중
  | 'in_progress'  // 진행 중
  | 'checkpoint'   // 체크포인트
  | 'completed'    // 완료
  | 'failed'       // 실패
  | 'timeout'      // 타임아웃
  | 'cancelled';   // 취소됨

// 진행률 정보
export interface ProgressInfo {
  percentage: number;        // 0-100
  currentStep: string;       // 현재 단계 설명
  totalSteps?: number;       // 전체 단계 수
  currentStepNumber?: number; // 현재 단계 번호
  estimatedTimeLeft?: number; // 예상 남은 시간 (초)
}

// 체크포인트 정보
export interface Checkpoint {
  id: string;
  timestamp: Date;
  message: string;
  completedTasks: string[];
  nextTasks: string[];
  requiresConfirmation?: boolean;
  partialResult?: any;
}

// 에이전트 작업 옵션
export interface AgentTaskOptions {
  reportProgress?: boolean;      // 진행 상황 보고 활성화
  checkpointInterval?: number;   // 체크포인트 간격 (초)
  maxExecutionTime?: number;     // 최대 실행 시간 (초)
  requireConfirmation?: boolean; // 주요 단계에서 확인 필요
  streamOutput?: boolean;        // 실시간 출력 스트리밍
  priority?: 'low' | 'medium' | 'high';
  retryOnFailure?: boolean;      // 실패 시 재시도
  maxRetries?: number;           // 최대 재시도 횟수
}

// 에이전트 작업
export interface AgentTask {
  id: string;
  agentType: SubAgentType;
  prompt: string;
  options?: AgentTaskOptions;
  status: TaskStatus;
  progress: ProgressInfo;
  startTime?: Date;
  endTime?: Date;
  result?: any;
  error?: Error;
  checkpoints: Checkpoint[];
  logs: LogEntry[];
}

// 로그 엔트리
export interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  agentType: SubAgentType;
  message: string;
  data?: any;
}

// 에이전트 타임아웃 설정
export const AGENT_TIMEOUTS: Record<SubAgentType, number> = {
  'central-supervisor': 300,         // 5분 (복잡한 조율)
  'code-review-specialist': 120,     // 2분
  'security-auditor': 300,          // 5분 (스캔 시간)
  'database-administrator': 180,     // 3분
  'ux-performance-optimizer': 240,   // 4분 (Lighthouse)
  'test-automation-specialist': 240, // 4분 (테스트 실행)
  'ai-systems-engineer': 180,        // 3분
  'doc-structure-guardian': 120,     // 2분
  'doc-writer-researcher': 180,      // 3분
  'debugger-specialist': 180,        // 3분
  'vercel-monitor': 60,             // 1분 (빠른 체크)
  'mcp-server-admin': 90,           // 1.5분
  'gemini-cli-collaborator': 120,   // 2분
  'agent-coordinator': 180,         // 3분
  'backend-gcp-specialist': 180,    // 3분
  'git-cicd-specialist': 120,       // 2분
  'execution-tracker': 60,          // 1분
};

// 병렬 실행 그룹
export interface ParallelExecutionGroup {
  id: string;
  tasks: AgentTask[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
}

// 실행 결과
export interface ExecutionResult {
  taskId: string;
  agentType: SubAgentType;
  success: boolean;
  result?: any;
  error?: Error;
  duration: number;
  checkpoints: Checkpoint[];
  logs: LogEntry[];
}

// 진행 상황 업데이트 콜백
export type ProgressCallback = (task: AgentTask) => void;

// 체크포인트 확인 콜백
export type CheckpointCallback = (checkpoint: Checkpoint) => Promise<boolean>;

// 에이전트 실행 컨텍스트
export interface AgentExecutionContext {
  task: AgentTask;
  onProgress?: ProgressCallback;
  onCheckpoint?: CheckpointCallback;
  onLog?: (entry: LogEntry) => void;
  signal?: AbortSignal; // 취소 신호
}