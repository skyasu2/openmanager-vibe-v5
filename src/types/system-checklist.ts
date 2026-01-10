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
  category?: string;
  icon: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTime: number;
  dependencies?: string[];
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

// Merged from system-checklist.types.ts

export interface SystemChecklistProps {
  onComplete: () => void;
  skipCondition?: boolean;
}

export interface DebugInfo {
  timestamp: string;
  componentStates: Record<string, ComponentStatus>;
  networkRequests: NetworkRequest[];
  errors: ErrorInfo[];
  performance: PerformanceInfo;
  userAgent: string;
  url: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  status: number;
  responseTime: number;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface ErrorInfo {
  component: string;
  error: string;
  stack?: string;
  timestamp: string;
  retryCount: number;
}

export interface PerformanceInfo {
  startTime: number;
  checklistDuration: number;
  slowestComponent: string;
  fastestComponent: string;
  averageResponseTime: number;
}

// Window 인터페이스 확장 for 디버그 도구
export interface DebugTools {
  getState: () => unknown;
  analyzeComponent: (componentId: string) => unknown;
  retryFailedComponents: () => void;
  diagnoseNetwork: () => unknown;
  analyzePerformance: () => PerformanceInfo;
  exportDebugInfo: () => unknown;
  forceComplete: () => void;
  toggleDebugPanel: () => boolean;
}

export interface WindowWithDebug extends Window {
  debugSystemChecklistAdvanced?: DebugTools;
  systemChecklistDebug?: DebugTools;
  debugSystemChecklist?: unknown;
  emergencyCompleteChecklist?: () => void;
  [key: `retry_${string}`]: number | undefined;
}
