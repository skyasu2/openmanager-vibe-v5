/**
 * 🎯 통합 메트릭 API - 모니터링과 AI 어시스턴트 데이터 일관성 보장
 *
 * 기능:
 * - 1분 단위 시간 정규화로 데이터 일치성 보장
 * - 24시간 순환 시스템
 * - 10분 기준점 + FNV-1a 보간
 * - 모니터링과 AI 어시스턴트 공통 사용
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSystemConfig } from '@/config/SystemConfiguration';
import { logger } from '@/lib/logging';
import { getUnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';
import type {
  AlertSeverity,
  EnhancedServerMetrics,
  ServerAlert,
  ServerRole,
} from '@/types/server';

// 🔧 사이클 정보 타입
interface CycleScenario {
  name: string;
  description: string;
  primaryMetric: string;
  affectedServers: string[];
}

interface CycleInfo {
  timeSlot: number;
  scenario?: CycleScenario;
  phase: string;
  intensity: number;
  progress: number;
  description: string;
  expectedResolution: Date | null;
}

// 🕐 시간 정규화 - 1분 단위로 통일
function normalizeTimestamp(timestamp: number): number {
  const minuteMs = 60 * 1000; // 1분 = 60,000ms
  return Math.floor(timestamp / minuteMs) * minuteMs;
}

// 🔄 24시간 순환 시스템 (86,400초 = 24시간)
function get24HourCycle(timestamp: number): number {
  const dayMs = 24 * 60 * 60 * 1000; // 86,400,000ms
  return timestamp % dayMs;
}

// 📊 10분 기준점 계산 (144개 슬롯: 0-143)
function getBaseline10MinSlot(cycleTime: number): number {
  const tenMinMs = 10 * 60 * 1000; // 600,000ms
  return Math.floor(cycleTime / tenMinMs); // 0-143 범위
}

// ⚡ FNV-1a 해시 기반 보간 (기존 코드와 동일)
function fnv1aHash(seed: number | string): number {
  let hash = 0x811c9dc5;
  const str = typeof seed === 'number' ? seed.toString() : seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash / 0xffffffff;
}

// 🏗️ 서버 타입별 기준 프로필
const SERVER_PROFILES = {
  web: { cpu: [20, 60], memory: [30, 70], disk: [10, 40], network: [15, 45] },
  api: { cpu: [30, 75], memory: [40, 80], disk: [5, 25], network: [20, 60] },
  database: {
    cpu: [10, 50],
    memory: [40, 85],
    disk: [20, 70],
    network: [10, 30],
  },
  cache: { cpu: [5, 30], memory: [60, 90], disk: [5, 15], network: [25, 55] },
  monitoring: {
    cpu: [15, 45],
    memory: [25, 60],
    disk: [10, 35],
    network: [15, 40],
  },
  security: {
    cpu: [20, 55],
    memory: [30, 65],
    disk: [15, 45],
    network: [20, 50],
  },
  backup: { cpu: [5, 25], memory: [20, 50], disk: [30, 80], network: [10, 35] },
  load_balancer: {
    cpu: [25, 65],
    memory: [35, 70],
    disk: [5, 20],
    network: [40, 80],
  },
  file: { cpu: [10, 40], memory: [25, 60], disk: [40, 85], network: [30, 70] },
  mail: { cpu: [15, 45], memory: [30, 65], disk: [20, 50], network: [25, 60] },
} as const;

// 🎭 6개 시간대별 장애-해소 사이클
function getIncidentCycleInfo(hour: number, minute: number) {
  const timeSlot = Math.floor(hour / 4); // 0-5 (6개 시간대)
  const progressInSlot = ((hour % 4) * 60 + minute) / 240; // 0.0-1.0

  // 각 시간대별 장애 시나리오
  const cycleScenarios = [
    {
      // 0-4시: 백업 사이클
      name: 'backup_cycle',
      description: '야간 백업 및 정리',
      primaryMetric: 'disk',
      affectedServers: ['backup-01', 'database-01', 'file-01'],
    },
    {
      // 4-8시: 유지보수 사이클
      name: 'maintenance_cycle',
      description: '새벽 패치 및 재시작',
      primaryMetric: 'cpu',
      affectedServers: ['web-01', 'api-01', 'security-01'],
    },
    {
      // 8-12시: 트래픽 사이클
      name: 'traffic_cycle',
      description: '출근시간 트래픽 폭증',
      primaryMetric: 'network',
      affectedServers: ['web-01', 'web-02', 'load_balancer-01'],
    },
    {
      // 12-16시: 데이터베이스 사이클
      name: 'database_cycle',
      description: '점심시간 주문 폭증',
      primaryMetric: 'memory',
      affectedServers: ['database-01', 'api-01', 'cache-01'],
    },
    {
      // 16-20시: 네트워크 사이클
      name: 'network_cycle',
      description: '퇴근시간 파일 다운로드',
      primaryMetric: 'network',
      affectedServers: ['file-01', 'web-03', 'load_balancer-01'],
    },
    {
      // 20-24시: 배치 사이클
      name: 'batch_cycle',
      description: '저녁 데이터 처리',
      primaryMetric: 'memory',
      affectedServers: ['api-02', 'database-02', 'monitoring-01'],
    },
  ];

  // 장애 진행 단계 계산
  const getIncidentPhase = (progress: number) => {
    if (progress < 0.2)
      return { phase: 'normal', intensity: 0.0, description: '정상 운영' };
    if (progress < 0.5)
      return { phase: 'incident', intensity: 0.7, description: '장애 발생' };
    if (progress < 0.8)
      return { phase: 'peak', intensity: 1.0, description: '장애 심화' };
    if (progress < 0.95)
      return { phase: 'resolving', intensity: 0.3, description: '해결 중' };
    return { phase: 'resolved', intensity: 0.0, description: '해결 완료' };
  };

  const scenario = cycleScenarios[timeSlot];
  const phaseInfo = getIncidentPhase(progressInSlot);

  return {
    timeSlot,
    scenario,
    phase: phaseInfo.phase,
    intensity: phaseInfo.intensity,
    progress: progressInSlot,
    description: `${scenario?.description || 'Unknown scenario'} - ${phaseInfo.description}`,
    expectedResolution:
      phaseInfo.phase === 'resolved'
        ? null
        : new Date(Date.now() + (1 - progressInSlot) * 4 * 60 * 60 * 1000), // 해결 예상 시간
  };
}

// 📈 6개 사이클 기반 메트릭 생성
// 🎲 1분 단위 자연스러운 변동 추가
function interpolate1MinVariation(
  baseline: number,
  timestamp: number,
  serverId: string,
  metricType: string
): number {
  // FNV-1a 해시로 서버별 고유 변동 생성 (문자열 템플릿으로 충돌 감소)
  const seed = fnv1aHash(`${timestamp}-${serverId}-${metricType}`);

  // ±5% 범위의 자연스러운 변동 (baseline의 5%, 절대값 아님)
  const variationPercent = (seed - 0.5) * 0.1; // -0.05 ~ +0.05 (즉 ±5%)
  const variation = baseline * variationPercent;

  // 최종값은 0-100 범위로 제한
  return Math.max(0, Math.min(100, baseline + variation));
}

// 📋 사이클 기반 시나리오 생성 (Alert 형식으로 변환)
function generateCycleScenarios(
  cycleInfo: CycleInfo,
  serverId: string,
  _serverRole: ServerRole,
  normalizedTimestamp: number
): ServerAlert[] {
  if (!cycleInfo.scenario) {
    return [];
  }

  // Cycle scenario를 ServerAlert 형식으로 변환
  const severity: AlertSeverity =
    cycleInfo.intensity > 0.7
      ? 'critical'
      : cycleInfo.intensity > 0.4
        ? 'warning'
        : 'info';

  const alertType: ServerAlert['type'] = cycleInfo.scenario.name.includes('CPU')
    ? 'cpu'
    : cycleInfo.scenario.name.includes('Memory') ||
        cycleInfo.scenario.name.includes('메모리')
      ? 'memory'
      : cycleInfo.scenario.name.includes('Network') ||
          cycleInfo.scenario.name.includes('네트워크')
        ? 'network'
        : cycleInfo.scenario.name.includes('Disk') ||
            cycleInfo.scenario.name.includes('디스크')
          ? 'disk'
          : 'custom';

  return [
    {
      id: `alert-${serverId}-${cycleInfo.scenario.name.replace(/\s+/g, '-')}-${normalizedTimestamp}`,
      server_id: serverId,
      type: alertType,
      message: `${cycleInfo.scenario.name}: ${cycleInfo.scenario.description} (${cycleInfo.phase}, ${Math.round(cycleInfo.progress * 100)}%)`,
      severity,
      timestamp: new Date().toISOString(),
      resolved: cycleInfo.phase === '해소' || cycleInfo.phase === 'recovery',
    },
  ];
}

// 🔄 사이클 기반 메트릭 생성
function generateCycleBasedMetric(
  serverId: string,
  metricType: string,
  slot: number,
  cycleInfo: CycleInfo
): number {
  const serverType = serverId.split('-')[0] as keyof typeof SERVER_PROFILES;
  const profile = SERVER_PROFILES[serverType] || SERVER_PROFILES.web;
  const metricProfile = profile[metricType as keyof typeof profile] || [20, 60];

  // FNV-1a로 기준값 생성
  const baseHash = fnv1aHash(
    serverId.charCodeAt(0) + slot * 1000 + metricType.charCodeAt(0)
  );
  const [min, max] = metricProfile;
  const baseValue = min + (max - min) * baseHash;

  // 현재 사이클의 영향 계산
  let cycleEffect = 0;

  // 영향받는 서버인지 확인
  const isAffectedServer =
    cycleInfo.scenario?.affectedServers.includes(serverId) ?? false;

  if (isAffectedServer && cycleInfo.intensity > 0) {
    // 장애 유형별 영향
    const incidentEffects = {
      backup_cycle: {
        disk: +40, // 디스크 I/O 급증
        cpu: +15, // CPU도 일부 증가
        memory: +10,
        network: +5,
      },
      maintenance_cycle: {
        cpu: +45, // CPU 급증 (패치 적용)
        memory: +10,
        disk: +10,
        network: +5,
      },
      traffic_cycle: {
        network: +50, // 네트워크 급증 (트래픽 폭주)
        cpu: +20,
        memory: +15,
        disk: +5,
      },
      database_cycle: {
        memory: +60, // 메모리 급증 (쿼리 폭주)
        cpu: +30,
        disk: +20,
        network: +10,
      },
      network_cycle: {
        network: +55, // 네트워크 급증 (다운로드 폭주)
        disk: +25,
        cpu: +10,
        memory: +5,
      },
      batch_cycle: {
        memory: +50, // 메모리 급증 (배치 처리)
        cpu: +35,
        disk: +15,
        network: +5,
      },
    };

    // 사이클 타입에 해당하는 영향 적용
    const cycleName = cycleInfo.scenario?.name as keyof typeof incidentEffects;
    const effects = cycleName ? incidentEffects[cycleName] : null;

    if (effects?.[metricType as keyof typeof effects]) {
      cycleEffect =
        effects[metricType as keyof typeof effects] * cycleInfo.intensity;
    }
  }

  // 최종값 = 기준값 + 사이클 영향
  const finalValue = Math.max(0, Math.min(100, baseValue + cycleEffect));

  return Math.round(finalValue);
}

// 🚀 통합 서버 메트릭 생성 (6개 사이클 기반)
async function generateUnifiedServerMetrics(
  normalizedTimestamp: number
): Promise<EnhancedServerMetrics[]> {
  const cycleTime = get24HourCycle(normalizedTimestamp);
  const slot = getBaseline10MinSlot(cycleTime);
  const hour = Math.floor((slot * 10) / 60);
  const minute = Math.floor((slot * 10) % 60);

  // 현재 시간의 사이클 정보 계산
  const cycleInfo = getIncidentCycleInfo(hour, minute);

  // 🎯 통합 데이터 소스에서 서버 정보 가져오기 (중앙집중식 관리)
  const dataSource = getUnifiedServerDataSource();
  const servers = await dataSource.getServers();

  return servers.map((serverInfo) => {
    const serverId = serverInfo.id;
    // 6개 사이클 기반 메트릭 생성
    const cpuBaseline = generateCycleBasedMetric(
      serverId,
      'cpu',
      slot,
      cycleInfo
    );
    const memoryBaseline = generateCycleBasedMetric(
      serverId,
      'memory',
      slot,
      cycleInfo
    );
    const diskBaseline = generateCycleBasedMetric(
      serverId,
      'disk',
      slot,
      cycleInfo
    );
    const networkBaseline = generateCycleBasedMetric(
      serverId,
      'network',
      slot,
      cycleInfo
    );

    // 1분 보간값들 (자연스러운 변동)
    const cpu = interpolate1MinVariation(
      cpuBaseline,
      normalizedTimestamp,
      serverId,
      'cpu'
    );
    const memory = interpolate1MinVariation(
      memoryBaseline,
      normalizedTimestamp,
      serverId,
      'memory'
    );
    const disk = interpolate1MinVariation(
      diskBaseline,
      normalizedTimestamp,
      serverId,
      'disk'
    );
    const network = interpolate1MinVariation(
      networkBaseline,
      normalizedTimestamp,
      serverId,
      'network'
    );

    // 응답 시간 계산 (CPU 부하와 사이클 영향)
    const baseResponseTime = 50 + (cpu / 100) * 200; // 50-250ms 범위
    const cycleResponseMultiplier = 1 + cycleInfo.intensity * 0.5; // 장애 시 응답시간 증가
    const responseTime =
      baseResponseTime *
      cycleResponseMultiplier *
      (0.8 + fnv1aHash(normalizedTimestamp + serverId.charCodeAt(0)) * 0.4);

    // 📊 메트릭 기반 상태 결정 (hourly-data 원본값 사용 - SSOT 원칙)
    // 인위적 조정 제거: hourly-data에 실제 시나리오 값이 반영되어 있음
    const status =
      cpu > 85 || memory > 90
        ? 'critical'
        : cpu > 70 || memory > 80
          ? 'warning'
          : 'online';

    // 서버 역할 결정
    const serverRole = (serverInfo.role ||
      serverInfo.type ||
      serverId.split('-')[0]) as ServerRole;

    // 현재 사이클 기반 시나리오 생성
    const scenarios = generateCycleScenarios(
      cycleInfo,
      serverId,
      serverRole,
      normalizedTimestamp
    );

    return {
      id: serverId,
      name:
        serverInfo.hostname ||
        serverId
          .replace('-', ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase()),
      hostname: serverInfo.hostname || `${serverId}.local`,
      environment: 'production' as const,
      role: serverRole,
      status,

      // Enhanced metrics with required naming (hourly-data 원본값 사용)
      cpu_usage: Math.round(cpu * 10) / 10,
      memory_usage: Math.round(memory * 10) / 10,
      disk_usage: Math.round(disk * 10) / 10,
      network_in: Math.round(network * 10) / 10,
      network_out: Math.round(network * 10) / 10,
      responseTime: Math.round(responseTime),
      uptime: 99.95,
      last_updated: new Date(normalizedTimestamp).toISOString(),
      alerts: scenarios, // 생성된 시나리오를 alerts 배열에 연결

      // Compatibility fields (hourly-data 원본값 사용)
      cpu: Math.round(cpu * 10) / 10,
      memory: Math.round(memory * 10) / 10,
      disk: Math.round(disk * 10) / 10,
      network: Math.round(network * 10) / 10,

      // AI 어시스턴트를 위한 추가 메타데이터
      metadata: {
        serverType: (serverInfo.type || serverId.split('-')[0]) as ServerRole,
        timeSlot: slot,
        hour,
        minute,
        cycleInfo: {
          timeSlot: cycleInfo.timeSlot,
          scenario: cycleInfo.scenario
            ? {
                affectedServers: cycleInfo.scenario.affectedServers,
                name: cycleInfo.scenario.name,
              }
            : undefined,
          phase: cycleInfo.phase,
          intensity: cycleInfo.intensity,
          description: cycleInfo.description,
          expectedResolution: cycleInfo.expectedResolution,
        },
        scenarios: scenarios.map((alert) => ({
          type: serverRole, // Use server role instead of alert type
          severity: alert.severity,
          description: alert.message, // Map message to description
        })),
        baseline: {
          cpu: cpuBaseline,
          memory: memoryBaseline,
          disk: diskBaseline,
          network: networkBaseline,
        },
        // 조정 로직 제거됨 - hourly-data 원본값 사용 (SSOT)
        metrics: {
          cpu: cpu,
          memory: memory,
        },
        initialServerInfo: {
          type: serverInfo.type,
          description: serverInfo.description || 'Server description',
          location: serverInfo.location,
          initialStatus: serverInfo.status,
        },
        isAffectedByCurrentCycle:
          cycleInfo.scenario?.affectedServers.includes(serverId) || false,
      },
    };
  });
}

/**
 * 📊 GET /api/metrics/current
 *
 * 모니터링과 AI 어시스턴트가 공통으로 사용하는 통합 메트릭 API
 */
