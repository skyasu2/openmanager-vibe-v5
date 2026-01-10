/**
 * Base Types (No Dependencies)
 *
 * 다른 파일에서 공통으로 사용하는 기본 타입
 */

import type { AlertSeverity } from '../common';

/**
 * 프로세스 정보
 */
export interface ProcessInfo {
  pid: number;
  name:
    | 'kernel_task'
    | 'System'
    | 'svchost.exe'
    | 'chrome.exe'
    | 'node'
    | 'nginx'
    | 'python'
    | 'java'
    | 'spindump'
    | 'WindowServer'
    | 'launchd';
  cpu: number;
  memory: number;
  user: 'root' | 'system' | 'NETWORK SERVICE' | 'admin' | 'guest';
}

/**
 * 서버 알림
 */
export interface ServerAlert {
  id: string;
  server_id: string;
  type: 'cpu' | 'memory' | 'disk' | 'network' | 'responseTime' | 'custom';
  message: string;
  severity: AlertSeverity;
  timestamp: string;
  resolved: boolean;
  relatedServers?: string[];
  rootCause?: string;
}
