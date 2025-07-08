/**
 * 🎭 테스트 데이터
 */

export const mockServer = {
  id: 'test-server-1',
  hostname: 'test-server',
  status: 'healthy' as const,
  role: 'web' as const,
  environment: 'test' as const,
  cpu_usage: 45,
  memory_usage: 60,
  disk_usage: 30,
  network_in: 100,
  network_out: 150,
  uptime: 86400,
  response_time: 120,
  last_updated: new Date().toISOString(),
};

export const mockMetrics = {
  cpu: 45,
  memory: 60,
  disk: 30,
  network: 95,
  timestamp: new Date().toISOString(),
};
