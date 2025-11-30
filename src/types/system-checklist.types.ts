/**
 * 🔧 System Checklist 관련 타입 정의
 * SystemChecklist 컴포넌트에서 분리된 타입들
 */

import type { ComponentStatus } from '@/hooks/useSystemChecklist';

export interface SystemChecklistProps {
  onComplete: () => void;
  skipCondition?: boolean;
}

// 🔍 디버깅 정보 타입
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
