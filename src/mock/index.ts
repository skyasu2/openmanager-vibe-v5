/**
 * Mock 데이터 시스템 - 통합 진입점
 */

export * from './mockServerConfig';
export * from './mockScenarios';
export * from './mockDataGenerator';
export * from './mockDataRotator';

import {
  generateMockServerData,
  selectRandomScenario,
} from './mockDataGenerator';
import type { MockDataRotator } from './mockDataRotator';
import { getRotatorInstance } from './mockDataRotator';
import type { Server } from '@/types/server';

export interface MockSystemConfig {
  autoRotate?: boolean;
  rotationInterval?: number;
  startScenario?:
    | 'random'
    | 'morning_crisis'
    | 'midnight_maintenance'
    | 'peak_load';
  speed?: number;
}

class MockSystem {
  private data: ReturnType<typeof generateMockServerData>;
  private rotator: MockDataRotator | null = null;
  private scenario: ReturnType<typeof selectRandomScenario>;

  constructor(config: MockSystemConfig = {}) {
    // 시나리오 선택
    this.scenario = selectRandomScenario();

    // 데이터 생성
    this.data = generateMockServerData();

    // 회전 시스템 초기화
    if (config.autoRotate !== false) {
      this.rotator = getRotatorInstance(this.data.timeSeries, {
        intervalMs: config.rotationInterval || 30000,
        speed: config.speed || 1,
      });
    }
  }

  /**
   * 현재 서버 목록 가져오기
   */
  getServers(): Server[] {
    if (this.rotator) {
      return this.rotator.updateServers(this.data.servers);
    }
    return this.data.servers;
  }

  /**
   * 자동 회전 시작
   */
  startAutoRotation(callback: (servers: Server[]) => void) {
    if (!this.rotator) {
      this.rotator = getRotatorInstance(this.data.timeSeries);
    }
    this.rotator.startRotation(callback, this.data.servers);
  }

  /**
   * 자동 회전 중지
   */
  stopAutoRotation() {
    this.rotator?.stopRotation();
  }

  /**
   * 시스템 상태 정보
   */
  getSystemInfo() {
    return {
      scenario: this.scenario,
      metadata: this.data.metadata,
      rotatorStatus: this.rotator?.getStatus() || null,
      serverCount: this.data.servers.length,
      criticalCount: this.data.servers.filter((s) => s.status === 'critical')
        .length,
      warningCount: this.data.servers.filter((s) => s.status === 'warning')
        .length,
    };
  }

  /**
   * 특정 시간으로 이동
   */
  jumpToTime(hour: number, minute: number = 0) {
    this.rotator?.jumpToTime(hour, minute);
  }

  /**
   * 재생 속도 변경
   */
  setSpeed(speed: number) {
    this.rotator?.setSpeed(speed);
  }

  /**
   * 시스템 리셋
   */
  reset() {
    this.stopAutoRotation();
    this.scenario = selectRandomScenario();
    this.data = generateMockServerData();
    this.rotator = null;
  }
}

// 싱글톤 인스턴스
let mockSystemInstance: MockSystem | null = null;

/**
 * Mock 시스템 인스턴스 가져오기
 */
export function getMockSystem(config?: MockSystemConfig): MockSystem {
  // 서버 사이드에서는 autoRotate 비활성화
  const safeConfig = {
    ...config,
    autoRotate: typeof window !== 'undefined' ? config?.autoRotate : false,
  };

  if (!mockSystemInstance) {
    mockSystemInstance = new MockSystem(safeConfig);
  }
  return mockSystemInstance;
}

/**
 * Mock 시스템 리셋
 */
export function resetMockSystem() {
  if (mockSystemInstance) {
    mockSystemInstance.reset();
    mockSystemInstance = null;
  }
}

/**
 * 간편한 서버 목록 가져오기 - 고정 시간별 데이터 사용
 * 24시간 × 15서버 고정 데이터를 현재 시뮬레이션 시간에 맞춰 반환
 */
