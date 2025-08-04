/**
 * 🎯 현실적 패턴 엔진
 *
 * 실제 서버 운영 환경의 패턴을 기반으로 한 데이터 생성
 * - 시간대별/요일별 패턴
 * - 서버 타입별 특성화
 * - 계절적/이벤트 패턴
 * - 상관관계 모델링
 */

interface PreviousMetrics {
  cpu_usage?: number;
  memory_usage?: number;
  disk_usage?: number;
  network_in?: number;
  network_out?: number;
  response_time?: number;
}

export interface TimePattern {
  hour: number;
  multiplier: number;
  variance: number;
}

export interface BusinessPattern {
  peak_hours: number[];
  low_hours: number[];
  medium_hours: number[];
  weekend_reduction: number;
  holiday_spike: number;
}

export interface ServerTypeProfile {
  name: string;
  cpu_base: number;
  memory_base: number;
  disk_base: number;
  peak_multiplier: number;
  burst_probability: number;
  correlation: {
    cpu_memory: number;
    cpu_response_time: number;
    memory_disk: number;
  };
  characteristics: {
    stability: number; // 0-1, 높을수록 안정적
    volatility: number; // 0-1, 높을수록 변동성 큼
    recovery_time: number; // 장애 후 복구 시간 (분)
  };
}

export class RealisticPatternEngine {
  private patterns: BusinessPattern = {
    peak_hours: [9, 10, 11, 14, 15, 16], // 오전 업무, 오후 업무
    low_hours: [0, 1, 2, 3, 4, 5, 23], // 새벽 시간
    medium_hours: [6, 7, 8, 12, 13, 17, 18, 19, 20, 21, 22],
    weekend_reduction: 0.6, // 주말 60% 수준
    holiday_spike: 1.5, // 특정 이벤트시 50% 증가
  };

  private serverProfiles: Map<string, ServerTypeProfile> = new Map([
    [
      'web',
      {
        name: 'Web Server',
        cpu_base: 35,
        memory_base: 45,
        disk_base: 25,
        peak_multiplier: 2.8,
        burst_probability: 0.15,
        correlation: {
          cpu_memory: 0.7,
          cpu_response_time: -0.8, // CPU 증가시 응답시간 악화
          memory_disk: 0.4,
        },
        characteristics: {
          stability: 0.8,
          volatility: 0.6,
          recovery_time: 5,
        },
      },
    ],
    [
      'database',
      {
        name: 'Database Server',
        cpu_base: 25,
        memory_base: 70,
        disk_base: 45,
        peak_multiplier: 1.8,
        burst_probability: 0.08,
        correlation: {
          cpu_memory: 0.9, // 높은 상관관계
          cpu_response_time: -0.9,
          memory_disk: 0.8, // 메모리-디스크 높은 연관성
        },
        characteristics: {
          stability: 0.9, // 매우 안정적
          volatility: 0.3,
          recovery_time: 10,
        },
      },
    ],
    [
      'api',
      {
        name: 'API Gateway',
        cpu_base: 30,
        memory_base: 40,
        disk_base: 20,
        peak_multiplier: 3.2,
        burst_probability: 0.2,
        correlation: {
          cpu_memory: 0.6,
          cpu_response_time: -0.75,
          memory_disk: 0.3,
        },
        characteristics: {
          stability: 0.7,
          volatility: 0.8, // 높은 변동성
          recovery_time: 3,
        },
      },
    ],
    [
      'vm',
      {
        name: 'VM Node',
        cpu_base: 20,
        memory_base: 55,
        disk_base: 30,
        peak_multiplier: 4.0, // 컨테이너 스케일링으로 높은 변동
        burst_probability: 0.25,
        correlation: {
          cpu_memory: 0.8,
          cpu_response_time: -0.7,
          memory_disk: 0.6,
        },
        characteristics: {
          stability: 0.6, // 동적 스케일링으로 불안정
          volatility: 0.9, // 매우 높은 변동성
          recovery_time: 2,
        },
      },
    ],
    [
      'cache',
      {
        name: 'Cache Server',
        cpu_base: 15,
        memory_base: 85,
        disk_base: 10,
        peak_multiplier: 2.0,
        burst_probability: 0.12,
        correlation: {
          cpu_memory: 0.9, // 캐시 특성상 높은 상관관계
          cpu_response_time: -0.95, // 캐시 성능과 직결
          memory_disk: 0.2, // 메모리 기반이므로 낮은 디스크 연관성
        },
        characteristics: {
          stability: 0.85,
          volatility: 0.4,
          recovery_time: 1,
        },
      },
    ],
    [
      'storage',
      {
        name: 'Storage Server',
        cpu_base: 20,
        memory_base: 30,
        disk_base: 60,
        peak_multiplier: 1.5,
        burst_probability: 0.05,
        correlation: {
          cpu_memory: 0.5,
          cpu_response_time: -0.6,
          memory_disk: 0.9, // 스토리지 특성상 높은 연관성
        },
        characteristics: {
          stability: 0.95, // 매우 안정적
          volatility: 0.2,
          recovery_time: 15,
        },
      },
    ],
    [
      'monitoring',
      {
        name: 'Monitoring Server',
        cpu_base: 40,
        memory_base: 60,
        disk_base: 50,
        peak_multiplier: 1.6,
        burst_probability: 0.06,
        correlation: {
          cpu_memory: 0.8,
          cpu_response_time: -0.7,
          memory_disk: 0.7,
        },
        characteristics: {
          stability: 0.9,
          volatility: 0.3,
          recovery_time: 8,
        },
      },
    ],
  ]);

