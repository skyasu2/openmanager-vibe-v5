/**
 * 🕐 고정 시간별 데이터 시스템
 * 24시간 × 15서버 = 360개 고정 레코드
 *
 * 사용자 요구사항:
 * - 24시간 30초 간격 고정값을 실시간인 것처럼
 * - 24시간 내내 번갈아가며 장애 발생
 * - 장애 시나리오는 AI가 직접 분석
 */

import type { Server } from '@/types/server';

export interface HourlyServerState {
  serverId: string;
  hour: number; // 0-23
  status: 'online' | 'warning' | 'critical';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  errorRate: number;
  incidentType?: string; // 장애 타입 (숨김)
  cascadeFrom?: string[]; // 연쇄 장애 원인 서버 (숨김)
}

/**
 * 🎯 24시간 장애 로테이션 패턴
 * 매 시간 최소 1개 심각, 2-3개 경고 유지
 */
const HOURLY_INCIDENT_ROTATION = [
  // 0시-5시: 심야 유지보수 중 장애
  {
    hour: 0,
    critical: ['db-main-01'],
    warning: ['storage-nas-01', 'db-repl-01'],
    incident: '백업 중 디스크 포화',
  },
  {
    hour: 1,
    critical: ['storage-nas-01'],
    warning: ['db-main-01', 'db-arch-01'],
    incident: '백업 스토리지 장애',
  },
  {
    hour: 2,
    critical: ['db-arch-01'],
    warning: ['storage-nas-01', 'mon-prd-01'],
    incident: '아카이브 프로세스 실패',
  },
  {
    hour: 3,
    critical: ['storage-nas-01'],
    warning: ['db-main-01', 'db-repl-01'],
    incident: '스토리지 I/O 병목',
  },
  {
    hour: 4,
    critical: ['db-repl-01'],
    warning: ['db-main-01', 'cache-prd-01'],
    incident: '복제 지연 심화',
  },
  {
    hour: 5,
    critical: ['cache-prd-01'],
    warning: ['app-prd-01', 'app-prd-02'],
    incident: '캐시 메모리 부족',
  },

  // 6시-8시: 출근 시간 트래픽 급증
  {
    hour: 6,
    critical: ['lb-main-01'],
    warning: ['web-prd-01', 'web-prd-02', 'api-prd-01'],
    incident: '로드밸런서 과부하',
  },
  {
    hour: 7,
    critical: ['web-prd-01'],
    warning: ['lb-main-01', 'api-prd-01', 'api-prd-02'],
    incident: '웹서버 응답 지연',
  },
  {
    hour: 8,
    critical: ['api-prd-01'],
    warning: ['web-prd-01', 'app-prd-01', 'app-prd-02'],
    incident: 'API 타임아웃',
  },

  // 9시-11시: 오전 업무 피크
  {
    hour: 9,
    critical: ['app-prd-01'],
    warning: ['app-prd-02', 'db-main-01', 'cache-prd-01'],
    incident: '애플리케이션 메모리 누수',
  },
  {
    hour: 10,
    critical: ['app-prd-02'],
    warning: ['app-prd-01', 'api-prd-01', 'db-main-01'],
    incident: 'CPU 스파이크',
  },
  {
    hour: 11,
    critical: ['db-main-01'],
    warning: ['db-repl-01', 'app-prd-01', 'cache-prd-01'],
    incident: '데이터베이스 락',
  },

  // 12시-13시: 점심시간
  {
    hour: 12,
    critical: ['web-prd-02'],
    warning: ['web-prd-01', 'lb-main-01'],
    incident: '웹서버 메모리 부족',
  },
  {
    hour: 13,
    critical: ['api-prd-02'],
    warning: ['api-prd-01', 'app-prd-03'],
    incident: 'GraphQL 쿼리 지연',
  },

  // 14시-17시: 오후 최대 피크
  {
    hour: 14,
    critical: ['lb-main-01'],
    warning: ['web-prd-01', 'web-prd-02', 'web-prd-03'],
    incident: '트래픽 폭증',
  },
  {
    hour: 15,
    critical: ['app-prd-01'],
    warning: ['app-prd-02', 'app-prd-03', 'db-main-01'],
    incident: '애플리케이션 장애 연쇄',
  },
  {
    hour: 16,
    critical: ['db-main-01'],
    warning: ['db-repl-01', 'cache-prd-01', 'app-prd-01'],
    incident: '디스크 95% 초과',
  },
  {
    hour: 17,
    critical: ['app-prd-03'],
    warning: ['api-prd-01', 'api-prd-02', 'web-prd-03'],
    incident: '.NET 서버 크래시',
  },

  // 18시-20시: 퇴근 시간
  {
    hour: 18,
    critical: ['web-prd-03'],
    warning: ['lb-main-01', 'api-prd-02'],
    incident: '세션 과다',
  },
  {
    hour: 19,
    critical: ['cache-prd-01'],
    warning: ['app-prd-01', 'app-prd-02'],
    incident: 'Redis 연결 풀 고갈',
  },
  {
    hour: 20,
    critical: ['api-prd-01'],
    warning: ['web-prd-01', 'app-prd-01'],
    incident: 'API 레이트 리밋',
  },

  // 21시-23시: 야간 배치
  {
    hour: 21,
    critical: ['db-arch-01'],
    warning: ['db-main-01', 'storage-nas-01'],
    incident: '배치 작업 실패',
  },
  {
    hour: 22,
    critical: ['storage-nas-01'],
    warning: ['db-arch-01', 'mon-prd-01'],
    incident: '스토리지 85% 경고',
  },
  {
    hour: 23,
    critical: ['mon-prd-01'],
    warning: ['db-main-01', 'storage-nas-01'],
    incident: '모니터링 데이터 손실',
  },
];

