import type { HourlyServerData, RawServerData } from '@/types/server-metrics';
import { readCachedHourlyFile } from '@/utils/cache/file-cache';
import { RealisticVariationGenerator } from '@/services/metrics/variation-generator';
import { 
  safeServerStatus,
  safeServerEnvironment, 
  safeServerRole 
} from '@/lib/type-converters';

// Enhanced Server Metrics 인터페이스 (route.ts와 동기화 필요)
interface EnhancedServerMetrics {
  id: string;
  name: string;
  hostname: string;
  status: 'online' | 'offline' | 'warning' | 'critical' | 'maintenance' | 'unknown';
  cpu: number;
  cpu_usage: number;
  memory: number;
  memory_usage: number;
  disk: number;
  disk_usage: number;
  network: number;
  network_in: number;
  network_out: number;
  uptime: number;
  responseTime: number;
  last_updated: string;
  location: string;
  alerts: never[];  // 항상 빈 배열
  ip: string;
  os: string;
  type: string;
  role: string;
  environment: string;
  provider: string;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
    network_speed: string;
  };
  lastUpdate: string;
  services: unknown[];  // 외부 데이터, 런타임에서 검증됨
  systemInfo: {
    os: string;
    uptime: string;
    processes: number;
    zombieProcesses: number;
    loadAverage: string;
    lastUpdate: string;
  };
  networkInfo: {
    interface: string;
    receivedBytes: string;
    sentBytes: string;
    receivedErrors: number;
    sentErrors: number;
    status: 'online' | 'offline' | 'warning' | 'critical' | 'maintenance' | 'unknown';
  };
}

/**
 * 🎯 24시간 고정 데이터 순차 회전 시스템 (I/O 최적화)
 * 
 * 미리 정의된 24시간 데이터를 30초마다 순차적으로 회전시키며 사용
 * 하루가 끝나면 다시 처음부터 순환 (고정 패턴의 연속 회전)
 */
export async function loadHourlyScenarioData(): Promise<EnhancedServerMetrics[]> {
  try {
    const now = new Date();
    const currentHour = now.getHours(); // 0-23
    const currentMinute = now.getMinutes(); // 0-59  
    const currentSecond = now.getSeconds(); // 0-59
    
    // 🔄 30초 단위로 시간별 데이터를 순차 회전 (120개 구간 = 60분)
    // 각 시간대 내에서 30초마다 다른 분(minute) 데이터 포인트 사용
    const segmentInHour = Math.floor((currentMinute * 60 + currentSecond) / 30); // 0-119 (60분을 30초 구간으로 나눔)
    const rotationMinute = segmentInHour % 60; // 0-59분 순환 사용
    
    // 🚀 캐시된 파일 읽기 (성능 최적화: 로그 간소화)
    const hourlyData = await readCachedHourlyFile(currentHour);
    
    return convertFixedRotationData(hourlyData, currentHour, rotationMinute, segmentInHour);
    
  } catch (error) {
    console.error('❌ [VERCEL-ONLY] 베르셀 JSON 데이터 로드 실패:', error);
    console.error('🚫 [VERCEL-ONLY] 폴백 시스템 비활성화 - 오류 발생 시 명시적 실패');
    throw new Error(`베르셀 JSON 데이터 시스템 오류: ${error}`);
  }
}

/**
 * 🎯 고정 데이터 회전 변환기 
 * 
 * 24시간 미리 정의된 데이터를 순차적으로 회전시키며 고정 패턴 유지
 * 동적 변화 없이 정확한 시간대별 고정 메트릭 제공
 */