  /**
   * 🕐 시간 기반 패턴 계산
   */
  private getTimeMultiplier(timestamp: Date): number {
    const hour = timestamp.getHours();
    const dayOfWeek = timestamp.getDay();

    let timeMultiplier = 1.0;

    // 시간대별 패턴
    if (this.patterns.peak_hours.includes(hour)) {
      timeMultiplier = 1.8; // 피크 시간 80% 증가
    } else if (this.patterns.low_hours.includes(hour)) {
      timeMultiplier = 0.4; // 새벽 시간 60% 감소
    } else {
      timeMultiplier = 1.0; // 평상시
    }

    // 요일별 패턴
    if (dayOfWeek === 1) {
      // 월요일
      timeMultiplier *= 1.2; // 20% 증가
    } else if (dayOfWeek === 5) {
      // 금요일
      timeMultiplier *= 0.9; // 10% 감소
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      // 주말
      timeMultiplier *= this.patterns.weekend_reduction;
    }

    return timeMultiplier;
  }

  /**
   * 📈 계절적/이벤트 패턴 계산
   */
  private getSeasonalMultiplier(timestamp: Date): number {
    const month = timestamp.getMonth() + 1;
    const date = timestamp.getDate();

    // 연말연시 (12월 15일 ~ 1월 5일)
    if ((month === 12 && date >= 15) || (month === 1 && date <= 5)) {
      return this.patterns.holiday_spike;
    }

    // 여름 휴가철 (7-8월)
    if (month === 7 || month === 8) {
      return 0.8;
    }

    // 개학철 (3월, 9월)
    if (month === 3 || month === 9) {
      return 1.3;
    }

    return 1.0;
  }

  /**
   * 🎲 버스트 이벤트 확인
   */
  private checkBurstEvent(profile: ServerTypeProfile): boolean {
    return Math.random() < profile.burst_probability;
  }

  /**
   * 🔄 상관관계 적용
   */
  private applyCorrelation(
    baseValue: number,
    relatedValue: number,
    correlation: number
  ): number {
    const correlationEffect = (relatedValue - 50) * correlation * 0.3;
    return Math.max(0, Math.min(100, baseValue + correlationEffect));
  }

  /**
   * 📊 현실적 메트릭 생성 (메인 함수)
   */
  generateRealisticMetric(
    metricType:
      | 'cpu_usage'
      | 'memory_usage'
      | 'disk_usage'
      | 'network_in'
      | 'network_out'
      | 'response_time',
    serverType: string,
    timestamp: Date,
    previousMetrics?: PreviousMetrics
  ): number {
    const profile =
      this.serverProfiles.get(serverType) || this.serverProfiles.get('web')!;

    // 기본값 설정
    let baseValue = 0;
    switch (metricType) {
      case 'cpu_usage':
        baseValue = profile.cpu_base;
        break;
      case 'memory_usage':
        baseValue = profile.memory_base;
        break;
      case 'disk_usage':
        baseValue = profile.disk_base;
        break;
      case 'network_in':
      case 'network_out':
        baseValue = 20;
        break;
      case 'response_time':
        baseValue = 100;
        break;
    }

    // 패턴 적용
    const timeMultiplier = this.getTimeMultiplier(timestamp);
    const seasonalMultiplier = this.getSeasonalMultiplier(timestamp);

    // 버스트 이벤트 체크
    const burstMultiplier = this.checkBurstEvent(profile)
      ? profile.peak_multiplier
      : 1.0;

    // 기본 계산
    let value =
      baseValue * timeMultiplier * seasonalMultiplier * burstMultiplier;

    // 상관관계 적용 (이전 메트릭이 있는 경우)
    if (previousMetrics) {
      switch (metricType) {
        case 'memory_usage':
          if (previousMetrics.cpu_usage) {
            value = this.applyCorrelation(
              value,
              previousMetrics.cpu_usage,
              profile.correlation.cpu_memory
            );
          }
          break;
        case 'response_time':
          if (previousMetrics.cpu_usage) {
            const responseBase =
              serverType === 'cache' ? 5 : serverType === 'database' ? 50 : 100;
            const cpuImpact =
              (previousMetrics.cpu_usage - 30) *
              Math.abs(profile.correlation.cpu_response_time) *
              20;
            value = responseBase + Math.max(0, cpuImpact);
          }
          break;
        case 'disk_usage':
          if (previousMetrics.memory_usage) {
            value = this.applyCorrelation(
              value,
              previousMetrics.memory_usage,
              profile.correlation.memory_disk
            );
          }
          break;
      }
    }

    // 안정성 기반 변동성 적용
    const volatilityRange = profile.characteristics.volatility * 20; // 최대 20% 변동
    const stabilityFactor = profile.characteristics.stability;
    const randomVariation =
      (Math.random() - 0.5) * volatilityRange * (1 - stabilityFactor);

    value += randomVariation;

    // 서버별 특성 반영한 미세 조정
    if (serverType === 'cache' && metricType === 'memory_usage') {
      value = Math.max(70, value); // 캐시 서버는 항상 높은 메모리 사용
    } else if (serverType === 'database' && metricType === 'disk_usage') {
      value = Math.max(30, value); // DB 서버는 기본 디스크 사용량 높음
    } else if (serverType === 'vm' && metricType === 'cpu_usage') {
      // 쿠버네티스는 Pod 스케줄링 패턴 반영
      const podSchedulingSpike = Math.sin(timestamp.getTime() / 60000) * 15; // 1분 주기 변동
      value += podSchedulingSpike;
    }

    // 범위 제한
    if (metricType === 'response_time') {
      return Math.max(5, Math.min(5000, value));
    } else if (metricType.includes('network')) {
      return Math.max(0, Math.min(1000, value));
    } else {
      return Math.max(0, Math.min(100, value));
    }
  }