/**
 * 🔄 연쇄 장애 패턴 정의
 */
const CASCADE_PATTERNS: Record<string, string[]> = {
  'lb-main-01': ['web-prd-01', 'web-prd-02', 'web-prd-03'], // LB 장애 → 웹서버 영향
  'web-prd-01': ['api-prd-01', 'api-prd-02'], // 웹서버 → API 영향
  'api-prd-01': ['app-prd-01', 'app-prd-02', 'app-prd-03'], // API → 앱서버 영향
  'app-prd-01': ['db-main-01', 'cache-prd-01'], // 앱서버 → DB/캐시 영향
  'db-main-01': ['db-repl-01', 'db-arch-01'], // 메인DB → 복제DB 영향
  'cache-prd-01': ['app-prd-01', 'app-prd-02', 'app-prd-03'], // 캐시 → 앱서버 영향
  'storage-nas-01': ['db-main-01', 'db-arch-01'], // 스토리지 → DB 영향
};

/**
 * 📊 서버별 베이스라인 메트릭
 */
const SERVER_BASELINES: Record<
  string,
  { cpu: number; memory: number; disk: number; network: number }
> = {
  'lb-main-01': { cpu: 25, memory: 30, disk: 20, network: 70 },
  'web-prd-01': { cpu: 35, memory: 40, disk: 45, network: 50 },
  'web-prd-02': { cpu: 30, memory: 35, disk: 40, network: 45 },
  'web-prd-03': { cpu: 30, memory: 35, disk: 40, network: 45 },
  'api-prd-01': { cpu: 40, memory: 45, disk: 50, network: 60 },
  'api-prd-02': { cpu: 35, memory: 40, disk: 45, network: 55 },
  'app-prd-01': { cpu: 50, memory: 60, disk: 55, network: 40 },
  'app-prd-02': { cpu: 45, memory: 55, disk: 50, network: 35 },
  'app-prd-03': { cpu: 40, memory: 50, disk: 45, network: 30 },
  'cache-prd-01': { cpu: 20, memory: 70, disk: 15, network: 25 },
  'db-main-01': { cpu: 60, memory: 75, disk: 85, network: 45 },
  'db-repl-01': { cpu: 40, memory: 60, disk: 70, network: 35 },
  'db-arch-01': { cpu: 30, memory: 40, disk: 75, network: 25 },
  'storage-nas-01': { cpu: 25, memory: 35, disk: 80, network: 60 },
  'mon-prd-01': { cpu: 30, memory: 40, disk: 50, network: 30 },
};

