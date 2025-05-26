/**
 * Server Data Generator
 * 
 * 🎭 테스트 환경용 서버 데이터 생성기
 * - 초기 24시간 데이터 생성 (2-3가지 패턴)
 * - 실시간 10분 데이터 생성 (5초 간격)
 * - 자동 데이터 관리 및 재생성
 */

import { metricsStorage } from '../storage';

export interface DataPattern {
  id: string;
  name: string;
  description: string;
  characteristics: {
    cpuBase: number;
    memoryBase: number;
    diskBase: number;
    volatility: 'low' | 'medium' | 'high';
    hasSpikes: boolean;
    businessHours: boolean;
  };
}

export interface GeneratedMetrics {
  serverId: string;
  hostname: string;
  timestamp: Date;
  cpu: number;
  memory: number;
  disk: number;
  network: {
    bytesIn: number;
    bytesOut: number;
    latency: number;
  };
  system: {
    uptime: number;
    processes: number;
    loadAverage: [number, number, number];
  };
}

export class ServerDataGenerator {
  private isGenerating: boolean = false;
  private realtimeTimer?: NodeJS.Timeout;
  private realtimeStartTime?: Date;
  private currentPattern: string = 'normal'; // 현재 사용 중인 패턴
  private readonly REALTIME_DURATION = 10 * 60 * 1000; // 10분
  private readonly REALTIME_INTERVAL = 5 * 1000; // 5초
  private readonly HISTORY_DURATION = 24 * 60 * 60 * 1000; // 24시간

  // 미리 정의된 데이터 패턴들
  private readonly DATA_PATTERNS: DataPattern[] = [
    {
      id: 'normal',
      name: '정상 운영',
      description: '일반적인 비즈니스 시간 패턴',
      characteristics: {
        cpuBase: 35,
        memoryBase: 60,
        diskBase: 45,
        volatility: 'low',
        hasSpikes: false,
        businessHours: true
      }
    },
    {
      id: 'high-load',
      name: '고부하',
      description: '높은 트래픽과 리소스 사용량',
      characteristics: {
        cpuBase: 70,
        memoryBase: 85,
        diskBase: 65,
        volatility: 'high',
        hasSpikes: true,
        businessHours: true
      }
    },
    {
      id: 'maintenance',
      name: '유지보수',
      description: '유지보수 작업 중 불규칙한 패턴',
      characteristics: {
        cpuBase: 25,
        memoryBase: 40,
        diskBase: 30,
        volatility: 'medium',
        hasSpikes: true,
        businessHours: false
      }
    }
  ];

  /**
   * 초기 24시간 데이터 생성 및 관리
   */
  async initializeHistoryData(): Promise<void> {
    console.log('🔄 Initializing 24-hour history data...');

    try {
      // 기존 데이터 상태 확인
      const existingData = await this.checkExistingHistoryData();
      
      if (existingData.isComplete) {
        console.log('✅ 24-hour history data already exists and complete');
        return;
      }

      console.log(`📊 Generating missing history data (${existingData.missingHours} hours missing)`);
      
      // 서버 목록 생성
      const servers = this.generateServerList();
      
      // 각 패턴별로 24시간 데이터 생성
      for (const pattern of this.DATA_PATTERNS) {
        await this.generateHistoryDataForPattern(servers, pattern);
      }

      console.log('✅ 24-hour history data generation completed');
    } catch (error) {
      console.error('❌ Failed to initialize history data:', error);
    }
  }

