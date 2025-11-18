/**
 * 🔍 Vercel Status & Auto-Scaling Service
 *
 * OpenManager AI v5.11.0 - Vercel 상태 기반 동적 스케일링
 * - Vercel 무료/유료 계정 상태 감지
 * - 서버 생성량 자동 조절
 * - Prometheus 메트릭 기반 동적 설정
 * - 리소스 제한 자동 적응
 */

// GlobalThis 확장 인터페이스
interface GlobalWithCache {
  scalingConfigCache?: {
    data: ScalingConfig;
    expires: number;
  };
}

// Vercel 계정 타입 정의
export type VercelPlan = 'hobby' | 'pro' | 'enterprise';

// 스케일링 설정 타입
export interface ScalingConfig {
  maxServers: number;
  maxMetrics: number;
  updateInterval: number;
  cacheEnabled: boolean;
  prometheusEnabled: boolean;
  alertThrottle: number;
}

// Vercel 상태 정보
export interface VercelStatus {
  plan: VercelPlan;
  region: string;
  buildTime: number;
  functionTimeout: number;
  memoryLimit: number;
  executions: {
    used: number;
    limit: number;
    percentage: number;
  };
  bandwidth: {
    used: number;
    limit: number;
    percentage: number;
  };
}

/**
 * 🎯 Vercel 상태 기반 오토스케일링 서비스
 */
export class VercelStatusService {
  private static instance: VercelStatusService;
  private currentStatus: VercelStatus | null = null;
  private scalingConfig: ScalingConfig;
  private lastCheck: number = 0;
  private checkInterval = 60 * 1000; // 1분마다 체크

  static getInstance(): VercelStatusService {
    if (!this.instance) {
      this.instance = new VercelStatusService();
    }
    return this.instance;
  }

  private constructor() {
    this.scalingConfig = this.getDefaultConfig();
    this._initializeStatusMonitoring();
  }

  /**
   * 🔍 Vercel 계정 상태 감지
   */
  async detectVercelPlan(): Promise<VercelPlan> {
    try {
      // 환경 변수에서 계획 확인
      const explicitPlan = process.env.VERCEL_PLAN as VercelPlan;
      if (
        explicitPlan &&
        ['hobby', 'pro', 'enterprise'].includes(explicitPlan)
      ) {
        return explicitPlan;
      }

      // Vercel 환경 감지
      const isVercel = process.env.VERCEL === '1';
      if (!isVercel) {
        console.log('🔧 개발 환경: 로컬 실행 (무제한 모드)');
        return 'enterprise'; // 로컬에서는 무제한
      }

      // 함수 타임아웃으로 계획 추정
      const functionTimeout = parseInt(
        process.env.VERCEL_FUNCTION_TIMEOUT || '10'
      );

      if (functionTimeout >= 300) {
        // 5분 이상
        return 'enterprise';
      } else if (functionTimeout >= 60) {
        // 1분 이상
        return 'pro';
      } else {
        return 'hobby'; // 10초 기본값
      }
    } catch (error) {
      console.warn('⚠️ Vercel 계획 감지 실패, hobby로 가정:', error);
      return 'hobby';
    }
  }

  /**
   * 📊 Vercel 리소스 사용량 확인
   */
  async checkResourceUsage(): Promise<VercelStatus> {
    const plan = await this.detectVercelPlan();

    // 기본 상태 정보
    const status: VercelStatus = {
      plan,
      region: process.env.VERCEL_REGION || 'local',
      buildTime: Date.now(),
      functionTimeout: parseInt(process.env.VERCEL_FUNCTION_TIMEOUT || '10'),
      memoryLimit: this.getMemoryLimit(plan),
      executions: {
        used: 0,
        limit: this.getExecutionLimit(plan),
        percentage: 0,
      },
      bandwidth: {
        used: 0,
        limit: this.getBandwidthLimit(plan),
        percentage: 0,
      },
    };

    // 실제 사용량 추정 (메모리 기반)
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      const usedMB = memUsage.heapUsed / 1024 / 1024;

      status.executions.used = Math.floor(usedMB * 10); // 추정치
      status.executions.percentage =
        (status.executions.used / status.executions.limit) * 100;
    }

