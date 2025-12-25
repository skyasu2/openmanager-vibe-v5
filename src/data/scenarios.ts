/**
 * 🎭 장애 시나리오 정의 (24시간 4분할 상시 장애)
 *
 * 24시간을 4개 시간대로 분할하여 각 시간대마다:
 * - 1개 Critical (심각) 시나리오
 * - 2개 Warning (경고) 시나리오
 *
 * 총 12개 시나리오로 상시 장애 상태 유지
 *
 * 서버 존 (한국 기반):
 * - ICN: 인천/서울 (메인)
 * - PUS: 부산 (DR)
 */

export type MetricType = 'cpu' | 'memory' | 'disk' | 'network';
export type Severity = 'normal' | 'warning' | 'critical';
export type Pattern = 'spike' | 'gradual' | 'oscillate' | 'sustained';

/**
 * 장애 시나리오 정의
 */
export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  timeRange: [number, number]; // 분 단위 (0-1439)
  serverId: string;
  affectedMetric: MetricType;
  severity: Severity;
  pattern: Pattern;
  baseValue: number; // 정상 시 기준값
  peakValue: number; // 장애 시 최고값
}

/**
 * 24시간 4분할 장애 시나리오 (12개)
 *
 * 시간대 1: 00:00-06:00 (심야/새벽) - 0~360분
 * 시간대 2: 06:00-12:00 (오전) - 360~720분
 * 시간대 3: 12:00-18:00 (오후) - 720~1080분
 * 시간대 4: 18:00-24:00 (저녁/밤) - 1080~1440분
 */