export function getMockServers(): Server[] {
  try {
    // 고정 시간별 데이터 시스템에서 현재 서버 상태 가져오기 (동기 import)
    const { getCurrentServersData } = require('./fixedHourlyData');
    const hourlyServersData = getCurrentServersData();
    
    console.log('🕐 고정 시간별 데이터 로드:', {
      서버_수: hourlyServersData.length,
      현재_시뮬레이션_시간: new Date().toLocaleTimeString(),
      장애_서버: hourlyServersData.filter((s: any) => s.status === 'critical').length,
      경고_서버: hourlyServersData.filter((s: any) => s.status === 'warning').length,
      정상_서버: hourlyServersData.filter((s: any) => s.status === 'online').length,
    });
    
    // HourlyServerState를 Server 타입으로 변환
    return hourlyServersData.map((hourlyData: any, index: number): Server => ({
      id: hourlyData.id,
      name: hourlyData.name,
      hostname: hourlyData.hostname,
      status: hourlyData.status,
      cpu: hourlyData.metrics.cpu,
      memory: hourlyData.metrics.memory,
      disk: hourlyData.metrics.disk,
      network: hourlyData.metrics.network,
      uptime: hourlyData.uptime,
      location: hourlyData.location,
      environment: hourlyData.environment,
      type: hourlyData.type,
      provider: 'On-Premise',
      alerts: hourlyData.status === 'critical' ? 3 : hourlyData.status === 'warning' ? 1 : 0,
      ip: `192.168.1.${10 + index}`,
      os: 'Ubuntu 22.04 LTS',
      specs: {
        cpu_cores: 4,
        memory_gb: 16,
        disk_gb: 500,
        network_speed: '1Gbps',
      },
      lastUpdate: new Date(),
      services: [],
      networkStatus: hourlyData.status === 'online' ? 'healthy' : 
                   hourlyData.status === 'warning' ? 'warning' : 'critical',
      systemInfo: {
        os: 'Ubuntu 22.04 LTS',
        uptime: `${Math.floor(hourlyData.uptime / 3600)}h`,
        processes: Math.floor(Math.random() * 200) + 50,
        zombieProcesses: hourlyData.status === 'critical' ? Math.floor(Math.random() * 10) + 5 : Math.floor(Math.random() * 3),
        loadAverage: hourlyData.status === 'critical' ? '3.45, 3.12, 2.98' : 
                    hourlyData.status === 'warning' ? '1.85, 1.75, 1.60' : '0.45, 0.38, 0.42',
        lastUpdate: new Date().toISOString(),
      },
      networkInfo: {
        interface: 'eth0',
        receivedBytes: `${Math.floor(hourlyData.metrics.network * 0.6)} MB`,
        sentBytes: `${Math.floor(hourlyData.metrics.network * 0.4)} MB`,
        receivedErrors: hourlyData.status === 'critical' ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 5),
        sentErrors: hourlyData.status === 'critical' ? Math.floor(Math.random() * 15) + 8 : Math.floor(Math.random() * 3),
        status: hourlyData.status === 'online' ? 'healthy' : 
               hourlyData.status === 'warning' ? 'warning' : 'critical',
      },
    }));
  } catch (error) {
    console.error('❌ 고정 시간별 데이터 로드 실패:', error);
    
    // 폴백: 기존 목업 시스템 사용
    console.log('🔄 기존 목업 시스템으로 폴백');
    return getMockSystem().getServers();
  }
}

/**
 * 데모용 헬퍼 함수들
 */
export const mockHelpers = {
  // 랜덤 장애 발생
  triggerRandomIncident: () => {
    const system = getMockSystem();
    const hour = Math.floor(Math.random() * 24);
    system.jumpToTime(hour);
    return `장애 시나리오 시작: ${hour}시`;
  },

  // 정상 시간대로 이동
  jumpToNormalTime: () => {
    const system = getMockSystem();
    system.jumpToTime(10); // 오전 10시 - 대부분 정상
    return '정상 운영 시간대로 이동';
  },

  // 피크 시간대로 이동
  jumpToPeakTime: () => {
    const system = getMockSystem();
    system.jumpToTime(12); // 점심시간
    return '피크 시간대로 이동';
  },

  // 속도 조절
  speedUp: () => {
    const system = getMockSystem();
    system.setSpeed(5); // 5배속
    return '5배속 재생';
  },

  normalSpeed: () => {
    const system = getMockSystem();
    system.setSpeed(1); // 정상 속도
    return '정상 속도 재생';
  },
};