/**
 * 🎲 노이즈와 변동성 추가
 */
function addNoise(value: number, variance: number = 5): number {
  const noise = (Math.random() - 0.5) * variance * 2;
  return Math.max(0, Math.min(100, value + noise));
}

/**
 * 🚨 장애 상태에 따른 메트릭 조정
 */
function adjustMetricsForIncident(
  baseline: { cpu: number; memory: number; disk: number; network: number },
  status: 'online' | 'warning' | 'critical',
  hour: number
): {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  errorRate: number;
} {
  let cpu = baseline.cpu;
  let memory = baseline.memory;
  let disk = baseline.disk;
  let network = baseline.network;
  let responseTime = 50;
  let errorRate = 0.1;

  // 시간대별 기본 가중치
  const timeMultiplier = getTimeMultiplier(hour);

  cpu *= timeMultiplier.cpu;
  memory *= timeMultiplier.memory;
  disk *= timeMultiplier.disk;
  network *= timeMultiplier.network;

  // 상태별 조정
  if (status === 'critical') {
    cpu = Math.min(95, cpu * 1.8 + 20);
    memory = Math.min(95, memory * 1.7 + 15);
    responseTime = 500 + Math.random() * 1500;
    errorRate = 5 + Math.random() * 10;
  } else if (status === 'warning') {
    cpu = Math.min(85, cpu * 1.4 + 10);
    memory = Math.min(85, memory * 1.3 + 10);
    responseTime = 200 + Math.random() * 300;
    errorRate = 1 + Math.random() * 3;
  } else {
    responseTime = 50 + Math.random() * 50;
    errorRate = Math.random() * 0.5;
  }

  return {
    cpu: addNoise(cpu),
    memory: addNoise(memory),
    disk: addNoise(disk),
    network: addNoise(network),
    responseTime,
    errorRate,
  };
}

/**
 * ⏰ 시간대별 가중치
 */
function getTimeMultiplier(hour: number): {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
} {
  // 0-5시: 낮음
  if (hour >= 0 && hour < 6) {
    return { cpu: 0.5, memory: 0.6, disk: 1.2, network: 0.4 };
  }
  // 6-9시: 증가
  if (hour >= 6 && hour < 9) {
    return { cpu: 1.2, memory: 1.1, disk: 1.0, network: 1.3 };
  }
  // 9-12시: 높음
  if (hour >= 9 && hour < 12) {
    return { cpu: 1.4, memory: 1.3, disk: 1.1, network: 1.5 };
  }
  // 12-14시: 보통
  if (hour >= 12 && hour < 14) {
    return { cpu: 1.0, memory: 1.0, disk: 1.0, network: 1.1 };
  }
  // 14-18시: 최고
  if (hour >= 14 && hour < 18) {
    return { cpu: 1.6, memory: 1.5, disk: 1.2, network: 1.7 };
  }
  // 18-21시: 감소
  if (hour >= 18 && hour < 21) {
    return { cpu: 1.1, memory: 1.0, disk: 0.9, network: 1.2 };
  }
  // 21-24시: 낮음
  return { cpu: 0.6, memory: 0.7, disk: 1.1, network: 0.5 };
}

/**
 * 🏭 24시간 고정 데이터 생성
 */