export const FAILURE_SCENARIOS: ScenarioDefinition[] = [
  // ============================================================================
  // 시간대 1: 00:00-06:00 (심야/새벽) - 1 Critical + 2 Warning
  // ============================================================================
  {
    id: 'midnight-db-disk-critical',
    name: '심야 DB 디스크 풀 (Critical)',
    description:
      '새벽 자동 백업 + 바이너리 로그 누적으로 MySQL Primary 디스크 위험',
    timeRange: [0, 360], // 00:00-06:00
    serverId: 'db-mysql-icn-primary',
    affectedMetric: 'disk',
    severity: 'critical',
    pattern: 'gradual',
    baseValue: 50,
    peakValue: 92,
  },
  {
    id: 'midnight-web-cpu-warning',
    name: '심야 Nginx CPU 경고',
    description: '새벽 배치 크론 작업으로 웹서버 CPU 증가',
    timeRange: [0, 360], // 00:00-06:00
    serverId: 'web-nginx-icn-01',
    affectedMetric: 'cpu',
    severity: 'warning',
    pattern: 'oscillate',
    baseValue: 30,
    peakValue: 78,
  },
  {
    id: 'midnight-cache-memory-warning',
    name: '심야 Redis 메모리 경고',
    description: 'Redis 캐시 메모리 누적으로 경고 수준 도달',
    timeRange: [0, 360], // 00:00-06:00
    serverId: 'cache-redis-icn-01',
    affectedMetric: 'memory',
    severity: 'warning',
    pattern: 'sustained',
    baseValue: 80,
    peakValue: 88,
  },

  // ============================================================================
  // 시간대 2: 06:00-12:00 (오전) - 1 Critical + 2 Warning
  // ============================================================================
  {
    id: 'morning-api-memory-critical',
    name: '오전 WAS 메모리 누수 (Critical)',
    description: '출근 시간대 API 트래픽 급증으로 WAS JVM 힙 메모리 누수 발생',
    timeRange: [360, 720], // 06:00-12:00
    serverId: 'api-was-icn-02',
    affectedMetric: 'memory',
    severity: 'critical',
    pattern: 'spike',
    baseValue: 70,
    peakValue: 94,
  },
  {
    id: 'morning-web-network-warning',
    name: '오전 Nginx 네트워크 경고',
    description: '출근 피크 시간 웹서버 네트워크 트래픽 증가',
    timeRange: [360, 720], // 06:00-12:00
    serverId: 'web-nginx-icn-02',
    affectedMetric: 'network',
    severity: 'warning',
    pattern: 'oscillate',
    baseValue: 55,
    peakValue: 82,
  },
  {
    id: 'morning-lb-cpu-warning',
    name: '오전 HAProxy CPU 경고',
    description: '트래픽 분산 처리로 로드밸런서 CPU 증가',
    timeRange: [360, 720], // 06:00-12:00
    serverId: 'lb-haproxy-icn-01',
    affectedMetric: 'cpu',
    severity: 'warning',
    pattern: 'gradual',
    baseValue: 30,
    peakValue: 75,
  },

  // ============================================================================
  // 시간대 3: 12:00-18:00 (오후) - 1 Critical + 2 Warning
  // ============================================================================
  {
    id: 'afternoon-web-network-critical',
    name: '오후 Nginx 네트워크 폭주 (Critical)',
    description: '점심 피크 + 오후 업무 집중으로 부산 DR 웹서버 네트워크 폭주',
    timeRange: [720, 1080], // 12:00-18:00
    serverId: 'web-nginx-pus-01',
    affectedMetric: 'network',
    severity: 'critical',
    pattern: 'oscillate',
    baseValue: 40,
    peakValue: 93,
  },
  {
    id: 'afternoon-storage-disk-warning',
    name: '오후 NFS 디스크 경고',
    description: '업무 시간 파일 업로드 누적으로 NFS 스토리지 디스크 증가',
    timeRange: [720, 1080], // 12:00-18:00
    serverId: 'storage-nfs-icn-01',
    affectedMetric: 'disk',
    severity: 'warning',
    pattern: 'gradual',
    baseValue: 75,
    peakValue: 86,
  },
  {
    id: 'afternoon-api-cpu-warning',
    name: '오후 WAS CPU 경고',
    description: '오후 API 요청 처리로 WAS 서버 CPU 증가',
    timeRange: [720, 1080], // 12:00-18:00
    serverId: 'api-was-icn-01',
    affectedMetric: 'cpu',
    severity: 'warning',
    pattern: 'oscillate',
    baseValue: 45,
    peakValue: 79,
  },

  // ============================================================================
  // 시간대 4: 18:00-24:00 (저녁/밤) - 1 Critical + 2 Warning
  // ============================================================================
  {
    id: 'evening-cache-memory-critical',
    name: '저녁 Redis 메모리 폭주 (Critical)',
    description: '저녁 피크 타임 캐시 히트율 증가로 Redis 클러스터 메모리 위험',
    timeRange: [1080, 1439], // 18:00-23:59
    serverId: 'cache-redis-icn-02',
    affectedMetric: 'memory',
    severity: 'critical',
    pattern: 'spike',
    baseValue: 85,
    peakValue: 96,
  },
  {
    id: 'evening-db-disk-warning',
    name: '저녁 MySQL Replica 디스크 경고',
    description: '하루 트랜잭션 로그 누적으로 Replica 서버 디스크 증가',
    timeRange: [1080, 1439], // 18:00-23:59
    serverId: 'db-mysql-icn-replica',
    affectedMetric: 'disk',
    severity: 'warning',
    pattern: 'gradual',
    baseValue: 48,
    peakValue: 82,
  },
  {
    id: 'evening-lb-network-warning',
    name: '저녁 부산 LB 네트워크 경고',
    description: '저녁 트래픽 증가로 부산 DR 로드밸런서 네트워크 부하',
    timeRange: [1080, 1439], // 18:00-23:59
    serverId: 'lb-haproxy-pus-01',
    affectedMetric: 'network',
    severity: 'warning',
    pattern: 'oscillate',
    baseValue: 75,
    peakValue: 88,
  },
];

/**
 * 시나리오 적용 함수
 */