function convertFixedRotationData(
  hourlyData: HourlyServerData, 
  currentHour: number, 
  rotationMinute: number, 
  segmentInHour: number
): EnhancedServerMetrics[] {
  const servers = hourlyData.servers || {};
  const scenario = hourlyData.scenario || `${currentHour}시 고정 패턴`;
  
  // 🎯 10개 서버 보장: JSON에 8개만 있으면 2개 자동 생성 (성능 최적화)
  if (Object.keys(servers).length < 10) {
    const missingCount = 10 - Object.keys(servers).length;
    
    // 부족한 서버 자동 생성
    for (let i = 0; i < missingCount; i++) {
      const serverIndex = Object.keys(servers).length + i + 1;
      const serverTypes = ['security', 'backup', 'proxy', 'gateway'];
      const serverType = serverTypes[i % serverTypes.length] ?? 'gateway';
      const serverId = `${serverType}-server-${serverIndex}`;
      
      servers[serverId] = {
        id: serverId,
        name: `${serverType.charAt(0).toUpperCase() + serverType.slice(1)} Server #${serverIndex}`,
        hostname: `${serverType}-${serverIndex.toString().padStart(2, '0')}.prod.example.com`,
        status: 'online' as const,
        type: serverType,
        service: serverType === 'security' ? 'Security Scanner' : serverType === 'backup' ? 'Backup Service' : 'Service Gateway',
        location: 'us-east-1a',
        environment: 'production',
        provider: 'Auto-Generated',
        uptime: 2592000 + Math.floor(Math.random() * 86400),
        cpu: Math.floor(15 + RealisticVariationGenerator.generateNaturalVariance(12, 'default-cpu')),
        memory: Math.floor(20 + RealisticVariationGenerator.generateNaturalVariance(17, 'default-memory')),
        disk: Math.floor(25 + RealisticVariationGenerator.generateNaturalVariance(20, 'default-disk')),
        network: Math.floor(5 + RealisticVariationGenerator.generateNaturalVariance(12, 'default-network')),
        specs: {
          cpu_cores: 4,
          memory_gb: 8,
          disk_gb: 200
        }
      };
    }
  }

  return Object.values(servers).map((serverData: RawServerData, _index) => {
    
    // 🔒 고정 데이터 그대로 사용 (변동 없음)
    // rotationMinute를 사용하여 시간 내 분별 고정 패턴 적용
    const minuteFactor = rotationMinute / 59; // 0-1 사이 고정 팩터
    const fixedOffset = Math.sin(minuteFactor * 2 * Math.PI) * 2; // 고정된 2% 오프셋 (시간 내 패턴)
    
    // 서버별 고정 특성 (항상 동일한 패턴)
    const serverOffset = (index * 3.7) % 10; // 서버별 고정 오프셋 (0-10)

    // 🎯 결정론적 변동성 적용 (성능 최적화: 로그 제거)
    const deterministicNoise = RealisticVariationGenerator.generateNaturalVariance(0, `server-${index}-noise`) * 0.05; // ±5% 노이즈
    const fixedVariation = 1 + (fixedOffset + serverOffset + deterministicNoise) / 100; // 결정론적 노이즈 추가
    
    const enhanced: EnhancedServerMetrics = {
      id: serverData.id || `server-${index}`,
      name: serverData.name || `Unknown Server ${index + 1}`,
      hostname: serverData.hostname || serverData.name || `server-${index}`,
      status: safeServerStatus(serverData.status),
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
      responseTime: Math.round((serverData.responseTime || 200) * fixedVariation),
      last_updated: new Date().toISOString(),
      location: serverData.location || '서울',
      alerts: [],
      ip: serverData.ip || `192.168.1.${100 + index}`,
      os: serverData.os || 'Ubuntu 22.04 LTS',
      type: serverData.type || 'web',
      role: safeServerRole(serverData.role || serverData.type),
      environment: safeServerEnvironment(serverData.environment),
      provider: `DataCenter-${currentHour.toString().padStart(2, '0')}${rotationMinute.toString().padStart(2, '0')}`,
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
        processes: (serverData.processes || 120) + Math.floor(serverOffset),
        zombieProcesses: serverData.status === 'critical' ? 3 : serverData.status === 'warning' ? 1 : 0,
        loadAverage: `${((serverData.cpu || 0) * fixedVariation / 20).toFixed(2)}, ${(((serverData.cpu || 0) * fixedVariation - 5) / 20).toFixed(2)}, ${(((serverData.cpu || 0) * fixedVariation - 10) / 20).toFixed(2)}`,
        lastUpdate: new Date().toISOString()
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${((serverData.network || 20) * 0.6 * fixedVariation).toFixed(1)} MB`,
        sentBytes: `${((serverData.network || 20) * 0.4 * fixedVariation).toFixed(1)} MB`,
        receivedErrors: serverData.status === 'critical' ? Math.floor(serverOffset % 5) + 1 : 0,
        sentErrors: serverData.status === 'critical' ? Math.floor(serverOffset % 3) + 1 : 0,
        status: safeServerStatus(serverData.status)
      }
    };
    
    return enhanced;
  });
}
