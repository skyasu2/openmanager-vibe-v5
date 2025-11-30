/**
 * 🎭 장애 시나리오 정의
 *
 * 24시간 고정 데이터에 포함될 5-6개 장애 시나리오
 * AI 어시스턴트가 분석할 수 있는 패턴 내장
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
 * 24시간 데이터에 포함된 장애 시나리오 (6개)
 */
export const FAILURE_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'dawn-backup',
    name: '새벽 백업 디스크 사용 급증',
    description: '매일 새벽 2시-4시에 실행되는 자동 백업으로 디스크 I/O 급증',
    timeRange: [120, 240], // 02:00-04:00
    serverId: 'DB-MAIN-01',
    affectedMetric: 'disk',
    severity: 'warning',
    pattern: 'gradual',
    baseValue: 50,
    peakValue: 95,
  },
  {
    id: 'morning-peak-cpu',
    name: '출근 시간대 CPU 스파이크',
    description: '오전 8-9시 출근 시간대 사용자 접속 폭주로 웹 서버 CPU 급증',
    timeRange: [480, 540], // 08:00-09:00
    serverId: 'WEB-01',
    affectedMetric: 'cpu',
    severity: 'warning',
    pattern: 'spike',
    baseValue: 30,
    peakValue: 85,
  },
  {
    id: 'lunch-memory-oscillate',
    name: '점심 시간 메모리 진동',
    description: '12-13시 점심 주문 앱 사용 증가로 메모리 사용량 진동',
    timeRange: [720, 780], // 12:00-13:00
    serverId: 'APP-01',
    affectedMetric: 'memory',
    severity: 'normal',
    pattern: 'oscillate',
    baseValue: 60,
    peakValue: 80,
  },
  {
    id: 'storage-warning',
    name: '오후 디스크 경고',
    description: '17-18시 로그 파일 누적으로 스토리지 서버 디스크 경고',
    timeRange: [1020, 1080], // 17:00-18:00
    serverId: 'STORAGE-01',
    affectedMetric: 'disk',
    severity: 'warning',
    pattern: 'sustained',
    baseValue: 75,
    peakValue: 88,
  },
  {
    id: 'evening-network-critical',
    name: '저녁 네트워크 폭주',
    description: '20-22시 저녁 피크 타임 네트워크 트래픽 폭주 (심각)',
    timeRange: [1200, 1320], // 20:00-22:00
    serverId: 'WEB-03',
    affectedMetric: 'network',
    severity: 'critical',
    pattern: 'oscillate',
    baseValue: 40,
    peakValue: 92,
  },
  {
    id: 'night-memory-leak',
    name: '야간 메모리 누수',
    description: '23시대 메모리 누수로 인한 APP-02 서버 메모리 급증 (심각)',
    timeRange: [1380, 1439], // 23:00-23:59
    serverId: 'APP-02',
    affectedMetric: 'memory',
    severity: 'critical',
    pattern: 'spike',
    baseValue: 70,
    peakValue: 92,
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
      // 진동 (사인파)
      const amplitude = (scenario.peakValue - baseValue) / 2;
      const midValue = baseValue + amplitude;
      value = midValue + amplitude * Math.sin(progress * Math.PI * 4); // 4번 진동
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
