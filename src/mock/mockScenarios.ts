/**
 * mockScenarios.v2.ts - 자연스러운 기승전결 구조
 *
 * 핵심 변경사항:
 * 1. AI에게 시나리오 힌트 노출 안 함 (순수 메트릭만)
 * 2. 6시간 블록을 단계별로 세분화 (기승전결)
 * 3. 자연스러운 변화 곡선 적용
 */

export interface ScenarioPoint {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime?: number; // ms
  errorRate?: number; // percentage
}

export type ServerType =
  | 'web'
  | 'api'
  | 'database'
  | 'cache'
  | 'storage'
  | 'log'
  | 'monitoring';

export type ServerStatus = 'normal' | 'warning' | 'critical';

export interface Server {
  id: string;
  name: string;
  type: ServerType;
  description: string;
}

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
const normalMetrics: Record<ServerType, ScenarioPoint> = {
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

/**
 * 단계별 시나리오 정의 (AI에게 노출 안 함 - 내부 사용만)
 *
 * 각 시나리오는 자연스러운 기승전결 구조:
 * - 정상 (1시간): 평온한 상태
 * - 징조 (1시간): 서서히 증가
 * - 악화 (1-2시간): 급격한 악화
 * - 절정 (1-2시간): Critical 상태
 * - 회복/지속 (1시간): 부분 회복 또는 지속
 */

interface ScenarioPhase {
  name: string;
  durationHours: number;
  serverMetrics: {
    serverId: string;
    metrics: {
      cpu: number[]; // [시작값, 종료값]
      memory: number[];
      disk: number[];
      network: number[];
      responseTime?: number[];
      errorRate?: number[];
    };
    curveType: 'linear' | 'exponential' | 'spike'; // 변화 패턴
  }[];
}

interface ScenarioTimeline {
  id: string;
  name: string;
  timeRange: [number, number];
  phases: ScenarioPhase[];
}

// 시나리오 1: DB 과부하 연쇄 장애 (0-6시)
const scenario1: ScenarioTimeline = {
  id: 'db-overload',
  name: 'DB 과부하 연쇄 장애',
  timeRange: [0, 6],
  phases: [
    {
      name: '정상',
      durationHours: 1, // 0-1시
      serverMetrics: SERVERS.map((s) => ({
        serverId: s.id,
        metrics: {
          cpu: [normalMetrics[s.type].cpu, normalMetrics[s.type].cpu],
          memory: [normalMetrics[s.type].memory, normalMetrics[s.type].memory],
          disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk],
          network: [
            normalMetrics[s.type].network,
            normalMetrics[s.type].network,
          ],
        },
        curveType: 'linear' as const,
      })),
    },
    {
      name: '징조',
      durationHours: 1, // 1-2시
      serverMetrics: [
        {
          serverId: 'db-primary',
          metrics: {
            cpu: [40, 60],
            memory: [60, 70],
            disk: [70, 72],
            network: [45, 55],
            responseTime: [50, 200],
          },
          curveType: 'linear' as const,
        },
        // 나머지 서버는 정상
        ...SERVERS.filter((s) => s.id !== 'db-primary').map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [normalMetrics[s.type].cpu, normalMetrics[s.type].cpu + 2],
            memory: [
              normalMetrics[s.type].memory,
              normalMetrics[s.type].memory + 2,
            ],
            disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk],
            network: [
              normalMetrics[s.type].network,
              normalMetrics[s.type].network + 3,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '악화',
      durationHours: 1, // 2-3시
      serverMetrics: [
        {
          serverId: 'db-primary',
          metrics: {
            cpu: [60, 85],
            memory: [70, 85],
            disk: [72, 74],
            network: [55, 70],
            responseTime: [200, 1000],
            errorRate: [0.05, 2],
          },
          curveType: 'exponential' as const,
        },
        {
          serverId: 'db-read-1',
          metrics: {
            cpu: [40, 70],
            memory: [60, 75],
            disk: [70, 72],
            network: [45, 60],
            responseTime: [50, 400],
          },
          curveType: 'exponential' as const,
        },
        {
          serverId: 'api-1',
          metrics: {
            cpu: [35, 55],
            memory: [50, 60],
            disk: [55, 56],
            network: [50, 60],
            responseTime: [150, 800],
            errorRate: [0.2, 1.5],
          },
          curveType: 'linear' as const,
        },
        ...SERVERS.filter(
          (s) => !['db-primary', 'db-read-1', 'api-1'].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [normalMetrics[s.type].cpu + 2, normalMetrics[s.type].cpu + 5],
            memory: [
              normalMetrics[s.type].memory + 2,
              normalMetrics[s.type].memory + 5,
            ],
            disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk],
            network: [
              normalMetrics[s.type].network + 3,
              normalMetrics[s.type].network + 8,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '절정',
      durationHours: 2, // 3-5시
      serverMetrics: [
        {
          serverId: 'db-primary',
          metrics: {
            cpu: [85, 92],
            memory: [85, 92],
            disk: [74, 75],
            network: [70, 75],
            responseTime: [1000, 5000],
            errorRate: [2, 5],
          },
          curveType: 'spike' as const,
        },
        {
          serverId: 'db-read-1',
          metrics: {
            cpu: [70, 85],
            memory: [75, 88],
            disk: [72, 74],
            network: [60, 70],
            responseTime: [400, 2000],
            errorRate: [0.05, 3],
          },
          curveType: 'spike' as const,
        },
        {
          serverId: 'api-1',
          metrics: {
            cpu: [55, 75],
            memory: [60, 75],
            disk: [56, 58],
            network: [60, 70],
            responseTime: [800, 3000],
            errorRate: [1.5, 5],
          },
          curveType: 'exponential' as const,
        },
        {
          serverId: 'api-2',
          metrics: {
            cpu: [35, 70],
            memory: [50, 72],
            disk: [55, 57],
            network: [50, 68],
            responseTime: [150, 2500],
            errorRate: [0.2, 4],
          },
          curveType: 'exponential' as const,
        },
        {
          serverId: 'web-1',
          metrics: {
            cpu: [30, 60],
            memory: [45, 65],
            disk: [60, 62],
            network: [40, 60],
            responseTime: [100, 2000],
            errorRate: [0.1, 5],
          },
          curveType: 'linear' as const,
        },
        {
          serverId: 'web-2',
          metrics: {
            cpu: [30, 58],
            memory: [45, 63],
            disk: [60, 62],
            network: [40, 58],
            responseTime: [100, 1800],
            errorRate: [0.1, 4.5],
          },
          curveType: 'linear' as const,
        },
        ...SERVERS.filter(
          (s) =>
            ![
              'db-primary',
              'db-read-1',
              'api-1',
              'api-2',
              'web-1',
              'web-2',
            ].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [
              normalMetrics[s.type].cpu + 5,
              normalMetrics[s.type].cpu + 10,
            ],
            memory: [
              normalMetrics[s.type].memory + 5,
              normalMetrics[s.type].memory + 10,
            ],
            disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk + 1],
            network: [
              normalMetrics[s.type].network + 8,
              normalMetrics[s.type].network + 15,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '부분회복',
      durationHours: 1, // 5-6시
      serverMetrics: [
        {
          serverId: 'db-primary',
          metrics: {
            cpu: [92, 90],
            memory: [92, 90],
            disk: [75, 75],
            network: [75, 72],
            responseTime: [5000, 4500],
            errorRate: [5, 4.5],
          },
          curveType: 'linear' as const,
        },
        {
          serverId: 'db-read-1',
          metrics: {
            cpu: [85, 82],
            memory: [88, 85],
            disk: [74, 73],
            network: [70, 68],
            responseTime: [2000, 1800],
            errorRate: [3, 2.5],
          },
          curveType: 'linear' as const,
        },
        {
          serverId: 'api-1',
          metrics: {
            cpu: [75, 65],
            memory: [75, 68],
            disk: [58, 57],
            network: [70, 62],
            responseTime: [3000, 2000],
            errorRate: [5, 3],
          },
          curveType: 'linear' as const,
        },
        {
          serverId: 'api-2',
          metrics: {
            cpu: [70, 60],
            memory: [72, 65],
            disk: [57, 56],
            network: [68, 60],
            responseTime: [2500, 1500],
            errorRate: [4, 2.5],
          },
          curveType: 'linear' as const,
        },
        {
          serverId: 'web-1',
          metrics: {
            cpu: [60, 45],
            memory: [65, 52],
            disk: [62, 61],
            network: [60, 48],
            responseTime: [2000, 800],
            errorRate: [5, 1.5],
          },
          curveType: 'linear' as const,
        },
        {
          serverId: 'web-2',
          metrics: {
            cpu: [58, 43],
            memory: [63, 50],
            disk: [62, 61],
            network: [58, 46],
            responseTime: [1800, 700],
            errorRate: [4.5, 1.3],
          },
          curveType: 'linear' as const,
        },
        ...SERVERS.filter(
          (s) =>
            ![
              'db-primary',
              'db-read-1',
              'api-1',
              'api-2',
              'web-1',
              'web-2',
            ].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [
              normalMetrics[s.type].cpu + 10,
              normalMetrics[s.type].cpu + 3,
            ],
            memory: [
              normalMetrics[s.type].memory + 10,
              normalMetrics[s.type].memory + 3,
            ],
            disk: [normalMetrics[s.type].disk + 1, normalMetrics[s.type].disk],
            network: [
              normalMetrics[s.type].network + 15,
              normalMetrics[s.type].network + 5,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
  ],
};

// 시나리오 2: Storage 부족 연쇄 장애 (6-12시)
const scenario2: ScenarioTimeline = {
  id: 'storage-full',
  name: 'Storage 부족 연쇄 장애',
  timeRange: [6, 12],
  phases: [
    {
      name: '정상',
      durationHours: 1,
      serverMetrics: SERVERS.map((s) => ({
        serverId: s.id,
        metrics: {
          cpu: [normalMetrics[s.type].cpu, normalMetrics[s.type].cpu],
          memory: [normalMetrics[s.type].memory, normalMetrics[s.type].memory],
          disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk],
          network: [
            normalMetrics[s.type].network,
            normalMetrics[s.type].network,
          ],
        },
        curveType: 'linear' as const,
      })),
    },
    {
      name: '징조',
      durationHours: 2,
      serverMetrics: [
        {
          serverId: 'storage-1',
          metrics: {
            cpu: [20, 35],
            memory: [40, 55],
            disk: [75, 90],
            network: [35, 45],
          },
          curveType: 'linear',
        },
        {
          serverId: 'log-server',
          metrics: {
            cpu: [30, 45],
            memory: [50, 65],
            disk: [80, 92],
            network: [40, 50],
          },
          curveType: 'linear',
        },
        ...SERVERS.filter(
          (s) => !['storage-1', 'log-server'].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [normalMetrics[s.type].cpu, normalMetrics[s.type].cpu + 3],
            memory: [
              normalMetrics[s.type].memory,
              normalMetrics[s.type].memory + 3,
            ],
            disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk + 2],
            network: [
              normalMetrics[s.type].network,
              normalMetrics[s.type].network + 3,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '절정',
      durationHours: 2,
      serverMetrics: [
        {
          serverId: 'storage-1',
          metrics: {
            cpu: [35, 50],
            memory: [55, 75],
            disk: [90, 95],
            network: [45, 60],
          },
          curveType: 'spike',
        },
        {
          serverId: 'log-server',
          metrics: {
            cpu: [45, 70],
            memory: [65, 85],
            disk: [92, 96],
            network: [50, 65],
          },
          curveType: 'spike',
        },
        {
          serverId: 'storage-2',
          metrics: {
            cpu: [20, 55],
            memory: [40, 70],
            disk: [75, 92],
            network: [35, 55],
          },
          curveType: 'exponential',
        },
        ...SERVERS.filter(
          (s) => !['storage-1', 'log-server', 'storage-2'].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [normalMetrics[s.type].cpu + 3, normalMetrics[s.type].cpu + 8],
            memory: [
              normalMetrics[s.type].memory + 3,
              normalMetrics[s.type].memory + 8,
            ],
            disk: [
              normalMetrics[s.type].disk + 2,
              normalMetrics[s.type].disk + 5,
            ],
            network: [
              normalMetrics[s.type].network + 3,
              normalMetrics[s.type].network + 10,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '지속',
      durationHours: 1,
      serverMetrics: [
        {
          serverId: 'storage-1',
          metrics: {
            cpu: [50, 48],
            memory: [75, 73],
            disk: [95, 94],
            network: [60, 58],
          },
          curveType: 'linear',
        },
        {
          serverId: 'log-server',
          metrics: {
            cpu: [70, 68],
            memory: [85, 82],
            disk: [96, 95],
            network: [65, 62],
          },
          curveType: 'linear',
        },
        {
          serverId: 'storage-2',
          metrics: {
            cpu: [55, 52],
            memory: [70, 68],
            disk: [92, 91],
            network: [55, 52],
          },
          curveType: 'linear',
        },
        ...SERVERS.filter(
          (s) => !['storage-1', 'log-server', 'storage-2'].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [normalMetrics[s.type].cpu + 8, normalMetrics[s.type].cpu + 5],
            memory: [
              normalMetrics[s.type].memory + 8,
              normalMetrics[s.type].memory + 5,
            ],
            disk: [
              normalMetrics[s.type].disk + 5,
              normalMetrics[s.type].disk + 3,
            ],
            network: [
              normalMetrics[s.type].network + 10,
              normalMetrics[s.type].network + 6,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
  ],
};

// 시나리오 3: Cache 장애 (12-18시)
const scenario3: ScenarioTimeline = {
  id: 'cache-failure',
  name: 'Cache 장애 연쇄 영향',
  timeRange: [12, 18],
  phases: [
    {
      name: '정상',
      durationHours: 1,
      serverMetrics: SERVERS.map((s) => ({
        serverId: s.id,
        metrics: {
          cpu: [normalMetrics[s.type].cpu, normalMetrics[s.type].cpu],
          memory: [normalMetrics[s.type].memory, normalMetrics[s.type].memory],
          disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk],
          network: [
            normalMetrics[s.type].network,
            normalMetrics[s.type].network,
          ],
        },
        curveType: 'linear' as const,
      })),
    },
    {
      name: '징조',
      durationHours: 1,
      serverMetrics: [
        {
          serverId: 'cache-1',
          metrics: {
            cpu: [25, 45],
            memory: [55, 70],
            disk: [40, 42],
            network: [60, 75],
            responseTime: [10, 50],
          },
          curveType: 'linear',
        },
        ...SERVERS.filter((s) => s.id !== 'cache-1').map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [normalMetrics[s.type].cpu, normalMetrics[s.type].cpu + 2],
            memory: [
              normalMetrics[s.type].memory,
              normalMetrics[s.type].memory + 2,
            ],
            disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk],
            network: [
              normalMetrics[s.type].network,
              normalMetrics[s.type].network + 3,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '장애',
      durationHours: 2,
      serverMetrics: [
        {
          serverId: 'cache-1',
          metrics: {
            cpu: [45, 85],
            memory: [70, 92],
            disk: [42, 44],
            network: [75, 95],
            responseTime: [50, 5000],
            errorRate: [0.01, 10],
          },
          curveType: 'spike',
        },
        {
          serverId: 'cache-2',
          metrics: {
            cpu: [25, 80],
            memory: [55, 88],
            disk: [40, 43],
            network: [60, 90],
            responseTime: [10, 4000],
            errorRate: [0.01, 8],
          },
          curveType: 'spike',
        },
        {
          serverId: 'db-primary',
          metrics: {
            cpu: [40, 75],
            memory: [60, 80],
            disk: [70, 72],
            network: [45, 70],
            responseTime: [50, 1500],
          },
          curveType: 'exponential',
        },
        {
          serverId: 'db-read-1',
          metrics: {
            cpu: [40, 72],
            memory: [60, 78],
            disk: [70, 71],
            network: [45, 68],
            responseTime: [50, 1400],
          },
          curveType: 'exponential',
        },
        ...SERVERS.filter(
          (s) =>
            !['cache-1', 'cache-2', 'db-primary', 'db-read-1'].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [
              normalMetrics[s.type].cpu + 2,
              normalMetrics[s.type].cpu + 10,
            ],
            memory: [
              normalMetrics[s.type].memory + 2,
              normalMetrics[s.type].memory + 10,
            ],
            disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk + 1],
            network: [
              normalMetrics[s.type].network + 3,
              normalMetrics[s.type].network + 15,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '부분회복',
      durationHours: 2,
      serverMetrics: [
        {
          serverId: 'cache-1',
          metrics: {
            cpu: [85, 35],
            memory: [92, 60],
            disk: [44, 41],
            network: [95, 65],
            responseTime: [5000, 20],
            errorRate: [10, 0.1],
          },
          curveType: 'linear',
        },
        {
          serverId: 'cache-2',
          metrics: {
            cpu: [80, 30],
            memory: [88, 58],
            disk: [43, 41],
            network: [90, 62],
            responseTime: [4000, 15],
            errorRate: [8, 0.1],
          },
          curveType: 'linear',
        },
        {
          serverId: 'db-primary',
          metrics: {
            cpu: [75, 45],
            memory: [80, 63],
            disk: [72, 71],
            network: [70, 48],
          },
          curveType: 'linear',
        },
        {
          serverId: 'db-read-1',
          metrics: {
            cpu: [72, 43],
            memory: [78, 62],
            disk: [71, 70],
            network: [68, 47],
          },
          curveType: 'linear',
        },
        ...SERVERS.filter(
          (s) =>
            !['cache-1', 'cache-2', 'db-primary', 'db-read-1'].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [
              normalMetrics[s.type].cpu + 10,
              normalMetrics[s.type].cpu + 2,
            ],
            memory: [
              normalMetrics[s.type].memory + 10,
              normalMetrics[s.type].memory + 2,
            ],
            disk: [normalMetrics[s.type].disk + 1, normalMetrics[s.type].disk],
            network: [
              normalMetrics[s.type].network + 15,
              normalMetrics[s.type].network + 4,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
  ],
};

// 시나리오 4: 네트워크 병목 (18-24시)
const scenario4: ScenarioTimeline = {
  id: 'network-bottleneck',
  name: '네트워크 병목 현상',
  timeRange: [18, 24],
  phases: [
    {
      name: '정상',
      durationHours: 1,
      serverMetrics: SERVERS.map((s) => ({
        serverId: s.id,
        metrics: {
          cpu: [normalMetrics[s.type].cpu, normalMetrics[s.type].cpu],
          memory: [normalMetrics[s.type].memory, normalMetrics[s.type].memory],
          disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk],
          network: [
            normalMetrics[s.type].network,
            normalMetrics[s.type].network,
          ],
        },
        curveType: 'linear' as const,
      })),
    },
    {
      name: '징조',
      durationHours: 1,
      serverMetrics: SERVERS.map((s) => ({
        serverId: s.id,
        metrics: {
          cpu: [normalMetrics[s.type].cpu, normalMetrics[s.type].cpu + 5],
          memory: [
            normalMetrics[s.type].memory,
            normalMetrics[s.type].memory + 3,
          ],
          disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk],
          network: [
            normalMetrics[s.type].network,
            normalMetrics[s.type].network + 20,
          ],
        },
        curveType: 'linear' as const,
      })),
    },
    {
      name: '악화',
      durationHours: 2,
      serverMetrics: [
        {
          serverId: 'api-1',
          metrics: {
            cpu: [40, 70],
            memory: [53, 75],
            disk: [55, 56],
            network: [70, 92],
            responseTime: [150, 2000],
          },
          curveType: 'exponential',
        },
        {
          serverId: 'api-2',
          metrics: {
            cpu: [40, 68],
            memory: [53, 73],
            disk: [55, 56],
            network: [70, 90],
            responseTime: [150, 1900],
          },
          curveType: 'exponential',
        },
        {
          serverId: 'web-1',
          metrics: {
            cpu: [35, 60],
            memory: [48, 68],
            disk: [60, 61],
            network: [60, 88],
            responseTime: [100, 1500],
          },
          curveType: 'exponential',
        },
        {
          serverId: 'web-2',
          metrics: {
            cpu: [35, 58],
            memory: [48, 66],
            disk: [60, 61],
            network: [60, 86],
            responseTime: [100, 1400],
          },
          curveType: 'exponential',
        },
        {
          serverId: 'db-primary',
          metrics: {
            cpu: [40, 65],
            memory: [60, 75],
            disk: [70, 71],
            network: [45, 80],
          },
          curveType: 'linear',
        },
        ...SERVERS.filter(
          (s) =>
            !['api-1', 'api-2', 'web-1', 'web-2', 'db-primary'].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [
              normalMetrics[s.type].cpu + 5,
              normalMetrics[s.type].cpu + 12,
            ],
            memory: [
              normalMetrics[s.type].memory + 3,
              normalMetrics[s.type].memory + 10,
            ],
            disk: [normalMetrics[s.type].disk, normalMetrics[s.type].disk + 1],
            network: [
              normalMetrics[s.type].network + 20,
              normalMetrics[s.type].network + 35,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '절정',
      durationHours: 1,
      serverMetrics: [
        {
          serverId: 'api-1',
          metrics: {
            cpu: [70, 85],
            memory: [75, 88],
            disk: [56, 57],
            network: [92, 96],
            responseTime: [2000, 3500],
            errorRate: [0.2, 4],
          },
          curveType: 'spike',
        },
        {
          serverId: 'api-2',
          metrics: {
            cpu: [68, 82],
            memory: [73, 86],
            disk: [56, 57],
            network: [90, 94],
            responseTime: [1900, 3300],
            errorRate: [0.2, 3.5],
          },
          curveType: 'spike',
        },
        {
          serverId: 'web-1',
          metrics: {
            cpu: [60, 75],
            memory: [68, 80],
            disk: [61, 62],
            network: [88, 93],
            responseTime: [1500, 2500],
            errorRate: [0.1, 3],
          },
          curveType: 'spike',
        },
        {
          serverId: 'web-2',
          metrics: {
            cpu: [58, 72],
            memory: [66, 78],
            disk: [61, 62],
            network: [86, 91],
            responseTime: [1400, 2400],
            errorRate: [0.1, 2.8],
          },
          curveType: 'spike',
        },
        {
          serverId: 'db-primary',
          metrics: {
            cpu: [65, 78],
            memory: [75, 85],
            disk: [71, 72],
            network: [80, 90],
          },
          curveType: 'exponential',
        },
        ...SERVERS.filter(
          (s) =>
            !['api-1', 'api-2', 'web-1', 'web-2', 'db-primary'].includes(s.id)
        ).map((s) => ({
          serverId: s.id,
          metrics: {
            cpu: [
              normalMetrics[s.type].cpu + 12,
              normalMetrics[s.type].cpu + 18,
            ],
            memory: [
              normalMetrics[s.type].memory + 10,
              normalMetrics[s.type].memory + 15,
            ],
            disk: [
              normalMetrics[s.type].disk + 1,
              normalMetrics[s.type].disk + 2,
            ],
            network: [
              normalMetrics[s.type].network + 35,
              normalMetrics[s.type].network + 45,
            ],
          },
          curveType: 'linear' as const,
        })),
      ],
    },
    {
      name: '회복',
      durationHours: 1,
      serverMetrics: SERVERS.map((s) => ({
        serverId: s.id,
        metrics: {
          cpu: [normalMetrics[s.type].cpu + 18, normalMetrics[s.type].cpu + 3],
          memory: [
            normalMetrics[s.type].memory + 15,
            normalMetrics[s.type].memory + 3,
          ],
          disk: [normalMetrics[s.type].disk + 2, normalMetrics[s.type].disk],
          network: [
            normalMetrics[s.type].network + 45,
            normalMetrics[s.type].network + 5,
          ],
        },
        curveType: 'linear' as const,
      })),
    },
  ],
};

export const SCENARIO_TIMELINES: ScenarioTimeline[] = [
  scenario1,
  scenario2,
  scenario3,
  scenario4,
];

/**
 * 변화 곡선 생성 함수
 */
export function generateCurve(
  startValue: number,
  endValue: number,
  points: number,
  curveType: 'linear' | 'exponential' | 'spike'
): number[] {
  const result: number[] = [];

  for (let i = 0; i < points; i++) {
    const progress = i / (points - 1);
    let value: number;

    switch (curveType) {
      case 'linear':
        value = startValue + (endValue - startValue) * progress;
        break;
      case 'exponential':
        // 천천히 시작, 빠르게 증가
        value = startValue + (endValue - startValue) * Math.pow(progress, 2);
        break;
      case 'spike':
        // 급격한 증가 후 유지
        value =
          startValue + (endValue - startValue) * Math.min(1, progress * 2);
        break;
    }

    // 약간의 랜덤 노이즈 추가 (±2%)
    const noise = (Math.random() - 0.5) * value * 0.04;
    result.push(Math.max(0, Math.min(100, value + noise)));
  }

  return result;
}

/**
 * 24시간 데이터 생성 (5분 간격 = 288 포인트)
 * AI에게는 이 데이터만 노출됨 - 시나리오 힌트 없음!
 */
export function generate24HourData(serverId: string): ScenarioPoint[] {
  const data: ScenarioPoint[] = [];
  const server = SERVERS.find((s) => s.id === serverId);
  if (!server) throw new Error(`Server ${serverId} not found`);

  const pointsPerHour = 12; // 5분 간격

  // 각 시간대별로 적절한 시나리오 찾기
  for (let hour = 0; hour < 24; hour++) {
    // 해당 시간에 활성화된 시나리오 찾기
    const activeScenario = SCENARIO_TIMELINES.find(
      (s) => hour >= s.timeRange[0] && hour < s.timeRange[1]
    );

    if (!activeScenario) {
      // 시나리오 없음 - 정상 상태
      for (let min = 0; min < 60; min += 5) {
        const baseMetrics = normalMetrics[server.type];
        const noise = (Math.random() - 0.5) * 4;
        data.push({
          cpu: Math.max(0, Math.min(100, baseMetrics.cpu + noise)),
          memory: Math.max(0, Math.min(100, baseMetrics.memory + noise)),
          disk: baseMetrics.disk,
          network: Math.max(0, Math.min(100, baseMetrics.network + noise)),
          responseTime: baseMetrics.responseTime,
          errorRate: baseMetrics.errorRate,
        });
      }
      continue;
    }

    // 시나리오 내에서 현재 단계 찾기
    const currentHourInScenario = hour - activeScenario.timeRange[0];
    let accumulatedHours = 0;
    let currentPhase: ScenarioPhase | null = null;
    let hourWithinPhase = 0;

    for (const phase of activeScenario.phases) {
      if (currentHourInScenario < accumulatedHours + phase.durationHours) {
        currentPhase = phase;
        hourWithinPhase = currentHourInScenario - accumulatedHours;
        break;
      }
      accumulatedHours += phase.durationHours;
    }

    if (!currentPhase) {
      // 폴백: 정상 상태
      for (let min = 0; min < 60; min += 5) {
        data.push({ ...normalMetrics[server.type] });
      }
      continue;
    }

    // 현재 단계에서 이 서버의 메트릭 찾기
    const serverMetric = currentPhase.serverMetrics.find(
      (sm) => sm.serverId === serverId
    );

    if (!serverMetric) {
      // 이 서버는 현재 단계에서 영향 없음
      for (let min = 0; min < 60; min += 5) {
        data.push({ ...normalMetrics[server.type] });
      }
      continue;
    }

    // 이 시간대(1시간)의 변화 곡선 생성
    const totalPointsInPhase = currentPhase.durationHours * pointsPerHour;
    const startPointInPhase = hourWithinPhase * pointsPerHour;

    const cpuCurve = generateCurve(
      serverMetric.metrics.cpu[0] ?? 0,
      serverMetric.metrics.cpu[1] ?? 0,
      totalPointsInPhase,
      serverMetric.curveType
    );
    const memoryCurve = generateCurve(
      serverMetric.metrics.memory[0] ?? 0,
      serverMetric.metrics.memory[1] ?? 0,
      totalPointsInPhase,
      serverMetric.curveType
    );
    const diskCurve = generateCurve(
      serverMetric.metrics.disk[0] ?? 0,
      serverMetric.metrics.disk[1] ?? 0,
      totalPointsInPhase,
      serverMetric.curveType
    );
    const networkCurve = generateCurve(
      serverMetric.metrics.network[0] ?? 0,
      serverMetric.metrics.network[1] ?? 0,
      totalPointsInPhase,
      serverMetric.curveType
    );

    let responseTimeCurve: number[] | undefined;
    let errorRateCurve: number[] | undefined;

    if (
      serverMetric.metrics.responseTime &&
      serverMetric.metrics.responseTime.length === 2
    ) {
      responseTimeCurve = generateCurve(
        serverMetric.metrics.responseTime[0] ?? 0,
        serverMetric.metrics.responseTime[1] ?? 0,
        totalPointsInPhase,
        serverMetric.curveType
      );
    }

    if (
      serverMetric.metrics.errorRate &&
      serverMetric.metrics.errorRate.length === 2
    ) {
      errorRateCurve = generateCurve(
        serverMetric.metrics.errorRate[0] ?? 0,
        serverMetric.metrics.errorRate[1] ?? 0,
        totalPointsInPhase,
        serverMetric.curveType
      );
    }

    // 이 시간의 12개 포인트 추출
    for (let i = 0; i < pointsPerHour; i++) {
      const pointIndex = startPointInPhase + i;
      data.push({
        cpu: cpuCurve[pointIndex] ?? 0,
        memory: memoryCurve[pointIndex] ?? 0,
        disk: diskCurve[pointIndex] ?? 0,
        network: networkCurve[pointIndex] ?? 0,
        responseTime: responseTimeCurve?.[pointIndex],
        errorRate: errorRateCurve?.[pointIndex],
      });
    }
  }

  return data;
}

/**
 * 서버 상태 판정 (메트릭 기반)
 * AI도 이 로직으로 상태를 추론할 수 있음
 */
export function getServerStatus(metrics: ScenarioPoint): ServerStatus {
  // Critical: CPU 85% 이상 OR Memory 90% 이상 OR Disk 92% 이상
  if (metrics.cpu >= 85 || metrics.memory >= 90 || metrics.disk >= 92) {
    return 'critical';
  }

  // Warning: CPU 70% 이상 OR Memory 75% 이상 OR Disk 85% 이상
  if (metrics.cpu >= 70 || metrics.memory >= 75 || metrics.disk >= 85) {
    return 'warning';
  }

  return 'normal';
}

/**
 * AI 분석용 인터페이스 (순수 메트릭만)
 * 시나리오 힌트 없음!
 */
export interface ServerMetricsSnapshot {
  timestamp: Date;
  servers: Array<{
    id: string;
    name: string;
    type: ServerType;
    metrics: ScenarioPoint;
    status: ServerStatus;
  }>;
}
