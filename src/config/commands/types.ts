/**
 * 서버 명령어 관련 타입 정의
 */

export interface OSCommand {
  command: string;
  description: string;
  category:
    | 'monitoring'
    | 'process'
    | 'network'
    | 'disk'
    | 'system'
    | 'security';
  riskLevel: 'safe' | 'moderate' | 'dangerous';
  usage?: string;
  example?: string;
  alternatives?: string[];
}

export interface ServerCommands {
  os: string;
  service: string;
  commands: {
    basic: OSCommand[];
    advanced: OSCommand[];
    troubleshooting: OSCommand[];
  };
}

export type ServerType =
  | 'web-server'
  | 'database-server'
  | 'cache-server'
  | 'message-queue'
  | 'api-server'
  | 'ml-server'
  | 'monitoring-server'
  | 'backup-server';
