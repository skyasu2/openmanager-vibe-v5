import { NextRequest, NextResponse } from 'next/server';
import type { EnhancedServerMetrics } from '@/types/server';
// TODO: 누락된 모듈들 - 추후 구현 필요
// import { createServerSideAction } from '@/core/security/server-side-action';
// import { createSystemMetricsAnalytics } from '@/lib/analytics/system-metrics-analytics';

interface ServerMetrics {
  name: string;
  cpu: number;
  memory: number;
  disk: number;
  network?: number; // 선택적 속성으로 명시
  uptime: number;
  status: 'online' | 'offline' | 'warning' | 'critical';
}

// 타입 가드 함수 추가 (Codex 제안)
const ensureNumber = (value: number | undefined, fallback: number = 0): number => {
  return typeof value === 'number' && !isNaN(value) ? value : fallback;
};

/**
 * 🎯 Box-Muller 변환을 사용한 정규분포 난수 생성기
 * Math.random() 대체용 - 더 현실적인 서버 메트릭 시뮬레이션
 * 
 * @param mean 평균값
 * @param stdDev 표준편차  
 * @param min 최솟값 (선택적)
 * @param max 최댓값 (선택적)
 * @returns 정규분포를 따르는 난수
 */
function generateNormalRandom(mean: number, stdDev: number, min?: number, max?: number): number {
  // Box-Muller 변환 구현
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); // 0 방지
  while(v === 0) v = Math.random();
  
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  const result = z * stdDev + mean;
  
  // 범위 제한 (선택적)
  if (min !== undefined && max !== undefined) {
    return Math.max(min, Math.min(max, result));
  }
  
  return result;
}

/**
 * 📋 서버 타입별 특성 및 장애 시나리오 정의
 * 각 서버 종류의 고유 특성과 장애 패턴 반영
 */
interface ServerTypeProfile {
  type: string;
  normalRanges: {
    cpu: [number, number];    // [min, max] 정상 범위
    memory: [number, number]; 
    disk: [number, number];
    network: [number, number];
  };
  scenarios: {
    [key: string]: {
      name: string;
      probability: number; // 0-1 확률
      effects: {
        cpu?: number;     // 기준값 대비 변화량
        memory?: number;
        disk?: number; 
        network?: number;
      };
      status: 'online' | 'warning' | 'critical';
    };
  };
}

/**
 * 🏗️ 10개 서버별 타입 프로파일 및 시나리오 매핑
 */
const serverTypeProfiles: Record<string, ServerTypeProfile> = {
  // 웹서버 (2개): 트래픽 부하 중심
  'web': {
    type: 'web',
    normalRanges: {
      cpu: [20, 60],
      memory: [30, 70], 
      disk: [40, 80],
      network: [10, 30]
    },
    scenarios: {
      'traffic_spike': {
        name: '트래픽 폭증',
        probability: 0.15,
        effects: { cpu: +25, memory: +15, network: +40 },
        status: 'warning'
      },
      'ddos_attack': {
        name: 'DDoS 공격',
        probability: 0.03,
        effects: { cpu: +45, memory: +35, network: +80 },
        status: 'critical'
      }
    }
  },
  
  // API서버 (2개): 동시 요청 및 메모리 누수
  'api': {
    type: 'api',
    normalRanges: {
      cpu: [25, 65],
      memory: [40, 80],
      disk: [30, 60], 
      network: [15, 35]
    },
    scenarios: {
      'memory_leak': {
        name: '메모리 누수',
        probability: 0.12,
        effects: { cpu: +10, memory: +30 },
        status: 'warning'
      },
      'concurrent_overload': {
        name: '동시요청 폭증',
        probability: 0.08,
        effects: { cpu: +35, memory: +25, network: +30 },
        status: 'critical'
      }
    }
  },
  
  // DB서버 (2개): 쿼리 부하 및 디스크 I/O
  'database': {
    type: 'database', 
    normalRanges: {
      cpu: [15, 40],
      memory: [50, 85],
      disk: [60, 90],
      network: [5, 20]
    },
    scenarios: {
      'slow_query': {
        name: '느린 쿼리',
        probability: 0.10,
        effects: { cpu: +20, memory: +15, disk: +10 },
        status: 'warning'
      },
      'disk_full': {
        name: '디스크 풀',
        probability: 0.05,
        effects: { cpu: +30, memory: +20, disk: +25 },
        status: 'critical'
      }
    }
  },
  
  // 캐시서버 (1개): 메모리 중심
  'cache': {
    type: 'cache',
    normalRanges: {
      cpu: [10, 50],
      memory: [40, 90], 
      disk: [20, 50],
      network: [20, 60]
    },
    scenarios: {
      'cache_miss_storm': {
        name: '캐시 미스 폭증',
        probability: 0.08,
        effects: { cpu: +30, memory: +20, network: +50 },
        status: 'warning'
      }
    }
  },
  
  // 모니터링서버 (1개): 로그 수집
  'monitoring': {
    type: 'monitoring',
    normalRanges: {
      cpu: [15, 45],
      memory: [30, 70],
      disk: [50, 95], 
      network: [10, 25]
    },
    scenarios: {
      'log_burst': {
        name: '로그 폭증',
        probability: 0.12,
        effects: { cpu: +20, disk: +15, network: +25 },
        status: 'warning'
      }
    }
  },
  
  // 보안서버 (1개): 스캔 작업
  'security': {
    type: 'security',
    normalRanges: {
      cpu: [10, 35],
      memory: [40, 75],
      disk: [60, 85],
      network: [5, 15]
    },
    scenarios: {
      'security_scan': {
        name: '보안 스캔',
        probability: 0.15,
        effects: { cpu: +25, memory: +10, disk: +10 },
        status: 'warning'
      }
    }
  },
  
  // 백업서버 (1개): 백업 작업
  'backup': {
    type: 'backup',
    normalRanges: {
      cpu: [20, 60],
      memory: [15, 40],
      disk: [30, 80],
      network: [10, 40]
    },
    scenarios: {
      'backup_running': {
        name: '백업 실행 중',
        probability: 0.20,
        effects: { cpu: +25, disk: +20, network: +35 },
        status: 'warning'
      }
    }
  }
};