export async function GET(_request: NextRequest) {
  try {
    const startTime = Date.now();

    // 1분 단위 시간 정규화
    const currentTime = Date.now();
    const normalizedTime = normalizeTimestamp(currentTime);

    // 현재 시간의 사이클 정보
    const cycleTime = get24HourCycle(normalizedTime);
    const slot = getBaseline10MinSlot(cycleTime);
    const hour = Math.floor((slot * 10) / 60);
    const minute = Math.floor((slot * 10) % 60);
    const currentCycleInfo = getIncidentCycleInfo(hour, minute);

    // 통합 서버 메트릭 생성
    const servers = await generateUnifiedServerMetrics(normalizedTime);

    const processingTime = Date.now() - startTime;

    // 응답 데이터
    const response = {
      success: true,
      timestamp: normalizedTime,
      actualTimestamp: currentTime,
      servers,
      metadata: {
        timeInfo: {
          normalized: normalizedTime,
          actual: currentTime,
          cycle24h: cycleTime,
          slot10min: slot,
          hour,
          minute,
          validUntil: normalizedTime + 60000, // 1분 후 만료
        },
        currentCycle: {
          timeSlot: currentCycleInfo.timeSlot,
          scenario: currentCycleInfo.scenario?.name || 'normal',
          description: currentCycleInfo.description,
          phase: currentCycleInfo.phase,
          intensity: currentCycleInfo.intensity,
          progress: Math.round(currentCycleInfo.progress * 100),
          expectedResolution: currentCycleInfo.expectedResolution,
          affectedServers: currentCycleInfo.scenario?.affectedServers || [],
        },
        systemInfo: {
          totalServers: servers.length,
          processingTime,
          dataConsistency: true, // 통합 데이터 소스 보장
          version: 'unified-v3.0-centralized',
          cycleSystemEnabled: true,
          configSource: 'centralized-system',
          dataSourceType: getSystemConfig().mockSystem.dataSource,
        },
      },
    };

    // 📊 REALTIME: 30초 TTL, SWR 비활성화 (실시간 메트릭 최적화)
    // 메트릭은 자주 폴링되므로 SWR 백그라운드 갱신 불필요
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control':
        'private, max-age=0, s-maxage=30, stale-while-revalidate=0',
      'CDN-Cache-Control': 'public, s-maxage=30',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=30',
      'X-Timestamp-Normalized': normalizedTime.toString(),
      'X-Processing-Time': processingTime.toString(),
      'X-Data-Version': 'unified-v1.0',
    });

    return NextResponse.json(response, { headers });
  } catch (error) {
    logger.error('❌ 통합 메트릭 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Unified metrics API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      },
      { status: 500 }
    );
  }
}

