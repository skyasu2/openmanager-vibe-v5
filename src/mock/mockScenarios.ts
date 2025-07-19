/**
 * 서버 장애 시나리오 정의
 * 각 시나리오는 24시간 패턴을 정의
 */

export interface ScenarioPoint {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime?: number; // ms
  errorRate?: number; // percentage
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  severity: 'normal' | 'warning' | 'critical';
  affectedMetrics: ('cpu' | 'memory' | 'disk' | 'network')[];
  pattern: 'linear' | 'spike' | 'gradual' | 'random' | 'periodic';
}

// 시나리오별 패턴 생성 함수
export const scenarioPatterns = {
  // 정상 운영 패턴
  normal: (hour: number): ScenarioPoint => {
    // 일반적인 업무 시간 패턴
    const isBusinessHours = hour >= 9 && hour <= 18;
    const isLunchTime = hour >= 12 && hour <= 13;
    
    const baseCpu = isBusinessHours ? 35 : 20;
    const cpuVariation = isLunchTime ? -10 : (isBusinessHours ? 15 : 5);
    
    return {
      cpu: baseCpu + Math.random() * cpuVariation,
      memory: 40 + Math.random() * 15,
      disk: 60 + Math.random() * 5,
      network: isBusinessHours ? 30 + Math.random() * 20 : 10 + Math.random() * 10,
      responseTime: 50 + Math.random() * 30,
      errorRate: Math.random() * 0.1
    };
  },

  // CPU 스파이크 패턴 (WEB-PRD-02)
  cpu_spike: (hour: number): ScenarioPoint => {
    const isPeakHour = (hour >= 11 && hour <= 13) || (hour >= 17 && hour <= 19);
    const isBatchTime = hour >= 2 && hour <= 4;
    
    let cpu = 30;
    if (isPeakHour) {
      cpu = 75 + Math.random() * 15; // 75-90%
    } else if (isBatchTime) {
      cpu = 60 + Math.random() * 10; // 60-70%
    } else {
      cpu = 30 + Math.random() * 20; // 30-50%
    }
    
    return {
      cpu,
      memory: 45 + Math.random() * 10,
      disk: 65 + Math.random() * 5,
      network: isPeakHour ? 60 + Math.random() * 20 : 20 + Math.random() * 15,
      responseTime: isPeakHour ? 200 + Math.random() * 100 : 50 + Math.random() * 30,
      errorRate: isPeakHour ? Math.random() * 2 : Math.random() * 0.5
    };
  },

  // 메모리 누수 패턴 (APP-PRD-01)
  memory_leak: (hour: number): ScenarioPoint => {
    // 6시간마다 재시작, 점진적으로 증가
    const cycleHour = hour % 6;
    const baseMemory = 40;
    const leakRate = 10; // 시간당 10% 증가
    
    const memory = Math.min(95, baseMemory + (cycleHour * leakRate) + Math.random() * 5);
    const isHighMemory = memory > 85;
    
    return {
      cpu: isHighMemory ? 60 + Math.random() * 20 : 40 + Math.random() * 15,
      memory,
      disk: 70 + Math.random() * 5,
      network: 25 + Math.random() * 15,
      responseTime: isHighMemory ? 500 + Math.random() * 300 : 100 + Math.random() * 50,
      errorRate: isHighMemory ? 5 + Math.random() * 5 : Math.random() * 1
    };
  },

  // 디스크 용량 부족 패턴 (DB-MAIN-01)
  disk_full: (hour: number): ScenarioPoint => {
    // 매일 2시에 로그 백업 실패로 급증
    const isBackupTime = hour === 2;
    const isCleanupTime = hour === 8;
    
    let disk = 92; // 기본적으로 높은 상태
    if (isBackupTime) {
      disk = Math.min(98, disk + 5); // 백업 시 증가
    } else if (isCleanupTime) {
      disk = Math.max(85, disk - 10); // 정리 작업
    } else {
      disk = 92 + Math.sin(hour / 24 * Math.PI * 2) * 3; // 일일 변동
    }
    
    const isCritical = disk > 95;
    
    return {
      cpu: isCritical ? 70 + Math.random() * 15 : 50 + Math.random() * 20,
      memory: 60 + Math.random() * 15,
      disk: disk + Math.random() * 2,
      network: 40 + Math.random() * 20,
      responseTime: isCritical ? 1000 + Math.random() * 500 : 200 + Math.random() * 100,
      errorRate: isCritical ? 10 + Math.random() * 10 : Math.random() * 2
    };
  },

  // 백업 지연 패턴 (FILE-NAS-01)
  backup_delay: (hour: number): ScenarioPoint => {
    const isBackupWindow = hour >= 1 && hour <= 5;
    
    return {
      cpu: isBackupWindow ? 60 + Math.random() * 20 : 30 + Math.random() * 15,
      memory: 50 + Math.random() * 15,
      disk: 75 + Math.random() * 10,
      network: isBackupWindow ? 85 + Math.random() * 10 : 20 + Math.random() * 20,
      responseTime: isBackupWindow ? 2000 + Math.random() * 1000 : 100 + Math.random() * 50,
      errorRate: isBackupWindow ? Math.random() * 5 : Math.random() * 0.5
    };
  },

  // 스토리지 경고 패턴 (BACKUP-01)
  storage_warning: (hour: number): ScenarioPoint => {
    // 꾸준히 높은 디스크 사용률
    const dailyGrowth = 0.1; // 일일 0.1% 증가
    const baseStorage = 85;
    
    return {
      cpu: 40 + Math.random() * 20,
      memory: 55 + Math.random() * 15,
      disk: Math.min(95, baseStorage + (hour / 24) * dailyGrowth + Math.random() * 3),
      network: 30 + Math.random() * 20,
      responseTime: 150 + Math.random() * 50,
      errorRate: Math.random() * 0.5
    };
  }
};