/**
 * 🎯 서버 타입별 현실적인 메트릭 생성 
 * 장애 시나리오와 상관관계 모두 적용
 */
function generateRealisticMetrics(serverType: string, baseCpu: number, baseMemory: number, baseDisk: number) {
  const profile = serverTypeProfiles[serverType] || serverTypeProfiles['web'];
  
  // 1단계: 장애 시나리오 확인
  let scenarioEffect = { cpu: 0, memory: 0, disk: 0, network: 0 };
  let currentStatus: 'online' | 'warning' | 'critical' = 'online';
  
  for (const [key, scenario] of Object.entries(profile.scenarios)) {
    if (Math.random() < scenario.probability) {
      scenarioEffect.cpu += scenario.effects.cpu || 0;
      scenarioEffect.memory += scenario.effects.memory || 0; 
      scenarioEffect.disk += scenario.effects.disk || 0;
      scenarioEffect.network += scenario.effects.network || 0;
      currentStatus = scenario.status;
      console.log(`🚨 [${serverType}] ${scenario.name} 시나리오 활성화`);
      break; // 하나의 시나리오만 활성화
    }
  }
  
  // 2단계: CPU-Memory 상관관계 적용
  const correlation = 0.6;
  const cpuNoise = generateNormalRandom(0, 5, -15, 15);
  const newCpu = Math.max(1, Math.min(95, baseCpu + cpuNoise + scenarioEffect.cpu));
  
  const correlatedMemoryChange = cpuNoise * correlation;  
  const independentMemoryNoise = generateNormalRandom(0, 3, -10, 10) * Math.sqrt(1 - correlation * correlation);
  const memoryChange = correlatedMemoryChange + independentMemoryNoise + scenarioEffect.memory;
  const newMemory = Math.max(5, Math.min(95, baseMemory + memoryChange));
  
  // 3단계: 디스크 및 네트워크 독립적 변화
  const diskNoise = generateNormalRandom(0, 2, -5, 5);
  const newDisk = Math.max(5, Math.min(98, baseDisk + diskNoise + scenarioEffect.disk));
  
  const networkBase = generateNormalRandom(15, 8, 5, 50); // 네트워크는 베이스가 변동적
  const newNetwork = Math.max(1, networkBase + scenarioEffect.network);
  
  return {
    cpu: newCpu,
    memory: newMemory, 
    disk: newDisk,
    network: newNetwork,
    status: currentStatus
  };
}

// 정렬 키 타입 정의 강화
type SortableKey = keyof Pick<ServerMetrics, 'cpu' | 'memory' | 'disk' | 'network' | 'uptime' | 'name'>;