// 📋 API 정보 조회
export function OPTIONS(_request: NextRequest) {
  return NextResponse.json({
    name: 'Unified Metrics API',
    description:
      '6개 시간대 장애-해소 사이클 기반 모니터링과 AI 어시스턴트 데이터 일관성 보장',
    features: [
      '1분 단위 시간 정규화',
      '24시간 순환 시스템',
      '6개 시간대별 장애-해소 사이클',
      '10분 기준점 + FNV-1a 보간',
      '현실적 장애 발생 및 자연 해결 패턴',
      'AI 어시스턴트 시나리오 분석 지원',
      '시간대별 서버 영향도 추적',
    ],
    cycles: [
      {
        slot: 0,
        hours: '0-4시',
        scenario: '백업 사이클',
        focus: '디스크 I/O 과부하',
      },
      {
        slot: 1,
        hours: '4-8시',
        scenario: '유지보수 사이클',
        focus: '패치 및 재시작',
      },
      {
        slot: 2,
        hours: '8-12시',
        scenario: '트래픽 사이클',
        focus: '출근시간 과부하',
      },
      {
        slot: 3,
        hours: '12-16시',
        scenario: '데이터베이스 사이클',
        focus: '점심 주문 폭증',
      },
      {
        slot: 4,
        hours: '16-20시',
        scenario: '네트워크 사이클',
        focus: '파일 다운로드 피크',
      },
      {
        slot: 5,
        hours: '20-24시',
        scenario: '배치 사이클',
        focus: '데이터 처리 작업',
      },
    ],
    version: 'unified-v2.0-cycles',
    consistency: true,
  });
}
