/**
 * 🔥 Python 서비스 웜업 및 상태 관리
 * Render 콜드 스타트 문제 완전 해결
 */

interface WarmupStatus {
  isWarm: boolean;
  lastWarmup: Date;
  consecutiveFailures: number;
  averageResponseTime: number;
  warmupCount: number; // 웜업 실행 횟수
  maxWarmups: number;  // 최대 웜업 횟수
}

export class PythonWarmupService {
  private static instance: PythonWarmupService;
  private warmupStatus: WarmupStatus;
  private warmupInterval: NodeJS.Timeout | null = null;
  private pythonServiceUrl: string;

  private constructor() {
    this.pythonServiceUrl = process.env.FASTAPI_BASE_URL || 'https://openmanager-ai-engine.onrender.com';
    this.warmupStatus = {
      isWarm: false,
      lastWarmup: new Date(0),
      consecutiveFailures: 0,
      averageResponseTime: 0,
      warmupCount: 0,
      maxWarmups: 4 // 4번만 웜업
    };
  }

  public static getInstance(): PythonWarmupService {
    if (!PythonWarmupService.instance) {
      PythonWarmupService.instance = new PythonWarmupService();
    }
    return PythonWarmupService.instance;
  }

  /**
   * 🚀 제한된 웜업 시스템 시작 (4번만)
   */
  public startLimitedWarmupSystem(): void {
    // 기존 웜업이 실행 중이면 중지
    this.stopWarmupSystem();
    
    // 웜업 카운터 리셋
    this.warmupStatus.warmupCount = 0;
    
    console.log(`🔥 제한된 웜업 시스템 시작 (최대 ${this.warmupStatus.maxWarmups}번)...`);
    
    // 즉시 첫 번째 웜업 실행
    this.performLimitedWarmup();
    
    // 8분마다 웜업 (최대 4번까지)
    this.warmupInterval = setInterval(() => {
      this.performLimitedWarmup();
    }, 8 * 60 * 1000);
  }

  /**
   * 🚀 기존 무제한 웜업 시스템 (호환성 유지)
   */
  public startWarmupSystem(): void {
    console.log('🔥 Python 웜업 시스템 시작...');
    
    // 즉시 웜업 실행
    this.performWarmup();
    
    // 8분마다 웜업 (무제한)
    this.warmupInterval = setInterval(() => {
      this.performWarmup();
    }, 8 * 60 * 1000);
  }

  /**
   * 🔥 제한된 웜업 수행
   */
  private async performLimitedWarmup(): Promise<void> {
    // 최대 횟수 체크
    if (this.warmupStatus.warmupCount >= this.warmupStatus.maxWarmups) {
      console.log(`✅ 웜업 완료! ${this.warmupStatus.maxWarmups}번 실행됨. 웜업 시스템 자동 중지.`);
      this.stopWarmupSystem();
      return;
    }

    this.warmupStatus.warmupCount++;
    console.log(`🔥 웜업 실행 중... (${this.warmupStatus.warmupCount}/${this.warmupStatus.maxWarmups})`);
    
    await this.performWarmup();
  }

  /**
   * 🔥 실제 웜업 수행
   */
  private async performWarmup(): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🔥 Python 서비스 웜업 중...');
      
