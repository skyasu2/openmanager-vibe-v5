/**
 * 🎯 통합 메트릭 API - 모니터링과 AI 어시스턴트 데이터 일관성 보장
 * 
 * 기능:
 * - 1분 단위 시간 정규화로 데이터 일치성 보장
 * - 24시간 순환 시스템
 * - 10분 기준점 + FNV-1a 보간
 * - 모니터링과 AI 어시스턴트 공통 사용
 */

import { NextRequest, NextResponse } from 'next/server';
import type { EnhancedServerMetrics } from '@/types/server';
import { mockServersExpanded, serverInitialStatesExpanded } from '@/mock/mockServerConfigExpanded';

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
function fnv1aHash(seed: number): number {
  let hash = 0x811c9dc5;
  const str = seed.toString();
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash / 0xFFFFFFFF;
}

// 🏗️ 서버 타입별 기준 프로필
const SERVER_PROFILES = {
  web: { cpu: [20, 60], memory: [30, 70], disk: [10, 40], network: [15, 45] },
  api: { cpu: [30, 75], memory: [40, 80], disk: [5, 25], network: [20, 60] },
  database: { cpu: [10, 50], memory: [40, 85], disk: [20, 70], network: [10, 30] },
  cache: { cpu: [5, 30], memory: [60, 90], disk: [5, 15], network: [25, 55] },
  monitoring: { cpu: [15, 45], memory: [25, 60], disk: [10, 35], network: [15, 40] },
  security: { cpu: [20, 55], memory: [30, 65], disk: [15, 45], network: [20, 50] },
  backup: { cpu: [5, 25], memory: [20, 50], disk: [30, 80], network: [10, 35] },
  load_balancer: { cpu: [25, 65], memory: [35, 70], disk: [5, 20], network: [40, 80] },
  file: { cpu: [10, 40], memory: [25, 60], disk: [40, 85], network: [30, 70] },
  mail: { cpu: [15, 45], memory: [30, 65], disk: [20, 50], network: [25, 60] }
} as const;

// 🎭 6개 시간대별 장애-해소 사이클
function getIncidentCycleInfo(hour: number, minute: number) {
  const timeSlot = Math.floor(hour / 4); // 0-5 (6개 시간대)
  const progressInSlot = ((hour % 4) * 60 + minute) / 240; // 0.0-1.0
  
  // 각 시간대별 장애 시나리오
  const cycleScenarios = [
    { // 0-4시: 백업 사이클
      name: 'backup_cycle',
      description: '야간 백업 및 정리',
      primaryMetric: 'disk',
      affectedServers: ['backup-01', 'database-01', 'file-01']
    },
    { // 4-8시: 유지보수 사이클
      name: 'maintenance_cycle', 
      description: '새벽 패치 및 재시작',
      primaryMetric: 'cpu',
      affectedServers: ['web-01', 'api-01', 'security-01']
    },
    { // 8-12시: 트래픽 사이클
      name: 'traffic_cycle',
      description: '출근시간 트래픽 폭증',
      primaryMetric: 'network',
      affectedServers: ['web-01', 'web-02', 'load_balancer-01']
    },
    { // 12-16시: 데이터베이스 사이클
      name: 'database_cycle',
      description: '점심시간 주문 폭증',
      primaryMetric: 'memory',
      affectedServers: ['database-01', 'api-01', 'cache-01']
    },
    { // 16-20시: 네트워크 사이클  
      name: 'network_cycle',
      description: '퇴근시간 파일 다운로드',
      primaryMetric: 'network',
      affectedServers: ['file-01', 'web-03', 'load_balancer-01']
    },
    { // 20-24시: 배치 사이클
      name: 'batch_cycle',
      description: '저녁 데이터 처리',
      primaryMetric: 'memory', 
      affectedServers: ['api-02', 'database-02', 'monitoring-01']
    }
  ];
  
  // 장애 진행 단계 계산
  const getIncidentPhase = (progress: number) => {
    if (progress < 0.2) return { phase: 'normal', intensity: 0.0, description: '정상 운영' };
    if (progress < 0.5) return { phase: 'incident', intensity: 0.7, description: '장애 발생' };
    if (progress < 0.8) return { phase: 'peak', intensity: 1.0, description: '장애 심화' };
    if (progress < 0.95) return { phase: 'resolving', intensity: 0.3, description: '해결 중' };
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
    expectedResolution: phaseInfo.phase === 'resolved' ? null : 
      new Date(Date.now() + ((1 - progressInSlot) * 4 * 60 * 60 * 1000)) // 해결 예상 시간
  };
}