export function generateFixedHourlyData(): HourlyServerState[] {
  const data: HourlyServerState[] = [];
  const allServerIds = Object.keys(SERVER_BASELINES);

  for (let hour = 0; hour < 24; hour++) {
    const hourPattern = HOURLY_INCIDENT_ROTATION[hour];

    for (const serverId of allServerIds) {
      let status: 'online' | 'warning' | 'critical' = 'online';
      let incidentType: string | undefined;
      let cascadeFrom: string[] | undefined;

      // 상태 결정
      if (hourPattern.critical.includes(serverId)) {
        status = 'critical';
        incidentType = hourPattern.incident;
      } else if (hourPattern.warning.includes(serverId)) {
        status = 'warning';
        incidentType = hourPattern.incident;

        // 연쇄 장애 체크
        for (const criticalServer of hourPattern.critical) {
          if (CASCADE_PATTERNS[criticalServer]?.includes(serverId)) {
            cascadeFrom = [criticalServer];
            break;
          }
        }
      }

      // 메트릭 계산
      const baseline = SERVER_BASELINES[serverId];
      const metrics = adjustMetricsForIncident(baseline, status, hour);

      data.push({
        serverId,
        hour,
        status,
        cpu: Math.round(metrics.cpu),
        memory: Math.round(metrics.memory),
        disk: Math.round(metrics.disk),
        network: Math.round(metrics.network),
        responseTime: Math.round(metrics.responseTime),
        errorRate: Math.round(metrics.errorRate * 10) / 10,
        incidentType, // AI가 분석할 수 있도록 포함하지만 UI에는 표시 안함
        cascadeFrom, // 연쇄 장애 정보
      });
    }
  }

  return data;
}

/**
 * 🔍 특정 시간의 서버 상태 조회
 */
export function getServerStateAtHour(
  serverId: string,
  hour: number
): HourlyServerState | null {
  const allData = generateFixedHourlyData();
  return (
    allData.find((d) => d.serverId === serverId && d.hour === hour) || null
  );
}

/**
 * 📊 특정 서버의 24시간 데이터 조회
 */
export function getServerDayData(serverId: string): HourlyServerState[] {
  const allData = generateFixedHourlyData();
  return allData.filter((d) => d.serverId === serverId);
}

/**
 * 🕐 특정 시간의 모든 서버 상태 조회
 */
export function getAllServersAtHour(hour: number): HourlyServerState[] {
  const allData = generateFixedHourlyData();
  return allData.filter((d) => d.hour === hour);
}

/**
 * 📈 통계 정보 생성
 */
export function getHourlyStatistics(hour: number): {
  totalServers: number;
  online: number;
  warning: number;
  critical: number;
  avgCpu: number;
  avgMemory: number;
  avgResponseTime: number;
} {
  const servers = getAllServersAtHour(hour);

  const stats = {
    totalServers: servers.length,
    online: servers.filter((s) => s.status === 'online').length,
    warning: servers.filter((s) => s.status === 'warning').length,
    critical: servers.filter((s) => s.status === 'critical').length,
    avgCpu: Math.round(
      servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length
    ),
    avgMemory: Math.round(
      servers.reduce((sum, s) => sum + s.memory, 0) / servers.length
    ),
    avgResponseTime: Math.round(
      servers.reduce((sum, s) => sum + s.responseTime, 0) / servers.length
    ),
  };

  return stats;
}

/**
 * 🔄 실시간 시뮬레이션용 현재 시간 계산
 * 30초 = 1시간 매핑
 */
export function getCurrentSimulatedHour(): number {
  const now = new Date();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();

  // 전체 초로 변환 (0-3599)
  const totalSeconds = minutes * 60 + seconds;

  // 30초 = 1시간으로 매핑 (0-23)
  // 12분(720초) = 24시간
  const hour = Math.floor((totalSeconds % 720) / 30);

  return hour;
}

/**
 * 🏢 현재 시간 기준 서버 데이터 조회
 */
export function getCurrentServersData(): HourlyServerState[] {
  const currentHour = getCurrentSimulatedHour();
  return getAllServersAtHour(currentHour);
}

/**
 * 📊 현재 시간 기준 통계
 */
export function getCurrentStatistics() {
  const currentHour = getCurrentSimulatedHour();
  return getHourlyStatistics(currentHour);
}
