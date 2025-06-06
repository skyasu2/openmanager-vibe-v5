/**
 * 🔄 Keep-Alive 시스템
 * 
 * ✅ Render 무료 환경 15분 스핀다운 방지
 * ✅ 스마트 요청 스케줄링
 * ✅ AI 엔진 Warm-up 관리
 * ✅ 연결 상태 모니터링
 */

export interface KeepAliveConfig {
  interval: number; // 핑 간격 (밀리초)
  timeout: number; // 요청 타임아웃
  maxRetries: number; // 최대 재시도 횟수
  endpoints: {
    health: string;
    status: string;
  };
  scheduler: {
    enableSmartScheduling: boolean;
    quietHours: { start: string; end: string }; // UTC 시간
    weekendReduction: boolean;
  };
}

export interface KeepAliveStatus {
  isActive: boolean;
  lastPing: number | null;
  consecutiveSuccesses: number;
  consecutiveFailures: number;
  totalPings: number;
  uptime: number;
  averageResponseTime: number;
  lastError: string | null;
}

export class KeepAliveSystem {
  private config: KeepAliveConfig;
  private status: KeepAliveStatus;
  private intervalId: NodeJS.Timeout | null = null;
  private responseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIME_SAMPLES = 100;

  constructor(config: Partial<KeepAliveConfig> = {}) {
    this.config = {
      interval: 10 * 60 * 1000, // 10분 (15분 제한보다 짧게)
      timeout: 30000, // 30초
      maxRetries: 3,
      endpoints: {
        health: '/api/health',
        status: '/api/system/status'
      },
      scheduler: {
        enableSmartScheduling: true,
        quietHours: { start: '02:00', end: '06:00' }, // UTC 기준 새벽
        weekendReduction: true
      },
      ...config
    };

    this.status = {
      isActive: false,
      lastPing: null,
      consecutiveSuccesses: 0,
      consecutiveFailures: 0,
      totalPings: 0,
      uptime: 0,
      averageResponseTime: 0,
      lastError: null
    };
  }

  /**
   * 🚀 Keep-Alive 시작
   */
  start(): void {
    if (this.status.isActive) {
      console.log('⚠️ [KeepAlive] 이미 실행 중입니다');
      return;
    }

    console.log('🔄 [KeepAlive] 시스템 시작');
    this.status.isActive = true;
    this.status.uptime = Date.now();

    // 즉시 첫 번째 핑 실행
    this.performPing();

    // 정기 핑 스케줄링
    this.scheduleNextPing();
  }