// 📈 6개 사이클 기반 메트릭 생성
function generateCycleBasedMetric(
  serverId: string, 
  metricType: string, 
  slot: number,
  cycleInfo: any
): number {
  const serverType = serverId.split('-')[0] as keyof typeof SERVER_PROFILES;
  const profile = SERVER_PROFILES[serverType] || SERVER_PROFILES.web;
  const metricProfile = profile[metricType as keyof typeof profile] || [20, 60];
  
  // FNV-1a로 기준값 생성
  const baseHash = fnv1aHash(serverId.charCodeAt(0) + slot * 1000 + metricType.charCodeAt(0));
  const [min, max] = metricProfile;
  const baseValue = min + (max - min) * baseHash;
  
  // 현재 사이클의 영향 계산
  let cycleEffect = 0;
  
  // 영향받는 서버인지 확인
  const isAffectedServer = cycleInfo.scenario.affectedServers.includes(serverId);
  
  if (isAffectedServer && cycleInfo.intensity > 0) {
    // 장애 유형별 영향
    const incidentEffects = {
      backup_cycle: {
        disk: +40, // 디스크 I/O 급증
        cpu: +15,  // CPU도 일부 증가
        memory: +10,
        network: +5
      },
      maintenance_cycle: {
        cpu: +35,  // 패치로 CPU 급증
        memory: +20,
        disk: +15,
        network: +5
      },
      traffic_cycle: {
        network: +45, // 네트워크 폭증
        cpu: +30,     // CPU도 급증
        memory: +15,
        disk: +5
      },
      database_cycle: {
        memory: +40, // 메모리 사용량 급증
        cpu: +25,    // DB CPU도 증가
        disk: +20,   // I/O도 증가
        network: +15
      },
      network_cycle: {
        network: +50, // 네트워크 최대 영향
        cpu: +20,     // 처리량 증가
        memory: +15,
        disk: +25     // 파일 처리
      },
      batch_cycle: {
        memory: +45, // 메모리 사용량 최대
        cpu: +25,    // 배치 처리 CPU
        disk: +20,
        network: +10
      }
    };
    
    const effects = incidentEffects[cycleInfo.scenario.name as keyof typeof incidentEffects];
    const metricEffect = effects[metricType as keyof typeof effects] || 0;
    
    // 사이클 강도에 따라 효과 조정
    cycleEffect = metricEffect * cycleInfo.intensity;
  }
  
  // 최종 값 계산
  const finalValue = baseValue + cycleEffect;
  
  // 0-100 범위로 제한
  return Math.max(0, Math.min(100, finalValue));
}

// 🔄 1분 보간 계산
function interpolate1MinVariation(
  baseline: number,
  timestamp: number,
  serverId: string,
  metricType: string
): number {
  const seed = timestamp + serverId.charCodeAt(0) + metricType.charCodeAt(0);
  const variation = fnv1aHash(seed) * 0.2; // ±10% 범위
  const result = baseline * (0.9 + variation);
  
  return Math.max(0, Math.min(100, result));
}