      // 헬스체크로 서비스 깨우기
      const response = await fetch(`${this.pythonServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(30000),
        headers: {
          'User-Agent': 'OpenManager-Warmup-Agent',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // 실제 분석 요청으로 완전 웜업
      await this.performAnalysisWarmup();

      const responseTime = Date.now() - startTime;
      
      // 웜업 성공
      this.updateWarmupStatus(true, responseTime);
      console.log(`✅ Python 웜업 성공 (${responseTime}ms)`);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateWarmupStatus(false, responseTime);
      console.warn(`⚠️ Python 웜업 실패 (${responseTime}ms):`, error);
    }
  }

  /**
   * 🧠 분석 요청으로 완전 웜업
   */
  private async performAnalysisWarmup(): Promise<void> {
    const warmupPayload = {
      query: 'warmup analysis test',
      metrics: [{
        timestamp: new Date().toISOString(),
        cpu: 45,
        memory: 55,
        disk: 65,
        networkIn: 800,
        networkOut: 1200
      }],
      data: { warmup: true }
    };

    const response = await fetch(`${this.pythonServiceUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'OpenManager-Warmup-Agent'
      },
      body: JSON.stringify(warmupPayload),
      signal: AbortSignal.timeout(25000)
    });

    if (!response.ok) {
      throw new Error(`Analysis warmup failed: ${response.status}`);
    }

    await response.json(); // 응답 완전히 소비
  }

  /**
   * 📊 웜업 상태 업데이트
   */
  private updateWarmupStatus(success: boolean, responseTime: number): void {
    this.warmupStatus.lastWarmup = new Date();
    
    if (success) {
      this.warmupStatus.isWarm = true;
      this.warmupStatus.consecutiveFailures = 0;
      
      // 평균 응답시간 계산 (이동평균)
      if (this.warmupStatus.averageResponseTime === 0) {
        this.warmupStatus.averageResponseTime = responseTime;
      } else {
        this.warmupStatus.averageResponseTime = 
          (this.warmupStatus.averageResponseTime * 0.7) + (responseTime * 0.3);
      }
    } else {
      this.warmupStatus.consecutiveFailures++;
      
      // 3번 연속 실패하면 콜드 상태로 변경
      if (this.warmupStatus.consecutiveFailures >= 3) {
        this.warmupStatus.isWarm = false;
      }
    }
  }

  /**
   * 🌡️ Python 서비스 상태 확인
   */
  public async checkPythonStatus(): Promise<{
    isWarm: boolean;
    status: 'healthy' | 'warming' | 'cold' | 'error';
    responseTime: number;
    lastCheck: Date;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.pythonServiceUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
        headers: { 'Cache-Control': 'no-cache' }
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = response.ok;

      let status: 'healthy' | 'warming' | 'cold' | 'error' = 'error';
      
      if (isHealthy) {
        if (responseTime < 2000) {
          status = 'healthy';
        } else {
          status = 'warming';
        }
      } else {
        status = 'cold';
      }

      return {
        isWarm: isHealthy && responseTime < 5000,
        status,
        responseTime,
        lastCheck: new Date()
      };

    } catch (error) {
      return {
        isWarm: false,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastCheck: new Date()
      };
    }
  }

  /**
   * 🎯 스마트 AI 요청 (웜업 고려)
   */
  public async smartAIRequest(
    query: string, 
    metrics: any[], 
    data: any = {}
  ): Promise<any> {
    // 1. 현재 상태 확인
    const status = await this.checkPythonStatus();
    
    // 2. 콜드 상태면 즉시 웜업
    if (!status.isWarm) {
      console.log('🔥 콜드 상태 감지, 즉시 웜업 수행...');
      await this.performWarmup();
    }

    // 3. AI 분석 요청
    try {
      const response = await fetch(`${this.pythonServiceUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-Smart-Client'
        },
        body: JSON.stringify({ query, metrics, data }),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('❌ Smart AI 요청 실패:', error);
      throw error;
    }
  }

  /**
   * 📈 웜업 통계 조회
   */
  public getWarmupStats() {
    const isActive = !!this.warmupInterval;
    const remainingWarmups = Math.max(0, this.warmupStatus.maxWarmups - this.warmupStatus.warmupCount);
    
    return {
      ...this.warmupStatus,
      nextWarmup: isActive ? new Date(this.warmupStatus.lastWarmup.getTime() + (8 * 60 * 1000)) : null,
      systemActive: isActive,
      remainingWarmups,
      isCompleted: this.warmupStatus.warmupCount >= this.warmupStatus.maxWarmups
    };
  }

  /**
   * 🛑 웜업 시스템 중지
   */
  public stopWarmupSystem(): void {
    if (this.warmupInterval) {
      clearInterval(this.warmupInterval);
      this.warmupInterval = null;
      console.log('🛑 Python 웜업 시스템 중지됨');
    }
  }

  /**
   * 🔄 웜업 카운터 리셋
   */
  public resetWarmupCounter(): void {
    this.warmupStatus.warmupCount = 0;
    console.log('🔄 웜업 카운터 리셋됨');
  }

  /**
   * ⚙️ 최대 웜업 횟수 설정
   */
  public setMaxWarmups(count: number): void {
    this.warmupStatus.maxWarmups = Math.max(1, count);
    console.log(`⚙️ 최대 웜업 횟수 설정: ${this.warmupStatus.maxWarmups}번`);
  }
} 