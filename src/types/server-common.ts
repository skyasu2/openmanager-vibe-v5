// 🎯 ServerStatus 타입 통합 (2025-09-30)
// Single Source of Truth: src/types/server-enums.ts
import type { ServerStatus } from './server-enums';
export type { ServerStatus };

export interface ServerHealth {
  score: number;
  trend: number[];
  status: ServerStatus;
  issues?: string[];
  lastChecked?: string;
}

export interface ServerSpecs {
  cpu_cores: number;
  memory_gb: number;
  disk_gb: number;
  network_speed?: string;
}

export interface ServerAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'health' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  resolved?: boolean;
}

// 서버 메트릭은 중앙화된 타입 시스템에서 가져옴
export type { ServerMetrics } from '@/core/types';