// 🎯 6개 사이클 기반 시나리오 생성
function generateCycleScenarios(cycleInfo: any, serverId: string): any[] {
  const scenarios = [];
  const isAffected = cycleInfo.scenario.affectedServers.includes(serverId);
  
  if (!isAffected || cycleInfo.intensity === 0) {
    return []; // 영향받지 않거나 정상 상태면 시나리오 없음
  }
  
  // 사이클별 주요 시나리오
  const cycleScenarios = {
    backup_cycle: {
      type: 'backup_overload',
      severity: cycleInfo.phase === 'peak' ? 'high' : 'medium',
      description: `야간 백업으로 디스크 I/O ${Math.round(cycleInfo.intensity * 100)}% 과부하`,
      aiContext: '전체 시스템 백업 진행 중이므로 디스크 응답시간이 증가했습니다. 백업 완료 시까지 성능 저하가 예상됩니다.',
      nextAction: '백업 완료까지 대기',
      estimatedDuration: `${Math.round((1 - cycleInfo.progress) * 4 * 60)}분`
    },
    maintenance_cycle: {
      type: 'patch_restart',  
      severity: cycleInfo.phase === 'peak' ? 'high' : 'medium',
      description: `보안 패치 적용으로 CPU ${Math.round(cycleInfo.intensity * 100)}% 스파이크`,
      aiContext: '새벽 정기 보안 패치 및 서버 재시작이 진행 중입니다. 서비스 안정화까지 시간이 필요합니다.',
      nextAction: '패치 완료 및 재시작 대기',
      estimatedDuration: `${Math.round((1 - cycleInfo.progress) * 4 * 60)}분`
    },
    traffic_cycle: {
      type: 'morning_traffic_surge',
      severity: cycleInfo.phase === 'peak' ? 'critical' : 'high', 
      description: `출근시간 트래픽으로 네트워크 ${Math.round(cycleInfo.intensity * 100)}% 과부하`,
      aiContext: '오전 출근시간으로 인한 동시 접속자 급증입니다. 오토스케일링으로 부하 분산 중입니다.',
      nextAction: '오토스케일링 완료 대기',
      estimatedDuration: `${Math.round((1 - cycleInfo.progress) * 4 * 60)}분`
    },
    database_cycle: {
      type: 'lunch_order_peak',
      severity: cycleInfo.phase === 'peak' ? 'critical' : 'high',
      description: `점심 주문 폭증으로 메모리 ${Math.round(cycleInfo.intensity * 100)}% 사용`,
      aiContext: '점심시간 주문 시스템 과부하로 데이터베이스 연결이 포화 상태입니다. 쿼리 최적화가 진행 중입니다.',
      nextAction: '인덱스 재구성 및 캐시 최적화',
      estimatedDuration: `${Math.round((1 - cycleInfo.progress) * 4 * 60)}분`
    },
    network_cycle: {
      type: 'file_download_peak',
      severity: cycleInfo.phase === 'peak' ? 'critical' : 'high',
      description: `퇴근시간 다운로드로 네트워크 ${Math.round(cycleInfo.intensity * 100)}% 포화`,
      aiContext: '퇴근시간 대용량 파일 다운로드로 네트워크 대역폭이 포화 상태입니다. CDN 활성화로 부하 분산 중입니다.',
      nextAction: 'CDN 트래픽 분산 완료 대기',
      estimatedDuration: `${Math.round((1 - cycleInfo.progress) * 4 * 60)}분`
    },
    batch_cycle: {
      type: 'evening_batch_processing',
      severity: cycleInfo.phase === 'peak' ? 'high' : 'medium',
      description: `저녁 배치작업으로 메모리 ${Math.round(cycleInfo.intensity * 100)}% 사용`,
      aiContext: '저녁 대량 데이터 처리 작업으로 메모리 사용량이 급증했습니다. 가비지 컬렉션 최적화가 필요합니다.',
      nextAction: '배치작업 완료 및 메모리 정리',
      estimatedDuration: `${Math.round((1 - cycleInfo.progress) * 4 * 60)}분`
    }
  };
  
  const scenario = cycleScenarios[cycleInfo.scenario.name as keyof typeof cycleScenarios];
  if (scenario) {
    scenarios.push({
      ...scenario,
      phase: cycleInfo.phase,
      intensity: cycleInfo.intensity,
      progress: Math.round(cycleInfo.progress * 100),
      timeSlot: cycleInfo.timeSlot,
      timestamp: Date.now()
    });
  }
  
  return scenarios;
}

