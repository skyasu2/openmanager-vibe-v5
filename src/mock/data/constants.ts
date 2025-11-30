import { ScenarioPoint, Server, ServerType } from './types';

// 15개 서버 정의 (기존과 동일)
export const SERVERS: Server[] = [
  {
    id: 'web-1',
    name: 'WEB-01',
    type: 'web',
    description: '프론트엔드 웹 서버 #1',
  },
  {
    id: 'web-2',
    name: 'WEB-02',
    type: 'web',
    description: '프론트엔드 웹 서버 #2',
  },
  {
    id: 'web-3',
    name: 'WEB-03',
    type: 'web',
    description: '프론트엔드 웹 서버 #3',
  },
  {
    id: 'api-1',
    name: 'API-01',
    type: 'api',
    description: '백엔드 API 서버 #1',
  },
  {
    id: 'api-2',
    name: 'API-02',
    type: 'api',
    description: '백엔드 API 서버 #2',
  },
  {
    id: 'api-3',
    name: 'API-03',
    type: 'api',
    description: '백엔드 API 서버 #3',
  },
  {
    id: 'db-primary',
    name: 'DB-PRIMARY',
    type: 'database',
    description: '주 데이터베이스 서버',
  },
  {
    id: 'db-read-1',
    name: 'DB-READ-01',
    type: 'database',
    description: '읽기 복제본 #1',
  },
  {
    id: 'db-read-2',
    name: 'DB-READ-02',
    type: 'database',
    description: '읽기 복제본 #2',
  },
  {
    id: 'cache-1',
    name: 'CACHE-01',
    type: 'cache',
    description: 'Redis 캐시 서버 #1',
  },
  {
    id: 'cache-2',
    name: 'CACHE-02',
    type: 'cache',
    description: 'Redis 캐시 서버 #2',
  },
  {
    id: 'storage-1',
    name: 'STORAGE-01',
    type: 'storage',
    description: '파일 스토리지 서버',
  },
  {
    id: 'storage-2',
    name: 'STORAGE-02',
    type: 'storage',
    description: '백업 스토리지 서버',
  },
  {
    id: 'log-server',
    name: 'LOG-01',
    type: 'log',
    description: '로그 수집 서버',
  },
  {
    id: 'monitoring',
    name: 'MONITOR-01',
    type: 'monitoring',
    description: '모니터링 서버',
  },
];

// 정상 메트릭 (기본값)
export const normalMetrics: Record<ServerType, ScenarioPoint> = {
  web: {
    cpu: 30,
    memory: 45,
    disk: 60,
    network: 40,
    responseTime: 100,
    errorRate: 0.1,
  },
  api: {
    cpu: 35,
    memory: 50,
    disk: 55,
    network: 50,
    responseTime: 150,
    errorRate: 0.2,
  },
  database: {
    cpu: 40,
    memory: 60,
    disk: 70,
    network: 45,
    responseTime: 50,
    errorRate: 0.05,
  },
  cache: {
    cpu: 25,
    memory: 55,
    disk: 40,
    network: 60,
    responseTime: 10,
    errorRate: 0.01,
  },
  storage: { cpu: 20, memory: 40, disk: 75, network: 35 },
  log: { cpu: 30, memory: 50, disk: 80, network: 40 },
  monitoring: { cpu: 25, memory: 45, disk: 65, network: 30 },
};