export function applyScenario(
  serverId: string,
  metric: MetricType,
  minuteOfDay: number, // 0-1439
  baseValue: number
): number {
  // 해당 서버의 해당 시간대에 적용되는 시나리오 찾기
  const scenario = FAILURE_SCENARIOS.find(
    (s) =>
      s.serverId === serverId &&
      s.affectedMetric === metric &&
      minuteOfDay >= s.timeRange[0] &&
      minuteOfDay <= s.timeRange[1]
  );

  if (!scenario) {
    return baseValue; // 시나리오 없으면 기준값 반환
  }

  // 시나리오 진행률 계산 (0.0 - 1.0)
  const [start, end] = scenario.timeRange;
  const duration = end - start;
  const elapsed = minuteOfDay - start;
  const progress = elapsed / duration;

  // 패턴별 값 계산
  let value = baseValue;

  switch (scenario.pattern) {
    case 'spike': {
      // 급격한 상승 후 유지 (0.0 → 0.2에서 급등)
      if (progress < 0.2) {
        value = baseValue + (scenario.peakValue - baseValue) * (progress / 0.2);
      } else {
        value = scenario.peakValue;
      }
      break;
    }
    case 'gradual': {
      // 점진적 상승 (선형)
      value = baseValue + (scenario.peakValue - baseValue) * progress;
      break;
    }
    case 'oscillate': {
      // 진동 (사인파) - 더 자연스러운 진동
      const amplitude = (scenario.peakValue - baseValue) / 2;
      const midValue = baseValue + amplitude;
      value = midValue + amplitude * Math.sin(progress * Math.PI * 6); // 6번 진동
      break;
    }
    case 'sustained': {
      // 즉시 상승 후 유지
      value = scenario.peakValue;
      break;
    }
  }

  return Math.max(0, Math.min(100, value));
}

/**
 * 현재 시간대의 활성 시나리오 조회
 */
export function getActiveScenarios(minuteOfDay: number): ScenarioDefinition[] {
  return FAILURE_SCENARIOS.filter(
    (s) => minuteOfDay >= s.timeRange[0] && minuteOfDay <= s.timeRange[1]
  );
}

/**
 * 서버별 장애 시나리오 조회
 */
export function getScenariosByServer(serverId: string): ScenarioDefinition[] {
  return FAILURE_SCENARIOS.filter((s) => s.serverId === serverId);
}

/**
 * 메트릭별 장애 시나리오 조회
 */
export function getScenariosByMetric(metric: MetricType): ScenarioDefinition[] {
  return FAILURE_SCENARIOS.filter((s) => s.affectedMetric === metric);
}

/**
 * 심각도별 장애 시나리오 조회
 */
export function getScenariosBySeverity(
  severity: Severity
): ScenarioDefinition[] {
  return FAILURE_SCENARIOS.filter((s) => s.severity === severity);
}

/**
 * 시간대별 요약 정보
 */
export function getTimeSlotSummary(): Array<{
  slot: string;
  timeRange: string;
  critical: number;
  warning: number;
  servers: string[];
}> {
  return [
    {
      slot: '심야/새벽',
      timeRange: '00:00-06:00',
      critical: 1,
      warning: 2,
      servers: [
        'db-mysql-icn-primary',
        'web-nginx-icn-01',
        'cache-redis-icn-01',
      ],
    },
    {
      slot: '오전',
      timeRange: '06:00-12:00',
      critical: 1,
      warning: 2,
      servers: ['api-was-icn-02', 'web-nginx-icn-02', 'lb-haproxy-icn-01'],
    },
    {
      slot: '오후',
      timeRange: '12:00-18:00',
      critical: 1,
      warning: 2,
      servers: ['web-nginx-pus-01', 'storage-nfs-icn-01', 'api-was-icn-01'],
    },
    {
      slot: '저녁/밤',
      timeRange: '18:00-24:00',
      critical: 1,
      warning: 2,
      servers: [
        'cache-redis-icn-02',
        'db-mysql-icn-replica',
        'lb-haproxy-pus-01',
      ],
    },
  ];
}