    this.currentStatus = status;
    return status;
  }

  /**
   * ⚙️ 계획별 기본 설정 가져오기
   */
  private getDefaultConfig(): ScalingConfig {
    return {
      maxServers: 20,
      maxMetrics: 511,
      updateInterval: 10000,
      cacheEnabled: true,
      prometheusEnabled: true,
      alertThrottle: 5000,
    };
  }

  /**
   * 🎯 계획별 스케일링 설정 적용 (8-30개 서버 제한)
   */
  getScalingConfigForPlan(plan: VercelPlan): ScalingConfig {
    const configs: Record<VercelPlan, ScalingConfig> = {
      hobby: {
        maxServers: 8, // 무료: 8개 서버 (최소값)
        maxMetrics: 200, // 무료: 200개 메트릭
        updateInterval: 15000, // 무료: 15초 간격
        cacheEnabled: true, // 메모리 캐싱 필수
        prometheusEnabled: false, // 무료: Prometheus 비활성화
        alertThrottle: 10000, // 무료: 10초 알림 제한
      },
      pro: {
        maxServers: 20, // Pro: 20개 서버
        maxMetrics: 500, // Pro: 500개 메트릭
        updateInterval: 10000, // Pro: 10초 간격
        cacheEnabled: true, // 메모리 캐싱 활성화
        prometheusEnabled: true, // Pro: Prometheus 활성화
        alertThrottle: 5000, // Pro: 5초 알림 제한
      },
      enterprise: {
        maxServers: 30, // Enterprise: 30개 서버 (최대값)
        maxMetrics: 750, // Enterprise: 750개 메트릭
        updateInterval: 8000, // Enterprise: 8초 간격
        cacheEnabled: true, // 고성능 메모리 캐싱
        prometheusEnabled: true, // Enterprise: 고급 메트릭
        alertThrottle: 3000, // Enterprise: 3초 알림
      },
    };

    return configs[plan];
  }

  /**
   * 🔄 현재 상태 기반 동적 설정 업데이트 (8-30개 서버 범위 제한)
   */
  async updateScalingConfig(): Promise<ScalingConfig> {
    const status = await this.checkResourceUsage();
    const baseConfig = this.getScalingConfigForPlan(status.plan);

    // 리소스 사용률에 따른 동적 조절 (8-30 범위 내에서)
    if (status.executions.percentage > 80) {
      // 사용률 80% 이상시 보수적 설정 (최소 8개 보장)
      baseConfig.maxServers = Math.max(
        Math.floor(baseConfig.maxServers * 0.8),
        8 // 최소 8개 서버 보장
      );
      baseConfig.updateInterval = Math.min(
        baseConfig.updateInterval * 1.3,
        20000
      );
      console.log(
        `⚠️ 높은 리소스 사용률 감지 (${status.executions.percentage.toFixed(1)}%), 보수적 설정: ${baseConfig.maxServers}개 서버`
      );
    } else if (status.executions.percentage < 30) {
      // 사용률 30% 미만시 적극적 설정 (최대 30개 제한)
      baseConfig.maxServers = Math.min(
        Math.floor(baseConfig.maxServers * 1.2),
        30 // 최대 30개 서버 제한
      );
      baseConfig.updateInterval = Math.max(
        baseConfig.updateInterval * 0.9,
        8000
      );
      console.log(
        `✅ 낮은 리소스 사용률 (${status.executions.percentage.toFixed(1)}%), 적극적 설정: ${baseConfig.maxServers}개 서버`
      );
    }

    // 📊 상태 분포 보장 설정 추가
    baseConfig.alertThrottle = Math.max(baseConfig.alertThrottle, 3000); // 최소 3초 알림 간격

    this.scalingConfig = baseConfig;

    // 메모리에 설정 저장 (임시 저장소 사용)
    if (typeof globalThis !== 'undefined') {
      (globalThis as typeof globalThis & GlobalWithCache).scalingConfigCache = {
        data: baseConfig,
        expires: Date.now() + 5 * 60 * 1000,
      };
    }

    return baseConfig;
  }

  /**
   * 📈 Prometheus 메트릭 기반 동적 조절
   */
  async adjustFromPrometheusMetrics(): Promise<void> {
    try {
      // 서버 사이드에서는 절대 URL 필요
      const baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

      // Prometheus 메트릭에서 현재 부하 확인
      const response = await fetch(`${baseUrl}/api/metrics/prometheus`);
      if (!response.ok) {
        console.log(`📊 Prometheus 메트릭 조회 실패: ${response.status}`);
        return;
      }

      const metrics = await response.text();

      // CPU 사용률 파싱
      const cpuMatch = metrics.match(
        /node_cpu_usage_percent{[^}]*}\s+([\d.]+)/
      );
      const avgCpu = cpuMatch && cpuMatch[1] ? parseFloat(cpuMatch[1]) : 0;

      // 메모리 사용률 파싱
      const memMatch = metrics.match(
        /node_memory_usage_percent{[^}]*}\s+([\d.]+)/
      );
      const avgMemory = memMatch && memMatch[1] ? parseFloat(memMatch[1]) : 0;

      // 부하 기반 동적 조절
      if (avgCpu > 80 || avgMemory > 80) {
        // 높은 부하시 서버 수 감소
        this.scalingConfig.maxServers = Math.max(
          this.scalingConfig.maxServers - 2,
          5
        );
        console.log(
          `🔥 높은 시스템 부하 감지 (CPU: ${avgCpu}%, MEM: ${avgMemory}%), 서버 수 감소: ${this.scalingConfig.maxServers}`
        );
      } else if (avgCpu < 20 && avgMemory < 30) {
        // 낮은 부하시 서버 수 증가
        const plan = await this.detectVercelPlan();
        const maxAllowed = this.getScalingConfigForPlan(plan).maxServers;

        this.scalingConfig.maxServers = Math.min(
          this.scalingConfig.maxServers + 1,
          maxAllowed
        );
        console.log(
          `📈 낮은 시스템 부하 (CPU: ${avgCpu}%, MEM: ${avgMemory}%), 서버 수 증가: ${this.scalingConfig.maxServers}`
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.warn('⚠️ Prometheus 메트릭 조회 실패:', errorMessage);
    }
  }

  /**
   * ⏰ 상태 모니터링 초기화
   */
  private _initializeStatusMonitoring(): void {
    // 초기 상태 확인
    void this.updateScalingConfig();

    // 주기적 상태 확인
    setInterval(() => {
      void (async () => {
        try {
          await this.updateScalingConfig();
          await this.adjustFromPrometheusMetrics();

          console.log(
            `🔄 스케일링 설정 업데이트: ${this.scalingConfig.maxServers}서버, ${this.scalingConfig.updateInterval}ms 간격`
          );
        } catch (error) {
          console.error('❌ 상태 모니터링 실패:', error);
        }
      })();
    }, this.checkInterval);
  }

  /**
   * 📊 현재 스케일링 설정 조회
   */
  getCurrentConfig(): ScalingConfig {
    return { ...this.scalingConfig };
  }

  /**
   * 🔍 현재 Vercel 상태 조회
   */
  getCurrentStatus(): VercelStatus | null {
    return this.currentStatus;
  }

  /**
   * 💾 계획별 메모리 제한
   */
  private getMemoryLimit(plan: VercelPlan): number {
    const limits = {
      hobby: 1024, // 1GB
      pro: 3008, // ~3GB
      enterprise: 8192, // 8GB
    };
    return limits[plan];
  }

  /**
   * ⚡ 계획별 실행 제한
   */
  private getExecutionLimit(plan: VercelPlan): number {
    const limits = {
      hobby: 100000, // 100K/월
      pro: 1000000, // 1M/월
      enterprise: 10000000, // 10M/월
    };
    return limits[plan];
  }

  /**
   * 🌐 계획별 대역폭 제한
   */
  private getBandwidthLimit(plan: VercelPlan): number {
    const limits = {
      hobby: 100, // 100GB/월
      pro: 1000, // 1TB/월
      enterprise: 5000, // 5TB/월
    };
    return limits[plan];
  }

  /**
   * 📈 스케일링 권장사항 생성
   */
  getScalingRecommendations(): string[] {
    const recommendations: string[] = [];
    const status = this.currentStatus;

    if (!status) return recommendations;

    if (status.executions.percentage > 70) {
      recommendations.push('🔥 실행 한도 70% 초과 - Pro 플랜 업그레이드 권장');
    }

    if (status.bandwidth.percentage > 80) {
      recommendations.push('🌐 대역폭 사용량 80% 초과 - 캐싱 강화 권장');
    }

    if (status.plan === 'hobby' && this.scalingConfig.maxServers >= 5) {
      recommendations.push(
        '⚡ 무료 플랜 한계 도달 - Pro 플랜으로 업그레이드하여 성능 향상'
      );
    }

    return recommendations;
  }
}

// 싱글톤 인스턴스 export
export const vercelStatusService = VercelStatusService.getInstance();
