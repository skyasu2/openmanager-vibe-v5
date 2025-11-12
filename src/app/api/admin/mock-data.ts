export interface MockConversationEntry {
  id: string;
  userId: string;
  query: string;
  response: string;
  aiMode: 'LOCAL' | 'GOOGLE_AI';
  timestamp: string;
  responseTime: number;
  status: 'success' | 'error';
}

export interface MockSystemLogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface MockAdminStats {
  totalQueries: number;
  activeUsers: number;
  errorRate: number;
  avgResponseTime: number;
  lastUpdated: string;
}

const now = Date.now();

export const mockConversations: MockConversationEntry[] = [
  {
    id: 'conv-1',
    userId: 'guest_auto_1',
    query: 'CPU 사용률이 높아졌나요?',
    response:
      '최근 10분간 CPU 사용률이 72%까지 상승했지만 자동 확장 조건은 충족하지 않았습니다.',
    aiMode: 'LOCAL',
    timestamp: new Date(now - 1000 * 60 * 5).toISOString(),
    responseTime: 860,
    status: 'success',
  },
  {
    id: 'conv-2',
    userId: 'github_admin',
    query: '서버 로그를 내려받을 수 있을까?',
    response:
      'admin-download 엔드포인트를 사용하면 최근 24시간 로그를 압축 파일로 받을 수 있습니다.',
    aiMode: 'GOOGLE_AI',
    timestamp: new Date(now - 1000 * 60 * 30).toISOString(),
    responseTime: 1320,
    status: 'success',
  },
  {
    id: 'conv-3',
    userId: 'guest_auto_2',
    query: 'AI 어시스턴트가 응답하지 않아요.',
    response:
      'AI 엔진이 2분 이상 응답하지 않아 자동으로 LOCAL 엔진으로 전환되었습니다.',
    aiMode: 'LOCAL',
    timestamp: new Date(now - 1000 * 60 * 90).toISOString(),
    responseTime: 540,
    status: 'error',
  },
];

export const mockSystemLogs: MockSystemLogEntry[] = [
  {
    id: 'log-1',
    level: 'info',
    message: '게스트 세션이 생성되었습니다.',
    source: 'auth',
    timestamp: new Date(now - 1000 * 60 * 3).toISOString(),
    metadata: { userId: 'guest_auto_3' },
  },
  {
    id: 'log-2',
    level: 'warn',
    message: 'OpenAI API 응답 시간이 SLA를 초과했습니다.',
    source: 'ai-engine',
    timestamp: new Date(now - 1000 * 60 * 15).toISOString(),
    metadata: { responseTime: 4200, sla: 3500 },
  },
  {
    id: 'log-3',
    level: 'error',
    message: 'Redis 연결이 일시적으로 끊겼습니다. 자동 재시도 중입니다.',
    source: 'cache',
    timestamp: new Date(now - 1000 * 60 * 45).toISOString(),
    metadata: { retryAttempt: 2 },
  },
];

export const mockAdminStats: MockAdminStats = {
  totalQueries: 482,
  activeUsers: 37,
  errorRate: 0.032,
  avgResponseTime: 945,
  lastUpdated: new Date(now).toISOString(),
};