  /**
   * 기존 히스토리 데이터 상태 확인
   */
  private async checkExistingHistoryData(): Promise<{ isComplete: boolean; missingHours: number }> {
    try {
      // 최근 24시간 데이터 개수 확인
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - this.HISTORY_DURATION);
      
      // 실제 구현 시 DB 쿼리
      // const count = await metricsStorage.getHistoryDataCount(startTime, endTime);
      // const expectedCount = 24 * 60 * 12; // 24시간 * 60분 * 12개(5분 간격)
      
      // 현재는 시뮬레이션
      const hasData = Math.random() > 0.7; // 30% 확률로 데이터 없음
      
      return {
        isComplete: hasData,
        missingHours: hasData ? 0 : 24
      };
    } catch (error) {
      console.error('Failed to check existing data:', error);
      return { isComplete: false, missingHours: 24 };
    }
  }

  /**
   * 패턴별 24시간 히스토리 데이터 생성
   */
  private async generateHistoryDataForPattern(servers: any[], pattern: DataPattern): Promise<void> {
    console.log(`📈 Generating 24h data for pattern: ${pattern.name}`);
    
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - this.HISTORY_DURATION);
    const interval = 5 * 60 * 1000; // 5분 간격
    
    const dataPoints: GeneratedMetrics[] = [];
    
    for (const server of servers) {
      let currentTime = new Date(startTime);
      
      while (currentTime <= endTime) {
        const metrics = this.generateMetricsForPattern(
          server,
          pattern,
          currentTime,
          startTime
        );
        
        dataPoints.push(metrics);
        currentTime = new Date(currentTime.getTime() + interval);
      }
    }
    
    // 배치로 DB에 저장
    await this.saveHistoryDataBatch(dataPoints, pattern.id);
    console.log(`✅ Generated ${dataPoints.length} data points for ${pattern.name}`);
  }

  /**
   * 실시간 10분 데이터 생성 시작
   */
  async startRealtimeGeneration(pattern: string = 'normal'): Promise<void> {
    if (this.isGenerating) {
      console.log('⚠️ Realtime generation already running');
      return;
    }

    this.currentPattern = pattern;
    console.log(`🚀 Starting 10-minute realtime data generation (${pattern} pattern, 5s interval)...`);
    
    this.isGenerating = true;
    this.realtimeStartTime = new Date();
    
    // 서버 목록 가져오기
    const servers = this.generateServerList();
    console.log(`📋 Generated ${servers.length} servers for realtime monitoring`);
    
    // ServerDataCollector에 서버 등록
    await this.registerServersToCollector(servers);
    
    // 첫 번째 데이터 포인트 즉시 생성
    await this.generateRealtimeDataPoint(servers);
    
    // 5초마다 데이터 생성
    this.realtimeTimer = setInterval(async () => {
      try {
        await this.generateRealtimeDataPoint(servers);
        
        // 10분 경과 시 자동 중지
        const elapsed = Date.now() - this.realtimeStartTime!.getTime();
        if (elapsed >= this.REALTIME_DURATION) {
          console.log('⏰ 10 minutes elapsed, stopping realtime generation');
          this.stopRealtimeGeneration();
        }
      } catch (error) {
        console.error('Realtime generation error:', error);
      }
    }, this.REALTIME_INTERVAL);

    // 10분 후 자동 중지 타이머
    setTimeout(() => {
      if (this.isGenerating) {
        this.stopRealtimeGeneration();
      }
    }, this.REALTIME_DURATION);
  }

  /**
   * 실시간 데이터 생성 중지
   */
  stopRealtimeGeneration(): void {
    if (!this.isGenerating) {
      return;
    }

    console.log('🛑 Stopping realtime data generation...');
    
    this.isGenerating = false;
    
    if (this.realtimeTimer) {
      clearInterval(this.realtimeTimer);
      this.realtimeTimer = undefined;
    }
    
    this.realtimeStartTime = undefined;
    this.currentPattern = 'normal'; // 기본값으로 리셋
    console.log('✅ Realtime generation stopped');
  }

  /**
   * 실시간 생성 중 패턴 변경
   */
  changeRealtimePattern(pattern: string): boolean {
    if (!this.isGenerating) {
      console.warn('⚠️ Cannot change pattern: realtime generation not running');
      return false;
    }

    const validPattern = this.DATA_PATTERNS.find(p => p.id === pattern);
    if (!validPattern) {
      console.warn(`⚠️ Invalid pattern: ${pattern}`);
      return false;
    }

    this.currentPattern = pattern;
    console.log(`🔄 Changed realtime pattern to: ${validPattern.name}`);
    return true;
  }

  /**
   * 실시간 데이터 포인트 생성
   */
  private async generateRealtimeDataPoint(servers: any[]): Promise<void> {
    const now = new Date();
    const dataPoints: GeneratedMetrics[] = [];
    
    // 현재 설정된 패턴 사용
    const pattern = this.DATA_PATTERNS.find(p => p.id === this.currentPattern) || this.DATA_PATTERNS[0];
    
    for (const server of servers) {
      const metrics = this.generateMetricsForPattern(
        server,
        pattern,
        now,
        this.realtimeStartTime!
      );
      
      dataPoints.push(metrics);
    }
    
    // 실시간 테이블에 저장
    await this.saveRealtimeDataBatch(dataPoints);
    console.log(`📊 Generated ${dataPoints.length} realtime data points`);
  }

  /**
   * 패턴 기반 메트릭 생성
   */
  private generateMetricsForPattern(
    server: any,
    pattern: DataPattern,
    timestamp: Date,
    startTime: Date
  ): GeneratedMetrics {
    const elapsed = timestamp.getTime() - startTime.getTime();
    const hour = timestamp.getHours();
    const isBusinessHour = hour >= 9 && hour <= 18;
    
    // 기본값에서 시작
    let cpu = pattern.characteristics.cpuBase;
    let memory = pattern.characteristics.memoryBase;
    let disk = pattern.characteristics.diskBase;
    
    // 비즈니스 시간 패턴 적용
    if (pattern.characteristics.businessHours && isBusinessHour) {
      cpu += 15;
      memory += 10;
    } else if (!isBusinessHour) {
      cpu -= 10;
      memory -= 5;
    }
    
    // 변동성 적용
    const volatilityMultiplier = {
      low: 0.5,
      medium: 1.0,
      high: 2.0
    }[pattern.characteristics.volatility];
    
    cpu += (Math.random() * 20 - 10) * volatilityMultiplier;
    memory += (Math.random() * 15 - 7.5) * volatilityMultiplier;
    disk += (Math.random() * 5 - 2.5) * volatilityMultiplier;
    
    // 스파이크 패턴 적용
    if (pattern.characteristics.hasSpikes && Math.random() < 0.05) { // 5% 확률
      cpu += Math.random() * 30;
      memory += Math.random() * 20;
    }
    
    // 범위 제한
    cpu = Math.max(5, Math.min(95, cpu));
    memory = Math.max(20, Math.min(95, memory));
    disk = Math.max(10, Math.min(90, disk));
    
    return {
      serverId: server.id,
      hostname: server.hostname,
      timestamp,
      cpu: Math.round(cpu * 100) / 100,
      memory: Math.round(memory * 100) / 100,
      disk: Math.round(disk * 100) / 100,
      network: {
        bytesIn: Math.floor(Math.random() * 1000000) + 100000,
        bytesOut: Math.floor(Math.random() * 800000) + 80000,
        latency: Math.round((Math.random() * 50 + 10) * 100) / 100
      },
      system: {
        uptime: Math.floor(elapsed / 1000),
        processes: Math.floor(Math.random() * 50) + 100,
        loadAverage: [
          Math.round((Math.random() * 2) * 100) / 100,
          Math.round((Math.random() * 1.5) * 100) / 100,
          Math.round((Math.random() * 1) * 100) / 100
        ]
      }
    };
  }

  /**
   * 서버 목록 생성 (팩토리 서비스 사용)
   */
  private generateServerList(): any[] {
    // 기본 서버 리스트 (팩토리 패턴 적용 예정)
    return [
      { id: 'web-01', hostname: 'web-server-01', type: 'web' },
      { id: 'web-02', hostname: 'web-server-02', type: 'web' },
      { id: 'api-01', hostname: 'api-server-01', type: 'api' },
      { id: 'api-02', hostname: 'api-server-02', type: 'api' },
      { id: 'db-01', hostname: 'db-server-01', type: 'database' },
      { id: 'db-02', hostname: 'db-server-02', type: 'database' },
      { id: 'cache-01', hostname: 'redis-01', type: 'cache' },
      { id: 'queue-01', hostname: 'rabbitmq-01', type: 'queue' },
      { id: 'monitor-01', hostname: 'prometheus-01', type: 'monitoring' },
      { id: 'lb-01', hostname: 'nginx-lb-01', type: 'loadbalancer' }
    ];
  }

  /**
   * ServerDataCollector에 서버 등록 (리팩토링된 서비스 사용)
   */
  private async registerServersToCollector(servers: any[]): Promise<void> {
    try {
      const { serverRegistrationService } = await import('../ServerRegistrationService');
      const result = await serverRegistrationService.registerServersToCollector(servers);
      
      if (result.success) {
        console.log(`✅ Successfully registered ${result.registered} servers via service`);
      } else {
        console.error(`❌ Server registration failed: ${result.errors.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Failed to register servers via service:', error);
    }
  }

  /**
   * IP 주소 생성
   */
  private generateIPAddress(serverId: string): string {
    const hash = serverId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const octet3 = Math.abs(hash) % 256;
    const octet4 = Math.abs(hash >> 8) % 256;
    
    return `192.168.${octet3}.${octet4}`;
  }

  /**
   * 초기 메트릭 생성
   */
  private generateInitialMetrics(): any {
    return {
      cpu: 20 + Math.random() * 40,
      memory: 30 + Math.random() * 30,
      disk: 40 + Math.random() * 20,
      network: {
        bytesIn: Math.floor(Math.random() * 1000000) + 100000,
        bytesOut: Math.floor(Math.random() * 800000) + 80000,
        packetsIn: Math.floor(Math.random() * 10000) + 1000,
        packetsOut: Math.floor(Math.random() * 8000) + 800,
        latency: Math.round((Math.random() * 50 + 10) * 100) / 100,
        connections: Math.floor(Math.random() * 200) + 50
      },
      processes: Math.floor(Math.random() * 100) + 100,
      loadAverage: [
        Math.round((Math.random() * 2) * 100) / 100,
        Math.round((Math.random() * 1.5) * 100) / 100,
        Math.round((Math.random() * 1) * 100) / 100
      ] as [number, number, number],
      uptime: Math.floor(Math.random() * 86400),
      temperature: 40 + Math.random() * 20,
      powerUsage: 150 + Math.random() * 100
    };
  }

  /**
   * 히스토리 데이터 배치 저장
   */
  private async saveHistoryDataBatch(dataPoints: GeneratedMetrics[], patternId: string): Promise<void> {
    try {
      // 실제 구현 시 DB 배치 저장
      // await metricsStorage.saveHistoryBatch(dataPoints, patternId);
      
      console.log(`💾 Saved ${dataPoints.length} history data points (pattern: ${patternId})`);
    } catch (error) {
      console.error('Failed to save history data batch:', error);
    }
  }

  /**
   * 실시간 데이터 배치 저장
   */
  private async saveRealtimeDataBatch(dataPoints: GeneratedMetrics[]): Promise<void> {
    try {
      // 실제 구현 시 실시간 테이블에 저장
      // await metricsStorage.saveRealtimeBatch(dataPoints);
      
      // 10분 이전 데이터 자동 삭제
      const cutoffTime = new Date(Date.now() - this.REALTIME_DURATION);
      // await metricsStorage.cleanupRealtimeData(cutoffTime);
      
      console.log(`💾 Saved ${dataPoints.length} realtime data points`);
    } catch (error) {
      console.error('Failed to save realtime data batch:', error);
    }
  }

  /**
   * 데이터 생성 상태 조회
   */
  getGenerationStatus() {
    return {
      isGenerating: this.isGenerating,
      startTime: this.realtimeStartTime,
      remainingTime: this.realtimeStartTime 
        ? Math.max(0, this.REALTIME_DURATION - (Date.now() - this.realtimeStartTime.getTime()))
        : 0,
      currentPattern: this.currentPattern,
      patterns: this.DATA_PATTERNS.map(p => ({
        id: p.id,
        name: p.name,
        description: p.description
      }))
    };
  }

  /**
   * 24시간 데이터 분석 제한 설정
   */
  getAnalysisLimits() {
    return {
      maxHistoryHours: 24,
      realtimeMinutes: 10,
      dataInterval: 5, // 초
      supportedPatterns: this.DATA_PATTERNS.length
    };
  }
}

// 싱글톤 인스턴스
export const serverDataGenerator = new ServerDataGenerator(); 