  /**
   * 🔥 동적 장애 시나리오 트리거
   */
  shouldTriggerFailure(
    serverType: string,
    currentMetrics: PreviousMetrics,
    timestamp: Date
  ): { shouldTrigger: boolean; failureType?: string; severity?: number } {
    const profile =
      this.serverProfiles.get(serverType) || this.serverProfiles.get('web')!;

    // 메트릭 기반 장애 확률 계산
    let failureProbability = 0.02; // 기본 2%

    // CPU 과부하
    if (currentMetrics.cpu_usage && currentMetrics.cpu_usage > 85) {
      failureProbability += 0.05;
    }

    // 메모리 부족
    if (currentMetrics.memory_usage && currentMetrics.memory_usage > 90) {
      failureProbability += 0.08;
    }

    // 디스크 풀
    if (currentMetrics.disk_usage && currentMetrics.disk_usage > 95) {
      failureProbability += 0.15;
    }

    // 응답시간 증가
    if (currentMetrics.response_time && currentMetrics.response_time > 1000) {
      failureProbability += 0.03;
    }

    // 서버 안정성 반영
    failureProbability *= 1 - profile.characteristics.stability;

    const shouldTrigger = Math.random() < failureProbability;

    if (shouldTrigger) {
      // 장애 유형 결정
      let failureType = 'general_slowdown';
      let severity = 1;

      if (currentMetrics.memory_usage && currentMetrics.memory_usage > 90) {
        failureType = 'memory_leak';
        severity = 3;
      } else if (currentMetrics.cpu_usage && currentMetrics.cpu_usage > 85) {
        failureType = 'cpu_spike';
        severity = 2;
      } else if (currentMetrics.disk_usage && currentMetrics.disk_usage > 95) {
        failureType = 'disk_full';
        severity = 4;
      }

      return { shouldTrigger: true, failureType, severity };
    }

    return { shouldTrigger: false };
  }

  /**
   * 📋 서버 프로파일 정보 반환
   */
  getServerProfile(serverType: string): ServerTypeProfile | undefined {
    return this.serverProfiles.get(serverType);
  }

  /**
   * 📊 전체 패턴 요약 정보
   */
  getPatternSummary(
    serverType: string,
    timestamp: Date
  ): {
    timeMultiplier: number;
    seasonalMultiplier: number;
    expectedLoad: 'low' | 'medium' | 'high';
    profile: ServerTypeProfile;
  } {
    const timeMultiplier = this.getTimeMultiplier(timestamp);
    const seasonalMultiplier = this.getSeasonalMultiplier(timestamp);
    const profile =
      this.serverProfiles.get(serverType) || this.serverProfiles.get('web')!;

    const combinedMultiplier = timeMultiplier * seasonalMultiplier;
    let expectedLoad: 'low' | 'medium' | 'high' = 'medium';

    if (combinedMultiplier < 0.7) expectedLoad = 'low';
    else if (combinedMultiplier > 1.4) expectedLoad = 'high';

    return {
      timeMultiplier,
      seasonalMultiplier,
      expectedLoad,
      profile,
    };
  }
}

// 싱글톤 인스턴스
export const realisticPatternEngine = new RealisticPatternEngine();