// 시나리오 메타데이터
export const scenarios: Record<string, Scenario> = {
  normal: {
    id: 'normal',
    name: '정상 운영',
    description: '일반적인 운영 패턴',
    severity: 'normal',
    affectedMetrics: [],
    pattern: 'periodic'
  },
  cpu_spike: {
    id: 'cpu_spike',
    name: 'CPU 과부하',
    description: '피크 시간대 CPU 사용률 급증',
    severity: 'warning',
    affectedMetrics: ['cpu'],
    pattern: 'spike'
  },
  memory_leak: {
    id: 'memory_leak',
    name: '메모리 누수',
    description: '애플리케이션 메모리 누수로 인한 점진적 증가',
    severity: 'critical',
    affectedMetrics: ['memory'],
    pattern: 'gradual'
  },
  disk_full: {
    id: 'disk_full',
    name: '디스크 용량 부족',
    description: '로그 파일 누적으로 인한 디스크 공간 부족',
    severity: 'critical',
    affectedMetrics: ['disk'],
    pattern: 'linear'
  },
  backup_delay: {
    id: 'backup_delay',
    name: '백업 지연',
    description: '네트워크 포화로 인한 백업 작업 지연',
    severity: 'warning',
    affectedMetrics: ['network'],
    pattern: 'periodic'
  },
  storage_warning: {
    id: 'storage_warning',
    name: '스토리지 용량 경고',
    description: '백업 스토리지 용량 임계치 접근',
    severity: 'warning',
    affectedMetrics: ['disk'],
    pattern: 'linear'
  }
};

// 시나리오별 알림 메시지
export const scenarioAlerts = {
  cpu_spike: [
    '⚠️ CPU 사용률이 임계치를 초과했습니다',
    '📈 트래픽 급증으로 인한 CPU 부하 증가',
    '🔥 시스템 응답 시간이 평소보다 3배 증가'
  ],
  memory_leak: [
    '🚨 메모리 사용률 90% 초과 - 즉시 조치 필요',
    '💾 애플리케이션 메모리 누수 감지',
    '⚠️ Out of Memory 오류 발생 가능성 높음'
  ],
  disk_full: [
    '💽 디스크 사용률 95% 초과 - 긴급',
    '📊 트랜잭션 로그 파일 급증',
    '🚨 데이터베이스 쓰기 작업 실패 위험'
  ],
  backup_delay: [
    '⏰ 백업 작업이 예정보다 2시간 지연',
    '🌐 네트워크 대역폭 포화 상태',
    '📦 일일 백업 윈도우 초과 예상'
  ],
  storage_warning: [
    '💾 백업 스토리지 85% 사용 중',
    '📈 일일 2TB씩 증가 추세',
    '⚠️ 2주 내 스토리지 확장 필요'
  ]
};

// 24시간 데이터 생성 함수
export function generate24HourData(scenarioId: string): ScenarioPoint[] {
  const data: ScenarioPoint[] = [];
  const pattern = scenarioPatterns[scenarioId as keyof typeof scenarioPatterns] || scenarioPatterns.normal;
  
  // 24시간 * 120 (30초 간격) = 2,880 포인트
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 0.5) { // 0.5분 = 30초
      const point = pattern(hour + minute / 60);
      // 약간의 노이즈 추가
      data.push({
        cpu: Math.max(0, Math.min(100, point.cpu + (Math.random() - 0.5) * 2)),
        memory: Math.max(0, Math.min(100, point.memory + (Math.random() - 0.5) * 2)),
        disk: Math.max(0, Math.min(100, point.disk + (Math.random() - 0.5) * 1)),
        network: Math.max(0, Math.min(100, point.network + (Math.random() - 0.5) * 3)),
        responseTime: point.responseTime,
        errorRate: point.errorRate
      });
    }
  }
  
  return data;
}