  /**
   * 🛑 Keep-Alive 중지
   */
  stop(): void {
    if (!this.status.isActive) {
      console.log('⚠️ [KeepAlive] 이미 중지되어 있습니다');
      return;
    }

    console.log('🛑 [KeepAlive] 시스템 중지');
    this.status.isActive = false;

    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * 📅 다음 핑 스케줄링
   */
  private scheduleNextPing(): void {
    if (!this.status.isActive) return;

    let interval = this.config.interval;

    // 스마트 스케줄링 적용
    if (this.config.scheduler.enableSmartScheduling) {
      interval = this.calculateSmartInterval();
    }

    this.intervalId = setTimeout(() => {
      this.performPing();
      this.scheduleNextPing();
    }, interval);

    console.log(`⏰ [KeepAlive] 다음 핑: ${new Date(Date.now() + interval).toLocaleTimeString()}`);
  }

  /**
   * 🧠 스마트 간격 계산
   */
  private calculateSmartInterval(): number {
    let interval = this.config.interval;
    const now = new Date();
    const utcHour = now.getUTCHours();
    const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;

    // 조용한 시간대 체크 (새벽 시간)
    const quietStart = parseInt(this.config.scheduler.quietHours.start.split(':')[0]);
    const quietEnd = parseInt(this.config.scheduler.quietHours.end.split(':')[0]);
    
    const isQuietHours = (quietStart <= quietEnd) 
      ? (utcHour >= quietStart && utcHour < quietEnd)
      : (utcHour >= quietStart || utcHour < quietEnd);

    if (isQuietHours) {
      interval *= 2; // 조용한 시간에는 간격 2배로
      console.log('🌙 [KeepAlive] 조용한 시간대 - 간격 연장');
    }

    // 주말 감소
    if (this.config.scheduler.weekendReduction && isWeekend) {
      interval *= 1.5; // 주말에는 간격 1.5배로
      console.log('🏖️ [KeepAlive] 주말 - 간격 연장');
    }

    // 연속 실패 시 간격 단축
    if (this.status.consecutiveFailures > 2) {
      interval = Math.max(interval * 0.5, 5 * 60 * 1000); // 최소 5분
      console.log('⚠️ [KeepAlive] 연속 실패 감지 - 간격 단축');
    }

    // 안정적인 상태에서는 간격 확장
    if (this.status.consecutiveSuccesses > 10) {
      interval = Math.min(interval * 1.2, 14 * 60 * 1000); // 최대 14분
      console.log('✅ [KeepAlive] 안정적 상태 - 간격 확장');
    }

    return interval;
  }

  /**
   * 🏓 핑 실행
   */
  private async performPing(): Promise<void> {
    if (!this.status.isActive) return;

    const startTime = Date.now();
    console.log('🏓 [KeepAlive] 핑 시작...');

    try {
      // 헬스 체크
      await this.pingEndpoint(this.config.endpoints.health);
      

      // 시스템 상태 체크
      await this.pingEndpoint(this.config.endpoints.status);

      // 성공 처리
      const responseTime = Date.now() - startTime;
      this.handlePingSuccess(responseTime);

    } catch (error) {
      this.handlePingFailure(error);
    }
  }

  /**
   * 📡 엔드포인트 핑
   */
  private async pingEndpoint(endpoint: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                     'http://localhost:3001';

      const response = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'OpenManager-KeepAlive/1.0',
          'Accept': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * ✅ 핑 성공 처리
   */
  private handlePingSuccess(responseTime: number): void {
    this.status.lastPing = Date.now();
    this.status.consecutiveSuccesses++;
    this.status.consecutiveFailures = 0;
    this.status.totalPings++;
    this.status.lastError = null;

    // 응답 시간 기록
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > this.MAX_RESPONSE_TIME_SAMPLES) {
      this.responseTimes.shift();
    }

    // 평균 응답 시간 계산
    this.status.averageResponseTime = 
      this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;

    console.log(`✅ [KeepAlive] 핑 성공 (${responseTime}ms) - 연속 성공: ${this.status.consecutiveSuccesses}`);
  }

  /**
   * ❌ 핑 실패 처리
   */
  private handlePingFailure(error: any): void {
    this.status.consecutiveFailures++;
    this.status.consecutiveSuccesses = 0;
    this.status.totalPings++;
    this.status.lastError = error.message || String(error);

    console.error(`❌ [KeepAlive] 핑 실패 (연속 실패: ${this.status.consecutiveFailures}):`, error.message);

    // 최대 재시도 횟수 초과 시 경고
    if (this.status.consecutiveFailures >= this.config.maxRetries) {
      console.warn(`🚨 [KeepAlive] 최대 재시도 횟수 초과 (${this.config.maxRetries})`);
      
      // 필요시 알림 발송 또는 다른 조치
      this.handleCriticalFailure();
    }
  }

  /**
   * 🚨 심각한 실패 처리
   */
  private handleCriticalFailure(): void {
    // 실제 구현에서는 알림 시스템과 연동
    console.error('🚨 [KeepAlive] 심각한 연결 실패 - 알림 필요');
    
    // 간격을 더 짧게 조정하여 빠른 복구 시도
    this.config.interval = Math.min(this.config.interval, 5 * 60 * 1000);
  }

  /**
   * 📊 상태 조회
   */
  getStatus(): KeepAliveStatus & {
    uptimeHours: number;
    successRate: number;
    nextPingIn: number;
  } {
    const uptimeHours = this.status.uptime 
      ? (Date.now() - this.status.uptime) / (1000 * 60 * 60) 
      : 0;

    const successRate = this.status.totalPings > 0 
      ? ((this.status.totalPings - this.status.consecutiveFailures) / this.status.totalPings) * 100
      : 0;

    const nextPingIn = this.intervalId ? this.config.interval : 0;

    return {
      ...this.status,
      uptimeHours,
      successRate,
      nextPingIn
    };
  }

  /**
   * ⚙️ 설정 업데이트
   */
  updateConfig(newConfig: Partial<KeepAliveConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ [KeepAlive] 설정 업데이트됨');

    // 활성화된 상태라면 재시작
    if (this.status.isActive) {
      this.stop();
      this.start();
    }
  }

  /**
   * 🔄 수동 핑 트리거
   */
  async triggerManualPing(): Promise<boolean> {
    console.log('🔄 [KeepAlive] 수동 핑 트리거');
    
    try {
      await this.performPing();
      return true;
    } catch (error) {
      console.error('❌ [KeepAlive] 수동 핑 실패:', error);
      return false;
    }
  }

  /**
   * 📈 통계 리셋
   */
  resetStatistics(): void {
    this.status.consecutiveSuccesses = 0;
    this.status.consecutiveFailures = 0;
    this.status.totalPings = 0;
    this.status.lastError = null;
    this.responseTimes = [];
    this.status.averageResponseTime = 0;
    
    console.log('📈 [KeepAlive] 통계 리셋됨');
  }
}

// 전역 인스턴스 (싱글톤)
export const keepAliveSystem = new KeepAliveSystem(); 