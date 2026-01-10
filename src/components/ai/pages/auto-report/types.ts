/**
 * Auto Report Page Types
 *
 * 자동 장애 보고서 관련 타입 정의
 */

/**
 * 장애 보고서 인터페이스
 */
export interface IncidentReport {
  id: string;
  title: string;
  severity: 'critical' | 'warning' | 'info' | 'high' | 'medium' | 'low';
  timestamp: Date;
  affectedServers: string[];
  description: string;
  status: 'active' | 'resolved' | 'investigating';
  pattern?: string;
  recommendations?: Array<{
    action: string;
    priority: string;
    expected_impact: string;
  }>;
  // 전체 시스템 분석 데이터
  systemSummary?: {
    totalServers: number;
    healthyServers: number;
    warningServers: number;
    criticalServers: number;
  };
  anomalies?: Array<{
    server_id: string;
    server_name: string;
    metric: string;
    value: number;
    severity: string;
  }>;
  timeline?: Array<{
    timestamp: string;
    event: string;
    severity: string;
  }>;
}

/**
 * 서버 메트릭 데이터
 */
export interface ServerMetric {
  server_id: string;
  server_name: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  timestamp: string;
}

/**
 * 필터 옵션 타입
 */
export interface FilterOption {
  id: string;
  label: string;
  count: number;
}
