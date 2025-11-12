export const playgroundAdminConversations = [
  {
    id: 'playwright-conv-1',
    userId: 'guest_e2e',
    query: '게스트 모드 상태인가요?',
    response: '게스트 전체 접근 모드가 활성화되어 있습니다.',
    aiMode: 'LOCAL',
    timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
    responseTime: 780,
    status: 'success',
  },
  {
    id: 'playwright-conv-2',
    userId: 'github_admin',
    query: '최근 에러 로그가 있나요?',
    response: '지난 30분 동안 치명적인 에러는 발생하지 않았습니다.',
    aiMode: 'GOOGLE_AI',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    responseTime: 1150,
    status: 'success',
  },
];

export const playgroundAdminLogs = [
  {
    id: 'playwright-log-1',
    level: 'info',
    message: '시스템 상태가 정상입니다.',
    source: 'system-monitor',
    timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
  {
    id: 'playwright-log-2',
    level: 'warn',
    message: 'AI 응답 시간이 SLA를 초과했습니다.',
    source: 'ai-engine',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    metadata: { responseTime: 3600 },
  },
];

export const playgroundAdminStats = {
  totalQueries: 512,
  activeUsers: 41,
  errorRate: 0.027,
  avgResponseTime: 932,
  lastUpdated: new Date().toISOString(),
};