// 🚀 통합 서버 메트릭 생성 (6개 사이클 기반)
async function generateUnifiedServerMetrics(normalizedTimestamp: number): Promise<EnhancedServerMetrics[]> {
  const cycleTime = get24HourCycle(normalizedTimestamp);
  const slot = getBaseline10MinSlot(cycleTime);
  const hour = Math.floor(slot * 10 / 60);
  const minute = Math.floor((slot * 10) % 60);
  
  // 현재 시간의 사이클 정보 계산
  const cycleInfo = getIncidentCycleInfo(hour, minute);
  
  // 📊 mockServersExpanded에서 서버 정보 가져오기 (15개 서버)
  return mockServersExpanded.map(serverInfo => {
    const serverId = serverInfo.id;
    // 6개 사이클 기반 메트릭 생성
    const cpuBaseline = generateCycleBasedMetric(serverId, 'cpu', slot, cycleInfo);
    const memoryBaseline = generateCycleBasedMetric(serverId, 'memory', slot, cycleInfo);
    const diskBaseline = generateCycleBasedMetric(serverId, 'disk', slot, cycleInfo);
    const networkBaseline = generateCycleBasedMetric(serverId, 'network', slot, cycleInfo);
    
    // 1분 보간값들 (자연스러운 변동)
    const cpu = interpolate1MinVariation(cpuBaseline, normalizedTimestamp, serverId, 'cpu');
    const memory = interpolate1MinVariation(memoryBaseline, normalizedTimestamp, serverId, 'memory');
    const disk = interpolate1MinVariation(diskBaseline, normalizedTimestamp, serverId, 'disk');
    const network = interpolate1MinVariation(networkBaseline, normalizedTimestamp, serverId, 'network');
    
    // 응답 시간 계산 (CPU 부하와 사이클 영향)
    const baseResponseTime = 50 + (cpu / 100) * 200; // 50-250ms 범위
    const cycleResponseMultiplier = 1 + (cycleInfo.intensity * 0.5); // 장애 시 응답시간 증가
    const responseTime = baseResponseTime * cycleResponseMultiplier * 
      (0.8 + fnv1aHash(normalizedTimestamp + serverId.charCodeAt(0)) * 0.4);
    
    // 📊 초기 상태 기반 상태 결정 (mockServersExpanded 반영)
    const initialStatus = serverInfo.status; // 'critical', 'warning', 'online'
    
    // 초기 상태에 따라 메트릭 값 조정하여 임계값에 맞춤
    let adjustedCpu = cpu;
    let adjustedMemory = memory;
    
    if (initialStatus === 'critical') {
      // Critical 서버: CPU 85%+ 또는 Memory 90%+ 되도록 조정
      adjustedCpu = Math.max(cpu, 87 + (cycleInfo.intensity * 8)); // 87-95% 범위
      adjustedMemory = Math.max(memory, 91 + (cycleInfo.intensity * 5)); // 91-96% 범위
    } else if (initialStatus === 'warning') {
      // Warning 서버: CPU 70-84% 또는 Memory 80-89% 범위
      adjustedCpu = Math.max(cpu, 72 + (cycleInfo.intensity * 12)); // 72-84% 범위
      adjustedMemory = Math.max(memory, 82 + (cycleInfo.intensity * 7)); // 82-89% 범위
    } else {
      // Online 서버: 낮은 값 유지 (CPU <70%, Memory <80%)
      adjustedCpu = Math.min(cpu, 65); // 최대 65%
      adjustedMemory = Math.min(memory, 75); // 최대 75%
    }
    
    // 최종 상태 결정 (기존 임계값 유지)
    const status = adjustedCpu > 85 || adjustedMemory > 90 ? 'critical' :
                  adjustedCpu > 70 || adjustedMemory > 80 ? 'warning' : 'online';
    
    // 현재 사이클 기반 시나리오 생성
    const scenarios = generateCycleScenarios(cycleInfo, serverId);
    
    return {
      id: serverId,
      name: serverInfo.hostname || serverId.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
      hostname: serverInfo.hostname || `${serverId}.local`,
      environment: 'production' as const,
      role: serverInfo.type || serverId.split('-')[0] as any,
      status,
      
      // Enhanced metrics with required naming (조정된 값 사용)
      cpu_usage: Math.round(adjustedCpu * 10) / 10,
      memory_usage: Math.round(adjustedMemory * 10) / 10,
      disk_usage: Math.round(disk * 10) / 10,
      network_in: Math.round(network * 10) / 10,
      network_out: Math.round(network * 10) / 10,
      responseTime: Math.round(responseTime),
      uptime: 99.95,
      last_updated: new Date(normalizedTimestamp).toISOString(),
      alerts: [],
      
      // Compatibility fields (조정된 값 사용)
      cpu: Math.round(adjustedCpu * 10) / 10,
      memory: Math.round(adjustedMemory * 10) / 10,
      disk: Math.round(disk * 10) / 10,
      network: Math.round(network * 10) / 10,
      
      // AI 어시스턴트를 위한 추가 메타데이터
      metadata: {
        serverType: serverId.split('-')[0],
        timeSlot: slot,
        hour,
        minute,
        cycleInfo: {
          timeSlot: cycleInfo.timeSlot,
          scenario: cycleInfo.scenario?.name || 'normal',
          phase: cycleInfo.phase,
          intensity: cycleInfo.intensity,
          description: cycleInfo.description,
          expectedResolution: cycleInfo.expectedResolution
        },
        scenarios,
        baseline: {
          cpu: cpuBaseline,
          memory: memoryBaseline,
          disk: diskBaseline,
          network: networkBaseline
        },
        adjustedMetrics: {
          cpu: adjustedCpu,
          memory: adjustedMemory,
          originalCpu: cpu,
          originalMemory: memory
        },
        initialServerInfo: {
          type: serverInfo.type,
          description: serverInfo.description,
          location: serverInfo.location,
          initialStatus: serverInfo.status
        },
        isAffectedByCurrentCycle: cycleInfo.scenario?.affectedServers.includes(serverId) || false
      }
    };
  });
}

