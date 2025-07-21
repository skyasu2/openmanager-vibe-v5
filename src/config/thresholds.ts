/**
 * System Thresholds Configuration
 *
 * 🎯 모든 임계값을 중앙에서 관리
 */

export const THRESHOLDS = {
  // 🖥️ 서버 리소스 임계값
  SERVER: {
    CPU: {
      WARNING: 70, // 70% 이상 경고
      CRITICAL: 85, // 85% 이상 위험
      ALERT: 90, // 90% 이상 알림
    },
    MEMORY: {
      WARNING: 75, // 75% 이상 경고
      CRITICAL: 85, // 85% 이상 위험
      ALERT: 90, // 90% 이상 알림
    },
    DISK: {
      WARNING: 80, // 80% 이상 경고
      CRITICAL: 90, // 90% 이상 위험
      ALERT: 95, // 95% 이상 알림
    },
    NETWORK: {
      LATENCY_WARNING: 100, // 100ms 이상 경고
      LATENCY_CRITICAL: 500, // 500ms 이상 위험
      PACKET_LOSS: 5, // 5% 이상 패킷 손실
    },
  },

  // ⏱️ 응답 시간 임계값
  RESPONSE_TIME: {
    FAST: 1000, // 1초 이하 빠름
    SLOW: 3000, // 3초 이상 느림
    TIMEOUT: 10000, // 10초 타임아웃
  },

  // 📊 성능 임계값
  PERFORMANCE: {
    UPTIME_GOOD: 99.9, // 99.9% 이상 좋음
    UPTIME_WARNING: 99.0, // 99.0% 이하 경고
    LOAD_AVERAGE_HIGH: 0.8, // 로드 평균 80% 이상
    MEMORY_LEAK_THRESHOLD: 10, // 메모리 누수 임계값 (MB/hour)
  },

  // 🔔 알림 임계값
  ALERTS: {
    MAX_ALERTS_PER_HOUR: 50, // 시간당 최대 알림 수
    ALERT_COOLDOWN_MINUTES: 5, // 알림 쿨다운 시간
    ESCALATION_MINUTES: 15, // 에스컬레이션 시간
  },

  // 📈 비즈니스 임계값
  BUSINESS: {
    CRITICAL_SERVICES_DOWN: 3, // 중요 서비스 다운 임계값
    MAX_DOWNTIME_MINUTES: 30, // 최대 허용 다운타임
    SLA_THRESHOLD: 99.5, // SLA 임계값
  },
} as const;

// 🎛️ 동적 임계값 계산 함수들
export const calculateDynamicThreshold = {
  /**
   * 시간대별 CPU 임계값 조정
   */
  cpuByTimeOfDay: (hour: number): number => {
    // 업무시간(9-18시)에는 더 엄격한 임계값 적용
    if (hour >= 9 && hour <= 18) {
      return THRESHOLDS.SERVER.CPU.WARNING - 10; // 60%
    }
    return THRESHOLDS.SERVER.CPU.WARNING; // 70%
  },

  /**
   * 서버 타입별 메모리 임계값
   */
  memoryByServerType: (serverType: string): number => {
    switch (serverType.toLowerCase()) {
      case 'database':
        return THRESHOLDS.SERVER.MEMORY.WARNING + 10; // DB는 85%
      case 'cache':
        return THRESHOLDS.SERVER.MEMORY.WARNING + 15; // 캐시는 90%
      default:
        return THRESHOLDS.SERVER.MEMORY.WARNING; // 기본 75%
    }
  },

  /**
   * 트래픽 기반 응답시간 임계값
   */
  responseTimeByLoad: (currentLoad: number): number => {
    if (currentLoad > 0.8) {
      return THRESHOLDS.RESPONSE_TIME.SLOW * 1.5; // 고부하시 더 관대하게
    }
    return THRESHOLDS.RESPONSE_TIME.SLOW;
  },
};

// 🔧 임계값 유효성 검사
export const validateThresholds = (thresholds: typeof THRESHOLDS): boolean => {
  // CPU 임계값 순서 검증
  if (thresholds.SERVER.CPU.WARNING >= thresholds.SERVER.CPU.CRITICAL) {
    console.error('CPU WARNING threshold must be less than CRITICAL');
    return false;
  }

  if (thresholds.SERVER.CPU.CRITICAL >= thresholds.SERVER.CPU.ALERT) {
    console.error('CPU CRITICAL threshold must be less than ALERT');
    return false;
  }

  // 응답시간 임계값 검증
  if (thresholds.RESPONSE_TIME.FAST >= thresholds.RESPONSE_TIME.SLOW) {
    console.error('FAST response time must be less than SLOW');
    return false;
  }

  return true;
};

// 초기화시 검증 실행
if (!validateThresholds(THRESHOLDS)) {
  throw new Error('Invalid threshold configuration');
}