/**
 * 🎯 24시간 고정 데이터 순차 회전 시스템
 * 미리 정의된 24시간 데이터를 30초마다 순차적으로 회전시키며 사용
 * 하루가 끝나면 다시 처음부터 순환 (고정 패턴의 연속 회전)
 */
async function loadHourlyScenarioData(): Promise<EnhancedServerMetrics[]> {
  try {
    const now = new Date();
    const currentHour = now.getHours(); // 0-23
    const currentMinute = now.getMinutes(); // 0-59  
    const currentSecond = now.getSeconds(); // 0-59
    
    // 🔄 30초 단위로 시간별 데이터를 순차 회전 (120개 구간 = 60분)
    // 각 시간대 내에서 30초마다 다른 분(minute) 데이터 포인트 사용
    const segmentInHour = Math.floor((currentMinute * 60 + currentSecond) / 30); // 0-119 (60분을 30초 구간으로 나눔)
    const rotationMinute = segmentInHour % 60; // 0-59분 순환 사용
    
    console.log(`🕒 [FIXED-ROTATION] ${currentHour}:${currentMinute.toString().padStart(2, '0')}:${currentSecond.toString().padStart(2, '0')}`);
    console.log(`🔄 [FIXED-ROTATION] ${currentHour}시대 ${segmentInHour}번째 구간 → ${rotationMinute}분 데이터 사용`);
    
    // 현재 시간대 데이터 로드
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(process.cwd(), 'public', 'server-scenarios', 'hourly-metrics', `${currentHour.toString().padStart(2, '0')}.json`);
    
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ [FIXED-ROTATION] 시간별 데이터 파일 없음: ${filePath}`);
      console.log(`🔄 [FIXED-ROTATION] 기본값으로 17시 데이터 사용`);
      const fallbackPath = path.join(process.cwd(), 'public', 'server-scenarios', 'hourly-metrics', '17.json');
      const fallbackData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
      return convertFixedRotationData(fallbackData, currentHour, rotationMinute, segmentInHour);
    }
    
    const rawData = fs.readFileSync(filePath, 'utf8');
    const hourlyData = JSON.parse(rawData);
    
    console.log(`✅ [FIXED-ROTATION] ${currentHour}시 데이터 로드 성공 (${segmentInHour}→${rotationMinute}분 데이터)`);
    console.log(`📊 [FIXED-ROTATION] 시나리오: ${hourlyData.scenario?.name || hourlyData.scenario || '고정 패턴'}`);
    
    return convertFixedRotationData(hourlyData, currentHour, rotationMinute, segmentInHour);
    
  } catch (error) {
    console.error('❌ [FIXED-ROTATION] 24시간 고정 데이터 로드 실패:', error);
    console.log('🔄 [FIXED-ROTATION] 기본 정적 데이터로 폴백');
    return generateStaticServers();
  }
}

/**
 * 🎯 고정 데이터 회전 변환기 
 * 24시간 미리 정의된 데이터를 순차적으로 회전시키며 고정 패턴 유지
 * 동적 변화 없이 정확한 시간대별 고정 메트릭 제공
 */
function convertFixedRotationData(hourlyData: any, currentHour: number, rotationMinute: number, segmentInHour: number): EnhancedServerMetrics[] {
  const servers = hourlyData.servers || {};
  const scenario = hourlyData.scenario || `${currentHour}시 고정 패턴`;
  
  console.log(`🔧 [FIXED-CONVERT] ${Object.keys(servers).length}개 서버 데이터 변환 (${currentHour}:${rotationMinute.toString().padStart(2, '0')} 고정 데이터)`);
  console.log(`📋 [FIXED-CONVERT] ${segmentInHour}번째 구간 → 고정 패턴 적용`);
  
  return Object.values(servers).map((serverData: any, index) => {
    // 🔒 고정 데이터 그대로 사용 (변동 없음)
    // rotationMinute를 사용하여 시간 내 분별 고정 패턴 적용
    const minuteFactor = rotationMinute / 59; // 0-1 사이 고정 팩터
    const fixedOffset = Math.sin(minuteFactor * 2 * Math.PI) * 2; // 고정된 2% 오프셋 (시간 내 패턴)
    
    // 서버별 고정 특성 (항상 동일한 패턴)
    const serverOffset = (index * 3.7) % 10; // 서버별 고정 오프셋 (0-10)
    
    console.log(`🔒 [FIXED-SERVER-${index}] ${serverData.name || `서버${index}`} 고정 오프셋: ${fixedOffset.toFixed(1)}% + 서버특성: ${serverOffset.toFixed(1)}%`);
    
    // 🎯 고정 데이터에 패턴만 적용 (랜덤 요소 제거)
    const fixedVariation = 1 + (fixedOffset + serverOffset) / 100; // 고정된 변화율
    
    const enhanced: EnhancedServerMetrics = {
      id: serverData.id || `server-${index}`,
      name: serverData.name || `Unknown Server ${index + 1}`,
      hostname: serverData.hostname || serverData.name || `server-${index}`,
      status: serverData.status || 'online',
      cpu: Math.round((serverData.cpu || 0) * fixedVariation),
      cpu_usage: Math.round((serverData.cpu || 0) * fixedVariation),
      memory: Math.round((serverData.memory || 0) * fixedVariation),
      memory_usage: Math.round((serverData.memory || 0) * fixedVariation),
      disk: Math.round((serverData.disk || 0) * fixedVariation),
      disk_usage: Math.round((serverData.disk || 0) * fixedVariation),
      network: Math.round((serverData.network || 20) * fixedVariation),
      network_in: Math.round((serverData.network || 20) * 0.6 * fixedVariation),
      network_out: Math.round((serverData.network || 20) * 0.4 * fixedVariation),
      uptime: serverData.uptime || 86400,
      location: serverData.location || 'Seoul-DC-01',
      alerts: serverData.status === 'critical' ? 3 : serverData.status === 'warning' ? 1 : 0,
      ip: serverData.ip || `192.168.1.${100 + index}`,
      os: serverData.os || 'Ubuntu 22.04 LTS',
      type: serverData.type || 'web',
      role: serverData.role || 'worker',
      environment: serverData.environment || 'production',
      provider: `Fixed-Pattern-${currentHour}h${rotationMinute.toString().padStart(2, '0')}m`, // 고정 패턴 표시
      specs: {
        cpu_cores: serverData.specs?.cpu_cores || 4,
        memory_gb: serverData.specs?.memory_gb || 8,
        disk_gb: serverData.specs?.disk_gb || 200,
        network_speed: '1Gbps'
      },
      lastUpdate: new Date().toISOString(),
      services: serverData.services || [],
      systemInfo: {
        os: serverData.os || 'Ubuntu 22.04 LTS',
        uptime: Math.floor((serverData.uptime || 86400) / 3600) + 'h',
        processes: (serverData.processes || 120) + Math.floor(serverOffset), // 고정된 서버별 프로세스 수
        zombieProcesses: serverData.status === 'critical' ? 3 : serverData.status === 'warning' ? 1 : 0,
        loadAverage: `${((serverData.cpu || 0) * fixedVariation / 20).toFixed(2)}, ${(((serverData.cpu || 0) * fixedVariation - 5) / 20).toFixed(2)}, ${(((serverData.cpu || 0) * fixedVariation - 10) / 20).toFixed(2)}`,
        lastUpdate: new Date().toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${((serverData.network || 20) * 0.6 * fixedVariation).toFixed(1)} MB`,
        sentBytes: `${((serverData.network || 20) * 0.4 * fixedVariation).toFixed(1)} MB`,
        receivedErrors: serverData.status === 'critical' ? Math.floor(serverOffset % 5) + 1 : 0, // 고정된 오류 수
        sentErrors: serverData.status === 'critical' ? Math.floor(serverOffset % 3) + 1 : 0, // 고정된 오류 수
        status: serverData.status === 'online' ? 'healthy' : serverData.status
      }
    };
    
    return enhanced;
  });
}

