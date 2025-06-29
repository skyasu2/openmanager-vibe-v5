/**
 * 🔧 System Checklist Types
 *
 * 시스템 체크리스트 관련 타입 정의
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

export interface SystemComponent {
  id: string;
  name: string;
  description: string;
  icon: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: number; // 예상 완료 시간 (ms)
  dependencies?: string[]; // 의존성 (다른 컴포넌트 완료 후 시작)
  checkFunction: () => Promise<boolean>;
}

export interface ComponentStatus {
  id: string;
  status: 'pending' | 'loading' | 'completed' | 'failed';
  startTime?: number;
  completedTime?: number;
  progress: number;
  error?: string;
  networkInfo?: {
    url: string;
    method: string;
    responseTime: number;
    statusCode: number;
    headers?: Record<string, string>;
  };
}

export interface UseSystemChecklistProps {
  onComplete?: () => void;
  skipCondition?: boolean;
  autoStart?: boolean;
}

export interface SystemChecklistState {
  components: Record<string, ComponentStatus>;
  componentDefinitions: SystemComponent[];
  isCompleted: boolean;
  totalProgress: number;
  completedCount: number;
  failedCount: number;
  loadingCount: number;
  canSkip: boolean;
}

export interface NetworkRequestInfo {
  url: string;
  method: string;
  responseTime: number;
  statusCode: number;
  headers?: Record<string, string>;
  timestamp: string;
  success: boolean;
  component: string;
  error?: string;
}