/**
 * 📊 GET /api/metrics/current
 * 
 * 모니터링과 AI 어시스턴트가 공통으로 사용하는 통합 메트릭 API
 */
export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // 1분 단위 시간 정규화
    const currentTime = Date.now();
    const normalizedTime = normalizeTimestamp(currentTime);
    
    // 현재 시간의 사이클 정보
    const cycleTime = get24HourCycle(normalizedTime);
    const slot = getBaseline10MinSlot(cycleTime);
    const hour = Math.floor(slot * 10 / 60);
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
          validUntil: normalizedTime + 60000 // 1분 후 만료
        },
        currentCycle: {
          timeSlot: currentCycleInfo.timeSlot,
          scenario: currentCycleInfo.scenario?.name || 'normal',
          description: currentCycleInfo.description,
          phase: currentCycleInfo.phase,
          intensity: currentCycleInfo.intensity,
          progress: Math.round(currentCycleInfo.progress * 100),
          expectedResolution: currentCycleInfo.expectedResolution,
          affectedServers: currentCycleInfo.scenario?.affectedServers || []
        },
        systemInfo: {
          totalServers: servers.length,
          processingTime,
          dataConsistency: true, // 모든 시스템 동일 데이터 보장
          version: 'unified-v2.0-cycles',
          cycleSystemEnabled: true
        }
      }
    };
    
    // 성능 모니터링 헤더
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Cache-Control': 'private, max-age=30', // 30초 캐싱
      'X-Timestamp-Normalized': normalizedTime.toString(),
      'X-Processing-Time': processingTime.toString(),
      'X-Data-Version': 'unified-v1.0'
    });
    
    return NextResponse.json(response, { headers });
    
  } catch (error) {
    console.error('❌ 통합 메트릭 API 오류:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Unified metrics API failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now()
      },
      { status: 500 }
    );
  }
}

// 📋 API 정보 조회
export async function OPTIONS(_request: NextRequest) {
  return NextResponse.json({
    name: 'Unified Metrics API',
    description: '6개 시간대 장애-해소 사이클 기반 모니터링과 AI 어시스턴트 데이터 일관성 보장',
    features: [
      '1분 단위 시간 정규화',
      '24시간 순환 시스템', 
      '6개 시간대별 장애-해소 사이클',
      '10분 기준점 + FNV-1a 보간',
      '현실적 장애 발생 및 자연 해결 패턴',
      'AI 어시스턴트 시나리오 분석 지원',
      '시간대별 서버 영향도 추적'
    ],
    cycles: [
      { slot: 0, hours: '0-4시', scenario: '백업 사이클', focus: '디스크 I/O 과부하' },
      { slot: 1, hours: '4-8시', scenario: '유지보수 사이클', focus: '패치 및 재시작' },
      { slot: 2, hours: '8-12시', scenario: '트래픽 사이클', focus: '출근시간 과부하' },
      { slot: 3, hours: '12-16시', scenario: '데이터베이스 사이클', focus: '점심 주문 폭증' },
      { slot: 4, hours: '16-20시', scenario: '네트워크 사이클', focus: '파일 다운로드 피크' },
      { slot: 5, hours: '20-24시', scenario: '배치 사이클', focus: '데이터 처리 작업' }
    ],
    version: 'unified-v2.0-cycles',
    consistency: true
  });
}