/**
 * 기존 정적 서버 데이터 (폴백용) - 랜덤 생성 방식 유지
 * 24시간 데이터 로드 실패 시에만 사용
 */
function generateStaticServers(): EnhancedServerMetrics[] {
  const timestamp = new Date().toISOString();
  
  // GCP VM 정적 데이터를 EnhancedServerMetrics 형식으로 변환
  const staticVMData = [
    {
      "server_id": "server-1756455178476-0",
      "hostname": "web-server-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 34.38,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 2438209376,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 115848619254,
        "uptime_seconds": 1756429123
      },
      "metadata": {
        "ip": "192.168.1.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "web",
        "role": "worker",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-1",
      "hostname": "web-server-02",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 29.85,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 3115824828,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 85787383921,
        "uptime_seconds": 1754389804
      },
      "metadata": {
        "ip": "192.168.1.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "web",
        "role": "worker",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-2",
      "hostname": "api-server-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 47.52,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 7126592271,
        "disk_total_bytes": 322122547200,
        "disk_used_bytes": 95283441851,
        "uptime_seconds": 1756404615
      },
      "metadata": {
        "ip": "192.168.2.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "api",
        "role": "primary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 6,
        "memory_gb": 16,
        "disk_gb": 300
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178476-3",
      "hostname": "api-server-02",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 43.99,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 6626593510,
        "disk_total_bytes": 322122547200,
        "disk_used_bytes": 100544609153,
        "uptime_seconds": 1756435387
      },
      "metadata": {
        "ip": "192.168.2.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "api",
        "role": "secondary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 6,
        "memory_gb": 16,
        "disk_gb": 300
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-4",
      "hostname": "db-master-primary",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 12.51,
        "memory_total_bytes": 34359738368,
        "memory_used_bytes": 19946046061,
        "disk_total_bytes": 1073741824000,
        "disk_used_bytes": 435889319904,
        "uptime_seconds": 1755470558
      },
      "metadata": {
        "ip": "192.168.3.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "database",
        "role": "master",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 8,
        "memory_gb": 32,
        "disk_gb": 1000
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-5",
      "hostname": "db-replica-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 17.46,
        "memory_total_bytes": 34359738368,
        "memory_used_bytes": 15177950420,
        "disk_total_bytes": 1073741824000,
        "disk_used_bytes": 571328142108,
        "uptime_seconds": 1754173478
      },
      "metadata": {
        "ip": "192.168.3.101",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "database",
        "role": "replica",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 8,
        "memory_gb": 32,
        "disk_gb": 1000
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178477-6",
      "hostname": "redis-cache-01",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 42.0,
        "memory_total_bytes": 17179869184,
        "memory_used_bytes": 9964324126,
        "disk_total_bytes": 107374182400,
        "disk_used_bytes": 48318382080,
        "uptime_seconds": 1754764890
      },
      "metadata": {
        "ip": "192.168.4.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "cache",
        "role": "primary",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 16,
        "disk_gb": 100
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-7",
      "hostname": "monitoring-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 26.24,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 4120458156,
        "disk_total_bytes": 536870912000,
        "disk_used_bytes": 422756725966,
        "uptime_seconds": 1755894695
      },
      "metadata": {
        "ip": "192.168.5.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "monitoring",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 2,
        "memory_gb": 8,
        "disk_gb": 500
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-8",
      "hostname": "security-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 13.91,
        "memory_total_bytes": 8589934592,
        "memory_used_bytes": 5578614106,
        "disk_total_bytes": 214748364800,
        "disk_used_bytes": 156557749037,
        "uptime_seconds": 1754027553
      },
      "metadata": {
        "ip": "192.168.6.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "security",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 4,
        "memory_gb": 8,
        "disk_gb": 200
      },
      "status": "online"
    },
    {
      "server_id": "server-1756455178478-9",
      "hostname": "backup-server",
      "timestamp": "2025-08-29T17:12:58.000Z",
      "system": {
        "cpu_usage_percent": 38.28,
        "memory_total_bytes": 4294967296,
        "memory_used_bytes": 1100128893,
        "disk_total_bytes": 2147483648000,
        "disk_used_bytes": 753447563255,
        "uptime_seconds": 1755171946
      },
      "metadata": {
        "ip": "192.168.7.100",
        "os": "Ubuntu 22.04 LTS",
        "server_type": "backup",
        "role": "standalone",
        "provider": "GCP-VM"
      },
      "specs": {
        "cpu_cores": 2,
        "memory_gb": 4,
        "disk_gb": 2000
      },
      "status": "online"
    }
  ];

  // VM 데이터를 EnhancedServerMetrics 형식으로 변환 - 장애 시나리오 시스템 적용
  return staticVMData.map((vmServer, index) => {
    const memoryUsagePercent = (vmServer.system.memory_used_bytes / vmServer.system.memory_total_bytes) * 100;
    const diskUsagePercent = (vmServer.system.disk_used_bytes / vmServer.system.disk_total_bytes) * 100;
    
    // 🎯 서버 타입별 현실적인 메트릭 생성 (장애 시나리오 포함)
    const realisticMetrics = generateRealisticMetrics(
      vmServer.metadata.server_type, 
      vmServer.system.cpu_usage_percent,
      memoryUsagePercent,
      diskUsagePercent
    );
    
    // 🌐 네트워크 메트릭 분리 (IN/OUT)
    const networkIn = realisticMetrics.network * 0.6;  // 60% IN
    const networkOut = realisticMetrics.network * 0.4; // 40% OUT
    
    return {
      id: vmServer.server_id,
      name: vmServer.hostname,
      hostname: vmServer.hostname,
      status: realisticMetrics.status,  // 🚨 시나리오 기반 동적 상태
      cpu: realisticMetrics.cpu,
      cpu_usage: realisticMetrics.cpu,
      memory: realisticMetrics.memory,
      memory_usage: realisticMetrics.memory,
      disk: realisticMetrics.disk,
      disk_usage: realisticMetrics.disk,
      network: realisticMetrics.network,
      network_in: networkIn,
      network_out: networkOut,
      uptime: vmServer.system.uptime_seconds,
      location: 'Seoul-DC-01',
      alerts: realisticMetrics.status === 'critical' ? 3 : realisticMetrics.status === 'warning' ? 1 : 0, // 🚨 동적 알람 수
      ip: vmServer.metadata.ip,
      os: vmServer.metadata.os,
      type: vmServer.metadata.server_type,
      role: vmServer.metadata.role,
      environment: 'production',
      provider: 'GCP-VM-Scenario-Enhanced', // 🎯 시나리오 기반 표시
      specs: {
        cpu_cores: vmServer.specs.cpu_cores,
        memory_gb: vmServer.specs.memory_gb,
        disk_gb: vmServer.specs.disk_gb,
        network_speed: '1Gbps'
      },
      lastUpdate: new Date().toISOString(), // 🔄 실시간 타임스탬프
      services: [],
      systemInfo: {
        os: vmServer.metadata.os,
        uptime: Math.floor(vmServer.system.uptime_seconds / 3600) + 'h',
        processes: 120 + index * 15 + (realisticMetrics.status === 'critical' ? 50 : 0), // 🚨 장애 시 프로세스 증가
        zombieProcesses: realisticMetrics.status === 'critical' ? 5 : realisticMetrics.status === 'warning' ? 2 : 0,
        loadAverage: `${(realisticMetrics.cpu / 20).toFixed(2)}, ${((realisticMetrics.cpu - 5) / 20).toFixed(2)}, ${((realisticMetrics.cpu - 10) / 20).toFixed(2)}`, // 🎯 실제 CPU 기반
        lastUpdate: new Date().toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${networkIn.toFixed(1)} MB`,
        sentBytes: `${networkOut.toFixed(1)} MB`,
        receivedErrors: realisticMetrics.status === 'critical' ? Math.floor(Math.random() * 10) + 5 : realisticMetrics.status === 'warning' ? Math.floor(Math.random() * 3) + 1 : 0,
        sentErrors: realisticMetrics.status === 'critical' ? Math.floor(Math.random() * 8) + 3 : realisticMetrics.status === 'warning' ? Math.floor(Math.random() * 2) : 0,
        status: realisticMetrics.status === 'online' ? 'healthy' : realisticMetrics.status // 🚨 동적 네트워크 상태
      }
    };
  });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // 파라미터 검증 강화 (Codex 제안)
    const sortBy = (searchParams.get('sortBy') || 'name') as SortableKey;
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? 'desc' : 'asc';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)));
    const search = searchParams.get('search') || '';
    
    // 🚨 강제 배포 확인 로그 - 베르셀 캐시 무효화 테스트
    console.log('🔥 [FORCE-DEPLOY-v2.1] 10개 서버 API 라우트 확정 배포 - 2025.08.29');
    console.log('🌐 [VERCEL-CACHE-BUST] 서버 데이터 요청 - GCP VM 통합 모드');
    console.log('📊 요청 파라미터:', { sortBy, sortOrder, page, limit, search });
    
    // 🕒 24시간 시나리오 데이터 사용 (현실적 패턴 제공)
    console.log('🎯 [API-ROUTE] 24시간 시나리오 데이터 시스템 - 시간별 회전 로딩');
    console.log('📍 [API-ROUTE] 요청 URL:', request.url);
    console.log('🔧 [API-ROUTE] 요청 파라미터:', { sortBy, sortOrder, page, limit, search });
    
    const enhancedServers = await loadHourlyScenarioData();
    const dataSource = 'hourly-scenario';
    const fallbackUsed = false; // 24시간 데이터가 메인 데이터 소스
    
    console.log(`✅ [API-ROUTE] Mock 데이터 생성 성공: ${enhancedServers.length}개 서버`);
    
    // 서버별 상태 요약
    const statusSummary = enhancedServers.reduce((acc, server) => {
      acc[server.status] = (acc[server.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('📈 [API-ROUTE] 서버 상태 요약:', statusSummary);

    // 검색 필터 적용 (EnhancedServerMetrics 기준)
    let filteredServers = enhancedServers;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredServers = enhancedServers.filter(server =>
        server.name.toLowerCase().includes(searchLower) ||
        server.hostname.toLowerCase().includes(searchLower) ||
        server.status.toLowerCase().includes(searchLower) ||
        server.type.toLowerCase().includes(searchLower)
      );
    }

    // 정렬 적용 (EnhancedServerMetrics 기준)
    filteredServers.sort((a, b) => {
      const dir = sortOrder === 'asc' ? 1 : -1;
      switch (sortBy) {
        case 'cpu':
          return (a.cpu_usage - b.cpu_usage) * dir;
        case 'memory':
          return (a.memory_usage - b.memory_usage) * dir;
        case 'disk':
          return (a.disk_usage - b.disk_usage) * dir;
        case 'network':
          return ((a.network || 0) - (b.network || 0)) * dir;
        case 'uptime':
          return (a.uptime - b.uptime) * dir;
        default:
          return (a.name || '').localeCompare(b.name || '') * dir;
      }
    });

    // 페이지네이션 적용
    const total = filteredServers.length;
    const startIndex = (page - 1) * limit;
    const paginatedServers = filteredServers.slice(startIndex, startIndex + limit);

    console.log(`📋 [API-ROUTE] 최종 응답: ${paginatedServers.length}개 서버 (전체: ${total}개)`);
    console.log('📡 [API-ROUTE] 데이터 소스 최종:', { dataSource, fallbackUsed });
    console.log('🔍 [API-ROUTE] 최종 서버 목록:', paginatedServers.map(s => 
      `${s.name || 'unknown'}(${s.type || 'unknown'}/${s.status || 'unknown'}/${(s.cpu_usage || s.cpu || 0).toFixed(1)}%)`
    ).join(', '));
    
    // 검색/필터링 통계
    if (search) {
      console.log('🔍 [API-ROUTE] 검색 통계:', { 
        searchTerm: search, 
        originalCount: enhancedServers.length, 
        filteredCount: filteredServers.length 
      });
    }
    
    // 페이지네이션 통계
    console.log('📃 [API-ROUTE] 페이지네이션:', { 
      page, 
      limit, 
      startIndex: (page - 1) * limit,
      totalPages: Math.ceil(total / limit)
    });



    return NextResponse.json({
      success: true,
      data: paginatedServers, // 페이지네이션된 서버 데이터
      source: dataSource, // 데이터 소스 정보 추가
      fallback: fallbackUsed, // 폴백 사용 여부

      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: startIndex + limit < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString(),
      metadata: {
        serverCount: paginatedServers.length,
        totalServers: total,
        dataSource,
        fallbackUsed,
        gcpVmIntegration: true, // GCP VM 통합 표시
        // 🚨 강제 배포 확인 정보
        forceDeployVersion: 'v2.1-2025.08.29',
        cacheBreaker: `cache-break-${Date.now()}`,
        // 🔍 디버깅 정보 (에러 발생시만 포함)
        ...(global.gcpErrorInfo && fallbackUsed ? { gcpError: global.gcpErrorInfo } : {})
      }
    }, {
      // 🔥 강력한 캐시 무효화 헤더
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Vercel-Cache': 'MISS',
        'X-Force-Deploy-Version': 'v2.1-2025.08.29'
      }
    });
      
  } catch (error) {
    console.error('서버 목록 조회 실패:', error);
    
    // 에러 경계 개선 (Codex 제안)
    if (error instanceof Error) {
      return NextResponse.json({
        success: false,
        error: 'SERVERS_LIST_FAILED',
        message: process.env.NODE_ENV === 'development' ? error.message : '서버 목록을 불러올 수 없습니다.'
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'INTERNAL_SERVER_ERROR',
      message: '서버 내부 오류가 발생했습니다.'
    }, { status: 500 });
  }
}